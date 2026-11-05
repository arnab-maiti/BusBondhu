export default function PassengerCard({
  passengerIndex,
  seatId,
  passengerData,
  errors,
  onChange,
}) {
  const genderOptions = [
    { id: "male", label: "Male" },
    { id: "female", label: "Female" },
    { id: "other", label: "Other" },
  ];

  return (
    <div className="passenger-form-card" aria-label={`Passenger ${passengerIndex + 1} Details`}>
      <div className="passenger-card-header">
        <div className="passenger-title-group">
          <span className="passenger-num-badge">P{passengerIndex + 1}</span>
          <div>
            <h3 className="passenger-card-title">Passenger {passengerIndex + 1}</h3>
            <span className="passenger-seat-tag">Assigned to Seat <strong>{seatId}</strong></span>
          </div>
        </div>
      </div>

      <div className="passenger-inputs-grid">
        {/* Full Name */}
        <div className="input-group name-group">
          <label htmlFor={`p-${passengerIndex}-name`} className="clay-label">
            Full Name <span className="req-star">*</span>
          </label>
          <div className={`clay-input-wrapper ${errors.fullName ? "has-error" : ""}`}>
            <span className="field-icon" aria-hidden="true">👤</span>
            <input
              id={`p-${passengerIndex}-name`}
              type="text"
              placeholder="e.g. Debashis Mukherjee"
              value={passengerData.fullName || ""}
              onChange={(e) => onChange("fullName", e.target.value)}
              aria-invalid={Boolean(errors.fullName)}
              aria-describedby={errors.fullName ? `p-${passengerIndex}-name-err` : undefined}
            />
          </div>
          {errors.fullName && (
            <span id={`p-${passengerIndex}-name-err`} className="inline-err-msg" role="alert">
              {errors.fullName}
            </span>
          )}
        </div>

        {/* Age */}
        <div className="input-group age-group">
          <label htmlFor={`p-${passengerIndex}-age`} className="clay-label">
            Age <span className="req-star">*</span>
          </label>
          <div className={`clay-input-wrapper ${errors.age ? "has-error" : ""}`}>
            <span className="field-icon" aria-hidden="true">🎂</span>
            <input
              id={`p-${passengerIndex}-age`}
              type="number"
              min={1}
              max={120}
              placeholder="e.g. 28"
              value={passengerData.age || ""}
              onChange={(e) => onChange("age", e.target.value)}
              aria-invalid={Boolean(errors.age)}
              aria-describedby={errors.age ? `p-${passengerIndex}-age-err` : undefined}
            />
          </div>
          {errors.age && (
            <span id={`p-${passengerIndex}-age-err`} className="inline-err-msg" role="alert">
              {errors.age}
            </span>
          )}
        </div>

        {/* Gender Selection */}
        <div className="input-group gender-group">
          <span className="clay-label">
            Gender <span className="req-star">*</span>
          </span>
          <div className="gender-radios-row" role="radiogroup" aria-label={`Gender for passenger ${passengerIndex + 1}`}>
            {genderOptions.map((opt) => (
              <label
                key={opt.id}
                className={`gender-chip-label ${passengerData.gender === opt.id ? "selected" : ""}`}
              >
                <input
                  type="radio"
                  name={`gender-p-${passengerIndex}`}
                  value={opt.id}
                  checked={passengerData.gender === opt.id}
                  onChange={() => onChange("gender", opt.id)}
                />
                <span className="chip-indicator" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          {errors.gender && (
            <span className="inline-err-msg" role="alert">
              {errors.gender}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
