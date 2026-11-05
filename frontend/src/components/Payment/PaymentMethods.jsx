import { useState } from "react";

export default function PaymentMethods({
  selectedMethod,
  onSelectMethod,
  paymentDetails,
  onUpdatePaymentDetails,
}) {
  const [activeUpiApp, setActiveUpiApp] = useState("gpay");

  const popularBanks = [
    { id: "sbi", name: "State Bank of India", code: "SBI" },
    { id: "hdfc", name: "HDFC Bank", code: "HDFC" },
    { id: "icici", name: "ICICI Bank", code: "ICICI" },
    { id: "axis", name: "Axis Bank", code: "AXIS" },
    { id: "pnb", name: "Punjab National Bank", code: "PNB" },
  ];

  const upiApps = [
    { id: "gpay", name: "Google Pay", icon: "🌐" },
    { id: "phonepe", name: "PhonePe", icon: "📱" },
    { id: "paytm", name: "Paytm UPI", icon: "⚡" },
    { id: "bhim", name: "BHIM UPI", icon: "🇮🇳" },
  ];

  const handleCardNumberChange = (e) => {
    // Format card number with spaces every 4 digits
    const clean = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = clean.replace(/(\d{4})(?=\d)/g, "$1 ");
    onUpdatePaymentDetails({ ...paymentDetails, cardNumber: formatted });
  };

  const handleExpiryChange = (e) => {
    const clean = e.target.value.replace(/\D/g, "").slice(0, 4);
    const formatted = clean.length > 2 ? `${clean.slice(0, 2)}/${clean.slice(2)}` : clean;
    onUpdatePaymentDetails({ ...paymentDetails, cardExpiry: formatted });
  };

  const handleCvvChange = (e) => {
    const clean = e.target.value.replace(/\D/g, "").slice(0, 3);
    onUpdatePaymentDetails({ ...paymentDetails, cardCvv: clean });
  };

  return (
    <section className="payment-methods-card" aria-label="Payment Options">
      <div className="methods-card-header">
        <h2>Select Payment Method</h2>
        <span className="secure-badge" aria-label="Mock secure checkout">
          <span className="lock-icon" aria-hidden="true">🔒</span>
          Secure Checkout Demo
        </span>
      </div>

      <div className="methods-accordion">
        {/* ===================================================================
            Option 1: UPI
            =================================================================== */}
        <div className={`method-panel ${selectedMethod === "upi" ? "active" : ""}`}>
          <label className="method-header-label">
            <input
              type="radio"
              name="paymentMethod"
              value="upi"
              checked={selectedMethod === "upi"}
              onChange={() => onSelectMethod("upi")}
            />
            <span className="clay-radio-circle" />
            <span className="method-title-wrap">
              <span className="method-main-title">
                <span className="method-icon-badge" aria-hidden="true">⚡</span>
                UPI (Instant & Free)
              </span>
              <span className="method-sub-desc">Google Pay, PhonePe, Paytm, QR</span>
            </span>
            <span className="method-badge-fast">Fastest</span>
          </label>

          {selectedMethod === "upi" && (
            <div className="method-content-body">
              {/* Quick UPI App Selector */}
              <div className="upi-apps-row" role="radiogroup" aria-label="Choose UPI Application">
                {upiApps.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    className={`upi-app-chip ${activeUpiApp === app.id ? "selected" : ""}`}
                    onClick={() => {
                      setActiveUpiApp(app.id);
                      onUpdatePaymentDetails({
                        ...paymentDetails,
                        upiApp: app.name,
                      });
                    }}
                    role="radio"
                    aria-checked={activeUpiApp === app.id}
                  >
                    <span className="app-icon" aria-hidden="true">{app.icon}</span>
                    <span className="app-name">{app.name}</span>
                  </button>
                ))}
              </div>

              {/* Or Enter UPI ID */}
              <div className="upi-input-block">
                <label htmlFor="upi-id-input" className="input-field-label">
                  Or enter UPI ID / VPA
                </label>
                <div className="clay-input-box">
                  <input
                    id="upi-id-input"
                    type="text"
                    placeholder="e.g. mobileNumber@upi or user@okhdfcbank"
                    value={paymentDetails.upiId || ""}
                    onChange={(e) =>
                      onUpdatePaymentDetails({
                        ...paymentDetails,
                        upiId: e.target.value,
                      })
                    }
                  />
                  <span className="verified-pill">Demo Mode</span>
                </div>
                <small className="field-hint">
                  A mock payment request will be sent to your UPI app for approval.
                </small>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            Option 2: Credit / Debit Card
            =================================================================== */}
        <div className={`method-panel ${selectedMethod === "card" ? "active" : ""}`}>
          <label className="method-header-label">
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={selectedMethod === "card"}
              onChange={() => onSelectMethod("card")}
            />
            <span className="clay-radio-circle" />
            <span className="method-title-wrap">
              <span className="method-main-title">
                <span className="method-icon-badge" aria-hidden="true">💳</span>
                Credit / Debit Card
              </span>
              <span className="method-sub-desc">Visa, Mastercard, RuPay, Maestro</span>
            </span>
          </label>

          {selectedMethod === "card" && (
            <div className="method-content-body">
              <div className="card-form-grid">
                {/* Card Number */}
                <div className="form-field full-width">
                  <label htmlFor="card-number" className="input-field-label">
                    Card Number
                  </label>
                  <div className="clay-input-box">
                    <input
                      id="card-number"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={paymentDetails.cardNumber || ""}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                    />
                    <span className="card-brand-badge" aria-hidden="true">💳 Card</span>
                  </div>
                </div>

                {/* Cardholder Name */}
                <div className="form-field full-width">
                  <label htmlFor="card-name" className="input-field-label">
                    Cardholder Name
                  </label>
                  <div className="clay-input-box">
                    <input
                      id="card-name"
                      type="text"
                      placeholder="Name as printed on card"
                      value={paymentDetails.cardName || ""}
                      onChange={(e) =>
                        onUpdatePaymentDetails({
                          ...paymentDetails,
                          cardName: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {/* Expiry Date */}
                <div className="form-field half-width">
                  <label htmlFor="card-expiry" className="input-field-label">
                    Valid Thru (MM/YY)
                  </label>
                  <div className="clay-input-box">
                    <input
                      id="card-expiry"
                      type="text"
                      placeholder="MM/YY"
                      value={paymentDetails.cardExpiry || ""}
                      onChange={handleExpiryChange}
                      maxLength={5}
                    />
                  </div>
                </div>

                {/* CVV */}
                <div className="form-field half-width">
                  <label htmlFor="card-cvv" className="input-field-label">
                    CVV / CVC
                  </label>
                  <div className="clay-input-box">
                    <input
                      id="card-cvv"
                      type="password"
                      placeholder="•••"
                      value={paymentDetails.cardCvv || ""}
                      onChange={handleCvvChange}
                      maxLength={3}
                    />
                    <span className="cvv-hint" title="3-digit security code on card back">?</span>
                  </div>
                </div>
              </div>

              <div className="mock-card-notice">
                <span className="notice-icon" aria-hidden="true">ℹ️</span>
                <span>Demo card inputs. Do NOT enter genuine bank account or card information.</span>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            Option 3: Net Banking
            =================================================================== */}
        <div className={`method-panel ${selectedMethod === "netbanking" ? "active" : ""}`}>
          <label className="method-header-label">
            <input
              type="radio"
              name="paymentMethod"
              value="netbanking"
              checked={selectedMethod === "netbanking"}
              onChange={() => onSelectMethod("netbanking")}
            />
            <span className="clay-radio-circle" />
            <span className="method-title-wrap">
              <span className="method-main-title">
                <span className="method-icon-badge" aria-hidden="true">🏦</span>
                Net Banking
              </span>
              <span className="method-sub-desc">All major Indian banks supported</span>
            </span>
          </label>

          {selectedMethod === "netbanking" && (
            <div className="method-content-body">
              <span className="sub-heading-label">Popular Banks</span>
              <div className="banks-grid" role="radiogroup" aria-label="Select Bank">
                {popularBanks.map((bank) => (
                  <button
                    key={bank.id}
                    type="button"
                    className={`bank-chip-btn ${paymentDetails.selectedBank === bank.code ? "selected" : ""}`}
                    onClick={() =>
                      onUpdatePaymentDetails({
                        ...paymentDetails,
                        selectedBank: bank.code,
                      })
                    }
                    role="radio"
                    aria-checked={paymentDetails.selectedBank === bank.code}
                  >
                    <span className="bank-logo" aria-hidden="true">🏛️</span>
                    <span className="bank-name">{bank.code}</span>
                  </button>
                ))}
              </div>

              <div className="other-banks-row">
                <label htmlFor="all-banks-select" className="input-field-label">
                  Or choose other bank
                </label>
                <div className="clay-select-box">
                  <select
                    id="all-banks-select"
                    value={paymentDetails.selectedBank || ""}
                    onChange={(e) =>
                      onUpdatePaymentDetails({
                        ...paymentDetails,
                        selectedBank: e.target.value,
                      })
                    }
                  >
                    <option value="">Select from all banks</option>
                    <option value="SBI">State Bank of India (SBI)</option>
                    <option value="HDFC">HDFC Bank</option>
                    <option value="ICICI">ICICI Bank</option>
                    <option value="AXIS">Axis Bank</option>
                    <option value="PNB">Punjab National Bank</option>
                    <option value="BOB">Bank of Baroda</option>
                    <option value="CANARA">Canara Bank</option>
                    <option value="UBI">Union Bank of India</option>
                    <option value="IDBI">IDBI Bank</option>
                    <option value="BANDHAN">Bandhan Bank</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            Option 4: Mobile Wallets
            =================================================================== */}
        <div className={`method-panel ${selectedMethod === "wallet" ? "active" : ""}`}>
          <label className="method-header-label">
            <input
              type="radio"
              name="paymentMethod"
              value="wallet"
              checked={selectedMethod === "wallet"}
              onChange={() => onSelectMethod("wallet")}
            />
            <span className="clay-radio-circle" />
            <span className="method-title-wrap">
              <span className="method-main-title">
                <span className="method-icon-badge" aria-hidden="true">👛</span>
                Mobile Wallets
              </span>
              <span className="method-sub-desc">Amazon Pay, Paytm Wallet, Mobikwik</span>
            </span>
          </label>

          {selectedMethod === "wallet" && (
            <div className="method-content-body">
              <div className="wallet-options-row">
                {["Amazon Pay", "Paytm Wallet", "Mobikwik"].map((walletName) => (
                  <button
                    key={walletName}
                    type="button"
                    className={`wallet-chip-btn ${paymentDetails.walletName === walletName ? "selected" : ""}`}
                    onClick={() =>
                      onUpdatePaymentDetails({
                        ...paymentDetails,
                        walletName,
                      })
                    }
                  >
                    <span className="wallet-icon" aria-hidden="true">💰</span>
                    <span>{walletName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
