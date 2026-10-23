export interface Lesson {
  id: string;
  title: string;
  tip: string;
  task: string;
  min: number;
}

export interface Level {
  id: number;
  name: string;
  color: string;
  lessons: Lesson[];
}

export interface AudioMetrics {
  span: number;
  speak: number;
  silentPct: number;
  long: number;
  volSd: number;
  pitch: number;
  pitchSd: number | null;
}

export interface FillersData {
  total: number;
  breakdown: Record<string, number>;
}

export interface EvaluationResult {
  score: number;
  content: number | null;
  structure: number | null;
  voice: number;
  pace: number;
  eye_contact: number | null;
  body_language: number | null;
  expression: number | null;
  summary: string;
  tone_notes: string;
  video_notes: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  drill: string;
  better_opening?: string;
  wpm: number | null;
  words: number;
  duration: number;
  fillers: FillersData;
  audioMetrics: AudioMetrics | null;
  thumbnails: string[];
  lessonId: string;
  lessonTitle: string;
  isQuick: boolean;
  date: number;
  pass?: boolean;
  minScore?: number;
  xpEarned: number;
  previousScore?: number | null;
  transcriptText: string;
}

export interface EvaluationHistoryItem {
  id: string;
  lessonId: string;
  lessonTitle: string;
  score: number;
  date: number;
  eyeContact?: number | null;
  hasVideo: boolean;
  isQuick?: boolean;
}

export interface UserAccount {
  email: string;
  name: string;
  salt: string;
  hash: string;
  since: number;
}

export interface UserProfileData {
  xp: number;
  streak: number;
  lastActiveDate: string;
  doneLessons: Record<string, number>; // lessonId -> best score
  history: EvaluationHistoryItem[];
  name: string;
  aiLanguage: 'en' | 'si';
  speechLanguage: 'en-US' | 'si-LK';
  photo: string;
  goal: string;
}
