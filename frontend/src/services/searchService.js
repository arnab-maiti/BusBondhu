/**
 * BusBondhu Search Service
 * 
 * Provides search data for the Bus Search Results UI.
 * In Phase 2, this returns development fixtures for UI demonstration.
 * Marked with isDemoFixture: true so the UI can clearly disclose
 * that these are demo fixtures and not live availability.
 */

export const DEMO_NOTICE = 
  "Demonstration schedules: These results are development fixtures for UI testing and do not represent live booking availability.";

const OPERATORS = [
  { name: "SBSTC", type: "Govt. of West Bengal", rating: 4.3, reviews: 1420 },
  { name: "WBTC", type: "Govt. of West Bengal", rating: 4.1, reviews: 980 },
  { name: "Shyamoli Paribahan", type: "Premium Intercity", rating: 4.6, reviews: 2150 },
  { name: "Royal Cruiser", type: "Volvo Fleet", rating: 4.7, reviews: 3410 },
  { name: "Greenline Express", type: "Air Conditioned Express", rating: 4.5, reviews: 1870 },
  { name: "NBSTC", type: "Govt. of West Bengal", rating: 4.2, reviews: 1120 },
];

const BUS_TEMPLATES = [
  {
    id: "BB-101",
    operatorIndex: 0,
    busType: "AC Seater (2+2)",
    category: "seater",
    isAc: true,
    depTime: "06:30",
    arrTime: "10:15",
    durationMinutes: 225,
    baseFare: 320,
    seatsTotal: 40,
    seatsAvailable: 14,
    boardingPoint: "Esplanade Bus Terminus, Bay 4",
    droppingPoint: "City Centre Bus Stand",
    amenities: ["charging", "water", "reading_light", "live_tracking"],
  },
  {
    id: "BB-102",
    operatorIndex: 2,
    busType: "Volvo Multi-Axle AC Sleeper (2+1)",
    category: "sleeper",
    isAc: true,
    depTime: "07:45",
    arrTime: "11:15",
    durationMinutes: 210,
    baseFare: 550,
    seatsTotal: 32,
    seatsAvailable: 6,
    boardingPoint: "Babughat Bus Stand",
    droppingPoint: "Durgapur Junction",
    amenities: ["wifi", "charging", "water", "blanket", "reading_light", "cctv", "live_tracking"],
  },
  {
    id: "BB-103",
    operatorIndex: 1,
    busType: "Non-AC Express (3+2)",
    category: "seater",
    isAc: false,
    depTime: "09:00",
    arrTime: "13:30",
    durationMinutes: 270,
    baseFare: 190,
    seatsTotal: 52,
    seatsAvailable: 28,
    boardingPoint: "Karunamoyee International Bus Terminal",
    droppingPoint: "Muchipara Bus Stop",
    amenities: ["reading_light"],
  },
  {
    id: "BB-104",
    operatorIndex: 3,
    busType: "Scania Luxury AC Semi-Sleeper",
    category: "semi_sleeper",
    isAc: true,
    depTime: "13:15",
    arrTime: "16:50",
    durationMinutes: 215,
    baseFare: 480,
    seatsTotal: 36,
    seatsAvailable: 9,
    boardingPoint: "Airport Gate 1 Bus Bay",
    droppingPoint: "City Centre Bus Stand",
    amenities: ["wifi", "charging", "water", "reading_light", "live_tracking"],
  },
  {
    id: "BB-105",
    operatorIndex: 4,
    busType: "Electric AC Smart Coach",
    category: "seater",
    isAc: true,
    depTime: "15:30",
    arrTime: "19:10",
    durationMinutes: 220,
    baseFare: 380,
    seatsTotal: 44,
    seatsAvailable: 22,
    boardingPoint: "Howrah Station Bay 2",
    droppingPoint: "Gandhi More Bus Terminus",
    amenities: ["wifi", "charging", "cctv", "live_tracking"],
  },
  {
    id: "BB-106",
    operatorIndex: 0,
    busType: "AC Seater (2+2)",
    category: "seater",
    isAc: true,
    depTime: "18:00",
    arrTime: "21:50",
    durationMinutes: 230,
    baseFare: 340,
    seatsTotal: 40,
    seatsAvailable: 4,
    boardingPoint: "Esplanade Bus Terminus, Bay 2",
    droppingPoint: "City Centre Bus Stand",
    amenities: ["charging", "water", "live_tracking"],
  },
  {
    id: "BB-107",
    operatorIndex: 5,
    busType: "Deluxe Non-AC Seater",
    category: "seater",
    isAc: false,
    depTime: "20:30",
    arrTime: "01:00",
    durationMinutes: 270,
    baseFare: 210,
    seatsTotal: 48,
    seatsAvailable: 19,
    boardingPoint: "Babughat Bus Stand",
    droppingPoint: "Durgapur Station Road",
    amenities: ["reading_light", "cctv"],
  },
  {
    id: "BB-108",
    operatorIndex: 2,
    busType: "Volvo Night Cruiser AC Sleeper (2+1)",
    category: "sleeper",
    isAc: true,
    depTime: "22:45",
    arrTime: "02:45",
    durationMinutes: 240,
    baseFare: 620,
    seatsTotal: 30,
    seatsAvailable: 2,
    boardingPoint: "Esplanade Bus Terminus, Bay 5",
    droppingPoint: "City Centre Bus Stand",
    amenities: ["wifi", "charging", "water", "blanket", "reading_light", "cctv", "live_tracking"],
  },
];

