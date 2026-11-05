import { useState } from "react";
import PaymentMethods from "./PaymentMethods";
import PaymentSummary from "./PaymentSummary";
import DemoPaymentModal from "./DemoPaymentModal";
import "./Payment.css";

export default function PaymentPage({
  bookingData,
  onNavigate,
}) {
  const [selectedMethod, setSelectedMethod] = useState("upi");
  const [paymentDetails, setPaymentDetails] = useState({
    upiApp: "Google Pay",
    upiId: "",
    cardNumber: "",
    cardName: "",
    cardExpiry: "",
    cardCvv: "",
    selectedBank: "SBI",
    walletName: "Amazon Pay",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [validationError, setValidationError] = useState("");

  // Handle missing booking data gracefully (Requirement 7)
  if (!bookingData || !bookingData.seats || bookingData.seats.length === 0) {
    return (
      <main className="payment-page-container">
        <div className="missing-booking-card" role="alert">
          <div className="missing-icon-circle" aria-hidden="true">
            🎫
          </div>
          <h2>No Active Booking Found</h2>
          <p className="missing-desc">
            You don't have an active seat selection in this session. 
            Please search for a bus and choose your seats before proceeding to payment.
          </p>

          <div className="missing-actions-row">
            <button
              type="button"
              className="back-btn-secondary"
              onClick={() => onNavigate("dashboard")}
            >
              ← Go to Dashboard
            </button>
            <button
              type="button"
              className="back-btn-secondary"
              onClick={() => onNavigate("seats", { tripId: "BB-101" })}
            >
              ← Back to Seat Selection
            </button>
            <button
              type="button"
              className="back-btn-primary"
              onClick={() => onNavigate("search")}
            >
              Search Buses →
            </button>
          </div>
        </div>
      </main>
    );
  }

  const handlePayNow = () => {
    setValidationError("");

    // Validate that a payment method is selected (Requirement 5)
    if (!selectedMethod) {
      setValidationError("Please select a payment method before continuing.");
      return;
    }

    // Basic method validation
    if (selectedMethod === "card") {
      const cleanCard = (paymentDetails.cardNumber || "").replace(/\s/g, "");
      if (cleanCard.length < 16) {
        setValidationError("Please enter a valid 16-digit card number.");
        return;
      }
      if (!paymentDetails.cardExpiry || paymentDetails.cardExpiry.length < 5) {
        setValidationError("Please enter card expiry date (MM/YY).");
        return;
      }
      if (!paymentDetails.cardCvv || paymentDetails.cardCvv.length < 3) {
        setValidationError("Please enter the 3-digit CVV.");
        return;
      }
    } else if (selectedMethod === "upi") {
      if (paymentDetails.upiId && !paymentDetails.upiId.includes("@")) {
        setValidationError("Please enter a valid UPI ID (e.g. mobile@upi or username@bank).");
        return;
      }
    }

    // Simulate mock payment processing without charging money (Requirement 6)
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsDemoModalOpen(true);
    }, 600);
  };

  const handleBackToPrevious = () => {
    if (bookingData?.passengers && bookingData.passengers.length > 0) {
      onNavigate("passengers", bookingData);
    } else if (bookingData?.tripId) {
      onNavigate("seats", { tripId: bookingData.tripId });
    } else {
      onNavigate("search");
    }
  };

  const hasPassengers = Boolean(bookingData?.passengers && bookingData.passengers.length > 0);

  return (
    <main className="payment-page-container">
      {/* Top Header: Breadcrumb & Back navigation */}
      <div className="payment-top-bar">
        <button
          type="button"
          className="back-to-step-btn"
          onClick={handleBackToPrevious}
          aria-label="Back to previous booking step"
        >
          <span aria-hidden="true">←</span>
          <span>
            {hasPassengers ? "Back to Passenger Details" : "Back to Seat Selection"}
          </span>
        </button>

        <div className="step-tracker-pill">
          <span className="step-done">1. Search ✓</span>
          <span className="step-sep">›</span>
          <span className="step-done">2. Seats ✓</span>
          <span className="step-sep">›</span>
          <span className="step-done">3. Passengers ✓</span>
          <span className="step-sep">›</span>
          <span className="step-current">4. Payment</span>
        </div>
      </div>

      <header className="payment-page-heading">
        <span className="payment-eyebrow">CHECKOUT & BILLING</span>
        <h1>Payment & Confirmation</h1>
        <p className="payment-subtext">
          Review your journey details and choose your preferred payment method.
        </p>
      </header>

      {/* Two-Column Responsive Layout */}
      <div className="payment-main-grid">
        {/* Left Column: Payment Method Selection */}
        <div className="payment-left-col">
          <PaymentMethods
            selectedMethod={selectedMethod}
            onSelectMethod={(method) => {
              setSelectedMethod(method);
              setValidationError("");
            }}
            paymentDetails={paymentDetails}
            onUpdatePaymentDetails={setPaymentDetails}
          />
        </div>

        {/* Right Column: Booking Summary & Pay CTA */}
        <div className="payment-right-col">
          <PaymentSummary
            bookingData={bookingData}
            selectedMethod={selectedMethod}
            isProcessing={isProcessing}
            onPayNow={handlePayNow}
            validationError={validationError}
          />
        </div>
      </div>

      {/* Demo Modal when Pay Now is triggered */}
      {isDemoModalOpen && (
        <DemoPaymentModal
          bookingData={bookingData}
          selectedMethod={selectedMethod}
          paymentDetails={paymentDetails}
          onClose={() => setIsDemoModalOpen(false)}
          onNavigate={onNavigate}
        />
      )}
    </main>
  );
}
