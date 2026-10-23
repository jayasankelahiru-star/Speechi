import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  Square,
  Upload,
  AlertCircle,
  Video,
  VideoOff,
  RotateCcw,
  Sparkles,
  Volume2,
  Activity,
  Globe,
  ArrowLeft,
  Eye,
  FileVideo,
} from 'lucide-react';
import { Lesson, EvaluationResult, UserProfileData } from '../types';
import {
  rmsOf,
  pitchDetect,
  summarizeAudio,
  extractFillerWords,
  captureVideoFrame,
} from '../utils/audioAnalysis';

interface PracticeStudioProps {
  currentLesson: Lesson | null;
  isQuickMode: boolean;
  profile: UserProfileData;
  onEvaluationComplete: (result: EvaluationResult) => void;
  onExitLesson: () => void;
  onUpdateProfile: (updater: (prev: UserProfileData) => UserProfileData) => void;
}

export const PracticeStudio: React.FC<PracticeStudioProps> = ({
  currentLesson,
  isQuickMode,
  profile,
  onEvaluationComplete,
  onExitLesson,
  onUpdateProfile,
}) => {
  const [hasStartedQuick, setHasStartedQuick] = useState(!isQuickMode);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [transcript, setTranscript] = useState('');
  const [recordedMediaUrl, setRecordedMediaUrl] = useState<string | null>(null);
  const [isVideoRecording, setIsVideoRecording] = useState(true);

  // Live telemetry states
  const [liveVolume, setLiveVolume] = useState(0);
  const [livePitch, setLivePitch] = useState<number | null>(null);

  // Status and error
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStepMessage, setEvalStepMessage] = useState('Analyzing speech...');
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Audio/Video refs
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Time & frame refs
  const timerIntervalRef = useRef<number | null>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const audioSampleIntervalRef = useRef<number | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Live metrics collected during recording
  const rmsHistoryRef = useRef<number[]>([]);
  const pitchHistoryRef = useRef<number[]>([]);
  const capturedFramesRef = useRef<string[]>([]);
  const audioMetricsRef = useRef<any>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Setup stream to video preview element whenever stream changes or starts
  useEffect(() => {
    if (videoPreviewRef.current && mediaStreamRef.current) {
      videoPreviewRef.current.srcObject = mediaStreamRef.current;
      videoPreviewRef.current.play().catch(() => {});
    }
  }, [isRecording, videoEnabled]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAllMedia();
      if (recordedMediaUrl) {
        URL.revokeObjectURL(recordedMediaUrl);
      }
    };
  }, []);

  const stopAllMedia = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (audioSampleIntervalRef.current) clearInterval(audioSampleIntervalRef.current);

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Start recording
  const startRecording = async () => {
    setErrorMessage('');
    setInfoMessage('');
    rmsHistoryRef.current = [];
    pitchHistoryRef.current = [];
    capturedFramesRef.current = [];
    recordedChunksRef.current = [];
    audioMetricsRef.current = null;

    if (recordedMediaUrl) {
      URL.revokeObjectURL(recordedMediaUrl);
      setRecordedMediaUrl(null);
    }

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
        video: videoEnabled
          ? {
              facingMode: 'user',
              width: { ideal: 640 },
              height: { ideal: 480 },
            }
          : false,
      });
    } catch (err: unknown) {
      const e = err as Error;
      setErrorMessage(
        'Camera and microphone access was denied or unavailable. Please allow access in browser permissions, or upload a pre-recorded file below.'
      );
      return;
    }

    mediaStreamRef.current = stream;
    setIsVideoRecording(videoEnabled);

    // Attach to video element
    if (videoPreviewRef.current && videoEnabled) {
      videoPreviewRef.current.srcObject = stream;
      videoPreviewRef.current.play().catch(() => {});
    }

    // MediaRecorder setup
    try {
      const mimeType = videoEnabled
        ? MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType });
        const url = URL.createObjectURL(blob);
        setRecordedMediaUrl(url);
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch {
      // Fallback if media recorder fails
    }

    // Web Audio API analysis
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Float32Array(2048);
      audioSampleIntervalRef.current = window.setInterval(() => {
        if (!analyserRef.current) return;
        analyserRef.current.getFloatTimeDomainData(buffer);
        const rms = rmsOf(buffer);
        const pitch = rms > 0.015 ? pitchDetect(buffer, audioCtx.sampleRate) : 0;

        rmsHistoryRef.current.push(rms);
        pitchHistoryRef.current.push(pitch);

        setLiveVolume(Math.min(100, Math.round(rms * 400)));
        if (pitch > 60 && pitch < 400) {
          setLivePitch(Math.round(pitch));
        }
      }, 100);
    } catch (e) {
      console.warn('Audio analysis initialization error:', e);
    }

    // Web Speech API for live transcription
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      let currentFinal = transcript ? transcript + ' ' : '';
      const recognition = new SpeechRec();
      recognition.lang = profile.speechLanguage || 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            currentFinal += res[0].transcript + ' ';
          } else {
            interimText += res[0].transcript;
          }
        }
        setTranscript(currentFinal + interimText);
      };

      recognition.onerror = () => {};
      recognition.onend = () => {
        // Auto restart if still recording
        if (isRecording && speechRecognitionRef.current) {
          try {
            speechRecognitionRef.current.start();
          } catch {}
        }
      };

      try {
        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch {}
    } else {
      setInfoMessage(
        'Speech recognition is not supported in this browser. Delivery telemetry and video posture will be fully analyzed; you can also paste or type your speech text below.'
      );
    }

    // Frame capture every 2.5 seconds
    if (videoEnabled) {
      setTimeout(() => {
        grabCurrentFrame();
      }, 1000);

      frameIntervalRef.current = window.setInterval(() => {
        grabCurrentFrame();
      }, 2500);
    }

    // Timer
    setRecordSeconds(0);
    const startTime = Date.now();
    timerIntervalRef.current = window.setInterval(() => {
      setRecordSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 500);

    setIsRecording(true);
  };

  const grabCurrentFrame = async () => {
    if (videoPreviewRef.current) {
      const frame = await captureVideoFrame(videoPreviewRef.current);
      if (frame && capturedFramesRef.current.length < 8) {
        capturedFramesRef.current.push(frame);
      }
    }
  };

  // Stop recording
  const stopRecording = () => {
    setIsRecording(false);
    setLiveVolume(0);
    setLivePitch(null);

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (audioSampleIntervalRef.current) clearInterval(audioSampleIntervalRef.current);

    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
      speechRecognitionRef.current = null;
    }

    // Summarize audio metrics
    const metrics = summarizeAudio(rmsHistoryRef.current, pitchHistoryRef.current);
    audioMetricsRef.current = metrics;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setErrorMessage('');
    setInfoMessage('Analyzing uploaded presentation file...');
    capturedFramesRef.current = [];
    rmsHistoryRef.current = [];
    pitchHistoryRef.current = [];

    const isVideo = file.type.startsWith('video');
    setIsVideoRecording(isVideo);

    if (recordedMediaUrl) {
      URL.revokeObjectURL(recordedMediaUrl);
    }
    const objectUrl = URL.createObjectURL(file);
    setRecordedMediaUrl(objectUrl);

    try {
      // Decode audio
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;

      for (let t = 0; t < audioBuffer.duration - 0.1 && t < 600; t += 0.1) {
        const windowStart = Math.floor(t * sampleRate);
        const windowEnd = Math.min(windowStart + 2048, channelData.length);
        const slice = channelData.subarray(windowStart, windowEnd);
        const rms = rmsOf(slice);
        const pitch = rms > 0.01 ? pitchDetect(slice, sampleRate) : 0;
        rmsHistoryRef.current.push(rms);
        pitchHistoryRef.current.push(pitch);
      }

      const metrics = summarizeAudio(rmsHistoryRef.current, pitchHistoryRef.current);
      audioMetricsRef.current = metrics;
      setRecordSeconds(Math.round(audioBuffer.duration));
      ctx.close();

      // If video, extract snapshots across the video duration
      if (isVideo) {
        const tempVideo = document.createElement('video');
        tempVideo.muted = true;
        tempVideo.playsInline = true;
        tempVideo.src = objectUrl;

        await new Promise((resolve, reject) => {
          tempVideo.onloadedmetadata = resolve;
          tempVideo.onerror = reject;
        });

        const duration = tempVideo.duration || 10;
        const framesCount = 5;
        for (let i = 0; i < framesCount; i++) {
          tempVideo.currentTime = Math.max(0.2, (i + 0.5) * (duration / framesCount));
          await new Promise((resolve) => {
            tempVideo.onseeked = resolve;
          });
          const frameData = await captureVideoFrame(tempVideo);
          if (frameData) {
            capturedFramesRef.current.push(frameData);
          }
        }
      }

      setInfoMessage(
        `File loaded successfully! Audio dynamics analyzed and ${capturedFramesRef.current.length} video snapshots extracted. If speech recognition is needed, please paste what you said in the transcript box.`
      );
    } catch {
      setErrorMessage('Could not decode audio from the file. Please try another format like MP4 or WebM.');
    }
  };

  // Run evaluation via Gemini backend
  const handleEvaluate = async () => {
    const trimmedTranscript = transcript.trim();
    const words = trimmedTranscript ? trimmedTranscript.split(/\s+/).filter(Boolean).length : 0;
    const duration = recordSeconds || (audioMetricsRef.current ? audioMetricsRef.current.span : 0);
    const audioSummary = audioMetricsRef.current || summarizeAudio(rmsHistoryRef.current, pitchHistoryRef.current);

    if (words < 6 && (!audioSummary || audioSummary.span < 5)) {
      setErrorMessage(
        'Please record at least 5-10 seconds of speech or provide a transcript with what you said.'
      );
      return;
    }

    setIsEvaluating(true);
    setErrorMessage('');

    const wpm = words && duration > 5 ? Math.round(words / (duration / 60)) : null;
    const fillers = extractFillerWords(trimmedTranscript);

    // Animated status messages for UX delight
    const stepTimer = setInterval(() => {
      setEvalStepMessage((prev) => {
        if (prev.includes('speech')) return 'Evaluating posture, gaze & body language...';
        if (prev.includes('posture')) return 'Measuring pacing, pitch variation & filler words...';
        if (prev.includes('pacing')) return 'Generating personalized coaching drills & tips...';
        return 'Finalizing presentation feedback...';
      });
    }, 1500);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: trimmedTranscript,
          frames: capturedFramesRef.current,
          words,
          wpm,
          fillers,
          audioMetrics: audioSummary,
          lessonContext: {
            id: isQuickMode || !currentLesson ? 'quick' : currentLesson.id,
            title: isQuickMode || !currentLesson ? 'Quick practice' : currentLesson.title,
            task: isQuickMode || !currentLesson ? '' : currentLesson.task,
            min: isQuickMode || !currentLesson ? 0 : currentLesson.min,
            isQuick: isQuickMode || !currentLesson,
          },
          goal: profile.goal || '',
          language: profile.aiLanguage || 'en',
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with status ${response.status}`);
      }

      const evalData = await response.json();
      clearInterval(stepTimer);

      const isLesson = !isQuickMode && currentLesson;
      const finalScore = Math.max(0, Math.min(100, Math.round(evalData.score || 0)));
      const minScore = isLesson ? currentLesson.min : 0;
      const passed = isLesson ? finalScore >= minScore : true;

      const previousAttempts = profile.history.filter((h) => h.lessonId === (isLesson ? currentLesson.id : 'quick'));
      const lastAttempt = previousAttempts.length > 0 ? previousAttempts[previousAttempts.length - 1] : null;

      const xpGain = isQuickMode
        ? 0
        : Math.round(finalScore / 4) + (passed && !profile.doneLessons[currentLesson!.id] ? 15 : 0);

      const evaluationResult: EvaluationResult = {
        score: finalScore,
        content: evalData.content ?? null,
        structure: evalData.structure ?? null,
        voice: evalData.voice ?? 70,
        pace: evalData.pace ?? 70,
        eye_contact: evalData.eye_contact ?? null,
        body_language: evalData.body_language ?? null,
        expression: evalData.expression ?? null,
        summary: evalData.summary || 'Solid rehearsal with clear delivery points.',
        tone_notes: evalData.tone_notes || '',
        video_notes: evalData.video_notes || '',
        strengths: Array.isArray(evalData.strengths) ? evalData.strengths : ['Clear message delivery'],
        improvements: Array.isArray(evalData.improvements) ? evalData.improvements : ['Reduce filler words'],
        suggestions: Array.isArray(evalData.suggestions) ? evalData.suggestions : ['Practice with pauses'],
        drill: evalData.drill || 'Deliver your opening hook three times without breaking eye contact.',
        better_opening: evalData.better_opening || '',
        wpm,
        words,
        duration,
        fillers,
        audioMetrics: audioSummary,
        thumbnails: [...capturedFramesRef.current],
        lessonId: isLesson ? currentLesson.id : 'quick',
        lessonTitle: isLesson ? currentLesson.title : 'Quick practice',
        isQuick: isQuickMode || !currentLesson,
        date: Date.now(),
        pass: passed,
        minScore,
        xpEarned: xpGain,
        previousScore: lastAttempt ? lastAttempt.score : null,
        transcriptText: trimmedTranscript,
      };

      onEvaluationComplete(evaluationResult);
    } catch (err: unknown) {
      clearInterval(stepTimer);
      const e = err as Error;
      setErrorMessage(`Evaluation failed: ${e.message || 'Please check your connection and retry.'}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  // If in quick mode and user hasn't clicked "Start quick practice" yet
  if (isQuickMode && !hasStartedQuick) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-extrabold text-[#2b2622] tracking-tight mb-2">Quick Practice</h1>
        <p className="text-sm text-[#74695c] mb-6">
          Record a video of yourself speaking, or upload a video/audio file to get immediate feedback on your
          voice, tone, eye contact, and body language.
        </p>

        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-6 sm:p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#c4572f] text-white flex items-center justify-center mx-auto mb-4 shadow-md">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-[#2b2622] mb-1">On-Demand AI Coaching</h2>
          <p className="text-xs text-[#74695c] max-w-sm mx-auto mb-6">
            Quick practice gives comprehensive one-time feedback. It is ideal for impromptu rehearsals,
            elevator pitches, or quick check-ins.
          </p>

          <button
            onClick={() => setHasStartedQuick(true)}
            className="w-full bg-[#1d4e5f] hover:bg-[#163f4e] text-white font-bold py-3.5 px-6 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Mic className="w-4 h-4" />
            <span>Start Quick Practice</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      {/* Lesson Brief or Quick Practice Header */}
      {!isQuickMode && currentLesson ? (
        <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-4.5 mb-4 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100/60 px-2.5 py-0.5 rounded-full">
                Lesson Drill
              </span>
              <h2 className="font-extrabold text-lg text-[#2b2622] mt-1">{currentLesson.title}</h2>
            </div>
            <button
              onClick={onExitLesson}
              disabled={isRecording}
              className="text-xs font-semibold text-[#74695c] hover:text-[#2b2622] flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#dccfbd] cursor-pointer disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Exit
            </button>
          </div>
          <p className="text-xs text-[#74695c] italic mb-2">Tip: {currentLesson.tip}</p>
          <div className="bg-[#efe9df]/70 rounded-xl p-3 text-xs text-[#2b2622] font-medium leading-relaxed">
            {currentLesson.task}
          </div>
          <div className="mt-2 text-right">
            <span className="text-[11px] font-bold text-amber-800">
              Pass target: {currentLesson.min}+ points
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#2b2622] tracking-tight">Practice Studio</h1>
            <p className="text-xs text-[#74695c]">One-time rehearsal · video, voice & speech analysis</p>
          </div>
        </div>
      )}

      {/* Main Studio Viewport */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-4 sm:p-5 shadow-md mb-4">
        {/* Language selectors & Camera toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#dccfbd]/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#74695c] flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Language:
            </span>
            <select
              value={profile.speechLanguage}
              onChange={(e) =>
                onUpdateProfile((p) => ({ ...p, speechLanguage: e.target.value as any }))
              }
              disabled={isRecording}
              className="bg-[#efe9df] border border-[#dccfbd] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#2b2622] cursor-pointer"
            >
              <option value="en-US">English (US)</option>
              <option value="si-LK">සිංහල (Sinhala)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setVideoEnabled(!videoEnabled)}
              disabled={isRecording}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border font-semibold text-xs cursor-pointer transition-colors ${
                videoEnabled
                  ? 'bg-teal-50 border-teal-200 text-teal-800'
                  : 'bg-[#efe9df] border-[#dccfbd] text-[#74695c]'
              }`}
            >
              {videoEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              <span>{videoEnabled ? 'Camera On' : 'Audio Only'}</span>
            </button>
          </div>
        </div>

        {/* Video / Playback Container */}
        <div className="relative aspect-4/3 w-full bg-stone-900 rounded-2xl overflow-hidden mb-4 shadow-inner flex items-center justify-center">
          {/* Live Recording Video View */}
          {isRecording && videoEnabled && (
            <>
              <video
                ref={videoPreviewRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover -scale-x-100"
              />

              {/* Eye level guidance marker */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 text-[11px] text-white/90 border border-white/20 select-none">
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>Look at the camera lens</span>
              </div>

              {/* Live Audio & Pitch overlay */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white/90">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20">
                  <Volume2 className="w-3.5 h-3.5 text-teal-300" />
                  <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 transition-all duration-75"
                      style={{ width: `${liveVolume}%` }}
                    />
                  </div>
                </div>

                {livePitch && (
                  <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/20 font-mono text-[11px]">
                    {livePitch} Hz
                  </div>
                )}
              </div>
            </>
          )}

          {/* Idle or Finished Recording View */}
          {!isRecording && recordedMediaUrl && (
            isVideoRecording ? (
              <video
                src={recordedMediaUrl}
                controls
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full p-6 text-center text-white">
                <Mic className="w-12 h-12 text-[#c4572f] mx-auto mb-2" />
                <p className="text-sm font-semibold mb-3">Audio Recording Ready</p>
                <audio src={recordedMediaUrl} controls className="w-full" />
              </div>
            )
          )}

          {/* Camera not started preview */}
          {!isRecording && !recordedMediaUrl && (
            <div className="text-center p-6 text-white/80 select-none">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                {videoEnabled ? <Video className="w-7 h-7 text-white/70" /> : <Mic className="w-7 h-7 text-white/70" />}
              </div>
              <p className="text-sm font-semibold">Camera is ready</p>
              <p className="text-xs text-white/60 max-w-xs mt-1">
                Keep your head and hands in frame, and speak naturally into your microphone.
              </p>
            </div>
          )}
        </div>

        {/* Big Record Button & Timer */}
        <div className="flex flex-col items-center justify-center my-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer relative ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-[#1d4e5f] hover:bg-[#163f4e] text-white hover:shadow-xl'
            }`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isRecording && (
              <span className="absolute inset-0 rounded-full border-4 border-rose-400 animate-ping opacity-75" />
            )}
            {isRecording ? (
              <Square className="w-8 h-8 fill-current" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-rose-500 shadow-xs" />
            )}
          </button>

          <div className="font-mono text-3xl font-extrabold text-[#2b2622] mt-3 tracking-tight">
            {formatTime(recordSeconds)}
          </div>
          <p className="text-xs text-[#74695c] mt-1 text-center font-medium">
            {isRecording
              ? 'Recording in progress... Tap the red button to finish'
              : 'Tap the button to start recording'}
          </p>

          {/* Alternative: Upload Video / Audio */}
          <div className="mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRecording}
              className="text-xs font-semibold text-[#1d4e5f] hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dccfbd] hover:bg-[#efe9df] transition-colors cursor-pointer disabled:opacity-40"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Video or Audio File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {/* Live Info or Error Notice */}
      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {infoMessage && (
        <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 leading-relaxed">
          {infoMessage}
        </div>
      )}

      {/* Transcript Container */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-3xl p-4 sm:p-5 shadow-xs mb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-bold text-sm text-[#2b2622]">Speech Transcript</h3>
            <span className="text-[11px] text-[#74695c]">
              Auto-filled during speech · you can review, edit or paste notes
            </span>
          </div>
          {transcript && (
            <button
              onClick={() => setTranscript('')}
              className="text-[11px] text-[#74695c] hover:text-rose-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Words will stream here automatically while speaking, or type/paste your speech text..."
          rows={4}
          className="w-full p-3 bg-[#efe9df]/60 border border-[#dccfbd] rounded-xl text-xs text-[#2b2622] focus:outline-none focus:ring-2 focus:ring-[#1d4e5f] focus:bg-white resize-y"
        />

        <div className="flex items-center justify-between text-[11px] text-[#74695c] mt-2">
          <span>{transcript.trim() ? transcript.trim().split(/\s+/).length : 0} words</span>
          <span>{capturedFramesRef.current.length} video frames captured</span>
        </div>
      </div>

      {/* Feedback Language Setting */}
      <div className="bg-[#fffaf2] border border-[#dccfbd] rounded-2xl p-3.5 mb-5 flex items-center justify-between text-xs">
        <span className="font-semibold text-[#2b2622]">AI Coach Feedback Language:</span>
        <select
          value={profile.aiLanguage}
          onChange={(e) =>
            onUpdateProfile((p) => ({ ...p, aiLanguage: e.target.value as 'en' | 'si' }))
          }
          className="bg-[#efe9df] border border-[#dccfbd] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#2b2622] cursor-pointer"
        >
          <option value="en">English Feedback</option>
          <option value="si">සිංහල (Sinhala Feedback)</option>
        </select>
      </div>

      {/* Evaluate Action Button */}
      <button
        onClick={handleEvaluate}
        disabled={isEvaluating || isRecording}
        className="w-full bg-[#1d4e5f] hover:bg-[#163f4e] text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isEvaluating ? (
          <div className="flex items-center gap-2.5">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm">{evalStepMessage}</span>
          </div>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            <span className="text-base tracking-wide">Evaluate My Speech</span>
          </>
        )}
      </button>
    </div>
  );
};
