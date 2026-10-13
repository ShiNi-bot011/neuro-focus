import { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeAttentionFrame } from '../lib/gemini';
import { AttentionSnapshot } from '../types';
import { soundFx } from '../lib/audio';

export function useCamera(isSessionActive: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastSnapshot, setLastSnapshot] = useState<AttentionSnapshot | null>(null);
  const [snapshotsHistory, setSnapshotsHistory] = useState<AttentionSnapshot[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const consecutiveDistractionsRef = useRef(0);

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      setStream(mediaStream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(msg);
      setCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  // Capture single frame
  const captureFrameBase64 = useCallback((): string | null => {
    if (!videoRef.current || !cameraActive) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, [cameraActive]);

  const [capturedFrames, setCapturedFrames] = useState<{ timestamp: number; base64: string }[]>([]);

  // Perform AI Evaluation
  const evaluateNow = useCallback(async () => {
    if (isAnalyzing) return;
    const frame = captureFrameBase64();
    if (!frame) return;

    const now = Date.now();
    setCapturedFrames(prev => {
      // keep up to 25 keyframes across the session
      const updated = [...prev, { timestamp: now, base64: frame }];
      if (updated.length > 25) {
        return updated.slice(updated.length - 25);
      }
      return updated;
    });

    setIsAnalyzing(true);
    try {
      const result = await analyzeAttentionFrame(frame);
      setLastSnapshot(result);
      setSnapshotsHistory(prev => [...prev, result]);

      // Distraction intervention triggers
      if (result.attentionState === 'Distracted' || result.attentionState === 'Away') {
        consecutiveDistractionsRef.current += 1;
        if (consecutiveDistractionsRef.current >= 2) {
          soundFx.playAttentionAlert();
        }
      } else {
        consecutiveDistractionsRef.current = 0;
      }
    } catch (err) {
      console.warn('Frame analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureFrameBase64, isAnalyzing]);

  // Periodic frame analysis during active session (every 45s)
  useEffect(() => {
    if (!isSessionActive || !cameraActive) return;

    // Run initial analysis after 5 seconds of session start
    const initialTimer = setTimeout(() => {
      evaluateNow();
    }, 5000);

    const interval = setInterval(() => {
      evaluateNow();
    }, 45000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [isSessionActive, cameraActive, evaluateNow]);

  // Ensure stream connects to video element when ready
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const clearSessionSnapshots = () => {
    setSnapshotsHistory([]);
    setCapturedFrames([]);
    setLastSnapshot(null);
    consecutiveDistractionsRef.current = 0;
  };

  return {
    videoRef,
    cameraActive,
    cameraError,
    startCamera,
    stopCamera,
    lastSnapshot,
    snapshotsHistory,
    capturedFrames,
    isAnalyzing,
    evaluateNow,
    clearSessionSnapshots
  };
}
