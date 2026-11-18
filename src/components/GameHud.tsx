import React from 'react';
import { Pause, Volume2, VolumeX } from 'lucide-react';
import { getFoodThumbnailUrl } from '../game/itemsRenderer';
import { GAME_CONFIG, HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
}

function getAngerInfo(anger: number): {
  label: string;
  barColor: string;
  textColor: string;
} {
  if (anger >= 80) {
    return {
      label: 'Pegando ar!',
      barColor: 'bg-[#DC2626]',
      textColor: 'text-[#B91C1C]',
    };
  }
  if (anger >= 60) {
    return {
      label: 'Inflando!',
      barColor: 'bg-[#EA580C]',
      textColor: 'text-[#C2410C]',
    };
  }
  if (anger >= 30) {
    return {
      label: 'Irritado',
      barColor: 'bg-[#F59E0B]',
      textColor: 'text-[#B45309]',
    };
  }
  return {
    label: 'Tranquilo',
    barColor: 'bg-[#16A34A]',
    textColor: 'text-[#15803D]',
  };
}

export const GameHud: React.FC<GameHudProps> = ({
  hud,
  muted,
  onToggleMute,
  onPause,
}) => {
  const angerInfo = getAngerInfo(hud.anger);
  const itemThumb = getFoodThumbnailUrl(hud.currentItem.id);
  const isUnwanted = hud.currentItem.category === 'unwanted';
  const timerUrgent = hud.timerExpired || hud.itemTimer <= 2.2;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-2.5 sm:p-4">
      {/* Top HUD Row */}
      <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
        {/* Left: Score, High Score & Streak */}
        <div className="flex items-center gap-3 rounded-2xl border-2 border-[#1E1B18] bg-[#FFFDF8] px-3 py-1.5 cartoon-shadow-sm sm:gap-4 sm:px-4 sm:py-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#785C42] sm:text-xs">
              Pontos
            </div>
            <div className="font-display text-lg font-bold leading-none text-[#1E1B18] tabular-nums sm:text-2xl">
              {hud.score}
            </div>
          </div>

          <div className="h-7 w-px bg-[#E6D5BE]" aria-hidden="true" />

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#785C42] sm:text-xs">
              Recorde
            </div>
            <div className="font-display text-base font-bold leading-none text-[#B45309] tabular-nums sm:text-xl">
              {hud.highScore}
            </div>
          </div>

          <div className="h-7 w-px bg-[#E6D5BE]" aria-hidden="true" />

          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#785C42] sm:text-xs">
              <span>Sequência</span>
              <span className="text-[#1E1B18] tabular-nums">
                {hud.streak}/{GAME_CONFIG.STREAK_TARGET}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1" aria-label={`Sequência ${hud.streak} de ${GAME_CONFIG.STREAK_TARGET}`}>
              {Array.from({ length: GAME_CONFIG.STREAK_TARGET }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-3.5 rounded-sm border border-[#1E1B18] transition-colors sm:w-4 ${
                    i < hud.streak ? 'bg-[#FACC15]' : 'bg-[#EFE4D4]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Controls (pinned top-right on mobile too so buttons are easy to tap) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:order-3">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Ligar som' : 'Desligar som'}
            title={muted ? 'Ligar som' : 'Desligar som'}
            className="cartoon-btn flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#1E1B18] bg-[#FFFDF8] text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FEF3C7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E1B18]"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={onPause}
            aria-label="Pausar jogo"
            title="Pausar jogo (Esc)"
            className="cartoon-btn flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-xl border-2 border-[#1E1B18] bg-[#FACC15] px-3 font-display text-sm font-bold text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FDE047] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E1B18]"
          >
            <Pause className="h-4 w-4 shrink-0" />
            <span className="hidden whitespace-nowrap sm:inline">Pausar</span>
          </button>
        </div>

        {/* Center: Anger Meter (0-100) + Item Timer */}
        <div className="flex w-full items-center gap-2.5 rounded-2xl border-2 border-[#1E1B18] bg-[#FFFDF8] px-3 py-1.5 cartoon-shadow-sm sm:order-2 sm:w-auto sm:min-w-[310px] sm:px-4 sm:py-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2 text-xs font-bold">
              <span className={angerInfo.textColor}>{angerInfo.label}</span>
              <span className="text-[#1E1B18] tabular-nums">
                Raiva {hud.anger}/100
              </span>
            </div>
            <div
              className="mt-1 h-3 w-full overflow-hidden rounded-full border-2 border-[#1E1B18] bg-[#EFE4D4]"
              role="progressbar"
              aria-valuenow={hud.anger}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Barra de raiva do Natal"
            >
              <div
                className={`h-full transition-[width,background-color] duration-150 ${angerInfo.barColor}`}
                style={{ width: `${Math.min(100, Math.max(0, hud.anger))}%` }}
              />
            </div>
          </div>

          <div className="h-8 w-px bg-[#E6D5BE]" aria-hidden="true" />

          <div className="shrink-0 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#785C42]">
              Tempo
            </div>
            <div
              className={`font-display text-base font-bold leading-none tabular-nums sm:text-lg ${
                timerUrgent ? 'text-[#DC2626]' : 'text-[#1E1B18]'
              }`}
            >
              {hud.timerExpired ? '0.0s!' : `${hud.itemTimer.toFixed(1)}s`}
            </div>
            {hud.timerExpired && (
              <div className="text-[10px] font-bold text-[#DC2626] tabular-nums">
                +5 raiva/s
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Corner: Current Item Card (kept clear of center slingshot pull zone) */}
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-center gap-2.5 rounded-2xl border-2 border-[#1E1B18] bg-[#FFFDF8] px-2.5 py-2 cartoon-shadow-sm sm:gap-3 sm:px-3.5 sm:py-2.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#1E1B18] sm:h-12 sm:w-12 ${
              isUnwanted ? 'bg-[#DCFCE7]' : 'bg-[#FEF3C7]'
            }`}
          >
            <img
              src={itemThumb}
              alt={hud.currentItem.name}
              referrerPolicy="no-referrer"
              className="h-9 w-9 object-contain sm:h-10 sm:w-10"
            />
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm font-bold leading-tight text-[#1E1B18] sm:text-base">
              {hud.currentItem.name}
            </div>
            <div
              className={`mt-0.5 text-[11px] font-bold sm:text-xs ${
                isUnwanted ? 'text-[#15803D]' : 'text-[#B45309]'
              }`}
            >
              {isUnwanted ? 'Jogue para fora!' : 'Acerte o Natal!'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
