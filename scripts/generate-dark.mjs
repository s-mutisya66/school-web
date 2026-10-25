// Builds src/styles/dark.css from the colours your components actually use.
//
//   node scripts/generate-dark.mjs
//
// To keep a region exactly as authored in dark mode (for example a blue hero banner), add the class
// "theme-fixed" to its outer element. Nothing inside it is changed.
//
// It reads every .ts/.tsx file under src, finds the colour classes (bg-white, text-slate-600, bg-[#DCF2E4] ...)
// and SVG fill/stroke colours, and writes a dark counterpart for each one. Run it again whenever you change colours
// or add new pages, and dark mode stays in step. Nothing here changes your components.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = "src";
const OUT = "src/styles/dark.css";

// The dark theme's own colours. Change these to restyle dark mode.
const PAGE = "#0B1220";     // behind everything
const SURFACE = "#121B2E";  // cards, the sidebar, inputs
const BORDER = "#28365A";
const NEUTRAL = {
  bg:   { 50: "#17233A", 100: "#1B2842", 200: "#26344F", 300: "#34456A" },
  text: { 950: "#F8FAFC", 900: "#F1F5F9", 800: "#E2E8F0", 700: "#CBD5E1", 600: "#AAB7CB", 500: "#8E9DB5", 400: "#71829D" },
  line: { 50: "#1A2742", 100: "#1F2C48", 200: "#28365A", 300: "#34446A" },
};
const NEUTRAL_FAMILIES = new Set(["slate", "gray", "zinc", "neutral", "stone"]);

