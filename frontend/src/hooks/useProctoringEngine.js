import { useState, useEffect, useRef, useCallback } from 'react';
import { apiRecordProctoringEvent, apiAnalyzeProctoringFrame } from '../services/api';
import { detectObjectsInVideo } from '../services/visionDetector';

/**
 * Unified Proctoring Engine Hook
 * Manages webcam & microphone streams, desktop security guards,
 * and adaptive end-to-end AI analysis cycle (face presence, count, phone detection,
 * candidate identity verification, absence tracking, and risk engine synchronization).
 */
export const useProctoringEngine = ({ attemptId, isEnabled: isEnabledProp, enabled }) => {
  const isEnabled = enabled !== undefined ? enabled : (isEnabledProp !== undefined ? isEnabledProp : true);
  const active = isEnabled;

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Hardware Media States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState('Idle'); // 'Active' | 'Permission Denied' | 'Unavailable' | 'Idle'
  const [cameraError, setCameraError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0); // 0 to 100
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Authoritative Proctoring & Detection States (from backend)
  const [faceStatus, setFaceStatus] = useState('SINGLE_FACE_DETECTED'); // 'NO_FACE_DETECTED' | 'SINGLE_FACE_DETECTED' | 'MULTIPLE_FACES' | 'ANALYSIS_UNAVAILABLE'
  const [faceCount, setFaceCount] = useState(1);
  const [absenceDurationMs, setAbsenceDurationMs] = useState(0);
  const [phoneStatus, setPhoneStatus] = useState('NOT_DETECTED'); // 'NOT_DETECTED' | 'PHONE_DETECTED' | 'UNAVAILABLE'
  const [phoneConfidence, setPhoneConfidence] = useState(0);
  const [identityStatus, setIdentityStatus] = useState('IDENTITY_UNAVAILABLE'); // 'IDENTITY_MATCH' | 'IDENTITY_MISMATCH' | 'IDENTITY_REVIEW_REQUIRED' | 'IDENTITY_UNAVAILABLE'
  const [identitySimilarity, setIdentitySimilarity] = useState(null);
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState('CONNECTED'); // 'CONNECTED' | 'ANALYZING' | 'ANALYSIS_DELAYED' | 'UNAVAILABLE'
  const [aiAnalysisMode, setAiAnalysisMode] = useState('aws-live'); // 'aws-live' | 'mock'
  const [riskScore, setRiskScore] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Security Guards & Telemetry Counters
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [pollingIntervalMs, setPollingIntervalMs] = useState(10000); // 10s normal, 5s suspicious, 3s critical
  const [events, setEvents] = useState([]);
  const [latestAlert, setLatestAlert] = useState(null);

  const alertTimeoutRef = useRef(null);
  const isAnalyzingRef = useRef(false);
  const isFirstAnalysisRef = useRef(true);
  const lastAnalysisTimestampRef = useRef(0);
  const clientLatestPhoneRef = useRef({ detected: false, confidence: 0 });

  // Acoustic noise ref
  const consecutiveLoudAudioCountRef = useRef(0);
  const lastAudioIncidentTimeRef = useRef(0);

  const triggerAlert = useCallback((message, severity = 'warning') => {
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    setLatestAlert({ message, severity, timestamp: new Date() });
    alertTimeoutRef.current = setTimeout(() => {
      setLatestAlert(null);
    }, 6000);
  }, []);

  // Dispatch individual client-side security event (tab switch, fullscreen exit, etc.)
  const emitTelemetryEvent = useCallback(
    async (eventType, details = '', severity = 'warning', extra = {}) => {
      if (!isEnabled || !attemptId) return;

      const localEvent = {
        _id: `evt_local_${Date.now()}`,
        eventType,
        details,
        severity,
        timestamp: new Date(),
      };

      setEvents((prev) => [localEvent, ...prev.slice(0, 30)]);

      // Capture lightweight snapshot frame for audit if camera is active
      let snapshotBase64 = null;
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 320;
          canvas.height = 240;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          snapshotBase64 = canvas.toDataURL('image/jpeg', 0.6);
        } catch (e) {
          // ignore
        }
      }

      try {
        const response = await apiRecordProctoringEvent(attemptId, {
          eventType,
          details,
          severity,
          snapshotBase64,
          ...extra,
        });

        if (response?.data) {
          if (response.data.riskScore !== undefined) setRiskScore(response.data.riskScore);
          if (response.data.riskLevel) setRiskLevel(response.data.riskLevel);
          if (response.data.tabSwitchCount !== undefined) setTabSwitchCount(response.data.tabSwitchCount);
          if (response.data.fullscreenExitCount !== undefined) setFullscreenExitCount(response.data.fullscreenExitCount);
          if (response.data.recommendedIntervalMs) setPollingIntervalMs(response.data.recommendedIntervalMs);
        }
      } catch (err) {
        console.warn('Telemetry dispatch notice:', err.message);
      }
    },
    [isEnabled, attemptId]
  );

  // Initialize camera and microphone media streams
  const startMedia = useCallback(async () => {
    try {
      setCameraStatus('Requesting');
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraStatus('Unavailable');
        setCameraError('Webcam API is unavailable in this browser environment.');
        setIsCameraActive(false);
        setIsMicActive(false);
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });

      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setIsCameraActive(false);
          setCameraStatus('Unavailable');
          triggerAlert('Webcam stream was stopped or permissions disabled!', 'critical');
          emitTelemetryEvent(
            'CAMERA_DISABLED',
            'Webcam video stream track ended unexpectedly or permission revoked',
            'critical'
          );
        };
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setIsCameraActive(true);
      setIsMicActive(true);
      setCameraStatus('Active');
      setCameraError(null);

      // Acoustic noise analyzer
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analyserRef.current = analyser;

          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkAudio = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
            const average = sum / bufferLength;
            const normalized = Math.min(100, Math.round((average / 128) * 100));
            setAudioLevel(normalized);

            if (normalized > 58) {
              consecutiveLoudAudioCountRef.current += 1;
              const now = Date.now();
              if (consecutiveLoudAudioCountRef.current > 35 && now - lastAudioIncidentTimeRef.current >= 12000) {
                lastAudioIncidentTimeRef.current = now;
                consecutiveLoudAudioCountRef.current = 0;
                triggerAlert('⚠️ AUDIO ANOMALY: Elevated sound or talking detected in examination room.', 'warning');
                emitTelemetryEvent(
                  'AUDIO_ANOMALY',
                  `Acoustic sensor detected talking or elevated room noise (sensor level: ${normalized}%)`,
                  'warning',
                  { confidence: normalized }
                );
              }
            } else {
              consecutiveLoudAudioCountRef.current = Math.max(0, consecutiveLoudAudioCountRef.current - 1);
            }

            animationFrameRef.current = requestAnimationFrame(checkAudio);
          };

          checkAudio();
        }
      } catch (audioErr) {
        console.warn('Audio analyser setup notice:', audioErr);
      }

      return stream;
    } catch (err) {
      console.warn('Webcam / Microphone access denied:', err.name, err.message);
      setIsCameraActive(false);
      setIsMicActive(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraStatus('Permission Denied');
        setCameraError('Camera access was denied. Please grant permissions.');
      } else {
        setCameraStatus('Unavailable');
        setCameraError(err.message || 'Camera device is not accessible.');
      }
      return null;
    }
  }, [emitTelemetryEvent, triggerAlert]);

  // Request media on mount when active
  useEffect(() => {
    if (!active) return;

    startMedia();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setIsCameraActive(false);
      setIsMicActive(false);
    };
  }, [active, startMedia]);

  // Ensure video element receives stream when mounted
  useEffect(() => {
    if (active && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  });

  // Client vision background scanner (provides phone hint to backend pipeline and real-time HUD)
  useEffect(() => {
    if (!isEnabled || !attemptId || !isCameraActive) return;

    let isScanning = true;
    const visionTimer = setInterval(async () => {
      if (!isScanning || !videoRef.current || videoRef.current.readyState < 2 || videoRef.current.videoWidth === 0) {
        return;
      }

      try {
        const res = await detectObjectsInVideo(videoRef.current);
        if (res.isPhoneDetected && res.phoneConfidence >= 45) {
          clientLatestPhoneRef.current = {
            detected: true,
            confidence: res.phoneConfidence,
          };
          setPhoneStatus('PHONE_DETECTED');
          setPhoneConfidence(res.phoneConfidence);
        } else {
          clientLatestPhoneRef.current = {
            detected: false,
            confidence: 0,
          };
          setPhoneStatus((prev) => (prev === 'PHONE_DETECTED' || prev === 'UNAVAILABLE' ? 'NOT_DETECTED' : prev));
        }
      } catch {
        // silent
      }
    }, 1500);

    return () => {
      isScanning = false;
      clearInterval(visionTimer);
    };
  }, [isEnabled, attemptId, isCameraActive]);

  // Adaptive End-to-End AI Analysis Cycle
  const performAnalysisCycle = useCallback(async () => {
    if (!isEnabled || !attemptId || !isCameraActive || isAnalyzingRef.current) return;
    if (!videoRef.current || videoRef.current.videoWidth === 0) return;

    try {
      isAnalyzingRef.current = true;
      setIsAnalyzing(true);
      setAiAnalysisStatus('ANALYZING');

      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.7);

      const isStart = isFirstAnalysisRef.current;
      const phoneHint = clientLatestPhoneRef.current;

      const response = await apiAnalyzeProctoringFrame(attemptId, {
        imageBase64,
        timestamp: Date.now(),
        isSessionStart: isStart,
        clientPhoneDetected: phoneHint.detected,
        clientPhoneConfidence: phoneHint.confidence,
      });

      if (response && response.success) {
        const analysis = response.analysis || response.data?.analysis || {};
        const faceObj = analysis.face || {};
        const phoneObj = analysis.phone || {};
        const identityObj = analysis.identity || {};
        const riskObj = analysis.risk || response.risk || {};

        isFirstAnalysisRef.current = false;
        lastAnalysisTimestampRef.current = Date.now();
        setLastAnalysisTime(new Date());

        // Update face and absence status
        const resolvedFaceStatus = analysis.faceStatus || faceObj.status || 'SINGLE_FACE_DETECTED';
        const resolvedFaceCount = analysis.faceCount !== undefined ? analysis.faceCount : (faceObj.count !== undefined ? faceObj.count : 1);
        const resolvedAbsenceDurationMs = analysis.absenceDurationMs !== undefined ? analysis.absenceDurationMs : (faceObj.absenceDurationMs || 0);

        setFaceStatus(resolvedFaceStatus);
        setFaceCount(resolvedFaceCount);
        setAbsenceDurationMs(resolvedAbsenceDurationMs);

        // Update phone status
        const resolvedPhoneStatus =
          phoneObj.status === 'PHONE_DETECTED' || phoneObj.status === 'DETECTED' || phoneObj.detected || (phoneHint && phoneHint.detected)
            ? 'PHONE_DETECTED'
            : 'NOT_DETECTED';
        setPhoneStatus(resolvedPhoneStatus);
        setPhoneConfidence(
          phoneObj.confidence !== undefined && phoneObj.confidence > 0
            ? phoneObj.confidence
            : phoneHint && phoneHint.detected
            ? phoneHint.confidence
            : 0
        );

        // Update identity status
        setIdentityStatus(identityObj.status || analysis.identityStatus || 'IDENTITY_UNAVAILABLE');
        setIdentitySimilarity(identityObj.similarity !== undefined ? identityObj.similarity : (analysis.identitySimilarity || null));

        // Update AI engine connection & mode
        const resolvedAiStatus = analysis.aiAnalysisStatus || analysis.aiAnalysis?.status || 'CONNECTED';
        const resolvedAiMode = analysis.mode || analysis.aiAnalysis?.mode || 'aws-live';
        setAiAnalysisStatus(resolvedAiStatus);
        setAiAnalysisMode(resolvedAiMode);

        // Update authoritative backend risk score and level
        if (riskObj) {
          if (riskObj.score !== undefined) setRiskScore(riskObj.score);
          if (riskObj.level) setRiskLevel(riskObj.level);
          if (riskObj.recommendedIntervalMs) {
            setPollingIntervalMs(riskObj.recommendedIntervalMs);
          }
        }

        // Trigger user alerts based on detected conditions
        if (analysis.faceStatus === 'NO_FACE_DETECTED' && (analysis.absenceDurationMs || 0) >= 10000) {
          triggerAlert('⚠️ CANDIDATE ABSENT: No face detected in camera viewport!', 'critical');
        } else if (analysis.faceStatus === 'MULTIPLE_FACES') {
          triggerAlert(`🚨 MULTIPLE FACES: ${analysis.faceCount} individuals detected in camera arena!`, 'critical');
        } else if (analysis.phone?.status === 'PHONE_DETECTED') {
          triggerAlert(`🚨 PHONE DETECTED: Mobile device identified (${analysis.phone.confidence}%)!`, 'critical');
        } else if (analysis.identity?.status === 'IDENTITY_MISMATCH') {
          triggerAlert('⚠️ IDENTITY MISMATCH: Candidate face does not match enrolled reference photo!', 'critical');
        }
      } else {
        setAiAnalysisStatus('UNAVAILABLE');
        setFaceStatus('ANALYSIS_UNAVAILABLE');
      }
    } catch (err) {
      console.warn('AI analysis cycle notice:', err.message);
      setAiAnalysisStatus('UNAVAILABLE');
      setFaceStatus('ANALYSIS_UNAVAILABLE');
    } finally {
      isAnalyzingRef.current = false;
      setIsAnalyzing(false);
    }
  }, [isEnabled, attemptId, isCameraActive, triggerAlert]);

  // Main Adaptive Polling Loop
  useEffect(() => {
    if (!isEnabled || !attemptId || !isCameraActive) return;

    // Run first analysis immediately once camera has initialized
    const initialTimer = setTimeout(() => {
      performAnalysisCycle();
    }, 1500);

    const intervalTimer = setInterval(() => {
      performAnalysisCycle();
    }, pollingIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isEnabled, attemptId, isCameraActive, pollingIntervalMs, performAnalysisCycle]);

  // Monitor for "Analysis delayed" (> 2.5x polling interval since last analysis)
  useEffect(() => {
    if (!isEnabled || !isCameraActive) return;

    const delayCheckTimer = setInterval(() => {
      if (lastAnalysisTimestampRef.current > 0 && !isAnalyzingRef.current) {
        const elapsed = Date.now() - lastAnalysisTimestampRef.current;
        if (elapsed > pollingIntervalMs * 2.5 && aiAnalysisStatus !== 'UNAVAILABLE') {
          setAiAnalysisStatus('ANALYSIS_DELAYED');
        }
      }
    }, 3000);

    return () => clearInterval(delayCheckTimer);
  }, [isEnabled, isCameraActive, pollingIntervalMs, aiAnalysisStatus]);

  // Fullscreen Request helper
  const requestFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Fullscreen request notice:', err);
    }
  }, []);

  // Listen for Fullscreen departures
  useEffect(() => {
    if (!isEnabled) return;

    const handleFullscreenChange = () => {
      const inFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );

      setIsFullscreen(inFullscreen);

      if (!inFullscreen) {
        triggerAlert('Fullscreen departure detected! Please return to fullscreen mode immediately.', 'critical');
        emitTelemetryEvent(
          'FULLSCREEN_EXIT',
          'Candidate exited fullscreen arena viewport',
          'critical'
        );
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isEnabled, triggerAlert, emitTelemetryEvent]);

  // Listen for Tab Switch & Document Visibility departures
  useEffect(() => {
    if (!isEnabled) return;

    let departureTime = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        departureTime = Date.now();
        triggerAlert('Tab switch detected! Navigation away from the examination window is logged.', 'critical');
        emitTelemetryEvent(
          'TAB_SWITCH',
          'Candidate switched away from exam browser tab',
          'critical'
        );
      } else if (departureTime) {
        const awaySeconds = ((Date.now() - departureTime) / 1000).toFixed(1);
        emitTelemetryEvent(
          'FOCUS_LOST',
          `Returned to exam viewport after ${awaySeconds}s background interval`,
          'info'
        );
        departureTime = null;
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden) {
        triggerAlert('Window focus departed. Click inside the exam arena to maintain telemetry.', 'warning');
        emitTelemetryEvent(
          'FOCUS_LOST',
          'Exam window lost active desktop focus',
          'info'
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isEnabled, triggerAlert, emitTelemetryEvent]);

  // Shield: DevTools shortcuts prevention
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        triggerAlert('Developer tools and source inspection shortcuts are blocked.', 'critical');
        emitTelemetryEvent(
          'DEVTOOLS_ATTEMPT',
          `Attempted keyboard inspection shortcut (${e.key})`,
          'critical'
        );
        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      triggerAlert('Context menu is restricted in proctored session.', 'info');
      return false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isEnabled, triggerAlert, emitTelemetryEvent]);

  // Shield: Copy / Paste / Cut prevention
  useEffect(() => {
    if (!isEnabled) return;

    const handleCopyPaste = (e) => {
      e.preventDefault();
      const op = e.type.toUpperCase();
      triggerAlert(`Clipboard action (${op}) is prohibited during the examination.`, 'warning');
      emitTelemetryEvent(
        'COPY_PASTE_ATTEMPT',
        `Candidate attempted prohibited ${op} operation in arena`,
        'warning'
      );
    };

    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);

    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
    };
  }, [isEnabled, triggerAlert, emitTelemetryEvent]);

  return {
    videoRef,
    isCameraActive,
    cameraStatus,
    cameraError,
    startCamera: startMedia,
    isMicActive,
    audioLevel,
    isFullscreen,
    requestFullscreen,

    // Granular Section 7 Proctoring Statuses
    faceStatus,
    faceCount,
    absenceDurationMs,
    phoneStatus,
    phoneConfidence,
    identityStatus,
    identitySimilarity,
    aiAnalysisStatus,
    aiAnalysisMode,
    riskScore,
    riskLevel,
    lastAnalysisTime,
    isAnalyzing,
    pollingIntervalMs,

    // Auxiliary security state
    tabSwitchCount,
    fullscreenExitCount,
    events,
    latestAlert,
    dismissAlert: () => setLatestAlert(null),
    emitTelemetryEvent,
    triggerManualAnalysis: performAnalysisCycle,
  };
};

export default useProctoringEngine;
