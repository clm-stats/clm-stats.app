import { render } from "preact";
export { default as App } from "./js/App.jsx";

export const mount = () => render(App(), document.body);
