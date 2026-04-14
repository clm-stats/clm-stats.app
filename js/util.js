export const PageTypes = ["stats", "players", "compare", "h2h"];

export function resolveTab(page, tab) {
  if (page !== "players") {
    return undefined;
  }
  return (tab || "").toLowerCase() === "tourneys" ? "tourneys" : "h2hs";
}

let timeline = { current: null, periods: [] };
let PERIODS = {};
let PERIOD_ID_BY_SEASON = {};
let SEASON_BY_PERIOD_ID = {};
let TITLE_BY_PERIOD_ID = {};

const OUT_OF_REGION = new Set([]);

export function setTimeline(newTimeline) {
  for (const ident of newTimeline.outofRegionIdents || []) {
    OUT_OF_REGION.add(ident);
  }
  timeline = newTimeline;
  PERIODS = {};
  PERIOD_ID_BY_SEASON = {};
  SEASON_BY_PERIOD_ID = {};
  TITLE_BY_PERIOD_ID = {};
  for (const period of timeline.periods) {
    PERIODS[period.periodId] = period;
    PERIOD_ID_BY_SEASON[period.season] = period.periodId;
    SEASON_BY_PERIOD_ID[period.periodId] = period.season;
    TITLE_BY_PERIOD_ID[period.periodId] = period.title;
  }
}

const SORT_BYS = new Set(["ord", "name", "qual", "acc", "att", "mru"]);
const defaultSortBy = "qual";
export function resolveSortBy(str) {
  return SORT_BYS.has(str) ? str : defaultSortBy;
}
export function getDefaultDir(by) {
  return {
    ord: "asc",
    name: "asc",
    qual: "desc",
    acc: "desc",
    att: "desc",
    mru: "desc",
  }[resolveSortBy(by)];
}

const SORT_DIRS = new Set(["asc", "desc"]);
const defaultSortDir = "desc";
export function resolveSortDir(str) {
  return SORT_DIRS.has(str) ? str : defaultSortDir;
}

export function resolveSeasonStr(str) {
  return PERIOD_ID_BY_SEASON[str] || timeline.current;
}

const PAGES = new Set(PageTypes);

export const defaultPage = "stats";

export function resolvePageStr(str) {
  return str && PAGES.has(str.toLowerCase()) ? str.toLowerCase() : defaultPage;
}

export function pageSuffix(str) {
  return {
    stats: "",
    players: "\\Player Summary",
    compare: "\\Player Comparison",
    h2h: "\\Head-To-Head Matchup History Grid",
  }[resolvePageStr(str)];
}

export function pageTitle(pageProps, getBestName = () => {}) {
  const { periodId, page, pids = [] } = pageProps;
  const ptitle = getTitle(periodId);
  if (page === "players") {
    const name = getBestName(pids[0]);
    if (name) {
      return `${name}\\${ptitle}`;
    }
  }
  const suffix = pageSuffix(page);
  return ptitle + suffix;
}

export function isCurrent(periodId) {
  return periodId === timeline.current;
}

export function getOrderedPeriods() {
  return timeline.periods;
}

export function getSeason(periodId) {
  return SEASON_BY_PERIOD_ID[periodId] || SEASON_BY_PERIOD_ID[timeline.current];
}

export function getTitle(periodId) {
  return TITLE_BY_PERIOD_ID[periodId] || TITLE_BY_PERIOD_ID[timeline.current];
}

export function getPeriodId(season) {
  return PERIOD_ID_BY_SEASON[season] || timeline.current;
}

export function Period(periodId) {
  return PERIODS[periodId] || PERIODS[timeline.current];
}

