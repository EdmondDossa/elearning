import Link from "next/link";
import { languageLabel } from "@/lib/labels";
import { CourseSummary } from "@/lib/types";
import { LevelBadge } from "./level-badge";
import { Badge } from "./ui/badge";
import { ProgressBar } from "./ui/progress-bar";

const LEARNING_STATUS = {
  NOT_STARTED: { label: "À commencer", tone: "slate" },
  IN_PROGRESS: { label: "En cours", tone: "indigo" },
  COMPLETED: { label: "Terminée", tone: "green" },
} as const;

export function CourseCard({ course }: { course: CourseSummary }) {
  const learning = course.learning;
  const status = learning ? LEARNING_STATUS[learning.status] : null;

  return (
    <Link
      href={`/courses/${course.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition
        hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
    >
      <div className="flex flex-wrap gap-2">
        <LevelBadge level={course.level} />
        <Badge>{languageLabel(course.language)}</Badge>
      </div>
      <h2 className="mt-3 text-lg font-semibold group-hover:text-indigo-700">
        {course.title}
      </h2>
      <p className="text-sm text-slate-500">par {course.instructor}</p>
      <p className="mt-3 line-clamp-3 flex-1 text-sm text-slate-600">
        {course.description}
      </p>
      <p className="mt-4 text-xs font-medium text-slate-500">
        {course.modulesCount} module{course.modulesCount > 1 ? "s" : ""}
      </p>
      {learning && status && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <Badge tone={status.tone}>{status.label}</Badge>
          <ProgressBar
            value={learning.progress}
            label={`${learning.completedModules} / ${course.modulesCount} modules terminés`}
          />
        </div>
      )}
    </Link>
  );
}
