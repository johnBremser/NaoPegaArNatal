import { NatalMood } from './types';

export interface SpriteFrame {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface NatalAssets {
  loaded: boolean;
  heroPortraitUrl: string;
  heroCanvas: HTMLCanvasElement | null;
  rows: SpriteFrame[][];
}

// Spritesheet dimensions: 1536 x 2288 => 8 cols x 11 rows (192 x 208 per cell)
const SHEET_COLS = 8;
const SHEET_ROWS = 11;

export const NATAL_ANIM_ROW = {
  IDLE: 0,
  WALK: 1,
  WALK_HAPPY: 2,
  WAVE: 3,
  JUMP: 4,
  ANGRY: 5,
  RELIEVED: 6,
  EAT: 7,
  GRIN: 8,
  CURIOUS: 9,
  FLOATING: 10,
} as const;

let cachedAssets: NatalAssets | null = null;
let loadingPromise: Promise<NatalAssets> | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

function cleanHeroMagenta(img: HTMLImageElement): { canvas: HTMLCanvasElement; dataUrl: string } {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const magentaDiff = Math.min(r, b) - g;
    if (r > 165 && b > 165 && g < 130 && magentaDiff > 55) {
      d[i + 3] = 0;
    } else if (magentaDiff > 25 && r > 120 && b > 120 && g < 150) {
      // Soft despill on anti-aliased border pixels
      const factor = Math.min(1, (magentaDiff - 25) / 45);
      d[i + 3] = Math.round(d[i + 3] * (1 - factor));
      d[i] = Math.round(g * 0.9);
      d[i + 2] = Math.round(g * 0.9);
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return { canvas: c, dataUrl: c.toDataURL('image/png') };
}

function extractCleanCell(
  sheetCtx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  cw: number,
  ch: number
): SpriteFrame | null {
  const cellData = sheetCtx.getImageData(sx, sy, cw, ch);
  const d = cellData.data;

  const isNearWhite = (idx: number) => {
    const a = d[idx + 3];
    if (a < 20) return true;
    const r = d[idx];
    const g = d[idx + 1];
    const b = d[idx + 2];
    return r > 228 && g > 228 && b > 228;
  };

  // Flood-fill transparent from cell borders if corner is near-white & opaque
  const visited = new Uint8Array(cw * ch);
  const queue = new Int32Array(cw * ch);
  let head = 0;
  let tail = 0;

  const enqueue = (x: number, y: number) => {
    const p = y * cw + x;
    if (visited[p]) return;
    if (!isNearWhite(p * 4)) return;
    visited[p] = 1;
    queue[tail++] = p;
  };

  for (let x = 0; x < cw; x++) {
    enqueue(x, 0);
    enqueue(x, ch - 1);
  }
  for (let y = 0; y < ch; y++) {
    enqueue(0, y);
    enqueue(cw - 1, y);
  }

  while (head < tail) {
    const p = queue[head++];
    d[p * 4 + 3] = 0;
    const x = p % cw;
    const y = (p - x) / cw;
    if (x > 0) enqueue(x - 1, y);
    if (x < cw - 1) enqueue(x + 1, y);
    if (y > 0) enqueue(x, y - 1);
    if (y < ch - 1) enqueue(x, y + 1);
  }

  // Softly clean 1px light-gray halo adjacent to cleared pixels
  for (let y = 1; y < ch - 1; y++) {
    for (let x = 1; x < cw - 1; x++) {
      const p = y * cw + x;
      if (visited[p]) continue;
      const idx = p * 4;
      if (d[idx + 3] === 0) continue;
      const r = d[idx];
      const g = d[idx + 1];
      const b = d[idx + 2];
      if (r > 185 && g > 185 && b > 185) {
        const touchesBg =
          visited[p - 1] || visited[p + 1] || visited[p - cw] || visited[p + cw];
        if (touchesBg) {
          const lum = (r + g + b) / 3;
          const alphaScale = Math.max(0, 1 - (lum - 185) / 60);
          d[idx + 3] = Math.round(d[idx + 3] * alphaScale);
        }
      }
    }
  }

  // Compute tight bounding box of visible pixels
  let minX = cw;
  let minY = ch;
  let maxX = -1;
  let maxY = -1;
  let visibleCount = 0;

  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const a = d[(y * cw + x) * 4 + 3];
      if (a > 24) {
        visibleCount++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (visibleCount < 80 || maxX <= minX || maxY <= minY) {
    return null;
  }

  const temp = document.createElement('canvas');
  temp.width = cw;
  temp.height = ch;
  temp.getContext('2d')!.putImageData(cellData, 0, 0);

  const pad = 2;
  const tw = Math.min(cw, maxX - minX + 1 + pad * 2);
  const th = Math.min(ch, maxY - minY + 1 + pad * 2);
  const cropped = document.createElement('canvas');
  cropped.width = tw;
  cropped.height = th;
  cropped
    .getContext('2d')!
    .drawImage(
      temp,
      Math.max(0, minX - pad),
      Math.max(0, minY - pad),
      tw,
      th,
      0,
      0,
      tw,
      th
    );

  return { canvas: cropped, width: tw, height: th };
}

export function loadNatalAssets(): Promise<NatalAssets> {
  if (cachedAssets) return Promise.resolve(cachedAssets);
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const [heroResult, sheetResult] = await Promise.allSettled([
      loadImage('/assets/aistudio/natal-conceito-revisado_e19001b2.png'),
      loadImage('/assets/aistudio/spritesheet-extended_3d6f1bab.png'),
    ]);

    let heroPortraitUrl = '/assets/aistudio/natal-conceito-revisado_e19001b2.png';
    let heroCanvas: HTMLCanvasElement | null = null;
    if (heroResult.status === 'fulfilled') {
      const cleaned = cleanHeroMagenta(heroResult.value);
      heroPortraitUrl = cleaned.dataUrl;
      heroCanvas = cleaned.canvas;
    }

    const rows: SpriteFrame[][] = Array.from({ length: SHEET_ROWS }, () => []);
    if (sheetResult.status === 'fulfilled') {
      const sheet = sheetResult.value;
      const sc = document.createElement('canvas');
      sc.width = sheet.naturalWidth;
      sc.height = sheet.naturalHeight;
      const sctx = sc.getContext('2d', { willReadFrequently: true })!;
      sctx.drawImage(sheet, 0, 0);

      const cellW = Math.floor(sheet.naturalWidth / SHEET_COLS);
      const cellH = Math.floor(sheet.naturalHeight / SHEET_ROWS);

      for (let r = 0; r < SHEET_ROWS; r++) {
        for (let c = 0; c < SHEET_COLS; c++) {
          const frame = extractCleanCell(sctx, c * cellW, r * cellH, cellW, cellH);
          if (frame) {
            rows[r].push(frame);
          }
        }
      }
    }

    cachedAssets = {
      loaded: rows.some((r) => r.length > 0),
      heroPortraitUrl,
      heroCanvas,
      rows,
    };
    return cachedAssets;
  })();

  return loadingPromise;
}

// Reusable scratch canvas for red anger tinting without affecting background
let tintScratch: HTMLCanvasElement | null = null;

export interface DrawNatalParams {
  ctx: CanvasRenderingContext2D;
  assets: NatalAssets;
  centerX: number;
  bottomY: number;
  targetHeight: number;
  mood: NatalMood;
  facingDir: 1 | -1;
  anger: number;
  animTime: number;
  reactionTimer: number;
  inflateScale: number;
  wobblePhase: number;
}

export function drawNatalSprite({
  ctx,
  assets,
  centerX,
  bottomY,
  targetHeight,
  mood,
  facingDir,
  anger,
  animTime,
  reactionTimer,
  inflateScale,
  wobblePhase,
}: DrawNatalParams): { width: number; height: number; centerY: number } {
  let rowIndex: number = NATAL_ANIM_ROW.IDLE;
  let fps = 6;

  if (mood === 'happy') {
    rowIndex = reactionTimer > 0.28 ? NATAL_ANIM_ROW.EAT : NATAL_ANIM_ROW.JUMP;
    fps = 11;
  } else if (mood === 'relieved') {
    rowIndex = NATAL_ANIM_ROW.RELIEVED;
    fps = 8;
  } else if (mood === 'floating') {
    rowIndex = NATAL_ANIM_ROW.FLOATING;
    fps = 10;
  } else if (mood === 'very_angry') {
    rowIndex = anger >= 70 ? NATAL_ANIM_ROW.FLOATING : NATAL_ANIM_ROW.ANGRY;
    fps = 11;
  } else if (mood === 'angry') {
    rowIndex = NATAL_ANIM_ROW.ANGRY;
    fps = 9;
  } else {
    rowIndex = facingDir >= 0 ? NATAL_ANIM_ROW.WALK : NATAL_ANIM_ROW.WALK_HAPPY;
    fps = 10;
  }

  const rowFrames = assets.rows[rowIndex]?.length
    ? assets.rows[rowIndex]
    : assets.rows[0]?.length
    ? assets.rows[0]
    : [];

  const frame = rowFrames.length
    ? rowFrames[Math.floor(animTime * fps) % rowFrames.length]
    : null;

  // Calculate red tint intensity (0 at anger < 25, ramps smoothly up to 0.56 at anger 100)
  const angerTint =
    anger <= 25 ? 0 : Math.min(0.56, ((anger - 25) / 75) * 0.56);

  // Squash & stretch + balloon inflation
  const pulse = anger >= 60 ? 1 + Math.sin(wobblePhase * 6) * 0.035 : 1;
  const happyBounce =
    mood === 'happy' ? 1 + Math.sin(reactionTimer * 18) * 0.06 : 1;
  const scaleX = inflateScale * pulse * (2 - happyBounce);
  const scaleY = inflateScale * (2 - pulse * 0.98) * happyBounce;

  const baseH = targetHeight;
  const aspect = frame ? frame.width / frame.height : 0.85;
  const drawW = baseH * aspect * scaleX;
  const drawH = baseH * scaleY;

  // Jitter when angry
  let shakeX = 0;
  let shakeY = 0;
  if (anger >= 30 && mood !== 'happy' && mood !== 'relieved') {
    const amp = anger >= 80 ? 3.5 : anger >= 60 ? 2.2 : 1.1;
    shakeX = Math.sin(animTime * 36) * amp;
    shakeY = Math.cos(animTime * 29) * (amp * 0.5);
  }

  const cx = centerX + shakeX;
  const by = bottomY + shakeY;

  // Draw red aura behind Natal when heating up / floating
  if (anger >= 35) {
    const auraAlpha = Math.min(0.32, ((anger - 35) / 65) * 0.32);
    const grad = ctx.createRadialGradient(
      cx,
      by - drawH * 0.5,
      drawW * 0.15,
      cx,
      by - drawH * 0.5,
      drawW * 0.85
    );
    grad.addColorStop(0, `rgba(239, 68, 68, ${auraAlpha})`);
    grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, by - drawH * 0.5, drawW * 0.85, 0, Math.PI * 2);
    ctx.fill();
  }

