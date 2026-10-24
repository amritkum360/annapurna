/**
 * Reusable visual progression stepper for donation lifecycle
 * Progression: Available -> Accepted -> Picked Up -> Delivered
 */
const StatusTracker = ({ currentStatus }) => {
  const steps = [
    { key: 'available', label: 'Available', icon: '🍲' },
    { key: 'accepted', label: 'Accepted', icon: '🤝' },
    { key: 'picked_up', label: 'Picked Up', icon: '🚚' },
    { key: 'delivered', label: 'Delivered', icon: '✅' }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'accepted':
        return 1;
      case 'picked_up':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0; // available
    }
  };

  const currentIndex = getStepIndex(currentStatus);

  return (
    <div className="py-2">
      <div className="d-flex justify-content-between align-items-center position-relative">
        {/* Background track line */}
        <div
          className="position-absolute top-50 start-0 translate-middle-y w-100 bg-secondary-subtle"
          style={{ height: '2px', zIndex: 0 }}
        />
        {/* Completed progress line */}
        <div
          className="position-absolute top-50 start-0 translate-middle-y bg-success"
          style={{
            height: '2px',
            width: `${(currentIndex / (steps.length - 1)) * 100}%`,
            transition: 'width 0.3s ease',
            zIndex: 1
          }}
        />

        {steps.map((step, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div
              key={step.key}
              className="d-flex flex-column align-items-center text-center position-relative"
              style={{ zIndex: 2 }}
            >
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center shadow-sm ${
                  isCurrent
                    ? 'bg-success text-white border border-2 border-white'
                    : isDone
                    ? 'bg-success text-white'
                    : 'bg-white text-muted border border-secondary-subtle'
                }`}
                style={{ width: '26px', height: '26px', fontSize: '0.72rem' }}
              >
                {isDone ? '✓' : step.icon}
              </div>
              <span
                className={`mt-1 ${
                  isCurrent
                    ? 'fw-semibold text-success'
                    : isDone
                    ? 'fw-medium text-dark'
                    : 'text-muted'
                }`}
                style={{
                  fontSize: '10.5px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  lineHeight: 1.2
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusTracker;
