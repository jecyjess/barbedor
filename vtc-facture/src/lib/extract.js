// Transforme la dictée en fiche de course.
// Avec une clé Anthropic : extraction par Claude. Sinon : analyse locale simple.

const SCHEMA = {
  type: "object",
  properties: {
    client_nom: { type: "string", description: "Nom du client, avec civilité si dite. Vide si inconnu." },
    client_telephone: { type: "string" },
    client_email: { type: "string" },
    depart: { type: "string", description: "Adresse de prise en charge complète, telle que comprise" },
    arrivee: { type: "string", description: "Adresse de destination complète" },
    date: { type: "string", description: "Date de la course au format AAAA-MM-JJ. Vide si non dite." },
    heure: { type: "string", description: "Heure de prise en charge au format HH:MM (24 h). Vide si non dite." },
    passagers: { type: "integer" },
    bagages: { type: "integer" },
    notes: { type: "string", description: "Autres informations utiles (numéro de vol, siège enfant, etc.)" },
  },
  required: ["client_nom", "client_telephone", "client_email", "depart", "arrivee", "date", "heure", "passagers", "bagages", "notes"],
  additionalProperties: false,
};

const pad = (n) => String(n).padStart(2, "0");
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export async function extractWithClaude(transcript, apiKey, now = new Date()) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const jour = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const params = {
    model: "claude-opus-5-5",
    max_tokens: 2000,
    output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
    system:
      "Tu aides un chauffeur VTC en Île-de-France à remplir une fiche de course à partir d'une dictée (souvent une conversation avec le client, transcrite automatiquement, avec des fautes possibles). " +
      "Corrige les erreurs évidentes de transcription dans les noms de lieux (ex. « hors lit » = Orly, « roissy » = aéroport Paris-Charles-de-Gaulle). " +
      "Résous les dates relatives (« demain », « vendredi ») par rapport à la date du jour. N'invente rien : laisse vide ce qui n'est pas dit, 0 pour un nombre inconnu.",
    messages: [
      {
        role: "user",
        content: `Nous sommes le ${jour} (${isoDate(now)}), il est ${pad(now.getHours())}:${pad(now.getMinutes())}.\n\nDictée :\n"""${transcript}"""`,
      },
    ],
  };

  let res;
  try {
    res = await client.beta.messages.create({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });
  } catch (e) {
    if (e instanceof Anthropic.BadRequestError) res = await client.messages.create(params);
    else throw e;
  }
  if (res.stop_reason === "refusal") throw new Error("L'IA n'a pas pu traiter cette dictée.");
  const text = res.content.find((b) => b.type === "text")?.text;
  if (!text) throw new Error("Réponse vide de l'IA");
  return JSON.parse(text);
}

const NUM = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8 };
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** Analyse locale, sans IA : repère les tournures les plus courantes. */
export function extractLocal(transcript, now = new Date()) {
  const t = " " + transcript.replace(/\s+/g, " ") + " ";
  const out = { client_nom: "", client_telephone: "", client_email: "", depart: "", arrivee: "", date: "", heure: "", passagers: 0, bagages: 0, notes: "" };

  const nom = t.match(/\b(monsieur|madame|mademoiselle|m\.|mme)\s+([A-ZÀ-Ý][\wÀ-ÿ'-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'-]+)?)/i);
  if (nom) out.client_nom = `${nom[1][0].toUpperCase()}${nom[1].slice(1).toLowerCase()} ${nom[2]}`;

  const tel = t.match(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/);
  if (tel) out.client_telephone = tel[0].trim();
  const mail = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (mail) out.client_email = mail[0];

  const trajet = t.match(/\b(?:du|de|depuis)\s+(.+?)\s+(?:à|a|au|aux|vers|jusqu'?à|pour)\s+(?:l'|la\s+|le\s+)?(.+?)(?=[,.;!?]| demain| aujourd| ce soir| le \d| lundi| mardi| mercredi| jeudi| vendredi| samedi| dimanche| à \d| a \d| vers \d| pour \d| \d{1,2} ?h|$)/i);
  if (trajet) {
    out.depart = trajet[1].trim();
    out.arrivee = trajet[2].trim();
  }
  out.depart = out.depart.replace(/hors ?lit/gi, "Orly");
  out.arrivee = out.arrivee.replace(/hors ?lit/gi, "Orly");

  const d = new Date(now);
  let dateSet = false;
  if (/après[- ]demain/i.test(t)) { d.setDate(d.getDate() + 2); dateSet = true; }
  else if (/\bdemain\b/i.test(t)) { d.setDate(d.getDate() + 1); dateSet = true; }
  else if (/aujourd'?hui|ce soir|ce matin|tout de suite/i.test(t)) dateSet = true;
  else {
    const j = JOURS.findIndex((j) => new RegExp(`\\b${j}\\b`, "i").test(t));
    if (j >= 0) {
      d.setDate(d.getDate() + (((j - d.getDay() + 7) % 7) || 7));
      dateSet = true;
    }
  }
  if (dateSet) out.date = isoDate(d);

  const h = t.match(/\b(\d{1,2})\s?(?:h|heures?)\s?(\d{2})?\b/i);
  if (h && +h[1] < 24) {
    let hh = +h[1];
    if (/du soir|de l'après-midi/i.test(t) && hh < 12) hh += 12;
    out.heure = `${pad(hh)}:${pad(h[2] ? +h[2] : 0)}`;
  }

  const pax = t.match(/\b(\d|un|une|deux|trois|quatre|cinq|six|sept|huit)\s+(?:passagers?|personnes?)/i);
  if (pax) out.passagers = NUM[pax[1].toLowerCase()] || +pax[1];
  const bag = t.match(/\b(\d|un|une|deux|trois|quatre|cinq|six|sept|huit)\s+(?:valises?|bagages?)/i);
  if (bag) out.bagages = NUM[bag[1].toLowerCase()] || +bag[1];
  const vol = t.match(/\bvol\s+([A-Z]{2}\s?\d{2,4})/i);
  if (vol) out.notes = `Vol ${vol[1].toUpperCase()}`;
  return out;
}

export async function extractCourse(transcript, apiKey) {
  if (apiKey) {
    try {
      return { data: await extractWithClaude(transcript, apiKey), engine: "IA Claude" };
    } catch (e) {
      console.warn("Extraction IA impossible, analyse locale :", e);
      return { data: extractLocal(transcript), engine: "analyse locale", error: e.message };
    }
  }
  return { data: extractLocal(transcript), engine: "analyse locale" };
}
