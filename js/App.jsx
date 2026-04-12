import { Component } from "preact";
import PureApp from "./PureApp";
import * as U from "./util";

function getUrlState(href) {
  const url = new URL(href || window.location.href);
  const hrefPath = url.pathname;
  const parts = /^\/([a-z0-9_\-]+)\/([a-z0-9]*)(\.html)?$/.exec(
    hrefPath.toLowerCase(),
  );
  const periodId = U.resolveSeasonStr((parts || [])[1]);
  const page =
    hrefPath === "/-" ? "players" : U.resolvePageStr((parts || [])[2]);
  const sort = {
    by: U.resolveSortBy(url.searchParams.get("by")),
    dir: U.resolveSortDir(url.searchParams.get("dir")),
  };
  const filter = U.resolveFilter(
    url.searchParams.get("filter") || U.getDefaultFilterStr(periodId),
  );
  const qpids = url.searchParams.getAll("pids");
  const hpids = (() => {
    const hash = url.hash || "#";
    const hashPid = hash.substring(1);
    return hashPid ? [hashPid] : [];
  })();
  const pids = [...hpids, ...qpids];
  for (const pid of pids) {
    window.fetchPlayer(periodId, pid);
  }
  const queryTab = url.searchParams.get("tab");
  const tab = U.resolveTab(page, queryTab);
  const queryRating = url.searchParams.get("rating");
  const rating = queryRating === "alt1" ? "alt1" : undefined;
  return { page, pids, periodId, sort, filter, tab, rating };
}

function getStats(arr, k) {
  const len = arr.length;
  const nums = arr.map((el) => el[k]);
  const avg = nums.reduce((sum, n) => sum + n, 0) / len;
  const variance =
    nums.map((n) => Math.pow(n - avg, 2)).reduce((sum, d) => sum + d, 0) / len;
  const stdev = Math.sqrt(variance);
  return { avg, stdev };
}

function zScoreToPercentile(z) {
  if (z < -6.5) return 0.0;
  if (z > 6.5) return 1.0;
  let factK = 1;
  let sum = 0;
  let term = 1;
  let k = 0;
  let loopStop = Math.exp(-23);
  while (Math.abs(term) > loopStop) {
    term =
      (((0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) /
        (2 * k + 1) /
        Math.pow(2, k)) *
        Math.pow(z, k + 1)) /
      factK;
    sum += term;
    k++;
    factK *= k;
  }
  return (sum + 0.5) * 100;
}

function cleanPeriod(period, rating) {
  const isCurrent = period.periodId === U.getPeriodId();
  for (const eventId in period.events) {
    const event = period.events[eventId];
    const eventDate = new Date(event.date * 1000);
    const options = { year: "numeric", month: "2-digit", day: "2-digit" };
    event.dateString = new Intl.DateTimeFormat("en-US", options).format(
      eventDate,
    );
  }
  period.nameByClmId = {};
  for (const ident in period.players) {
    const { clmId, name } = period.players[ident];
    period.nameByClmId[clmId] = name;
  }
  let nextClmRank = 1;
  const stats = getStats(period.ranks, "rating");
  for (const r of period.ranks) {
    const zscore = (r.conservativeRating - stats.avg) / stats.stdev;
    const percentile = zScoreToPercentile(zscore);
    const altRating = Math.floor(percentile * 10);
    r.altRating = altRating;
    const player = period.players[r.playerIdent];
    const inRegion = U.inRegion(player.name);
    if (r.conservativeRating && inRegion && (isCurrent || r.prEvents >= 8)) {
      player.clmRank = nextClmRank;
      nextClmRank++;
    }
    player.rank = r;
  }
  const otherIdents = Object.keys(period.others);
  otherIdents.sort();
  period.extraSearchRows = otherIdents.map((playerIdent) => ({
    playerIdent,
    latestPeriodId: period.others[playerIdent][0],
    player: {
      id: period.others[playerIdent][1],
      clmId: period.others[playerIdent][1],
      name: playerIdent,
      image: "/img/CLM_Logo_Avatar_Placeholder.png",
    },
    isOutOfPeriod: true,
    inRegion: true,
    doesMeetActivity: true,
  }));
  return period;
}

function cleanPlayer(player) {
  if (!player) {
    return player;
  }
  player[3] = new Set(player[3]);
  player[4] ||= {};
  player[4].h2hByIdent ||= {};
  for (const h2h of player[2]) {
    player[4].h2hByIdent[h2h.opponent] = h2h;
  }
  return player;
}

export default class App extends Component {
  constructor(props) {
    super(props);
    const urlState = getUrlState();
    this.state = {
      prevState: {},
      ...urlState,
      isLoading: true,
      pidSet: new Set(urlState.pids),
    };
    this.initialPage = this.state.page;
    this.initialPeriodId = this.state.periodId;
    this.initialTab = this.state.tab;
    this.initialPid = (this.state.pids || [])[0];
    this.isInitialPage = true;
    this.isInitialPeriod = true;
    this.isInitialTab = true;
    this.isInitialPid = true;
  }

