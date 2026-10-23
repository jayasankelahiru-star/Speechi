import React, { useRef } from 'react';
import { UserProfileData } from '../types';
import { getAllUsers, calculateLevel, deleteUserAccount } from '../utils/storage';
import { ALL_LESSONS } from '../data/curriculum';
import {
  User,
  Camera,
  LogOut,
  Trash2,
  RotateCcw,
  Globe,
  Target,
  Flame,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfileData;
  userEmail: string;
  onUpdateProfile: (updater: (prev: UserProfileData) => UserProfileData) => void;
  onResetProgress: () => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  userEmail,
  onUpdateProfile,
  onResetProgress,
  onLogout,
}) => {
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const allUsers = getAllUsers();
  const accountInfo = allUsers[userEmail.toLowerCase()];

  const memberSince = accountInfo?.since
    ? new Date(accountInfo.since).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Recently';

  const level = calculateLevel(profile.xp);
  const totalTasks = ALL_LESSONS.length;
  const passedCount = Object.keys(profile.doneLessons).filter((k) => {
    const lesson = ALL_LESSONS.find((l) => l.id === k);
    return lesson ? profile.doneLessons[k] >= lesson.min : false;
  }).length;

  const bestScore =
    profile.history.length > 0 ? Math.max(...profile.history.map((h) => h.score)) : '–';

  // Handle avatar upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const minDim = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(
          img,
          (img.width - minDim) / 2,
          (img.height - minDim) / 2,
          minDim,
          minDim,
          0,
          0,
          160,
          160
        );
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        onUpdateProfile((prev) => ({ ...prev, photo: dataUrl }));
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        'Are you sure you want to delete this account and all your speech records on this device?'
      )
    ) {
      deleteUserAccount(userEmail);
      onLogout();
    }
  };

  const handleReset = () => {
    if (
      window.confirm('Reset all scores, streaks, and XP back to zero? Your account will remain.')
    ) {
      onResetProgress();
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-[#2b2622] tracking-tight">Profile & Goals</h1>
        <p className="text-xs text-[#74695c]">Customize your presentation coaching and account</p>
      </div>

      {/* User Hero Avatar Card */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-6 text-center shadow-xs">
        <div className="relative inline-block mb-3">
          {profile.photo ? (
            <img
              src={profile.photo}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#1d4e5f] text-white flex items-center justify-center font-bold text-3xl uppercase shadow-md mx-auto">
              {profile.name ? profile.name[0] : <User className="w-10 h-10" />}
            </div>
          )}

          <button
            onClick={() => photoInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-2 bg-[#c4572f] text-white rounded-full shadow-md hover:bg-[#a33f1b] transition-colors cursor-pointer"
            title="Change photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        <h2 className="text-lg font-bold text-[#2b2622] leading-tight">
          {profile.name || 'Speaker'}
        </h2>
        <p className="text-xs text-[#74695c] mt-0.5">{userEmail}</p>
        <span className="inline-block text-[11px] text-[#74695c]/80 mt-1">
          Speaker since {memberSince}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-3 text-center">
          <span className="block text-xl font-black text-[#2b2622]">{level}</span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">level</span>
        </div>
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-3 text-center">
          <span className="block text-xl font-black text-[#2b2622]">{profile.xp}</span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">total XP</span>
        </div>
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-3 text-center">
          <span className="block text-xl font-black text-[#2b2622]">{profile.streak}</span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">day streak</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-3 text-center">
          <span className="block text-xl font-black text-[#2b2622]">
            {passedCount}/{totalTasks}
          </span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">tasks passed</span>
        </div>
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-3 text-center">
          <span className="block text-xl font-black text-[#2b2622]">{profile.history.length}</span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">drills logged</span>
        </div>
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-3 text-center">
          <span className="block text-xl font-black text-[#2b2622]">{bestScore}</span>
          <span className="text-[10px] font-bold uppercase text-[#74695c]">personal best</span>
        </div>
      </div>

      {/* Preferences Form */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-5 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-[#2b2622]">Speaker Preferences</h3>

        <div>
          <label className="block text-xs font-semibold text-[#74695c] uppercase tracking-wider mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onUpdateProfile((prev) => ({ ...prev, name: e.target.value }))}
            className="w-full p-2.5 bg-[#efe9df]/60 border border-[#dccfbd] rounded-xl text-xs text-[#2b2622] focus:ring-2 focus:ring-[#1d4e5f] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#74695c] uppercase tracking-wider mb-1">
            Primary Speaking Goal
          </label>
          <select
            value={profile.goal}
            onChange={(e) => onUpdateProfile((prev) => ({ ...prev, goal: e.target.value }))}
            className="w-full p-2.5 bg-[#efe9df]/60 border border-[#dccfbd] rounded-xl text-xs text-[#2b2622] focus:ring-2 focus:ring-[#1d4e5f] focus:outline-none cursor-pointer"
          >
            <option value="">General Presentation Skills</option>
            <option value="Overcoming public speaking anxiety & building confidence">
              Building Confidence & Reducing Stage Fright
            </option>
            <option value="Cutting out filler words like um and like">
              Cutting Out Filler Words (um, like, you know)
            </option>
            <option value="Pitching startup ideas and products to investors">
              Startup & Investor Pitching
            </option>
            <option value="Mastering storytelling, voice rhythm, and emotional hooks">
              Storytelling & Narrative Hooks
            </option>
            <option value="Ace job interview presentations and leadership talks">
              Job Interviews & Executive Presence
            </option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-[#74695c] uppercase tracking-wider mb-1">
              Speech Recognition Language
            </label>
            <select
              value={profile.speechLanguage}
              onChange={(e) =>
                onUpdateProfile((prev) => ({ ...prev, speechLanguage: e.target.value as any }))
              }
              className="w-full p-2.5 bg-[#efe9df]/60 border border-[#dccfbd] rounded-xl text-xs text-[#2b2622] focus:ring-2 focus:ring-[#1d4e5f] focus:outline-none cursor-pointer"
            >
              <option value="en-US">English (US)</option>
              <option value="si-LK">සිංහල (Sinhala)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#74695c] uppercase tracking-wider mb-1">
              AI Feedback Language
            </label>
            <select
              value={profile.aiLanguage}
              onChange={(e) =>
                onUpdateProfile((prev) => ({ ...prev, aiLanguage: e.target.value as any }))
              }
              className="w-full p-2.5 bg-[#efe9df]/60 border border-[#dccfbd] rounded-xl text-xs text-[#2b2622] focus:ring-2 focus:ring-[#1d4e5f] focus:outline-none cursor-pointer"
            >
              <option value="en">English Feedback</option>
              <option value="si">සිංහල (Sinhala Feedback)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Pro Tips Box */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-4.5 shadow-xs">
        <h4 className="font-bold text-xs text-[#2b2622] mb-1">Pro Rehearsal Setup</h4>
        <p className="text-xs text-[#74695c] leading-relaxed">
          Position your camera at eye level, face natural window lighting, keep your hands visible for
          natural gestures, and direct your gaze at the camera lens rather than your screen.
        </p>
      </div>

      {/* Account Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-3 bg-[#efe9df] hover:bg-[#e4dbcd] text-[#2b2622] rounded-2xl text-xs font-bold transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#74695c]" />
          <span>Log Out</span>
        </button>

        <button
          onClick={handleReset}
          className="w-full flex items-center justify-center gap-2 p-3 border border-[#dccfbd] hover:bg-[#efe9df] text-[#74695c] rounded-2xl text-xs font-bold transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset Scores & Streaks</span>
        </button>

        <button
          onClick={handleDeleteAccount}
          className="w-full flex items-center justify-center gap-2 p-3 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Account on this Device</span>
        </button>
      </div>
    </div>
  );
};
