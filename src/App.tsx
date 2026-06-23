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
import RadarChart from "./components/RadarChart";
import { Message, RobotState, RadarMetrics, AntidramaModes } from "./types";
import { motion, AnimatePresence } from "motion/react";

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
    <div className="space-y-3 font-sans leading-relaxed text-sm text-slate-100 mt-1">
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
              className={`p-3 rounded-2xl border transition-all duration-350 cursor-pointer flex gap-3 items-start select-none group ${
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
              <div className="flex-1 text-[14px] leading-6 text-inherit font-sans font-medium">
                {bodyText}
              </div>
            </motion.div>
          );
        }
        
        // Regular line paragraphs, given high breathing line height (leading-6)
        return (
          <p key={idx} className="text-[14px] leading-6 text-slate-300 font-sans px-1">
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
            <span>Iniciar Respirómetro de Calma (Box Breathing)</span>
          </button>
        </motion.div>
      )}
    </div>
  );
}

interface TacticalBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

function TacticalBreathingModal({ isOpen, onClose, onComplete }: TacticalBreathingModalProps) {
  const [phase, setPhase] = useState<"ready" | "inhale" | "exhale" | "done">("ready");
  const [timer, setTimer] = useState(4);
  const [cycle, setCycle] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const INHALE_DURATION = 4;
  const EXHALE_DURATION = 6;
  const TOTAL_CYCLES = 6;

  // Web Audio API: soft optional tones for calm phase changes.
  const playPitch = (freqStart: number, freqEnd: number, duration: number, type: OscillatorType = "sine") => {
    if (isMuted) return;
    try {
      const audioCtx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContextRef.current) {
        audioContextRef.current = audioCtx;
      }
      
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      const filterNode = audioCtx.createBiquadFilter();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freqStart, audioCtx.currentTime);
      if (freqEnd !== freqStart) {
        osc.frequency.linearRampToValueAtTime(freqEnd, audioCtx.currentTime + duration);
      }

      filterNode.type = "lowpass";
      filterNode.frequency.setValueAtTime(900, audioCtx.currentTime);
      
      // Soft envelope to avoid clicks
      gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.012, audioCtx.currentTime + 0.45);
      gainNode.gain.setValueAtTime(0.012, audioCtx.currentTime + duration - 0.45);
      gainNode.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      
      osc.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
      
      soundRef.current = { osc, gainNode };
    } catch (e) {
      console.warn("Audio Context could not start", e);
    }
  };

  const stopSound = () => {
    if (soundRef.current) {
      try {
        soundRef.current.osc.stop();
      } catch (e) {}
      soundRef.current = null;
    }
  };

  // Phase controller
  useEffect(() => {
    if (!isOpen) return;
    if (phase === "ready" || phase === "done") {
      stopSound();
      return;
    }

    if (phase === "inhale") {
      playPitch(174, 196, INHALE_DURATION, "sine");
    } else if (phase === "exhale") {
      playPitch(196, 164, EXHALE_DURATION, "sine");
    }

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Time to transition to next phase
          setPhase((currPhase) => {
            switch (currPhase) {
              case "inhale":
                return "exhale";
              case "exhale":
                if (cycle >= TOTAL_CYCLES) {
                  onComplete();
                  return "done";
                } else {
                  setCycle((c) => c + 1);
                  return "inhale";
                }
              default:
                return "ready";
            }
          });
          return phase === "inhale" ? EXHALE_DURATION : INHALE_DURATION;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      stopSound();
    };
  }, [phase, cycle, isOpen]);

  // Handle closing or resetting
  useEffect(() => {
    if (!isOpen) {
      setPhase("ready");
      setCycle(1);
      setTimer(INHALE_DURATION);
      stopSound();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPhaseColorAndText = () => {
    switch (phase) {
      case "ready":
        return {
          title: "Respiración de Centro",
          subtitle: "Inhalá suave. Exhalá más lento.",
          text: "Un minuto para volver al cuerpo. No hay que resolver todo ahora: primero recuperá dirección.",
          color: "border-teal-500 text-teal-300",
          bgGlow: "bg-teal-500/10",
          scale: 1.0,
        };
      case "inhale":
        return {
          title: "INHALÁ",
          subtitle: "4 segundos",
          text: "Inhalá por la nariz, sin forzar. Dejá que el círculo crezca con vos.",
          color: "border-emerald-400 text-emerald-300",
          bgGlow: "bg-emerald-500/20 shadow-[0_0_50px_rgba(52,211,153,0.35)]",
          scale: 1.4,
        };
      case "exhale":
        return {
          title: "EXHALÁ",
          subtitle: "6 segundos",
          text: "Exhalá más lento de lo que inhalaste. Aflojá hombros, mandíbula y manos.",
          color: "border-indigo-400 text-indigo-300",
          bgGlow: "bg-indigo-500/20 shadow-[0_0_50px_rgba(129,140,248,0.28)]",
          scale: 0.9,
        };
      case "done":
        return {
          title: "Centro Recuperado",
          subtitle: "Dirección estabilizada",
          text: "Listo. No resolviste todo. Recuperaste dirección, que es lo primero.",
          color: "border-teal-500 text-white",
          bgGlow: "bg-teal-500/20 shadow-[0_0_40px_rgba(45,212,191,0.35)]",
          scale: 1.1,
        };
    }
  };

  const config = getPhaseColorAndText();

  const handleStart = () => {
    // Unblock AudioContext on user interaction
    if (window.AudioContext || (window as any).webkitAudioContext) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
      } catch (err) {}
    }
    setPhase("inhale");
    setTimer(INHALE_DURATION);
    setCycle(1);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 select-none">
        {/* Backdrop overlay blur blur-md */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Breathing Center Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative bg-gradient-to-br from-[#0c111e] to-[#121c33] border border-teal-500/25 rounded-3xl p-6 w-full max-w-sm shadow-[0_20px_50px_rgba(45,212,191,0.12)] overflow-hidden text-center flex flex-col items-center"
        >
          {/* Top subtle visual rail line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-500/10 via-teal-500/50 to-teal-500/10" />

          {/* Mute Toggle / Close Top Header Row */}
          <div className="w-full flex justify-between items-center mb-4 text-slate-400">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-300 transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-mono"
            >
              {isMuted ? (
                <>
                  <Volume2 size={13} className="text-slate-500 line-through opacity-70" />
                  <span>MUDO</span>
                </>
              ) : (
                <>
                  <Volume2 size={13} className="text-[#2dd4bf]" />
                  <span>SONIDO SUAVE</span>
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="text-[10px] font-mono hover:text-[#2dd4bf] transition-all bg-slate-900/40 hover:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800/80 cursor-pointer"
            >
              SALIR ×
            </button>
          </div>

          <span className="text-[8.5px] font-mono text-teal-400 font-bold uppercase tracking-widest block mb-1">
            ANTIDRAMA · PAUSA GUIADA
          </span>
          <h2 className="text-lg font-bold text-white tracking-tight leading-none mb-1">
            {config.title}
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mb-6 uppercase tracking-wider">
            {config.subtitle}
          </p>

          {/* CENTRAL PULSATING CIRCLE VISUALIZER CONTAINER */}
          <div className="h-44 w-full flex items-center justify-center mb-6 relative">
            
            {/* Ambient Background Wave effect (glowing circle behind) */}
            <motion.div
              animate={{
                scale: phase === "ready" || phase === "done" ? 1.0 : config.scale * 1.15,
                opacity: phase === "ready" || phase === "done" ? 0.3 : [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: phase === "inhale" ? INHALE_DURATION : phase === "exhale" ? EXHALE_DURATION : 2,
                repeat: 0,
                ease: "easeInOut",
              }}
              className={`absolute rounded-full w-28 h-28 ${config.bgGlow} transition-colors duration-1000 -z-10`}
            />

            {/* Inner Interactive Circle with timers / cues */}
            <motion.div
              animate={{
                scale: phase === "ready" || phase === "done" ? 1.0 : config.scale,
                borderWidth: phase === "ready" || phase === "done" ? "1px" : "3px",
              }}
              transition={{
                duration: phase === "inhale" || phase === "exhale" ? 4 : 0.5,
                ease: "easeInOut",
              }}
              className={`w-28 h-28 rounded-full border border-teal-500/30 bg-slate-950/90 flex flex-col items-center justify-center transition-colors duration-1000 ${config.color} relative shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)]`}
            >
              {phase === "ready" && (
                <Activity size={24} className="text-[#2dd4bf] animate-pulse" />
              )}

              {phase === "done" && (
                <CheckCircle size={24} className="text-[#2dd4bf] animate-bounce" />
              )}

              {phase !== "ready" && phase !== "done" && (
                <div className="flex flex-col items-center justify-center select-none">
                  {/* Realtime Second Indicator */}
                  <span className="text-3xl font-mono font-bold tracking-tighter leading-none">
                    {timer}
                  </span>
                  <span className="text-[7.5px] font-mono text-slate-400 mt-1 uppercase tracking-widest font-bold">
                    segundos
                  </span>
                </div>
              )}
            </motion.div>
          </div>

          {/* EXPLANATORY CAPTION DETAILS */}
          <div className="px-2 min-h-[50px] mb-6">
            <p className="text-[11.5px] leading-5 text-slate-300 font-sans">
              {config.text}
            </p>
          </div>

          {/* LOWER INTERACTION CONTROLS */}
          <div className="w-full space-y-3">
            {phase === "ready" && (
              <button
                type="button"
                onClick={handleStart}
                className="w-full py-3 px-4 bg-[#2dd4bf] hover:bg-teal-300 text-slate-950 rounded-2xl text-xs font-bold shadow-[0_4px_15px_rgba(45,212,191,0.25)] hover:shadow-[0_4px_22px_rgba(45,212,191,0.35)] transition-all cursor-pointer transform active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Play size={13} fill="currentColor" />
                <span>EMPEZAR 1 MINUTO</span>
              </button>
            )}

            {phase !== "ready" && phase !== "done" && (
              <div className="space-y-3">
                {/* Visual grid cycle indicators */}
                <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 flex justify-between items-center px-3.5">
                  <span className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                    Ciclo del ejercicio:
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <span
                        key={num}
                        className={`w-2 h-2 rounded-full border transition-all ${
                          num < cycle
                            ? "bg-emerald-400 border-emerald-400"
                            : num === cycle
                            ? "bg-teal-400 border-teal-400 animate-pulse"
                            : "bg-slate-950 border-slate-800/80"
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
                  Reiniciar Proceso
                </button>
              </div>
            )}

            {phase === "done" && (
              <div className="space-y-2">
                <p className="text-[9px] font-mono text-[#2dd4bf] uppercase font-bold animate-pulse">
                  ✓ Respiración completada
                </p>
                
                <button
                  type="button"
                  onClick={() => {
                    setPhase("ready");
                    onClose();
                  }}
                  className="w-full py-3 px-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 rounded-2xl text-xs font-bold hover:shadow-[0_4px_15px_rgba(45,212,191,0.25)] transition-all cursor-pointer transform active:scale-95"
                >
                  VOLVER AL CHAT
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
    text: "Hola. Soy ANTIDRAMA, tu Yo Auxiliar operativo. Descomprimamos el ruido mental. Acá no hay discursos motivacionales vacíos ni palmaditas de condescendencia.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    radarSnapshot: DEFAULT_METRICS
  },
  {
    id: "welcome-2",
    sender: "bot",
    text: "Paso 1: Escribime qué te tiene al borde de explotar o qué entrega te está quemando la cabeza.\n\nPaso 2: Vamos a encontrar la próxima acción concreta para los próximos 5 minutos sin vueltas corporativas.",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    radarSnapshot: DEFAULT_METRICS
  }
];

