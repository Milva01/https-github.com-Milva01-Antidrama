import React, { useState, useEffect, useRef } from "react";
import { jsPDF } from "jspdf";
import {
  Sparkles,
  Trash2,
  Mic,
  MicOff,
  Send,
  Info,
  Zap,
  Target,
  AlertCircle,
  HelpCircle,
  Music,
  Share2,
  Play,
  Sliders,
  CheckCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Flame,
  Volume2,
  Bookmark,
  Settings,
  LifeBuoy,
  Compass,
  Activity,
  FileDown
} from "lucide-react";
import RobotSVG from "./components/RobotSVG";
import { Message, RobotState, RadarMetrics, AntidramaModes } from "./types";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, OperationType, handleFirestoreError } from "./firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInAnonymously,
  User as FirebaseUser,
  GithubAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { Cloud, LogOut, User as UserIcon, LogIn, Lock, Mail, RefreshCw, Github } from "lucide-react";

const COGNITIVE_GUIDES: Record<string, { title: string; subtitle: string; steps: string[] }> = {
  "Técnica de Descompresión Somática de Ira": {
    title: "Descompresión Somática de Ira",
    subtitle: "Acción inmediata para drenar la carga neuromuscular antes de reaccionar.",
    steps: [
      "Cierra los puños con máxima tensión durante 5 segundos reales.",
      "Suelta las manos repentinamente mientras dejas salir un soplido largo por la boca.",
      "Aleja tus manos del teclado o mouse, y ponte de pie durante 60 segundos.",
      "Registra mentalmente: el enojo es energía bioquímica efímera; no tomes decisiones en los próximos 15 minutos."
    ]
  },
  "Técnica de Enraizamiento Sensorial 5-4-3-2-1": {
    title: "Anclaje Sensorial 5-4-3-2-1",
    subtitle: "Desactiva la parálisis o el pánico interrumpiendo el bucle de pensamientos.",
    steps: [
      "Identifica 5 objetos factuales a tu alrededor en este instante.",
      "Toca 4 texturas físicas visibles (el borde de la mesa, tu ropa, la taza).",
      "Pon atención a 3 sonidos distintos de tu entorno actual.",
      "Percibe 2 olores que estén presentes en la habitación.",
      "Percibe 1 sabor en tu boca (o toma un trago de agua)."
    ]
  },
  "Técnica del Micro-Bloque: Regla de los 3 Minutos": {
    title: "La Regla de los 3 Minutos",
    subtitle: "Vence la parálisis por procrastinación o apatía reduciendo la fricción inicial.",
    steps: [
      "Elige la tarea pendiente y olvida el resultado final del proyecto entero.",
      "Establece una alarma de exactamente 3 minutos en tu reloj o teléfono.",
      "Trabaja con foco exclusivo en escribir solo una palabra, una línea de código o abrir un archivo.",
      "Al vencer la inercia, tienes absoluta libertad de parar si lo deseas (el 80% continúa)."
    ]
  },
  "Reencuadre de Perspectiva: Modo Supervivencia Amable": {
    title: "Modo Supervivencia Amable",
    subtitle: "Reducción de la auto-exigencia punitiva ante puntas de bajo estado de ánimo.",
    steps: [
      "Divide tus tareas y quita el 80% que es secundario o aplazable para mañana.",
      "Recuerda: 'Ninguno de nosotros está cuidando órganos vitales aquí; es solo software o celdas de cálculo'.",
      "Hazte un té o café caliente para brindarle calma de temperatura a tu cuerpo o lávate la cara con agua fría.",
      "Establece contacto con un compañero de trabajo o amigo de confianza con un saludo neutral."
    ]
  },
  "Filtro Cognitivo: Desaceleración y Límites": {
    title: "Establecimiento de Límites Operativos",
    subtitle: "Protección táctica de tu energía mental cuando te sientes agotado o quemado.",
    steps: [
      "Silencia notificaciones de Slack/Teams/Correo por un bloque cerrado de 15 a 30 minutos.",
      "Mantén la vista alejada de cualquier pantalla durante 3 minutos reales.",
      "Define una única acción de valor mínimo indispensable para cerrar el día.",
      "Declara mentalmente tu jornada cerrada al terminar ese micro-bloque."
    ]
  },
  "Defusión Cognitiva: Registro de Hechos vs Juicios": {
    title: "Filtro: Hechos vs. Juicios",
    subtitle: "Desarma el drama separando datos objetivos de interpretaciones subjetivas angustiantes.",
    steps: [
      "Escribe en tu mente el hecho objetivo estricto (ej. 'El cliente pidió cambiar la tipografía del botón').",
      "Identifica el juicio subjetivo / catastrófico (ej. 'El cliente piensa que mi trabajo es basura y me odian').",
      "Descarta el juicio cognitivo por falta de pruebas reales y quédate con el hecho fáctico.",
      "Responde exclusivamente al hecho directo de manera desapasionada."
    ]
  },
  "Timeboxing Operativo: Bloqueo de 20 Minutos": {
    title: "Bloqueo Absoluto de Foco (20 Minutos)",
    subtitle: "Domina el desbordamiento cerrando el grifo del multi-tasking compulsivo.",
    steps: [
      "Elige la única tarea urgente e indispensable de este bloque de tiempo.",
      "Cierra todas las pestañas de Chrome/Edge que no tengan relación inmediata con esa tarea.",
      "Coloca tu teléfono móvil boca abajo en modo No Molestar.",
      "Opera de forma continua y tranquila durante un solo bloque de 20 minutos completos."
    ]
  },
  "Suspiro Fisiológico de Rescate de 15 Segundos": {
    title: "Suspiro Fisiológico de Regulación",
    subtitle: "La herramienta fisiológica más rápida para desacelerar la respuesta autonómica de estrés.",
    steps: [
      "Toma una inhalación profunda y prolongada a través de la nariz.",
      "Inmediatamente, toma una segunda mini-inhalación rápida pulmonar para expandir los alvéolos al máximo.",
      "Exhala de forma pausada, suave y prolongada a través de la boca.",
      "Repite este ciclo dos veces más para restablecer tu frecuencia cardíaca."
    ]
  }
};

