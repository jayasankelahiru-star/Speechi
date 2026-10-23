import React, { useState, useEffect } from 'react';
import { Lesson, EvaluationResult, UserProfileData } from './types';
import {
  getActiveUserEmail,
  clearActiveUserEmail,
  loadUserProfile,
  saveUserProfile,
  updateStreak,
  getAllUsers,
} from './utils/storage';
import { ALL_LESSONS } from './data/curriculum';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Drawer } from './components/Drawer';
import { AuthScreen } from './components/AuthScreen';
import { LearnView } from './components/LearnView';
import { PracticeStudio } from './components/PracticeStudio';
import { FeedbackView } from './components/FeedbackView';
import { ProgressView } from './components/ProgressView';
import { ProfileView } from './components/ProfileView';

export default function App() {
  const [activeUserEmail, setActiveUserEmailState] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [currentTab, setCurrentTab] = useState<'learn' | 'practice' | 'feedback' | 'progress' | 'profile'>('learn');

  // Rehearsal & Studio states
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isQuickMode, setIsQuickMode] = useState<boolean>(false);
  const [latestEvaluation, setLatestEvaluation] = useState<EvaluationResult | null>(null);

  // UI Drawer
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    const savedEmail = getActiveUserEmail();
    const allUsers = getAllUsers();
    if (savedEmail && allUsers[savedEmail.toLowerCase()]) {
      setActiveUserEmailState(savedEmail);
      const loaded = loadUserProfile(savedEmail);
      setProfile(loaded);
    }
  }, []);

  // Update profile helper
  const handleUpdateProfile = (updater: (prev: UserProfileData) => UserProfileData) => {
    if (!profile || !activeUserEmail) return;
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = updater(prev);
      saveUserProfile(activeUserEmail, updated);
      return updated;
    });
  };

  // Login handler
  const handleAuthSuccess = (email: string) => {
    setActiveUserEmailState(email);
    const loaded = loadUserProfile(email);
    setProfile(loaded);
    setCurrentTab('learn');
  };

  // Logout handler
  const handleLogout = () => {
    clearActiveUserEmail();
    setActiveUserEmailState(null);
    setProfile(null);
    setLatestEvaluation(null);
    setCurrentLesson(null);
    setIsQuickMode(false);
    setIsDrawerOpen(false);
  };

  // Launch lesson rehearsal
  const handleSelectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setIsQuickMode(false);
    setCurrentTab('practice');
  };

  // Launch quick practice
  const handleQuickPractice = () => {
    setCurrentLesson(null);
    setIsQuickMode(true);
    setCurrentTab('practice');
  };

  // On AI evaluation completion
  const handleEvaluationComplete = (result: EvaluationResult) => {
    setLatestEvaluation(result);

    if (activeUserEmail && profile) {
      handleUpdateProfile((prev) => {
        let updated = { ...prev };

        // If not quick practice, update lesson progress and XP
        if (!result.isQuick && result.lessonId !== 'quick') {
          const currentBest = updated.doneLessons[result.lessonId] || 0;
          updated.doneLessons = {
            ...updated.doneLessons,
            [result.lessonId]: Math.max(currentBest, result.score),
          };
          updated.xp = (updated.xp || 0) + result.xpEarned;
        }

        // Update streak
        updated = updateStreak(updated);

        // Add to history
        const historyItem = {
          id: `h_${Date.now()}`,
          lessonId: result.lessonId,
          lessonTitle: result.lessonTitle,
          score: result.score,
          date: result.date,
          eyeContact: result.eye_contact,
          hasVideo: result.thumbnails.length > 0,
          isQuick: result.isQuick,
        };

        updated.history = [...(updated.history || []), historyItem].slice(-60);

        return updated;
      });
    }

    setCurrentTab('feedback');
  };

  // Try again action
  const handleTryAgain = (lessonId: string) => {
    if (lessonId === 'quick') {
      handleQuickPractice();
    } else {
      const lesson = ALL_LESSONS.find((l) => l.id === lessonId);
      if (lesson) {
        handleSelectLesson(lesson);
      } else {
        handleQuickPractice();
      }
    }
  };

  // Next lesson action
  const handleNextLesson = (nextLesson: Lesson) => {
    handleSelectLesson(nextLesson);
  };

  // Reset progress
  const handleResetProgress = () => {
    if (!profile || !activeUserEmail) return;
    const resetData: UserProfileData = {
      ...profile,
      xp: 0,
      streak: 0,
      lastActiveDate: '',
      doneLessons: {},
      history: [],
    };
    setProfile(resetData);
    saveUserProfile(activeUserEmail, resetData);
    setLatestEvaluation(null);
    setCurrentTab('learn');
  };

  // If user not logged in, show AuthScreen
  if (!activeUserEmail || !profile) {
    return <AuthScreen onSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] text-[#25221e] flex flex-col pb-20 md:pb-6">
      {/* Top Header */}
      <Header
        profile={profile}
        onOpenMenu={() => setIsDrawerOpen(true)}
        onNavigate={setCurrentTab}
        currentTab={currentTab}
      />

      {/* Mobile Slide-out Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        profile={profile}
        userEmail={activeUserEmail}
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onLogout={handleLogout}
      />

      {/* Main Tab Content */}
      <main className="flex-1 w-full">
        {currentTab === 'learn' && (
          <LearnView
            profile={profile}
            onSelectLesson={handleSelectLesson}
            onQuickPractice={handleQuickPractice}
          />
        )}

        {currentTab === 'practice' && (
          <PracticeStudio
            currentLesson={currentLesson}
            isQuickMode={isQuickMode}
            profile={profile}
            onEvaluationComplete={handleEvaluationComplete}
            onExitLesson={() => {
              setCurrentLesson(null);
              setIsQuickMode(false);
              setCurrentTab('learn');
            }}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {currentTab === 'feedback' && (
          <FeedbackView
            result={latestEvaluation}
            onTryAgain={handleTryAgain}
            onNextLesson={handleNextLesson}
            onStartQuickPractice={handleQuickPractice}
          />
        )}

        {currentTab === 'progress' && <ProgressView profile={profile} />}

        {currentTab === 'profile' && (
          <ProfileView
            profile={profile}
            userEmail={activeUserEmail}
            onUpdateProfile={handleUpdateProfile}
            onResetProgress={handleResetProgress}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation & Floating Action Button */}
      <BottomNav
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onQuickPractice={handleQuickPractice}
      />
    </div>
  );
}
