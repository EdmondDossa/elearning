"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { api } from "@/lib/api";
import { AdminCourseDetail, CourseInput } from "@/lib/types";

export default function NewCoursePage() {
  const router = useRouter();

  async function create(values: CourseInput) {
    const course = await api<AdminCourseDetail>("/admin/courses", {
      method: "POST",
      body: JSON.stringify(values),
    });
    router.push(`/admin/courses/${course.id}`); // on enchaîne sur l'ajout des modules
  }

  return (
    <>
      <Link
        href="/admin"
        className="text-sm font-medium text-indigo-600 hover:underline"
      >
        ← Administration
      </Link>
      <h1 className="text-2xl font-bold">Nouvelle formation</h1>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CourseForm submitLabel="Créer la formation" onSubmit={create} />
      </div>
    </>
  );
}
