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
  { name: "Araku Valley", region: "Andhra Pradesh", note: "Green hills & coffee farms", budget: "₹2,500–₹5,000", low: 2500, category: "Nature", emoji: "🌿", highlights: "Coffee plantations, viewpoints, tribal museum" },
  { name: "Vizag", region: "Andhra Pradesh", note: "Beaches, viewpoints & city fun", budget: "₹2,000–₹4,500", low: 2000, category: "Beach", emoji: "🏖️", highlights: "RK Beach, Kailasagiri, submarine museum" },
  { name: "Hyderabad", region: "Telangana", note: "Food, history & city exploring", budget: "₹2,500–₹5,500", low: 2500, category: "City", emoji: "🏙️", highlights: "Charminar, museums, local food" },
  { name: "Hampi", region: "Karnataka", note: "Ancient ruins & landscapes", budget: "₹3,500–₹7,000", low: 3500, category: "Culture", emoji: "🏛️", highlights: "Temple architecture, boulder landscapes, heritage sites" },
  { name: "Tirupati", region: "Andhra Pradesh", note: "Temple town & nearby nature", budget: "₹1,500–₹3,500", low: 1500, category: "Spiritual", emoji: "🙏", highlights: "Temple area, local gardens, nearby viewpoints" },
  { name: "Vijayawada", region: "Andhra Pradesh", note: "River views & local favourites", budget: "₹1,000–₹2,500", low: 1000, category: "City", emoji: "🌉", highlights: "Kanaka Durga temple, Prakasam Barrage, river views" },
  { name: "Rajahmundry", region: "Andhra Pradesh", note: "Godavari river and bridges", budget: "₹1,500–₹3,000", low: 1500, category: "Nature", emoji: "🌊", highlights: "Godavari riverfront, bridges, local markets" },
  { name: "Chennai", region: "Tamil Nadu", note: "Coast, culture & city life", budget: "₹3,000–₹6,000", low: 3000, category: "Beach", emoji: "🌅", highlights: "Marina Beach, museums, local cuisine" },
  { name: "Bengaluru", region: "Karnataka", note: "Gardens, cafes & city sights", budget: "₹3,000–₹6,500", low: 3000, category: "City", emoji: "🌆", highlights: "Parks, museums, markets and cafes" }
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
  const [travel, setTravel] = useState("1200"), [stay, setStay] = useState("1000");
  const [food, setFood] = useState("500"), [extras, setExtras] = useState("500");
  const [tripDate, setTripDate] = useState(""), [tripTitle, setTripTitle] = useState("");
  const [saved, setSaved] = useState([]), [search, setSearch] = useState("");
  const [category, setCategory] = useState("All"), [expenseName, setExpenseName] = useState(""), [expenseAmount, setExpenseAmount] = useState("");
  const [expenses, setExpenses] = useState([]), [editingId, setEditingId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([KEY, "wanderwise.expenses.v1"]).then(rows => {
      const trips = rows[0]?.[1], costs = rows[1]?.[1];
      if (trips) setSaved(JSON.parse(trips));
      if (costs) setExpenses(JSON.parse(costs));
    }).catch(() => Alert.alert("Storage notice", "Saved data could not be loaded on this launch."));
  }, []);
  const total = useMemo(() => {
    const d = Math.max(1, Number(days) || 1), p = Math.max(1, Number(people) || 1);
    return (Number(travel) || 0) * p + (Number(stay) || 0) * d + (Number(food) || 0) * d * p + (Number(extras) || 0);
  }, [days, people, travel, stay, food, extras]);
  const persistTrips = async next => { setSaved(next); try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch { Alert.alert("Storage unavailable", "Trips could not be saved on this device."); } };
  const persistExpenses = async next => { setExpenses(next); try { await AsyncStorage.setItem("wanderwise.expenses.v1", JSON.stringify(next)); } catch { Alert.alert("Storage unavailable", "Expenses could not be saved on this device."); } };
  const saveTrip = () => {
    if (!destination.trim()) return Alert.alert("Add a destination", "Enter where you want to travel first.");
    const trip = { id: editingId || String(Date.now()), title: tripTitle.trim() || destination.trim(), destination: destination.trim(), days: Math.max(1, Number(days) || 1), people: Math.max(1, Number(people) || 1), travel: Number(travel)||0, stay: Number(stay)||0, food: Number(food)||0, extras: Number(extras)||0, total, date: tripDate, createdAt: new Date().toISOString() };
    persistTrips(editingId ? saved.map(x => x.id === editingId ? trip : x) : [trip, ...saved]);
    setEditingId(null); setTab("Saved"); Alert.alert(editingId ? "Trip updated" : "Trip saved ✨", "Your trip is stored on this device.");
  };
  const openDestination = name => {
    const item = destinations.find(d => d.name === name);
    setDestination(name);
    if (item) { setTravel(String(Math.max(500, Math.round(item.low * 0.25))); setStay(String(Math.max(500, Math.round(item.low * 0.22))); }
    setTab("Plan");
  };
  const editTrip = trip => {
    setEditingId(trip.id); setTripTitle(trip.title || ""); setDestination(trip.destination);
    setDays(String(trip.days)); setPeople(String(trip.people)); setTravel(String(trip.travel ?? 0));
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
  const nav = [["Dashboard","⌂ Home"],["Explore","⌖ Explore"],["Discover","✦ Discover"],["Plan","✎ Plan trip"],["Stays","⌂ Stays"],["Expenses","₹ Expenses"],["Saved","♡ Saved"]];
  const tripSpend = saved.reduce((sum,t)=>sum+(Number(t.total)||0),0);
  const expenseSpend = expenses.reduce((sum,e)=>sum+(Number(e.amount)||0),0);
  const selected = destinations.find(d=>d.name===destination);

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
      {tab==="Plan" && <>
        <Heading eyebrow="YOUR TRIP, YOUR BUDGET" title={editingId?"Edit your trip":"Build your travel plan"} subtitle="Change the estimates to match your actual plans. Totals update as you type."/>
        <View style={styles.card}>
          <Field label="Trip name (optional)" value={tripTitle} onChangeText={setTripTitle} placeholder="e.g. Weekend with friends"/>
          <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Where do you want to go?"/>
          <View style={styles.twoFields}><View style={{flex:1}}><Field label="Duration (days)" value={days} onChangeText={setDays} keyboardType="number-pad"/></View><View style={{flex:1}}><Field label="Travellers" value={people} onChangeText={setPeople} keyboardType="number-pad"/></View></View>
          <Field label="Travel date (optional)" value={tripDate} onChangeText={setTripDate} placeholder="YYYY-MM-DD"/>
          <Text style={styles.formHeading}>Estimated costs (₹)</Text>
          <Field label="Return travel per person" value={travel} onChangeText={setTravel} keyboardType="number-pad"/>
          <Field label="Stay per night (total room cost)" value={stay} onChangeText={setStay} keyboardType="number-pad"/>
          <Field label="Food per person / day" value={food} onChangeText={setFood} keyboardType="number-pad"/>
          <Field label="Activities & other costs (total)" value={extras} onChangeText={setExtras} keyboardType="number-pad"/>
          <View style={styles.totalBox}><Text style={styles.totalLabel}>Estimated trip total</Text><Text style={styles.totalAmount}>{money(total)}</Text><Text style={styles.totalHint}>{money(total/Math.max(1,Number(people)||1))} per person · {Math.max(1,Number(days)||1)} day(s)</Text><View style={styles.costLine}><Text style={styles.totalHint}>Travel</Text><Text style={styles.totalHint}>{money((Number(travel)||0)*Math.max(1,Number(people)||1))}</Text></View><View style={styles.costLine}><Text style={styles.totalHint}>Accommodation</Text><Text style={styles.totalHint}>{money((Number(stay)||0)*Math.max(1,Number(days)||1))}</Text></View><View style={styles.costLine}><Text style={styles.totalHint}>Food</Text><Text style={styles.totalHint}>{money((Number(food)||0)*Math.max(1,Number(days)||1)*Math.max(1,Number(people)||1))}</Text></View><View style={styles.costLine}><Text style={styles.totalHint}>Activities & other</Text><Text style={styles.totalHint}>{money(extras)}</Text></View></View>
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