// Jours fériés en France métropolitaine.

function easterSunday(year) {
  // Algorithme de Meeus / Jones / Butcher
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const key = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

const cache = {};

export function holidaysOf(year) {
  if (cache[year]) return cache[year];
  const easter = easterSunday(year);
  const plus = (n) => new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() + n);
  const list = [
    [new Date(year, 0, 1), "Jour de l'an"],
    [plus(1), "Lundi de Pâques"],
    [new Date(year, 4, 1), "Fête du Travail"],
    [new Date(year, 4, 8), "Victoire 1945"],
    [plus(39), "Ascension"],
    [plus(50), "Lundi de Pentecôte"],
    [new Date(year, 6, 14), "Fête nationale"],
    [new Date(year, 7, 15), "Assomption"],
    [new Date(year, 10, 1), "Toussaint"],
    [new Date(year, 10, 11), "Armistice 1918"],
    [new Date(year, 11, 25), "Noël"],
  ];
  cache[year] = new Map(list.map(([d, name]) => [key(d), name]));
  return cache[year];
}

/** Renvoie le nom du jour férié, ou null. */
export function holidayName(date) {
  return holidaysOf(date.getFullYear()).get(key(date)) || null;
}