interface ChipConfig {
  label: string;
  simulatedText: string;
}

const getAdaptedChipData = (
  type: "exploto" | "caos" | "energia" | "ordenar",
  history: Message[]
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

  if (hasExhaustion) {
    switch (type) {
      case "exploto":
        return {
          label: "Necesito pausa",
          simulatedText: "Ya no puedo centrar la vista en el monitor. Necesito parar 5 minutos antes de tener un colapso cognitivo y físico."
        };
      case "caos":
        return {
          label: "Pestaña tildada",
          simulatedText: "Tengo demasiadas ventanas virtuales e internas abiertas en el cerebro y ya ninguna responde. Necesito resetear ya."
        };
      case "energia":
        return {
          label: "Batería en 0%",
          simulatedText: "Estoy funcionando puramente por inercia física. Mi reserva de energía operativa se agotó por completo."
        };
      case "ordenar":
        return {
          label: "Rutina mínima",
          simulatedText: "Dame la versión ultra simplificada y de mínimo esfuerzo mental para sobrevivir lo que queda del turno sin colapsar."
        };
    }
  }

  if (hasConflict) {
    switch (type) {
      case "exploto":
        return {
          label: "Ira contenida",
          simulatedText: "Me mandaron una crítica pasivo-agresiva de un entregable por correo y estoy respirando hondo para no responder en caliente."
        };
      case "caos":
        return {
          label: "Fuego cruzado",
          simulatedText: "Me están lloviendo reclamos cruzados de distintas áreas de la empresa y cada uno se lava las manos. El ambiente me satura."
        };
      case "energia":
        return {
          label: "Drenado mental",
          simulatedText: "La hipocresía corporativa y el micromanagement estéril de mi jefe me consumieron la poca paciencia que me quedaba hoy."
        };
      case "ordenar":
        return {
          label: "Traducir drama",
          simulatedText: "Ayudame a desarmar el drama de este mensaje tóxico de la oficina y extraer los dos datos duros que realmente importan."
        };
    }
  }

  if (hasOverwhelm) {
    switch (type) {
      case "exploto":
        return {
          label: "Contra reloj",
          simulatedText: "La entrega vence hoy, tengo el tiempo encima y el pánico de no llegar a terminarlo me está paralizando el análisis."
        };
      case "caos":
        return {
          label: "Incendio activo",
          simulatedText: "Tengo tres entregas urgentes 'para ayer', todas parecen críticas y mi cerebro no logra arrancar por el estrés de elegir."
        };
      case "energia":
        return {
          label: "Foco fundido",
          simulatedText: "Vengo corriendo al triple de velocidad toda la semana y de repente me quedé sin combustible mental para terminar el sprint."
        };
      case "ordenar":
        return {
          label: "Embudo crítico",
          simulatedText: "Filtremos todo el ruido colateral: ¿cuál es la única acción indispensable que si no hago hoy genera un desastre real?"
        };
    }
  }

  // Default values
  switch (type) {
    case "exploto":
      return {
        label: "Exploto",
        simulatedText: "¡La presentación del lunes me tiene devastado! Tengo mil correos cruzados y mi jefe exige un reporte imposible."
      };
    case "caos":
      return {
        label: "Caos total",
        simulatedText: "Tengo un caos absoluto en la cabeza. Demasiado ruido en Slack y ninguna prioridad real clara."
      };
    case "energia":
      return {
        label: "Sin energía",
        simulatedText: "No me queda nada de reserva operativa. Tengo la mente tildada frente al monitor, sigo por inercia."
      };
    case "ordenar":
      return {
        label: "Filtrar",
        simulatedText: "Solo necesito filtrar el teatro corporativo. Ayudame a ver qué es lo verdaderamente urgente hoy."
      };
  }
};

