import { useRef, useState } from "react";
import endSceneHtml from "../components/Endscene.html?raw";
import { isDuplicateTap } from "../utils/tapGuard";

const handleEndSceneClick = () => {
  // iOS fires both pointerdown and click for one tap; dedupe within 500ms.
  if (isDuplicateTap("cta")) {
    return;
  }

  if (typeof window.handleMraidClick === "function") {
    window.handleMraidClick();
    return;
  }

  const mraid = window.mraid || {};
  const clickTarget = window.clickTag || "";

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
};

export const EndScene = ({ onReady }) => {
  const iframeRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  const handleFrameLoad = () => {
    const video =
      iframeRef.current?.contentDocument?.getElementById("sip-video");
    let completed = false;

    const reveal = () => {
      if (completed) return;
      completed = true;
      setIsReady(true);
      onReady?.();
    };

    if (!video || video.readyState >= 2) {
      reveal();
      return;
    }

    video.addEventListener("loadeddata", reveal, { once: true });
    video.addEventListener("canplay", reveal, { once: true });
    video.addEventListener("error", reveal, { once: true });
  };

  return (
    <>
      <iframe
        ref={iframeRef}
        srcDoc={endSceneHtml}
        title="End Scene"
        onLoad={handleFrameLoad}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          border: 0,
          zIndex: 9999,
          background: "transparent",
          pointerEvents: "none",
          opacity: isReady ? 1 : 0,
        }}
      />
      <div
        role="button"
        aria-label="End scene overlay"
        onClick={handleEndSceneClick}
        onPointerDown={handleEndSceneClick}
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 10000,
          cursor: "pointer",
          background: "transparent",
          pointerEvents: isReady ? "auto" : "none",
        }}
      />
    </>
  );
};

export default EndScene;
