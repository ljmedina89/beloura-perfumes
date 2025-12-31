/* ===== Estado ===== */
let productos = {};
let categoriaActual = 'perfumes';
const WHATSAPP_NUMBER = '18176228895'; // <-- tu número (sin + ni espacios)

/* ===== Carga ===== */
async function cargarProductos() {
  try {
    const resp = await fetch('data/productos.json?v=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('No se pudo cargar productos.json');
    productos = await resp.json();
    renderTabs();
    mostrarCategoria(categoriaActual);
    renderDestacados();
    prepararModal();
  } catch (e) {
    console.error(e);
    const c = document.getElementById('productos-container');
    if (c) c.innerHTML = `<div class="error">⚠️ Error cargando productos. Verifica la ruta data/productos.json</div>`;
  }
}

/* ===== Tabs / búsqueda ===== */
function renderTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cat === categoriaActual);
    btn.onclick = () => {
      categoriaActual = btn.dataset.cat;
      tabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      mostrarCategoria(categoriaActual);
    };
  });
  const search = document.getElementById('search');
  if (search) search.addEventListener('input', () => mostrarCategoria(categoriaActual, search.value.trim().toLowerCase()));
}

/* ===== Catálogo por categoría ===== */
function mostrarCategoria(categoria, filtro = '') {
  const contenedor = document.getElementById('productos-container');
  if (!contenedor) return;
  contenedor.innerHTML = '';

  if (!productos[categoria]) {
    contenedor.innerHTML = `<div class="empty">No hay productos en esta categoría.</div>`;
    return;
  }

  const lista = productos[categoria].filter(p => {
    if (!filtro) return true;
    const hay = (s) => (s || '').toString().toLowerCase();
    return hay(p.nombre).includes(filtro) || hay(p.descripcion).includes(filtro);
  });

  if (lista.length === 0) {
    contenedor.innerHTML = `<div class="empty">Sin resultados para “${escapeHtml(filtro)}”.</div>`;
    return;
  }

  lista.forEach(p => {
    const card = buildCard(p, categoria);
    contenedor.appendChild(card);
  });
}

/* ===== DESTACADOS ===== */
function renderDestacados(){
  const box = document.getElementById('featured-container');
  if (!box) return;

  // 1) Toma explícitamente los marcados como destacado
  const marked = []
    .concat((productos.perfumes||[]).filter(p => p.destacado))
    .concat((productos.Ropa||[]).filter(p => p.destacado))
    .concat((productos.generales||[]).filter(p => p.destacado));

  // 2) Si no hay marcados, toma 2 de cada categoría como fallback
  const fallback = []
    .concat((productos.perfumes||[]).slice(0,2))
    .concat((productos.Ropa||[]).slice(0,2))
    .concat((productos.generales||[]).slice(0,2));

  const picks = marked.length ? marked : fallback;

  box.innerHTML = '';
  picks.forEach(p => box.appendChild(buildCard(p, guessCategoria(p))));
}

function guessCategoria(p){
  if ((productos.perfumes||[]).includes(p)) return 'perfumes';
  if ((productos.Ropa||[]).includes(p)) return 'Ropa';
  if ((productos.generales||[]).includes(p)) return 'generales';
  return '';
}

/* ===== Tarjeta reutilizable ===== */
function buildCard(p, categoria){
  const waText = `Hola Beloura, me interesa ${p.nombre} (${categoria}). Precio: $${num(p.precio)}.`;
  const waUrl  = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  const card = document.createElement('article');
  card.className = 'card';
  card.style.position = 'relative';

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

  card.querySelector('.thumb')?.addEventListener('click', () => openModal(p, categoria));
  card.querySelector('h3')?.addEventListener('click', () => openModal(p, categoria));
  card.querySelector('.btn-detalle')?.addEventListener('click', () => openModal(p, categoria));
  const rb = stockRibbon(p);
  if (rb) card.prepend(rb);
  return card;
}
function stockRibbon(p){
  const usa = p.stock?.usa ?? null;
  const ecu = p.stock?.ecuador ?? null;
  const vals = [usa, ecu].filter(v => v!==null && v!==undefined).map(Number);
  const total = vals.reduce((a,b)=>a+b,0);
  if (!vals.length) return null;
  const r = document.createElement('div');
  r.className = 'ribbon';
  if (total <= 0){ r.classList.add('out'); r.textContent = 'AGOTADO'; return r; }
  if (total <= 2){ r.style.background = '#f59e0b'; r.textContent = 'ÚLTIMAS UNIDADES'; return r; }
  r.textContent = 'EN STOCK'; return r;
}

