"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardCourse } from "@/components/dashboard-course";
import { ErrorAlert } from "@/components/ui/alert";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Dashboard } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    // Cookie présent mais session refusée par le backend
    if (!user) {
      router.replace("/login?next=/dashboard");
      return;
    }
    api<Dashboard>("/dashboard")
      .then(setData)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401)
          router.replace("/login?next=/dashboard");
        else setError("Impossible de charger votre tableau de bord.");
      });
  }, [authLoading, user, router]);

  if (error) return <ErrorAlert messages={[error]} />;

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-slate-200/70"
            />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  const inProgress = data.courses.filter((c) => !c.completed);
  const completed = data.courses.filter((c) => c.completed);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Bonjour {user?.name} 👋</h1>
        <p className="mt-1 text-slate-600">
          Voici où vous en êtes dans vos formations.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <Stat label="Formations suivies" value={data.stats.enrolled} />
        <Stat label="En cours" value={data.stats.inProgress} />
        <Stat label="Terminées" value={data.stats.completed} />
      </dl>

      {data.courses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-medium">Vous ne suivez encore aucune formation.</p>
          <Link
            href="/courses"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Parcourir le catalogue
          </Link>
        </div>
      ) : (
        <>
          {inProgress.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">En cours</h2>
              <ul className="space-y-3">
                {inProgress.map((c) => (
                  <DashboardCourse key={c.id} course={c} />
                ))}
              </ul>
            </section>
          )}
          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-xl font-semibold">Terminées</h2>
              <ul className="space-y-3">
                {completed.map((c) => (
                  <DashboardCourse key={c.id} course={c} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-3xl font-bold">{value}</dd>
    </div>
  );
}
