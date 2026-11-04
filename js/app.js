const $=id=>document.getElementById(id);let current=null;const money=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n);
const today=new Date();const iso=d=>{let x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};$('start').value=iso(today);today.setDate(today.getDate()+2);$('end').value=iso(today);
function expenses(){try{return JSON.parse(localStorage.getItem('pdapExpenses')||'[]')}catch{return []}}function saveExpenses(a){localStorage.setItem('pdapExpenses',JSON.stringify(a))}
async function syncAccountData(session){
 const client=window.wwClient; if(!client||syncStarted)return; syncStarted=true;
 try{
  if(!session?.user){localStorage.removeItem('pdapTrips');localStorage.removeItem('pdapExpenses');renderSaved();renderExpenses();return}
  const [{data:tripRows,error:tripError},{data:expenseRows,error:expenseError}]=await Promise.all([
   client.from('trips').select('*').order('created_at',{ascending:false}),
   client.from('expenses').select('*').order('created_at',{ascending:false})
  ]);
  if(tripError)throw tripError;if(expenseError)throw expenseError;
  const mappedTrips=(tripRows||[]).map(r=>({id:r.id,destination:r.destination,start:r.start_date,end:r.end_date,people:r.travellers,days:Math.max(1,Math.round((new Date(r.end_date+'T00:00:00')-new Date(r.start_date+'T00:00:00'))/86400000)+1),budget:Number(r.budget),interests:Array.isArray(r.interests)?r.interests:[],costs:r.costs||estimate({people:r.travellers,days:1})}));
  localStorage.setItem('pdapTrips',JSON.stringify(mappedTrips));
  localStorage.setItem('pdapExpenses',JSON.stringify((expenseRows||[]).map(r=>({id:r.id,name:r.description,category:r.category,amount:Number(r.amount),status:r.payment_status,tripId:r.trip_id,date:r.expense_date}))));
  renderSaved();renderExpenses();
 }catch(err){console.error('WanderWise sync error:',err);const msg='Could not sync your account data: '+(err.message||'Check Supabase table policies.');const box=$('expenseError');if(box){box.textContent=msg;box.classList.remove('hidden')}}
 finally{syncStarted=false}
}
window.syncAccountData=syncAccountData;
async function requireAccount(){if(window.wwClient&&window.wwSession?.user)return true;alert('Please sign in first to save your trips and expenses to your account.');document.getElementById('authOpen')?.click();return false}
async function upsertTrip(t){
 if(!await requireAccount())return false;
 const row={id:t.id,user_id:window.wwSession.user.id,destination:t.destination,start_date:t.start,end_date:t.end,travellers:t.people,budget:t.budget,interests:t.interests||[],itinerary:[],costs:t.costs||{}};
 const {data,error}=await window.wwClient.from('trips').upsert(row).select().single();if(error){console.error('WanderWise trip save error:',error);alert('Trip could not be saved: '+error.message);return false}if(!data){alert('Supabase did not confirm the trip was saved. Please check the trips table.');return false}return true
}
async function deleteTripFromDb(id){if(!await requireAccount())return false;const {error}=await window.wwClient.from('trips').delete().eq('id',id);if(error){alert('Trip could not be deleted: '+error.message);return false}return true}
async function insertExpenseDb(e){
 if(!await requireAccount())return false;
 const row={user_id:window.wwSession.user.id,description:e.name,category:e.category,amount:e.amount,payment_status:e.status,expense_date:e.date||new Date().toISOString().slice(0,10),trip_id:e.tripId||null};
 const {data,error}=await window.wwClient.from('expenses').insert(row).select().single();
 if(error){alert('Expense could not be saved: '+error.message);return false}e.id=data.id;return true
}
async function updateExpenseDb(e){if(!await requireAccount())return false;const {error}=await window.wwClient.from('expenses').update({payment_status:e.status}).eq('id',e.id);if(error){alert('Expense update failed: '+error.message);return false}return true}
async function deleteExpenseDb(id){if(!await requireAccount())return false;const {error}=await window.wwClient.from('expenses').delete().eq('id',id);if(error){alert('Expense deletion failed: '+error.message);return false}return true}
function renderExpenses(){renderAnalytics();const all=expenses(),total=all.reduce((s,e)=>s+e.amount,0),paid=all.filter(e=>e.status==='Paid').reduce((s,e)=>s+e.amount,0),pending=total-paid;$('statExpenses').textContent=money(total);$('expenseSummary').innerHTML='<div class="expenseMetric">Total tracked<strong>'+money(total)+'</strong></div><div class="expenseMetric">Paid<strong>'+money(paid)+'</strong></div><div class="expenseMetric">Not yet paid<strong>'+money(pending)+'</strong></div>';if(!all.length){$('expenseList').className='empty';$('expenseList').textContent='No expenses added yet.';return}$('expenseList').className='';$('expenseList').innerHTML=all.map(e=>'<div class="expenseRow"><div><strong>'+esc(e.name)+'</strong><br><small>'+esc(e.category)+' · '+money(e.amount)+'</small></div><div><select data-status="'+esc(e.id)+'" aria-label="Payment status for '+esc(e.name)+'">'+['Planned','Pending','Paid'].map(s=>'<option '+(s===e.status?'selected':'')+'>'+s+'</option>').join('')+'</select> <button class="danger" data-expdelete="'+esc(e.id)+'">Delete</button></div></div>').join('');$('expenseList').querySelectorAll('[data-status]').forEach(s=>s.onchange=()=>{const a=expenses(),e=a.find(x=>x.id===s.dataset.status);if(e){e.status=s.value;void updateExpenseDb(e).then(ok=>{if(!ok){renderExpenses();return}saveExpenses(a);renderExpenses()})}});$('expenseList').querySelectorAll('[data-expdelete]').forEach(b=>b.onclick=()=>{void deleteExpenseDb(b.dataset.expdelete).then(ok=>{if(ok){saveExpenses(expenses().filter(e=>e.id!==b.dataset.expdelete));renderExpenses()}})})}
$('expenseForm').addEventListener('submit',e=>{e.preventDefault();const name=$('expenseName').value.trim(),amount=Number($('expenseAmount').value);if(!name||!Number.isFinite(amount)||amount<=0){$('expenseError').textContent='Enter an expense name and an amount greater than ₹0.';$('expenseError').classList.remove('hidden');return}$('expenseError').classList.add('hidden');const item={id:String(Date.now()),name,category:$('expenseCategory').value,amount,status:$('expenseStatus').value};void insertExpenseDb(item).then(ok=>{if(!ok)return;const a=expenses();a.unshift(item);saveExpenses(a);$('expenseForm').reset();renderExpenses()})});
function trips(){try{return JSON.parse(localStorage.getItem('pdapTrips')||'[]')}catch{return []}}function saveTrips(x){localStorage.setItem('pdapTrips',JSON.stringify(x));renderAnalytics()}
function renderAnalytics(){const ts=trips(),es=expenses();const budgets=ts.reduce((n,t)=>n+Number(t.budget||0),0),spent=es.reduce((n,e)=>n+Number(e.amount||0),0),paid=es.filter(e=>e.status==='Paid').reduce((n,e)=>n+Number(e.amount||0),0);$('analyticsBudgets').textContent=money(budgets);$('analyticsSpent').textContent=money(spent);$('analyticsPaid').textContent=money(paid);$('analyticsRemaining').textContent=money(budgets-spent);const categories={};es.forEach(e=>{const k=e.category||'Other';categories[k]=(categories[k]||0)+Number(e.amount||0)});const cat=$('categoryChart'),entries=Object.entries(categories).sort((a,b)=>b[1]-a[1]);cat.innerHTML=entries.length?entries.map(([name,val])=>'<div class="chartRow"><div class="chartLabel"><span>'+esc(name)+'</span><strong>'+money(val)+'</strong></div><div class="chartTrack"><div class="chartFill" style="width:'+Math.max(0,Math.min(100,spent?val/spent*100:0))+'%"></div></div></div>').join(''):'<p class="sub">Add expenses to see your breakdown.</p>';const statuses={Paid:paid,Pending:es.filter(e=>e.status==='Pending').reduce((n,e)=>n+Number(e.amount||0),0),Planned:es.filter(e=>e.status==='Planned').reduce((n,e)=>n+Number(e.amount||0),0)};const pay=$('paymentChart');pay.innerHTML=spent?Object.entries(statuses).map(([name,val])=>'<div class="chartRow"><div class="chartLabel"><span>'+name+'</span><strong>'+money(val)+'</strong></div><div class="chartTrack"><div class="chartFill '+(name==='Paid'?'':'alt')+'" style="width:'+Math.max(0,Math.min(100,val/spent*100))+'%"></div></div></div>').join(''):'<p class="sub">Your payment summary will appear here.</p>';$('analyticsNote').textContent=ts.length+' saved trip(s) · '+es.length+' expense record(s). Remaining is total trip budgets minus all recorded expenses.'}

