import { api } from "./api";
import { ProgressUpdate } from "./types";

export function saveProgress(
  moduleId: string,
  body: { positionSec?: number; completed?: boolean },
) {
  return api<ProgressUpdate>(`/modules/${moduleId}/progress`, {
    method: "PUT",
    body: JSON.stringify(body),
    keepalive: true, // la requête survit à la fermeture ou au changement de page
  });
}
