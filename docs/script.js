let productos = {};
let categoriaActual = 'perfumes';

// ⚠️ Tu número WhatsApp en formato internacional, sin "+" ni espacios
const WHATSAPP_NUMBER = '19726070561';

async function cargarProductos() {
  try {
    const resp = await fetch('data/productos.json?v=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('No se pudo cargar productos.json');
    productos = await resp.json();
    renderTabs();
    renderDestacados();
    mostrarCategoria(categoriaActual);
    prepararModal();
  } catch (e) {
    console.error(e);
    const c = document.getElementById('productos-container');
    c.innerHTML = `<div class="error">⚠️ Error cargando productos. Verifica la ruta data/productos.json</div>`;
  }
}

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
  search.addEventListener('input', () => mostrarCategoria(categoriaActual, search.value.trim().toLowerCase()));
}

function mostrarCategoria(categoria, filtro = '') {
  const contenedor = document.getElementById('productos-container');
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


    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb"><img loading="lazy" src="${p.imagen}" alt="${escapeHtml(p.nombre)}"></div>
      <div class="info">
        <h3>${escapeHtml(p.nombre)}</h3>
        <p>${escapeHtml(p.descripcion)}</p>
        <div class="price">$${num(p.precio)}</div>
        <div class="card__actions" style="display:flex; gap:8px; justify-content:center;">
          <button class="btn btn-detalle" data-idx="${idx}" data-cat="${categoria}">Ver detalles</button>
          <a class="btn" href="${waUrl}" target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
    `;
    // abrir modal también al hacer click en la imagen o título
    card.querySelector('.thumb').addEventListener('click', () => openModal(p, categoria));
    card.querySelector('h3').addEventListener('click', () => openModal(p, categoria));
    card.querySelector('.btn-detalle').addEventListener('click', () => openModal(p, categoria));
    contenedor.appendChild(card);
  });
}

/* ===== DESTACADOS ===== */
function renderDestacados(){
  const box = document.getElementById('featured-container');
  if (!box) return;
  // toma los 2 primeros de cada categoría (si existen)
  const picks = []
    .concat((productos.perfumes||[]).slice(0,2))
    .concat((productos.streaming||[]).slice(0,2))
    .concat((productos.generales||[]).slice(0,2));

  box.innerHTML = '';
  picks.forEach(p => box.appendChild(buildCard(p, guessCategoria(p))));
}

// intenta inferir categoría por presencia en productos
function guessCategoria(p){
  if ((productos.perfumes||[]).includes(p)) return 'perfumes';
  if ((productos.streaming||[]).includes(p)) return 'streaming';
  if ((productos.generales||[]).includes(p)) return 'generales';
  return '';
}

/* Reusa una sola fábrica de tarjetas: con ribbon de stock */
function buildCard(p, categoria){
  const waText = `Hola Beloura, me interesa ${p.nombre} (${categoria}). Precio: $${num(p.precio)}.`;
  const waUrl  = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  const card = document.createElement('article');
  card.className = 'card';
  card.style.position = 'relative';
  const ribbon = stockRibbon(p); // null o elemento

  card.innerHTML = `
    <div class="thumb"><img loading="lazy" src="${p.imagen}" alt="${escapeHtml(p.nombre)}"></div>
    <div class="info">
      <h3>${escapeHtml(p.nombre)}</h3>
      <p>${escapeHtml(p.descripcion || '')}</p>
      <div class="price">$${num(p.precio)}</div>
      <div class="card__actions" style="display:flex; gap:8px; justify-content:center;">
        <button class="btn btn-detalle">Ver detalles</button>
        <a class="btn" href="${waUrl}" target="_blank" rel="noopener">WhatsApp</a>
      </div>
    </div>
  `;
  if (ribbon) card.prepend(ribbon);

  // abrir modal con click
  card.querySelector('.thumb').addEventListener('click', () => openModal(p, categoria));
  card.querySelector('h3').addEventListener('click', () => openModal(p, categoria));
  card.querySelector('.btn-detalle').addEventListener('click', () => openModal(p, categoria));
  return card;
}

function stockRibbon(p){
  const usa = p.stock?.usa ?? null;
  const ecu = p.stock?.ecuador ?? null;
  const total = [usa, ecu].filter(v => v!==null && v!==undefined)
                          .reduce((a,b)=>a+Number(b), 0);
  if (total === 0) {
    const r = document.createElement('div');
    r.className = 'ribbon out'; r.textContent = 'AGOTADO';
    return r;
  }
  if (total > 0 && total <= 2) {
    const r = document.createElement('div');
    r.className = 'ribbon'; r.style.background='#f59e0b'; r.textContent = 'ÚLTIMAS UNIDADES';
    return r;
  }
  if (total > 2) {
    const r = document.createElement('div');
    r.className = 'ribbon'; r.textContent = 'EN STOCK';
    return r;
  }
  return null;
}
/* ===== Modal ===== */
let modal, modalImg, modalThumbs, modalTitle, modalDesc, modalPrice, modalSize, modalNotes, modalFeatures, modalStock, modalWa;

function prepararModal(){
  modal = document.getElementById('product-modal');
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
  /* ====== HERO SLIDER SENCILLO ====== */
const HERO_SLIDES = [
  'img/hero-1.png',
  'img/hero-2.jpg',
  'img/hero-3.webp'
];
let heroIndex = 0, heroTimer;

function initHero() {
  const slide = document.getElementById('hero-slide');
  const dots = document.getElementById('hero-dots');

  // crear dots
  dots.innerHTML = HERO_SLIDES.map((_,i)=>`<span class="dot${i===0?' active':''}"></span>`).join('');

  const render = () => {
    slide.style.backgroundImage = `url('${HERO_SLIDES[heroIndex]}')`;
    dots.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === heroIndex));
  };

  // autoplay
  heroTimer = setInterval(() => {
    heroIndex = (heroIndex + 1) % HERO_SLIDES.length;
    render();
  }, 4000);

  dots.addEventListener('click', (e) => {
    const idx = [...dots.children].indexOf(e.target);
    if (idx >= 0) { heroIndex = idx; render(); }
  });

  render();
}

/* ====== CTA/Goto categoría ====== */
function gotoCategoria(cat) {
  categoriaActual = cat;
  // marcar pestaña y renderizar
  document.querySelectorAll('.tab').forEach(b => {
    const active = b.dataset.cat === cat;
    b.classList.toggle('active', active);
  });
  mostrarCategoria(cat);
  // hacer scroll suave al catálogo
  document.getElementById('productos-container')?.scrollIntoView({ behavior: 'smooth' });
}

/* Inicia todo (llama también initHero cuando carguen productos) */
document.addEventListener('DOMContentLoaded', () => {
  cargarProductos();
  initHero();
});

}

function openModal(p, categoria){
  // imagen principal
  modalImg.src = p.imagen;
  modalImg.alt = p.nombre || '';

  // miniaturas
  modalThumbs.innerHTML = '';
  const galeria = Array.isArray(p.galeria) && p.galeria.length ? p.galeria : [p.imagen];
  galeria.forEach((src, i) => {
    const t = document.createElement('img');
    t.src = src; t.alt = (p.nombre || '') + ' ' + (i+1);
    if (i === 0) t.classList.add('active');
    t.addEventListener('click', () => {
      modalImg.src = src;
      modalThumbs.querySelectorAll('img').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
    });
    modalThumbs.appendChild(t);
  });

  // textos
  modalTitle.textContent = p.nombre || '';
  modalDesc.textContent = p.descripcion_larga || p.descripcion || '';
  modalPrice.textContent = `$${num(p.precio)}`;
  modalSize.innerHTML = p.tamano ? `<strong>Tamaño:</strong> ${escapeHtml(p.tamano)}` : '';

  // notas
  if (Array.isArray(p.notas) && p.notas.length){
    modalNotes.innerHTML = `<strong>Notas:</strong> ${p.notas.map(escapeHtml).join(', ')}`;
  } else { modalNotes.innerHTML = ''; }

  // características
  if (Array.isArray(p.caracteristicas) && p.caracteristicas.length){
    modalFeatures.innerHTML = `<strong>Características:</strong> <ul style="margin:6px 0 0 18px">${p.caracteristicas.map(c=>`<li>${escapeHtml(c)}</li>`).join('')}</ul>`;
  } else { modalFeatures.innerHTML = ''; }

  // stock
  const usa = p.stock?.usa ?? null;
  const ecu = p.stock?.ecuador ?? null;
  modalStock.innerHTML = [
    renderStockBadge('EE. UU.', usa),
    renderStockBadge('Ecuador', ecu)
  ].filter(Boolean).join('') || '<span class="badge">Sin info de stock</span>';

  // WhatsApp
  const waText = `Hola Beloura, me interesa ${p.nombre} (${categoria})${p.tamano ? ' - ' + p.tamano : ''}. Precio: $${num(p.precio)}.`;
  modalWa.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  // mostrar
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
}

function renderStockBadge(label, value){
  if (value === null || value === undefined) return '';
  let cls = 'ok', text = `${value} en ${label}`;
  if (Number(value) <= 0) { cls = 'out'; text = `Agotado en ${label}`; }
  else if (Number(value) <= 2) { cls = 'low'; }
  return `<span class="badge ${cls}">${text}</span>`;
}

/* ===== Utils ===== */
function escapeHtml(str) {
  return (str ?? '').toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function num(n){ return Number(n ?? 0).toFixed(2); }

document.addEventListener('DOMContentLoaded', cargarProductos);
