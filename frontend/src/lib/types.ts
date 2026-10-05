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
