import { useState } from 'react';
import ImpactCertificateModal from './ImpactCertificateModal';

/**
 * MissionHistoryModal - Detailed audit trail and timeline for delivered food rescue missions
 */
const MissionHistoryModal = ({ donation, onClose, onViewUserProfile }) => {
  const [showCertificate, setShowCertificate] = useState(false);
  if (!donation) return null;

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (startStr, endStr) => {
    if (!startStr || !endStr) return null;
    const diffMs = new Date(endStr) - new Date(startStr);
    if (diffMs <= 0) return null;
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins} mins`;
    return `${hours} hr${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min${mins > 1 ? 's' : ''}` : ''}`;
  };

  const donorName = donation.donor?.organization || donation.donor?.name || 'Local Donor';
  const donorPhone = donation.donor?.phone || '';
  const collectorName = donation.claimedBy?.name || 'Assigned Collector';
  const collectorRole = donation.claimedBy?.role ? `(${donation.claimedBy.role})` : '';
  const collectorOrg = donation.claimedBy?.organization || '';
  const collectorPhone = donation.claimedBy?.phone || '';

  const totalRescueTime = calculateDuration(donation.createdAt, donation.deliveredAt);
  const transitTime = calculateDuration(donation.pickedUpAt, donation.deliveredAt);

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0">
          {/* Header */}
          <div className="modal-header py-3 bg-light border-bottom">
            <div>
              <div className="d-flex align-items-center gap-2">
                <h5 className="modal-title fw-bold mb-0">📜 Rescue Mission History</h5>
                <span className="badge bg-success text-uppercase">Delivered</span>
              </div>
              <small className="text-muted">{donation.foodName} • {donation.quantityMeals} meals</small>
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>

          <div className="modal-body p-4">
            {/* Mission Outcome Banner */}
            <div className="alert alert-success border-0 shadow-sm p-3 mb-4">
              <div className="d-flex align-items-start gap-3">
                <span className="fs-2">🎉</span>
                <div>
                  <h6 className="fw-bold mb-1 text-success">Mission Successfully Completed!</h6>
                  <p className="small mb-1">
                    <strong>Proof of Distribution / Notes:</strong>{' '}
                    {donation.deliveryNotes ? `"${donation.deliveryNotes}"` : 'Handed over and distributed to beneficiaries in need.'}
                  </p>
                  {totalRescueTime && (
                    <small className="text-muted d-block">
                      ⏱️ Total turnaround: {totalRescueTime} from listing to delivery
                      {transitTime ? ` (${transitTime} in transit)` : ''}
                    </small>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-success fw-semibold mt-2 d-inline-flex align-items-center gap-1 text-white shadow-sm"
                    style={{ fontSize: '0.78rem' }}
                    onClick={() => setShowCertificate(true)}
                  >
                    <span>📄</span> View Official 80G Impact Certificate
                  </button>
                </div>
              </div>
            </div>

            {/* Chronological Milestone Timeline */}
            <h6 className="fw-bold text-dark mb-3">📍 Complete Lifecycle Milestones</h6>
            <div className="list-group list-group-flush border rounded mb-4">
              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div>
                  <span className="badge bg-primary me-2">1</span>
                  <strong>Food Donation Listed</strong>
                  <div className="text-muted small ps-4">
                    Published by{' '}
                    {onViewUserProfile && donation.donor ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-success fw-semibold text-decoration-underline"
                        style={{ fontSize: 'inherit' }}
                        onClick={() => onViewUserProfile(donation.donor)}
                      >
                        {donorName}
                      </button>
                    ) : (
                      donorName
                    )}{' '}
                    at {donation.pickupAddress?.street}, {donation.pickupAddress?.city}
                  </div>
                </div>
                <span className="text-muted small fw-semibold">{formatDateTime(donation.createdAt)}</span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div>
                  <span className="badge bg-warning text-dark me-2">2</span>
                  <strong>Claimed / Accepted</strong>
                  <div className="text-muted small ps-4">
                    Accepted by{' '}
                    {onViewUserProfile && donation.claimedBy ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-success fw-semibold text-decoration-underline"
                        style={{ fontSize: 'inherit' }}
                        onClick={() => onViewUserProfile(donation.claimedBy)}
                      >
                        {collectorName}
                      </button>
                    ) : (
                      collectorName
                    )}{' '}
                    {collectorRole} {collectorOrg ? `• ${collectorOrg}` : ''}
                  </div>
                </div>
                <span className="text-muted small fw-semibold">{formatDateTime(donation.claimedAt)}</span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2">
                <div>
                  <span className="badge bg-info text-dark me-2">3</span>
                  <strong>Picked Up from Donor</strong>
                  <div className="text-muted small ps-4">
                    Physical handover authenticated with secure 6-digit confirmation code
                  </div>
                </div>
                <span className="text-muted small fw-semibold">{formatDateTime(donation.pickedUpAt)}</span>
              </div>

              <div className="list-group-item d-flex justify-content-between align-items-center py-2 bg-light">
                <div>
                  <span className="badge bg-success me-2">4</span>
                  <strong className="text-success">Delivered & Distributed</strong>
                  <div className="text-muted small ps-4">
                    Safely reached recipients in need. Total meals rescued: {donation.quantityMeals}
                  </div>
                </div>
                <span className="text-success small fw-bold">{formatDateTime(donation.deliveredAt)}</span>
              </div>
            </div>

            {/* People & Parties Involved */}
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div
                  className="card h-100 bg-light p-3"
                  style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fw-bold text-dark small text-uppercase mb-0">🏪 Donor Details</h6>
                    {onViewUserProfile && donation.donor && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success py-0 px-2 fw-semibold"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => onViewUserProfile(donation.donor)}
                      >
                        👤 View Profile
                      </button>
                    )}
                  </div>
                  <div className="fw-semibold">
                    {onViewUserProfile && donation.donor ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-dark fw-bold text-decoration-none text-start"
                        onClick={() => onViewUserProfile(donation.donor)}
                        title="Click to view Donor profile details"
                      >
                        <span className="text-decoration-underline text-success">{donorName}</span>
                      </button>
                    ) : (
                      donorName
                    )}
                  </div>
                  <div className="text-muted small">
                    📍 {donation.pickupAddress?.street}, {donation.pickupAddress?.city}
                  </div>
                  {donorPhone && <div className="text-muted small">📞 {donorPhone}</div>}
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div
                  className="card h-100 bg-light p-3"
                  style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fw-bold text-dark small text-uppercase mb-0">🚚 Rescue Collector</h6>
                    {onViewUserProfile && donation.claimedBy && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success py-0 px-2 fw-semibold"
                        style={{ fontSize: '0.72rem' }}
                        onClick={() => onViewUserProfile(donation.claimedBy)}
                      >
                        🔍 View Profile
                      </button>
                    )}
                  </div>
                  <div className="fw-semibold">
                    {onViewUserProfile && donation.claimedBy ? (
                      <button
                        type="button"
                        className="btn btn-link p-0 text-dark fw-bold text-decoration-none text-start"
                        onClick={() => onViewUserProfile(donation.claimedBy)}
                        title="Click to view Collector profile details"
                      >
                        <span className="text-decoration-underline text-success">{collectorName}</span>
                        <span className="badge bg-secondary ms-1">{collectorRole}</span>
                      </button>
                    ) : (
                      <>
                        {collectorName} <span className="badge bg-secondary ms-1">{collectorRole}</span>
                      </>
                    )}
                  </div>
                  {collectorOrg && <div className="text-muted small">🏢 {collectorOrg}</div>}
                  {collectorPhone && <div className="text-muted small">📞 {collectorPhone}</div>}
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer py-2 bg-light d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-sm btn-outline-success fw-semibold d-flex align-items-center gap-1"
              style={{ fontSize: '0.8rem' }}
              onClick={() => setShowCertificate(true)}
            >
              <span>📄</span> 80G Certificate
            </button>
            <button type="button" className="btn btn-sm btn-secondary px-4" onClick={onClose}>
              Close History
            </button>
          </div>
        </div>
      </div>

      {showCertificate && (
        <ImpactCertificateModal
          donation={donation}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
};

export default MissionHistoryModal;
