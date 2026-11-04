import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView, ScrollView, View, Text, TextInput, Pressable,
  StyleSheet, StatusBar, Alert
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GREEN = "#176B55", MINT = "#DFF4E9", ORANGE = "#F1A35B";
const INK = "#172B3A", MUTED = "#60717D", LINE = "#E4EAE6";
const KEY = "wanderwise.savedTrips.v1";
const destinations = [
  { name: "Vijayawada & Bhavani Island", region: "Andhra Pradesh", note: "River views", budget: "₹2,350–₹4,465", low: 2350, category: "Nature", emoji: "🌿", highlights: "Krishna River scenery, island activities and city food." },
  { name: "Amaravati", region: "Andhra Pradesh", note: "Heritage", budget: "₹2,100–₹3,990", low: 2100, category: "Culture", emoji: "🏛️", highlights: "Buddhist heritage and a relaxed cultural day out." },
  { name: "Suryalanka Beach", region: "Andhra Pradesh", note: "Coastal break", budget: "₹2,450–₹4,655", low: 2450, category: "Beach", emoji: "🏖️", highlights: "A coastal getaway with time for the shoreline and local food." },
  { name: "Araku Valley", region: "Andhra Pradesh", note: "Hills & greenery", budget: "₹3,250–₹6,175", low: 3250, category: "Nature", emoji: "🌿", highlights: "Green valleys, viewpoints and coffee-country scenery." },
  { name: "Visakhapatnam", region: "Andhra Pradesh", note: "Beach & city", budget: "₹3,400–₹6,460", low: 3400, category: "Beach", emoji: "🏖️", highlights: "Beachfront spots, viewpoints and city attractions." },
  { name: "Tirupati", region: "Andhra Pradesh", note: "Spiritual visit", budget: "₹2,550–₹4,845", low: 2550, category: "Spiritual", emoji: "🛕", highlights: "Temple visit and nearby cultural attractions." },
  { name: "Hyderabad", region: "Telangana", note: "Food & culture", budget: "₹3,500–₹6,650", low: 3500, category: "City", emoji: "🌆", highlights: "Historic landmarks, markets and well-known local food." },
  { name: "Hampi", region: "Karnataka", note: "Historic ruins", budget: "₹3,250–₹6,175", low: 3250, category: "Culture", emoji: "🏛️", highlights: "Distinctive historic landscapes and architecture." },
  { name: "Mysuru", region: "Karnataka", note: "Palaces & gardens", budget: "₹3,450–₹6,555", low: 3450, category: "Culture", emoji: "🏛️", highlights: "Palace architecture, gardens and local culture." },
  { name: "Pondicherry", region: "Puducherry", note: "Coastal town", budget: "₹3,700–₹7,030", low: 3700, category: "Beach", emoji: "🏖️", highlights: "Coastal promenades, colourful streets and cafés." },
  { name: "Chennai", region: "Tamil Nadu", note: "City & coastline", budget: "₹3,550–₹6,745", low: 3550, category: "City", emoji: "🌆", highlights: "Marina Beach, museums, neighbourhoods and South Indian food." },
  { name: "Madurai", region: "Tamil Nadu", note: "Temple heritage", budget: "₹2,650–₹5,035", low: 2650, category: "Spiritual", emoji: "🛕", highlights: "Historic temple architecture, markets and local cuisine." },
  { name: "Munnar", region: "Kerala", note: "Tea hills", budget: "₹3,650–₹6,935", low: 3650, category: "Nature", emoji: "🌿", highlights: "Tea gardens, misty hills and scenic viewpoints." },
  { name: "Alappuzha", region: "Kerala", note: "Backwaters", budget: "₹3,650–₹6,935", low: 3650, category: "Nature", emoji: "🌿", highlights: "Backwaters, canals and coastal scenery." },
  { name: "Goa", region: "Goa", note: "Beaches & culture", budget: "₹4,300–₹8,170", low: 4300, category: "Beach", emoji: "🏖️", highlights: "Beaches, heritage neighbourhoods and local markets." },
  { name: "Mumbai", region: "Maharashtra", note: "Big-city escape", budget: "₹4,650–₹8,835", low: 4650, category: "City", emoji: "🌆", highlights: "Waterfront landmarks, museums, markets and city life." },
  { name: "Pune", region: "Maharashtra", note: "City & forts", budget: "₹3,550–₹6,745", low: 3550, category: "City", emoji: "🌆", highlights: "Urban culture, nearby forts and food spots." },
  { name: "Jaipur", region: "Rajasthan", note: "Palaces & forts", budget: "₹3,750–₹7,125", low: 3750, category: "Culture", emoji: "🏛️", highlights: "Pink City streets, forts, palaces and traditional markets." },
  { name: "Udaipur", region: "Rajasthan", note: "Lakes & palaces", budget: "₹3,950–₹7,505", low: 3950, category: "Culture", emoji: "🏛️", highlights: "Lake views, historic palaces and old-city lanes." },
  { name: "Delhi", region: "Delhi", note: "Capital highlights", budget: "₹4,150–₹7,885", low: 4150, category: "Culture", emoji: "🏛️", highlights: "Historic monuments, museums, markets and varied food." },
  { name: "Agra", region: "Uttar Pradesh", note: "World heritage", budget: "₹3,600–₹6,840", low: 3600, category: "Culture", emoji: "🏛️", highlights: "The Taj Mahal area, Mughal architecture and historic sites." },
  { name: "Varanasi", region: "Uttar Pradesh", note: "River & heritage", budget: "₹3,100–₹5,890", low: 3100, category: "Spiritual", emoji: "🛕", highlights: "Ganga ghats, historic lanes and cultural experiences." },
  { name: "Rishikesh", region: "Uttarakhand", note: "River & adventure", budget: "₹4,650–₹8,835", low: 4650, category: "Adventure", emoji: "⛰️", highlights: "River scenery and adventure activities; long-distance travel can raise costs." },
  { name: "Shimla", region: "Himachal Pradesh", note: "Mountain views", budget: "₹4,150–₹7,885", low: 4150, category: "Nature", emoji: "🌿", highlights: "Mountain scenery, walking streets and colonial-era architecture." },
  { name: "Manali", region: "Himachal Pradesh", note: "Himalayan escape", budget: "₹4,750–₹9,025", low: 4750, category: "Adventure", emoji: "⛰️", highlights: "Mountain views, outdoor activities and valley scenery." },
  { name: "Srinagar", region: "Jammu & Kashmir", note: "Lakes & mountains", budget: "₹4,850–₹9,215", low: 4850, category: "Nature", emoji: "🌿", highlights: "Lake views, gardens and Himalayan landscapes." },
  { name: "Kolkata", region: "West Bengal", note: "Culture & food", budget: "₹3,150–₹5,985", low: 3150, category: "Culture", emoji: "🏛️", highlights: "Museums, colonial-era landmarks, markets and Bengali food." },
  { name: "Darjeeling", region: "West Bengal", note: "Tea & mountains", budget: "₹3,950–₹7,505", low: 3950, category: "Nature", emoji: "🌿", highlights: "Tea gardens, mountain views and heritage rail experiences." },
  { name: "Shillong", region: "Meghalaya", note: "Waterfalls & hills", budget: "₹3,800–₹7,220", low: 3800, category: "Nature", emoji: "🌿", highlights: "Green hills, waterfalls and scenic drives." },
  { name: "Kaziranga", region: "Assam", note: "Wildlife & nature", budget: "₹4,700–₹8,930", low: 4700, category: "Adventure", emoji: "⛰️", highlights: "Wildlife and nature experiences; check seasonal access and permits." },
  { name: "Puri", region: "Odisha", note: "Temple & beach", budget: "₹2,900–₹5,510", low: 2900, category: "Spiritual", emoji: "🛕", highlights: "Coastal scenery, temple heritage and local food." },
  { name: "Bengaluru", region: "Karnataka", note: "City & gardens", budget: "₹4,050–₹7,695", low: 4050, category: "City", emoji: "🌆", highlights: "Gardens, museums, food streets and city attractions." },
  { name: "Amritsar", region: "Punjab", note: "Heritage & food", budget: "₹3,150–₹5,985", low: 3150, category: "Spiritual", emoji: "🛕", highlights: "Golden Temple, historic sites and Punjabi cuisine." },
  { name: "Guwahati", region: "Assam", note: "Gateway to the Northeast", budget: "₹3,300–₹6,270", low: 3300, category: "Culture", emoji: "🏛️", highlights: "River views, temples and access to Northeast India." }
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

  useEffect(() => {
    AsyncStorage.multiGet([KEY, "wanderwise.expenses.v1"]).then(rows => {
      const trips = rows[0]?.[1], costs = rows[1]?.[1];
      if (trips) setSaved(JSON.parse(trips));
      if (costs) setExpenses(JSON.parse(costs));
    }).catch(() => Alert.alert("Storage notice", "Saved data could not be loaded on this launch."));
  }, []);
  const total = useMemo(() => {
    const d = Math.max(1, Number(days) || 1), p = Math.max(1, Number(people) || 1);
    return (Number(travel) || 0) * p + (Number(stay) || 0) * Math.max(0, d - 1) + (Number(food) || 0) * d * p + (Number(extras) || 0);
  }, [days, people, travel, stay, food, extras]);
  const persistTrips = async next => { setSaved(next); try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch { Alert.alert("Storage unavailable", "Trips could not be saved on this device."); } };
  const persistExpenses = async next => { setExpenses(next); try { await AsyncStorage.setItem("wanderwise.expenses.v1", JSON.stringify(next)); } catch { Alert.alert("Storage unavailable", "Expenses could not be saved on this device."); } };
  const saveTrip = () => {
    if (!destination.trim()) return Alert.alert("Add a destination", "Enter where you want to travel first.");
    const safeDays = Math.max(1, Math.min(30, Math.floor(Number(days) || 1)));
    const safePeople = Math.max(1, Math.min(20, Math.floor(Number(people) || 1)));
    const costs = [travel, stay, food, extras, budgetLimit].map(Number);
    if (costs.some(value => !Number.isFinite(value) || value < 0)) return Alert.alert("Check your budget", "Enter valid amounts. Costs and budget cannot be negative.");
    const trip = { id: editingId || String(Date.now()), title: tripTitle.trim() || destination.trim(), destination: destination.trim(), days: safeDays, people: safePeople, travel: Number(travel)||0, stay: Number(stay)||0, food: Number(food)||0, extras: Number(extras)||0, budgetLimit: Number(budgetLimit)||0, total, date: tripDate, createdAt: new Date().toISOString() };
    persistTrips(editingId ? saved.map(x => x.id === editingId ? trip : x) : [trip, ...saved]);
    setEditingId(null); setTab("Saved"); Alert.alert(editingId ? "Trip updated" : "Trip saved ✨", "Your trip is stored on this device.");
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
    persistExpenses([{ id: String(Date.now()), name: expenseName.trim(), amount, date: new Date().toISOString() }, ...expenses]);
    setExpenseName(""); setExpenseAmount("");
  };
  const removeTrip = id => Alert.alert("Delete saved trip?", "This removes the trip from this device.", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => persistTrips(saved.filter(x => x.id !== id)) }]);
  const nav = [["Dashboard","⌂ Home"],["Explore","⌖ Explore"],["Discover","✦ Discover"],["For You","✧ For You"],["Plan","✎ Plan trip"],["Stays","⌂ Stays"],["Expenses","₹ Expenses"],["Analytics","▥ Insights"],["Saved","♡ Saved"]];
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
      <View style={{flex:1}}><Text style={styles.brand}>Wander<Text style={styles.brandAccent}>Wise</Text></Text><Text style={styles.tagline}>Small budget. Big memories.</Text></View>
      <Pressable accessibilityLabel="Open settings" onPress={()=>setShowSettings(true)} style={styles.settingsButton}><Text style={{fontSize:21}}>⚙</Text></Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navScroll} contentContainerStyle={styles.tabs}>
      {nav.map(([key,label])=><Pressable key={key} onPress={()=>setTab(key)} style={[styles.tab,tab===key&&styles.activeTab]}><Text style={[styles.tabText,tab===key&&styles.activeTabText]}>{label}{key==="Saved" ? " ("+saved.length+")" : ""}</Text></Pressable>)}
    </ScrollView>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab==="Dashboard" && <>
        <View style={styles.hero}><Text style={styles.eyebrow}>YOUR TRAVEL CONSOLE</Text><Text style={styles.heroTitle}>Small budget.{ "\n" }Big memories.</Text><Text style={styles.heroCopy}>Make a plan, keep an eye on costs, and find your next getaway without losing sight of your budget.</Text><Button title="＋ Start planning" primary onPress={()=>setTab("Plan")}/></View>
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
        {selected&&<View style={styles.tipCard}><Text style={styles.tipTitle}>{selected.emoji} About {selected.name}</Text><Text style={styles.sectionCopy}>{selected.highlights}. Indicative destination budget: {selected.budget} per person. Estimates can vary by season.</Text></View>}
      </>}
      {tab==="Stays" && <>
        <Heading eyebrow="REST EASY, SPEND WISELY" title="Stay planning" subtitle="Compare accommodation styles and add a realistic room budget to your trip. These are planning guides, not live listings or availability."/>
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
        {!expenses.length?<Empty title="No expenses yet" text="Add your first cost above to start tracking spending."/>:expenses.map(e=><View key={e.id} style={styles.savedCard}><View style={{flex:1}}><Text style={styles.destinationName}>{e.name}</Text><Text style={styles.destinationNote}>{new Date(e.date).toLocaleDateString()}</Text></View><Text style={styles.destinationBudget}>{money(e.amount)}</Text><Pressable onPress={()=>persistExpenses(expenses.filter(x=>x.id!==e.id))} style={styles.removeButton}><Text style={{color:"#B42318",fontWeight:"800"}}>Delete</Text></Pressable></View>)}
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
    {showSettings&&<View style={styles.modalBackdrop}><View style={styles.modal}><Text style={styles.sectionTitle}>Settings</Text><Text style={styles.sectionCopy}>WanderWise saves trips and expenses locally on this device. Estimates are indicative and are not live prices.</Text><Button title="Clear all saved trips" danger onPress={()=>Alert.alert("Clear saved trips?","This permanently removes saved trips on this device.",[{text:"Cancel",style:"cancel"},{text:"Clear",style:"destructive",onPress:()=>persistTrips([])}])}/><Button title="Clear expense log" danger onPress={()=>Alert.alert("Clear expenses?","This removes all expense entries on this device.",[{text:"Cancel",style:"cancel"},{text:"Clear",style:"destructive",onPress:()=>persistExpenses([])}])}/><Button title="Close" primary onPress={()=>setShowSettings(false)}/></View></View>}
  </SafeAreaView>;
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