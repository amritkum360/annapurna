import { useState } from 'react';
import AlertMessage from '../common/AlertMessage';

const PRESET_CITIES = [
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 }
];

/**
 * Reusable filter toolbar for the donation discovery feed with view toggle and distance controls
 */
const FeedFilters = ({
  filters,
  viewMode = 'list',
  onViewModeChange,
  onFilterChange,
  onReset
}) => {
  const [geoStatus, setGeoStatus] = useState('');

  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not supported by your browser.');
      return;
    }

    setGeoStatus('Locating your position...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onFilterChange('lat', position.coords.latitude);
        onFilterChange('lon', position.coords.longitude);
        onFilterChange('sortBy', 'distance');
        setGeoStatus('📍 Current GPS location applied (straight-line distance sorting active)');
      },
      (err) => {
        setGeoStatus('Location permission denied. Please select a city manually below.');
        console.warn('Geolocation denied:', err.message);
      },
      { timeout: 8000 }
    );
  };

  const handleCityPresetChange = (e) => {
    const cityName = e.target.value;
    if (!cityName) return;

    const preset = PRESET_CITIES.find((c) => c.name === cityName);
    if (preset) {
      onFilterChange('city', preset.name);
      onFilterChange('lat', preset.lat);
      onFilterChange('lon', preset.lon);
      onFilterChange('sortBy', 'distance');
      setGeoStatus(`📍 Reference location set to ${preset.name}`);
    }
  };

  const hasReferenceLocation = filters.lat !== undefined && filters.lon !== undefined && filters.lat !== '';

  return (
    <div
      className="card shadow-sm p-3 mb-4 bg-white"
      style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
    >
      <AlertMessage
        type="info"
        message={geoStatus}
        onClose={() => setGeoStatus('')}
      />

      {/* Filter Controls: Aligned inline on the same horizontal row */}
      <div className="row g-2 align-items-center">
        <div className="col-auto">
          <div className="btn-group" role="group">
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => onViewModeChange('list')}
            >
              📋 List View
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === 'map' ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={() => onViewModeChange('map')}
            >
              🗺️ Map View
            </button>
          </div>
        </div>

        <div className="col-auto">
          <button
            type="button"
            className="btn btn-sm btn-outline-success fw-semibold"
            onClick={handleRequestLocation}
          >
            📍 Use My Location
          </button>
        </div>

        <div className="col-12 col-sm-6 col-md">
          <input
            type="text"
            className="form-control form-control-sm"
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
            placeholder="🔍 Search city..."
            value={filters.city || ''}
            onChange={(e) => onFilterChange('city', e.target.value)}
          />
        </div>

        <div className="col-6 col-sm-4 col-md-auto">
          <select
            className="form-select form-select-sm"
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
            value={filters.dietaryType || 'all'}
            onChange={(e) => onFilterChange('dietaryType', e.target.value)}
          >
            <option value="all">All Diets</option>
            <option value="veg">Vegetarian</option>
            <option value="non-veg">Non-Veg</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        <div className="col-6 col-sm-4 col-md-auto">
          <select
            className="form-select form-select-sm"
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
            value=""
            onChange={handleCityPresetChange}
          >
            <option value="" disabled>
              Set Reference City...
            </option>
            {PRESET_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                📍 {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-6 col-sm-4 col-md-auto">
          <select
            className="form-select form-select-sm"
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
            value={filters.sortBy || 'urgency'}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
          >
            <option value="urgency">⏰ Sort: Most Urgent</option>
            <option value="distance" disabled={!hasReferenceLocation}>
              📏 Sort: Nearest First {!hasReferenceLocation && '(Set location)'}
            </option>
          </select>
        </div>

        <div className="col-6 col-sm-4 col-md-auto">
          <select
            className="form-select form-select-sm"
            style={{ border: '1px solid #e2e8f0', borderRadius: '8px' }}
            value={filters.maxDistance || ''}
            onChange={(e) => onFilterChange('maxDistance', e.target.value)}
            disabled={!hasReferenceLocation}
          >
            <option value="">Any Distance</option>
            <option value="10">Within 10 km</option>
            <option value="25">Within 25 km</option>
            <option value="50">Within 50 km</option>
            <option value="100">Within 100 km</option>
          </select>
        </div>

        <div className="col-auto ms-md-auto">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setGeoStatus('');
              onReset();
            }}
            title="Reset all filters"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedFilters;
