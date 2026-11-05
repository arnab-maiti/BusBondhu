export default function SeatItem({
  seat,
  isSelected,
  onToggle,
  disabled,
}) {
  const isBooked = seat.isUnavailable;

  const handleClick = () => {
    if (isBooked || disabled) return;
    onToggle(seat);
  };

  const getAriaLabel = () => {
    if (isBooked) return `Seat ${seat.id}, ${seat.type}, Unavailable`;
    if (isSelected) return `Seat ${seat.id}, ${seat.type}, Selected`;
    return `Seat ${seat.id}, ${seat.type}, Available`;
  };

  return (
    <button
      type="button"
      className={`clay-seat-btn ${
        isBooked ? "seat-unavailable" : isSelected ? "seat-selected" : "seat-available"
      }`}
      onClick={handleClick}
      disabled={isBooked}
      aria-pressed={isSelected}
      aria-label={getAriaLabel()}
      title={
        isBooked
          ? `Seat ${seat.id} (${seat.type}) - Booked`
          : `Seat ${seat.id} (${seat.type}) - Click to select`
      }
    >
      <span className="seat-headrest" aria-hidden="true" />
      <span className="seat-id">{seat.id}</span>
      {isSelected && <span className="seat-check" aria-hidden="true">✓</span>}
      {isBooked && <span className="seat-booked-cross" aria-hidden="true">✕</span>}
    </button>
  );
}
