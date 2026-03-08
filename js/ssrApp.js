import { h } from "preact";
import App from "./PureApp";
import * as U from "./util";
import htmlDocTemplate from "./htmlDocTemplate";

export function createDocString(renderElToStr, timeline, periodId, page) {
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
  const bodyEl = h(App, props, []);
  return htmlDocTemplate({
    periodId,
    timeline,
    title: U.pageTitle(props),
    cssPath: "/index.css",
    jsPath: "/index.js",
    body: renderElToStr(bodyEl),
  });
}
