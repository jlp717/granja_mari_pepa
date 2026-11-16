import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;

class NapiCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext("2d") };
  }
  reset(target, width, height) {
    target.canvas.width = width;
    target.canvas.height = height;
  }
  destroy(target) {
    target.canvas.width = 0;
    target.canvas.height = 0;
  }
}

const dir = path.resolve("public/catalogs");
const outDir = path.join(dir, "covers");
await fs.mkdir(outDir, { recursive: true });

const files = (await fs.readdir(dir)).filter((name) => name.toLowerCase().endsWith(".pdf"));
for (const file of files) {
  const data = new Uint8Array(await fs.readFile(path.join(dir, file)));
  const pdf = await getDocument({
    data,
    CanvasFactory: NapiCanvasFactory,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;
  const page = await pdf.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const width = 520;
  const viewport = page.getViewport({ scale: width / base.width });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;
  const jpeg = await canvas.encode("jpeg", 82);
  const out = path.join(outDir, file.replace(/\.pdf$/i, ".jpg"));
  await fs.writeFile(out, jpeg);
  console.log("COVER", out, Math.round(jpeg.length / 1024) + "KB");
  await pdf.destroy();
}
