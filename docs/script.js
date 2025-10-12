let productos = {};
let categoriaActual = 'perfumes';

// ⚠️ Pon tu número en formato internacional, sin "+" ni espacios:
const WHATSAPP_NUMBER = '19726070561'; // <-- cámbialo

async function cargarProductos() {
  try {
    const resp = await fetch('data/productos.json?v=' + Date.now(), { cache: 'no-store' });
    if (!resp.ok) throw new Error('No se pudo cargar productos.json');
    productos = await resp.json();
    renderTabs();
    mostrarCategoria(categoriaActual);
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
    const waText = `Hola Beloura, me interesa ${p.nombre} (${categoria}). Precio: $${Number(p.precio).toFixed(2)}.`;
    const waUrl  = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="thumb"><img loading="lazy" src="${p.imagen}" alt="${escapeHtml(p.nombre)}"></div>
      <div class="info">
        <h3>${escapeHtml(p.nombre)}</h3>
        <p>${escapeHtml(p.descripcion)}</p>
        <div class="price">$${Number(p.precio).toFixed(2)}</div>
        <a class="btn" href="${waUrl}" target="_blank" rel="noopener">Pedir por WhatsApp</a>
      </div>
    `;
    contenedor.appendChild(card);
  });
}

function escapeHtml(str) {
  return (str ?? '').toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', cargarProductos);
