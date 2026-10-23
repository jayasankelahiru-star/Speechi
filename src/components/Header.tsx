import React from 'react';
import { Menu, Flame, Award, Sparkles, User as UserIcon } from 'lucide-react';
import { UserProfileData } from '../types';
import { calculateLevel } from '../utils/storage';

interface HeaderProps {
  profile: UserProfileData | null;
  onOpenMenu: () => void;
  onNavigate: (tab: 'learn' | 'practice' | 'feedback' | 'progress' | 'profile') => void;
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  onOpenMenu,
  onNavigate,
  currentTab,
}) => {
  const level = profile ? calculateLevel(profile.xp) : 1;

  return (
    <header className="sticky top-0 z-30 bg-[#1d4e5f] text-white shadow-md">
      <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between">
        {/* Left: Menu button (mobile) + Brand logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMenu}
            className="md:hidden p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div 
            onClick={() => onNavigate('learn')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#c4572f] flex items-center justify-center font-bold text-white shadow-sm group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">SpeakUp</span>
              <span className="hidden sm:inline-block text-xs text-white/70 ml-2 font-medium">
                Presentation Coach
              </span>
            </div>
          </div>
        </div>

        {/* Center / Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onNavigate('learn')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              currentTab === 'learn'
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            Curriculum
          </button>
          <button
            onClick={() => onNavigate('practice')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              currentTab === 'practice'
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            Studio
          </button>
          <button
            onClick={() => onNavigate('feedback')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              currentTab === 'feedback'
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            Feedback
          </button>
          <button
            onClick={() => onNavigate('progress')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
              currentTab === 'progress'
                ? 'bg-white/20 text-white'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            Progress
          </button>
        </nav>

        {/* Right: Gamification Badges & Profile Trigger */}
        {profile && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Streak */}
            <div 
              title={`${profile.streak} day practice streak`}
              className="flex items-center gap-1 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-orange-200 border border-white/10"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              <span>{profile.streak}</span>
            </div>

            {/* Level / XP */}
            <div 
              title={`Level ${level} · ${profile.xp} total XP`}
              className="hidden sm:flex items-center gap-1 bg-white/10 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-bold text-teal-100 border border-white/10"
            >
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Lv {level}</span>
              <span className="text-white/60 font-normal">({profile.xp} XP)</span>
            </div>

            {/* User Avatar */}
            <button
              onClick={() => onNavigate('profile')}
              className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-white/40 transition-all cursor-pointer"
              title="Go to profile"
            >
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#c4572f] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                  {profile.name ? profile.name[0] : <UserIcon className="w-4 h-4" />}
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
