import { useState } from "react";
import "./Auth.css";

export default function LoginPage({ onNavigate }) {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState(null);

  const validate = () => {
    const newErrors = {};
    const id = formData.identifier.trim();

    if (!id) {
      newErrors.identifier = "Please enter your email or 10-digit mobile number.";
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(id);
      const isPhone = /^\d{10}$/.test(id.replace(/[\s-]/g, ""));
      if (!isEmail && !isPhone) {
        newErrors.identifier = "Enter a valid email address or 10-digit mobile number.";
      }
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
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

    // Simulate network submission without faking a login or storing credentials
    setTimeout(() => {
      setIsLoading(false);
      setDemoNotice({
        identifier: formData.identifier,
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

      <div className="auth-card-wrapper">
        <div className="auth-card">
          {/* Card Header & Brand */}
          <header className="auth-header">
            <div className="auth-brand-badge" aria-hidden="true">
              <span>B</span>
            </div>
            <h1>Passenger Sign In</h1>
            <p className="auth-subtitle">
              Sign in to manage your Bengal transit bookings, e-tickets, and live alerts.
            </p>
          </header>

          {/* Demo Submission Response (Requirement 5 & 6) */}
          {demoNotice && (
            <div className="auth-demo-alert" role="status">
              <div className="demo-alert-header">
                <span className="demo-alert-icon" aria-hidden="true">🔒</span>
                <strong>DEMO PROTOTYPE — NO REAL AUTH</strong>
              </div>
              <p className="demo-alert-body">
                Authentication APIs are not integrated in this phase. 
                Submitted for <strong>{demoNotice.identifier}</strong> at {demoNotice.timestamp}. 
                <strong>No credentials were sent or stored</strong> in any database, and no session was faked.
              </p>
              <div className="demo-alert-actions">
                <button
                  type="button"
                  className="demo-btn-secondary"
                  onClick={() => setDemoNotice(null)}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="demo-btn-primary"
                  onClick={() => onNavigate("search")}
                >
                  Explore Buses →
                </button>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            {/* Email or Phone */}
            <div className="auth-field">
              <label htmlFor="login-identifier" className="auth-label">
                Email or Mobile Number
              </label>
              <div className={`clay-auth-input-box ${errors.identifier ? "has-error" : ""}`}>
                <span className="input-affix-icon" aria-hidden="true">👤</span>
                <input
                  id="login-identifier"
                  type="text"
                  placeholder="e.g. rahul@example.com or 9876543210"
                  value={formData.identifier}
                  onChange={(e) => handleChange("identifier", e.target.value)}
                  autoComplete="username"
                  aria-invalid={Boolean(errors.identifier)}
                  aria-describedby={errors.identifier ? "identifier-error" : undefined}
                />
              </div>
              {errors.identifier && (
                <span id="identifier-error" className="auth-error-hint" role="alert">
                  {errors.identifier}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="auth-field">
              <div className="label-with-aside">
                <label htmlFor="login-password" className="auth-label">
                  Password
                </label>
                <span className="forgot-disabled-hint" title="Disabled in demo prototype">
                  Forgot password?
                </span>
              </div>
              <div className={`clay-auth-input-box ${errors.password ? "has-error" : ""}`}>
                <span className="input-affix-icon" aria-hidden="true">🔑</span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
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
                <span id="password-error" className="auth-error-hint" role="alert">
                  {errors.password}
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
                  <span>Checking...</span>
                </>
              ) : (
                <span>Sign In to BusBondhu →</span>
              )}
            </button>
          </form>

          {/* Navigation to Register */}
          <footer className="auth-card-footer">
            <p>
              Don't have an account yet?{" "}
              <button
                type="button"
                className="auth-switch-link"
                onClick={() => onNavigate("register")}
              >
                Register now
              </button>
            </p>
          </footer>
        </div>

        {/* Safety & Demo Guidelines Note */}
        <div className="auth-footer-disclaimer">
          <span className="disclaimer-shield" aria-hidden="true">🛡️</span>
          <p>
            <strong>Frontend Simulation:</strong> Authentication is not connected to a live identity provider. 
            Do not enter real or sensitive passwords.
          </p>
        </div>
      </div>
    </main>
  );
}
