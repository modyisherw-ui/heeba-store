/* HEEBA account/auth UI — Email OTP via SendGrid */
const HEEBA_AUTH = { API_BASE: '', stateKey: 'heebaAuth' };
const authState = JSON.parse(localStorage.getItem(HEEBA_AUTH.stateKey) || 'null');
const ownerRoles = ['owner','developer'];
function saveAuth(v){localStorage.setItem(HEEBA_AUTH.stateKey, JSON.stringify(v));}
function currentRole(){return (JSON.parse(localStorage.getItem(HEEBA_AUTH.stateKey)||'null')||{}).role||'customer'}
function syncAdminVisibility(){
  const link=document.getElementById('adminLink');
  if(link) link.hidden=!ownerRoles.includes(currentRole());
  const user=document.getElementById('adminUserName');
  if(user){const s=JSON.parse(localStorage.getItem(HEEBA_AUTH.stateKey)||'null'); user.textContent=s?.name||'مدير المتجر'}
}
function isValidEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}
async function requestOtp(email){
  const r=await fetch((HEEBA_AUTH.API_BASE||'')+'/api/auth/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
  if(!r.ok){const err=await r.json().catch(()=>({}));throw new Error(err.error||'OTP_SERVER')}return r.json();
}
async function verifyOtp(email,otp){
  const r=await fetch((HEEBA_AUTH.API_BASE||'')+'/api/auth/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,otp})});
  if(!r.ok) throw new Error('OTP_INVALID'); return r.json();
}
function initAuth(){
 const modal=document.getElementById('authModal'); if(!modal)return;
 const emailStep=document.getElementById('emailStep'), otpStep=document.getElementById('otpStep'), status=document.getElementById('authStatus');
 const emailInput=document.getElementById('emailInput'), otp=document.getElementById('otpInput'); let activeEmail='';
 const setStatus=(t,bad=false)=>{status.textContent=t;status.className='auth-status '+(bad?'bad':'ok')};
 document.getElementById('accountBtn').onclick=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');emailInput.focus()};
 document.getElementById('closeAuth').onclick=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');setStatus('')};
 modal.addEventListener('click',e=>{if(e.target===modal)document.getElementById('closeAuth').click()});
 document.getElementById('sendOtp').onclick=async()=>{
   activeEmail=emailInput.value.trim().toLowerCase();if(!isValidEmail(activeEmail)){ setStatus('أدخل بريد إلكتروني صحيح.',true);return}
   const btn=document.getElementById('sendOtp'); btn.disabled=true; btn.textContent='جاري الإرسال…';
   try{await requestOtp(activeEmail); emailStep.hidden=true;otpStep.hidden=false;document.getElementById('authTitle').textContent='رمز التحقق';document.getElementById('authHint').textContent='أدخل الرمز المرسل إلى بريدك الإلكتروني.';setStatus('تم إرسال الرمز إلى '+activeEmail);otp.focus()}
   catch(e){setStatus('تعذر إرسال الكود. تأكد من إعداد SendGrid في السيرفر.',true)}
   finally{btn.disabled=false;btn.textContent='إرسال رمز التحقق'}
 };
 document.getElementById('verifyOtp').onclick=async()=>{
   const code=otp.value.trim(); if(!/^\d{6}$/.test(code)){setStatus('أدخل رمزاً من 6 أرقام.',true);return}
   const btn=document.getElementById('verifyOtp');btn.disabled=true;
   try{const data=await verifyOtp(activeEmail,code);saveAuth({authenticated:true,email:activeEmail,name:data.name||'عميل هيبة',role:data.role||'customer',token:data.token||null});syncAdminVisibility();document.getElementById('closeAuth').click();location.reload()}
   catch(e){setStatus('رمز التحقق غير صحيح أو منتهي.',true)} finally{btn.disabled=false}
 };
 document.getElementById('backEmail').onclick=()=>{otpStep.hidden=true;emailStep.hidden=false;document.getElementById('authTitle').textContent='تسجيل الدخول';document.getElementById('authHint').textContent='أدخل بريدك الإلكتروني وسنرسل رمز تحقق.';setStatus('');emailInput.focus()};
}
document.addEventListener('DOMContentLoaded',()=>{syncAdminVisibility();initAuth()});
