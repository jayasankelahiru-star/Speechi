import { UserAccount, UserProfileData, EvaluationHistoryItem } from '../types';

const USERS_KEY = 'su_users';
const SESSION_KEY = 'su_sess2';

const DEFAULT_PROFILE: UserProfileData = {
  xp: 0,
  streak: 0,
  lastActiveDate: '',
  doneLessons: {},
  history: [],
  name: '',
  aiLanguage: 'en',
  speechLanguage: 'en-US',
  photo: '',
  goal: '',
};

export async function hashPassword(password: string, salt: string): Promise<string> {
  const combined = `${salt}:${password}`;
  if (typeof window !== 'undefined' && window.crypto && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combined));
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Simple fallback hash if crypto.subtle is unavailable
  let hash = 5381;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) + hash + combined.charCodeAt(i)) | 0;
  }
  return `f_${hash}`;
}

export function getAllUsers(): Record<string, UserAccount> {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserAccount(account: UserAccount): void {
  const users = getAllUsers();
  users[account.email.toLowerCase()] = account;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function deleteUserAccount(email: string): void {
  const users = getAllUsers();
  delete users[email.toLowerCase()];
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.removeItem(`su_d_${email.toLowerCase()}`);
  if (getActiveUserEmail() === email.toLowerCase()) {
    clearActiveUserEmail();
  }
}

export function getActiveUserEmail(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setActiveUserEmail(email: string | null): void {
  try {
    if (email) {
      localStorage.setItem(SESSION_KEY, email.toLowerCase());
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function clearActiveUserEmail(): void {
  setActiveUserEmail(null);
}

export function loadUserProfile(email: string): UserProfileData {
  const defaultCopy: UserProfileData = {
    ...DEFAULT_PROFILE,
    doneLessons: {},
    history: [],
  };

  try {
    const stored = localStorage.getItem(`su_d_${email.toLowerCase()}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...defaultCopy,
        ...parsed,
        doneLessons: parsed.doneLessons || {},
        history: parsed.history || [],
      };
    }
  } catch {
    // Fallback to default
  }

  // Pre-fill name from accounts record if empty
  const account = getAllUsers()[email.toLowerCase()];
  if (account && account.name) {
    defaultCopy.name = account.name;
  } else {
    defaultCopy.name = email.split('@')[0];
  }

  return defaultCopy;
}

export function saveUserProfile(email: string, profile: UserProfileData): void {
  try {
    localStorage.setItem(`su_d_${email.toLowerCase()}`, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save user profile:', err);
  }
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function updateStreak(profile: UserProfileData): UserProfileData {
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  if (profile.lastActiveDate === todayStr) {
    return profile;
  }

  const newStreak = profile.lastActiveDate === yesterdayStr ? profile.streak + 1 : 1;

  return {
    ...profile,
    streak: newStreak,
    lastActiveDate: todayStr,
  };
}
