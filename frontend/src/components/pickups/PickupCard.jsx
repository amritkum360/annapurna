import { useState } from 'react';
import StatusTracker from '../common/StatusTracker';
import PickupLocationPreview from '../map/PickupLocationPreview';
import MissionHistoryModal from '../common/MissionHistoryModal';
import ImpactCertificateModal from '../common/ImpactCertificateModal';

/**
 * Pickup mission card for NGOs and Volunteers with tracking stepper and delivery verification
 */
const PickupCard = ({
  pickup,
  onMarkPickedUp,
  onConfirmDelivery,
  isProcessing = false
}) => {
  const [currentTime] = useState(() => Date.now());
  const [code, setCode] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [notes, setNotes] = useState('');
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const isExpired = Boolean(
    pickup.status !== 'delivered' &&
    pickup.status !== 'cancelled' &&
    pickup.safeConsumptionDeadline &&
    new Date(pickup.safeConsumptionDeadline).getTime() < currentTime
  );

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

  const donorName = pickup.donor?.organization || pickup.donor?.name || 'Donor';
  const donorPhone = pickup.donor?.phone || 'Contact not provided';

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setCode(newDigits.join(''));

    if (cleanVal && index < 5) {
      const nextInput = document.getElementById(`otp-${pickup._id}-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${pickup._id}-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasteData[i] || '';
    }
    setOtpDigits(newDigits);
    setCode(newDigits.join(''));
    const lastFilledIndex = Math.min(pasteData.length, 5);
    const targetInput = document.getElementById(`otp-${pickup._id}-${lastFilledIndex}`);
    if (targetInput) targetInput.focus();
  };

  const handleDeliverySubmit = (e) => {
    e.preventDefault();
    if (!code.trim() || code.length < 6) return;
    onConfirmDelivery(pickup, code.trim(), notes.trim());
  };

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
      <div className="card-body d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
          <h5 className="card-title fw-bold text-dark mb-0">{pickup.foodName}</h5>
          <div className="d-flex gap-1 align-items-center">
            {isExpired && <span className="badge bg-secondary">Expired</span>}
            <span className="badge bg-light text-dark border">
              {getDietaryBadge(pickup.dietaryType)}
            </span>
          </div>
        </div>

        <div className="text-muted small mb-2">
          🍽️ <strong>{pickup.quantityMeals} meals</strong>
        </div>

        {/* Visual Lifecycle Stepper */}
        <div className="mb-3">
          <StatusTracker currentStatus={pickup.status} />
        </div>

        {/* Expired warning if safe consumption life ended */}
        {isExpired && (
          <div className="alert alert-secondary py-1 px-2 mb-2 text-center small fw-semibold text-danger border-secondary">
            ⚠️ Food Expired: Safe consumption shelf life ended on {formatTime(pickup.safeConsumptionDeadline)}. Delivery is closed.
          </div>
        )}

        {/* Donor & Pickup Info */}
        <div className="bg-light p-3 rounded small mb-3">
          <div className="fw-semibold text-dark mb-1">📍 Pickup Location:</div>
          <div className="text-muted mb-2">
            {pickup.pickupAddress?.street}, {pickup.pickupAddress?.city}
          </div>

          {/* Small Interactive Map Preview with Make Big Option (Only needed while active and not expired) */}
          {!isExpired && ['accepted', 'picked_up'].includes(pickup.status) && (
            <PickupLocationPreview pickup={pickup} />
          )}

          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-semibold text-dark">📞 Donor Contact:</span>
            {donorPhone && donorPhone !== 'Contact not provided' && (
              <a
                href={`tel:${donorPhone}`}
                className="btn btn-sm btn-outline-success py-0 px-2 fw-semibold d-inline-flex align-items-center gap-1 text-decoration-none shadow-sm"
                style={{ fontSize: '0.74rem' }}
                title={`Call ${donorName}`}
              >
                <span>📞</span> Call Donor
              </a>
            )}
          </div>
          <div className="text-muted">
            {donorName} •{' '}
            {donorPhone && donorPhone !== 'Contact not provided' ? (
              <a href={`tel:${donorPhone}`} className="text-primary fw-semibold text-decoration-none">
                {donorPhone}
              </a>
            ) : (
              <span className="text-muted">{donorPhone}</span>
            )}
          </div>

          {pickup.specialInstructions && (
            <div className="mt-2 pt-2 border-top text-muted">
              <strong>Instructions:</strong> {pickup.specialInstructions}
            </div>
          )}
        </div>

        {/* Action Controls by Status */}
        <div className="mt-auto pt-2 border-top">
          {/* If expired, disable actions */}
          {isExpired ? (
            <button type="button" className="btn btn-secondary w-100 fw-semibold" disabled>
              ❌ Expired (Delivery Discontinued)
            </button>
          ) : (
            <>
              {pickup.status === 'accepted' && pickup.collectorLocation?.isArrived && (
                <div className="alert alert-info py-1 px-2 mb-2 text-center small fw-semibold">
                  📍 You have arrived! Please meet the donor, inspect food, and mark picked up.
                </div>
              )}

              {pickup.status === 'accepted' && (
                <button
                  type="button"
                  className="btn btn-warning w-100 fw-semibold text-dark"
                  onClick={() => onMarkPickedUp(pickup)}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Updating...' : '🚚 Mark as Picked Up'}
                </button>
              )}

              {pickup.status === 'picked_up' && (
                <div>
                  {!showConfirmForm ? (
                    <button
                      type="button"
                      className="btn btn-success w-100 fw-semibold shadow-sm"
                      onClick={() => setShowConfirmForm(true)}
                      disabled={isProcessing}
                    >
                      🔑 Enter Delivery OTP
                    </button>
                  ) : (
                    <form onSubmit={handleDeliverySubmit} className="bg-white p-2 rounded border shadow-sm">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="small fw-semibold text-dark" style={{ fontSize: '0.78rem' }}>
                          🔑 Enter 6-digit Handover OTP:
                        </span>
                        <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                          From Donor
                        </span>
                      </div>

                      {/* 6 Rapido-style OTP Digit Input Boxes */}
                      <div className="d-flex justify-content-center gap-1 my-2">
                        {otpDigits.map((digit, idx) => (
                          <input
                            key={idx}
                            id={`otp-${pickup._id}-${idx}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleDigitChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            onPaste={handlePaste}
                            className="form-control text-center fw-bold text-primary p-0 shadow-sm"
                            style={{
                              width: '32px',
                              height: '36px',
                              fontSize: '1.1rem',
                              borderRadius: '6px',
                              border: digit ? '2px solid #0d6efd' : '1px solid #ced4da'
                            }}
                            disabled={isProcessing}
                          />
                        ))}
                      </div>

                      <input
                        type="text"
                        className="form-control form-control-sm mb-2"
                        placeholder="Delivery remarks (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ fontSize: '0.76rem' }}
                      />
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary w-50"
                          onClick={() => setShowConfirmForm(false)}
                          disabled={isProcessing}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="btn btn-sm btn-success w-50 fw-semibold"
                          disabled={isProcessing || code.length < 6}
                        >
                          {isProcessing ? 'Verifying...' : 'Verify OTP'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {pickup.status === 'delivered' && (
            <div className="alert alert-success p-2 mb-0 small">
              <div className="fw-semibold text-center mb-1">
                🎉 Safely Delivered on {formatTime(pickup.deliveredAt)}
              </div>
              {pickup.deliveryNotes && (
                <div className="text-muted text-center mb-2 fst-italic">"{pickup.deliveryNotes}"</div>
              )}
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-1"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => setShowHistory(true)}
                >
                  <span>📜</span> History
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success flex-grow-1 fw-semibold d-flex align-items-center justify-content-center gap-1 text-white shadow-sm"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => setShowCertificate(true)}
                  title="View & Print Impact Certificate"
                >
                  <span>📄</span> Certificate
                </button>
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between text-muted small mt-2" style={{ fontSize: '0.75rem' }}>
            <span>Claimed: {formatTime(pickup.claimedAt)}</span>
            {pickup.pickedUpAt && <span>Picked up: {formatTime(pickup.pickedUpAt)}</span>}
          </div>
        </div>
      </div>

      {/* Mission History Modal */}
      {showHistory && (
        <MissionHistoryModal
          donation={pickup}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Impact Certificate Modal */}
      {showCertificate && (
        <ImpactCertificateModal
          donation={pickup}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};

export default PickupCard;
