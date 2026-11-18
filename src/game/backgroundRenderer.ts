// Animated Food Court (Praça de Alimentação) background renderer

export function drawFoodCourtBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  slingshotY: number,
  animTime: number
): void {
  // 1. Warm bright indoor food-court backdrop (60% clean light neutral field)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#FFF8EB');
  skyGrad.addColorStop(0.65, '#FDEFD6');
  skyGrad.addColorStop(1, '#F5DCB4');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural glass skylight arches at upper wall
  const archCount = width < 640 ? 2 : 4;
  const archW = width / archCount;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.strokeStyle = 'rgba(180, 130, 80, 0.16)';
  ctx.lineWidth = 2;
  for (let i = 0; i < archCount; i++) {
    const ax = i * archW + archW * 0.12;
    const aw = archW * 0.76;
    ctx.beginPath();
    ctx.roundRect(ax, 18, aw, height * 0.34, [aw * 0.45, aw * 0.45, 8, 8]);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  // 2. Back food-court kiosks (softly stylized so active sprites pop clearly)
  const floorHorizonY = Math.min(height * 0.62, slingshotY - 95);
  const kioskH = Math.min(135, floorHorizonY * 0.42);
  const kioskTop = floorHorizonY - kioskH;

  // Back wall wainscot
  ctx.fillStyle = '#F7E1BE';
  ctx.fillRect(0, floorHorizonY - 22, width, 24);
  ctx.fillStyle = 'rgba(139, 90, 43, 0.14)';
  ctx.fillRect(0, floorHorizonY - 2, width, 3);

  const drawKiosk = (
    kx: number,
    kw: number,
    stripeA: string,
    stripeB: string,
    signText: string,
    signBg: string
  ) => {
    if (kw < 70) return;
    ctx.save();
    // Kiosk booth body
    ctx.fillStyle = '#FFFDF9';
    ctx.strokeStyle = 'rgba(120, 75, 38, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(kx, kioskTop + 26, kw, kioskH - 26, 6);
    ctx.fill();
    ctx.stroke();

    // Service window
    ctx.fillStyle = '#F2DEC0';
    ctx.beginPath();
    ctx.roundRect(kx + 12, kioskTop + 44, kw - 24, kioskH - 64, 4);
    ctx.fill();

    // Striped awning
    const stripes = 6;
    const sw = kw / stripes;
    for (let s = 0; s < stripes; s++) {
      ctx.fillStyle = s % 2 === 0 ? stripeA : stripeB;
      ctx.beginPath();
      ctx.roundRect(kx + s * sw, kioskTop + 14, sw + 0.5, 22, [0, 0, 5, 5]);
      ctx.fill();
    }

    // Kiosk sign board
    const signW = Math.min(kw * 0.72, 130);
    ctx.fillStyle = signBg;
    ctx.beginPath();
    ctx.roundRect(kx + (kw - signW) / 2, kioskTop - 6, signW, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 11px "Fredoka", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(signText, kx + kw / 2, kioskTop + 5);
    ctx.restore();
  };

  if (width >= 680) {
    const kw = Math.min(200, width * 0.21);
    drawKiosk(width * 0.05, kw, '#F59E0B', '#FFFBEB', 'BURGER', '#D97706');
    drawKiosk(width * 0.95 - kw, kw, '#FB7185', '#FFF1F2', 'SHAKES', '#E11D48');
  } else {
    const kw = Math.min(132, width * 0.34);
    drawKiosk(12, kw, '#F59E0B', '#FFFBEB', 'LANCHES', '#D97706');
    drawKiosk(width - kw - 12, kw, '#FB7185', '#FFF1F2', 'SHAKES', '#E11D48');
  }

  // Rising subtle kitchen steam curls in background
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const phase = (animTime * 0.4 + i * 0.27) % 1;
    const sx = width * (0.14 + (i % 2) * 0.72) + Math.sin(animTime * 2 + i) * 6;
    const sy = kioskTop + 50 - phase * 42;
    ctx.fillStyle = `rgba(255, 255, 255, ${(1 - phase) * 0.45})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 6 + phase * 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Swaying hanging pendant lamps near upper ceiling
  const lampXs = width >= 640 ? [width * 0.25, width * 0.5, width * 0.75] : [width * 0.24, width * 0.76];
  lampXs.forEach((lx, idx) => {
    const sway = Math.sin(animTime * 1.4 + idx * 1.3) * 0.04;
    ctx.save();
    ctx.translate(lx, 0);
    ctx.rotate(sway);
    ctx.strokeStyle = 'rgba(100, 65, 35, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 32);
    ctx.stroke();

    ctx.fillStyle = idx % 2 === 0 ? '#FBBF24' : '#FB923C';
    ctx.beginPath();
    ctx.moveTo(-16, 44);
    ctx.quadraticCurveTo(0, 26, 16, 44);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });

  // 3. Checkered food-court floor perspective strip
  ctx.save();
  ctx.fillStyle = '#F2D6AC';
  ctx.fillRect(0, floorHorizonY, width, height - floorHorizonY);

  const tileW = width < 520 ? 36 : 48;
  const tileH = 24;
  const rows = Math.ceil((height - floorHorizonY) / tileH);
  const cols = Math.ceil(width / tileW) + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = 'rgba(255, 249, 238, 0.45)';
        ctx.fillRect(c * tileW, floorHorizonY + r * tileH, tileW, tileH);
      }
    }
  }
  ctx.restore();

  // 4. Foreground diner counter behind slingshot
  const counterTop = slingshotY + 26;
  ctx.save();
  // Counter shadow on floor
  ctx.fillStyle = 'rgba(60, 36, 18, 0.14)';
  ctx.fillRect(0, counterTop - 5, width, 10);

  // Wooden counter top surface
  ctx.fillStyle = '#D99B58';
  ctx.fillRect(0, counterTop, width, 18);
  ctx.fillStyle = '#EBB474';
  ctx.fillRect(0, counterTop, width, 6);
  ctx.strokeStyle = '#784820';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, counterTop);
  ctx.lineTo(width, counterTop);
  ctx.stroke();

  // Counter front panel
  ctx.fillStyle = '#B87439';
  ctx.fillRect(0, counterTop + 18, width, height - (counterTop + 18));

  // Subtle vertical wood planks
  ctx.strokeStyle = 'rgba(85, 45, 16, 0.18)';
  ctx.lineWidth = 2;
  const plankStep = 76;
  for (let px = plankStep; px < width; px += plankStep) {
    ctx.beginPath();
    ctx.moveTo(px, counterTop + 20);
    ctx.lineTo(px, height);
    ctx.stroke();
  }
  ctx.restore();
}
