#!/usr/bin/env node

import fs from "node:fs/promises";
import { accessSync, constants as fsConstants } from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const upstreamRoot = "/home/ramblurr/src/github.com/be5invis/Iosevka";
const upstreamTemplatePath = path.join(
  upstreamRoot,
  "tools/generate-samples/src/templates/package-sample.mjs",
);

function fileExists(filePath) {
  try {
    accessSync(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveFontPath() {
  const explicitFontPath = process.env.RAMSEVKA_MONO_TTF;
  if (explicitFontPath && fileExists(explicitFontPath)) {
    return explicitFontPath;
  }

  const resultFontPath = path.join(
    repoRoot,
    "result/share/fonts/truetype/RamsevkaMono-Regular.ttf",
  );
  if (fileExists(resultFontPath)) {
    return resultFontPath;
  }

  throw new Error(
    "Ramsevka Mono is not built yet. Run `nix build .#ramsevka-mono -o result` first, or use `preview-build`, then re-run `gen-previews`. You can also set RAMSEVKA_MONO_TTF to a specific TTF path.",
  );
}

const fontPath = resolveFontPath();

const { ssStrings } = await import(pathToFileURL(upstreamTemplatePath).href);

const glyphGridRows = [
      ["*", "!", '"', "#", "$", "%", "&", "'", "(", ")", "*", "+", ",", "-", ".", "/"],
      ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ":", ";", "<", "=", ">", "?"],
      ["@", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O"],
      ["P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "[", "\\", "]", "^", "_"],
      ["`", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"],
      ["p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "{", "|", "}", "~", "🯅"],
      ["←", "↑", "→", "↓", "■", "□", "▲", "△", "◇", "◈", "≤", "≥", "λ", "β", "€", "Σ"],
    ];
const glyphGridExtraLines = [
      "->  ->>  -<>  -<>>  -<><  -<><:  -<<  -<<:  -<  -<:  ;;",
      "#{  #(  #_  #_(  #?  #:  .-  ~@  && ||  /\\  \\/  -|"
    ];



const previewSpecs = [
  {
    name: "mono_preview",
    width: 1200,
    height: 200,
    fontSize: 24,
    startX: 38,
    startY: 54,
    lineHeight: 34,
    lines: ssStrings.map(row => row.join("    ")),
  },
  {
    name: "mono_glyph_grid",
    width: 856,
    height: (glyphGridExtraLines.length + glyphGridRows.length) * 56,
    fontSize: 28,
    startX: 16,
    startY: 38,
    lineHeight: 56,
    cellWidth: 52,
    rows: glyphGridRows,
    extraLines: glyphGridExtraLines,
    themeOverrides: {
      light: {
        background: "#f9f5d7",
        foreground: "#3c3836",
        border: "#d79921",
      },
      dark: {
        background: "#1d2021",
        foreground: "#ebdbb2",
        border: "#d79921",
      },
    },
  },
  {
    name: "hero_clojure",
    width: 1280,
    height: 640,
    fontSize: 34,
    startX: 92,
    startY: 118,
    lineHeight: 54,
    lineClass: "hero-sample",
    featureSettings: '"calt" 1, "dlig" 1',
    title: {
      text: "Ramsevka",
      x: 1232,
      y: 52,
      className: "hero-title",
      anchor: "end",
    },
    themeOverrides: {
      light: {
        background: "#f9f5d7",
        foreground: "#3c3836",
        border: "#d79921",
        title: "#b57614",
        definition: "#076678",
        constant: "#79740e",
        comment: "#b57614",
        disabled: "#928374",
      },
      dark: {
        background: "#1d2021",
        foreground: "#ebdbb2",
        border: "#d79921",
        title: "#fabd2f",
        definition: "#83a598",
        constant: "#b8bb26",
        comment: "#fabd2f",
        disabled: "#928374",
      },
    },
    segmentedLines: [
      [
        { text: "(defmacro " },
        { text: "defkey", className: "hero-definition" },
        { text: " [key & body]" },
      ],
      [
        { text: "  `(def ~(.-name key) ~@body))" },
      ],
      [],
      [
        { text: "(defkey " },
        { text: "::args", className: "hero-definition" },
        { text: "" },
      ],
      [
        { text: "  (->> (range)" },
      ],
      [
        { text: "       #_(filterv even?)", className: "hero-disabled" },
        { text: " " },
        { text: ";;FIXME", className: "hero-comment" },
      ],
      [
        { text: "       (take-while #(<= % " },
        { text: "0xFF", className: "hero-constant" },
        { text: "))" },
      ],
      [
        { text: "       (remove #{" },
        { text: "0 1 2 3 4 5", className: "hero-constant" },
        { text: "})" },
      ],
      [
        { text: "       (into [])))" },
      ],
    ],
  },
];

const themes = {
  light: {
    background: "#f7f7f7",
    foreground: "#1f2328",
    border: "#d0d7de",
  },
  dark: {
    background: "#0d1117",
    foreground: "#e6edf3",
    border: "#30363d",
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

function renderSvg(previewSpec, theme, themeName) {
  const themeOverride = previewSpec.themeOverrides?.[themeName] ?? {};
  const effectiveTheme = {
    background: themeOverride.background ?? previewSpec.background ?? theme.background,
    foreground: themeOverride.foreground ?? previewSpec.textColor ?? theme.foreground,
    border: themeOverride.border ?? previewSpec.border ?? theme.border,
    title: themeOverride.title ?? themeOverride.foreground ?? previewSpec.textColor ?? theme.foreground,
    definition: themeOverride.definition ?? themeOverride.foreground ?? previewSpec.textColor ?? theme.foreground,
    constant: themeOverride.constant ?? themeOverride.foreground ?? previewSpec.textColor ?? theme.foreground,
    comment: themeOverride.comment ?? themeOverride.foreground ?? previewSpec.textColor ?? theme.foreground,
    disabled: themeOverride.disabled ?? themeOverride.foreground ?? previewSpec.textColor ?? theme.foreground,
  };
  const lineClass = previewSpec.lineClass ?? "sample";
  const featureSettings = previewSpec.featureSettings ?? '"calt" 1, "dlig" 1';
  const titleContent = previewSpec.title
    ? `\n  <text class="${previewSpec.title.className}" x="${previewSpec.title.x}" y="${previewSpec.title.y}" text-anchor="${previewSpec.title.anchor ?? "start"}">${escapeXml(previewSpec.title.text)}</text>`
    : "";

  const segmentedLineContent = (previewSpec.segmentedLines ?? [])
    .map((segments, index) => {
      const y = previewSpec.startY + index * previewSpec.lineHeight;
      if (segments.length === 0) {
        return `    <tspan x="${previewSpec.startX}" y="${y}"></tspan>`;
      }
      const inner = segments
        .map(segment => {
          const classAttr = segment.className ? ` class="${segment.className}"` : "";
          return `<tspan${classAttr}>${escapeXml(segment.text)}</tspan>`;
        })
        .join("");
      return `    <tspan x="${previewSpec.startX}" y="${y}">${inner}</tspan>`;
    })
    .join("\n");

  const rowContent = previewSpec.rows
    ? previewSpec.rows
        .map((row, rowIndex) => {
          const y = previewSpec.startY + rowIndex * previewSpec.lineHeight;
          const tspans = row
            .map((cell, colIndex) => {
              const x = previewSpec.startX + colIndex * previewSpec.cellWidth;
              return `    <tspan x="${x}" y="${y}">${escapeXml(cell)}</tspan>`;
            })
            .join("\n");
          return tspans;
        })
        .join("\n")
    : "";

  const baseLineCount = previewSpec.rows ? previewSpec.rows.length : 0;
  const lineSource = previewSpec.rows ? (previewSpec.extraLines ?? []) : (previewSpec.segmentedLines ? [] : previewSpec.lines);
  const lineContent = lineSource
    .map((line, index) => {
      const y = previewSpec.startY + (baseLineCount + index) * previewSpec.lineHeight;
      return `    <tspan x="${previewSpec.startX}" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join("\n");

  const textContent = [rowContent, segmentedLineContent, lineContent].filter(Boolean).join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${previewSpec.width}" height="${previewSpec.height}" viewBox="0 0 ${previewSpec.width} ${previewSpec.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .sample {
        font-family: "Ramsevka Mono Preview";
        font-size: ${previewSpec.fontSize}px;
        font-feature-settings: ${featureSettings};
        fill: ${effectiveTheme.foreground};
      }
      .hero-sample {
        font-family: "Ramsevka Mono Preview";
        font-size: ${previewSpec.fontSize}px;
        font-feature-settings: ${featureSettings};
        fill: ${effectiveTheme.foreground};
      }
      .hero-title {
        font-family: "Ramsevka Mono Preview";
        font-size: 28px;
        fill: ${effectiveTheme.title};
      }
      .hero-definition {
        fill: ${effectiveTheme.definition};
      }
      .hero-constant {
        fill: ${effectiveTheme.constant};
      }
      .hero-comment {
        fill: ${effectiveTheme.comment};
      }
      .hero-disabled {
        fill: ${effectiveTheme.disabled};
      }
    </style>
  </defs>

  <rect x="1" y="1" width="${previewSpec.width - 2}" height="${previewSpec.height - 2}" fill="${effectiveTheme.background}" stroke="${effectiveTheme.border}" stroke-width="2" />${titleContent}
  <text class="${lineClass}" xml:space="preserve">
${textContent}
  </text>
</svg>
`;
}

async function convertTextToPaths(inputPath, outputPath, tempDir) {
  const fontsConfPath = path.join(tempDir, "fonts.conf");
  await fs.writeFile(
    fontsConfPath,
    `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${escapeXml(path.dirname(fontPath))}</dir>
  <cachedir>${escapeXml(path.join(tempDir, "fontconfig-cache"))}</cachedir>
  <config></config>
</fontconfig>
`,
  );

  execFileSync("inkscape", [
    inputPath,
    `--export-plain-svg=${outputPath}`,
    "--actions=select-all:all;object-to-path;export-do",
  ], {
    stdio: ["ignore", "ignore", "ignore"],
    env: {
      ...process.env,
      FONTCONFIG_FILE: fontsConfPath,
      FONTCONFIG_PATH: tempDir,
    },
  });

  let output = await fs.readFile(outputPath, "utf8");
  output = output.replace(/<defs[\s\S]*?<\/defs>\s*/m, "");
  await fs.writeFile(outputPath, output);
}

await fs.mkdir(path.join(repoRoot, ".github/assets"), { recursive: true });
console.log(`using font ${fontPath}`);

for (const previewSpec of previewSpecs) {
  for (const [themeName, theme] of Object.entries(themes)) {
    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), `ramsevka-${previewSpec.name}-${themeName}-`),
    );
    const tempSvgPath = path.join(tempDir, `${previewSpec.name}.${themeName}.embedded.svg`);
    const outputPath = path.join(
      repoRoot,
      ".github/assets",
      `${previewSpec.name}.${themeName}.svg`,
    );

    await fs.writeFile(tempSvgPath, renderSvg(previewSpec, theme, themeName));
    await convertTextToPaths(tempSvgPath, outputPath, tempDir);
    await fs.rm(
      path.join(repoRoot, ".github/assets", `${previewSpec.name}.svg`),
      { force: true },
    );
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log(`wrote ${outputPath}`);
  }
}
