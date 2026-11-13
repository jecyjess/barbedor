// Transforme la dictée en fiche de course.
// Avec une clé Anthropic : extraction par Claude. Sinon : analyse locale simple.

const SCHEMA = {
  type: "object",
  properties: {
    client_nom: { type: "string", description: "Nom du client, avec civilité si dite. Vide si inconnu." },
    client_telephone: { type: "string" },
    client_email: { type: "string" },
    depart: { type: "string", description: "Adresse postale courte de prise en charge : numéro, rue, code postal, ville (ou nom du lieu + adresse)" },
    arrivee: { type: "string", description: "Adresse postale courte de destination : numéro, rue, code postal, ville (ou nom du lieu + adresse)" },
    date: { type: "string", description: "Date de la course au format AAAA-MM-JJ. Vide si non dite." },
    heure: { type: "string", description: "Heure de prise en charge au format HH:MM (24 h). Vide si non dite." },
    passagers: { type: "integer" },
    bagages: { type: "integer" },
    distance_km: { type: "number", description: "Distance si elle est dite (km), sinon 0" },
    duree_min: { type: "integer", description: "Durée du trajet si elle est dite (minutes), sinon 0" },
    prix_final: { type: "number", description: "Prix total convenu avec le client si le chauffeur l'annonce (ex. « ça fera 50 euros »), sinon 0" },
    notes: { type: "string", description: "Autres informations utiles (numéro de vol, siège enfant, etc.)" },
  },
  required: ["client_nom", "client_telephone", "client_email", "depart", "arrivee", "date", "heure", "passagers", "bagages", "distance_km", "duree_min", "prix_final", "notes"],
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
      "Résous les dates relatives (« demain », « vendredi ») par rapport à la date du jour. N'invente rien : laisse vide ce qui n'est pas dit, 0 pour un nombre inconnu. " +
      "Adresses (depart, arrivee) : format postal court uniquement — « numéro + rue, code postal + ville » (ex. « 20 rue du Pré aux Saules, 93410 Vaujours »). " +
      "Si le chauffeur part de l'endroit où il se trouve (« je pars d'ici », « de ma position », « là où je suis »), écris exactement MA_POSITION comme départ. " +
      "Jamais de quartier, département, région ni pays. Si le chauffeur nomme un lieu (mairie, gare, hôtel, hôpital, aéroport…), écris le nom du lieu suivi de son adresse " +
      "si tu la connais avec certitude (ex. « Mairie d'Issy-les-Moulineaux, 62 rue du Général Leclerc, 92130 Issy-les-Moulineaux ») ; sinon le nom du lieu et la ville seulement, sans inventer de numéro.",
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
  const out = { client_nom: "", client_telephone: "", client_email: "", depart: "", arrivee: "", date: "", heure: "", passagers: 0, bagages: 0, distance_km: 0, duree_min: 0, prix_final: 0, notes: "" };

  const nom = t.match(/\b(monsieur|madame|mademoiselle|m\.|mme)\s+([A-ZÀ-Ý][\wÀ-ÿ'-]+(?:\s+[A-ZÀ-Ý][\wÀ-ÿ'-]+)?)/i);
  if (nom) out.client_nom = `${nom[1][0].toUpperCase()}${nom[1].slice(1).toLowerCase()} ${nom[2].replace(/\s+(?:de|du|des|d|à|a|au|aux|pour|et|le|la)$/i, "")}`;

  const tel = t.match(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/);
  if (tel) out.client_telephone = tel[0].trim();
  const mail = t.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  if (mail) out.client_email = mail[0];

  // Fin d'un lieu : ponctuation, ou un mot qui annonce autre chose (date, heure, distance…)
  const STOP = String.raw`(?=[,.;!?]|\s(?:demain|après-demain|aujourd|ce soir|ce matin|cet après|le \d|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|à \d|a \d|vers \d|pour \d|\d{1,3}\s?(?:h\b|heures?|km|kilo|min)|dans \d+|dans (?:un|une|deux|cinq|dix|quinze|vingt|trente)|il y a|apparemment|avec|ça fait|ca fait|environ|en passant|et (?:il|elle|on|ça|ca|c'est)|soit)\b|$)`;
  const ART = String.raw`(?:à\s+|au\s+|aux\s+|a\s+|en\s+|chez\s+)?`;
  const tries = [
    // « chercher Mme Leroy à la gare du Nord direction Roissy »
    new RegExp(String.raw`\b(?:chercher|récupérer|prendre|prise en charge)\s+(?:[^,.]*?\s)?(?:à|au|aux)\s+(.+?)\s+(?:pour aller|pour se rendre|direction|à destination de|jusqu'(?:à|au|aux)|vers|pour)\s+` + ART + String.raw`(.+?)` + STOP, "i"),
    // « de Vaujours pour aller à Bobigny », « du 12 rue X jusqu'à Orly »
    new RegExp(String.raw`\b(?:(?:de|du|des|depuis)\s+|d')(.+?)\s+(?:pour aller|pour se rendre|pour rejoindre|et aller|et va|direction|à destination de|jusqu'(?:à|au|aux))\s+` + ART + String.raw`(.+?)` + STOP, "i"),
    // « de X à Y », « de X vers Y »
    new RegExp(String.raw`\b(?:(?:de|du|depuis)\s+|d')(.+?)\s+(?:à|a|au|aux|vers|pour)\s+(?:l'|la\s+|le\s+)?(.+?)` + STOP, "i"),
  ];
  for (const re of tries) {
    const m = t.match(re);
    if (m && m[1].trim().length > 1 && m[2].trim().length > 1) {
      out.depart = m[1].trim();
      out.arrivee = m[2].trim();
      break;
    }
  }
  if (!out.depart) {
    const m = t.match(new RegExp(String.raw`\b(?:parti[es]?|part|partir|départ|prise en charge|chercher|récupérer)\s+(?:de|du|des|d'|depuis|à|au)\s*(.+?)` + STOP, "i"));
    if (m) out.depart = m[1].trim();
  }
  if (!out.arrivee) {
    const m = t.match(new RegExp(String.raw`\b(?:aller|va|direction|destination|déposer|déposé|arrivée)\s+` + ART + String.raw`(.+?)` + STOP, "i"));
    if (m) out.arrivee = m[1].trim();
  }
  const fix = (x) => x.replace(/hors ?lit/gi, "Orly").replace(/\s+(?:et|puis)$/i, "").trim();
  out.depart = fix(out.depart);
  out.arrivee = fix(out.arrivee);
  // « je pars d'ici », « de ma position », « là où je suis » → position GPS du téléphone
  if (/^(?:ici|là|ma position|là où je suis|où je suis|l'endroit où je suis)$/i.test(out.depart) || (!out.depart && /\b(?:je pars d'ici|depuis ici|de ma position|depuis ma position|là où je suis|où je me trouve)\b/i.test(t))) {
    out.depart = "MA_POSITION";
  }

  // Nom sans civilité : « mon père, Jean-Michel », « le client s'appelle Martin »
  if (!out.client_nom) {
    const NOM = String.raw`([A-ZÀ-Ý][a-zà-ÿ]+(?:[- ][A-ZÀ-Ý][a-zà-ÿ]+)?)`;
    const rel = t.match(new RegExp(String.raw`\b(?:[Mm]on|[Mm]a)\s+(père|mère|frère|sœur|soeur|oncle|tante|ami|amie|cousin|cousine|fils|fille|femme|mari|voisin|voisine)\s*,?\s*` + NOM + "?"));
    const dit = t.match(new RegExp(String.raw`\b(?:client|cliente|s'appelle|appelé|appelée|nommé|nommée|nom est|c'est pour)\s*:?\s*` + NOM));
    if (dit) out.client_nom = dit[1];
    else if (rel) out.client_nom = rel[2] ? `${rel[2]} (${rel[1]})` : "";
  }

  const km = t.match(/\b(\d{1,4}(?:[.,]\d)?)\s?(?:km|kilomètres?|kilos?)\b/i);
  if (km) out.distance_km = Number(km[1].replace(",", "."));
  const prix = [...t.matchAll(/\b(\d{1,4}(?:[.,]\d{1,2})?)\s?(?:€|euros?)\b/gi)].at(-1);
  if (prix) out.prix_final = Number(prix[1].replace(",", "."));
  const mn = t.match(/\b(\d{1,3})\s?(?:minutes?|min|mn)\b/i);
  if (mn) out.duree_min = Number(mn[1]);

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
    const mins = h[2] ? +h[2] : /^\s?(?:h|heures?)\s?et demie/i.test(t.slice(h.index + h[1].length)) ? 30 : /^\s?(?:h|heures?)\s?et quart/i.test(t.slice(h.index + h[1].length)) ? 15 : 0;
    out.heure = `${pad(hh)}:${pad(mins)}`;
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
