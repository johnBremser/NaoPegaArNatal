import React from 'react';
import { Home, Play, RotateCcw, Trophy, Volume2, VolumeX } from 'lucide-react';

interface PauseModalProps {
  muted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onToggleMute: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  muted,
  onResume,
  onRestart,
  onMainMenu,
  onToggleMute,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#1E1B18]/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="w-full max-w-sm rounded-3xl border-[3px] border-[#1E1B18] bg-[#FFF8EB] p-6 text-center cartoon-shadow">
        <h2
          id="pause-title"
          className="font-display text-3xl font-bold text-[#1E1B18]"
        >
          Jogo Pausado
        </h2>
        <p className="mt-1 text-sm font-medium text-[#785C42]">
          Respire fundo antes de continuar.
        </p>

        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="cartoon-btn flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#1E1B18] bg-[#FACC15] px-5 py-2.5 font-display text-lg font-bold text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FDE047] whitespace-nowrap"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>Continuar</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="cartoon-btn flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#1E1B18] bg-[#FFFDF8] px-5 py-2 font-display text-base font-bold text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FEF3C7] whitespace-nowrap"
          >
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            <span>{muted ? 'Som: Desligado' : 'Som: Ligado'}</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="cartoon-btn flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#1E1B18] bg-[#FFFDF8] px-5 py-2 font-display text-base font-bold text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FEF3C7] whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reiniciar</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="cartoon-btn flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#1E1B18] bg-[#EFE4D4] px-5 py-2 font-display text-base font-bold text-[#1E1B18] cartoon-shadow-sm hover:bg-[#E5D5BE] whitespace-nowrap"
          >
            <Home className="h-4 w-4" />
            <span>Menu inicial</span>
          </button>
        </div>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  score: number;
  highScore: number;
  isNewRecord: boolean;
  heroPortraitUrl: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  isNewRecord,
  heroPortraitUrl,
  onPlayAgain,
  onMainMenu,
}) => {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-[#1E1B18]/55 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="w-full max-w-md rounded-3xl border-[3px] border-[#1E1B18] bg-[#FFF8EB] p-6 text-center cartoon-shadow sm:p-7">
        {/* Natal floating away animation */}
        <div className="relative mx-auto h-36 w-40 overflow-hidden rounded-2xl border-2 border-[#1E1B18] bg-gradient-to-b from-[#BAE6FD] to-[#E0F2FE]">
          <div className="mx-auto mt-1 flex h-28 w-28 items-center justify-center rounded-full bg-[#EF4444]/30 animate-bounce">
            <img
              src={heroPortraitUrl}
              alt="Natal inflado saindo voando"
              referrerPolicy="no-referrer"
              className="h-26 w-26 scale-110 object-contain sepia-[.25] saturate-200"
            />
          </div>
          <div className="absolute inset-x-0 bottom-1 text-center font-display text-xs font-bold text-[#0369A1]">
            Subiu que nem balão!
          </div>
        </div>

        <h2
          id="gameover-title"
          className="mt-4 font-display text-3xl font-bold text-[#DC2626] sm:text-4xl"
        >
          O Natal pegou ar!
        </h2>

        {isNewRecord && score > 0 && (
          <p className="mt-1 font-display text-sm font-bold text-[#B45309]">
            Novo recorde alcançado!
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl border-2 border-[#1E1B18] bg-[#FFFDF8] p-3.5">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#785C42]">
              Pontuação
            </div>
            <div className="mt-0.5 font-display text-3xl font-bold text-[#1E1B18] tabular-nums">
              {score}
            </div>
          </div>

          <div className="border-l border-[#E6D5BE]">
            <div className="flex items-center justify-center gap-1 text-xs font-bold uppercase tracking-wider text-[#785C42]">
              <Trophy className="h-3.5 w-3.5 text-[#D97706]" />
              <span>Recorde</span>
            </div>
            <div className="mt-0.5 font-display text-3xl font-bold text-[#B45309] tabular-nums">
              {highScore}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="cartoon-btn flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#1E1B18] bg-[#FACC15] px-5 py-2.5 font-display text-lg font-bold text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FDE047] whitespace-nowrap"
          >
            <RotateCcw className="h-5 w-5" />
            <span>Jogar novamente</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="cartoon-btn flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#1E1B18] bg-[#FFFDF8] px-5 py-2.5 font-display text-base font-bold text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FEF3C7] whitespace-nowrap"
          >
            <Home className="h-5 w-5" />
            <span>Menu inicial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
