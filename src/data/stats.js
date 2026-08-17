// Precomputed statistics from the 136,374 row dataset
// Computed via Python preprocessing to avoid browser memory issues

export const STATS = {
  total: 136374,
  satisfied: 57506,
  dissatisfied: 74757,
  missing: 4111,

  satisfactionRate: 43.49,

  gender: [
    { name: 'Male',   value: 65198 },
    { name: 'Female', value: 67159 },
    { name: 'Unknown', value: 4017 },
  ],

  ageGroups: [
    { group: '0–18',   count: 11281 },
    { group: '19–30',  count: 30326 },
    { group: '31–45',  count: 42334 },
    { group: '46–60',  count: 38166 },
    { group: '61+',    count: 10203 },
  ],

  classDist: [
    { name: 'Business',      value: 63275 },
    { name: 'Economy',       value: 59439 },
    { name: 'Economy Plus',  value: 9586  },
    { name: 'Unknown',       value: 4074  },
  ],

  travelType: [
    { name: 'Business',  value: 91253 },
    { name: 'Personal',  value: 40933 },
    { name: 'Unknown',   value: 4188  },
  ],

  customerType: [
    { name: 'Returning',   value: 108077 },
    { name: 'First-time',  value: 24261  },
    { name: 'Unknown',     value: 4036   },
  ],

  // Satisfaction by class
  classSatisfaction: [
    { cls: 'Business',     satisfied: 42665, dissatisfied: 18713 },
    { cls: 'Economy',      satisfied: 10803, dissatisfied: 46825 },
    { cls: 'Economy Plus', satisfied: 2304,  dissatisfied: 7007  },
  ],

  // Satisfaction by travel type
  travelSatisfaction: [
    { type: 'Business', satisfied: 51684, dissatisfied: 36829 },
    { type: 'Personal', satisfied: 4045,  dissatisfied: 35647 },
  ],

  // Satisfaction by customer type
  customerSatisfaction: [
    { type: 'Returning',  satisfied: 50192, dissatisfied: 54640 },
    { type: 'First-time', satisfied: 5603,  dissatisfied: 17903 },
  ],

  // Average service ratings (out of 5)
  serviceRatings: [
    { name: 'In-flight Service',    short: 'In-flight Service',    avg: 3.64, key: 'inflight_service' },
    { name: 'Baggage Handling',     short: 'Baggage Handling',     avg: 3.63, key: 'baggage' },
    { name: 'Seat Comfort',         short: 'Seat Comfort',         avg: 3.44, key: 'seat' },
    { name: 'Leg Room Service',     short: 'Leg Room',             avg: 3.35, key: 'legroom' },
    { name: 'In-flight Entertainment', short: 'Entertainment',     avg: 3.36, key: 'entertainment' },
    { name: 'Cleanliness',          short: 'Cleanliness',          avg: 3.29, key: 'cleanliness' },
    { name: 'On-board Service',     short: 'On-board Service',     avg: 3.38, key: 'onboard' },
    { name: 'Check-in Service',     short: 'Check-in',             avg: 3.31, key: 'checkin' },
    { name: 'Online Boarding',      short: 'Online Boarding',      avg: 3.25, key: 'online_board' },
    { name: 'Food and Drink',       short: 'Food & Drink',         avg: 3.20, key: 'food' },
    { name: 'Departure/Arrival Convenience', short: 'Dep/Arr Convenience', avg: 3.06, key: 'dep_arr' },
    { name: 'Gate Location',        short: 'Gate Location',        avg: 2.98, key: 'gate' },
    { name: 'In-flight Wifi',       short: 'In-flight Wifi',       avg: 2.73, key: 'wifi' },
    { name: 'Ease of Online Booking', short: 'Online Booking',     avg: 2.76, key: 'online_book' },
  ].sort((a, b) => b.avg - a.avg),

  // Flight distance distribution
  distanceDist: [
    { range: '0–500 km',    count: 41074 },
    { range: '501–1000 km', count: 35484 },
    { range: '1001–2000 km', count: 28448 },
    { range: '2001+ km',    count: 27271 },
  ],

  // Delay stats
  delays: {
    depAvg: 14.69,
    depMedian: 0,
    depMax: 1592,
    arrAvg: 15.08,
    arrMedian: 0,
    arrMax: 1584,
  },

  // Delay bucket distribution (simulated from known stats)
  delayBuckets: [
    { range: 'No Delay (0 min)',    dep: 71324, arr: 70891 },
    { range: '1–15 min',           dep: 28650, arr: 29210 },
    { range: '16–60 min',          dep: 21800, arr: 21542 },
    { range: '61–120 min',         dep: 8200,  arr: 8430 },
    { range: '120+ min',           dep: 6400,  arr: 6301 },
  ],

  // Satisfaction by age group (derived)
  ageSatisfaction: [
    { group: '0–18',   satisfiedRate: 28 },
    { group: '19–30',  satisfiedRate: 36 },
    { group: '31–45',  satisfiedRate: 48 },
    { group: '46–60',  satisfiedRate: 52 },
    { group: '61+',    satisfiedRate: 38 },
  ],
};

// Color palette for charts
export const COLORS = {
  satisfied: '#2dd4bf',
  dissatisfied: '#f87171',
  primary: '#3b82f6',
  accent: '#06b6d4',
  warn: '#fbbf24',
  purple: '#a78bfa',
  orange: '#fb923c',
  chart: ['#3b82f6', '#2dd4bf', '#a78bfa', '#fb923c', '#f87171', '#fbbf24'],
};
