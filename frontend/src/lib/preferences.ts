export const AUDIO_PREF_KEY = "pref.audioLanguage";
export const SUBTITLE_PREF_KEY = "pref.subtitleLanguage";

// localStorage peut être indisponible (navigation privée stricte) : on ne doit jamais planter
export function readPref(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writePref(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignoré */
  }
}
