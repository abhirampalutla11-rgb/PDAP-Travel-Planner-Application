import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text, TextInput, Pressable,
  StyleSheet, StatusBar, Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GREEN = "#176B55";
const MINT = "#DFF4E9";
const ORANGE = "#F1A35B";
const INK = "#172B3A";
const MUTED = "#60717D";
const LINE = "#E4EAE6";
const KEY = "wanderwise.savedTrips.v1";

const destinations = [
  { name: "Araku Valley", region: "Andhra Pradesh", note: "Green hills & coffee farms", budget: "₹2,500–₹5,000" },
  { name: "Vizag", region: "Andhra Pradesh", note: "Beaches, viewpoints & city fun", budget: "₹2,000–₹4,500" },
  { name: "Hyderabad", region: "Telangana", note: "Food, history & city exploring", budget: "₹2,500–₹5,500" },
  { name: "Hampi", region: "Karnataka", note: "Ancient ruins & landscapes", budget: "₹3,500–₹7,000" },
  { name: "Tirupati", region: "Andhra Pradesh", note: "Temple town & nearby nature", budget: "₹1,500–₹3,500" },
  { name: "Vijayawada", region: "Andhra Pradesh", note: "River views & local favourites", budget: "₹1,000–₹2,500" }
];

const money = (n) => "₹" + Math.max(0, Number(n) || 0).toLocaleString("en-IN");

function Field({ label, value, onChangeText, keyboardType = "default", placeholder }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder || "0"}
        placeholderTextColor="#91A099"
        style={styles.input}
      />
    </View>
  );
}

function Button({ title, onPress, primary = false, light = false }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      styles.button, primary && styles.primaryButton, light && styles.lightButton,
      pressed && { opacity: 0.78 }
    ]}>
      <Text style={[styles.buttonText, primary && styles.primaryButtonText, light && styles.lightButtonText]}>{title}</Text>
    </Pressable>
  );
}

