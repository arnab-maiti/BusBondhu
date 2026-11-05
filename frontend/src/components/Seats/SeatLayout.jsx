import SeatItem from "./SeatItem";

export default function SeatLayout({
  seatLayout,
  selectedSeats,
  onToggleSeat,
  isMaxReached,
}) {
  const { rows, seats } = seatLayout;

  // Group seats by row
  const rowList = [];
  for (let r = 1; r <= rows; r++) {
    const rowSeats = seats.filter((s) => s.row === r);
    rowList.push({
      rowNumber: r,
      leftSeats: rowSeats.filter((s) => s.side === "left"),
      rightSeats: rowSeats.filter((s) => s.side === "right"),
    });
  }

  return (
    <div className="bus-deck-card" aria-label="Bus Seating Layout">
      {/* Legend Banner */}
      <div className="seat-legend-row" aria-label="Seat Legend">
        <div className="legend-item">
          <span className="legend-badge legend-available" aria-hidden="true" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge legend-selected" aria-hidden="true">✓</span>
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <span className="legend-badge legend-unavailable" aria-hidden="true">✕</span>
          <span>Unavailable</span>
        </div>
      </div>

      {/* Bus Chassis Container */}
      <div className="bus-chassis">
        {/* Front of bus: Driver Cabin & Door */}
        <div className="bus-front-cabin">
          <div className="entry-door" title="Passenger Entry Door">
            <span className="door-text">ENTRY DOOR</span>
            <span className="door-icon" aria-hidden="true">🚪</span>
          </div>

          <div className="driver-area" title="Driver Cabin">
            <span className="driver-label">DRIVER</span>
            <span className="steering-wheel" aria-hidden="true">🛞</span>
          </div>
        </div>

        <div className="cabin-divider" aria-hidden="true" />

        {/* Rows of seats */}
        <div className="seats-grid-body">
          {rowList.map(({ rowNumber, leftSeats, rightSeats }) => (
            <div key={rowNumber} className="bus-seat-row">
              {/* Left pair (Window A, Aisle B) */}
              <div className="seat-pair left-pair">
                {leftSeats.map((seat) => (
                  <SeatItem
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.some((s) => s.id === seat.id)}
                    onToggle={onToggleSeat}
                    disabled={isMaxReached && !selectedSeats.some((s) => s.id === seat.id)}
                  />
                ))}
              </div>

              {/* Center Aisle */}
              <div className="bus-aisle" aria-hidden="true">
                <span className="row-num">{rowNumber}</span>
              </div>

              {/* Right pair (Aisle C, Window D) */}
              <div className="seat-pair right-pair">
                {rightSeats.map((seat) => (
                  <SeatItem
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.some((s) => s.id === seat.id)}
                    onToggle={onToggleSeat}
                    disabled={isMaxReached && !selectedSeats.some((s) => s.id === seat.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Rear of bus */}
        <div className="bus-rear-bumper">
          <span>REAR OF BUS</span>
        </div>
      </div>
    </div>
  );
}