/**
 * Format duration minutes into "Xh Ym"
 */
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Search buses matching criteria.
 * Returns a Promise to simulate asynchronous network retrieval.
 */
export async function searchBuses({ from, to, date, passengers = 1, simulateError = false }) {
  // Simulate network latency (350ms - 550ms)
  await new Promise((resolve) => setTimeout(resolve, 450));

  if (simulateError) {
    throw new Error("Unable to load bus schedules. Please verify your connection and try again.");
  }

  const origin = (from || "Kolkata").trim();
  const destination = (to || "Durgapur").trim();

  // If origin equals destination, return empty results intentionally
  if (origin.toLowerCase() === destination.toLowerCase()) {
    return {
      results: [],
      origin,
      destination,
      date: date || new Date().toISOString().split("T")[0],
      passengers: Number(passengers) || 1,
      isDemoFixture: true,
      notice: DEMO_NOTICE,
    };
  }

  // Construct realistic bus schedules based on the search query
  const results = BUS_TEMPLATES.map((tmpl, idx) => {
    const operator = OPERATORS[tmpl.operatorIndex % OPERATORS.length];
    const durationStr = formatDuration(tmpl.durationMinutes);

    return {
      id: `${tmpl.id}-${origin.slice(0, 3).toUpperCase()}-${idx + 1}`,
      busNumber: `WB-${20 + (idx % 15)}-${1000 + idx * 87}`,
      operatorName: operator.name,
      operatorType: operator.type,
      rating: operator.rating,
      reviewsCount: operator.reviews,
      busType: tmpl.busType,
      category: tmpl.category,
      isAc: tmpl.isAc,
      departureTime: tmpl.depTime,
      arrivalTime: tmpl.arrTime,
      duration: durationStr,
      durationMinutes: tmpl.durationMinutes,
      originCity: origin,
      destinationCity: destination,
      boardingPoint: `${origin} (${tmpl.boardingPoint})`,
      droppingPoint: `${destination} (${tmpl.droppingPoint})`,
      fare: tmpl.baseFare,
      seatsTotal: tmpl.seatsTotal,
      seatsAvailable: tmpl.seatsAvailable,
      amenities: tmpl.amenities,
      isLiveTrackable: tmpl.amenities.includes("live_tracking"),
      isDemoFixture: true,
    };
  });

  return {
    results,
    origin,
    destination,
    date: date || new Date().toISOString().split("T")[0],
    passengers: Number(passengers) || 1,
    isDemoFixture: true,
    notice: DEMO_NOTICE,
  };
}
