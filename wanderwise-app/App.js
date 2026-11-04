import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text, TextInput, Pressable,
  StyleSheet, StatusBar, Alert, Linking, Share
} from "react-native";
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as Notifications from "expo-notifications";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import { WebView } from "react-native-webview";

const GREEN = "#176B55", MINT = "#DFF4E9", ORANGE = "#F1A35B";
const INK = "#172B3A", MUTED = "#60717D", LINE = "#E4EAE6";
const KEY = "wanderwise.savedTrips.v1";
const SUPABASE_URL = "https://hmjtzyakidwtkzhhbgzd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_3dsWrDTOtIz6eWi_ndF4Qw_GJIUY8o6";
const STORAGE_KEY = "wanderwise.device-encryption-key.v1";
let deviceEncryptionKeyPromise = null;
const getDeviceEncryptionKey = () => {
  if (!deviceEncryptionKeyPromise) deviceEncryptionKeyPromise = (async () => {
    let encoded = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!encoded) {
      encoded = naclUtil.encodeBase64(await Crypto.getRandomBytesAsync(nacl.secretbox.keyLength));
      await SecureStore.setItemAsync(STORAGE_KEY, encoded);
    }
    return naclUtil.decodeBase64(encoded);
  })();
  return deviceEncryptionKeyPromise;
};
const encryptedStorage = {
  async getItem(key) {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return null;
    if (!raw.startsWith("wwenc1:")) {
      await this.setItem(key, raw);
      return raw;
    }
    const payload = naclUtil.decodeBase64(raw.slice(7));
    const nonce = payload.slice(0, nacl.secretbox.nonceLength);
    const box = payload.slice(nacl.secretbox.nonceLength);
    const clear = nacl.secretbox.open(box, nonce, await getDeviceEncryptionKey());
    if (!clear) throw new Error("Saved data could not be decrypted on this device.");
    return naclUtil.encodeUTF8(clear);
  },
  async setItem(key, value) {
    const nonce = await Crypto.getRandomBytesAsync(nacl.secretbox.nonceLength);
    const box = nacl.secretbox(naclUtil.decodeUTF8(String(value)), nonce, await getDeviceEncryptionKey());
    const payload = new Uint8Array(nonce.length + box.length);
    payload.set(nonce, 0); payload.set(box, nonce.length);
    await AsyncStorage.setItem(key, "wwenc1:" + naclUtil.encodeBase64(payload));
  },
  async removeItem(key) { return AsyncStorage.removeItem(key); },
  async multiGet(keys) { return Promise.all(keys.map(async key => [key, await this.getItem(key)])); },
  async multiSet(items) { await Promise.all(items.map(([key, value]) => this.setItem(key, value))); }
};
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { storage: encryptedStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } });
let cloudSyncInProgress = false;
const UI_TEXT = {
  English: { home:"⌂ Home", explore:"⌖ Explore", discover:"✦ Discover", forYou:"✧ For You", plan:"✎ Plan trip", stays:"⌂ Stays", expenses:"₹ Expenses", analytics:"▥ Insights", saved:"♡ Saved", tagline:"Small budget. Big memories.", settings:"Settings", language:"App language" },
  Telugu: { home:"⌂ హోమ్", explore:"⌖ అన్వేషించు", discover:"✦ కనుగొను", forYou:"✧ మీ కోసం", plan:"✎ ప్రయాణ ప్రణాళిక", stays:"⌂ వసతి", expenses:"₹ ఖర్చులు", analytics:"▥ విశ్లేషణ", saved:"♡ సేవ్ చేసినవి", tagline:"చిన్న బడ్జెట్. పెద్ద జ్ఞాపకాలు.", settings:"సెట్టింగ్స్", language:"యాప్ భాష" },
  Hindi: { home:"⌂ होम", explore:"⌖ खोजें", discover:"✦ नई जगहें", forYou:"✧ आपके लिए", plan:"✎ यात्रा योजना", stays:"⌂ ठहरना", expenses:"₹ खर्चे", analytics:"▥ विश्लेषण", saved:"♡ सहेजे गए", tagline:"छोटा बजट। बड़ी यादें।", settings:"सेटिंग्स", language:"ऐप की भाषा" },
  Tamil: { home:"⌂ முகப்பு", explore:"⌖ ஆராய்க", discover:"✦ கண்டறி", forYou:"✧ உங்களுக்காக", plan:"✎ பயணத் திட்டம்", stays:"⌂ தங்குமிடம்", expenses:"₹ செலவுகள்", analytics:"▥ புள்ளிவிவரங்கள்", saved:"♡ சேமித்தவை", tagline:"சிறிய பட்ஜெட். பெரிய நினைவுகள்.", settings:"அமைப்புகள்", language:"பயன்பாட்டு மொழி" }
};

