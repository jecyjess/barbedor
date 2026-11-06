import { describe, it, expect } from "vitest";
import { computePrice, detectAirports, majorationReason } from "./pricing.js";

// Mardi 10 novembre 2026, 14h — journée de semaine, non fériée
const jour = new Date(2026, 10, 10, 14, 0);
const nuit = new Date(2026, 10, 10, 22, 30);
const samedi = new Date(2026, 10, 14, 10, 0);
const ferie = new Date(2026, 10, 11, 10, 0); // 11 novembre (mercredi)

describe("computePrice", () => {
  it("course de jour : prise en charge + km", () => {
    const p = computePrice({ distanceKm: 20, durationMin: 30, date: jour });
    expect(p.ttc).toBe(35); // 5 + 20 × 1,50
    expect(p.majoration).toBeNull();
  });

  it("Paris → CDG 30 km : 55 € le jour, 66 € la nuit", () => {
    expect(computePrice({ distanceKm: 30, durationMin: 40, date: jour, arrivee: "Aéroport CDG Terminal 2E" }).ttc).toBe(55);
    // nuit : (5 + 45) × 1,2 = 60 + 5 (supplément non majoré) = 65
    expect(computePrice({ distanceKm: 30, durationMin: 40, date: nuit, arrivee: "Roissy Charles de Gaulle" }).ttc).toBe(65);
  });

  it("majoration week-end et jours fériés", () => {
    expect(computePrice({ distanceKm: 10, durationMin: 20, date: samedi }).ttc).toBe(24); // 20 × 1,2
    expect(majorationReason(ferie)).toContain("Armistice");
  });

  it("prix minimum de 15 €", () => {
    const p = computePrice({ distanceKm: 3, durationMin: 10, date: jour });
    expect(p.ttc).toBe(15);
    expect(p.lines.at(-1).code).toBe("min");
  });

  it("tarif promotion à 1,30 €/km", () => {
    expect(computePrice({ distanceKm: 20, durationMin: 30, date: jour, promo: true }).ttc).toBe(31);
  });

  it("suppléments Orly et Beauvais", () => {
    expect(computePrice({ distanceKm: 20, durationMin: 30, date: jour, depart: "Orly Sud" }).ttc).toBe(45);
    expect(computePrice({ distanceKm: 90, durationMin: 80, date: jour, arrivee: "Aéroport de Beauvais-Tillé" }).ttc).toBe(155);
  });

  it("minutes supplémentaires au-delà de la tolérance de 5 min", () => {
    const base = { distanceKm: 20, durationMin: 30, date: jour };
    expect(computePrice({ ...base, dureeReelleMin: 35 }).ttc).toBe(35); // dans la tolérance
    const p = computePrice({ ...base, dureeReelleMin: 45 }); // 15 min de dépassement → 10 facturées
    expect(p.minutesSup).toBe(10);
    expect(p.ttc).toBe(38);
  });

  it("TVA 10 % incluse dans le TTC", () => {
    const p = computePrice({ distanceKm: 30, durationMin: 40, date: jour, arrivee: "CDG" });
    expect(p.ht).toBe(50);
    expect(p.tva).toBe(5);
  });

  it("ne confond pas les aéroports avec des noms de rue", () => {
    expect(detectAirports("12 rue de Rivoli, Paris")).toEqual([]);
    expect(detectAirports("Orly", "CDG")).toEqual(["orly", "cdg"]);
  });
});
