import { LEVEL_LABELS } from "@/lib/labels";
import { Level } from "@/lib/types";
import { Badge } from "./ui/badge";

const LEVEL_TONES = {
  BEGINNER: "green",
  INTERMEDIATE: "amber",
  ADVANCED: "red",
} as const;

export function LevelBadge({ level }: { level: Level }) {
  return <Badge tone={LEVEL_TONES[level]}>{LEVEL_LABELS[level]}</Badge>;
}
