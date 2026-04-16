// Browsers have native EventSource — export it instead of the Node polyfill
// which uses util.inherits and breaks in the browser bundle.
export default globalThis.EventSource;
