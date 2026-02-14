import { useState, useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

const T = {
  fr: {
    slogan: "Votre prochain voyage commence ici",
    sub: "Donnez votre budget, l'IA trouve la destination parfaite.",
    budget: "Budget (€)", budgetPh: "1500",
    month: "Mois", dur: "Durée",
    months: ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"],
    durs: ["Week-end","1 semaine","10 jours","2 semaines","3 semaines","1 mois"],
    trav: "Voyageurs", trvl: ["1","2","3","4","5+"],
    city: "Départ de", cityPh: "Paris",
    prefs: "Vos envies",
    p: { beach:"Plage", culture:"Culture", adventure:"Aventure", gastro:"Gastro", nightlife:"Soirées", family:"Famille", ski:"Ski", clubbing:"Clubbing", wellness:"Bien-être", shopping:"Shopping" },
    otherPref: "Autre",
    go: "Trouver mon voyage",
    errB: "Entrez un budget (min 100€)", errD: "Choisissez un mois et une durée",
    errApi: "Erreur lors de la génération. Réessayez.",
    sw: "EN", dest: "Votre destination", prog: "Le programme", tips: "Nos conseils",
    per: { morning: "Matin", afternoon: "Après-midi", evening: "Soirée" },
    cats: { flights:"Vols", hotel:"Hôtel", activities:"Activités", food:"Repas", transport:"Transport" },
    total: "Total", newTrip: "Nouveau voyage",
    tripType: "Type de voyage",
    types: { romantic: "Romantique", friends: "Entre amis", solo: "Solo", familyTrip: "En famille", roadtrip: "Parcours / Road trip" },
    book: "Réserver", bookFlights: "Vols", bookHotel: "Hôtel", bookActivities: "Activités",
    save: "Sauvegarder", saved: "Sauvegardé !", myTrips: "Mes voyages", noTrips: "Aucun voyage sauvegardé", deleteSaved: "Supprimer",
    pickTitle: "Choisissez votre destination",
    pickSub: "Nous avons trouvé 3 destinations parfaites pour vous",
    pickChoose: "Choisir cette destination",
    pickBack: "Retour",
    pickBudget: "Budget estimé",
    ldSuggest: ["Analyse de vos préférences...","Recherche des meilleures destinations...","Comparaison des options..."],
    ldItinerary: ["Construction du programme jour par jour...","Recherche des vrais prix de vols...","Recherche d'hôtels...","Finalisation de votre voyage..."],
    errSuggest: "Erreur lors de la recherche de destinations. Réessayez.",
    exactDate: "Date exacte (optionnel)", exactDatePh: "JJ/MM/AAAA",
    customNotes: "Demandes spéciales", customNotesPh: "Ex: hôtel avec piscine, activités pour enfants, éviter les longs trajets...",
    otherPrefPh: "Précisez vos envies...",
    steps: ["Critères", "Destinations", "Itinéraire"],
    exportPdf: "Exporter PDF", share: "Partager", copied: "Lien copié !",
    weatherTitle: "Météo", avgTemp: "Temp. moyenne", rainfall: "Précipitations",
    compare: "Comparer", vsTitle: "Comparaison", closeCompare: "Fermer",
    stage: "Étape", stageNights: "nuit(s)", routeTitle: "Le circuit",
    realPrice: "Prix réel", estPrice: "Estimé",
  },
  en: {
    slogan: "Your next trip starts here",
    sub: "Give us your budget, AI finds the perfect destination.",
    budget: "Budget (€)", budgetPh: "1500",
    month: "Month", dur: "Duration",
    months: ["January","February","March","April","May","June","July","August","September","October","November","December"],
    durs: ["Weekend","1 week","10 days","2 weeks","3 weeks","1 month"],
    trav: "Travelers", trvl: ["1","2","3","4","5+"],
    city: "From", cityPh: "Paris",
    prefs: "Your interests",
    p: { beach:"Beach", culture:"Culture", adventure:"Adventure", gastro:"Food", nightlife:"Nightlife", family:"Family", ski:"Ski", clubbing:"Clubbing", wellness:"Wellness", shopping:"Shopping" },
    otherPref: "Other",
    go: "Find my trip",
    errB: "Enter a budget (min 100€)", errD: "Select month and duration",
    errApi: "Error generating trip. Please try again.",
    sw: "FR", dest: "Your destination", prog: "The program", tips: "Our tips",
    per: { morning: "Morning", afternoon: "Afternoon", evening: "Evening" },
    cats: { flights:"Flights", hotel:"Hotel", activities:"Activities", food:"Meals", transport:"Transport" },
    total: "Total", newTrip: "New trip",
    tripType: "Trip type",
    types: { romantic: "Romantic", friends: "Friends", solo: "Solo", familyTrip: "Family", roadtrip: "Road trip" },
    book: "Book", bookFlights: "Flights", bookHotel: "Hotel", bookActivities: "Activities",
    save: "Save trip", saved: "Saved!", myTrips: "My trips", noTrips: "No saved trips", deleteSaved: "Delete",
    pickTitle: "Choose your destination",
    pickSub: "We found 3 perfect destinations for you",
    pickChoose: "Choose this destination",
    pickBack: "Back",
    pickBudget: "Estimated budget",
    ldSuggest: ["Analyzing your preferences...","Searching the best destinations...","Comparing options..."],
    ldItinerary: ["Building your day-by-day program...","Fetching real flight prices...","Searching hotel deals...","Finalizing your trip..."],
    errSuggest: "Error finding destinations. Please try again.",
    exactDate: "Exact date (optional)", exactDatePh: "DD/MM/YYYY",
    customNotes: "Special requests", customNotesPh: "E.g.: hotel with pool, kid-friendly activities, avoid long drives...",
    otherPrefPh: "Specify your interests...",
    steps: ["Criteria", "Destinations", "Itinerary"],
    exportPdf: "Export PDF", share: "Share", copied: "Link copied!",
    weatherTitle: "Weather", avgTemp: "Avg. temp.", rainfall: "Rainfall",
    compare: "Compare", vsTitle: "Comparison", closeCompare: "Close",
    stage: "Stage", stageNights: "night(s)", routeTitle: "The route",
    realPrice: "Real price", estPrice: "Estimated",
  }
};

const PREF_DATA = {
  beach: { gradient: "linear-gradient(135deg, #43CEA2, #185A9D)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><path d="M2 20h20"/><path d="M5 12c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0"/><path d="M5 16c1.5-1 3.5-1 5 0s3.5 1 5 0 3.5-1 5 0"/></svg>
  )},
  culture: { gradient: "linear-gradient(135deg, #8E2DE2, #4A00E0)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M9 10h1"/><path d="M14 10h1"/><path d="M9 14h1"/><path d="M14 14h1"/></svg>
  )},
  adventure: { gradient: "linear-gradient(135deg, #11998E, #38EF7D)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3l4 8 5-5 2 15H2L8 3z"/></svg>
  )},
  gastro: { gradient: "linear-gradient(135deg, #F7971E, #FFD200)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>
  )},
  nightlife: { gradient: "linear-gradient(135deg, #0F2027, #2C5364)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
  )},
  family: { gradient: "linear-gradient(135deg, #FC5C7D, #6A82FB)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="2"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M21 21v-2a3 3 0 0 0-3-3h-1"/></svg>
  )},
  ski: { gradient: "linear-gradient(135deg, #E0EAFC, #667DB6)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3l4 8 5-5 2 15H2L8 3z"/><path d="M3 20l18-4"/></svg>
  )},
  clubbing: { gradient: "linear-gradient(135deg, #7B1FA2, #E040FB)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
  )},
  wellness: { gradient: "linear-gradient(135deg, #56ab2f, #a8e063)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  )},
  shopping: { gradient: "linear-gradient(135deg, #f7971e, #ffd200)", icon: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  )},
};

