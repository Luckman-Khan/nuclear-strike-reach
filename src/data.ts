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

export const MAJOR_CAPITALS: CapitalCity[] = [
  { id: 'abuja', country: 'Nigeria', capital: 'Abuja', region: 'Africa', coords: { lat: 9.0765, lon: 7.3986 } },
  { id: 'abu-dhabi', country: 'United Arab Emirates', capital: 'Abu Dhabi', region: 'Middle East', coords: { lat: 24.4539, lon: 54.3773 } },
  { id: 'addis-ababa', country: 'Ethiopia', capital: 'Addis Ababa', region: 'Africa', coords: { lat: 8.9806, lon: 38.7578 } },
  { id: 'ankara', country: 'Turkey', capital: 'Ankara', region: 'Europe / Middle East', coords: { lat: 39.9334, lon: 32.8597 } },
  { id: 'athens', country: 'Greece', capital: 'Athens', region: 'Europe', coords: { lat: 37.9838, lon: 23.7275 } },
  { id: 'baghdad', country: 'Iraq', capital: 'Baghdad', region: 'Middle East', coords: { lat: 33.3152, lon: 44.3661 } },
  { id: 'bangkok', country: 'Thailand', capital: 'Bangkok', region: 'Asia', coords: { lat: 13.7563, lon: 100.5018 } },
  { id: 'beijing', country: 'China', capital: 'Beijing', region: 'Asia', coords: { lat: 39.9042, lon: 116.4074 } },
  { id: 'berlin', country: 'Germany', capital: 'Berlin', region: 'Europe', coords: { lat: 52.52, lon: 13.405 } },
  { id: 'bogota', country: 'Colombia', capital: 'Bogota', region: 'South America', coords: { lat: 4.711, lon: -74.0721 } },
  { id: 'brasilia', country: 'Brazil', capital: 'Brasilia', region: 'South America', coords: { lat: -15.7939, lon: -47.8828 } },
  { id: 'brussels', country: 'Belgium', capital: 'Brussels', region: 'Europe', coords: { lat: 50.8503, lon: 4.3517 } },
  { id: 'bucharest', country: 'Romania', capital: 'Bucharest', region: 'Europe', coords: { lat: 44.4268, lon: 26.1025 } },
  { id: 'budapest', country: 'Hungary', capital: 'Budapest', region: 'Europe', coords: { lat: 47.4979, lon: 19.0402 } },
  { id: 'canberra', country: 'Australia', capital: 'Canberra', region: 'Oceania', coords: { lat: -35.2809, lon: 149.13 } },
  { id: 'cairo', country: 'Egypt', capital: 'Cairo', region: 'Africa', coords: { lat: 30.0444, lon: 31.2357 } },
  { id: 'copenhagen', country: 'Denmark', capital: 'Copenhagen', region: 'Europe', coords: { lat: 55.6761, lon: 12.5683 } },
  { id: 'dhaka', country: 'Bangladesh', capital: 'Dhaka', region: 'Asia', coords: { lat: 23.8103, lon: 90.4125 } },
  { id: 'doha', country: 'Qatar', capital: 'Doha', region: 'Middle East', coords: { lat: 25.2854, lon: 51.531 } },
  { id: 'dublin', country: 'Ireland', capital: 'Dublin', region: 'Europe', coords: { lat: 53.3498, lon: -6.2603 } },
  { id: 'helsinki', country: 'Finland', capital: 'Helsinki', region: 'Europe', coords: { lat: 60.1699, lon: 24.9384 } },
  { id: 'havana', country: 'Cuba', capital: 'Havana', region: 'Caribbean', coords: { lat: 23.1136, lon: -82.3666 } },
  { id: 'islamabad', country: 'Pakistan', capital: 'Islamabad', region: 'Asia', coords: { lat: 33.6844, lon: 73.0479 } },
  { id: 'jakarta', country: 'Indonesia', capital: 'Jakarta', region: 'Asia', coords: { lat: -6.2088, lon: 106.8456 } },
  { id: 'jerusalem', country: 'Israel', capital: 'Jerusalem', region: 'Middle East', coords: { lat: 31.7683, lon: 35.2137 } },
  { id: 'kathmandu', country: 'Nepal', capital: 'Kathmandu', region: 'Asia', coords: { lat: 27.7172, lon: 85.324 } },
  { id: 'kyiv', country: 'Ukraine', capital: 'Kyiv', region: 'Europe', coords: { lat: 50.4501, lon: 30.5234 } },
  { id: 'lima', country: 'Peru', capital: 'Lima', region: 'South America', coords: { lat: -12.0464, lon: -77.0428 } },
  { id: 'lisbon', country: 'Portugal', capital: 'Lisbon', region: 'Europe', coords: { lat: 38.7223, lon: -9.1393 } },
  { id: 'london', country: 'UK', capital: 'London', region: 'Europe', coords: { lat: 51.5074, lon: -0.1278 } },
  { id: 'madrid', country: 'Spain', capital: 'Madrid', region: 'Europe', coords: { lat: 40.4168, lon: -3.7038 } },
  { id: 'manila', country: 'Philippines', capital: 'Manila', region: 'Asia', coords: { lat: 14.5995, lon: 120.9842 } },
  { id: 'mexico-city', country: 'Mexico', capital: 'Mexico City', region: 'North America', coords: { lat: 19.4326, lon: -99.1332 } },
  { id: 'moscow', country: 'Russia', capital: 'Moscow', region: 'Europe / Asia', coords: { lat: 55.7558, lon: 37.6173 } },
  { id: 'nairobi', country: 'Kenya', capital: 'Nairobi', region: 'Africa', coords: { lat: -1.2921, lon: 36.8219 } },
  { id: 'new-delhi', country: 'India', capital: 'New Delhi', region: 'Asia', coords: { lat: 28.6139, lon: 77.209 } },
  { id: 'oslo', country: 'Norway', capital: 'Oslo', region: 'Europe', coords: { lat: 59.9139, lon: 10.7522 } },
  { id: 'ottawa', country: 'Canada', capital: 'Ottawa', region: 'North America', coords: { lat: 45.4215, lon: -75.6972 } },
  { id: 'panama-city', country: 'Panama', capital: 'Panama City', region: 'Central America', coords: { lat: 8.9824, lon: -79.5199 } },
  { id: 'paris', country: 'France', capital: 'Paris', region: 'Europe', coords: { lat: 48.8566, lon: 2.3522 } },
  { id: 'pretoria', country: 'South Africa', capital: 'Pretoria', region: 'Africa', coords: { lat: -25.7479, lon: 28.2293 } },
  { id: 'pyongyang', country: 'North Korea', capital: 'Pyongyang', region: 'Asia', coords: { lat: 39.0392, lon: 125.7625 } },
  { id: 'rabat', country: 'Morocco', capital: 'Rabat', region: 'Africa', coords: { lat: 34.0209, lon: -6.8416 } },
  { id: 'riyadh', country: 'Saudi Arabia', capital: 'Riyadh', region: 'Middle East', coords: { lat: 24.7136, lon: 46.6753 } },
  { id: 'rome', country: 'Italy', capital: 'Rome', region: 'Europe', coords: { lat: 41.9028, lon: 12.4964 } },
  { id: 'santiago', country: 'Chile', capital: 'Santiago', region: 'South America', coords: { lat: -33.4489, lon: -70.6693 } },
  { id: 'seoul', country: 'South Korea', capital: 'Seoul', region: 'Asia', coords: { lat: 37.5665, lon: 126.978 } },
  { id: 'singapore', country: 'Singapore', capital: 'Singapore', region: 'Asia', coords: { lat: 1.3521, lon: 103.8198 } },
  { id: 'stockholm', country: 'Sweden', capital: 'Stockholm', region: 'Europe', coords: { lat: 59.3293, lon: 18.0686 } },
  { id: 'tokyo', country: 'Japan', capital: 'Tokyo', region: 'Asia', coords: { lat: 35.6762, lon: 139.6503 } },
  { id: 'vienna', country: 'Austria', capital: 'Vienna', region: 'Europe', coords: { lat: 48.2082, lon: 16.3738 } },
  { id: 'warsaw', country: 'Poland', capital: 'Warsaw', region: 'Europe', coords: { lat: 52.2297, lon: 21.0122 } },
  { id: 'washington-dc', country: 'USA', capital: 'Washington, D.C.', region: 'North America', coords: { lat: 38.9072, lon: -77.0369 } },
  { id: 'wellington', country: 'New Zealand', capital: 'Wellington', region: 'Oceania', coords: { lat: -41.2866, lon: 174.7756 } },
]

export const DEFAULT_DEFENSIVE_TARGET = 'tokyo'
