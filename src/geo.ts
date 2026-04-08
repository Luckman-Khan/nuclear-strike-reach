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
