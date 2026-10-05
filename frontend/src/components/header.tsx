"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./ui/button";

const linkClass = (active: boolean) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? "bg-indigo-50 text-indigo-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;

export function Header() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/courses" className="text-lg font-bold text-indigo-600">
            LearnHub
          </Link>
          <nav className="flex gap-1">
            <Link
              href="/courses"
              className={linkClass(pathname.startsWith("/courses"))}
            >
              Catalogue
            </Link>
            {user && (
              <Link
                href="/dashboard"
                className={linkClass(pathname.startsWith("/dashboard"))}
              >
                Mon tableau de bord
              </Link>
            )}
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={linkClass(pathname.startsWith("/admin"))}
              >
                Administration
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-9 w-32 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">
                {user.name}
              </span>
              <Button variant="secondary" onClick={handleLogout}>
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass(pathname === "/login")}>
                Connexion
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Inscription
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
