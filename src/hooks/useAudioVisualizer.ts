import { useRef, useState, useCallback, useEffect } from 'react';

interface AudioVisualizerData {
  frequencyData: Uint8Array;
  averageFrequency: number;
  bassFrequency: number;
  midFrequency: number;
  highFrequency: number;
}

const defaultData: AudioVisualizerData = {
  frequencyData: new Uint8Array(0),
  averageFrequency: 0,
  bassFrequency: 0,
  midFrequency: 0,
  highFrequency: 0,
};

// Throttle updates to reduce CPU usage - update every 100ms instead of every frame
const THROTTLE_MS = 100;

export const useAudioVisualizer = (audioElement: HTMLAudioElement | null, isPlaying: boolean) => {
  const [visualizerData, setVisualizerData] = useState<AudioVisualizerData>(defaultData);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isConnectedRef = useRef(false);

  const connectAudio = useCallback(() => {
    if (!audioElement || isConnectedRef.current) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      if (!analyserRef.current) {
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 128; // Smaller FFT for better performance
        analyserRef.current.smoothingTimeConstant = 0.85;
      }

      if (!sourceRef.current) {
        try {
          sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement);
          sourceRef.current.connect(analyserRef.current);
          analyserRef.current.connect(audioContextRef.current.destination);
          isConnectedRef.current = true;
        } catch (e) {
          isConnectedRef.current = true;
        }
      }
    } catch (error) {
      console.warn('Web Audio API not available');
    }
  }, [audioElement]);

  const analyze = useCallback(() => {
    if (!analyserRef.current || !isPlaying) {
      setVisualizerData(defaultData);
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bassEnd = Math.floor(bufferLength * 0.15);
    const midEnd = Math.floor(bufferLength * 0.5);
    
    let bassSum = 0;
    let midSum = 0;
    let highSum = 0;

    for (let i = 0; i < bufferLength; i++) {
      if (i < bassEnd) {
        bassSum += dataArray[i];
      } else if (i < midEnd) {
        midSum += dataArray[i];
      } else {
        highSum += dataArray[i];
      }
    }

    setVisualizerData({
      frequencyData: dataArray,
      averageFrequency: (bassSum + midSum + highSum) / bufferLength / 255,
      bassFrequency: bassSum / bassEnd / 255,
      midFrequency: midSum / (midEnd - bassEnd) / 255,
      highFrequency: highSum / (bufferLength - midEnd) / 255,
    });
  }, [isPlaying]);

  useEffect(() => {
    if (audioElement && isPlaying) {
      connectAudio();
      // Use setInterval instead of requestAnimationFrame for throttling
      intervalRef.current = window.setInterval(analyze, THROTTLE_MS);
    } else {
      setVisualizerData(defaultData);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [audioElement, isPlaying, connectAudio, analyze]);

  return visualizerData;
};