// Highly intuitive step-by-step parser that converts raw lines and steps into interactive checklist cards
function FormattedMessageText({ 
  text, 
  onOpenBreathingTool 
}: { 
  text: string; 
  onOpenBreathingTool?: () => void; 
}) {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const lines = text.split(/\n/);
  
  // Clean detection for breathing recommendations
  const containsBreathingCues = /respirar|respira|respiración|baja la tensión|bajar la tensión|bajar revoluciones|calma/i.test(text);
  
  return (
    <div className="space-y-3.5 font-sans leading-relaxed text-sm text-slate-100 mt-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }
        
        // Match lists starting with: "Paso 1:", "Paso X:", "1.", "- ", "•"
        const stepMatch = trimmed.match(/^(Paso\s+\d+|[•\-\*]|\d+\.|\d+\))\s*[:\-]?\s*(.*)/i);
        if (stepMatch) {
          const rawLabel = stepMatch[1];
          const bodyText = stepMatch[2];
          const isCompleted = completedSteps[idx] || false;
          
          return (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => toggleStep(idx)}
              className={`p-3.5 rounded-2xl border transition-all duration-350 cursor-pointer flex gap-3.5 items-start select-none group ${
                isCompleted 
                  ? "bg-slate-900/40 border-teal-950/20 text-slate-500 line-through filter grayscale-50 scale-[0.98] opacity-60"
                  : "bg-gradient-to-br from-slate-950/85 to-slate-900/60 border-slate-800/90 hover:border-teal-500/30 hover:from-slate-950 text-slate-200 shadow-md hover:shadow-teal-500/5 hover:-translate-y-0.5 active:scale-[0.99]"
              }`}
            >
              <div 
                className={`flex items-center justify-center h-5 w-5 rounded-lg border text-[9.5px] font-mono font-bold shrink-0 transition-all ${
                  isCompleted
                    ? "bg-teal-500/20 border-teal-500 text-[#2dd4bf] scale-110"
                    : "bg-slate-900 border-slate-700/80 text-[#2dd4bf] group-hover:border-[#2dd4bf] group-hover:bg-slate-850"
                }`}
              >
                {isCompleted ? "✓" : rawLabel.toLowerCase().includes("paso") ? rawLabel.replace(/paso\s+/i, "#") : "•"}
              </div>
              <div className="flex-1 text-[14px] leading-relaxed text-inherit font-sans font-medium">
                {bodyText}
              </div>
            </motion.div>
          );
        }
        
        // Regular line paragraphs, given high breathing line height
        return (
          <p key={idx} className="text-[14px] leading-relaxed text-slate-300 font-sans px-1">
            {trimmed}
          </p>
        );
      })}

      {onOpenBreathingTool && containsBreathingCues && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="mt-4 pt-3.5 border-t border-slate-900/70 flex flex-col gap-2"
        >
          <span className="text-[9.5px] font-mono text-[#2dd4bf] font-bold tracking-wider block">
            ⚡ RECURSO OPERATIVO DISPONIBLE
          </span>
          <button
            type="button"
            onClick={onOpenBreathingTool}
            className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-gradient-to-r from-teal-500/20 to-teal-400/10 hover:from-[#2dd4bf] hover:to-teal-400 hover:text-slate-950 border border-teal-500/30 text-[#2dd4bf] hover:shadow-[0_0_12px_rgba(45,212,191,0.2)] rounded-xl text-xs font-bold transition-all transform active:scale-[0.98] cursor-pointer group"
          >
            <Activity size={14} className="animate-pulse shrink-0 animate-bounce" style={{ animationDuration: '3s' }} />
            <span>Iniciar Suspiro Fisiológico (Alivio Emocional)</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

interface CenteringBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

function CenteringBreathingModal({ isOpen, onClose, onComplete }: CenteringBreathingModalProps) {
  const [phase, setPhase] = useState<"ready" | "inhale" | "double-inhale" | "hold" | "hold-empty" | "exhale" | "done">("ready");
  const [technique, setTechnique] = useState<"sigh" | "box" | "resonance">("sigh");
  const [timer, setTimer] = useState(4);
  const [cycle, setCycle] = useState(1);
  const [soundStyle, setSoundStyle] = useState<"rain" | "pad" | "flute" | "breath" | "mute">("breath");
  const soundRef = useRef<{ stop: () => void } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // High-fidelity natural organic/therapeutic sensory synthesizers inspired by premium breathing apps
  const playZenBowl = (type: "ready" | "inhale" | "double-inhale" | "hold" | "hold-empty" | "exhale" | "done", duration: number) => {
    if (soundStyle === "mute") return;
    if (type === "ready" || type === "done") return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = audioContextRef.current || new AudioCtxClass();
      if (!audioContextRef.current) {
        audioContextRef.current = audioCtx;
      }

      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      // Clear any prior active sounds
      stopSound();

      const now = audioCtx.currentTime;
      const activeNodes: any[] = [];

      if (soundStyle === "rain") {
        // --- Forest Rain & scattered dynamic droplets ---
        // Generates a soft, comforting brown noise that mimics gentle rainfall through a dense forest canopy
        const generatePinkNoiseBuffer = (ctx: AudioContext, secs: number) => {
          const bufferSize = ctx.sampleRate * secs;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 * 0.5362;
            data[i] *= 0.11; // Bring to gentle level
            b6 = white * 0.115926;
          }
          return buffer;
        };

        const buffer = generatePinkNoiseBuffer(audioCtx, duration);
        const noiseSrc = audioCtx.createBufferSource();
        noiseSrc.buffer = buffer;

        const noiseGain = audioCtx.createGain();
        const lpNoise = audioCtx.createBiquadFilter();
        lpNoise.type = "lowpass";

        // Dynamic wind-mesh sweeping through lowpass filter
        lpNoise.frequency.setValueAtTime(140, now);
        noiseGain.gain.setValueAtTime(0.0001, now);

        if (type === "inhale" || type === "double-inhale") {
          const peakGain = type === "double-inhale" ? 0.05 : 0.035;
          noiseGain.gain.linearRampToValueAtTime(peakGain, now + duration * 0.85);
          noiseGain.gain.linearRampToValueAtTime(peakGain * 0.7, now + duration);
          lpNoise.frequency.exponentialRampToValueAtTime(320, now + duration * 0.85);
        } else if (type === "hold" || type === "hold-empty") {
          noiseGain.gain.setValueAtTime(0.012, now);
          noiseGain.gain.linearRampToValueAtTime(0.012, now + duration);
          lpNoise.frequency.setValueAtTime(160, now);
        } else if (type === "exhale") {
          noiseGain.gain.setValueAtTime(0.04, now);
          noiseGain.gain.linearRampToValueAtTime(0.0001, now + duration);
          lpNoise.frequency.setValueAtTime(260, now);
          lpNoise.frequency.exponentialRampToValueAtTime(90, now + duration);
        }

        noiseSrc.connect(noiseGain);
        noiseGain.connect(lpNoise);
        lpNoise.connect(audioCtx.destination);
        noiseSrc.start(now);
        noiseSrc.stop(now + duration);
        activeNodes.push(noiseSrc);

        // Scattered raindrops: procedurally synthesize tiny raindrops falling on leaves
        const dropletCount = Math.floor(duration * 2.8);
        for (let i = 0; i < dropletCount; i++) {
          const dTime = now + Math.random() * (duration - 0.25);
          const dOsc = audioCtx.createOscillator();
          const dGain = audioCtx.createGain();
          const dLp = audioCtx.createBiquadFilter();

          dOsc.type = "sine";
          // Varied pitch mimicking droplets hitting different leaves
          dOsc.frequency.setValueAtTime(650 + Math.random() * 550, dTime);

          dGain.gain.setValueAtTime(0.0001, dTime);
          dGain.gain.linearRampToValueAtTime(0.006 + Math.random() * 0.004, dTime + 0.01);
          dGain.gain.exponentialRampToValueAtTime(0.0001, dTime + 0.07);

          dLp.type = "lowpass";
          dLp.frequency.setValueAtTime(1100, dTime);

          dOsc.connect(dGain);
          dGain.connect(dLp);
          dLp.connect(audioCtx.destination);

          dOsc.start(dTime);
          dOsc.stop(dTime + 0.12);
          activeNodes.push(dOsc);
        }

      } else if (soundStyle === "pad") {
        // --- Celestial Warm Ambient Pad (Solfeggio frequencies) ---
        // Organic analog-type chorus sound utilizing 3 detuned Solfeggio & heart frequencies
        // Inhale: F3 (174Hz - Security/Grounding). Hold: F#3 (185Hz). Exhale: A3 (220Hz - Deep Vagal release)
        let root = 220.0;
        if (type === "inhale" || type === "double-inhale") root = 174.61;
        else if (type === "hold" || type === "hold-empty") root = 185.0;

        const lpFilter = audioCtx.createBiquadFilter();
        lpFilter.type = "lowpass";
        lpFilter.frequency.setValueAtTime(280, now);
        lpFilter.connect(audioCtx.destination);

        const chordVoices = [
          root,
          root * 1.5, // Resonant perfect fifth
          root * 2.0, // Harmonious octave
        ];

        chordVoices.forEach((frequency) => {
          // Play detuned twin oscillators for each voice to get soft acoustic phasing / lush chorus
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const voiceGain = audioCtx.createGain();

          osc1.type = "sine";
          osc2.type = "sine";

          osc1.frequency.setValueAtTime(frequency, now);
          osc2.frequency.setValueAtTime(frequency * 1.005, now); // Soft beating chorus

          voiceGain.gain.setValueAtTime(0.0001, now);
          // Pure, slow swell: 1.5 seconds linear ramp to avoid any crackle / startle
          voiceGain.gain.linearRampToValueAtTime(0.035, now + 1.5);
          voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          osc1.connect(voiceGain);
          osc2.connect(voiceGain);
          voiceGain.connect(lpFilter);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + duration);
          osc2.stop(now + duration);

          activeNodes.push(osc1, osc2);
        });

        // Add soft sparkling stardust high reflection on peak double inhales / holds
        if (type === "double-inhale" || type === "hold" || type === "hold-empty") {
          const starOsc = audioCtx.createOscillator();
          const starGain = audioCtx.createGain();
          
          starOsc.type = "sine";
          starOsc.frequency.setValueAtTime(root * 4.0, now + 0.3); // High 2nd octave reflection

          starGain.gain.setValueAtTime(0.0001, now + 0.3);
          starGain.gain.linearRampToValueAtTime(0.008, now + 0.8);
          starGain.gain.exponentialRampToValueAtTime(0.0001, now + duration - 0.2);

          const starFilter = audioCtx.createBiquadFilter();
          starFilter.type = "bandpass";
          starFilter.frequency.setValueAtTime(root * 4.0, now);

          starOsc.connect(starGain);
          starGain.connect(starFilter);
          starFilter.connect(audioCtx.destination);

          starOsc.start(now + 0.3);
          starOsc.stop(now + duration);
          activeNodes.push(starOsc);
        }

      } else if (soundStyle === "flute") {
        // --- Shamanic Woodwind Flute & Jade Echo ---
        // Beautiful wood flute simulated via vibrating sine generator and soft breath noise
        const mainOsc = audioCtx.createOscillator();
        const mainGain = audioCtx.createGain();
        const fluteFilter = audioCtx.createBiquadFilter();

        fluteFilter.type = "lowpass";
        fluteFilter.frequency.setValueAtTime(650, now);
        fluteFilter.connect(audioCtx.destination);

        // Core Flute notes (inspired by tranquil indigenous melodies)
        // Inhale: F4 (349Hz). Double-Inhale: Ab4 (415Hz). Hold: Bb4 (466Hz). Exhale: Eb4 (311Hz)
        let note = 311.13;
        if (type === "inhale") note = 349.23;
        else if (type === "double-inhale") note = 415.30;
        else if (type === "hold" || type === "hold-empty") note = 466.16;

        mainOsc.type = "sine";
        mainOsc.frequency.setValueAtTime(note, now);

        // Soothing LFO creates a beautiful, emotional human hand-tremor (vibrato)
        const lfo = audioCtx.createOscillator();
        const lfoGain = audioCtx.createGain();
        lfo.frequency.setValueAtTime(4.2, now); // Sober LFO speed
        lfoGain.gain.setValueAtTime(1.8, now); // Sweet subtleness

        lfo.connect(lfoGain);
        lfoGain.connect(mainOsc.frequency);
        lfo.start(now);
        lfo.stop(now + duration);
        activeNodes.push(lfo);

        mainGain.gain.setValueAtTime(0.0001, now);
        mainGain.gain.linearRampToValueAtTime(0.045, now + 1.2);
        mainGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        mainOsc.connect(mainGain);
        mainGain.connect(fluteFilter);

        mainOsc.start(now);
        mainOsc.stop(now + duration);
        activeNodes.push(mainOsc);

        // Airy friction: Generate highpass filtered soft white noise mimicking air puff through wood
        const fSize = audioCtx.sampleRate * duration;
        const fBuffer = audioCtx.createBuffer(1, fSize, audioCtx.sampleRate);
        const fData = fBuffer.getChannelData(0);
        for (let j = 0; j < fSize; j++) {
          fData[j] = (Math.random() * 2 - 1) * 0.004; // Very faint
        }
        const airSrc = audioCtx.createBufferSource();
        airSrc.buffer = fBuffer;

        const airGain = audioCtx.createGain();
        const hpAir = audioCtx.createBiquadFilter();
        hpAir.type = "highpass";
        hpAir.frequency.setValueAtTime(1600, now);

        airGain.gain.setValueAtTime(0.0001, now);
        airGain.gain.linearRampToValueAtTime(0.02, now + 1.0);
        airGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        airSrc.connect(airGain);
        airGain.connect(hpAir);
        hpAir.connect(fluteFilter);

        airSrc.start(now);
        airSrc.stop(now + duration);
        activeNodes.push(airSrc);

        // Jade Echo: delayed perfect fifth whisper replicating cavern acoustics
        if (duration > 3) {
          const echoOsc = audioCtx.createOscillator();
          const echoGain = audioCtx.createGain();

          echoOsc.type = "sine";
          echoOsc.frequency.setValueAtTime(note * 1.5, now + 1.6); // perfect fifth above core note

          echoGain.gain.setValueAtTime(0.0001, now + 1.6);
          echoGain.gain.linearRampToValueAtTime(0.015, now + 2.4);
          echoGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          echoOsc.connect(echoGain);
          echoGain.connect(fluteFilter);

          echoOsc.start(now + 1.6);
          echoOsc.stop(now + duration);
          activeNodes.push(echoOsc);
        }
      } else if (soundStyle === "breath") {
        // --- Natural Respiration Guide ("Respiración en Reflejo") ---
        // Generates realistic inhalation and exhalation soundscapes using bandpass-filtered noise.
        const createWhiteNoiseBuffer = (ctx: AudioContext, secs: number) => {
          const bufferSize = ctx.sampleRate * secs;
          const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
          }
          return buffer;
        };

        const noiseBuffer = createWhiteNoiseBuffer(audioCtx, duration);
        const noiseSrc = audioCtx.createBufferSource();
        noiseSrc.buffer = noiseBuffer;

        const noiseGain = audioCtx.createGain();
        const bandpassFilter = audioCtx.createBiquadFilter();
        bandpassFilter.type = "bandpass";
        bandpassFilter.Q.setValueAtTime(3.0, now); // Voice throat-cavity resonance Q factor

        const lowpassFilter = audioCtx.createBiquadFilter();
        lowpassFilter.type = "lowpass";
        lowpassFilter.frequency.setValueAtTime(1200, now); // Soft cutoff of high harsh frequencies

        if (type === "inhale") {
          // Gracious sweep up representing expansion of lungs and throat cavity
          bandpassFilter.frequency.setValueAtTime(250, now);
          bandpassFilter.frequency.exponentialRampToValueAtTime(580, now + duration);
          
          noiseGain.gain.setValueAtTime(0.0001, now);
          noiseGain.gain.linearRampToValueAtTime(0.08, now + duration * 0.85);
          noiseGain.gain.linearRampToValueAtTime(0.05, now + duration);
        } else if (type === "double-inhale") {
          // Huberman double-inhale: two consecutive, rapid air sniffs
          // First sniff (from 0 to 1.1s)
          bandpassFilter.frequency.setValueAtTime(280, now);
          bandpassFilter.frequency.exponentialRampToValueAtTime(520, now + 0.8);
          bandpassFilter.frequency.setValueAtTime(520, now + 0.8);
          bandpassFilter.frequency.linearRampToValueAtTime(350, now + 1.1);

          noiseGain.gain.setValueAtTime(0.0001, now);
          noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.7);
          noiseGain.gain.linearRampToValueAtTime(0.015, now + 1.1);

          // Second sniff (from 1.1s to 2.0s)
          bandpassFilter.frequency.setValueAtTime(350, now + 1.15);
          bandpassFilter.frequency.exponentialRampToValueAtTime(750, now + 1.7);
          
          noiseGain.gain.setValueAtTime(0.015, now + 1.1);
          noiseGain.gain.linearRampToValueAtTime(0.12, now + 1.7);
          noiseGain.gain.linearRampToValueAtTime(0.05, now + 2.0);
        } else if (type === "hold" || type === "hold-empty") {
          // Silent holding, but with a highly relaxing, faint warm drone ("torso warmth") at 90Hz and 135Hz
          const droneOsc1 = audioCtx.createOscillator();
          const droneOsc2 = audioCtx.createOscillator();
          const droneGain = audioCtx.createGain();

          droneOsc1.type = "sine";
          droneOsc1.frequency.setValueAtTime(90, now);
          
          droneOsc2.type = "sine";
          droneOsc2.frequency.setValueAtTime(135, now);

          droneGain.gain.setValueAtTime(0.0001, now);
          droneGain.gain.linearRampToValueAtTime(0.015, now + 0.6);
          droneGain.gain.linearRampToValueAtTime(0.015, now + duration - 0.6);
          droneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

          droneOsc1.connect(droneGain);
          droneOsc2.connect(droneGain);
          droneGain.connect(audioCtx.destination);

          droneOsc1.start(now);
          droneOsc1.stop(now + duration);
          droneOsc2.start(now);
          droneOsc2.stop(now + duration);

          activeNodes.push(droneOsc1, droneOsc2);

          // Keep noise silent during hold
          noiseGain.gain.setValueAtTime(0.0, now);
        } else if (type === "exhale") {
          // Long relaxing release of air: warm sigh
          bandpassFilter.frequency.setValueAtTime(650, now);
          bandpassFilter.frequency.exponentialRampToValueAtTime(180, now + duration);

          noiseGain.gain.setValueAtTime(0.0001, now);
          noiseGain.gain.linearRampToValueAtTime(0.14, now + 0.4);
          noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        }

        // Hook up noise
        noiseSrc.connect(noiseGain);
        noiseGain.connect(bandpassFilter);
        bandpassFilter.connect(lowpassFilter);
        lowpassFilter.connect(audioCtx.destination);

        noiseSrc.start(now);
        noiseSrc.stop(now + duration);
        activeNodes.push(noiseSrc);
      }

      soundRef.current = {
        stop: () => {
          activeNodes.forEach((node) => {
            try {
              node.stop();
            } catch (err) {}
          });
        }
      };
    } catch (e) {
      console.warn("High-fidelity sound engine played warning", e);
    }
  };

  const stopSound = () => {
    if (soundRef.current) {
      try {
        soundRef.current.stop();
      } catch (e) {}
      soundRef.current = null;
    }
  };

  // Phase controller implementing physiological sigh Huberman cycle (Inhale 4s -> Double-Inhale 2s -> Hold 3s -> Exhale 7s)
  useEffect(() => {
    if (!isOpen) return;
    if (phase === "ready" || phase === "done") {
      stopSound();
      return;
    }

    const currentDuration = 
      phase === "inhale" ? (technique === "resonance" ? 5 : 4) : 
      phase === "double-inhale" ? 2 : 
      phase === "hold" ? (technique === "box" ? 4 : 3) : 
      phase === "hold-empty" ? 4 :
      phase === "exhale" ? (technique === "resonance" ? 5 : technique === "box" ? 4 : 7) : 4;

    playZenBowl(phase, currentDuration);

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          if (technique === "sigh") {
            if (phase === "inhale") {
              setPhase("double-inhale");
              return 2;
            } else if (phase === "double-inhale") {
              setPhase("hold");
              return 3;
            } else if (phase === "hold") {
              setPhase("exhale");
              return 7;
            } else if (phase === "exhale") {
              if (cycle >= 6) {
                onComplete();
                setPhase("done");
                return 0;
              } else {
                setCycle((c) => c + 1);
                setPhase("inhale");
                return 4;
              }
            }
          } else if (technique === "box") {
            if (phase === "inhale") {
              setPhase("hold");
              return 4;
            } else if (phase === "hold") {
              setPhase("exhale");
              return 4;
            } else if (phase === "exhale") {
              setPhase("hold-empty");
              return 4;
            } else if (phase === "hold-empty") {
              if (cycle >= 6) {
                onComplete();
                setPhase("done");
                return 0;
              } else {
                setCycle((c) => c + 1);
                setPhase("inhale");
                return 4;
              }
            }
          } else if (technique === "resonance") {
            if (phase === "inhale") {
              setPhase("exhale");
              return 5;
            } else if (phase === "exhale") {
              if (cycle >= 6) {
                onComplete();
                setPhase("done");
                return 0;
              } else {
                setCycle((c) => c + 1);
                setPhase("inhale");
                return 5;
              }
            }
          }
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopSound();
    };
  }, [phase, cycle, isOpen, technique]);

  // Reset variables upon opening/closing
  useEffect(() => {
    if (!isOpen) {
      setPhase("ready");
      setCycle(1);
      setTimer(4);
      stopSound();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPhaseColorAndText = () => {
    switch (phase) {
      case "ready":
        if (technique === "sigh") {
          return {
            title: "Suspiro Fisiológico Cíclico",
            subtitle: "Descompresión Emocional Rápida",
            text: "El Suspiro Fisiológico es la herramienta biológica más veloz para apagar la sobrecarga y regular el sistema nervioso. Consiste en dos inhalaciones seguidas y una exhalación profunda prolongada.",
            color: "border-teal-500/50 text-teal-300",
            bgGlow: "bg-teal-500/5",
            scale: 1.0,
            label: "Comenzar",
          };
        } else if (technique === "box") {
          return {
            title: "Respiración Cuadrada (Box Breathing)",
            subtitle: "Foco Operativo y Calma Bajo Presión",
            text: "Estándar utilizado por las fuerzas especiales para el enfoque operativo continuo. Nivela el sistema simpático y parasimpático dividiendo el ciclo en 4 fases idénticas de 4 segundos.",
            color: "border-indigo-500/50 text-indigo-300",
            bgGlow: "bg-indigo-500/5",
            scale: 1.0,
            label: "Comenzar",
          };
        } else {
          return {
            title: "Respiración de Resonancia",
            subtitle: "Coherencia Cardíaca y Estabilidad HRV",
            text: "Optimiza la variabilidad del ritmo cardíaco (HRV). Consiste en inhalar suavemente durante 5s y exhalar suavemente durante 5s (6 respiraciones por minuto) de forma rítmica.",
            color: "border-emerald-500/50 text-emerald-300",
            bgGlow: "bg-emerald-500/5",
            scale: 1.0,
            label: "Comenzar",
          };
        }
      case "inhale":
        if (technique === "resonance") {
          return {
            title: "1. INHALACIÓN DE RESONANCIA",
            subtitle: "Inhalá suavemente (5 seg)",
            text: "Inhalá de manera uniforme, sintiendo cómo se expande el torso con total calma.",
            color: "border-emerald-400/60 text-emerald-300",
            bgGlow: "bg-emerald-500/15 shadow-[0_0_40px_rgba(52,211,153,0.3)]",
            scale: 1.5,
            label: "INHALÁ SUAVE",
          };
        } else {
          return {
            title: technique === "box" ? "1. INHALACIÓN CONSTANTE" : "1. INHALACIÓN DE ANCLAJE",
            subtitle: "Llená tus pulmones por la nariz (4 seg)",
            text: technique === "box" ? "Inhalá lento y constante. Expandí tu abdomen." : "Inhalá constante y profundamente. Sentí el apoyo estable en tu cuerpo.",
            color: "border-teal-400/60 text-teal-300",
            bgGlow: "bg-teal-500/15 shadow-[0_0_40px_rgba(45,212,191,0.3)]",
            scale: 1.4,
            label: "INHALÁ",
          };
        }
      case "double-inhale":
        return {
          title: "2. MICRO-SUSPIRO DE REFUERZO",
          subtitle: "Un sorbo rápido extra de aire (2 seg)",
          text: "¡Inhalá fuerte una vez más! Forzás la expansión alveolar total para desgasificar instantáneamente el sistema.",
          color: "border-indigo-400/70 text-indigo-300",
          bgGlow: "bg-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.4)] animate-pulse",
          scale: 1.7,
          label: "¡SUSPIRÁ MÁS!",
        };
      case "hold":
        return {
          title: technique === "box" ? "2. RETENCIÓN CON PULMÓN LLENO" : "3. RETENCIÓN EN CALMA",
          subtitle: technique === "box" ? "Sostené en serenidad (4 seg)" : "Sostené en pleno vacío (3 seg)",
          text: technique === "box" ? "Sostené con el torso expandido, manteniendo la mente imperecedera y quieta." : "Cerrá levemente la glotis. Dejá que el aire absorbido asiente el ritmo cardíaco.",
          color: "border-amber-400/60 text-amber-300",
          bgGlow: "bg-amber-500/10 shadow-[0_0_35px_rgba(245,158,11,0.25)]",
          scale: 1.5,
          label: "RETENÉ",
        };
      case "hold-empty":
        return {
          title: "4. RETENCIÓN CON PULMÓN VACÍO",
          subtitle: "Sostené sin aire (4 seg)",
          text: "Vacío pacífico. Dejá que el cuerpo asimile el silencio respiratorio absoluto en calma.",
          color: "border-rose-400/60 text-rose-300",
          bgGlow: "bg-rose-500/10 shadow-[0_0_35px_rgba(244,63,94,0.25)]",
          scale: 0.8,
          label: "RETENÉ VACÍO",
        };
      case "exhale":
        if (technique === "resonance") {
          return {
            title: "2. EXHALACIÓN CONTINUA",
            subtitle: "Soltá el aire con suavidad (5 seg)",
            text: "Exhalá largo, sin esfuerzo y de forma uniforme, logrando coherencia cardíaca instantánea.",
            color: "border-emerald-500/50 text-emerald-300",
            bgGlow: "bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
            scale: 0.9,
            label: "EXHALÁ SUAVE",
          };
        } else {
          return {
            title: technique === "box" ? "3. EXHALACIÓN ESTABLE" : "4. EXHALACIÓN LIBERADORA",
            subtitle: technique === "box" ? "Vaciá con total control (4 seg)" : "Soltá el aire por la boca (7 seg)",
            text: technique === "box" ? "Exhalá de manera uniforme y constante, liberando el torso por completo." : "Soltá el aire lenta y ruidosamente. Dejá caer los hombros, liberá la mandíbula y vaciá cada tensión.",
            color: "border-emerald-500/50 text-emerald-300",
            bgGlow: "bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.15)]",
            scale: 0.9,
            label: "EXHALÁ",
          };
        }
      case "done":
        if (technique === "box") {
          return {
            title: "ENFOQUE OPERATIVO LOGRADO",
            subtitle: "Eje de calma nivelado",
            text: "Mente quieta y centrada. Tu sistema nervioso ha ingresado a la zona de alto desempeño operativo con serenidad.",
            color: "border-teal-400/50 text-white",
            bgGlow: "bg-teal-500/20 shadow-[0_0_40px_rgba(45,212,191,0.35)]",
            scale: 1.1,
            label: "¡COMPLETO!",
          };
        } else if (technique === "resonance") {
          return {
            title: "COHERENCIA DE RESONANCIA LOGRADA",
            subtitle: "Armonía emocional recuperada",
            text: "Frecuencia cardíaca sintonizada. Has optimizado tu HRV, fortaleciendo tu calma para el resto del día.",
            color: "border-emerald-400/50 text-white",
            bgGlow: "bg-emerald-500/20 shadow-[0_0_40px_rgba(52,211,153,0.35)]",
            scale: 1.1,
            label: "¡COMPLETO!",
          };
        } else {
          return {
            title: "AUTORREGULACIÓN LOGRADA",
            subtitle: "Eje biográfico recuperado",
            text: "Coherencia vagal reestablecida de forma exitosa. Sentí el cuerpo libre de rigidez. Estás de vuelta en tu centro operativo, listo para decidir con calma.",
            color: "border-emerald-400/50 text-white",
            bgGlow: "bg-emerald-500/20 shadow-[0_0_40px_rgba(52,211,153,0.35)]",
            scale: 1.1,
            label: "¡COMPLETO!",
          };
        }
    }
  };

  const config = getPhaseColorAndText();

  const handleStart = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = audioContextRef.current || new AudioCtxClass();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === "suspended") {
          audioCtx.resume();
        }
      }
    } catch (err) {
      console.warn("Starting audio engine warning:", err);
    }
    setPhase("inhale");
    setTimer(technique === "resonance" ? 5 : 4);
    setCycle(1);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 select-none">
        {/* Dark fuzzy overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 35 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 25 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative bg-gradient-to-br from-[#0a0f1d] to-[#11192d] border border-teal-500/30 rounded-3xl p-6 w-full max-w-sm shadow-[0_25px_60px_rgba(45,212,191,0.15)] overflow-hidden text-center flex flex-col items-center"
        >
          {/* Top bright tech accent */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-teal-500/10 via-teal-400/60 to-indigo-500/10" />

          {/* Action Header */}
          <div className="w-full flex justify-between items-center mb-4 text-slate-400">
            <button
              onClick={() => {
                if (soundStyle === "mute") {
                  setSoundStyle("breath");
                } else {
                  setSoundStyle("mute");
                  stopSound();
                }
              }}
              className="p-2 bg-slate-900/70 hover:bg-slate-850 rounded-xl border border-slate-800 text-slate-200 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-mono shadow-inner"
              title="Activar/desactivar audio guía"
            >
              {soundStyle === "mute" ? (
                <>
                  <Volume2 size={13} className="text-rose-400 opacity-80 animate-pulse" />
                  <span className="text-rose-400 font-bold">MUDO</span>
                </>
              ) : (
                <>
                  <Volume2 size={13} className="text-[#2dd4bf] animate-bounce" />
                  <span className="text-teal-400 font-bold">BIO-AUDIO ACTIVO</span>
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="text-[10px] font-mono hover:text-[#2dd4bf] transition-all bg-slate-900/50 hover:bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800/80 cursor-pointer text-slate-400 font-bold"
            >
              SALIR ×
            </button>
          </div>

          <span className="text-[8.5px] font-mono text-teal-400 font-bold uppercase tracking-widest block mb-1">
            MECANISMO ANTIDRAMA BIOLÓGICO
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight leading-none mb-1">
            {config.title}
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mb-6 uppercase tracking-wider">
            {config.subtitle}
          </p>

          {/* Premium Rippling Breathing Bubble Visualizer */}
          <div className="h-44 w-full flex items-center justify-center mb-6 relative">
            {/* Dynamic Outer Glow rings */}
            <motion.div
              animate={{
                scale: phase === "ready" || phase === "done" ? 1.0 : config.scale * 1.25,
                opacity: phase === "ready" || phase === "done" ? 0.2 : [0.15, 0.45, 0.15],
              }}
              transition={{
                duration: 
                  phase === "inhale" ? 4 : 
                  phase === "double-inhale" ? 2 : 
                  phase === "hold" ? 3 : 7,
                repeat: phase === "ready" || phase === "done" ? 0 : Infinity,
                ease: "easeInOut",
              }}
              className={`absolute rounded-full w-28 h-28 ${config.bgGlow} transition-all duration-1000 -z-10`}
            />

            {/* Rippling extra shadow aura */}
            {phase !== "ready" && phase !== "done" && (
              <motion.div
                animate={{
                  scale: [1, config.scale * 1.1, 1],
                  opacity: [0.1, 0.25, 0.1],
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className={`absolute rounded-full w-36 h-36 border border-teal-500/5 -z-10`}
              />
            )}

            {/* Inner Core Expander */}
            <motion.div
              animate={{
                scale: phase === "ready" || phase === "done" ? 1.0 : config.scale,
                borderWidth: phase === "ready" || phase === "done" ? "1px" : "3.5px",
              }}
              transition={{
                duration: 
                  phase === "inhale" ? (technique === "resonance" ? 5 : 4) : 
                  phase === "double-inhale" ? 2 : 
                  phase === "hold" ? (technique === "box" ? 4 : 3) : 
                  phase === "hold-empty" ? 4 :
                  phase === "exhale" ? (technique === "resonance" ? 5 : technique === "box" ? 4 : 7) : 4,
                ease: "easeInOut",
              }}
              className={`w-28 h-28 rounded-full border border-teal-500/30 bg-slate-950/95 flex flex-col items-center justify-center transition-all duration-1000 ${config.color} relative shadow-[inset_0_2px_12px_rgba(0,0,0,0.85),0_0_25px_rgba(45,212,191,0.1)]`}
            >
              {phase === "ready" && (
                <Activity size={26} className="text-[#2dd4bf] animate-pulse" />
              )}

              {phase === "done" && (
                <CheckCircle size={26} className="text-[#2dd4bf] animate-bounce" />
              )}

              {phase !== "ready" && phase !== "done" && (
                <div className="flex flex-col items-center justify-center select-none">
                  <span className="text-3xl font-mono font-black tracking-tighter leading-none">
                    {timer}
                  </span>
                  <span className="text-[7.5px] font-mono text-slate-400 mt-0.5 uppercase tracking-widest font-black">
                     segundos
                  </span>
                </div>
              )}

              {/* Float stage label */}
              {phase !== "ready" && phase !== "done" && (
                <div className="absolute -bottom-7 bg-slate-900/90 text-[7px] text-teal-400 font-mono font-bold tracking-widest uppercase px-2.5 py-1 rounded-full border border-teal-500/30 shadow">
                  {config.label}
                </div>
              )}
            </motion.div>
          </div>

          {/* Description Text block */}
          <div className="px-2 min-h-[55px] mb-4 flex items-center justify-center">
            <p className="text-[12px] leading-relaxed text-slate-300 font-sans font-medium text-center">
              {config.text}
            </p>
          </div>

          {/* Sensory Sound Options */}
          <div className="w-full bg-slate-950/60 p-2.5 rounded-2xl border border-slate-900/90 mb-5 text-left shadow-inner">
            <span className="text-[8.5px] font-mono tracking-wider text-teal-400 uppercase block mb-1.5 font-bold">
              ESTILO DE GUÍA AUDITIVA DE ALIVIO:
            </span>
            <div className="grid grid-cols-5 gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setSoundStyle("breath");
                  if (phase === "ready" || phase === "done") {
                    setTimeout(() => {
                      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
                      audioContextRef.current = ctx;
                      playZenBowl("inhale", 4);
                    }, 20);
                  }
                }}
                className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                  soundStyle === "breath"
                    ? "bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/35 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                Reflejo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoundStyle("rain");
                  if (phase === "ready" || phase === "done") {
                    setTimeout(() => {
                      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
                      audioContextRef.current = ctx;
                      playZenBowl("inhale", 4);
                    }, 20);
                  }
                }}
                className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                  soundStyle === "rain"
                    ? "bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/35 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                Lluvia
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoundStyle("pad");
                  if (phase === "ready" || phase === "done") {
                    setTimeout(() => {
                      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
                      audioContextRef.current = ctx;
                      playZenBowl("inhale", 4);
                    }, 20);
                  }
                }}
                className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                  soundStyle === "pad"
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/35 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                Atmo
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoundStyle("flute");
                  if (phase === "ready" || phase === "done") {
                    setTimeout(() => {
                      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
                      audioContextRef.current = ctx;
                      playZenBowl("inhale", 4);
                    }, 20);
                  }
                }}
                className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                  soundStyle === "flute"
                    ? "bg-teal-500/20 text-[#2dd4bf] border border-teal-500/35 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                Flauta
              </button>
              <button
                type="button"
                onClick={() => {
                  setSoundStyle("mute");
                  stopSound();
                }}
                className={`py-1.5 rounded-lg text-[9px] font-mono font-bold uppercase transition-all cursor-pointer text-center ${
                  soundStyle === "mute"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-inner"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                Mudo
              </button>
            </div>
          </div>

          <div className="w-full space-y-3">
            {phase === "ready" && (
              <>
                {/* Scientific Technique Selector */}
                <div className="w-full bg-slate-950/60 p-2.5 rounded-2xl border border-slate-900/90 mb-2 text-left shadow-inner">
                  <span className="text-[8.5px] font-mono tracking-wider text-teal-400 uppercase block mb-1.5 font-bold">
                    SELECCIONAR TÉCNICA CLÍNICA:
                  </span>
                  <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-0.5 rounded-xl border border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setTechnique("sigh")}
                      className={`py-2 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer text-center ${
                        technique === "sigh"
                          ? "bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/35 shadow-inner"
                          : "text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      Suspiro Cíclico
                    </button>
                    <button
                      type="button"
                      onClick={() => setTechnique("box")}
                      className={`py-2 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer text-center ${
                        technique === "box"
                          ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/35 shadow-inner"
                          : "text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      Caja (Box)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTechnique("resonance")}
                      className={`py-2 rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer text-center ${
                        technique === "resonance"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 shadow-inner"
                          : "text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      Resonancia
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full py-3.5 px-4 bg-[#2dd4bf] hover:bg-teal-300 text-slate-950 rounded-2xl text-[10.5px] font-black shadow-[0_5px_18px_rgba(45,212,191,0.3)] hover:shadow-[0_6px_25px_rgba(45,212,191,0.45)] transition-all cursor-pointer transform active:scale-95 flex items-center justify-center gap-1.5 tracking-wider uppercase"
                >
                  <Play size={13} fill="currentColor" />
                  <span>
                    {technique === "sigh" && "INICIAR SUSPIRO REGULADOR"}
                    {technique === "box" && "INICIAR RESPIRACIÓN CUADRADA"}
                    {technique === "resonance" && "INICIAR RESONANCIA COHERENTE"}
                  </span>
                </button>
              </>
            )}

            {phase !== "ready" && phase !== "done" && (
              <div className="space-y-3">
                {/* Dynamic Step indicators based on technique */}
                {technique === "sigh" && (
                  <div className="grid grid-cols-4 gap-1.5 text-[7px] font-mono font-bold text-slate-500 px-1 mb-1">
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "inhale" ? "border-teal-400 text-teal-400 font-extrabold" : "border-slate-800"}`}>1. INHALAR (4s)</div>
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "double-inhale" ? "border-indigo-400 text-indigo-400 font-extrabold" : "border-slate-800"}`}>2. SUSPIRAR (2s)</div>
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "hold" ? "border-amber-400 text-amber-400 font-extrabold" : "border-slate-800"}`}>3. RETENER (3s)</div>
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "exhale" ? "border-emerald-400 text-emerald-400 font-extrabold" : "border-slate-800"}`}>4. EXHALAR (7s)</div>
                  </div>
                )}
                {technique === "box" && (
                  <div className="grid grid-cols-4 gap-1.5 text-[7px] font-mono font-bold text-slate-500 px-1 mb-1">
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "inhale" ? "border-teal-400 text-teal-400 font-extrabold" : "border-slate-800"}`}>1. INHALAR (4s)</div>
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "hold" ? "border-amber-400 text-amber-400 font-extrabold" : "border-slate-800"}`}>2. RETENER (4s)</div>
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "exhale" ? "border-emerald-400 text-emerald-400 font-extrabold" : "border-slate-800"}`}>3. EXHALAR (4s)</div>
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "hold-empty" ? "border-rose-400 text-rose-400 font-extrabold" : "border-slate-800"}`}>4. VACÍO (4s)</div>
                  </div>
                )}
                {technique === "resonance" && (
                  <div className="grid grid-cols-2 gap-1.5 text-[8px] font-mono font-bold text-slate-500 px-1 mb-1">
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "inhale" ? "border-emerald-400 text-emerald-400 font-extrabold" : "border-slate-800"}`}>1. INHALACIÓN CON CALMA (5s)</div>
                    <div className={`py-1 border-b-2 text-center transition-all ${phase === "exhale" ? "border-emerald-400 text-emerald-400 font-extrabold" : "border-slate-800"}`}>2. EXHALACIÓN CON CALMA (5s)</div>
                  </div>
                )}

                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 flex justify-between items-center px-3.5">
                  <span className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    Bucle regulador:
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <span
                        key={num}
                        className={`w-2 h-2 rounded-full border transition-all ${
                          num < cycle
                            ? "bg-emerald-400 border-emerald-400"
                            : num === cycle
                            ? "bg-teal-400 border-teal-400 animate-pulse scale-110"
                            : "bg-slate-950 border-slate-800/85"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPhase("ready")}
                  className="w-full py-2.5 px-4 bg-slate-900 text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Frenar y Reiniciar
                </button>
              </div>
            )}

            {phase === "done" && (
              <div className="space-y-4">
                <p className="text-[9.5px] font-mono text-[#2dd4bf] uppercase font-black animate-pulse">
                  ✓ Descompresión vágica y alveolar completada
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    setPhase("ready");
                    onClose();
                  }}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500 text-slate-950 rounded-2xl text-xs font-bold hover:shadow-[0_4px_18px_rgba(45,212,191,0.3)] transition-all cursor-pointer transform active:scale-95 tracking-wide"
                >
                  VOLVER AL FOCO DIRECTO
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Constant starting state
const DEFAULT_METRICS: RadarMetrics = {
  saturacion: 75,
  foco: 30,
  energia: 45
};

