"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LevelBadge } from "@/components/level-badge";
import { ErrorAlert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatDuration } from "@/lib/format";
import { languageLabel } from "@/lib/labels";
import { CourseDetail } from "@/lib/types";

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  // Rechargé quand l'utilisateur change (connexion/déconnexion) pour mettre à jour la progression
  useEffect(() => {
    if (authLoading) return;
    api<CourseDetail>(`/courses/${id}`)
      .then(setCourse)
      .catch((e) =>
        setError(
          e instanceof ApiError && (e.status === 404 || e.status === 400)
            ? "Cette formation est introuvable."
            : "Impossible de charger la formation.",
        ),
      );
  }, [id, user?.id, authLoading]);

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

  if (!course) return <DetailSkeleton />;

  const totalDuration = course.modules.reduce(
    (sum, m) => sum + m.durationSec,
    0,
  );
  const resumeModule =
    course.modules.find((m) => !m.completed) ?? course.modules[0];
  const finished = course.progress === 100;

  async function handleStart() {
    if (!course || !resumeModule) return;
    setStarting(true);
    try {
      if (!course.enrolled) {
        await api(`/courses/${course.id}/enroll`, { method: "POST" });
      }
      router.push(`/learn/${resumeModule.id}`);
    } catch {
      setError("Impossible de démarrer la formation.");
      setStarting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Link
        href="/courses"
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Retour au catalogue
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap gap-2">
          <LevelBadge level={course.level} />
          <Badge>{languageLabel(course.language)}</Badge>
          <Badge tone="indigo">Doublé en plusieurs langues</Badge>
        </div>

        <h1 className="mt-4 text-3xl font-bold">{course.title}</h1>
        <p className="mt-1 text-slate-500">par {course.instructor}</p>
        <p className="mt-4 max-w-3xl text-slate-700">{course.description}</p>

        <p className="mt-4 text-sm text-slate-500">
          {course.modules.length} modules · {formatDuration(totalDuration)} au
          total
        </p>

        {course.enrolled && course.progress !== null && (
          <div className="mt-6 max-w-md">
            <ProgressBar value={course.progress} label="Votre progression" />
          </div>
        )}

        <div className="mt-6">
          {!user ? (
            <Link
              href={`/login?next=${encodeURIComponent(`/courses/${course.id}`)}`}
              className="inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Se connecter pour commencer
            </Link>
          ) : (
            <Button
              onClick={handleStart}
              disabled={starting || !resumeModule}
              className="px-5 py-2.5"
            >
              {starting
                ? "Chargement…"
                : !course.enrolled
                  ? "Commencer la formation"
                  : finished
                    ? "Revoir la formation"
                    : "Continuer la formation"}
            </Button>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Programme</h2>
        <ol className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {course.modules.map((m) => {
            const content = (
              <div className="flex items-center gap-4 px-5 py-4">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    m.completed
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                  aria-label={m.completed ? "Terminé" : `Module ${m.order}`}
                >
                  {m.completed ? "✓" : m.order}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{m.title}</p>
                  {m.description && (
                    <p className="text-sm text-slate-500">{m.description}</p>
                  )}
                </div>
                <span className="text-sm text-slate-500">
                  {formatDuration(m.durationSec)}
                </span>
                {!course.enrolled && <span aria-label="Verrouillé">🔒</span>}
              </div>
            );

            return (
              <li key={m.id}>
                {course.enrolled ? (
                  <Link
                    href={`/learn/${m.id}`}
                    className="block transition hover:bg-slate-50"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />
      <div className="h-48 animate-pulse rounded-2xl bg-slate-200/70" />
    </div>
  );
}