const PALETTE = {
  red:    { 50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d" },
  orange: { 50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c", 500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12" },
  amber:  { 50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f" },
  yellow: { 50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15", 500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12" },
  green:  { 50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d" },
  emerald:{ 50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399", 500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b" },
  teal:   { 50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf", 500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a" },
  cyan:   { 50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee", 500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63" },
  sky:    { 50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8", 500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e" },
  blue:   { 50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa", 500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a" },
  indigo: { 50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8", 500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81" },
  violet: { 50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa", 500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95" },
  rose:   { 50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337" },
};

// The darkest shade (950) of each family
for (const [fam, h] of Object.entries({red: "#450a0a", orange: "#431407", amber: "#451a03", yellow: "#422006", green: "#052e16", emerald: "#022c22", teal: "#042f2e", cyan: "#083344", sky: "#082f49", blue: "#172554", indigo: "#1e1b4b", violet: "#2e1065", rose: "#4c0519"})) PALETTE[fam][950] = h;

// ---- colour helpers
const norm = (h) => { h = h.replace("#", ""); if (h.length === 3) h = [...h].map((c) => c + c).join(""); return "#" + h.slice(0, 6).toUpperCase(); };
const rgb = (h) => { const n = parseInt(norm(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const hex = (a) => "#" + a.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("").toUpperCase();
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A.map((v, i) => v * t + B[i] * (1 - t))); }; // t of a, the rest b
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const sat = (h) => { const [r, g, b] = rgb(h).map((v) => v / 255); const mx = Math.max(r, g, b); return mx === 0 ? 0 : (mx - Math.min(r, g, b)) / mx; };
const lighten = (h) => mix(h, "#FFFFFF", 0.42);

// ---- read the source
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(tsx?|jsx?)$/.test(f) ? [p] : [];
  });
}
const text = walk(SRC).map((f) => readFileSync(f, "utf8")).join("\n");

// CSS variables set in code, e.g. "--brand": "#105AC9"
const vars = Object.fromEntries([...text.matchAll(/"(--[\w-]+)"\s*:\s*"(#[0-9a-fA-F]{3,6})"/g)].map((m) => [m[1], norm(m[2])]));

const tokens = new Set(text.match(/[A-Za-z0-9_:\-\/\[\]#\.\(\)%,]+/g) ?? []);
const PROP = /^(?:(hover|focus-visible|focus):)?(bg|text|border|divide|ring|fill|stroke)-(.+)$/;

const FIXED = ":not(.theme-fixed *)";
const esc = (s) => s.replace(/[^a-zA-Z0-9_-]/g, (c) => "\\" + c);

function resolve(v) {
  if (v === "white") return { hex: "#FFFFFF", white: true };
  if (v === "black") return { hex: "#000000", black: true };
  let m = v.match(/^\[(#[0-9a-fA-F]{3,8})\]$/);
  if (m) return { hex: norm(m[1]) };
  m = v.match(/^\[var\((--[\w-]+)\)\]$/);
  if (m) return vars[m[1]] ? { hex: vars[m[1]] } : null;
  m = v.match(/^([a-z]+)-(\d{2,3})$/);
  if (m) {
    const [, fam, shade] = m;
    if (NEUTRAL_FAMILIES.has(fam)) return { neutral: +shade };
    const h = PALETTE[fam]?.[shade];
    return h ? { hex: norm(h) } : null;
  }
  return null;
}

// What a colour becomes in dark mode, for each kind of property. Returns a CSS colour, or null to leave it alone.
function darkColor(kind, c, opacity) {
  if (kind === "bg") {
    if (c.white) return opacity === undefined ? SURFACE : opacity >= 50 && opacity < 100 ? "rgb(255 255 255 / 0.12)" : null;
    if (opacity !== undefined) return null;
    if (c.neutral !== undefined) return NEUTRAL.bg[c.neutral] ?? null;
    if (!c.hex) return null;
    const L = lum(c.hex);
    if (L > 0.8) return sat(c.hex) < 0.05 ? PAGE : mix(c.hex, SURFACE, 0.24);
    if (L > 0.55) return mix(c.hex, SURFACE, 0.3);
    return null;
  }
  if (kind === "text") {
    if (c.white || opacity !== undefined) return null;
    if (c.black) return "#E2E8F0";
    if (c.neutral !== undefined) return NEUTRAL.text[c.neutral] ?? null;
    return c.hex && lum(c.hex) < 0.4 ? lighten(c.hex) : null;
  }
  if (kind === "fill") {
    if (c.white || opacity !== undefined) return null;
    if (c.neutral !== undefined) return NEUTRAL.text[c.neutral] ?? null;
    if (!c.hex) return null;
    return lum(c.hex) < 0.4 ? lighten(c.hex) : lum(c.hex) > 0.85 ? NEUTRAL.line[200] : null;
  }
  // border, divide, ring, stroke: soft light lines become soft dark lines
  if (c.white || opacity !== undefined) return null;
  if (c.black) return null;
  if (c.neutral !== undefined) return NEUTRAL.line[c.neutral] ?? null;
  if (!c.hex) return null;
  return lum(c.hex) > 0.6 ? (sat(c.hex) < 0.1 ? BORDER : mix(c.hex, NEUTRAL.line[100], 0.22)) : null;
}

const rules = [];
const skipped = new Set();

for (const t of tokens) {
  const m = t.match(PROP);
  if (!m) continue;
  const [, variant, prop, rest] = m;
  let value = rest, opacity;
  const o = rest.match(/^(.*)\/(\d{1,3})$/);
  if (o) { value = o[1]; opacity = +o[2]; }

  // ring-black/5 etc: the faint dark ring around cards becomes a faint light ring
  if (prop === "ring" && value === "black" && opacity !== undefined) {
    rules.push(`.dark .${esc(t)}${FIXED} { --tw-ring-color: rgb(255 255 255 / ${Math.min(0.06 + opacity / 100, 0.2).toFixed(2)}); }`);
    continue;
  }

  const c = resolve(value);
  if (!c) { if (/^(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+$/.test(value)) skipped.add(t); continue; }

  const col = darkColor(prop === "divide" ? "line" : prop, c, opacity);
  if (!col) continue;

  const state = variant === "hover" ? ":hover" : variant === "focus-visible" ? ":focus-visible" : variant === "focus" ? ":focus" : "";
  const sel = `.dark .${esc(t)}${state}${FIXED}`;
  if (prop === "bg") rules.push(`${sel} { background-color: ${col}; }`);
  else if (prop === "text") rules.push(`${sel} { color: ${col}; }`);
  else if (prop === "fill") rules.push(`${sel} { fill: ${col}; }`);
  else if (prop === "stroke") rules.push(`${sel} { stroke: ${col}; }`);
  else if (prop === "ring") rules.push(`${sel} { --tw-ring-color: ${col}; }`);
  else if (prop === "border") rules.push(`${sel} { border-color: ${col}; }`);
  else if (prop === "divide") rules.push(`.dark .${esc(t)}${FIXED} > :not([hidden]) ~ :not([hidden]), .dark .${esc(t)}${FIXED} > :not(:last-child) { border-color: ${col}; }`);
}

// Literal SVG colours, e.g. <text fill="#334155"> and <line stroke="#E2E8F0">.
// Each colour is matched exactly as written, and in upper and lower case.
const literals = new Map();
const addLiteral = (attr, h) => { const key = `${attr}|${norm(h)}`; literals.set(key, [...(literals.get(key) ?? []), h]); };
for (const m of text.matchAll(/\b(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g)) addLiteral(m[1], m[2]);
// ...and colours written inside an expression, e.g. stroke={t === 0 ? "#94A3B8" : "#E2E8F0"}
for (const m of text.matchAll(/\b(fill|stroke)=\{([^}]*)\}/g)) for (const h of m[2].matchAll(/"(#[0-9a-fA-F]{3,6})"/g)) addLiteral(m[1], h[1]);
for (const [key, written] of literals) {
  const [attr, h] = key.split("|");
  const L = lum(h);
  const col = attr === "fill" ? (L < 0.4 ? lighten(h) : L > 0.85 ? NEUTRAL.line[200] : null) : (L > 0.6 ? BORDER : L < 0.25 ? lighten(h) : null);
  if (!col) continue;
  const forms = [...new Set([...written, h, h.toLowerCase()])];
  rules.push(`${forms.map((f) => `.dark [${attr}="${f}"]${FIXED}`).join(", ")} { ${attr}: ${col}; }`);
}

rules.sort();
const css = `/* Generated by scripts/generate-dark.mjs. Do not edit by hand: change the colours in that script and run it again. */
@media screen {
  html.dark { color-scheme: dark; --background: ${PAGE}; --foreground: #E2E8F0; }
  html:not(.dark) { --background: #ffffff; --foreground: #171717; }
  html.dark body { background-color: ${PAGE}; color: #E2E8F0; }
  .dark input, .dark select, .dark textarea { color-scheme: dark; }
  .dark ::placeholder { color: #71829D; }

${rules.map((r) => "  " + r).join("\n")}
}
`;

mkdirSync("src/styles", { recursive: true });
writeFileSync(OUT, css);
console.log(`Wrote ${OUT}: ${rules.length} rules from ${tokens.size} class names.`);
if (skipped.size) console.log(`Not themed (colour not in the built-in palette): ${[...skipped].join(", ")}`);
