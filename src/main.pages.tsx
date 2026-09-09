import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CrawlerApp from "./CrawlerApp";
import { resolveHudPresentation } from "./shell/hud/hud-presentation";
import "./styles/application.css";
import "./styles/concepts.css";

const hudPresentation = resolveHudPresentation(
  new URLSearchParams(window.location.search).get("hud"),
);

const root = document.getElementById("root");
if (!root) throw new Error("The GitHub Pages root element was not found.");
createRoot(root).render(
  <StrictMode>
    {hudPresentation === "production" ? <CrawlerApp /> : (
      <div
        className="concept-lab"
        data-concept={hudPresentation}
        data-hud-presentation={hudPresentation}
      >
        <CrawlerApp hudPresentation={hudPresentation} hudPersistence="isolated" />
      </div>
    )}
  </StrictMode>,
);
