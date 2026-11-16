import { useEffect, useRef, useState } from "react";
import { euro } from "../lib/pricing.js";

/** Le client signe du doigt sur l'écran pour accepter le devis. */
export default function SignaturePad({ nom: nomInitial, numero, total, onCancel, onSign }) {
  const canvas = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [empty, setEmpty] = useState(true);
  const [nom, setNom] = useState(nomInitial || "");

  useEffect(() => {
    const c = canvas.current;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = c.getBoundingClientRect();
    c.width = width * ratio;
    c.height = height * ratio;
    const ctx = c.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#15161b";
    document.body.style.overflow = "hidden"; // pas de défilement pendant la signature
    return () => { document.body.style.overflow = ""; };
  }, []);

  const point = (e) => {
    const r = canvas.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  function down(e) {
    e.preventDefault();
    canvas.current.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    last.current = point(e);
    const ctx = canvas.current.getContext("2d");
    ctx.beginPath();
    ctx.arc(last.current.x, last.current.y, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = "#15161b";
    ctx.fill();
    setEmpty(false);
  }
  function move(e) {
    if (!drawing.current) return;
    e.preventDefault();
    const p = point(e);
    const ctx = canvas.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }
  const up = () => { drawing.current = false; };
  function clear() {
    const c = canvas.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setEmpty(true);
  }
  function valider() {
    // Version réduite (taille réelle à l'écran, sans la haute définition) : quelques Ko seulement.
    const c = canvas.current;
    const { width, height } = c.getBoundingClientRect();
    const small = document.createElement("canvas");
    small.width = Math.round(width);
    small.height = Math.round(height);
    small.getContext("2d").drawImage(c, 0, 0, small.width, small.height);
    onSign({ image: small.toDataURL("image/png"), nom: nom.trim(), date: new Date().toISOString() });
  }

  return (
    <div className="sign-modal" role="dialog" aria-label="Signature du client">
      <div className="sign-sheet">
        <div className="sign-title">Bon pour accord</div>
        <p className="sign-text">
          J'accepte le devis <b>{numero}</b> d'un montant de <b>{euro(total)}</b> et ses conditions.
        </p>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom du client" autoComplete="off" />
        <div className="sign-area">
          <canvas
            ref={canvas}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onPointerLeave={up}
          />
          {empty && <span className="sign-hint">Signez ici avec le doigt</span>}
        </div>
        <div className="row">
          <button className="btn" onClick={onCancel}>Annuler</button>
          <button className="btn" onClick={clear} disabled={empty}>Effacer</button>
          <button className="btn gold" onClick={valider} disabled={empty || !nom.trim()}>Valider</button>
        </div>
      </div>
    </div>
  );
}
