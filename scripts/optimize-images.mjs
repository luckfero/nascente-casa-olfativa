/**
 * Gera variantes responsivas (WebP + AVIF) a partir dos originais em
 * public/images/hq/. Roda com ffmpeg local — nenhuma dependência de build.
 *
 *   node scripts/optimize-images.mjs
 *
 * Saída: public/images/r/<nome>-<largura>.<webp|avif>
 * Os originais em hq/ ficam intactos e continuam servindo como fallback.
 */
import { execFile } from "node:child_process";
import { mkdir, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = join(root, "public", "images", "hq");
const OUT_DIR = join(root, "public", "images", "r");

/** Larguras alvo. Imagens menores que a largura nunca são ampliadas. */
const WIDTHS = [400, 800, 1200, 1600];

const FFMPEG =
  process.env.FFMPEG_PATH ??
  "C:/Users/lucca/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0-full_build/bin/ffmpeg.exe";
const FFPROBE = FFMPEG.replace(/ffmpeg(\.exe)?$/, "ffprobe$1");

async function widthOf(file) {
  const { stdout } = await run(FFPROBE, [
    "-v", "error",
    "-select_streams", "v:0",
    "-show_entries", "stream=width",
    "-of", "csv=p=0",
    file,
  ]);
  return Number.parseInt(stdout.trim(), 10);
}

async function encode(source, target, width, format) {
  const codec = format === "avif" ? ["-c:v", "libaom-av1", "-crf", "32", "-b:v", "0", "-cpu-used", "6"]
                                  : ["-c:v", "libwebp", "-quality", "82"];
  await run(FFMPEG, [
    "-y", "-loglevel", "error",
    "-i", source,
    "-vf", `scale=${width}:-2:flags=lanczos`,
    "-frames:v", "1",
    ...codec,
    target,
  ]);
}

async function main() {
  if (!existsSync(FFMPEG)) {
    console.error(`ffmpeg não encontrado em ${FFMPEG}\nDefina FFMPEG_PATH e rode novamente.`);
    process.exitCode = 1;
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const files = (await readdir(SOURCE_DIR)).filter((f) => f.endsWith(".webp"));
  let written = 0;
  let savedBytes = 0;

  for (const file of files) {
    const source = join(SOURCE_DIR, file);
    const { name } = parse(file);
    const sourceWidth = await widthOf(source);
    const originalSize = (await stat(source)).size;

    for (const width of WIDTHS) {
      if (width > sourceWidth) continue;
      for (const format of ["webp", "avif"]) {
        const target = join(OUT_DIR, `${name}-${width}.${format}`);
        await encode(source, target, width, format);
        written += 1;
        if (width === WIDTHS[0] && format === "avif") {
          savedBytes += originalSize - (await stat(target)).size;
        }
      }
    }
    process.stdout.write(`· ${name} (origem ${sourceWidth}px)\n`);
  }

  console.log(
    `\n${written} variantes geradas em public/images/r/.` +
      `\nEconomia no menor tamanho AVIF vs. original: ~${(savedBytes / 1024 / 1024).toFixed(1)} MB no total.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
