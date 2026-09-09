import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import CrawlerApp from "./CrawlerApp";
import "./styles/application.css";
import "./styles/concepts.css";
import { parseHudConcept, type HudConcept } from "./shell/hud/hud-presentation";

const concepts = [
  { id: "authority", name: "Authority", description: "A broadcast masthead, dominant collapse clock, and a full-width working surface." },
  { id: "tactical", name: "Tactical", description: "A vertical menu rail, compact telemetry, and an evidence-first working surface." },
  { id: "theater", name: "Theater", description: "A high-contrast system notice, oversized countdown, and layered domain surfaces." },
] as const;

function ConceptLab() {
  const initialConcept = parseHudConcept(new URLSearchParams(window.location.search).get("concept"));
  const [selected, setSelected] = useState<(typeof concepts)[number]>(
    concepts.find((concept) => concept.id === initialConcept) ?? concepts[0],
  );
  const selectConcept = (id: HudConcept) => {
    const concept = concepts.find((candidate) => candidate.id === id) ?? concepts[0];
    setSelected(concept);
    const url = new URL(window.location.href);
    url.searchParams.set("concept", concept.id);
    window.history.replaceState(null, "", url);
  };
  return <div className="concept-lab" data-concept={selected.id}>
    <section className="concept-picker" aria-label="HUD concept comparison">
      <div><strong>HUD CONCEPT LAB</strong><p>Design exploration · not canon appearance. Changes stay in this tab.</p></div>
      <div role="group" aria-label="Design concepts">{concepts.map(concept => <button
        key={concept.id} aria-pressed={selected.id === concept.id} onClick={() => selectConcept(concept.id)}
      >{concept.name}</button>)}</div>
      <p className="concept-description">{selected.description}</p>
    </section>
    <CrawlerApp hudPresentation={selected.id} hudPersistence="isolated" />
  </div>;
}

const root = document.getElementById("root");
if (!root) throw new Error("Concept lab root was not found.");
createRoot(root).render(<StrictMode><ConceptLab /></StrictMode>);
