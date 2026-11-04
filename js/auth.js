(() => {
 const SUPABASE_URL = 'https://hmjtzyakidwtkzhhbgzd.supabase.co';
 const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3dsWrDTOtIz6eWi_ndF4Qw_GJIUY8o6';
 const $ = id => document.getElementById(id);
 const overlay=$('authOverlay'), message=$('authMessage');
 let client=null, mode='signin'; let syncStarted=false;
 function say(text){message.textContent=text}
 function setMode(next){mode=next;$('authTitle').textContent=next==='signup'?'Create your WanderWise account':next==='recovery'?'Set a new password':'Welcome back';$('authSubmit').textContent=next==='signup'?'Create account':next==='recovery'?'Update password':'Sign in';$('authPassword').autocomplete=next==='signup'||next==='recovery'?'new-password':'current-password';$('authReset').classList.toggle('hidden',next!=='signin');say(next==='signup'?'Use an email address you can access. Supabase may send a confirmation email.':next==='recovery'?'Choose a new password for your account.':'Sign in with your email and password, or choose Google.')}
 function show(){overlay.classList.add('open');setMode('signin');$('authEmail').focus()}
 function hide(){overlay.classList.remove('open')}
 function status(session){const user=session?.user;$('authStatus').textContent=user?(user.email||'Signed in'):'Not signed in';$('authOpen').textContent=user?'Account':'Sign in / Create account';$('authLogout').classList.toggle('hidden',!user);if(user){hide();say('Signed in successfully.')} if(client) window.wwClient=client; window.wwSession=session||null; if(client && typeof window.syncAccountData==='function') void window.syncAccountData(session||null); }
 async function init(){
   if(!window.supabase){say('Authentication library did not load. Refresh and try again.');return}
   client=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);
   const {data:{session},error}=await client.auth.getSession();if(error)say(error.message);status(session);
   client.auth.onAuthStateChange((event,newSession)=>{status(newSession);if(event==='PASSWORD_RECOVERY'){overlay.classList.add('open');setMode('recovery');say('Choose a new password for your account.')}});
 }
 $('authOpen').addEventListener('click',()=>{if($('authOpen').textContent==='Account'){show()}else show()});
 $('authClose').addEventListener('click',hide);
 overlay.addEventListener('click',e=>{if(e.target===overlay)hide()});
 $('authSignup').addEventListener('click',()=>setMode('signup'));
 $('authForm').addEventListener('submit',async e=>{e.preventDefault();if(!client){say('Please wait for authentication to initialize, then try again.');return}
 const email=$('authEmail').value.trim(),password=$('authPassword').value;
 $('authSubmit').disabled=true;
 try{
  if(mode==='signup'){const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;say(data.session?'Account created and signed in.':'Account created. Check your email for a confirmation link, then return here to sign in.')}
  else if(mode==='recovery'){const {error}=await client.auth.updateUser({password});if(error)throw error;setMode('signin');$('authPassword').value='';say('Password updated successfully. You can now sign in with your new password.')}
  else {const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;say('Signed in successfully.')}
 }catch(err){say(err.message||'Authentication failed. Please try again.')}finally{$('authSubmit').disabled=false}
 });
 $('authReset').addEventListener('click',async()=>{if(!client){say('Please wait for authentication to initialize.');return}const email=$('authEmail').value.trim();if(!email){say('Enter your account email above first, then choose Forgot password again.');$('authEmail').focus();return}try{const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;say('If this email has a WanderWise account, a password-reset link will be sent. Check your inbox and spam folder.')}catch(err){say(err.message||'Could not request a password reset. Please try again.')}});
 $('authGoogle').addEventListener('click',async()=>{if(!client){say('Please wait for authentication to initialize.');return}try{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}});if(error)throw error}catch(err){say(err.message||'Google sign-in could not start. Check the Google provider settings in Supabase.') }});
 $('authLogout').addEventListener('click',async()=>{if(!client)return;const {error}=await client.auth.signOut();if(error)say(error.message);else{status(null);say('You have been signed out.')}});
 init();
})();