const getChipIcon = (
  type: "exploto" | "caos" | "energia" | "ordenar",
  modes: AntidramaModes
) => {
  const iconSize = 13;
  if (type === "exploto") {
    if (modes.rescate) {
      return <LifeBuoy size={iconSize} className="animate-spin-slow text-rose-300 drop-shadow-[0_0_3px_rgba(244,63,94,0.6)]" />;
    }
    if (modes.foco) {
      return <Target size={iconSize} className="animate-pulse text-rose-300 drop-shadow-[0_0_3px_rgba(244,63,94,0.6)]" />;
    }
    return <Zap size={iconSize} className="text-rose-400 fill-rose-500/20 drop-shadow-[0_0_1px_rgba(244,63,94,0.4)]" />;
  }
  if (type === "caos") {
    if (modes.rescate) {
      return <Flame size={iconSize} className="animate-bounce text-violet-300 drop-shadow-[0_0_3px_rgba(139,92,246,0.6)]" />;
    }
    if (modes.foco) {
      return <Compass size={iconSize} className="animate-spin-slow text-violet-300 drop-shadow-[0_0_3px_rgba(139,92,246,0.6)]" />;
    }
    return <AlertCircle size={iconSize} className="text-violet-400 drop-shadow-[0_0_1px_rgba(139,92,246,0.4)]" />;
  }
  if (type === "energia") {
    if (modes.rescate) {
      return <Sparkles size={iconSize} className="animate-pulse text-amber-300 drop-shadow-[0_0_3px_rgba(245,158,11,0.6)]" />;
    }
    if (modes.foco) {
      return <Activity size={iconSize} className="animate-pulse text-amber-300 drop-shadow-[0_0_3px_rgba(245,158,11,0.6)]" />;
    }
    return <Zap size={iconSize} className="text-amber-400 drop-shadow-[0_0_1px_rgba(245,158,11,0.4)]" />;
  }
  // "ordenar" / "filtrar"
  if (type === "ordenar") {
    if (modes.rescate) {
      return <SlidersHorizontal size={iconSize} className="text-teal-300 drop-shadow-[0_0_3px_rgba(20,184,166,0.6)]" />;
    }
    if (modes.foco) {
      return <Sliders size={iconSize} className="text-teal-300 drop-shadow-[0_0_3px_rgba(20,184,166,0.6)]" />;
    }
    return <Settings size={iconSize} className="animate-spin-slow text-teal-400 drop-shadow-[0_0_1px_rgba(20,184,166,0.4)]" />;
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
    exploto: 0,
    caos: 0,
    energia: 0,
    ordenar: 0
  });
  const [lastClickedChip, setLastClickedChip] = useState<string | null>(null);
  const [processingChip, setProcessingChip] = useState<"exploto" | "caos" | "energia" | "ordenar" | null>(null);
  const chipTimerRef = useRef<Record<string, any>>({});
  const [ripples, setRipples] = useState<{ id: string; chipType: string; x: number; y: number; size: number }[]>([]);

  const handleChipClick = (e: React.MouseEvent<HTMLButtonElement>, type: "exploto" | "caos" | "energia" | "ordenar") => {
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

    if (hasExhaustion) return "energia";
    if (hasConflict) return "caos";
    if (hasOverwhelm) return "exploto";

    // 2. Fall back to most frequently used chip if click counts exist
    let maxClicks = 0;
    let mostFrequent: string | null = null;
    for (const key of Object.keys(chipClickCounts) as Array<"exploto" | "caos" | "energia" | "ordenar">) {
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

  // Microphone state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

  // References for layout auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load state on startup
  useEffect(() => {
    const savedChat = localStorage.getItem("antidrama_chat_history_v2");
    const savedMetrics = localStorage.getItem("antidrama_radar_metrics_v2");
    const savedModes = localStorage.getItem("antidrama_modes_v2");

    if (savedChat) {
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
  const playTactileClick = (type: "exploto" | "caos" | "energia" | "ordenar") => {
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
        case "exploto":
          // Deep, grave mechanical thud with prominent low end
          highFreqStart = 1100;
          highFreqEnd = 350;
          highGain = 0.08;
          highDecay = 0.025;

          lowFreqStart = 95;
          lowFreqEnd = 30;
          lowGain = 0.28;
          lowDecay = 0.065;
          break;

        case "caos":
          // Heavy, mid-low tactile crunch
          highFreqStart = 1400;
          highFreqEnd = 450;
          highGain = 0.07;
          highDecay = 0.018;

          lowFreqStart = 130;
          lowFreqEnd = 40;
          lowGain = 0.22;
          lowDecay = 0.045;
          break;

        case "energia":
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

        case "ordenar":
        default:
          // High-frequency, extremely dry, crisp and subtle click
          highFreqStart = 2400;
          highFreqEnd = 1000;
          highGain = 0.045;
          highDecay = 0.008;

          lowFreqStart = 250;
          lowFreqEnd = 120;
          lowGain = 0.07;
          lowDecay = 0.012;
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
  const handleQuickChip = (type: "exploto" | "caos" | "energia" | "ordenar") => {
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
    
    const chipConfig = getAdaptedChipData(type, messages);
    const text = chipConfig.simulatedText;
    let mockValues: RadarMetrics = { ...metrics };

    switch (type) {
      case "exploto":
        mockValues = { saturacion: 95, foco: 20, energia: 30 };
        break;
      case "caos":
        mockValues = { saturacion: 85, foco: 15, energia: 50 };
        break;
      case "energia":
        mockValues = { saturacion: 60, foco: 25, energia: 6 };
        break;
      case "ordenar":
        mockValues = { saturacion: 40, foco: 45, energia: 70 };
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
          setCurrentWidgetTrack("Ondas binaurales 432Hz para disolución de pánico laboral");
        }
      }

      setMessages((prev) => [...prev, botMsg]);
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

  const handleClearChat = () => {
    if (window.confirm("¿Querés limpiar el historial del chat actual?")) {
      localStorage.removeItem("antidrama_chat_history_v2");
      setMessages(INITIAL_MESSAGES);
      setMetrics(DEFAULT_METRICS);
      setPlayingTrack(null);
      setCurrentWidgetTrack(null);
      setModes({ foco: false, humor: true, rescate: false });
      setRobotState("calma");
    }
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
      doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "F");
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, y, contentWidth, 34, 2, 2, "D");
      
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
      doc.text(`Fecha y hora: ${currentDateStr}`, margin + 6, y + 14);
      doc.text(`Calibracion AI:`, margin + 105, y + 14);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(245, 158, 11); 
      doc.text(`Humor Acidulado: LVL ${humorLevel}/5`, margin + 105, y + 21);
      doc.setTextColor(45, 212, 191); 
      doc.text(`Pragmatismo: LVL ${pragmatismLevel}/5`, margin + 105, y + 27);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(226, 232, 240);
      doc.text(`Estado operativo:`, margin + 6, y + 21);
      doc.text(`Saturacion: ${metrics.saturacion}%  |  Foco: ${metrics.foco}%  |  Energia: ${metrics.energia}%`, margin + 6, y + 27);
      
      y += 44;
      
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
          
          if (msg.radarSnapshot) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(7);
            doc.text(`[Snapshot: Sat:${msg.radarSnapshot.saturacion}% Foc:${msg.radarSnapshot.foco}% Ener:${msg.radarSnapshot.energia}%]`, margin + 32, y + 6);
          }
          
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
    <div className="min-h-screen w-full bg-[#0a0d15] bg-gradient-to-br from-[#1c120c] via-[#0d0d12] to-[#04050a] flex flex-col lg:flex-row justify-center items-center p-0 sm:p-5 lg:p-8 overflow-y-auto font-sans relative">
      
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
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-10 xl:gap-20 relative z-10 p-0 sm:p-4 lg:p-0 min-h-0">
        
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
          className="w-full max-w-[430px] h-[100svh] sm:h-[min(860px,calc(100svh-48px))] bg-slate-950 text-[#f8fafc] flex flex-col relative border border-slate-800 shadow-[25px_30px_55px_-12px_rgba(0,0,0,0.9)] overflow-hidden sm:rounded-[34px] ring-0 sm:ring-[10px] ring-slate-900 shadow-slate-950/95 transition-all duration-300"
        >
          {/* Physical Side Buttons for complete Hardware Simulation realism */}
          <div className="hidden sm:block absolute top-28 -left-[14px] w-1 h-10 bg-slate-800 rounded-l border-y border-l border-slate-700/80 z-40" />
          <div className="hidden sm:block absolute top-[164px] -left-[14px] w-1 h-12 bg-slate-800 rounded-l border-y border-l border-slate-700/80 z-40" />
          <div className="hidden sm:block absolute top-[224px] -left-[14px] w-1 h-12 bg-slate-800 rounded-l border-y border-l border-slate-700/80 z-40" />
          <div className="hidden sm:block absolute top-40 -right-[14px] w-1 h-16 bg-slate-800 rounded-r border-y border-r border-slate-700/80 z-40" />
          
          {/* Real Phone Hardware Notch Overlay Simulation */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-7 bg-slate-950 rounded-b-3xl z-50 flex items-center justify-center select-none pointer-events-none border-b border-x border-slate-900">
            {/* Camera lens indicator */}
            <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800 mr-2" />
            <div className="w-10 h-1 bg-slate-900 rounded-full" />
          </div>

          {/* TOP STATUS BAR ROW */}
          <div className="hidden sm:flex bg-slate-950 px-6 pt-6 pb-1 justify-between items-center text-[10px] font-mono text-slate-400 select-none shrink-0 relative z-30">
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
              <h1 id="app-title" className="text-xl sm:text-2xl font-extrabold tracking-[0.14em] text-[#5cdcf7] font-sans drop-shadow-[0_0_10px_rgba(92,220,247,0.7)]">
                ANTIDRAMA
              </h1>

              <div className="flex gap-1.5 align-center">
                <button
                  type="button"
                  onClick={() => {
                    setShowCalibrator(!showCalibrator);
                    triggerHaptic();
                  }}
                  title="Ajustar Calibrador AI (Humor y Pragmatismo)"
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
              <span className="text-slate-400 font-medium tracking-wide block text-[10.5px]">
                Tu Yo Auxiliar de Bolsillo.
              </span>
              
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

          {/* DYNAMIC METRICS CONTROLLER (Collapsible Control Room) */}
          <div id="operative-center" className="bg-[#0b1329] border-b border-slate-900 relative z-20 shrink-0">
            
            <div className="bg-[#111c44] px-4 py-2 flex justify-between items-center text-[10px] font-mono text-slate-300 select-none">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>MONITOREO DE SATURACIÓN</span>
              </div>
              <button
                onClick={() => setShowOperativeBay(!showOperativeBay)}
                className="text-teal-400 hover:underline font-bold flex items-center gap-0.5 transition-all cursor-pointer"
              >
                {showOperativeBay ? (
                  <>
                    <span>Minimizar</span>
                    <ChevronUp size={11} />
                  </>
                ) : (
                  <>
                    <span>Ver Radar</span>
                    <ChevronDown size={11} />
                  </>
                )}
              </button>
            </div>

            <AnimatePresence>
              {showOperativeBay && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden p-3 pt-1 space-y-1 bg-slate-950/20"
                >
                  {/* Compacted interactive sliders and radar chart to avoid overlaps */}
                  <div className="py-1">
                    <RadarChart metrics={metrics} />
                  </div>

                  {/* Manual Calibration Bar */}
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-900 flex flex-col gap-1.5">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold flex items-[#2dd4bf] gap-1 select-none">
                      <SlidersHorizontal size={10} className="text-[#2dd4bf]" />
                      Calibración manual de desborde laboral:
                    </span>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <label className="flex flex-col text-[8px] font-mono text-slate-400">
                        <span className="text-rose-450 font-bold">Saturación ({metrics.saturacion}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={metrics.saturacion}
                          onChange={(e) => updateMetric("saturacion", Number(e.target.value))}
                          className="accent-rose-400 bg-slate-900 h-1 rounded cursor-pointer mt-0.5"
                        />
                      </label>
                      <label className="flex flex-col text-[8px] font-mono text-slate-400">
                        <span className="text-violet-450 font-bold">Foco ({metrics.foco}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={metrics.foco}
                          onChange={(e) => updateMetric("foco", Number(e.target.value))}
                          className="accent-violet-500 bg-slate-900 h-1 rounded cursor-pointer mt-0.5"
                        />
                      </label>
                      <label className="flex flex-col text-[8px] font-mono text-slate-400">
                        <span className="text-teal-350 font-bold">Energía ({metrics.energia}%)</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={metrics.energia}
                          onChange={(e) => updateMetric("energia", Number(e.target.value))}
                          className="accent-teal-400 bg-slate-900 h-1 rounded cursor-pointer mt-0.5"
                        />
                      </label>
                    </div>

                    {/* Sincronizador Respiratorio Táctico shortcut */}
                    <div className="mt-2 text-slate-400/90 hover:text-slate-200 pt-2 border-t border-slate-900/60 flex items-center justify-between gap-2 transition-all">
                      <div className="flex flex-col text-left">
                        <span className="text-[8.5px] font-mono text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1 select-none">
                          <Activity size={10} className="animate-pulse text-[#2dd4bf]" />
                          Sincronizador Respiratorio
                        </span>
                        <p className="text-[7.5px] text-slate-500 leading-none mt-0.5 select-none">
                          Respiración 4-6 para bajar intensidad y recuperar dirección.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic();
                          setShowBreathingModal(true);
                        }}
                        className="shrink-0 px-2.5 py-1.5 bg-slate-900 hover:bg-teal-400 hover:text-slate-950 border border-teal-500/25 hover:border-teal-400 text-[#2dd4bf] text-[9.5px] font-bold rounded-xl cursor-pointer transition-all active:scale-[0.96]"
                      >
                        Iniciar
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CHAT VIEWPORT - Absolute container focus layout to prevent any scroll overlapping */}
          <main className="flex-grow overflow-y-auto px-4 py-3.5 space-y-3.5 scroll-smooth flex flex-col relative z-10 bg-slate-950/40 min-h-0 focus:outline-none">
            
            {/* Guide Info block */}
            <details className="hidden group bg-slate-900/45 border border-slate-900 rounded-2xl overflow-hidden transition-all shrink-0">
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
                    className={`flex items-start w-full gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {/* Mockup Coffee Mug circular badge decoration on the left of bot bubble */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-full bg-[#1e293b]/90 border border-slate-700/60 flex items-center justify-center text-sm shrink-0 select-none shadow-md">
                        {getDynamicAvatar(message.text)}
                      </div>
                    )}

                    {/* Chat Bubble Body */}
                    <div
                      className={`max-w-[92%] rounded-2xl px-4 py-3.5 text-sm relative shadow-md transition-all duration-300 ${
                        isUser
                          ? "bg-gradient-to-br from-[#162744] to-[#1a2d4e] text-sky-100 border border-sky-500/20 rounded-tr-sm shadow-[0_5px_15px_rgba(14,165,233,0.06)]"
                          : "bg-gradient-to-br from-[#0e1320] to-[#121829] text-slate-100 border border-slate-800/90 rounded-tl-sm"
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
                        <div className="whitespace-pre-line break-words text-inherit font-sans text-[14px] leading-6">
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
                        {message.radarSnapshot ? (
                          <span>S:{message.radarSnapshot.saturacion}% F:{message.radarSnapshot.foco}% E:{message.radarSnapshot.energia}%</span>
                        ) : (
                          <span />
                        )}
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

            {/* SPOTIFY EQUALIZER BINAURAL MODULE (Mockup integration support) */}
            {currentWidgetTrack && (
              <div id="rescue-track-widget" className="p-3 bg-gradient-to-r from-slate-900 to-[#111c44] border border-rose-500/15 rounded-xl shadow mt-2 relative overflow-hidden shrink-0">
                <div className="flex items-center gap-2.5 relative z-10">
                  <div className="p-2 bg-rose-950/30 border border-rose-500/35 rounded-lg text-rose-400">
                    <Music className="animate-spin" style={{ animationDuration: '8s' }} size={13} />
                  </div>
                  <div className="flex-grow min-w-0">
                    <span className="text-[7.5px] font-mono text-rose-400 font-bold uppercase tracking-wider block">RECEPTOR DE CONTROL CARDÍACO</span>
                    <h4 className="text-xs font-semibold text-white truncate font-mono mt-0.5">
                      {currentWidgetTrack}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleTrack(currentWidgetTrack)}
                    className={`p-1.5 rounded-full cursor-pointer transition-all ${
                      playingTrack === currentWidgetTrack
                        ? "bg-rose-400 text-slate-950 hover:bg-rose-300"
                        : "bg-slate-800 text-rose-300 hover:text-rose-200"
                    }`}
                  >
                    {playingTrack === currentWidgetTrack ? (
                      <span className="text-[8px] px-1 font-bold font-mono">PARAR</span>
                    ) : (
                      <Play fill="currentColor" size={10} className="ml-0.5" />
                    )}
                  </button>
                </div>

                {playingTrack === currentWidgetTrack && (
                  <div className="mt-2 bg-slate-950 p-1 rounded-lg border border-slate-900 flex items-center justify-between text-[9px] font-mono text-emerald-400">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      <span>Sonido suave activo...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* SUGGESTION CHIPS TRAY - Safely aligned below main viewport container to avoid overlaps */}
          <div className="bg-slate-950 border-t border-slate-900 px-4 pt-2.5 pb-2 shrink-0 relative z-20">
            {(() => {
              const selectedType = getSelectedChip();
              const isExplotoSelected = selectedType === "exploto";
              const isCaosSelected = selectedType === "caos";
              const isEnergiaSelected = selectedType === "energia";
              const isOrdenarSelected = selectedType === "ordenar";

              return (
                <>
                  <span className="text-[9px] font-mono tracking-wider text-teal-400 uppercase block mb-1.5 font-bold">
                    Acciones rápidas:
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
                    className="grid grid-cols-2 gap-2 max-w-full select-none pt-1"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleChipClick(e, "exploto")}
                      className={`group relative overflow-hidden hover:text-white text-[11px] font-bold min-h-10 py-2 px-3 rounded-2xl backdrop-blur-md active:scale-[0.98] cursor-pointer transition-all duration-200 ease-out flex items-center justify-center gap-1.5 border min-w-0 ${
                        isExplotoSelected 
                          ? "border-rose-500 text-white bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.3),_inset_0_1px_2px_rgba(255,255,255,0.15)] scale-[1.03]" 
                          : "border-rose-500/20 text-rose-200/80 bg-slate-900/40 hover:border-rose-500/40 shadow-sm"
                      }`}
                    >
                      {ripples.filter((r) => r.chipType === "exploto").map((r) => (
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
                      {getChipIcon("exploto", modes)}
                      <span>{getAdaptedChipData("exploto", messages).label}</span>
                      {processingChip === "exploto" && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-rose-400 drop-shadow-[0_0_4px_rgba(244,63,94,0.8)] animate-chip-load" />
                      )}
                      {chipClickCounts.exploto > 0 && (
                        <span className="ml-auto text-[8px] font-mono leading-none bg-rose-500/30 border border-rose-500/40 text-rose-300 px-1.5 py-0.5 rounded-full select-none shadow-md transition-all duration-300 group-hover:bg-rose-500/60 group-hover:border-rose-400 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(244,63,94,0.85)]">
                          {chipClickCounts.exploto}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleChipClick(e, "caos")}
                      className={`group relative overflow-hidden hover:text-white text-[11px] font-bold min-h-10 py-2 px-3 rounded-2xl backdrop-blur-md active:scale-[0.98] cursor-pointer transition-all duration-200 ease-out flex items-center justify-center gap-1.5 border min-w-0 ${
                        isCaosSelected 
                          ? "border-violet-500 text-white bg-violet-950/40 shadow-[0_0_15px_rgba(139,92,246,0.3),_inset_0_1px_2px_rgba(255,255,255,0.15)] scale-[1.03]" 
                          : "border-violet-500/20 text-violet-200/80 bg-slate-900/40 hover:border-violet-500/40 shadow-sm"
                      }`}
                    >
                      {ripples.filter((r) => r.chipType === "caos").map((r) => (
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
                      {getChipIcon("caos", modes)}
                      <span>{getAdaptedChipData("caos", messages).label}</span>
                      {processingChip === "caos" && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-violet-400 drop-shadow-[0_0_4px_rgba(139,92,246,0.8)] animate-chip-load" />
                      )}
                      {chipClickCounts.caos > 0 && (
                        <span className="ml-auto text-[8px] font-mono leading-none bg-violet-500/30 border border-violet-500/40 text-violet-300 px-1.5 py-0.5 rounded-full select-none shadow-md transition-all duration-300 group-hover:bg-violet-500/60 group-hover:border-violet-400 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(139,92,246,0.85)]">
                          {chipClickCounts.caos}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleChipClick(e, "energia")}
                      className={`group relative overflow-hidden hover:text-white text-[11px] font-bold min-h-10 py-2 px-3 rounded-2xl backdrop-blur-md active:scale-[0.98] cursor-pointer transition-all duration-200 ease-out flex items-center justify-center gap-1.5 border min-w-0 ${
                        isEnergiaSelected 
                          ? "border-amber-500 text-white bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.3),_inset_0_1px_2px_rgba(255,255,255,0.15)] scale-[1.03]" 
                          : "border-amber-500/20 text-amber-200/80 bg-slate-900/40 hover:border-amber-500/40 shadow-sm"
                      }`}
                    >
                      {ripples.filter((r) => r.chipType === "energia").map((r) => (
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
                      {getChipIcon("energia", modes)}
                      <span>{getAdaptedChipData("energia", messages).label}</span>
                      {processingChip === "energia" && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)] animate-chip-load" />
                      )}
                      {chipClickCounts.energia > 0 && (
                        <span className="ml-auto text-[8px] font-mono leading-none bg-amber-500/30 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded-full select-none shadow-md transition-all duration-300 group-hover:bg-amber-500/60 group-hover:border-amber-400 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(245,158,11,0.85)]">
                          {chipClickCounts.energia}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleChipClick(e, "ordenar")}
                      className={`group relative overflow-hidden hover:text-white text-[11px] font-bold min-h-10 py-2 px-3 rounded-2xl backdrop-blur-md active:scale-[0.98] cursor-pointer transition-all duration-200 ease-out flex items-center justify-center gap-1.5 border min-w-0 ${
                        isOrdenarSelected 
                          ? "border-teal-500 text-white bg-teal-950/40 shadow-[0_0_15px_rgba(20,184,166,0.3),_inset_0_1px_2px_rgba(255,255,255,0.3)] scale-[1.03]" 
                          : "border-teal-500/20 text-teal-200/80 bg-slate-900/40 hover:border-teal-500/40 shadow-sm"
                      }`}
                    >
                      {ripples.filter((r) => r.chipType === "ordenar").map((r) => (
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
                      {getChipIcon("ordenar", modes)}
                      <span>{getAdaptedChipData("ordenar", messages).label}</span>
                      {processingChip === "ordenar" && (
                        <div className="absolute bottom-0 left-0 h-[1.5px] bg-teal-400 drop-shadow-[0_0_4px_rgba(20,184,166,0.8)] animate-chip-load" />
                      )}
                      {chipClickCounts.ordenar > 0 && (
                        <span className="ml-auto text-[8px] font-mono leading-none bg-teal-500/30 border border-teal-500/40 text-[#2dd4bf] px-1.5 py-0.5 rounded-full select-none shadow-md transition-all duration-300 group-hover:bg-teal-500/60 group-hover:border-teal-400 group-hover:text-white group-hover:shadow-[0_0_12px_rgba(45,212,191,0.85)]">
                          {chipClickCounts.ordenar}
                        </span>
                      )}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>

          {/* LOWER INTERACTIVE TAB SELECTION ROWS */}
          <div id="mode-selectors" className="px-4 py-2 bg-slate-950 border-t border-slate-900/60 flex justify-between items-center select-none gap-2 shrink-0 relative z-20">
            
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
                  setCurrentWidgetTrack("Bucle de desaceleración vágica 8-G-6");
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
          <footer className="p-3 sm:p-4 bg-slate-950 border-t border-slate-900 shrink-0 relative z-20 pb-3 sm:pb-5">
            <form 
              onSubmit={handleSend} 
              className="flex gap-2 bg-[#10192a] hover:bg-[#132035] p-2 rounded-2xl border border-slate-800/90 focus-within:border-teal-500/50 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all duration-200 relative items-center shadow-lg"
            >
              <input
                id="message-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribí de qué querés bajarte hoy..."
                disabled={loading}
                className="bg-transparent flex-1 outline-none px-3 py-2 text-sm text-[#f8fafc] placeholder-slate-500 disabled:opacity-50"
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

          {/* Tactical Breathing Modal Overlay */}
          <TacticalBreathingModal
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
        </div>

      </div>

    </div>
  );
}
