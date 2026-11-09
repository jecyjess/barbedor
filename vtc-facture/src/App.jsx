import { useState } from "react";
import NewCourse from "./components/NewCourse.jsx";
import CourseList from "./components/CourseList.jsx";
import CourseDetail from "./components/CourseDetail.jsx";
import Settings from "./components/Settings.jsx";
import Onboarding from "./components/Onboarding.jsx";
import { APP_NAME } from "./lib/edition.js";
import { loadCourses, loadSettings, saveCourses, saveSettings } from "./lib/storage.js";

const Icon = {
  mic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>,
  list: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>,
  gear: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>,
};

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [courses, setCourses] = useState(loadCourses);
  const [tab, setTab] = useState("new");
  const [openId, setOpenId] = useState(null);

  const persist = (list) => {
    setCourses(list);
    saveCourses(list);
  };
  const open = courses.find((c) => c.id === openId);
  const go = (t) => {
    setTab(t);
    setOpenId(null);
    window.scrollTo(0, 0);
  };

  if (!settings.configured) {
    return (
      <div className="app">
        <main>
          <Onboarding settings={settings} onDone={(s) => { setSettings(s); saveSettings(s); window.scrollTo(0, 0); }} />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar no-print">
        <div className="brand"><span className="brand-mark">◆</span> {settings.entreprise.marque || settings.entreprise.chauffeur || APP_NAME}</div>
      </header>

      <main>
        {open ? (
          <CourseDetail
            key={open.id}
            course={open}
            settings={settings}
            onBack={() => setOpenId(null)}
            onUpdate={(c) => persist(courses.map((x) => (x.id === c.id ? c : x)))}
            onDelete={(id) => { persist(courses.filter((x) => x.id !== id)); setOpenId(null); }}
          />
        ) : tab === "new" ? (
          <NewCourse settings={settings} onCreated={(c) => { persist([...courses, c]); setTab("list"); setOpenId(c.id); window.scrollTo(0, 0); }} />
        ) : tab === "list" ? (
          <CourseList courses={courses} onOpen={(id) => { setOpenId(id); window.scrollTo(0, 0); }} />
        ) : (
          <Settings settings={settings} onSave={(s) => { setSettings(s); saveSettings(s); }} />
        )}
      </main>

      <nav className="tabbar no-print">
        {[["new", "Dicter", Icon.mic], ["list", "Courses", Icon.list], ["settings", "Réglages", Icon.gear]].map(([id, label, icon]) => (
          <button key={id} className={tab === id && (!openId || id === "list") ? "on" : ""} onClick={() => go(id)}>
            {icon}<span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
