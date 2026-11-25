import { isDuplicateTap } from "./tapGuard";

export const PlayableBridge = {
  ready() {
    window.gameReady?.();
    window.mraid?.signalReady?.();
  },

  end() {
    window.gameEnd?.();
  },

  click(providedUrl = "") {
    // iOS tap dedupe: ignore repeat callbacks within 500ms.
    if (isDuplicateTap("cta")) {
      return;
    }

    if (typeof window.handleMraidClick === "function") {
      window.handleMraidClick(providedUrl);
      return;
    }

    const mraid = window.mraid || {};
    const clickTarget =
      providedUrl ||
      window.clickTag ||
      "";

    if (typeof mraid.open === "function") {
      try {
        if (clickTarget) {
          mraid.open(clickTarget);
        } else {
          mraid.open();
        }
      } catch (e) {
        console.log("mraid failed to execute:", e);
      }
    } else {
      console.log("CTA_CLICKED");
    }
  },
};