function estimate(t){
 const p=t.people,d=t.days,nights=Math.max(0,d-1);
 const key=String(t.destination||'').trim().toLowerCase();
 const place=typeof discoverPlaces!=='undefined'?discoverPlaces.find(x=>x.name.toLowerCase()===key||x.name.toLowerCase().startsWith(key)||key.startsWith(x.name.toLowerCase())):null;
 if(place&&typeof originCities!=='undefined'&&typeof discoverDistanceKm==='function'){
  const origin=originCities.guntur,distance=discoverDistanceKm(origin,[place.lat,place.lon]);
  const transport=Math.round(Math.max(180,distance*2*1.6)*p);
  const lodging=Math.round(place.stay*nights*p/2);
  const food=Math.round(place.food*p*d);
  const activities=Math.round(place.activities*p*d);
  return {transport,lodging,food,activities,total:transport+lodging+food+activities,estimateType:'destination-based',origin:'Guntur'};
 }
 const c={transport:Math.round(450*p+(d>1?150*p:0)),lodging:850*p*nights,food:500*p*d,activities:350*p*d};
 c.total=c.transport+c.lodging+c.food+c.activities;c.estimateType='general';c.origin='Guntur';return c;
}
function make(){let destination=$('destination').value.trim(),start=$('start').value,end=$('end').value,people=Number($('people').value),budget=Number($('budget').value);if(!destination)throw Error('Please enter a destination.');if(!start||!end)throw Error('Please choose both trip dates.');if(end<start)throw Error('End date must be on or after the start date.');if(!Number.isInteger(people)||people<1)throw Error('Travellers must be a whole number of at least 1.');if(!Number.isFinite(budget)||budget<=0)throw Error('Budget must be greater than ₹0.');let days=Math.round((new Date(end+'T00:00:00')-new Date(start+'T00:00:00'))/86400000)+1;let t={id:current?.id||crypto.randomUUID(),destination,start,end,people,budget,days,interests:[...document.querySelectorAll('.chips input:checked')].map(x=>x.value)};t.costs=estimate(t);return t}
function hotelHistory(){try{return JSON.parse(localStorage.getItem('pdapHotelSearchHistory')||'[]')}catch{return []}}
function saveHotelHistory(items){localStorage.setItem('pdapHotelSearchHistory',JSON.stringify(items.slice(0,10)))}
function renderHotelHistory(){const items=hotelHistory(),box=$('hotelHistory');if(!box)return;if(!items.length){box.className='empty';box.textContent='No hotel searches yet.';return}box.className='';box.innerHTML=items.map(item=>'<div class="saved"><strong>'+esc(item.destination)+'</strong><br><small>'+esc(item.label)+' · '+new Date(item.time).toLocaleString()+'</small><div class="actions"><button type="button" data-history-open="'+esc(item.id)+'">Search again ↗</button><button type="button" class="danger" data-history-delete="'+esc(item.id)+'">Delete</button></div></div>').join('');box.querySelectorAll('[data-history-open]').forEach(btn=>btn.onclick=()=>{const item=hotelHistory().find(x=>x.id===btn.dataset.historyOpen);if(item){$('hotelDestination').value=item.destination;$('hotelType').value=['hotels','budget hotels','3 star hotels','4 star hotels','resorts','guest houses and homestays'].includes(item.kind)?item.kind:'hotels';runHotelSearch()}});box.querySelectorAll('[data-history-delete]').forEach(btn=>btn.onclick=()=>{saveHotelHistory(hotelHistory().filter(x=>x.id!==btn.dataset.historyDelete));renderHotelHistory()})}
function runHotelSearch(){const destination=$('hotelDestination').value.trim();if(!destination)return;const checkIn=$('hotelCheckIn').value,checkOut=$('hotelCheckOut').value,guests=$('hotelGuests').value||'2',type=$('hotelType').value;const dateText=checkIn&&checkOut?' check-in '+checkIn+' check-out '+checkOut:'';const query=type+' near '+destination;const links=[{title:'Hotel listings & ratings',tag:'Location & reviews',icon:'📍',detail:'View hotel names, guest ratings, addresses, photos and listed facilities.',url:'https://www.google.com/maps/search/'+encodeURIComponent(query)},{title:'Prices & room availability',tag:'Rates & availability',icon:'💰',detail:'Compare listed room rates for your dates and '+guests+' guest(s), where available.',url:'https://www.google.com/travel/hotels?q='+encodeURIComponent(query+dateText+' '+guests+' guests')},{title:'More booking options',tag:'Booking options',icon:'🛎️',detail:'Check additional accommodation listings and booking conditions.',url:'https://www.booking.com/searchresults.html?ss='+encodeURIComponent(destination+' '+type)+(checkIn?'&checkin='+encodeURIComponent(checkIn):'')+(checkOut?'&checkout='+encodeURIComponent(checkOut):'')+'&group_adults='+encodeURIComponent(guests)}];$('hotelFinderResults').innerHTML=links.map(item=>'<article class="stayCard"><div class="hotelArt '+(item.icon==='📍'?'artOne':item.icon==='💰'?'artTwo':'artThree')+'">'+item.icon+'</div><div class="stayBody"><span class="tag">'+item.tag+'</span><h3>'+item.title+'</h3><p>'+item.detail+'</p><p><small>Destination: '+esc(destination)+(dateText?' · '+esc(dateText.trim()):'')+'</small></p><a class="priceLink" href="'+item.url+'" target="_blank" rel="noopener noreferrer">View hotel details ↗</a></div></article>').join('');const items=hotelHistory();items.unshift({id:String(Date.now()),destination,label:type,time:new Date().toISOString(),kind:type});saveHotelHistory(items);renderHotelHistory()}
$('hotelFinderForm').addEventListener('submit',e=>{e.preventDefault();runHotelSearch()});
$('clearHotelHistory').addEventListener('click',()=>{if(confirm('Clear all hotel searches saved on this device?')){saveHotelHistory([]);renderHotelHistory()}});
$('hotelDestination').value=$('destination').value.trim();
$('destination').addEventListener('input',()=>{if(!$('hotelDestination').value.trim())$('hotelDestination').value=$('destination').value.trim()});
function priceLinks(t){const q=encodeURIComponent(t.destination),from=encodeURIComponent('Guntur'),dates=encodeURIComponent(t.start+' to '+t.end);const flights='https://www.google.com/travel/flights?q='+encodeURIComponent('Flights from '+decodeURIComponent(from)+' to '+t.destination+' '+t.start);const hotels='https://www.google.com/travel/hotels?q='+encodeURIComponent('Hotels in '+t.destination+' '+t.start+' '+t.end+' for '+t.people+' guests');const trains='https://www.google.com/search?q='+encodeURIComponent('train fares to '+t.destination+' for '+t.start);const buses='https://www.google.com/search?q='+encodeURIComponent('bus fares to '+t.destination+' for '+t.start);$('livePrices').className='';$('livePrices').innerHTML='<strong>🔎 Check current prices</strong><p>These links open external searches. Prices and availability are provided by those services, not fetched into WanderWise.</p><div class="actions"><a class="priceLink" target="_blank" rel="noopener noreferrer" href="'+flights+'">✈️ Search flights</a><a class="priceLink" target="_blank" rel="noopener noreferrer" href="'+hotels+'">🏨 Search hotels</a><a class="priceLink" target="_blank" rel="noopener noreferrer" href="'+trains+'">🚆 Search train fares</a><a class="priceLink" target="_blank" rel="noopener noreferrer" href="'+buses+'">🚌 Search bus fares</a></div><small>Food and activity amounts remain estimates. Confirm final prices with the provider before booking.</small>';}
function render(t){current=t;priceLinks(t);let remaining=t.budget-t.costs.total;$('subtitle').textContent=t.destination+' • '+t.days+' day(s) • '+t.people+' traveller(s)';let templates=[['Arrive and get oriented','Explore a nearby area','Enjoy a relaxed evening'],['Visit a local attraction','Try local food within budget','Explore a market or cultural area'],['Choose an activity based on interests','Keep time for rest and photos','Review spending'],['Explore a quieter neighbourhood','Visit one final highlight','Prepare for departure']];let interest=t.interests.length?t.interests:['local highlights'];$('itinerary').className='';$('itinerary').innerHTML=Array.from({length:t.days},(_,i)=>'<div class="day"><strong>Day '+(i+1)+' · '+new Date(new Date(t.start+'T00:00:00').getTime()+i*86400000).toLocaleDateString('en-IN',{day:'numeric',month:'short'})+'</strong><ul>'+templates[Math.min(i,3)].map(x=>'<li>'+x+'</li>').join('')+'<li>Focus: '+interest[i%interest.length]+'</li></ul></div>').join('');
$('budgetPanel').className='';$('budgetPanel').innerHTML='<div class="summary"><div>Estimated total<strong>'+money(t.costs.total)+'</strong></div><div>Remaining<strong style="color:'+(remaining<0?'var(--red)':'var(--green)')+'">'+money(remaining)+'</strong></div><div>Per traveller<strong>'+money(Math.round(t.costs.total/t.people))+'</strong></div></div><p>'+ (remaining<0?'⚠️ Estimate exceeds budget by '+money(-remaining):'✓ Estimate is within budget, with '+money(remaining)+' remaining')+'</p><div class="bar"><span style="width:'+Math.min(100,t.costs.total/t.budget*100)+'%;background:'+(remaining<0?'var(--red)':'var(--green)')+'"></span></div><strong>Estimated cost breakdown</strong>'+[['Transport',t.costs.transport],['Lodging',t.costs.lodging],['Food',t.costs.food],['Activities',t.costs.activities]].map(([k,v])=>'<div class="saved">'+k+' <strong style="float:right">'+money(v)+'</strong></div>').join('')+'<div class="actions"><button id="saveBtn" class="primary">Save trip</button><button id="editBtn">Edit trip</button></div>';
$('budgetDetails').classList.remove('hidden');$('budgetDetails').innerHTML='<strong>📊 More budget details</strong><div class="saved">Average per traveller<strong style="float:right">'+money(Math.round(t.costs.total/t.people))+'</strong></div><div class="saved">Average per traveller, per day<strong style="float:right">'+money(Math.round(t.costs.total/(t.people*t.days)))+'</strong></div><div class="saved">Transport per traveller<strong style="float:right">'+money(Math.round(t.costs.transport/t.people))+'</strong></div><div class="saved">Lodging per traveller<strong style="float:right">'+money(Math.round(t.costs.lodging/t.people))+'</strong></div><div class="saved">Food per traveller, per day<strong style="float:right">'+money(Math.round(t.costs.food/(t.people*t.days)))+'</strong></div><small>Destination-based planning estimate where the destination is in our curated list; otherwise a general estimate. Transport is a rough road-distance proxy from Guntur, not a live fare or route quote. All figures need confirmation before booking.</small>';
$('saveBtn').onclick=async()=>{if(!await upsertTrip(t))return;let all=trips(),i=all.findIndex(x=>x.id===t.id);if(i>=0)all[i]=t;else all.unshift(t);saveTrips(all);renderSaved();$('saveBtn').textContent='Saved ✓'};$('editBtn').onclick=()=>{window.scrollTo({top:0,behavior:'smooth'})};}
$('form').addEventListener('submit',e=>{e.preventDefault();try{$('error').classList.add('hidden');render(make())}catch(err){$('error').textContent=err.message;$('error').classList.remove('hidden')}});
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function renderSaved(){let all=trips();renderAnalytics();$('statTrips').textContent=all.length;$('statPeople').textContent=all.reduce((n,t)=>n+t.people,0);$('statWithin').textContent=all.length?all.filter(t=>t.costs.total<=t.budget).length+'/'+all.length:'—';if(!all.length){$('saved').className='empty';$('saved').textContent='No trips saved yet.';return}$('saved').className='';$('saved').innerHTML=all.map(t=>'<div class="saved"><strong>'+esc(t.destination)+'</strong><br><small>'+t.days+' day(s) · '+t.people+' traveller(s) · '+money(t.budget)+' budget</small><div class="actions"><button data-open="'+esc(t.id)+'">Open</button><button class="danger" data-delete="'+esc(t.id)+'">Delete</button></div></div>').join('');$('saved').querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{let t=all.find(x=>x.id===b.dataset.open);$('destination').value=t.destination;$('start').value=t.start;$('end').value=t.end;$('people').value=t.people;$('budget').value=t.budget;document.querySelectorAll('.chips input').forEach(x=>x.checked=t.interests.includes(x.value));document.querySelector('#appNav [data-view="plan"]')?.click();render(t);window.scrollTo({top:0,behavior:'smooth'})});$('saved').querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(confirm('Delete this saved trip?')){void deleteTripFromDb(b.dataset.delete).then(ok=>{if(ok){saveTrips(trips().filter(x=>x.id!==b.dataset.delete));renderSaved()}})}})}
$('form').addEventListener('reset',()=>setTimeout(()=>{$('error').classList.add('hidden');current=null},0));
function setupWorkspace(){
 const main=document.querySelector('main');
 const hero=main.querySelector('.hero'),dash=main.querySelector('#dashboard'),stats=main.querySelector('.stats');
 const layout=main.querySelector('.layout'),left=layout?.querySelector(':scope > section');
 const stayCard=main.querySelector('#stays')?.closest('.card');
 const expenseCard=main.querySelector('#expenseTracker');
 const budgetCard=main.querySelector('#budgetPanel')?.closest('.card');
 const savedCard=main.querySelector('#savedTripsCard');
 const analytics=main.querySelector('#dashboardAnalytics');
 const footer=main.querySelector('.footer');
 if(!hero||!dash||!stats||!analytics||!left||!stayCard||!expenseCard||!budgetCard||!savedCard)return;
 const workspace=document.createElement('div');workspace.className='workspace';workspace.id='workspace';
 const panels={};
 [['dashboard','Dashboard'],['plan','Plan Trip'],['stays-view','Hotels & Stays'],['expenses-view','Expenses & Payments'],['saved-view','Saved Trips'],['discover-view','Discover Places'],['for-you','For You']].forEach(([id,title])=>{const p=document.createElement('section');p.className='view-panel'+(id==='dashboard'?' active':'');p.id='view-'+id;p.setAttribute('aria-label',title);panels[id]=p;workspace.appendChild(p)});
 const nav=main.querySelector('#appNav');
 if(!nav){console.error('WanderWise: navigation was not found.');return}
 nav.after(workspace);
 hero.remove();dash.remove();stats.remove();analytics.remove();left.remove();stayCard.remove();expenseCard.remove();budgetCard.remove();savedCard.remove();
 panels.dashboard.append(hero,dash,stats,analytics);
 const discoverPreview=document.createElement('section');discoverPreview.className='card';discoverPreview.innerHTML='<p class="eyebrow">SMART TRAVEL PICKS</p><h2>Discover places within your budget</h2><p class="sub">Explore destinations across India, compare rough origin-aware trip costs, and find an option that suits your plans.</p><div class="actions"><button type="button" class="primary" id="openDiscoverFromDashboard">Explore destinations ✨</button></div>';panels.dashboard.append(discoverPreview);
 const planLayout=document.createElement('div');planLayout.className='layout';planLayout.append(left);panels.plan.append(planLayout,budgetCard);
 panels['stays-view'].append(stayCard);
 panels['expenses-view'].append(expenseCard);
 panels['saved-view'].append(savedCard);
 const discover=panels['discover-view'];
 const forYou=document.createElement('section');forYou.className='card forYouPanel';forYou.innerHTML='<div class="forYouHero"><p class="eyebrow">MADE AROUND YOU</p><h1>Find your kind of getaway.</h1><p>Tell us what matters to you. WanderWise will rank destinations using your preferences and estimated trip costs.</p></div><form id="forYouForm" class="discoverForm forYouForm"><div><label for="fyBudget">Total budget (₹)</label><input id="fyBudget" type="number" min="500" step="500" value="10000" required></div><div><label for="fyStart">Starting city</label><input id="fyStart" list="originOptions" value="Guntur" placeholder="e.g. Guntur"></div><div><label for="fyPeople">Travellers</label><input id="fyPeople" type="number" min="1" max="20" value="2" required></div><div><label for="fyDays">Trip duration (days)</label><input id="fyDays" type="number" min="1" max="30" value="2" required></div><div><label for="fyStyle">Your travel vibe</label><select id="fyStyle"><option value="Any">A bit of everything</option><option>Nature</option><option>Beach</option><option>Culture</option><option>Adventure</option><option>Spiritual</option><option>City</option></select></div><div><label for="fyTransport">Transport style</label><select id="fyTransport"><option value="shared">Budget-friendly</option><option value="flex">Flexible</option><option value="own">Own vehicle</option></select></div><div><label for="fyStay">Stay preference</label><select id="fyStay"><option value="budget">Budget stay</option><option value="comfort">More comfort</option><option value="none">No stay needed</option></select></div><div class="forYouSubmit"><button class="primary" type="submit">✨ Find my matches</button></div></form><p id="forYouSummary" class="sub">Your matches will be ranked by travel style and estimated affordability.</p><div id="forYouResults" class="discoverResults"></div><p class="discoverDisclaimer">Recommendations use the app’s destination data and approximate cost estimates. They are not live prices or availability guarantees.</p>';
 panels['for-you'].append(forYou);
 discover.innerHTML=`<div class="discoverIntro"><p class="eyebrow">SMART BUDGET DISCOVERY</p><h1>Find a trip that fits your budget.</h1><p>Tell WanderWise what you can spend, how long you have, and what you love. Explore Indian destinations first, with rough cost estimates to help compare options.</p></div>
 
 <section class="card"><h2>Build your travel shortlist</h2><p class="sub">Change any field to discover destinations that fit your plans.</p><form id="discoverForm" class="discoverForm">
 <div><label for="discStart">Starting city</label><input id="discStart" value="Guntur, Andhra Pradesh" maxlength="100" required></div>
 <div><label for="discBudget">Total budget (₹)</label><input id="discBudget" type="number" min="500" step="100" value="5000" required></div>
 <div><label for="discPeople">Travellers</label><input id="discPeople" type="number" min="1" max="20" step="1" value="2" required></div>
 <div><label for="discDays">Trip length</label><select id="discDays"><option value="1">1 day</option><option value="2" selected>2 days</option><option value="3">3 days</option><option value="4">4 days</option><option value="5">5 days</option><option value="7">7 days</option></select></div>
 <div><label for="discStyle">Travel style</label><select id="discStyle"><option value="Any">Anything</option><option>Nature</option><option>Beach</option><option>Culture</option><option>Adventure</option><option>Spiritual</option><option>City</option></select></div>
 <div><label for="discTransport">Transport</label><select id="discTransport"><option value="public">Bus / train estimate</option><option value="own">Own vehicle estimate</option><option value="flex">Flexible</option></select></div>
 <div><label for="discStay">Stay preference</label><select id="discStay"><option value="budget">Budget stay</option><option value="none">No overnight stay</option><option value="comfort">Comfort stay</option></select></div>
 <div><button class="primary" type="submit" style="width:100%">Find my destinations ✨</button></div></form></section>
 <div class="card"><h2 id="discoverHeading">Destinations picked for you</h2><p class="sub">Choose a card to add that destination to your trip planner.</p><div id="discoverResults" class="discoverResults" aria-live="polite"></div><p class="discoverDisclaimer">Planning estimates only, not live quotes. Transport estimates use approximate straight-line distance from the starting city and broad per-kilometre assumptions, not actual routes or live fares. If your city is not recognised, Guntur is used as the estimate origin. Verify transport, tickets and accommodation prices before booking.</p></div>`;
 const discoverPlaces=[
 {name:'Vijayawada & Bhavani Island',style:'Nature',region:'Andhra Pradesh',tag:'River views',lat:16.5062,lon:80.6480,stay:700,food:450,activities:300,desc:'Krishna River scenery, island activities and city food.'},
 {name:'Amaravati',style:'Culture',region:'Andhra Pradesh',tag:'Heritage',lat:16.5745,lon:80.3575,stay:600,food:400,activities:250,desc:'Buddhist heritage and a relaxed cultural day out.'},
 {name:'Suryalanka Beach',style:'Beach',region:'Andhra Pradesh',tag:'Coastal break',lat:15.8650,lon:80.5110,stay:900,food:500,activities:250,desc:'A coastal getaway with time for the shoreline and local food.'},
 {name:'Araku Valley',style:'Nature',region:'Andhra Pradesh',tag:'Hills & greenery',lat:18.3273,lon:82.8775,stay:1100,food:600,activities:500,desc:'Green valleys, viewpoints and coffee-country scenery.'},
 {name:'Visakhapatnam',style:'Beach',region:'Andhra Pradesh',tag:'Beach & city',lat:17.6868,lon:83.2185,stay:1200,food:650,activities:500,desc:'Beachfront spots, viewpoints and city attractions.'},
 {name:'Tirupati',style:'Spiritual',region:'Andhra Pradesh',tag:'Spiritual visit',lat:13.6288,lon:79.4192,stay:900,food:500,activities:300,desc:'Temple visit and nearby cultural attractions.'},
 {name:'Hyderabad',style:'City',region:'Telangana',tag:'Food & culture',lat:17.3850,lon:78.4867,stay:1200,food:700,activities:500,desc:'Historic landmarks, markets and well-known local food.'},
 {name:'Hampi',style:'Culture',region:'Karnataka',tag:'Historic ruins',lat:15.3350,lon:76.4600,stay:1100,food:600,activities:500,desc:'Distinctive historic landscapes and architecture.'},
 {name:'Mysuru',style:'Culture',region:'Karnataka',tag:'Palaces & gardens',lat:12.2958,lon:76.6394,stay:1300,food:650,activities:500,desc:'Palace architecture, gardens and local culture.'},
 {name:'Pondicherry',style:'Beach',region:'Puducherry',tag:'Coastal town',lat:11.9416,lon:79.8083,stay:1400,food:750,activities:500,desc:'Coastal promenades, colourful streets and cafés.'},
 {name:'Chennai',style:'City',region:'Tamil Nadu',tag:'City & coastline',lat:13.0827,lon:80.2707,stay:1300,food:700,activities:500,desc:'Marina Beach, museums, neighbourhoods and South Indian food.'},
 {name:'Madurai',style:'Spiritual',region:'Tamil Nadu',tag:'Temple heritage',lat:9.9252,lon:78.1198,stay:900,food:500,activities:350,desc:'Historic temple architecture, markets and local cuisine.'},
 {name:'Munnar',style:'Nature',region:'Kerala',tag:'Tea hills',lat:10.0889,lon:77.0595,stay:1500,food:650,activities:550,desc:'Tea gardens, misty hills and scenic viewpoints.'},
 {name:'Alappuzha',style:'Nature',region:'Kerala',tag:'Backwaters',lat:9.4981,lon:76.3388,stay:1300,food:650,activities:600,desc:'Backwaters, canals and coastal scenery.'},
 {name:'Goa',style:'Beach',region:'Goa',tag:'Beaches & culture',lat:15.2993,lon:74.1240,stay:1600,food:800,activities:700,desc:'Beaches, heritage neighbourhoods and local markets.'},
 {name:'Mumbai',style:'City',region:'Maharashtra',tag:'Big-city escape',lat:19.0760,lon:72.8777,stay:1900,food:900,activities:700,desc:'Waterfront landmarks, museums, markets and city life.'},
 {name:'Pune',style:'City',region:'Maharashtra',tag:'City & forts',lat:18.5204,lon:73.8567,stay:1300,food:700,activities:500,desc:'Urban culture, nearby forts and food spots.'},
 {name:'Jaipur',style:'Culture',region:'Rajasthan',tag:'Palaces & forts',lat:26.9124,lon:75.7873,stay:1300,food:650,activities:650,desc:'Pink City streets, forts, palaces and traditional markets.'},
 {name:'Udaipur',style:'Culture',region:'Rajasthan',tag:'Lakes & palaces',lat:24.5854,lon:73.7125,stay:1500,food:700,activities:650,desc:'Lake views, historic palaces and old-city lanes.'},
 {name:'Delhi',style:'Culture',region:'Delhi',tag:'Capital highlights',lat:28.6139,lon:77.2090,stay:1500,food:800,activities:650,desc:'Historic monuments, museums, markets and varied food.'},
 {name:'Agra',style:'Culture',region:'Uttar Pradesh',tag:'World heritage',lat:27.1767,lon:78.0081,stay:1200,food:600,activities:650,desc:'The Taj Mahal area, Mughal architecture and historic sites.'},
 {name:'Varanasi',style:'Spiritual',region:'Uttar Pradesh',tag:'River & heritage',lat:25.3176,lon:82.9739,stay:1000,food:550,activities:500,desc:'Ganga ghats, historic lanes and cultural experiences.'},
 {name:'Rishikesh',style:'Adventure',region:'Uttarakhand',tag:'River & adventure',lat:30.0869,lon:78.2676,stay:1500,food:800,activities:900,desc:'River scenery and adventure activities; long-distance travel can raise costs.'},
 {name:'Shimla',style:'Nature',region:'Himachal Pradesh',tag:'Mountain views',lat:31.1048,lon:77.1734,stay:1700,food:750,activities:650,desc:'Mountain scenery, walking streets and colonial-era architecture.'},
 {name:'Manali',style:'Adventure',region:'Himachal Pradesh',tag:'Himalayan escape',lat:32.2432,lon:77.1892,stay:1700,food:800,activities:900,desc:'Mountain views, outdoor activities and valley scenery.'},
 {name:'Srinagar',style:'Nature',region:'Jammu & Kashmir',tag:'Lakes & mountains',lat:34.0837,lon:74.7973,stay:1900,food:800,activities:900,desc:'Lake views, gardens and Himalayan landscapes.'},
 {name:'Kolkata',style:'Culture',region:'West Bengal',tag:'Culture & food',lat:22.5726,lon:88.3639,stay:1100,food:600,activities:450,desc:'Museums, colonial-era landmarks, markets and Bengali food.'},
 {name:'Darjeeling',style:'Nature',region:'West Bengal',tag:'Tea & mountains',lat:27.0410,lon:88.2663,stay:1500,food:700,activities:650,desc:'Tea gardens, mountain views and heritage rail experiences.'},
 {name:'Shillong',style:'Nature',region:'Meghalaya',tag:'Waterfalls & hills',lat:25.5788,lon:91.8933,stay:1400,food:650,activities:650,desc:'Green hills, waterfalls and scenic drives.'},
 {name:'Kaziranga',style:'Adventure',region:'Assam',tag:'Wildlife & nature',lat:26.5775,lon:93.1711,stay:1600,food:700,activities:1000,desc:'Wildlife and nature experiences; check seasonal access and permits.'},
 {name:'Puri',style:'Spiritual',region:'Odisha',tag:'Temple & beach',lat:19.8135,lon:85.8312,stay:1000,food:550,activities:400,desc:'Coastal scenery, temple heritage and local food.'},
 {name:'Bengaluru',style:'City',region:'Karnataka',tag:'City & gardens',lat:12.9716,lon:77.5946,stay:1500,food:800,activities:600,desc:'Gardens, museums, food streets and city attractions.'},
 {name:'Amritsar',style:'Spiritual',region:'Punjab',tag:'Heritage & food',lat:31.6340,lon:74.8723,stay:1100,food:600,activities:450,desc:'Golden Temple, historic sites and Punjabi cuisine.'},
 {name:'Guwahati',style:'Culture',region:'Assam',tag:'Gateway to the Northeast',lat:26.1445,lon:91.7362,stay:1200,food:600,activities:500,desc:'River views, temples and access to Northeast India.'}
 ];

 const originCities={'guntur':[16.3067,80.4365],'vijayawada':[16.5062,80.6480],'amaravati':[16.5745,80.3575],'hyderabad':[17.3850,78.4867],'visakhapatnam':[17.6868,83.2185],'vizag':[17.6868,83.2185],'chennai':[13.0827,80.2707],'bengaluru':[12.9716,77.5946],'bangalore':[12.9716,77.5946],'mumbai':[19.0760,72.8777],'pune':[18.5204,73.8567],'delhi':[28.6139,77.2090],'new delhi':[28.6139,77.2090],'kolkata':[22.5726,88.3639],'kochi':[9.9312,76.2673],'thiruvananthapuram':[8.5241,76.9366],'jaipur':[26.9124,75.7873],'lucknow':[26.8467,80.9462],'ahmedabad':[23.0225,72.5714],'patna':[25.5941,85.1376],'bhubaneswar':[20.2961,85.8245],'ranchi':[23.3441,85.3096],'guwahati':[26.1445,91.7362],'chandigarh':[30.7333,76.7794],'srinagar':[34.0837,74.7973],'dehradun':[30.3165,78.0322],'coimbatore':[11.0168,76.9558],'madurai':[9.9252,78.1198],'tirupati':[13.6288,79.4192]};
 function discoverDistanceKm(a,b){const rad=x=>x*Math.PI/180,lat1=rad(a[0]),lat2=rad(b[0]),dLat=rad(b[0]-a[0]),dLon=rad(b[1]-a[1]);const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)))}
 window.wanderWiseDiscoverPlaces=discoverPlaces;
 window.wanderWiseAppNav=nav;
 function discoverEstimate(place,people,days,transport,stay){
  const originText=$('discStart').value.trim().toLowerCase(),origin=originCities[originText]||[16.3067,80.4365],distance=discoverDistanceKm(origin,[place.lat,place.lon]);
  const perPersonRate=transport==='own'?2.6:transport==='flex'?2.2:1.6;
  const travel=Math.round(Math.max(180,distance*2*perPersonRate)*(transport==='own'?1:people));
  const nights=stay==='none'?0:Math.max(0,days-1);
  const stayRate=stay==='none'?0:stay==='comfort'?1.65:1;
  const lodging=Math.round(place.stay*nights*people/2*stayRate);
  const food=Math.round(place.food*people*days);
  const activities=Math.round(place.activities*people*days);
  const total=travel+lodging+food+activities;
  return {travel,lodging,food,activities,total};
 }
 window.wanderWiseRenderDiscover=renderDiscover;
 function renderDiscover(){
  const budget=Number($('discBudget').value),people=Number($('discPeople').value),days=Number($('discDays').value),style=$('discStyle').value,transport=$('discTransport').value,stay=$('discStay').value;
  const results=$('discoverResults');$('discoverHeading').textContent='Destinations for '+money(budget)+' · '+days+' day'+(days===1?'':'s');
  if(!Number.isFinite(budget)||budget<500||!Number.isInteger(people)||people<1||people>20){results.innerHTML='<div class="discoverEmpty">Enter a budget of at least ₹500 and 1–20 travellers to see recommendations.</div>';return}
  const items=discoverPlaces.filter(p=>style==='Any'||p.style===style).map(p=>({place:p,cost:discoverEstimate(p,people,days,transport,stay)})).sort((a,b)=>a.cost.total-b.cost.total);
  const fitting=items.filter(x=>x.cost.total<=budget),shown=fitting.length?fitting:items.slice(0,4);
  if(!shown.length){results.innerHTML='<div class="discoverEmpty">No matches for these filters yet. Try “Anything” or increase the budget.</div>';return}
  results.innerHTML=shown.map(({place:p,cost:c})=>{const fit=c.total<=budget,remaining=budget-c.total;const visualEmoji={Nature:'🌿',Beach:'🏝️',Culture:'🏛️',Adventure:'⛰️',Spiritual:'🛕',City:'🌆'}[p.style]||'✈️';const destinationPhotos={'Araku Valley':'photo-1473448912268-2022ce9509d8','Goa':'photo-1507525428034-b723cf961d3e','Jaipur':'photo-1599661046827-dacff0c0f09a','Munnar':'photo-1593693411515-c20261bcad6e','Gokarna':'photo-1519046904884-53103b34b206','Amaravati':'photo-1606293926075-69a00dbancb3','Amaravathi':'photo-1606293926075-69a00dbancb3','Hampi':'photo-1600100397608-f010f7b1f6f4','Mysuru':'photo-1600112356915-089afb8fccd9','Pondicherry':'photo-1582510003544-4d00b7f74220','Chennai':'photo-1504350558248-9e6a5e9c8f9e','Madurai':'photo-1609766857041-ed402ea8069a','Alappuzha':'photo-1602216056096-3b40cc0c9944','Mumbai':'photo-1570168007204-dfb528c6958f','Udaipur':'photo-1606293926075-69a00dbancb3','Delhi':'photo-1587474260584-136574528ed5','Agra':'photo-1564507592333-c60657eea523','Varanasi':'photo-1561361513-2d000a50f0dc','Rishikesh':'photo-1500530855697-b586d89ba3ee','Shimla':'photo-1626621341517-bbf3d9990a23','Manali':'photo-1626621341517-bbf3d9990a23','Srinagar':'photo-1566837497312-7be7830ae9b1','Darjeeling':'photo-1544735716-392fe2489ffa','Shillong':'photo-1473448912268-2022ce9509d8','Puri':'photo-1519046904884-53103b34b206'};const photo=destinationPhotos[p.name]||({'Nature':'photo-1473448912268-2022ce9509d8','Beach':'photo-1507525428034-b723cf961d3e','Culture':'photo-1599661046827-dacff0c0f09a','Adventure':'photo-1464822759023-fed622ff2c3b','Spiritual':'photo-1606293926075-69a00dbancb3','City':'photo-1519501025264-65ba15a82390'}[p.style]||'photo-1464822759023-fed622ff2c3b');return '<article class="destinationCard"><div class="destinationVisual visual-'+esc(p.style.toLowerCase())+'" style="background-image:linear-gradient(180deg,transparent 35%,rgba(3,19,29,.68)),url(https://images.unsplash.com/'+photo+'?auto=format&fit=crop&w=900&q=82);background-size:cover;background-position:center"><span class="visualEmoji">'+visualEmoji+'</span><span class="visualLabel">'+esc(p.region)+' · Explore</span></div><div class="destinationContent"><span class="destBadge">'+(fit?'Within budget':'Budget stretch')+'</span> <span class="destBadge">'+esc(p.tag)+'</span><h3>'+esc(p.name)+'</h3><p>'+esc(p.region)+' · '+esc(p.style)+'</p><p>'+esc(p.desc)+'</p><div class="destCost">'+money(c.total)+'</div><p>Estimated total for '+people+' traveller'+(people===1?'':'s')+' · '+days+' day'+(days===1?'':'s')+'</p><div class="destBreakdown"><div><span>Transport</span><br><b>'+money(c.travel)+'</b></div><div><span>Stay</span><br><b>'+money(c.lodging)+'</b></div><div><span>Food</span><br><b>'+money(c.food)+'</b></div><div><span>Activities</span><br><b>'+money(c.activities)+'</b></div></div><p><strong>'+(fit?'Budget left: '+money(remaining):'Over budget by: '+money(-remaining))+'</strong></p><div class="destActions"><button type="button" class="primary" data-plan-destination="'+esc(p.name)+'">Plan this trip</button><button type="button" data-destination-info="'+esc(p.name)+'">Search details ↗</button></div></div></article>'}).join('');
  results.querySelectorAll('[data-plan-destination]').forEach(b=>b.addEventListener('click',()=>{const p=discoverPlaces.find(x=>x.name===b.dataset.planDestination);$('destination').value=p.name;$('people').value=people;$('budget').value=budget;const now=new Date(),startDate=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10),endDate=new Date(now.getTime()-now.getTimezoneOffset()*60000+((days-1)*86400000)).toISOString().slice(0,10);$('start').value=startDate;$('end').value=endDate;const activateLink=nav.querySelector('[data-view="plan"]');activateLink.click();}));
  results.querySelectorAll('[data-destination-info]').forEach(b=>b.addEventListener('click',()=>{const p=discoverPlaces.find(x=>x.name===b.dataset.destinationInfo);window.open('https://www.google.com/search?q='+encodeURIComponent(p.name+' tourism official travel information'),'_blank','noopener,noreferrer')}));
 }
 $('discoverForm').addEventListener('submit',e=>{e.preventDefault();renderDiscover()});
 ['discStart','discBudget','discPeople','discDays','discStyle','discTransport','discStay'].forEach(id=>$(id).addEventListener('change',renderDiscover));
 renderDiscover();

 $('openDiscoverFromDashboard').addEventListener('click',()=>nav.querySelector('[data-view="discover-view"]')?.click());
 function activate(id,updateHash=true){if(!panels[id])id='dashboard';Object.entries(panels).forEach(([key,p])=>p.classList.toggle('active',key===id));nav.querySelectorAll('[data-view]').forEach(a=>{if(a.dataset.view===id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});if(updateHash)history.replaceState(null,'','#'+id);window.scrollTo({top:0,behavior:'auto'});}
 nav.querySelectorAll('[data-view]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();activate(a.dataset.view)}));
 window.addEventListener('hashchange',()=>activate(location.hash.slice(1),false));
 const requested=location.hash.slice(1);activate(panels[requested]?requested:'dashboard',false);
}
setupWorkspace();
function renderForYou(e){
 if(e)e.preventDefault();
 const budget=Number($('fyBudget').value),people=Number($('fyPeople').value),days=Number($('fyDays').value);
 if(!Number.isFinite(budget)||budget<500||!Number.isInteger(people)||people<1||people>20||!Number.isInteger(days)||days<1||days>30){
  $('forYouSummary').textContent='Please enter a budget of at least ₹500, 1–20 travellers, and 1–30 days.';
  $('forYouResults').innerHTML='';return;
 }
 $('discStart').value=$('fyStart').value;
 $('discBudget').value=budget;$('discPeople').value=people;
 $('discDays').innerHTML=Array.from({length:30},(_,i)=>{const n=i+1;return '<option value="'+n+'">'+n+' day'+(n===1?'':'s')+'</option>'}).join('');
 $('discDays').value=String(days);$('discStyle').value=$('fyStyle').value;
 $('discTransport').value=$('fyTransport').value==='shared'?'public':$('fyTransport').value;
 $('discStay').value=$('fyStay').value;
 window.wanderWiseRenderDiscover();
 const source=$('discoverResults');
 const cards=[...source.querySelectorAll('.destinationCard')];
 const vibe=$('fyStyle').value;
 cards.sort((a,b)=>{
  const score=el=>(el.querySelector('.destBadge')?.textContent==='Within budget'?100:0)+
   (vibe!=='Any'&&el.querySelector('.destinationContent p')?.textContent.includes(vibe)?30:0);
  return score(b)-score(a);
 });
 const chosen=cards.slice(0,6);
 $('forYouResults').innerHTML=chosen.map(c=>c.outerHTML).join('')||'<div class="discoverEmpty">No matches found. Try a different travel vibe or increase your budget.</div>';
 $('forYouSummary').textContent='Showing '+chosen.length+' personalised match(es) for '+people+' traveller(s), '+days+' day(s), and a '+money(budget)+' budget. Matches are prioritised by affordability and your selected travel vibe.';
 $('forYouResults').querySelectorAll('[data-plan-destination]').forEach(b=>b.addEventListener('click',()=>{
  const p=window.wanderWiseDiscoverPlaces?.find(x=>x.name===b.dataset.planDestination);if(!p)return;
  $('destination').value=p.name;$('people').value=people;$('budget').value=budget;
  const now=new Date(),today=new Date(now.getTime()-now.getTimezoneOffset()*60000);
  $('start').value=today.toISOString().slice(0,10);
  $('end').value=new Date(today.getTime()+((days-1)*86400000)).toISOString().slice(0,10);
  window.wanderWiseAppNav?.querySelector('[data-view="plan"]')?.click();
 }));
 $('forYouResults').querySelectorAll('[data-destination-info]').forEach(b=>b.addEventListener('click',()=>{
  window.open('https://www.google.com/search?q='+encodeURIComponent(b.dataset.destinationInfo+' tourism official travel information'),'_blank','noopener,noreferrer');
 }));
}
$('forYouForm').addEventListener('submit',renderForYou);renderForYou();
renderSaved();renderExpenses();renderAnalytics();renderHotelHistory();

/* Accessible theme toggle with preference persistence */
(function(){
 const topbar=document.querySelector('.topbar');
 if(!topbar||document.querySelector('.themeToggle'))return;
 const button=document.createElement('button');
 button.type='button';button.className='themeToggle';button.setAttribute('aria-label','Toggle dark mode');
 const saved=localStorage.getItem('wanderwise-theme');
 if(saved==='dark')document.body.classList.add('dark-mode');
 const paint=()=>{const dark=document.body.classList.contains('dark-mode');button.textContent=dark?'☀️ Light mode':'🌙 Dark mode';button.setAttribute('aria-pressed',String(dark));};
 button.addEventListener('click',()=>{document.body.classList.toggle('dark-mode');localStorage.setItem('wanderwise-theme',document.body.classList.contains('dark-mode')?'dark':'light');paint();});
 topbar.appendChild(button);paint();
})();


/* Profile editor handlers */
(function(){
 const $=id=>document.getElementById(id),overlay=$('profileOverlay');
 // Keep both modals at the body root, outside header and hero stacking contexts.
 document.body.appendChild(overlay);document.body.appendChild($('authOverlay'));
 if(!overlay||overlay.dataset.initialized==='true')return;overlay.dataset.initialized='true';
 const key=()=> 'wanderwise-profile:'+(window.wwSession?.user?.id||window.wwSession?.user?.email||'guest');
 function profile(){const meta=window.wwSession?.user?.user_metadata||{};let local={};try{local=JSON.parse(localStorage.getItem(key())||'{}')}catch{}return {name:meta.full_name||meta.name||local.name||'',username:meta.username||local.username||''}}
 function paint(){const p=profile(),user=window.wwSession?.user;const edit=$('profileOpen'),logout=$('authLogout'),status=$('authStatus');edit.classList.toggle('hidden',!user);logout.classList.toggle('hidden',!user);if(user){const next=(p.name||user.email||'Signed in')+(p.username?' · @'+p.username:'');if(status.textContent!==next)status.textContent=next;status.title=next;}}
 function open(){const p=profile();$('profileName').value=p.name;$('profileUsername').value=p.username;$('profileMessage').textContent='';overlay.classList.add('open');$('profileName').focus()}
 function close(){overlay.classList.remove('open')}
 $('profileOpen').addEventListener('click',open);$('profileClose').addEventListener('click',close);$('profileCancel').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
 $('profileForm').addEventListener('submit',async e=>{e.preventDefault();const name=$('profileName').value.trim(),username=$('profileUsername').value.trim().replace(/^@/,'');const msg=$('profileMessage'),save=$('profileSave');if(!name||!/^[A-Za-z0-9_]{3,24}$/.test(username)){msg.textContent='Enter a display name and a username with 3–24 letters, numbers or underscores.';return}save.disabled=true;msg.textContent='Saving your profile…';try{const user=window.wwSession?.user,client=window.wwClient;if(user&&client){const {error}=await client.auth.updateUser({data:{full_name:name,username}});if(error)throw error}localStorage.setItem(key(),JSON.stringify({name,username}));paint();msg.textContent='Profile saved ✓';setTimeout(close,650)}catch(err){msg.textContent='Could not save your profile: '+(err.message||'Please try again.')}finally{save.disabled=false}});
 new MutationObserver(paint).observe($('authStatus'),{childList:true,subtree:true,characterData:true});paint();window.addEventListener('storage',paint);
})();


/* Quick tool actions: Surprise me, Budget assistant, Mini itinerary builder */
(function(){
 const $=id=>document.getElementById(id);
 const money=n=>'₹'+Math.round(n).toLocaleString('en-IN');
 const places=()=>window.wanderWiseDiscoverPlaces||[];
 $('surpriseBtn')?.addEventListener('click',()=>{
  const box=$('surpriseResult'),budget=Number($('surpriseBudget').value),days=Number($('surpriseDays').value),mood=$('surpriseMood').value;
  if(!Number.isFinite(budget)||budget<500){box.textContent='Please enter a budget of at least ₹500.';return}
  let pool=places().filter(p=>mood==='Any'||p.style===mood);
  if(!pool.length){box.textContent='No destination matches that mood yet. Try Any.';return}
  const place=pool[Math.floor(Math.random()*pool.length)];
  const rough=place.food*2*days+place.activities*2*days+place.stay*Math.max(0,days-1)+500;
  box.innerHTML='<strong>'+place.name+'</strong><p>'+place.desc+'</p><p>Rough starting estimate for 2 people: <strong>'+money(rough)+'</strong> for '+days+' day(s).</p><p>'+(rough<=budget?'This may fit your budget based on a rough estimate.':'This may exceed your budget. Try a closer destination or a higher budget.')+'</p><button type="button" class="primary" id="surprisePlanIt">Plan this destination</button>';
  $('surprisePlanIt').addEventListener('click',()=>{
   $('destination').value=place.name;$('people').value=2;$('budget').value=budget;
   const today=new Date();today.setHours(0,0,0,0);const end=new Date(today);end.setDate(end.getDate()+days-1);
   const fmt=d=>{const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)};
   $('start').value=fmt(today);$('end').value=fmt(end);window.wanderWiseAppNav?.querySelector('[data-view="plan"]')?.click();
  });
 });
 $('budgetAssistBtn')?.addEventListener('click',()=>{
  const total=Number($('budgetAssistTotal').value),people=Number($('budgetAssistPeople').value),days=Number($('budgetAssistDays').value),box=$('budgetAssistResult');
  if(!Number.isFinite(total)||total<500||!Number.isInteger(people)||people<1||people>20||!Number.isInteger(days)||days<1||days>30){box.textContent='Enter a budget of at least ₹500, 1–20 travellers, and 1–30 days.';return}
  const parts=[['Transport',.35],['Stay',.25],['Food',.25],['Activities & buffer',.15]];
  box.innerHTML='<p>Suggested starting split for '+people+' traveller(s), '+days+' day(s):</p>'+parts.map(([label,rate])=>'<div class="expenseRow"><span>'+label+'</span><strong>'+money(total*rate)+'</strong></div>').join('')+'<p><strong>Total: '+money(total)+'</strong></p><small>Planning guide only. Adjust these amounts for your destination and actual prices.</small>';
 });
 $('miniPlanBtn')?.addEventListener('click',()=>{
  const destination=$('miniDestination').value.trim(),days=Number($('miniDays').value),box=$('miniPlanResult');
  if(!destination){box.textContent='Enter a destination first, for example Araku Valley.';$('miniDestination').focus();return}
  const templates=[['Morning','Arrive, have breakfast, and visit a popular local attraction.'],['Afternoon','Have lunch and explore a nearby viewpoint, museum, market, or nature spot.'],['Evening','Enjoy a relaxed walk, take photos, and find a local dinner spot.']];
  box.innerHTML='<strong>'+esc(destination)+' · '+days+' day(s)</strong>'+Array.from({length:days},(_,i)=>'<div class="saved"><strong>Day '+(i+1)+'</strong>'+templates.map(([time,task])=>'<p><b>'+time+':</b> '+task+'</p>').join('')+'</div>').join('')+'<small>Starter itinerary only. Check opening hours, travel times, and local conditions before your trip.</small>';
 });
})();
