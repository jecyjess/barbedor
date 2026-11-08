import { useEffect, useRef, useState } from "react";

const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

const ERREURS = {
  "not-allowed": "Micro refusé. Autorisez le micro pour ce site dans les réglages du navigateur.",
  "service-not-allowed": "La dictée n'est pas autorisée ici. Ouvrez l'application dans Chrome (Android) ou Safari (iPhone), ou utilisez le micro du clavier.",
  "audio-capture": "Le micro est occupé ou introuvable. Fermez les autres applications qui l'utilisent, puis réessayez.",
  network: "La dictée a besoin d'internet. Vérifiez la connexion, ou utilisez le micro du clavier.",
  "language-not-supported": "Le français n'est pas disponible pour la dictée sur ce téléphone.",
};

/**
 * Bouton de dictée.
 * - Si le téléphone sait transcrire (Chrome Android, Safari iPhone) : transcription en direct.
 *   On n'enregistre PAS l'audio en même temps : sur beaucoup de téléphones, deux utilisations
 *   simultanées du micro empêchent la transcription.
 * - Sinon : enregistrement audio conservé, et on invite à utiliser le micro du clavier.
 */
export default function Recorder({ transcript, onTranscript, onAudio }) {
  const [rec, setRec] = useState(false);
  const [interim, setInterim] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [err, setErr] = useState("");
  const [heard, setHeard] = useState(false);
  const recog = useRef(null);
  const media = useRef(null);
  const chunks = useRef([]);
  const base = useRef("");
  const wanted = useRef(false);
  const fatal = useRef(false);
  const area = useRef(null);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  function startRecognition() {
    const r = new SR();
    r.lang = "fr-FR";
    r.interimResults = true;
    // Phrase par phrase, relancée automatiquement : plus fiable sur Android que le mode continu.
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      let fin = "";
      let tmp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const txt = e.results[i][0].transcript;
        if (e.results[i].isFinal) fin += txt;
        else tmp += txt;
      }
      if (fin.trim()) {
        base.current = (base.current + " " + fin.trim()).replace(/\s+/g, " ").trim();
        onTranscript(base.current);
      }
      setInterim(tmp);
      if (fin || tmp) setHeard(true);
    };
    r.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return; // silence : on relance
      fatal.current = true;
      setErr(ERREURS[e.error] || `Dictée interrompue (${e.error}). Utilisez le micro du clavier.`);
    };
    r.onend = () => {
      setInterim("");
      if (wanted.current && !fatal.current) {
        try {
          r.start();
          return;
        } catch {
          /* relance impossible */
        }
      }
      if (wanted.current) stop();
    };
    try {
      r.start();
      recog.current = r;
      return true;
    } catch {
      return false;
    }
  }

  async function startAudioOnly() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunks.current.length) onAudio?.(new Blob(chunks.current, { type: mr.mimeType || "audio/webm" }));
      };
      mr.start();
      media.current = mr;
      return true;
    } catch {
      setErr("Micro non autorisé. Autorisez le micro pour ce site dans les réglages du navigateur.");
      return false;
    }
  }

  async function start() {
    setErr("");
    setSeconds(0);
    setHeard(false);
    base.current = (transcript || "").trim();
    wanted.current = true;
    fatal.current = false;

    if (SR && startRecognition()) {
      setRec(true);
      return;
    }
    // Pas de transcription possible sur ce navigateur
    if (await startAudioOnly()) {
      setErr("Ce navigateur ne sait pas transcrire la voix. L'audio est enregistré, mais pour le texte, touchez la zone de texte puis le micro de votre clavier.");
      setRec(true);
    } else {
      wanted.current = false;
    }
  }

  function stop() {
    wanted.current = false;
    try { recog.current?.stop(); } catch { /* ignore */ }
    recog.current = null;
    if (media.current?.state === "recording") media.current.stop();
    media.current = null;
    setInterim("");
    setRec(false);
  }

  const mm = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="recorder">
      <button type="button" className={`mic ${rec ? "on" : ""}`} onClick={rec ? stop : start} aria-label={rec ? "Arrêter" : "Dicter"}>
        <span className="mic-ring" />
        {rec ? (
          <svg viewBox="0 0 24 24" width="34" height="34"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
            <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
          </svg>
        )}
      </button>
      <div className="mic-label">
        {rec ? (
          <>{heard ? "J'écoute…" : "Parlez maintenant…"} <b>{mm}</b> — touchez pour arrêter</>
        ) : (
          "Touchez pour dicter la course"
        )}
      </div>
      {rec && interim && <div className="interim">« {interim} »</div>}
      {err && <div className="hint warn">{err}</div>}
      <textarea
        ref={area}
        className="transcript"
        rows={4}
        placeholder="Le texte dicté s'affiche ici. Vous pouvez aussi le taper, ou utiliser le micro de votre clavier."
        value={transcript}
        onChange={(e) => {
          base.current = e.target.value;
          onTranscript(e.target.value);
        }}
      />
      {!SR && !rec && <div className="hint">Astuce : sur ce navigateur, touchez la zone de texte puis le micro du clavier pour dicter.</div>}
    </div>
  );
}
