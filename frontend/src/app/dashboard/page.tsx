"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Cookie présent mais session invalide côté backend
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/dashboard");
  }, [loading, user, router]);

  if (loading || !user) return <p className="text-slate-500">Chargement…</p>;
  return <h1 className="text-2xl font-bold">Bonjour {user.name} 👋</h1>;
}
