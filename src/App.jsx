import { useEffect, useMemo, useState } from "react";

const CATEGORIES = [
  { id: "all", label: "Todos" },
  { id: "perfume", label: "Perfumes" },
  { id: "splash", label: "Splash" },
  { id: "smartwatch", label: "Smartwatch" },
  { id: "cuentas", label: "Cuentas" },
];

const SORTS = [
  { id: "relevance", label: "Relevancia" },
  { id: "price-asc", label: "Precio: menor a mayor" },
  { id: "price-desc", label: "Precio: mayor a menor" },
  { id: "name-asc", label: "Nombre A-Z" },
];

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-600/15 text-emerald-300 ring-1 ring-emerald-600/30">
      {children}
    </span>
  );
}

function CategoryPills({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={[
            "rounded-full px-4 py-2 text-sm transition",
            value === c.id
              ? "bg-emerald-600 text-white"
              : "bg-slate-700/60 text-slate-200 hover:bg-slate-700",
          ].join(" ")}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}

function ProductCard({ p }) {
  const inStock = (p.stock ?? 0) > 0;

  return (
    <div className="rounded-2xl overflow-hidden bg-slate-800/70 ring-1 ring-white/5 hover:ring-emerald-600/40 transition shadow-sm">
      <div className="relative aspect-[4/3] bg-slate-900">
        {inStock && (
          <div className="absolute left-3 top-3">
            <Badge>En stock</Badge>
          </div>
        )}
        <img
          src={p.img}
          alt={p.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="p-4 space-y-1">
        <h3 className="text-base font-semibold text-slate-50">{p.name}</h3>
        <p className="text-sm text-slate-300">
          {p.brand}
          {p.size_ml ? ` • ${p.size_ml} ml` : ""}
        </p>
        {p.notes && (
          <p className="text-sm text-slate-400 line-clamp-2">{p.notes}</p>
        )}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-lg font-bold text-emerald-300">
            ${p.price.toFixed(2)}
          </div>
          <a
            href={`https://wa.me/13464130111?text=${encodeURIComponent(
              `Hola, estoy interesado en: ${p.name} (${p.brand}) - $${p.price.toFixed(
                2
              )}`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl px-3 py-2 text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500"
          >
            Consultar
          </a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [all, setAll] = useState([]);
  const [cat, setCat] = useState("all");
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(500);
  const [onlyStock, setOnlyStock] = useState(false);
  const [sort, setSort] = useState("relevance");

  useEffect(() => {
  fetch("./products.json") // ← NO uses "/products.json"
    .then(r => r.json())
    .then(setAll)
    .catch(console.error);
}, []);

  const maxPriceFromData = useMemo(() => {
    return Math.max(0, ...all.map((p) => Number(p.price || 0)));
  }, [all]);

  useEffect(() => {
    if (maxPriceFromData > 0) setMaxPrice(maxPriceFromData);
  }, [maxPriceFromData]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let arr = all.filter((p) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (onlyStock && (p.stock ?? 0) <= 0) return false;
      if (p.price > maxPrice) return false;

      if (q) {
        const hay =
          `${p.name} ${p.brand} ${p.notes || ""}`.toLowerCase().includes(q);
        if (!hay) return false;
      }
      return true;
    });

    switch (sort) {
      case "price-asc":
        arr = arr.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        arr = arr.sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        arr = arr.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // relevancia: dejamos como están (orden del JSON)
        break;
    }

    return arr;
  }, [all, cat, query, maxPrice, onlyStock, sort]);

  return (
    <div className="min-h-screen bg-[#0b1220] text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-[#0b1220]/70 bg-[#0b1220]/90 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Beloura Store
          </h1>
          <div className="ml-auto w-full max-w-lg">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar (marca, nombre, notas)"
              className="w-full rounded-xl bg-slate-800/80 border border-white/10 px-4 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Filtros */}
        <div className="max-w-7xl mx-auto px-4 pb-4 flex flex-col gap-3">
          <CategoryPills value={cat} onChange={setCat} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-3 py-2">
              <span className="text-sm text-slate-300">Hasta</span>
              <input
                type="range"
                min="0"
                max={maxPriceFromData || 500}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm font-medium text-emerald-300">
                ${maxPrice.toFixed(2)}
              </span>
            </label>

            <label className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-3 py-2">
              <input
                type="checkbox"
                checked={onlyStock}
                onChange={(e) => setOnlyStock(e.target.checked)}
                className="accent-emerald-600"
              />
              <span className="text-sm text-slate-300">Solo en stock</span>
            </label>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-slate-800/60 rounded-xl px-3 py-2 text-sm border border-white/10"
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <p className="text-slate-400">No se encontraron productos.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </main>

      {/* Footer simple */}
      <footer className="border-t border-white/5 py-6 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} Beloura Store — Catálogo
      </footer>
    </div>
  );
}
