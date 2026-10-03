import Link from "next/link";
import { formatRelative } from "@/lib/format";
import { languageLabel } from "@/lib/labels";
import { DashboardCourse as Course } from "@/lib/types";
import { LevelBadge } from "./level-badge";
import { Badge } from "./ui/badge";
import { ProgressBar } from "./ui/progress-bar";

export function DashboardCourse({
  course,
  now,
}: {
  course: Course;
  now: number;
}) {
  const target = course.resumeModuleId
    ? `/learn/${course.resumeModuleId}`
    : `/courses/${course.id}`;

  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="flex-1 space-y-2">
        <div className="flex flex-wrap gap-2">
          <LevelBadge level={course.level} />
          <Badge>{languageLabel(course.language)}</Badge>
          {course.completed && <Badge tone="green">Terminée</Badge>}
        </div>
        <Link
          href={`/courses/${course.id}`}
          className="block text-lg font-semibold hover:text-indigo-700"
        >
          {course.title}
        </Link>
        <p className="text-sm text-slate-500">
          par {course.instructor} · dernière activité{" "}
          {formatRelative(course.lastActivityAt, now)}
        </p>
        <div className="max-w-md">
          <ProgressBar
            value={course.progress}
            label={`${course.completedModules} / ${course.totalModules} modules`}
          />
        </div>
      </div>

      <Link
        href={target}
        className={`shrink-0 rounded-lg px-4 py-2 text-center text-sm font-medium ${
          course.completed
            ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {course.completed
          ? "Revoir"
          : course.progress === 0
            ? "Commencer"
            : "Continuer"}
      </Link>
    </li>
  );
}
