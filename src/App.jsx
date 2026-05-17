import { useState } from "react";

// ══════════════════════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════════════════════

const BARBERS = [
  { id:1, name:"Youssef Amrani",  avatar:"YA", color:"#1A5276", badge:"rousse", shop:"Prestige Barber",   city:"Paris 11ème",  address:"47 rue du Faubourg Saint-Antoine", distance:"1.2 km", rating:4.9, reviews:312, open:true,  bio:"Barbier depuis 15 ans, spécialisé dans les dégradés et la sculpture de barbe.", followers:"2.4k", cuts:"4 800+", phone:"+33 6 12 34 56 78" },
  { id:2, name:"Alejandro Cruz",  avatar:"AC", color:"#8B4513", badge:"or",     shop:"El Maestro Barber", city:"Paris 9ème",   address:"12 rue de la Paix",               distance:"2.8 km", rating:5.0, reviews:589, open:true,  bio:"Champion régional 2023. Spécialiste des coupes classiques et du rasage à l'ancienne.", followers:"5.1k", cuts:"9 200+", phone:"+33 6 98 76 54 32" },
  { id:3, name:"James Okafor",    avatar:"JO", color:"#1E8449", badge:"rousse", shop:"Crown Cut Studio",  city:"Paris 18ème",  address:"8 boulevard de Clichy",           distance:"4.1 km", rating:4.7, reviews:201, open:false, bio:"Expert en textures afro et coupes structurées.", followers:"1.8k", cuts:"3 100+", phone:"+33 6 11 22 33 44" },
  { id:4, name:"Antoine Moreau",  avatar:"AM", color:"#6C3483", badge:"bleue",  shop:"La Tondeuse d'Or", city:"Paris 15ème",  address:"33 rue de la Convention",         distance:"5.3 km", rating:4.5, reviews:134, open:true,  bio:"Barbier familial spécialisé coupes enfants et messieurs.", followers:"980", cuts:"2 400+", phone:"+33 6 55 44 33 22" },
  { id:5, name:"Riku Tanaka",     avatar:"RT", color:"#784212", badge:"bleue",  shop:"Samurai Cuts",      city:"Paris 3ème",   address:"5 rue des Archives",              distance:"3.5 km", rating:4.9, reviews:445, open:true,  bio:"Influence japonaise dans chaque coupe. Précision millimétrique.", followers:"3.2k", cuts:"6 700+", phone:"+33 6 77 88 99 00" },
];

const TARIFS = [
  { label:"Coupe homme",         price:"25€", duration:"30 min" },
  { label:"Dégradé / Fade",      price:"30€", duration:"40 min" },
  { label:"Taille de barbe",     price:"20€", duration:"25 min" },
  { label:"Coupe + Barbe",       price:"45€", duration:"55 min" },
  { label:"Rasage traditionnel", price:"35€", duration:"45 min" },
  { label:"Coupe enfant",        price:"18€", duration:"25 min" },
];

const HOURS = [
  { day:"Lun – Ven", time:"09h00 – 19h30" },
  { day:"Samedi",    time:"09h00 – 18h00" },
  { day:"Dimanche",  time:"Fermé" },
];

const AVIS = [
  { name:"Thomas D.", note:5, date:"Il y a 3 jours",    avatar:"TD", color:"#8B4513", text:"Meilleur barbier de Paris. Le fade est impeccable, rien ne dépasse." },
  { name:"Kevin M.",  note:5, date:"Il y a 1 semaine",  avatar:"KM", color:"#1E8449", text:"Service 5 étoiles. Prend le temps d'écouter ce que tu veux." },
  { name:"Rayan B.",  note:4, date:"Il y a 2 semaines", avatar:"RB", color:"#1A5276", text:"Très bon barbier, cadre stylé, musique top. Légère attente mais ça vaut le coup." },
];

const FEED_POSTS = [
  { id:1, barberId:1, type:"video", title:"Nouveau fade peau aujourd'hui 🔥",     views:"8.2k",  likes:412,  stars:4.9, time:"2h",  color:"#8B4513" },
  { id:2, barberId:2, type:"photo", title:"Barbe sculptée pour un mariage ✂️",    views:"5.1k",  likes:287,  stars:4.8, time:"1j",  color:"#1A5276" },
  { id:3, barberId:5, type:"video", title:"Finition nuque au rasoir — méthode JP", views:"19.7k", likes:1203, stars:4.9, time:"1j",  color:"#784212" },
  { id:4, barberId:1, type:"video", title:"Mon astuce pour les contours nets 💈",  views:"12.3k", likes:891,  stars:5.0, time:"3j",  color:"#1A5276" },
  { id:5, barberId:3, type:"photo", title:"Afro fade structuré — client ravi",     views:"6.4k",  likes:334,  stars:4.7, time:"4j",  color:"#1E8449" },
  { id:6, barberId:2, type:"video", title:"Rasage au coupe-chou en 3 minutes",    views:"24.1k", likes:1876, stars:5.0, time:"5j",  color:"#8B4513" },
];

const TIPS = [
  { id:1, author:"Marco V.", avatar:"MV", color:"#8B4513", category:"Dégradé", likes:234, tip:"Pour un dégradé parfait, commence par le bas à 0, remonte lentement en ouvrant le levier. Pas de pression, laisse la lame glisser." },
  { id:2, author:"Karim B.", avatar:"KB", color:"#1A5276", category:"Barbe",   likes:189, tip:"Avant de sculpter une barbe, huile chauffante 3 min. Les poils se redressent et la lame glisse sans tirer." },
  { id:3, author:"Luis R.",  avatar:"LR", color:"#1E8449", category:"Rasage",  likes:312, tip:"Le secret du rasage au coupe-chou : l'angle de 30° entre la lame et la peau. Entraîne-toi sur un ballon savonné." },
];

const BADGE_CFG = {
  or:     { label:"Barbe d'Or",  color:"#D4AF37", bg:"rgba(212,175,55,0.13)",  icon:"👑" },
  rousse: { label:"Barberousse", color:"#C0392B", bg:"rgba(192,57,43,0.13)",   icon:"⚔️" },
  bleue:  { label:"Barbe Bleue", color:"#2980B9", bg:"rgba(41,128,185,0.13)",  icon:"🔱" },
};

const CATS = ["Tous","Dégradé","Barbe","Rasage","Technique"];

const BANNERS = [
  { id:"concours", type:"event",   label:"BIENTÔT",    titre:"👑 Championnat Barbe d'Or France", desc:"Prépare-toi. Les inscriptions ouvrent bientôt.", color:"rgba(212,175,55,0.05)", border:"rgba(212,175,55,0.22)", icon:"🔔", cta:null },
  { id:"loreal",   type:"sponsor", label:"PARTENAIRE", titre:"💧 L'Oréal Men Expert",             desc:"Soin Barbe Hydra Sensitive — offre exclusive Tayedors", color:"rgba(26,82,118,0.06)", border:"rgba(26,82,118,0.2)", icon:"↗", cta:"Découvrir" },
  { id:"wahl",     type:"sponsor", label:"PARTENAIRE", titre:"⚡ Wahl Professional",              desc:"Tondeuses pro — remise 15% pour les Sculptors Premium", color:"rgba(192,57,43,0.05)", border:"rgba(192,57,43,0.2)", icon:"↗", cta:"Voir l'offre" },
  { id:"proraso",  type:"sponsor", label:"PARTENAIRE", titre:"🌿 Proraso",                        desc:"La gamme rasage traditionnelle des vrais barbiers", color:"rgba(30,132,73,0.05)", border:"rgba(30,132,73,0.2)", icon:"↗", cta:"Explorer" },
];

const CATS_POST = ["Dégradé / Fade","Barbe sculptée","Rasage traditionnel","Coupe classique","Coupe enfant","Technique","Avant / Après"];
const FONDATEUR_RESTANTS = 67;

const CONCOURS_ACTIF = false; // ← true pour activer l'onglet Championnat

const QUALIFIES = [
  { id:1, rank:1,  name:"Alejandro Cruz", avatar:"AC", color:"#8B4513", city:"Madrid",    points:4820, badge:"or",     cat:"Dégradé" },
  { id:2, rank:2,  name:"Youssef Amrani", avatar:"YA", color:"#1A5276", city:"Paris",     points:4103, badge:"rousse", cat:"Barbe sculptée" },
  { id:3, rank:3,  name:"Riku Tanaka",    avatar:"RT", color:"#784212", city:"Tokyo",     points:3987, badge:"rousse", cat:"Technique" },
  { id:4, rank:4,  name:"James Okafor",   avatar:"JO", color:"#1E8449", city:"London",    points:3654, badge:"rousse", cat:"Afro fade" },
  { id:5, rank:5,  name:"Marco Vitale",   avatar:"MV", color:"#922B21", city:"Rome",      points:3401, badge:"bleue",  cat:"Rasage" },
  { id:6, rank:6,  name:"Karim Benzara",  avatar:"KB", color:"#1F618D", city:"Casablanca",points:3287, badge:"bleue",  cat:"Dégradé" },
  { id:7, rank:7,  name:"Antoine Moreau", avatar:"AM", color:"#6C3483", city:"Lyon",      points:3102, badge:"bleue",  cat:"Classique" },
  { id:8, rank:8,  name:"Luis Reyes",     avatar:"LR", color:"#1E8449", city:"Barcelona", points:2988, badge:"bleue",  cat:"Fade" },
  { id:9, rank:9,  name:"Sofiane Merad",  avatar:"SM", color:"#784212", city:"Marseille", points:2841, badge:"bleue",  cat:"Barbe" },
  { id:10,rank:10, name:"Kenji Mori",     avatar:"KM", color:"#2E4053", city:"Osaka",     points:2756, badge:"bleue",  cat:"Précision" },
  { id:11,rank:11, name:"David Mensah",   avatar:"DM", color:"#1E8449", city:"Accra",     points:2634, badge:"bleue",  cat:"Afro" },
  { id:12,rank:12, name:"Pierre Dubois",  avatar:"PD", color:"#6C3483", city:"Bordeaux",  points:2501, badge:"bleue",  cat:"Classique" },
  { id:13,rank:13, name:"Omar Khalil",    avatar:"OK", color:"#8B4513", city:"Dubai",     points:2388, badge:"bleue",  cat:"Barbe" },
  { id:14,rank:14, name:"Stefan Wolf",    avatar:"SW", color:"#2E4053", city:"Berlin",    points:2244, badge:"bleue",  cat:"Dégradé" },
  { id:15,rank:15, name:"Carlos Lima",    avatar:"CL", color:"#922B21", city:"São Paulo", points:2187, badge:"bleue",  cat:"Fade" },
  { id:16,rank:16, name:"Ivan Petrov",    avatar:"IP", color:"#1F618D", city:"Moscou",    points:2098, badge:"bleue",  cat:"Classique" },
];

