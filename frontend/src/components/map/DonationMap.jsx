import { useEffect, useRef } from 'react';
import L from 'leaflet';

// Standard CDN marker icons to ensure reliable rendering in bundled environments
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Reusable interactive map displaying geocoded food donation listings
 */
const DonationMap = ({
  donations = [],
  onClaim,
  canClaim = true,
  claimDisabledReason = ''
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Filter donations that have valid coordinates
  const mappedDonations = donations.filter(
    (d) =>
      d.location &&
      typeof d.location.latitude === 'number' &&
      typeof d.location.longitude === 'number'
  );

  const unmappedCount = donations.length - mappedDonations.length;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map if not yet created
    if (!mapInstanceRef.current) {
      try {
        const map = L.map(mapContainerRef.current, {
          center: [20.5937, 78.9629], // Geographic center of India
          zoom: 5
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(map);

        const markersLayer = L.layerGroup().addTo(map);
        markersLayerRef.current = markersLayer;
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn('Map initialization notice:', err.message);
      }
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    // Clear previous markers
    markersLayer.clearLayers();

    const bounds = [];

    // Add marker for each valid donation
    mappedDonations.forEach((item) => {
      const lat = item.location.latitude;
      const lon = item.location.longitude;
      bounds.push([lat, lon]);

      const marker = L.marker([lat, lon], { icon: customIcon });

      const dietaryBadge =
        item.dietaryType === 'non-veg'
          ? '<span class="badge bg-danger">Non-Veg</span>'
          : item.dietaryType === 'vegan'
          ? '<span class="badge bg-info text-dark">Vegan</span>'
          : '<span class="badge bg-success">Veg</span>';

      const distanceText =
        item.distanceKm !== null && item.distanceKm !== undefined
          ? `<div class="text-primary small mt-1">📏 ~${item.distanceKm} km (straight-line)</div>`
          : '';

      const deadlineText = new Date(item.pickupDeadline).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric'
      });

      const popupContent = `
        <div style="min-width: 200px; font-family: inherit;">
          <div class="fw-bold fs-6 mb-1">${item.foodName}</div>
          <div class="mb-1">${dietaryBadge} <small class="text-muted">(${item.quantityMeals} meals)</small></div>
          <div class="small text-muted mb-1">📍 ${item.pickupAddress?.street}, ${item.pickupAddress?.city}</div>
          <div class="small text-danger fw-semibold">⏰ Pickup by: ${deadlineText}</div>
          ${distanceText}
          <div class="mt-2 pt-2 border-top">
            <button id="claim-btn-${item._id}" class="btn btn-sm btn-success w-100 fw-semibold" ${
              !canClaim ? 'disabled' : ''
            }>
              Claim Food
            </button>
            ${
              !canClaim && claimDisabledReason
                ? `<div class="text-danger small mt-1" style="font-size:0.7rem;">${claimDisabledReason}</div>`
                : ''
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Wire claim click event when popup opens
      marker.on('popupopen', () => {
        const btn = document.getElementById(`claim-btn-${item._id}`);
        if (btn && canClaim && onClaim) {
          btn.onclick = () => onClaim(item);
        }
      });

      markersLayer.addLayer(marker);
    });

    // Fit map view to encompass all markers if available
    if (bounds.length > 0) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch {
        // ignore bounds fitting errors
      }
    }

    // Leaflet resize trigger
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [mappedDonations, canClaim, claimDisabledReason, onClaim]);

  return (
    <div className="card shadow-sm border-0 mb-4 overflow-hidden">
      <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
        <span className="small fw-semibold text-dark">
          🗺️ Showing {mappedDonations.length} donation marker{mappedDonations.length === 1 ? '' : 's'} on map
        </span>
        {unmappedCount > 0 && (
          <span className="badge bg-secondary-subtle text-secondary small">
            📍 {unmappedCount} listing{unmappedCount === 1 ? '' : 's'} location unmapped (visible in List View)
          </span>
        )}
      </div>
      <div
        ref={mapContainerRef}
        style={{
          height: '480px',
          width: '100%',
          zIndex: 1,
          backgroundColor: '#e9ecef'
        }}
      />
    </div>
  );
};

export default DonationMap;
