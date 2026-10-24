import { useState } from 'react';
import StatusTracker from '../common/StatusTracker';
import LiveTrackingModal from '../map/LiveTrackingModal';
import MissionHistoryModal from '../common/MissionHistoryModal';
import ImpactCertificateModal from '../common/ImpactCertificateModal';
import EmbeddedDeliveryMap from '../map/EmbeddedDeliveryMap';

/**
 * Displays a list or grid of food donations created by the donor with live tracking
 */
const DonationList = ({ donations = [], loading = false }) => {
  const [trackingDonation, setTrackingDonation] = useState(null);
  const [historyDonation, setHistoryDonation] = useState(null);
  const [certificateDonation, setCertificateDonation] = useState(null);
  const [currentTime] = useState(() => Date.now());

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading donations...</span>
        </div>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="card border-0 shadow-sm bg-white p-5 text-center">
        <span className="display-4 mb-2 d-block">🍲</span>
        <h5 className="fw-bold text-dark">No Food Donations Listed Yet</h5>
        <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '420px' }}>
          When you have fresh surplus food, click the "+ Create Food Donation" button above
          to list it for nearby NGOs and volunteers.
        </p>
      </div>
    );
  }

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

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (item) => {
    if (item.status === 'delivered' || item.status === 'cancelled') return false;
    if (!item.safeConsumptionDeadline) return false;
    return new Date(item.safeConsumptionDeadline).getTime() < currentTime;
  };

  return (
    <div className="row g-3">
      {donations.map((item) => {
        const isItemExpired = isExpired(item);

        return (
          <div key={item._id} className="col-12 col-md-6 col-lg-4">
            <div
              className={`card h-100 shadow-sm bg-white ${
                isItemExpired ? 'bg-light bg-opacity-75' : ''
              }`}
              style={{
                borderRadius: '12px',
                border: '1px solid #e7e5e4',
                overflow: 'hidden',
                ...(isItemExpired ? { filter: 'grayscale(35%)', opacity: 0.85 } : {})
              }}
            >
              {item.photoUrl && (
                <img
                  src={item.photoUrl}
                  alt={item.foodName}
                  className="card-img-top"
                  style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover', display: 'block' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <h6 className="card-title fw-bold text-dark mb-0">{item.foodName}</h6>
                  <div className="d-flex gap-1 align-items-center">
                    {isItemExpired && <span className="badge bg-secondary">Expired</span>}
                    {getDietaryBadge(item.dietaryType)}
                  </div>
                </div>

                <div className="d-flex gap-2 align-items-center mb-2">
                  <span className="badge bg-light text-dark border">
                    🍽️ {item.quantityMeals} meals
                  </span>
                  <span className="badge bg-light text-secondary border">
                    📍 {item.pickupAddress?.city}
                  </span>
                </div>

                {/* Status Progression Stepper */}
                <div className="mb-2">
                  <StatusTracker currentStatus={item.status} />
                </div>

                {/* Food Expired Notice (Dull state if past safe shelf life) */}
                {isItemExpired && (
                  <div className="alert alert-secondary py-1 px-2 my-2 text-center small fw-semibold text-danger border-secondary">
                    ⚠️ Food Expired: Safe consumption shelf life ended on {formatTime(item.safeConsumptionDeadline)}. Handover is closed.
                  </div>
                )}

                {/* Waiting State Notice when Available / Unclaimed */}
                {item.status === 'available' && !isItemExpired && (
                  <div className="bg-light p-3 rounded text-center my-2 border border-warning border-opacity-50 shadow-sm">
                    <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                      <span className="spinner-grow spinner-grow-sm text-warning" role="status" style={{ width: '9px', height: '9px' }} />
                      <span className="fw-bold text-dark small">Waiting for NGO / Volunteer to accept...</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Broadcasted to nearby verified rescue partners in {item.pickupAddress?.city || 'your area'}.
                    </div>
                  </div>
                )}

                {/* Compact Rapido-style Handover Delivery OTP Box (visible when picked up and not expired) */}
                {item.status === 'picked_up' && item.deliveryConfirmationCode && !isItemExpired && (
                  <div className="bg-light p-2 my-2 rounded border border-warning shadow-sm text-center">
                    <div className="d-flex align-items-center justify-content-between mb-1 px-1">
                      <span className="small fw-bold text-dark" style={{ fontSize: '0.76rem' }}>
                        🔑 Handover OTP:
                      </span>
                      <span className="badge bg-warning text-dark py-1 px-2" style={{ fontSize: '0.65rem' }}>
                        Share with Collector
                      </span>
                    </div>
                    <div className="d-flex justify-content-center gap-1 my-1">
                      {String(item.deliveryConfirmationCode).split('').map((digit, idx) => (
                        <span
                          key={idx}
                          className="d-inline-flex align-items-center justify-content-center bg-white border border-primary border-2 text-primary fw-bold rounded shadow-sm"
                          style={{
                            width: '28px',
                            height: '32px',
                            fontSize: '1.05rem',
                            letterSpacing: 'normal'
                          }}
                        >
                          {digit}
                        </span>
                      ))}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                      Give this 6-digit code to the collector upon food handover
                    </div>
                  </div>
                )}

                {/* Collector Details & Embedded Live Map when Claimed */}
                {item.claimedBy && (
                  (() => {
                    const collectorRole = item.claimedBy.role === 'ngo' ? 'NGO' : 'Volunteer';
                    const collectorName = item.claimedBy.name || `Assigned ${collectorRole}`;
                    const collectorPhone = (item.claimedBy.phone && item.claimedBy.phone.trim())
                      ? item.claimedBy.phone.trim()
                      : '+91 98200 55667';

                    return (
                      <div className="bg-light p-2 rounded small mb-2 text-muted border">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="text-truncate me-2">
                            <strong className="text-dark">Collector:</strong> {collectorName}{' '}
                            <span className="badge bg-secondary text-uppercase" style={{ fontSize: '0.65rem' }}>
                              {item.claimedBy.role}
                            </span>
                          </div>
                          <a
                            href={`tel:${collectorPhone}`}
                            className="btn btn-sm btn-success py-0 px-2 fw-semibold d-inline-flex align-items-center gap-1 text-decoration-none shadow-sm text-white flex-shrink-0"
                            style={{ fontSize: '0.75rem' }}
                            title={`Call ${collectorName}`}
                          >
                            <span>📞</span> Call
                          </a>
                        </div>

                        {/* Embedded Live Delivery Map (Auto-tracking like modern delivery apps) */}
                        {!isItemExpired && ['accepted', 'picked_up'].includes(item.status) && (
                          <EmbeddedDeliveryMap
                            donation={item}
                            onExpand={() => setTrackingDonation(item)}
                          />
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Delivered confirmation remarks & History Details */}
                {item.status === 'delivered' && (
                  <div className="alert alert-success p-2 mb-2 small">
                    <div className="fw-semibold text-center mb-1">
                      🎉 Safely Delivered on {formatTime(item.deliveredAt)}!
                    </div>
                    {item.deliveryNotes && (
                      <div className="text-muted text-center mb-2 fst-italic">"{item.deliveryNotes}"</div>
                    )}
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-1"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => setHistoryDonation(item)}
                      >
                        <span>📜</span> History
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-success flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-1 text-white shadow-sm"
                        style={{ fontSize: '0.78rem' }}
                        onClick={() => setCertificateDonation(item)}
                        title="View & Download 80G Impact Certificate"
                      >
                        <span>📄</span> Certificate
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-2 border-top">
                  <div className={`small fw-semibold ${isItemExpired ? 'text-secondary' : 'text-danger'}`}>
                    ⏰ Pickup by: {formatTime(item.pickupDeadline)}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                    Safe consumption: {formatTime(item.safeConsumptionDeadline)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Live Location Tracking Modal */}
      {trackingDonation && (
        <LiveTrackingModal
          donation={trackingDonation}
          onClose={() => setTrackingDonation(null)}
        />
      )}

      {/* Mission History Details Modal */}
      {historyDonation && (
        <MissionHistoryModal
          donation={historyDonation}
          onClose={() => setHistoryDonation(null)}
        />
      )}

      {/* Impact Certificate & Tax Receipt Modal */}
      {certificateDonation && (
        <ImpactCertificateModal
          donation={certificateDonation}
          onClose={() => setCertificateDonation(null)}
        />
      )}
    </div>
  );
};

export default DonationList;
