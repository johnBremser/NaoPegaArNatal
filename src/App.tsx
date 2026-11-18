import { useCallback, useEffect, useState } from 'react';
import { GameHud } from './components/GameHud';
import { GameOverModal, PauseModal } from './components/Modals';
import { OfflineIndicator } from './components/OfflineIndicator';
import { TitleScreen } from './components/TitleScreen';
import { soundEngine } from './game/audio';
import { GameCanvas } from './game/GameCanvas';
import { DESIRED_ITEMS, GAME_CONFIG, GameState, HudSnapshot } from './game/types';

function readStoredHighScore(): number {
  try {
    const raw = localStorage.getItem(GAME_CONFIG.HIGH_SCORE_STORAGE_KEY);
    const parsed = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function readStoredMuted(): boolean {
  try {
    return localStorage.getItem(GAME_CONFIG.MUTE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [runId, setRunId] = useState<number>(1);
  const [highScore, setHighScore] = useState<number>(() => readStoredHighScore());
  const [lastMatchScore, setLastMatchScore] = useState<number>(0);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(() => {
    const m = readStoredMuted();
    soundEngine.setMuted(m);
    return m;
  });
  const [heroPortraitUrl, setHeroPortraitUrl] = useState<string>(
    '/assets/aistudio/natal-conceito-revisado_e19001b2.png'
  );

  const [hud, setHud] = useState<HudSnapshot>({
    score: 0,
    highScore: readStoredHighScore(),
    anger: 0,
    streak: 0,
    itemTimer: GAME_CONFIG.BASE_ITEM_TIME_SEC,
    maxItemTimer: GAME_CONFIG.BASE_ITEM_TIME_SEC,
    timerExpired: false,
    currentItem: DESIRED_ITEMS[0],
    natalMood: 'normal',
    inFlight: false,
  });

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      try {
        localStorage.setItem(GAME_CONFIG.MUTE_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      if (!next && gameState === 'PLAYING') {
        soundEngine.startMusic();
      }
      return next;
    });
  }, [gameState]);

  const handleStartGame = useCallback(() => {
    soundEngine.unlock();
    setIsNewRecord(false);
    setRunId((id) => id + 1);
    setGameState('PLAYING');
    if (!muted) {
      soundEngine.startMusic();
    }
  }, [muted]);

  const handlePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') {
        soundEngine.stopMusic();
        return 'PAUSED';
      }
      return prev;
    });
  }, []);

  const handleResume = useCallback(() => {
    soundEngine.unlock();
    setGameState('PLAYING');
    if (!muted) {
      soundEngine.startMusic();
    }
  }, [muted]);

  const handleMainMenu = useCallback(() => {
    soundEngine.stopMusic();
    setIsNewRecord(false);
    setRunId((id) => id + 1);
    setGameState('TITLE_MENU');
  }, []);

  const handleGameOver = useCallback(
    (finalScore: number) => {
      setLastMatchScore(finalScore);
      setGameState('GAME_OVER');
      setHighScore((prevBest) => {
        if (finalScore > prevBest) {
          setIsNewRecord(true);
          try {
            localStorage.setItem(
              GAME_CONFIG.HIGH_SCORE_STORAGE_KEY,
              String(finalScore)
            );
          } catch {
            // Ignore storage errors
          }
          return finalScore;
        }
        setIsNewRecord(false);
        return prevBest;
      });
    },
    []
  );

  // Keyboard shortcuts: Esc to pause/resume, Enter/Space on Title Screen to play
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState === 'PLAYING') {
          handlePause();
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
      } else if (
        (e.key === 'Enter' || e.key === ' ') &&
        gameState === 'TITLE_MENU'
      ) {
        e.preventDefault();
        handleStartGame();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handlePause, handleResume, handleStartGame]);

  // Auto-pause if browser tab loses visibility during active match
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden && gameState === 'PLAYING') {
        handlePause();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [gameState, handlePause]);

  return (
    <main className="relative h-dvh w-screen overflow-hidden select-none bg-[#FFF4E0]">
      <GameCanvas
        gameState={gameState}
        highScore={highScore}
        runId={runId}
        onHudUpdate={setHud}
        onGameOver={handleGameOver}
        onAssetsLoaded={setHeroPortraitUrl}
      />

      {gameState === 'TITLE_MENU' && (
        <TitleScreen
          highScore={highScore}
          heroPortraitUrl={heroPortraitUrl}
          muted={muted}
          onStart={handleStartGame}
          onToggleMute={handleToggleMute}
        />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <GameHud
          hud={hud}
          muted={muted}
          onToggleMute={handleToggleMute}
          onPause={handlePause}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          muted={muted}
          onResume={handleResume}
          onRestart={handleStartGame}
          onMainMenu={handleMainMenu}
          onToggleMute={handleToggleMute}
        />
      )}

      {gameState === 'GAME_OVER' && (
        <GameOverModal
          score={lastMatchScore}
          highScore={highScore}
          isNewRecord={isNewRecord}
          heroPortraitUrl={heroPortraitUrl}
          onPlayAgain={handleStartGame}
          onMainMenu={handleMainMenu}
        />
      )}

      <OfflineIndicator />
    </main>
  );
}

