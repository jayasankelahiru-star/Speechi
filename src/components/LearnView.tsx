import React, { useState } from 'react';
import { CURRICULUM, ALL_LESSONS } from '../data/curriculum';
import { Lesson, UserProfileData } from '../types';
import { Check, Lock, ChevronRight, ArrowLeft, Sparkles, Award } from 'lucide-react';

interface LearnViewProps {
  profile: UserProfileData;
  onSelectLesson: (lesson: Lesson) => void;
  onQuickPractice: () => void;
}

export const LearnView: React.FC<LearnViewProps> = ({
  profile,
  onSelectLesson,
  onQuickPractice,
}) => {
  const [selectedLevelId, setSelectedLevelId] = useState<number | null>(null);

  // Check if a lesson is unlocked
  const isLessonUnlocked = (lessonId: string): boolean => {
    const index = ALL_LESSONS.findIndex((l) => l.id === lessonId);
    if (index === 0) return true;
    const prevLesson = ALL_LESSONS[index - 1];
    const prevScore = profile.doneLessons[prevLesson.id] || 0;
    return prevScore >= prevLesson.min;
  };

  const isLessonPassed = (lesson: Lesson): boolean => {
    return (profile.doneLessons[lesson.id] || 0) >= lesson.min;
  };

  const selectedLevel = CURRICULUM.find((l) => l.id === selectedLevelId);

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Top Banner */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-extrabold text-[#2b2622] tracking-tight">Curriculum</h1>
          <button
            onClick={onQuickPractice}
            className="text-xs font-bold text-[#c4572f] hover:text-[#a33f1b] flex items-center gap-1 bg-[#c4572f]/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-[#c4572f]/15 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Free Rehearsal</span>
          </button>
        </div>
        <p className="text-sm text-[#74695c]">
          Work through bite-sized public speaking challenges. Reach each target score to unlock the
          next stage.
        </p>
      </div>

      {selectedLevelId === null ? (
        /* Level Selection Cards */
        <div className="space-y-4">
          {CURRICULUM.map((level, idx) => {
            const total = level.lessons.length;
            const passedCount = level.lessons.filter(isLessonPassed).length;
            const firstLessonId = level.lessons[0].id;
            const isLevelUnlocked = isLessonUnlocked(firstLessonId);
            const isCompleted = passedCount === total;
            const progressPercent = Math.round((passedCount / total) * 100);

            return (
              <div
                key={level.id}
                onClick={() => {
                  if (isLevelUnlocked) {
                    setSelectedLevelId(level.id);
                  }
                }}
                className={`bg-[#fffaf2] border rounded-2xl p-5 transition-all shadow-xs ${
                  isLevelUnlocked
                    ? 'border-[#dccfbd] hover:border-[#1d4e5f] hover:shadow-md cursor-pointer'
                    : 'border-[#dccfbd]/60 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: level.color }}
                    />
                    <h2
                      className="font-bold text-base tracking-tight"
                      style={{ color: isLevelUnlocked ? level.color : '#74695c' }}
                    >
                      {level.name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-semibold text-[#74695c]">
                    {!isLevelUnlocked ? (
                      <span className="flex items-center gap-1 bg-[#efe9df] px-2 py-0.5 rounded-md">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    ) : (
                      <span>
                        {passedCount}/{total} completed
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-[#efe9df] rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: level.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-[#74695c]">
                  <span>
                    {!isLevelUnlocked
                      ? 'Pass earlier lessons to unlock this level'
                      : isCompleted
                      ? 'Level Completed ✓'
                      : `${total - passedCount} lessons remaining`}
                  </span>
                  {isLevelUnlocked && (
                    <span className="flex items-center gap-1 font-bold text-[#1d4e5f]">
                      Open Level <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Selected Level Lessons List */
        <div>
          <button
            onClick={() => setSelectedLevelId(null)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#1d4e5f] hover:text-[#163f4e] mb-4 px-3 py-1.5 rounded-lg bg-[#efe9df] hover:bg-[#e4dbcd] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Levels</span>
          </button>

          {selectedLevel && (
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: selectedLevel.color }}
                />
                <h2
                  className="text-lg font-extrabold tracking-tight"
                  style={{ color: selectedLevel.color }}
                >
                  {selectedLevel.name}
                </h2>
              </div>
              <p className="text-xs text-[#74695c] mt-0.5">
                Complete each speaking drill with your camera and mic to earn XP.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {selectedLevel?.lessons.map((lesson, index) => {
              const unlocked = isLessonUnlocked(lesson.id);
              const passed = isLessonPassed(lesson);
              const bestScore = profile.doneLessons[lesson.id];

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    if (unlocked) {
                      onSelectLesson(lesson);
                    }
                  }}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-all ${
                    unlocked
                      ? 'bg-[#fffaf2] border-[#dccfbd] hover:border-[#1d4e5f] hover:shadow-md cursor-pointer'
                      : 'bg-[#efe9df]/40 border-[#dccfbd]/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  {/* Status Circle */}
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${
                      passed
                        ? 'bg-emerald-600 text-white'
                        : unlocked
                        ? 'bg-[#1d4e5f] text-white'
                        : 'bg-[#74695c] text-white/70'
                    }`}
                  >
                    {passed ? (
                      <Check className="w-5 h-5 stroke-[2.5]" />
                    ) : unlocked ? (
                      index + 1
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </div>

                  {/* Lesson Information */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm text-[#2b2622] truncate">{lesson.title}</h3>
                      {bestScore !== undefined && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#efe9df] text-[#1d4e5f] shrink-0">
                          Best: {bestScore}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#74695c] line-clamp-1 mt-0.5">{lesson.tip}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#74695c]">
                      <span className="font-semibold text-amber-700">Target: {lesson.min}+ pts</span>
                      {unlocked && (
                        <span className="text-[#1d4e5f] font-semibold flex items-center gap-0.5">
                          Start drill <ChevronRight className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
