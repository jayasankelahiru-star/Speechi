import React from 'react';
import {
  BookOpen,
  Mic,
  Sparkles,
  LineChart,
  User,
  LogOut,
  X,
  Flame,
  Award,
} from 'lucide-react';
import { UserProfileData } from '../types';
import { calculateLevel } from '../utils/storage';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfileData | null;
  userEmail: string | null;
  currentTab: string;
  onNavigate: (tab: 'learn' | 'practice' | 'feedback' | 'progress' | 'profile') => void;
  onLogout: () => void;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  profile,
  userEmail,
  currentTab,
  onNavigate,
  onLogout,
}) => {
  if (!isOpen) return null;

  const level = profile ? calculateLevel(profile.xp) : 1;
  const displayName = profile?.name || userEmail?.split('@')[0] || 'Speaker';

  const menuItems = [
    { id: 'learn', label: 'Curriculum & Lessons', icon: BookOpen },
    { id: 'practice', label: 'Practice Studio', icon: Mic },
    { id: 'feedback', label: 'Latest Feedback', icon: Sparkles },
    { id: 'progress', label: 'Progress & Badges', icon: LineChart },
    { id: 'profile', label: 'Profile & Settings', icon: User },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Background Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer content */}
      <aside className="relative w-4/5 max-w-xs bg-[#fffaf2] h-full shadow-2xl flex flex-col z-10 border-r border-[#dccfbd] animate-in slide-in-from-left duration-200">
        {/* User Card Header */}
        <div className="bg-[#1d4e5f] text-white p-5 pt-8">
          <div className="flex items-start justify-between mb-4">
            {profile?.photo ? (
              <img
                src={profile.photo}
                alt={displayName}
                className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-2xl uppercase border-2 border-white/20">
                {displayName[0]}
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-white/80 hover:bg-white/10 active:bg-white/20"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="font-bold text-lg leading-tight truncate">{displayName}</h3>
          <p className="text-xs text-white/70 truncate mb-3">{userEmail}</p>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              Lv {level} · {profile?.xp || 0} XP
            </span>
            <span className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full text-orange-200">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
              {profile?.streak || 0} day streak
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-3 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-5 py-3.5 text-left font-semibold text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#1d4e5f]/10 text-[#1d4e5f] border-r-4 border-[#1d4e5f]'
                    : 'text-[#2b2622] hover:bg-[#efe9df]/60'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#1d4e5f]' : 'text-[#74695c]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Logout */}
        <div className="p-4 border-t border-[#dccfbd]">
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-700 hover:bg-rose-50 font-semibold text-sm transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
