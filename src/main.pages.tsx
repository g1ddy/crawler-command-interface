import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CrawlerApp from "./CrawlerApp";
import "./styles/application.css";

const root = document.getElementById("root");
if (!root) throw new Error("The GitHub Pages root element was not found.");
createRoot(root).render(<StrictMode><CrawlerApp /></StrictMode>);
