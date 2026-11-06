import { describe, it, expect } from "vitest";
import { extractLocal } from "./extract.js";

const now = new Date(2026, 10, 6, 9, 0); // vendredi 6 nov 2026

describe("extractLocal", () => {
  it("phrase type", () => {
    const r = extractLocal("Monsieur Dupont, du 12 rue de Rivoli à l'aéroport d'Orly demain à 7h30, deux passagers, trois valises, 06 12 34 56 78", now);
    expect(r.client_nom).toBe("Monsieur Dupont");
    expect(r.depart).toBe("12 rue de Rivoli");
    expect(r.arrivee).toMatch(/Orly/);
    expect(r.date).toBe("2026-11-07");
    expect(r.heure).toBe("07:30");
    expect(r.passagers).toBe(2);
    expect(r.bagages).toBe(3);
    expect(r.client_telephone).toBe("06 12 34 56 78");
  });
  it("hors lit → Orly, jour de semaine", () => {
    const r = extractLocal("Madame Martin de la gare de Lyon vers hors lit lundi 18h", now);
    expect(r.arrivee).toBe("Orly");
    expect(r.date).toBe("2026-11-09");
    expect(r.heure).toBe("18:00");
  });
});
