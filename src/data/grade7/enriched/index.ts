import type { EnrichedLesson } from './types';

const batchModules = import.meta.glob('./*.lessons.json', {
  eager: true,
  import: 'default',
}) as Record<string, EnrichedLesson[]>;

const enrichedLessons: EnrichedLesson[] = Object.values(batchModules).flatMap((lessons) => lessons);

const enrichedLessonById = new Map(enrichedLessons.map((lesson) => [lesson.lessonId, lesson]));

export function getEnrichedLesson(lessonId: string): EnrichedLesson | null {
  return enrichedLessonById.get(lessonId) ?? null;
}

export function hasEnrichedLesson(lessonId: string): boolean {
  return enrichedLessonById.has(lessonId);
}

export function getAllEnrichedLessons(): EnrichedLesson[] {
  return enrichedLessons;
}

export type { EnrichedLesson } from './types';
