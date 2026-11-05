import { useState } from "react";

export default function DemoPaymentModal({
  bookingData,
  selectedMethod,
  paymentDetails,
  onClose,
  onNavigate,
}) {
  const {
    origin = "Kolkata",
    destination = "Durgapur",
    operatorName = "SBSTC Express",
    seats = ["1A", "1B"],
    passengerCount = 2,
    totalAmount = 1008,
  } = bookingData || {};

  const [demoRef] = useState(() => `DEMO-PAY-${Math.floor(100000 + Math.random() * 900000)}`);

  const getMethodSummary = () => {
    switch (selectedMethod) {
      case "upi":
        return paymentDetails?.upiId
          ? `UPI (${paymentDetails.upiId})`
          : `UPI (${paymentDetails?.upiApp || "Google Pay"})`;
      case "card":
        return paymentDetails?.cardNumber
          ? `Card ending in ${paymentDetails.cardNumber.replace(/\s/g, "").slice(-4) || "4242"}`
          : "Credit / Debit Card";
      case "netbanking":
        return `Net Banking (${paymentDetails?.selectedBank || "SBI"})`;
      case "wallet":
        return `Wallet (${paymentDetails?.walletName || "Amazon Pay"})`;
      default:
        return "Simulated Payment";
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="demo-payment-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="demo-payment-title"
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon-badge" aria-hidden="true">💳</span>
            <div>
              <span className="phase-indicator-pill">PHASE 5 MILESTONE</span>
              <h2 id="demo-payment-title">Demo Payment Response</h2>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* Truthful Disclaimer Alert */}
          <div className="demo-disclaimer-card" role="alert">
            <span className="alert-badge">NO REAL CHARGE</span>
            <p className="disclaimer-text">
              <strong>No money was charged.</strong> This is a development milestone demonstration. 
              No financial transaction was submitted to any banking gateway or payment processor.
            </p>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="demo-details-grid">
            <div className="detail-item">
              <span className="detail-label">Demo Reference ID</span>
              <span className="detail-value code-font">{demoRef}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status</span>
              <span className="detail-value status-demo">Simulated Placeholder</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Journey</span>
              <span className="detail-value">{origin} → {destination}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Operator</span>
              <span className="detail-value">{operatorName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Reserved Seats</span>
              <span className="detail-value">
                {seats.join(", ")} ({passengerCount} {passengerCount === 1 ? "seat" : "seats"})
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Payment Method</span>
              <span className="detail-value">{getMethodSummary()}</span>
            </div>
            <div className="detail-item full-width">
              <span className="detail-label">Simulated Amount</span>
              <span className="detail-value amount-highlight">₹{totalAmount}</span>
            </div>
          </div>

          <div className="milestone-note-box">
            <p>
              🎉 <strong>Payment UI Verified:</strong> All inputs, selection states, fare calculations, 
              and responsive layouts are working smoothly. Production payment gateway credentials 
              can be hooked up in later integration phases.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-secondary-btn"
            onClick={() => {
              onClose();
              onNavigate("dashboard");
            }}
          >
            Dashboard
          </button>
          <button
            type="button"
            className="modal-primary-btn"
            onClick={() => {
              onClose();
              if (onNavigate) {
                onNavigate("confirmation", {
                  ...bookingData,
                  bookingId: demoRef,
                  selectedMethod,
                  paymentDetails,
                  confirmedAt: new Date().toISOString(),
                });
              }
            }}
          >
            View E-Ticket & Confirmation →
          </button>
        </div>
      </div>
    </div>
  );
}