export default function App() {
  const [tab, setTab] = useState("Explore");
  const [destination, setDestination] = useState("Araku Valley");
  const [days, setDays] = useState("2");
  const [people, setPeople] = useState("2");
  const [travel, setTravel] = useState("1200");
  const [stay, setStay] = useState("1000");
  const [food, setFood] = useState("500");
  const [extras, setExtras] = useState("500");
  const [saved, setSaved] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) setSaved(JSON.parse(raw));
    }).catch(() => {});
  }, []);

  const total = useMemo(() => {
    const d = Math.max(1, Number(days) || 1);
    const p = Math.max(1, Number(people) || 1);
    return (Number(travel) || 0) * p + (Number(stay) || 0) * d + (Number(food) || 0) * d * p + (Number(extras) || 0);
  }, [days, people, travel, stay, food, extras]);

  const persist = async (next) => {
    setSaved(next);
    try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); }
    catch { Alert.alert("Storage unavailable", "This trip could not be saved on this device."); }
  };

  const saveTrip = () => {
    const trip = {
      id: String(Date.now()), destination: destination.trim() || "My trip",
      days: Math.max(1, Number(days) || 1), people: Math.max(1, Number(people) || 1),
      total, createdAt: new Date().toISOString()
    };
    persist([trip, ...saved]);
    Alert.alert("Trip saved ✨", "Your plan is saved on this device.");
    setTab("Saved");
  };

  const filtered = destinations.filter((d) =>
    (d.name + " " + d.region + " " + d.note).toLowerCase().includes(search.toLowerCase())
  );

  const openDestination = (name) => {
    setDestination(name);
    setTab("Plan");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={GREEN} />
      <View style={styles.header}>
        <View style={styles.brandIcon}><Text style={{ fontSize: 23 }}>✈</Text></View>
        <View>
          <Text style={styles.brand}>Wander<Text style={styles.brandAccent}>Wise</Text></Text>
          <Text style={styles.tagline}>Small budget. Big memories.</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {["Explore", "Plan", "Saved"].map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.activeTab]}>
            <Text style={[styles.tabText, tab === item && styles.activeTabText]}>{item === "Explore" ? "⌖  Explore" : item === "Plan" ? "✎  Plan trip" : "♡  Saved (" + saved.length + ")"} </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {tab === "Explore" && <>
          <View style={styles.hero}>
            <Text style={styles.eyebrow}>TRAVEL MORE, SPEND WISELY</Text>
            <Text style={styles.heroTitle}>Your next story{ "\n" }starts here.</Text>
            <Text style={styles.heroCopy}>Plan memorable trips that respect your budget. Big adventures don't need big spending.</Text>
            <Button title="Plan my trip  →" primary onPress={() => setTab("Plan")} />
            <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>✦ Made for budget-conscious travellers</Text></View>
          </View>
          <Text style={styles.sectionTitle}>Find your kind of getaway</Text>
          <Text style={styles.sectionCopy}>A few ideas to get your journey rolling.</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder="Search destinations..." placeholderTextColor="#91A099" style={styles.search} />
          {filtered.map((item) => (
            <Pressable key={item.name} onPress={() => openDestination(item.name)} style={styles.destinationCard}>
              <View style={styles.destinationIcon}><Text style={{ fontSize: 25 }}>{"🌿"}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.destinationName}>{item.name}</Text>
                <Text style={styles.destinationRegion}>{item.region}</Text>
                <Text style={styles.destinationNote}>{item.note}</Text>
                <Text style={styles.destinationBudget}>Indicative budget: {item.budget}/person</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}
          <Text style={styles.disclaimer}>Destination budgets are rough planning estimates, not live prices. Check current transport and stay costs before booking.</Text>
        </>}

        {tab === "Plan" && <>
          <View style={styles.pageIntro}>
            <Text style={styles.eyebrow}>YOUR TRIP, YOUR BUDGET</Text>
            <Text style={styles.sectionTitle}>Build your travel plan</Text>
            <Text style={styles.sectionCopy}>Change the estimates to match your actual plans.</Text>
          </View>
          <View style={styles.card}>
            <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Where do you want to go?" />
            <View style={styles.twoFields}>
              <View style={{ flex: 1 }}><Field label="Trip duration (days)" value={days} onChangeText={setDays} keyboardType="number-pad" /></View>
              <View style={{ flex: 1 }}><Field label="Travellers" value={people} onChangeText={setPeople} keyboardType="number-pad" /></View>
            </View>
            <Text style={styles.formHeading}>Estimated costs (₹)</Text>
            <Field label="Travel per person (return)" value={travel} onChangeText={setTravel} keyboardType="number-pad" />
            <Field label="Stay per night (total room cost)" value={stay} onChangeText={setStay} keyboardType="number-pad" />
            <Field label="Food per person / day" value={food} onChangeText={setFood} keyboardType="number-pad" />
            <Field label="Activities & other costs (total)" value={extras} onChangeText={setExtras} keyboardType="number-pad" />
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Estimated trip total</Text>
              <Text style={styles.totalAmount}>{money(total)}</Text>
              <Text style={styles.totalHint}>{money(total / Math.max(1, Number(people) || 1))} per person · {Math.max(1, Number(days) || 1)} day(s)</Text>
            </View>
            <Button title="♡  Save this trip" onPress={saveTrip} primary />
          </View>
          <View style={styles.tipCard}><Text style={styles.tipTitle}>💡 Budget tip</Text><Text style={styles.sectionCopy}>Keep a small emergency buffer and compare transport options before paying. Prices can change by date and season.</Text></View>
        </>}

        {tab === "Saved" && <>
          <Text style={styles.eyebrow}>YOUR TRAVEL NOTEBOOK</Text>
          <Text style={styles.sectionTitle}>Saved trips</Text>
          <Text style={styles.sectionCopy}>Stored locally on this device.</Text>
          {saved.length === 0 ? (
            <View style={styles.empty}>
              <Text style={{ fontSize: 42 }}>🧳</Text>
              <Text style={styles.emptyTitle}>Your next trip belongs here.</Text>
              <Text style={styles.sectionCopy}>Create a plan and save it to see it here.</Text>
              <Button title="Create a trip" primary onPress={() => setTab("Plan")} />
            </View>
          ) : saved.map((trip) => (
            <View key={trip.id} style={styles.savedCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.destinationName}>{trip.destination}</Text>
                <Text style={styles.destinationNote}>{trip.days} day(s) · {trip.people} traveller(s)</Text>
                <Text style={styles.destinationBudget}>{money(trip.total)} estimated total</Text>
              </View>
              <Pressable onPress={() => persist(saved.filter((x) => x.id !== trip.id))} style={styles.removeButton}>
                <Text style={{ color: "#B42318", fontWeight: "800" }}>Remove</Text>
              </Pressable>
            </View>
          ))}
          {saved.length > 0 && <Button title="＋ Plan another trip" primary onPress={() => setTab("Plan")} />}
        </>}
        <View style={styles.footer}><Text style={styles.footerBrand}>WanderWise</Text><Text style={styles.footerText}>Thoughtful travel for real-world budgets.</Text><Text style={styles.footerText}>A PDAP project · Built for memorable journeys</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F7F4" },
  header: { backgroundColor: GREEN, paddingHorizontal: 20, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 11 },
  brandIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#FFFFFF20", alignItems: "center", justifyContent: "center" },
  brand: { color: "#FFFFFF", fontSize: 23, fontWeight: "900", letterSpacing: -0.8 },
  brandAccent: { color: "#F1A35B" },
  tagline: { color: "#DFF4E9", fontSize: 11, fontWeight: "600", marginTop: -1 },
  tabs: { flexDirection: "row", backgroundColor: "#FFFFFF", paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: LINE },
  tab: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 10 },
  activeTab: { backgroundColor: MINT },
  tabText: { fontSize: 12, color: MUTED, fontWeight: "700" },
  activeTabText: { color: GREEN },
  content: { padding: 17, paddingBottom: 36 },
  hero: { backgroundColor: GREEN, borderRadius: 22, padding: 23, overflow: "hidden", marginBottom: 25 },
  eyebrow: { color: "#1A9A7C", fontSize: 10, fontWeight: "900", letterSpacing: 1.4, marginBottom: 8 },
  heroTitle: { color: "#FFFFFF", fontSize: 36, lineHeight: 39, fontWeight: "900", letterSpacing: -1.2, marginBottom: 11 },
  heroCopy: { color: "#E0F2E8", fontSize: 14, lineHeight: 21, marginBottom: 18 },
  heroBadge: { alignSelf: "flex-start", backgroundColor: "#FFFFFF18", borderRadius: 30, paddingHorizontal: 11, paddingVertical: 7, marginTop: 14 },
  heroBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  button: { alignSelf: "flex-start", backgroundColor: MINT, borderRadius: 11, paddingVertical: 12, paddingHorizontal: 16, marginTop: 7 },
  primaryButton: { backgroundColor: ORANGE },
  lightButton: { backgroundColor: "#FFFFFF" },
  buttonText: { color: GREEN, fontWeight: "800", fontSize: 13 },
  primaryButtonText: { color: "#342517" },
  lightButtonText: { color: GREEN },
  sectionTitle: { color: INK, fontSize: 24, lineHeight: 30, fontWeight: "900", letterSpacing: -0.6, marginBottom: 5 },
  sectionCopy: { color: MUTED, fontSize: 13, lineHeight: 19, marginBottom: 13 },
  search: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: LINE, borderRadius: 12, padding: 13, fontSize: 14, color: INK, marginBottom: 13 },
  destinationCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 14, marginBottom: 11, flexDirection: "row", alignItems: "center", gap: 12 },
  destinationIcon: { width: 51, height: 58, borderRadius: 13, backgroundColor: MINT, alignItems: "center", justifyContent: "center" },
  destinationName: { fontSize: 15, color: INK, fontWeight: "850", marginBottom: 2 },
  destinationRegion: { color: GREEN, fontSize: 11, fontWeight: "800", marginBottom: 3 },
  destinationNote: { color: MUTED, fontSize: 12, lineHeight: 17 },
  destinationBudget: { color: GREEN, fontSize: 11, fontWeight: "800", marginTop: 6 },
  chevron: { color: GREEN, fontSize: 27, paddingHorizontal: 3 },
  disclaimer: { color: MUTED, fontSize: 10, lineHeight: 15, marginTop: 2, marginBottom: 16 },
  pageIntro: { marginBottom: 12 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: LINE, padding: 16, marginBottom: 15 },
  field: { marginBottom: 13 },
  label: { fontSize: 12, fontWeight: "800", color: INK, marginBottom: 6 },
  input: { backgroundColor: "#FBFCFA", borderWidth: 1, borderColor: "#CCD8D1", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: INK, fontSize: 14 },
  twoFields: { flexDirection: "row", gap: 10 },
  formHeading: { fontSize: 14, fontWeight: "900", color: INK, marginTop: 3, marginBottom: 12 },
  totalBox: { backgroundColor: GREEN, borderRadius: 15, padding: 17, marginTop: 3, marginBottom: 10 },
  totalLabel: { color: "#DFF4E9", fontSize: 12, fontWeight: "700" },
  totalAmount: { color: "#FFFFFF", fontSize: 31, fontWeight: "900", letterSpacing: -0.7, marginVertical: 3 },
  totalHint: { color: "#DFF4E9", fontSize: 11 },
  tipCard: { backgroundColor: MINT, padding: 16, borderRadius: 15, marginBottom: 10 },
  tipTitle: { color: GREEN, fontSize: 14, fontWeight: "900", marginBottom: 6 },
  empty: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: LINE, borderRadius: 18, padding: 25, alignItems: "center", marginTop: 14 },
  emptyTitle: { fontSize: 17, color: INK, fontWeight: "900", marginTop: 12, marginBottom: 7, textAlign: "center" },
  savedCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: LINE, borderRadius: 15, padding: 15, marginBottom: 11, flexDirection: "row", alignItems: "center", gap: 10 },
  removeButton: { backgroundColor: "#FFF0EF", paddingHorizontal: 11, paddingVertical: 9, borderRadius: 9 },
  footer: { alignItems: "center", borderTopWidth: 1, borderTopColor: LINE, marginTop: 25, paddingTop: 18 },
  footerBrand: { color: GREEN, fontSize: 16, fontWeight: "900", marginBottom: 4 },
  footerText: { color: MUTED, fontSize: 10, marginTop: 2, textAlign: "center" }
});