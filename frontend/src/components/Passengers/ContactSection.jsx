export default function ContactSection({
  contactData,
  errors,
  onChange,
}) {
  return (
    <section className="contact-details-card" aria-label="Contact Information">
      <div className="contact-card-header">
        <div className="contact-title-group">
          <span className="contact-icon-badge" aria-hidden="true">📱</span>
          <div>
            <h3 className="contact-title">Contact & Ticket Delivery</h3>
            <p className="contact-subtitle">
              Your e-ticket and live bus updates will be sent here.
            </p>
          </div>
        </div>
      </div>

      <div className="contact-inputs-grid">
        {/* Email Address */}
        <div className="input-group">
          <label htmlFor="contact-email" className="clay-label">
            Email Address <span className="req-star">*</span>
          </label>
          <div className={`clay-input-wrapper ${errors.email ? "has-error" : ""}`}>
            <span className="field-icon" aria-hidden="true">✉️</span>
            <input
              id="contact-email"
              type="email"
              placeholder="e.g. debashis@example.com"
              value={contactData.email || ""}
              onChange={(e) => onChange("email", e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "contact-email-err" : undefined}
            />
          </div>
          {errors.email && (
            <span id="contact-email-err" className="inline-err-msg" role="alert">
              {errors.email}
            </span>
          )}
        </div>

        {/* Mobile Number */}
        <div className="input-group">
          <label htmlFor="contact-phone" className="clay-label">
            Mobile Number <span className="req-star">*</span>
          </label>
          <div className={`clay-input-wrapper phone-wrapper ${errors.phone ? "has-error" : ""}`}>
            <span className="country-code-pill">+91</span>
            <input
              id="contact-phone"
              type="tel"
              placeholder="98765 43210"
              maxLength={10}
              value={contactData.phone || ""}
              onChange={(e) => {
                const numeric = e.target.value.replace(/\D/g, "").slice(0, 10);
                onChange("phone", numeric);
              }}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "contact-phone-err" : undefined}
            />
          </div>
          {errors.phone && (
            <span id="contact-phone-err" className="inline-err-msg" role="alert">
              {errors.phone}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
