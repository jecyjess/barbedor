# VTC Facture

Application mobile (web installable) pour chauffeur VTC en Île-de-France :
**dicter la course → calcul du trajet avec trafic → devis → facture**, en quelques secondes.

## Fonctionnement

1. **Dicter** : bouton micro. L'audio est enregistré et conservé avec la course, le texte s'affiche en direct.
2. **Remplir la fiche** : l'IA (Claude) extrait client, téléphone, départ, arrivée, date, heure, passagers, bagages.
   Sans clé IA, une analyse locale reconnaît les tournures courantes (« du … à …, demain à 7 h 30 »).
3. **Calculer** : distance et durée par Google Maps (trafic prévu à l'heure de la course).
   Sans clé Google : OpenStreetMap + estimation du trafic parisien selon l'heure.
4. **Créer le devis** (vaut bon de réservation préalable), puis **Facturer** une fois la course terminée
   (durée réelle, mode de paiement). Export PDF, partage, WhatsApp, e-mail.

## Grille tarifaire (TTC, modifiable dans Réglages)

| Élément | Valeur |
|---|---|
| Prise en charge | 5 € |
| Kilomètre | 1,50 € (promo : 1,30 €) |
| Majoration nuit (21 h – 6 h), week-end, jours fériés | + 20 % sur prise en charge + km |
| Suppléments aéroport (non majorés) | Orly + 10 €, CDG + 5 €, Beauvais + 15 € |
| Prix minimum | 15 € |
| Temps supplémentaire | 0,30 €/min au-delà de la durée estimée + 5 min de tolérance |
| TVA | 10 % incluse |

## Développement

```bash
npm install
npm run dev      # serveur local
npm test         # tests du calcul de prix et de l'analyse de dictée
npm run build    # version de production (dossier dist/)
```

Les données (courses, numéros de devis/factures, réglages) sont stockées sur l'appareil.
Les numéros de facture sont séquentiels par année (F-2026-0001…) et jamais réutilisés.

## Feuille de route

- Synchronisation cloud et sauvegarde des factures.
- Serveur intermédiaire pour ne plus stocker les clés API sur le téléphone (indispensable avant publication).
- Emballage Play Store / App Store (Capacitor).