// Initial welcome messages matching the exact voice and structure
const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome-1",
    sender: "bot",
    text: "Hola. Soy ANTIDRAMA, tu Yo Auxiliar en la toma de dirección. Vamos a sintonizar tu atención para recuperar claridad y foco.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    radarSnapshot: DEFAULT_METRICS
  },
  {
    id: "welcome-2",
    sender: "bot",
    text: "Paso 1: Contame qué situación o tarea te está costando procesar en este momento.\n\nPaso 2: Validamos la emoción y definimos una acción enraizada para avanzar en los próximos 5 minutos.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    radarSnapshot: DEFAULT_METRICS
  }
];

interface ChipConfig {
  label: string;
  simulatedText: string;
}

const getAdaptedChipData = (
  type: "ira" | "miedo" | "desmotivacion" | "bajon",
  history: Message[],
  modes: AntidramaModes
): ChipConfig => {
  // Join last 6 messages to scan for broad themes in user or model messages
  const textToScan = history
    .slice(-6)
    .map((m) => m.text.toLowerCase())
    .join(" ");

  // Check themes
  const hasExhaustion = /cansad|agotad|quemad|burnout|sueñ|dormir|bater|fatig|reserva|fuerza|colaps|pausa|frito/.test(textToScan);
  const hasConflict = /jefe|jefa|colaborador|colega|tóxic|toxic|reuni|discut|pelea|feedback|mail|slack|comentario|dijo|pasivo/.test(textToScan);
  const hasOverwhelm = /tarde|urgent|deadline|fecha|entrega|tiempo|retras|reloj|incendi|ayer|rápido|rapido/.test(textToScan);

  let themeContext = "";
  if (hasExhaustion) {
    themeContext = "Me siento sumamente cansado, agotado y al límite de mis reservas físicas y mentales en la oficina.";
  } else if (hasConflict) {
    themeContext = "Acabo de tener una fricción, comentario molesto o conflicto laboral irritante en el equipo.";
  } else if (hasOverwhelm) {
    themeContext = "Estoy desbordado con plazos de entrega acumulados, urgencias y caos operativo encima.";
  }

  // 1. Get dynamic labels to provide instant high-fidelity feedback
  const parts = [];
  if (modes.rescate) parts.push("SOS 🚨");
  if (modes.foco) parts.push("Foco 🎯");
  if (modes.humor) parts.push("Humor 🌶️");

  let label = "";
  if (type === "ira") {
    label = parts.length > 0 ? `Ira: ${parts.join(" + ")}` : "Peligro Explosivo";
  } else if (type === "miedo") {
    label = parts.length > 0 ? `Miedo: ${parts.join(" + ")}` : "Miedo y Terror";
  } else if (type === "desmotivacion") {
    label = parts.length > 0 ? `Apatía: ${parts.join(" + ")}` : "Desmotivación";
  } else if (type === "bajon") {
    label = parts.length > 0 ? `Bajón: ${parts.join(" + ")}` : "Bajón";
  }

  // 2. Assemble dynamic simulatedText request based on type + modes
  let simulatedText = "";

  if (type === "ira") {
    simulatedText = `¡PELIGRO EXPLOSIVO! Siento una ira o frustración tremenda. ${themeContext}`;
    
    if (modes.rescate) {
      simulatedText += ` Necesito SOS RESCATE: brindame urgentemente un ejercicio físico/somático de descompresión (como apretar puños, movimientos de hombros o agua fría) y pasos inmediatos para vaciar la adrenalina del cuerpo y evitar contestar de forma destructiva.`;
    }
    if (modes.foco) {
      simulatedText += ` Necesito MODO FOCO: ayudame a racionalizar esta bronca de forma fría y pragmática, dándome un plan inmediato de bloqueo de 20 minutos para canalizar esta energía con la respiración cuadrada.`;
    }
    if (modes.humor) {
      simulatedText += ` Necesito HUMOR ÁCIDO: dame un reencuadre sarcástico y divertido sobre lo absurda y tragicómica que es la situación de oficina, ayudándome a reírme de la solemnidad rígida del laburo corporativo.`;
    }
    if (!modes.rescate && !modes.foco && !modes.humor) {
      simulatedText += ` Ofreceme ejercicios de descompresión somática básicos, humor para calmar la calentura y pautas prácticas directas para desactivar este enojo ahora mismo.`;
    }
  }

  else if (type === "miedo") {
    simulatedText = `¡MIEDO Y TERROR! Siento pánico laboral, nudo en el pecho o parálisis analítica de no saber cómo avanzar. ${themeContext}`;
    
    if (modes.rescate) {
      simulatedText += ` Necesito SOS RESCATE: enseñame la técnica de enraizamiento sensorial 5-4-3-2-1 u otra herramienta física somática urgente para disolver el nudo del pánico en el pecho y estabilizar mis latidos.`;
    }
    if (modes.foco) {
      simulatedText += ` Necesito MODO FOCO: ayudame a racionalizar los peores escenarios objetivos, separando hechos de fantasías catastróficas, y ordename un micro-bloque de 3 minutos para iniciar con un solo paso ínfimo.`;
    }
    if (modes.humor) {
      simulatedText += ` Necesito HUMOR ÁCIDO: desdramatizá con humor inteligente esta parálisis sobre la entrega. Recordame de forma irónica que no estamos operando cerebros a corazón abierto, sino haciendo tareas de oficina cotidianas.`;
    }
    if (!modes.rescate && !modes.foco && !modes.humor) {
      simulatedText += ` Brindame soluciones de realidad objetiva pragmáticas, respuestas lógicas y ejercicios somáticos breves para desactivar el terror a fallar.`;
    }
  }

  else if (type === "desmotivacion") {
    simulatedText = `¡DESMOTIVACIÓN! Siento una apatía completa, letargo mental procastinador y falta total de fuerzas. ${themeContext}`;
    
    if (modes.rescate) {
      simulatedText += ` Necesito SOS RESCATE: brindame una técnica corporal simple para reactivar la circulación sanguínea de inmediato, vencer la inercia física y desperezar el cuerpo alejado de las pantallas.`;
    }
    if (modes.foco) {
      simulatedText += ` Necesito MODO FOCO: guíame con un timeboxing estricto o regla de los 3 minutos ridículamente simples para arrancar con el foco puesto en completar una única micro-acción que de verdad avanza y que dependa 100% de mí.`;
    }
    if (modes.humor) {
      simulatedText += ` Necesito HUMOR ÁCIDO: hacé un comentario agudo y sarcástico sobre lo poco motivante que es a veces cumplir con metas del sistema corporativo y cómo reírse de esto nos devuelve el humor y las ganas de avanzar.`;
    }
    if (!modes.rescate && !modes.foco && !modes.humor) {
      simulatedText += ` Ofreceme ideas de movilización corporal sutil y pautas mínimas para conectar suavemente con la acción y encender de nuevo la chispa.`;
    }
  }

  else if (type === "bajon") {
    simulatedText = `¡BAJÓN ACTIVO! Sabor amargo, desánimo generalizado y energía anímica muy decaída. ${themeContext}`;
    
    if (modes.rescate) {
      simulatedText += ` Necesito SOS RESCATE: proponeme un tierno ejercicio de centro o autocuidado somático (como respiración de resonancia 5s/5s) y una bebida cálida para brindar confort a mis receptores antes que nada.`;
    }
    if (modes.foco) {
      simulatedText += ` Necesito MODO FOCO: activá el Modo Supervivencia Amable y dividí mis tareas quitando el 80% de exigencia punitiva innecesaria. Señalame el valor de la tarea mínima legalmente indispensable para terminar el día.`;
    }
    if (modes.humor) {
      simulatedText += ` Necesito HUMOR ÁCIDO: dame un reencuadre cognitivo reconfortante pero con un poco de humor inteligente y amable sobre lo absurdo de presionarse de más cuando el cuerpo pide tregua.`;
    }
    if (!modes.rescate && !modes.foco && !modes.humor) {
      simulatedText += ` Dame contención sincera, tácticas suaves de autocuidado y un sutil guiño de humor regulador para cambiar el clima del pecho.`;
    }
  }

  return { label, simulatedText };
};

