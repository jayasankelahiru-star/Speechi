import React from 'react';
import { BookOpen, Sparkles, LineChart, User, Mic } from 'lucide-react';

interface BottomNavProps {
  currentTab: string;
  onNavigate: (tab: 'learn' | 'practice' | 'feedback' | 'progress' | 'profile') => void;
  onQuickPractice: () => void;
  isRecording?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onNavigate,
  onQuickPractice,
  isRecording = false,
}) => {
  return (
    <>
      {/* Floating Action Button for Quick Practice (hidden when already in practice) */}
      {currentTab !== 'practice' && (
        <button
          onClick={onQuickPractice}
          className="fixed right-5 bottom-20 md:bottom-8 z-30 flex items-center gap-2 bg-[#c4572f] text-white px-5 py-3.5 rounded-full font-bold shadow-xl hover:bg-[#b04b25] active:scale-95 transition-all cursor-pointer group hover:shadow-2xl hover:shadow-[#c4572f]/40"
          aria-label="Quick Practice with AI"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-wide">AI Practice</span>
        </button>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#fffaf2] border-t border-[#dccfbd] flex items-center justify-around px-2 py-1.5 shadow-lg">
        <button
          onClick={() => onNavigate('learn')}
          className={`flex-1 flex flex-col items-center py-1.5 transition-colors cursor-pointer ${
            currentTab === 'learn'
              ? 'text-[#1d4e5f] font-bold'
              : 'text-[#74695c] hover:text-[#1d4e5f]'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Learn</span>
        </button>

        <button
          onClick={() => onNavigate('practice')}
          className={`flex-1 flex flex-col items-center py-1.5 transition-colors cursor-pointer ${
            currentTab === 'practice'
              ? 'text-[#1d4e5f] font-bold'
              : 'text-[#74695c] hover:text-[#1d4e5f]'
          }`}
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 mb-0.5" />
            {isRecording && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <span className="text-[11px]">Studio</span>
        </button>

        <button
          onClick={() => onNavigate('feedback')}
          className={`flex-1 flex flex-col items-center py-1.5 transition-colors cursor-pointer ${
            currentTab === 'feedback'
              ? 'text-[#1d4e5f] font-bold'
              : 'text-[#74695c] hover:text-[#1d4e5f]'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-amber-600" />
          <span className="text-[11px]">Feedback</span>
        </button>

        <button
          onClick={() => onNavigate('progress')}
          className={`flex-1 flex flex-col items-center py-1.5 transition-colors cursor-pointer ${
            currentTab === 'progress'
              ? 'text-[#1d4e5f] font-bold'
              : 'text-[#74695c] hover:text-[#1d4e5f]'
          }`}
        >
          <LineChart className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Progress</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className={`flex-1 flex flex-col items-center py-1.5 transition-colors cursor-pointer ${
            currentTab === 'profile'
              ? 'text-[#1d4e5f] font-bold'
              : 'text-[#74695c] hover:text-[#1d4e5f]'
          }`}
        >
          <User className="w-5 h-5 mb-0.5" />
          <span className="text-[11px]">Profile</span>
        </button>
      </nav>
    </>
  );
};