const DUELS = [
  { id:1, p1:1, p2:16, votes1:1247, votes2:312,  termine:true  },
  { id:2, p1:8, p2:9,  votes1:876,  votes2:934,  termine:true  },
  { id:3, p1:5, p2:12, votes1:1102, votes2:489,  termine:false },
  { id:4, p1:4, p2:13, votes1:null, votes2:null, termine:false },
  { id:5, p1:3, p2:14, votes1:null, votes2:null, termine:false },
  { id:6, p1:6, p2:11, votes1:null, votes2:null, termine:false },
  { id:7, p1:7, p2:10, votes1:null, votes2:null, termine:false },
  { id:8, p1:2, p2:15, votes1:null, votes2:null, termine:false },
];

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS GLOBAUX
// ══════════════════════════════════════════════════════════════════════════════

function Av({ i, size=44, color="#8B4513" }) {
  return <div style={{ width:size, height:size, borderRadius:"50%", background:`linear-gradient(135deg,${color},#111)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:size*.33, fontWeight:700, color:"#D4AF37", border:"2px solid rgba(212,175,55,0.28)", flexShrink:0, fontFamily:"'Playfair Display',serif" }}>{i}</div>;
}

function Sep() {
  return <div style={{ display:"flex", alignItems:"center", gap:10, margin:"13px 0" }}><div style={{ flex:1, height:1, background:"linear-gradient(90deg,transparent,rgba(212,175,55,0.18))" }}/><span style={{ color:"rgba(212,175,55,0.32)", fontSize:12 }}>✂</span><div style={{ flex:1, height:1, background:"linear-gradient(90deg,rgba(212,175,55,0.18),transparent)" }}/></div>;
}

function Stars({ v, n, sm }) {
  return <div style={{ display:"flex", alignItems:"center", gap:3 }}>{[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:sm?10:11, color:s<=Math.round(v)?"#D4AF37":"rgba(212,175,55,0.15)" }}>★</span>)}<span style={{ fontSize:sm?10:11, color:"#D4AF37", fontWeight:700, marginLeft:2 }}>{v}</span>{n&&<span style={{ fontSize:10, color:"rgba(255,255,255,0.25)" }}>({n})</span>}</div>;
}

function BadgePill({ type, sm }) {
  const c = BADGE_CFG[type] || BADGE_CFG.bleue;
  return <span style={{ background:c.bg, border:`1px solid ${c.color}44`, color:c.color, borderRadius:20, padding:sm?"1px 8px":"2px 10px", fontSize:sm?10:11, fontWeight:700, letterSpacing:.8, fontFamily:"'Playfair Display',serif" }}>{c.icon} {c.label}</span>;
}

function SecTitle({ children, action }) {
  return <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}><div style={{ width:3, height:17, background:"#D4AF37", borderRadius:2 }}/><div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700 }}>{children}</div>{action&&<><div style={{ flex:1 }}/><div style={{ fontSize:11, color:"rgba(212,175,55,0.45)" }}>{action}</div></>}</div>;
}

// ══════════════════════════════════════════════════════════════════════════════
// ICÔNES SVG CUSTOM (nav)
// ══════════════════════════════════════════════════════════════════════════════

function IconClap({ size=28, color="#E8E0D0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="4" y="13" width="24" height="16" rx="2" fill={color} opacity="0.9"/>
      <line x1="9"  y1="13" x2="11" y2="29" stroke="#0D0D0D" strokeWidth="1.8"/>
      <line x1="15" y1="13" x2="17" y2="29" stroke="#0D0D0D" strokeWidth="1.8"/>
      <line x1="21" y1="13" x2="23" y2="29" stroke="#0D0D0D" strokeWidth="1.8"/>
      <rect x="4" y="11" width="24" height="3" rx="1" fill={color} opacity="0.55"/>
      <rect x="2" y="4.5" width="17" height="4" rx="1.5" fill={color} opacity="0.85"/>
      <circle cx="3.5" cy="6.5" r="1.5" fill="#D4AF37"/>
      <path d="M19 4.5 L30 6.5 L19 8.5 Z" fill={color} opacity="0.95"/>
      <line x1="19" y1="6.5" x2="30" y2="6.5" stroke="#D4AF37" strokeWidth="1.2"/>
    </svg>
  );
}

function IconBoussole({ size=28, color="#E8E0D0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.5" opacity="0.75"/>
      <circle cx="16" cy="16" r="9"  stroke={color} strokeWidth="0.8" opacity="0.3"/>
      <text x="16" y="7.5"  textAnchor="middle" fontSize="5" fill={color} opacity="0.8" fontWeight="bold">N</text>
      <text x="16" y="28"   textAnchor="middle" fontSize="4" fill={color} opacity="0.4">S</text>
      <text x="4.5" y="17.5" textAnchor="middle" fontSize="4" fill={color} opacity="0.4">O</text>
      <text x="28"  y="17.5" textAnchor="middle" fontSize="4" fill={color} opacity="0.4">E</text>
      <polygon points="16,8 14.8,16 16,15.2 17.2,16" fill="#D4AF37"/>
      <polygon points="16,24 14.8,16 16,16.8 17.2,16" fill={color} opacity="0.35"/>
      <circle cx="16" cy="16" r="2"   fill="#D4AF37"/>
      <circle cx="16" cy="16" r="0.8" fill="#0D0D0D"/>
    </svg>
  );
}

function IconBarbu({ size=28, color="#E8E0D0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M10 15 C10 9 22 9 22 15 L22 19 C22 21 20 22 16 22 C12 22 10 21 10 19 Z" fill={color} opacity="0.85"/>
      <path d="M10 14 C10 9 13 7 16 7 C19 7 22 9 22 14" fill={color} opacity="0.5"/>
      <path d="M22 16 C23.5 16 24.5 17 24.5 18 C24.5 19 23.5 20 22 20" stroke={color} strokeWidth="1.5" fill="none" opacity="0.6"/>
      <circle cx="17.5" cy="15" r="1.2" fill="#0D0D0D" opacity="0.55"/>
      <rect x="14" y="22" width="4" height="2" rx="1" fill={color} opacity="0.65"/>
      <path d="M10 19 C9 25 12 28 16 28 C20 28 23 25 22 19 C20 21 18 22 16 22 C14 22 12 21 10 19 Z" fill={color} opacity="0.9"/>
      <path d="M13.5 19.5 Q15 18 16 19 Q17 18 18.5 19.5" stroke="#0D0D0D" strokeWidth="1" fill="none" opacity="0.45"/>
    </svg>
  );
}

function IconTrophy({ size=28, color="#E8E0D0" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect x="11" y="24" width="10" height="3" rx="1" fill={color} opacity="0.7"/>
      <rect x="8"  y="27" width="16" height="2.5" rx="1" fill={color} opacity="0.6"/>
      <path d="M8 6 L8 18 C8 22 24 22 24 18 L24 6 Z" fill={color} opacity="0.85"/>
      <path d="M8 8 C5 8 4 10 4 12 C4 15 6 17 8 17"   stroke={color} strokeWidth="2" fill="none" opacity="0.6"/>
      <path d="M24 8 C27 8 28 10 28 12 C28 15 26 17 24 17" stroke={color} strokeWidth="2" fill="none" opacity="0.6"/>
      <line x1="12" y1="24" x2="12" y2="22" stroke={color} strokeWidth="1.5" opacity="0.6"/>
      <line x1="20" y1="24" x2="20" y2="22" stroke={color} strokeWidth="1.5" opacity="0.6"/>
      <circle cx="16" cy="13" r="2.5" fill="#D4AF37" opacity="0.9"/>
    </svg>
  );
}

function NavIcon({ name, active }) {
  const color = active ? "#D4AF37" : "rgba(232,224,208,0.42)";
  if (name==="clap")     return <IconClap     size={26} color={color}/>;
  if (name==="boussole") return <IconBoussole size={26} color={color}/>;
  if (name==="barbu")    return <IconBarbu    size={26} color={color}/>;
  if (name==="trophy")   return <IconTrophy   size={26} color={color}/>;
  return null;
}

// ══════════════════════════════════════════════════════════════════════════════
// BANNER ROTATIF
// ══════════════════════════════════════════════════════════════════════════════

function BannerRotatif() {
  const [idx, setIdx] = useState(0);
  const [sponsored, setSponsored] = useState(null);

  useState(() => {
    const id = setInterval(() => setIdx(i => (i+1) % BANNERS.length), 8000);
    return () => clearInterval(id);
  });

  const b = BANNERS[idx];
  const isEvent = b.type === "event";

  if (sponsored) return (
    <div style={{ background:"linear-gradient(135deg,#141414,#0e0e0e)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:20, animation:"fadeUp .35s ease" }}>
      <button onClick={()=>setSponsored(null)} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:12, cursor:"pointer", padding:0, marginBottom:14 }}>‹ Fermer</button>
      <div style={{ fontSize:10, color:"rgba(212,175,55,0.5)", letterSpacing:1.5, marginBottom:8 }}>PARTENAIRE OFFICIEL</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:"#D4AF37", marginBottom:8 }}>{sponsored.titre}</div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:16 }}>{sponsored.desc}</div>
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"12px 14px", marginBottom:16 }}>
        <div style={{ fontSize:11, color:"rgba(212,175,55,0.6)" }}>✓ Produits testés et approuvés par nos Grand Maîtres</div>
      </div>
      <button style={{ width:"100%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"none", borderRadius:12, padding:14, color:"#0D0D0D", fontSize:13, fontWeight:900, fontFamily:"'Playfair Display',serif", cursor:"pointer" }}>
        DÉCOUVRIR LA COLLECTION →
      </button>
    </div>
  );

  return (
    <div onClick={b.cta ? ()=>setSponsored(b) : undefined}
      style={{ background:b.color, border:`1px ${isEvent?"dashed":"solid"} ${b.border}`, borderRadius:14, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:b.cta?"pointer":"default", transition:"all .4s ease" }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:9, color:isEvent?"rgba(212,175,55,0.55)":"rgba(255,255,255,0.35)", letterSpacing:1.5, marginBottom:3, fontWeight:700 }}>{b.label}</div>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:isEvent?"#D4AF37":"#E8E0D0", marginBottom:2 }}>{b.titre}</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.32)" }}>{b.desc}</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, marginLeft:12, flexShrink:0 }}>
        <span style={{ fontSize:20, opacity:isEvent?.35:1 }}>{b.icon}</span>
        {b.cta && <div style={{ background:"rgba(212,175,55,0.15)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:20, padding:"2px 8px", fontSize:9, color:"#D4AF37", fontWeight:700 }}>{b.cta}</div>}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// FEED SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function FeedScreen({ onOpenProfile }) {
  const [cat, setCat]         = useState("Tous");
  const [likes, setLikes]     = useState([]);
  const [tipLikes, setTipLikes] = useState([]);
  const toggle    = id => setLikes(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleTip = id => setTipLikes(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  return (
    <div>
      {/* Filtres */}
      <div style={{ padding:"12px 20px 10px", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:4 }}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{ background:cat===c?"rgba(212,175,55,0.16)":"rgba(255,255,255,0.04)", border:cat===c?"1px solid #D4AF37":"1px solid rgba(255,255,255,0.08)", color:cat===c?"#D4AF37":"rgba(255,255,255,0.38)", borderRadius:20, padding:"5px 13px", fontSize:11, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", transition:"all .2s", flexShrink:0 }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Top semaine */}
      <div style={{ padding:"14px 20px 6px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <div style={{ width:3, height:17, background:"#D4AF37", borderRadius:2 }}/>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700 }}>Top de la semaine</div>
          <div style={{ flex:1 }}/><div style={{ fontSize:11, color:"rgba(212,175,55,0.45)" }}>Voir tout →</div>
        </div>
        <div style={{ display:"flex", gap:10, overflowX:"auto", paddingBottom:6 }}>
          {BARBERS.slice(0,4).map((b,i)=>(
            <button key={b.id} onClick={()=>onOpenProfile(b.id)} style={{ minWidth:110, borderRadius:14, overflow:"hidden", border:`1px solid ${i===0?"rgba(212,175,55,0.4)":"rgba(255,255,255,0.08)"}`, background:`linear-gradient(160deg,${b.color}22,#0e0e0e)`, flexShrink:0, cursor:"pointer", padding:0, textAlign:"center" }}>
              <div style={{ height:64, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", background:`linear-gradient(135deg,${b.color}44,transparent)` }}>
                <Av i={b.avatar} size={36} color={b.color}/>
                <div style={{ position:"absolute", top:5, left:7, fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:900, color:i===0?"#D4AF37":"rgba(255,255,255,0.18)" }}>#{i+1}</div>
              </div>
              <div style={{ padding:"7px 8px" }}>
                <div style={{ fontSize:10, fontWeight:700, color:"#E8E0D0", marginBottom:3 }}>{b.name.split(" ")[0]}</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:2 }}>
                  <span style={{ fontSize:10, color:"#D4AF37" }}>★</span>
                  <span style={{ fontSize:10, color:"#D4AF37", fontWeight:700 }}>{b.rating}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <Sep/>

      {/* Posts */}
      <div style={{ padding:"0 20px" }}>
        <SecTitle>Publications récentes</SecTitle>
        {FEED_POSTS.map(p => {
          const barber = BARBERS.find(b=>b.id===p.barberId);
          return (
            <div key={p.id} style={{ background:"linear-gradient(160deg,#141414,#0e0e0e)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:18, overflow:"hidden", marginBottom:14 }}>
              <div style={{ height:160, position:"relative", background:`linear-gradient(135deg,${p.color}33,#0D0D0D 70%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <div style={{ position:"absolute", inset:0, opacity:.05, backgroundImage:"repeating-linear-gradient(45deg,#D4AF37 0,#D4AF37 1px,transparent 0,transparent 50%)", backgroundSize:"12px 12px" }}/>
                {p.type==="video"
                  ? <div style={{ width:50, height:50, borderRadius:"50%", background:"rgba(212,175,55,0.12)", border:"2px solid rgba(212,175,55,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:20, marginLeft:3 }}>▶</span></div>
                  : <span style={{ fontSize:34, opacity:.35 }}>📷</span>}
                <div style={{ position:"absolute", top:8, left:10, background:"rgba(0,0,0,0.6)", borderRadius:20, padding:"2px 10px", fontSize:10, color:p.type==="video"?"#D4AF37":"#8ab4f8", fontWeight:700 }}>{p.type==="video"?"▶ VIDÉO":"📷 PHOTO"}</div>
              </div>
              <button onClick={()=>onOpenProfile(barber.id)} style={{ width:"100%", background:"rgba(255,255,255,0.03)", border:"none", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, cursor:"pointer", textAlign:"left" }}>
                <div style={{ position:"relative" }}>
                  <Av i={barber.avatar} size={34} color={barber.color}/>
                  <span style={{ position:"absolute", bottom:-2, right:-2, fontSize:10 }}>{BADGE_CFG[barber.badge].icon}</span>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"#E8E0D0" }}>{barber.name}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)" }}>{barber.shop}</div>
                </div>
                <div style={{ flex:1 }}/><div style={{ fontSize:11, color:"rgba(212,175,55,0.5)" }}>Voir profil →</div>
              </button>
              <div style={{ padding:"11px 14px" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, marginBottom:8 }}>{p.title}</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", gap:12 }}>
                    <button onClick={()=>toggle(p.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:4, padding:0, color:likes.includes(p.id)?"#D4AF37":"rgba(255,255,255,0.3)", fontSize:12, transition:"all .2s" }}>
                      <span style={{ fontSize:15 }}>{likes.includes(p.id)?"♥":"♡"}</span>{p.likes+(likes.includes(p.id)?1:0)}
                    </button>
                    <div style={{ display:"flex", alignItems:"center", gap:4, color:"rgba(255,255,255,0.28)", fontSize:12 }}>👁 {p.views}</div>
                  </div>
                  <Stars v={p.stars} sm/>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div style={{ padding:"0 20px" }}>
        <Sep/><SecTitle>Tips de la communauté</SecTitle>
        {TIPS.map(t=>(
          <div key={t.id} style={{ background:"linear-gradient(135deg,#141414,#0f0f0f)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:16, marginBottom:12 }}>
            <div style={{ display:"flex", gap:10, marginBottom:10 }}>
              <Av i={t.avatar} size={36} color={t.color}/>
              <div>
                <div style={{ fontWeight:700, fontSize:12 }}>{t.author}</div>
                <span style={{ background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.18)", color:"rgba(212,175,55,0.65)", borderRadius:10, padding:"1px 7px", fontSize:10, fontWeight:700 }}>{t.category}</span>
              </div>
            </div>
            <p style={{ fontSize:12, lineHeight:1.75, color:"rgba(255,255,255,0.65)", marginBottom:10 }}>{t.tip}</p>
            <button onClick={()=>toggleTip(t.id)} style={{ background:tipLikes.includes(t.id)?"rgba(212,175,55,0.1)":"transparent", border:tipLikes.includes(t.id)?"1px solid rgba(212,175,55,0.3)":"1px solid rgba(255,255,255,0.08)", color:tipLikes.includes(t.id)?"#D4AF37":"rgba(255,255,255,0.3)", borderRadius:20, padding:"4px 14px", fontSize:11, cursor:"pointer", transition:"all .2s" }}>
              {tipLikes.includes(t.id)?"✦":"✧"} {t.likes+(tipLikes.includes(t.id)?1:0)}
            </button>
          </div>
        ))}
      </div>

      {/* Banner rotatif */}
      <div style={{ padding:"8px 20px 20px" }}><BannerRotatif/></div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CARTE SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function CarteScreen({ onOpenProfile }) {
  const [selected, setSelected] = useState(1);
  const barber = BARBERS.find(b=>b.id===selected);
  const positions = [{id:1,x:52,y:55},{id:2,x:28,y:30},{id:3,x:35,y:18},{id:4,x:18,y:70},{id:5,x:65,y:42}];

  return (
    <div style={{ padding:"16px 20px 0" }}>
      <SecTitle>Barbiers près de moi</SecTitle>
      {/* Carte */}
      <div style={{ position:"relative", height:260, borderRadius:16, overflow:"hidden", border:"1px solid rgba(212,175,55,0.2)", background:"#0f1a0f", backgroundImage:`linear-gradient(rgba(212,175,55,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,0.04) 1px,transparent 1px)`, backgroundSize:"28px 28px", marginBottom:14 }}>
        <svg width="100%" height="260" style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
          <line x1="0" y1="130" x2="100%" y2="130" stroke="rgba(212,175,55,0.1)" strokeWidth="8"/>
          <line x1="50%" y1="0" x2="50%" y2="260" stroke="rgba(212,175,55,0.07)" strokeWidth="5"/>
        </svg>
        <div style={{ position:"absolute", left:"48%", top:"58%", transform:"translate(-50%,-50%)", zIndex:5 }}>
          <div style={{ width:12, height:12, borderRadius:"50%", background:"#4A90E2", border:"3px solid white", boxShadow:"0 0 0 6px rgba(74,144,226,0.25)" }}/>
        </div>
        {positions.map(pos => {
          const b = BARBERS.find(x=>x.id===pos.id);
          const isSel = selected===b.id;
          return (
            <button key={b.id} onClick={()=>setSelected(b.id)} style={{ position:"absolute", left:`${pos.x}%`, top:`${pos.y}%`, transform:"translate(-50%,-100%)", background:"none", border:"none", cursor:"pointer", zIndex:isSel?10:4, padding:0 }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:isSel?44:36, height:isSel?44:36, borderRadius:"50%", background:isSel?"linear-gradient(135deg,#D4AF37,#8B6914)":BADGE_CFG[b.badge].bg, border:`2px solid ${isSel?"#D4AF37":BADGE_CFG[b.badge].color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:isSel?12:10, fontWeight:700, color:isSel?"#0D0D0D":BADGE_CFG[b.badge].color, transition:"all .25s", fontFamily:"'Playfair Display',serif" }}>{b.avatar}</div>
                <div style={{ width:2, height:isSel?10:6, background:isSel?"#D4AF37":BADGE_CFG[b.badge].color, borderRadius:1, marginTop:1 }}/>
              </div>
            </button>
          );
        })}
      </div>

      {/* Fiche sélectionnée */}
      {barber && (
        <div style={{ background:"linear-gradient(135deg,#1a1208,#0e0e0e)", border:"1px solid rgba(212,175,55,0.25)", borderRadius:16, padding:16, marginBottom:14 }}>
          <div style={{ display:"flex", gap:12, marginBottom:12 }}>
            <div style={{ position:"relative" }}>
              <Av i={barber.avatar} size={50} color={barber.color}/>
              <span style={{ position:"absolute", bottom:-2, right:-2, fontSize:13 }}>{BADGE_CFG[barber.badge].icon}</span>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:700, marginBottom:2 }}>{barber.name}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginBottom:4 }}>{barber.shop} · {barber.city}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <Stars v={barber.rating} n={barber.reviews} sm/>
                <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>· {barber.distance}</span>
              </div>
            </div>
            <div style={{ fontSize:10, background:barber.open?"rgba(34,197,94,0.15)":"rgba(239,68,68,0.15)", border:`1px solid ${barber.open?"#22c55e":"#ef4444"}`, borderRadius:20, padding:"2px 10px", color:barber.open?"#22c55e":"#ef4444", fontWeight:700, alignSelf:"flex-start" }}>
              {barber.open?"Ouvert":"Fermé"}
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>onOpenProfile(barber.id)} style={{ flex:2, background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"none", borderRadius:10, padding:"10px", color:"#0D0D0D", fontSize:12, fontWeight:900, fontFamily:"'Playfair Display',serif", cursor:"pointer" }}>Voir le profil →</button>
            <button style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px", color:"rgba(255,255,255,0.55)", fontSize:12, cursor:"pointer" }}>🗺</button>
            <button style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px", color:"rgba(255,255,255,0.55)", fontSize:12, cursor:"pointer" }}>📞</button>
          </div>
        </div>
      )}

      {/* Liste */}
      <SecTitle>Tous les salons</SecTitle>
      {BARBERS.map(b=>(
        <button key={b.id} onClick={()=>{ setSelected(b.id); onOpenProfile(b.id); }} style={{ width:"100%", background:selected===b.id?"linear-gradient(135deg,#1a1208,#0e0e0e)":"rgba(255,255,255,0.02)", border:selected===b.id?"1px solid rgba(212,175,55,0.22)":"1px solid rgba(255,255,255,0.06)", borderRadius:14, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:12, cursor:"pointer", textAlign:"left", transition:"all .2s" }}>
          <div style={{ position:"relative" }}>
            <Av i={b.avatar} size={42} color={b.color}/>
            <span style={{ position:"absolute", bottom:-2, right:-2, fontSize:11 }}>{BADGE_CFG[b.badge].icon}</span>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:2 }}>{b.name}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{b.shop} · {b.distance}</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#D4AF37" }}>{b.rating} ★</div>
            <div style={{ fontSize:10, color:b.open?"#22c55e":"rgba(239,68,68,0.6)", marginTop:2 }}>{b.open?"Ouvert":"Fermé"}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PROFIL SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function ProfilScreen({ barberId, onBack }) {
  const [ptab, setPtab] = useState("feed");
  const [following, setFollowing] = useState(false);
  const b = BARBERS.find(x=>x.id===barberId) || BARBERS[0];
  const posts = FEED_POSTS.filter(p=>p.barberId===b.id);

  return (
    <div style={{ animation:"fadeUp .3s ease" }}>
      {/* Cover */}
      <div style={{ height:160, position:"relative", overflow:"hidden", background:`linear-gradient(160deg,${b.color}33,#0a0a0a)`, backgroundImage:"repeating-linear-gradient(45deg,rgba(212,175,55,0.025) 0,rgba(212,175,55,0.025) 1px,transparent 0,transparent 50%)", backgroundSize:"18px 18px" }}>
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", gap:24, opacity:.06, fontSize:52 }}>✂ 🪒 ✂</div>
        {onBack && <button onClick={onBack} style={{ position:"absolute", top:16, left:16, width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,0.55)", border:"1px solid rgba(255,255,255,0.15)", color:"#E8E0D0", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>}
        <button style={{ position:"absolute", top:16, right:16, width:34, height:34, borderRadius:"50%", background:"rgba(0,0,0,0.55)", border:"1px solid rgba(255,255,255,0.15)", color:"#E8E0D0", fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>↗</button>
        <div style={{ position:"absolute", bottom:12, right:14, background:b.open?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)", border:`1px solid ${b.open?"#22c55e":"#ef4444"}`, borderRadius:20, padding:"3px 10px", fontSize:10, color:b.open?"#22c55e":"#ef4444", fontWeight:700 }}>{b.open?"● Ouvert":"● Fermé"}</div>
      </div>

      <div style={{ position:"relative", marginTop:-42, marginLeft:20, display:"inline-block", zIndex:10 }}>
        <Av i={b.avatar} size={84} color={b.color}/>
        <div style={{ position:"absolute", bottom:0, right:-2, background:"#0D0D0D", borderRadius:"50%", padding:2 }}><span style={{ fontSize:18 }}>{BADGE_CFG[b.badge].icon}</span></div>
      </div>

      <div style={{ position:"relative", marginTop:-50, marginRight:16, display:"flex", gap:8, justifyContent:"flex-end", marginBottom:8 }}>
        <button onClick={()=>setFollowing(f=>!f)} style={{ background:following?"rgba(212,175,55,0.14)":"linear-gradient(135deg,#D4AF37,#8B6914)", border:following?"1px solid #D4AF37":"none", borderRadius:20, padding:"8px 18px", color:following?"#D4AF37":"#0D0D0D", fontSize:12, fontWeight:900, cursor:"pointer", fontFamily:"'Playfair Display',serif", transition:"all .25s" }}>
          {following?"✓ Abonné":"+ Suivre"}
        </button>
        <button style={{ width:36, height:36, borderRadius:"50%", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>💬</button>
      </div>

      <div style={{ padding:"0 20px" }}>
        <BadgePill type={b.badge} sm/>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:21, fontWeight:900, marginTop:8, marginBottom:2 }}>{b.name}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.42)", marginBottom:4 }}>Maître Barbier · {b.shop}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", marginBottom:10 }}>📍 {b.address}, {b.city} <span style={{ marginLeft:8, background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:10, padding:"1px 8px", fontSize:10, color:"rgba(212,175,55,0.6)" }}>{b.distance}</span></div>
        <p style={{ fontSize:13, color:"rgba(255,255,255,0.58)", lineHeight:1.7, marginBottom:14 }}>{b.bio}</p>

        <div style={{ display:"flex", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:14, overflow:"hidden", marginBottom:18 }}>
          {[[b.followers,"Abonnés"],[`${b.rating}★`,"Note"],[b.reviews,"Avis"],[b.cuts,"Coupes"]].map(([n,l],i)=>(
            <div key={l} style={{ flex:1, textAlign:"center", padding:"11px 4px", borderRight:i<3?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:900, color:i===1?"#D4AF37":"#E8E0D0" }}>{n}</div>
              <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)", marginBottom:0 }}>
          {[["feed","Publications"],["infos","Infos & Tarifs"],["avis","Avis"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPtab(id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"9px 4px", fontSize:11, fontWeight:700, color:ptab===id?"#D4AF37":"rgba(255,255,255,0.32)", borderBottom:ptab===id?"2px solid #D4AF37":"2px solid transparent", transition:"all .2s", fontFamily:"'Playfair Display',serif" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"18px 20px 40px" }}>
        {ptab==="feed" && (
          <div>
            {posts.length===0
              ? <div style={{ textAlign:"center", padding:"30px 0", color:"rgba(255,255,255,0.3)" }}>Aucune publication</div>
              : posts.map(p=>(
                <div key={p.id} style={{ background:"linear-gradient(160deg,#141414,#0e0e0e)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:16, overflow:"hidden", marginBottom:12 }}>
                  <div style={{ height:140, position:"relative", background:`linear-gradient(135deg,${p.color}33,#0D0D0D 70%)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {p.type==="video"
                      ? <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(212,175,55,0.12)", border:"2px solid rgba(212,175,55,0.4)", display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ fontSize:18, marginLeft:2 }}>▶</span></div>
                      : <span style={{ fontSize:28, opacity:.35 }}>📷</span>}
                  </div>
                  <div style={{ padding:"11px 14px" }}>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, marginBottom:7 }}>{p.title}</div>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", gap:10, color:"rgba(255,255,255,0.3)", fontSize:12 }}><span>♡ {p.likes}</span><span>👁 {p.views}</span></div>
                      <Stars v={p.stars} sm/>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {ptab==="infos" && (
          <div>
            <SecTitle>Horaires</SecTitle>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
              {HOURS.map((h,i)=>(
                <div key={h.day} style={{ display:"flex", justifyContent:"space-between", padding:"11px 14px", borderBottom:i<HOURS.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <span style={{ fontSize:13, color:"rgba(255,255,255,0.55)" }}>{h.day}</span>
                  <span style={{ fontSize:13, fontWeight:700, color:h.time==="Fermé"?"rgba(239,68,68,0.65)":"#E8E0D0" }}>{h.time}</span>
                </div>
              ))}
            </div>
            <Sep/>
            <SecTitle>Tarifs</SecTitle>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, overflow:"hidden", marginBottom:16 }}>
              {TARIFS.map((t,i)=>(
                <div key={t.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 14px", borderBottom:i<TARIFS.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700 }}>{t.label}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>⏱ {t.duration}</div>
                  </div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:15, fontWeight:900, color:"#D4AF37" }}>{t.price}</div>
                </div>
              ))}
            </div>
            <button style={{ width:"100%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"none", borderRadius:12, padding:14, color:"#0D0D0D", fontSize:13, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.2, cursor:"pointer" }}>📅 PRENDRE RENDEZ-VOUS</button>
          </div>
        )}

        {ptab==="avis" && (
          <div>
            <div style={{ background:"linear-gradient(135deg,#1a1208,#0e0e0e)", border:"1px solid rgba(212,175,55,0.18)", borderRadius:16, padding:20, textAlign:"center", marginBottom:18 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:52, fontWeight:900, color:"#D4AF37", lineHeight:1 }}>{b.rating}</div>
              <div style={{ display:"flex", justifyContent:"center", gap:4, margin:"8px 0" }}>{[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:18, color:"#D4AF37" }}>★</span>)}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)" }}>Basé sur {b.reviews} avis</div>
            </div>
            {AVIS.map(a=>(
              <div key={a.name} style={{ background:"linear-gradient(135deg,#141414,#0f0f0f)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:13, padding:14, marginBottom:10 }}>
                <div style={{ display:"flex", gap:10, marginBottom:8 }}>
                  <Av i={a.avatar} size={36} color={a.color}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <div style={{ fontWeight:700, fontSize:12 }}>{a.name}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.28)" }}>{a.date}</div>
                    </div>
                    <div style={{ display:"flex", gap:2, marginTop:3 }}>{[1,2,3,4,5].map(s=><span key={s} style={{ fontSize:10, color:s<=a.note?"#D4AF37":"rgba(212,175,55,0.15)" }}>★</span>)}</div>
                  </div>
                </div>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.62)", lineHeight:1.7 }}>{a.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// INSCRIPTION — FORMULAIRE UNIFIÉ
// ══════════════════════════════════════════════════════════════════════════════

function FieldInput({ label, placeholder, type="text", value, onChange, hint }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, color:"rgba(212,175,55,0.65)", marginBottom:7 }}>{label}</div>
      <input type={type} placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)}
        style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"13px 14px", fontSize:13, color:"#E8E0D0", outline:"none", fontFamily:"'Lato',sans-serif" }}
        onFocus={e=>e.target.style.borderColor="rgba(212,175,55,0.4)"}
        onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.1)"}
      />
      {hint && <div style={{ fontSize:10, color:"rgba(255,255,255,0.25)", marginTop:5 }}>{hint}</div>}
    </div>
  );
}

function ChipsField({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, color:"rgba(212,175,55,0.65)", marginBottom:8 }}>{label}</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
        {options.map(o=>(
          <button key={o} onClick={()=>onChange(o)} style={{ background:value===o?"rgba(212,175,55,0.18)":"rgba(255,255,255,0.04)", border:value===o?"1px solid #D4AF37":"1px solid rgba(255,255,255,0.08)", color:value===o?"#D4AF37":"rgba(255,255,255,0.45)", borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all .2s" }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function Accordion({ icon, titre, couleur, ouvert, onToggle, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <button onClick={onToggle} style={{ width:"100%", background:ouvert?`${couleur}11`:"rgba(255,255,255,0.03)", border:`1px solid ${ouvert?couleur+"44":"rgba(255,255,255,0.08)"}`, borderRadius:ouvert?"14px 14px 0 0":14, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", transition:"all .25s", textAlign:"left" }}>
        <span style={{ fontSize:22 }}>{icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:ouvert?couleur:"#E8E0D0" }}>{titre}</div>
          {!ouvert && <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Appuie pour remplir</div>}
        </div>
        <div style={{ fontSize:18, color:ouvert?couleur:"rgba(255,255,255,0.25)", transition:"transform .25s", transform:ouvert?"rotate(90deg)":"none" }}>›</div>
      </button>
      {ouvert && (
        <div style={{ background:"rgba(255,255,255,0.02)", border:`1px solid ${couleur}33`, borderTop:"none", borderRadius:"0 0 14px 14px", padding:"16px 16px 8px", animation:"fadeUp .25s ease" }}>
          {children}
        </div>
      )}
    </div>
  );
}

function NouvelleInscription({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ prenom:"", nom:"", email:"", ville:"", password:"", reseaux:"", artisan:false, shop:"", statut:"", specialite:"", tayedor:false, barbier:"" });
  const set = k => v => setForm(p=>({...p,[k]:v}));
  const toggle = k => () => setForm(p=>({...p,[k]:!p[k]}));
  const ok = form.prenom && form.nom && form.email && form.ville && form.password;

  if (step===2) return (
    <div style={{ minHeight:"80vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:30, textAlign:"center", animation:"fadeUp .4s ease" }}>
      <div style={{ width:84, height:84, borderRadius:"50%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:38, marginBottom:20, boxShadow:"0 0 40px rgba(212,175,55,0.45)" }}>🏅</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:900, color:"#D4AF37", marginBottom:8 }}>Bienvenue, Fondateur !</div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", lineHeight:1.8, marginBottom:20 }}>
        Premium <span style={{ color:"#D4AF37", fontWeight:700 }}>6 mois offerts</span> · Badge Fondateur à vie
      </div>
      <div style={{ display:"flex", gap:10, marginBottom:24, justifyContent:"center", flexWrap:"wrap" }}>
        {form.artisan && <div style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:12, padding:"10px 14px", textAlign:"center" }}><div style={{ fontSize:22, marginBottom:4 }}>✂️</div><div style={{ fontFamily:"'Playfair Display',serif", fontSize:11, fontWeight:700, color:"#D4AF37" }}>Sculptor</div><div style={{ fontSize:9, color:"rgba(212,175,55,0.5)", marginTop:2 }}>🔧 Apprenti</div></div>}
        {form.tayedor && <div style={{ background:"rgba(127,140,141,0.1)", border:"1px solid rgba(127,140,141,0.3)", borderRadius:12, padding:"10px 14px", textAlign:"center" }}><div style={{ fontSize:22, marginBottom:4 }}>🪨</div><div style={{ fontFamily:"'Playfair Display',serif", fontSize:11, fontWeight:700, color:"#7F8C8D" }}>Tayedor</div><div style={{ fontSize:9, color:"rgba(127,140,141,0.5)", marginTop:2 }}>Pierre Brute</div></div>}
        <div style={{ background:"rgba(212,175,55,0.08)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:12, padding:"10px 14px", textAlign:"center" }}><div style={{ fontSize:22, marginBottom:4 }}>🏅</div><div style={{ fontFamily:"'Playfair Display',serif", fontSize:11, fontWeight:700, color:"#D4AF37" }}>Fondateur</div><div style={{ fontSize:9, color:"rgba(212,175,55,0.5)", marginTop:2 }}>À vie</div></div>
      </div>
      <button onClick={onSuccess} style={{ width:"100%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"none", borderRadius:14, padding:16, color:"#0D0D0D", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.5, cursor:"pointer", boxShadow:"0 4px 20px rgba(212,175,55,0.3)" }}>
        ACCÉDER À MON PROFIL →
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", fontFamily:"'Lato',sans-serif", color:"#E8E0D0" }}>
      <div style={{ background:"linear-gradient(180deg,#150f00,#0D0D0D)", borderBottom:"1px solid rgba(212,175,55,0.13)", padding:"16px 20px 14px", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:18, cursor:"pointer", padding:"0 8px 0 0" }}>‹</button>
          <span style={{ fontSize:20 }}>✂️</span>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:"#D4AF37", letterSpacing:2 }}>BARBE D'OR</div>
          <div style={{ flex:1 }}/><button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:12, cursor:"pointer" }}>Fermer ✕</button>
        </div>
      </div>

      <div style={{ padding:"24px 20px 80px" }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, marginBottom:4 }}>Créer mon compte</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.38)", marginBottom:20 }}>Remplis les bases, puis complète selon ton profil.</div>

        {/* Fondateur */}
        <div style={{ background:"linear-gradient(135deg,rgba(212,175,55,0.1),rgba(139,69,19,0.06))", border:"1px solid rgba(212,175,55,0.3)", borderRadius:14, padding:"12px 16px", marginBottom:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>🏅</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:700, color:"#D4AF37" }}>Offre Fondateur — {FONDATEUR_RESTANTS} places</div>
              <div style={{ fontSize:11, color:"rgba(212,175,55,0.55)", marginTop:2 }}>Premium 6 mois offert · Badge à vie</div>
            </div>
          </div>
          <div style={{ marginTop:10, height:4, background:"rgba(255,255,255,0.07)", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${((100-FONDATEUR_RESTANTS)/100)*100}%`, background:"linear-gradient(90deg,#D4AF37,#8B6914)", borderRadius:2 }}/>
          </div>
        </div>

        {/* Tronc commun */}
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.4)", letterSpacing:1, marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:3, height:14, background:"#D4AF37", borderRadius:2, opacity:.5 }}/>
          INFORMATIONS GÉNÉRALES
        </div>
        <FieldInput label="PRÉNOM *" placeholder="Thomas" value={form.prenom} onChange={set("prenom")}/>
        <FieldInput label="NOM *" placeholder="Durand" value={form.nom} onChange={set("nom")}/>
        <FieldInput label="EMAIL *" placeholder="thomas@mail.fr" value={form.email} onChange={set("email")}/>
        <FieldInput label="MOT DE PASSE *" placeholder="••••••••" type="password" value={form.password} onChange={set("password")}/>
        <FieldInput label="VILLE *" placeholder="Paris" value={form.ville} onChange={set("ville")}/>
        <FieldInput label="INSTAGRAM / TIKTOK" placeholder="@monstyle (optionnel)" value={form.reseaux} onChange={set("reseaux")} hint="Boost ta visibilité dès le lancement"/>

        <div style={{ height:1, background:"rgba(255,255,255,0.07)", margin:"20px 0" }}/>
        <div style={{ fontSize:12, color:"rgba(255,255,255,0.35)", marginBottom:16 }}>Complète ce qui te correspond — tu peux être les deux :</div>

        {/* Accordéon Sculptor */}
        <Accordion icon="✂️" titre={form.artisan?"Je suis Sculptor ✓":"Je suis Sculptor — barbier, coiffeur..."} couleur="#D4AF37" ouvert={form.artisan} onToggle={toggle("artisan")}>
          <FieldInput label="NOM DU SALON" placeholder="Prestige Barber" value={form.shop} onChange={set("shop")} hint="Laisse vide si tu travailles à domicile"/>
          <ChipsField label="STATUT" options={["Barbier indépendant","Barbier en salon","Gérant de salon","Coiffeur mixte","À domicile"]} value={form.statut} onChange={set("statut")}/>
          <ChipsField label="SPÉCIALITÉ" options={["Dégradé / Fade","Barbe sculptée","Rasage traditionnel","Coupes classiques","Afro / Texturé","Tout terrain"]} value={form.specialite} onChange={set("specialite")}/>
          <div style={{ background:"rgba(212,175,55,0.06)", border:"1px solid rgba(212,175,55,0.15)", borderRadius:10, padding:"10px 12px", marginBottom:8 }}>
            <div style={{ fontSize:11, color:"rgba(212,175,55,0.7)" }}>🔧 Tu démarres <strong>Apprenti</strong> et tu grimpes selon tes publications et ta note.</div>
          </div>
        </Accordion>

        {/* Accordéon Tayedor */}
        <Accordion icon="💎" titre={form.tayedor?"Je suis Tayedor ✓":"Je suis Tayedor — j'aime le style masculin..."} couleur="#2471A3" ouvert={form.tayedor} onToggle={toggle("tayedor")}>
          <FieldInput label="MON BARBIER ATTITRÉ" placeholder="Nom du salon ou du barbier (optionnel)" value={form.barbier} onChange={set("barbier")} hint="Ton barbier sera notifié et pourra te taguer"/>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
            {["🪨","🔵","🟢","🔴","💎"].map((icon,i)=>(
              <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:3, flex:1 }}>
                <span style={{ fontSize:18, opacity:i===0?1:.3 }}>{icon}</span>
                <div style={{ width:"100%", height:2, background:i===0?"#7F8C8D":"rgba(255,255,255,0.08)", borderRadius:1 }}/>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, color:"rgba(36,113,163,0.7)" }}>🪨 Tu commences <strong>Pierre Brute</strong> — chaque look posté te fait progresser.</div>
        </Accordion>

        {/* Bouton final */}
        <div style={{ marginTop:24 }}>
          <button onClick={()=>ok&&setStep(2)} style={{ width:"100%", background:ok?"linear-gradient(135deg,#D4AF37,#8B6914)":"rgba(255,255,255,0.05)", border:ok?"none":"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:16, color:ok?"#0D0D0D":"rgba(255,255,255,0.25)", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.5, cursor:ok?"pointer":"not-allowed", transition:"all .3s", boxShadow:ok?"0 4px 20px rgba(212,175,55,0.25)":"none" }}>
            🏅 REJOINDRE BARBE D'OR
          </button>
          {!ok && <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", textAlign:"center", marginTop:8 }}>Remplis les champs obligatoires pour continuer</div>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONNEXION SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function ConnexionScreen({ onBack, onSuccess, onInscription }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [forgot, setForgot]     = useState(false);
  const [done, setDone]         = useState(false);
  const ok = email && password;

  if (done) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:30, textAlign:"center", background:"#0D0D0D" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, marginBottom:20, boxShadow:"0 0 30px rgba(212,175,55,0.35)" }}>✂️</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#D4AF37", marginBottom:8 }}>Bon retour !</div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:30 }}>Tu es connecté à ton compte Barbe d'Or.</div>
      <button onClick={onSuccess} style={{ width:"100%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"none", borderRadius:14, padding:16, color:"#0D0D0D", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.5, cursor:"pointer" }}>ACCÉDER À MON PROFIL →</button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", fontFamily:"'Lato',sans-serif", color:"#E8E0D0" }}>
      <div style={{ background:"linear-gradient(180deg,#150f00,#0D0D0D)", borderBottom:"1px solid rgba(212,175,55,0.13)", padding:"16px 20px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.4)", fontSize:18, cursor:"pointer", padding:"0 8px 0 0" }}>‹</button>
          <span style={{ fontSize:20 }}>✂️</span>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:900, color:"#D4AF37", letterSpacing:2 }}>BARBE D'OR</div>
        </div>
      </div>

      <div style={{ padding:"30px 24px" }}>
        {!forgot ? (
          <>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, marginBottom:6 }}>Se connecter</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.38)", marginBottom:28 }}>Bon retour parmi les maîtres.</div>
            <FieldInput label="EMAIL" placeholder="ton@email.fr" value={email} onChange={setEmail}/>
            <FieldInput label="MOT DE PASSE" placeholder="••••••••" type="password" value={password} onChange={setPassword}/>
            <div style={{ textAlign:"right", marginBottom:28 }}>
              <button onClick={()=>setForgot(true)} style={{ background:"none", border:"none", color:"rgba(212,175,55,0.55)", fontSize:12, cursor:"pointer", padding:0 }}>Mot de passe oublié ?</button>
            </div>
            <button onClick={()=>ok&&setDone(true)} style={{ width:"100%", background:ok?"linear-gradient(135deg,#D4AF37,#8B6914)":"rgba(255,255,255,0.05)", border:ok?"none":"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:16, color:ok?"#0D0D0D":"rgba(255,255,255,0.25)", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.5, cursor:ok?"pointer":"not-allowed", transition:"all .3s", marginBottom:20 }}>
              🔑 SE CONNECTER
            </button>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/><span style={{ fontSize:11, color:"rgba(255,255,255,0.25)" }}>ou</span><div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/>
            </div>
            <div style={{ background:"rgba(212,175,55,0.05)", border:"1px dashed rgba(212,175,55,0.22)", borderRadius:14, padding:18, textAlign:"center" }}>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.5)", marginBottom:4 }}>Pas encore de compte ?</div>
              <div style={{ fontSize:12, color:"rgba(212,175,55,0.6)", marginBottom:14 }}>🏅 Il reste <strong style={{ color:"#D4AF37" }}>{FONDATEUR_RESTANTS} places Fondateur</strong></div>
              <button onClick={onInscription} style={{ width:"100%", background:"rgba(212,175,55,0.12)", border:"1px solid rgba(212,175,55,0.3)", borderRadius:12, padding:13, color:"#D4AF37", fontSize:13, fontWeight:900, cursor:"pointer", fontFamily:"'Playfair Display',serif", letterSpacing:1 }}>CRÉER MON COMPTE →</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, marginBottom:6 }}>Mot de passe oublié</div>
            <div style={{ fontSize:13, color:"rgba(255,255,255,0.38)", marginBottom:28 }}>On t'envoie un lien de réinitialisation.</div>
            <FieldInput label="EMAIL" placeholder="ton@email.fr" value={email} onChange={setEmail}/>
            <button onClick={()=>email&&setForgot(false)} style={{ width:"100%", background:email?"linear-gradient(135deg,#D4AF37,#8B6914)":"rgba(255,255,255,0.05)", border:"none", borderRadius:14, padding:16, color:email?"#0D0D0D":"rgba(255,255,255,0.25)", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.5, cursor:email?"pointer":"not-allowed", marginBottom:16 }}>ENVOYER LE LIEN</button>
            <button onClick={()=>setForgot(false)} style={{ width:"100%", background:"none", border:"none", color:"rgba(255,255,255,0.3)", fontSize:12, cursor:"pointer" }}>‹ Retour</button>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLICATION SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function PublicationScreen({ onBack, onPublish }) {
  const [step, setStep]   = useState(1);
  const [media, setMedia] = useState(null);
  const [title, setTitle] = useState("");
  const [cat, setCat]     = useState(null);
  const [tip, setTip]     = useState(false);

  if (step===3) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:30, textAlign:"center", background:"#0D0D0D" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36, marginBottom:20 }}>✂️</div>
      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#D4AF37", marginBottom:8 }}>Publié avec style !</div>
      <div style={{ fontSize:13, color:"rgba(255,255,255,0.55)", marginBottom:24 }}>Ta publication est visible par toute la communauté.</div>
      <div style={{ display:"flex", gap:8, width:"100%", marginBottom:20 }}>
        {["Instagram","TikTok","WhatsApp"].map(r=>(
          <button key={r} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"8px 4px", fontSize:10, color:"rgba(255,255,255,0.6)", cursor:"pointer", fontWeight:700 }}>{r}</button>
        ))}
      </div>
      <button onClick={onPublish} style={{ width:"100%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"none", borderRadius:14, padding:15, color:"#0D0D0D", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.2, cursor:"pointer" }}>VOIR MON PROFIL →</button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", fontFamily:"'Lato',sans-serif", color:"#E8E0D0" }}>
      <div style={{ background:"linear-gradient(180deg,#1a1208,#0D0D0D)", borderBottom:"1px solid rgba(212,175,55,0.15)", padding:"16px 20px 14px", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:13, cursor:"pointer", padding:0 }}>‹ Retour</button>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:16, fontWeight:900, color:"#D4AF37" }}>{step===1?"Choisir le média":"Détails"}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)" }}>Étape {step}/2</div>
        </div>
        <div style={{ display:"flex", gap:6, marginTop:12 }}>
          {[1,2].map(s=><div key={s} style={{ flex:1, height:3, borderRadius:2, background:step>=s?"#D4AF37":"rgba(255,255,255,0.1)", transition:"background .3s" }}/>)}
        </div>
      </div>

      <div style={{ padding:"20px 20px 60px" }}>
        {step===1 && (
          <>
            <div style={{ height:180, background:"rgba(255,255,255,0.03)", border:"2px dashed rgba(212,175,55,0.25)", borderRadius:18, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20, cursor:"pointer" }} onClick={()=>setMedia("video")}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26 }}>📹</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:700, color:"#D4AF37" }}>Appuie pour ajouter</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>Vidéo ou photo depuis ta galerie</div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
              {[{id:"video",icon:"🎬",label:"Vidéo",desc:"MP4, MOV"},{id:"photo",icon:"📷",label:"Photo",desc:"JPG, PNG"},{id:"avantapres",icon:"↔️",label:"Avant/Après",desc:"2 photos"},{id:"live",icon:"🔴",label:"En direct",desc:"Premium",premium:true}].map(m=>(
                <button key={m.id} onClick={()=>!m.premium&&setMedia(m.id)} style={{ background:media===m.id?"rgba(212,175,55,0.16)":"rgba(255,255,255,0.03)", border:media===m.id?"1px solid #D4AF37":"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"14px 12px", textAlign:"center", cursor:m.premium?"not-allowed":"pointer", opacity:m.premium?.5:1 }}>
                  <div style={{ fontSize:24, marginBottom:6 }}>{m.icon}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:media===m.id?"#D4AF37":"#E8E0D0", marginBottom:2 }}>{m.label}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)" }}>{m.desc}</div>
                  {m.premium && <div style={{ fontSize:9, color:"#D4AF37", marginTop:4, fontWeight:700 }}>⭐ PREMIUM</div>}
                </button>
              ))}
            </div>
            <button onClick={()=>media&&setStep(2)} style={{ width:"100%", background:media?"linear-gradient(135deg,#D4AF37,#8B6914)":"rgba(255,255,255,0.05)", border:media?"none":"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:15, color:media?"#0D0D0D":"rgba(255,255,255,0.3)", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.2, cursor:media?"pointer":"not-allowed", transition:"all .3s" }}>CONTINUER →</button>
          </>
        )}

        {step===2 && (
          <>
            <div style={{ height:110, background:`linear-gradient(135deg,rgba(139,69,19,0.3),#0D0D0D)`, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:20, border:"1px solid rgba(212,175,55,0.15)" }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:30, marginBottom:4 }}>{media==="video"?"🎬":media==="photo"?"📷":"↔️"}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>Média sélectionné</div>
              </div>
            </div>
            <FieldInput label="TITRE *" placeholder="Ex: Fade peau parfait en 30 min..." value={title} onChange={setTitle}/>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:1.2, color:"rgba(212,175,55,0.65)", marginBottom:9 }}>CATÉGORIE *</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {CATS_POST.map(c=>(
                  <button key={c} onClick={()=>setCat(c)} style={{ background:cat===c?"rgba(212,175,55,0.18)":"rgba(255,255,255,0.04)", border:cat===c?"1px solid #D4AF37":"1px solid rgba(255,255,255,0.08)", color:cat===c?"#D4AF37":"rgba(255,255,255,0.45)", borderRadius:20, padding:"6px 14px", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all .2s" }}>{c}</button>
                ))}
              </div>
            </div>
            <button onClick={()=>setTip(t=>!t)} style={{ width:"100%", background:tip?"rgba(212,175,55,0.1)":"rgba(255,255,255,0.03)", border:tip?"1px solid rgba(212,175,55,0.35)":"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"13px 16px", display:"flex", alignItems:"center", gap:12, cursor:"pointer", marginBottom:20, transition:"all .2s" }}>
              <span style={{ fontSize:18 }}>💡</span>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontSize:13, fontWeight:700, color:tip?"#D4AF37":"rgba(255,255,255,0.6)" }}>Partager aussi comme Tip du jour</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>Boost ta visibilité dans la section Tips</div>
              </div>
              <div style={{ flex:1 }}/>
              <div style={{ width:22, height:22, borderRadius:"50%", background:tip?"#D4AF37":"rgba(255,255,255,0.08)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#0D0D0D", transition:"all .2s" }}>{tip?"✓":""}</div>
            </button>
            <button onClick={()=>(title&&cat)&&setStep(3)} style={{ width:"100%", background:(title&&cat)?"linear-gradient(135deg,#D4AF37,#8B6914)":"rgba(255,255,255,0.05)", border:(title&&cat)?"none":"1px solid rgba(255,255,255,0.1)", borderRadius:14, padding:15, color:(title&&cat)?"#0D0D0D":"rgba(255,255,255,0.3)", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.2, cursor:(title&&cat)?"pointer":"not-allowed", transition:"all .3s" }}>✂️ PUBLIER AU FIL DU RASOIR</button>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PREMIUM SCREEN
// ══════════════════════════════════════════════════════════════════════════════

function PremiumScreen({ onBack }) {
  const [plan, setPlan] = useState("mensuel");
  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", fontFamily:"'Lato',sans-serif", color:"#E8E0D0" }}>
      <div style={{ background:"linear-gradient(180deg,#1a1208,#0D0D0D)", borderBottom:"1px solid rgba(212,175,55,0.2)", padding:"16px 20px 18px" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.45)", fontSize:13, cursor:"pointer", padding:0, marginBottom:14 }}>‹ Retour</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:8 }}>⭐</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:900, color:"#D4AF37", letterSpacing:1 }}>Passer Premium</div>
        </div>
      </div>
      <div style={{ padding:"20px 20px 60px" }}>
        <div style={{ display:"flex", gap:10, marginBottom:24 }}>
          {[{id:"mensuel",label:"Mensuel",price:"9€",period:"/mois"},{id:"annuel",label:"Annuel",price:"79€",period:"/an",badge:"−27%"}].map(p=>(
            <button key={p.id} onClick={()=>setPlan(p.id)} style={{ flex:1, background:plan===p.id?"linear-gradient(135deg,#1a1208,#0e0e0e)":"rgba(255,255,255,0.03)", border:plan===p.id?"1px solid #D4AF37":"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"16px 10px", textAlign:"center", cursor:"pointer", position:"relative", transition:"all .2s" }}>
              {p.badge && <div style={{ position:"absolute", top:-8, right:8, background:"#C0392B", color:"white", fontSize:10, fontWeight:700, borderRadius:20, padding:"2px 8px" }}>{p.badge}</div>}
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", marginBottom:6, fontWeight:700 }}>{p.label.toUpperCase()}</div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:plan===p.id?"#D4AF37":"#E8E0D0" }}>{p.price}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{p.period}</div>
            </button>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, overflow:"hidden", marginBottom:24 }}>
          {[["👁","Visibilité boostée dans le feed"],["🗳","Vote x2 au Championnat"],["🎬","Vidéos en direct (Live)"],["📊","Statistiques avancées"],["🎯","Accès prioritaire aux concours"],["🏅","Badge Premium visible"],["✂️","Techniques exclusives de Maîtres"]].map(([icon,text],i,arr)=>(
            <div key={text} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:i<arr.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ fontSize:13, color:"rgba(255,255,255,0.7)" }}>{text}</span>
              <div style={{ flex:1 }}/><span style={{ color:"#D4AF37" }}>✓</span>
            </div>
          ))}
        </div>
        <button style={{ width:"100%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"none", borderRadius:14, padding:16, color:"#0D0D0D", fontSize:14, fontWeight:900, fontFamily:"'Playfair Display',serif", letterSpacing:1.2, cursor:"pointer", boxShadow:"0 4px 24px rgba(212,175,55,0.3)", marginBottom:12 }}>
          {plan==="mensuel"?"COMMENCER POUR 9€/MOIS":"COMMENCER POUR 79€/AN"}
        </button>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.22)", textAlign:"center" }}>Résiliable à tout moment · Paiement sécurisé</div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CONCOURS SCREEN (caché — CONCOURS_ACTIF = false)
// ══════════════════════════════════════════════════════════════════════════════

function ConcoursScreen() {
  const [phase, setPhase] = useState("qualif");
  const [voted, setVoted] = useState({});
  const cd = (() => { const diff=new Date(Date.now()+127*24*60*60*1000)-Date.now(); return { j:Math.floor(diff/(1000*60*60*24)), h:Math.floor((diff%(1000*60*60*24))/(1000*60*60)), m:Math.floor((diff%(1000*60*60))/(1000*60)) }; })();
  const getQ = id => QUALIFIES.find(q=>q.id===id);

  return (
    <div style={{ animation:"fadeUp .35s ease" }}>
      <div style={{ background:"linear-gradient(160deg,#1a1208,#0a0a0a)", borderBottom:"1px solid rgba(212,175,55,0.2)", padding:"20px 20px 0" }}>
        <div style={{ textAlign:"center", marginBottom:16 }}>
          <div style={{ fontSize:11, color:"rgba(212,175,55,0.55)", letterSpacing:3, marginBottom:6 }}>CHAMPIONNAT MONDIAL</div>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:"#D4AF37", letterSpacing:2 }}>BARBE D'OR</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:6, letterSpacing:1 }}>SAISON 1 · 2025–2026</div>
        </div>
        <div style={{ background:"rgba(212,175,55,0.07)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:14, padding:"14px 20px", marginBottom:16, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ fontSize:11, color:"rgba(212,175,55,0.6)", letterSpacing:1 }}>🏆 GRANDE FINALE</div>
          <div style={{ display:"flex", gap:12 }}>
            {[[cd.j,"JOURS"],[cd.h,"H"],[cd.m,"MIN"]].map(([n,l])=>(
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#D4AF37", lineHeight:1 }}>{n}</div>
                <div style={{ fontSize:8, color:"rgba(212,175,55,0.45)", letterSpacing:1 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          {[["qualif","🏅 Classement"],["tournoi","⚔️ Tableau"]].map(([id,label])=>(
            <button key={id} onClick={()=>setPhase(id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", padding:"10px 6px", fontSize:12, fontWeight:700, color:phase===id?"#D4AF37":"rgba(255,255,255,0.32)", borderBottom:phase===id?"2px solid #D4AF37":"2px solid transparent", transition:"all .2s", fontFamily:"'Playfair Display',serif" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding:"16px 20px 40px" }}>
        {phase==="qualif" && (
          <div>
            {/* Podium */}
            <div style={{ background:"linear-gradient(135deg,#1a1208,#0e0e0e)", border:"1px solid rgba(212,175,55,0.2)", borderRadius:16, padding:"20px 12px", marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:6 }}>
                {[[1,"🥈",42,"#999"],[0,"👑",54,"#D4AF37"],[2,"🥉",42,"#CD7F32"]].map(([qi,medal,size,color])=>(
                  <div key={qi} style={{ flex:1, textAlign:"center" }}>
                    <Av i={QUALIFIES[qi].avatar} size={size} color={QUALIFIES[qi].color}/>
                    <div style={{ fontSize:10, marginTop:5, fontWeight:700, color }}>{QUALIFIES[qi].name.split(" ")[0]}</div>
                    <div style={{ background:`rgba(0,0,0,0.3)`, border:`1px solid ${color}`, borderRadius:8, padding:"6px 0", marginTop:5, fontSize:qi===1?22:18, height:qi===1?56:46, display:"flex", alignItems:"center", justifyContent:"center" }}>{medal}</div>
                    <div style={{ fontSize:qi===1?12:11, color, marginTop:4, fontWeight:qi===1?700:400 }}>{QUALIFIES[qi].points.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
            {QUALIFIES.map((q,i)=>(
              <div key={q.id} style={{ background:i<3?"linear-gradient(135deg,#1a1208,#0e0e0e)":"rgba(255,255,255,0.02)", border:i<3?"1px solid rgba(212,175,55,0.2)":"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"11px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:26, textAlign:"center", fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:900, color:i===0?"#D4AF37":i===1?"#C0C0C0":i===2?"#CD7F32":"rgba(255,255,255,0.25)", flexShrink:0 }}>{i<3?["🥇","🥈","🥉"][i]:`#${q.rank}`}</div>
                <Av i={q.avatar} size={36} color={q.color}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700 }}>{q.name}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.32)" }}>{q.city} · {q.cat}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:13, fontWeight:900, color:i<3?"#D4AF37":"rgba(255,255,255,0.6)" }}>{q.points.toLocaleString()}</div>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)" }}>pts</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {phase==="tournoi" && (
          <div>
            <SecTitle>1/8 de Finale</SecTitle>
            {DUELS.map((duel,di)=>{
              const p1=getQ(duel.p1), p2=getQ(duel.p2);
              const total=(duel.votes1||0)+(duel.votes2||0);
              const pct1=total?Math.round((duel.votes1/total)*100):50;
              const pct2=total?100-pct1:50;
              const w1=duel.termine&&duel.votes1>duel.votes2;
              const w2=duel.termine&&duel.votes2>duel.votes1;
              const myVote=voted[duel.id];
              return (
                <div key={duel.id} style={{ background:"linear-gradient(135deg,#141414,#0e0e0e)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16, marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", fontWeight:700 }}>DUEL #{di+1}</div>
                    <div style={{ fontSize:10, background:duel.termine?"rgba(34,197,94,0.15)":"rgba(212,175,55,0.1)", border:`1px solid ${duel.termine?"rgba(34,197,94,0.3)":"rgba(212,175,55,0.25)"}`, borderRadius:20, padding:"2px 10px", color:duel.termine?"#22c55e":"#D4AF37", fontWeight:700 }}>{duel.termine?"✓ Terminé":"En cours"}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    {[[p1,"p1",w1,w2],[p2,"p2",w2,w1]].map(([p,side,win,lose],pi)=>(
                      <React.Fragment key={side}>
                        <button onClick={()=>!duel.termine&&!myVote&&setVoted(v=>({...v,[duel.id]:side}))}
                          style={{ flex:1, background:myVote===side?"rgba(212,175,55,0.15)":win?"rgba(212,175,55,0.08)":"rgba(255,255,255,0.03)", border:myVote===side?"1px solid #D4AF37":win?"1px solid rgba(212,175,55,0.3)":"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"12px 8px", textAlign:"center", cursor:duel.termine||myVote?"default":"pointer", opacity:lose?.45:1, transition:"all .2s" }}>
                          <Av i={p.avatar} size={38} color={p.color}/>
                          <div style={{ fontSize:11, fontWeight:700, marginTop:6, color:win?"#D4AF37":"#E8E0D0" }}>{p.name.split(" ")[0]}</div>
                          <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", marginTop:2 }}>{p.city}</div>
                          {duel.termine&&<div style={{ fontSize:13, fontWeight:900, color:win?"#D4AF37":"rgba(255,255,255,0.3)", marginTop:4 }}>{pi===0?pct1:pct2}%</div>}
                          {win&&<div style={{ fontSize:16, marginTop:4 }}>🏆</div>}
                        </button>
                        {pi===0&&<div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4, flexShrink:0 }}><div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, fontWeight:900, color:"rgba(212,175,55,0.5)" }}>VS</div><span style={{ fontSize:16 }}>⚔️</span></div>}
                      </React.Fragment>
                    ))}
                  </div>
                  {duel.votes1&&<div style={{ marginTop:12, height:4, borderRadius:2, overflow:"hidden", background:"rgba(255,255,255,0.06)", display:"flex" }}><div style={{ width:`${pct1}%`, background:"linear-gradient(90deg,#D4AF37,#8B6914)", transition:"width .6s ease" }}/><div style={{ flex:1, background:"rgba(255,255,255,0.12)" }}/></div>}
                  {!myVote&&!duel.termine&&<div style={{ marginTop:8, textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.25)" }}>Appuie sur un barbier pour voter</div>}
                  {myVote&&!duel.termine&&<div style={{ marginTop:8, textAlign:"center", fontSize:11, color:"rgba(212,175,55,0.7)" }}>✓ Vote enregistré</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MON PROFIL (onglet 3)
// ══════════════════════════════════════════════════════════════════════════════

function MonProfilScreen({ onPublish, onPremium, onInscription, onConnexion }) {
  return (
    <div style={{ animation:"fadeUp .35s ease" }}>
      <ProfilScreen barberId={1} onBack={null}/>
      <div style={{ padding:"0 20px 24px" }}>
        <div style={{ display:"flex", gap:10, marginBottom:10 }}>
          <button onClick={onConnexion} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:12, padding:"13px 8px", color:"rgba(255,255,255,0.7)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"'Playfair Display',serif", letterSpacing:.8 }}>
            🔑 SE CONNECTER
          </button>
          <button onClick={onInscription} style={{ flex:1, background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"none", borderRadius:12, padding:"13px 8px", color:"#0D0D0D", fontSize:12, fontWeight:900, cursor:"pointer", fontFamily:"'Playfair Display',serif", letterSpacing:.8, boxShadow:"0 3px 14px rgba(212,175,55,0.25)" }}>
            🏅 MON COMPTE
          </button>
        </div>
        <div style={{ fontSize:10, color:"rgba(255,255,255,0.2)", textAlign:"center" }}>
          Pas encore de compte ? Rejoins les {FONDATEUR_RESTANTS} Fondateurs restants →
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPALE
// ══════════════════════════════════════════════════════════════════════════════

export default function BarbeDorApp() {
  const [mainTab,    setMainTab]   = useState("feed");
  const [profileId,  setProfileId] = useState(null);
  const [screen,     setScreen]    = useState(null);
  const [connecte,   setConnecte]  = useState(false);

  const openProfile  = id => { setProfileId(id); setScreen(null); };
  const closeProfile = ()  => setProfileId(null);
  const openScreen   = s  => { setScreen(s); setProfileId(null); };
  const closeScreen  = ()  => setScreen(null);

  const tabs = [
    { id:"feed",     label:"Au fil du rasoir", icon:"clap" },
    { id:"carte",    label:"Carte",            icon:"boussole" },
    ...(CONCOURS_ACTIF ? [{ id:"concours", label:"Championnat", icon:"trophy" }] : []),
    { id:"moi",      label:"Profil",           icon:"barbu" },
  ];

  const showNav = !profileId && !screen;

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", fontFamily:"'Lato',sans-serif", color:"#E8E0D0", maxWidth:430, margin:"0 auto", backgroundImage:"radial-gradient(ellipse at 15% 0%,rgba(212,175,55,0.06) 0%,transparent 50%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Lato:wght@300;400;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-thumb{background:rgba(212,175,55,0.18);border-radius:2px}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes shimmer{0%,100%{opacity:.65}50%{opacity:1}}
        button:active{transform:scale(.97)}
        input::placeholder{color:rgba(255,255,255,0.22)}
      `}</style>

      {/* HEADER */}
      {showNav && (
        <div style={{ background:"linear-gradient(180deg,#150f00,#0D0D0D)", borderBottom:"1px solid rgba(212,175,55,0.13)", padding:"16px 20px 13px", position:"sticky", top:0, zIndex:100 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <span style={{ fontSize:24, animation:"shimmer 3s infinite" }}>✂️</span>
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:900, color:"#D4AF37", letterSpacing:2, lineHeight:1 }}>BARBE D'OR</div>
                <div style={{ fontSize:8, color:"rgba(212,175,55,0.35)", letterSpacing:2, marginTop:2 }}>MAÎTRES BARBIERS</div>
              </div>
            </div>
            {connecte ? (
              <div style={{ display:"flex", alignItems:"center", gap:6, background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", borderRadius:20, padding:"5px 12px" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill="rgba(34,197,94,0.8)"/>
                  <path d="M4 20 C4 16 7.6 13 12 13 C16.4 13 20 16 20 20" stroke="rgba(34,197,94,0.8)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 6px #22c55e" }}/>
              </div>
            ) : (
              <button onClick={()=>openScreen("connexion")} style={{ background:"rgba(212,175,55,0.1)", border:"1px solid rgba(212,175,55,0.22)", borderRadius:20, padding:"4px 13px", fontSize:11, color:"#D4AF37", fontWeight:700, cursor:"pointer", fontFamily:"'Playfair Display',serif", letterSpacing:.5 }}>🔑 Se connecter</button>
            )}
          </div>
        </div>
      )}

      {/* CONTENU */}
      <div style={{ paddingBottom:showNav?82:20, overflowY:"auto" }}>
        {screen==="connexion"    ? <ConnexionScreen    onBack={closeScreen} onSuccess={closeScreen} onInscription={()=>openScreen("inscription")}/>
        :screen==="inscription"  ? <NouvelleInscription onBack={closeScreen} onSuccess={()=>{ setConnecte(true); closeScreen(); }}/>
        :screen==="publication"  ? <PublicationScreen  onBack={closeScreen} onPublish={closeScreen}/>
        :screen==="premium"      ? <PremiumScreen      onBack={closeScreen}/>
        :profileId               ? <ProfilScreen       barberId={profileId} onBack={closeProfile}/>
        :mainTab==="feed"        ? <FeedScreen         onOpenProfile={openProfile}/>
        :mainTab==="carte"       ? <CarteScreen        onOpenProfile={openProfile}/>
        :mainTab==="concours"    ? <ConcoursScreen/>
        :                          <MonProfilScreen    onPublish={()=>openScreen("publication")} onPremium={()=>openScreen("premium")} onInscription={()=>openScreen("inscription")} onConnexion={()=>openScreen("connexion")}/>
        }
      </div>

      {/* NAV BAS */}
      {showNav && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:430, zIndex:100 }}>
          <div style={{ background:"#111", borderTop:"1px solid rgba(212,175,55,0.1)", display:"flex", justifyContent:"space-around", padding:"10px 0 22px" }}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>setMainTab(t.id)} style={{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"4px 16px", opacity:mainTab===t.id?1:.35, transition:"opacity .2s" }}>
                <NavIcon name={t.icon} active={mainTab===t.id}/>
                <span style={{ fontSize:t.id==="feed"?7:8, fontWeight:700, letterSpacing:.8, color:mainTab===t.id?"#D4AF37":"#E8E0D0", fontFamily:"'Playfair Display',serif" }}>{t.label.toUpperCase()}</span>
                {mainTab===t.id && <div style={{ width:16, height:2, borderRadius:1, background:"#D4AF37" }}/>}
              </button>
            ))}
          </div>
          {mainTab!=="carte" && (
            <button onClick={()=>openScreen("publication")} style={{ position:"absolute", top:-24, left:"50%", transform:"translateX(-50%)", width:50, height:50, borderRadius:"50%", background:"linear-gradient(135deg,#D4AF37,#8B6914)", border:"3px solid #0D0D0D", fontSize:22, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px rgba(212,175,55,0.4)" }}>+</button>
          )}
        </div>
      )}
    </div>
  );
}
