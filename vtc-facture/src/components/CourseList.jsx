import { useMemo, useState } from "react";
import { euro } from "../lib/pricing.js";

export default function CourseList({ courses, onOpen }) {
  const [q, setQ] = useState("");
  const now = new Date();
  const stats = useMemo(() => {
    const month = courses.filter((c) => {
      if (!c.facture) return false;
      const d = new Date(c.facture.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      ca: month.reduce((s, c) => s + c.facture.price.ttc, 0),
      n: month.length,
      devis: courses.filter((c) => !c.facture).length,
    };
  }, [courses]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = [...courses]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .filter((c) => !q || JSON.stringify([c.client, c.depart, c.arrivee, c.devis.numero, c.facture?.numero]).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="screen">
      <h2 className="screen-title">Courses</h2>
      <div className="stats">
        <div className="stat"><div className="stat-v">{euro(stats.ca)}</div><div className="stat-l">Facturé ce mois</div></div>
        <div className="stat"><div className="stat-v">{stats.n}</div><div className="stat-l">Factures</div></div>
        <div className="stat"><div className="stat-v">{stats.devis}</div><div className="stat-l">Devis en cours</div></div>
      </div>
      <input className="search" placeholder="Rechercher un client, une adresse, un numéro…" value={q} onChange={(e) => setQ(e.target.value)} />
      {!list.length && <div className="empty">Aucune course pour l'instant. Dictez votre première course !</div>}
      <ul className="course-list">
        {list.map((c) => {
          const p = c.facture ? c.facture.price : c.devis.price;
          return (
            <li key={c.id} onClick={() => onOpen(c.id)}>
              <div className="cl-main">
                <div className="cl-name">{c.client.nom || "Client"}</div>
                <div className="cl-route">{c.depart} → {c.arrivee}</div>
                <div className="cl-date">{new Date(c.datetime).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
              <div className="cl-side">
                <div className="cl-price">{euro(p.ttc)}</div>
                <span className={`badge ${c.facture ? "f" : "d"}`}>{c.facture ? c.facture.numero : c.devis.numero}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