const destinations = [
  { name: "Vijayawada & Bhavani Island", region: "Andhra Pradesh", note: "River views", budget: "₹2,350–₹4,465", low: 2350, category: "Nature", emoji: "🌿", lat: 16.5062, lon: 80.648, highlights: "Krishna River scenery, island activities and city food." },
  { name: "Amaravati", region: "Andhra Pradesh", note: "Heritage", budget: "₹2,100–₹3,990", low: 2100, category: "Culture", emoji: "🏛️", lat: 16.5745, lon: 80.3575, highlights: "Buddhist heritage and a relaxed cultural day out." },
  { name: "Suryalanka Beach", region: "Andhra Pradesh", note: "Coastal break", budget: "₹2,450–₹4,655", low: 2450, category: "Beach", emoji: "🏖️", lat: 15.865, lon: 80.511, highlights: "A coastal getaway with time for the shoreline and local food." },
  { name: "Araku Valley", region: "Andhra Pradesh", note: "Hills & greenery", budget: "₹3,250–₹6,175", low: 3250, category: "Nature", emoji: "🌿", lat: 18.3273, lon: 82.8775, highlights: "Green valleys, viewpoints and coffee-country scenery." },
  { name: "Visakhapatnam", region: "Andhra Pradesh", note: "Beach & city", budget: "₹3,400–₹6,460", low: 3400, category: "Beach", emoji: "🏖️", lat: 17.6868, lon: 83.2185, highlights: "Beachfront spots, viewpoints and city attractions." },
  { name: "Tirupati", region: "Andhra Pradesh", note: "Spiritual visit", budget: "₹2,550–₹4,845", low: 2550, category: "Spiritual", emoji: "🛕", lat: 13.6288, lon: 79.4192, highlights: "Temple visit and nearby cultural attractions." },
  { name: "Hyderabad", region: "Telangana", note: "Food & culture", budget: "₹3,500–₹6,650", low: 3500, category: "City", emoji: "🌆", lat: 17.385, lon: 78.4867, highlights: "Historic landmarks, markets and well-known local food." },
  { name: "Hampi", region: "Karnataka", note: "Historic ruins", budget: "₹3,250–₹6,175", low: 3250, category: "Culture", emoji: "🏛️", lat: 15.335, lon: 76.46, highlights: "Distinctive historic landscapes and architecture." },
  { name: "Mysuru", region: "Karnataka", note: "Palaces & gardens", budget: "₹3,450–₹6,555", low: 3450, category: "Culture", emoji: "🏛️", lat: 12.2958, lon: 76.6394, highlights: "Palace architecture, gardens and local culture." },
  { name: "Pondicherry", region: "Puducherry", note: "Coastal town", budget: "₹3,700–₹7,030", low: 3700, category: "Beach", emoji: "🏖️", lat: 11.9416, lon: 79.8083, highlights: "Coastal promenades, colourful streets and cafés." },
  { name: "Chennai", region: "Tamil Nadu", note: "City & coastline", budget: "₹3,550–₹6,745", low: 3550, category: "City", emoji: "🌆", lat: 13.0827, lon: 80.2707, highlights: "Marina Beach, museums, neighbourhoods and South Indian food." },
  { name: "Madurai", region: "Tamil Nadu", note: "Temple heritage", budget: "₹2,650–₹5,035", low: 2650, category: "Spiritual", emoji: "🛕", lat: 9.9252, lon: 78.1198, highlights: "Historic temple architecture, markets and local cuisine." },
  { name: "Munnar", region: "Kerala", note: "Tea hills", budget: "₹3,650–₹6,935", low: 3650, category: "Nature", emoji: "🌿", lat: 10.0889, lon: 77.0595, highlights: "Tea gardens, misty hills and scenic viewpoints." },
  { name: "Alappuzha", region: "Kerala", note: "Backwaters", budget: "₹3,650–₹6,935", low: 3650, category: "Nature", emoji: "🌿", lat: 9.4981, lon: 76.3388, highlights: "Backwaters, canals and coastal scenery." },
  { name: "Goa", region: "Goa", note: "Beaches & culture", budget: "₹4,300–₹8,170", low: 4300, category: "Beach", emoji: "🏖️", lat: 15.2993, lon: 74.124, highlights: "Beaches, heritage neighbourhoods and local markets." },
  { name: "Mumbai", region: "Maharashtra", note: "Big-city escape", budget: "₹4,650–₹8,835", low: 4650, category: "City", emoji: "🌆", lat: 19.076, lon: 72.8777, highlights: "Waterfront landmarks, museums, markets and city life." },
  { name: "Pune", region: "Maharashtra", note: "City & forts", budget: "₹3,550–₹6,745", low: 3550, category: "City", emoji: "🌆", lat: 18.5204, lon: 73.8567, highlights: "Urban culture, nearby forts and food spots." },
  { name: "Jaipur", region: "Rajasthan", note: "Palaces & forts", budget: "₹3,750–₹7,125", low: 3750, category: "Culture", emoji: "🏛️", lat: 26.9124, lon: 75.7873, highlights: "Pink City streets, forts, palaces and traditional markets." },
  { name: "Udaipur", region: "Rajasthan", note: "Lakes & palaces", budget: "₹3,950–₹7,505", low: 3950, category: "Culture", emoji: "🏛️", lat: 24.5854, lon: 73.7125, highlights: "Lake views, historic palaces and old-city lanes." },
  { name: "Delhi", region: "Delhi", note: "Capital highlights", budget: "₹4,150–₹7,885", low: 4150, category: "Culture", emoji: "🏛️", lat: 28.6139, lon: 77.209, highlights: "Historic monuments, museums, markets and varied food." },
  { name: "Agra", region: "Uttar Pradesh", note: "World heritage", budget: "₹3,600–₹6,840", low: 3600, category: "Culture", emoji: "🏛️", lat: 27.1767, lon: 78.0081, highlights: "The Taj Mahal area, Mughal architecture and historic sites." },
  { name: "Varanasi", region: "Uttar Pradesh", note: "River & heritage", budget: "₹3,100–₹5,890", low: 3100, category: "Spiritual", emoji: "🛕", lat: 25.3176, lon: 82.9739, highlights: "Ganga ghats, historic lanes and cultural experiences." },
  { name: "Rishikesh", region: "Uttarakhand", note: "River & adventure", budget: "₹4,650–₹8,835", low: 4650, category: "Adventure", emoji: "⛰️", lat: 30.0869, lon: 78.2676, highlights: "River scenery and adventure activities; long-distance travel can raise costs." },
  { name: "Shimla", region: "Himachal Pradesh", note: "Mountain views", budget: "₹4,150–₹7,885", low: 4150, category: "Nature", emoji: "🌿", lat: 31.1048, lon: 77.1734, highlights: "Mountain scenery, walking streets and colonial-era architecture." },
  { name: "Manali", region: "Himachal Pradesh", note: "Himalayan escape", budget: "₹4,750–₹9,025", low: 4750, category: "Adventure", emoji: "⛰️", lat: 32.2432, lon: 77.1892, highlights: "Mountain views, outdoor activities and valley scenery." },
  { name: "Srinagar", region: "Jammu & Kashmir", note: "Lakes & mountains", budget: "₹4,850–₹9,215", low: 4850, category: "Nature", emoji: "🌿", lat: 34.0837, lon: 74.7973, highlights: "Lake views, gardens and Himalayan landscapes." },
  { name: "Kolkata", region: "West Bengal", note: "Culture & food", budget: "₹3,150–₹5,985", low: 3150, category: "Culture", emoji: "🏛️", lat: 22.5726, lon: 88.3639, highlights: "Museums, colonial-era landmarks, markets and Bengali food." },
  { name: "Darjeeling", region: "West Bengal", note: "Tea & mountains", budget: "₹3,950–₹7,505", low: 3950, category: "Nature", emoji: "🌿", lat: 27.041, lon: 88.2663, highlights: "Tea gardens, mountain views and heritage rail experiences." },
  { name: "Shillong", region: "Meghalaya", note: "Waterfalls & hills", budget: "₹3,800–₹7,220", low: 3800, category: "Nature", emoji: "🌿", lat: 25.5788, lon: 91.8933, highlights: "Green hills, waterfalls and scenic drives." },
  { name: "Kaziranga", region: "Assam", note: "Wildlife & nature", budget: "₹4,700–₹8,930", low: 4700, category: "Adventure", emoji: "⛰️", lat: 26.5775, lon: 93.1711, highlights: "Wildlife and nature experiences; check seasonal access and permits." },
  { name: "Puri", region: "Odisha", note: "Temple & beach", budget: "₹2,900–₹5,510", low: 2900, category: "Spiritual", emoji: "🛕", lat: 19.8135, lon: 85.8312, highlights: "Coastal scenery, temple heritage and local food." },
  { name: "Bengaluru", region: "Karnataka", note: "City & gardens", budget: "₹4,050–₹7,695", low: 4050, category: "City", emoji: "🌆", lat: 12.9716, lon: 77.5946, highlights: "Gardens, museums, food streets and city attractions." },
  { name: "Amritsar", region: "Punjab", note: "Heritage & food", budget: "₹3,150–₹5,985", low: 3150, category: "Spiritual", emoji: "🛕", lat: 31.634, lon: 74.8723, highlights: "Golden Temple, historic sites and Punjabi cuisine." },
  { name: "Guwahati", region: "Assam", note: "Gateway to the Northeast", budget: "₹3,300–₹6,270", low: 3300, category: "Culture", emoji: "🏛️", lat: 26.1445, lon: 91.7362, highlights: "River views, temples and access to Northeast India." }
];
const money = n => "₹" + Math.max(0, Number(n) || 0).toLocaleString("en-IN");
function Field({ label, value, onChangeText, keyboardType = "default", placeholder }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={String(value)} onChangeText={onChangeText} keyboardType={keyboardType} placeholder={placeholder || "0"} placeholderTextColor="#91A099" style={styles.input} /></View>;
}
function Button({ title, onPress, primary = false, danger = false }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.button, primary && styles.primaryButton, danger && styles.dangerButton, pressed && { opacity: 0.78 }]}><Text style={[styles.buttonText, primary && styles.primaryButtonText, danger && styles.dangerButtonText]}>{title}</Text></Pressable>;
}
function Heading({ eyebrow, title, subtitle }) {
  return <View style={styles.pageIntro}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text>{!!subtitle && <Text style={styles.sectionCopy}>{subtitle}</Text>}</View>;
}
export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [destination, setDestination] = useState("Araku Valley");
  const [days, setDays] = useState("2"), [people, setPeople] = useState("2");
  const [budgetLimit, setBudgetLimit] = useState("15000");
  const [travel, setTravel] = useState("1200"), [stay, setStay] = useState("1000");
  const [food, setFood] = useState("500"), [extras, setExtras] = useState("500");
  const [tripDate, setTripDate] = useState(""), [tripTitle, setTripTitle] = useState("");
  const [saved, setSaved] = useState([]), [search, setSearch] = useState("");
  const [category, setCategory] = useState("All"), [expenseName, setExpenseName] = useState(""), [expenseAmount, setExpenseAmount] = useState("");
  const [expenses, setExpenses] = useState([]), [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [language, setLanguage] = useState("English");
  const [groupName, setGroupName] = useState("Weekend getaway");
  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState("Traveller");
  const [groupMembers, setGroupMembers] = useState([]);
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [authBusy, setAuthBusy] = useState(false);
  const [syncMessage, setSyncMessage] = useState("Sign in to sync trips and expenses across devices.");
  const [hotelDestination, setHotelDestination] = useState("");
  const [hotelType, setHotelType] = useState("hotels");
  const [hotelGuests, setHotelGuests] = useState("2");
  const [hotelCheckIn, setHotelCheckIn] = useState("");
  const [hotelCheckOut, setHotelCheckOut] = useState("");
  const [surpriseBudget, setSurpriseBudget] = useState("10000");
  const [surpriseMood, setSurpriseMood] = useState("Any");
  const [surpriseResult, setSurpriseResult] = useState("");
  const [assistantBudget, setAssistantBudget] = useState("10000");
  const [assistantResult, setAssistantResult] = useState("");
  const [miniDestination, setMiniDestination] = useState("");
  const [miniDays, setMiniDays] = useState("2");
  const [miniPlan, setMiniPlan] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [routeStopNames, setRouteStopNames] = useState([]);
  const [routeGeometry, setRouteGeometry] = useState([]);
  const [routeStatus, setRouteStatus] = useState("Choose at least two stops to preview a route.");
  const [routeSummary, setRouteSummary] = useState(null);

  useEffect(() => {
    encryptedStorage.multiGet([KEY, "wanderwise.expenses.v1", "wanderwise.language.v1", "wanderwise.groupMembers.v1", "wanderwise.notifications.v1"]).then(rows => {
      const trips = rows[0]?.[1], costs = rows[1]?.[1], savedLanguage = rows[2]?.[1], members = rows[3]?.[1], reminders = rows[4]?.[1];
      if (trips) setSaved(JSON.parse(trips));
      if (costs) setExpenses(JSON.parse(costs));
      if (savedLanguage && UI_TEXT[savedLanguage]) setLanguage(savedLanguage);
      if (members) setGroupMembers(JSON.parse(members));
      if (reminders === "true") setNotificationsEnabled(true);
    }).catch(() => Alert.alert("Storage notice", "Saved data could not be loaded on this launch."));
    supabase.auth.getSession().then(({ data }) => { setSession(data.session || null); if (data.session) syncCloudData(data.session); });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      if (nextSession) setTimeout(() => syncCloudData(nextSession), 0);
      else setSyncMessage("Signed out. Your local copy remains on this device.");
    });
    return () => authListener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (routeStopNames.length < 2) {
      setRouteGeometry([]);
      setRouteSummary(null);
      setRouteStatus("Choose at least two stops to preview a route.");
      return;
    }
    let active = true;
    const byName = new Map(destinations.map(place => [place.name, place]));
    const remaining = routeStopNames.map(name => byName.get(name)).filter(Boolean);
    const ordered = remaining.length ? [remaining.shift()] : [];
    const distance = (a, b) => {
      const rad = n => n * Math.PI / 180;
      const dLat = rad(b.lat - a.lat), dLon = rad(b.lon - a.lon);
      const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    };
    while (remaining.length && ordered.length) {
      const last = ordered[ordered.length - 1];
      let nearestIndex = 0, nearestDistance = Infinity;
      remaining.forEach((place, index) => {
        const d = distance(last, place);
        if (d < nearestDistance) { nearestDistance = d; nearestIndex = index; }
      });
      ordered.push(remaining.splice(nearestIndex, 1)[0]);
    }
    const coords = ordered.map(place => `${place.lon},${place.lat}`).join(";");
    setRouteStatus("Finding a road route between your stops…");
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`)
      .then(response => { if (!response.ok) throw new Error("Route service unavailable"); return response.json(); })
      .then(data => {
        if (!active) return;
        const route = data?.routes?.[0];
        if (!route) throw new Error("No drivable route was returned for these stops.");
        setRouteGeometry(route.geometry?.coordinates || []);
        setRouteSummary({ distance: route.distance, duration: route.duration, stops: ordered });
        setRouteStatus("Route preview ready. Stop order is arranged to reduce backtracking.");
      })
      .catch(error => {
        if (!active) return;
        setRouteGeometry([]);
        setRouteSummary(null);
        setRouteStatus(error.message + ". The map will still show your selected places.");
      });
    return () => { active = false; };
  }, [routeStopNames.join("|")]);

  const total = useMemo(() => {
    const d = Math.max(1, Math.min(30, Math.floor(Number(days) || 1))), p = Math.max(1, Math.min(20, Math.floor(Number(people) || 1)));
    return (Number(travel) || 0) * p + (Number(stay) || 0) * Math.max(0, d - 1) + (Number(food) || 0) * d * p + (Number(extras) || 0);
  }, [days, people, travel, stay, food, extras]);
  const syncCloudData = async activeSession => {
    if (!activeSession?.user || cloudSyncInProgress) return;
    cloudSyncInProgress = true;
    setSyncMessage("Syncing your WanderWise account…");
    try {
      const localTrips = JSON.parse((await encryptedStorage.getItem(KEY)) || "[]");
      const localExpenses = JSON.parse((await encryptedStorage.getItem("wanderwise.expenses.v1")) || "[]");
      const isUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
      for (const trip of localTrips.filter(item => !item.cloudId && !isUuid(item.id))) {
        const start = /^\d{4}-\d{2}-\d{2}$/.test(trip.date || "") ? trip.date : new Date().toISOString().slice(0, 10);
        const endDate = new Date(start + "T00:00:00"); endDate.setDate(endDate.getDate() + Math.max(0, Number(trip.days || 1) - 1));
        const end = endDate.getFullYear() + "-" + String(endDate.getMonth()+1).padStart(2,"0") + "-" + String(endDate.getDate()).padStart(2,"0");
        const costs = { transport: (Number(trip.travel)||0)*(Number(trip.people)||1), lodging: (Number(trip.stay)||0)*Math.max(0,Number(trip.days||1)-1), food: (Number(trip.food)||0)*(Number(trip.people)||1)*(Number(trip.days)||1), activities: Number(trip.extras)||0, total: Number(trip.total)||0 };
        const { data, error } = await supabase.from("trips").insert({ user_id: activeSession.user.id, destination: trip.destination, start_date: start, end_date: end, travellers: trip.people, budget: trip.budgetLimit, interests: [], itinerary: [], costs }).select().single();
        if (error) throw error;
        trip.id = data.id; trip.cloudId = data.id;
      }
      for (const expense of localExpenses.filter(item => !isUuid(item.id))) {
        const { data, error } = await supabase.from("expenses").insert({ user_id: activeSession.user.id, description: expense.name, category: "Other", amount: Number(expense.amount)||0, payment_status: "Planned", expense_date: String(expense.date || new Date().toISOString()).slice(0,10), trip_id: null }).select().single();
        if (error) throw error;
        expense.id = data.id;
      }
      const [{ data: tripRows, error: tripError }, { data: expenseRows, error: expenseError }] = await Promise.all([
        supabase.from("trips").select("*").order("created_at", { ascending: false }),
        supabase.from("expenses").select("*").order("created_at", { ascending: false })
      ]);
      if (tripError) throw tripError;
      if (expenseError) throw expenseError;
      const cloudTrips = (tripRows || []).map(row => {
        const c = row.costs || {}, start = row.start_date || new Date().toISOString().slice(0,10), end = row.end_date || start;
        const days = Math.max(1, Math.round((new Date(end + "T00:00:00") - new Date(start + "T00:00:00")) / 86400000) + 1);
        const peopleCount = Math.max(1, Number(row.travellers) || 1);
        return { id: row.id, cloudId: row.id, title: row.destination, destination: row.destination, days, people: peopleCount, travel: Number(c.transport) || 0, stay: days > 1 ? (Number(c.lodging) || 0) / (days - 1) : 0, food: (Number(c.food) || 0) / (peopleCount * days), extras: Number(c.activities) || 0, budgetLimit: Number(row.budget) || 0, total: Number(c.total) || (Number(c.transport)||0)+(Number(c.lodging)||0)+(Number(c.food)||0)+(Number(c.activities)||0), date: start, createdAt: row.created_at };
      });
      const cloudExpenses = (expenseRows || []).map(row => ({ id: row.id, name: row.description, amount: Number(row.amount) || 0, date: row.expense_date || row.created_at }));
      const tripIds = new Set(cloudTrips.map(item => item.id)), expenseIds = new Set(cloudExpenses.map(item => item.id));
      const mergedTrips = [...cloudTrips, ...localTrips.filter(item => !item.cloudId && !tripIds.has(item.id))];
      const mergedExpenses = [...cloudExpenses, ...localExpenses.filter(item => !isUuid(item.id) && !expenseIds.has(item.id))];
      setSaved(mergedTrips); setExpenses(mergedExpenses);
      await encryptedStorage.multiSet([[KEY, JSON.stringify(mergedTrips)], ["wanderwise.expenses.v1", JSON.stringify(mergedExpenses)]]);
      setSyncMessage("Synced " + cloudTrips.length + " trip(s) and " + cloudExpenses.length + " expense(s).");
    } catch (error) {
      setSyncMessage("Cloud sync unavailable: " + (error?.message || "Check your account and Supabase table policies.") + " Your local data is still available.");
    } finally {
      cloudSyncInProgress = false;
    }
  };
  const handleAuth = async () => {
    if (!authEmail.trim() || !authPassword) return Alert.alert("Account details needed", "Enter your email and password.");
    setAuthBusy(true);
    try {
      const result = authMode === "signup"
        ? await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword })
        : await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword });
      if (result.error) throw result.error;
      if (authMode === "signup" && !result.data.session) setSyncMessage("Account created. Check your email for the confirmation link, then sign in.");
      else { setSession(result.data.session); if (result.data.session) await syncCloudData(result.data.session); }
      setAuthPassword("");
    } catch (error) { Alert.alert("Account error", error?.message || "Please try again."); }
    finally { setAuthBusy(false); }
  };
  const saveTripToCloud = async trip => {
    if (!session?.user) return trip;
    try {
      const start = /^\d{4}-\d{2}-\d{2}$/.test(trip.date || "") ? trip.date : new Date().toISOString().slice(0, 10);
      const endDate = new Date(start + "T00:00:00"); endDate.setDate(endDate.getDate() + Math.max(0, trip.days - 1));
      const end = endDate.getFullYear() + "-" + String(endDate.getMonth()+1).padStart(2,"0") + "-" + String(endDate.getDate()).padStart(2,"0");
      const costs = { transport: trip.travel * trip.people, lodging: trip.stay * Math.max(0, trip.days - 1), food: trip.food * trip.people * trip.days, activities: trip.extras, total: trip.total };
      const row = { user_id: session.user.id, destination: trip.destination, start_date: start, end_date: end, travellers: trip.people, budget: trip.budgetLimit, interests: [], itinerary: [], costs };
      if (trip.cloudId) row.id = trip.cloudId;
      const { data, error } = await supabase.from("trips").upsert(row).select().single();
      if (error) throw error;
      return { ...trip, id: data.id, cloudId: data.id };
    } catch (error) { setSyncMessage("Saved locally. Cloud trip sync failed: " + (error?.message || "Unknown error")); return trip; }
  };
  const surpriseMe = () => {
    const budget = Number(surpriseBudget), travellerCount = Math.max(1, Number(people) || 1);
    if (!Number.isFinite(budget) || budget <= 0) return Alert.alert("Check your budget", "Enter a budget greater than zero.");
    const perPerson = budget / travellerCount;
    const matches = destinations.filter(place => (surpriseMood === "Any" || place.category === surpriseMood) && place.low <= perPerson).sort((a,b)=>a.low-b.low);
    if (!matches.length) { setSurpriseResult("No close matches yet. Increase the budget or choose Any travel style."); return; }
    const pick = matches[Math.floor(Math.random() * matches.length)];
    setSurpriseResult(pick.name + " · " + pick.region + " · estimated from " + money(pick.low) + " per person.");
    setDestination(pick.name);
  };
  const buildBudgetSplit = () => {
    const amount = Number(assistantBudget);
    if (!Number.isFinite(amount) || amount <= 0) return Alert.alert("Check your budget", "Enter a budget greater than zero.");
    const p = Math.max(1, Math.min(20, Number(people) || 1)), d = Math.max(1, Math.min(30, Number(days) || 1));
    setAssistantResult("For " + p + " traveller(s) over " + d + " day(s): travel " + money(amount*.25) + " · stay " + money(amount*.25) + " · food " + money(amount*.30) + " · activities and buffer " + money(amount*.20) + ". Adjust these starter shares to match real quotes.");
  };
  const buildMiniPlan = () => {
    const place = miniDestination.trim() || destination.trim();
    if (!place) return Alert.alert("Add a destination", "Enter a destination for your mini itinerary.");
    const count = Math.max(1, Math.min(7, Math.floor(Number(miniDays) || 1)));
    setMiniPlan(Array.from({length:count},(_,i)=>({day:i+1,plan:i===0?"Arrival, breakfast and one main local attraction.":i===count-1?"Explore a nearby highlight, enjoy local food and prepare for return.":"Morning sightseeing, relaxed lunch and one nearby experience."})));
    setDestination(place);
  };
  const signOut = async () => { const { error } = await supabase.auth.signOut(); if (error) Alert.alert("Sign out failed", error.message); };
  const refreshTripReminders = async (trips, force = false) => {
    if (!notificationsEnabled && !force) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      const permission = await Notifications.getPermissionsAsync();
      if (permission.status !== "granted") return;
      await Notifications.setNotificationChannelAsync("trip-reminders", { name: "Trip reminders", importance: Notifications.AndroidImportance.DEFAULT });
      for (const trip of trips) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(trip.date || "")) continue;
        const reminder = new Date(trip.date + "T09:00:00");
        reminder.setDate(reminder.getDate() - 1);
        if (reminder <= new Date()) continue;
        await Notifications.scheduleNotificationAsync({
          content: { title: "Your WanderWise trip is coming up ✈️", body: trip.destination + " is one day away. Check your plan and travel essentials.", data: { tripId: trip.id } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminder, channelId: "trip-reminders" }
        });
      }
    } catch (error) { setSyncMessage("Trip reminder could not be scheduled: " + (error?.message || "Notification service unavailable.")); }
  };
  const toggleTripReminders = async () => {
    if (notificationsEnabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      setNotificationsEnabled(false);
      await encryptedStorage.setItem("wanderwise.notifications.v1", "false");
      return;
    }
    let permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") permission = await Notifications.requestPermissionsAsync();
    if (permission.status !== "granted") return Alert.alert("Notifications not enabled", "Allow notifications in Android settings to receive trip reminders.");
    setNotificationsEnabled(true);
    await encryptedStorage.setItem("wanderwise.notifications.v1", "true");
    await refreshTripReminders(saved, true);
  };
  const clearTrips = async () => {
    if (session?.user) { const { error } = await supabase.from("trips").delete().eq("user_id", session.user.id); if (error) return Alert.alert("Could not clear trips", error.message); }
    await persistTrips([]);
  };
  const clearExpenses = async () => {
    if (session?.user) { const { error } = await supabase.from("expenses").delete().eq("user_id", session.user.id); if (error) return Alert.alert("Could not clear expenses", error.message); }
    await persistExpenses([]);
  };
  const persistTrips = async next => { setSaved(next); try { await encryptedStorage.setItem(KEY, JSON.stringify(next)); } catch { Alert.alert("Storage unavailable", "Trips could not be saved on this device."); } };
  const persistExpenses = async next => { setExpenses(next); try { await encryptedStorage.setItem("wanderwise.expenses.v1", JSON.stringify(next)); } catch { Alert.alert("Storage unavailable", "Expenses could not be saved on this device."); } };
  const persistGroupMembers = async next => { setGroupMembers(next); try { await encryptedStorage.setItem("wanderwise.groupMembers.v1", JSON.stringify(next)); } catch { Alert.alert("Storage unavailable", "Group list could not be saved on this device."); } };
  const addGroupMember = () => { const name=memberName.trim(); if(!name) return Alert.alert("Add a member","Enter a name first."); if(groupMembers.some(m=>m.name.toLowerCase()===name.toLowerCase())) return Alert.alert("Already added","This member is already in the group."); persistGroupMembers([...groupMembers,{id:String(Date.now()),name,role:memberRole}]); setMemberName(""); };
  const exportLocalData = async () => { try { await Share.share({title:"WanderWise data export",message:JSON.stringify({app:"WanderWise",exportedAt:new Date().toISOString(),savedTrips:saved,expenses,groupName,groupMembers},null,2)}); } catch { Alert.alert("Export unavailable","Could not open the Android share sheet."); } };
  const openMap = place => {
    const query = place?.lat && place?.lon ? place.lat + "," + place.lon : encodeURIComponent(place?.name || destination);
    Linking.openURL("https://www.google.com/maps/search/?api=1&query=" + query).catch(()=>Alert.alert("Could not open Maps","Please try again."));
  };
  const searchHotels = provider => {
    const place = (hotelDestination || destination).trim();
    if (!place) return Alert.alert("Add a destination", "Enter a city or place to search for stays.");
    const details = hotelType + " near " + place + (hotelCheckIn ? " check-in " + hotelCheckIn : "") + (hotelCheckOut ? " check-out " + hotelCheckOut : "") + " for " + Math.max(1, Number(hotelGuests) || 1) + " guests";
    const url = provider === "maps"
      ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(details)
      : provider === "booking"
        ? "https://www.booking.com/searchresults.html?ss=" + encodeURIComponent(place + " " + hotelType) + (hotelCheckIn ? "&checkin=" + encodeURIComponent(hotelCheckIn) : "") + (hotelCheckOut ? "&checkout=" + encodeURIComponent(hotelCheckOut) : "") + "&group_adults=" + encodeURIComponent(String(Math.max(1, Number(hotelGuests) || 1)))
        : "https://www.google.com/travel/hotels?q=" + encodeURIComponent(details);
    Linking.openURL(url).catch(()=>Alert.alert("Could not open search", "Please try again."));
  };
  const saveTrip = () => {
    if (!destination.trim()) return Alert.alert("Add a destination", "Enter where you want to travel first.");
    const safeDays = Math.max(1, Math.min(30, Math.floor(Number(days) || 1)));
    const safePeople = Math.max(1, Math.min(20, Math.floor(Number(people) || 1)));
    const costs = [travel, stay, food, extras, budgetLimit].map(Number);
    if (costs.some(value => !Number.isFinite(value) || value < 0)) return Alert.alert("Check your budget", "Enter valid amounts. Costs and budget cannot be negative.");
    const trip = { id: editingId || String(Date.now()), cloudId: editingId && /^[0-9a-f-]{36}$/i.test(editingId) ? editingId : saved.find(x => x.id === editingId)?.cloudId, title: tripTitle.trim() || destination.trim(), destination: destination.trim(), days: safeDays, people: safePeople, travel: Number(travel)||0, stay: Number(stay)||0, food: Number(food)||0, extras: Number(extras)||0, budgetLimit: Number(budgetLimit)||0, total, date: tripDate, createdAt: new Date().toISOString() };
    const nextTrips = editingId ? saved.map(x => x.id === editingId ? trip : x) : [trip, ...saved];
    persistTrips(nextTrips);
    refreshTripReminders(nextTrips);
    if (session?.user) saveTripToCloud(trip).then(cloudTrip => persistTrips(nextTrips.map(x => x.id === trip.id ? cloudTrip : x)));
    setEditingId(null); setTab("Saved"); Alert.alert(editingId ? "Trip updated" : "Trip saved ✨", session?.user ? "Saved on this device. Cloud sync is running." : "Your trip is stored on this device.");
  };
  const openDestination = name => {
    const item = destinations.find(d => d.name === name);
    setDestination(name);
    if (item) { setTravel(String(Math.max(500, Math.round(item.low * 0.25)))); setStay(String(Math.max(500, Math.round(item.low * 0.22)))); }
    setTab("Plan");
  };
  const editTrip = trip => {
    setEditingId(trip.id); setTripTitle(trip.title || ""); setDestination(trip.destination);
    setDays(String(trip.days)); setPeople(String(trip.people)); setBudgetLimit(String(trip.budgetLimit ?? 15000)); setTravel(String(trip.travel ?? 0));
    setStay(String(trip.stay ?? 0)); setFood(String(trip.food ?? 0)); setExtras(String(trip.extras ?? 0));
    setTripDate(trip.date || ""); setTab("Plan");
  };
  const filtered = destinations.filter(d => (d.name+" "+d.region+" "+d.note+" "+d.category).toLowerCase().includes(search.toLowerCase()) && (category === "All" || d.category === category));
  const addExpense = () => {
    const amount = Number(expenseAmount);
    if (!expenseName.trim() || !Number.isFinite(amount) || amount <= 0) return Alert.alert("Check expense", "Enter a name and an amount greater than zero.");
    const item = { id: String(Date.now()), name: expenseName.trim(), amount, date: new Date().toISOString() };
    persistExpenses([item, ...expenses]);
    if (session?.user) supabase.from("expenses").insert({ user_id: session.user.id, description: item.name, category: "Other", amount: item.amount, payment_status: "Planned", expense_date: item.date.slice(0, 10), trip_id: null }).select().single().then(({ data, error }) => {
      if (error) setSyncMessage("Expense saved locally. Cloud sync failed: " + error.message);
      else { const synced = { ...item, id: data.id }; persistExpenses(expenses.map(x => x.id === item.id ? synced : x)); }
    });
    setExpenseName(""); setExpenseAmount("");
  };
  const removeExpense = id => Alert.alert("Delete expense?", "This removes the expense from this device and, if synced, your account.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { const expense = expenses.find(x => x.id === id); if (session?.user && expense && /^[0-9a-f-]{36}$/i.test(String(expense.id))) { const { error } = await supabase.from("expenses").delete().eq("id", expense.id); if (error) return Alert.alert("Delete failed", error.message); } persistExpenses(expenses.filter(x => x.id !== id)); } }]);
  const removeTrip = id => Alert.alert("Delete saved trip?", "This removes the trip from this device and, if synced, your account.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: async () => { const trip = saved.find(x => x.id === id); if (session?.user && trip?.cloudId) { const { error } = await supabase.from("trips").delete().eq("id", trip.cloudId); if (error) return Alert.alert("Delete failed", error.message); } persistTrips(saved.filter(x => x.id !== id)); } }]);
  const t = key => (UI_TEXT[language] || UI_TEXT.English)[key] || key;
  const nav = [["Dashboard",t("home")],["Explore",t("explore")],["Discover",t("discover")],["For You",t("forYou")],["Plan",t("plan")],["Stays",t("stays")],["Expenses",t("expenses")],["Groups","♧ Groups"],["Routes","⌖ Routes"],["Analytics",t("analytics")],["Saved",t("saved")]];
  const tripSpend = saved.reduce((sum,t)=>sum+(Number(t.total)||0),0);
  const expenseSpend = expenses.reduce((sum,e)=>sum+(Number(e.amount)||0),0);
  const selected = destinations.find(d=>d.name===destination);
  const nights = Math.max(0, (Number(days)||1)-1);
  const budgetValue = Math.max(0, Number(budgetLimit)||0);
  const remainingBudget = budgetValue-total;
  const itineraryDays = Array.from({length:Math.max(1,Math.min(7,Number(days)||1))},(_,i)=>i+1);
  const recommended = destinations.map(place=>({place,estimate:Math.round(place.low*Math.max(1,Number(people)||1)/2)})).sort((a,b)=>a.estimate-b.estimate).filter(x=>budgetValue===0||x.estimate<=budgetValue);

  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="light-content" backgroundColor={GREEN}/>
    <View style={styles.header}>
      <View style={styles.brandIcon}><Text style={{fontSize:23}}>✈</Text></View>
      <View style={{flex:1}}><Text style={styles.brand}>Wander<Text style={styles.brandAccent}>Wise</Text></Text><Text style={styles.tagline}>{t("tagline")}</Text></View>
      <Pressable accessibilityLabel="Open settings" onPress={()=>setShowSettings(true)} style={styles.settingsButton}><Text style={{fontSize:21}}>⚙</Text></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll} contentContainerStyle={styles.tabs}>
      {nav.map(([key,label])=><Pressable key={key} onPress={()=>setTab(key)} style={[styles.tab,tab===key&&styles.activeTab]}><Text style={[styles.tabText,tab===key&&styles.activeTabText]}>{label}{key==="Saved" ? " ("+saved.length+")" : ""}</Text></Pressable>)}
    </ScrollView>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab==="Dashboard" && <>
        <View style={styles.hero}><Text style={styles.eyebrow}>YOUR TRAVEL CONSOLE</Text><Text style={styles.heroTitle}>Small budget.{ "\n" }Big memories.</Text><Text style={styles.heroCopy}>Make a plan, keep an eye on costs, and find your next getaway without losing sight of your budget.</Text><Button title="＋ Start planning" primary onPress={()=>setTab("Plan")}/></View>
        <Heading eyebrow="SMART TRAVEL TOOLS" title="A little help before you go" subtitle="Free planning helpers inspired by the WanderWise website."/>
        <View style={styles.card}>
          <Text style={styles.formHeading}>🎲 Surprise me with a destination</Text>
          <Field label="Total group budget (₹)" value={surpriseBudget} onChangeText={setSurpriseBudget} keyboardType="number-pad"/>
          <Text style={styles.label}>TRAVEL STYLE</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",gap:7,marginBottom:8}}>{["Any","Nature","Beach","Culture","Adventure","Spiritual","City"].map(m=><Pressable key={m} onPress={()=>setSurpriseMood(m)} style={[styles.chip,surpriseMood===m&&styles.chipActive]}><Text style={[styles.chipText,surpriseMood===m&&styles.chipTextActive]}>{m}</Text></Pressable>)}</View>
          <Button title="Find my surprise ✨" primary onPress={surpriseMe}/>
          {!!surpriseResult&&<Text style={styles.sectionCopy}>{surpriseResult}</Text>}
          <View style={{height:1,backgroundColor:LINE,marginVertical:14}}/>
          <Text style={styles.formHeading}>💸 Quick budget split</Text>
          <Field label="Total budget (₹)" value={assistantBudget} onChangeText={setAssistantBudget} keyboardType="number-pad"/>
          <Button title="Build my budget split" onPress={buildBudgetSplit}/>
          {!!assistantResult&&<Text style={styles.sectionCopy}>{assistantResult}</Text>}
          <View style={{height:1,backgroundColor:LINE,marginVertical:14}}/>
          <Text style={styles.formHeading}>🗓️ Mini itinerary builder</Text>
          <Field label="Destination" value={miniDestination} onChangeText={setMiniDestination} placeholder="e.g. Araku Valley"/>
          <Field label="Number of days (1–7)" value={miniDays} onChangeText={setMiniDays} keyboardType="number-pad"/>
          <Button title="Draft a day-wise plan" onPress={buildMiniPlan}/>
          {miniPlan.map(item=><Text key={item.day} style={styles.sectionCopy}>Day {item.day}: {item.plan}</Text>)}
        </View>
        <View style={styles.metrics}><Metric label="Saved trips" value={String(saved.length)} icon="🧳"/><Metric label="Planned travellers" value={String(saved.reduce((s,t)=>s+(Number(t.people)||0),0))} icon="👥"/><Metric label="Trip estimates" value={money(tripSpend)} icon="🗺️"/><Metric label="Logged expenses" value={money(expenseSpend)} icon="🧾"/></View>
        <Heading eyebrow="YOUR NEXT ADVENTURE" title="Pick up where you left off" subtitle="Quick access to the main tools."/>
        <View style={styles.quickGrid}>{[["Explore","🌍","Browse destinations"],["Discover","✨","Filter trip ideas"],["Stays","🏨","Compare stay options"],["Expenses","🧾","Track spending"]].map(([k,icon,desc])=><Pressable key={k} style={styles.quickCard} onPress={()=>setTab(k)}><Text style={{fontSize:26}}>{icon}</Text><Text style={styles.destinationName}>{k}</Text><Text style={styles.destinationNote}>{desc}</Text></Pressable>)}</View>
        <View style={styles.tipCard}><Text style={styles.tipTitle}>💡 Budget reminder</Text><Text style={styles.sectionCopy}>These are planning estimates, not live prices. Keep an emergency buffer and verify transport and accommodation costs before booking.</Text></View>
      </>}
      {tab==="Explore" && <>
        <View style={styles.hero}><Text style={styles.eyebrow}>TRAVEL MORE, SPEND WISELY</Text><Text style={styles.heroTitle}>Your next story{ "\n" }starts here.</Text><Text style={styles.heroCopy}>Plan memorable trips that respect your budget. Big adventures don't need big spending.</Text><Button title="Plan my trip  →" primary onPress={()=>setTab("Plan")}/><View style={styles.heroBadge}><Text style={styles.heroBadgeText}>✦ Made for budget-conscious travellers</Text></View></View>
        <Heading eyebrow="FIND YOUR KIND OF GETAWAY" title="Explore destinations" subtitle="Search places and open any destination to start a plan."/>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search destinations..." placeholderTextColor="#91A099" style={styles.search}/>
        {filtered.map(item=><DestinationCard key={item.name} item={item} onPress={()=>openDestination(item.name)}/>)}
        {!filtered.length && <Empty title="No destinations found" text="Try another search term or clear the filter." action="Clear search" onPress={()=>{setSearch("");setCategory("All");}}/>}
      </>}
      {tab==="Discover" && <>
        <Heading eyebrow="FIND YOUR NEXT ESCAPE" title="Discover places" subtitle="Filter destination ideas by travel style, then open one to estimate your trip."/>
        <TextInput value={search} onChangeText={setSearch} placeholder="Search name, state, or activity..." placeholderTextColor="#91A099" style={styles.search}/>
        <Text style={styles.label}>TRAVEL STYLE</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, paddingVertical:10}}>{["All","Nature","Beach","City","Culture","Spiritual"].map(c=><Pressable key={c} onPress={()=>setCategory(c)} style={[styles.chip,category===c&&styles.chipActive]}><Text style={[styles.chipText,category===c&&styles.chipTextActive]}>{c}</Text></Pressable>)}</ScrollView>
        <Text style={styles.sectionCopy}>{filtered.length} destination{filtered.length===1?"":"s"} match your selection.</Text>
        {filtered.map(item=><DestinationCard key={item.name} item={item} onPress={()=>openDestination(item.name)} detailed/>)}
      </>}
      {tab==="For You" && <>
        <Heading eyebrow="SMART BUDGET MATCHES" title="Trips that fit your budget" subtitle="Suggestions use the destinations already in WanderWise and indicative planning estimates, not live fares or availability."/>
        <View style={styles.card}><Field label="Your total budget (₹)" value={budgetLimit} onChangeText={setBudgetLimit} keyboardType="number-pad"/><View style={styles.twoFields}><View style={{flex:1}}><Field label="Travellers" value={people} onChangeText={setPeople} keyboardType="number-pad"/></View><View style={{flex:1}}><Field label="Days" value={days} onChangeText={setDays} keyboardType="number-pad"/></View></View><Text style={styles.sectionCopy}>Showing {recommended.length} destinations estimated within your current budget.</Text></View>
        {recommended.slice(0,8).map(({place,estimate})=><DestinationCard key={place.name} item={{...place,budget:money(estimate)+" estimated for your group"}} onPress={()=>openDestination(place.name)} detailed/>)}
        {!recommended.length&&<Empty title="No close matches yet" text="Increase your budget or reduce the trip duration and traveller count."/>}
      </>}
      {tab==="Plan" && <>
        <Heading eyebrow="YOUR TRIP, YOUR BUDGET" title={editingId?"Edit your trip":"Build your travel plan"} subtitle="Change the estimates to match your actual plans. Totals update as you type."/>
        <View style={styles.card}>
          <Field label="Trip name (optional)" value={tripTitle} onChangeText={setTripTitle} placeholder="e.g. Weekend with friends"/>
          <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Where do you want to go?"/>
          <View style={styles.twoFields}><View style={{flex:1}}><Field label="Duration (days)" value={days} onChangeText={setDays} keyboardType="number-pad"/></View><View style={{flex:1}}><Field label="Travellers" value={people} onChangeText={setPeople} keyboardType="number-pad"/></View></View>
          <Field label="Travel date (optional)" value={tripDate} onChangeText={setTripDate} placeholder="YYYY-MM-DD"/>
          <Field label="Total trip budget (₹)" value={budgetLimit} onChangeText={setBudgetLimit} keyboardType="number-pad" placeholder="15000"/>
          <Text style={styles.formHeading}>Estimated costs (₹)</Text>
          <Field label="Return travel per person" value={travel} onChangeText={setTravel} keyboardType="number-pad"/>
          <Field label="Stay per night (total room cost)" value={stay} onChangeText={setStay} keyboardType="number-pad"/>
          <Field label="Food per person / day" value={food} onChangeText={setFood} keyboardType="number-pad"/>
          <Field label="Activities & other costs (total)" value={extras} onChangeText={setExtras} keyboardType="number-pad"/>
          <View style={styles.totalBox}><Text style={styles.totalLabel}>Estimated trip total</Text><Text style={styles.totalAmount}>{money(total)}</Text><Text style={styles.totalHint}>{money(total/Math.max(1,Number(people)||1))} per person · {Math.max(1,Number(days)||1)} day(s)</Text><View style={styles.costLine}><Text style={styles.totalHint}>Travel</Text><Text style={styles.totalHint}>{money((Number(travel)||0)*Math.max(1,Number(people)||1))}</Text></View><View style={styles.costLine}><Text style={styles.totalHint}>Accommodation · {nights} night(s)</Text><Text style={styles.totalHint}>{money((Number(stay)||0)*nights)}</Text></View><View style={styles.costLine}><Text style={styles.totalHint}>Food</Text><Text style={styles.totalHint}>{money((Number(food)||0)*Math.max(1,Number(days)||1)*Math.max(1,Number(people)||1))}</Text></View><View style={styles.costLine}><Text style={styles.totalHint}>Activities & other</Text><Text style={styles.totalHint}>{money(extras)}</Text></View><View style={styles.costLine}><Text style={styles.totalLabel}>{remainingBudget>=0?"Budget remaining":"Over budget by"}</Text><Text style={styles.totalLabel}>{money(Math.abs(remainingBudget))}</Text></View></View>
          <View style={styles.tipCard}><Text style={styles.tipTitle}>{remainingBudget>=0?"✓ Within your budget":"⚠ Budget exceeded"}</Text><Text style={styles.sectionCopy}>Your budget: {money(budgetValue)} · Estimated spend: {money(total)}. These are planning estimates, not live prices.</Text></View>
          <Heading eyebrow="DRAFT ITINERARY" title="A simple day-by-day outline" subtitle="Use this as a starting point and verify local timings before travelling."/>
          {itineraryDays.map(day=><View key={day} style={styles.savedCard}><View style={{flex:1}}><Text style={styles.destinationName}>Day {day} · {destination}</Text><Text style={styles.destinationNote}>Morning: breakfast and one main local attraction.</Text><Text style={styles.destinationNote}>Afternoon: lunch and explore a nearby place of interest.</Text><Text style={styles.destinationNote}>Evening: relaxed walk, local food and return to stay.</Text></View></View>)}
          <Button title={editingId?"✓ Update trip":"♡ Save this trip"} onPress={saveTrip} primary/>
          {editingId&&<Button title="Cancel editing" onPress={()=>{setEditingId(null);setTab("Saved");}}/>}
        </View>
        {selected&&<View style={styles.tipCard}><Text style={styles.tipTitle}>{selected.emoji} About {selected.name}</Text><Text style={styles.sectionCopy}>{selected.highlights}. Indicative destination budget: {selected.budget} per person. Estimates can vary by season.</Text><Button title="Open destination in Maps ↗" onPress={()=>openMap(selected)}/></View>}
      </>}
      {tab==="Stays" && <>
        <Heading eyebrow="REST EASY, SPEND WISELY" title="Stay planning" subtitle="Compare accommodation styles and add a realistic room budget to your trip. These are planning guides, not live listings or availability."/>
        <View style={styles.card}>
          <Text style={styles.formHeading}>Find real hotel listings</Text>
          <Text style={styles.sectionCopy}>Search current listings, reviews and available rates through external services. WanderWise does not book rooms or guarantee availability.</Text>
          <Field label="Destination or tour spot" value={hotelDestination} onChangeText={setHotelDestination} placeholder={destination || "e.g. Araku Valley"}/>
          <Field label="Stay type" value={hotelType} onChangeText={setHotelType} placeholder="hotels, resorts, homestays"/>
          <View style={styles.twoFields}><View style={{flex:1}}><Field label="Guests" value={hotelGuests} onChangeText={setHotelGuests} keyboardType="number-pad"/></View><View style={{flex:1}}><Field label="Check-in (optional)" value={hotelCheckIn} onChangeText={setHotelCheckIn} placeholder="YYYY-MM-DD"/></View></View>
          <Field label="Check-out (optional)" value={hotelCheckOut} onChangeText={setHotelCheckOut} placeholder="YYYY-MM-DD"/>
          <Button title="Hotel listings & reviews ↗" onPress={()=>searchHotels("maps")} primary/>
          <Button title="Compare prices on Google Travel ↗" onPress={()=>searchHotels("google")}/>
          <Button title="More booking options ↗" onPress={()=>searchHotels("booking")}/>
        </View>
        {[
          ["🛏️","Hostel / dorm","Best for solo travellers and groups sharing space","₹400–₹900 / person / night",400],
          ["🏡","Budget guesthouse","Simple private rooms, often suited to couples or families","₹800–₹1,800 / room / night",800],
          ["🏨","Budget hotel","Private room and basic amenities","₹1,200–₹2,800 / room / night",1200],
          ["🏕️","Homestay","Local experience; confirm meals, access and house rules","₹1,000–₹2,500 / room / night",1000]
        ].map(([icon,name,desc,price,cost])=><View key={name} style={styles.stayCard}><Text style={{fontSize:30}}>{icon}</Text><View style={{flex:1}}><Text style={styles.destinationName}>{name}</Text><Text style={styles.destinationNote}>{desc}</Text><Text style={styles.destinationBudget}>{price}</Text><Button title="Use this estimate" onPress={()=>{setStay(String(cost));setTab("Plan");}}/></View></View>)}
        <Text style={styles.disclaimer}>Prices are illustrative ranges only. Check current rates, location, cancellation terms, and reviews before booking.</Text>
      </>}
      {tab==="Expenses" && <>
        <Heading eyebrow="KEEP SPENDING VISIBLE" title="Expense tracker" subtitle="Log costs during planning or travel. Entries are stored on this device."/>
        <View style={styles.metrics}><Metric label="Logged entries" value={String(expenses.length)} icon="🧾"/><Metric label="Total logged" value={money(expenseSpend)} icon="₹"/></View>
        <View style={styles.card}><Field label="Expense name" value={expenseName} onChangeText={setExpenseName} placeholder="e.g. Bus tickets"/><Field label="Amount (₹)" value={expenseAmount} onChangeText={setExpenseAmount} keyboardType="decimal-pad" placeholder="0"/><Button title="＋ Add expense" primary onPress={addExpense}/></View>
        <Heading eyebrow="RECENT ACTIVITY" title="Your expenses"/>
        {!expenses.length?<Empty title="No expenses yet" text="Add your first cost above to start tracking spending."/>:expenses.map(e=><View key={e.id} style={styles.savedCard}><View style={{flex:1}}><Text style={styles.destinationName}>{e.name}</Text><Text style={styles.destinationNote}>{new Date(e.date).toLocaleDateString()}</Text></View><Text style={styles.destinationBudget}>{money(e.amount)}</Text><Pressable onPress={()=>removeExpense(e.id)} style={styles.removeButton}><Text style={{color:"#B42318",fontWeight:"800"}}>Delete</Text></Pressable></View>)}
      </>}
      {tab==="Groups" && <>
        <Heading eyebrow="PLAN TOGETHER" title="Group trip planner" subtitle="Keep a simple traveller list and assign planning roles. This first version is stored on this device; shared invitations and live collaboration are still being built."/>
        <View style={styles.card}><Field label="Group / trip name" value={groupName} onChangeText={setGroupName} placeholder="Weekend getaway"/><Field label="Member name" value={memberName} onChangeText={setMemberName} placeholder="Enter a traveller name"/><Text style={styles.label}>PLANNING ROLE</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:7,marginBottom:10}}>{["Organizer","Planner","Traveller","Viewer"].map(role=><Pressable key={role} onPress={()=>setMemberRole(role)} style={[styles.chip,memberRole===role&&styles.chipActive]}><Text style={[styles.chipText,memberRole===role&&styles.chipTextActive]}>{role}</Text></Pressable>)}</View><Button title="＋ Add group member" primary onPress={addGroupMember}/></View>
        <Heading eyebrow="TRAVEL CREW" title={groupName}/>
        {!groupMembers.length?<Empty title="Your travel crew starts here" text="Add the people travelling with you and choose their planning roles."/>:groupMembers.map(member=><View key={member.id} style={styles.savedCard}><View style={{flex:1}}><Text style={styles.destinationName}>{member.name}</Text><Text style={styles.destinationNote}>{member.role}</Text></View><Pressable onPress={()=>persistGroupMembers(groupMembers.filter(m=>m.id!==member.id))} style={styles.removeButton}><Text style={{color:"#B42318",fontWeight:"800"}}>Remove</Text></Pressable></View>)}
        <View style={styles.tipCard}><Text style={styles.tipTitle}>🔒 Privacy note</Text><Text style={styles.sectionCopy}>No contacts or location are accessed. Names and roles stay in local app storage until you export or clear the app data.</Text></View>
      </>}
      {tab==="Routes" && <>
        <Heading eyebrow="FREE MAPS & ROUTE PREVIEW" title="Plan a multi-stop route" subtitle="Choose places from the WanderWise destination list. We arrange stops to reduce backtracking and draw a road-route preview."/>
        <View style={styles.card}>
          <Text style={styles.formHeading}>1. Choose your stops ({routeStopNames.length}/6)</Text>
          <Text style={styles.sectionCopy}>Select up to six destinations. The first selected place is your starting point.</Text>
          <View style={{flexDirection:"row",flexWrap:"wrap",gap:7}}>
            {destinations.map(place => {
              const active = routeStopNames.includes(place.name);
              const disabled = !active && routeStopNames.length >= 6;
              return <Pressable key={place.name} disabled={disabled} onPress={() => setRouteStopNames(current => active ? current.filter(name => name !== place.name) : [...current, place.name])} style={[styles.chip,active&&styles.chipActive,disabled&&{opacity:0.35}]}>
                <Text style={[styles.chipText,active&&styles.chipTextActive]}>{active ? "✓ " : ""}{place.name}</Text>
              </Pressable>;
            })}
          </View>
          <View style={{flexDirection:"row",flexWrap:"wrap",gap:8,marginTop:12}}>
            <Button title="Clear stops" onPress={() => setRouteStopNames([])}/>
            <Button title="Use current trip destination" onPress={() => setRouteStopNames([destination])}/>
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.formHeading}>2. Route map</Text>
          <Text style={styles.sectionCopy}>{routeStatus}</Text>
          {!!routeSummary&&<View style={styles.metrics}><Metric label="Road distance" value={(routeSummary.distance/1000).toFixed(1)+" km"} icon="🛣️"/><Metric label="Estimated drive" value={Math.max(1,Math.round(routeSummary.duration/60))+" min"} icon="⏱️"/></View>}
          {!!routeSummary&&routeSummary.stops.map((place,index)=><View key={place.name} style={styles.costLine}><Text style={styles.destinationName}>{index+1}. {place.name}</Text><Text style={styles.destinationRegion}>{place.region}</Text></View>)}
          <WebView
            originWhitelist={["*"]}
            javaScriptEnabled
            domStorageEnabled
            style={{height:340,borderRadius:14,overflow:"hidden",backgroundColor:"#E8F0EA"}}
            source={{html: buildRouteMapHtml(routeStopNames.map(name => destinations.find(place => place.name === name)).filter(Boolean), routeGeometry)}}
          />
          <Text style={styles.disclaimer}>Map © OpenStreetMap contributors. Road-route estimates use the community OSRM demo service and may be unavailable or inaccurate. Check road conditions and signs before travel.</Text>
          <Button title="Open this route in Google Maps ↗" primary onPress={() => openMultiStopRoute(routeSummary?.stops || routeStopNames.map(name => destinations.find(place => place.name === name)).filter(Boolean))}/>
        </View>
      </>}
      {tab==="Analytics" && <>
        <Heading eyebrow="YOUR TRAVEL NUMBERS" title="Trip insights" subtitle="A local summary of saved trip estimates and expense entries on this device."/>
        <View style={styles.metrics}><Metric label="Saved trips" value={String(saved.length)} icon="🧳"/><Metric label="Estimated trip spend" value={money(tripSpend)} icon="🗺️"/><Metric label="Logged expenses" value={money(expenseSpend)} icon="🧾"/><Metric label="Average trip estimate" value={money(saved.length?tripSpend/saved.length:0)} icon="📊"/></View>
        <View style={styles.card}><Text style={styles.destinationName}>Saved trip overview</Text>{!saved.length?<Text style={styles.sectionCopy}>Save a trip to start building your travel insights.</Text>:saved.map(t=><View key={t.id} style={styles.costLine}><Text style={styles.sectionCopy}>{t.destination} · {t.days} day(s)</Text><Text style={styles.destinationBudget}>{money(t.total)}</Text></View>)}</View>
        <View style={styles.tipCard}><Text style={styles.tipTitle}>Local data only</Text><Text style={styles.sectionCopy}>These insights are calculated on this phone. They are not uploaded or shared.</Text></View>
      </>}
      {tab==="Saved" && <>
        <Heading eyebrow="YOUR TRAVEL NOTEBOOK" title="Saved trips" subtitle="Trips are stored locally on this device. Edit a trip to update its estimates."/>
        {!saved.length?<Empty title="Your next trip belongs here" text="Create a plan and save it to see it here." action="Create a trip" onPress={()=>setTab("Plan")}/>:saved.map(trip=><View key={trip.id} style={styles.savedCard}><View style={{flex:1}}><Text style={styles.destinationName}>{trip.title||trip.destination}</Text><Text style={styles.destinationRegion}>{trip.destination}</Text><Text style={styles.destinationNote}>{trip.days} day(s) · {trip.people} traveller(s){trip.date?" · "+trip.date:""}</Text><Text style={styles.destinationBudget}>{money(trip.total)} estimated total · {money((Number(trip.total)||0)/Math.max(1,Number(trip.people)||1))}/person</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:6,marginTop:8}}><Button title="✎ Edit" onPress={()=>editTrip(trip)}/><Button title="Delete" danger onPress={()=>removeTrip(trip.id)}/></View></View></View>)}
        {saved.length>0&&<Button title="＋ Plan another trip" primary onPress={()=>{setEditingId(null);setTab("Plan");}}/>}
      </>}
      <View style={styles.footer}><Text style={styles.footerBrand}>WanderWise</Text><Text style={styles.footerText}>Thoughtful travel for real-world budgets.</Text><Text style={styles.footerText}>A PDAP project · Built for memorable journeys</Text></View>
    </ScrollView>
    {showSettings&&<View style={styles.modalBackdrop}><ScrollView style={styles.modal} keyboardShouldPersistTaps="handled"><Text style={styles.sectionTitle}>{t("settings")}</Text><Text style={styles.label}>{t("language")}</Text><View style={{flexDirection:"row",flexWrap:"wrap",gap:7,marginBottom:12}}>{["English","Telugu","Hindi","Tamil"].map(item=><Pressable key={item} onPress={()=>{setLanguage(item);encryptedStorage.setItem("wanderwise.language.v1",item).catch(()=>Alert.alert("Language","Could not save this preference."));}} style={[styles.chip,language===item&&styles.chipActive]}><Text style={[styles.chipText,language===item&&styles.chipTextActive]}>{item}</Text></Pressable>)}</View><Text style={styles.sectionCopy}>Trip reminders</Text>
        <Text style={styles.sectionCopy}>Receive a local Android notification one day before a saved trip with a travel checklist nudge. This does not require a paid service.</Text>
        <Button title={notificationsEnabled ? "Turn off trip reminders" : "Enable trip reminders"} primary onPress={toggleTripReminders}/>
        <Text style={styles.sectionCopy}>{notificationsEnabled ? "Trip reminders are enabled. Android notification permission is active." : "Trip reminders are off until you enable them."}</Text>
        <Text style={styles.sectionCopy}>Account sync</Text>
        <Text style={styles.sectionCopy}>{session?.user ? "Signed in as " + (session.user.email || "WanderWise traveller") : "Sign in or create an account to sync trips and expenses across devices."}</Text>
        {!session?.user && <><Field label="Email" value={authEmail} onChangeText={setAuthEmail} placeholder="you@example.com"/><Field label="Password" value={authPassword} onChangeText={setAuthPassword} placeholder="At least 6 characters"/><View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}><Button title={authBusy ? "Please wait…" : authMode==="signup" ? "Create account" : "Sign in"} primary onPress={handleAuth}/><Button title={authMode==="signup" ? "I have an account" : "Create account"} onPress={()=>setAuthMode(authMode==="signup"?"signin":"signup")}/></View></>}
        {!!session?.user && <><Button title="Sync now ↻" onPress={()=>syncCloudData(session)}/><Button title="Sign out" danger onPress={signOut}/></>}
        <Text style={styles.sectionCopy}>{syncMessage}</Text>
        <Text style={styles.sectionCopy}>Your local copy and account session are encrypted on this device with a device-held key. Account sync uses encrypted HTTPS communication and the same Supabase project as the WanderWise website.</Text>
        <Text style={styles.sectionCopy}>Estimates are indicative and are not live prices.</Text><Button title="Export my data ↗" onPress={exportLocalData}/><Text style={styles.sectionCopy}>Export includes saved trips, expenses, and the local group roster.</Text><Text style={styles.sectionCopy}>Location access is not requested or collected by this version.</Text><Button title="Clear all saved trips" danger onPress={()=>Alert.alert("Clear saved trips?","This permanently removes saved trips on this device.",[{text:"Cancel",style:"cancel"},{text:"Clear",style:"destructive",onPress:clearTrips}])}/><Button title="Clear expense log" danger onPress={()=>Alert.alert("Clear expenses?","This removes all expense entries on this device.",[{text:"Cancel",style:"cancel"},{text:"Clear",style:"destructive",onPress:clearExpenses}])}/><Button title="Close" primary onPress={()=>setShowSettings(false)}/></ScrollView></View>}
  </SafeAreaView>;
}
function buildRouteMapHtml(stops, geometry) {
  const safeStops = JSON.stringify(stops.map(place => ({ name: place.name, lat: place.lat, lon: place.lon }))).replace(/</g, "\\u003c");
  const safeGeometry = JSON.stringify(geometry || []).replace(/</g, "\\u003c");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"><style>html,body,#map{height:100%;margin:0;background:#e8f0ea;font-family:Arial} .leaflet-control-attribution{font-size:9px}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
const stops=${safeStops};const coords=${safeGeometry};const map=L.map('map').setView([20.5,78.9],5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(map);
const bounds=[];stops.forEach((p,i)=>{const ll=[p.lat,p.lon];bounds.push(ll);L.marker(ll).addTo(map).bindPopup((i+1)+'. '+p.name);});
if(coords.length>1){const line=L.polyline(coords.map(c=>[c[1],c[0]]),{color:'#176B55',weight:5,opacity:.85}).addTo(map);line.getLatLngs().forEach(p=>bounds.push([p.lat,p.lng]));}
if(bounds.length>1)map.fitBounds(bounds,{padding:[24,24]});else if(bounds.length===1)map.setView(bounds[0],10);
</script></body></html>`;
}
function openMultiStopRoute(stops) {
  if (!stops || !stops.length) return Alert.alert("Choose stops", "Select at least one destination first.");
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = encodeURIComponent(stops.slice(1, -1).map(place => `${place.lat},${place.lon}`).join("|"));
  const url = stops.length === 1
    ? `https://www.google.com/maps/search/?api=1&query=${origin.lat},${origin.lon}`
    : `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lon}&destination=${destination.lat},${destination.lon}&waypoints=${waypoints}&travelmode=driving`;
  Linking.openURL(url).catch(() => Alert.alert("Maps unavailable", "Could not open the map app on this device."));
}
function Metric({label,value,icon}) { return <View style={styles.metric}><Text style={{fontSize:22}}>{icon}</Text><Text style={styles.metricLabel}>{label}</Text><Text style={styles.metricValue}>{value}</Text></View>; }
function DestinationCard({item,onPress,detailed=false}) { return <Pressable onPress={onPress} style={styles.destinationCard}><View style={styles.destinationIcon}><Text style={{fontSize:27}}>{item.emoji}</Text></View><View style={{flex:1}}><Text style={styles.destinationName}>{item.name}</Text><Text style={styles.destinationRegion}>{item.region} · {item.category}</Text><Text style={styles.destinationNote}>{item.note}</Text>{detailed&&<Text style={styles.destinationNote}>Highlights: {item.highlights}</Text>}<Text style={styles.destinationBudget}>Indicative budget: {item.budget}/person</Text><Text style={styles.inlineAction}>Tap to plan →</Text></View><Text style={styles.chevron}>›</Text></Pressable>; }
function Empty({title,text,action,onPress}) { return <View style={styles.empty}><Text style={{fontSize:38}}>🧳</Text><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.sectionCopy}>{text}</Text>{!!action&&<Button title={action} primary onPress={onPress}/>}</View>; }
const styles = StyleSheet.create({
 safe:{flex:1,backgroundColor:"#F5F7F4"}, header:{backgroundColor:GREEN,paddingHorizontal:16,paddingVertical:12,flexDirection:"row",alignItems:"center",gap:11},
 brandIcon:{width:44,height:44,borderRadius:14,backgroundColor:"#FFFFFF20",alignItems:"center",justifyContent:"center"},brand:{color:"#FFFFFF",fontSize:23,fontWeight:"900",letterSpacing:-.8},brandAccent:{color:ORANGE},tagline:{color:"#DFF4E9",fontSize:11,fontWeight:"600",marginTop:-1},
 settingsButton:{padding:9,backgroundColor:"#FFFFFF20",borderRadius:12},navScroll:{flexGrow:0,backgroundColor:"#FFFFFF",borderBottomWidth:1,borderBottomColor:LINE},tabs:{paddingHorizontal:10,paddingVertical:8,gap:6,alignItems:"center"},
 tab:{paddingVertical:11,paddingHorizontal:13,alignItems:"center",borderRadius:11,backgroundColor:"#F8FAF8"},activeTab:{backgroundColor:MINT},tabText:{fontSize:12,color:MUTED,fontWeight:"700"},activeTabText:{color:GREEN},
 content:{padding:17,paddingBottom:40},hero:{backgroundColor:GREEN,borderRadius:22,padding:23,overflow:"hidden",marginBottom:24},eyebrow:{color:"#1A9A7C",fontSize:10,fontWeight:"900",letterSpacing:1.3,marginBottom:8},
 heroTitle:{color:"#FFFFFF",fontSize:34,lineHeight:39,fontWeight:"900",letterSpacing:-1.1,marginBottom:11},heroCopy:{color:"#E0F2E8",fontSize:14,lineHeight:21,marginBottom:15},heroBadge:{alignSelf:"flex-start",backgroundColor:"#FFFFFF18",borderRadius:30,paddingHorizontal:11,paddingVertical:7,marginTop:14},heroBadgeText:{color:"#FFFFFF",fontSize:10,fontWeight:"700"},
 button:{alignSelf:"flex-start",backgroundColor:MINT,borderRadius:11,paddingVertical:10,paddingHorizontal:13,marginTop:7},primaryButton:{backgroundColor:ORANGE},dangerButton:{backgroundColor:"#FFF0EF"},buttonText:{color:GREEN,fontWeight:"800",fontSize:12},primaryButtonText:{color:"#342517"},dangerButtonText:{color:"#B42318"},
 pageIntro:{marginBottom:14},sectionTitle:{color:INK,fontSize:24,lineHeight:30,fontWeight:"900",letterSpacing:-.6,marginBottom:5},sectionCopy:{color:MUTED,fontSize:13,lineHeight:19,marginBottom:13},
 metrics:{flexDirection:"row",flexWrap:"wrap",gap:10,marginBottom:24},metric:{width:"48%",flexGrow:1,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:LINE,borderRadius:15,padding:13,gap:4},metricLabel:{color:MUTED,fontSize:11},metricValue:{color:INK,fontSize:18,fontWeight:"900"},
 quickGrid:{flexDirection:"row",flexWrap:"wrap",gap:10,marginBottom:18},quickCard:{width:"48%",flexGrow:1,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:LINE,borderRadius:15,padding:14,gap:5},
 search:{backgroundColor:"#FFFFFF",borderWidth:1,borderColor:LINE,borderRadius:12,padding:13,fontSize:14,color:INK,marginBottom:13},destinationCard:{backgroundColor:"#FFFFFF",borderWidth:1,borderColor:LINE,borderRadius:16,padding:14,marginBottom:11,flexDirection:"row",alignItems:"center",gap:12},
 destinationIcon:{width:54,height:58,borderRadius:13,backgroundColor:MINT,alignItems:"center",justifyContent:"center"},destinationName:{fontSize:15,color:INK,fontWeight:"800",marginBottom:2},destinationRegion:{color:GREEN,fontSize:11,fontWeight:"800",marginBottom:3},destinationNote:{color:MUTED,fontSize:12,lineHeight:17,marginTop:2},destinationBudget:{color:GREEN,fontSize:11,fontWeight:"800",marginTop:6},inlineAction:{color:GREEN,fontSize:11,fontWeight:"800",marginTop:8},chevron:{color:GREEN,fontSize:27,paddingHorizontal:3},
 disclaimer:{color:MUTED,fontSize:10,lineHeight:15,marginTop:2,marginBottom:16},card:{backgroundColor:"#FFFFFF",borderRadius:18,borderWidth:1,borderColor:LINE,padding:16,marginBottom:15},field:{marginBottom:13},label:{fontSize:12,fontWeight:"800",color:INK,marginBottom:6},input:{backgroundColor:"#FBFCFA",borderWidth:1,borderColor:"#CCD8D1",borderRadius:10,paddingHorizontal:12,paddingVertical:11,color:INK,fontSize:14},
 twoFields:{flexDirection:"row",gap:10},formHeading:{fontSize:14,fontWeight:"900",color:INK,marginTop:3,marginBottom:12},totalBox:{backgroundColor:GREEN,borderRadius:15,padding:17,marginTop:3,marginBottom:10},totalLabel:{color:"#DFF4E9",fontSize:12,fontWeight:"700"},totalAmount:{color:"#FFFFFF",fontSize:31,fontWeight:"900",letterSpacing:-.7,marginVertical:3},totalHint:{color:"#DFF4E9",fontSize:11},costLine:{flexDirection:"row",justifyContent:"space-between",marginTop:7,paddingTop:6,borderTopWidth:1,borderTopColor:"#FFFFFF25"},
 tipCard:{backgroundColor:MINT,padding:16,borderRadius:15,marginBottom:10},tipTitle:{color:GREEN,fontSize:14,fontWeight:"900",marginBottom:6},empty:{backgroundColor:"#FFFFFF",borderWidth:1,borderColor:LINE,borderRadius:18,padding:25,alignItems:"center",marginTop:14,marginBottom:14},emptyTitle:{fontSize:17,color:INK,fontWeight:"900",marginTop:12,marginBottom:7,textAlign:"center"},
 savedCard:{backgroundColor:"#FFFFFF",borderWidth:1,borderColor:LINE,borderRadius:15,padding:15,marginBottom:11,flexDirection:"row",alignItems:"center",gap:10},removeButton:{backgroundColor:"#FFF0EF",paddingHorizontal:11,paddingVertical:9,borderRadius:9},stayCard:{backgroundColor:"#FFFFFF",borderWidth:1,borderColor:LINE,borderRadius:16,padding:15,marginBottom:12,flexDirection:"row",gap:14,alignItems:"flex-start"},
 chip:{borderWidth:1,borderColor:LINE,backgroundColor:"#FFFFFF",paddingVertical:9,paddingHorizontal:14,borderRadius:22},chipActive:{backgroundColor:GREEN,borderColor:GREEN},chipText:{color:INK,fontSize:12,fontWeight:"700"},chipTextActive:{color:"#FFFFFF"},
 footer:{alignItems:"center",borderTopWidth:1,borderTopColor:LINE,marginTop:25,paddingTop:18},footerBrand:{color:GREEN,fontSize:16,fontWeight:"900",marginBottom:4},footerText:{color:MUTED,fontSize:10,marginTop:2,textAlign:"center"},
 modalBackdrop:{position:"absolute",top:0,bottom:0,left:0,right:0,backgroundColor:"#0008",justifyContent:"center",padding:22},modal:{backgroundColor:"#FFFFFF",borderRadius:20,padding:22}
});