declare module 'geojson-world-map/lib/world.js' {
  import type { FeatureCollection, Geometry } from 'geojson'

  const worldGeoJson: FeatureCollection<Geometry>

  export default worldGeoJson
}
