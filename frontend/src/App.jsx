
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
import SearchResultsPage from "./components/Search/SearchResultsPage";
import SeatSelectionPage from "./components/Seats/SeatSelectionPage";
import PassengerDetailsPage from "./components/Passengers/PassengerDetailsPage";
import PaymentPage from "./components/Payment/PaymentPage";
import ConfirmationPage from "./components/Confirmation/ConfirmationPage";
import LoginPage from "./components/Auth/LoginPage";
import RegisterPage from "./components/Auth/RegisterPage";
import MyBookingsPage from "./components/Bookings/MyBookingsPage";
import BusTrackingPage from "./components/Tracking/BusTrackingPage";

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
  const [now, setNow] = useState(() => Date.now());

  const selectedBusIdRef = useRef(null);
  const busesRef = useRef([]);

  useEffect(() => {
    selectedBusIdRef.current = selectedBusId;
  }, [selectedBusId]);

  useEffect(() => {
    busesRef.current = buses;
  }, [buses]);

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


function getPageFromHash() {
  const hash = window.location.hash;
  if (hash.startsWith("#/my-bookings")) return "my-bookings";
  if (hash.startsWith("#/login")) return "login";
  if (hash.startsWith("#/register")) return "register";
  if (hash.startsWith("#/booking/payment")) return "payment";
  if (hash.startsWith("#/booking/passengers")) return "passengers";
  if (hash.match(/^#\/booking\/([^/?#]+)/)) return "confirmation";
  if (hash.startsWith("#/trips/") && hash.includes("/seats")) return "seats";
  if (hash.startsWith("#/search")) return "search";
  if (hash.startsWith("#/track")) return "track";
  if (hash.startsWith("#/tracking")) return "track";
  return "dashboard";
}

function getTrackTripIdFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/track\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getBookingIdFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/booking\/([^/?#]+)/);
  if (match && match[1] !== "payment" && match[1] !== "passengers") {
    return match[1];
  }
  return null;
}

function getTripIdFromHash() {
  const hash = window.location.hash;
  const match = hash.match(/^#\/trips\/([^/?#]+)\/seats/);
  return match ? match[1] : "BB-101";
}

function getSearchQueryFromHash() {
  const hash = window.location.hash;
  if (hash.includes("?")) {
    const queryString = hash.split("?")[1];
    const params = new URLSearchParams(queryString);
    return {
      from: params.get("from") || "Kolkata",
      to: params.get("to") || "Durgapur",
      date: params.get("date") || new Date().toISOString().split("T")[0],
      passengers: Number(params.get("passengers")) || 1,
    };
  }
  return {
    from: "Kolkata",
    to: "Durgapur",
    date: new Date().toISOString().split("T")[0],
    passengers: 1,
  };
}

export default function App() {
  const [page, setPage] = useState(getPageFromHash);
  const [tripId, setTripId] = useState(getTripIdFromHash);
  const [trackTripId, setTrackTripId] = useState(getTrackTripIdFromHash);
  const [bookingId, setBookingId] = useState(getBookingIdFromHash);
  const [searchQuery, setSearchQuery] = useState(getSearchQueryFromHash);
  const [bookingData, setBookingData] = useState(() => {
    try {
      const saved = sessionStorage.getItem("bb_booking_data");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const saveBookingData = (data) => {
    setBookingData(data);
    try {
      if (data) {
        sessionStorage.setItem("bb_booking_data", JSON.stringify(data));
      } else {
        sessionStorage.removeItem("bb_booking_data");
      }
    } catch (e) {
      console.error("Failed to save booking data to sessionStorage", e);
    }
  };

  const [menuOpen, setMenuOpen] = useState(false);
  const [journey, setJourney] = useState({ from: "", to: "" });
  const [searchMessage, setSearchMessage] = useState("");

  const tracking = useTracking();

  useEffect(() => {
    const onHash = () => {
      const newPage = getPageFromHash();
      setPage(newPage);
      if (newPage === "track") {
        setTrackTripId(getTrackTripIdFromHash());
      }
      if (newPage === "search") {
        setSearchQuery(getSearchQueryFromHash());
      }
      if (newPage === "seats") {
        setTripId(getTripIdFromHash());
      }
      if (newPage === "confirmation") {
        setBookingId(getBookingIdFromHash());
        try {
          const saved = sessionStorage.getItem("bb_booking_data");
          if (saved) setBookingData(JSON.parse(saved));
        } catch {
          // handled gracefully
        }
      }
      if (newPage === "passengers" || newPage === "payment") {
        try {
          const saved = sessionStorage.getItem("bb_booking_data");
          if (saved) setBookingData(JSON.parse(saved));
        } catch {
          // handled gracefully
        }
      }
    };

    window.addEventListener("hashchange", onHash);

    return () => {
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  const navigate = (next, queryParams = null) => {
    if (next === "my-bookings") {
      window.location.hash = "/my-bookings";
    } else if (next === "login") {
      window.location.hash = "/login";
    } else if (next === "register") {
      window.location.hash = "/register";
    } else if (next === "confirmation") {
      const id =
        queryParams?.bookingId ||
        (typeof queryParams === "string" ? queryParams : "DEMO-CONF-829103");
      if (queryParams && typeof queryParams === "object") {
        saveBookingData(queryParams);
      }
      window.location.hash = `/booking/${id}`;
    } else if (next === "payment") {
      if (queryParams) {
        saveBookingData(queryParams);
      }
      window.location.hash = "/booking/payment";
    } else if (next === "passengers") {
      if (queryParams) {
        saveBookingData(queryParams);
      }
      window.location.hash = "/booking/passengers";
    } else if (next === "seats") {
      const id = queryParams?.tripId || "BB-101";
      window.location.hash = `/trips/${id}/seats`;
    } else if (next === "search") {
      if (queryParams) {
        const searchStr = new URLSearchParams(queryParams).toString();
        window.location.hash = `/search?${searchStr}`;
      } else {
        window.location.hash = "/search";
      }
    } else if (next === "track" || next === "tracking") {
      const id =
        queryParams?.tripId ||
        (typeof queryParams === "string" ? queryParams : "");
      if (queryParams && typeof queryParams === "object") {
        saveBookingData(queryParams);
      }
      window.location.hash = id ? `/track/${encodeURIComponent(id)}` : "/track";
    } else {
      window.location.hash = "/";
    }
    setMenuOpen(false);
  };

  const search = (event) => {
    event.preventDefault();

    if (!journey.from.trim() || !journey.to.trim()) {
      setSearchMessage(
        "Enter both a starting point and destination to plan a journey."
      );
      return;
    }

    setSearchMessage("");
    navigate("search", {
      from: journey.from.trim(),
      to: journey.to.trim(),
    });
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
          <span className="brand-text">
            <span className="brand-title">BusBondhu</span>
            <span className="brand-tagline">Bengal Transit</span>
          </span>
        </a>

        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Toggle navigation</span>
          <span aria-hidden="true">{menuOpen ? "✕" : "☰"}</span>
        </button>

        <nav
          id="primary-navigation"
          className={menuOpen ? "nav-links open" : "nav-links"}
          aria-label="Primary navigation"
        >
          <a
            href="#/"
            className={page === "dashboard" ? "active" : ""}
            onClick={() => navigate("dashboard")}
          >
            Dashboard
          </a>

          <a
            href="#/search"
            className={page === "search" ? "active" : ""}
            onClick={() => navigate("search")}
          >
            Find Buses
          </a>

          <a
            href="#/my-bookings"
            className={page === "my-bookings" ? "active" : ""}
            onClick={() => navigate("my-bookings")}
          >
            My Bookings
          </a>

          <a
            href="#/track"
            className={page === "track" ? "active" : ""}
            onClick={() => navigate("track")}
          >
            Live tracking
          </a>

          <a
            href="#/login"
            className={page === "login" || page === "register" ? "active" : ""}
            onClick={() => navigate("login")}
          >
            Sign in
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

      {page === "my-bookings" ? (
        <MyBookingsPage onNavigate={navigate} />
      ) : page === "login" ? (
        <LoginPage onNavigate={navigate} />
      ) : page === "register" ? (
        <RegisterPage onNavigate={navigate} />
      ) : page === "confirmation" ? (
        <ConfirmationPage
          bookingId={bookingId}
          bookingData={bookingData}
          onNavigate={navigate}
        />
      ) : page === "payment" ? (
        <PaymentPage
          bookingData={bookingData}
          onNavigate={navigate}
        />
      ) : page === "passengers" ? (
        <PassengerDetailsPage
          bookingData={bookingData}
          onNavigate={navigate}
        />
      ) : page === "seats" ? (
        <SeatSelectionPage
          tripId={tripId}
          onNavigate={navigate}
        />
      ) : page === "search" ? (
        <SearchResultsPage
          initialQuery={searchQuery}
          onNavigate={navigate}
        />
      ) : page === "track" ? (
        <BusTrackingPage
          tripId={trackTripId}
          tracking={tracking}
          bookingData={bookingData}
          onNavigate={navigate}
        />
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
                href="#/track"
                onClick={() => navigate("track")}
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
                  Explore scheduled bus departures, compare fares, and
                  check seat availability across operators.
                </p>
              </div>

              <a
                className="text-link"
                href="#/search"
                onClick={() => navigate("search")}
              >
                Find bus routes →
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
                  href="#/track"
                  onClick={() => navigate("track")}
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
