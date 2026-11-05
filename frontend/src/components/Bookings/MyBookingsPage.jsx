import { useState, useMemo } from "react";
import BookingCard from "./BookingCard";
import "./Bookings.css";

// Development Sample Fixtures (Requirement 5)
const SAMPLE_BOOKINGS_FIXTURE = [
  {
    id: "BB-BK-739201",
    operatorName: "SBSTC Express",
    busType: "Volvo AC Seater (2+2)",
    origin: "Kolkata (Esplanade)",
    destination: "Durgapur (City Centre)",
    departureTime: "07:30 AM",
    arrivalTime: "10:45 AM",
    duration: "3h 15m",
    travelDate: "Tomorrow, Oct 29, 2026",
    seats: ["1A", "1B"],
    passengerCount: 2,
    passengers: [
      { fullName: "Arnab Mukherjee", seatId: "1A", age: 29, gender: "male" },
      { fullName: "Priyanka Sen", seatId: "1B", age: 27, gender: "female" },
    ],
    contact: { email: "passenger@example.com", phone: "9876543210" },
    baseFare: 960,
    taxesAndFees: 48,
    totalAmount: 1008,
    status: "upcoming",
    statusLabel: "Upcoming • Scheduled",
    paymentMethod: "UPI (Google Pay)",
    isSampleFixture: true,
  },
  {
    id: "BB-BK-618492",
    operatorName: "NBSTC Royal Service",
    busType: "AC Sleeper (2+1)",
    origin: "Kolkata (Karunamoyee)",
    destination: "Siliguri (Tenzing Norgay Central)",
    departureTime: "08:00 PM",
    arrivalTime: "07:30 AM",
    duration: "11h 30m",
    travelDate: "Nov 02, 2026",
    seats: ["4A"],
    passengerCount: 1,
    passengers: [
      { fullName: "Arnab Mukherjee", seatId: "4A", age: 29, gender: "male" },
    ],
    contact: { email: "passenger@example.com", phone: "9876543210" },
    baseFare: 850,
    taxesAndFees: 43,
    totalAmount: 893,
    status: "upcoming",
    statusLabel: "Upcoming • Confirmed",
    paymentMethod: "Credit Card (HDFC)",
    isSampleFixture: true,
  },
  {
    id: "BB-BK-501239",
    operatorName: "WBTC Green Line",
    busType: "Electric AC Seater",
    origin: "Kolkata (Howrah Station)",
    destination: "Asansol (Bus Terminus)",
    departureTime: "06:15 AM",
    arrivalTime: "10:30 AM",
    duration: "4h 15m",
    travelDate: "Oct 20, 2026",
    seats: ["2B"],
    passengerCount: 1,
    passengers: [
      { fullName: "Arnab Mukherjee", seatId: "2B", age: 29, gender: "male" },
    ],
    contact: { email: "passenger@example.com", phone: "9876543210" },
    baseFare: 420,
    taxesAndFees: 21,
    totalAmount: 441,
    status: "completed",
    statusLabel: "Completed",
    paymentMethod: "UPI (PhonePe)",
    isSampleFixture: true,
  },
  {
    id: "BB-BK-420917",
    operatorName: "South Bengal Royal Express",
    busType: "Express Non-AC (3+2)",
    origin: "Durgapur (City Centre)",
    destination: "Kolkata (Esplanade)",
    departureTime: "04:30 PM",
    arrivalTime: "07:45 PM",
    duration: "3h 15m",
    travelDate: "Oct 12, 2026",
    seats: ["3C", "3D"],
    passengerCount: 2,
    passengers: [
      { fullName: "Arnab Mukherjee", seatId: "3C", age: 29, gender: "male" },
      { fullName: "Debanjan Das", seatId: "3D", age: 31, gender: "male" },
    ],
    contact: { email: "passenger@example.com", phone: "9876543210" },
    baseFare: 760,
    taxesAndFees: 38,
    totalAmount: 798,
    status: "cancelled",
    statusLabel: "Cancelled • Refund Processed",
    paymentMethod: "Net Banking (SBI)",
    isSampleFixture: true,
  },
];

