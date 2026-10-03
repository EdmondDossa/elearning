"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DubbedPlayer } from "@/components/player/dubbed-player";
import { ErrorAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { api, ApiError } from "@/lib/api";
import { formatDuration } from "@/lib/format";
import { saveProgress } from "@/lib/progress";
import { ModuleContent } from "@/lib/types";

export default function LearnPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const router = useRouter();

  const [data, setData] = useState<ModuleContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setData(null);
    setError(null);
    api<ModuleContent>(`/modules/${moduleId}`)
      .then(setData)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          router.replace(
            `/login?next=${encodeURIComponent(`/learn/${moduleId}`)}`,
          );
        } else if (e instanceof ApiError && e.status === 403) {
          setError(e.message);
        } else if (
          e instanceof ApiError &&
          (e.status === 404 || e.status === 400)
        ) {
          setError("Ce module est introuvable.");
        } else {
          setError("Impossible de charger le module.");
        }
      });
  }, [moduleId, router]);

  // Sauvegarde silencieuse de la position : un échec ponctuel ne doit pas gêner la lecture
  const handleSave = useCallback(
    (positionSec: number) => {
      saveProgress(moduleId, { positionSec }).catch(() => undefined);
    },
    [moduleId],
  );

  const setCompleted = useCallback(
    async (completed: boolean) => {
      setUpdating(true);
      try {
        const res = await saveProgress(moduleId, { completed });
        setData(
          (d) =>
            d && {
              ...d,
              progress: { ...d.progress, completed: res.completed },
              course: {
                ...d.course,
                progress: res.courseProgress,
                modules: d.course.modules.map((m) =>
                  m.id === d.id ? { ...m, completed: res.completed } : m,
                ),
              },
            },
        );
      } finally {
        setUpdating(false);
      }
    },
    [moduleId],
  );

  const handleEnded = useCallback(() => {
    if (data && !data.progress.completed) setCompleted(true);
  }, [data, setCompleted]);

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorAlert messages={[error]} />
        <Link
          href="/courses"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="aspect-video animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  const isLast = !data.nextModuleId;
  const courseFinished = data.course.progress === 100;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <Link
          href={`/courses/${data.course.id}`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← {data.course.title}
        </Link>

        <div>
          <p className="text-sm text-slate-500">
            Module {data.order} sur {data.course.modules.length}
          </p>
          <h1 className="text-2xl font-bold">{data.title}</h1>
        </div>

        {/* key : nouveau module = nouveau lecteur, état et écouteurs réinitialisés proprement */}
        <DubbedPlayer
          key={data.id}
          module={data}
          onSave={handleSave}
          onEnded={handleEnded}
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          {data.previousModuleId ? (
            <Link
              href={`/learn/${data.previousModuleId}`}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              ← Précédent
            </Link>
          ) : (
            <span />
          )}

          <Button
            variant={data.progress.completed ? "secondary" : "primary"}
            disabled={updating}
            onClick={() => setCompleted(!data.progress.completed)}
          >
            {data.progress.completed
              ? "✓ Terminé · annuler"
              : "Marquer comme terminé"}
          </Button>

          {data.nextModuleId ? (
            <Link
              href={`/learn/${data.nextModuleId}`}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                data.progress.completed
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              Module suivant →
            </Link>
          ) : (
            <span />
          )}
        </div>

        {isLast && courseFinished && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
            <p className="font-semibold">
              🎉 Félicitations, vous avez terminé cette formation !
            </p>
            <Link
              href="/dashboard"
              className="mt-2 inline-block text-sm font-medium underline"
            >
              Voir mon tableau de bord
            </Link>
          </div>
        )}
      </div>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:sticky lg:top-20">
        <ProgressBar
          value={data.course.progress}
          label="Progression de la formation"
        />
        <ol className="mt-4 space-y-1">
          {data.course.modules.map((m) => {
            const current = m.id === data.id;
            return (
              <li key={m.id}>
                <Link
                  href={`/learn/${m.id}`}
                  aria-current={current ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    current
                      ? "bg-indigo-50 font-medium text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      m.completed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {m.completed ? "✓" : m.order}
                  </span>
                  <span className="flex-1">{m.title}</span>
                  <span className="text-xs text-slate-400">
                    {formatDuration(m.durationSec)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
