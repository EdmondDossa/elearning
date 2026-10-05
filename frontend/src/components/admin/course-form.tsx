"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/lib/api";
import { LANGUAGE_LABELS, LEVEL_LABELS } from "@/lib/labels";
import { CourseInput, Level } from "@/lib/types";
import { ErrorAlert } from "../ui/alert";
import { Button } from "../ui/button";
import { Field, SelectField, TextAreaField } from "../ui/field";

const EMPTY: CourseInput = {
  title: "",
  instructor: "",
  language: "fr",
  level: "BEGINNER",
  description: "",
};

export function CourseForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: CourseInput;
  submitLabel: string;
  onSubmit: (values: CourseInput) => Promise<void>;
}) {
  const [values, setValues] = useState<CourseInput>(initial ?? EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof CourseInput>(key: K, value: CourseInput[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      await onSubmit(values);
      setSaved(true);
    } catch (err) {
      setErrors(
        err instanceof ApiError ? err.details : ["Enregistrement impossible"],
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <ErrorAlert messages={errors} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="title"
          label="Titre"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
        />
        <Field
          id="instructor"
          label="Formateur"
          value={values.instructor}
          onChange={(e) => set("instructor", e.target.value)}
        />
        <SelectField
          id="language"
          label="Langue d'origine"
          value={values.language}
          onChange={(e) => set("language", e.target.value)}
        >
          {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="level"
          label="Niveau"
          value={values.level}
          onChange={(e) => set("level", e.target.value as Level)}
        >
          {Object.entries(LEVEL_LABELS).map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>
      <TextAreaField
        id="description"
        label="Description"
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
      />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Enregistrement…" : submitLabel}
        </Button>
        {saved && (
          <span className="text-sm text-emerald-600">✓ Enregistré</span>
        )}
      </div>
    </form>
  );
}
