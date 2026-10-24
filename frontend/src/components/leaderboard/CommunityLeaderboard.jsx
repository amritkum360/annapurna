import { useState, useEffect } from 'react';
import { donationApi } from '../../services/api';
import AlertMessage from '../common/AlertMessage';

/**
 * Public Community Leaderboard showcasing Top Donors and Top Rescuers (NGOs & Volunteers)
 */
const CommunityLeaderboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('donors'); // 'donors' or 'rescuers'
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    donationApi
      .getLeaderboard()
      .then((res) => {
        if (isMounted && res?.data?.leaderboard) {
          setData(res.data.leaderboard);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load community leaderboard');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <span className="badge bg-warning text-dark fs-6 d-inline-flex align-items-center gap-1 shadow-sm px-2 py-1">
            🥇 1st
          </span>
        );
      case 2:
        return (
          <span className="badge bg-secondary text-white fs-6 d-inline-flex align-items-center gap-1 shadow-sm px-2 py-1">
            🥈 2nd
          </span>
        );
      case 3:
        return (
          <span className="badge text-dark fs-6 d-inline-flex align-items-center gap-1 shadow-sm px-2 py-1" style={{ backgroundColor: '#cd7f32', color: '#fff' }}>
            🥉 3rd
          </span>
        );
      default:
        return (
          <span className="badge bg-light text-secondary border fw-bold px-2 py-1">
            #{rank}
          </span>
        );
    }
  };

  const topDonors = data?.topDonors || [];
  const topRescuers = data?.topRescuers || [];
  const impact = data?.impact || {};

  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/#leaderboard`;
    }
    return 'https://annapurna.org/#leaderboard';
  };

  const getShareText = () => {
    const mealsCount = impact.totalMealsRescued || 0;
    return `🍲 Check out the Annapurna Food Rescue Leaderboard! Our donors, NGOs, and volunteers have collectively rescued ${mealsCount.toLocaleString()} fresh meals to fight hunger and cut emissions. Explore the Wall of Fame:`;
  };

  const handleShareSocial = (platform) => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(getShareText());

    let shareLink = '';
    if (platform === 'whatsapp') {
      shareLink = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    } else if (platform === 'twitter') {
      shareLink = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=ZeroHunger,FoodRescue,Annapurna`;
    } else if (platform === 'linkedin') {
      shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    }

    if (shareLink && typeof window !== 'undefined') {
      window.open(shareLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = () => {
    const url = getShareUrl();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setToastMessage('🏆 Leaderboard link copied to clipboard!');
    }
  };

  const handleShareIndividual = (item, roleLabel = 'Food Hero') => {
    const name = item.name || item.organization;
    const meals = item.totalMeals || item.totalMealsRescued || 0;
    const text = `🏆 Proud to celebrate ${name} (${roleLabel}) on Annapurna Food Rescue! Ranked #${item.rank} with ${meals} meals rescued for our community. ${getShareUrl()}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setToastMessage(`Citation for "${name}" copied to clipboard! Share it on social media.`);
    }
  };

  return (
    <div
      id="leaderboard"
      className="bg-white p-4 p-md-5 my-5 shadow-sm"
      style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
    >
      <AlertMessage
        type="success"
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />

      {/* Title & Introduction */}
      <div className="text-center mb-4">
        <span className="badge px-3 py-1 mb-2 fw-semibold" style={{ backgroundColor: '#1b4332', color: '#ffffff' }}>
          🏆 Wall of Fame & Recognition
        </span>
        <h2 className="fw-bold text-dark mb-2">Community Impact Champions</h2>
        <p className="text-muted small mx-auto mb-0" style={{ maxWidth: '580px' }}>
          Celebrating our generous food donors, dedicated NGOs, and frontline volunteers
          who turn surplus food into hope and nourish our communities.
        </p>
      </div>

      {/* High-Level Impact Counter Strip */}
      <div className="row g-3 text-center mb-4">
        <div className="col-6 col-md-3">
          <div
            className="bg-white p-3 h-100 shadow-sm"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="fs-3 fw-bold text-success mb-1">
              {impact.totalMealsRescued || 0}
            </div>
            <div className="text-muted small fw-semibold">🍽️ Meals Rescued</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="bg-white p-3 h-100 shadow-sm"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="fs-3 fw-bold text-dark mb-1">
              {impact.totalMissions || 0}
            </div>
            <div className="text-muted small fw-semibold">🚚 Rescue Missions</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="bg-white p-3 h-100 shadow-sm"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="fs-3 fw-bold text-dark mb-1">
              {impact.donorsCount || topDonors.length}
            </div>
            <div className="text-muted small fw-semibold">🏪 Active Donors</div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="bg-white p-3 h-100 shadow-sm"
            style={{ border: '1px solid #e7e5e4', borderRadius: '12px' }}
          >
            <div className="fs-3 fw-bold text-dark mb-1">
              {impact.rescuersCount || topRescuers.length}
            </div>
            <div className="text-muted small fw-semibold">🤝 Verified Rescuers</div>
          </div>
        </div>
      </div>

      {/* Share Leaderboard Impact Bar */}
      <div
        className="p-3 mb-4 rounded-3 d-flex flex-wrap justify-content-between align-items-center gap-2"
        style={{ backgroundColor: '#fbf3ea', border: '1px solid #ebdcd0' }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className="fs-5">📢</span>
          <div>
            <div className="fw-semibold text-dark small">Share Community Impact</div>
            <div className="text-muted" style={{ fontSize: '0.72rem' }}>
              Inspire restaurants and citizens to join the hunger relief movement
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1 shadow-sm px-3 bg-white"
            onClick={() => handleShareSocial('whatsapp')}
            title="Share via WhatsApp"
          >
            <span>💬</span> WhatsApp
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1 shadow-sm px-3 bg-white"
            onClick={() => handleShareSocial('linkedin')}
            title="Share on LinkedIn"
          >
            <span>💼</span> LinkedIn
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-dark d-inline-flex align-items-center gap-1 shadow-sm px-3 bg-white"
            onClick={() => handleShareSocial('twitter')}
            title="Share on X / Twitter"
          >
            <span>𝕏</span> Share on X
          </button>

          <button
            type="button"
            className="btn btn-sm btn-light border d-inline-flex align-items-center gap-1 shadow-sm px-3"
            onClick={handleCopyLink}
            title="Copy Leaderboard Link"
          >
            <span>📋</span> Copy Link
          </button>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group p-1 bg-light rounded-pill border shadow-sm">
          <button
            type="button"
            className={`btn rounded-pill px-4 fw-semibold ${
              activeTab === 'donors'
                ? 'btn-success text-white shadow-sm'
                : 'btn-light text-muted border-0'
            }`}
            onClick={() => setActiveTab('donors')}
          >
            🍲 Top Food Donors
          </button>
          <button
            type="button"
            className={`btn rounded-pill px-4 fw-semibold ${
              activeTab === 'rescuers'
                ? 'btn-success text-white shadow-sm'
                : 'btn-light text-muted border-0'
            }`}
            onClick={() => setActiveTab('rescuers')}
          >
            🛵 Top Rescuers (NGOs & Volunteers)
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading leaderboard...</span>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="alert alert-warning py-2 text-center small mx-auto" style={{ maxWidth: '400px' }}>
          Leaderboard is temporarily updating.
        </div>
      )}

      {/* Tab 1: Top Donors Content */}
      {!loading && !error && activeTab === 'donors' && (
        <div>
          {topDonors.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              No delivered donations recorded yet. Be the first food donor to lead!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th style={{ width: '80px' }} className="text-center">Rank</th>
                    <th>Donor Organization / Name</th>
                    <th>Type</th>
                    <th>City</th>
                    <th className="text-center">Drives</th>
                    <th>Meals Rescued</th>
                    <th className="text-end pe-3">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topDonors.map((donor) => (
                    <tr key={donor.id || donor.rank} className={donor.rank <= 3 ? 'fw-semibold' : ''}>
                      <td className="text-center">{getRankBadge(donor.rank)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-5">{donor.rank === 1 ? '👑' : '🍲'}</span>
                          <div>
                            <div className="text-dark fw-bold mb-0">{donor.name}</div>
                            {donor.rank === 1 && (
                              <small className="text-success fw-semibold">Champion Food Hero</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {donor.type}
                        </span>
                      </td>
                      <td className="text-muted small">📍 {donor.city}</td>
                      <td className="text-center text-muted small">{donor.donationsCount} drives</td>
                      <td>
                        <span className="badge fs-6 fw-bold" style={{ backgroundColor: '#1b4332', color: '#ffffff' }}>
                          🍽️ {donor.totalMeals} meals
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-0 px-2"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => handleShareIndividual(donor, 'Food Donor')}
                          title={`Share citation for ${donor.name}`}
                        >
                          📢 Share
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Top Rescuers Content */}
      {!loading && !error && activeTab === 'rescuers' && (
        <div>
          {topRescuers.length === 0 ? (
            <div className="text-center py-4 text-muted small">
              No rescue missions completed yet. Verified NGOs and volunteers will appear here.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light text-muted small text-uppercase">
                  <tr>
                    <th style={{ width: '80px' }} className="text-center">Rank</th>
                    <th>Rescue Partner / Name</th>
                    <th>Role</th>
                    <th>City</th>
                    <th className="text-center">Missions</th>
                    <th>Meals Delivered</th>
                    <th className="text-end pe-3">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topRescuers.map((rescuer) => (
                    <tr key={rescuer.id || rescuer.rank} className={rescuer.rank <= 3 ? 'fw-semibold' : ''}>
                      <td className="text-center">{getRankBadge(rescuer.rank)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fs-5">{rescuer.rank === 1 ? '🌟' : '🛵'}</span>
                          <div>
                            <div className="text-dark fw-bold mb-0">{rescuer.name}</div>
                            {rescuer.rank === 1 && (
                              <small className="text-primary fw-semibold">Master Rescuer</small>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {rescuer.role}
                        </span>
                      </td>
                      <td className="text-muted small">📍 {rescuer.city}</td>
                      <td className="text-center text-muted small">{rescuer.missionsCompleted} delivered</td>
                      <td>
                        <span className="badge fs-6 fw-bold" style={{ backgroundColor: '#1b4332', color: '#ffffff' }}>
                          🚚 {rescuer.totalMealsRescued} meals
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-0 px-2"
                          style={{ fontSize: '0.72rem' }}
                          onClick={() => handleShareIndividual(rescuer, rescuer.role || 'Rescue Partner')}
                          title={`Share citation for ${rescuer.name}`}
                        >
                          📢 Share
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityLeaderboard;
