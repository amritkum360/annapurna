import { useState } from 'react';
import MissionHistoryModal from '../common/MissionHistoryModal';
import UserProfileModal from './UserProfileModal';

/**
 * DonationStatusBreakdown - Displays donation status distribution and recent platform activity
 */
const DonationStatusBreakdown = ({ donations, recentActivity = [] }) => {
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const getBadgeClass = (status) => {
    switch (status) {
      case 'available':
        return 'bg-success';
      case 'accepted':
        return 'bg-warning text-dark';
      case 'picked_up':
        return 'bg-primary';
      case 'delivered':
        return 'bg-success';
      case 'cancelled':
        return 'bg-secondary';
      default:
        return 'bg-light text-dark';
    }
  };

  return (
    <div className="row g-4 mb-4">
      {/* Status Pipeline Summary */}
      <div className="col-12 col-lg-5">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-header bg-white py-3 border-bottom">
            <h5 className="card-title fw-bold mb-0">Donation Lifecycle Overview</h5>
          </div>
          <div className="card-body">
            <ul className="list-group list-group-flush">
              <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                <span><span className="badge bg-success me-2">●</span> Available for Claim</span>
                <span className="fw-bold">{donations?.available || 0}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                <span><span className="badge bg-warning text-dark me-2">●</span> Claimed (Accepted)</span>
                <span className="fw-bold">{donations?.accepted || 0}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                <span><span className="badge bg-primary me-2">●</span> In-Transit (Picked Up)</span>
                <span className="fw-bold">{donations?.pickedUp || 0}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                <span><span className="badge bg-success me-2">●</span> Successfully Delivered</span>
                <span className="fw-bold text-success">{donations?.delivered || 0}</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
                <span><span className="badge bg-secondary me-2">●</span> Cancelled</span>
                <span className="fw-bold text-muted">{donations?.cancelled || 0}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Recent Platform Activity */}
      <div className="col-12 col-lg-7">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <h5 className="card-title fw-bold mb-0">Recent Platform Activity</h5>
            <span className="badge bg-light text-muted border">Latest {recentActivity.length} events</span>
          </div>
          <div className="card-body p-0">
            {recentActivity.length === 0 ? (
              <p className="text-muted text-center py-4 my-auto">No donations listed yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th className="ps-3">Food Item</th>
                      <th>Donor</th>
                      <th>Status</th>
                      <th>Claimed By</th>
                      <th>Date</th>
                      <th className="pe-3 text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {recentActivity.map((d) => (
                      <tr key={d._id}>
                        <td className="ps-3 fw-semibold">
                          {d.foodName}
                          <div className="text-muted fw-normal small">{d.quantityMeals} meals</div>
                        </td>
                        <td>
                          {d.donor ? (
                            <button
                              type="button"
                              className="btn btn-link p-0 fw-semibold text-decoration-none text-start d-inline-flex align-items-center gap-1"
                              style={{ fontSize: '0.84rem' }}
                              title="Click to view Donor profile & history"
                              onClick={() => setSelectedUser(d.donor)}
                            >
                              <span>👤</span>
                              <span className="text-decoration-underline text-success">
                                {d.donor.organization || d.donor.name}
                              </span>
                            </button>
                          ) : (
                            <span className="text-muted">Anonymous</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${getBadgeClass(d.status)}`}>
                            {d.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          {d.claimedBy ? (
                            <button
                              type="button"
                              className="btn btn-link p-0 fw-semibold text-decoration-none text-start d-inline-flex align-items-center gap-1"
                              style={{ fontSize: '0.84rem' }}
                              title={`Click to view ${d.claimedBy.role === 'ngo' ? 'NGO' : 'Volunteer'} profile & history`}
                              onClick={() => setSelectedUser(d.claimedBy)}
                            >
                              <span>{d.claimedBy.role === 'ngo' ? '🤝' : '🚴'}</span>
                              <span className="text-decoration-underline text-success">
                                {d.claimedBy.organization || d.claimedBy.name}
                              </span>
                              <span className="badge bg-light text-secondary border ms-1" style={{ fontSize: '0.65rem' }}>
                                {d.claimedBy.role}
                              </span>
                            </button>
                          ) : (
                            <span className="text-muted fst-italic">—</span>
                          )}
                        </td>
                        <td className="text-muted">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="pe-3 text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-0 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => setSelectedDonation(d)}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mission History Details Modal for Admin */}
      {selectedDonation && (
        <MissionHistoryModal
          donation={selectedDonation}
          onClose={() => setSelectedDonation(null)}
          onViewUserProfile={(userToInspect) => setSelectedUser(userToInspect)}
        />
      )}

      {/* User Profile Modal for Admin */}
      {selectedUser && (
        <UserProfileModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
};

export default DonationStatusBreakdown;
