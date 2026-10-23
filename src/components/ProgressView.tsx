import React from 'react';
import { UserProfileData } from '../types';
import { CURRICULUM, ALL_LESSONS } from '../data/curriculum';
import { calculateLevel } from '../utils/storage';
import { Flame, Award, CheckCircle2, TrendingUp, Calendar, Video, Clock } from 'lucide-react';

interface ProgressViewProps {
  profile: UserProfileData;
  onSelectHistoryItem?: (lessonId: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ profile }) => {
  const level = calculateLevel(profile.xp);
  const totalLessons = ALL_LESSONS.length;
  const passedCount = Object.keys(profile.doneLessons).filter((k) => {
    const lesson = ALL_LESSONS.find((l) => l.id === k);
    return lesson ? profile.doneLessons[k] >= lesson.min : false;
  }).length;

  const level1Completed = CURRICULUM[0].lessons.every(
    (l) => (profile.doneLessons[l.id] || 0) >= l.min
  );
  const level2Completed = CURRICULUM[1].lessons.every(
    (l) => (profile.doneLessons[l.id] || 0) >= l.min
  );

  const history = profile.history || [];
  const recentHistory = history.slice(-12);

  // SVG coordinates for trend chart
  const chartWidth = 320;
  const chartHeight = 110;
  const chartPadding = 16;
  const usableWidth = chartWidth - chartPadding * 2;
  const usableHeight = chartHeight - chartPadding * 2;

  const points = recentHistory.map((item, idx) => {
    const x =
      recentHistory.length > 1
        ? chartPadding + (idx / (recentHistory.length - 1)) * usableWidth
        : chartWidth / 2;
    const y = chartPadding + (1 - Math.max(0, Math.min(100, item.score)) / 100) * usableHeight;
    return { x, y, score: item.score, title: item.lessonTitle };
  });

  const svgPolyline = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Badges list
  const badges = [
    {
      title: 'First Speech',
      description: 'Delivered your first rehearsal',
      unlocked: history.length >= 1,
    },
    {
      title: '3-Day Streak',
      description: 'Practiced 3 consecutive days',
      unlocked: profile.streak >= 3,
    },
    {
      title: 'Score 90+',
      description: 'Scored 90 or higher in a drill',
      unlocked: history.some((h) => h.score >= 90),
    },
    {
      title: 'Video Rehearsal',
      description: 'Practiced with live camera tracking',
      unlocked: history.some((h) => h.hasVideo),
    },
    {
      title: 'Level 1 Done',
      description: 'Mastered all Foundations lessons',
      unlocked: level1Completed,
    },
    {
      title: 'Level 2 Done',
      description: 'Mastered Structure & Delivery',
      unlocked: level2Completed,
    },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2b2622] tracking-tight">Your Progress</h1>
        <p className="text-xs text-[#74695c]">Track speaking milestones, XP, and score growth over time</p>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-4 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <span className="block text-2xl font-black text-[#2b2622]">{profile.streak}</span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">day streak</span>
        </div>

        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-4 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[#1d4e5f] mb-1">
            <Award className="w-5 h-5" />
          </div>
          <span className="block text-2xl font-black text-[#2b2622]">{profile.xp}</span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">XP · Lv {level}</span>
        </div>

        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-4 text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-emerald-600 mb-1">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="block text-2xl font-black text-[#2b2622]">
            {passedCount}/{totalLessons}
          </span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">tasks passed</span>
        </div>
      </div>

      {/* Score Trend Graph */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-sm text-[#2b2622] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#1d4e5f]" />
            <span>Score Trend (Recent Speeches)</span>
          </h3>
          <span className="text-[11px] text-[#74695c] font-medium">0 - 100 Scale</span>
        </div>

        {points.length > 0 ? (
          <div className="w-full overflow-hidden pt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-32 overflow-visible"
            >
              {/* Horizontal gridlines */}
              <line
                x1={chartPadding}
                y1={chartPadding}
                x2={chartWidth - chartPadding}
                y2={chartPadding}
                stroke="#efe9df"
                strokeWidth="1"
              />
              <line
                x1={chartPadding}
                y1={chartHeight / 2}
                x2={chartWidth - chartPadding}
                y2={chartHeight / 2}
                stroke="#efe9df"
                strokeWidth="1"
              />
              <line
                x1={chartPadding}
                y1={chartHeight - chartPadding}
                x2={chartWidth - chartPadding}
                y2={chartHeight - chartPadding}
                stroke="#efe9df"
                strokeWidth="1"
              />

              {/* Connecting curve */}
              {points.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#1d4e5f"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={svgPolyline}
                />
              )}

              {/* Points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="#1d4e5f"
                    stroke="#fffaf2"
                    strokeWidth="2"
                  />
                  <text
                    x={p.x}
                    y={p.y - 8}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="bold"
                    fill="#74695c"
                  >
                    {p.score}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[#74695c]">
            Your score progression curve will emerge after your first presentation rehearsal.
          </div>
        )}
      </div>

      {/* Badges Showcase */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#2b2622] mb-3">Earned Achievements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {badges.map((b, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl border transition-all ${
                b.unlocked
                  ? 'bg-amber-50/70 border-amber-200/80 text-amber-950 shadow-2xs'
                  : 'bg-[#efe9df]/40 border-[#dccfbd]/40 opacity-40'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Award
                  className={`w-4 h-4 ${b.unlocked ? 'text-amber-600 fill-amber-500' : 'text-[#74695c]'}`}
                />
                <span className="font-bold text-xs">{b.title}</span>
              </div>
              <p className="text-[10px] text-[#74695c] leading-tight">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Rehearsal History Log */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs">
        <h3 className="font-bold text-sm text-[#2b2622] mb-3">Recent Rehearsal History</h3>
        {history.length > 0 ? (
          <div className="divide-y divide-[#dccfbd]/50">
            {history
              .slice()
              .reverse()
              .slice(0, 10)
              .map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {item.hasVideo && (
                      <span title="Video recorded">
                        <Video className="w-3.5 h-3.5 text-[#1d4e5f]" />
                      </span>
                    )}
                    <div>
                      <span className="font-semibold text-[#2b2622]">{item.lessonTitle}</span>
                      <span className="block text-[10px] text-[#74695c]">
                        {new Date(item.date).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`font-black text-sm px-2.5 py-0.5 rounded-lg ${
                      item.score >= 75
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.score >= 50
                        ? 'bg-teal-50 text-teal-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.score}
                  </span>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-xs text-[#74695c] py-2">No past rehearsals logged yet.</p>
        )}
      </div>
    </div>
  );
};
