import click from "../assets/sounds/scene2.mp3";
import endSfx from "../assets/sounds/end.mp3";
import correctSfx from "../assets/sounds/victory.mp3";
import wrongSfx from "../assets/sounds/wrong.mp3";

const audioMap = {
  click: new Audio(click),
  win: new Audio(endSfx),
  correct: new Audio(correctSfx),
  wrong: new Audio(wrongSfx),
};

const fadeFrameMap = new Map();

Object.values(audioMap).forEach((audio) => {
  audio.preload = "auto";
  audio.load();
});

let unlocked = false;

const lastPlayed = {
  click: 0,
  win: 0,
  correct: 0,
  wrong: 0,
};

const COOLDOWN = 120;

// Must be called synchronously from inside a user gesture handler
// (pointerdown/touchstart) so iOS Safari marks these Audio elements
// as user-consented and lets subsequent programmatic play() calls work.
export const unlockAudio = () => {
  if (unlocked) return;
  unlocked = true;

  Object.values(audioMap).forEach((audio) => {
    try {
      audio.muted = true;
      const p = audio.play();
      const finish = () => {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      };
      if (p && typeof p.then === "function") {
        p.then(finish).catch(() => {
          audio.muted = false;
        });
      } else {
        finish();
      }
    } catch {
      audio.muted = false;
    }
  });
};

const safePlay = (audio) => {
  // Never play SFX before iOS unlock has been primed on a real gesture.
  if (!unlocked) return;

  try {
    const fadeFrame = fadeFrameMap.get(audio);
    if (fadeFrame) {
      cancelAnimationFrame(fadeFrame);
      fadeFrameMap.delete(audio);
    }

    audio.volume = 1;
    audio.currentTime = 0;
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise.catch(() => {
        setTimeout(() => {
          audio.play().catch(() => {});
        }, 50);
      });
    }
  } catch {}
};

const stopAudio = (audio) => {
  try {
    const fadeFrame = fadeFrameMap.get(audio);
    if (fadeFrame) {
      cancelAnimationFrame(fadeFrame);
      fadeFrameMap.delete(audio);
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;
  } catch {}
};

const fadeOutAudio = (audio, duration = 600) => {
  try {
    const existingFadeFrame = fadeFrameMap.get(audio);
    if (existingFadeFrame) {
      cancelAnimationFrame(existingFadeFrame);
    }

    if (audio.paused || audio.ended) {
      stopAudio(audio);
      return;
    }

    const startVolume = audio.volume;
    const startTime = performance.now();

    const fade = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      audio.volume = startVolume * (1 - progress);

      if (progress < 1 && !audio.paused && !audio.ended) {
        fadeFrameMap.set(audio, requestAnimationFrame(fade));
        return;
      }

      fadeFrameMap.delete(audio);
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1;
    };

    fadeFrameMap.set(audio, requestAnimationFrame(fade));
  } catch {
    stopAudio(audio);
  }
};

export const PlayClick = () => {
  const now = Date.now();
  if (now - lastPlayed.click < COOLDOWN) return;

  lastPlayed.click = now;
  safePlay(audioMap.click);
};

export const PlayWin = () => {
  const now = Date.now();
  if (now - lastPlayed.win < COOLDOWN) return;

  lastPlayed.win = now;
  safePlay(audioMap.win);
};

export const PlayCorrect = () => {
  const now = Date.now();
  if (now - lastPlayed.correct < COOLDOWN) return;

  lastPlayed.correct = now;
  safePlay(audioMap.correct);
};

export const StopCorrect = () => {
  stopAudio(audioMap.correct);
};

export const FadeOutCorrect = () => {
  fadeOutAudio(audioMap.correct);
};

export const PlayWrong = () => {
  const now = Date.now();
  if (now - lastPlayed.wrong < COOLDOWN) return;

  lastPlayed.wrong = now;
  safePlay(audioMap.wrong);
};
