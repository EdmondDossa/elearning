"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/admin");
  }, [loading, user, router]);

  if (loading || !user) return <p className="text-slate-500">Chargement…</p>;

  // Affichage seulement : c'est l'API qui refuse réellement l'accès (403)
  if (user.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="font-medium">
          Cet espace est réservé aux administrateurs.
        </p>
        <Link
          href="/courses"
          className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline"
        >
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return <div className="space-y-6">{children}</div>;
}
