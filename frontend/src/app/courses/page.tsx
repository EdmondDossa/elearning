"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { CourseCard } from "@/components/course-card";
import { ErrorAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { languageLabel, LEVEL_LABELS } from "@/lib/labels";
import { CourseFilters, CourseSummary } from "@/lib/types";
import { useDebounce } from "@/lib/use-debounce";

const selectClass =
  "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export default function CoursesPage() {
  return (
    <Suspense fallback={<GridSkeleton />}>
      <Catalog />
    </Suspense>
  );
}

function Catalog() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();

  const [search, setSearch] = useState(params.get("search") ?? "");
  const debouncedSearch = useDebounce(search);

  const [filters, setFilters] = useState<CourseFilters | null>(null);
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [coursesUserId, setCoursesUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Met à jour un paramètre d'URL sans recharger la page
  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  // La recherche (après debounce) est reportée dans l'URL
  useEffect(() => {
    if ((params.get("search") ?? "") !== debouncedSearch.trim()) {
      setParam("search", debouncedSearch.trim());
    }
  }, [debouncedSearch, params, setParam]);

  // Valeurs disponibles pour les filtres, chargées une seule fois
  useEffect(() => {
    api<CourseFilters>("/courses/filters")
      .then(setFilters)
      .catch(() => setFilters(null));
  }, []);

  // Recharger aussi après connexion/déconnexion et au retour sur l'onglet.
  useEffect(() => {
    if (authLoading) return;
    let controller: AbortController | undefined;
    function loadCourses() {
      controller?.abort();
      const request = new AbortController();
      controller = request;
      setLoading(true);
      setError(null);
      api<CourseSummary[]>(`/courses${query ? `?${query}` : ""}`, {
        signal: request.signal,
        cache: "no-store",
      })
        .then((data) => {
          if (request.signal.aborted) return;
          setCourses(data);
          setCoursesUserId(userId);
          setLoading(false);
        })
        .catch(() => {
          if (request.signal.aborted) return;
          setError("Impossible de charger les formations.");
          setLoading(false);
        });
    }
    loadCourses();
    window.addEventListener("focus", loadCourses);
    return () => {
      controller?.abort();
      window.removeEventListener("focus", loadCourses);
    };
  }, [query, userId, authLoading]);

  function resetFilters() {
    setSearch("");
    router.replace(pathname, { scroll: false });
  }

  const hasFilters = Boolean(query);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Catalogue des formations</h1>
        <p className="mt-1 text-slate-600">
          Vidéos doublées en plusieurs langues, à votre rythme.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="sr-only" htmlFor="search">
          Rechercher
        </label>
        <input
          id="search"
          type="search"
          placeholder="Rechercher par titre ou formateur…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${selectClass} flex-1`}
        />

        <label className="sr-only" htmlFor="language">
          Langue
        </label>
        <select
          id="language"
          className={selectClass}
          value={params.get("language") ?? ""}
          onChange={(e) => setParam("language", e.target.value)}
        >
          <option value="">Toutes les langues</option>
          {filters?.languages.map((l) => (
            <option key={l} value={l}>
              {languageLabel(l)}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="level">
          Niveau
        </label>
        <select
          id="level"
          className={selectClass}
          value={params.get("level") ?? ""}
          onChange={(e) => setParam("level", e.target.value)}
        >
          <option value="">Tous les niveaux</option>
          {filters?.levels.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABELS[l]}
            </option>
          ))}
        </select>

        {hasFilters && (
          <Button variant="ghost" onClick={resetFilters}>
            Réinitialiser
          </Button>
        )}
      </div>

      {error && <ErrorAlert messages={[error]} />}

      {!error && courses === null && <GridSkeleton />}

      {!error && courses !== null && (
        <>
          <p className="text-sm text-slate-500" aria-live="polite">
            {courses.length} formation{courses.length > 1 ? "s" : ""}
          </p>

          {courses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-medium">
                Aucune formation ne correspond à votre recherche.
              </p>
              <Button
                variant="secondary"
                className="mt-4"
                onClick={resetFilters}
              >
                Voir toutes les formations
              </Button>
            </div>
          ) : (
            <div
              className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${loading ? "opacity-60" : ""}`}
            >
              {courses.map((c) => (
                <CourseCard
                  key={c.id}
                  course={{
                    ...c,
                    learning: !authLoading && userId && coursesUserId === userId
                      ? c.learning : null,
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-52 animate-pulse rounded-2xl bg-slate-200/70"
        />
      ))}
    </div>
  );
}
