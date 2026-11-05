import { useState, useMemo } from "react";
import PassengerCard from "./PassengerCard";
import ContactSection from "./ContactSection";
import BookingSummarySidebar from "./BookingSummarySidebar";
import PassengerConfirmationModal from "./PassengerConfirmationModal";
import "./Passengers.css";

const FALLBACK_BOOKING = {
  tripId: "BB-101",
  operatorName: "SBSTC Express (Demo)",
  busType: "Volvo AC Seater (2+2)",
  origin: "Kolkata (Esplanade)",
  destination: "Durgapur (City Centre)",
  departureTime: "07:30 AM",
  date: "Today",
  seats: ["1A", "1B"],
  passengerCount: 2,
  farePerSeat: 480,
  baseFare: 960,
  taxesAndFees: 48,
  totalAmount: 1008,
  totalFare: 1008,
  isDemoFallback: true,
};

export default function PassengerDetailsPage({
  bookingData,
  onNavigate,
}) {
  // Graceful fallback if booking state is missing (Requirement 7 & 8)
  const isDemoFallback = !bookingData || !bookingData.seats || bookingData.seats.length === 0;
  const activeBooking = isDemoFallback ? FALLBACK_BOOKING : bookingData;

  // Initialize passenger form states based on seats count
  const seatsList = activeBooking.seats || ["1A"];
  
  const [passengers, setPassengers] = useState(() =>
    seatsList.map((seatId) => ({
      seatId,
      fullName: "",
      age: "",
      gender: "",
    }))
  );

  const [contact, setContact] = useState({
    email: "",
    phone: "",
  });

  const [passengerErrors, setPassengerErrors] = useState(() =>
    seatsList.map(() => ({}))
  );

  const [contactErrors, setContactErrors] = useState({});
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);

  // Field change handlers
  const handlePassengerChange = (index, field, value) => {
    setPassengers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear error for that field if valid
    setPassengerErrors((prev) => {
      const updated = [...prev];
      const fieldErrors = { ...updated[index] };

      if (field === "fullName" && value.trim().length >= 2) {
        delete fieldErrors.fullName;
      }
      if (field === "age") {
        const num = parseInt(value, 10);
        if (num >= 1 && num <= 120) delete fieldErrors.age;
      }
      if (field === "gender" && value) {
        delete fieldErrors.gender;
      }

      updated[index] = fieldErrors;
      return updated;
    });
  };

  const handleContactChange = (field, value) => {
    setContact((prev) => ({ ...prev, [field]: value }));

    // Clear error if valid
    setContactErrors((prev) => {
      const updated = { ...prev };
      if (field === "email" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        delete updated.email;
      }
      if (field === "phone" && /^\d{10}$/.test(value.trim())) {
        delete updated.phone;
      }
      return updated;
    });
  };

  // Validate all inputs and compute validity
  const validateAll = () => {
    let isValid = true;

    // Validate each passenger
    const newPassengerErrors = passengers.map((p) => {
      const errors = {};
      if (!p.fullName || p.fullName.trim().length < 2) {
        errors.fullName = "Name is required (min 2 characters)";
        isValid = false;
      }
      const ageNum = parseInt(p.age, 10);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        errors.age = "Age must be between 1 and 120";
        isValid = false;
      }
      if (!p.gender) {
        errors.gender = "Please select a gender";
        isValid = false;
      }
      return errors;
    });

    // Validate contact info
    const newContactErrors = {};
    if (!contact.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
      newContactErrors.email = "Please enter a valid email address";
      isValid = false;
    }
    if (!contact.phone || !/^\d{10}$/.test(contact.phone.trim())) {
      newContactErrors.phone = "Enter a valid 10-digit mobile number";
      isValid = false;
    }

    setPassengerErrors(newPassengerErrors);
    setContactErrors(newContactErrors);

    return isValid;
  };

  // Check if form is currently valid without showing errors
  const isFormValid = useMemo(() => {
    const allPassengersFilled = passengers.every(
      (p) =>
        p.fullName.trim().length >= 2 &&
        parseInt(p.age, 10) >= 1 &&
        parseInt(p.age, 10) <= 120 &&
        Boolean(p.gender)
    );

    const contactFilled =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) &&
      /^\d{10}$/.test(contact.phone.trim());

    return allPassengersFilled && contactFilled;
  }, [passengers, contact]);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!validateAll()) {
      return;
    }

    // Form is valid! Open Phase 4 completion modal (Requirement 6)
    setIsConfirmationOpen(true);
  };

  const handleBackToSeats = () => {
    if (activeBooking?.tripId) {
      onNavigate("seats", { tripId: activeBooking.tripId });
    } else {
      onNavigate("search");
    }
  };

  return (
    <main className="passengers-page-container">
      {/* Top Header & Breadcrumb */}
      <div className="passengers-top-bar">
        <button
          type="button"
          className="back-nav-btn"
          onClick={handleBackToSeats}
          aria-label="Back to seat selection"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Seat Selection</span>
        </button>

        <div className="booking-stepper-pill">
          <span className="step-complete">1. Search ✓</span>
          <span className="step-arrow">›</span>
          <span className="step-complete">2. Seats ✓</span>
          <span className="step-arrow">›</span>
          <span className="step-active">3. Passengers</span>
        </div>
      </div>

      {/* Development Fallback Alert Notice */}
      {isDemoFallback && (
        <div className="fallback-banner" role="status">
          <span className="banner-badge">DEMO FALLBACK</span>
          <p>
            No active seat selection was found from a previous step (direct visit or refresh). 
            Displaying development fallback data for <strong>{activeBooking.origin} → {activeBooking.destination}</strong> (Seats {seatsList.join(", ")}).
          </p>
        </div>
      )}

      <header className="passengers-page-heading">
        <span className="heading-eyebrow">PASSENGER INFORMATION</span>
        <h1>Enter Passenger Details</h1>
        <p className="heading-subtext">
          Please provide details for each passenger as printed on official photo ID.
        </p>
      </header>

      {/* Main Two-Column Grid: Passenger Forms + Booking Summary Sidebar */}
      <div className="passengers-main-grid">
        {/* Left Column: Passenger Cards & Contact Section */}
        <div className="forms-column">
          <form onSubmit={handleSubmit} noValidate>
            <div className="passenger-cards-stack">
              {passengers.map((passenger, idx) => (
                <PassengerCard
                  key={passenger.seatId || idx}
                  passengerIndex={idx}
                  seatId={passenger.seatId}
                  passengerData={passenger}
                  errors={passengerErrors[idx] || {}}
                  onChange={(field, val) => handlePassengerChange(idx, field, val)}
                />
              ))}
            </div>

            <ContactSection
              contactData={contact}
              errors={contactErrors}
              onChange={handleContactChange}
            />
          </form>
        </div>

        {/* Right Column: Order Summary & Continue CTA */}
        <div className="summary-column">
          <BookingSummarySidebar
            bookingData={activeBooking}
            isFormValid={isFormValid}
            onSubmit={handleSubmit}
            isDemoFallback={isDemoFallback}
          />
        </div>
      </div>

      {/* Confirmation Modal upon Form Submission */}
      {isConfirmationOpen && (
        <PassengerConfirmationModal
          bookingData={activeBooking}
          passengersList={passengers}
          contactData={contact}
          onClose={() => setIsConfirmationOpen(false)}
          onNavigate={onNavigate}
        />
      )}
    </main>
  );
}
