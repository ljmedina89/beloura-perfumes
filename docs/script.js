let productos = {};
let categoriaActual = 'perfumes';

async function cargarProductos() {
  try {
    // Desde docs/ sube un nivel a /data/productos.json
    const resp = await fetch('data/productos.json'); { cache: 'no-store' });
    if (!resp.ok) throw new Error('No se pudo cargar productos.json');
    productos = await resp.json();
    renderTabs();
    mostrarCategoria(categoriaActual);
  } catch (e) {
    console.error(e);
    const c = document.getElementById('productos-container');
    c.innerHTML = `<div class="error">⚠️ Error cargando productos. Verifica la ruta ../data/productos.json</div>`;
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

  // Búsqueda
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
    contenedor.innerHTML = `<div class="empty">Sin resultados para “${filtro}”.</div>`;
    return;
  }

lista.forEach(p => {
  const card = document.createElement('article');
  card.className = 'card';
  card.innerHTML = `
    <div class="thumb"><img loading="lazy" src="${p.imagen}" alt="${escapeHtml(p.nombre)}"></div>
    <div class="info">
      <h3>${escapeHtml(p.nombre)}</h3>
      <p>${escapeHtml(p.descripcion)}</p>
      <div class="price">$${Number(p.precio).toFixed(2)}</div>
      <a 
        class="btn" 
        href="https://wa.me/19726070561?text=Hola%20Beloura,%20me%20interesa%20el%20producto%20${encodeURIComponent(p.nombre)}" 
        target="_blank"
      >
        Pedir por WhatsApp
      </a>
    </div>
  `;
  contenedor.appendChild(card);
});;
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
