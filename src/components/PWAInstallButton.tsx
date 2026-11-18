import React, { useState } from 'react';
import { Download, Share } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWA';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="cartoon-btn flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1E1B18] bg-[#FFFDF8] px-5 py-3 font-display text-base font-bold text-[#1E1B18] cartoon-shadow hover:bg-[#FEF3C7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E1B18] sm:w-auto whitespace-nowrap"
      >
        <Download className="h-5 w-5 shrink-0" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="cartoon-btn flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-[3px] border-[#1E1B18] bg-[#FFFDF8] px-5 py-3 font-display text-base font-bold text-[#1E1B18] cartoon-shadow hover:bg-[#FEF3C7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1E1B18] sm:w-auto whitespace-nowrap"
        >
          <Share className="h-5 w-5 shrink-0" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1B18]/55 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div className="w-full max-w-sm rounded-3xl border-[3px] border-[#1E1B18] bg-[#FFF8EB] p-6 text-left cartoon-shadow">
              <h3
                id="ios-install-title"
                className="font-display text-2xl font-bold text-[#1E1B18]"
              >
                Instalar no iPhone / iPad
              </h3>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-semibold text-[#443627]">
                <li>
                  Toque no botão <strong>Compartilhar</strong> na barra do Safari.
                </li>
                <li>
                  Role para baixo e toque em{' '}
                  <strong>Adicionar à Tela de Início</strong>.
                </li>
                <li>
                  Confirme em <strong>Adicionar</strong> para jogar offline em tela cheia.
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="cartoon-btn mt-5 flex min-h-[46px] w-full items-center justify-center rounded-2xl border-2 border-[#1E1B18] bg-[#FACC15] px-4 py-2 font-display text-base font-bold text-[#1E1B18] cartoon-shadow-sm hover:bg-[#FDE047]"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
