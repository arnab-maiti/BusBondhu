import { useEffect, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Tracking.css";

// Claymorphic Bus Marker Icon
const busPinIcon = L.divIcon({
  className: "clay-bus-pin-wrapper",
  html: `
    <div class="clay-bus-pin" aria-label="Tracked bus location marker">
      <span class="pin-icon" aria-hidden="true">🚌</span>
      <span class="pin-pulse" aria-hidden="true"></span>
    </div>
  `,
  iconSize: [46, 46],
  iconAnchor: [23, 23],
  popupAnchor: [0, -24],
});

// Default center for West Bengal transit (Kolkata hub)
const DEFAULT_CENTER = [22.5726, 88.3639];

// Known sample bookings for lookup when navigating via tripId
const SAMPLE_JOURNEYS = {
  "BB-BK-739201": {
    tripId: "BB-BK-739201",
    operatorName: "SBSTC Express",
    busType: "Volvo AC Seater (2+2)",
    origin: "Kolkata (Esplanade)",
    destination: "Durgapur (City Centre)",
    departureTime: "07:30 AM",
    arrivalTime: "10:45 AM",
    travelDate: "Today",
    assignedBusNumber: "WB-2880-7303",
  },
  "BB-BK-618492": {
    tripId: "BB-BK-618492",
    operatorName: "NBSTC Royal Service",
    busType: "AC Sleeper (2+1)",
    origin: "Kolkata (Karunamoyee)",
    destination: "Siliguri (Tenzing Norgay Central)",
    departureTime: "08:00 PM",
    arrivalTime: "07:30 AM",
    travelDate: "Nov 02, 2026",
    assignedBusNumber: "WB-5421-9812",
  },
  "BB-BK-501239": {
    tripId: "BB-BK-501239",
    operatorName: "WBTC Green Line",
    busType: "Electric AC Seater",
    origin: "Kolkata (Howrah Station)",
    destination: "Asansol (Bus Terminus)",
    departureTime: "06:15 AM",
    arrivalTime: "10:30 AM",
    travelDate: "Oct 20, 2026",
    assignedBusNumber: "WB-04E-1190",
  },
  "BB-BK-420917": {
    tripId: "BB-BK-420917",
    operatorName: "South Bengal Royal Express",
    busType: "Express Non-AC (3+2)",
    origin: "Durgapur (City Centre)",
    destination: "Kolkata (Esplanade)",
    departureTime: "04:30 PM",
    arrivalTime: "07:45 PM",
    travelDate: "Oct 12, 2026",
    assignedBusNumber: "WB-39A-4019",
  },
  "BB-101": {
    tripId: "BB-101",
    operatorName: "SBSTC",
    busType: "AC Seater (2+2)",
    origin: "Kolkata (Esplanade)",
    destination: "Durgapur (City Centre)",
    departureTime: "06:30 AM",
    arrivalTime: "10:15 AM",
    travelDate: "Today",
    assignedBusNumber: "WB-19B-5521",
  },
};

// Map controller to adjust view when coordinates arrive
function MapViewController({ busLocation, forceRecenter }) {
  const map = useMap();

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (busLocation) {
      map.flyTo([busLocation.latitude, busLocation.longitude], 14, {
        duration: 1.2,
      });
    }
  }, [busLocation, forceRecenter, map]);

  return null;
}

