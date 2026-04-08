import { startTransition, useDeferredValue, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import {
  DEFAULT_DEFENSIVE_TARGET,
  LAUNCH_NATIONS,
  MAJOR_CAPITALS,
  type CapitalCity,
  type Coordinate,
  type LaunchNation,
} from './data'
import { buildGreatCircleArc, haversineDistanceKm, roundKm } from './geo'
import worldGeoJson from 'geojson-world-map/lib/world.js'
import type { Feature, FeatureCollection, GeoJsonObject, Geometry } from 'geojson'

type ActiveView = 'city' | 'offensive' | 'defensive'

type SearchResult = {
  id: string
  name: string
  country: string
  label: string
  coords: Coordinate
}

type ReachResult = {
  nation: LaunchNation
  distanceKm: number
  spareRangeKm: number
}

const numberFormatter = new Intl.NumberFormat('en-US')
const defaultCenter: [number, number] = [22, 14]
const alphabetizedCapitals = [...MAJOR_CAPITALS].sort((left, right) =>
  left.country.localeCompare(right.country) || left.capital.localeCompare(right.capital),
)
const countryShapes = worldGeoJson as FeatureCollection<Geometry>
const jammuAndKashmirOverlay: [number, number][] = [
  [34.9, 73.6],
  [35.6, 74.9],
  [35.9, 76.0],
  [35.8, 77.4],
  [34.8, 78.5],
  [33.7, 78.1],
  [33.0, 77.0],
  [33.2, 75.7],
  [34.1, 74.4],
  [34.9, 73.6],
]

const normalizeCountryName = (country: string) =>
  country
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/,/g, '')
    .replace(/'/g, '')
    .replace(/&/g, 'and')
    .replace(/\s+/g, ' ')
    .trim()

const countryNameAliases = new Map<string, string>([
  ['usa', 'united states'],
  ['united states of america', 'united states'],
  ['uk', 'united kingdom'],
  ['great britain', 'united kingdom'],
  ['north korea', 'korea'],
  ['south korea', 'korea'],
  ['south sudan', 's sudan'],
  ['bosnia and herzegovina', 'bosnia and herzeg'],
  ['czechia', 'czech rep'],
  ['dr congo', 'dem rep congo'],
  ['democratic republic of the congo', 'dem rep congo'],
  ['republic of the congo', 'congo'],
  ['central african republic', 'central african rep'],
  ['dominican republic', 'dominican rep'],
  ['equatorial guinea', 'eq guinea'],
  ['eswatini', 'swaziland'],
  ['ivory coast', 'cote divoire'],
  ['north macedonia', 'macedonia'],
  ['laos', 'lao pdr'],
  ['east timor', 'timor-leste'],
  ['antigua and barbuda', 'antigua and barb'],
  ['western sahara', 'w sahara'],
  ['jammu and kashmir', 'india'],
  ['jammu & kashmir', 'india'],
])

const normalizeCountryLookup = (country: string) =>
  countryNameAliases.get(normalizeCountryName(country)) ?? normalizeCountryName(country)

const buildSearchUrl = (term: string, limit: number) => {
  const params = new URLSearchParams({
    q: term,
    format: 'jsonv2',
    addressdetails: '1',
    limit: String(limit),
  })

  return `https://nominatim.openstreetmap.org/search?${params.toString()}`
}

const queryCities = async (term: string, limit: number, signal?: AbortSignal) => {
  const response = await fetch(buildSearchUrl(term, limit), {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) {
    throw new Error(`Nominatim returned ${response.status}`)
  }

  const payload = (await response.json()) as Array<{
    place_id: number
    lat: string
    lon: string
    display_name: string
    name?: string
    address?: {
      city?: string
      town?: string
      village?: string
      municipality?: string
      state?: string
      country?: string
    }
  }>

  return payload.map((entry) => {
    const name =
      entry.name ??
      entry.address?.city ??
      entry.address?.town ??
      entry.address?.village ??
      entry.address?.municipality ??
      entry.address?.state ??
      'Unnamed location'

    return {
      id: String(entry.place_id),
      name,
      country: entry.address?.country ?? 'Unknown country',
      label: entry.display_name,
      coords: {
        lat: Number(entry.lat),
        lon: Number(entry.lon),
      },
    } satisfies SearchResult
  })
}

const getReachableNations = (target: Coordinate, excludedCountry?: string) =>
  LAUNCH_NATIONS.map((nation) => {
    const distanceKm = haversineDistanceKm(nation.coords, target)
    const spareRangeKm = nation.rangeKm - distanceKm

    return {
      nation,
      distanceKm,
      spareRangeKm,
    }
  })
    .filter(
      (item) =>
        item.spareRangeKm >= 0 &&
        (!excludedCountry ||
          normalizeCountryLookup(item.nation.country) !== normalizeCountryLookup(excludedCountry)),
    )
    .sort((left, right) => right.spareRangeKm - left.spareRangeKm)

const getOffensiveReachList = (selectedNation: LaunchNation) =>
  MAJOR_CAPITALS.map((capital) => {
    const distanceKm = haversineDistanceKm(selectedNation.coords, capital.coords)
    const spareRangeKm = selectedNation.rangeKm - distanceKm

    return {
      capital,
      distanceKm,
      spareRangeKm,
    }
  })
    .filter((item) => item.spareRangeKm >= 0)
    .sort((left, right) => left.distanceKm - right.distanceKm)

const kmLabel = (value: number) => `${numberFormatter.format(roundKm(value))} km`

const ViewportController = ({
  view,
  city,
  reachable,
  offensiveNation,
  offensiveCapitals,
  defensiveTarget,
  defensiveThreats,
}: {
  view: ActiveView
  city: SearchResult | null
  reachable: ReachResult[]
  offensiveNation: LaunchNation
  offensiveCapitals: Array<{ capital: CapitalCity }>
  defensiveTarget: CapitalCity
  defensiveThreats: ReachResult[]
}) => {
  const map = useMap()

  useEffect(() => {
    if (view === 'city' && city) {
      const bounds = L.latLngBounds(
        [city.coords.lat, city.coords.lon],
        [city.coords.lat, city.coords.lon],
      )

      reachable.forEach((item) => {
        bounds.extend([item.nation.coords.lat, item.nation.coords.lon])
      })

      map.fitBounds(bounds.pad(0.25))
      return
    }

    if (view === 'offensive') {
      const bounds = L.latLngBounds(
        [offensiveNation.coords.lat, offensiveNation.coords.lon],
        [offensiveNation.coords.lat, offensiveNation.coords.lon],
      )

      offensiveCapitals.forEach((item) => {
        bounds.extend([item.capital.coords.lat, item.capital.coords.lon])
      })

      map.fitBounds(bounds.pad(0.08))
      return
    }

    const bounds = L.latLngBounds(
      [defensiveTarget.coords.lat, defensiveTarget.coords.lon],
      [defensiveTarget.coords.lat, defensiveTarget.coords.lon],
    )

    defensiveThreats.forEach((item) => {
      bounds.extend([item.nation.coords.lat, item.nation.coords.lon])
    })

    map.fitBounds(bounds.pad(0.25))
  }, [city, defensiveTarget, defensiveThreats, map, offensiveCapitals, offensiveNation, reachable, view])

  return null
}

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('city')
  const [cityQuery, setCityQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [searchError, setSearchError] = useState('')
  const [selectedCity, setSelectedCity] = useState<SearchResult | null>(null)
  const [selectedNationId, setSelectedNationId] = useState('russia')
  const [defensiveTargetId, setDefensiveTargetId] = useState(DEFAULT_DEFENSIVE_TARGET)

  const deferredQuery = useDeferredValue(cityQuery.trim())

  useEffect(() => {
    if (deferredQuery.length < 2) {
      setSearchResults([])
      setSearchStatus('idle')
      setSearchError('')
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setSearchStatus('loading')
      setSearchError('')

      try {
        const results = await queryCities(deferredQuery, 6, controller.signal)
        startTransition(() => {
          setSearchResults(results)
        })
        setSearchStatus('idle')
      } catch {
        if (controller.signal.aborted) {
          return
        }

        setSearchStatus('error')
        setSearchError('City lookup is temporarily unavailable. Try another search in a moment.')
      }
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
      controller.abort()
    }
  }, [deferredQuery])

  const selectedNation =
    LAUNCH_NATIONS.find((nation) => nation.id === selectedNationId) ?? LAUNCH_NATIONS[0]
  const defensiveTarget =
    MAJOR_CAPITALS.find((capital) => capital.id === defensiveTargetId) ??
    MAJOR_CAPITALS.find((capital) => capital.id === DEFAULT_DEFENSIVE_TARGET) ??
    MAJOR_CAPITALS[0]

  const cityReachability = selectedCity ? getReachableNations(selectedCity.coords) : []
  const offensiveReachability = getOffensiveReachList(selectedNation)
  const defensiveReachability = getReachableNations(defensiveTarget.coords, defensiveTarget.country)
  const cityMapLabel = selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : 'No city selected'
  const offensiveCountriesInRange = new Set(
    offensiveReachability.map((item) => normalizeCountryLookup(item.capital.country)),
  )

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!cityQuery.trim()) {
      return
    }

    setSearchStatus('loading')
    setSearchError('')

    try {
      const [result] = await queryCities(cityQuery.trim(), 1)

      if (!result) {
        setSearchStatus('idle')
        setSearchError('No matching city was found. Try a broader city name.')
        return
      }

      setSelectedCity(result)
      setCityQuery(`${result.name}, ${result.country}`)
      setSearchResults([])
      setSearchStatus('idle')
      setActiveView('city')
    } catch {
      setSearchStatus('error')
      setSearchError('Search failed. Please try again.')
    }
  }

  const selectCity = (result: SearchResult) => {
    setSelectedCity(result)
    setCityQuery(`${result.name}, ${result.country}`)
    setSearchResults([])
    setSearchStatus('idle')
    setSearchError('')
    setActiveView('city')
  }

  return (
    <div className="shell">
      <header className="hero-panel">
        <div>
          <p className="eyebrow">Global strike reach model</p>
          <h1>Global Strike Reach &amp; City Vulnerability Tool</h1>
          <p className="hero-copy">
            Explore nominal missile reach from nine capital-based launch points, measure
            great-circle distance to real cities, and calculate spare range instead of
            relying on abstract circles alone.
          </p>
        </div>
        <div className="formula-card">
          <span className="formula-label">Core formula</span>
          <strong>Spare Range = Max Range - Geodesic Distance</strong>
          <p>
            Distances use the Haversine formula, and all map arcs are rendered as
            great-circle paths.
          </p>
        </div>
      </header>

      <main className="dashboard">
        <section className="control-column">
          <div className="panel tab-panel">
            <div className="tabs" role="tablist" aria-label="Analysis views">
              <button type="button" className={activeView === 'city' ? 'is-active' : ''} onClick={() => setActiveView('city')}>
                City Picker
              </button>
              <button type="button" className={activeView === 'offensive' ? 'is-active' : ''} onClick={() => setActiveView('offensive')}>
                Offensive View
              </button>
              <button type="button" className={activeView === 'defensive' ? 'is-active' : ''} onClick={() => setActiveView('defensive')}>
                Defensive View
              </button>
            </div>

            {activeView === 'city' && (
              <div className="mode-panel">
                <div className="section-heading">
                  <h2>Interactive City Picker</h2>
                  <p>Search any city with Nominatim, then reveal which launch points can reach it.</p>
                </div>

                <form className="search-form" onSubmit={handleSearchSubmit}>
                  <label htmlFor="city-search">City search</label>
                  <div className="search-row">
                    <input
                      id="city-search"
                      type="search"
                      placeholder="Try Tokyo, Nairobi, Sao Paulo..."
                      value={cityQuery}
                      onChange={(event) => setCityQuery(event.target.value)}
                    />
                    <button type="submit">Analyze</button>
                  </div>
                  <p className="helper-text">Powered by OpenStreetMap Nominatim search.</p>
                </form>

                {searchStatus === 'loading' && <p className="status-line">Searching cities...</p>}
                {searchError && <p className="status-line error">{searchError}</p>}

                {searchResults.length > 0 && (
                  <div className="suggestions">
                    {searchResults.map((result) => (
                      <button key={result.id} type="button" className="suggestion" onClick={() => selectCity(result)}>
                        <strong>{result.name}</strong>
                        <span>{result.country}</span>
                        <small>{result.label}</small>
                      </button>
                    ))}
                  </div>
                )}

                <div className="summary-grid compact">
                  <article className="stat-card">
                    <span>Selected city</span>
                    <strong>{cityMapLabel}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Reachable powers</span>
                    <strong>{cityReachability.length}/9</strong>
                  </article>
                  <article className="stat-card">
                    <span>Largest spare range</span>
                    <strong>{selectedCity && cityReachability[0] ? kmLabel(cityReachability[0].spareRangeKm) : 'N/A'}</strong>
                  </article>
                </div>

                <div className="list-panel">
                  <div className="list-header">
                    <h3>Countries that can reach the city</h3>
                    <span>{selectedCity ? `${cityReachability.length} matches` : 'Pick a city'}</span>
                  </div>

                  {selectedCity ? (
                    cityReachability.length > 0 ? (
                      <div className="list">
                        {cityReachability.map((item) => (
                          <article key={item.nation.id} className="list-item">
                            <div>
                              <strong>{item.nation.country}</strong>
                              <p>{item.nation.missile}</p>
                            </div>
                            <div className="metric-block">
                              <strong>{kmLabel(item.spareRangeKm)}</strong>
                              <span>remaining</span>
                              <small>{kmLabel(item.distanceKm)} traveled</small>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">This city is out of range for all nine nominal launch points.</p>
                    )
                  ) : (
                    <p className="empty-state">Choose a city to calculate threat lines and spare range.</p>
                  )}
                </div>
              </div>
            )}

            {activeView === 'offensive' && (
              <div className="mode-panel">
                <div className="section-heading">
                  <h2>Who can I hit?</h2>
                  <p>Select one nuclear power to draw its maximum reach and list major capitals inside it.</p>
                </div>

                <label className="field-label" htmlFor="offensive-country">Launch nation</label>
                <select id="offensive-country" value={selectedNationId} onChange={(event) => setSelectedNationId(event.target.value)}>
                  {LAUNCH_NATIONS.map((nation) => (
                    <option key={nation.id} value={nation.id}>
                      {nation.country} ({nation.capital})
                    </option>
                  ))}
                </select>

                <div className="summary-grid compact">
                  <article className="stat-card">
                    <span>Missile system</span>
                    <strong>{selectedNation.missile}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Maximum range</span>
                    <strong>{kmLabel(selectedNation.rangeKm)}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Capitals in radius</span>
                    <strong>{offensiveReachability.length}</strong>
                  </article>
                </div>

                <div className="list-panel">
                  <div className="list-header">
                    <h3>Major capitals within reach</h3>
                    <span>Sorted by distance</span>
                  </div>
                  <div className="list">
                    {offensiveReachability.map((item) => (
                      <article key={item.capital.id} className="list-item">
                        <div>
                          <strong>{item.capital.capital}</strong>
                          <p>{item.capital.country}</p>
                        </div>
                        <div className="metric-block">
                          <strong>{kmLabel(item.distanceKm)}</strong>
                          <span>distance</span>
                          <small>{kmLabel(item.spareRangeKm)} spare</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'defensive' && (
              <div className="mode-panel">
                <div className="section-heading">
                  <h2>Who can hit me?</h2>
                  <p>Pick a country and test which nuclear powers can cover its capital city.</p>
                </div>

                <label className="field-label" htmlFor="defensive-country">Target country</label>
                <select id="defensive-country" value={defensiveTargetId} onChange={(event) => setDefensiveTargetId(event.target.value)}>
                  {alphabetizedCapitals.map((capital) => (
                    <option key={capital.id} value={capital.id}>
                      {capital.country} ({capital.capital})
                    </option>
                  ))}
                </select>

                <div className="summary-grid compact">
                  <article className="stat-card">
                    <span>Target capital</span>
                    <strong>{defensiveTarget.capital}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Incoming threats</span>
                    <strong>{defensiveReachability.length}</strong>
                  </article>
                  <article className="stat-card">
                    <span>Closest threat</span>
                    <strong>{defensiveReachability[0] ? kmLabel(defensiveReachability[0].distanceKm) : 'Out of range'}</strong>
                  </article>
                </div>

                <div className="list-panel">
                  <div className="list-header">
                    <h3>Threat-capable nations</h3>
                    <span>{defensiveTarget.capital}, {defensiveTarget.country}</span>
                  </div>

                  {defensiveReachability.length > 0 ? (
                    <div className="list">
                      {defensiveReachability.map((item) => (
                        <article key={item.nation.id} className="list-item">
                          <div>
                            <strong>{item.nation.country}</strong>
                            <p>{item.nation.capital}</p>
                          </div>
                          <div className="metric-block">
                            <strong>{kmLabel(item.spareRangeKm)}</strong>
                            <span>remaining</span>
                            <small>{kmLabel(item.distanceKm)} traveled</small>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">No listed launch point can reach this capital with the current reference ranges.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="panel legend-panel">
            <div className="section-heading">
              <h2>Launch registry</h2>
              <p>Each country uses its capital as a nominal launch origin for this model.</p>
            </div>

            <div className="nation-grid">
              {LAUNCH_NATIONS.map((nation) => (
                <article key={nation.id} className="nation-chip">
                  <span className="swatch" style={{ backgroundColor: nation.color }} />
                  <div>
                    <strong>{nation.country}</strong>
                    <p>{nation.missile} • {kmLabel(nation.rangeKm)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="map-column">
          <div className="summary-grid">
            <article className="stat-card">
              <span>Live map mode</span>
              <strong>{activeView === 'city' ? 'City vulnerability' : activeView === 'offensive' ? 'Offensive radius' : 'Defensive screening'}</strong>
            </article>
            <article className="stat-card">
              <span>Map logic</span>
              <strong>Great-circle arcs</strong>
            </article>
            <article className="stat-card">
              <span>Distance method</span>
              <strong>Haversine</strong>
            </article>
          </div>

          <div className="panel map-panel">
            <div className="map-header">
              <div>
                <h2>Interactive Threat Map</h2>
                <p>Threat lines appear for reachable launch points, and range envelopes update with each mode.</p>
              </div>
              <div className="map-note">Nominal capital launch points • Educational visualization only</div>
            </div>

            <MapContainer center={defaultCenter} zoom={2} minZoom={2} worldCopyJump className="map">
              <TileLayer
                attribution="&copy; OpenStreetMap contributors &copy; CARTO"
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              />

              {activeView === 'offensive' && (
                <GeoJSON
                  key={`country-fill-${selectedNation.id}`}
                  data={countryShapes as GeoJsonObject}
                  interactive={false}
                  style={(feature: Feature | undefined) => {
                    const featureCountry = feature?.properties?.name
                    const isHighlighted =
                      typeof featureCountry === 'string' &&
                      offensiveCountriesInRange.has(normalizeCountryLookup(featureCountry))

                    return {
                      color: isHighlighted ? selectedNation.color : '#cbd5e1',
                      weight: isHighlighted ? 1.2 : 0.45,
                      opacity: isHighlighted ? 0.7 : 0.28,
                      fillColor: isHighlighted ? selectedNation.color : '#ffffff',
                      fillOpacity: isHighlighted ? 0.16 : 0.02,
                    }
                  }}
                />
              )}


              <ViewportController
                view={activeView}
                city={selectedCity}
                reachable={cityReachability}
                offensiveNation={selectedNation}
                offensiveCapitals={offensiveReachability}
                defensiveTarget={defensiveTarget}
                defensiveThreats={defensiveReachability}
              />

              {LAUNCH_NATIONS.map((nation) => {
                const isHighlighted =
                  (activeView === 'offensive' && nation.id === selectedNation.id) ||
                  (activeView === 'city' && cityReachability.some((item) => item.nation.id === nation.id)) ||
                  (activeView === 'defensive' && defensiveReachability.some((item) => item.nation.id === nation.id))

                return (
                  <CircleMarker
                    key={nation.id}
                    center={[nation.coords.lat, nation.coords.lon]}
                    radius={isHighlighted ? 9 : 6}
                    pathOptions={{
                      color: nation.color,
                      fillColor: nation.color,
                      fillOpacity: isHighlighted ? 0.85 : 0.55,
                      weight: isHighlighted ? 3 : 1.5,
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -4]}>
                      {nation.country} • {nation.capital}
                    </Tooltip>
                    <Popup>
                      <strong>{nation.country}</strong>
                      <br />
                      {nation.capital}
                      <br />
                      {nation.missile}
                      <br />
                      Max range: {kmLabel(nation.rangeKm)}
                    </Popup>
                  </CircleMarker>
                )
              })}

              {activeView === 'city' &&
                selectedCity &&
                cityReachability.map((item) => (
                  <Polyline
                    key={`city-arc-${item.nation.id}`}
                    positions={buildGreatCircleArc(item.nation.coords, selectedCity.coords).map((point) => [point.lat, point.lon])}
                    pathOptions={{ color: item.nation.color, weight: 2.5, opacity: 0.75, dashArray: '8 10' }}
                  />
                ))}

              {activeView === 'defensive' &&
                defensiveReachability.map((item) => (
                  <Polyline
                    key={`defensive-arc-${item.nation.id}`}
                    positions={buildGreatCircleArc(item.nation.coords, defensiveTarget.coords).map((point) => [point.lat, point.lon])}
                    pathOptions={{ color: item.nation.color, weight: 2.6, opacity: 0.8 }}
                  />
                ))}

              {activeView === 'offensive' &&
                offensiveReachability.map((item) => (
                  <CircleMarker
                    key={`offensive-capital-${item.capital.id}`}
                    center={[item.capital.coords.lat, item.capital.coords.lon]}
                    radius={5}
                    pathOptions={{ color: selectedNation.color, fillColor: '#ffffff', fillOpacity: 0.9, weight: 2 }}
                  >
                    <Tooltip direction="top" offset={[0, -4]}>
                      {item.capital.capital}, {item.capital.country}
                    </Tooltip>
                  </CircleMarker>
                ))}

              {selectedCity && activeView === 'city' && (
                <CircleMarker
                  center={[selectedCity.coords.lat, selectedCity.coords.lon]}
                  radius={10}
                  pathOptions={{ color: '#111827', fillColor: '#f8fafc', fillOpacity: 1, weight: 3 }}
                >
                  <Tooltip direction="top" offset={[0, -4]} permanent>
                    {selectedCity.name}
                  </Tooltip>
                </CircleMarker>
              )}

              {activeView === 'defensive' && (
                <CircleMarker
                  center={[defensiveTarget.coords.lat, defensiveTarget.coords.lon]}
                  radius={10}
                  pathOptions={{ color: '#0f172a', fillColor: '#fde68a', fillOpacity: 0.95, weight: 3 }}
                >
                  <Tooltip direction="top" offset={[0, -4]} permanent>
                    {defensiveTarget.capital}
                  </Tooltip>
                </CircleMarker>
              )}
            </MapContainer>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