const getChipIcon = (
  type: "ira" | "miedo" | "desmotivacion" | "bajon",
  modes: AntidramaModes
) => {
  const iconSize = 13;
  if (type === "ira") {
    if (modes.rescate) {
      return <Flame size={iconSize} className="animate-bounce text-rose-300 drop-shadow-[0_0_3px_rgba(244,63,94,0.6)]" />;
    }
    return <Flame size={iconSize} className="text-rose-400 animate-pulse drop-shadow-[0_0_2px_rgba(244,63,94,0.4)]" />;
  }
  if (type === "miedo") {
    if (modes.rescate) {
      return <AlertCircle size={iconSize} className="animate-spin-slow text-amber-300 drop-shadow-[0_0_3px_rgba(245,158,11,0.6)]" />;
    }
    return <AlertCircle size={iconSize} className="text-amber-400 animate-pulse drop-shadow-[0_0_2px_rgba(245,158,11,0.4)]" />;
  }
  if (type === "desmotivacion") {
    if (modes.foco) {
      return <Target size={iconSize} className="animate-pulse text-indigo-300 drop-shadow-[0_0_3px_rgba(99,102,241,0.6)]" />;
    }
    return <Compass size={iconSize} className="text-indigo-400 animate-spin-slow drop-shadow-[0_0_2px_rgba(99,102,241,0.4)]" />;
  }
  if (type === "bajon") {
    if (modes.rescate) {
      return <LifeBuoy size={iconSize} className="animate-pulse text-emerald-300 drop-shadow-[0_0_3px_rgba(16,185,129,0.6)]" />;
    }
    return <Activity size={iconSize} className="text-emerald-400 animate-pulse drop-shadow-[0_0_2px_rgba(16,185,129,0.4)]" />;
  }
  return <Sparkles size={iconSize} />;
};