const BCOLORS = { flights:"#FF8C42", hotel:"#3EC1D3", activities:"#FF6B6B", food:"#A88BEB", transport:"#54C7A0" };
const CAT_ICONS = {
  flights: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
  hotel: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4h6v4"/></svg>,
  activities: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>,
  food: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  transport: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>,
};

const DEST_GRADIENTS = [
  "linear-gradient(135deg, #E8A87C 0%, #D4756B 40%, #8B5E83 100%)",
  "linear-gradient(135deg, #43CEA2 0%, #185A9D 100%)",
  "linear-gradient(135deg, #F7971E 0%, #FFD200 100%)",
  "linear-gradient(135deg, #FC5C7D 0%, #6A82FB 100%)",
  "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)",
];

const HERO_GRADIENT = "linear-gradient(135deg, #FF8C42 0%, #E8637C 50%, #8B5CF6 100%)";

// Fix icône Leaflet par défaut
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function App() {
  const [lang, setLang] = useState("fr");
  const [budget, setBudget] = useState("");
  const [month, setMonth] = useState("");
  const [dur, setDur] = useState("");
  const [trav, setTrav] = useState(2);
  const [prefs, setPrefs] = useState([]);
  const [city, setCity] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [ldIdx, setLdIdx] = useState(0);
  const [destImage, setDestImage] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [heroImage, setHeroImage] = useState(null);
  const [tripType, setTripType] = useState("friends");
  const [savedTrips, setSavedTrips] = useState([]);
  const [showSaved, setShowSaved] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [coords, setCoords] = useState(null);
  // Nouveaux états pour le picker de destinations
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionImages, setSuggestionImages] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [loadingItinerary, setLoadingItinerary] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [otherPrefText, setOtherPrefText] = useState("");
  const [exactDate, setExactDate] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [weather, setWeather] = useState(null);
  const [comparing, setComparing] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [stageCoords, setStageCoords] = useState([]);
  const [stageImages, setStageImages] = useState({});
  const resultRef = useRef(null);
  const t = T[lang];

  // Thème clair/sombre
  const c = isDark ? {
    bg: "#121212", card: "#1E1E1E", input: "#2A2A2A", inputBorder: "#3A3A3A",
    text: "#E0E0E0", textSub: "#999", textMuted: "#777",
    header: "#1A1A1A", headerBorder: "#2A2A2A",
    tipsBg: "#1A2F25", tipsBorder: "#2A4A35", tipsText: "#4ADE80",
    errorBg: "#3A1515", loadingBg: "rgba(18,18,18,0.97)",
    dayBorder: "#2A2A2A", shadow: "0 1px 8px rgba(0,0,0,0.3)",
  } : {
    bg: "#FAFAFA", card: "#fff", input: "#fff", inputBorder: "#EDEDED",
    text: "#2D3436", textSub: "#888", textMuted: "#666",
    header: "#fff", headerBorder: "#F0F0F0",
    tipsBg: "#F0FAF5", tipsBorder: "#D4EDDF", tipsText: "#2EAD7A",
    errorBg: "#FFF0F0", loadingBg: "rgba(250,250,250,0.97)",
    dayBorder: "#F5F5F5", shadow: "0 1px 8px rgba(0,0,0,0.06)",
  };

  // Rotation des messages de chargement
  useEffect(() => {
    const isLoading = loadingSuggestions || loadingItinerary;
    if (!isLoading) return;
    const msgs = loadingSuggestions ? t.ldSuggest : t.ldItinerary;
    const iv = setInterval(() => setLdIdx(i => (i + 1) % msgs.length), 2500);
    return () => clearInterval(iv);
  }, [loadingSuggestions, loadingItinerary, t.ldSuggest, t.ldItinerary]);

  // Charger une photo de voyage pour le hero
  useEffect(() => {
    const places = ["Santorini", "Bali", "Kyoto", "Amalfi_Coast", "Maldives", "Swiss_Alps", "Machu_Picchu"];
    const pick = places[Math.floor(Math.random() * places.length)];
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${pick}`)
      .then(r => r.json())
      .then(d => { if (d.originalimage?.source) setHeroImage(d.originalimage.source); })
      .catch(() => {});
  }, []);

  const fetchDestImage = async (city) => {
    try {
      for (const wikiLang of ["en", "fr"]) {
        const res = await fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`);
        const data = await res.json();
        if (data.originalimage?.source) {
          setDestImage(data.originalimage.source);
          break;
        }
        if (data.thumbnail?.source) {
          setDestImage(data.thumbnail.source.replace(/\/\d+px-/, '/800px-'));
          break;
        }
      }
    } catch {
      setDestImage(null);
    }
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`);
      const geoData = await geoRes.json();
      if (geoData.length > 0) {
        const lat = parseFloat(geoData[0].lat);
        const lon = parseFloat(geoData[0].lon);
        setCoords([lat, lon]);
        // Fetch weather
        try {
          const m = parseInt(month) + 1;
          const now = new Date();
          const yr = m <= now.getMonth() ? now.getFullYear() + 1 : now.getFullYear();
          const lastDay = new Date(yr, m, 0).getDate();
          const startD = `${yr}-${String(m).padStart(2,'0')}-01`;
          const endD = `${yr}-${String(m).padStart(2,'0')}-${lastDay}`;
          const wRes = await fetch(`https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lon}&start_date=${startD}&end_date=${endD}&models=EC_Earth3P_HR&daily=temperature_2m_mean,precipitation_sum`);
          const wData = await wRes.json();
          if (wData.daily) {
            const temps = wData.daily.temperature_2m_mean || [];
            const precips = wData.daily.precipitation_sum || [];
            const avgTemp = temps.length ? (temps.reduce((a,b) => a+b, 0) / temps.length).toFixed(1) : null;
            const totalPrecip = precips.length ? precips.reduce((a,b) => a+b, 0).toFixed(0) : null;
            setWeather({ temp: avgTemp, precip: totalPrecip });
          }
        } catch { setWeather(null); }
      } else {
        setCoords(null);
      }
    } catch {
      setCoords(null);
    }
  };

  // Charger images + coords pour les étapes d'un road trip
  const fetchStageData = async (stages) => {
    const coords = [];
    const images = {};
    await Promise.all(stages.map(async (stage, idx) => {
      // Image Wikipedia
      for (const wikiLang of ["en", "fr"]) {
        try {
          const res = await fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(stage.city)}`);
          const data = await res.json();
          if (data.originalimage?.source) { images[stage.city] = data.originalimage.source; break; }
          if (data.thumbnail?.source) { images[stage.city] = data.thumbnail.source.replace(/\/\d+px-/, '/800px-'); break; }
        } catch {}
      }
      // Geocoding
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(stage.city + ', ' + stage.country)}&format=json&limit=1`);
        const geoData = await geoRes.json();
        if (geoData.length > 0) {
          coords[idx] = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
        }
      } catch {}
    }));
    setStageImages(images);
    setStageCoords(coords.filter(Boolean));
    // Set main image and coords to first stage
    if (!destImage && Object.values(images)[0]) setDestImage(Object.values(images)[0]);
    if (coords[0]) setCoords(coords[0]);
  };

  // Charger les images Wikipedia pour les suggestions
  const fetchSuggestionImages = async (suggestionsArr) => {
    const images = {};
    await Promise.all(suggestionsArr.map(async (s) => {
      for (const wikiLang of ["en", "fr"]) {
        try {
          const res = await fetch(`https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(s.city)}`);
          const data = await res.json();
          if (data.originalimage?.source) { images[s.city] = data.originalimage.source; return; }
          if (data.thumbnail?.source) { images[s.city] = data.thumbnail.source.replace(/\/\d+px-/, '/800px-'); return; }
        } catch {}
      }
    }));
    setSuggestionImages(images);
  };

  // Charger les voyages sauvegardés
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('bleesh_trips') || '[]');
    setSavedTrips(saved);
  }, []);

  const saveTrip = () => {
    const trip = { id: Date.now(), city: result.destination.city, country: result.destination.country, data: result, image: destImage };
    const updated = [...savedTrips, trip];
    localStorage.setItem('bleesh_trips', JSON.stringify(updated));
    setSavedTrips(updated);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2000);
  };

  const deleteSavedTrip = (id) => {
    const updated = savedTrips.filter(t => t.id !== id);
    localStorage.setItem('bleesh_trips', JSON.stringify(updated));
    setSavedTrips(updated);
  };

  const loadTrip = (trip) => {
    setResult(trip.data);
    setDestImage(trip.image);
    setShowSaved(false);
  };

  const toggle = p => setPrefs(v => v.includes(p) ? v.filter(x => x !== p) : [...v, p]);

  // Étape 1 : chercher les suggestions de destinations
  const findSuggestions = async () => {
    setError("");
    if (!budget || +budget < 100) return setError(t.errB);
    if (month === "" || dur === "") return setError(t.errD);

    setLoadingSuggestions(true);
    setLdIdx(0);

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: +budget,
          travelers: trav,
          month,
          duration: dur,
          city: city || 'Paris',
          preferences: [...prefs, ...(otherPrefText ? [otherPrefText] : [])],
          tripType,
          lang,
          exactDate,
          customNotes,
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSuggestions(data.suggestions);
      fetchSuggestionImages(data.suggestions);
    } catch (err) {
      console.error(err);
      setError(t.errSuggest);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Étape 2 : générer l'itinéraire pour la destination choisie
  const selectDestination = async (suggestion) => {
    setSelectedSuggestion(suggestion);
    setLoadingItinerary(true);
    setLdIdx(0);
    setError("");

    try {
      // Lancer génération IA + recherche prix réels en parallèle
      const [generateRes, pricesRes] = await Promise.all([
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            budget: +budget,
            travelers: trav,
            month,
            duration: dur,
            city: city || 'Paris',
            preferences: [...prefs, ...(otherPrefText ? [otherPrefText] : [])],
            tripType,
            lang,
            exactDate,
            customNotes,
            chosenCity: suggestion.city,
            chosenCountry: suggestion.country,
          }),
        }),
        fetch('/api/prices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            departureCity: city || 'Paris',
            destinationCity: suggestion.city,
            destinationCountry: suggestion.country,
            month,
            duration: dur,
            exactDate,
            travelers: trav,
          }),
        }).catch(() => ({ ok: false })),
      ]);

      if (!generateRes.ok) throw new Error('API error');
      const data = await generateRes.json();
      if (data.error) throw new Error(data.error);

      // Fusionner les vrais prix si disponibles
      if (pricesRes.ok) {
        try {
          const prices = await pricesRes.json();
          const priceSource = { flights: 'estimated', hotel: 'estimated' };

          if (prices.flights?.price != null) {
            data.budget.flights = prices.flights.price;
            data.flightDetails = prices.flights;
            priceSource.flights = 'amadeus';
          }
          if (prices.hotel?.totalPrice != null) {
            data.budget.hotel = prices.hotel.totalPrice;
            data.hotelDetails = prices.hotel;
            priceSource.hotel = 'amadeus';
          }
          data.budget.priceSource = priceSource;
        } catch { /* garder les prix IA en cas d'erreur de parsing */ }
      }

      data.destination.gradient = DEST_GRADIENTS[Math.floor(Math.random() * DEST_GRADIENTS.length)];
      setResult(data);
      if (data.stages && data.stages.length > 0) {
        fetchStageData(data.stages);
      } else {
        fetchDestImage(data.destination.city);
      }
    } catch (err) {
      console.error(err);
      setError(t.errApi);
      setSelectedSuggestion(null);
    } finally {
      setLoadingItinerary(false);
    }
  };

  const backToForm = () => {
    setSuggestions(null);
    setSuggestionImages({});
    setSelectedSuggestion(null);
    setError("");
  };

  const reset = () => {
    setResult(null);
    setSuggestions(null);
    setSuggestionImages({});
    setSelectedSuggestion(null);
    setDestImage(null);
    setCoords(null);
    setJustSaved(false);
    setBudget("");
    setMonth("");
    setDur("");
    setPrefs([]);
    setCity("");
    setTripType("friends");
    setOtherPrefText("");
    setExactDate("");
    setCustomNotes("");
    setWeather(null);
    setComparing([]);
    setShowCompare(false);
    setShowSaved(false);
    setStageCoords([]);
    setStageImages({});
    setLdIdx(0);
    setError("");
  };

  // Export PDF
  const exportPDF = async () => {
    if (!resultRef.current || !result) return;
    try {
      const canvas = await html2canvas(resultRef.current, { scale: 2, useCORS: true, backgroundColor: isDark ? "#121212" : "#FAFAFA" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      let pos = 0;
      const pageH = pdf.internal.pageSize.getHeight();
      while (pos < h) {
        if (pos > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -pos, w, h);
        pos += pageH;
      }
      pdf.save(`BLEESH-${result.destination?.city || 'voyage'}.pdf`);
    } catch (err) { console.error("PDF export error:", err); }
  };

  // Share
  const shareTrip = async () => {
    if (!result) return;
    const text = `${result.destination?.city || ''}, ${result.destination?.country || ''} - BLEESH`;
    if (navigator.share) {
      try { await navigator.share({ title: "BLEESH", text, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Compare toggle
  const toggleCompare = (s) => {
    setComparing(prev => {
      const exists = prev.find(x => x.city === s.city);
      if (exists) return prev.filter(x => x.city !== s.city);
      if (prev.length >= 2) return [prev[1], s];
      return [...prev, s];
    });
  };

  // Calculer les dates de voyage pour les liens de réservation
  const getTravelDates = () => {
    const DURATION_DAYS = [3, 7, 10, 14, 21, 30];
    const durationDays = DURATION_DAYS[parseInt(dur)] || 7;
    let depDate;

    if (exactDate) {
      depDate = new Date(exactDate);
      if (isNaN(depDate.getTime())) depDate = null;
    }
    if (!depDate) {
      const m = parseInt(month);
      const now = new Date();
      const year = (m <= now.getMonth()) ? now.getFullYear() + 1 : now.getFullYear();
      depDate = new Date(year, m, 15);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (depDate <= today) {
      depDate = new Date(today);
      depDate.setDate(depDate.getDate() + 1);
    }
    const retDate = new Date(depDate);
    retDate.setDate(retDate.getDate() + durationDays);

    const fmt = (d) => d.toISOString().split('T')[0];
    const fmtUS = (d) => `${d.getMonth()+1}/${d.getDate()}/${d.getFullYear()}`;
    return { dep: fmt(depDate), ret: fmt(retDate), depUS: fmtUS(depDate), retUS: fmtUS(retDate) };
  };

  // Construire les URLs Expedia avec les bons paramètres
  const getBookingUrls = () => {
    if (!result) return { flights: '#', hotel: '#' };

    // Utiliser les dates Amadeus si dispo, sinon calculer
    const dates = getTravelDates();
    const depDate = result.flightDetails?.outbound?.split('T')[0] || dates.dep;
    const retDate = result.flightDetails?.inbound?.split('T')[0] || dates.ret;

    const origin = city || 'Paris';
    const dest = result.destination.city;
    const country = result.destination.country;
    const adults = Math.min(trav, 9);

    const flightsUrl = `https://www.expedia.com/Flights-search?trip=roundtrip&leg1=from:${encodeURIComponent(origin)},to:${encodeURIComponent(dest)},departure:${depDate}TANYT&leg2=from:${encodeURIComponent(dest)},to:${encodeURIComponent(origin)},departure:${retDate}TANYT&passengers=adults:${adults}&options=sortby:price`;
    const hotelUrl = `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(dest + ', ' + country)}&startDate=${dates.depUS}&endDate=${dates.retUS}&rooms=1&adults=${adults}&sort=PRICE_LOW_TO_HIGH`;

    return { flights: flightsUrl, hotel: hotelUrl };
  };

  // Step actuel
  const currentStep = result ? 2 : suggestions ? 1 : 0;

  const inp = { width: "100%", padding: "12px 14px", background: c.input, border: `2px solid ${c.inputBorder}`, borderRadius: "10px", fontSize: "15px", color: c.text, fontFamily: "inherit" };
  const lbl = { display: "block", marginBottom: "6px", fontSize: "12px", fontWeight: 600, color: c.textSub, textTransform: "uppercase", letterSpacing: "0.5px" };

  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: "'Quicksand', system-ui, sans-serif", color: c.text, transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        button { cursor: pointer; font-family: 'Quicksand', sans-serif; }
        input, select { font-family: 'Quicksand', sans-serif; }
        input:focus, select:focus { outline: none; border-color: #FF8C42 !important; }
        .cta:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(255,140,66,0.35); }
        .pick-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.12); }
        @media(max-width:600px) { .g2 { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* LOADING */}
      {(loadingSuggestions || loadingItinerary) && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: c.loadingBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #EDEDED", borderTop: "3px solid #FF8C42", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: "15px", color: "#FF8C42", fontWeight: 600, transition: "all 0.3s" }}>
            {loadingSuggestions ? t.ldSuggest[ldIdx % t.ldSuggest.length] : t.ldItinerary[ldIdx % t.ldItinerary.length]}
          </div>
          {loadingItinerary && selectedSuggestion && (
            <div style={{ fontSize: "13px", color: c.textSub, fontWeight: 500 }}>
              {selectedSuggestion.city}, {selectedSuggestion.country}
            </div>
          )}
        </div>
      )}

      {/* HEADER */}
      <header style={{ padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: c.header, borderBottom: `1px solid ${c.headerBorder}`, transition: "background 0.3s" }}>
        <span style={{ fontSize: "22px", fontWeight: 700, color: "#FF8C42", letterSpacing: "-0.5px" }}>BLEESH</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {savedTrips.length > 0 && (
            <button onClick={() => setShowSaved(!showSaved)} style={{ background: isDark ? "#333" : "#F5F5F5", border: "none", borderRadius: "20px", padding: "6px 12px", color: "#FF8C42", fontSize: "12px", fontWeight: 700, position: "relative" }}>
              {t.myTrips}
              <span style={{ position: "absolute", top: "-4px", right: "-4px", width: "18px", height: "18px", borderRadius: "50%", background: "#FF8C42", color: "#fff", fontSize: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{savedTrips.length}</span>
            </button>
          )}
          <button onClick={() => setIsDark(!isDark)} style={{ background: isDark ? "#333" : "#F5F5F5", border: "none", borderRadius: "50%", width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s" }}>
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
            )}
          </button>
          <button onClick={() => setLang(lang === "fr" ? "en" : "fr")} style={{ background: isDark ? "#333" : "#F5F5F5", border: "none", borderRadius: "20px", padding: "6px 16px", color: c.textMuted, fontSize: "13px", fontWeight: 700 }}>{t.sw}</button>
        </div>
      </header>

      {/* STEPPER */}
      {(suggestions || result) && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0", padding: "16px 24px 0", maxWidth: "400px", margin: "0 auto" }}>
          {t.steps.map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", fontSize: "12px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: i <= currentStep ? "#FF8C42" : (isDark ? "#333" : "#E0E0E0"),
                  color: i <= currentStep ? "#fff" : c.textMuted, transition: "all 0.3s",
                }}>
                  {i < currentStep ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  ) : i + 1}
                </div>
                <span style={{ fontSize: "10px", fontWeight: 600, color: i <= currentStep ? "#FF8C42" : c.textMuted, whiteSpace: "nowrap" }}>{label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: "2px", background: i < currentStep ? "#FF8C42" : (isDark ? "#333" : "#E0E0E0"), margin: "0 8px", marginBottom: "18px", transition: "background 0.3s" }} />}
            </div>
          ))}
        </div>
      )}

      <main style={{ maxWidth: "580px", margin: "0 auto", padding: "0 20px 60px" }}>

        {result ? (
          /* ===== RESULTS ===== */
          <div ref={resultRef} style={{ animation: "fadeUp 0.5s ease" }}>

            {/* DESTINATION HERO */}
            <div style={{
              margin: "0 -20px", position: "relative", height: "320px", overflow: "hidden",
              background: destImage ? `url(${destImage}) center/cover no-repeat` : (result.destination.gradient || DEST_GRADIENTS[0]),
            }}>
              <div style={{ position: "absolute", inset: 0, background: destImage ? "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 100%)" : "none" }} />
              <div style={{ position: "absolute", bottom: "24px", left: "24px", right: "24px", zIndex: 1 }}>
                <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "2px", color: "rgba(255,255,255,0.7)", marginBottom: "6px", fontWeight: 700 }}>{t.dest}</div>
                <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.3)" }}>
                  {result.destination.city}, {result.destination.country}
                </h2>
              </div>
            </div>

            <p style={{ fontSize: "14px", color: c.textMuted, lineHeight: 1.7, margin: "24px 0 8px", textAlign: "center" }}>{result.destination.description}</p>
            {result.suggestedDates && (
              <p style={{ fontSize: "13px", color: "#FF8C42", fontWeight: 600, textAlign: "center", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {result.suggestedDates}
              </p>
            )}

            {/* MÉTÉO */}
            {weather && (
              <div style={{
                display: "flex", gap: "16px", justifyContent: "center", marginBottom: "20px",
                background: c.card, borderRadius: "12px", padding: "14px 20px", boxShadow: c.shadow,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
                  <div>
                    <div style={{ fontSize: "11px", color: c.textSub, fontWeight: 600 }}>{t.avgTemp}</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: c.text }}>{weather.temp}°C</div>
                  </div>
                </div>
                <div style={{ width: "1px", background: c.inputBorder }} />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3EC1D3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                  <div>
                    <div style={{ fontSize: "11px", color: c.textSub, fontWeight: 600 }}>{t.rainfall}</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: c.text }}>{weather.precip}mm</div>
                  </div>
                </div>
              </div>
            )}

            {/* MINI CARTE — road trip multi-markers ou single marker */}
            {result.stages && stageCoords.length > 1 ? (
              <div style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "32px", boxShadow: c.shadow, height: "260px" }}>
                <MapContainer center={stageCoords[0]} zoom={5} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} zoomControl={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {stageCoords.map((pos, i) => (
                    <Marker key={i} position={pos}>
                      <Popup>{result.stages[i]?.city}</Popup>
                    </Marker>
                  ))}
                  <Polyline positions={stageCoords} color="#FF8C42" weight={3} dashArray="8 6" />
                </MapContainer>
              </div>
            ) : coords && (
              <div style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "32px", boxShadow: c.shadow, height: "220px" }}>
                <MapContainer center={coords} zoom={10} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false} dragging={false} zoomControl={false}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={coords}>
                    <Popup>{result.destination.city}, {result.destination.country}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}

            {/* BUDGET */}
            <div style={{ background: c.card, borderRadius: "16px", padding: "24px", boxShadow: c.shadow, marginBottom: "32px", transition: "background 0.3s" }}>
              {(() => {
                const entries = Object.entries(t.cats);
                const total = entries.reduce((s, [k]) => s + (result.budget?.[k] || 0), 0);
                return <>
                  <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", height: "22px", marginBottom: "18px" }}>
                    {entries.map(([k]) => {
                      const pct = total > 0 ? ((result.budget?.[k] || 0) / total) * 100 : 0;
                      return pct > 0 ? <div key={k} style={{ width: `${pct}%`, background: BCOLORS[k], fontSize: "9px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{pct > 10 ? Math.round(pct) + "%" : ""}</div> : null;
                    })}
                  </div>
                  {entries.map(([k, label]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: 28, height: 28, borderRadius: "8px", background: BCOLORS[k], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
                          {CAT_ICONS[k]}
                        </div>
                        <span style={{ fontSize: "13px", color: c.textMuted }}>{label}</span>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: c.text, display: "flex", alignItems: "center", gap: "6px" }}>
                        {result.budget?.[k] || 0}€
                        {result.budget?.priceSource?.[k] === 'amadeus' ? (
                          <span title={t.realPrice} style={{ display: "inline-flex", alignItems: "center", gap: "3px", background: "#E8F5E9", color: "#2EAD7A", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "8px" }}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            {t.realPrice}
                          </span>
                        ) : (k === 'flights' || k === 'hotel') && !result.budget?.priceSource ? null : result.budget?.priceSource && (k === 'flights' || k === 'hotel') ? (
                          <span title={t.estPrice} style={{ fontSize: "10px", color: c.textSub, fontWeight: 600 }}>~</span>
                        ) : null}
                      </span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${c.inputBorder}`, paddingTop: "10px", marginTop: "10px", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 700, color: "#FF8C42", fontSize: "14px" }}>{t.total}</span>
                    <span style={{ fontWeight: 700, color: "#FF8C42", fontSize: "18px" }}>{total}€</span>
                  </div>
                </>;
              })()}
            </div>

            {/* AMADEUS DETAILS */}
            {(result.flightDetails || result.hotelDetails) && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                {result.flightDetails && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", background: c.card, borderRadius: "12px", padding: "12px 16px", boxShadow: c.shadow, border: `1px solid ${c.inputBorder}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: "8px", background: BCOLORS.flights, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>{CAT_ICONS.flights}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: c.text }}>{result.flightDetails.airline || 'Vol'} — {result.flightDetails.pricePerPerson}€/pers.</div>
                      <div style={{ fontSize: "11px", color: c.textSub }}>{result.flightDetails.outbound?.split('T')[0] || ''}</div>
                    </div>
                    <span style={{ background: "#E8F5E9", color: "#2EAD7A", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px" }}>{t.realPrice}</span>
                  </div>
                )}
                {result.hotelDetails && (
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", background: c.card, borderRadius: "12px", padding: "12px 16px", boxShadow: c.shadow, border: `1px solid ${c.inputBorder}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: "8px", background: BCOLORS.hotel, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>{CAT_ICONS.hotel}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: c.text }}>{result.hotelDetails.hotelName || 'Hôtel'} {result.hotelDetails.rating ? '★'.repeat(result.hotelDetails.rating) : ''}</div>
                      <div style={{ fontSize: "11px", color: c.textSub }}>{result.hotelDetails.pricePerNight}€/{lang === 'fr' ? 'nuit' : 'night'}</div>
                    </div>
                    <span style={{ background: "#E8F5E9", color: "#2EAD7A", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "8px" }}>{t.realPrice}</span>
                  </div>
                )}
              </div>
            )}

            {/* BOOKING LINKS */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "32px", flexWrap: "wrap" }}>
              {(() => { const urls = getBookingUrls(); return [
                { key: "bookFlights", icon: CAT_ICONS.flights, color: BCOLORS.flights, url: urls.flights },
                { key: "bookHotel", icon: CAT_ICONS.hotel, color: BCOLORS.hotel, url: urls.hotel },
                { key: "bookActivities", icon: CAT_ICONS.activities, color: BCOLORS.activities, url: `https://www.getyourguide.com/s/?q=${encodeURIComponent(result.destination.city)}&partner_id=TU7ZS7Y&cmp=share_to_earn` },
              ].map(({ key, icon, color, url }) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", flex: 1, minWidth: "100px" }}>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    padding: "12px", borderRadius: "12px", background: color, color: "#fff",
                    fontSize: "13px", fontWeight: 700, transition: "transform 0.2s",
                  }}>
                    {icon}
                    {t[key]}
                  </div>
                </a>
              )); })()}
            </div>

            {/* SAVE TRIP */}
            <button onClick={saveTrip} disabled={justSaved} style={{
              width: "100%", padding: "14px", marginBottom: "32px", borderRadius: "12px",
              border: `2px solid ${justSaved ? c.tipsText : "#FF8C42"}`,
              background: justSaved ? c.tipsBg : "transparent",
              color: justSaved ? c.tipsText : "#FF8C42",
              fontSize: "14px", fontWeight: 700, transition: "all 0.3s",
            }}>
              {justSaved ? (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {t.saved}
                </span>
              ) : t.save}
            </button>

            {/* EXPORT / SHARE */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
              <button onClick={exportPDF} style={{
                flex: 1, padding: "12px", borderRadius: "12px", border: `2px solid ${c.inputBorder}`,
                background: "transparent", color: c.textMuted, fontSize: "13px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/></svg>
                {t.exportPdf}
              </button>
              <button onClick={shareTrip} style={{
                flex: 1, padding: "12px", borderRadius: "12px", border: `2px solid ${c.inputBorder}`,
                background: copiedLink ? c.tipsBg : "transparent", color: copiedLink ? c.tipsText : c.textMuted,
                fontSize: "13px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "all 0.3s",
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                {copiedLink ? t.copied : t.share}
              </button>
            </div>

            {/* PROGRAMME — Road trip multi-étapes ou voyage classique */}
            {result.stages ? (
              <>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: c.text }}>{t.routeTitle}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "32px" }}>
                  {result.stages.map((stage, si) => (
                    <div key={si} style={{ animation: `fadeUp 0.4s ease ${si * 0.15}s both` }}>
                      {/* Stage header */}
                      <div style={{
                        display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px",
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%", background: DEST_GRADIENTS[si % DEST_GRADIENTS.length],
                          display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", color: "#fff", flexShrink: 0,
                        }}>{si + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "17px", color: c.text }}>{stage.city}, {stage.country}</div>
                          <div style={{ fontSize: "12px", color: c.textSub }}>{stage.nights} {t.stageNights} — {stage.description}</div>
                        </div>
                      </div>
                      {/* Stage image */}
                      {stageImages[stage.city] && (
                        <div style={{
                          height: "140px", borderRadius: "12px", overflow: "hidden", marginBottom: "12px",
                          background: `url(${stageImages[stage.city]}) center/cover no-repeat`,
                        }} />
                      )}
                      {/* Stage days */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingLeft: "18px", borderLeft: `3px solid ${DEST_GRADIENTS[si % DEST_GRADIENTS.length].includes("#FF") ? "#FF8C42" : "#3EC1D3"}` }}>
                        {stage.days?.map((day, di) => (
                          <div key={di} style={{ background: c.card, borderRadius: "14px", overflow: "hidden", boxShadow: c.shadow }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", borderBottom: `1px solid ${c.dayBorder}` }}>
                              <div style={{ width: 26, height: 26, borderRadius: "50%", background: isDark ? "#333" : "#F0F0F0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px", color: c.textMuted, flexShrink: 0 }}>J{di + 1}</div>
                              <div style={{ fontWeight: 700, fontSize: "14px", color: c.text }}>{day.title}</div>
                            </div>
                            <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                              {["morning", "afternoon", "evening"].map(p => day[p] ? (
                                <div key={p} style={{ paddingLeft: "12px", borderLeft: `3px solid ${p === "morning" ? "#FFD4A8" : p === "afternoon" ? "#FF8C42" : "#D4756B"}` }}>
                                  <div style={{ fontSize: "10px", fontWeight: 700, color: p === "morning" ? "#C49A5C" : p === "afternoon" ? "#FF8C42" : "#D4756B", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.per[p]}</div>
                                  <div style={{ fontSize: "13px", color: c.textMuted, lineHeight: 1.6 }}>{day[p]}</div>
                                </div>
                              ) : null)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* Connector arrow between stages */}
                      {si < result.stages.length - 1 && (
                        <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c.textSub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: c.text }}>{t.prog}</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginBottom: "32px" }}>
                  {result.days?.map((day, i) => (
                    <div key={i} style={{ background: c.card, borderRadius: "16px", overflow: "hidden", boxShadow: c.shadow, animation: `fadeUp 0.3s ease ${i * 0.1}s both`, transition: "background 0.3s" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", borderBottom: `1px solid ${c.dayBorder}` }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "#FF8C42", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "14px", color: "#fff", flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ fontWeight: 700, fontSize: "16px", color: c.text }}>{day.title}</div>
                      </div>
                      <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        {["morning", "afternoon", "evening"].map(p => day[p] ? (
                          <div key={p} style={{ paddingLeft: "14px", borderLeft: `3px solid ${p === "morning" ? "#FFD4A8" : p === "afternoon" ? "#FF8C42" : "#D4756B"}` }}>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: p === "morning" ? "#C49A5C" : p === "afternoon" ? "#FF8C42" : "#D4756B", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.per[p]}</div>
                            <div style={{ fontSize: "14px", color: c.textMuted, lineHeight: 1.7 }}>{day[p]}</div>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* TIPS */}
            {result.tips?.length > 0 && (
              <div style={{ background: c.tipsBg, borderRadius: "16px", padding: "20px", marginBottom: "32px", border: `1px solid ${c.tipsBorder}`, transition: "background 0.3s" }}>
                <h3 style={{ fontSize: "14px", color: c.tipsText, marginBottom: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>{t.tips}</h3>
                {result.tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", fontSize: "14px", color: c.textMuted, lineHeight: 1.7, marginBottom: "10px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.tipsText, flexShrink: 0, marginTop: "8px" }} />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            <button className="cta" onClick={reset} style={{
              width: "100%", padding: "16px", background: "#FF8C42", border: "none", borderRadius: "12px",
              color: "#fff", fontSize: "15px", fontWeight: 700, transition: "all 0.2s",
            }}>{t.newTrip}</button>
          </div>

        ) : suggestions ? (
          /* ===== DESTINATION PICKER ===== */
          <div style={{ animation: "fadeUp 0.4s ease", paddingTop: "24px" }}>

            {/* Bouton retour */}
            <button onClick={backToForm} style={{
              background: "none", border: "none", color: c.textMuted, fontSize: "14px", fontWeight: 600,
              display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px", padding: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
              {t.pickBack}
            </button>

            {/* Titre */}
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: c.text, textAlign: "center", marginBottom: "8px" }}>{t.pickTitle}</h2>
            <p style={{ fontSize: "14px", color: c.textSub, textAlign: "center", marginBottom: "28px", fontWeight: 500 }}>{t.pickSub}</p>

            {error && <div style={{ background: c.errorBg, borderRadius: "10px", padding: "10px 16px", color: "#E55", fontSize: "13px", textAlign: "center", fontWeight: 600, marginBottom: "20px" }}>{error}</div>}

            {/* Cartes de destination */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {suggestions.map((s, i) => (
                <div key={i} className="pick-card" style={{
                  background: c.card, borderRadius: "16px", overflow: "hidden", boxShadow: c.shadow,
                  animation: `fadeUp 0.4s ease ${i * 0.12}s both`, transition: "all 0.3s",
                }}>
                  {/* Image */}
                  <div style={{
                    position: "relative", height: "180px", overflow: "hidden",
                    background: suggestionImages[s.city] ? `url(${suggestionImages[s.city]}) center/cover no-repeat` : DEST_GRADIENTS[i % DEST_GRADIENTS.length],
                  }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 50%)" }} />
                    {/* Ville / Pays */}
                    <div style={{ position: "absolute", bottom: "14px", left: "16px", zIndex: 1 }}>
                      <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
                        {s.city}, {s.country}
                      </div>
                    </div>
                    {/* Badge budget */}
                    <div style={{
                      position: "absolute", bottom: "16px", right: "16px", zIndex: 1,
                      background: "rgba(255,140,66,0.9)", borderRadius: "20px", padding: "4px 12px",
                    }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#fff" }}>{s.estimatedBudget}€</span>
                    </div>
                  </div>

                  {/* Contenu */}
                  <div style={{ padding: "16px 20px" }}>
                    <p style={{ fontSize: "14px", color: c.textMuted, lineHeight: 1.7, marginBottom: "8px" }}>{s.description}</p>
                    {s.suggestedDates && (
                      <p style={{ fontSize: "12px", color: c.textSub, fontWeight: 600, marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {s.suggestedDates}
                      </p>
                    )}
                    {s.matchReason && (
                      <p style={{ fontSize: "12px", color: "#FF8C42", fontWeight: 600, marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF8C42" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                        {s.matchReason}
                      </p>
                    )}
                  </div>

                  {/* Boutons choisir + comparer */}
                  <div style={{ display: "flex", borderTop: `1px solid ${c.inputBorder}` }}>
                    <button onClick={() => selectDestination(s)} style={{
                      flex: 1, padding: "14px", border: "none",
                      background: "transparent", color: "#FF8C42", fontSize: "14px", fontWeight: 700,
                      transition: "background 0.2s",
                    }}>
                      {t.pickChoose}
                    </button>
                    <button onClick={() => { toggleCompare(s); if (comparing.length === 1 && !comparing.find(x => x.city === s.city)) setShowCompare(true); }} style={{
                      padding: "14px 18px", border: "none", borderLeft: `1px solid ${c.inputBorder}`,
                      background: comparing.find(x => x.city === s.city) ? (isDark ? "#3A2A1A" : "#FFF4ED") : "transparent",
                      color: comparing.find(x => x.city === s.city) ? "#FF8C42" : c.textMuted,
                      fontSize: "12px", fontWeight: 700, transition: "all 0.2s",
                    }}>
                      {t.compare}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : (
          /* ===== FORM ===== */
          <div style={{ animation: "fadeUp 0.4s ease" }}>

            {/* HERO */}
            <div style={{
              margin: "0 -20px", position: "relative", height: "280px", overflow: "hidden",
              background: heroImage ? `url(${heroImage}) center/cover no-repeat` : HERO_GRADIENT,
            }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 100%)" }} />
              <div style={{ position: "absolute", bottom: "32px", left: "24px", right: "24px", zIndex: 1 }}>
                <h1 style={{ fontSize: "clamp(40px, 10vw, 56px)", fontWeight: 700, color: "#fff", lineHeight: 1, marginBottom: "10px", letterSpacing: "-1px", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>BLEESH</h1>
                <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.9)", fontWeight: 500, textShadow: "0 1px 6px rgba(0,0,0,0.3)" }}>{t.slogan}</p>
              </div>
            </div>

            <div style={{ height: "24px" }} />

            {/* FORM */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lbl}>{t.budget}</label>
                  <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder={t.budgetPh} style={inp} />
                </div>
                <div>
                  <label style={lbl}>{t.trav}</label>
                  <select value={trav} onChange={e => setTrav(+e.target.value)} style={{ ...inp, appearance: "none" }}>
                    {t.trvl.map((l, i) => <option key={i} value={i + 1}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={lbl}>{t.month}</label>
                  <select value={month} onChange={e => setMonth(e.target.value)} style={{ ...inp, appearance: "none", color: month !== "" ? c.text : "#bbb" }}>
                    <option value="">—</option>
                    {t.months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>{t.dur}</label>
                  <select value={dur} onChange={e => setDur(e.target.value)} style={{ ...inp, appearance: "none", color: dur !== "" ? c.text : "#bbb" }}>
                    <option value="">—</option>
                    {t.durs.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>{t.exactDate}</label>
                <input type="date" value={exactDate} onChange={e => setExactDate(e.target.value)} style={{ ...inp, color: exactDate ? c.text : "#bbb" }} />
              </div>

              <div>
                <label style={lbl}>{t.city}</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder={t.cityPh} style={inp} />
              </div>

              {/* PREFS */}
              <div>
                <label style={{ ...lbl, marginBottom: "10px" }}>{t.prefs}</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {Object.entries(PREF_DATA).map(([k, data]) => {
                    const sel = prefs.includes(k);
                    return (
                      <button key={k} onClick={() => toggle(k)} style={{
                        position: "relative", borderRadius: "12px", overflow: "hidden",
                        border: sel ? "3px solid #FF8C42" : "3px solid transparent",
                        height: "80px", padding: 0, background: data.gradient,
                        transition: "all 0.2s", display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center", gap: "4px",
                        opacity: sel ? 1 : 0.75,
                      }}>
                        {sel && <div style={{ position: "absolute", inset: 0, background: "rgba(255,140,66,0.2)" }} />}
                        <div style={{ position: "relative", zIndex: 1 }}>{data.icon}</div>
                        <span style={{ position: "relative", zIndex: 1, color: "#fff", fontSize: "11px", fontWeight: 700 }}>{t.p[k]}</span>
                        {sel && <div style={{ position: "absolute", top: "5px", right: "5px", width: "18px", height: "18px", borderRadius: "50%", background: "#FF8C42", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>}
                      </button>
                    );
                  })}
                </div>
                {/* Bouton "Autre" */}
                <div style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    value={otherPrefText}
                    onChange={e => setOtherPrefText(e.target.value)}
                    placeholder={t.otherPrefPh}
                    style={{ ...inp, background: otherPrefText ? (isDark ? "#3A2A1A" : "#FFF4ED") : c.input, border: otherPrefText ? "2px solid #FF8C42" : `2px solid ${c.inputBorder}` }}
                  />
                </div>
              </div>

              {/* TYPE DE VOYAGE */}
              <div>
                <label style={{ ...lbl, marginBottom: "10px" }}>{t.tripType}</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {Object.entries(t.types).map(([k, label]) => (
                    <button key={k} onClick={() => setTripType(k)} style={{
                      padding: "12px", borderRadius: "10px", fontSize: "13px", fontWeight: 600,
                      border: tripType === k ? "2px solid #FF8C42" : `2px solid ${c.inputBorder}`,
                      background: tripType === k ? (isDark ? "#3A2A1A" : "#FFF4ED") : c.input,
                      color: tripType === k ? "#FF8C42" : c.textMuted,
                      transition: "all 0.2s",
                    }}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* NOTES PERSONNALISÉES */}
              <div>
                <label style={lbl}>{t.customNotes}</label>
                <textarea
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder={t.customNotesPh}
                  rows={3}
                  style={{ ...inp, resize: "vertical", lineHeight: 1.6 }}
                />
              </div>

              {error && <div style={{ background: c.errorBg, borderRadius: "10px", padding: "10px 16px", color: "#E55", fontSize: "13px", textAlign: "center", fontWeight: 600 }}>{error}</div>}

              <button className="cta" onClick={findSuggestions} disabled={loadingSuggestions} style={{
                width: "100%", padding: "16px", background: "#FF8C42", border: "none", borderRadius: "12px",
                color: "#fff", fontSize: "16px", fontWeight: 700, transition: "all 0.2s", opacity: loadingSuggestions ? 0.6 : 1,
              }}>{t.go}</button>
            </div>
          </div>
        )}
      </main>

      {/* MODAL COMPARAISON */}
      {showCompare && comparing.length === 2 && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowCompare(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "600px", maxHeight: "85vh", background: c.card, borderRadius: "20px",
            padding: "24px", overflowY: "auto", animation: "fadeUp 0.3s ease",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: c.text }}>{t.vsTitle}</h3>
              <button onClick={() => setShowCompare(false)} style={{ background: "none", border: "none", fontSize: "22px", color: c.textMuted, padding: "4px" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {comparing.map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{
                    height: "120px", borderRadius: "12px", overflow: "hidden",
                    background: suggestionImages[s.city] ? `url(${suggestionImages[s.city]}) center/cover` : DEST_GRADIENTS[i],
                  }} />
                  <h4 style={{ fontSize: "16px", fontWeight: 700, color: c.text }}>{s.city}</h4>
                  <div style={{ fontSize: "12px", color: c.textSub }}>{s.country}</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#FF8C42" }}>{s.estimatedBudget}€</div>
                  <p style={{ fontSize: "12px", color: c.textMuted, lineHeight: 1.6 }}>{s.description}</p>
                  {s.suggestedDates && <p style={{ fontSize: "11px", color: c.textSub }}>{s.suggestedDates}</p>}
                  <button onClick={() => { setShowCompare(false); setComparing([]); selectDestination(s); }} style={{
                    padding: "12px", borderRadius: "10px", border: "none",
                    background: "#FF8C42", color: "#fff", fontSize: "13px", fontWeight: 700,
                  }}>
                    {t.pickChoose}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL MES VOYAGES */}
      {showSaved && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowSaved(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: "100%", maxWidth: "580px", maxHeight: "70vh", background: c.card, borderRadius: "20px 20px 0 0",
            padding: "24px", overflowY: "auto", animation: "fadeUp 0.3s ease", transition: "background 0.3s",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: c.text }}>{t.myTrips}</h3>
              <button onClick={() => setShowSaved(false)} style={{ background: "none", border: "none", fontSize: "22px", color: c.textMuted, padding: "4px" }}>✕</button>
            </div>
            {savedTrips.length === 0 ? (
              <p style={{ textAlign: "center", color: c.textSub, fontSize: "14px", padding: "40px 0" }}>{t.noTrips}</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {savedTrips.map(trip => (
                  <div key={trip.id} style={{
                    display: "flex", alignItems: "center", gap: "14px", padding: "14px",
                    background: isDark ? "#2A2A2A" : "#F8F8F8", borderRadius: "14px", transition: "background 0.3s",
                  }}>
                    <div style={{
                      width: "56px", height: "56px", borderRadius: "12px", flexShrink: 0, overflow: "hidden",
                      background: trip.image ? `url(${trip.image}) center/cover no-repeat` : DEST_GRADIENTS[0],
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: c.text }}>{trip.city}</div>
                      <div style={{ fontSize: "12px", color: c.textSub }}>{trip.country}</div>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                      <button onClick={() => loadTrip(trip)} style={{
                        padding: "8px 14px", borderRadius: "8px", border: "none",
                        background: "#FF8C42", color: "#fff", fontSize: "12px", fontWeight: 700,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <button onClick={() => deleteSavedTrip(trip.id)} style={{
                        padding: "8px 14px", borderRadius: "8px", border: "none",
                        background: isDark ? "#3A1515" : "#FFE8E8", color: "#E55", fontSize: "12px", fontWeight: 700,
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle" }}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
