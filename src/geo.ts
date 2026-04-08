import type { Coordinate } from './data'

const EARTH_RADIUS_KM = 6371

const toRadians = (value: number) => (value * Math.PI) / 180
const toDegrees = (value: number) => (value * 180) / Math.PI

const normalizeLongitude = (lon: number) => {
  if (lon > 180) {
    return lon - 360
  }

  if (lon < -180) {
    return lon + 360
  }

  return lon
}

export const haversineDistanceKm = (from: Coordinate, to: Coordinate) => {
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLon = toRadians(to.lon - from.lon)
  const fromLat = toRadians(from.lat)
  const toLat = toRadians(to.lat)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLon / 2) ** 2

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
}

export const destinationPoint = (
  start: Coordinate,
  distanceKm: number,
  bearingDegrees: number,
): Coordinate => {
  const angularDistance = distanceKm / EARTH_RADIUS_KM
  const bearing = toRadians(bearingDegrees)
  const startLat = toRadians(start.lat)
  const startLon = toRadians(start.lon)

  const destLat = Math.asin(
    Math.sin(startLat) * Math.cos(angularDistance) +
      Math.cos(startLat) * Math.sin(angularDistance) * Math.cos(bearing),
  )

  const destLon =
    startLon +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(startLat),
      Math.cos(angularDistance) - Math.sin(startLat) * Math.sin(destLat),
    )

  return {
    lat: toDegrees(destLat),
    lon: normalizeLongitude(toDegrees(destLon)),
  }
}

export const buildRangePolygon = (
  center: Coordinate,
  rangeKm: number,
  segments = 240,
) => {
  const points: Coordinate[] = []

  for (let index = 0; index <= segments; index += 1) {
    const bearing = (index / segments) * 360
    points.push(destinationPoint(center, rangeKm, bearing))
  }

  return points
}

const unwrapLongitudes = (points: Coordinate[]) => {
  if (points.length === 0) {
    return []
  }

  const unwrapped: Coordinate[] = [{ ...points[0] }]

  for (let index = 1; index < points.length; index += 1) {
    const current = { ...points[index] }
    const previous = unwrapped[index - 1]
    let adjustedLon = current.lon

    while (adjustedLon - previous.lon > 180) {
      adjustedLon -= 360
    }

    while (adjustedLon - previous.lon < -180) {
      adjustedLon += 360
    }

    unwrapped.push({
      lat: current.lat,
      lon: adjustedLon,
    })
  }

  return unwrapped
}

const dedupeClosingPoint = (points: Coordinate[]) => {
  if (points.length < 2) {
    return points
  }

  const first = points[0]
  const last = points[points.length - 1]

  if (first.lat === last.lat && first.lon === last.lon) {
    return points.slice(0, -1)
  }

  return points
}

const intersectAtLongitude = (
  start: Coordinate,
  end: Coordinate,
  longitude: number,
): Coordinate => {
  const deltaLon = end.lon - start.lon

  if (deltaLon === 0) {
    return {
      lat: start.lat,
      lon: longitude,
    }
  }

  const ratio = (longitude - start.lon) / deltaLon

  return {
    lat: start.lat + (end.lat - start.lat) * ratio,
    lon: longitude,
  }
}

const clipPolygonAgainstLongitude = (
  points: Coordinate[],
  longitude: number,
  keepGreaterThan: boolean,
) => {
  if (points.length === 0) {
    return []
  }

  const clipped: Coordinate[] = []

  for (let index = 0; index < points.length; index += 1) {
    const start = points[index]
    const end = points[(index + 1) % points.length]
    const startInside = keepGreaterThan ? start.lon >= longitude : start.lon <= longitude
    const endInside = keepGreaterThan ? end.lon >= longitude : end.lon <= longitude

    if (startInside && endInside) {
      clipped.push(end)
      continue
    }

    if (startInside && !endInside) {
      clipped.push(intersectAtLongitude(start, end, longitude))
      continue
    }

    if (!startInside && endInside) {
      clipped.push(intersectAtLongitude(start, end, longitude))
      clipped.push(end)
    }
  }

  return clipped
}

const clipPolygonToLongitudeBand = (
  points: Coordinate[],
  minLongitude: number,
  maxLongitude: number,
) => {
  const withoutClosingPoint = dedupeClosingPoint(points)
  const leftClipped = clipPolygonAgainstLongitude(withoutClosingPoint, minLongitude, true)
  const fullyClipped = clipPolygonAgainstLongitude(leftClipped, maxLongitude, false)

  if (fullyClipped.length < 3) {
    return []
  }

  return [...fullyClipped, fullyClipped[0]]
}

export const buildRangePolygons = (
  center: Coordinate,
  rangeKm: number,
  segments = 240,
) => {
  const ring = buildRangePolygon(center, rangeKm, segments)
  const unwrapped = unwrapLongitudes(ring)

  if (unwrapped.length === 0) {
    return []
  }

  const longitudes = unwrapped.map((point) => point.lon)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const startWindow = Math.floor((minLongitude + 180) / 360)
  const endWindow = Math.floor((maxLongitude + 180) / 360)
  const polygons: Coordinate[][] = []

  for (let windowIndex = startWindow; windowIndex <= endWindow; windowIndex += 1) {
    const windowMin = -180 + windowIndex * 360
    const windowMax = 180 + windowIndex * 360
    const clipped = clipPolygonToLongitudeBand(unwrapped, windowMin, windowMax)

    if (clipped.length < 4) {
      continue
    }

    polygons.push(
      clipped.map((point) => ({
        lat: point.lat,
        lon: normalizeLongitude(point.lon),
      })),
    )
  }

  return polygons
}

export const buildGreatCircleArc = (
  from: Coordinate,
  to: Coordinate,
  steps = 96,
) => {
  const distance = haversineDistanceKm(from, to) / EARTH_RADIUS_KM

  if (distance === 0) {
    return [from]
  }

  const startLat = toRadians(from.lat)
  const startLon = toRadians(from.lon)
  const endLat = toRadians(to.lat)
  const endLon = toRadians(to.lon)
  const sinDistance = Math.sin(distance)
  const points: Coordinate[] = []

  for (let step = 0; step <= steps; step += 1) {
    const fraction = step / steps
    const startWeight = Math.sin((1 - fraction) * distance) / sinDistance
    const endWeight = Math.sin(fraction * distance) / sinDistance

    const x =
      startWeight * Math.cos(startLat) * Math.cos(startLon) +
      endWeight * Math.cos(endLat) * Math.cos(endLon)
    const y =
      startWeight * Math.cos(startLat) * Math.sin(startLon) +
      endWeight * Math.cos(endLat) * Math.sin(endLon)
    const z = startWeight * Math.sin(startLat) + endWeight * Math.sin(endLat)

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y))
    const lon = Math.atan2(y, x)

    points.push({
      lat: toDegrees(lat),
      lon: normalizeLongitude(toDegrees(lon)),
    })
  }

  return points
}

export const roundKm = (distanceKm: number) => Math.round(distanceKm)
