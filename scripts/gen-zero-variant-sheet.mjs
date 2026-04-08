#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const upstreamImagesDir = "/home/ramblurr/src/github.com/be5invis/Iosevka/images";
const outDir = path.resolve(".github/assets");

async function listVariants() {
  const entries = await fs.readdir(upstreamImagesDir);
  return entries
    .filter(name => name.startsWith("cv-zero-") && name.endsWith(".dark.svg"))
    .map(name => name.replace(/^cv-zero-/, "").replace(/\.dark\.svg$/, ""))
    .sort((a, b) => a.localeCompare(b));
}

const themes = {
  light: {
    background: "#f8fafc",
    border: "#d6dee6",
    foreground: "#101618",
    label: "#2c3a3e",
    cellBackground: "#ffffff",
  },
  dark: {
    background: "#0b1113",
    border: "#28343a",
    foreground: "#dee4e3",
    label: "#b8c4c2",
    cellBackground: "#10181b",
  },
};

function escapeXml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function loadVariant(themeName, variant) {
  const file = path.join(upstreamImagesDir, `cv-zero-${variant}.${themeName}.svg`);
  const svg = await fs.readFile(file, "utf8");
  const dMatch = svg.match(/<path d="([^"]+)" id="path1"\/>/);
  const transformMatch = svg.match(/data-source-text="0" fill="[^"]+" transform="([^"]+)"/);

  if (!dMatch || !transformMatch) {
    throw new Error(`Could not parse ${file}`);
  }

  return {
    d: dMatch[1],
    transform: transformMatch[1],
  };
}

async function renderTheme(themeName, theme, variants) {
  const glyphs = await Promise.all(variants.map(variant => loadVariant(themeName, variant)));

  const columns = 4;
  const cellWidth = 260;
  const cellHeight = 210;
  const gutter = 18;
  const padding = 24;
  const labelHeight = 42;
  const glyphBoxHeight = 136;
  const titleHeight = 44;

  const rows = Math.ceil(variants.length / columns);
  const width = padding * 2 + columns * cellWidth + (columns - 1) * gutter;
  const height = padding * 2 + titleHeight + rows * cellHeight + (rows - 1) * gutter;

  const cells = variants
    .map((variant, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = padding + col * (cellWidth + gutter);
      const y = padding + titleHeight + row * (cellHeight + gutter);
      const glyph = glyphs[index];
      const glyphX = x + 66;
      const glyphY = y + 20;
      const labelX = x + cellWidth / 2;
      const labelY = y + glyphBoxHeight + 28;

      return `
  <g transform="translate(${x} ${y})">
    <rect x="0.5" y="0.5" width="${cellWidth - 1}" height="${cellHeight - 1}" rx="12" fill="${theme.cellBackground}" stroke="${theme.border}" />
  </g>
  <g transform="translate(${glyphX} ${glyphY})">
    <path d="${glyph.d}" transform="${glyph.transform}" fill="${theme.foreground}" />
  </g>
  <text x="${labelX}" y="${labelY}" text-anchor="middle" font-family="sans-serif" font-size="16" fill="${theme.label}">${escapeXml(variant)}</text>`;
    })
    .join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="16" fill="${theme.background}" stroke="${theme.border}" />
  <text x="${padding}" y="${padding + 22}" font-family="sans-serif" font-size="22" font-weight="600" fill="${theme.foreground}">All zero variants</text>
  <text x="${padding}" y="${padding + 22 + 22}" font-family="sans-serif" font-size="14" fill="${theme.label}">54 upstream Iosevka zero variants, extracted from preview assets</text>
${cells}
</svg>
`;

  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `zero_variants.${themeName}.svg`);
  await fs.writeFile(outPath, svg);
  return outPath;
}

const variants = await listVariants();

for (const [themeName, theme] of Object.entries(themes)) {
  const outPath = await renderTheme(themeName, theme, variants);
  console.log(outPath);
}
