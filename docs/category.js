/* ===== Config ===== */
const WHATSAPP_NUMBER = '+18176228895'; // tu número sin + ni espacios
const CATS = { perfumes: 'Perfumes', streaming: 'Streaming', generales: 'Productos' };

let productos = {};
let categoriaActual = null;

/* ===== Utils ===== */
const qs = (s, r=document) => r.querySelector(s);
const qsa = (s, r=document) => [...r.querySelectorAll(s)];
const num = n => Number(n ?? 0).toFixed(2);
const escapeHtml = str => (str ?? '').toString()
 .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
 .replace(/"/g,'&quot;').replace(/'/g,'&#039;');

function getCatFromURL(){
  const p = new URLSearchParams(location.search);
  const cat = p.get('cat') || 'perfumes';
  return CATS[cat] ? cat : 'perfumes';
}

/* ===== Modal refs ===== */
let modal, modalImg, modalThumbs, modalTitle, modalDesc, modalPrice, modalSize, modalNotes, modalFeatures, modalStock, modalWa;

function prepararModal(){
  modal = qs('#product-modal');
  modalImg = qs('#modal-img');
  modalThumbs = qs('#modal-thumbs');
  modalTitle = qs('#modal-title');
  modalDesc = qs('#modal-desc');
  modalPrice = qs('#modal-price');
  modalSize = qs('#modal-size');
  modalNotes = qs('#modal-notes');
  modalFeatures = qs('#modal-features');
  modalStock = qs('#modal-stock');
  modalWa = qs('#modal-wa');

  modal.addEventListener('click', e => { if (e.target.dataset.close === 'true') closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

function openModal(p){
  modalImg.src = p.imagen; modalImg.alt = p.nombre || '';
  modalThumbs.innerHTML = '';
  const gal = Array.isArray(p.galeria)&&p.galeria.length ? p.galeria : [p.imagen];
  gal.forEach((src,i)=>{
    const t = new Image(); t.src = src; t.alt = (p.nombre||'')+' '+(i+1);
    if (i===0) t.classList.add('active');
    t.addEventListener('click', ()=>{
      modalImg.src = src;
      qsa('#modal-thumbs img').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
    });
    modalThumbs.appendChild(t);
  });

  modalTitle.textContent = p.nombre || '';
  modalDesc.textContent = p.descripcion_larga || p.descripcion || '';
  modalPrice.textContent = `$${num(p.precio)}`;
  modalSize.innerHTML = p.tamano ? `<strong>Tamaño:</strong> ${escapeHtml(p.tamano)}` : '';
  modalNotes.innerHTML = Array.isArray(p.notas)&&p.notas.length ? `<strong>Notas:</strong> ${p.notas.map(escapeHtml).join(', ')}` : '';
  modalFeatures.innerHTML = Array.isArray(p.caracteristicas)&&p.caracteristicas.length
    ? `<strong>Características:</strong> <ul style="margin:6px 0 0 18px">${p.caracteristicas.map(c=>`<li>${escapeHtml(c)}</li>`).join('')}</ul>` : '';

  // ✅/❌ stock simple
  const usa = p.stock?.usa ?? 0;
  const ecu = p.stock?.ecuador ?? 0;
  const icon = v => (Number(v) > 0 ? '✅' : '❌');
  modalStock.innerHTML = `
    <div class="stock-list">
      <strong>Stock</strong>
      <ul>
        <li>${icon(usa)} EE.UU.</li>
        <li>${icon(ecu)} Ecuador</li>
      </ul>
    </div>
  `;

  const waText = `Hola Beloura, me interesa ${p.nombre} (${CATS[categoriaActual]})${p.tamano ? ' - ' + p.tamano : ''}. Precio: $${num(p.precio)}.`;
  modalWa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
}
function closeModal(){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

/* ===== Cards y pintado ===== */
function buildCard(p){
  const waText = `Hola Beloura, me interesa ${p.nombre} (${CATS[categoriaActual]}). Precio: $${num(p.precio)}.`;
  const waUrl  = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="thumb"><img loading="lazy" src="${p.imagen}" alt="${escapeHtml(p.nombre)}"></div>
    <div class="info">
      <h3 style="cursor:pointer">${escapeHtml(p.nombre)}</h3>
      <p>${escapeHtml(p.descripcion || '')}</p>
      <div class="price">$${num(p.precio)}</div>
      <div class="card__actions" style="display:flex; gap:8px; justify-content:center;">
        <button class="btn btn-detalle">Ver detalles</button>
        <a class="btn" href="${waUrl}" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </div>
  `;
  card.querySelector('.thumb').addEventListener('click', ()=>openModal(p));
  card.querySelector('h3').addEventListener('click', ()=>openModal(p));
  card.querySelector('.btn-detalle').addEventListener('click', ()=>openModal(p));
  return card;
}

function pintarCategoria(filtro=''){
  const cont = qs('#productos-container');
  const items = productos[categoriaActual] || [];
  const lista = items.filter(p=>{
    if (!filtro) return true;
    const hay = s => (s||'').toString().toLowerCase();
    return hay(p.nombre).includes(filtro) || hay(p.descripcion).includes(filtro);
  });
  cont.innerHTML = lista.length ? '' : `<div class="empty">No hay productos.</div>`;
  lista.forEach(p => cont.appendChild(buildCard(p)));
}

/* ===== Tabs visuales + búsqueda ===== */
function syncTabs(){
  qsa('.tab').forEach(el => el.classList.toggle('active', el.dataset.cat===categoriaActual));
  qs('#cat-title').textContent = `Beloura • ${CATS[categoriaActual]}`;
  qs('#crumb-cat').textContent = CATS[categoriaActual];
}

/* ===== Boot ===== */
document.addEventListener('DOMContentLoaded', async () => {
  categoriaActual = getCatFromURL();
  prepararModal();
  const resp = await fetch('data/productos.json?v='+Date.now(), {cache:'no-store'});
  productos = await resp.json();
  syncTabs();
  pintarCategoria();

  const search = qs('#search');
  if (search) search.addEventListener('input', () => pintarCategoria(search.value.trim().toLowerCase()));
});
