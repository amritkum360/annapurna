import { useState } from 'react';
import AlertMessage from './AlertMessage';

/**
 * ImpactCertificateModal - Formal, printable Certificate of Social Impact & 80G CSR Receipt
 * for delivered food rescue donations.
 */
const ImpactCertificateModal = ({ donation, onClose }) => {
  const [currentTime] = useState(() => Date.now());
  const [copyToast, setCopyToast] = useState('');

  if (!donation) return null;

  const donorName =
    donation.donor?.organization ||
    donation.donor?.name ||
    'Valued Community Food Donor';

  const collectorName =
    donation.claimedBy?.organization ||
    donation.claimedBy?.name ||
    'Verified Relief Partner';

  const collectorRole = donation.claimedBy?.role
    ? donation.claimedBy.role.toUpperCase()
    : 'VERIFIED NGO';

  const deliveryDate = donation.deliveredAt
    ? new Date(donation.deliveredAt).toLocaleDateString([], {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : new Date(currentTime).toLocaleDateString([], {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

  const certNumber = `AP-CSR-${(donation._id || 'RESCUE')
    .slice(-8)
    .toUpperCase()}-${new Date(donation.deliveredAt || currentTime).getFullYear()}`;

  const meals = Number(donation.quantityMeals) || 1;
  const co2Saved = (meals * 2.5).toFixed(1); // Standard FAO estimate: ~2.5 kg CO2e saved per kg/meal of rescued food

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `🍲 Proud to share that "${donorName}" rescued ${meals} fresh meals (${donation.foodName}) on Annapurna Food Rescue, saving ~${co2Saved} kg of CO2e! Certificate ID: ${certNumber}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopyToast('Impact Certificate details copied to clipboard!');
    }
  };

  return (
    <>
      <AlertMessage
        type="success"
        message={copyToast}
        onClose={() => setCopyToast('')}
      />

      <div
        className="modal show d-block certificate-modal-backdrop"
        tabIndex="-1"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1080 }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow-lg border-0" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {/* Modal Actions Bar (Hidden during Print) */}
            <div className="modal-header py-2 px-3 bg-light border-bottom d-print-none d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <span className="badge" style={{ backgroundColor: '#1b4332', color: '#fff' }}>
                  📜 Verified Impact Proof
                </span>
                <small className="text-muted fw-semibold">
                  CSR & Section 80G Food Relief Recognition
                </small>
              </div>
              <div className="d-flex align-items-center gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                  onClick={handleShare}
                  title="Share Impact Summary"
                >
                  <span>🔗</span> Share
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success fw-semibold d-flex align-items-center gap-1 text-white shadow-sm"
                  onClick={handlePrint}
                  title="Print or Save as PDF"
                >
                  <span>🖨️</span> Print / Save PDF
                </button>
                <button
                  type="button"
                  className="btn-close ms-2"
                  onClick={onClose}
                  aria-label="Close"
                />
              </div>
            </div>

            {/* Printable Certificate Frame */}
            <div className="modal-body p-4 p-md-5 bg-white certificate-printable-area">
              <div
                className="certificate-card p-4 p-md-5 position-relative text-center"
                style={{
                  border: '8px double #1b4332',
                  borderRadius: '12px',
                  backgroundColor: '#ffffff',
                  boxShadow: 'inset 0 0 20px rgba(27, 67, 50, 0.04)'
                }}
              >
                {/* Decorative Top Corners */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="text-start">
                    <span className="fs-3">🍲</span>
                    <span className="fw-bold fs-5 ms-2 text-dark" style={{ letterSpacing: '-0.5px' }}>
                      Annapurna
                    </span>
                    <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                      Save Food • Share Hope
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.72rem' }}>
                      CERT NO: {certNumber}
                    </span>
                    <div className="text-muted small mt-1" style={{ fontSize: '0.72rem' }}>
                      Issued: {deliveryDate}
                    </div>
                  </div>
                </div>

                <hr style={{ borderColor: '#c2dec9', margin: '0.75rem 0 1.5rem 0' }} />

                {/* Certificate Title */}
                <div className="mb-4">
                  <h6
                    className="text-uppercase fw-bold mb-1"
                    style={{ color: '#2d6a4f', letterSpacing: '2px', fontSize: '0.85rem' }}
                  >
                    Official Certificate of Social Impact
                  </h6>
                  <h2
                    className="fw-bold mb-2 text-dark font-serif"
                    style={{ fontFamily: 'Georgia, serif', color: '#1b4332' }}
                  >
                    Meal Rescue & Hunger Relief Citation
                  </h2>
                  <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '520px' }}>
                    Presented in formal acknowledgement of proactive zero-waste commitment
                    and charitable sustenance distribution to local communities.
                  </p>
                </div>

                {/* Recipient Presentation */}
                <div className="my-4 py-2">
                  <div className="text-muted small text-uppercase" style={{ letterSpacing: '1px' }}>
                    This certificate is proudly conferred upon
                  </div>
                  <h3
                    className="fw-bold mt-2 mb-1"
                    style={{ color: '#1b4332', textDecoration: 'underline', textUnderlineOffset: '6px' }}
                  >
                    {donorName}
                  </h3>
                  <div className="text-muted small">
                    📍 {donation.pickupAddress?.street ? `${donation.pickupAddress.street}, ` : ''}{donation.pickupAddress?.city || 'India'}
                  </div>
                </div>

                {/* Impact Statement */}
                <div
                  className="p-3 my-4 rounded-3 text-start mx-auto"
                  style={{
                    backgroundColor: '#fbf3ea',
                    border: '1px solid #ebdcd0',
                    maxWidth: '620px'
                  }}
                >
                  <p className="mb-0 text-dark small" style={{ lineHeight: 1.6 }}>
                    For successfully diverting <strong>{donation.foodName}</strong> from landfill disposal
                    and supplying <strong>{meals} freshly prepared, safe meals</strong> to our verified
                    partner <strong>{collectorName} ({collectorRole})</strong>. Through this action, an estimated{' '}
                    <strong>{co2Saved} kg of CO₂e</strong> greenhouse emissions were prevented.
                  </p>
                </div>

                {/* KPI Badge Strip */}
                <div className="row g-2 justify-content-center my-4 text-center">
                  <div className="col-4 col-sm-3">
                    <div className="p-2 border rounded bg-white shadow-sm">
                      <div className="fs-4 fw-bold" style={{ color: '#1b4332' }}>{meals}</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>Meals Rescued</div>
                    </div>
                  </div>
                  <div className="col-4 col-sm-3">
                    <div className="p-2 border rounded bg-white shadow-sm">
                      <div className="fs-4 fw-bold text-success">{co2Saved} kg</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>CO₂e Prevented</div>
                    </div>
                  </div>
                  <div className="col-4 col-sm-3">
                    <div className="p-2 border rounded bg-white shadow-sm">
                      <div className="fs-4 fw-bold text-dark">100%</div>
                      <div className="text-muted" style={{ fontSize: '0.7rem' }}>OTP Authenticated</div>
                    </div>
                  </div>
                </div>

                {/* Signatures & Seal */}
                <div className="d-flex justify-content-between align-items-end mt-5 pt-3">
                  <div className="text-center" style={{ width: '180px' }}>
                    <div
                      className="border-bottom border-dark pb-1 mb-1 fw-semibold font-italic"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1b4332' }}
                    >
                      Annapurna Social Trust
                    </div>
                    <small className="text-muted d-block" style={{ fontSize: '0.72rem' }}>
                      Authorized Platform Signatory
                    </small>
                  </div>

                  {/* Golden / Forest Stamp Seal */}
                  <div
                    className="rounded-circle d-flex flex-column align-items-center justify-content-center text-center shadow-sm"
                    style={{
                      width: '84px',
                      height: '84px',
                      backgroundColor: '#e9f3ed',
                      border: '3px dashed #1b4332',
                      color: '#1b4332'
                    }}
                  >
                    <span className="fs-5 lh-1">🏅</span>
                    <span className="fw-bold" style={{ fontSize: '0.55rem', letterSpacing: '0.5px' }}>
                      VERIFIED
                    </span>
                    <span style={{ fontSize: '0.5rem' }}>RESCUE</span>
                  </div>

                  <div className="text-center" style={{ width: '180px' }}>
                    <div
                      className="border-bottom border-dark pb-1 mb-1 fw-semibold text-truncate"
                      style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#1b4332' }}
                    >
                      {collectorName}
                    </div>
                    <small className="text-muted d-block text-truncate" style={{ fontSize: '0.72rem' }}>
                      Receiving Relief Partner
                    </small>
                  </div>
                </div>

                <div className="text-muted text-center mt-4 pt-2" style={{ fontSize: '0.65rem' }}>
                  Digitally verified on Annapurna Decentralized Ledger • Non-Transferable • Under Section 80G CSR Guidelines
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer py-2 bg-light d-flex justify-content-between d-print-none">
              <small className="text-muted">
                Tax-deductible CSR food waste diversion proof
              </small>
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-sm btn-secondary px-3" onClick={onClose}>
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success px-3 fw-semibold text-white shadow-sm"
                  onClick={handlePrint}
                >
                  🖨️ Print Certificate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImpactCertificateModal;
