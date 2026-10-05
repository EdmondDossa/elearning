export type Role = "USER" | "ADMIN";
export type Level = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

export interface CourseSummary {
  id: string;
  title: string;
  instructor: string;
  language: string;
  level: Level;
  description: string;
  thumbnailUrl: string | null;
  modulesCount: number;
}

export interface CourseFilters {
  languages: string[];
  levels: Level[];
}

export interface CourseDetail extends Omit<CourseSummary, "modulesCount"> {
  enrolled: boolean;
  progress: number | null;
  modules: {
    id: string;
    title: string;
    description: string | null;
    order: number;
    durationSec: number;
    completed: boolean;
  }[];
}

export interface MediaTrack {
  language: string;
  label: string;
  url: string;
}

export interface ModuleContent {
  id: string;
  title: string;
  description: string | null;
  order: number;
  durationSec: number;
  videoUrl: string;
  audioTracks: (MediaTrack & { isDefault: boolean })[];
  subtitles: MediaTrack[];
  progress: { positionSec: number; completed: boolean };
  previousModuleId: string | null;
  nextModuleId: string | null;
  course: {
    id: string;
    title: string;
    progress: number;
    modules: {
      id: string;
      title: string;
      order: number;
      durationSec: number;
      completed: boolean;
    }[];
  };
}

export interface ProgressUpdate {
  positionSec: number;
  completed: boolean;
  courseProgress: number;
}

export interface DashboardCourse {
  id: string;
  title: string;
  instructor: string;
  language: string;
  level: Level;
  thumbnailUrl: string | null;
  totalModules: number;
  completedModules: number;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  lastActivityAt: string;
  resumeModuleId: string | null;
}

export interface Dashboard {
  stats: { enrolled: number; inProgress: number; completed: number };
  courses: DashboardCourse[];
}

export interface AdminCourse {
  id: string;
  title: string;
  instructor: string;
  language: string;
  level: Level;
  description: string;
  modulesCount: number;
  enrollmentsCount: number;
}

export interface AudioTrackInput extends MediaTrack {
  isDefault: boolean;
}

export interface AdminModule {
  id: string;
  title: string;
  description: string | null;
  order: number;
  durationSec: number;
  videoUrl: string;
  audioTracks: AudioTrackInput[];
  subtitles: MediaTrack[];
}

export interface AdminCourseDetail {
  id: string;
  title: string;
  instructor: string;
  language: string;
  level: Level;
  description: string;
  modules: AdminModule[];
}

export interface MediaLibrary {
  videos: string[];
  audio: string[];
  subtitles: string[];
}

export type CourseInput = Pick<
  AdminCourseDetail,
  "title" | "instructor" | "language" | "level" | "description"
>;

export interface ModuleInput {
  title: string;
  description?: string;
  durationSec: number;
  videoUrl: string;
  audioTracks: AudioTrackInput[];
  subtitles: MediaTrack[];
}
