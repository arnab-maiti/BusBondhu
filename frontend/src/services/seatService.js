/**
 * BusBondhu Seat Availability Service
 * 
 * Provides seat layout and availability fixtures for the Seat Selection UI.
 * In Phase 3, this returns clearly labeled development fixtures for UI demonstration.
 * Never presents fixture availability as live inventory.
 */

export const SEAT_FIXTURE_NOTICE = 
  "Development fixture: Seat availability and layout shown below are for UI demonstration only and do not reflect live booking inventory.";

export const MAX_SEATS_PER_BOOKING = 6;

/**
 * Generate a deterministic bus seat map based on tripId
 */
export function getBusSeatLayout(tripId) {
  // Deterministic seed from tripId
  let hash = 0;
  for (let i = 0; i < (tripId || "").length; i++) {
    hash = (hash << 5) - hash + tripId.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);

  const rows = 10;
  const seats = [];

  for (let r = 1; r <= rows; r++) {
    // Left side: A (Window), B (Aisle)
    // Right side: C (Aisle), D (Window)
    const columns = [
      { col: "A", type: "Window", side: "left" },
      { col: "B", type: "Aisle", side: "left" },
      { col: "C", type: "Aisle", side: "right" },
      { col: "D", type: "Window", side: "right" },
    ];

    columns.forEach(({ col, type, side }) => {
      const seatNumber = `${r}${col}`;
      // Deterministically mark ~30% of seats as booked/unavailable
      const seedVal = (absHash + r * 17 + col.charCodeAt(0) * 11) % 100;
      const isUnavailable = seedVal < 32;

      seats.push({
        id: seatNumber,
        row: r,
        col,
        type,
        side,
        isUnavailable,
      });
    });
  }

  return {
    tripId: tripId || "TRIP-DEFAULT",
    rows,
    seats,
    totalSeats: seats.length,
    availableSeatsCount: seats.filter((s) => !s.isUnavailable).length,
    isDemoFixture: true,
    notice: SEAT_FIXTURE_NOTICE,
  };
}
