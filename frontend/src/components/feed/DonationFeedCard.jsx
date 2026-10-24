import { useState } from 'react';

/**
 * Reusable card representing an available food donation listing in the feed
 */
const DonationFeedCard = ({
  donation,
  onClaim,
  isClaiming = false,
  canClaim = true,
  claimDisabledReason = ''
}) => {
  const [currentTime] = useState(() => Date.now());

  const getDietaryBadge = (type) => {
    switch (type) {
      case 'non-veg':
        return <span className="badge bg-danger">Non-Veg</span>;
      case 'vegan':
        return <span className="badge bg-info text-dark">Vegan</span>;
      default:
        return <span className="badge bg-success">Vegetarian</span>;
    }
  };

  const donorName = donation.donor?.organization || donation.donor?.name || 'Local Donor';

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = Boolean(
    donation.safeConsumptionDeadline &&
    new Date(donation.safeConsumptionDeadline).getTime() < currentTime
  );

  return (
    <div
      className={`card h-100 shadow-sm bg-white ${
        isExpired ? 'bg-light bg-opacity-75' : ''
      }`}
      style={{
        borderRadius: '12px',
        border: '1px solid #e7e5e4',
        overflow: 'hidden',
        ...(isExpired ? { filter: 'grayscale(35%)', opacity: 0.85 } : {})
      }}
    >
      {donation.photoUrl && (
        <img
          src={donation.photoUrl}
          alt={donation.foodName}
          className="card-img-top"
          style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <h5 className="card-title fw-bold text-dark mb-0">{donation.foodName}</h5>
          <div className="d-flex gap-1 align-items-center">
            {isExpired && <span className="badge bg-secondary">Expired</span>}
            {getDietaryBadge(donation.dietaryType)}
          </div>
        </div>

        <div className="mb-2">
          <span className="badge bg-light text-dark border me-2">
            🍽️ {donation.quantityMeals} meals
          </span>
          {donation.quantity && donation.quantity !== `${donation.quantityMeals} meals` && (
            <small className="text-muted">({donation.quantity})</small>
          )}
        </div>

        <p className="card-text text-muted small mb-1">
          <strong>Donor:</strong> {donorName}
        </p>
        <p className="card-text text-muted small mb-2">
          📍 {donation.pickupAddress?.street}, {donation.pickupAddress?.city}
        </p>

        {donation.distanceKm !== null && donation.distanceKm !== undefined ? (
          <div className="text-primary small fw-semibold mb-2">
            📏 ~{donation.distanceKm} km away (straight-line)
          </div>
        ) : donation.location?.latitude === null || donation.location?.latitude === undefined ? (
          <div className="text-muted small mb-2" style={{ fontSize: '0.78rem' }}>
            📍 Map location unavailable
          </div>
        ) : null}

        <div className="bg-light p-2 rounded small mb-3">
          <div className="text-danger fw-semibold">
            ⏰ Pickup by: {formatTime(donation.pickupDeadline)}
          </div>
          <div className="text-muted" style={{ fontSize: '0.8rem' }}>
            Safe consumption until: {formatTime(donation.safeConsumptionDeadline)}
          </div>
        </div>

        <div className="mt-auto pt-2">
          {isExpired ? (
            <button
              type="button"
              className="btn btn-secondary w-100 fw-semibold"
              disabled
            >
              ❌ Expired (Shelf Life Ended)
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-success w-100 fw-semibold"
                disabled={!canClaim || isClaiming}
                onClick={() => onClaim(donation)}
                title={!canClaim ? claimDisabledReason : 'Claim this food donation'}
              >
                {isClaiming ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" />
                    Claiming...
                  </>
                ) : (
                  'Claim Food'
                )}
              </button>
              {!canClaim && claimDisabledReason && (
                <div className="text-danger text-center small mt-1" style={{ fontSize: '0.75rem' }}>
                  ⚠️ {claimDisabledReason}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DonationFeedCard;
