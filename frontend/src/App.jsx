
import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const socket = io(API_BASE_URL, {
  autoConnect: false,
  reconnection: true,
});

const mapCenter = [22.5726, 88.3639];

const busIcon = L.divIcon({
  className: "bus-pin-wrapper",
  html: '<span class="bus-pin" aria-hidden="true">🚌</span>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

function MapLayout({ bus, layoutKey }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => window.clearTimeout(timer);
  }, [map, layoutKey]);

  useEffect(() => {
    if (bus) {
      map.setView(
        [bus.latitude, bus.longitude],
        Math.max(map.getZoom(), 14)
      );
    }
  }, [bus, map]);

  return null;
}

function TrackingMap({ bus, layoutKey, large = false }) {
  return (
    <MapContainer
      center={bus ? [bus.latitude, bus.longitude] : mapCenter}
      zoom={bus ? 13 : 9}
      className={large ? "map live-map" : "map"}
      aria-label="Bus tracking map"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapLayout bus={bus} layoutKey={layoutKey} />

      {bus && (
        <Marker
          position={[bus.latitude, bus.longitude]}
          icon={busIcon}
        >
          <Popup>
            <strong>{bus.busNumber || "Tracked bus"}</strong>
            {Number.isFinite(bus.speed) && (
              <>
                <br />
                Reported speed: {bus.speed} km/h
              </>
            )}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

function getTimestamp(data) {
  const value =
    data?.recordedAt ??
    data?.timestamp ??
    data?.updatedAt;

  if (value === undefined || value === null) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function normalizeLocation(data, busNumber) {
  if (
    !Number.isFinite(Number(data?.latitude)) ||
    !Number.isFinite(Number(data?.longitude))
  ) {
    return null;
  }

  const latitude = Number(data.latitude);
  const longitude = Number(data.longitude);

  if (
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    ...data,
    latitude,
    longitude,
    busNumber: data.busNumber || busNumber || "Tracked bus",
    speed:
      data.speed == null ? null : Number(data.speed),
  };
}

function useTracking() {
  const [bus, setBus] = useState(null);
  const [buses, setBuses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState(null);
  const [connection, setConnection] = useState("connecting");
  const [busListError, setBusListError] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");
  const [gpsTimestamp, setGpsTimestamp] = useState(null);
  const [now, setNow] = useState(Date.now());

  const selectedBusIdRef = useRef(null);

  // Keep the latest selected ID available to the persistent socket listener.
  selectedBusIdRef.current = selectedBusId;

  // Load the real bus list from the backend.
  useEffect(() => {
    let cancelled = false;

    async function loadBuses() {
      try {
        setBusListError("");

        const response = await fetch(
          `${API_BASE_URL}/api/buses?page=1&limit=100`
        );

        if (!response.ok) {
          throw new Error(`Bus list request failed: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success || !Array.isArray(result.data)) {
          throw new Error("Invalid bus list response");
        }

        if (cancelled) return;

        setBuses(result.data);

        setSelectedBusId((currentId) => {
          const stillExists = result.data.some(
            (item) => item.id === currentId
          );

          return stillExists
            ? currentId
            : result.data[0]?.id ?? null;
        });
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load buses:", error);
          setBusListError(
            "Unable to load buses. Check that the backend is running."
          );
        }
      }
    }

    loadBuses();

    return () => {
      cancelled = true;
    };
  }, []);

  // Connect once and register the socket listeners.
  useEffect(() => {
    const onConnect = () => {
      setConnection("connected");
      setSubscriptionError("");
    };

    const onDisconnect = () => {
      setConnection("unavailable");
    };

    const onConnectError = (error) => {
      console.error("Socket connection failed:", error.message);
      setConnection("unavailable");
    };

    const onLocationUpdate = (data) => {
      if (Number(data?.busId) !== selectedBusIdRef.current) {
        return;
      }

      const selectedBus = busesRef.current.find(
        (item) => item.id === selectedBusIdRef.current
      );

      const location = normalizeLocation(
        data,
        selectedBus?.busNumber
      );

      if (!location) return;

      setBus(location);
      setGpsTimestamp(getTimestamp(location));
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("busLocationUpdated", onLocationUpdate);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("busLocationUpdated", onLocationUpdate);

      socket.disconnect();
    };
  }, []);

  // Keep the current bus list accessible to the socket listener.
  const busesRef = useRef(buses);
  busesRef.current = buses;

  // Show the selected bus's last stored location while waiting for live GPS.
  useEffect(() => {
    if (selectedBusId === null) {
      setBus(null);
      setGpsTimestamp(null);
      setSubscriptionError("");
      return;
    }

    const selectedBus = buses.find(
      (item) => item.id === selectedBusId
    );

    if (!selectedBus) return;

    if (selectedBus.latestLocation) {
      const location = normalizeLocation(
        {
          ...selectedBus.latestLocation,
          busId: selectedBus.id,
          busNumber: selectedBus.busNumber,
        },
        selectedBus.busNumber
      );

      if (location) {
        setBus(location);
        setGpsTimestamp(getTimestamp(location));
      } else {
        setBus(null);
        setGpsTimestamp(null);
      }
    } else {
      setBus(null);
      setGpsTimestamp(null);
    }

    setSubscriptionError("");
  }, [selectedBusId, buses]);

  // Subscribe to only the selected bus; repeat after reconnects.
  useEffect(() => {
    if (selectedBusId === null || !socket.connected) {
      return;
    }

    let active = true;
    const busId = selectedBusId;

    socket.emit("subscribeToBus", busId, (result) => {
      if (!active) return;

      if (!result?.success) {
        setSubscriptionError(
          result?.message || "Unable to subscribe to this bus."
        );
        console.error("Bus subscription failed:", result);
      } else {
        setSubscriptionError("");
      }
    });

    return () => {
      active = false;

      if (socket.connected) {
        socket.emit("unsubscribeFromBus", busId);
      }
    };
  }, [selectedBusId, connection]);

  // Refresh the stale-location indicator periodically.
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  return {
    bus,
    buses,
    selectedBusId,
    setSelectedBusId,
    connection,
    busListError,
    subscriptionError,
    gpsTimestamp,
    stale: Boolean(
      gpsTimestamp && now - gpsTimestamp > 120000
    ),
  };
}

function ConnectionBadge({ connection, stale }) {
  const label = stale
    ? "Location may be stale"
    : connection === "connecting"
      ? "Connecting to tracking"
      : connection === "connected"
        ? "Tracking connected"
        : "Tracking unavailable";

  const tone =
    !stale && connection === "connected" ? "online" : "offline";

  return (
    <span className={`connection-status ${tone}`}>
      <span aria-hidden="true">●</span> {label}
    </span>
  );
}

function BusSelector({ tracking }) {
  return (
    <label className="bus-selector">
      <span>Select bus</span>
      <select
        value={tracking.selectedBusId ?? ""}
        onChange={(event) => {
          const value = event.target.value;

          tracking.setSelectedBusId(
            value === "" ? null : Number(value)
          );
        }}
      >
        <option value="">Choose a bus</option>

        {tracking.buses.map((item) => (
          <option key={item.id} value={item.id}>
            {item.busNumber}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function App() {
  const [page, setPage] = useState(() =>
    window.location.hash === "#/tracking"
      ? "tracking"
      : "dashboard"
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [journey, setJourney] = useState({ from: "", to: "" });
  const [searchMessage, setSearchMessage] = useState("");

  const tracking = useTracking();

  useEffect(() => {
    const onHash = () => {
      setPage(
        window.location.hash === "#/tracking"
          ? "tracking"
          : "dashboard"
      );
    };

    window.addEventListener("hashchange", onHash);

    return () => {
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const navigate = (next) => {
    window.location.hash =
      next === "tracking" ? "/tracking" : "/";
    setMenuOpen(false);
  };

  const search = (event) => {
    event.preventDefault();

    setSearchMessage(
      !journey.from.trim() || !journey.to.trim()
        ? "Enter both a starting point and destination to plan a journey."
        : "Journey planning is not available yet. No route results have been shown."
    );
  };

  const layoutKey = `${page}-${menuOpen}`;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="#/"
          onClick={() => navigate("dashboard")}
          aria-label="BusBondhu home"
        >
          <span className="brand-mark">B</span>
          <span>BusBondhu</span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span aria-hidden="true">☰</span>
        </button>

        <nav
          id="primary-navigation"
          className={menuOpen ? "nav-links open" : "nav-links"}
          aria-label="Primary navigation"
        >
          <a href="#/" onClick={() => navigate("dashboard")}>
            Dashboard
          </a>

          <a
            href="#/tracking"
            onClick={() => navigate("tracking")}
          >
            Live tracking
          </a>

          {page === "dashboard" && (
            <a
              href="#journey"
              onClick={() => setMenuOpen(false)}
            >
              Plan a journey
            </a>
          )}
        </nav>
      </header>

      {page === "tracking" ? (
        <main className="live-page">
          <div className="live-heading">
            <div>
              <p className="eyebrow">LIVE TRACKING</p>
              <h1>Follow reported service locations</h1>
              <p>
                Only locations received from the tracking feed appear
                on this map.
              </p>
            </div>

            <ConnectionBadge
              connection={tracking.connection}
              stale={tracking.stale}
            />
          </div>

          <BusSelector tracking={tracking} />

          {tracking.busListError && (
            <p className="form-message" role="alert">
              {tracking.busListError}
            </p>
          )}

          {tracking.subscriptionError && (
            <p className="form-message" role="alert">
              {tracking.subscriptionError}
            </p>
          )}

          <div className="live-layout">
            <section className="live-map-panel">
              <TrackingMap
                bus={tracking.bus}
                layoutKey={layoutKey}
                large
              />

              <p className="map-notice">
                Use the map controls to explore. A marker appears
                when a valid location is available.
              </p>
            </section>

            <aside className="selected-bus-panel" aria-live="polite">
              {tracking.bus ? (
                <>
                  <p className="eyebrow">SELECTED BUS</p>
                  <h2>{tracking.bus.busNumber || "Tracked bus"}</h2>

                  <dl>
                    <div>
                      <dt>Reported position</dt>
                      <dd className="coordinates">
                        {tracking.bus.latitude.toFixed(5)},{" "}
                        {tracking.bus.longitude.toFixed(5)}
                      </dd>
                    </div>

                    {Number.isFinite(tracking.bus.speed) && (
                      <div>
                        <dt>Reported speed</dt>
                        <dd>
                          {tracking.bus.speed} <small>km/h</small>
                        </dd>
                      </div>
                    )}

                    {tracking.gpsTimestamp && (
                      <div>
                        <dt>Last GPS update</dt>
                        <dd className="timestamp">
                          {new Date(
                            tracking.gpsTimestamp
                          ).toLocaleString()}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {tracking.stale && (
                    <p className="tracking-warning">
                      This location is older than two minutes based
                      on its supplied timestamp.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="eyebrow">SELECTED BUS</p>
                  <h2>
                    {tracking.selectedBusId === null
                      ? "Choose a bus"
                      : "No location received"}
                  </h2>

                  <p className="panel-copy">
                    {tracking.connection === "connecting"
                      ? "Connecting to the tracking service…"
                      : tracking.connection !== "connected"
                        ? "The tracking service is unavailable. Reconnect to receive bus locations."
                        : "No valid location is currently available for this bus."}
                  </p>
                </>
              )}
            </aside>
          </div>
        </main>
      ) : (
        <main id="top">
          <section className="hero" aria-labelledby="hero-title">
            <div className="hero-copy">
              <p className="eyebrow">
                WEST BENGAL PUBLIC TRANSPORT
              </p>

              <h1 id="hero-title">
                Move through your city with confidence.
              </h1>

              <p className="hero-description">
                Plan your next bus journey and keep an eye on tracked
                services from one clear, dependable place.
              </p>

              <div className="hero-trust">
                ✦ Passenger information, designed for the journey ahead
              </div>
            </div>

            <form
              className="journey-card"
              id="journey"
              onSubmit={search}
              noValidate
            >
              <div className="journey-heading">
                <div>
                  <p className="eyebrow">JOURNEY PLANNER</p>
                  <h2>Where are you going?</h2>
                </div>

                <span className="planner-badge">Plan</span>
              </div>

              <label>
                <span>From</span>
                <input
                  value={journey.from}
                  onChange={(event) =>
                    setJourney({
                      ...journey,
                      from: event.target.value,
                    })
                  }
                  placeholder="Enter a stop or area"
                />
              </label>

              <label>
                <span>To</span>
                <input
                  value={journey.to}
                  onChange={(event) =>
                    setJourney({
                      ...journey,
                      to: event.target.value,
                    })
                  }
                  placeholder="Where would you like to go?"
                />
              </label>

              <button className="primary-button" type="submit">
                Search journeys →
              </button>

              {searchMessage && (
                <p className="form-message" role="status">
                  {searchMessage}
                </p>
              )}
            </form>
          </section>

          <section className="overview" aria-label="Service overview">
            <article className="overview-card">
              <div className="card-icon">⌖</div>

              <div>
                <p className="eyebrow">TRACK A SERVICE</p>
                <h2>See the latest reported bus position</h2>
                <p>
                  Open the dedicated map to monitor updates from the
                  tracking feed.
                </p>
              </div>

              <a
                className="text-link"
                href="#/tracking"
                onClick={() => navigate("tracking")}
              >
                Open live map →
              </a>
            </article>

            <article className="overview-card">
              <div className="card-icon card-icon-blue">↗</div>

              <div>
                <p className="eyebrow">JOURNEY PLANNING</p>
                <h2>Find your best way forward</h2>
                <p>
                  Search is ready for connection when route-planning
                  data becomes available.
                </p>
              </div>

              <a className="text-link" href="#journey">
                Start a search →
              </a>
            </article>
          </section>

          <section className="tracking-section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">SERVICE MONITOR</p>
                <h2>Tracking preview</h2>
                <p>
                  Map markers only appear after a valid tracking
                  location is available.
                </p>
              </div>

              <ConnectionBadge
                connection={tracking.connection}
                stale={tracking.stale}
              />
            </div>

            <div className="tracking-grid">
              <div className="map-panel">
                <TrackingMap
                  bus={tracking.bus}
                  layoutKey={layoutKey}
                />

                <p className="map-notice">
                  Map tiles © OpenStreetMap contributors.
                </p>
              </div>

              <aside className="service-panel">
                <p className="eyebrow">CURRENT SERVICE</p>

                <h3>
                  {tracking.bus?.busNumber || "Awaiting location"}
                </h3>

                <p className="panel-copy">
                  {tracking.bus
                    ? "A reported bus location is available on the map."
                    : "No valid bus location has been received."}
                </p>

                <a
                  className="text-link"
                  href="#/tracking"
                  onClick={() => navigate("tracking")}
                >
                  Open live tracking →
                </a>
              </aside>
            </div>
          </section>

          <section className="empty-section">
            <div>
              <p className="eyebrow">LOCAL INFORMATION</p>
              <h2>Nearby stops</h2>
              <p>
                Stop and popular-route data has not been connected to
                this dashboard yet.
              </p>
            </div>

            <div className="empty-state">
              <span>⌖</span>
              <p>No nearby stop data available</p>
              <small>
                Connect an approved stops data source to show results
                here.
              </small>
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer">
        <span>© 2026 BusBondhu</span>
        <span>Passenger information for West Bengal</span>
      </footer>
    </div>
  );
}
