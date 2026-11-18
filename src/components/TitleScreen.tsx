import React from 'react';
import { Play, Trophy, Volume2, VolumeX } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface TitleScreenProps {
  highScore: number;
  heroPortraitUrl: string;
  muted: boolean;
  onStart: () => void;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  highScore,
  heroPortraitUrl,
  muted,
  onStart,
  onToggleMute,
}) => {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#1E1B18]/30 p-3 sm:p-6">
      {/* Top-right sound toggle */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? 'Ligar som' : 'Desligar som'}
        className="cartoon-btn fixed right-3 top-3 z-30 flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[#1E1B18] bg-[#FFFDF8] text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FEF3C7] sm:right-5 sm:top-5"
      >
        {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
      </button>

      <div className="flex w-full max-w-3xl flex-col items-center gap-4 rounded-3xl border-[3px] border-[#1E1B18] bg-[#FFF8EB] p-5 text-center cartoon-shadow sm:flex-row sm:items-center sm:gap-7 sm:p-8 sm:text-left">
        {/* Character Spotlight */}
        <div className="relative flex shrink-0 flex-col items-center justify-center">
          <div className="flex h-40 w-40 items-center justify-center rounded-3xl border-[3px] border-[#1E1B18] bg-[#FDE68A] p-2 cartoon-shadow-sm sm:h-56 sm:w-56">
            <img
              src={heroPortraitUrl}
              alt="Personagem Natal sorrindo com sua camisa branca NATAL"
              referrerPolicy="no-referrer"
              className="h-full w-full object-contain drop-shadow-[0_4px_0_rgba(30,27,24,0.18)]"
            />
          </div>
        </div>

        {/* Title, Best Score, Instructions & Play CTA */}
        <div className="flex min-w-0 flex-1 flex-col items-center sm:items-start">
          <h1 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-[#1E1B18] text-balance sm:text-5xl">
            Não Pega Ar,{' '}
            <span className="text-[#E11D48]">Natal!</span>
          </h1>

          <div className="mt-2.5 flex items-center gap-2 text-sm font-bold text-[#785C42]">
            <Trophy className="h-4 w-4 text-[#D97706]" />
            <span>Melhor pontuação:</span>
            <span className="font-display text-lg text-[#1E1B18] tabular-nums">
              {highScore}
            </span>
          </div>

          <div className="mt-3.5 space-y-1.5 text-xs font-semibold leading-relaxed text-[#443627] sm:text-sm">
            <p>
              Clique ou toque no estilingue e <strong className="text-[#1E1B18]">arraste para trás</strong> para mirar e arremessar.
            </p>
            <p>
              Acerte o Natal com <strong className="text-[#B45309]">lanches e doces</strong>. Jogue <strong className="text-[#15803D]">salada e suco detox</strong> para fora da tela!
            </p>
            <p>
              <strong className="text-[#1E1B18]">5 acertos seguidos</strong> dão bônus e fazem o Natal soltar ar para não sair voando.
            </p>
          </div>

          <div className="mt-5 flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={onStart}
              className="cartoon-btn flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border-[3px] border-[#1E1B18] bg-[#FACC15] px-8 py-3 font-display text-xl font-bold text-[#1E1B18] cartoon-shadow hover:bg-[#FDE047] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E1B18] sm:w-auto whitespace-nowrap"
            >
              <Play className="h-6 w-6 fill-current" />
              <span>Jogar</span>
            </button>
            <PWAInstallButton />
          </div>
        </div>
      </div>
    </div>
  );
};
