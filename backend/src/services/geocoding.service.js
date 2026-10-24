import { CITY_COORDINATES, isValidCoordinate } from '../utils/distance.js';

// In-memory cache to prevent redundant external geocoding requests
const geocodeCache = new Map();

/**
 * Resolves an address into latitude and longitude coordinates.
 * Uses city baselines and OpenStreetMap Nominatim with strict caching and timeouts.
 *
 * @param {Object} address Object containing street, city, state, postalCode
 * @returns {Promise<{ latitude: number, longitude: number } | null>}
 */
export const geocodeAddress = async (address) => {
  if (!address || !address.city) {
    return null;
  }

  const cityNormalized = address.city.trim().toLowerCase();
  const streetNormalized = (address.street || '').trim().toLowerCase();
  const cacheKey = `${streetNormalized}|${cityNormalized}|${(address.state || '').trim().toLowerCase()}`;

  // 1. Check in-memory cache
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  // 2. Fast fallback check from well-known city dictionary
  const knownCityCoords = CITY_COORDINATES[cityNormalized];

  // If only city was provided (or street is very brief), use reliable city baseline immediately
  if (!streetNormalized && knownCityCoords) {
    geocodeCache.set(cacheKey, knownCityCoords);
    return knownCityCoords;
  }

  // 3. Optional OpenStreetMap Nominatim lookup with rate limit awareness and timeout
  try {
    const query = encodeURIComponent(
      `${address.street || ''}, ${address.city || ''}, ${address.state || ''}`.trim()
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Annapurna-Food-Rescue-App/1.0 (contact: hackathon@annapurna.org)',
        Accept: 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        if (isValidCoordinate(lat, lon)) {
          const resolved = { latitude: lat, longitude: lon };
          geocodeCache.set(cacheKey, resolved);
          return resolved;
        }
      }
    }
  } catch (err) {
    // Gracefully handle network timeouts or rate limits without breaking donation creation
    console.warn(`Geocoding lookup notice for "${cityNormalized}":`, err.message);
  }

  // 4. Fallback to city baseline if street-level geocoding failed
  if (knownCityCoords) {
    geocodeCache.set(cacheKey, knownCityCoords);
    return knownCityCoords;
  }

  // 5. If city is not known and geocoding failed, return null (never invent arbitrary coordinates)
  geocodeCache.set(cacheKey, null);
  return null;
};
