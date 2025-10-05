# BELOURA • Catálogo de Perfumes

Catálogo estático con React + Vite + Tailwind. Lee inventario desde Google Sheets (Apps Script) o `public/products.json`.

## Uso rápido
1) Crea `.env` con tu URL de Apps Script:
```
VITE_PRODUCTS_URL="https://script.google.com/macros/s/TU_DEPLOY_ID/exec"
```
2) Instala dependencias y corre:
```
npm install
npm run dev
```
3) Produce build:
```
npm run build
```
4) Publica en GitHub Pages:
```
npm run deploy
```