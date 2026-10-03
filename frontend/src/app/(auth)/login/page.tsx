"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { ErrorAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { safeRedirect } from "@/lib/safe-redirect";

export default function LoginPage() {
  // useSearchParams doit être sous un Suspense pour que le build de production passe
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(safeRedirect(params.get("next")));
    } catch (err) {
      setErrors(
        err instanceof ApiError
          ? err.details
          : ["Connexion impossible, réessayez."],
      );
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setEmail("demo@elearning.local");
    setPassword("Demo1234!");
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Connexion</h1>
      <p className="mt-1 text-sm text-slate-600">
        Accédez à vos formations et à votre progression.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <ErrorAlert messages={errors} />
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          id="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Connexion…" : "Se connecter"}
        </Button>
      </form>

      <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        Compte de démonstration : <strong>demo@elearning.local</strong> /{" "}
        <strong>Demo1234!</strong>
        <button
          type="button"
          onClick={fillDemo}
          className="ml-2 font-medium text-indigo-600 hover:underline"
        >
          Remplir
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Pas encore de compte ?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-600 hover:underline"
        >
          S&apos;inscrire
        </Link>
      </p>
    </>
  );
}
