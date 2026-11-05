import { useState } from "react";
import "./Auth.css";

export default function RegisterPage({ onNavigate }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState(null);

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name is required (at least 2 characters).";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    const cleanPhone = formData.phone.replace(/[\s-]/g, "");
    if (!cleanPhone) {
      newErrors.phone = "10-digit mobile number is required.";
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      newErrors.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required.";
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setDemoNotice(null);

    // Simulate submission without storing plaintext passwords or creating fake session
    setTimeout(() => {
      setIsLoading(false);
      setDemoNotice({
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        timestamp: new Date().toLocaleTimeString(),
      });
    }, 600);
  };

  return (
    <main className="auth-page-container">
      {/* Top back navigation */}
      <div className="auth-top-nav">
        <button
          type="button"
          className="auth-back-btn"
          onClick={() => onNavigate("dashboard")}
          aria-label="Back to home dashboard"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Home</span>
        </button>

        <span className="auth-pill-badge">PHASE 7 PROTOTYPE</span>
      </div>

      <div className="auth-card-wrapper register-variant">
        <div className="auth-card">
          {/* Card Header & Brand */}
          <header className="auth-header">
            <div className="auth-brand-badge" aria-hidden="true">
              <span>B</span>
            </div>
            <h1>Create Passenger Account</h1>
            <p className="auth-subtitle">
              Join Bengal's friendly bus transit network for quick bookings and alerts.
            </p>
          </header>

          {/* Demo Submission Response (Requirement 5 & 6) */}
          {demoNotice && (
            <div className="auth-demo-alert" role="status">
              <div className="demo-alert-header">
                <span className="demo-alert-icon" aria-hidden="true">📝</span>
                <strong>DEMO REGISTRATION RECORDED</strong>
              </div>
              <p className="demo-alert-body">
                Registration prototype completed for <strong>{demoNotice.name}</strong> ({demoNotice.email}) at {demoNotice.timestamp}. 
                <strong>No database record was created</strong> and no credentials were saved.
              </p>
              <div className="demo-alert-actions">
                <button
                  type="button"
                  className="demo-btn-secondary"
                  onClick={() => onNavigate("login")}
                >
                  Proceed to Sign In
                </button>
                <button
                  type="button"
                  className="demo-btn-primary"
                  onClick={() => onNavigate("search")}
                >
                  Find Bus Routes →
                </button>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Full Name */}
            <div className="auth-field">
              <label htmlFor="reg-name" className="auth-label">
                Full Name
              </label>
              <div className={`clay-auth-input-box ${errors.fullName ? "has-error" : ""}`}>
                <span className="input-affix-icon" aria-hidden="true">🏷️</span>
                <input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Sourav Ganguly"
                  value={formData.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? "name-error" : undefined}
                />
              </div>
              {errors.fullName && (
                <span id="name-error" className="auth-error-hint" role="alert">
                  {errors.fullName}
                </span>
              )}
            </div>

            {/* Email Address */}
            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-label">
                Email Address
              </label>
              <div className={`clay-auth-input-box ${errors.email ? "has-error" : ""}`}>
                <span className="input-affix-icon" aria-hidden="true">✉️</span>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="e.g. sourav@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <span id="email-error" className="auth-error-hint" role="alert">
                  {errors.email}
                </span>
              )}
            </div>

            {/* Mobile Number */}
            <div className="auth-field">
              <label htmlFor="reg-phone" className="auth-label">
                Mobile Number (+91)
              </label>
              <div className={`clay-auth-input-box ${errors.phone ? "has-error" : ""}`}>
                <span className="input-affix-icon" aria-hidden="true">📱</span>
                <span className="input-prefix-label">+91</span>
                <input
                  id="reg-phone"
                  type="tel"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  autoComplete="tel-national"
                  maxLength={10}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                />
              </div>
              {errors.phone && (
                <span id="phone-error" className="auth-error-hint" role="alert">
                  {errors.phone}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-label">
                Create Password
              </label>
              <div className={`clay-auth-input-box ${errors.password ? "has-error" : ""}`}>
                <span className="input-affix-icon" aria-hidden="true">🔑</span>
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "reg-password-error" : undefined}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <span aria-hidden="true">{showPassword ? "👁️" : "👁️‍🗨️"}</span>
                  <span className="toggle-text">{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              {errors.password && (
                <span id="reg-password-error" className="auth-error-hint" role="alert">
                  {errors.password}
                </span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label htmlFor="reg-confirm-password" className="auth-label">
                Confirm Password
              </label>
              <div className={`clay-auth-input-box ${errors.confirmPassword ? "has-error" : ""}`}>
                <span className="input-affix-icon" aria-hidden="true">🔒</span>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  <span aria-hidden="true">{showConfirmPassword ? "👁️" : "👁️‍🗨️"}</span>
                  <span className="toggle-text">{showConfirmPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
              {errors.confirmPassword && (
                <span id="confirm-error" className="auth-error-hint" role="alert">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Create BusBondhu Account →</span>
              )}
            </button>
          </form>

          {/* Navigation to Login */}
          <footer className="auth-card-footer">
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => onNavigate("login")}
              >
                Sign In
              </button>
            </p>
          </footer>
        </div>

        {/* Safety & Demo Guidelines Note */}
        <div className="auth-footer-disclaimer">
          <span className="disclaimer-shield" aria-hidden="true">🛡️</span>
          <p>
            <strong>Frontend Simulation:</strong> Accounts are not saved to a real database. 
            Do not enter sensitive passwords.
          </p>
        </div>
      </div>
    </main>
  );
}
