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
const lines = ssStrings.map(row => row.join("    "));

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

function renderSvg(theme) {
  const tspans = lines
    .map((line, index) => {
      const y = 54 + index * 34;
      return `    <tspan x="38" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="1200" height="200" viewBox="0 0 1200 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .sample {
        font-family: "Ramsevka Mono Preview";
        font-size: 24px;
        font-feature-settings: "calt" 1;
        fill: ${theme.foreground};
      }
    </style>
  </defs>

  <rect x="0.5" y="0.5" width="1199" height="199" rx="12" fill="${theme.background}" stroke="${theme.border}" />
  <text class="sample" xml:space="preserve">
${tspans}
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

for (const [themeName, theme] of Object.entries(themes)) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), `ramsevka-preview-${themeName}-`));
  const tempSvgPath = path.join(tempDir, `mono_preview.${themeName}.embedded.svg`);
  const outputPath = path.join(repoRoot, ".github/assets", `mono_preview.${themeName}.svg`);

  await fs.writeFile(tempSvgPath, renderSvg(theme));
  await convertTextToPaths(tempSvgPath, outputPath, tempDir);
  await fs.rm(tempDir, { recursive: true, force: true });
  console.log(`wrote ${outputPath}`);
}