const PLAYER_DATA = {
  shabo: { character: "FOX" },
  Skerzo: { character: "FOX" },
  Michael: { character: "JIGGLYPUFF", lastRank: 2 },
  JustJoe: { character: "FOX" },
  Ober: { character: "FALCO", lastRank: 1 },
  bestprincess: { character: "PEACH" },
  Killablue: { character: "FALCO" },
  Ferocitii: { character: "PEACH" },
  GI0GOAT: { character: "FOX", summerRank: 15, lastRank: 3 },
  Larfen: { character: "SHEIK" },
  FoxCap: { character: "FOX" },
  Azzu: { character: "FALCO" },
  Forest: { character: "MARTH" },
  Mattchu: { character: "FALCO" },
  Unsure: { character: "SHEIK", lastRank: 8 },
  Umma: { character: "MARTH" },
  Dragoid: { character: "FALCO" },
  Hyunnies: { character: "MARTH" },
  macdaddy69: { character: "CAPTAIN_FALCON" },
  Scooby: { character: "SHEIK" },
  Frost: { character: "SAMUS" },
  Peanutphobia: { character: "YOSHI" },
  Josh: { character: "JIGGLYPUFF" },
  ORLY: { character: "CAPTAIN_FALCON", lastRank: 6 },
  chef: { character: "FOX" },
  Certified: { character: "FOX" },
  Fluid: { character: "ICE_CLIMBERS" },
  "Q?": { character: "DR_MARIO" },
  IMDRR: { character: "FALCO" },
  lovestory4a: { character: "SHEIK", lastRank: 5 },
  Fasthands: { character: "MEWTWO" },
  natebug01: { character: "JIGGLYPUFF" },
  Blue: { character: "FOX" },
  dz: { character: "YOSHI" },
  Latin: { character: "MARTH", lastRank: 4 },
  Fry: { character: "PEACH", lastRank: 7 },
  anxious: { character: "SHEIK", lastRank: 9 },
  Jackie: { character: "GANONDORF", lastRank: 10 },
};

export function inRegion(player) {
  return !OUT_OF_REGION.has(player);
}

export function lkupChar(player) {
  return (PLAYER_DATA[player] || {}).character;
}

export function mkQs(...args) {
  let qs = "";
  const props = {};
  for (const arg of args) {
    if (typeof arg === "string") {
      qs += arg;
    } else {
      for (const k in arg) {
        props[k] = arg[k];
      }
    }
  }
  function qsAdd(k, v) {
    if (Array.isArray(v)) {
      for (const vv of v) {
        qsAdd(k, vv);
      }
      return;
    }
    if (v === undefined) {
      return;
    }
    if (v === null) {
      return;
    }
    const c1 = !qs ? "?" : "&";
    qs = `${qs}${c1}${k}=${v}`;
  }
  for (const k in props) {
    qsAdd(k, props[k]);
  }
  return qs;
}

export function resolveSort(sortIn = {}) {
  const sort = {};
  sort.dir = resolveSortDir(sortIn.dir);
  sort.by = resolveSortBy(sortIn.by);
  if (sort.dir === resolveSortDir()) {
    delete sort.dir;
  }
  if (sort.by === resolveSortBy()) {
    delete sort.by;
  }
  return sort;
}

const filterKeys = ["outOfRegion", "inadAttendance"];

const defaultFilterVals = {
  outOfRegion: true,
  inadAttendance: false,
};

export function resolveFilter(str) {
  let i = parseInt(str);
  i = Number.isNaN(i) ? 0 : i;
  const res = {};
  for (const k of filterKeys) {
    res[k] = (i % 2 === 0) === defaultFilterVals[k];
    i = Math.floor(i / 2);
  }
  return res;
}

export function asSearchParams(filter, periodId) {
  if (!filter) {
    return { filter: getDefaultFilterStr(periodId) };
  }
  let res = 0;
  const fks = [...filterKeys];
  fks.reverse();
  for (const k of fks) {
    res *= 2;
    res += filter[k] !== !defaultFilterVals[k] ? 0 : 1;
  }
  return { filter: `${res}` };
}

export function getDefaultFilter(periodId) {
  return {
    outOfRegion: true,
    inadAttendance: periodId !== timeline.current,
  };
}

export function getDefaultFilterStr(periodId) {
  return asSearchParams(getDefaultFilter(periodId)).filter;
}

export function addedFilters(str) {
  const filter = resolveFilter(str);
  const res = [];
  for (const k in defaultFilterVals) {
    if (defaultFilterVals[k]) {
      continue;
    }
    if (filter[k]) {
      res.push(k);
    }
  }
  return res;
}

export function removedFilters(str) {
  const filter = resolveFilter(str);
  const res = [];
  for (const k in defaultFilterVals) {
    if (!defaultFilterVals[k]) {
      continue;
    }
    if (!filter[k]) {
      res.push(k);
    }
  }
  return res;
}
