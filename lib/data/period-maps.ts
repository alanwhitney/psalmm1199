// Schematic overlay data for six biblical-period maps, styled after the
// standard maps found in study Bible atlases. Coordinates are simplified
// / approximate — good enough for orientation, not archaeological claims.
// [lat, lon] throughout, matching Leaflet's convention.

export type LatLon = [number, number];

export type MapRegion = {
  name: string;
  color: string;
  coordinates: LatLon[];
};

export type MapRoute = {
  name: string;
  color: string;
  dashed?: boolean;
  coordinates: LatLon[];
};

export type MapPoint = {
  name: string;
  lat: number;
  lon: number;
};

export type PeriodMap = {
  id: string;
  label: string;
  regions?: MapRegion[];
  routes?: MapRoute[];
  points?: MapPoint[];
};

export const periodMaps: PeriodMap[] = [
  {
    id: "patriarchs",
    label: "World of the Patriarchs",
    routes: [
      {
        name: "Abraham's journey",
        color: "#8b5e34",
        coordinates: [
          [30.9636, 46.1006], // Ur
          [36.8622, 39.0303], // Haran
          [33.5138, 36.2765], // Damascus
          [32.2137, 35.2778], // Shechem
          [31.9306, 35.2244], // Bethel
          [31.5326, 35.0998], // Hebron
          [30.7, 31.35], // Egypt (Nile Delta)
          [31.2589, 34.7915], // Beersheba
        ],
      },
    ],
    points: [
      { name: "Ur", lat: 30.9636, lon: 46.1006 },
      { name: "Haran", lat: 36.8622, lon: 39.0303 },
      { name: "Damascus", lat: 33.5138, lon: 36.2765 },
      { name: "Shechem", lat: 32.2137, lon: 35.2778 },
      { name: "Bethel", lat: 31.9306, lon: 35.2244 },
      { name: "Ai", lat: 31.9339, lon: 35.2825 },
      { name: "Salem (Jerusalem)", lat: 31.7767, lon: 35.2345 },
      { name: "Hebron", lat: 31.5326, lon: 35.0998 },
      { name: "Gerar", lat: 31.3892, lon: 34.5822 },
      { name: "Beersheba", lat: 31.2589, lon: 34.7915 },
      { name: "Sodom (traditional)", lat: 31.15, lon: 35.45 },
      { name: "Egypt", lat: 30.7, lon: 31.35 },
    ],
  },
  {
    id: "exodus",
    label: "The Exodus from Egypt",
    routes: [
      {
        name: "Route of the Exodus",
        color: "#b3542b",
        coordinates: [
          [30.8034, 31.8286], // Rameses
          [30.5647, 32.1067], // Succoth
          [30.35, 32.35], // Etham
          [29.9, 32.55], // Crossing (traditional)
          [29.35, 32.9], // Marah
          [29.2, 33.05], // Elim
          [28.9, 33.35], // Wilderness of Sin
          [28.5392, 33.9734], // Mount Sinai
          [28.85, 34.65], // Hazeroth
          [30.6667, 34.4833], // Kadesh Barnea
          [30.3225, 35.4014], // Mount Hor
          [30.6167, 35.4333], // Punon
          [31.77, 35.6], // Plains of Moab
        ],
      },
    ],
    points: [
      { name: "Rameses", lat: 30.8034, lon: 31.8286 },
      { name: "Succoth", lat: 30.5647, lon: 32.1067 },
      { name: "Red Sea crossing (traditional)", lat: 29.9, lon: 32.55 },
      { name: "Marah", lat: 29.35, lon: 32.9 },
      { name: "Elim", lat: 29.2, lon: 33.05 },
      { name: "Mount Sinai", lat: 28.5392, lon: 33.9734 },
      { name: "Kadesh Barnea", lat: 30.6667, lon: 34.4833 },
      { name: "Mount Hor", lat: 30.3225, lon: 35.4014 },
      { name: "Mount Nebo", lat: 31.7683, lon: 35.7256 },
      { name: "Plains of Moab", lat: 31.77, lon: 35.6 },
    ],
  },
  {
    id: "conquest",
    label: "The Conquest of Canaan",
    routes: [
      {
        name: "Southern campaign",
        color: "#6b7d3d",
        coordinates: [
          [31.8656, 35.4931], // Jordan crossing
          [31.8703, 35.4438], // Jericho
          [31.9339, 35.2825], // Ai
          [31.8494, 35.1814], // Gibeon
          [31.6, 34.85], // Makkedah
          [31.5646, 34.8514], // Lachish
          [31.6, 34.72], // Eglon
          [31.5326, 35.0998], // Hebron
          [31.45, 35.0], // Debir
        ],
      },
      {
        name: "Northern campaign",
        color: "#3d6b7d",
        coordinates: [
          [31.8656, 35.4931], // Jordan crossing
          [31.8494, 35.1814], // Gibeon
          [33.0, 35.45], // Waters of Merom
          [33.0167, 35.5667], // Hazor
        ],
      },
    ],
    points: [
      { name: "Jordan crossing", lat: 31.8656, lon: 35.4931 },
      { name: "Gilgal", lat: 31.8908, lon: 35.4636 },
      { name: "Jericho", lat: 31.8703, lon: 35.4438 },
      { name: "Ai", lat: 31.9339, lon: 35.2825 },
      { name: "Gibeon", lat: 31.8494, lon: 35.1814 },
      { name: "Beth Horon", lat: 31.8933, lon: 35.13 },
      { name: "Makkedah", lat: 31.6, lon: 34.85 },
      { name: "Lachish", lat: 31.5646, lon: 34.8514 },
      { name: "Hebron", lat: 31.5326, lon: 35.0998 },
      { name: "Debir", lat: 31.45, lon: 35.0 },
      { name: "Hazor", lat: 33.0167, lon: 35.5667 },
    ],
  },
  {
    id: "tribes",
    label: "The Twelve Tribes",
    regions: [
      {
        name: "Naphtali",
        color: "#27ae60",
        coordinates: [
          [33.35, 35.3],
          [33.35, 35.65],
          [32.85, 35.65],
          [32.85, 35.3],
        ],
      },
      {
        name: "Asher",
        color: "#2c3e50",
        coordinates: [
          [33.35, 34.95],
          [33.35, 35.3],
          [32.85, 35.3],
          [32.85, 34.95],
        ],
      },
      {
        name: "Zebulun",
        color: "#e67e22",
        coordinates: [
          [32.85, 35.0],
          [32.85, 35.35],
          [32.55, 35.35],
          [32.55, 35.0],
        ],
      },
      {
        name: "Issachar",
        color: "#f1c40f",
        coordinates: [
          [32.85, 35.35],
          [32.85, 35.65],
          [32.55, 35.65],
          [32.55, 35.35],
        ],
      },
      {
        name: "Manasseh (west)",
        color: "#16a085",
        coordinates: [
          [32.55, 34.95],
          [32.55, 35.55],
          [32.1, 35.55],
          [32.1, 34.95],
        ],
      },
      {
        name: "Manasseh (east)",
        color: "#16a085",
        coordinates: [
          [33.3, 35.55],
          [33.3, 36.3],
          [32.55, 36.3],
          [32.55, 35.55],
        ],
      },
      {
        name: "Ephraim",
        color: "#d4a017",
        coordinates: [
          [32.1, 34.95],
          [32.1, 35.45],
          [31.75, 35.45],
          [31.75, 34.95],
        ],
      },
      {
        name: "Dan",
        color: "#7f8c8d",
        coordinates: [
          [32.1, 34.75],
          [32.1, 34.98],
          [31.75, 34.98],
          [31.75, 34.75],
        ],
      },
      {
        name: "Gad",
        color: "#8e44ad",
        coordinates: [
          [32.55, 35.55],
          [32.55, 36.05],
          [31.95, 36.05],
          [31.95, 35.55],
        ],
      },
      {
        name: "Benjamin",
        color: "#2980b9",
        coordinates: [
          [31.95, 35.15],
          [31.95, 35.5],
          [31.7, 35.5],
          [31.7, 35.15],
        ],
      },
      {
        name: "Reuben",
        color: "#c0392b",
        coordinates: [
          [31.95, 35.55],
          [31.95, 36.0],
          [31.3, 36.0],
          [31.3, 35.55],
        ],
      },
      {
        name: "Judah",
        color: "#a0522d",
        coordinates: [
          [31.7, 34.7],
          [31.7, 35.45],
          [30.9, 35.45],
          [30.9, 34.7],
        ],
      },
      {
        name: "Simeon",
        color: "#9b59b6",
        coordinates: [
          [31.15, 34.55],
          [31.15, 34.95],
          [30.75, 34.95],
          [30.75, 34.55],
        ],
      },
    ],
    points: [
      { name: "Shechem", lat: 32.2137, lon: 35.2778 },
      { name: "Shiloh", lat: 32.0553, lon: 35.2897 },
      { name: "Jerusalem", lat: 31.7767, lon: 35.2345 },
      { name: "Hebron", lat: 31.5326, lon: 35.0998 },
      { name: "Dan (Laish)", lat: 33.2489, lon: 35.6522 },
    ],
  },
  {
    id: "jesus",
    label: "Times of Jesus",
    regions: [
      {
        name: "Galilee",
        color: "#2980b9",
        coordinates: [
          [33.1, 35.2],
          [33.1, 35.65],
          [32.6, 35.65],
          [32.6, 35.2],
        ],
      },
      {
        name: "Decapolis",
        color: "#8e44ad",
        coordinates: [
          [33.05, 35.55],
          [33.05, 36.1],
          [32.05, 36.1],
          [32.05, 35.55],
        ],
      },
      {
        name: "Samaria",
        color: "#d4a017",
        coordinates: [
          [32.6, 34.9],
          [32.6, 35.55],
          [32.05, 35.55],
          [32.05, 34.9],
        ],
      },
      {
        name: "Judea",
        color: "#a0522d",
        coordinates: [
          [32.05, 34.75],
          [32.05, 35.55],
          [31.35, 35.55],
          [31.35, 34.75],
        ],
      },
      {
        name: "Perea",
        color: "#16a085",
        coordinates: [
          [32.05, 35.55],
          [32.05, 35.95],
          [31.35, 35.95],
          [31.35, 35.55],
        ],
      },
      {
        name: "Idumea",
        color: "#7f8c8d",
        coordinates: [
          [31.35, 34.75],
          [31.35, 35.3],
          [31.0, 35.3],
          [31.0, 34.75],
        ],
      },
    ],
    points: [
      { name: "Nazareth", lat: 32.7018, lon: 35.2983 },
      { name: "Cana", lat: 32.75, lon: 35.34 },
      { name: "Capernaum", lat: 32.8807, lon: 35.5753 },
      { name: "Bethsaida", lat: 32.9083, lon: 35.6306 },
      { name: "Tiberias", lat: 32.7922, lon: 35.5312 },
      { name: "Caesarea Philippi", lat: 33.2489, lon: 35.6939 },
      { name: "Mount Tabor", lat: 32.6867, lon: 35.3911 },
      { name: "Sychar (Jacob's Well)", lat: 32.2131, lon: 35.2892 },
      { name: "Samaria (Sebaste)", lat: 32.2775, lon: 35.1928 },
      { name: "Jericho", lat: 31.8703, lon: 35.4438 },
      { name: "Bethany", lat: 31.7717, lon: 35.2556 },
      { name: "Bethlehem", lat: 31.7054, lon: 35.2024 },
      { name: "Jerusalem", lat: 31.7767, lon: 35.2345 },
      { name: "Emmaus", lat: 31.8386, lon: 34.9886 },
      { name: "Caesarea Maritima", lat: 32.5, lon: 34.8933 },
    ],
  },
  {
    id: "paul",
    label: "Paul's Missionary Journeys",
    routes: [
      {
        name: "First journey",
        color: "#c0392b",
        coordinates: [
          [36.2021, 36.1604], // Antioch (Syria)
          [36.1167, 35.9333], // Seleucia
          [35.1856, 33.9012], // Salamis
          [34.7571, 32.4097], // Paphos
          [36.9614, 30.8481], // Perga
          [38.3057, 31.1898], // Pisidian Antioch
          [37.8713, 32.4846], // Iconium
          [37.5754, 32.4547], // Lystra
          [37.3494, 33.2506], // Derbe
          [36.8864, 30.705], // Attalia
          [36.2021, 36.1604], // Antioch (Syria)
        ],
      },
      {
        name: "Second journey",
        color: "#2980b9",
        coordinates: [
          [36.2021, 36.1604], // Antioch (Syria)
          [36.9, 34.895], // Tarsus
          [37.3494, 33.2506], // Derbe
          [37.5754, 32.4547], // Lystra
          [39.7562, 26.1596], // Troas
          [41.0138, 24.2875], // Philippi
          [40.8214, 23.8567], // Amphipolis
          [40.6403, 22.9439], // Thessalonica
          [40.5236, 22.2005], // Berea
          [37.9838, 23.7275], // Athens
          [37.9061, 22.8781], // Corinth
          [37.9495, 27.3639], // Ephesus
          [32.5, 34.8933], // Caesarea
          [31.7767, 35.2345], // Jerusalem
          [36.2021, 36.1604], // Antioch (Syria)
        ],
      },
      {
        name: "Third journey",
        color: "#27ae60",
        dashed: true,
        coordinates: [
          [36.2021, 36.1604], // Antioch (Syria)
          [36.9, 34.895], // Tarsus
          [37.8713, 32.4846], // Iconium
          [37.9495, 27.3639], // Ephesus
          [39.7562, 26.1596], // Troas
          [41.0138, 24.2875], // Philippi
          [37.9061, 22.8781], // Corinth
          [39.7562, 26.1596], // Troas
          [39.4886, 26.3419], // Assos
          [39.1064, 26.5544], // Mitylene
          [37.5308, 27.2828], // Miletus
          [36.2664, 29.3167], // Patara
          [33.2704, 35.2038], // Tyre
          [32.5, 34.8933], // Caesarea
          [31.7767, 35.2345], // Jerusalem
        ],
      },
    ],
    points: [
      { name: "Antioch (Syria)", lat: 36.2021, lon: 36.1604 },
      { name: "Tarsus", lat: 36.9, lon: 34.895 },
      { name: "Cyprus (Salamis)", lat: 35.1856, lon: 33.9012 },
      { name: "Cyprus (Paphos)", lat: 34.7571, lon: 32.4097 },
      { name: "Perga", lat: 36.9614, lon: 30.8481 },
      { name: "Pisidian Antioch", lat: 38.3057, lon: 31.1898 },
      { name: "Iconium", lat: 37.8713, lon: 32.4846 },
      { name: "Lystra", lat: 37.5754, lon: 32.4547 },
      { name: "Derbe", lat: 37.3494, lon: 33.2506 },
      { name: "Ephesus", lat: 37.9495, lon: 27.3639 },
      { name: "Troas", lat: 39.7562, lon: 26.1596 },
      { name: "Philippi", lat: 41.0138, lon: 24.2875 },
      { name: "Thessalonica", lat: 40.6403, lon: 22.9439 },
      { name: "Berea", lat: 40.5236, lon: 22.2005 },
      { name: "Athens", lat: 37.9838, lon: 23.7275 },
      { name: "Corinth", lat: 37.9061, lon: 22.8781 },
      { name: "Miletus", lat: 37.5308, lon: 27.2828 },
      { name: "Patara", lat: 36.2664, lon: 29.3167 },
      { name: "Tyre", lat: 33.2704, lon: 35.2038 },
      { name: "Caesarea Maritima", lat: 32.5, lon: 34.8933 },
      { name: "Jerusalem", lat: 31.7767, lon: 35.2345 },
    ],
  },
];