export default function App() {
  // State elements
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [robotState, setRobotState] = useState<RobotState>("calma");
  const [metrics, setMetrics] = useState<RadarMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(false);
  const [showPwaPanel, setShowPwaPanel] = useState(false);
  const [showOperativeBay, setShowOperativeBay] = useState(false); 
  const [showCalibrator, setShowCalibrator] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showBreathingModal, setShowBreathingModal] = useState(false);

  // Firebase auth state variables
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  
  // Interactive calibrate levels matching mockup image
  const [humorLevel, setHumorLevel] = useState<number>(4);
  const [pragmatismLevel, setPragmatismLevel] = useState<number>(5);
  
  // Touch swipe states for PWA Banner dismissal gesture support
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeTranslationX, setSwipeTranslationX] = useState(0);
  const [swipeTranslationY, setSwipeTranslationY] = useState(0);
  const [isSwipingActive, setIsSwipingActive] = useState(false);
  
  // Custom execution modes
  const [modes, setModes] = useState<AntidramaModes>({
    foco: false,
    humor: true, // Default to true to match mockup of showing Fire items!
    rescate: false
  });

  // Keep track of chip clicks to determine the most frequently used or contextually active chip
  const [chipClickCounts, setChipClickCounts] = useState<Record<string, number>>({
    ira: 0,
    miedo: 0,
    desmotivacion: 0,
    bajon: 0
  });
  const [lastClickedChip, setLastClickedChip] = useState<string | null>(null);
  const [processingChip, setProcessingChip] = useState<"ira" | "miedo" | "desmotivacion" | "bajon" | null>(null);
  const chipTimerRef = useRef<Record<string, any>>({});
  const [ripples, setRipples] = useState<{ id: string; chipType: string; x: number; y: number; size: number }[]>([]);

  const handleChipClick = (e: React.MouseEvent<HTMLButtonElement>, type: "ira" | "miedo" | "desmotivacion" | "bajon") => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 3.5;
    const newRipple = {
      id: `${Date.now()}-${Math.random()}`,
      chipType: type,
      x,
      y,
      size
    };
    setRipples((prev) => [...prev, newRipple]);
    handleQuickChip(type);
  };

  const removeRipple = (id: string) => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  };

  useEffect(() => {
    return () => {
      // Clean up dynamic timeout handles when App unmounts
      Object.values(chipTimerRef.current).forEach(clearTimeout);
    };
  }, []);

  // Dynamically determine the contextually selected or most frequently used chip
  const getSelectedChip = () => {
    // 1. Check if there's a conversation-based context match first (higher priority for dynamic adaptation)
    const textToScan = messages
      .slice(-6)
      .map((m) => m.text.toLowerCase())
      .join(" ");

    const hasExhaustion = /cansad|agotad|quemad|burnout|sueñ|dormir|bater|fatig|reserva|fuerza|colaps|pausa|frito/.test(textToScan);
    const hasConflict = /jefe|jefa|colaborador|colega|tóxic|toxic|reuni|discut|pelea|feedback|mail|slack|comentario|dijo|pasivo/.test(textToScan);
    const hasOverwhelm = /tarde|urgent|deadline|fecha|entrega|tiempo|retras|reloj|incendi|ayer|rápido|rapido/.test(textToScan);

    if (hasExhaustion) return "bajon";
    if (hasConflict) return "ira";
    if (hasOverwhelm) return "miedo";

    // 2. Fall back to most frequently used chip if click counts exist
    let maxClicks = 0;
    let mostFrequent: string | null = null;
    for (const key of Object.keys(chipClickCounts) as Array<"ira" | "miedo" | "desmotivacion" | "bajon">) {
      const clicks = chipClickCounts[key] || 0;
      if (clicks > maxClicks) {
        maxClicks = clicks;
        mostFrequent = key;
      }
    }
    if (mostFrequent && maxClicks > 0) return mostFrequent;

    // 3. Fall back to last clicked chip or default to none
    return lastClickedChip;
  };

  // Audio simulation state (for music recommendations)
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [currentWidgetTrack, setCurrentWidgetTrack] = useState<string | null>(null);
  const [completedWidgetSteps, setCompletedWidgetSteps] = useState<Record<string, Record<number, boolean>>>({});

  // Microphone state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // References for layout auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper to save user settings in Firestore
  const saveUserSettings = async (
    userId: string,
    email: string | null,
    hLevel: number,
    pLevel: number,
    currentModes: AntidramaModes,
    currentMetrics: RadarMetrics
  ) => {
    try {
      const userDocRef = doc(db, "users", userId);
      await setDoc(userDocRef, {
        uid: userId,
        email: email || "usuario_invitado@antidrama.app",
        humorLevel: hLevel,
        pragmatismLevel: pLevel,
        modes: currentModes,
        metrics: currentMetrics,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn("Error updating user settings in Firestore:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    }
  };

  // Listen to Firebase Auth state on mount
  useEffect(() => {
    setIsFirebaseLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsFirebaseLoading(true);
        try {
          const userDocRef = doc(db, "users", user.uid);
          let userDoc;
          try {
            userDoc = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          }

          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.humorLevel) setHumorLevel(data.humorLevel);
            if (data.pragmatismLevel) setPragmatismLevel(data.pragmatismLevel);
            if (data.modes) setModes(data.modes);
            if (data.metrics) setMetrics(data.metrics);

            // Read chat history from subcollection
            const messagesCol = collection(db, "users", user.uid, "messages");
            let messagesSnapshot;
            try {
              messagesSnapshot = await getDocs(messagesCol);
            } catch (err) {
              handleFirestoreError(err, OperationType.GET, `users/${user.uid}/messages`);
            }

            const loadedMessages: Message[] = [];
            messagesSnapshot.forEach((doc) => {
              loadedMessages.push(doc.data() as Message);
            });

            if (loadedMessages.length > 0) {
              const sorted = loadedMessages.sort((a, b) => {
                const aNum = parseInt(a.id.split("-")[1]) || 0;
                const bNum = parseInt(b.id.split("-")[1]) || 0;
                if (aNum !== bNum) return aNum - bNum;
                return a.timestamp.localeCompare(b.timestamp);
              });
              setMessages(sorted);
            } else {
              // Upload local messages if none existed on the cloud yet
              for (const msg of messages) {
                try {
                  await setDoc(doc(db, "users", user.uid, "messages", msg.id), msg);
                } catch (err) {
                  handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/messages/${msg.id}`);
                }
              }
            }
          } else {
            // Document doesn't exist, set it up
            try {
              await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email || "usuario_invitado@antidrama.app",
                humorLevel,
                pragmatismLevel,
                modes,
                metrics,
                updatedAt: new Date().toISOString()
              });
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
            }

            // Upload local chat history
            for (const msg of messages) {
              try {
                await setDoc(doc(db, "users", user.uid, "messages", msg.id), msg);
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/messages/${msg.id}`);
              }
            }
          }
          setToastMsg("¡Nube conectada y sincronizada!");
          setTimeout(() => setToastMsg(null), 3000);
        } catch (err: any) {
          console.error("Error loading user profile:", err);
          setToastMsg("Sincronización de nube iniciada localmente.");
          setTimeout(() => setToastMsg(null), 3000);
        } finally {
          setIsFirebaseLoading(false);
        }
      } else {
        setIsFirebaseLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync to Firestore when user settings evolve
  useEffect(() => {
    if (firebaseUser && !isFirebaseLoading) {
      saveUserSettings(firebaseUser.uid, firebaseUser.email, humorLevel, pragmatismLevel, modes, metrics);
    }
  }, [firebaseUser, humorLevel, pragmatismLevel, modes, metrics, isFirebaseLoading]);

  // Load state on startup
  useEffect(() => {
    // Migration check to clear old cache containing victim-leaning replies and old greetings
    const hasMigrated = localStorage.getItem("antidrama_v4_migrated") === "true";
    if (!hasMigrated) {
      localStorage.removeItem("antidrama_chat_history_v2");
      localStorage.setItem("antidrama_v4_migrated", "true");
    }

    const savedChat = localStorage.getItem("antidrama_chat_history_v2");
    const savedMetrics = localStorage.getItem("antidrama_radar_metrics_v2");
    const savedModes = localStorage.getItem("antidrama_modes_v2");

    if (savedChat && hasMigrated) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        setMessages(INITIAL_MESSAGES);
      }
    } else {
      setMessages(INITIAL_MESSAGES);
    }

    if (savedMetrics) {
      try {
        setMetrics(JSON.parse(savedMetrics));
      } catch (e) {
        setMetrics(DEFAULT_METRICS);
      }
    }

    if (savedModes) {
      try {
        const parsed = JSON.parse(savedModes);
        setModes(parsed);
        if (parsed.foco) {
          setRobotState("foco");
        }
      } catch (e) {
        // use default
      }
    }

    const savedHumor = localStorage.getItem("antidrama_humor_level_v2");
    const savedPragmatism = localStorage.getItem("antidrama_pragmatism_level_v2");
    if (savedHumor) setHumorLevel(Number(savedHumor));
    if (savedPragmatism) setPragmatismLevel(Number(savedPragmatism));

    // Web Speech API capability detection
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "es-AR"; 

      rec.onstart = () => {
        setIsListening(true);
        setRobotState("escucha");
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? prev + " " + transcript : transcript));
        }
      };

      rec.onerror = (e: any) => {
        console.error("Error reconociendo voz:", e);
        setIsListening(false);
        setRobotState(modes.foco ? "foco" : "calma");
      };

      rec.onend = () => {
        setIsListening(false);
        setRobotState(modes.foco ? "foco" : "calma");
      };

      recognitionRef.current = rec;
    }

    // Detect if running on mobile browser and not already installed as standalone PWA
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    if (isMobile && !isStandalone) {
      setShowPwaPanel(true);
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("antidrama_chat_history_v2", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("antidrama_radar_metrics_v2", JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem("antidrama_modes_v2", JSON.stringify(modes));
    if (modes.foco) {
      setRobotState("foco");
    } else if (robotState === "foco") {
      setRobotState("calma");
    }
  }, [modes]);

  useEffect(() => {
    localStorage.setItem("antidrama_humor_level_v2", String(humorLevel));
  }, [humorLevel]);

  useEffect(() => {
    localStorage.setItem("antidrama_pragmatism_level_v2", String(pragmatismLevel));
  }, [pragmatismLevel]);

  // Dynamic status indicators matching mockup
  const getPragmatismCheckmarks = () => {
    return "✅".repeat(pragmatismLevel) + "⬜".repeat(Math.max(0, 5 - pragmatismLevel));
  };

  const getHumorFlames = () => {
    return "🔥".repeat(humorLevel) + "⬜".repeat(Math.max(0, 5 - humorLevel));
  };

  // Auto-scroll action helper
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 150);
  }, [messages, loading, showOperativeBay]);

  // Touch swipe handlers to dismiss the PWA panel with gesture support
  const handlePwaTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
      setIsSwipingActive(true);
    }
  };

  const handlePwaTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    // Upwards swipe is natural, downwards is restricted
    const finalY = diffY < 0 ? diffY : diffY * 0.25;

    // Prevent default scroll behavior when swiping is dominant
    if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
      if (e.cancelable) {
        e.preventDefault();
      }
    }

    setSwipeTranslationX(diffX);
    setSwipeTranslationY(finalY);
  };

  const handlePwaTouchEnd = () => {
    setIsSwipingActive(false);
    const dismissThresholdX = 110;
    const dismissThresholdY = -40;

    if (
      Math.abs(swipeTranslationX) > dismissThresholdX ||
      swipeTranslationY < dismissThresholdY
    ) {
      // Trigger a sleek dismissal sensory feedback
      triggerHaptic();
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
          gain.gain.setValueAtTime(0.06, now);
          gain.gain.linearRampToValueAtTime(0.0001, now + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.13);
        }
      } catch (err) {}

      setShowPwaPanel(false);
    } else {
      // Return smoothly to normal resting state
      setSwipeTranslationX(0);
      setSwipeTranslationY(0);
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Simple haptic feedback helper for tactile mobile presses
  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      try {
        // Crisp 15ms vibration pulse
        navigator.vibrate(15);
      } catch (e) {
        // Fails silently in blocks or unsupported iframe contexts gracefully
      }
    }
  };

  // High-end tactile click sound synthesizer using Web Audio API
  const playTactileClick = (type: "ira" | "miedo" | "desmotivacion" | "bajon") => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Classify parameters based on the urgent nature of the selected chip
      let highFreqStart = 1800;
      let highFreqEnd = 600;
      let highGain = 0.06;
      let highDecay = 0.015;

      let lowFreqStart = 160;
      let lowFreqEnd = 50;
      let lowGain = 0.15;
      let lowDecay = 0.03;

      switch (type) {
        case "ira":
          // Deep, grave mechanical thud with prominent, alarming low end
          highFreqStart = 1100;
          highFreqEnd = 350;
          highGain = 0.09;
          highDecay = 0.025;

          lowFreqStart = 95;
          lowFreqEnd = 30;
          lowGain = 0.30;
          lowDecay = 0.07;
          break;

        case "miedo":
          // Shrill, high-frequency alarm signal
          highFreqStart = 1900;
          highFreqEnd = 500;
          highGain = 0.08;
          highDecay = 0.018;

          lowFreqStart = 140;
          lowFreqEnd = 45;
          lowGain = 0.24;
          lowDecay = 0.045;
          break;

        case "desmotivacion":
          // Dull, dampened key-press with fast decay (feels tired and hollow)
          highFreqStart = 1000;
          highFreqEnd = 300;
          highGain = 0.04;
          highDecay = 0.012;

          lowFreqStart = 110;
          lowFreqEnd = 35;
          lowGain = 0.12;
          lowDecay = 0.035;
          break;

        case "bajon":
        default:
          // Smooth, warm, soft-thump tactile sensation
          highFreqStart = 1500;
          highFreqEnd = 600;
          highGain = 0.05;
          highDecay = 0.020;

          lowFreqStart = 120;
          lowFreqEnd = 40;
          lowGain = 0.16;
          lowDecay = 0.040;
          break;
      }

      // 1. High-frequency transient click (metal contact click)
      const oscHigh = ctx.createOscillator();
      const gainHigh = ctx.createGain();
      oscHigh.type = "sine";
      oscHigh.frequency.setValueAtTime(highFreqStart, now);
      oscHigh.frequency.exponentialRampToValueAtTime(highFreqEnd, now + highDecay * 0.8);

      gainHigh.gain.setValueAtTime(highGain, now);
      gainHigh.gain.exponentialRampToValueAtTime(0.0001, now + highDecay);

      // 2. Low-frequency dampened body resonance (mechanical switch thump)
      const oscLow = ctx.createOscillator();
      const gainLow = ctx.createGain();
      oscLow.type = "triangle";
      oscLow.frequency.setValueAtTime(lowFreqStart, now);
      oscLow.frequency.exponentialRampToValueAtTime(lowFreqEnd, now + lowDecay * 0.8);

      gainLow.gain.setValueAtTime(lowGain, now);
      gainLow.gain.exponentialRampToValueAtTime(0.0001, now + lowDecay);

      // Connect nodes and route to speaker output
      oscHigh.connect(gainHigh);
      gainHigh.connect(ctx.destination);

      oscLow.connect(gainLow);
      gainLow.connect(ctx.destination);

      // Program the fast execution window
      oscHigh.start(now);
      oscHigh.stop(now + highDecay * 2);
      oscLow.start(now);
      oscLow.stop(now + lowDecay * 2);
    } catch (e) {
      // Gracefully fail silently in environments that block dynamic audio elements
    }
  };

  // Quick state simulation chips
  const handleQuickChip = (type: "ira" | "miedo" | "desmotivacion" | "bajon") => {
    triggerHaptic();
    playTactileClick(type);
    
    // Track click frequency and last clicked chip
    setChipClickCounts(prev => ({
      ...prev,
      [type]: (prev[type] || 0) + 1
    }));
    setLastClickedChip(type);

    // Trigger tactile processing thin bar below the button
    setProcessingChip(type);
    if (chipTimerRef.current[type]) {
      clearTimeout(chipTimerRef.current[type]);
    }
    chipTimerRef.current[type] = setTimeout(() => {
      setProcessingChip(current => current === type ? null : current);
    }, 1500);
    
    const chipConfig = getAdaptedChipData(type, messages, modes);
    const text = chipConfig.simulatedText;
    let mockValues: RadarMetrics = { ...metrics };

    switch (type) {
      case "ira":
        mockValues = { saturacion: 95, foco: 15, energia: 85 };
        break;
      case "miedo":
        mockValues = { saturacion: 98, foco: 10, energia: 40 };
        break;
      case "desmotivacion":
        mockValues = { saturacion: 50, foco: 20, energia: 15 };
        break;
      case "bajon":
        mockValues = { saturacion: 75, foco: 25, energia: 8 };
        break;
    }

    setMetrics(mockValues);
    submitMessage(text, mockValues);
  };

  // Submit trigger
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    submitMessage(inputText, metrics);
  };

  // Global keyboard shortcuts: Ctrl+Enter (or Cmd+Enter) to send, Ctrl+K (or Cmd+K) to toggle calibration panel
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K: toggle calibration panel
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        // We use functional state to toggle and safely announce with the toast
        setShowCalibrator((prev) => {
          const next = !prev;
          showToast(next ? "Calibrador de conducta abierto ⚙️ (Ctrl+K)" : "Calibrador ocultado ⚙️ (Ctrl+K)");
          return next;
        });
      }

      // Ctrl+Enter or Cmd+Enter: send message
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const messageInput = document.getElementById("message-input") as HTMLInputElement | null;
        const currentText = messageInput ? messageInput.value : inputText;
        if (currentText.trim()) {
          e.preventDefault();
          submitMessage(currentText, metrics);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [inputText, metrics]);

  const submitMessage = async (textToSend: string, currentMetrics: RadarMetrics) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    setInputText("");

    // Create user bubble styled like mockup (Beautiful soft rounded bubble on right side)
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      radarSnapshot: { ...currentMetrics }
    };

    setMessages((prev) => [...prev, userMsg]);
    if (firebaseUser) {
      setDoc(doc(db, "users", firebaseUser.uid, "messages", userMsg.id), userMsg).catch(err => {
        console.warn(err);
        handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/messages/${userMsg.id}`);
      });
    }
    setLoading(true);
    setRobotState("pensando");

    // Capture context history
    const formattedHistory = messages
      .filter((m) => m.id !== "welcome-1" && m.id !== "welcome-2")
      .slice(-6)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text
      }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          history: formattedHistory,
          modes: {
            foco: modes.foco,
            humor: modes.humor,
            rescate: modes.rescate,
            humorLevel: humorLevel,
            pragmatismLevel: pragmatismLevel
          }
        })
      });

      if (!response.ok) {
        throw new Error("Fallo en la comunicación con el Yo Auxiliar.");
      }

      const data = await response.json();

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.text || "Hubo un pequeño cortocircuito, pero acá estoy. Reiniciando dirección.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        radarSnapshot: data.radar || currentMetrics,
        musicaRescate: data.musicaRescate || undefined
      };

      if (data.radar) {
        setMetrics(data.radar);
      }
      if (data.musicaRescate) {
        setCurrentWidgetTrack(data.musicaRescate);
      } else {
        if (data.radar && data.radar.saturacion > 80) {
          setCurrentWidgetTrack("Técnica de Enraizamiento Sensorial 5-4-3-2-1");
        }
      }

      setMessages((prev) => [...prev, botMsg]);
      if (firebaseUser) {
        setDoc(doc(db, "users", firebaseUser.uid, "messages", botMsg.id), botMsg).catch(err => {
          console.warn(err);
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/messages/${botMsg.id}`);
        });
      }
      setRobotState("respondiendo");

      setTimeout(() => {
        setRobotState(modes.foco ? "foco" : "calma");
      }, 3500);

    } catch (error: any) {
      console.error(error);
      const botErrorMsg: Message = {
        id: `error-${Date.now()}`,
        sender: "bot",
        text: "Error de enlace con mis módulos primarios. Asegúrate de que GEMINI_API_KEY esté configurada en los Secretos.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        radarSnapshot: currentMetrics
      };
      setMessages((prev) => [...prev, botErrorMsg]);
      if (firebaseUser) {
        setDoc(doc(db, "users", firebaseUser.uid, "messages", botErrorMsg.id), botErrorMsg).catch(err => {
          console.warn(err);
          handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}/messages/${botErrorMsg.id}`);
        });
      }
      setRobotState(modes.foco ? "foco" : "calma");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTrack = (trackName: string) => {
    if (playingTrack === trackName) {
      setPlayingTrack(null);
    } else {
      setPlayingTrack(trackName);
    }
  };

  const handleVoiceToggle = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClearChat = async () => {
    localStorage.removeItem("antidrama_chat_history_v2");
    setMessages(INITIAL_MESSAGES);
    setMetrics(DEFAULT_METRICS);
    setPlayingTrack(null);
    setCurrentWidgetTrack(null);
    setModes({ foco: false, humor: true, rescate: false });
    setRobotState("calma");

    if (firebaseUser) {
      try {
        const messagesCol = collection(db, "users", firebaseUser.uid, "messages");
        let messagesSnapshot;
        try {
          messagesSnapshot = await getDocs(messagesCol);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}/messages`);
        }
        messagesSnapshot.forEach((docSnap) => {
          deleteDoc(docSnap.ref).catch(err => {
            console.warn("Error deleting message:", err);
            handleFirestoreError(err, OperationType.DELETE, `users/${firebaseUser.uid}/messages/${docSnap.id}`);
          });
        });
      } catch (err) {
        console.warn("Error clearing Firestore messages:", err);
      }
    }
    showToast("Historial del chat reiniciado correctamente.");
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    const audioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (audioCtx) {
      try {
        const ctx = new audioCtx();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.16);
      } catch (err) {}
    }
    setTimeout(() => {
      setToastMsg((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin; 
      
      let y = margin;
      
      const checkPageOffset = (additionalHeight: number) => {
        if (y + additionalHeight > pageHeight - margin) {
          doc.addPage();
          doc.setFillColor(10, 13, 21); 
          doc.rect(0, 0, pageWidth, pageHeight, "F");
          
          doc.setDrawColor(28, 38, 57);
          doc.setLineWidth(0.5);
          doc.line(margin, 15, pageWidth - margin, 15);
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(92, 220, 247);
          doc.text("ANTIDRAMA - REPORTE DE SESION OPERATIVA", margin, 12);
          
          y = 25;
        }
      };

      // Background color
      doc.setFillColor(10, 13, 21);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      
      // Decorative header border (Teal)
      doc.setDrawColor(45, 212, 191);
      doc.setLineWidth(1.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;
      
      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(26);
      doc.setTextColor(92, 220, 247); 
      doc.text("ANTIDRAMA", margin, y);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184); 
      doc.text("TU YO AUXILIAR DE BOLSILLO", margin + 63, y - 1);
      
      y += 10;
      
      // Rule
      doc.setDrawColor(21, 29, 43);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;
      
      // Metadata rounded card bg
      doc.setFillColor(15, 23, 42); 
      doc.roundedRect(margin, y, contentWidth, 26, 2, 2, "F");
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, y, contentWidth, 26, 2, 2, "D");
      
      // Meta content
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(248, 250, 252);
      doc.text("INFORMACION DE SESION", margin + 6, y + 7);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      const currentDateStr = new Date().toLocaleString("es-AR", {
        year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
      doc.text(`Fecha y hora: ${currentDateStr}`, margin + 6, y + 17);
      doc.text(`Calibracion AI:`, margin + 105, y + 7);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(245, 158, 11); 
      doc.text(`Humor Acidulado: LVL ${humorLevel}/5`, margin + 105, y + 14);
      doc.setTextColor(45, 212, 191); 
      doc.text(`Pragmatismo: LVL ${pragmatismLevel}/5`, margin + 105, y + 21);
      
      y += 36;
      
      // Section header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(45, 212, 191);
      doc.text("HISTORIAL DE INTERCAMBIO TACTICO", margin, y);
      y += 3;
      doc.setDrawColor(45, 212, 191);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + 80, y);
      y += 8;
      
      if (messages.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text("No se registran interacciones en esta sesion.", margin, y);
      } else {
        messages.forEach((msg) => {
          const isUser = msg.sender === "user";
          const senderLabel = isUser ? "TU" : "ANTIDRAMA";
          
          const textLines = doc.splitTextToSize(msg.text, contentWidth - 14);
          const textHeight = textLines.length * 5;
          const totalBlockHeight = textHeight + 14;
          
          checkPageOffset(totalBlockHeight);
          
          // Render block card bg
          if (isUser) {
            doc.setFillColor(22, 39, 68); 
            doc.roundedRect(margin, y, contentWidth, totalBlockHeight - 2, 3, 3, "F");
            doc.setDrawColor(14, 165, 233, 40);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, contentWidth, totalBlockHeight - 2, 3, 3, "D");
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(14, 165, 233);
          } else {
            doc.setFillColor(15, 23, 42); 
            doc.roundedRect(margin, y, contentWidth, totalBlockHeight - 2, 3, 3, "F");
            doc.setDrawColor(51, 65, 85, 40);
            doc.setLineWidth(0.3);
            doc.roundedRect(margin, y, contentWidth, totalBlockHeight - 2, 3, 3, "D");
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(45, 212, 191);
          }
          
          doc.text(senderLabel, margin + 6, y + 6);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          doc.text(msg.timestamp, margin + contentWidth - 25, y + 5.5);
          

          
          y += 11;
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(241, 245, 249);
          
          textLines.forEach((lineText: string) => {
            doc.text(lineText, margin + 6, y);
            y += 5;
          });
          
          y += 7; 
        });
      }
      
      // Footer text on page completion
      checkPageOffset(15);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("ANTIDRAMA - Tu Yo Auxiliar tactico de bolsillo. Pragmatico, directo, al grano.", margin, y + 5);
      
      doc.save(`antidrama-reporte-${Date.now().toString().slice(-6)}.pdf`);
      triggerHaptic();
      showToast("¡Documento PDF exportado con éxito!");
    } catch (err: any) {
      console.error(err);
      showToast("Fallo al compilar el PDF de sesión.");
    }
  };

  const handleShare = () => {
    const shareText = "ANTIDRAMA - Tu Yo Auxiliar táctico de bolsillo.";
    if (navigator.share) {
      navigator.share({
        title: "ANTIDRAMA",
        text: shareText,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast("¡Vínculo copiado al portapapeles!");
    }
  };

  const updateMetric = (key: keyof RadarMetrics, val: number) => {
    setMetrics(prev => ({
      ...prev,
      [key]: val
    }));
  };

  // Custom static dynamic avatar map depending on message content
  const getDynamicAvatar = (text: string) => {
    const lowercase = text.toLowerCase();
    if (lowercase.includes("paso 1") || lowercase.includes("acción") || lowercase.includes("paso 3")) {
      return "💡";
    }
    if (lowercase.includes("cansado") || lowercase.includes("respirar") || lowercase.includes("bajar")) {
      return "💆‍♂️";
    }
    if (lowercase.includes("chiste") || lowercase.includes("humor") || lowercase.includes("jefe")) {
      return "🔥";
    }
    return "☕"; // Classic coffee mug from the mockup
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0d15] bg-gradient-to-br from-[#1c120c] via-[#0d0d12] to-[#04050a] flex flex-col lg:flex-row justify-center items-center p-4 sm:p-6 lg:p-8 overflow-y-auto font-sans relative">
      
      {/* Dynamic photorealistic warm vintage lamp lighting and ambient desk highlights */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {/* Warm yellow lamp light casting from the top-left */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.24)_0%,transparent_70%)] blur-3xl" />
        
        {/* Soft cold light leakage on the bottom-right for elegant high contrast */}
        <div className="absolute -bottom-40 -right-20 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.06)_0%,transparent_75%)] blur-3xl animate-pulse" style={{ animationDuration: '10s' }} />
        
        {/* Physical wood grain texture simulation lines */}
        <div className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[size:100px_4px]" />
        
        {/* Dark drop shadows wrapping the floor surface */}
        <div className="absolute bottom-0 left-0 right-0 h-[260px] bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* STUNNING SIDE-BY-SIDE DESKTOP CONTAINER (Toggles to single phone container naturally on mobile!) */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-10 xl:gap-20 relative z-10 p-4 lg:p-0 min-h-0">
        
        {/* LEFT COMPARTMENT: The beautiful meditating robot with high quality speech bubble - exactly as requested in Image 2 */}
        <div className="hidden lg:flex flex-col items-center justify-center lg:w-[320px] xl:w-[380px] shrink-0 text-center select-none">
          <div className="bg-slate-940/60 backdrop-blur-xl p-6 rounded-[32px] border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative w-full flex flex-col items-center transition-all duration-300 hover:border-teal-500/20">
            
            {/* Ambient metallic screw rivets decoration */}
            <div className="absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700 shadow-inner" />
            <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700 shadow-inner" />
            <div className="absolute bottom-4 left-4 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700 shadow-inner" />
            <div className="absolute bottom-4 right-4 w-1.5 h-1.5 rounded-full bg-slate-800 border border-slate-700 shadow-inner" />

            <div className="mb-4">
              <span className="text-[9.5px] uppercase font-mono tracking-widest text-[#2f93b2] font-black bg-[#2dd4bf]/5 px-3 py-1.5 rounded-full border border-[#2dd4bf]/20">
                Yo Auxiliar Racional Estacionario
              </span>
            </div>

            {/* Render customizable large vector Robot */}
            <div className="w-48 h-48 flex items-center justify-center relative">
              {/* Soft futuristic platform halo underneath */}
              <div className="absolute -bottom-1 w-32 h-3.5 bg-teal-500/10 rounded-full blur-md animate-pulse" />
              <RobotSVG state={robotState} />
            </div>

            <div className="mt-4 space-y-2">
              <h3 className="text-white font-extrabold text-lg tracking-wide">ANTIDRAMA-BOT</h3>
              <p className="text-slate-400 text-[11px] leading-relaxed max-w-[280px]">
                "Validando tu cansancio del ecosistema corporativo sin un solo gramo de drama o autoayuda vacía."
              </p>
            </div>

            {/* Static parameters decoration from the desk style */}
            <div className="grid grid-cols-2 gap-3 w-full mt-6 pt-4 border-t border-slate-850 text-left">
              <div className="text-[11px] font-mono text-slate-405">
                <p className="text-slate-500 uppercase text-[8.5px] font-bold">Estado Core</p>
                <p className="text-[#2dd4bf] font-semibold uppercase animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" /> Activo
                </p>
              </div>
              <div className="text-[11px] font-mono text-slate-405">
                <p className="text-slate-500 uppercase text-[8.5px] font-bold">Respuesta Latencia</p>
                <p className="text-slate-300">0.9 s (Gemini 3.5)</p>
              </div>
            </div>

          </div>

          <div className="mt-4 flex items-center gap-2 text-[10.5px] text-slate-500 font-mono">
            <Bookmark className="text-amber-500 animate-pulse" size={13} />
            <span>Calibrado para el plano táctico corporativo.</span>
          </div>
        </div>

        {/* RIGHT COMPARTMENT: PREMIUM SMARTPHONE SIMULATOR FRAME - Elegant Glassmorphism matching Mockup */}
        <div 
          id="phone-simulator" 
          className="w-full max-w-[430px] sm:max-w-[540px] md:max-w-[600px] lg:max-w-[650px] h-[100svh] sm:h-[min(860px,calc(100svh-48px))] max-h-full bg-slate-950 text-[#f8fafc] flex flex-col relative border border-slate-800/80 shadow-[25px_30px_55px_-12px_rgba(0,0,0,0.9)] overflow-hidden sm:rounded-[36px] ring-0 sm:ring-[8px] ring-slate-900 shadow-slate-950/95 transition-all duration-300"
        >
          {/* Physical Side Buttons for complete Hardware Simulation realism */}
          <div className="hidden sm:block absolute top-28 -left-[10px] w-1 h-10 bg-slate-800 rounded-l border-y border-l border-slate-700/80 z-40" />
          <div className="hidden sm:block absolute top-[164px] -left-[10px] w-1 h-12 bg-slate-800 rounded-l border-y border-l border-slate-700/80 z-40" />
          <div className="hidden sm:block absolute top-[224px] -left-[10px] w-1 h-12 bg-slate-800 rounded-l border-y border-l border-slate-700/80 z-40" />
          <div className="hidden sm:block absolute top-40 -right-[10px] w-1 h-16 bg-slate-800 rounded-r border-y border-r border-slate-700/80 z-40" />
          
          {/* Real Phone Hardware Notch Overlay Simulation */}
          <div className="hidden sm:flex absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-slate-950 rounded-b-3xl z-50 items-center justify-center select-none pointer-events-none border-b border-x border-slate-900">
            {/* Camera lens indicator */}
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 mr-2" />
            <div className="w-10 h-1 bg-slate-900 rounded-full" />
          </div>

          {/* TOP STATUS BAR ROW */}
          <div className="bg-slate-950 px-6 pt-3 sm:pt-8 pb-1.5 flex justify-between items-center text-[10px] font-mono text-slate-400 select-none shrink-0 relative z-30">
            <div>
              <span>9:41</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>LTE</span>
              <div className="w-4 h-2 border border-slate-500 rounded-sm p-0.5 flex items-center">
                <div className="w-full h-full bg-teal-400 rounded-2xs" />
              </div>
            </div>
          </div>

          {/* INTERACTIVE PWA RETRACTABLE INFO DRAWER */}
          {showPwaPanel && (
            <div
              id="pwa-panel"
              onTouchStart={handlePwaTouchStart}
              onTouchMove={handlePwaTouchMove}
              onTouchEnd={handlePwaTouchEnd}
              style={{
                transform: `translate3d(${swipeTranslationX}px, ${swipeTranslationY}px, 0)`,
                opacity: Math.max(0.05, 1 - Math.abs(swipeTranslationX) / 280 - Math.abs(swipeTranslationY) / 100),
                transition: isSwipingActive
                  ? "none"
                  : "transform 0.35s cubic-bezier(0.19, 1, 0.22, 1), opacity 0.35s ease",
              }}
              className="bg-[#0b1329] border-b border-teal-500/20 p-3.5 transition-all duration-300 relative z-50 text-[11px] shadow-lg shrink-0 select-none touch-none active:cursor-grabbing"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1.5 flex-1 pr-1.5">
                  <h4 className="font-semibold text-teal-300 flex items-center gap-1">
                    <CheckCircle size={13} className="text-teal-400" /> Instalación de Bolsillo Activa
                  </h4>
                  <p className="text-slate-300 text-[10.5px] leading-relaxed">
                    Saca ANTIDRAMA de las pestañas del navegador para urgencias extremas. Podés guardarlo directamente como un PWA ejecutable desde tu menú del sistema.
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-zinc-500">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-650 animate-pulse" />
                    <span>Deslizá para descartar panel</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowPwaPanel(false)}
                  className="text-slate-400 hover:text-white px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-[9px] font-mono transition-all pr-2 pl-2 cursor-pointer shrink-0"
                >
                  Ocultar
                </button>
              </div>
            </div>
          )}

          {/* APP HEADER - Customized to look EXACTLY like mockup image 2 */}
          <header className="p-3 sm:p-4 sm:pt-3 flex flex-col justify-between border-b border-slate-900 bg-slate-950/95 relative z-20 shrink-0">
            
            {/* Top row with buttons */}
            <div className="flex items-center justify-between w-full mb-1">
              {/* Perfect cyber Outline/Glow typography matching the user's reference mockup */}
              <h1 id="app-title" className="text-2xl font-extrabold tracking-[0.16em] text-[#5cdcf7] font-sans drop-shadow-[0_0_10px_rgba(92,220,247,0.7)]">
                ANTIDRAMA
              </h1>

              <div className="flex gap-1.5 align-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(true);
                    triggerHaptic();
                  }}
                  title={firebaseUser ? "Respaldado en la Nube (Firebase)" : "Guardar en la Nube / Acceder"}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    firebaseUser
                      ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                      : "bg-slate-900 border-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-sky-400"
                  }`}
                >
                  <Cloud size={13} className={firebaseUser ? "animate-pulse" : ""} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCalibrator(!showCalibrator);
                    triggerHaptic();
                  }}
                  title="Ajustar Calibrador AI (Humor y Pragmatismo) (Ctrl+K)"
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    showCalibrator
                      ? "bg-teal-950/60 border-teal-500/50 text-[#2dd4bf] shadow-[0_0_8px_rgba(45,212,191,0.25)]"
                      : "bg-slate-900 border-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-[#2dd4bf]"
                  }`}
                >
                  <SlidersHorizontal size={13} />
                </button>
                <button
                  type="button"
                  onClick={handleExportPDF}
                  title="Exportar Reporte de Sesión en PDF"
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[#2dd4bf] hover:text-teal-300 hover:shadow-[0_0_8px_rgba(45,212,191,0.3)] transition-all cursor-pointer border border-slate-800/80"
                >
                  <FileDown size={13} />
                </button>
                <button
                  onClick={handleShare}
                  title="Compartir"
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-teal-400 transition-all cursor-pointer border border-slate-800/80"
                >
                  <Share2 size={13} />
                </button>
                <button
                  onClick={handleClearChat}
                  title="Resetear"
                  className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-xl text-[#fca5a5]/75 hover:text-[#fca5a5] transition-all cursor-pointer border border-slate-800/80"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Subtitle labels EXACTLY as requested in Mockup 2 */}
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium tracking-wide block text-[11px]">
                  Tu Yo Auxiliar de Bolsillo.
                </span>
                {firebaseUser ? (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      triggerHaptic();
                    }}
                    className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20 cursor-pointer"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Nube Sincr.: {firebaseUser.email ? firebaseUser.email.split("@")[0] : "Invitado"}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true);
                      triggerHaptic();
                    }}
                    className="text-[9px] font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-950/20 hover:bg-sky-950/40 px-2 py-0.5 rounded-full border border-sky-500/20 cursor-pointer"
                  >
                    <span>☁️ Guardar en la Nube</span>
                  </button>
                )}
              </div>
              
              {/* Collapsible calibration bar for Humor and Pragmatism */}
              <AnimatePresence>
                {showCalibrator && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="flex flex-col gap-3.5 text-[10.5px] font-mono text-slate-300 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 p-4 rounded-2xl border border-slate-800/90 shadow-xl overflow-hidden"
                  >
                    <span className="text-[9.5px] text-[#2dd4bf] font-bold uppercase tracking-wider block border-b border-slate-800/40 pb-1.5 mb-1">
                      ⚙️ Calibrador de Conducta AI
                    </span>
                    
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-400">Nivel de Humor Acidulado:</span>
                      <div className="flex gap-1.5 items-center">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => {
                              setHumorLevel(level);
                              triggerHaptic();
                            }}
                            className={`hover:scale-130 active:scale-95 transition-all text-xs cursor-pointer ${
                              level <= humorLevel ? "opacity-100 drop-shadow-[0_0_4px_rgba(245,158,11,0.65)]" : "opacity-15 grayscale font-light"
                            }`}
                            title={`Nivel de Humor ${level}`}
                          >
                            🔥
                          </button>
                        ))}
                        <span className="text-[8.5px] font-extrabold text-amber-500 ml-1.5 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase">LVL {humorLevel}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-400">Nivel de Pragmatismo:</span>
                      <div className="flex gap-1.5 items-center">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => {
                              setPragmatismLevel(level);
                              triggerHaptic();
                            }}
                            className={`hover:scale-130 active:scale-95 transition-all text-xs cursor-pointer ${
                              level <= pragmatismLevel ? "opacity-100 drop-shadow-[0_0_4px_rgba(45,212,191,0.65)]" : "opacity-15 grayscale font-light"
                            }`}
                            title={`Nivel de Pragmatismo ${level}`}
                          >
                            ✅
                          </button>
                        ))}
                        <span className="text-[8.5px] font-extrabold text-[#2dd4bf] ml-1.5 font-mono bg-[#2dd4bf]/10 px-1.5 py-0.5 rounded border border-[#2dd4bf]/20 uppercase">LVL {pragmatismLevel}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* CHAT VIEWPORT - Absolute container focus layout to prevent any scroll overlapping */}
          <main className="flex-grow overflow-y-auto px-4 py-4 space-y-4 scroll-smooth flex flex-col relative z-10 bg-slate-950/40 min-h-0 focus:outline-none">
            
            {/* Guide Info block */}
            <details className="group bg-slate-900/45 border border-slate-900 rounded-2xl overflow-hidden transition-all shrink-0">
              <summary className="p-2.5 text-[11px] tracking-wide text-slate-300 font-mono flex items-center justify-between cursor-pointer list-none select-none">
                <span className="flex items-center gap-1.5">
                  <HelpCircle size={13} className="text-teal-400" />
                  ¿Cómo opera ANTIDRAMA? Ver táctica
                </span>
                <ChevronDown size={12} className="text-slate-500 group-open:hidden" />
                <ChevronUp size={12} className="text-slate-500 hidden group-open:block" />
              </summary>
              <div className="px-3 pb-3 pt-0.5 text-[10.5px] text-slate-400 leading-relaxed space-y-2 border-t border-slate-900/50 font-mono">
                <p>
                  Esta es un Yo Auxiliar modelado bajo la filosofía de "<strong>Menos reacción, más dirección</strong>". Reconoce el drama del ecosistema corporativo sin alimentarlo, devolviéndote la lucidez práctica en 3 pasos ordenados.
                </p>
              </div>
            </details>

            {/* CHAT BUBBLES BLOCK */}
            <div className="space-y-4 flex flex-col justify-end w-full">
              {messages.map((message) => {
                const isUser = message.sender === "user";
                const isWelcome = message.id.startsWith("welcome");

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 16, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 280, damping: 24 }}
                    className={`flex items-start w-full gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* Mockup Coffee Mug circular badge decoration on the left of bot bubble */}
                    {!isUser && (
                      <div className="w-8.5 h-8.5 rounded-full bg-[#1e293b]/90 border border-slate-700/60 flex items-center justify-center text-sm shrink-0 select-none shadow-md">
                        {getDynamicAvatar(message.text)}
                      </div>
                    )}

                    {/* Chat Bubble Body */}
                    <div
                      className={`max-w-[92%] rounded-2xl px-5 py-4 text-sm relative shadow-md transition-all duration-300 ${
                        isUser
                          ? "bg-gradient-to-br from-[#162744] to-[#1a2d4e] text-sky-100 border border-sky-500/20 rounded-tr-none shadow-[0_5px_15px_rgba(14,165,233,0.06)]"
                          : "bg-gradient-to-br from-[#0e1320] to-[#121829] text-slate-100 border border-slate-800/90 rounded-tl-none"
                      }`}
                    >
                      {/* Sub title details inside bubble */}
                      {!isUser && (
                        <span className="text-[9px] font-mono text-[#2dd4bf] block mb-1.5 font-bold uppercase tracking-wider select-none">
                          ANTIDRAMA {message.id.startsWith("error") ? "· ENLACE ERRONEO" : "· Yo Auxiliar"}
                        </span>
                      )}

                      {/* Render formatted step paragraphs / checkboxes */}
                      {isUser ? (
                        <div className="whitespace-pre-line break-words text-inherit font-sans text-[14px] leading-relaxed">
                          {message.text}
                        </div>
                      ) : (
                        <FormattedMessageText text={message.text} onOpenBreathingTool={() => { triggerHaptic(); setShowBreathingModal(true); }} />
                      )}

                      {/* Timestamp labels */}
                      <div className={`mt-3 text-[8.5px] font-mono flex justify-between items-center border-t pt-2 select-none ${
                        isUser 
                          ? "text-sky-305/45 border-sky-500/10" 
                          : "text-slate-400/40 border-slate-800/80"
                      }`}>
                        <span />
                        <span>{message.timestamp}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* LOADING/TYPING DIALOG */}
              {loading && (
                <div className="flex items-start gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-slate-900 border border-teal-500/20 flex items-center justify-center text-sm shrink-0 uppercase tracking-widest text-[#2dd4bf] animate-spin">
                    ☕
                  </div>
                  <div className="bg-slate-900/80 backdrop-blur-md text-slate-200 border border-slate-800/90 px-4 py-3 rounded-2xl rounded-tl-none max-w-[80%] text-xs flex items-center gap-2 shadow-sm">
                    <div className="flex space-x-1 py-1">
                      <span className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-[#2dd4bf] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-slate-400 font-mono text-[9.5px]">Abriendo puerto racional...</span>
                  </div>
                </div>
              )}

              {/* Anchor block for scroll tracking */}
              <div ref={messagesEndRef} />
            </div>

            {/* SPOTIFY EQUALIZER BINAURAL MODULE (Mockup integration support -> Upgraded to EVIDENCE-BASED COGNITIVE GROUNDING MODULE) */}
            {currentWidgetTrack && (() => {
              const guide = COGNITIVE_GUIDES[currentWidgetTrack] || {
                title: currentWidgetTrack,
                subtitle: "Técnica recomendada para recuperar la claridad operativa inmediata.",
                steps: [
                  "Toma una inhalación profunda y prolongada, y exhala lento por boca.",
                  "Enumera un hecho fáctico del día, separándolo de interpretaciones catastróficas.",
                  "Elige una sola micro-acción que puedas realizar en menos de 3 minutos reales."
                ]
              };
              const isExpanded = playingTrack === currentWidgetTrack;
              const stepsState = completedWidgetSteps[currentWidgetTrack] || {};
              
              const toggleStep = (index: number) => {
                setCompletedWidgetSteps(prev => {
                  const currentSteps = prev[currentWidgetTrack!] || {};
                  return {
                    ...prev,
                    [currentWidgetTrack!]: {
                      ...currentSteps,
                      [index]: !currentSteps[index]
                    }
                  };
                });
              };
              
              const totalSteps = guide.steps.length;
              const completedCount = Object.values(stepsState).filter(Boolean).length;
              const percent = totalSteps ? Math.round((completedCount / totalSteps) * 100) : 0;

              return (
                <div id="rescue-track-widget" className="p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950/20 border border-teal-500/20 rounded-2xl shadow-xl mt-3 relative overflow-hidden shrink-0 transition-all duration-300">
                  {/* Subtle decorative glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full filter blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="p-2.5 bg-teal-950/40 border border-teal-500/35 rounded-xl text-teal-400 shrink-0 shadow-inner">
                      <Zap size={14} className={isExpanded ? "animate-pulse text-teal-300" : "text-teal-400"} />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="text-[7.5px] font-mono text-teal-400 font-bold uppercase tracking-widest block">RECURSO COGNITIVO DISPONIBLE</span>
                      <h4 className="text-xs font-bold text-white truncate font-sans mt-0.5">
                        {guide.title}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleTrack(currentWidgetTrack)}
                      className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all font-sans font-semibold text-[10px] flex items-center gap-1.5 select-none ${
                        isExpanded
                          ? "bg-slate-800 border border-slate-700 text-teal-300 hover:bg-slate-750"
                          : "bg-teal-500/20 border border-teal-500/35 text-[#2dd4bf] hover:bg-teal-500/30 active:scale-95"
                      }`}
                    >
                      <span>{isExpanded ? "OCULTAR" : "INICIAR"}</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-slate-900 relative z-10 space-y-3">
                      <p className="text-[11.5px] text-slate-400 font-sans leading-relaxed italic pr-2">
                        {guide.subtitle}
                      </p>
                      
                      {/* Interactive step checklist */}
                      <div className="space-y-2 pr-1">
                        {guide.steps.map((stepText, idx) => {
                          const isCompleted = stepsState[idx] || false;
                          return (
                            <div 
                              key={idx}
                              onClick={() => toggleStep(idx)}
                              className={`p-2.5 rounded-xl text-[12px] leading-relaxed cursor-pointer flex gap-2.5 items-start transition-all border select-none ${
                                isCompleted 
                                  ? "bg-slate-900/40 border-teal-950/20 text-slate-500 line-through scale-[0.98] opacity-60" 
                                  : "bg-slate-950 border-slate-850 text-slate-200 hover:border-teal-500/20 hover:bg-slate-900/40"
                              }`}
                            >
                              <div className={`mt-0.5 h-4 w-4 rounded-md border text-[8px] font-mono font-bold flex items-center justify-center shrink-0 transition-all ${
                                isCompleted 
                                  ? "bg-teal-500/20 border-teal-500 text-teal-400"
                                  : "bg-slate-900 border-slate-750 text-slate-500"
                              }`}>
                                {isCompleted ? "✓" : (idx + 1)}
                              </div>
                              <span className="flex-1 font-sans">{stepText}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Progress bar info */}
                      <div className="pt-2 flex items-center justify-between text-[9px] font-mono text-slate-500 border-t border-slate-900/40">
                        <div className="flex items-center gap-1.5 flex-1 max-w-[80%]">
                          <span className="shrink-0">{percent}% COMPLETADO</span>
                          <div className="h-1.5 flex-grow bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                            <div 
                              className="h-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-305 rounded-full" 
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                        {percent === 100 && (
                          <span className="text-teal-400 font-bold animate-pulse">¡Foco recuperado!</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </main>

          {/* SUGGESTION CHIPS TRAY - Safely aligned below main viewport container to avoid overlaps */}
          <div className="bg-slate-950 border-t border-slate-900 px-4 pt-2 pb-1.5 shrink-0 relative z-20">
            {(() => {
              const selectedType = getSelectedChip();
              const isIraSelected = selectedType === "ira";
              const isMiedoSelected = selectedType === "miedo";
              const isDesmotivacionSelected = selectedType === "desmotivacion";
              const isBajonSelected = selectedType === "bajon";

              return (
                <>
                  <span className="text-[10px] font-mono tracking-wider text-teal-400 uppercase block mb-1 font-bold">
                    ¿Cómo te sentís ahora? (Regulación cognitiva):
                  </span>
                  <div
                    id="quick-action-chips"
                    onMouseMove={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                      e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                    }}
                    onTouchMove={(e) => {
                      if (e.touches.length > 0) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.touches[0].clientX - rect.left;
                        const y = e.touches[0].clientY - rect.top;
                        e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                        e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.setProperty("--mouse-x", "50%");
                      e.currentTarget.style.setProperty("--mouse-y", "50%");
                    }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 py-2.5 select-none w-full"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleChipClick(e, "ira")}
                      className={`group relative w-full overflow-hidden hover:text-white text-[11px] sm:text-xs font-bold py-2.5 rounded-xl whitespace-normal backdrop-blur-md active:scale-[0.96] cursor-pointer transition-all duration-200 ease-out flex items-center justify-center text-center gap-1.5 border leading-tight ${
                        chipClickCounts.ira > 0 ? "pl-4 pr-7" : "px-2 sm:px-3"
                      } ${
                        isIraSelected 
                          ? "border-rose-500 text-white bg-rose-950/40 shadow-[0_0_10px_rgba(244,63,94,0.25)]" 
                          : "border-rose-500/20 text-rose-200/80 bg-slate-900/40 hover:border-rose-500/45 shadow-sm"
                      }`}
                    >
                      {ripples.filter((r) => r.chipType === "ira").map((r) => (
                        <span
                          key={r.id}
                          onAnimationEnd={() => removeRipple(r.id)}
                          className="absolute pointer-events-none rounded-full bg-white/10 animate-ripple-expand"
                          style={{
                            left: r.x - r.size / 2,
                            top: r.y - r.size / 2,
                            width: r.size,
                            height: r.size,
                          }}
                        />
                      ))}
                      {getChipIcon("ira", modes)}
                      <span>{getAdaptedChipData("ira", messages, modes).label}</span>
                      {processingChip === "ira" && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-rose-400 drop-shadow-[0_0_4px_rgba(244,63,94,0.8)] animate-chip-load" />
                      )}
                      {chipClickCounts.ira > 0 && (
                        <span className="absolute top-0.5 right-1 text-[7.5px] font-mono leading-none bg-rose-500/30 border border-rose-500/40 text-rose-300 px-1 py-0.5 rounded-full select-none scale-90 shadow-md transition-all duration-300 group-hover:bg-rose-500/60 group-hover:border-rose-400 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(244,63,94,0.85)] group-hover:scale-95">
                          {chipClickCounts.ira}
                        </span>
                      )}
                    </button>
                    {/* BUTTON 2: MIEDO Y TERROR (MIEDO) */}
                    <button
                      type="button"
                      onClick={(e) => handleChipClick(e, "miedo")}
                      className={`group relative w-full overflow-hidden hover:text-white text-[11px] sm:text-xs font-bold py-2.5 rounded-xl whitespace-normal backdrop-blur-md active:scale-[0.96] cursor-pointer transition-all duration-200 ease-out flex items-center justify-center text-center gap-1.5 border leading-tight ${
                        chipClickCounts.miedo > 0 ? "pl-4 pr-7" : "px-2 sm:px-3"
                      } ${
                        isMiedoSelected 
                          ? "border-amber-500 text-white bg-amber-950/40 shadow-[0_0_10px_rgba(245,158,11,0.25)]" 
                          : "border-amber-500/20 text-amber-200/80 bg-slate-900/40 hover:border-amber-500/45 shadow-sm"
                      }`}
                    >
                      {ripples.filter((r) => r.chipType === "miedo").map((r) => (
                        <span
                          key={r.id}
                          onAnimationEnd={() => removeRipple(r.id)}
                          className="absolute pointer-events-none rounded-full bg-white/10 animate-ripple-expand"
                          style={{
                            left: r.x - r.size / 2,
                            top: r.y - r.size / 2,
                            width: r.size,
                            height: r.size,
                          }}
                        />
                      ))}
                      {getChipIcon("miedo", modes)}
                      <span>{getAdaptedChipData("miedo", messages, modes).label}</span>
                      {processingChip === "miedo" && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)] animate-chip-load" />
                      )}
                      {chipClickCounts.miedo > 0 && (
                        <span className="absolute top-0.5 right-1 text-[7.5px] font-mono leading-none bg-amber-500/30 border border-amber-500/40 text-amber-300 px-1 py-0.5 rounded-full select-none scale-90 shadow-md transition-all duration-300 group-hover:bg-amber-500/60 group-hover:border-amber-400 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(245,158,11,0.85)] group-hover:scale-95">
                          {chipClickCounts.miedo}
                        </span>
                      )}
                    </button>
                    {/* BUTTON 3: DESMOTIVACIÓN (DESMOTIVACION) */}
                    <button
                      type="button"
                      onClick={(e) => handleChipClick(e, "desmotivacion")}
                      className={`group relative w-full overflow-hidden hover:text-white text-[11px] sm:text-xs font-bold py-2.5 rounded-xl whitespace-normal backdrop-blur-md active:scale-[0.96] cursor-pointer transition-all duration-200 ease-out flex items-center justify-center text-center gap-1.5 border leading-tight ${
                        chipClickCounts.desmotivacion > 0 ? "pl-4 pr-7" : "px-2 sm:px-3"
                      } ${
                        isDesmotivacionSelected 
                          ? "border-indigo-500 text-white bg-indigo-950/40 shadow-[0_0_10px_rgba(99,102,241,0.25)]" 
                          : "border-indigo-500/20 text-indigo-200/80 bg-slate-900/40 hover:border-indigo-500/45 shadow-sm"
                      }`}
                    >
                      {ripples.filter((r) => r.chipType === "desmotivacion").map((r) => (
                        <span
                          key={r.id}
                          onAnimationEnd={() => removeRipple(r.id)}
                          className="absolute pointer-events-none rounded-full bg-white/10 animate-ripple-expand"
                          style={{
                            left: r.x - r.size / 2,
                            top: r.y - r.size / 2,
                            width: r.size,
                            height: r.size,
                          }}
                        />
                      ))}
                      {getChipIcon("desmotivacion", modes)}
                      <span>{getAdaptedChipData("desmotivacion", messages, modes).label}</span>
                      {processingChip === "desmotivacion" && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-indigo-400 drop-shadow-[0_0_4px_rgba(99,102,241,0.8)] animate-chip-load" />
                      )}
                      {chipClickCounts.desmotivacion > 0 && (
                        <span className="absolute top-0.5 right-1 text-[7.5px] font-mono leading-none bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 px-1 py-0.5 rounded-full select-none scale-90 shadow-md transition-all duration-300 group-hover:bg-indigo-500/60 group-hover:border-indigo-400 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(99,102,241,0.85)] group-hover:scale-95">
                          {chipClickCounts.desmotivacion}
                        </span>
                      )}
                    </button>
                    {/* BUTTON 4: BAJÓN (BAJON) */}
                    <button
                      type="button"
                      onClick={(e) => handleChipClick(e, "bajon")}
                      className={`group relative w-full overflow-hidden hover:text-white text-[11px] sm:text-xs font-bold py-2.5 rounded-xl whitespace-normal backdrop-blur-md active:scale-[0.96] cursor-pointer transition-all duration-200 ease-out flex items-center justify-center text-center gap-1.5 border leading-tight ${
                        chipClickCounts.bajon > 0 ? "pl-4 pr-7" : "px-2 sm:px-3"
                      } ${
                        isBajonSelected 
                          ? "border-emerald-500 text-white bg-emerald-950/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]" 
                          : "border-emerald-500/20 text-emerald-200/80 bg-slate-900/40 hover:border-emerald-500/45 shadow-sm"
                      }`}
                    >
                      {ripples.filter((r) => r.chipType === "bajon").map((r) => (
                        <span
                          key={r.id}
                          onAnimationEnd={() => removeRipple(r.id)}
                          className="absolute pointer-events-none rounded-full bg-white/10 animate-ripple-expand"
                          style={{
                            left: r.x - r.size / 2,
                            top: r.y - r.size / 2,
                            width: r.size,
                            height: r.size,
                          }}
                        />
                      ))}
                      {getChipIcon("bajon", modes)}
                      <span>{getAdaptedChipData("bajon", messages, modes).label}</span>
                      {processingChip === "bajon" && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-emerald-400 drop-shadow-[0_0_4px_rgba(16,185,129,0.8)] animate-chip-load" />
                      )}
                      {chipClickCounts.bajon > 0 && (
                        <span className="absolute top-0.5 right-1 text-[7.5px] font-mono leading-none bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 px-1 py-0.5 rounded-full select-none scale-90 shadow-md transition-all duration-300 group-hover:bg-emerald-500/60 group-hover:border-emerald-400 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(16,185,129,0.85)] group-hover:scale-95">
                          {chipClickCounts.bajon}
                        </span>
                      )}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>

          {/* LOWER INTERACTIVE TAB SELECTION ROWS */}
          <div id="mode-selectors" className="px-4 py-1.5 bg-slate-950 border-t border-slate-900/60 flex justify-between items-center select-none gap-2 shrink-0 relative z-20">
            
            {/* Mode Foco */}
            <button
              type="button"
              onClick={() => setModes(prev => ({ ...prev, foco: !prev.foco }))}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-xl border text-[10px] font-semibold tracking-tight transition-all cursor-pointer ${
                modes.foco
                  ? "bg-violet-950/40 border-violet-500/50 text-[#a78bfa] shadow"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-350"
              }`}
            >
              <Target size={11} className={modes.foco ? "text-violet-400" : ""} />
              <span>Modo Foco</span>
            </button>

            {/* Mode Humor */}
            <button
              type="button"
              onClick={() => setModes(prev => ({ ...prev, humor: !prev.humor }))}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-xl border text-[10px] font-semibold tracking-tight transition-all cursor-pointer ${
                modes.humor
                  ? "bg-amber-950/40 border-amber-500/50 text-[#f59e0b] shadow"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-350"
              }`}
            >
              <Flame size={11} className={modes.humor ? "text-amber-500 animate-pulse" : ""} />
              <span>Humor Ácido</span>
            </button>

            {/* Mode Rescue */}
            <button
              type="button"
              onClick={() => {
                const nextRescate = !modes.rescate;
                setModes(prev => ({ ...prev, rescate: nextRescate }));
                if (nextRescate) {
                  setMetrics({ saturacion: 98, foco: 5, energia: 15 });
                  setCurrentWidgetTrack("Suspiro Fisiológico Huberman");
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-0.5 rounded-xl border text-[10px] font-semibold tracking-tight transition-all cursor-pointer ${
                modes.rescate
                  ? "bg-rose-950/40 border-rose-500/50 text-rose-300 shadow"
                  : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-350"
              }`}
            >
              <AlertCircle size={11} className={modes.rescate ? "text-rose-400 animate-bounce" : ""} />
              <span>SOS Rescate</span>
            </button>
          </div>

          {/* INPUT FORM FOOTER */}
          <footer className="p-4 bg-slate-950 border-t border-slate-900 shrink-0 relative z-20 pb-5">
            <form 
              onSubmit={handleSend} 
              className="flex gap-2 bg-[#10192a] hover:bg-[#132035] p-2 rounded-2xl border border-slate-800/90 focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all duration-200 relative items-center shadow-lg"
            >
              <input
                id="message-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribí de qué querés bajarte hoy... (Ctrl+Enter)"
                disabled={loading}
                className="bg-transparent flex-1 outline-none px-3 py-1.5 text-sm text-[#f8fafc] placeholder-slate-500 disabled:opacity-50"
              />

              <div className="flex items-center gap-1.5 shrink-0 px-1">
                {speechSupported && (
                  <button
                    type="button"
                    onClick={handleVoiceToggle}
                    title={isListening ? "Parar Grabación" : "Dictar estrés"}
                    className={`p-2 rounded-xl transition-all h-9 w-9 flex items-center justify-center cursor-pointer ${
                      isListening
                        ? "bg-rose-500 text-slate-950 animate-pulse"
                        : "bg-slate-850 text-rose-300 hover:text-rose-200 hover:bg-slate-800"
                    }`}
                  >
                    {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                )}

                <button
                  id="send-button"
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="bg-[#2dd4bf] text-slate-950 h-9 w-9 rounded-xl flex items-center justify-center hover:bg-teal-300 active:scale-95 disabled:opacity-20 transition-all cursor-pointer shadow-md shadow-teal-500/10"
                >
                  <Send size={14} />
                </button>
              </div>
            </form>

            {/* LOWER HARDWARE HOME DASH BAR */}
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-2 px-1 select-none font-mono">
              <span>Filtros: {modes.foco ? "Foco " : ""}{modes.humor ? "Humor " : ""}{modes.rescate ? "Rescate" : ""} {(!modes.foco && !modes.humor && !modes.rescate) ? "Estándar" : ""}</span>
              <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto mt-1 opacity-70" />
              <span>{new Date().toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
            </div>
          </footer>

          {/* Elegant Toast notification absolute floating bubble */}
          <AnimatePresence>
            {toastMsg && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="absolute bottom-20 left-4 right-4 bg-slate-950/95 border border-teal-500/40 text-[#2dd4bf] text-xs font-semibold py-3 px-4 rounded-2xl shadow-[0_10px_25px_-5px_rgba(45,212,191,0.25)] flex items-center gap-2.5 z-[100] font-sans"
              >
                <CheckCircle size={15} className="shrink-0 text-[#2dd4bf]" />
                <span>{toastMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Centering Breathing Modal Overlay */}
          <CenteringBreathingModal
            isOpen={showBreathingModal}
            onClose={() => setShowBreathingModal(false)}
            onComplete={() => {
              setMetrics((prev) => {
                const nextSat = Math.max(0, prev.saturacion - 20);
                const nextFoc = Math.min(100, prev.foco + 15);
                const nextEne = Math.min(100, prev.energia + 10);
                return {
                  saturacion: nextSat,
                  foco: nextFoc,
                  energia: nextEne
                };
              });
              showToast("Calibración completada: Saturación -20% | Foco +15% | Energía +10%");
            }}
          />

          {/* Framer-Motion Powered Firebase Auth Glassmorphic Modal */}
          <AnimatePresence>
            {showAuthModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-[110] flex items-center justify-center p-4"
              >
                <motion.div
                  initial={{ scale: 0.94, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.94, y: 15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 350 }}
                  className="w-full max-w-[340px] bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl shadow-slate-950/90 text-slate-100 flex flex-col gap-4 font-sans"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-sky-400 font-mono text-[10px] font-bold tracking-wider uppercase">
                        <Cloud size={12} className="animate-bounce" />
                        <span>Respaldo Firebase</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-100 font-sans">
                        {firebaseUser ? "Sincronización Activa" : isSignUp ? "Crear una Cuenta" : "Iniciar Sesión"}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        setShowAuthModal(false);
                        setAuthError(null);
                      }}
                      className="text-slate-400 hover:text-white px-2 py-1 bg-slate-950/40 border border-slate-800 rounded-xl text-[10px] font-mono transition-all cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>

                  {firebaseUser ? (
                    /* Currently logged in state */
                    <div className="space-y-4 py-1.5">
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-4 flex flex-col gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-500/20 border border-emerald-500/40 p-2.5 rounded-xl text-emerald-400">
                            <UserIcon size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-slate-500 uppercase">Usuario actual</p>
                            <p className="text-xs font-semibold text-slate-200 truncate">{firebaseUser.email || "Invitado Anónimo"}</p>
                          </div>
                        </div>
                        <div className="h-px bg-slate-800/40 my-1" />
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>Estado:</span>
                          <span className="text-emerald-400 font-sans font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Nube Sincronizada
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-300">
                          <span>ID de Cuenta:</span>
                          <span className="font-mono text-[10px] text-slate-400">{firebaseUser.uid.substring(0, 8)}...</span>
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          setAuthLoading(true);
                          try {
                            await signOut(auth);
                            // Reset state
                            setMessages(INITIAL_MESSAGES);
                            setToastMsg("Sesión cerrada. Regresando a local.");
                            setTimeout(() => setToastMsg(null), 3000);
                            setShowAuthModal(false);
                          } catch (e: any) {
                            console.error(e);
                          } finally {
                            setAuthLoading(false);
                          }
                        }}
                        disabled={authLoading}
                        className="w-full py-2.5 px-4 bg-rose-500 hover:bg-rose-600 text-slate-950 border border-thin border-rose-400/20 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer transform active:scale-98"
                      >
                        <LogOut size={13} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  ) : (
                    /* Login & Signup forms */
                    <div className="space-y-3.5">
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Sincroniza tus configuraciones de humor, métricas de calibración y todo tu historial de chat de forma segura para tener acceso en cualquier pantalla o navegador.
                      </p>

                      {/* Control de Pestañas (Selector) */}
                      <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(false);
                            setAuthError(null);
                          }}
                          className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center ${
                            !isSignUp 
                              ? "bg-slate-800 text-[#5cdcf7]" 
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          🔑 Acceder
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSignUp(true);
                            setAuthError(null);
                          }}
                          className={`flex-1 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center ${
                            isSignUp 
                              ? "bg-[#2dd4bf] text-slate-950 shadow-md shadow-teal-500/10" 
                              : "text-slate-500 hover:text-slate-300"
                          }`}
                        >
                          💾 Guardar / Registrar
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 block">CORREO ELECTRÓNICO (Usuario)</label>
                          <div className="relative">
                            <Mail size={12} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500" />
                            <input
                              type="email"
                              value={authEmail}
                              onChange={(e) => setAuthEmail(e.target.value)}
                              placeholder="nombre@ejemplo.com"
                              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all font-sans"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-slate-400 block">CONTRASEÑA</label>
                          <div className="relative">
                            <Lock size={12} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-500" />
                            <input
                              type="password"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/20 transition-all font-sans"
                            />
                          </div>
                        </div>
                      </div>

                      {authError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 text-[10.5px] text-red-400 flex items-start gap-1.5 leading-relaxed font-sans mt-1">
                          <span className="shrink-0 mt-0.5 text-red-400">⚠️</span>
                          <span>{authError}</span>
                        </div>
                      )}

                      <div className="flex flex-col gap-2 mt-3">
                        <button
                          onClick={async () => {
                            if (!authEmail || !authPassword) {
                              setAuthError("Indica un email y contraseña válidos.");
                              return;
                            }
                            setAuthLoading(true);
                            setAuthError(null);
                            try {
                              if (isSignUp) {
                                await createUserWithEmailAndPassword(auth, authEmail, authPassword);
                                setToastMsg("¡Cuenta creada correctamente!");
                              } else {
                                await signInWithEmailAndPassword(auth, authEmail, authPassword);
                                setToastMsg("¡Sesión iniciada con éxito!");
                              }
                              setTimeout(() => setToastMsg(null), 3000);
                              setShowAuthModal(false);
                            } catch (err: any) {
                              console.error(err);
                              let errMsg = err.message || "Error al autenticarse.";
                              if (err.code === "auth/wrong-password") errMsg = "Contraseña incorrecta.";
                              if (err.code === "auth/user-not-found") errMsg = "Usuario no registrado.";
                              if (err.code === "auth/email-already-in-use") errMsg = "El email ya está registrado.";
                              if (err.code === "auth/invalid-email") errMsg = "Formato de email inválido.";
                              if (err.code === "auth/weak-password") errMsg = "La contraseña debe tener al menos 6 caracteres.";
                              setAuthError(errMsg);
                            } finally {
                              setAuthLoading(false);
                            }
                          }}
                          disabled={authLoading}
                          className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer transform active:scale-98 relative overflow-hidden uppercase tracking-wider ${
                            isSignUp
                              ? "bg-[#2dd4bf] hover:bg-teal-300 text-slate-950 shadow-md shadow-teal-500/20 font-sans"
                              : "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md font-sans"
                          }`}
                        >
                          {authLoading ? (
                            <RefreshCw size={13} className="animate-spin text-slate-950" />
                          ) : isSignUp ? (
                            <>
                              <UserIcon size={13} />
                              <span>💾 GUARDAR Y CREAR CUENTA</span>
                            </>
                          ) : (
                            <>
                              <LogIn size={13} />
                              <span>🔑 ENTRAR / INICIAR SESIÓN</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={async () => {
                            setAuthLoading(true);
                            setAuthError(null);
                            try {
                              await signInAnonymously(auth);
                              setToastMsg("Conectado de forma Anónima.");
                              setTimeout(() => setToastMsg(null), 3000);
                              setShowAuthModal(false);
                            } catch (err: any) {
                              console.error(err);
                              setAuthError("Error al iniciar acceso rápido.");
                            } finally {
                              setAuthLoading(false);
                            }
                          }}
                          disabled={authLoading}
                          className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-sky-300 border border-slate-800 text-xs font-medium rounded-xl transition-all cursor-pointer transform active:scale-98"
                        >
                          Entrar de forma Anónima (Acceso Rápido)
                        </button>

                        <div className="relative my-1 text-center">
                          <hr className="border-slate-800/80" />
                          <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#020617] px-2 text-[9px] font-mono text-slate-500 uppercase">Ó</span>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            setAuthLoading(true);
                            setAuthError(null);
                            try {
                              const provider = new GithubAuthProvider();
                              await signInWithPopup(auth, provider);
                              setToastMsg("¡Conectado con GitHub con éxito!");
                              setTimeout(() => setToastMsg(null), 3000);
                              setShowAuthModal(false);
                            } catch (err: any) {
                              console.error(err);
                              let errMsg = err.message || "Error al autenticarse con GitHub.";
                              if (err.code === "auth/popup-blocked") {
                                errMsg = "El navegador bloqueó la ventana emergente de GitHub. Habilita las ventanas emergentes en tu navegador.";
                              } else if (err.code === "auth/account-exists-with-different-credential") {
                                errMsg = "Ya existe una cuenta con el mismo correo usando otro método (ej. contraseña).";
                              } else if (err.code === "auth/auth-domain-config-required") {
                                errMsg = "Falta configurar el dominio de autenticación en la consola de Firebase.";
                              } else if (err.code === "auth/operation-not-allowed") {
                                errMsg = "El método de inicio de sesión de GitHub no está habilitado en tu Consola de Firebase.";
                              }
                              setAuthError(errMsg);
                            } finally {
                              setAuthLoading(false);
                            }
                          }}
                          disabled={authLoading}
                          className="w-full py-2.5 bg-[#24292e] hover:bg-[#2f363d] border border-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98 uppercase tracking-wider"
                        >
                          <Github size={13} className="text-white" />
                          <span>CONTINUAR CON GITHUB</span>
                        </button>
                      </div>

                      <div className="text-center mt-1">
                        <button
                          onClick={() => {
                            setIsSignUp(!isSignUp);
                            setAuthError(null);
                          }}
                          className="text-[10px] font-mono text-slate-500 hover:text-slate-300 transition-all cursor-pointer underline decoration-dotted underline-offset-2"
                        >
                          {isSignUp ? "¿Ya tienes una cuenta? Inicia sesión acá" : "¿No tienes cuenta? Regístrate y guarda aquí"}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
