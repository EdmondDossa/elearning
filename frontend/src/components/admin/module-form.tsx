"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api";
import { LANGUAGE_LABELS } from "@/lib/labels";
import {
  AdminModule,
  AudioTrackInput,
  MediaLibrary,
  MediaTrack,
  ModuleInput,
} from "@/lib/types";
import { ErrorAlert } from "../ui/alert";
import { Button } from "../ui/button";
import { controlClass, Field, SelectField, TextAreaField } from "../ui/field";

const LANGS = Object.keys(LANGUAGE_LABELS);
const fileName = (url: string) => url.replace("/media/", "");

export function ModuleForm({
  initial,
  media,
  onSubmit,
  onCancel,
}: {
  initial?: AdminModule;
  media: MediaLibrary;
  onSubmit: (values: ModuleInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(String(initial?.durationSec ?? 20));
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? "");
  const [audioTracks, setAudioTracks] = useState<AudioTrackInput[]>(
    initial?.audioTracks.map(({ language, label, url, isDefault }) => ({
      language,
      label,
      url,
      isDefault,
    })) ?? [],
  );
  const [subtitles, setSubtitles] = useState<MediaTrack[]>(
    initial?.subtitles.map(({ language, label, url }) => ({
      language,
      label,
      url,
    })) ?? [],
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Associe automatiquement les fichiers nommés <video>.<langue>.m4a / .vtt
  function autoLink() {
    if (!videoUrl) return;
    const base = videoUrl.replace(/\.mp4$/, "");
    const audio = LANGS.filter((l) =>
      media.audio.includes(`${base}.${l}.m4a`),
    ).map((l, i) => ({
      language: l,
      label: LANGUAGE_LABELS[l],
      url: `${base}.${l}.m4a`,
      isDefault: i === 0,
    }));
    const subs = LANGS.filter((l) =>
      media.subtitles.includes(`${base}.${l}.vtt`),
    ).map((l) => ({
      language: l,
      label: LANGUAGE_LABELS[l],
      url: `${base}.${l}.vtt`,
    }));
    setAudioTracks(audio);
    setSubtitles(subs);
  }

  function updateAudio(index: number, patch: Partial<AudioTrackInput>) {
    setAudioTracks((tracks) =>
      tracks.map((t, i) => {
        if (patch.isDefault) return { ...t, isDefault: i === index }; // une seule VO
        if (i !== index) return t;
        const next = { ...t, ...patch };
        if (patch.language)
          next.label = LANGUAGE_LABELS[patch.language] ?? patch.language;
        return next;
      }),
    );
  }

  function updateSubtitle(index: number, patch: Partial<MediaTrack>) {
    setSubtitles((subs) =>
      subs.map((s, i) => {
        if (i !== index) return s;
        const next = { ...s, ...patch };
        if (patch.language)
          next.label = LANGUAGE_LABELS[patch.language] ?? patch.language;
        return next;
      }),
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      await onSubmit({
        title,
        description: description || undefined,
        durationSec: Number(duration),
        videoUrl,
        audioTracks,
        subtitles,
      });
    } catch (err) {
      setErrors(
        err instanceof ApiError ? err.details : ["Enregistrement impossible"],
      );
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5"
      noValidate
    >
      <h3 className="font-semibold">
        {initial ? `Modifier « ${initial.title} »` : "Nouveau module"}
      </h3>
      <ErrorAlert messages={errors} />

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <Field
          id="m-title"
          label="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Field
          id="m-duration"
          label="Durée (secondes)"
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
      </div>
      <TextAreaField
        id="m-description"
        label="Description (optionnelle)"
        rows={2}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <SelectField
            id="m-video"
            label="Vidéo (sans son)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          >
            <option value="">Choisir une vidéo…</option>
            {media.videos.map((v) => (
              <option key={v} value={v}>
                {fileName(v)}
              </option>
            ))}
          </SelectField>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={autoLink}
          disabled={!videoUrl}
        >
          Associer les pistes automatiquement
        </Button>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">
          Pistes audio (doublage)
        </legend>
        {audioTracks.map((t, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              className={`${controlClass} w-36`}
              value={t.language}
              onChange={(e) => updateAudio(i, { language: e.target.value })}
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </option>
              ))}
            </select>
            <select
              className={`${controlClass} min-w-48 flex-1`}
              value={t.url}
              onChange={(e) => updateAudio(i, { url: e.target.value })}
            >
              <option value="">Fichier audio…</option>
              {media.audio.map((a) => (
                <option key={a} value={a}>
                  {fileName(a)}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="radio"
                name="vo"
                checked={t.isDefault}
                onChange={() => updateAudio(i, { isDefault: true })}
              />
              VO
            </label>
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                setAudioTracks((tr) => tr.filter((_, j) => j !== i))
              }
            >
              Retirer
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            setAudioTracks((tr) => [
              ...tr,
              {
                language: "fr",
                label: "Français",
                url: "",
                isDefault: tr.length === 0,
              },
            ])
          }
        >
          + Ajouter une piste audio
        </Button>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-700">
          Sous-titres
        </legend>
        {subtitles.map((s, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <select
              className={`${controlClass} w-36`}
              value={s.language}
              onChange={(e) => updateSubtitle(i, { language: e.target.value })}
            >
              {LANGS.map((l) => (
                <option key={l} value={l}>
                  {LANGUAGE_LABELS[l]}
                </option>
              ))}
            </select>
            <select
              className={`${controlClass} min-w-48 flex-1`}
              value={s.url}
              onChange={(e) => updateSubtitle(i, { url: e.target.value })}
            >
              <option value="">Fichier .vtt…</option>
              {media.subtitles.map((f) => (
                <option key={f} value={f}>
                  {fileName(f)}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSubtitles((st) => st.filter((_, j) => j !== i))}
            >
              Retirer
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            setSubtitles((st) => [
              ...st,
              { language: "fr", label: "Français", url: "" },
            ])
          }
        >
          + Ajouter des sous-titres
        </Button>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer le module"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}
