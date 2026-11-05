import { useState } from "react";

export default function TicketCard({ ticketData }) {
  const {
    bookingId = "DEMO-TKT-000000",
    origin = "Kolkata",
    destination = "Durgapur",
    operatorName = "SBSTC Express",
    busType = "Volvo AC Seater (2+2)",
    departureTime = "07:30 AM",
    arrivalTime = "10:45 AM",
    duration = "3h 15m",
    date = "Today",
    seats = ["1A"],
    passengers = [],
    contact = {},
    baseFare = 480,
    taxesAndFees = 24,
    totalAmount = 504,
    paymentMethod = "UPI (Demo)",
    isDirectNavigation = false,
  } = ticketData || {};

  // Formatted issue date (pure useState initialization)
  const [issuedTimestamp] = useState(() => {
    return new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  return (
    <article className="eticket-wrapper" aria-label="E-ticket boarding slip">
      {/* Top Banner Warning */}
      <div className="ticket-top-badge-strip">
        <span className="strip-alert-icon" aria-hidden="true">⚠️</span>
        <span className="strip-alert-text">
          DEMO BOARDING SLIP — FOR PROTOTYPE DISPLAY ONLY • NOT A VALID TRANSIT PASS
        </span>
      </div>

      <div className="eticket-card">
        {/* ===================================================================
            Ticket Header
            =================================================================== */}
        <header className="ticket-header">
          <div className="ticket-brand">
            <span className="ticket-brand-mark">B</span>
            <div className="ticket-brand-text">
              <span className="ticket-brand-title">BusBondhu</span>
              <span className="ticket-brand-sub">Bengal Transit e-Ticket</span>
            </div>
          </div>

          <div className="ticket-ref-block">
            <span className="ticket-ref-label">Booking Reference</span>
            <span className="ticket-ref-id code-font">{bookingId}</span>
            <span className="ticket-issue-date">Issued: {issuedTimestamp}</span>
          </div>
        </header>

        {/* ===================================================================
            Journey Route & Timing Block
            =================================================================== */}
        <div className="ticket-journey-strip">
          <div className="journey-endpoint origin">
            <span className="station-city">{origin}</span>
            <span className="station-time">{departureTime}</span>
            <span className="station-label">Boarding Stop</span>
          </div>

          <div className="journey-duration-wrap">
            <span className="duration-pill">{duration}</span>
            <div className="duration-line" aria-hidden="true">
              <span className="line-dot" />
              <span className="line-bar" />
              <span className="line-bus">🚌</span>
              <span className="line-bar" />
              <span className="line-dot" />
            </div>
            <span className="travel-date">{date}</span>
          </div>

          <div className="journey-endpoint destination">
            <span className="station-city">{destination}</span>
            <span className="station-time">{arrivalTime}</span>
            <span className="station-label">Destination Stop</span>
          </div>
        </div>

        {/* Bus Service Meta Details */}
        <div className="ticket-bus-details">
          <div className="bus-detail-item">
            <span className="detail-label">Service Operator</span>
            <span className="detail-value bold">{operatorName}</span>
          </div>
          <div className="bus-detail-item">
            <span className="detail-label">Bus Category</span>
            <span className="detail-value">{busType}</span>
          </div>
          <div className="bus-detail-item">
            <span className="detail-label">Seats Reserved</span>
            <span className="detail-value seats-highlight">{seats.join(", ")}</span>
          </div>
          <div className="bus-detail-item">
            <span className="detail-label">Boarding Bay</span>
            <span className="detail-value">Bay 4 • Platform A</span>
          </div>
        </div>

        {/* ===================================================================
            Perforated Ticket Divider
            =================================================================== */}
        <div className="ticket-tear-line" aria-hidden="true">
          <span className="tear-notch notch-left" />
          <div className="tear-dashed-line" />
          <span className="tear-notch notch-right" />
        </div>

        {/* ===================================================================
            Passenger List & Contact Section
            =================================================================== */}
        <div className="ticket-middle-section">
          <div className="passengers-info-block">
            <h3 className="section-subheading">Passenger Details</h3>
            <div className="ticket-passengers-table">
              <div className="table-header-row">
                <span>Seat</span>
                <span>Name</span>
                <span>Age / Gender</span>
              </div>
              {passengers && passengers.length > 0 ? (
                passengers.map((p, idx) => (
                  <div key={idx} className="passenger-table-row">
                    <span className="seat-cell">{p.seatId || seats[idx] || "—"}</span>
                    <span className="name-cell bold">{p.fullName || `Passenger ${idx + 1}`}</span>
                    <span className="meta-cell">
                      {p.age ? `${p.age} yrs` : "—"} • {p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : "—"}
                    </span>
                  </div>
                ))
              ) : (
                seats.map((seatId, idx) => (
                  <div key={seatId} className="passenger-table-row">
                    <span className="seat-cell">{seatId}</span>
                    <span className="name-cell bold">Passenger {idx + 1}</span>
                    <span className="meta-cell">Seat Reservation Demo</span>
                  </div>
                ))
              )}
            </div>

            {contact && (contact.email || contact.phone) && (
              <div className="ticket-contact-pill">
                <span className="contact-icon" aria-hidden="true">✉️</span>
                <span>
                  Notification sent to <strong>{contact.email || "passenger@example.com"}</strong>
                  {contact.phone && ` • +91 ${contact.phone}`}
                </span>
              </div>
            )}
          </div>

          {/* ===================================================================
              Demo QR Code Block
              =================================================================== */}
          <div className="ticket-qr-block">
            <div className="qr-box-wrapper" title="Demo QR Code — Not for actual travel">
              {/* Scalable SVG representation of a transit QR code */}
              <svg
                viewBox="0 0 120 120"
                width="120"
                height="120"
                className="demo-qr-svg"
                role="img"
                aria-label="Demo QR code graphic"
              >
                {/* Background */}
                <rect width="120" height="120" fill="#FFFFFF" rx="8" />

                {/* Top-Left Finder Square */}
                <rect x="10" y="10" width="30" height="30" fill="#55372D" rx="4" />
                <rect x="16" y="16" width="18" height="18" fill="#FFFFFF" rx="2" />
                <rect x="20" y="20" width="10" height="10" fill="#55372D" rx="1" />

                {/* Top-Right Finder Square */}
                <rect x="80" y="10" width="30" height="30" fill="#55372D" rx="4" />
                <rect x="86" y="16" width="18" height="18" fill="#FFFFFF" rx="2" />
                <rect x="90" y="20" width="10" height="10" fill="#55372D" rx="1" />

                {/* Bottom-Left Finder Square */}
                <rect x="10" y="80" width="30" height="30" fill="#55372D" rx="4" />
                <rect x="16" y="86" width="18" height="18" fill="#FFFFFF" rx="2" />
                <rect x="20" y="90" width="10" height="10" fill="#55372D" rx="1" />

                {/* Timing patterns & decorative QR modules */}
                <rect x="46" y="14" width="6" height="6" fill="#55372D" />
                <rect x="58" y="14" width="6" height="6" fill="#55372D" />
                <rect x="68" y="14" width="6" height="6" fill="#55372D" />

                <rect x="14" y="46" width="6" height="6" fill="#55372D" />
                <rect x="14" y="58" width="6" height="6" fill="#55372D" />
                <rect x="14" y="68" width="6" height="6" fill="#55372D" />

                <rect x="46" y="46" width="8" height="8" fill="#C96535" />
                <rect x="66" y="46" width="8" height="8" fill="#55372D" />
                <rect x="56" y="58" width="8" height="8" fill="#55372D" />
                <rect x="46" y="70" width="8" height="8" fill="#55372D" />
                <rect x="66" y="70" width="8" height="8" fill="#C96535" />

                <rect x="82" y="50" width="6" height="6" fill="#55372D" />
                <rect x="94" y="50" width="6" height="6" fill="#55372D" />
                <rect x="82" y="66" width="6" height="6" fill="#55372D" />
                <rect x="102" y="66" width="6" height="6" fill="#55372D" />
                <rect x="92" y="82" width="6" height="6" fill="#55372D" />
                <rect x="104" y="94" width="6" height="6" fill="#55372D" />

                <rect x="46" y="90" width="6" height="6" fill="#55372D" />
                <rect x="58" y="90" width="6" height="6" fill="#55372D" />
                <rect x="68" y="100" width="6" height="6" fill="#55372D" />
              </svg>

              {/* Watermark badge over the QR */}
              <div className="qr-watermark-overlay">
                <span>DEMO QR</span>
              </div>
            </div>

            <div className="qr-caption-text">
              <span className="qr-label-bold">SIMULATION ONLY</span>
              <span className="qr-label-desc">Not valid for conductor verification or boarding.</span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            Fare Breakdown & Payment Mode Strip
            =================================================================== */}
        <footer className="ticket-fare-strip">
          <div className="fare-info-side">
            <div className="fare-meta-item">
              <span className="fare-lbl">Base Fare:</span>
              <span className="fare-num">₹{baseFare}</span>
            </div>
            <div className="fare-meta-item">
              <span className="fare-lbl">Taxes & GST:</span>
              <span className="fare-num">₹{taxesAndFees}</span>
            </div>
            <div className="fare-meta-item">
              <span className="fare-lbl">Payment Mode:</span>
              <span className="fare-mode-badge">{paymentMethod}</span>
            </div>
          </div>

          <div className="total-paid-box">
            <span className="total-paid-label">Total Simulated Amount</span>
            <span className="total-paid-price">₹{totalAmount}</span>
            <span className="payment-status-pill">
              {isDirectNavigation ? "UNVERIFIED PREVIEW" : "DEMO SIMULATED"}
            </span>
          </div>
        </footer>
      </div>

      {/* Ticket Footer Guidelines */}
      <div className="ticket-instructions-box">
        <h4>Traveler Notice (Bengal Transit Simulation)</h4>
        <ul>
          <li>This slip is an interface mockup produced for system verification.</li>
          <li>In a production environment, an SMS with the bus conductor PNR would be dispatched.</li>
          <li>Passengers are advised to reach the boarding bay 15 minutes prior to scheduled departure.</li>
        </ul>
      </div>
    </article>
  );
}
