// ─────────────────────────────────────────────
// Reading Plan Data
// ─────────────────────────────────────────────

export interface PlanReading {
  day: number;
  readings: { bookId: string; chapter: number }[];
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  totalDays: number;
  readings: PlanReading[];
}

// Helper to expand a range of chapters for a book
function chapters(bookId: string, from: number, to: number) {
  return Array.from({ length: to - from + 1 }, (_, i) => ({ bookId, chapter: from + i }));
}

// ── Bible in a Year (365 days) ──
// Sequential OT + NT interleaved reading
function buildBibleInAYear(): PlanReading[] {
  const schedule: { bookId: string; chapter: number }[][] = [];

  // OT books in order with chapter counts
  const OT = [
    ["GEN",50],["EXO",40],["LEV",27],["NUM",36],["DEU",34],
    ["JOS",24],["JDG",21],["RUT",4],["1SA",31],["2SA",24],
    ["1KI",22],["2KI",25],["1CH",29],["2CH",36],["EZR",10],
    ["NEH",13],["EST",10],["JOB",42],["PSA",150],["PRO",31],
    ["ECC",12],["SNG",8],["ISA",66],["JER",52],["LAM",5],
    ["EZK",48],["DAN",12],["HOS",14],["JOL",3],["AMO",9],
    ["OBA",1],["JON",4],["MIC",7],["NAM",3],["HAB",3],
    ["ZEP",3],["HAG",2],["ZEC",14],["MAL",4],
  ] as [string, number][];

  const NT = [
    ["MAT",28],["MRK",16],["LUK",24],["JHN",21],["ACT",28],
    ["ROM",16],["1CO",16],["2CO",13],["GAL",6],["EPH",6],
    ["PHP",4],["COL",4],["1TH",5],["2TH",3],["1TI",6],
    ["2TI",4],["TIT",3],["PHM",1],["HEB",13],["JAS",5],
    ["1PE",5],["2PE",3],["1JN",5],["2JN",1],["3JN",1],
    ["JUD",1],["REV",22],
  ] as [string, number][];

  const otChapters: { bookId: string; chapter: number }[] = [];
  const ntChapters: { bookId: string; chapter: number }[] = [];

  for (const [bookId, count] of OT) {
    for (let c = 1; c <= count; c++) otChapters.push({ bookId, chapter: c });
  }
  for (const [bookId, count] of NT) {
    for (let c = 1; c <= count; c++) ntChapters.push({ bookId, chapter: c });
  }

  // ~3 OT chapters + 1 NT chapter per day for 365 days
  let otIdx = 0, ntIdx = 0;
  for (let day = 0; day < 365; day++) {
    const reading: { bookId: string; chapter: number }[] = [];
    // ~3 OT per day
    const otPerDay = Math.ceil(otChapters.length / 365);
    for (let i = 0; i < otPerDay && otIdx < otChapters.length; i++) {
      reading.push(otChapters[otIdx++]);
    }
    // 1 NT per day
    if (ntIdx < ntChapters.length) reading.push(ntChapters[ntIdx++]);
    if (reading.length > 0) schedule.push(reading);
  }

  return schedule.map((readings, i) => ({ day: i + 1, readings }));
}

// ── New Testament in 90 Days ──
function buildNTin90(): PlanReading[] {
  const NT = [
    ["MAT",28],["MRK",16],["LUK",24],["JHN",21],["ACT",28],
    ["ROM",16],["1CO",16],["2CO",13],["GAL",6],["EPH",6],
    ["PHP",4],["COL",4],["1TH",5],["2TH",3],["1TI",6],
    ["2TI",4],["TIT",3],["PHM",1],["HEB",13],["JAS",5],
    ["1PE",5],["2PE",3],["1JN",5],["2JN",1],["3JN",1],
    ["JUD",1],["REV",22],
  ] as [string, number][];

  const all: { bookId: string; chapter: number }[] = [];
  for (const [bookId, count] of NT) {
    for (let c = 1; c <= count; c++) all.push({ bookId, chapter: c });
  }

  const days: PlanReading[] = [];
  const perDay = Math.ceil(all.length / 90);
  let idx = 0;
  for (let day = 1; day <= 90 && idx < all.length; day++) {
    const readings: { bookId: string; chapter: number }[] = [];
    for (let i = 0; i < perDay && idx < all.length; i++) {
      readings.push(all[idx++]);
    }
    days.push({ day, readings });
  }
  return days;
}

