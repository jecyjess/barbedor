import { describe, it, expect } from "vitest";
import { shortAddress, shortGoogle } from "./route.js";

describe("adresses courtes", () => {
  it("adresse avec numéro : sans quartier, département, région ni pays", () => {
    expect(shortAddress({
      class: "place", addresstype: "house", name: "",
      address: { house_number: "20", road: "Rue du Pré aux Saules", suburb: "Les Petits Ponts", town: "Vaujours", county: "Seine-Saint-Denis", state: "Île-de-France", postcode: "93410", country: "France" },
      display_name: "20, Rue du Pré aux Saules, Les Petits Ponts, Vaujours, Seine-Saint-Denis, Île-de-France, France métropolitaine, 93410, France",
    })).toBe("20 Rue du Pré aux Saules, 93410 Vaujours");
  });
  it("lieu connu : nom puis adresse", () => {
    expect(shortAddress({
      class: "amenity", addresstype: "amenity", name: "Mairie d'Issy-les-Moulineaux",
      address: { house_number: "62", road: "Rue du Général Leclerc", city: "Issy-les-Moulineaux", county: "Hauts-de-Seine", postcode: "92130", country: "France" },
    })).toBe("Mairie d'Issy-les-Moulineaux, 62 Rue du Général Leclerc, 92130 Issy-les-Moulineaux");
  });
  it("Google : on retire le pays", () => {
    expect(shortGoogle("12 Rue de Rivoli, 75004 Paris, France")).toBe("12 Rue de Rivoli, 75004 Paris");
  });
});
