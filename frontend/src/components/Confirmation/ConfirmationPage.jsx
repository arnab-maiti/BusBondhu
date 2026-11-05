import { useState } from "react";
import TicketCard from "./TicketCard";
import "./Confirmation.css";

const FALLBACK_TICKET_DATA = {
  bookingId: "DEMO-UNCONFIRMED",
  origin: "Kolkata (Esplanade)",
  destination: "Durgapur (City Centre)",
  operatorName: "SBSTC Express (Demo)",
  busType: "Volvo AC Seater (2+2)",
  departureTime: "07:30 AM",
  arrivalTime: "10:45 AM",
  duration: "3h 15m",
  date: "Today",
  seats: ["1A", "1B"],
  passengerCount: 2,
  passengers: [
    { seatId: "1A", fullName: "Demo Traveler 1", age: "28", gender: "male" },
    { seatId: "1B", fullName: "Demo Traveler 2", age: "25", gender: "female" },
  ],
  contact: {
    email: "passenger@example.com",
    phone: "9876543210",
  },
  farePerSeat: 480,
  baseFare: 960,
  taxesAndFees: 48,
  totalAmount: 1008,
  paymentMethod: "Demo Simulation",
  isDirectNavigation: true,
};

export default function ConfirmationPage({
  bookingId,
  bookingData,
  onNavigate,
}) {
  const [printFeedback, setPrintFeedback] = useState("");

  // Determine if this is a direct navigation / missing session data
  const isDirectNavigation =
    !bookingData ||
    !bookingData.seats ||
    bookingData.seats.length === 0;

  // Active ticket payload
  const activeTicket = isDirectNavigation
    ? {
        ...FALLBACK_TICKET_DATA,
        bookingId: bookingId || "DEMO-UNCONFIRMED",
        isDirectNavigation: true,
      }
    : {
        bookingId: bookingId || bookingData.bookingId || "DEMO-CONF-829103",
        origin: bookingData.origin || "Kolkata",
        destination: bookingData.destination || "Durgapur",
        operatorName: bookingData.operatorName || "SBSTC Express",
        busType: bookingData.busType || "Volvo AC Seater (2+2)",
        departureTime: bookingData.departureTime || "07:30 AM",
        arrivalTime: bookingData.arrivalTime || "10:45 AM",
        duration: bookingData.duration || "3h 15m",
        date: bookingData.date || "Today",
        seats: bookingData.seats || ["1A"],
        passengerCount: bookingData.passengerCount || bookingData.seats?.length || 1,
        passengers: bookingData.passengers || [],
        contact: bookingData.contact || {},
        farePerSeat: bookingData.farePerSeat || 480,
        baseFare: bookingData.baseFare || 480,
        taxesAndFees: bookingData.taxesAndFees || 24,
        totalAmount: bookingData.totalAmount || 504,
        paymentMethod:
          bookingData.selectedMethod === "upi"
            ? `UPI (${bookingData.paymentDetails?.upiApp || "Google Pay"})`
            : bookingData.selectedMethod === "card"
              ? "Credit / Debit Card (Demo)"
              : bookingData.selectedMethod === "netbanking"
                ? `Net Banking (${bookingData.paymentDetails?.selectedBank || "SBI"})`
                : "Simulation Payment",
        isDirectNavigation: false,
      };

  const handlePrint = () => {
    setPrintFeedback("Preparing print dialog...");
    setTimeout(() => {
      window.print();
      setPrintFeedback("");
    }, 200);
  };

  return (
    <main className="confirmation-page-container">
      {/* Top Navigation & Status Breadcrumb */}
      <div className="confirmation-top-bar no-print">
        <button
          type="button"
          className="back-home-pill-btn"
          onClick={() => onNavigate("dashboard")}
          aria-label="Back to home dashboard"
        >
          <span aria-hidden="true">🏠</span>
          <span>Back to Home</span>
        </button>

        <div className="stepper-track-pill" aria-label="Booking flow progress">
          <span className="step-passed">1. Search ✓</span>
          <span className="step-sep">›</span>
          <span className="step-passed">2. Seats ✓</span>
          <span className="step-sep">›</span>
          <span className="step-passed">3. Passengers ✓</span>
          <span className="step-sep">›</span>
          <span className="step-passed">4. Payment ✓</span>
          <span className="step-sep">›</span>
          <span className="step-current">5. E-ticket</span>
        </div>
      </div>

      {/* Prominent Truthful Status Banner (Requirements 2 & 7) */}
      <section
        className={`status-alert-banner no-print ${
          isDirectNavigation ? "banner-warning" : "banner-demo"
        }`}
        role="status"
        aria-label="Booking status message"
      >
        <div className="banner-icon-circle" aria-hidden="true">
          {isDirectNavigation ? "⚠️" : "🎫"}
        </div>
        <div className="banner-text-content">
          <div className="banner-badge-row">
            <span className="status-chip">
              {isDirectNavigation
                ? "DIRECT NAVIGATION / UNVERIFIED RECORD"
                : "DEMO CONFIRMATION PREVIEW"}
            </span>
            <span className="non-prod-tag">PHASE 6 FRONTEND PROTOTYPE</span>
          </div>
          <h2 className="banner-heading">
            {isDirectNavigation
              ? `Demonstration Preview for Booking #${activeTicket.bookingId}`
              : "Demo Booking Confirmation & E-ticket"}
          </h2>
          <p className="banner-desc">
            {isDirectNavigation
              ? "No live checkout session was detected for this URL. To avoid inventing reservations, this page displays demonstration fallback data. No ticket was created on any government or private transit database."
              : "This e-ticket is a development prototype and demonstration. No actual funds were charged, no seat was permanently reserved on the live transit network, and this pass cannot be used for boarding."}
          </p>
        </div>
      </section>

      {/* Quick Action Toolbar (Print / Home / Search) */}
      <div className="action-toolbar no-print">
        <div className="action-buttons-group">
          <button
            type="button"
            className="btn-print"
            onClick={handlePrint}
            aria-label="Print or Save as PDF"
          >
            <span aria-hidden="true">🖨️</span>
            <span>Print / Save as PDF</span>
          </button>

          <button
            type="button"
            className="btn-new-search"
            onClick={() => onNavigate("search")}
            aria-label="Search and book another bus"
          >
            <span aria-hidden="true">🔍</span>
            <span>Book Another Journey</span>
          </button>

          <button
            type="button"
            className="btn-dashboard"
            onClick={() => onNavigate("dashboard")}
            aria-label="Go to BusBondhu home dashboard"
          >
            <span>Home Dashboard →</span>
          </button>
        </div>

        {printFeedback && (
          <span className="print-hint" role="status">
            {printFeedback}
          </span>
        )}
      </div>

      {/* Center Ticket Card */}
      <div className="ticket-printable-container">
        <TicketCard ticketData={activeTicket} />
      </div>

      {/* Post-Booking Helpful Guidelines */}
      <section className="post-booking-faq no-print" aria-label="Journey FAQs">
        <h3 className="faq-title">Need help with your Bengal journey?</h3>
        <div className="faq-grid">
          <div className="faq-card">
            <h4>📱 SMS & WhatsApp Alerts</h4>
            <p>
              In a live service, your conductor contact number and bus tracking link are sent via SMS 30 minutes before boarding.
            </p>
          </div>
          <div className="faq-card">
            <h4>🧳 Luggage Policy</h4>
            <p>
              Up to 2 pieces of luggage (maximum 20kg per passenger) can be stored in the lower luggage deck at no extra fee.
            </p>
          </div>
          <div className="faq-card">
            <h4>📍 Live GPS Tracking</h4>
            <p>
              You can monitor real-time bus locations directly in the{" "}
              <button
                type="button"
                className="faq-link-btn"
                onClick={() =>
                  onNavigate("track", {
                    tripId: activeTicket.bookingId,
                    ...activeTicket,
                  })
                }
              >
                Live Tracking map
              </button>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
