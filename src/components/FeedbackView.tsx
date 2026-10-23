import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Volume2,
  Eye,
  Award,
  Zap,
  Copy,
  Check,
  ChevronRight,
  Flame,
  ThumbsUp,
  Target,
} from 'lucide-react';
import { EvaluationResult, Lesson } from '../types';
import { ALL_LESSONS } from '../data/curriculum';

interface FeedbackViewProps {
  result: EvaluationResult | null;
  onTryAgain: (lessonId: string) => void;
  onNextLesson: (lesson: Lesson) => void;
  onStartQuickPractice: () => void;
}

export const FeedbackView: React.FC<FeedbackViewProps> = ({
  result,
  onTryAgain,
  onNextLesson,
  onStartQuickPractice,
}) => {
  const [copiedOpening, setCopiedOpening] = useState(false);

  if (!result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#efe9df] text-[#74695c] flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#2b2622] mb-2">No Evaluations Yet</h2>
        <p className="text-xs text-[#74695c] max-w-sm mx-auto mb-6">
          Complete a guided curriculum lesson or quick rehearsal in the Studio to receive comprehensive
          AI coaching and metrics here.
        </p>
        <button
          onClick={onStartQuickPractice}
          className="bg-[#1d4e5f] hover:bg-[#163f4e] text-white font-bold py-3 px-6 rounded-xl text-xs cursor-pointer shadow-md transition-all"
        >
          Start Practice Drill
        </button>
      </div>
    );
  }

  const {
    score,
    content,
    structure,
    voice,
    pace,
    eye_contact,
    body_language,
    expression,
    summary,
    tone_notes,
    video_notes,
    strengths,
    improvements,
    suggestions,
    drill,
    better_opening,
    wpm,
    words,
    fillers,
    audioMetrics,
    thumbnails,
    lessonId,
    lessonTitle,
    isQuick,
    pass,
    minScore,
    xpEarned,
    previousScore,
    transcriptText,
  } = result;

  const currentIndex = ALL_LESSONS.findIndex((l) => l.id === lessonId);
  const nextLesson = currentIndex !== -1 && currentIndex < ALL_LESSONS.length - 1 ? ALL_LESSONS[currentIndex + 1] : null;

  // Pace label
  const getPaceDescription = (rate: number | null) => {
    if (!rate) return 'Moderate pace';
    if (rate < 110) return 'A bit slow (target 120-160 WPM)';
    if (rate > 165) return 'A bit fast (slow down & pause)';
    return 'Optimal conversational pace (120-160 WPM)';
  };

  // Pitch label
  const getPitchDescription = () => {
    if (!audioMetrics || audioMetrics.pitchSd == null) return 'Neutral';
    if (audioMetrics.pitchSd < 1.6) return 'Monotone (try varying pitch)';
    if (audioMetrics.pitchSd < 5.2) return 'Natural & engaging';
    return 'Very animated';
  };

  const copyOpeningText = () => {
    if (better_opening) {
      navigator.clipboard.writeText(better_opening);
      setCopiedOpening(true);
      setTimeout(() => setCopiedOpening(false), 2000);
    }
  };

  // Render highlighted transcript with filler words
  const renderHighlightedTranscript = (text: string, breakdown: Record<string, number>) => {
    if (!text) return null;
    const fillerKeys = Object.keys(breakdown);
    if (!fillerKeys.length) return <p className="text-xs text-[#2b2622] leading-relaxed">{text}</p>;

    const regex = new RegExp(`\\b(${fillerKeys.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return (
      <p className="text-xs text-[#2b2622] leading-relaxed">
        {parts.map((part, i) => {
          const isFiller = fillerKeys.some((f) => f.toLowerCase() === part.toLowerCase());
          if (isFiller) {
            return (
              <span
                key={i}
                className="bg-amber-200/80 text-amber-900 px-1 py-0.5 rounded font-semibold mx-0.5"
                title="Filler word"
              >
                {part}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    );
  };

  const renderMetricBar = (label: string, value: number | null) => {
    if (value === null) return null;
    const clamped = Math.max(0, Math.min(100, Math.round(value)));
    const colorClass =
      clamped >= 75 ? 'bg-emerald-600' : clamped >= 50 ? 'bg-[#1d4e5f]' : 'bg-amber-600';

    return (
      <div className="mb-2.5">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-semibold text-[#2b2622]">{label}</span>
          <span className="font-bold text-[#74695c]">{clamped}/100</span>
        </div>
        <div className="w-full h-2 bg-[#efe9df] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#74695c]">
            {isQuick ? 'Quick Practice' : 'Lesson Evaluation'}
          </span>
          <h1 className="text-2xl font-extrabold text-[#2b2622] tracking-tight">{lessonTitle}</h1>
        </div>
      </div>

      {/* Hero Score Card */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-6 text-center shadow-md">
        <div className="inline-block relative">
          <div
            className={`text-6xl font-black tracking-tight ${
              pass ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {score}
            <span className="text-xl text-[#74695c] font-normal">/100</span>
          </div>
        </div>

        {/* Status Pill */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {isQuick ? (
            <span className="text-xs font-bold px-3 py-1 bg-stone-100 text-stone-700 rounded-full">
              Quick Practice Rehearsal
            </span>
          ) : pass ? (
            <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Target Achieved (+{xpEarned} XP)
            </span>
          ) : (
            <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Target was {minScore}+ points
            </span>
          )}

          {previousScore !== null && previousScore !== undefined && (
            <span className="text-xs text-[#74695c] bg-[#efe9df] px-2.5 py-1 rounded-full font-medium">
              Previous: {previousScore} ({score >= previousScore ? `+${score - previousScore}` : score - previousScore})
            </span>
          )}
        </div>

        {/* Summary */}
        <p className="text-xs sm:text-sm text-[#2b2622] mt-4 leading-relaxed max-w-md mx-auto">
          {summary}
        </p>
      </div>

      {/* Detailed Skill Bars */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#2b2622] mb-3 flex items-center gap-1.5">
          <Target className="w-4 h-4 text-[#1d4e5f]" />
          <span>Core Skill Metrics</span>
        </h3>
        {renderMetricBar('Content Clarity & Relevance', content)}
        {renderMetricBar('Speech Structure & Flow', structure)}
        {renderMetricBar('Vocal Dynamics & Clarity', voice)}
        {renderMetricBar('Pacing & Cadence', pace)}
        {renderMetricBar('Eye Contact (Camera Lens)', eye_contact)}
        {renderMetricBar('Posture & Gestures', body_language)}
        {renderMetricBar('Facial Engagement & Warmth', expression)}
      </div>

      {/* Delivery & Telemetry Card */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#2b2622] mb-3 flex items-center gap-1.5">
          <Volume2 className="w-4 h-4 text-[#1d4e5f]" />
          <span>Voice & Delivery Telemetry</span>
        </h3>

        {/* Key figures grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="bg-[#efe9df]/70 rounded-xl p-3 text-center">
            <span className="block text-lg font-black text-[#2b2622]">{wpm ?? '–'}</span>
            <span className="text-[10px] uppercase font-bold text-[#74695c]">words/min</span>
          </div>
          <div className="bg-[#efe9df]/70 rounded-xl p-3 text-center">
            <span className="block text-lg font-black text-[#2b2622]">{fillers.total}</span>
            <span className="text-[10px] uppercase font-bold text-[#74695c]">filler words</span>
          </div>
          <div className="bg-[#efe9df]/70 rounded-xl p-3 text-center">
            <span className="block text-lg font-black text-[#2b2622]">
              {audioMetrics ? audioMetrics.long : '–'}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#74695c]">long pauses</span>
          </div>
          <div className="bg-[#efe9df]/70 rounded-xl p-3 text-center">
            <span className="block text-xs font-black text-[#2b2622] truncate pt-1">
              {getPitchDescription()}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#74695c]">pitch style</span>
          </div>
        </div>

        {/* Sub-notes */}
        <div className="space-y-1.5 text-xs text-[#74695c]">
          <p>• {getPaceDescription(wpm)}</p>
          {audioMetrics && (
            <p>
              • Deliberate silence {audioMetrics.silentPct}% of time · volume variability{' '}
              {audioMetrics.volSd} dB
            </p>
          )}
          {tone_notes && <p className="text-[#2b2622] mt-2 italic bg-[#efe9df]/40 p-2.5 rounded-xl">"{tone_notes}"</p>}
        </div>
      </div>

      {/* Video & Presence Thumbnails (if any captured) */}
      {thumbnails && thumbnails.length > 0 && (
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs">
          <h3 className="font-bold text-sm text-[#2b2622] mb-2 flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-[#1d4e5f]" />
            <span>Visual Presence & Eye Contact</span>
          </h3>

          <div className="flex gap-2 overflow-x-auto py-2 mb-2 scrollbar-thin">
            {thumbnails.map((thumb, index) => (
              <img
                key={index}
                src={thumb}
                alt={`Rehearsal frame ${index + 1}`}
                className="h-20 w-28 object-cover rounded-xl border border-[#dccfbd] shrink-0 shadow-xs"
              />
            ))}
          </div>

          {video_notes && (
            <p className="text-xs text-[#2b2622] bg-[#efe9df]/40 p-2.5 rounded-xl italic">
              "{video_notes}"
            </p>
          )}
        </div>
      )}

      {/* Strengths & Improvements */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-4.5 shadow-xs">
          <h3 className="font-bold text-sm text-emerald-800 mb-2 flex items-center gap-1.5">
            <ThumbsUp className="w-4 h-4 text-emerald-600" />
            <span>Strengths</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-[#2b2622]">
            {strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-4.5 shadow-xs">
          <h3 className="font-bold text-sm text-amber-800 mb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-600" />
            <span>Areas to Refine</span>
          </h3>
          <ul className="space-y-1.5 text-xs text-[#2b2622]">
            {improvements.map((imp, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-600 font-bold">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Targeted Coaching Drill & Rewritten Opening */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs space-y-3">
        <div>
          <h3 className="font-bold text-sm text-[#1d4e5f] mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#c4572f]" />
            <span>Targeted 60-Second Drill</span>
          </h3>
          <p className="text-xs text-[#2b2622] bg-[#efe9df]/60 p-3 rounded-xl font-medium leading-relaxed">
            {drill}
          </p>
        </div>

        {better_opening && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-[#74695c]">Power Opening Suggestion</span>
              <button
                onClick={copyOpeningText}
                className="text-[11px] font-semibold text-[#1d4e5f] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedOpening ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-xs italic text-[#2b2622] bg-teal-50/70 border border-teal-200/60 p-3 rounded-xl">
              "{better_opening}"
            </p>
          </div>
        )}
      </div>

      {/* Transcript with highlighted filler words */}
      {transcriptText && (
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-[#2b2622]">Rehearsal Transcript</h3>
            <span className="text-[11px] text-[#74695c]">{words} words spoken</span>
          </div>
          {renderHighlightedTranscript(transcriptText, fillers.breakdown)}
        </div>
      )}

      {/* Next Steps CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          onClick={() => onTryAgain(lessonId)}
          className="flex-1 bg-[#efe9df] hover:bg-[#e4dbcd] text-[#2b2622] font-bold py-3.5 px-5 rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
        >
          <RotateCcw className="w-4 h-4 text-[#74695c]" />
          <span>{isQuick ? 'Practice Again' : 'Try Lesson Again'}</span>
        </button>

        {pass && nextLesson && !isQuick && (
          <button
            onClick={() => onNextLesson(nextLesson)}
            className="flex-1 bg-[#1d4e5f] hover:bg-[#163f4e] text-white font-bold py-3.5 px-5 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            <span>Next Lesson: {nextLesson.title}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
