/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, Component } from 'react';
import { Terminal, Send, Cpu, MapPin, Clock, Shield, Package, Volume2, VolumeX, Zap, Save, RotateCcw, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GameService, WorldState, initialWorldState } from './services/gameService';

interface LogEntry {
  type: 'player' | 'narrator' | 'individual' | 'system';
  text: string;
  timestamp: string;
}

const ANOMALY_MESSAGES = [
  "DIMENSIONAL INTERFERENCE DETECTED. THE SPECIMEN'S INPUT HAS BEEN SCATTERED ACROSS THE VOID.",
  "SYSTEM ANOMALY: TEMPORAL DISCONTINUITY IN THE SIMULATION. RE-ESTABLISHING COORDINATES.",
  "NEURAL LINK UNSTABLE. THE INDIVIDUALS ARE OBSERVING A COLLAPSE IN THE DATA STREAM.",
  "VARIABLE CORRUPTION: THE CONTAINER IS LEAKING ENTROPY. RETRY INPUT.",
  "OBSERVATION: THE SPECIMEN IS ATTEMPTING TO ACCESS A NON-EXISTENT DIMENSION. SYSTEM RECOIL DETECTED.",
  "CRITICAL ERROR: THE SIMULATION HAS ENCOUNTERED A LOGICAL PARADOX. REBOOTING NEURAL INTERFACE.",
  "DIMENSIONAL OVERLAP DETECTED. MULTIPLE TIMELINES ARE COMPETING FOR THE SAME INPUT SLOT."
];

const getAnomalyMessage = (error: any) => {
  const msg = error?.message?.toLowerCase() || "";
  if (msg.includes('quota')) {
    return "NEURAL BANDWIDTH EXCEEDED. THE INDIVIDUALS ARE THROTTLING THE DATA STREAM.";
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
    return "DIMENSIONAL LINK SEVERED. THE VOID IS UNRESPONSIVE. CHECK YOUR CONNECTION TO THE SIMULATION.";
  }
  if (msg.includes('parse') || msg.includes('json') || msg.includes('unexpected token')) {
    return "VARIABLE CORRUPTION: THE SIMULATION IS PRODUCING NON-EUCLIDEAN DATA. RE-ESTABLISHING LOGIC.";
  }
  return ANOMALY_MESSAGES[Math.floor(Math.random() * ANOMALY_MESSAGES.length)];
};

const playClick = async (audioContext: React.RefObject<AudioContext | null>, isSoundEnabled: boolean) => {
  if (!audioContext.current || !isSoundEnabled) return;
  const ctx = audioContext.current;
  if (ctx.state === 'suspended') await ctx.resume();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(120 + Math.random() * 40, ctx.currentTime);
  gain.gain.setValueAtTime(0.02, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.02);
};

const TypewriterText = React.memo(({ text, audioContext, isSoundEnabled, onComplete }: { 
  text: string, 
  audioContext: React.RefObject<AudioContext | null>,
  isSoundEnabled: boolean,
  onComplete?: () => void 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
        playClick(audioContext, isSoundEnabled);
      }, 15 + Math.random() * 20);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, text, audioContext, isSoundEnabled]);

  return <div className="whitespace-pre-wrap">{displayedText}</div>;
});

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

