export type Coordinate = {
  lat: number
  lon: number
}

export type LaunchNation = {
  id: string
  country: string
  capital: string
  missile: string
  rangeKm: number
  color: string
  coords: Coordinate
}

export type CapitalCity = {
  id: string
  country: string
  capital: string
  region: string
  coords: Coordinate
}

export { ALL_CAPITALS as MAJOR_CAPITALS } from './capitals'

export const LAUNCH_NATIONS: LaunchNation[] = [
  {
    id: 'russia',
    country: 'Russia',
    capital: 'Moscow',
    missile: 'RS-28 Sarmat',
    rangeKm: 18000,
    color: '#d62828',
    coords: { lat: 55.7558, lon: 37.6173 },
  },
  {
    id: 'north-korea',
    country: 'North Korea',
    capital: 'Pyongyang',
    missile: 'Hwasong-17',
    rangeKm: 15000,
    color: '#d97706',
    coords: { lat: 39.0392, lon: 125.7625 },
  },
  {
    id: 'usa',
    country: 'USA',
    capital: 'Washington, D.C.',
    missile: 'Minuteman III',
    rangeKm: 13000,
    color: '#2563eb',
    coords: { lat: 38.9072, lon: -77.0369 },
  },
  {
    id: 'china',
    country: 'China',
    capital: 'Beijing',
    missile: 'DF-41',
    rangeKm: 12000,
    color: '#f59e0b',
    coords: { lat: 39.9042, lon: 116.4074 },
  },
  {
    id: 'uk',
    country: 'UK',
    capital: 'London',
    missile: 'Trident II',
    rangeKm: 12000,
    color: '#7c3aed',
    coords: { lat: 51.5074, lon: -0.1278 },
  },
  {
    id: 'france',
    country: 'France',
    capital: 'Paris',
    missile: 'M51',
    rangeKm: 8000,
    color: '#0ea5e9',
    coords: { lat: 48.8566, lon: 2.3522 },
  },
  {
    id: 'israel',
    country: 'Israel',
    capital: 'Jerusalem',
    missile: 'Jericho III',
    rangeKm: 6500,
    color: '#14b8a6',
    coords: { lat: 31.7683, lon: 35.2137 },
  },
  {
    id: 'india',
    country: 'India',
    capital: 'New Delhi',
    missile: 'Agni-V',
    rangeKm: 5000,
    color: '#f97316',
    coords: { lat: 28.6139, lon: 77.209 },
  },
  {
    id: 'pakistan',
    country: 'Pakistan',
    capital: 'Islamabad',
    missile: 'Shaheen-III',
    rangeKm: 2750,
    color: '#16a34a',
    coords: { lat: 33.6844, lon: 73.0479 },
  },
]

export const DEFAULT_DEFENSIVE_TARGET = 'japan-tokyo'
