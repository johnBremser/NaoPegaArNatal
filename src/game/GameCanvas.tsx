import React, { useEffect, useRef } from 'react';
import { soundEngine } from './audio';
import { drawFoodCourtBackground } from './backgroundRenderer';
import { drawFoodItem, warmFoodThumbnails } from './itemsRenderer';
import { drawNatalSprite, loadNatalAssets, NatalAssets } from './sprites';
import {
  DESIRED_ITEMS,
  FoodItemDef,
  GAME_CONFIG,
  GameState,
  HudSnapshot,
  NatalMood,
  UNWANTED_ITEMS,
} from './types';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
}

interface FloatingText {
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  strokeColor: string;
  scale: number;
  life: number;
  maxLife: number;
}

interface Projectile {
  item: FoodItemDef;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  spin: number;
}

interface GameCanvasProps {
  gameState: GameState;
  highScore: number;
  runId: number;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onGameOver: (finalScore: number) => void;
  onAssetsLoaded?: (heroPortraitUrl: string) => void;
}

function pickNextItem(score: number, prevId?: string): FoodItemDef {
  const levels = Math.floor(score / 100);
  const unwantedChance = Math.min(
    GAME_CONFIG.MAX_UNWANTED_CHANCE,
    GAME_CONFIG.BASE_UNWANTED_CHANCE + levels * 0.025
  );
  const isUnwanted = Math.random() < unwantedChance;
  const pool = isUnwanted ? UNWANTED_ITEMS : DESIRED_ITEMS;
  let picked = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && picked.id === prevId) {
    picked = pool[(pool.indexOf(picked) + 1) % pool.length];
  }
  return picked;
}