export default function MyBookingsPage({ onNavigate }) {
  const [activeFilter, setActiveFilter] = useState("all");

  // Load session booking if one was created in this browser session
  const allBookings = useMemo(() => {
    let list = [...SAMPLE_BOOKINGS_FIXTURE];
    try {
      const saved = sessionStorage.getItem("bb_booking_data");
      if (saved) {
        const sessionBooking = JSON.parse(saved);
        if (sessionBooking && sessionBooking.seats && sessionBooking.seats.length > 0) {
          // Prepend as an active session booking card
          const currentSessionBooking = {
            id: sessionBooking.bookingId || "BB-BK-RECENT",
            operatorName: sessionBooking.operatorName || "SBSTC Express",
            busType: sessionBooking.busType || "Volvo AC Seater (2+2)",
            origin: sessionBooking.origin || "Kolkata",
            destination: sessionBooking.destination || "Durgapur",
            departureTime: sessionBooking.departureTime || "07:30 AM",
            arrivalTime: sessionBooking.arrivalTime || "10:45 AM",
            duration: sessionBooking.duration || "3h 15m",
            travelDate: sessionBooking.date || "Today",
            seats: sessionBooking.seats || ["1A"],
            passengerCount: sessionBooking.passengerCount || sessionBooking.seats?.length || 1,
            passengers: sessionBooking.passengers || [],
            contact: sessionBooking.contact || {},
            baseFare: sessionBooking.baseFare || 480,
            taxesAndFees: sessionBooking.taxesAndFees || 24,
            totalAmount: sessionBooking.totalAmount || 504,
            status: "upcoming",
            statusLabel: "Upcoming • Just Booked",
            paymentMethod: sessionBooking.selectedMethod === "upi"
              ? "UPI (Instant Transfer)"
              : sessionBooking.selectedMethod === "card"
                ? "Credit / Debit Card"
                : "Simulation Payment",
            isSessionBooking: true,
            isSampleFixture: false,
          };
          list = [currentSessionBooking, ...list];
        }
      }
    } catch {
      // handled gracefully
    }
    return list;
  }, []);

  // Filter bookings based on active tab
  const filteredBookings = useMemo(() => {
    if (activeFilter === "all") return allBookings;
    if (activeFilter === "upcoming") {
      return allBookings.filter((b) => b.status === "upcoming");
    }
    if (activeFilter === "completed") {
      return allBookings.filter((b) => b.status === "completed");
    }
    if (activeFilter === "cancelled") {
      return allBookings.filter((b) => b.status === "cancelled");
    }
    return allBookings;
  }, [allBookings, activeFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: allBookings.length,
      upcoming: allBookings.filter((b) => b.status === "upcoming").length,
      completed: allBookings.filter((b) => b.status === "completed").length,
      cancelled: allBookings.filter((b) => b.status === "cancelled").length,
    };
  }, [allBookings]);

  return (
    <main className="my-bookings-container">
      {/* Top Header & Breadcrumb */}
      <div className="bookings-top-bar">
        <button
          type="button"
          className="bookings-back-btn"
          onClick={() => onNavigate("dashboard")}
          aria-label="Back to home dashboard"
        >
          <span aria-hidden="true">←</span>
          <span>Back to Home</span>
        </button>

        <span className="bookings-pill-tag">PHASE 8 MILESTONE</span>
      </div>

      <header className="bookings-heading-section">
        <span className="bookings-eyebrow">PASSENGER JOURNEYS</span>
        <h1>My Bookings</h1>
        <p className="bookings-subtext">
          Review your scheduled trips, download e-tickets, and follow live Bengal transit buses.
        </p>
      </header>

      {/* Development Fixture Alert (Requirement 5) */}
      <section className="fixture-notice-card" role="status" aria-label="Development fixture notice">
        <span className="notice-icon-circle" aria-hidden="true">ℹ️</span>
        <div className="notice-text">
          <div className="notice-badge-row">
            <span className="notice-pill">DEVELOPMENT FIXTURE DATA</span>
            <span className="notice-subtag">NO LIVE API CONNECTION</span>
          </div>
          <p>
            Booking retrieval APIs are not connected in this phase. The records below are clearly labelled 
            <strong> demonstration sample fixtures</strong> for UI evaluation. Never assume these represent confirmed 
            reservations on the physical transit network.
          </p>
        </div>
      </section>

      {/* Filter Tabs (Requirement 3) */}
      <nav className="bookings-filter-nav" aria-label="Filter bookings by status">
        <button
          type="button"
          className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
          aria-selected={activeFilter === "all"}
          role="tab"
        >
          <span>All Journeys</span>
          <span className="tab-count">{counts.all}</span>
        </button>

        <button
          type="button"
          className={`filter-tab ${activeFilter === "upcoming" ? "active" : ""}`}
          onClick={() => setActiveFilter("upcoming")}
          aria-selected={activeFilter === "upcoming"}
          role="tab"
        >
          <span>Upcoming</span>
          <span className="tab-count count-green">{counts.upcoming}</span>
        </button>

        <button
          type="button"
          className={`filter-tab ${activeFilter === "completed" ? "active" : ""}`}
          onClick={() => setActiveFilter("completed")}
          aria-selected={activeFilter === "completed"}
          role="tab"
        >
          <span>Completed</span>
          <span className="tab-count">{counts.completed}</span>
        </button>

        <button
          type="button"
          className={`filter-tab ${activeFilter === "cancelled" ? "active" : ""}`}
          onClick={() => setActiveFilter("cancelled")}
          aria-selected={activeFilter === "cancelled"}
          role="tab"
        >
          <span>Cancelled</span>
          <span className="tab-count count-orange">{counts.cancelled}</span>
        </button>
      </nav>

      {/* Bookings List or Empty State (Requirements 2 & 6) */}
      {filteredBookings.length > 0 ? (
        <div className="bookings-cards-stack">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : (
        /* Friendly Empty State (Requirement 6) */
        <div className="bookings-empty-card" role="status">
          <div className="empty-icon-circle" aria-hidden="true">
            🎫
          </div>
          <h3>No {activeFilter !== "all" ? activeFilter : ""} bookings found</h3>
          <p className="empty-desc">
            {activeFilter === "upcoming"
              ? "You don't have any upcoming bus journeys scheduled right now."
              : activeFilter === "completed"
                ? "No completed journey history found in this sample dataset."
                : activeFilter === "cancelled"
                  ? "No cancelled bookings to show."
                  : "You don't have any bus bookings recorded yet."}
          </p>
          <div className="empty-actions">
            {activeFilter !== "all" && (
              <button
                type="button"
                className="empty-btn-secondary"
                onClick={() => setActiveFilter("all")}
              >
                View All Bookings
              </button>
            )}
            <button
              type="button"
              className="empty-btn-primary"
              onClick={() => onNavigate("search")}
            >
              Search Bus Routes →
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