  if (frame) {
    if (!tintScratch) {
      tintScratch = document.createElement('canvas');
    }
    const sw = Math.ceil(frame.width);
    const sh = Math.ceil(frame.height);
    if (tintScratch.width !== sw || tintScratch.height !== sh) {
      tintScratch.width = sw;
      tintScratch.height = sh;
    }
    const tctx = tintScratch.getContext('2d')!;
    tctx.clearRect(0, 0, sw, sh);
    tctx.globalCompositeOperation = 'source-over';
    tctx.globalAlpha = 1;
    tctx.drawImage(frame.canvas, 0, 0);

    if (angerTint > 0.01) {
      tctx.globalCompositeOperation = 'source-atop';
      tctx.fillStyle = `rgba(225, 29, 48, ${angerTint})`;
      tctx.fillRect(0, 0, sw, sh);
      tctx.globalCompositeOperation = 'source-over';
    }

    ctx.save();
    ctx.translate(cx, by);
    if (anger >= 60) {
      const tilt = Math.sin(wobblePhase * 2.5) * 0.06;
      ctx.rotate(tilt);
    }
    ctx.drawImage(tintScratch, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  } else if (assets.heroCanvas) {
    ctx.save();
    ctx.translate(cx, by);
    ctx.drawImage(assets.heroCanvas, -drawW / 2, -drawH, drawW, drawH);
    ctx.restore();
  }

  // Expressive cartoon overlays (sweat drops / angry vein / steam puffs)
  if (anger >= 35 && mood !== 'happy' && mood !== 'relieved') {
    const headY = by - drawH * 0.84;
    // Angry cartoon cross vein on forehead
    if (anger >= 55) {
      const vx = cx + drawW * 0.16;
      const vy = headY;
      const pulseV = 1 + Math.sin(animTime * 14) * 0.18;
      ctx.save();
      ctx.translate(vx, vy);
      ctx.scale(pulseV, pulseV);
      ctx.strokeStyle = '#991B1B';
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-6, -3);
      ctx.quadraticCurveTo(-2, -1, -3, -6);
      ctx.moveTo(6, -3);
      ctx.quadraticCurveTo(2, -1, 3, -6);
      ctx.moveTo(-6, 3);
      ctx.quadraticCurveTo(-2, 1, -3, 6);
      ctx.moveTo(6, 3);
      ctx.quadraticCurveTo(2, 1, 3, 6);
      ctx.stroke();
      ctx.restore();
    }

    // Sweat drop
    const dropPhase = (animTime * 1.8) % 1;
    ctx.save();
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 1.5;
    const dx = cx - drawW * 0.27;
    const dy = headY + dropPhase * 16;
    ctx.globalAlpha = 1 - dropPhase * 0.7;
    ctx.beginPath();
    ctx.moveTo(dx, dy - 6);
    ctx.quadraticCurveTo(dx + 5, dy + 2, dx, dy + 5);
    ctx.quadraticCurveTo(dx - 5, dy + 2, dx, dy - 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  return {
    width: drawW,
    height: drawH,
    centerY: by - drawH * 0.5,
  };
}