// ── Psalms & Proverbs in 30 Days ──
function buildPsalmsProverbs30(): PlanReading[] {
  const all: { bookId: string; chapter: number }[] = [];
  // 5 Psalms per day + 1 Proverbs per day for 30 days
  for (let i = 1; i <= 150; i++) all.push({ bookId: "PSA", chapter: i });
  for (let i = 1; i <= 31; i++) all.push({ bookId: "PRO", chapter: i });

  const days: PlanReading[] = [];
  for (let day = 1; day <= 30; day++) {
    const readings: { bookId: string; chapter: number }[] = [];
    // 5 Psalms
    for (let i = 0; i < 5; i++) {
      const idx = (day - 1) * 5 + i;
      if (idx < 150) readings.push({ bookId: "PSA", chapter: idx + 1 });
    }
    // 1 Proverbs (cycle through)
    readings.push({ bookId: "PRO", chapter: day <= 31 ? day : 1 });
    days.push({ day, readings });
  }
  return days;
}

// ── Chronological Bible in a Year ──
// Books roughly in chronological order
function buildChronological(): PlanReading[] {
  const chronOrder = [
    ["GEN",50],["JOB",42],["EXO",40],["LEV",27],["NUM",36],["DEU",34],
    ["JOS",24],["JDG",21],["RUT",4],["1SA",31],["2SA",24],["PSA",150],
    ["1KI",22],["2KI",25],["PRO",31],["ECC",12],["SNG",8],
    ["1CH",29],["2CH",36],["ISA",66],["JER",52],["LAM",5],
    ["EZK",48],["DAN",12],["HOS",14],["JOL",3],["AMO",9],
    ["OBA",1],["JON",4],["MIC",7],["NAM",3],["HAB",3],
    ["ZEP",3],["HAG",2],["ZEC",14],["MAL",4],["EZR",10],["NEH",13],["EST",10],
    ["MAT",28],["MRK",16],["LUK",24],["JHN",21],["ACT",28],
    ["ROM",16],["1CO",16],["2CO",13],["GAL",6],["EPH",6],
    ["PHP",4],["COL",4],["1TH",5],["2TH",3],["1TI",6],
    ["2TI",4],["TIT",3],["PHM",1],["HEB",13],["JAS",5],
    ["1PE",5],["2PE",3],["1JN",5],["2JN",1],["3JN",1],["JUD",1],["REV",22],
  ] as [string, number][];

  const all: { bookId: string; chapter: number }[] = [];
  for (const [bookId, count] of chronOrder) {
    for (let c = 1; c <= count; c++) all.push({ bookId, chapter: c });
  }

  const days: PlanReading[] = [];
  const perDay = Math.ceil(all.length / 365);
  let idx = 0;
  for (let day = 1; day <= 365 && idx < all.length; day++) {
    const readings: { bookId: string; chapter: number }[] = [];
    for (let i = 0; i < perDay && idx < all.length; i++) {
      readings.push(all[idx++]);
    }
    days.push({ day, readings });
  }
  return days;
}

export const READING_PLANS: ReadingPlan[] = [
  {
    id: "bible-in-a-year",
    name: "Bible in a Year",
    description: "Read the entire Bible in 365 days with interleaved OT and NT readings.",
    totalDays: 365,
    readings: buildBibleInAYear(),
  },
  {
    id: "nt-90-days",
    name: "New Testament in 90 Days",
    description: "Read through the entire New Testament in just 90 days.",
    totalDays: 90,
    readings: buildNTin90(),
  },
  {
    id: "psalms-proverbs-30",
    name: "Psalms & Proverbs in 30 Days",
    description: "5 Psalms and 1 Proverb per day for a month of wisdom literature.",
    totalDays: 30,
    readings: buildPsalmsProverbs30(),
  },
  {
    id: "chronological",
    name: "Chronological Bible in a Year",
    description: "Read the Bible in the order events occurred historically.",
    totalDays: 365,
    readings: buildChronological(),
  },
];

export const PLAN_BY_ID = Object.fromEntries(READING_PLANS.map(p => [p.id, p]));
