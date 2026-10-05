"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CourseForm } from "@/components/admin/course-form";
import { ModuleForm } from "@/components/admin/module-form";
import { ErrorAlert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDuration } from "@/lib/format";
import {
  AdminCourseDetail,
  AdminModule,
  CourseInput,
  MediaLibrary,
  ModuleInput,
} from "@/lib/types";

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();

  const [course, setCourse] = useState<AdminCourseDetail | null>(null);
  const [media, setMedia] = useState<MediaLibrary | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<AdminCourseDetail>(`/admin/courses/${id}`)
      .then(setCourse)
      .catch(() => setError("Formation introuvable."));
  }, [id]);

  useEffect(() => {
    load();
    api<MediaLibrary>("/admin/media")
      .then(setMedia)
      .catch(() => setMedia(null));
  }, [load]);

  async function saveCourse(values: CourseInput) {
    const updated = await api<AdminCourseDetail>(`/admin/courses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(values),
    });
    setCourse((c) => c && { ...c, ...updated, modules: c.modules });
  }

  async function saveModule(values: ModuleInput) {
    const isNew = editing === "new";
    await api<AdminModule>(
      isNew ? `/admin/courses/${id}/modules` : `/admin/modules/${editing}`,
      {
        method: isNew ? "POST" : "PATCH",
        body: JSON.stringify(values),
      },
    );
    setEditing(null);
    load();
  }

  async function deleteModule(m: AdminModule) {
    if (
      !window.confirm(
        `Supprimer le module « ${m.title} » ? Les progressions associées seront perdues.`,
      )
    )
      return;
    await api(`/admin/modules/${m.id}`, { method: "DELETE" });
    load();
  }

  if (error) return <ErrorAlert messages={[error]} />;
  if (!course)
    return <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" />;

  const { title, instructor, language, level, description } = course;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/admin"
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          ← Administration
        </Link>
        <Link
          href={`/courses/${course.id}`}
          className="text-sm font-medium text-indigo-600 hover:underline"
        >
          Voir la page publique ↗
        </Link>
      </div>

      <h1 className="text-2xl font-bold">{course.title}</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Informations</h2>
        <CourseForm
          key={course.id}
          initial={{ title, instructor, language, level, description }}
          submitLabel="Enregistrer"
          onSubmit={saveCourse}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Modules ({course.modules.length})
          </h2>
          {editing === null && (
            <Button onClick={() => setEditing("new")}>
              + Ajouter un module
            </Button>
          )}
        </div>

        {editing === "new" && media && (
          <ModuleForm
            media={media}
            onSubmit={saveModule}
            onCancel={() => setEditing(null)}
          />
        )}

        {course.modules.length === 0 && editing !== "new" && (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Aucun module pour l&apos;instant.
          </p>
        )}

        <ol className="space-y-2">
          {course.modules.map((m) =>
            editing === m.id && media ? (
              <li key={m.id}>
                <ModuleForm
                  initial={m}
                  media={media}
                  onSubmit={saveModule}
                  onCancel={() => setEditing(null)}
                />
              </li>
            ) : (
              <li
                key={m.id}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">
                  {m.order}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{m.title}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge>{formatDuration(m.durationSec)}</Badge>
                    {m.audioTracks.map((t) => (
                      <Badge
                        key={t.language}
                        tone={t.isDefault ? "indigo" : "slate"}
                      >
                        🎧 {t.language.toUpperCase()}
                        {t.isDefault ? " · VO" : ""}
                      </Badge>
                    ))}
                    {m.subtitles.map((s) => (
                      <Badge key={s.language}>
                        💬 {s.language.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  disabled={editing !== null}
                  onClick={() => setEditing(m.id)}
                >
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  disabled={editing !== null}
                  onClick={() => deleteModule(m)}
                >
                  Supprimer
                </Button>
              </li>
            ),
          )}
        </ol>
      </section>
    </>
  );
}
