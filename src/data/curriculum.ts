import { Level } from '../types';

export const CURRICULUM: Level[] = [
  {
    id: 1,
    name: 'Level 1 · Foundations',
    color: '#1d4e5f', // Deep Teal
    lessons: [
      {
        id: '1a',
        title: 'Introduce yourself',
        tip: 'Breathe, slow down, look at the camera.',
        task: 'Introduce yourself in 30–60 seconds: name, what you do, and one interesting fact.',
        min: 20,
      },
      {
        id: '1b',
        title: 'Cut the filler words',
        tip: 'Replace “um” and “like” with a silent pause.',
        task: 'Describe your favorite place for 45 seconds without filler words.',
        min: 25,
      },
      {
        id: '1c',
        title: 'Pace and volume',
        tip: 'Pause after key points. Emphasize important words.',
        task: 'Explain how to make a cup of tea, with deliberate pauses (about 45 seconds).',
        min: 25,
      },
      {
        id: '1d',
        title: 'Eye contact',
        tip: 'Look at the camera lens, not at the screen.',
        task: 'Talk about your day for 45 seconds, looking at the camera lens as much as you can.',
        min: 30,
      },
      {
        id: '1e',
        title: 'Warm and friendly tone',
        tip: 'A small smile makes your voice sound warmer.',
        task: 'Welcome an audience to an event in about 30 seconds, sounding warm and friendly.',
        min: 30,
      },
      {
        id: '1f',
        title: 'Confident posture',
        tip: 'Sit or stand tall, shoulders relaxed, hands visible.',
        task: 'Introduce a friend or someone you admire in 45 seconds with open posture and relaxed hands.',
        min: 30,
      },
      {
        id: '1g',
        title: 'Speak with energy',
        tip: 'Vary your pitch on key words to avoid a flat voice.',
        task: 'Describe your favorite movie, game or hobby for 45 seconds with real energy in your voice.',
        min: 35,
      },
      {
        id: '1h',
        title: 'One clear message',
        tip: 'Pick one main idea and repeat it once at the end.',
        task: 'Explain one idea you care about in 1 minute, ending with a one-sentence takeaway.',
        min: 35,
      },
    ],
  },
  {
    id: 2,
    name: 'Level 2 · Structure & Delivery',
    color: '#c4572f', // Terracotta
    lessons: [
      {
        id: '2a',
        title: 'Strong opening',
        tip: 'Open with a question, a story or a surprising fact.',
        task: 'Give a 1–2 minute talk on a topic you love. Start with a strong hook.',
        min: 50,
      },
      {
        id: '2b',
        title: 'Tell a story',
        tip: 'Situation → problem → turning point → lesson.',
        task: 'Tell a 2-minute story about a challenge you overcame and what you learned.',
        min: 60,
      },
      {
        id: '2c',
        title: 'Intro, body, conclusion',
        tip: 'Tell them what you will say, say it, then recap.',
        task: 'Give a 2-minute talk with 3 clear points on why people should learn a new skill.',
        min: 70,
      },
      {
        id: '2d',
        title: 'Use examples',
        tip: 'Every point needs an example or a number.',
        task: 'Give a 2-minute talk on why exercise matters, backing each point with an example.',
        min: 65,
      },
      {
        id: '2e',
        title: 'Smooth transitions',
        tip: 'Signal your moves: first, next, finally.',
        task: 'Explain how to prepare for an exam in 2 minutes, using clear transitions between steps.',
        min: 65,
      },
      {
        id: '2f',
        title: 'Strong closing',
        tip: 'End with a summary and a clear call to action.',
        task: 'Give a 2-minute talk on any subject and finish with a memorable closing line.',
        min: 70,
      },
      {
        id: '2g',
        title: 'Explain it simply',
        tip: 'Avoid jargon. Explain as if to a 12-year-old.',
        task: 'Explain something technical you know (an app, a machine, a school subject) in simple words, for 2 minutes.',
        min: 70,
      },
      {
        id: '2h',
        title: 'Gestures and stance',
        tip: 'Use open hand gestures at natural moments. Avoid fidgeting.',
        task: 'Give a 2-minute talk about a place you would recommend, using natural hand gestures and a steady stance.',
        min: 70,
      },
    ],
  },
  {
    id: 3,
    name: 'Level 3 · Mastery',
    color: '#8a6d1d', // Olive Gold
    lessons: [
      {
        id: '3a',
        title: 'Persuade',
        tip: 'Claim, evidence, emotional appeal, call to action.',
        task: 'Persuade your audience to adopt one good habit, with evidence and a call to action (2–3 minutes).',
        min: 80,
      },
      {
        id: '3b',
        title: 'Pitch your idea',
        tip: 'Problem, solution, market, ask.',
        task: 'Pitch a product or business idea to investors in 3 minutes.',
        min: 80,
      },
      {
        id: '3c',
        title: 'Full presentation',
        tip: 'Combine everything: hook, structure, evidence, close.',
        task: 'Deliver a full 4–5 minute presentation on any topic, as if on stage.',
        min: 85,
      },
      {
        id: '3d',
        title: 'Handle tough questions',
        tip: 'Pause, restate the question, answer, then stop.',
        task: 'Imagine a skeptic asks, “Why should I trust your idea?” Answer in about 90 seconds.',
        min: 80,
      },
      {
        id: '3e',
        title: 'Tell me about yourself',
        tip: 'Past, present, future in under 2 minutes.',
        task: 'Answer “Tell me about yourself” as if in a job interview, in about 2 minutes.',
        min: 80,
      },
      {
        id: '3f',
        title: 'Inspire a crowd',
        tip: 'Speak slowly, use pauses, paint a vivid picture.',
        task: 'Give an inspiring 3-minute speech to a large audience about a goal worth chasing.',
        min: 85,
      },
      {
        id: '3g',
        title: 'Present the data',
        tip: 'State the insight first, then the evidence.',
        task: 'Present three numbers or facts about any topic (3 minutes) and explain what they mean.',
        min: 85,
      },
      {
        id: '3h',
        title: 'Master class',
        tip: 'Own the stage: strong voice, eye contact, steady gestures.',
        task: 'Deliver a polished 5-minute talk on a topic of your choice, combining everything you have learned.',
        min: 90,
      },
    ],
  },
];

export const ALL_LESSONS = CURRICULUM.flatMap((l) => l.lessons);

export const FILLER_WORDS = [
  'um',
  'uh',
  'uhh',
  'umm',
  'like',
  'you know',
  'basically',
  'actually',
  'literally',
  'i mean',
  'kind of',
  'sort of',
  'right',
  'so yeah',
];