/* ===== Modal ===== */
let modal, modalImg, modalThumbs, modalTitle, modalDesc, modalPrice, modalSize, modalNotes, modalFeatures, modalStock, modalWa;
function prepararModal(){
  modal = document.getElementById('product-modal');
  if (!modal) return;
  modalImg = document.getElementById('modal-img');
  modalThumbs = document.getElementById('modal-thumbs');
  modalTitle = document.getElementById('modal-title');
  modalDesc = document.getElementById('modal-desc');
  modalPrice = document.getElementById('modal-price');
  modalSize = document.getElementById('modal-size');
  modalNotes = document.getElementById('modal-notes');
  modalFeatures = document.getElementById('modal-features');
  modalStock = document.getElementById('modal-stock');
  modalWa = document.getElementById('modal-wa');

  modal.addEventListener('click', (e) => {
    if (e.target.dataset.close === 'true') closeModal();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}
function openModal(p, categoria){
  if (!modal) return;
  modalImg.src = p.imagen; modalImg.alt = p.nombre || '';
  modalThumbs.innerHTML = '';
  const galeria = Array.isArray(p.galeria)&&p.galeria.length? p.galeria : [p.imagen];
  galeria.forEach((src,i)=>{
    const t = document.createElement('img'); t.src = src; t.alt = (p.nombre||'')+' '+(i+1);
    if (i===0) t.classList.add('active');
    t.addEventListener('click', ()=>{
      modalImg.src = src;
      modalThumbs.querySelectorAll('img').forEach(x=>x.classList.remove('active'));
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
    ? `<strong>Características:</strong> <ul style="margin:6px 0 0 18px">${p.caracteristicas.map(c=>`<li>${escapeHtml(c)}</li>`).join('')}</ul>`
    : '';
  const usa = p.stock?.usa ?? null;
  const ecu = p.stock?.ecuador ?? null;
  const icon = v => (Number(v) > 0 ? '✅' : '❌');

  if (usa === null && ecu === null) {
    modalStock.innerHTML = '<span class="badge">Sin info de stock</span>';
  } else {
    modalStock.innerHTML = `
      <div class="stock-list">
        <strong>Stock</strong>
        <ul>
          <li>${icon(usa)} EE.UU. ${usa !== null ? `(${usa})` : ''}</li>
          <li>${icon(ecu)} Ecuador ${ecu !== null ? `(${ecu})` : ''}</li>
        </ul>
      </div>
    `;
  }.filter(Boolean).join('') || '<span class="badge">Sin info de stock</span>';
  const waText = `Hola Beloura, me interesa ${p.nombre} (${categoria})${p.tamano ? ' - ' + p.tamano : ''}. Precio: $${num(p.precio)}.`;
  modalWa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;
  modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false');
}
function closeModal(){ modal?.classList.add('hidden'); modal?.setAttribute('aria-hidden','true'); }
function renderStockBadge(label, value){
  if (value === null || value === undefined) return '';
  let cls = 'ok', text = `${value} en ${label}`;
  if (Number(value) <= 0) { cls = 'out'; text = `Agotado en ${label}`; }
  else if (Number(value) <= 2) { cls = 'low'; }
  return `<span class="badge ${cls}">${text}</span>`;
}

/* ===== Hero ===== */
const HERO_SLIDES = ['img/hero-1.jpg','img/hero-2.jpg','img/hero-3.jpg'];
let heroIndex = 0, heroTimer;
function initHero() {
  const wrap = document.querySelector('.hero');
  const slide = document.getElementById('hero-slide');
  const dots = document.getElementById('hero-dots');
  if (!wrap || !slide || !dots || !HERO_SLIDES.length) return;
  dots.innerHTML = HERO_SLIDES.map((_,i)=>`<span class="dot${i===0?' active':''}"></span>`).join('');
  const render = () => {
    slide.style.backgroundImage = `url('${HERO_SLIDES[heroIndex]}')`;
    dots.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('active', i===heroIndex));
  };
  heroTimer = setInterval(()=>{ heroIndex = (heroIndex + 1) % HERO_SLIDES.length; render(); }, 4000);
  dots.addEventListener('click', e => {
    const idx = [...dots.children].indexOf(e.target);
    if (idx >= 0) { heroIndex = idx; render(); }
  });
  render();
}

/* ===== Navegación desde home y export ===== */
function gotoCategoria(cat) {
  categoriaActual = cat;
  document.querySelectorAll('.tab')
    .forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
  mostrarCategoria(cat);
  const cont = document.getElementById('productos-container');
  if (cont && cont.scrollIntoView) cont.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
window.gotoCategoria = gotoCategoria; // <- imprescindible para onclick/data-cat

function wireHomeCategories() {
  document.querySelectorAll('.home-cat').forEach(el => {
    const cat = el.getAttribute('data-cat');
    if (cat) el.addEventListener('click', () => gotoCategoria(cat));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
  initHero && initHero();
  wireHomeCategories(); // <- asegura los clicks
});


/* ===== Utils ===== */
function escapeHtml(str){ return (str ?? '').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function num(n){ return Number(n ?? 0).toFixed(2); }


