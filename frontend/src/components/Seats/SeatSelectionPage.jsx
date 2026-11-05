import { useState, useMemo } from "react";
import { getBusSeatLayout, MAX_SEATS_PER_BOOKING, SEAT_FIXTURE_NOTICE } from "../../services/seatService";
import SeatLayout from "./SeatLayout";
import "./Seats.css";

export default function SeatSelectionPage({ tripId, onNavigate }) {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [bookingNotice, setBookingNotice] = useState("");
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);

  // Load deterministic seat map for this trip
  const seatLayout = useMemo(() => getBusSeatLayout(tripId), [tripId]);

  // Trip details (derived from tripId or demo fallback)
  const tripDetails = useMemo(() => {
    // Extract operator or use default
    return {
      tripId: tripId || "BB-101",
      operatorName: tripId?.includes("ROYAL") ? "Royal Cruiser" : tripId?.includes("SHYAM") ? "Shyamoli Paribahan" : "SBSTC Express",
      busType: "Volvo AC Seater (2+2)",
      origin: "Kolkata (Esplanade)",
      destination: "Durgapur (City Centre)",
      departureTime: "07:30 AM",
      arrivalTime: "11:15 AM",
      duration: "3h 45m",
      baseFare: 480,
    };
  }, [tripId]);

  const isMaxReached = selectedSeats.length >= MAX_SEATS_PER_BOOKING;

  // Toggle seat selection
  const handleToggleSeat = (seat) => {
    setBookingNotice("");
    const alreadySelected = selectedSeats.some((s) => s.id === seat.id);

    if (alreadySelected) {
      setSelectedSeats((prev) => prev.filter((s) => s.id !== seat.id));
    } else {
      if (selectedSeats.length >= MAX_SEATS_PER_BOOKING) {
        setBookingNotice(`You can select a maximum of ${MAX_SEATS_PER_BOOKING} seats per journey.`);
        return;
      }
      setSelectedSeats((prev) => [...prev, seat]);
    }
  };

  const handleRemoveSeat = (seatId) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
    setBookingNotice("");
  };

  const totalFare = selectedSeats.length * tripDetails.baseFare;

  const handleContinue = () => {
    if (selectedSeats.length === 0) return;
    const bookingPayload = {
      tripId: tripDetails.tripId,
      operatorName: tripDetails.operatorName,
      busType: tripDetails.busType,
      origin: tripDetails.origin,
      destination: tripDetails.destination,
      departureTime: tripDetails.departureTime,
      arrivalTime: tripDetails.arrivalTime,
      duration: tripDetails.duration,
      date: new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
      seats: selectedSeats.map((s) => s.id),
      passengerCount: selectedSeats.length,
      farePerSeat: tripDetails.baseFare,
      baseFare: totalFare,
      taxesAndFees: Math.round(totalFare * 0.05),
      totalAmount: totalFare + Math.round(totalFare * 0.05),
    };
    if (onNavigate) {
      onNavigate("passengers", bookingPayload);
    } else {
      setIsCompletedModalOpen(true);
    }
  };

  return (
    <main className="seat-page-container">
      {/* Top Header: Back navigation & Trip Information */}
      <div className="seat-page-header">
        <button
          type="button"
          className="back-to-results-btn"
          onClick={() => onNavigate("search")}
          aria-label="Back to search results"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Search Results</span>
        </button>

        <div className="trip-summary-card">
          <div className="trip-header-main">
            <div>
              <span className="trip-eyebrow">SELECT YOUR SEATS</span>
              <h1 className="trip-title">
                {tripDetails.origin} → {tripDetails.destination}
              </h1>
              <p className="trip-operator-info">
                <strong>{tripDetails.operatorName}</strong> • {tripDetails.busType} • Departs at {tripDetails.departureTime}
              </p>
            </div>

            <div className="trip-fare-badge">
              <span className="fare-badge-label">Fare per Seat</span>
              <span className="fare-badge-amount">₹{tripDetails.baseFare}</span>
            </div>
          </div>

          {/* Development Fixture Notice */}
          <div className="fixture-notice-strip" role="status">
            <span className="fixture-chip">DEMO FIXTURE</span>
            <span>{SEAT_FIXTURE_NOTICE}</span>
          </div>
        </div>
      </div>

      {bookingNotice && (
        <div className="booking-notice-banner" role="alert">
          <span>⚠️ {bookingNotice}</span>
        </div>
      )}

      {/* Main Seating & Summary Grid */}
      <div className="seat-main-grid">
        {/* Left: Bus Seating Layout Deck */}
        <section className="bus-deck-section" aria-label="Seating deck">
          <div className="deck-header">
            <h2>Lower Deck (Seating Chart)</h2>
            <span className="available-count-pill">
              <strong>{seatLayout.availableSeatsCount}</strong> seats available
            </span>
          </div>

          <SeatLayout
            seatLayout={seatLayout}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            isMaxReached={isMaxReached}
          />
        </section>

        {/* Right: Booking Summary Card */}
        <aside className="booking-summary-sidebar" aria-label="Selected Seats Summary">
          <div className="summary-card-inner">
            <h2 className="summary-heading">Booking Summary</h2>

            {/* Selected Seats List */}
            <div className="selected-seats-box">
              <div className="box-title-row">
                <span className="box-label">Selected Seats</span>
                <span className="box-count">
                  {selectedSeats.length} / {MAX_SEATS_PER_BOOKING}
                </span>
              </div>

              {selectedSeats.length === 0 ? (
                <div className="no-seats-placeholder">
                  <span className="placeholder-icon" aria-hidden="true">💺</span>
                  <p>Click on any available seat in the bus layout to select it.</p>
                </div>
              ) : (
                <div className="selected-seats-chips">
                  {selectedSeats.map((seat) => (
                    <span key={seat.id} className="selected-chip">
                      <strong>Seat {seat.id}</strong> ({seat.type})
                      <button
                        type="button"
                        className="remove-chip-btn"
                        onClick={() => handleRemoveSeat(seat.id)}
                        aria-label={`Remove seat ${seat.id}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Fare Breakdown */}
            <div className="fare-breakdown-card">
              <div className="breakdown-row">
                <span>Base Fare ({selectedSeats.length} {selectedSeats.length === 1 ? "seat" : "seats"})</span>
                <span>₹{totalFare}</span>
              </div>
              <div className="breakdown-row sub">
                <span>GST & Transit Charges</span>
                <span>Included</span>
              </div>
              <div className="breakdown-divider" />
              <div className="breakdown-row total">
                <span>Total Payable</span>
                <span className="total-price">₹{totalFare}</span>
              </div>
            </div>

            {/* Continue Button */}
            <button
              type="button"
              className="continue-booking-btn"
              disabled={selectedSeats.length === 0}
              onClick={handleContinue}
              aria-disabled={selectedSeats.length === 0}
            >
              <span>{selectedSeats.length === 0 ? "Select at least 1 Seat" : `Continue with ${selectedSeats.length} ${selectedSeats.length === 1 ? "Seat" : "Seats"} →`}</span>
            </button>

            <p className="summary-trust-hint">
              🔒 Safe & contactless ticketing demo for Bengal transit.
            </p>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal when Continue is clicked */}
      {isCompletedModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCompletedModalOpen(false)} role="presentation">
          <div
            className="seat-modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
          >
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="modal-bus-icon" aria-hidden="true">🎟️</span>
                <div>
                  <h3 id="confirm-modal-title">Seats Selected Successfully</h3>
                  <p className="modal-subtitle">{tripDetails.operatorName} • {tripDetails.origin} → {tripDetails.destination}</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsCompletedModalOpen(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="selection-summary-box">
                <div className="summary-item">
                  <span className="summary-label">Selected Seats</span>
                  <span className="summary-value">
                    {selectedSeats.map((s) => s.id).join(", ")} ({selectedSeats.length} {selectedSeats.length === 1 ? "Seat" : "Seats"})
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Fare</span>
                  <span className="summary-value fare-highlight">
                    ₹{totalFare}
                  </span>
                </div>
              </div>

              <div className="phase-notice-box">
                <span className="phase-pill">PHASE 3 MILESTONE COMPLETED</span>
                <p>
                  Seat selection for this trip has been recorded. 
                  Passenger personal details, boarding point selection, and payment gateway integration will follow in the next milestone.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-secondary-btn"
                onClick={() => setIsCompletedModalOpen(false)}
              >
                Modify Seats
              </button>
              <button
                type="button"
                className="modal-primary-btn"
                onClick={() => {
                  setIsCompletedModalOpen(false);
                  const bookingPayload = {
                    tripId: tripDetails.tripId,
                    operatorName: tripDetails.operatorName,
                    busType: tripDetails.busType,
                    origin: tripDetails.origin,
                    destination: tripDetails.destination,
                    departureTime: tripDetails.departureTime,
                    arrivalTime: tripDetails.arrivalTime,
                    duration: tripDetails.duration,
                    date: new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
                    seats: selectedSeats.map((s) => s.id),
                    passengerCount: selectedSeats.length,
                    farePerSeat: tripDetails.baseFare,
                    baseFare: totalFare,
                    taxesAndFees: Math.round(totalFare * 0.05),
                    totalAmount: totalFare + Math.round(totalFare * 0.05),
                  };
                  if (onNavigate) {
                    onNavigate("passengers", bookingPayload);
                  }
                }}
              >
                Proceed to Passenger Details →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
