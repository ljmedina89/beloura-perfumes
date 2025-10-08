import React, { useEffect, useMemo, useState } from "react";

/**
 * BELOURA Perfumes Catalog — React + Vite + Tailwind
 * Lee el inventario desde VITE_PRODUCTS_URL (Google Apps Script) o /products.json como respaldo.
 */

// CONFIG — personaliza tu número
const WHATSAPP_PHONE_EC = "+16824567649"; // o +593XXXXXXXXX
const WHATSAPP_GREETING = "Hola BELOURA, quisiera este perfume";

function waLink({ phone, text }) {
  const base = `https://wa.me/${phone.replace(/[^0-9+]/g, "")}`;
  const msg = encodeURIComponent(text);
  return `${base}?text=${msg}`;
}

const fmtUSD = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n || 0);

export default function BelouraPerfumes() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [brand, setBrand] = useState("Todas");
  const [size, setSize] = useState("Todos");
  const [priceMax, setPriceMax] = useState(0);
  const [onlyStock, setOnlyStock] = useState(true);
  const [sort, setSort] = useState("relevance");

  useEffect(() => {
    const url = (import.meta?.env?.VITE_PRODUCTS_URL?.trim()) || "./products.json";
    fetch(url)
      .then((r) => r.json())
      .then((j) => setData(Array.isArray(j) ? j : []))
      .catch(() => setData([]));
  }, []);

  const brands = useMemo(() => ["Todas", ...Array.from(new Set(data.map((d) => d.marca).filter(Boolean)))], [data]);
  const sizes  = useMemo(() => ["Todos", ...Array.from(new Set(data.map((d) => d.tamano_ml).filter(Boolean)))], [data]);
  const maxSeenPrice = useMemo(() => Math.max(0, ...data.map((d) => +d.precio_usd || 0)), [data]);
  useEffect(() => { if (!priceMax && maxSeenPrice) setPriceMax(maxSeenPrice); }, [maxSeenPrice, priceMax]);

  const filtered = useMemo(() => {
    let rows = data.slice();
    const nq = q.trim().toLowerCase();
    if (nq) rows = rows.filter((r) => [r.producto, r.marca, (r.notas || []).join(" ")].join(" ").toLowerCase().includes(nq));
    if (brand !== "Todas") rows = rows.filter((r) => r.marca === brand);
    if (size !== "Todos") rows = rows.filter((r) => String(r.tamano_ml) === String(size));
    if (onlyStock) rows = rows.filter((r) => (r.stock ?? 0) > 0);
    rows = rows.filter((r) => (+r.precio_usd || 0) <= priceMax);

    switch (sort) {
      case "price_asc":  rows.sort((a, b) => (+a.precio_usd || 0) - (+b.precio_usd || 0)); break;
      case "price_desc": rows.sort((a, b) => (+b.precio_usd || 0) - (+a.precio_usd || 0)); break;
      case "newest":     rows.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)); break;
      default: break; // relevance = orden original
    }
    return rows;
  }, [data, q, brand, size, priceMax, onlyStock, sort]);

  return (
    <div className="min-h-screen bg-[#0b132b] text-[#e0fbfc]">
      <header className="sticky top-0 z-20 backdrop-blur bg-[#0b132bcc] border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">BELOURA • Catálogo de Perfumes</h1>
          <div className="flex-1" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar (marca, notas, nombre)"
            className="w-full md:w-80 px-3 py-2 rounded-2xl bg-white/10 outline-none focus:ring-2 focus:ring-white/30"
          />
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-4 grid grid-cols-1 md:grid-cols-5 gap-3 text-sm">
          <select className="px-3 py-2 rounded-2xl bg-white/10" value={brand} onChange={(e) => setBrand(e.target.value)}>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="px-3 py-2 rounded-2xl bg-white/10" value={size} onChange={(e) => setSize(e.target.value)}>
            {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <span>Hasta</span>
            <input type="range" min={0} max={maxSeenPrice || 100} value={priceMax} onChange={(e) => setPriceMax(+e.target.value)} className="flex-1" />
            <span className="w-20 text-right">{fmtUSD(priceMax)}</span>
          </div>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} />
            Solo en stock
          </label>
          <select className="px-3 py-2 rounded-2xl bg-white/10" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="relevance">Relevancia</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="newest">Novedades</option>
          </select>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((p) => (
          <article key={p.id} className="bg-[#1c2541] rounded-2xl overflow-hidden border border-white/10 shadow">
            <div className="relative aspect-[4/5] overflow-hidden bg-black/20">
              {p.img ? (
                <img src={p.img} alt={p.producto} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full grid place-items-center text-white/40">Sin imagen</div>
              )}
              {(p.stock ?? 0) > 0 ? (
                <span className="absolute top-2 left-2 text-xs bg-emerald-500/90 text-white px-2 py-0.5 rounded-full">En stock</span>
              ) : (
                <span className="absolute top-2 left-2 text-xs bg-gray-600/90 text-white px-2 py-0.5 rounded-full">Agotado</span>
              )}
            </div>

            <div className="p-4 flex flex-col gap-2">
              <h2 className="text-lg font-medium leading-tight">{p.producto}</h2>
              <p className="text-white/70 text-sm">{p.marca} • {p.tamano_ml} ml</p>
              {Array.isArray(p.notas) && p.notas.length > 0 && (
                <p className="text-xs text-white/60">Notas: {p.notas.join(", ")}</p>
              )}
              <div className="flex items-center justify-between mt-1">
                <strong className="text-xl">{fmtUSD(+p.precio_usd || 0)}</strong>
                {p.descuento_pct ? (
                  <span className="text-xs bg-rose-500/20 text-rose-200 px-2 py-0.5 rounded-full">-{p.descuento_pct}%</span>
                ) : null}
              </div>

              <div className="flex gap-2 mt-3">
                <a
                  href={waLink({
                    phone: WHATSAPP_PHONE_EC,
                    text: `${WHATSAPP_GREETING}: ${p.producto} (${p.marca} ${p.tamano_ml}ml) — ${fmtUSD(+p.precio_usd || 0)}\nSKU:${p.id}`,
                  })}
                  target="_blank"
                  className="flex-1 text-center px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 transition font-medium"
                >
                  Pedir por WhatsApp
                </a>
                {p.ficha && (
                  <a href={p.ficha} target="_blank" className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition text-sm">Ficha</a>
                )}
              </div>
            </div>
          </article>
        ))}
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-10 text-sm text-white/60">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-white/80 font-semibold mb-2">Cómo actualizar inventario</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Edita <code>/public/products.json</code> o actualiza tu Google Sheet.</li>
              <li>Sube imágenes a <code>/public/img/</code> o usa URLs públicas.</li>
              <li>Commit → GitHub Pages se refresca.</li>
            </ol>
          </div>
          <div>
            <h3 className="text-white/80 font-semibold mb-2">Tip (Google Sheets → JSON)</h3>
            <p>Publica un endpoint con Apps Script y define <code>VITE_PRODUCTS_URL</code> en <code>.env</code>.</p>
          </div>
        </div>
        <p className="mt-6">© {new Date().getFullYear()} BELOURA</p>
      </footer>
    </div>
  );
}
