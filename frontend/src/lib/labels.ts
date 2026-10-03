import { Level } from "./types";

export const LEVEL_LABELS: Record<Level, string> = {
  BEGINNER: "Débutant",
  INTERMEDIATE: "Intermédiaire",
  ADVANCED: "Avancé",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
};

export const languageLabel = (code: string) =>
  LANGUAGE_LABELS[code] ?? code.toUpperCase();
