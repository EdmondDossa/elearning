"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ErrorAlert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);

    // Contrôle immédiat côté client (confort), la validation de référence reste celle du backend
    if (password !== confirm) {
      setErrors(["Les mots de passe ne correspondent pas"]);
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      router.replace("/courses");
    } catch (err) {
      setErrors(
        err instanceof ApiError
          ? err.details
          : ["Inscription impossible, réessayez."],
      );
      setSubmitting(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold">Créer un compte</h1>
      <p className="mt-1 text-sm text-slate-600">
        Gratuit, et vous pouvez commencer tout de suite.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <ErrorAlert messages={errors} />
        <Field
          id="name"
          label="Nom"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          label="Mot de passe (8 caractères min., une lettre et un chiffre)"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Field
          id="confirm"
          label="Confirmer le mot de passe"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Création…" : "Créer mon compte"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Déjà inscrit ?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-600 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </>
  );
}
