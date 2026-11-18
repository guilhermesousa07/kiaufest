import { api, money, esc } from './api.js';
import { createVenue } from './venue3d.js';
const id=decodeURIComponent(location.pathname.split('/').pop());
const root=document.querySelector('#eventDetail');
async function init(){
  try{
    const e=await api('/api/events/'+encodeURIComponent(id));
    document.title=`${e.title} | KIAU FEST`;
    root.innerHTML=`
      <div class="eyebrow">KIAU FEST / EVENTO</div>
      <section class="detail-hero" style="${e.image_url?`background-image:linear-gradient(90deg,#080611dd,#08061155),url('${esc(e.image_url)}')`:''}">
        <div class="eyebrow">${esc(e.city)}</div><h1>${esc(e.title)}</h1>
        <p>${new Date(e.event_date).toLocaleString('pt-BR',{dateStyle:'full',timeStyle:'short'})} · ${esc(e.venue)}</p>
      </section>
      <div class="detail-layout">
        <section class="detail-box"><div class="eyebrow">SOBRE A EXPERIÊNCIA</div><h2>PREPARE-SE PARA VIVER.</h2><p class="muted">${esc(e.description||'Uma experiência KIAU FEST.')}</p></section>
        <section class="detail-box"><div class="eyebrow">ESCOLHA SEU SETOR</div><div id="sectors"></div><label class="muted">Quantidade <input id="quantity" type="number" min="1" max="10" value="1"></label><button id="buyBtn" class="btn neon-btn full">Continuar ↗</button><p id="buyMsg" class="form-message"></p></section>
      </div>
      <section class="experience section" style="padding-left:0;padding-right:0">
        <div class="eyebrow">KIAU EXPERIENCE / MODELO DO LOCAL</div>
        <h2>EXPLORE O <span class="gradient-text">ESPAÇO.</span></h2>
        <div class="map-shell"><div id="eventVenue" class="venue3d"><div class="map-loading">Carregando espaço 3D...</div></div></div>
      </section>`;
    const eventVenue = createVenue(document.querySelector('#eventVenue'));
    try {
      const model = await api('/api/venue/' + e.id);
      if (model && model.model_url) await eventVenue.loadModel(model.model_url);
    } catch (modelError) {
      console.warn('Não foi possível carregar o modelo 3D deste evento:', modelError);
    }
    const sectors=document.querySelector('#sectors');
    let selected=null;
    sectors.innerHTML=e.sectors.length?e.sectors.map(s=>`<label class="sector-choice"><span><input type="radio" name="sector" value="${s.id}" style="width:auto"> <b>${esc(s.name)}</b><small>${esc(s.description||'')} · Capacidade ${s.capacity}</small></span><b>${money(s.price)}</b></label>`).join(''):'<p class="muted">Este evento ainda não possui setores configurados. Entre em contato com a organização.</p>';
    document.querySelectorAll('[name=sector]').forEach(r=>r.addEventListener('change',()=>selected=Number(r.value)));
    document.querySelector('#buyBtn').addEventListener('click',async()=>{
      const msg=document.querySelector('#buyMsg');
      if(!selected){msg.textContent='Selecione um setor.';return;}
      try{
        const me=await api('/api/auth/me'); if(!me.user){msg.textContent='Faça login pela página inicial e tente novamente.';return;}
        const quantity=Number(document.querySelector('#quantity').value);
        const order=await api('/api/orders',{method:'POST',body:JSON.stringify({event_id:e.id,sector_id:selected,quantity})});
        msg.textContent=`Pedido ${order.code} criado. Total: ${money(order.total)}. Status: aguardando pagamento.`;
      }catch(err){msg.textContent=err.message;}
    });
  }catch(e){root.innerHTML=`<div class="empty">${esc(e.message)}</div>`;}
}
init();
