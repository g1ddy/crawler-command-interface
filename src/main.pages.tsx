import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CrawlerApp from "./CrawlerApp";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Static application root was not found.");
}

createRoot(root).render(
  <StrictMode>
    <CrawlerApp />
  </StrictMode>,
);