  fetchPeriod(fetchedId = this.state.periodId, plusState = {}) {
    const pids = plusState.pids || this.state.pids || [];
    const pidsKey = pids.join("|");
    if (
      this.state.fetchedId === fetchedId &&
      this.state.fetchedPids === pidsKey
    ) {
      this.modState(plusState);
      return;
    }
    this.modState({
      ...plusState,
      ...(this.state.fetchedId === fetchedId ? {} : { period: undefined }),
      isLoading: true,
      fetchedPids: undefined,
      players: [],
    });
    Promise.all([
      window.fetchPeriod(fetchedId),
      ...pids.map((pid) =>
        window.fetchPlayer(fetchedId, pid).catch((e) => {
          if (e === 404) {
            return undefined;
          }
          throw { message: `clmPlayer#${pid} not found` };
        }),
      ),
    ])
      .then(([p, ...rest]) => [
        cleanPeriod(p, this.state.rating),
        ...rest.map(cleanPlayer),
      ])
      .then(([period, ...players]) => {
        if (players.length > 0 && !players[0]) {
          const clmId = pids[0];
          for (const pid in period.others) {
            if (`${period.others[pid][1]}` === clmId) {
              const targetId = period.others[pid][0];
              this.fetchPeriod(targetId, {
                pids,
                page: "players",
                periodId: targetId,
              });
              return;
            }
          }
        }
        this.modState({
          period,
          players,
          isLoading: false,
          fetchedId,
          fetchedPids: pidsKey,
        });
      })
      .catch((error) => this.modState({ error }));
  }

  isStateSubset(nextState) {
    for (const k in nextState) {
      if (nextState[k] !== this.state[k]) {
        return false;
      }
    }
    return true;
  }

  modState(nextState) {
    if (this.isStateSubset(nextState)) {
      return;
    }
    if (nextState.page && nextState.page !== this.state.page) {
      nextState.prevPage = this.state.page;
    }
    if (nextState.pids) {
      nextState.pidSet = new Set(nextState.pids);
    }
    nextState.prevState = this.state;
    this.setState(nextState);
  }

  componentDidUpdate() {
    const pageTitle = this.pageTitle(this.state);
    if (pageTitle !== document.title) {
      document.title = pageTitle;
    }
    for (const el of document.querySelectorAll("[data-class-off]")) {
      for (const cn of (el.dataset.classOff || "").split(" ")) {
        el.classList.remove(cn);
      }
    }
    for (const el of document.querySelectorAll("[data-style-off]")) {
      el.removeAttribute("style");
    }
    this.state.retryCount = this.state.hasClientError
      ? this.state.retryCount
      : 0;
  }

  pageTitle(pageState) {
    return U.pageTitle(pageState, (clmId) => {
      const fromPlayers = (() => {
        if (!this.state.players) {
          return;
        }
        const p0 = this.state.players[0];
        if (!p0 || !p0[4] || `${p0[4].clmId}` !== `${clmId}`) {
          return;
        }
        return p0[4].name;
      })();
      return (
        fromPlayers ||
        (() => {
          const period = this.state.period;
          if (!period) {
            return;
          }
          return period.nameByClmId[clmId];
        })()
      );
    });
  }

  setUrl(href) {
    const nextState = getUrlState(window.location.origin + href);
    const title = this.pageTitle(nextState);
    history.pushState({ title }, title, href);
    document.title = title;
    this.fetchPeriod(nextState.periodId, nextState);
  }

  componentDidMount() {
    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a");
      if (!anchor) {
        return;
      }
      const href = (anchor.getAttribute && anchor.getAttribute("href")) || "";
      if (!href.startsWith("/")) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      this.setUrl(href);
    });
    window.addEventListener("popstate", (e) => {
      const nextState = getUrlState();
      const pageTitle = (e.state && e.state.title) || this.pageTitle(nextState);
      document.title = pageTitle;
      this.fetchPeriod(nextState.periodId, nextState);
    });
    this.fetchPeriod();
  }

  componentDidCatch(error, info) {
    console.log("DID CATCH");
    console.error(error);
    console.log(info);
    const currCount = this.state.retryCount || 0;
    const retryCount = currCount + 1;
    this.modState({ hasClientError: true, retryCount });
  }

  render() {
    this.isInitialTab = this.isInitialTab && this.initialTab === this.state.tab;
    this.isInitialPid =
      this.isInitialPid && this.initialPid === (this.state.pids || [])[0];
    this.isInitialPeriod =
      this.isInitialPeriod && this.initialPeriodId === this.state.periodId;
    this.isInitialPage =
      this.isInitialPeriod &&
      this.isInitialPage &&
      this.initialPage === this.state.page;
    this.state.getPlayerData = (ind) =>
      (!this.state.isLoading && this.state.players[ind]) || null;
    this.state.isInitialPeriod = this.isInitialPeriod;
    this.state.isInitialPage = this.isInitialPage;
    this.state.isInitialTab = this.isInitialTab;
    this.state.isInitialPid = this.isInitialPid;
    const pids = this.state.pids || [];
    this.state.pidsKey = pids.join("|");
    this.state.setUrl = (href) => this.setUrl(href);
    const givenState = !this.state.hasClientError
      ? this.state
      : {
          ...this.state,
          period: null,
          isLoading: true,
          dismissError: () => this.modState({ hasClientError: false }),
        };
    return <PureApp {...givenState} />;
  }
}
