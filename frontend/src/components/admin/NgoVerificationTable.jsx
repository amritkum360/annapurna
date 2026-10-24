import { useState } from 'react';

/**
 * NgoVerificationTable - Renders NGO accounts with status filters and verification actions
 */
const NgoVerificationTable = ({
  ngos = [],
  filter = 'pending',
  onFilterChange,
  onVerify,
  loading = false,
  actionLoading = false
}) => {
  const [selectedNgo, setSelectedNgo] = useState(null);
  const [actionType, setActionType] = useState('verified');
  const [notes, setNotes] = useState('');

  const openActionModal = (ngo, action) => {
    setSelectedNgo(ngo);
    setActionType(action);
    setNotes(ngo.verificationNotes || '');
  };

  const closeActionModal = () => {
    setSelectedNgo(null);
    setNotes('');
  };

  const handleSubmitAction = async (e) => {
    e.preventDefault();
    if (!selectedNgo) return;
    await onVerify(selectedNgo._id, actionType, notes);
    closeActionModal();
  };

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

  const getCity = (ngo) => {
    if (typeof ngo.city === 'string' && ngo.city.trim()) {
      return ngo.city;
    }
    if (typeof ngo.address === 'object' && ngo.address?.city) {
      return ngo.address.city;
    }
    return 'N/A';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="badge bg-success">Verified</span>;
      case 'rejected':
        return <span className="badge bg-danger">Rejected</span>;
      default:
        return <span className="badge bg-warning text-dark">Pending</span>;
    }
  };

  return (
    <div className="card shadow-sm border-0 mb-4">
      {/* Header and Filter Controls */}
      <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
        <div>
          <h5 className="card-title fw-bold mb-0">NGO Verification Applications</h5>
          <small className="text-muted">Review credentials and grant rescue claiming permissions</small>
        </div>
        <div className="btn-group btn-group-sm" role="group">
          {['pending', 'verified', 'rejected', 'all'].map((f) => (
            <button
              key={f}
              type="button"
              className={`btn ${filter === f ? 'btn-primary' : 'btn-outline-secondary'} text-capitalize`}
              onClick={() => onFilterChange(f)}
              disabled={loading}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary spinner-border-sm me-2" role="status" />
            <span className="text-muted small">Loading applications...</span>
          </div>
        ) : ngos.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted mb-0">No NGO accounts found matching "{filter}".</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light small">
                <tr>
                  <th className="ps-3">Organization / Contact</th>
                  <th>Contact Details</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Review Details</th>
                  <th className="pe-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {ngos.map((ngo) => (
                  <tr key={ngo._id}>
                    <td className="ps-3">
                      <div className="fw-bold text-dark">{ngo.organization || ngo.name}</div>
                      <div className="text-muted small">Rep: {ngo.name}</div>
                    </td>
                    <td>
                      <div>{ngo.email}</div>
                      <div className="text-muted small">{ngo.phone || 'No phone'}</div>
                    </td>
                    <td>
                      <div>{getCity(ngo)}</div>
                      <div
                        className="text-muted small text-truncate"
                        style={{ maxWidth: '180px' }}
                        title={formatAddress(ngo.address)}
                      >
                        {formatAddress(ngo.address)}
                      </div>
                    </td>
                    <td>{getStatusBadge(ngo.verificationStatus)}</td>
                    <td>
                      {ngo.verifiedBy ? (
                        <div className="small">
                          <div>By: {ngo.verifiedBy.name}</div>
                          <div className="text-muted">{new Date(ngo.verifiedAt).toLocaleDateString()}</div>
                          {ngo.verificationNotes && (
                            <div className="text-truncate text-secondary fst-italic" style={{ maxWidth: '150px' }}>
                              "{ngo.verificationNotes}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted fst-italic small">Awaiting review</span>
                      )}
                    </td>
                    <td className="pe-3 text-end">
                      <div className="btn-group btn-group-sm">
                        {ngo.verificationStatus !== 'verified' && (
                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm"
                            onClick={() => openActionModal(ngo, 'verified')}
                            disabled={actionLoading}
                          >
                            Approve
                          </button>
                        )}
                        {ngo.verificationStatus !== 'rejected' && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => openActionModal(ngo, 'rejected')}
                            disabled={actionLoading}
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Notes Modal Dialog */}
      {selectedNgo && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={handleSubmitAction}>
                <div className="modal-header">
                  <h5 className="modal-title fw-bold">
                    {actionType === 'verified' ? 'Approve NGO' : 'Reject NGO Application'}
                  </h5>
                  <button type="button" className="btn-close" onClick={closeActionModal} />
                </div>
                <div className="modal-body">
                  <p className="mb-2">
                    Organization: <strong>{selectedNgo.organization || selectedNgo.name}</strong>
                  </p>
                  <p className="small text-muted mb-3">
                    {actionType === 'verified'
                      ? 'Approving will grant this NGO permissions to claim food donations from the discovery feed.'
                      : 'Rejecting will revoke/block claiming permissions for this NGO.'}
                  </p>
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label small fw-semibold">
                      Reviewer Notes / Justification (optional)
                    </label>
                    <textarea
                      id="notes"
                      className="form-control form-control-sm"
                      rows="3"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Valid 80G certificate verified / Missing legal documents..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={closeActionModal} disabled={actionLoading}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-sm ${actionType === 'verified' ? 'btn-success' : 'btn-danger'}`}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : actionType === 'verified' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NgoVerificationTable;
