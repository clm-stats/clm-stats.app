import { render, h } from "preact";
import * as U from "./util";
import App from "./App";

document.addEventListener("DOMContentLoaded", function () {
  U.setTimeline(document.head[":tl"]);
  render(h(App, {}), document.body);
});
