import { describe, it, expect } from "vitest";
import { applyDevisEdit, nextLetter } from "./revision.js";

const course = {
  client: { nom: "Monsieur Dupnt" }, depart: "Bobigny", arrivee: "Paris",
  devis: { numero: "D-HOLAM-2026-11-001", date: "2026-11-16T09:00:00Z", price: { ttc: 32 }, signature: null },
  facture: null,
};
const now = new Date("2026-11-19T10:00:00Z");

describe("modification du devis", () => {
  it("correction : même numéro, date de modification", () => {
    const c = applyDevisEdit(course, { client: { nom: "Monsieur Dupont" } }, { ttc: 32 }, { now });
    expect(c.devis.numero).toBe("D-HOLAM-2026-11-001");
    expect(c.client.nom).toBe("Monsieur Dupont");
    expect(c.devis.modifie).toBe(now.toISOString());
  });
  it("avenants successifs : -A puis -B, ancienne version archivée", () => {
    const a = applyDevisEdit(course, { arrivee: "Orly" }, { ttc: 45 }, { avenant: true, now });
    expect(a.devis.numero).toBe("D-HOLAM-2026-11-001-A");
    expect(a.devis.versions[0].numero).toBe("D-HOLAM-2026-11-001");
    expect(a.devis.versions[0].snapshot.arrivee).toBe("Paris");
    const b = applyDevisEdit(a, { arrivee: "Roissy" }, { ttc: 50 }, { avenant: true, now });
    expect(b.devis.numero).toBe("D-HOLAM-2026-11-001-B");
    expect(b.devis.versions.map((v) => v.numero)).toEqual(["D-HOLAM-2026-11-001", "D-HOLAM-2026-11-001-A"]);
    expect(nextLetter(b.devis)).toBe("C");
  });
  it("devis signé : avenant obligatoire, signature à refaire", () => {
    const signed = { ...course, devis: { ...course.devis, signature: { nom: "X" } } };
    expect(() => applyDevisEdit(signed, {}, { ttc: 32 }, { now })).toThrow(/avenant/);
    expect(applyDevisEdit(signed, {}, { ttc: 32 }, { avenant: true, now }).devis.signature).toBeNull();
  });
  it("facture émise : plus de modification", () => {
    expect(() => applyDevisEdit({ ...course, facture: { numero: "F" } }, {}, { ttc: 1 }, { now })).toThrow(/facture/);
  });
});
