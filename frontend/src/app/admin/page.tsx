"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LevelBadge } from "@/components/level-badge";
import { ErrorAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { languageLabel } from "@/lib/labels";
import { AdminCourse } from "@/lib/types";

export default function AdminPage() {
  const [courses, setCourses] = useState<AdminCourse[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<AdminCourse[]>("/admin/courses")
      .then(setCourses)
      .catch(() => setError("Impossible de charger les formations."));
  }, []);

  useEffect(load, [load]);

  async function handleDelete(course: AdminCourse) {
    const warning =
      course.enrollmentsCount > 0
        ? `\n\n${course.enrollmentsCount} apprenant(s) suivent cette formation : leur progression sera supprimée.`
        : "";
    if (!window.confirm(`Supprimer « ${course.title} » ?${warning}`)) return;
    try {
      await api(`/admin/courses/${course.id}`, { method: "DELETE" });
      load();
    } catch {
      setError("Suppression impossible.");
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="mt-1 text-slate-600">
            Gérez les formations, leurs modules et leurs pistes de doublage.
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Nouvelle formation
        </Link>
      </div>

      {error && <ErrorAlert messages={[error]} />}

      {!courses ? (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/70" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Formation</th>
                <th className="px-4 py-3 font-medium">Niveau</th>
                <th className="px-4 py-3 font-medium">Langue</th>
                <th className="px-4 py-3 font-medium">Modules</th>
                <th className="px-4 py-3 font-medium">Inscrits</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-slate-500">{c.instructor}</p>
                  </td>
                  <td className="px-4 py-3">
                    <LevelBadge level={c.level} />
                  </td>
                  <td className="px-4 py-3">{languageLabel(c.language)}</td>
                  <td className="px-4 py-3">{c.modulesCount}</td>
                  <td className="px-4 py-3">{c.enrollmentsCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/admin/courses/${c.id}`}
                        className="rounded-lg px-3 py-2 font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        Modifier
                      </Link>
                      <Button
                        variant="ghost"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDelete(c)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
