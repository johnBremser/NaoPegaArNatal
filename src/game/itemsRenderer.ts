import { FOOD_ITEMS, FoodItemId } from './types';

const OUTLINE = '#1E1B18';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function drawFoodItem(
  ctx: CanvasRenderingContext2D,
  id: FoodItemId,
  x: number,
  y: number,
  size: number,
  rotation = 0
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  const s = size / 24;
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  // Soft shadow halo so item reads cleanly against any background
  ctx.fillStyle = 'rgba(30, 27, 24, 0.12)';
  ctx.beginPath();
  ctx.arc(0, 3, 22, 0, Math.PI * 2);
  ctx.fill();

  switch (id) {
    case 'hamburguer': {
      // Bottom bun
      ctx.fillStyle = '#E59A38';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      roundRect(ctx, -18, 6, 36, 9, 5);
      ctx.fill();
      ctx.stroke();

      // Patty
      ctx.fillStyle = '#6B3418';
      roundRect(ctx, -19, 0, 38, 8, 4);
      ctx.fill();
      ctx.stroke();

      // Melted cheese triangle
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.moveTo(-17, 1);
      ctx.lineTo(17, 1);
      ctx.lineTo(7, 8);
      ctx.lineTo(-4, 2);
      ctx.lineTo(-12, 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lettuce wave
      ctx.fillStyle = '#4ADE80';
      ctx.beginPath();
      ctx.moveTo(-18, -2);
      ctx.quadraticCurveTo(-11, -7, -5, -2);
      ctx.quadraticCurveTo(2, 2, 8, -3);
      ctx.quadraticCurveTo(14, -7, 18, -2);
      ctx.lineTo(18, 2);
      ctx.lineTo(-18, 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Top bun
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, -3, 18, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sesame seeds
      ctx.fillStyle = '#FEF3C7';
      [
        [-8, -10],
        [0, -13],
        [8, -9],
        [-3, -7],
        [5, -6],
      ].forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.ellipse(sx, sy, 2, 1.1, 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }

    case 'pizza': {
      // Slice body
      ctx.fillStyle = '#FCD34D';
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-16, -12);
      ctx.lineTo(16, -12);
      ctx.lineTo(0, 20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crust
      ctx.fillStyle = '#D97706';
      roundRect(ctx, -18, -17, 36, 8, 4);
      ctx.fill();
      ctx.stroke();

      // Pepperoni circles
      ctx.fillStyle = '#DC2626';
      [
        [-6, -4, 4],
        [5, -3, 3.8],
        [-1, 6, 3.6],
      ].forEach(([px, py, pr]) => {
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      break;
    }

    case 'batata_frita': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.4;

      // Fries sticks
      const fries = [
        [-11, -18, -0.18],
        [-5, -21, -0.06],
        [1, -22, 0.04],
        [7, -19, 0.14],
        [12, -16, 0.24],
      ];
      fries.forEach(([fx, fy, rot]) => {
        ctx.save();
        ctx.translate(fx, fy);
        ctx.rotate(rot);
        ctx.fillStyle = '#FACC15';
        roundRect(ctx, -3, 0, 6, 20, 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // Red carton
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.moveTo(-15, -4);
      ctx.quadraticCurveTo(0, 2, 15, -4);
      ctx.lineTo(11, 18);
      ctx.lineTo(-11, 18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Yellow stripe emblem
      ctx.fillStyle = '#FDE047';
      ctx.beginPath();
      ctx.arc(0, 7, 4.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'chocolate': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;

      // Foil wrapper bottom
      ctx.fillStyle = '#E11D48';
      roundRect(ctx, -13, 0, 26, 18, 3);
      ctx.fill();
      ctx.stroke();

      // Silver foil rim
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(-5, -3);
      ctx.lineTo(4, 2);
      ctx.lineTo(14, -2);
      ctx.lineTo(13, 5);
      ctx.lineTo(-13, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Chocolate bar squares sticking out
      ctx.fillStyle = '#5C2B14';
      roundRect(ctx, -11, -18, 22, 18, 3);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#3B1909';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, -1);
      ctx.moveTo(-11, -9);
      ctx.lineTo(11, -9);
      ctx.stroke();
      break;
    }

    case 'sorvete': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;

      // Cone
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(-11, -1);
      ctx.lineTo(11, -1);
      ctx.lineTo(0, 21);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Waffle lines
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, 4);
      ctx.lineTo(5, 11);
      ctx.moveTo(7, 4);
      ctx.lineTo(-5, 11);
      ctx.stroke();

      // Scoops
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#F472B6';
      ctx.beginPath();
      ctx.arc(-6, -5, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FEF3C7';
      ctx.beginPath();
      ctx.arc(6, -5, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FB7185';
      ctx.beginPath();
      ctx.arc(0, -12, 9.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cherry
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(0, -21, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'milkshake': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;

      // Straw
      ctx.fillStyle = '#F43F5E';
      ctx.save();
      ctx.translate(5, -16);
      ctx.rotate(0.2);
      roundRect(ctx, -2.5, -9, 5, 14, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Tall glass
      ctx.fillStyle = '#FDA4AF';
      ctx.beginPath();
      ctx.moveTo(-12, -5);
      ctx.lineTo(12, -5);
      ctx.lineTo(8, 19);
      ctx.lineTo(-8, 19);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glass shine
      ctx.strokeStyle = '#FFF1F2';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-7, 0);
      ctx.lineTo(-5, 14);
      ctx.stroke();

      // Whipped cream dome
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.fillStyle = '#FFFBEB';
      ctx.beginPath();
      ctx.arc(0, -7, 13, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Cherry on top
      ctx.fillStyle = '#E11D48';
      ctx.beginPath();
      ctx.arc(-2, -19, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      break;
    }

    case 'coxinha': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.6;

      // Golden fried teardrop
      ctx.fillStyle = '#D97706';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.bezierCurveTo(10, -10, 17, 2, 15, 11);
      ctx.arc(0, 10, 15, 0.1, Math.PI - 0.1);
      ctx.bezierCurveTo(-17, 2, -10, -10, 0, -20);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Crispy highlight
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath();
      ctx.ellipse(-5, 4, 4, 8, -0.25, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'salada': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;

      // Lettuce leaves in bowl
      ctx.fillStyle = '#22C55E';
      [
        [-9, -6, 9],
        [8, -6, 9],
        [0, -10, 10],
      ].forEach(([lx, ly, lr]) => {
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Tomato slices
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(-6, -8, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(7, -9, 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // White ceramic bowl
      ctx.fillStyle = '#F8FAFC';
      ctx.beginPath();
      ctx.arc(0, -2, 17, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Green stripe on bowl
      ctx.strokeStyle = '#16A34A';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-13, 3);
      ctx.lineTo(13, 3);
      ctx.stroke();
      break;
    }

    case 'suco_detox': {
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;

      // Leafy green straw
      ctx.fillStyle = '#16A34A';
      ctx.save();
      ctx.translate(4, -14);
      ctx.rotate(0.22);
      roundRect(ctx, -2, -10, 4, 15, 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Mason jar / cup
      ctx.fillStyle = '#DCFCE7';
      roundRect(ctx, -11, -10, 22, 29, 5);
      ctx.fill();
      ctx.stroke();

      // Bright green detox juice
      ctx.fillStyle = '#22C55E';
      roundRect(ctx, -9, -3, 18, 20, 3);
      ctx.fill();

      // Leaf garnish
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.ellipse(-6, -12, 6, 3.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // "DETOX" label band
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, -8, 3, 16, 8, 2);
      ctx.fill();
      ctx.strokeStyle = '#15803D';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-5, 7);
      ctx.lineTo(5, 7);
      ctx.stroke();
      break;
    }
  }

  ctx.restore();
}

const thumbCache = new Map<FoodItemId, string>();

export function getFoodThumbnailUrl(id: FoodItemId): string {
  const existing = thumbCache.get(id);
  if (existing) return existing;

  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 96;
  const ctx = c.getContext('2d')!;
  drawFoodItem(ctx, id, 48, 50, 36, 0);
  const url = c.toDataURL('image/png');
  thumbCache.set(id, url);
  return url;
}

export function warmFoodThumbnails(): void {
  FOOD_ITEMS.forEach((item) => {
    getFoodThumbnailUrl(item.id);
  });
}
