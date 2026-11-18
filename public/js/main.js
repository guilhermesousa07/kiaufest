import { api, money, esc } from './api.js';
import { createVenue } from './venue3d.js';

const $ = s => document.querySelector(s);
let registering = false;
function openAuth(){ $('#authModal').classList.add('show'); }
function closeAuth(){ $('#authModal').classList.remove('show'); }
$('#accountBtn')?.addEventListener('click', async (e) => {
  e.preventDefault();

  try {
    const response = await api('/api/auth/me');

    if (response && response.user) {
      if (response.user.role === 'admin') {
        window.location.assign('/admin');
        return;
      }

      openAuth();
      $('#authMsg').textContent =
        `Olá, ${response.user.name}! Sua conta está conectada.`;
      return;
    }

    openAuth();

  } catch (error) {
    console.error('Erro ao consultar conta:', error);
    openAuth();
  }
});
$('#closeModal')?.addEventListener('click',closeAuth);
$('#switchAuth')?.addEventListener('click',()=>{
  registering=!registering;
  $('#nameWrap').classList.toggle('hidden',!registering);
  $('#authTitle').innerHTML=registering?'CRIE SUA<br><span class="gradient-text">CONTA.</span>':'ENTRE NA<br><span class="gradient-text">EXPERIÊNCIA.</span>';
  $('#authForm button').textContent=registering?'Criar conta ↗':'Continuar ↗';
  $('#switchAuth').textContent=registering?'Já tem conta? Entrar':'Ainda não tem conta? Criar cadastro';
});
$('#authForm')?.addEventListener('submit',async e=>{
  e.preventDefault(); const body=Object.fromEntries(new FormData(e.target).entries());
  $('#authMsg').textContent='Aguarde...';
  try{await api('/api/auth/'+(registering?'register':'login'),{method:'POST',body:JSON.stringify(body)});closeAuth();location.reload();}
  catch(err){$('#authMsg').textContent=err.message;}
});
async function loadEvents(){
  const grid=$('#eventsGrid');
  try{
    const rows=await api('/api/events');
    grid.innerHTML=rows.length?rows.map(e=>`
      <article class="event-card">
        <div class="event-image" style="${e.image_url?`background-image:linear-gradient(#0005,#0009),url('${esc(e.image_url)}')`:''}">
          <span>KIAU EXPERIENCE</span>
        </div>
        <div class="event-info"><h3>${esc(e.title)}</h3>
        <p>${esc(e.description||'Uma experiência para entrar na história.')}</p>
        <div class="event-bottom"><span>${new Date(e.event_date).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})} · ${esc(e.venue)}</span><b>${Number(e.price)===0?'A PARTIR DE GRÁTIS':money(e.price)}</b></div>
        <a class="btn neon-btn full" href="/event/${encodeURIComponent(e.slug)}">Ver experiência ↗</a></div>
      </article>`).join(''):'<div class="empty">Novas experiências serão anunciadas em breve.</div>';
  }catch(e){grid.innerHTML=`<div class="empty">${esc(e.message)}</div>`;}
}
$('#year').textContent=new Date().getFullYear();
$('#menuToggle')?.addEventListener('click',()=>document.querySelector('.topbar nav')?.classList.toggle('mobile-open'));
loadEvents();

const venue=createVenue($('#venue3d'));
$('#mapReset')?.addEventListener('click',()=>venue.reset());
$('#mapToggle')?.addEventListener('click',()=>venue.toggle());
