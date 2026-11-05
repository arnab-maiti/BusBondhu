import { useState, useEffect, useMemo, useCallback } from "react";
import { searchBuses } from "../../services/searchService";
import SearchHeader from "./SearchHeader";
import FilterPanel from "./FilterPanel";
import SortBar from "./SortBar";
import BusCard from "./BusCard";
import LoadingSkeleton from "./LoadingSkeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import SeatSelectionModal from "./SeatSelectionModal";
import MobileFilterDrawer from "./MobileFilterDrawer";
import "./SearchResults.css";

const DEFAULT_FILTERS = {
  departureTimes: [],
  busTypes: [],
  amenities: [],
  maxPrice: 700,
};

export default function SearchResultsPage({ initialQuery, onNavigate }) {
  const [searchParams, setSearchParams] = useState(() => {
    return {
      from: initialQuery?.from || "Kolkata",
      to: initialQuery?.to || "Durgapur",
      date: initialQuery?.date || new Date().toISOString().split("T")[0],
      passengers: Number(initialQuery?.passengers) || 1,
    };
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawResults, setRawResults] = useState([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("departure_asc");
  const [selectedBus, setSelectedBus] = useState(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [simulateErrorNext, setSimulateErrorNext] = useState(false);

  // Fetch bus schedules
  const performSearch = useCallback(async (params, triggerError = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await searchBuses({
        ...params,
        simulateError: triggerError,
      });
      setRawResults(data.results || []);
    } catch (err) {
      setError(err.message || "Failed to load bus schedules.");
      setRawResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    performSearch(searchParams, simulateErrorNext);
  }, [searchParams, performSearch, simulateErrorNext]);

  // Handle search bar modification
  const handleSearchSubmit = (newParams) => {
    setSearchParams(newParams);
    setFilters(DEFAULT_FILTERS); // Reset filters on new city search
  };

  // Filter logic
  const filteredBuses = useMemo(() => {
    return rawResults.filter((bus) => {
      // 1. Max price
      if (bus.fare > filters.maxPrice) {
        return false;
      }

      // 2. Departure time slot
      if (filters.departureTimes.length > 0) {
        const hour = parseInt(bus.departureTime.split(":")[0], 10);
        const matchesTime = filters.departureTimes.some((slot) => {
          if (slot === "morning") return hour >= 6 && hour < 12;
          if (slot === "afternoon") return hour >= 12 && hour < 18;
          if (slot === "evening") return hour >= 18 || hour < 6;
          return true;
        });
        if (!matchesTime) return false;
      }

      // 3. Bus type
      if (filters.busTypes.length > 0) {
        const matchesType = filters.busTypes.some((type) => {
          if (type === "ac") return bus.isAc === true;
          if (type === "non_ac") return bus.isAc === false;
          if (type === "sleeper") return bus.category === "sleeper" || bus.category === "semi_sleeper";
          if (type === "seater") return bus.category === "seater";
          return true;
        });
        if (!matchesType) return false;
      }

      // 4. Amenities
      if (filters.amenities.length > 0) {
        const hasAllAmenities = filters.amenities.every((amenity) =>
          bus.amenities?.includes(amenity)
        );
        if (!hasAllAmenities) return false;
      }

      return true;
    });
  }, [rawResults, filters]);

  // Sort logic
  const sortedBuses = useMemo(() => {
    const list = [...filteredBuses];
    switch (sortBy) {
      case "departure_asc":
        return list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
      case "fare_asc":
        return list.sort((a, b) => a.fare - b.fare);
      case "duration_asc":
        return list.sort((a, b) => a.durationMinutes - b.durationMinutes);
      case "seats_desc":
        return list.sort((a, b) => b.seatsAvailable - a.seatsAvailable);
      default:
        return list;
    }
  }, [filteredBuses, sortBy]);

  const activeFiltersCount =
    (filters.departureTimes.length || 0) +
    (filters.busTypes.length || 0) +
    (filters.amenities.length || 0) +
    (filters.maxPrice < 700 ? 1 : 0);

  return (
    <main className="search-page-layout">
      {/* Search Header Banner & Edit Form */}
      <SearchHeader
        searchParams={searchParams}
        onSearchSubmit={handleSearchSubmit}
        isSearching={isLoading}
      />

      {/* Main Content: Left Filter Sidebar + Right Results Area */}
      <div className="search-grid-layout">
        {/* Desktop / Tablet Sidebar */}
        <div className="search-sidebar-wrapper">
          <FilterPanel
            filters={filters}
            onFilterChange={setFilters}
            onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            totalResultsCount={rawResults.length}
            filteredCount={filteredBuses.length}
          />

          {/* Test State Simulator Box */}
          <div className="test-helpers-card">
            <span className="test-helpers-title">🧪 UI State Simulation</span>
            <div className="test-buttons-row">
              <button
                type="button"
                className="test-state-btn"
                onClick={() => performSearch(searchParams, false)}
                title="Reload search fixtures"
              >
                Reload
              </button>
              <button
                type="button"
                className="test-state-btn"
                onClick={() => {
                  setSimulateErrorNext(true);
                  performSearch(searchParams, true);
                }}
                title="Simulate network error state"
              >
                Simulate Error
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <section className="search-results-area" aria-label="Available Bus List">
          {/* Sort Controls Bar */}
          <SortBar
            sortBy={sortBy}
            onSortChange={setSortBy}
            resultsCount={sortedBuses.length}
            onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Dynamic Content States */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState
              errorMessage={error}
              onRetry={() => {
                setSimulateErrorNext(false);
                performSearch(searchParams, false);
              }}
            />
          ) : sortedBuses.length === 0 ? (
            <EmptyState
              origin={searchParams.from}
              destination={searchParams.to}
              onResetFilters={() => setFilters(DEFAULT_FILTERS)}
            />
          ) : (
            <div className="bus-cards-list">
              {sortedBuses.map((bus) => (
                <BusCard
                  key={bus.id}
                  bus={bus}
                  onSelectBus={(selected) => {
                    if (onNavigate) {
                      onNavigate("seats", { tripId: selected.id });
                    } else {
                      window.location.hash = `/trips/${selected.id}/seats`;
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Mobile Filter Slide Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={() => setFilters(DEFAULT_FILTERS)}
        totalResultsCount={rawResults.length}
        filteredCount={filteredBuses.length}
      />

      {/* Seat Selection Modal */}
      {selectedBus && (
        <SeatSelectionModal
          selectedBus={selectedBus}
          searchParams={searchParams}
          onClose={() => setSelectedBus(null)}
          onNavigate={onNavigate}
        />
      )}
    </main>
  );
}
