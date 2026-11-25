import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

let creativeMounted = false;

function mountCreative() {
  if (creativeMounted) return;
  creativeMounted = true;

  window.setupMraidViewability?.();
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

if (window.__appLovinMraidReady) {
  mountCreative();
} else {
  window.addEventListener("applovinMraidReady", mountCreative, { once: true });
}
