/* HEEBA account/auth UI. Real WhatsApp OTP is backend-ready; set API_BASE to your server. */
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
function normalizePhone(v){let p=(v||'').replace(/\s+/g,'').replace(/[^+\d]/g,''); if(p.startsWith('05')) p='+966'+p.slice(1); if(p.startsWith('966')) p='+'+p; return p;}
async function requestOtp(phone){
  const r=await fetch((HEEBA_AUTH.API_BASE||'')+'/api/auth/request-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
  if(!r.ok) throw new Error('OTP_SERVER'); return r.json();
}
async function verifyOtp(phone,otp){
  const r=await fetch((HEEBA_AUTH.API_BASE||'')+'/api/auth/verify-otp',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,otp})});
  if(!r.ok) throw new Error('OTP_INVALID'); return r.json();
}
function initAuth(){
 const modal=document.getElementById('authModal'); if(!modal)return;
 const phoneStep=document.getElementById('phoneStep'), otpStep=document.getElementById('otpStep'), status=document.getElementById('authStatus');
 const phone=document.getElementById('phoneInput'), otp=document.getElementById('otpInput'); let activePhone='';
 const setStatus=(t,bad=false)=>{status.textContent=t;status.className='auth-status '+(bad?'bad':'ok')};
 document.getElementById('accountBtn').onclick=()=>{modal.classList.add('open');modal.setAttribute('aria-hidden','false');phone.focus()};
 document.getElementById('closeAuth').onclick=()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true');setStatus('')};
 modal.addEventListener('click',e=>{if(e.target===modal)document.getElementById('closeAuth').click()});
 document.getElementById('sendOtp').onclick=async()=>{
   activePhone=normalizePhone(phone.value); if(!/^\+9665\d{8}$/.test(activePhone)){setStatus('أدخل رقم جوال سعودي صحيح.',true);return}
   const btn=document.getElementById('sendOtp'); btn.disabled=true; btn.textContent='جاري الإرسال…';
   try{await requestOtp(activePhone); phoneStep.hidden=true;otpStep.hidden=false;document.getElementById('authTitle').textContent='رمز التحقق';document.getElementById('authHint').textContent='أدخل الرمز المرسل إلى واتساب.';setStatus('تم إرسال الرمز عبر واتساب.');otp.focus()}
   catch(e){setStatus('تسجيل واتساب غير مفعّل على السيرفر حالياً. أضف إعدادات WhatsApp API ثم سيعمل الإرسال الحقيقي.',true)}
   finally{btn.disabled=false;btn.textContent='إرسال رمز واتساب'}
 };
 document.getElementById('verifyOtp').onclick=async()=>{
   const code=otp.value.trim(); if(!/^\d{6}$/.test(code)){setStatus('أدخل رمزاً من 6 أرقام.',true);return}
   const btn=document.getElementById('verifyOtp');btn.disabled=true;
   try{const data=await verifyOtp(activePhone,code);saveAuth({authenticated:true,phone:activePhone,name:data.name||'عميل هيبة',role:data.role||'customer',token:data.token||null});syncAdminVisibility();document.getElementById('closeAuth').click();location.reload()}
   catch(e){setStatus('رمز التحقق غير صحيح أو منتهي.',true)} finally{btn.disabled=false}
 };
 document.getElementById('backPhone').onclick=()=>{otpStep.hidden=true;phoneStep.hidden=false;document.getElementById('authTitle').textContent='تسجيل الدخول';document.getElementById('authHint').textContent='أدخل رقم جوالك وسنرسل رمز تحقق عبر واتساب.';setStatus('');phone.focus()};
}
document.addEventListener('DOMContentLoaded',()=>{syncAdminVisibility();initAuth()});