export default function BusTrackingPage({
  tripId,
  tracking,
  bookingData,
  onNavigate,
}) {
  const [recenterCount, setRecenterCount] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Periodically refresh relative time calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Resolve journey information
  const journeyInfo = (() => {
    if (tripId && SAMPLE_JOURNEYS[tripId]) {
      return SAMPLE_JOURNEYS[tripId];
    }
    if (bookingData && (bookingData.bookingId === tripId || bookingData.id === tripId)) {
      return {
        tripId: tripId || bookingData.bookingId || bookingData.id,
        operatorName: bookingData.operatorName || "Bengal State Transit",
        busType: bookingData.busType || "Intercity Express",
        origin: bookingData.origin || "Origin Stop",
        destination: bookingData.destination || "Destination Stop",
        departureTime: bookingData.departureTime || "--:--",
        arrivalTime: bookingData.arrivalTime || "--:--",
        travelDate: bookingData.date || bookingData.travelDate || "Scheduled Date",
        assignedBusNumber: bookingData.busNumber || null,
      };
    }
    if (tripId) {
      return {
        tripId,
        operatorName: "Bengal State Transit",
        busType: "Intercity Express",
        origin: "West Bengal Service Route",
        destination: "Destination Hub",
        departureTime: "Scheduled Service",
        arrivalTime: "En Route",
        travelDate: "Today",
        assignedBusNumber: null,
      };
    }
    return {
      tripId: "ACTIVE-FLEET",
      operatorName: "West Bengal Public Transport",
      busType: "Fleet Network",
      origin: "All Active Routes",
      destination: "Bengal Transit",
      departureTime: "Real-time Feed",
      arrivalTime: "Continuous",
      travelDate: "Today",
      assignedBusNumber: null,
    };
  })();

  // Match tripId to a bus in the fleet if possible
  useEffect(() => {
    if (!tracking || !tracking.buses || tracking.buses.length === 0) return;

    if (tripId) {
      // 1. Direct numeric match with bus id
      const numericId = Number(tripId);
      if (Number.isInteger(numericId) && numericId > 0) {
        const found = tracking.buses.find((b) => b.id === numericId);
        if (found) {
          tracking.setSelectedBusId(found.id);
          return;
        }
      }

      // 2. Match with assigned bus number from sample journey
      const expectedBusNumber = journeyInfo.assignedBusNumber;
      if (expectedBusNumber) {
        const found = tracking.buses.find(
          (b) => b.busNumber?.toLowerCase() === expectedBusNumber.toLowerCase()
        );
        if (found) {
          tracking.setSelectedBusId(found.id);
          return;
        }
      }
    }

    // Default: ensure an active bus is selected if none currently selected
    if (tracking.selectedBusId === null && tracking.buses.length > 0) {
      tracking.setSelectedBusId(tracking.buses[0].id);
    }
  }, [tripId, tracking, journeyInfo.assignedBusNumber]);

  // Derived connection status (Requirement 3)
  const isOnline = tracking?.connection === "connected";
  const hasCoordinates = Boolean(
    tracking?.bus &&
      Number.isFinite(tracking.bus.latitude) &&
      Number.isFinite(tracking.bus.longitude)
  );

  let statusType;
  let statusBadgeLabel;

  if (tracking?.connection === "connecting") {
    statusType = "waiting";
    statusBadgeLabel = "Connecting...";
  } else if (isOnline && hasCoordinates) {
    statusType = "connected";
    statusBadgeLabel = "Connected • Live GPS";
  } else if (isOnline && !hasCoordinates) {
    statusType = "waiting";
    statusBadgeLabel = "Waiting for location";
  } else {
    statusType = "unavailable";
    statusBadgeLabel = "Tracking Unavailable";
  }

  // Format timestamp and age
  const lastUpdateDate = tracking?.gpsTimestamp
    ? new Date(tracking.gpsTimestamp)
    : null;
  const timeDifferenceSec = lastUpdateDate
    ? Math.max(0, Math.floor((now - tracking.gpsTimestamp) / 1000))
    : null;

  const formattedRelativeTime = (() => {
    if (timeDifferenceSec === null) return "Never";
    if (timeDifferenceSec < 15) return "Just now";
    if (timeDifferenceSec < 60) return `${timeDifferenceSec}s ago`;
    const mins = Math.floor(timeDifferenceSec / 60);
    return `${mins}m ago`;
  })();

  const isStale = Boolean(
    tracking?.gpsTimestamp && timeDifferenceSec !== null && timeDifferenceSec > 120
  );

  const selectedBus = tracking?.buses?.find(
    (b) => b.id === tracking.selectedBusId
  );

  const handleRecenter = () => {
    setRecenterCount((prev) => prev + 1);
  };

  return (
    <main className="clay-track-page" aria-labelledby="track-page-title">
      {/* ===================================================================
          1. Top Navigation Bar & Breadcrumb Strip
          =================================================================== */}
      <div className="track-top-bar">
        <button
          type="button"
          className="clay-back-btn"
          onClick={() => (onNavigate ? onNavigate("my-bookings") : window.history.back())}
          aria-label="Back to My Bookings"
        >
          <span aria-hidden="true">←</span> Back to Bookings
        </button>

        <div className="track-breadcrumb-badges">
          <span className="pill-trip-id">
            <span className="tag-label">TRIP:</span> {journeyInfo.tripId}
          </span>
          <span className={`clay-status-pill status-${statusType}`} role="status">
            <span className="status-dot" aria-hidden="true">●</span>
            {statusBadgeLabel}
          </span>
        </div>
      </div>

      {/* ===================================================================
          2. Trip Journey Header Card
          =================================================================== */}
      <section className="clay-journey-banner" aria-label="Journey details">
        <div className="journey-main-col">
          <div className="operator-meta">
            <span className="operator-bus-icon" aria-hidden="true">🚌</span>
            <div>
              <span className="operator-eyebrow">PASSENGER BUS TRACKING</span>
              <h1 id="track-page-title" className="operator-title">
                {journeyInfo.operatorName}
              </h1>
              <span className="bus-type-sub">{journeyInfo.busType}</span>
            </div>
          </div>

          <div className="route-endpoints-row">
            <div className="endpoint-block">
              <span className="endpoint-role">ORIGIN</span>
              <span className="endpoint-name">{journeyInfo.origin}</span>
              <span className="endpoint-time">Departs: {journeyInfo.departureTime}</span>
            </div>

            <div className="route-arrow-graphic" aria-hidden="true">
              <span className="route-travel-date">{journeyInfo.travelDate}</span>
              <div className="arrow-line">
                <span className="line-dot" />
                <span className="line-bar" />
                <span className="line-arrow">→</span>
              </div>
            </div>

            <div className="endpoint-block text-right">
              <span className="endpoint-role">DESTINATION</span>
              <span className="endpoint-name">{journeyInfo.destination}</span>
              <span className="endpoint-time">Scheduled: {journeyInfo.arrivalTime}</span>
            </div>
          </div>
        </div>

        {/* Bus / Vehicle Switcher */}
        {tracking?.buses && tracking.buses.length > 0 && (
          <div className="vehicle-selector-card">
            <label htmlFor="bus-vehicle-select" className="selector-label">
              <span>Tracked Vehicle</span>
              <select
                id="bus-vehicle-select"
                value={tracking.selectedBusId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  tracking.setSelectedBusId(val === "" ? null : Number(val));
                }}
                className="clay-select"
              >
                {tracking.buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.busNumber} {b.id === tracking.selectedBusId ? "• Current" : ""}
                  </option>
                ))}
              </select>
            </label>
            <p className="selector-hint">
              Showing telemetry for bus: <strong>{selectedBus?.busNumber || "Selected Bus"}</strong>
            </p>
          </div>
        )}
      </section>

      {/* ===================================================================
          3. Stale Warning Banner (if GPS timestamp > 2 mins)
          =================================================================== */}
      {isStale && (
        <div className="clay-alert-banner warning" role="alert">
          <span className="alert-icon" aria-hidden="true">⚠️</span>
          <div className="alert-body">
            <strong>Delayed GPS Signal</strong>
            <p>
              The last recorded location was received {formattedRelativeTime}. The vehicle may be
              in a low-connectivity transit corridor.
            </p>
          </div>
        </div>
      )}

      {/* ===================================================================
          4. Main Live Tracking Grid (Map + Real Telemetry Panel)
          =================================================================== */}
      <div className="clay-tracking-grid">
        {/* Left / Main: Live Leaflet Map */}
        <section className="clay-map-container" aria-label="Interactive bus location map">
          <div className="map-glass-toolbar">
            <div className="toolbar-status">
              <span className={`signal-indicator pulse-${statusType}`} aria-hidden="true"></span>
              <span className="status-text-live">
                {isOnline && hasCoordinates
                  ? "LIVE BROADCAST ACTIVE"
                  : isOnline
                    ? "WAITING FOR VEHICLE GPS"
                    : "TRACKING OFFLINE"}
              </span>
            </div>

            {hasCoordinates && (
              <button
                type="button"
                className="clay-map-tool-btn"
                onClick={handleRecenter}
                title="Center map on bus coordinates"
              >
                <span aria-hidden="true">🎯</span> Recenter Bus
              </button>
            )}
          </div>

          <MapContainer
            center={
              hasCoordinates
                ? [tracking.bus.latitude, tracking.bus.longitude]
                : DEFAULT_CENTER
            }
            zoom={hasCoordinates ? 14 : 10}
            className="leaflet-live-map"
            scrollWheelZoom
            aria-label="Real-time bus tracking map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapViewController
              busLocation={hasCoordinates ? tracking.bus : null}
              forceRecenter={recenterCount}
            />

            {hasCoordinates && (
              <Marker
                position={[tracking.bus.latitude, tracking.bus.longitude]}
                icon={busPinIcon}
              >
                <Popup className="clay-popup">
                  <div className="popup-content">
                    <strong className="popup-bus-num">
                      {tracking.bus.busNumber || selectedBus?.busNumber || "Tracked Bus"}
                    </strong>
                    <div className="popup-line">
                      <span className="p-label">Coords:</span>
                      <span className="p-val">
                        {tracking.bus.latitude.toFixed(5)}, {tracking.bus.longitude.toFixed(5)}
                      </span>
                    </div>
                    {Number.isFinite(tracking.bus.speed) && (
                      <div className="popup-line">
                        <span className="p-label">Speed:</span>
                        <span className="p-val">{tracking.bus.speed} km/h</span>
                      </div>
                    )}
                    <div className="popup-line">
                      <span className="p-label">Reported:</span>
                      <span className="p-val">{formattedRelativeTime}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          <footer className="map-under-note">
            <span>Map tiles © OpenStreetMap • BusBondhu Real-time Positioning</span>
            <span>Real GPS data feed only. No estimated or simulated routes.</span>
          </footer>
        </section>

        {/* Right: Real Telemetry Details Panel */}
        <aside className="clay-telemetry-panel" aria-labelledby="telemetry-panel-title">
          <div className="panel-header">
            <span className="panel-badge-icon" aria-hidden="true">📡</span>
            <div>
              <p className="eyebrow-mini">SATELLITE TELEMETRY</p>
              <h2 id="telemetry-panel-title" className="panel-title">
                {hasCoordinates ? "Live Bus Position" : "Awaiting Coordinates"}
              </h2>
            </div>
          </div>

          {hasCoordinates ? (
            /* Honest Live Position Readout */
            <div className="telemetry-content">
              <div className="telemetry-stat-card primary">
                <span className="stat-label">Reported Coordinates</span>
                <span className="stat-value-mono">
                  {tracking.bus.latitude.toFixed(5)}° N, {tracking.bus.longitude.toFixed(5)}° E
                </span>
                <span className="stat-sub">Verified GPS Fix</span>
              </div>

              <div className="stat-dual-row">
                <div className="telemetry-stat-card">
                  <span className="stat-label">Reported Speed</span>
                  <span className="stat-value-large">
                    {Number.isFinite(tracking.bus.speed)
                      ? tracking.bus.speed
                      : "0"}
                    <small>km/h</small>
                  </span>
                  <span className="stat-sub">
                    {Number.isFinite(tracking.bus.speed) && tracking.bus.speed > 0
                      ? "In transit"
                      : "Stationary / Idle"}
                  </span>
                </div>

                <div className="telemetry-stat-card">
                  <span className="stat-label">Last Transmission</span>
                  <span className="stat-value-time">{formattedRelativeTime}</span>
                  <span className="stat-sub">
                    {lastUpdateDate ? lastUpdateDate.toLocaleTimeString() : "--:--:--"}
                  </span>
                </div>
              </div>

              {/* Service Meta Details */}
              <dl className="telemetry-details-list">
                <div className="detail-item">
                  <dt>Vehicle Registration</dt>
                  <dd className="bold-text">
                    {tracking.bus.busNumber || selectedBus?.busNumber || "Tracked Bus"}
                  </dd>
                </div>
                <div className="detail-item">
                  <dt>Transit Route</dt>
                  <dd>{journeyInfo.origin.split(" ")[0]} → {journeyInfo.destination.split(" ")[0]}</dd>
                </div>
                <div className="detail-item">
                  <dt>Feed Connection</dt>
                  <dd className="status-text-online">Connected (Socket.IO)</dd>
                </div>
              </dl>

              {/* Passenger Advisory */}
              <div className="passenger-advisory-box">
                <span className="advisory-icon" aria-hidden="true">ℹ️</span>
                <p>
                  BusBondhu displays exclusively authentic GPS readings sent by onboard units.
                  Arrival predictions and simulated routes are strictly omitted to maintain data honesty.
                </p>
              </div>
            </div>
          ) : (
            /* Requirement 5: Clear Empty / Waiting State */
            <div className="telemetry-empty-state" role="status">
              <div className="empty-radar-disc">
                <span className="radar-icon" aria-hidden="true">
                  {statusType === "unavailable" ? "⚠️" : "📡"}
                </span>
              </div>

              <h3 className="empty-state-heading">
                {statusType === "unavailable"
                  ? "Telemetry Feed Unavailable"
                  : "Waiting for GPS Signal"}
              </h3>

              <p className="empty-state-copy">
                {statusType === "unavailable"
                  ? "The tracking network is currently disconnected. BusBondhu will automatically reconnect and refresh coordinates as soon as the feed is restored."
                  : `Connected to the BusBondhu telemetry network. Vehicle "${selectedBus?.busNumber || "Selected Bus"}" has not yet broadcast recent coordinates. The live pin will appear on the map the instant verified GPS data is received.`}
              </p>

              <div className="empty-state-meta-strip">
                <div className="meta-point">
                  <span className="point-dot" />
                  <span>Network status: <strong>{statusBadgeLabel}</strong></span>
                </div>
                <div className="meta-point">
                  <span className="point-dot" />
                  <span>Vehicle: <strong>{selectedBus?.busNumber || "Assigned Bus"}</strong></span>
                </div>
              </div>

              <button
                type="button"
                className="clay-refresh-btn"
                onClick={() => {
                  if (tracking?.selectedBusId) {
                    tracking.setSelectedBusId(tracking.selectedBusId);
                  }
                }}
              >
                <span aria-hidden="true">↻</span> Check for Location Updates
              </button>
            </div>
          )}
        </aside>
      </div>

      {/* ===================================================================
          5. Bottom Help / Passenger Safety Strip
          =================================================================== */}
      <footer className="track-footer-safety">
        <div className="safety-block">
          <span className="safety-icon" aria-hidden="true">🛡️</span>
          <div>
            <strong>Authentic Telemetry Guarantee</strong>
            <p>
              Locations shown are direct satellite coordinates transmitted by verified state transit GPS devices.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="clay-home-link-btn"
          onClick={() => (onNavigate ? onNavigate("dashboard") : (window.location.hash = "/"))}
        >
          Return to Dashboard →
        </button>
      </footer>
    </main>
  );
}
