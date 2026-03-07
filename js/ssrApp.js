import { h } from "preact";
import App from "./PureApp";
import * as U from "./util";

export function getPageTitle(periodId, page, timeline) {
  U.setTimeline(timeline);
  const props = {
    periodId,
    page,
    isLoading: true,
    pids: [],
    sort: { by: U.resolveSortBy(), dir: U.resolveSortDir() },
    filter: U.getDefaultFilter(periodId),
    prevState: {},
    getPlayerData: () => null,
    isInitialPage: true,
    isInitialPeriod: true,
    isInitialTab: true,
  };
  return U.pageTitle(props);
}

export function createAppEl(periodId, page, timeline) {
  U.setTimeline(timeline);
  const props = {
    periodId,
    page,
    isLoading: true,
    pids: [],
    sort: { by: U.resolveSortBy(), dir: U.resolveSortDir() },
    filter: U.getDefaultFilter(periodId),
    prevState: {},
    getPlayerData: () => null,
    isInitialPage: true,
    isInitialPeriod: true,
    isInitialTab: true,
  };
  return h(App, props, []);
}
