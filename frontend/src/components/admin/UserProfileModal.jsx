import { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';

/**
 * UserProfileModal - Inspect detailed user profile, contact info, verification status,
 * and live rescue mission history in Admin view.
 */
const UserProfileModal = ({ user: initialUser, onClose }) => {
  const userId = initialUser?._id || initialUser?.id;
  const [profile, setProfile] = useState(initialUser || null);
  const [stats, setStats] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(() => Boolean(userId));
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      return;
    }

    adminApi
      .getUserProfile(userId)
      .then((res) => {
        if (!isMounted) return;
        if (res?.data) {
          setProfile(res.data.user || initialUser);
          setStats(res.data.stats || {});
          setRecentHistory(res.data.recentHistory || []);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || 'Failed to fetch detailed profile.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, initialUser]);

  if (!initialUser) return null;

  const user = profile || initialUser;

  const formatAddress = (addr) => {
    if (!addr) return '—';
    if (typeof addr === 'string') return addr.trim() || '—';
    if (typeof addr === 'object') {
      const parts = [addr.street, addr.city, addr.state, addr.postalCode].filter(
        (part) => typeof part === 'string' && part.trim() !== ''
      );
      return parts.length > 0 ? parts.join(', ') : '—';
    }
    return '—';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ngo':
        return (
          <span
            className="badge text-uppercase"
            style={{
              backgroundColor: '#e9f3ed',
              color: '#1b4332',
              border: '1px solid #c2dec9',
              fontWeight: 600
            }}
          >
            NGO Partner
          </span>
        );
      case 'volunteer':
        return (
          <span
            className="badge text-uppercase"
            style={{
              backgroundColor: '#e9f3ed',
              color: '#1b4332',
              border: '1px solid #c2dec9',
              fontWeight: 600
            }}
          >
            Volunteer
          </span>
        );
      case 'donor':
        return (
          <span
            className="badge text-uppercase"
            style={{
              backgroundColor: '#e9f3ed',
              color: '#1b4332',
              border: '1px solid #c2dec9',
              fontWeight: 600
            }}
          >
            Food Donor
          </span>
        );
      case 'admin':
        return <span className="badge bg-dark text-uppercase">Platform Admin</span>;
      default:
        return <span className="badge bg-secondary text-uppercase">{role}</span>;
    }
  };

  const getVerificationBadge = () => {
    if (user.role === 'ngo') {
      if (user.isVerified || user.verificationStatus === 'verified') {
        return (
          <span
            className="badge"
            style={{
              backgroundColor: '#e9f3ed',
              color: '#1b4332',
              border: '1px solid #a3cfbb',
              fontWeight: 600
            }}
          >
            ✓ Verified NGO
          </span>
        );
      }
      if (user.verificationStatus === 'rejected') {
        return <span className="badge bg-danger">✕ Application Rejected</span>;
      }
      return <span className="badge bg-warning text-dark">⏳ Verification Pending</span>;
    }
    return (
      <span
        className="badge"
        style={{
          backgroundColor: '#e9f3ed',
          color: '#1b4332',
          border: '1px solid #c2dec9',
          fontWeight: 600
        }}
      >
        Active Member
      </span>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="badge bg-success">Available</span>;
      case 'accepted':
        return <span className="badge bg-warning text-dark">Accepted</span>;
      case 'picked_up':
        return <span className="badge bg-primary">In-Transit</span>;
      case 'delivered':
        return <span className="badge bg-success">Delivered</span>;
      case 'cancelled':
        return <span className="badge bg-secondary">Cancelled</span>;
      default:
        return <span className="badge bg-light text-dark border">{status}</span>;
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1070 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0" style={{ borderRadius: '14px', overflow: 'hidden' }}>
          {/* Header */}
          <div
            className="modal-header py-3"
            style={{
              backgroundColor: '#1b4332',
              color: '#ffffff',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                style={{
                  width: '42px',
                  height: '42px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  fontSize: '1.15rem'
                }}
              >
                {user.role === 'ngo' ? '🤝' : user.role === 'volunteer' ? '🚴' : '🍲'}
              </div>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <h5 className="modal-title fw-bold mb-0 text-white">
                    {user.organization || user.name}
                  </h5>
                  {getRoleBadge(user.role)}
                  {getVerificationBadge()}
                </div>
                <small className="text-white opacity-75">
                  {user.organization && user.name ? `Representative: ${user.name} • ` : ''}
                  Member ID: {user._id || user.id}
                </small>
              </div>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body p-4 bg-light">
            {error && (
              <div className="alert alert-warning py-2 small mb-3">
                {error} (Showing stored profile preview)
              </div>
            )}

            {/* Profile Information Grid */}
            <div
              className="card p-3 mb-4 bg-white shadow-sm"
              style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
            >
              <h6 className="fw-bold text-dark small text-uppercase mb-3">
                📋 Account & Contact Details
              </h6>
              <div className="row g-3 small">
                <div className="col-12 col-sm-6">
                  <div className="text-muted fw-semibold">👤 Contact Person</div>
                  <div className="fw-medium text-dark">{user.name || '—'}</div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="text-muted fw-semibold">🏢 Organization / Entity</div>
                  <div className="fw-medium text-dark">{user.organization || 'Individual Donor / Volunteer'}</div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="text-muted fw-semibold">📧 Email Address</div>
                  {user.email ? (
                    <a href={`mailto:${user.email}`} className="text-decoration-none fw-medium text-success">
                      {user.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>

                <div className="col-12 col-sm-6">
                  <div className="text-muted fw-semibold">📞 Phone Number</div>
                  {user.phone ? (
                    <a href={`tel:${user.phone}`} className="text-decoration-none fw-medium text-success">
                      {user.phone}
                    </a>
                  ) : (
                    '—'
                  )}
                </div>

                <div className="col-12 col-sm-6">
                  <div className="text-muted fw-semibold">📍 Registered Address</div>
                  <div className="fw-medium text-dark">{formatAddress(user.address)}</div>
                </div>

                <div className="col-12 col-sm-6">
                  <div className="text-muted fw-semibold">📅 Platform Member Since</div>
                  <div className="fw-medium text-dark">{formatDate(user.createdAt)}</div>
                </div>

                {user.role === 'ngo' && user.verifiedAt && (
                  <div className="col-12">
                    <div className="p-2 rounded bg-light border small">
                      <span className="fw-semibold text-success">🛡️ Verification Audit:</span>{' '}
                      Verified on {formatDate(user.verifiedAt)}{' '}
                      {user.verifiedBy?.name ? `by ${user.verifiedBy.name}` : ''}
                      {user.verificationNotes ? ` • Notes: "${user.verificationNotes}"` : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Live Impact & Rescue Statistics */}
            {loading ? (
              <div className="text-center py-4 bg-white rounded-3 border mb-4">
                <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
                <span className="text-muted small">Loading live activity statistics...</span>
              </div>
            ) : stats ? (
              <div className="row g-3 mb-4">
                {user.role === 'donor' ? (
                  <>
                    <div className="col-12 col-sm-4">
                      <div
                        className="card shadow-sm h-100 bg-white p-3 text-center"
                        style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
                      >
                        <div className="fs-4 fw-bold text-success mb-1">
                          {stats.totalMealsRescued?.toLocaleString() || 0}
                        </div>
                        <div className="text-muted small fw-semibold">🍲 Meals Contributed</div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div
                        className="card shadow-sm h-100 bg-white p-3 text-center"
                        style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
                      >
                        <div className="fs-4 fw-bold text-dark mb-1">
                          {stats.totalDonations || 0}
                        </div>
                        <div className="text-muted small fw-semibold">📦 Food Drives Listed</div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div
                        className="card shadow-sm h-100 bg-white p-3 text-center"
                        style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
                      >
                        <div className="fs-4 fw-bold text-primary mb-1">
                          {stats.deliveredCount || 0}
                        </div>
                        <div className="text-muted small fw-semibold">✅ Completed Deliveries</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-12 col-sm-4">
                      <div
                        className="card shadow-sm h-100 bg-white p-3 text-center"
                        style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
                      >
                        <div className="fs-4 fw-bold text-success mb-1">
                          {stats.totalMealsDelivered?.toLocaleString() || 0}
                        </div>
                        <div className="text-muted small fw-semibold">🍽️ Meals Delivered</div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div
                        className="card shadow-sm h-100 bg-white p-3 text-center"
                        style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
                      >
                        <div className="fs-4 fw-bold text-dark mb-1">
                          {stats.totalClaimed || 0}
                        </div>
                        <div className="text-muted small fw-semibold">🚚 Rescue Missions Claimed</div>
                      </div>
                    </div>
                    <div className="col-12 col-sm-4">
                      <div
                        className="card shadow-sm h-100 bg-white p-3 text-center"
                        style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
                      >
                        <div className="fs-4 fw-bold text-primary mb-1">
                          {stats.deliveredCount || 0}
                        </div>
                        <div className="text-muted small fw-semibold">🎯 Handover Completions</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* Recent Rescue Missions Activity Log */}
            <div
              className="card bg-white shadow-sm"
              style={{ border: '1px solid #e7e5e4', borderRadius: '12px', overflow: 'hidden' }}
            >
              <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold text-dark small text-uppercase mb-0">
                  📜 Recent Rescue Activity Log
                </h6>
                <span className="badge bg-light text-muted border">
                  {recentHistory.length} records
                </span>
              </div>
              <div className="card-body p-0">
                {recentHistory.length === 0 ? (
                  <p className="text-muted small text-center py-4 my-auto">
                    No recent mission history recorded yet.
                  </p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th className="ps-3">Food Listing</th>
                          <th>Meals</th>
                          <th>Status</th>
                          <th>{user.role === 'donor' ? 'Claimed By Partner' : 'Donor Source'}</th>
                          <th className="pe-3 text-end">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentHistory.map((item) => {
                          const partner = user.role === 'donor' ? item.claimedBy : item.donor;
                          return (
                            <tr key={item._id}>
                              <td className="ps-3 fw-semibold text-dark">
                                {item.foodName}
                              </td>
                              <td className="fw-medium">{item.quantityMeals}</td>
                              <td>{getStatusBadge(item.status)}</td>
                              <td>
                                {partner ? (
                                  <span>
                                    {partner.organization || partner.name}
                                    {partner.role ? ` (${partner.role})` : ''}
                                  </span>
                                ) : (
                                  <span className="text-muted fst-italic">—</span>
                                )}
                              </td>
                              <td className="pe-3 text-end text-muted">
                                {formatDate(item.createdAt)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer py-2 bg-light d-flex justify-content-between">
            <small className="text-muted">
              Platform Admin User Inspection • Confidential
            </small>
            <button
              type="button"
              className="btn btn-sm btn-secondary px-4"
              onClick={onClose}
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
