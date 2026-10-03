"use client";

import { useEffect, useRef, useState } from "react";
import { languageLabel } from "@/lib/labels";
import {
  AUDIO_PREF_KEY,
  readPref,
  SUBTITLE_PREF_KEY,
  writePref,
} from "@/lib/preferences";
import { ModuleContent } from "@/lib/types";

const MAX_DRIFT_SEC = 0.3;
const SAVE_INTERVAL_SEC = 10;

interface Props {
  module: ModuleContent;
  onSave: (positionSec: number) => void;
  onEnded: () => void;
}

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export function DubbedPlayer({ module, onSave, onEnded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastSavedRef = useRef(0);

  // Toujours appeler la dernière version des callbacks sans réabonner les écouteurs
  const onSaveRef = useRef(onSave);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onSaveRef.current = onSave;
    onEndedRef.current = onEnded;
  });

  // Langue audio : préférence mémorisée si disponible, sinon piste par défaut (langue d'origine)
  const [audioLang, setAudioLang] = useState(() => {
    const pref = readPref(AUDIO_PREF_KEY);
    return (
      module.audioTracks.find((t) => t.language === pref)?.language ??
      module.audioTracks.find((t) => t.isDefault)?.language ??
      module.audioTracks[0]?.language
    );
  });

  const [subtitleLang, setSubtitleLang] = useState(() => {
    const pref = readPref(SUBTITLE_PREF_KEY);
    return module.subtitles.some((s) => s.language === pref)
      ? (pref as string)
      : "off";
  });

  const track =
    module.audioTracks.find((t) => t.language === audioLang) ??
    module.audioTracks[0];

  // 1. Synchronisation audio ↔ vidéo et sauvegarde de la progression
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio) return;

    const save = () => {
      if (video.readyState < 1) return; // métadonnées non chargées : position non fiable
      const pos = Math.floor(video.currentTime);
      if (pos === lastSavedRef.current) return;
      lastSavedRef.current = pos;
      onSaveRef.current(pos);
    };

    const resync = () => {
      if (Math.abs(audio.currentTime - video.currentTime) > MAX_DRIFT_SEC) {
        audio.currentTime = video.currentTime;
      }
    };

    const handlers: Record<string, () => void> = {
      play: () => {
        resync();
        audio.play().catch(() => undefined);
      },
      playing: () => audio.play().catch(() => undefined), // reprise après mise en mémoire tampon
      waiting: () => audio.pause(), // la vidéo charge : l'audio attend
      pause: () => {
        audio.pause();
        save();
      },
      seeking: () => {
        audio.currentTime = video.currentTime;
      },
      ratechange: () => {
        audio.playbackRate = video.playbackRate;
      },
      volumechange: () => {
        audio.volume = video.volume;
        audio.muted = video.muted;
      },
      timeupdate: () => {
        resync();
        if (
          Math.abs(video.currentTime - lastSavedRef.current) >=
          SAVE_INTERVAL_SEC
        )
          save();
      },
      ended: () => {
        audio.pause();
        save();
        onEndedRef.current();
      },
    };

    // Reprise à la dernière position (sauf si le module est terminé : on repart du début)
    const resume = () => {
      const start = module.progress.completed ? 0 : module.progress.positionSec;
      if (start > 0 && start < video.duration - 1) video.currentTime = start;
      lastSavedRef.current = start;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") save();
    };

    Object.entries(handlers).forEach(([event, fn]) =>
      video.addEventListener(event, fn),
    );
    if (video.readyState >= 1) resume();
    else video.addEventListener("loadedmetadata", resume, { once: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      save(); // on quitte le module : dernière sauvegarde
      Object.entries(handlers).forEach(([event, fn]) =>
        video.removeEventListener(event, fn),
      );
      video.removeEventListener("loadedmetadata", resume);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [module.progress.completed, module.progress.positionSec]);

  // 2. Changement de piste audio sans interrompre la vidéo
  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;
    if (!video || !audio || !track) return;

    const onReady = () => {
      audio.currentTime = video.currentTime;
      audio.playbackRate = video.playbackRate;
      audio.volume = video.volume;
      audio.muted = video.muted;
      if (!video.paused) audio.play().catch(() => undefined);
    };

    audio.src = track.url;
    audio.addEventListener("loadedmetadata", onReady, { once: true });
    audio.load();
    return () => audio.removeEventListener("loadedmetadata", onReady);
  }, [track?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Affichage des sous-titres choisis
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const apply = () => {
      for (const t of Array.from(video.textTracks)) {
        t.mode = t.language === subtitleLang ? "showing" : "disabled";
      }
    };
    apply();
    video.textTracks.addEventListener("addtrack", apply);
    return () => video.textTracks.removeEventListener("addtrack", apply);
  }, [subtitleLang]);

  function changeAudio(lang: string) {
    setAudioLang(lang);
    writePref(AUDIO_PREF_KEY, lang);
  }

  function changeSubtitles(lang: string) {
    setSubtitleLang(lang);
    writePref(SUBTITLE_PREF_KEY, lang);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <video
        ref={videoRef}
        src={module.videoUrl}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full bg-black"
      >
        {module.subtitles.map((s) => (
          <track
            key={s.language}
            kind="subtitles"
            src={s.url}
            srcLang={s.language}
            label={s.label}
          />
        ))}
      </video>
      <audio ref={audioRef} preload="auto" />

      <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 px-4 py-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="font-medium text-slate-700">🎧 Langue audio</span>
          <select
            className={selectClass}
            value={audioLang}
            onChange={(e) => changeAudio(e.target.value)}
          >
            {module.audioTracks.map((t) => (
              <option key={t.language} value={t.language}>
                {t.label || languageLabel(t.language)}
                {t.isDefault ? " (VO)" : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="font-medium text-slate-700">💬 Sous-titres</span>
          <select
            className={selectClass}
            value={subtitleLang}
            onChange={(e) => changeSubtitles(e.target.value)}
          >
            <option value="off">Désactivés</option>
            {module.subtitles.map((s) => (
              <option key={s.language} value={s.language}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