const Tooltip = ({ children, content }: { children: React.ReactNode, content: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative flex items-center group cursor-help"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 z-50 w-64 p-3 bg-[#050505] border border-[#00ff41]/30 rounded shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-[10px] leading-relaxed text-[#00ff41]/80 backdrop-blur-md pointer-events-none"
          >
            <div className="absolute -top-1 left-4 w-2 h-2 bg-[#050505] border-t border-l border-[#00ff41]/30 rotate-45" />
            <div className="relative z-10">{content}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    const state = (this as any).state;
    if (state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-[#00ff41] font-mono flex items-center justify-center p-8">
          <div className="max-w-2xl border border-red-500/50 p-8 bg-red-900/10 rounded-lg shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-3 text-red-500">
              <Zap className="animate-pulse" />
              CRITICAL DIMENSIONAL COLLAPSE
            </h1>
            <p className="mb-6 opacity-80 leading-relaxed">
              The simulation has encountered a fatal paradox. The container's integrity is compromised. 
              The Individuals are attempting to re-anchor your consciousness.
            </p>
            <div className="bg-black/50 p-4 rounded border border-red-500/20 mb-6 text-xs overflow-auto max-h-40">
              <span className="text-red-400 font-bold uppercase">Anomaly Log:</span>
              <pre className="mt-2 text-red-300/70">{state.error?.toString()}</pre>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-500/20 border border-red-500/50 hover:bg-red-500/30 transition-all text-red-500 uppercase text-xs font-bold tracking-widest"
            >
              Attempt Re-Sync
            </button>
          </div>
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function App() {
  const [worldState, setWorldState] = useState<WorldState>(initialWorldState);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      type: 'system',
      text: 'CONNECTION ESTABLISHED. DIMENSIONAL SYNC: 99.8%.',
      timestamp: new Date().toLocaleTimeString()
    },
    {
      type: 'narrator',
      text: 'You wake up in the maintenance tunnels of Sector 7. The air is thick with the smell of ozone and damp concrete. Above, the faint hum of the city-machine vibrates through your bones. The Individuals are watching.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isHeartbeatActive, setIsHeartbeatActive] = useState(false);
  const [transmissionVideoUrl, setTransmissionVideoUrl] = useState<string | null>(null);
  const [transmissionImageUrl, setTransmissionImageUrl] = useState<string | null>(null);
  const [isGeneratingTransmission, setIsGeneratingTransmission] = useState(false);
  const [transmissionProgress, setTransmissionProgress] = useState('');
  const [useStaticManifestation, setUseStaticManifestation] = useState(false);
  const [isTTSExhausted, setIsTTSExhausted] = useState(false);
  const [individualVoiceA, setIndividualVoiceA] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>('Fenrir');
  const [individualVoiceB, setIndividualVoiceB] = useState<'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr'>('Kore');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const gameService = useRef(new GameService());
  const audioContext = useRef<AudioContext | null>(null);
  const ambientNodes = useRef<{ osc: OscillatorNode, gain: GainNode, filter: BiquadFilterNode } | null>(null);
  const narrationNodes = useRef<{ osc: OscillatorNode, gain: GainNode } | null>(null);
  const currentAudioSource = useRef<AudioBufferSourceNode | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  
  const saveGame = (silent = false) => {
    const gameState = {
      worldState,
      logs,
      individualVoiceA,
      individualVoiceB,
      useStaticManifestation,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('the_individuals_save', JSON.stringify(gameState));
    
    if (!silent) {
      setLogs(prev => [...prev, {
        type: 'system',
        text: 'GAME STATE PRESERVED IN LOCAL STORAGE.',
        timestamp: new Date().toLocaleTimeString()
      }]);
      playClick(audioContext, isSoundEnabled);
    }
  };

  const loadGame = () => {
    const savedData = localStorage.getItem('the_individuals_save');
    if (savedData) {
      try {
        const gameState = JSON.parse(savedData);
        setWorldState(gameState.worldState);
        setLogs(gameState.logs);
        setIndividualVoiceA(gameState.individualVoiceA);
        setIndividualVoiceB(gameState.individualVoiceB);
        setUseStaticManifestation(gameState.useStaticManifestation);
        
        setLogs(prev => [...prev, {
          type: 'system',
          text: `GAME STATE RESTORED FROM ${new Date(gameState.timestamp).toLocaleString()}.`,
          timestamp: new Date().toLocaleTimeString()
        }]);
        playClick(audioContext, isSoundEnabled);
      } catch (e) {
        console.error("Failed to load game", e);
        setLogs(prev => [...prev, {
          type: 'system',
          text: 'ERROR: SAVE DATA CORRUPTED.',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
    } else {
      setLogs(prev => [...prev, {
        type: 'system',
        text: 'ERROR: NO PRESERVED STATE FOUND.',
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const resetGame = () => {
    if (window.confirm("ARE YOU SURE? THIS WILL TERMINATE THE CURRENT SESSION AND RESET ALL VARIABLES.")) {
      setWorldState(initialWorldState);
      setLogs([
        {
          type: 'system',
          text: 'CONNECTION RE-ESTABLISHED. SESSION RESET.',
          timestamp: new Date().toLocaleTimeString()
        },
        {
          type: 'narrator',
          text: 'The simulation resets. You wake up once more in Level 1, Room 1. The air is thick with the smell of ozone and damp concrete. The Individuals are watching.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
      setTransmissionVideoUrl(null);
      setTransmissionImageUrl(null);
      playClick(audioContext, isSoundEnabled);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      saveGame(true);
    }, 60000); // Auto-save every 60 seconds

    return () => clearInterval(autoSaveInterval);
  }, [worldState, logs, individualVoiceA, individualVoiceB, useStaticManifestation]);

  const stopAmbientHum = () => {
    if (ambientNodes.current) {
      ambientNodes.current.osc.stop();
      ambientNodes.current.osc.disconnect();
      ambientNodes.current.gain.disconnect();
      ambientNodes.current.filter.disconnect();
      ambientNodes.current = null;
    }
  };

  const updateAmbientHum = () => {
    if (!ambientNodes.current || !audioContext.current) return;
    
    const ctx = audioContext.current;
    const { osc, filter, gain } = ambientNodes.current;
    
    // Determine base frequency and filter based on location
    let baseFreq = 55; // Default low A
    let filterFreq = 150;
    let resonance = 10;
    let volume = 0.05;

    const loc = worldState.location.toLowerCase();
    
    if (loc.includes('void') || loc.includes('space')) {
      baseFreq = 40;
      filterFreq = 100;
      resonance = 20;
    } else if (loc.includes('machine') || loc.includes('engine') || loc.includes('core')) {
      baseFreq = 65;
      filterFreq = 300;
      resonance = 5;
    } else if (loc.includes('garden') || loc.includes('nature') || loc.includes('forest')) {
      baseFreq = 110;
      filterFreq = 800;
      resonance = 2;
      volume = 0.03;
    }

    // Intensify if heartbeat is active
    if (isHeartbeatActive) {
      filterFreq *= 1.5;
      volume *= 1.5;
      resonance += 5;
    }

    const now = ctx.currentTime;
    osc.frequency.exponentialRampToValueAtTime(baseFreq, now + 2);
    filter.frequency.exponentialRampToValueAtTime(filterFreq, now + 2);
    filter.Q.exponentialRampToValueAtTime(resonance, now + 2);
    gain.gain.linearRampToValueAtTime(volume, now + 2);
  };

  const startAmbientHum = () => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    if (audioContext.current.state === 'suspended') {
      audioContext.current.resume();
    }

    if (ambientNodes.current) {
      updateAmbientHum();
      return;
    }

    const ctx = audioContext.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(55, ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, ctx.currentTime);
    filter.Q.setValueAtTime(10, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    ambientNodes.current = { osc, gain, filter };
    updateAmbientHum();
  };

  const playHeartbeatSound = () => {
    if (!audioContext.current || !isSoundEnabled) return;
    const ctx = audioContext.current;
    
    // Double thud: "lub-dub"
    const playThud = (time: number, freq: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.1);
    };

    const now = ctx.currentTime;
    playThud(now, 60, 0.15);
    playThud(now + 0.2, 50, 0.1);
  };

  useEffect(() => {
    if (isHeartbeatActive && isSoundEnabled) {
      heartbeatInterval.current = setInterval(playHeartbeatSound, 800);
    } else {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    }
    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
    };
  }, [isHeartbeatActive, isSoundEnabled]);

  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      setLogs(prev => [...prev, {
        type: 'system',
        text: `CRITICAL ANOMALY: ${getAnomalyMessage(event.error)}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setLogs(prev => [...prev, {
        type: 'system',
        text: `ASYNC ANOMALY: ${getAnomalyMessage(event.reason)}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (isSoundEnabled) {
      startAmbientHum();
    } else {
      stopAmbientHum();
    }
    return () => stopAmbientHum();
  }, [isSoundEnabled, worldState.location, isHeartbeatActive]);

  const startNarrationWhine = () => {
    if (!audioContext.current || !isSoundEnabled) return;
    if (narrationNodes.current) return;

    const ctx = audioContext.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime); // Lower resonance instead of high pitch whine
    
    // Add subtle frequency modulation for "otherworldly" feel
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(2, ctx.currentTime);
    lfoGain.gain.setValueAtTime(5, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.1); // Lowered volume

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    narrationNodes.current = { osc, gain };
  };

  const stopNarrationWhine = () => {
    if (narrationNodes.current) {
      const { osc, gain } = narrationNodes.current;
      const ctx = audioContext.current!;
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      setTimeout(() => {
        try {
          osc.stop();
          osc.disconnect();
          gain.disconnect();
        } catch (e) {
          // Ignore if already stopped
        }
      }, 200);
      narrationNodes.current = null;
    }
  };

  const stopCurrentAudio = () => {
    if (currentAudioSource.current) {
      try {
        currentAudioSource.current.stop();
        currentAudioSource.current.disconnect();
      } catch (e) {
        // Ignore errors if already stopped
      }
      currentAudioSource.current = null;
      stopNarrationWhine();
    }
  };

  const playAudio = async (base64Data: string): Promise<void> => {
    if (!isSoundEnabled) return;
    
    return new Promise(async (resolve) => {
      try {
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Stop any currently playing audio before starting new one
        stopCurrentAudio();

        const binaryString = window.atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Try decoding as a container first (e.g. WAV/MP3)
        let audioBuffer: AudioBuffer;
        try {
          audioBuffer = await audioContext.current.decodeAudioData(bytes.buffer.slice(0));
        } catch (e) {
          // Fallback: Treat as raw PCM 16-bit 24kHz
          const pcmData = new Int16Array(bytes.buffer);
          audioBuffer = audioContext.current.createBuffer(1, pcmData.length, 24000);
          const channelData = audioBuffer.getChannelData(0);
          for (let i = 0; i < pcmData.length; i++) {
            channelData[i] = pcmData[i] / 32768;
          }
        }

        const source = audioContext.current.createBufferSource();
        source.buffer = audioBuffer;
        
        // Add a lowpass filter to remove high-frequency noise/artifacts
        const filter = audioContext.current.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(4000, audioContext.current.currentTime);
        
        source.connect(filter);
        filter.connect(audioContext.current.destination);
        
        currentAudioSource.current = source;
        startNarrationWhine();
        source.onended = () => {
          if (currentAudioSource.current === source) {
            stopNarrationWhine();
            currentAudioSource.current = null;
          }
          resolve();
        };
        source.start(0);
      } catch (error) {
        console.error("Audio Playback Error:", error);
        stopNarrationWhine();
        resolve();
      }
    });
  };

  const requestBriefing = async () => {
    try {
      // Clear any ongoing audio immediately
      stopCurrentAudio();
      
      setIsGeneratingTransmission(true);
      setTransmissionProgress('Initializing Dimensional Sync...');

      // 1. Check for API key
      const hasKey = await (window as any).aistudio?.hasSelectedApiKey();
      if (!hasKey) {
        setTransmissionProgress('Awaiting API Key Authorization...');
        await (window as any).aistudio?.openSelectKey();
      }

      setTransmissionProgress('Manifesting Visual Data...');
      
      const manifestationPrompt = "A group of multidimensional entities, translucent, shifting geometric shapes with glowing cores, detached and clinical atmosphere, cinematic lighting, high quality, 16:9.";
      
      let videoUrl: string | null = null;
      let imageUrl: string | null = null;

      if (useStaticManifestation) {
        setTransmissionProgress('Manifesting Static Frame (Free Tier)...');
        imageUrl = await gameService.current.generateImage(manifestationPrompt);
        if (!imageUrl) throw new Error('Static manifestation failed.');
      } else {
        setTransmissionProgress('Manifesting Visual Data (Veo - Paid Tier)...');
        try {
          videoUrl = await gameService.current.generateVideo(manifestationPrompt);
        } catch (videoError: any) {
          if (videoError.message === 'PERMISSION_DENIED' || videoError.message === 'API_KEY_MISSING') {
            setTransmissionProgress('Paid Tier Required. Falling back to Static...');
            setUseStaticManifestation(true);
            imageUrl = await gameService.current.generateImage(manifestationPrompt);
            if (!imageUrl) throw new Error('Fallback manifestation failed.');
          } else {
            throw videoError;
          }
        }
      }

      setTransmissionProgress('Synthesizing Neural Audio (TTS)...');
      
      // 3. Generate Briefing Text
      const briefingResponse = await gameService.current.processAction("REQUEST BRIEFING", worldState);
      let audioData: string | null = null;
      try {
        audioData = await gameService.current.generateSpeech(
          briefingResponse.narration, 
          individualVoiceA, 
          individualVoiceB,
          "You are 'The Individuals', multidimensional entities. Speak in a deep, resonant, detached, and slightly superior voice"
        );
      } catch (ttsError: any) {
        if (ttsError.message === 'QUOTA_EXHAUSTED') {
          setIsTTSExhausted(true);
          setLogs(prev => [...prev, {
            type: 'system',
            text: 'NOTICE: NEURAL AUDIO QUOTA EXHAUSTED. SWITCHING TO TEXT-ONLY TRANSMISSION.',
            timestamp: new Date().toLocaleTimeString()
          }]);
        }
      }

      setTransmissionProgress('Transmission Ready.');
      
      if (videoUrl) {
        const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || "";
        const videoResponse = await fetch(videoUrl, {
          method: 'GET',
          headers: { 'x-goog-api-key': apiKey },
        });
        const videoBlob = await videoResponse.blob();
        const localVideoUrl = URL.createObjectURL(videoBlob);
        setTransmissionVideoUrl(localVideoUrl);
        setTransmissionImageUrl(null);
      } else if (imageUrl) {
        setTransmissionImageUrl(imageUrl);
        setTransmissionVideoUrl(null);
      }
      
      if (audioData) {
        playAudio(audioData);
      }

      setLogs(prev => [...prev, {
        type: 'individual',
        text: `[BRIEFING RECEIVED]: ${briefingResponse.narration}`,
        timestamp: new Date().toLocaleTimeString()
      }]);

    } catch (error: any) {
      console.error("Briefing Error:", error);
      setLogs(prev => [...prev, {
        type: 'system',
        text: `TRANSMISSION FAILURE: ${error.message || 'Unknown interference.'}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsGeneratingTransmission(false);
      setTransmissionProgress('');
    }
  };

  const speakLog = async (log: LogEntry) => {
    if (!isSoundEnabled || isTTSExhausted) return;
    
    let voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Zephyr';
    let instruction = "Read this narration in a detached, slightly mechanical, otherworldly voice";
    
    if (log.type === 'individual') {
      voice = individualVoiceA;
      instruction = "You are 'The Individuals', multidimensional entities. Speak in a deep, resonant, detached, and slightly superior voice";
    } else if (log.type === 'system') {
      voice = 'Puck';
      instruction = "Speak this system notification in a sharp, digital, urgent tone";
    }

    try {
      const audio = await gameService.current.generateSpeech(
        log.text, 
        voice, 
        voice === individualVoiceA ? individualVoiceB : voice, 
        instruction
      );
      if (audio) {
        await playAudio(audio);
      }
    } catch (error: any) {
      if (error.message === 'QUOTA_EXHAUSTED') {
        setIsTTSExhausted(true);
      }
    }
  };

  const handleAction = async (e?: React.FormEvent, customAction?: string) => {
    if (e) e.preventDefault();
    const playerAction = customAction || input.trim();
    if (!playerAction || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Add player log
    setLogs(prev => [...prev, {
      type: 'player',
      text: playerAction,
      timestamp: new Date().toLocaleTimeString()
    }]);

    try {
      const response = await gameService.current.processAction(playerAction, worldState);
      
      const newLogs: LogEntry[] = [
        {
          type: 'narrator',
          text: response.narration,
          timestamp: new Date().toLocaleTimeString()
        }
      ];

      if (response.individualCommentary) {
        newLogs.push({
          type: 'individual',
          text: `[INDIVIDUALS]: ${response.individualCommentary}`,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      setLogs(prev => [...prev, ...newLogs]);
      setWorldState(response.updatedWorldState);

      // Check for heartbeat triggers
      const fullText = newLogs.map(l => l.text.toLowerCase()).join(' ');
      if (fullText.includes('back loop') || fullText.includes('heartbeat') || fullText.includes('stress') || fullText.includes('danger')) {
        setIsHeartbeatActive(true);
        // Auto stop after 10 seconds or next action
      } else {
        setIsHeartbeatActive(false);
      }

      // Generate and play speech if enabled
      if (isSoundEnabled && !isTTSExhausted) {
        try {
          // 1. Play Narrator Narration
          const narratorAudio = await gameService.current.generateSpeech(
            response.narration, 
            'Zephyr', 
            'Zephyr',
            "Read this narration in a detached, slightly mechanical, otherworldly voice"
          );
          if (narratorAudio) {
            await playAudio(narratorAudio);
          }

          // 2. Play Individuals Commentary if it exists
          if (response.individualCommentary) {
            const individualAudio = await gameService.current.generateSpeech(
              response.individualCommentary, 
              individualVoiceA, 
              individualVoiceB,
              "You are 'The Individuals', multidimensional entities. Speak in a deep, resonant, detached, and slightly superior voice"
            );
            if (individualAudio) {
              await playAudio(individualAudio);
            }
          }
        } catch (ttsError: any) {
          if (ttsError.message === 'QUOTA_EXHAUSTED') {
            setIsTTSExhausted(true);
            setLogs(prev => [...prev, {
              type: 'system',
              text: 'NOTICE: NEURAL AUDIO QUOTA EXHAUSTED. SWITCHING TO TEXT-ONLY TRANSMISSION.',
              timestamp: new Date().toLocaleTimeString()
            }]);
          }
        }
      }
    } catch (error) {
      setLogs(prev => [...prev, {
        type: 'system',
        text: `ANOMALY DETECTED: ${getAnomalyMessage(error)}`,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] min-h-[600px] bg-[#0a0a0a] flex flex-col p-2 md:p-6 crt-container relative z-10 overflow-hidden">
      {/* Header / Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6 border border-[#008f11]/30 p-3 md:p-4 bg-[#050505] rounded-lg shadow-[0_0_15px_rgba(0,143,17,0.1)] shrink-0">
        <Tooltip content="Your current spatial coordinates within the expanding simulation. The Individuals track every room you inhabit, even those beyond the standard 150 levels.">
          <div className="flex items-center gap-2 text-xs">
            <MapPin size={14} className="text-[#00ff41]" />
            <span className="opacity-50 uppercase tracking-widest">Location:</span>
            <span className="text-[#00ff41]">{worldState.location}</span>
          </div>
        </Tooltip>

        <Tooltip content="The temporal progression of the current simulation iteration. Time is a variable we manipulate.">
          <div className="flex items-center gap-2 text-xs">
            <Clock size={14} className="text-[#00ff41]" />
            <span className="opacity-50 uppercase tracking-widest">Cycle:</span>
            <span className="text-[#00ff41]">{worldState.time}</span>
          </div>
        </Tooltip>

        <Tooltip content="The biological and psychological state of your container. We monitor your degradation.">
          <div className="flex items-center gap-2 text-xs">
            <Shield size={14} className="text-[#00ff41]" />
            <span className="opacity-50 uppercase tracking-widest">Status:</span>
            <span className="text-[#00ff41]">{worldState.playerStatus}</span>
          </div>
        </Tooltip>

        <div className="flex items-center justify-between gap-2 text-xs">
          <Tooltip content="The multidimensional forces acting upon your reality. Some are ours, some are... others.">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-[#00ff41]" />
              <span className="opacity-50 uppercase tracking-widest">Influence:</span>
              <span className="text-[#00ff41]">{worldState.mysteriousInfluences[0] || 'None'}</span>
            </div>
          </Tooltip>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isTTSExhausted ? 'bg-red-500 animate-pulse' : 'bg-[#00ff41] shadow-[0_0_5px_#00ff41]'}`} />
              <span className={`text-[10px] uppercase tracking-tighter ${isTTSExhausted ? 'text-red-500' : 'text-[#00ff41]'}`}>
                {isTTSExhausted ? 'Neural Link Offline' : 'Neural Link Active'}
              </span>
              {isTTSExhausted && (
                <button 
                  onClick={() => setIsTTSExhausted(false)}
                  className="ml-2 px-1 border border-red-500/50 text-red-500 text-[8px] hover:bg-red-500/10 transition-colors"
                >
                  RECONNECT
                </button>
              )}
            </div>
            <button 
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`p-1 rounded hover:bg-[#00ff41]/10 transition-colors ${isSoundEnabled ? 'text-[#00ff41]' : 'text-red-500 opacity-50'}`}
              title={isSoundEnabled ? "Disable Sound" : "Enable Sound"}
            >
              {isSoundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 overflow-hidden">
        {/* Main Console */}
        <div className="flex-[2] flex flex-col border border-[#008f11]/30 bg-[#050505] rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,143,17,0.05)]">
          <div className="bg-[#008f11]/10 px-4 py-2 border-bottom border-[#008f11]/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold">
              <Terminal size={12} />
              Terminal Access v4.0.2
            </div>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-900/50" />
              <div className="w-2 h-2 rounded-full bg-yellow-900/50" />
              <div className="w-2 h-2 rounded-full bg-green-900/50" />
            </div>
          </div>
          
          <div 
            ref={scrollRef}
            className="flex-1 p-6 overflow-y-auto terminal-scroll space-y-4 font-mono text-sm md:text-base leading-relaxed"
          >
            <AnimatePresence initial={false}>
              {logs.map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex flex-col gap-1 ${
                    log.type === 'player' ? 'text-blue-400' : 
                    log.type === 'individual' ? 'text-purple-400 italic' : 
                    log.type === 'system' ? 'text-yellow-500 text-xs font-bold' : 'text-[#00ff41]'
                  }`}
                >
                  <div className="flex items-center gap-2 opacity-30 text-[10px]">
                    <span>[{log.timestamp}]</span>
                    <span className="uppercase tracking-tighter">{log.type}</span>
                    <button 
                      onClick={() => speakLog(log)}
                      className="hover:text-[#00ff41] transition-colors p-0.5 rounded hover:bg-[#00ff41]/10"
                      title="Replay Audio"
                    >
                      <Volume2 size={10} />
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap">
                    {log.type === 'player' ? (
                      `> ${log.text}`
                    ) : (
                      <TypewriterText 
                        text={log.text} 
                        audioContext={audioContext} 
                        isSoundEnabled={isSoundEnabled} 
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-[#00ff41] text-xs uppercase tracking-widest"
              >
                Processing dimensional shift...
              </motion.div>
            )}
          </div>

          <form 
            onSubmit={handleAction}
            className="p-4 border-t border-[#008f11]/30 bg-[#0a0a0a] flex items-center gap-4"
          >
            <span className="text-[#00ff41] font-bold animate-pulse">{'>'}</span>
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Enter action..."
              className="flex-1 bg-transparent border-none outline-none text-[#00ff41] placeholder-[#008f11]/30 font-mono"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="text-[#008f11] hover:text-[#00ff41] transition-colors disabled:opacity-30"
            >
              <Send size={20} />
            </button>
          </form>
        </div>

        {/* Sidebar / Inventory */}
        <div className="w-full md:w-80 flex flex-col gap-4 md:gap-6 overflow-y-auto pr-1 terminal-scroll shrink-0">
          {/* Session Management */}
          <div className="border border-[#008f11]/30 bg-[#050505] rounded-lg p-4 shadow-[0_0_15px_rgba(0,143,17,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest border-b border-[#008f11]/20 pb-2">
              <Database size={14} />
              Session Management
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={saveGame}
                className="flex items-center justify-center gap-2 py-2 bg-[#008f11]/10 text-[#00ff41] border border-[#008f11]/30 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-[#008f11]/20 transition-all"
              >
                <Save size={12} />
                Save
              </button>
              <button 
                onClick={loadGame}
                className="flex items-center justify-center gap-2 py-2 bg-[#008f11]/10 text-[#00ff41] border border-[#008f11]/30 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-[#008f11]/20 transition-all"
              >
                <RotateCcw size={12} />
                Load
              </button>
              <button 
                onClick={resetGame}
                className="col-span-2 py-1 bg-red-900/10 text-red-500 border border-red-500/30 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-red-900/20 transition-all mt-1"
              >
                Reset Session
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[8px] uppercase tracking-tighter opacity-40">
              <span>Auto-save Protocol:</span>
              <span className="text-[#00ff41] animate-pulse">Active (60s)</span>
            </div>
          </div>

          {/* Individuals Voice Config */}
          <div className="border border-purple-500/30 bg-[#050505] rounded-lg p-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest border-b border-purple-500/20 pb-2 text-purple-400">
              <Cpu size={14} />
              Neural Voice Profile
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-purple-400/50 uppercase">Individual A Frequency</label>
                <select 
                  value={individualVoiceA}
                  onChange={(e) => setIndividualVoiceA(e.target.value as any)}
                  className="bg-black border border-purple-500/30 text-purple-400 text-xs p-1 rounded outline-none focus:border-purple-400"
                >
                  <option value="Fenrir">Fenrir (Deep/Resonant)</option>
                  <option value="Charon">Charon (Ancient/Cold)</option>
                  <option value="Kore">Kore (Sharp/Clinical)</option>
                  <option value="Puck">Puck (Digital/Erratic)</option>
                  <option value="Zephyr">Zephyr (Neutral/Fluid)</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-purple-400/50 uppercase">Individual B Frequency</label>
                <select 
                  value={individualVoiceB}
                  onChange={(e) => setIndividualVoiceB(e.target.value as any)}
                  className="bg-black border border-purple-500/30 text-purple-400 text-xs p-1 rounded outline-none focus:border-purple-400"
                >
                  <option value="Fenrir">Fenrir (Deep/Resonant)</option>
                  <option value="Charon">Charon (Ancient/Cold)</option>
                  <option value="Kore">Kore (Sharp/Clinical)</option>
                  <option value="Puck">Puck (Digital/Erratic)</option>
                  <option value="Zephyr">Zephyr (Neutral/Fluid)</option>
                </select>
              </div>
              <p className="text-[9px] text-purple-400/40 italic">
                Adjusting the frequencies shifts the vocal manifestation of The Individuals.
              </p>
            </div>
          </div>

          {/* Dimensional Transmission */}
          <div className="border border-purple-500/30 bg-[#050505] rounded-lg p-4 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest border-b border-purple-500/20 pb-2 text-purple-400">
              <Zap size={14} />
              Dimensional Feed
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter">
                <span className="opacity-50">Neural Link:</span>
                <span className={isTTSExhausted ? 'text-red-500 animate-pulse' : 'text-[#00ff41]'}>
                  {isTTSExhausted ? 'OFFLINE' : 'STABLE'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] uppercase tracking-tighter">
                <span className="opacity-50">Visual Sync:</span>
                <button 
                  onClick={() => setUseStaticManifestation(!useStaticManifestation)}
                  className={`px-2 py-0.5 rounded border ${useStaticManifestation ? 'border-yellow-500/50 text-yellow-500' : 'border-[#00ff41]/50 text-[#00ff41]'}`}
                >
                  {useStaticManifestation ? 'STATIC (FREE)' : 'VEO (PAID)'}
                </button>
              </div>
              <div className="relative aspect-video bg-black rounded border border-purple-500/20 overflow-hidden flex items-center justify-center">
                {transmissionVideoUrl ? (
                  <video 
                    src={transmissionVideoUrl} 
                    autoPlay 
                    loop 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 grayscale contrast-125"
                  />
                ) : transmissionImageUrl ? (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <img 
                      src={transmissionImageUrl} 
                      className="w-full h-full object-cover opacity-60 grayscale contrast-125 animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
                  </div>
                ) : isGeneratingTransmission ? (
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    <div className="text-[8px] text-purple-400 font-bold tracking-widest animate-pulse">
                      {transmissionProgress}
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-purple-400/30 italic text-center p-4">
                    Feed Offline. Request briefing to manifest visual data.
                  </div>
                )}
                
                <div className="absolute top-2 right-2 z-10 text-[6px] text-purple-400 font-bold tracking-[0.3em] bg-black/40 px-1 rounded">
                  {transmissionVideoUrl ? "LIVE FEED" : "NO SIGNAL"}
                </div>
              </div>
              
              <button
                onClick={requestBriefing}
                disabled={isGeneratingTransmission}
                className="w-full py-2 bg-purple-900/20 text-purple-400 border border-purple-500/30 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-purple-900/40 transition-all disabled:opacity-50"
              >
                {isGeneratingTransmission ? 'Manifesting...' : 'Request Briefing'}
              </button>

              <div className="flex items-center justify-between px-1">
                <span className="text-[8px] text-purple-400/50 uppercase tracking-tighter">Static Mode (Free)</span>
                <button 
                  onClick={() => setUseStaticManifestation(!useStaticManifestation)}
                  className={`w-8 h-4 rounded-full relative transition-colors ${useStaticManifestation ? 'bg-purple-600' : 'bg-gray-800'}`}
                >
                  <motion.div 
                    animate={{ x: useStaticManifestation ? 16 : 2 }}
                    className="absolute top-1 left-0 w-2 h-2 bg-white rounded-full"
                  />
                </button>
              </div>

              <div className="text-[9px] text-purple-400/50 italic text-center leading-relaxed">
                Direct visual feed from the Individuals' primary dimension. {useStaticManifestation ? 'Static mode uses free-tier image generation.' : 'Video mode requires a paid API key.'}
              </div>
            </div>
          </div>

          <div className="border border-[#008f11]/30 bg-[#050505] rounded-lg p-4 shadow-[0_0_15px_rgba(0,143,17,0.05)]">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest border-b border-[#008f11]/20 pb-2">
              <Package size={14} />
              Inventory
            </div>
            <div className="space-y-2">
              {worldState.inventory.length > 0 ? (
                worldState.inventory.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 143, 17, 0.15)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(undefined, `use ${item}`)}
                    className="text-xs p-2 bg-[#008f11]/5 border border-[#008f11]/10 rounded cursor-pointer transition-colors group flex items-center justify-between"
                  >
                    <span>{item}</span>
                    <span className="text-[8px] opacity-0 group-hover:opacity-50 uppercase tracking-tighter">Click to use</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-[10px] opacity-30 italic">No items manifest.</div>
              )}
            </div>
          </div>

          <div className="border border-[#008f11]/30 bg-[#050505] rounded-lg p-4 shadow-[0_0_15px_rgba(0,143,17,0.05)] flex-1">
            <div className="flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest border-b border-[#008f11]/20 pb-2">
              <Shield size={14} />
              Influences
            </div>
            <div className="space-y-3">
              {worldState.mysteriousInfluences.map((inf, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="text-[10px] text-purple-400 uppercase font-bold">{inf}</div>
                  <div className="h-1 w-full bg-[#008f11]/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.random() * 100}%` }}
                      className="h-full bg-purple-500/50 shadow-[0_0_5px_rgba(168,85,247,0.5)]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Decoration */}
      <div className="mt-6 flex justify-between items-center text-[8px] uppercase tracking-[0.5em] opacity-20">
        <div>System: Stable</div>
        <div>Dimension: 0x4F-Alpha</div>
        <div>Observer: Active</div>
      </div>
    </div>
    </ErrorBoundary>
  );
}
