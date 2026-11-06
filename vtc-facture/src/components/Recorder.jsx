import { useEffect, useRef, useState } from "react";

const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

/**
 * Bouton de dictée : enregistre l'audio (conservé avec la course) et
 * retranscrit en direct grâce à la reconnaissance vocale du téléphone.
 */
export default function Recorder({ transcript, onTranscript, onAudio }) {
  const [rec, setRec] = useState(false);
  const [interim, setInterim] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [err, setErr] = useState("");
  const recog = useRef(null);
  const media = useRef(null);
  const chunks = useRef([]);
  const base = useRef("");
  const wanted = useRef(false);

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);

  useEffect(() => () => stop(), []); // eslint-disable-line react-hooks/exhaustive-deps

  async function start() {
    setErr("");
    setSeconds(0);
    base.current = transcript ? transcript.trim() + " " : "";
    wanted.current = true;

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
    } catch {
      setErr("Micro non autorisé : l'audio ne sera pas conservé.");
    }

    if (SR) {
      const r = new SR();
      r.lang = "fr-FR";
      r.continuous = true;
      r.interimResults = true;
      r.onresult = (e) => {
        let fin = "";
        let tmp = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const txt = e.results[i][0].transcript;
          if (e.results[i].isFinal) fin += txt;
          else tmp += txt;
        }
        if (fin) {
          base.current = (base.current + fin.trim() + " ").replace(/\s+/g, " ");
          onTranscript(base.current.trim());
        }
        setInterim(tmp);
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed") setErr("Reconnaissance vocale refusée par le navigateur.");
      };
      // Sur mobile, la reconnaissance s'arrête seule après un silence : on relance.
      r.onend = () => {
        if (wanted.current) {
          try { r.start(); } catch { /* déjà relancée */ }
        }
      };
      r.start();
      recog.current = r;
    } else {
      setErr("Dictée en direct non disponible sur ce navigateur : l'audio est enregistré, vous pouvez taper le texte.");
    }
    setRec(true);
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
      <div className="mic-label">{rec ? <>Enregistrement… <b>{mm}</b> — touchez pour arrêter</> : "Touchez pour dicter la course"}</div>
      {err && <div className="hint warn">{err}</div>}
      <textarea
        className="transcript"
        rows={4}
        placeholder="« Monsieur Dupont, du 12 rue de Rivoli à Orly demain à 7 h 30, deux passagers… »"
        value={transcript + (interim ? (transcript ? " " : "") + interim : "")}
        onChange={(e) => onTranscript(e.target.value)}
      />
    </div>
  );
}
