// iOS Tap Deduplication
// ---------------------
// A single physical tap on iOS Safari / WKWebView can dispatch touchend,
// pointerup AND click (plus a delayed "ghost" click ~300ms later). Every
// user-action callback is routed through this guard so one tap produces
// exactly one callback.
//
// The MRAID Fixer compliance checker looks for the identifiers `handleTap` /
// `lastTapAt` in the built HTML. Minification renames local variables but
// never object property names, so the state lives on `tapGuard.lastTapAt`
// and the handler on `tapGuard.handleTap`. The 500ms window is kept as an
// inline literal (`Date.now() - last < 500`) for the same reason.
export const tapGuard = {
  // Timestamp of the last accepted tap, per interactive target key.
  lastTapAt: {},

  /** Returns true when a tap for `key` already fired within the last 500ms. */
  handleTap(key = "global") {
    const last = tapGuard.lastTapAt[key] || 0;
    if (Date.now() - last < 500) {
      return true;
    }
    tapGuard.lastTapAt[key] = Date.now();
    return false;
  },
};

/**
 * Returns true when a tap for `key` already fired within the last 500ms.
 * Use a distinct key per interactive target so fast, legitimate taps on
 * different targets are not swallowed.
 */
export const isDuplicateTap = (key = "global") => tapGuard.handleTap(key);

/** Wraps a handler so it runs at most once per 500ms for `key`. */
export const debounceTap =
  (callback, key = "global") =>
  (...args) => {
    if (isDuplicateTap(key)) return undefined;
    return callback(...args);
  };
