import { useState } from 'react';
import { donationApi } from '../../services/api';
import AlertMessage from '../common/AlertMessage';
import LocationPickerMap from '../map/LocationPickerMap';

// Helper to format ISO date string for datetime-local inputs
const toInputDatetime = (date) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

/**
 * Multi-step modal flow for donors to list new surplus food effortlessly
 */
const DonationForm = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState(1); // 1: Food Details, 2: Timing & Safety, 3: Location & Confirm
  const [formData, setFormData] = useState(() => {
    const now = new Date();
    const defaultPickup = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const defaultSafe = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    return {
      foodName: '',
      dietaryType: 'veg',
      quantityMeals: '',
      quantityDescription: '',
      preparationTime: toInputDatetime(now),
      pickupDeadline: toInputDatetime(defaultPickup),
      safeConsumptionDeadline: toInputDatetime(defaultSafe),
      street: '',
      city: '',
      latitude: null,
      longitude: null,
      photoUrl: '',
      specialInstructions: ''
    };
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  // Step 1 Validation & Proceed
  const handleNextStep1 = () => {
    if (!formData.foodName.trim()) {
      setError('Food name is required.');
      return;
    }
    const meals = Number(formData.quantityMeals);
    if (!meals || meals < 1) {
      setError('Please provide a valid quantity of meals (at least 1).');
      return;
    }
    setError('');
    setStep(2);
  };

  // Step 2 Validation & Proceed
  const handleNextStep2 = () => {
    const pickupDate = new Date(formData.pickupDeadline);
    const safeDate = new Date(formData.safeConsumptionDeadline);

    if (pickupDate <= new Date()) {
      setError('Pickup deadline must be set to a future time.');
      return;
    }
    if (safeDate < pickupDate) {
      setError('Safe consumption deadline must be after or equal to the pickup deadline.');
      return;
    }
    setError('');
    setStep(3);
  };

  // Final Step Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.street.trim() || !formData.city.trim()) {
      setError('Pickup street address and city are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const meals = Number(formData.quantityMeals);
      const payload = {
        foodName: formData.foodName.trim(),
        dietaryType: formData.dietaryType,
        quantityMeals: meals,
        quantity: formData.quantityDescription.trim() || `${meals} meals`,
        preparationTime: new Date(formData.preparationTime).toISOString(),
        pickupDeadline: new Date(formData.pickupDeadline).toISOString(),
        safeConsumptionDeadline: new Date(formData.safeConsumptionDeadline).toISOString(),
        pickupAddress: {
          street: formData.street.trim(),
          city: formData.city.trim()
        },
        latitude: formData.latitude,
        longitude: formData.longitude,
        photoUrl: formData.photoUrl.trim(),
        specialInstructions: formData.specialInstructions.trim()
      };

      const response = await donationApi.create(payload);
      if (response?.data?.donation) {
        onSuccess(response.data.donation);
      }
    } catch (err) {
      setError(err.message || 'Failed to create food donation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow-lg border-0">
          {/* Modal Header */}
          <div className="modal-header bg-success text-white py-3">
            <div>
              <h5 className="modal-title fw-bold mb-0">🍲 List Surplus Food Donation</h5>
              <small className="opacity-75">Connect surplus food with verified NGOs and volunteers</small>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onCancel}
              aria-label="Close"
              disabled={isSubmitting}
            />
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-light px-4 pt-3 pb-2 border-bottom">
            <div className="row text-center small fw-semibold">
              <div className="col-4">
                <span className={`badge rounded-pill ${step === 1 ? 'bg-success' : step > 1 ? 'bg-secondary' : 'bg-light text-dark border'} me-1`}>
                  1
                </span>
                <span className={step === 1 ? 'text-success fw-bold' : 'text-muted'}>Food Details</span>
              </div>
              <div className="col-4">
                <span className={`badge rounded-pill ${step === 2 ? 'bg-success' : step > 2 ? 'bg-secondary' : 'bg-light text-dark border'} me-1`}>
                  2
                </span>
                <span className={step === 2 ? 'text-success fw-bold' : 'text-muted'}>Timing & Safety</span>
              </div>
              <div className="col-4">
                <span className={`badge rounded-pill ${step === 3 ? 'bg-success' : 'bg-light text-dark border'} me-1`}>
                  3
                </span>
                <span className={step === 3 ? 'text-success fw-bold' : 'text-muted'}>Location & Pin</span>
              </div>
            </div>
            <div className="progress mt-2" style={{ height: '4px' }}>
              <div
                className="progress-bar bg-success"
                role="progressbar"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4">
            <AlertMessage message={error} onClose={() => setError('')} />

            {/* STEP 1: Food Details & Quantity */}
            {step === 1 && (
              <div>
                <h6 className="fw-bold text-dark mb-3">Step 1: Tell us about the surplus food</h6>
                <div className="row g-3">
                  <div className="col-12 col-md-8">
                    <label className="form-label fw-semibold">Food Item Name *</label>
                    <input
                      type="text"
                      name="foodName"
                      className="form-control"
                      placeholder="e.g. 50 Packs Vegetable Biryani & Dal"
                      value={formData.foodName}
                      onChange={handleChange}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Dietary Type *</label>
                    <select
                      name="dietaryType"
                      className="form-select"
                      value={formData.dietaryType}
                      onChange={handleChange}
                    >
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-Vegetarian</option>
                      <option value="vegan">Vegan</option>
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Estimated Servings / Meals *</label>
                    <input
                      type="number"
                      name="quantityMeals"
                      min="1"
                      className="form-control"
                      placeholder="e.g. 40"
                      value={formData.quantityMeals}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label fw-semibold">Packaging / Description</label>
                    <input
                      type="text"
                      name="quantityDescription"
                      className="form-control"
                      placeholder="e.g. 40 boxed containers / 2 large pots"
                      value={formData.quantityDescription}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Photo URL (Optional)</label>
                    <input
                      type="url"
                      name="photoUrl"
                      className="form-control"
                      placeholder="https://images.unsplash.com/photo-example.jpg"
                      value={formData.photoUrl}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Timing & Food Safety */}
            {step === 2 && (
              <div>
                <h6 className="fw-bold text-dark mb-3">Step 2: Pickup deadlines & food safety</h6>
                <div className="row g-3">
                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Preparation Time</label>
                    <input
                      type="datetime-local"
                      name="preparationTime"
                      className="form-control"
                      value={formData.preparationTime}
                      onChange={handleChange}
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>When food was freshly prepared</small>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Pickup Deadline *</label>
                    <input
                      type="datetime-local"
                      name="pickupDeadline"
                      className="form-control"
                      value={formData.pickupDeadline}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Latest time volunteer should collect</small>
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">Safe Consumption By *</label>
                    <input
                      type="datetime-local"
                      name="safeConsumptionDeadline"
                      className="form-control"
                      value={formData.safeConsumptionDeadline}
                      onChange={handleChange}
                      required
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>Safe to eat before this time</small>
                  </div>
                </div>

                <div className="alert alert-info py-2 px-3 mt-4 mb-0 small">
                  💡 <strong>Food Safety Note:</strong> Ensuring accurate consumption deadlines guarantees that rescued food reaches recipients in safe, edible condition.
                </div>
              </div>
            )}

            {/* STEP 3: Location & Pin on Map */}
            {step === 3 && (
              <div>
                <h6 className="fw-bold text-dark mb-3">Step 3: Pickup location & instructions</h6>
                <div className="row g-3">
                  <div className="col-12 col-md-8">
                    <label className="form-label fw-semibold">Pickup Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      className="form-control"
                      placeholder="e.g. Hotel Grand, 14 MG Road"
                      value={formData.street}
                      onChange={handleChange}
                      required
                      autoFocus
                    />
                  </div>

                  <div className="col-12 col-md-4">
                    <label className="form-label fw-semibold">City *</label>
                    <input
                      type="text"
                      name="city"
                      className="form-control"
                      placeholder="e.g. Mumbai"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Interactive Map Selector */}
                  <div className="col-12">
                    <LocationPickerMap
                      latitude={formData.latitude}
                      longitude={formData.longitude}
                      onLocationChange={(lat, lon) =>
                        setFormData((prev) => ({ ...prev, latitude: lat, longitude: lon }))
                      }
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">Special Pickup Instructions</label>
                    <textarea
                      name="specialInstructions"
                      rows="2"
                      className="form-control"
                      placeholder="e.g. Enter via back kitchen gate. Mention Annapurna rescue to security."
                      value={formData.specialInstructions}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Listing Summary Preview */}
                <div className="bg-light p-3 rounded mt-3 border">
                  <div className="small fw-semibold text-dark mb-1">📋 Summary Preview:</div>
                  <div className="small text-muted">
                    <strong>{formData.foodName}</strong> ({formData.quantityMeals} meals, {formData.dietaryType}) • Pickup at {formData.street || 'Address'}, {formData.city || 'City'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="modal-footer bg-light py-2 d-flex justify-content-between">
            {step === 1 && (
              <>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm px-4"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-4 fw-semibold"
                  onClick={handleNextStep1}
                >
                  Next: Timing & Safety ➔
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-4"
                  onClick={() => {
                    setError('');
                    setStep(1);
                  }}
                  disabled={isSubmitting}
                >
                  ⬅ Back to Food Details
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-4 fw-semibold"
                  onClick={handleNextStep2}
                >
                  Next: Location & Pin ➔
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm px-4"
                  onClick={() => {
                    setError('');
                    setStep(2);
                  }}
                  disabled={isSubmitting}
                >
                  ⬅ Back to Timing
                </button>
                <button
                  type="button"
                  className="btn btn-success btn-sm px-4 fw-semibold"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Publishing Food Listing...' : '🚀 Publish Food Donation'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationForm;