function getMaxItemTime(score: number): number {
  const levels = Math.floor(score / 100);
  return Math.max(
    GAME_CONFIG.MIN_ITEM_TIME_SEC,
    GAME_CONFIG.BASE_ITEM_TIME_SEC - levels * GAME_CONFIG.TIME_REDUCTION_PER_100_PTS
  );
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  highScore,
  runId,
  onHudUpdate,
  onGameOver,
  onAssetsLoaded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const highScoreRef = useRef<number>(highScore);
  const onHudUpdateRef = useRef(onHudUpdate);
  const onGameOverRef = useRef(onGameOver);
  const onAssetsLoadedRef = useRef(onAssetsLoaded);

  gameStateRef.current = gameState;
  highScoreRef.current = highScore;
  onHudUpdateRef.current = onHudUpdate;
  onGameOverRef.current = onGameOver;
  onAssetsLoadedRef.current = onAssetsLoaded;

  const simRef = useRef({
    width: 1280,
    height: 720,
    score: 0,
    anger: 0,
    streak: 0,
    itemTimer: GAME_CONFIG.BASE_ITEM_TIME_SEC as number,
    maxItemTimer: GAME_CONFIG.BASE_ITEM_TIME_SEC as number,
    lastTickSecond: -1,
    currentItem: DESIRED_ITEMS[0] as FoodItemDef,
    projectile: null as Projectile | null,

    // Natal state
    natalX: 640,
    natalBottomY: 270,
    natalBaseBottomY: 270,
    natalFacing: 1 as 1 | -1,
    natalDrawW: 110,
    natalDrawH: 125,
    natalCenterY: 208,
    inflateScale: 1,
    wobblePhase: 0,
    reactionMood: null as NatalMood | null,
    reactionTimer: 0,

    // Slingshot drag state
    isDragging: false,
    activePointerId: null as number | null,
    dragX: 0,
    dragY: 0,

    // Juice & FX
    animTime: 0,
    hitstopTimer: 0,
    shakeTimer: 0,
    shakeMagnitude: 0,
    particles: [] as Particle[],
    floatingTexts: [] as FloatingText[],
    lastHudSyncAt: 0,
    gameOverTriggered: false,
  });

  // Reset simulation whenever runId increments or returning to TITLE_MENU
  useEffect(() => {
    const s = simRef.current;
    const firstItem = pickNextItem(0);
    s.score = 0;
    s.anger = 0;
    s.streak = 0;
    s.maxItemTimer = GAME_CONFIG.BASE_ITEM_TIME_SEC;
    s.itemTimer = GAME_CONFIG.BASE_ITEM_TIME_SEC;
    s.lastTickSecond = -1;
    s.currentItem = firstItem;
    s.projectile = null;
    s.isDragging = false;
    s.activePointerId = null;
    s.natalX = s.width * 0.5;
    s.natalBottomY = s.natalBaseBottomY;
    s.natalFacing = 1;
    s.inflateScale = 1;
    s.reactionMood = null;
    s.reactionTimer = 0;
    s.hitstopTimer = 0;
    s.shakeTimer = 0;
    s.particles = [];
    s.floatingTexts = [];
    s.gameOverTriggered = false;

    onHudUpdateRef.current({
      score: 0,
      highScore: highScoreRef.current,
      anger: 0,
      streak: 0,
      itemTimer: s.itemTimer,
      maxItemTimer: s.maxItemTimer,
      timerExpired: false,
      currentItem: s.currentItem,
      natalMood: 'normal',
      inFlight: false,
    });
  }, [runId]);

  // Cancel drag if paused or game over
  useEffect(() => {
    if (gameState !== 'PLAYING') {
      simRef.current.isDragging = false;
      simRef.current.activePointerId = null;
    }
  }, [gameState]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let assets: NatalAssets = {
      loaded: false,
      heroPortraitUrl: '/assets/aistudio/natal-conceito-revisado_e19001b2.png',
      heroCanvas: null,
      rows: [],
    };

    warmFoodThumbnails();
    void loadNatalAssets().then((loaded) => {
      assets = loaded;
      onAssetsLoadedRef.current?.(loaded.heroPortraitUrl);
    });

    const getLayoutMetrics = (w: number, h: number) => {
      const isNarrow = w < 640;
      const bottomReserve = Math.max(122, Math.min(168, h * 0.22));
      const slingshotX = w * 0.5;
      const slingshotY = h - bottomReserve;

      const targetNatalHeight = isNarrow
        ? Math.max(88, Math.min(112, h * 0.14))
        : Math.max(108, Math.min(134, h * 0.175));

      const natalBaseBottomY = Math.max(
        targetNatalHeight + 52,
        Math.min(h * 0.43, slingshotY - (isNarrow ? 195 : 215))
      );

      const maxPull = Math.max(
        78,
        Math.min(126, w * 0.28, bottomReserve - 20)
      );

      const arenaSpanY = Math.max(200, slingshotY - (natalBaseBottomY - targetNatalHeight * 0.5));
      const gravity = arenaSpanY * 2.45;
      const launchPowerScale = Math.sqrt(2 * gravity * arenaSpanY * 1.9) / maxPull;

      return {
        slingshotX,
        slingshotY,
        targetNatalHeight,
        natalBaseBottomY,
        maxPull,
        gravity,
        launchPowerScale,
        isNarrow,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, rect.width || window.innerWidth);
      const h = Math.max(420, rect.height || window.innerHeight);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const s = simRef.current;
      const prevW = s.width;
      const prevBaseY = s.natalBaseBottomY;
      s.width = w;
      s.height = h;
      const m = getLayoutMetrics(w, h);
      s.natalBaseBottomY = m.natalBaseBottomY;

      if (prevW > 0) {
        s.natalX = Math.max(60, Math.min(w - 60, (s.natalX / prevW) * w));
      } else {
        s.natalX = w * 0.5;
      }
      if (s.anger < 60 && !s.gameOverTriggered) {
        s.natalBottomY = m.natalBaseBottomY;
      } else if (prevBaseY > 0) {
        const offsetFromBase = prevBaseY - s.natalBottomY;
        s.natalBottomY = m.natalBaseBottomY - offsetFromBase;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const spawnParticles = (
      x: number,
      y: number,
      colors: string[],
      count: number,
      speed: number,
      gravity = 260,
      sizeRange: [number, number] = [4, 9]
    ) => {
      const s = simRef.current;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = speed * (0.35 + Math.random() * 0.75);
        const life = 0.45 + Math.random() * 0.45;
        s.particles.push({
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag - 40,
          size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
          color: colors[i % colors.length],
          alpha: 1,
          life,
          maxLife: life,
          gravity,
        });
      }
    };

    const spawnFloatingText = (
      text: string,
      x: number,
      y: number,
      color: string,
      strokeColor = '#1E1B18',
      scale = 1
    ) => {
      const s = simRef.current;
      const clampedX = Math.max(70, Math.min(s.width - 70, x));
      const clampedY = Math.max(76, Math.min(s.height - 60, y));
      s.floatingTexts.push({
        text,
        x: clampedX,
        y: clampedY,
        vy: -55,
        color,
        strokeColor,
        scale,
        life: 1.05,
        maxLife: 1.05,
      });
    };

    const computeCurrentMood = (): NatalMood => {
      const s = simRef.current;
      if (s.reactionMood && s.reactionTimer > 0) return s.reactionMood;
      if (s.anger >= 80) return 'floating';
      if (s.anger >= 60) return 'very_angry';
      if (s.anger >= 30) return 'angry';
      return 'normal';
    };

    const syncHud = (force = false) => {
      const s = simRef.current;
      const now = performance.now();
      if (!force && now - s.lastHudSyncAt < 85) return;
      s.lastHudSyncAt = now;
      onHudUpdateRef.current({
        score: s.score,
        highScore: Math.max(highScoreRef.current, s.score),
        anger: Math.round(s.anger),
        streak: s.streak,
        itemTimer: s.itemTimer,
        maxItemTimer: s.maxItemTimer,
        timerExpired: s.itemTimer <= 0,
        currentItem: s.currentItem,
        natalMood: computeCurrentMood(),
        inFlight: s.projectile !== null,
      });
    };

    const advanceToNextItem = () => {
      const s = simRef.current;
      s.projectile = null;
      s.currentItem = pickNextItem(s.score, s.currentItem.id);
      s.maxItemTimer = getMaxItemTime(s.score);
      s.itemTimer = s.maxItemTimer;
      s.lastTickSecond = -1;
      syncHud(true);
    };

    const getDragVector = () => {
      const s = simRef.current;
      const m = getLayoutMetrics(s.width, s.height);
      const rawDx = s.dragX - m.slingshotX;
      const rawDy = s.dragY - m.slingshotY;
      const dist = Math.hypot(rawDx, rawDy);
      if (dist <= 0.001) {
        return { dx: 0, dy: 0, dist: 0, ratio: 0 };
      }
      const clampedDist = Math.min(dist, m.maxPull);
      const scale = clampedDist / dist;
      return {
        dx: rawDx * scale,
        dy: rawDy * scale,
        dist: clampedDist,
        ratio: clampedDist / m.maxPull,
      };
    };

    // Pointer Events (works seamlessly for Desktop Mouse & Mobile Touch)
    const getCanvasCoords = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (gameStateRef.current !== 'PLAYING') return;
      soundEngine.unlock();
      const s = simRef.current;
      if (s.projectile !== null) return;

      const { x, y } = getCanvasCoords(e);
      const m = getLayoutMetrics(s.width, s.height);
      const distToPouch = Math.hypot(x - m.slingshotX, y - m.slingshotY);
      const inLowerLaunchZone = y >= m.slingshotY - 75 && Math.abs(x - m.slingshotX) <= Math.max(150, s.width * 0.42);

      if (distToPouch <= 105 || inLowerLaunchZone) {
        s.isDragging = true;
        s.activePointerId = e.pointerId;
        s.dragX = x;
        s.dragY = y;
        try {
          canvas.setPointerCapture(e.pointerId);
        } catch {
          // Ignore if synthetic event
        }
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      const s = simRef.current;
      if (!s.isDragging || e.pointerId !== s.activePointerId) return;
      const { x, y } = getCanvasCoords(e);
      s.dragX = x;
      s.dragY = y;

      const drag = getDragVector();
      if (drag.dist > 16) {
        soundEngine.playStretch(drag.ratio);
      }
    };

    const handlePointerUpOrCancel = (e: PointerEvent) => {
      const s = simRef.current;
      if (!s.isDragging || e.pointerId !== s.activePointerId) return;
      s.isDragging = false;
      s.activePointerId = null;

      try {
        if (canvas.hasPointerCapture(e.pointerId)) {
          canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }

      if (gameStateRef.current !== 'PLAYING' || s.projectile !== null) return;

      const drag = getDragVector();
      // Minimum pull threshold to avoid accidental clicks/taps launching weakly
      if (drag.dist < 16 || e.type === 'pointercancel') {
        return;
      }

      const m = getLayoutMetrics(s.width, s.height);
      const launchVx = -drag.dx * m.launchPowerScale;
      const launchVy = -drag.dy * m.launchPowerScale;

      s.projectile = {
        item: s.currentItem,
        x: m.slingshotX + drag.dx,
        y: m.slingshotY + drag.dy,
        vx: launchVx,
        vy: launchVy,
        rotation: 0,
        spin: (launchVx >= 0 ? 1 : -1) * (3 + drag.ratio * 5),
      };

      soundEngine.playLaunch();
      syncHud(true);
    };

    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUpOrCancel);
    canvas.addEventListener('pointercancel', handlePointerUpOrCancel);

    // Main 60fps simulation + render loop
    let rafId = 0;
    let lastTime = performance.now();

    const stepSimulation = (dt: number) => {
      const s = simRef.current;
      const m = getLayoutMetrics(s.width, s.height);
      s.animTime += dt;
      s.wobblePhase += dt;

      if (gameStateRef.current !== 'PLAYING') {
        // Gentle idle patrol on Title screen
        if (gameStateRef.current === 'TITLE_MENU') {
          s.natalX = s.width * 0.5 + Math.sin(s.animTime * 0.9) * Math.min(75, s.width * 0.14);
          s.natalFacing = Math.cos(s.animTime * 0.9) >= 0 ? 1 : -1;
          s.natalBottomY = m.natalBaseBottomY;
        }
        return;
      }

      if (s.hitstopTimer > 0) {
        s.hitstopTimer = Math.max(0, s.hitstopTimer - dt);
        return;
      }

      if (s.shakeTimer > 0) {
        s.shakeTimer = Math.max(0, s.shakeTimer - dt);
      }

      if (s.reactionTimer > 0) {
        s.reactionTimer = Math.max(0, s.reactionTimer - dt);
        if (s.reactionTimer <= 0) {
          s.reactionMood = null;
        }
      }

      // 1. Item Timer & Continuous Anger when expired (only while waiting for launch)
      if (s.projectile === null) {
        if (s.itemTimer > 0) {
          s.itemTimer = Math.max(0, s.itemTimer - dt);
          const ceilSec = Math.ceil(s.itemTimer);
          if (s.itemTimer > 0 && s.itemTimer <= 2.2 && ceilSec !== s.lastTickSecond) {
            s.lastTickSecond = ceilSec;
            soundEngine.playTimerTick();
          }
        } else {
          // Timer reached 0: continuous +5 anger/sec until launched or game over
          s.anger = Math.min(100, s.anger + GAME_CONFIG.ANGER_TIMER_EXPIRED_PER_SEC * dt);
        }
      }

      // 2. Natal Horizontal Movement (progressive difficulty every 100 points)
      const diffLevel = Math.floor(s.score / 100);
      const basePatrolSpeed = Math.min(265, 48 + diffLevel * 22);
      const widthFactor = Math.min(1, (s.width / 920) * 0.55 + 0.45);
      const angerSpeedBoost = s.anger >= 30 ? 1 + ((s.anger - 30) / 70) * 0.22 : 1;
      const moveSpeed = basePatrolSpeed * widthFactor * angerSpeedBoost;

      const sideMargin = Math.max(46, s.width * 0.11);
      const halfNatal = Math.max(40, s.natalDrawW * 0.5);
      const minX = Math.min(s.width * 0.45, sideMargin + halfNatal);
      const maxX = Math.max(s.width * 0.55, s.width - sideMargin - halfNatal);

      s.natalX += s.natalFacing * moveSpeed * dt;
      if (s.natalX >= maxX) {
        s.natalX = maxX;
        s.natalFacing = -1;
      } else if (s.natalX <= minX) {
        s.natalX = minX;
        s.natalFacing = 1;
      }

      // 3. Natal Inflation & Vertical Floating Rules
      let targetInflate = 1;
      if (s.anger >= 80) {
        targetInflate = 1.26 + ((s.anger - 80) / 20) * 0.22;
      } else if (s.anger >= 60) {
        targetInflate = 1.04 + ((s.anger - 60) / 20) * 0.22;
      }
      s.inflateScale += (targetInflate - s.inflateScale) * Math.min(1, 5 * dt);

      if (s.anger >= 80) {
        const riseRate = 36 + ((s.anger - 80) / 20) * 34;
        s.natalBottomY -= riseRate * dt;
      } else if (s.anger >= 60) {
        const riseRate = 14 + ((s.anger - 60) / 20) * 20;
        s.natalBottomY -= riseRate * dt;
      } else {
        // Below 60 anger: smoothly descend toward initial position, never below base
        const diffY = m.natalBaseBottomY - s.natalBottomY;
        if (Math.abs(diffY) > 0.5) {
          s.natalBottomY += diffY * Math.min(1, 2.5 * dt);
        } else {
          s.natalBottomY = m.natalBaseBottomY;
        }
        if (s.natalBottomY > m.natalBaseBottomY) {
          s.natalBottomY = m.natalBaseBottomY;
        }
      }

      // Game Over ONLY when Natal's entire body passes completely above the top of the play area
      if (s.natalBottomY <= 0 && !s.gameOverTriggered) {
        s.gameOverTriggered = true;
        soundEngine.playGameOver();
        soundEngine.stopMusic();
        syncHud(true);
        onGameOverRef.current(s.score);
        return;
      }

      // 4. Projectile Flight & Collision Sub-stepping
      if (s.projectile) {
        const p = s.projectile;
        const subSteps = 2;
        const subDt = dt / subSteps;
        let resolved = false;

        for (let step = 0; step < subSteps; step++) {
          p.vy += m.gravity * subDt;
          p.x += p.vx * subDt;
          p.y += p.vy * subDt;
          p.rotation += p.spin * subDt;

          // Check collision with Natal's coherent ellipse hitbox
          const hitRx = Math.max(30, s.natalDrawW * 0.41) + p.item.radius * 0.72;
          const hitRy = Math.max(38, s.natalDrawH * 0.45) + p.item.radius * 0.72;
          const nx = (p.x - s.natalX) / hitRx;
          const ny = (p.y - s.natalCenterY) / hitRy;

          if (nx * nx + ny * ny <= 1) {
            resolved = true;
            if (p.item.category === 'desired') {
              s.score += GAME_CONFIG.POINTS_PER_DESIRED_HIT;
              s.streak += 1;

              if (s.streak >= GAME_CONFIG.STREAK_TARGET) {
                s.score += GAME_CONFIG.POINTS_COMBO_BONUS;
                s.anger = Math.max(0, s.anger - GAME_CONFIG.ANGER_COMBO_RELIEF);
                s.streak = 0;
                s.reactionMood = 'relieved';
                s.reactionTimer = 1.25;
                s.hitstopTimer = 0.055;

                // Funny air-release jets & celebratory particles
                spawnParticles(
                  s.natalX,
                  s.natalCenterY + 15,
                  ['#E0F2FE', '#FFFFFF', '#BAE6FD', '#38BDF8'],
                  24,
                  260,
                  40,
                  [6, 13]
                );
                spawnParticles(
                  s.natalX,
                  s.natalCenterY - 20,
                  ['#FACC15', '#FB923C', '#4ADE80'],
                  16,
                  220
                );
                spawnFloatingText('PFFFT! Alívio -30', s.natalX, s.natalCenterY - 56, '#0284C7', '#FFFFFF', 1.12);
                spawnFloatingText(
                  `+${GAME_CONFIG.POINTS_PER_DESIRED_HIT + GAME_CONFIG.POINTS_COMBO_BONUS} BÔNUS!`,
                  s.natalX,
                  s.natalCenterY - 24,
                  '#FACC15',
                  '#1E1B18',
                  1.2
                );
                soundEngine.playComboRelief();
              } else {
                s.reactionMood = 'happy';
                s.reactionTimer = 0.72;
                s.hitstopTimer = 0.035;
                spawnParticles(
                  p.x,
                  p.y,
                  ['#FACC15', '#FB923C', '#FEF08A', p.item.accentColor],
                  14,
                  190
                );
                spawnFloatingText(
                  `+${GAME_CONFIG.POINTS_PER_DESIRED_HIT}`,
                  s.natalX,
                  s.natalCenterY - 42,
                  '#16A34A',
                  '#FFFFFF',
                  1.1
                );
                soundEngine.playHappyHit(s.streak);
              }
            } else {
              // Salad or Detox hit Natal!
              s.anger = Math.min(100, s.anger + GAME_CONFIG.ANGER_HIT_UNWANTED);
              s.streak = 0;
              s.reactionMood = 'angry';
              s.reactionTimer = 0.85;
              s.hitstopTimer = 0.045;
              s.shakeTimer = 0.25;
              s.shakeMagnitude = 7;

              spawnParticles(p.x, p.y, ['#EF4444', '#22C55E', '#FCA5A5'], 16, 210);
              spawnFloatingText(
                `+${GAME_CONFIG.ANGER_HIT_UNWANTED} Raiva!`,
                s.natalX,
                s.natalCenterY - 44,
                '#EF4444',
                '#FFFFFF',
                1.1
              );
              soundEngine.playAngryHit();
            }

            advanceToNextItem();
            break;
          }

          // Check out-of-bounds exit
          const exitedLeft = p.x < -p.item.radius - 14;
          const exitedRight = p.x > s.width + p.item.radius + 14;
          const exitedTop = p.y < -p.item.radius - 30;
          const exitedBottom = p.y > s.height + p.item.radius + 14;

          if (exitedLeft || exitedRight || exitedTop || exitedBottom) {
            resolved = true;
            const badgeX = Math.max(70, Math.min(s.width - 70, p.x));
            const badgeY = Math.max(85, Math.min(s.height - 90, p.y));

            if (p.item.category === 'desired') {
              s.anger = Math.min(100, s.anger + GAME_CONFIG.ANGER_MISS_DESIRED);
              s.streak = 0;
              s.reactionMood = 'angry';
              s.reactionTimer = 0.55;
              s.shakeTimer = 0.16;
              s.shakeMagnitude = 4.5;

              spawnParticles(badgeX, badgeY, ['#EF4444', '#FB7185'], 10, 150);
              spawnFloatingText(
                `Errou! +${GAME_CONFIG.ANGER_MISS_DESIRED} Raiva`,
                badgeX,
                badgeY,
                '#E11D48',
                '#FFFFFF',
                1.0
              );
              soundEngine.playMiss();
            } else {
              // Correctly discarded Salad / Detox outside Natal's reach!
              // 0 anger, 0 points, PRESERVES streak, does NOT count toward 5 hits!
              spawnParticles(badgeX, badgeY, ['#22C55E', '#86EFAC', '#FFFFFF'], 12, 165, 140);
              spawnFloatingText('Ufa!', badgeX, badgeY, '#16A34A', '#FFFFFF', 1.18);
              soundEngine.playDiscardUfa();
            }

            advanceToNextItem();
            break;
          }
        }

        if (resolved) {
          // Ensure HUD reflects latest anger/score immediately
          syncHud(true);
        }
      }

      // 5. Update particles & floating texts
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const pt = s.particles[i];
        pt.life -= dt;
        if (pt.life <= 0) {
          s.particles.splice(i, 1);
          continue;
        }
        pt.vy += pt.gravity * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.alpha = Math.max(0, pt.life / pt.maxLife);
      }

      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.life -= dt;
        if (ft.life <= 0) {
          s.floatingTexts.splice(i, 1);
          continue;
        }
        ft.y += ft.vy * dt;
        ft.vy *= 0.96;
      }

      syncHud(false);
    };

    const drawSlingshotAndTrajectory = () => {
      const s = simRef.current;
      const m = getLayoutMetrics(s.width, s.height);
      const ax = m.slingshotX;
      const ay = m.slingshotY;

      const leftForkX = ax - 24;
      const leftForkY = ay - 10;
      const rightForkX = ax + 24;
      const rightForkY = ay - 10;

      const drag = s.isDragging ? getDragVector() : { dx: 0, dy: 0, dist: 0, ratio: 0 };
      const pouchX = ax + drag.dx;
      const pouchY = ay + drag.dy;

      // 1. Back fork of wooden slingshot
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Base shadow on counter
      ctx.fillStyle = 'rgba(30, 27, 24, 0.22)';
      ctx.beginPath();
      ctx.ellipse(ax, ay + 46, 28, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Back elastic band (right side)
      ctx.strokeStyle = '#1E1B18';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(rightForkX, rightForkY);
      ctx.lineTo(pouchX, pouchY);
      ctx.stroke();
      ctx.strokeStyle = '#EA580C';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(rightForkX, rightForkY);
      ctx.lineTo(pouchX, pouchY);
      ctx.stroke();

      // Slingshot wooden Y-frame
      const drawWoodPath = () => {
        ctx.beginPath();
        ctx.moveTo(ax, ay + 46);
        ctx.lineTo(ax, ay + 12);
        ctx.quadraticCurveTo(ax - 2, ay - 2, leftForkX, leftForkY);
        ctx.moveTo(ax, ay + 12);
        ctx.quadraticCurveTo(ax + 2, ay - 2, rightForkX, rightForkY);
      };

      ctx.strokeStyle = '#1E1B18';
      ctx.lineWidth = 15;
      drawWoodPath();
      ctx.stroke();

      ctx.strokeStyle = '#9A5B25';
      ctx.lineWidth = 10;
      drawWoodPath();
      ctx.stroke();

      // Highlight on wood
      ctx.strokeStyle = '#C47D3B';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ax - 2, ay + 42);
      ctx.lineTo(ax - 2, ay + 14);
      ctx.stroke();

      // 2. Full Dotted Trajectory Preview up to Natal's height
      if (s.isDragging && drag.dist >= 16 && s.projectile === null && gameStateRef.current === 'PLAYING') {
        const vx0 = -drag.dx * m.launchPowerScale;
        const vy0 = -drag.dy * m.launchPowerScale;

        let simX = pouchX;
        let simY = pouchY;
        let simVx = vx0;
        let simVy = vy0;
        const simDt = 1 / 60;
        const targetY = s.natalCenterY;
        let reachedNatalLevel = simY <= targetY;
        let lastCrossX: number | null = null;

        const dots: { x: number; y: number }[] = [];
        for (let step = 0; step < 150; step++) {
          simVy += m.gravity * simDt;
          simX += simVx * simDt;
          simY += simVy * simDt;

          if (simX < -10 || simX > s.width + 10 || simY > s.height + 10) {
            break;
          }

          if (!reachedNatalLevel && simY <= targetY) {
            reachedNatalLevel = true;
            lastCrossX = simX;
          } else if (reachedNatalLevel && simVy > 0 && simY >= targetY) {
            dots.push({ x: simX, y: targetY });
            lastCrossX = simX;
            break;
          }

          if (simY < -45 && simVy < -240) {
            break;
          }

          if (step % 2 === 0 && simY >= -16) {
            dots.push({ x: simX, y: simY });
          }
        }

        // Draw dotted arc line
        for (let i = 0; i < dots.length; i++) {
          const d = dots[i];
          const progress = i / Math.max(1, dots.length - 1);
          const alpha = 0.9 - progress * 0.45;
          const r = 4.6 - progress * 1.6;
          ctx.fillStyle = `rgba(30, 27, 24, ${alpha})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, r + 1.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle =
            s.currentItem.category === 'desired'
              ? `rgba(250, 204, 21, ${alpha})`
              : `rgba(74, 222, 128, ${alpha})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
          ctx.fill();
        }

        // Subtle target ring at Natal's altitude when trajectory crosses it
        if (lastCrossX !== null && lastCrossX >= 10 && lastCrossX <= s.width - 10) {
          ctx.strokeStyle =
            s.currentItem.category === 'desired'
              ? 'rgba(217, 119, 6, 0.7)'
              : 'rgba(22, 163, 74, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(lastCrossX, targetY, 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 3. Draw current item sitting in slingshot pouch (if not in flight)
      if (s.projectile === null && gameStateRef.current !== 'TITLE_MENU') {
        // Gentle idle bob when not dragging
        const bobY = s.isDragging ? 0 : Math.sin(s.animTime * 4) * 2.5;
        const itemRadius = m.isNarrow ? 22 : 25;
        drawFoodItem(ctx, s.currentItem.id, pouchX, pouchY + bobY, itemRadius, 0);

        // Subtle drag cue ring around item when idle
        if (!s.isDragging && gameStateRef.current === 'PLAYING') {
          const pulse = 1 + Math.sin(s.animTime * 4.5) * 0.08;
          ctx.strokeStyle = 'rgba(30, 27, 24, 0.25)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(pouchX, pouchY + bobY, 34 * pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // 4. Front elastic band (left side) + leather pouch grip
      ctx.strokeStyle = '#1E1B18';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(leftForkX, leftForkY);
      ctx.lineTo(pouchX, pouchY);
      ctx.stroke();
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.moveTo(leftForkX, leftForkY);
      ctx.lineTo(pouchX, pouchY);
      ctx.stroke();

      // Leather pouch cap
      ctx.fillStyle = '#451A03';
      ctx.strokeStyle = '#1E1B18';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pouchX, pouchY + 6, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    const renderScene = () => {
      const s = simRef.current;
      const m = getLayoutMetrics(s.width, s.height);

      ctx.save();
      if (s.shakeTimer > 0) {
        const sx = (Math.random() - 0.5) * 2 * s.shakeMagnitude;
        const sy = (Math.random() - 0.5) * 2 * s.shakeMagnitude;
        ctx.translate(sx, sy);
      }

      // 1. Animated food-court background
      drawFoodCourtBackground(ctx, s.width, s.height, m.slingshotY, s.animTime);

      // 2. Floor shadow under Natal (fades as he floats up)
      const heightAboveBase = Math.max(0, m.natalBaseBottomY - s.natalBottomY);
      const shadowAlpha = Math.max(0.05, 0.22 - heightAboveBase * 0.0012);
      const shadowScale = Math.max(0.45, 1 - heightAboveBase * 0.0025) * s.inflateScale;
      ctx.fillStyle = `rgba(30, 27, 24, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(
        s.natalX,
        m.natalBaseBottomY + 4,
        42 * shadowScale,
        10 * shadowScale,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // 3. Draw Natal with official sprites + progressive tint + inflation
      const mood = computeCurrentMood();
      const natalMetrics = drawNatalSprite({
        ctx,
        assets,
        centerX: s.natalX,
        bottomY: s.natalBottomY,
        targetHeight: m.targetNatalHeight,
        mood,
        facingDir: s.natalFacing,
        anger: s.anger,
        animTime: s.animTime,
        reactionTimer: s.reactionTimer,
        inflateScale: s.inflateScale,
        wobblePhase: s.wobblePhase,
      });

      s.natalDrawW = natalMetrics.width;
      s.natalDrawH = natalMetrics.height;
      s.natalCenterY = natalMetrics.centerY;

      // 4. Draw Slingshot + Trajectory + Current Item
      drawSlingshotAndTrajectory();

      // 5. Draw Active Projectile in Flight
      if (s.projectile) {
        const p = s.projectile;
        drawFoodItem(ctx, p.item.id, p.x, p.y, p.item.radius, p.rotation);
      }

      // 6. Draw Particles
      for (const pt of s.particles) {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.strokeStyle = '#1E1B18';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 7. Draw Floating Texts ("Ufa!", "+10", "+25 BÔNUS!", etc.)
      for (const ft of s.floatingTexts) {
        const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.6);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `700 ${Math.round(22 * ft.scale)}px "Fredoka", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = ft.strokeColor;
        ctx.strokeText(ft.text, ft.x, ft.y);
        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      ctx.restore();
    };

    const tick = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawDt, 0.05);

      stepSimulation(dt);
      renderScene();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUpOrCancel);
      canvas.removeEventListener('pointercancel', handlePointerUpOrCancel);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full touch-none select-none cursor-grab active:cursor-grabbing"
      aria-label="Área de jogo Não Pega Ar, Natal!"
    />
  );
};
