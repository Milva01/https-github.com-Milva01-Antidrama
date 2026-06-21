import React from "react";
import { RobotState } from "../types";

interface RobotSVGProps {
  state: RobotState;
}

export default function RobotSVG({ state }: RobotSVGProps) {
  // Eye expression definitions based on robot state
  const renderFaceExpression = () => {
    switch (state) {
      case "calma":
        // Happy, peaceful winking or smiling eyes as in the mockup
        return (
          <g>
            {/* Pixelated wink eye left */}
            <path
              d="M 68,110 Q 78,98 88,110"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="6"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px #2dd4bf)" }}
            />
            {/* Pixelated wink eye right */}
            <path
              d="M 122,110 Q 132,105 142,112"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="6"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px #2dd4bf)" }}
            />
            {/* Smiling happy cute pixel mouth */}
            <path
              d="M 90,135 Q 105,148 120,135"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 5px #2dd4bf)" }}
            />
          </g>
        );
      case "escucha":
        // Receptive coral eyes
        return (
          <g>
            <circle
              cx="78"
              cy="108"
              r="8"
              fill="#fca5a5"
              style={{ filter: "drop-shadow(0 0 8px #fca5a5)" }}
            />
            <circle
              cx="132"
              cy="108"
              r="8"
              fill="#fca5a5"
              style={{ filter: "drop-shadow(0 0 8px #fca5a5)" }}
            />
            <ellipse
              cx="105"
              cy="132"
              rx="12"
              ry="4"
              fill="none"
              stroke="#fca5a5"
              strokeWidth="3.5"
              style={{ filter: "drop-shadow(0 0 4px #fca5a5)" }}
            />
          </g>
        );
      case "pensando":
        // Focused analysis eyes
        return (
          <g>
            {/* Thinking level indicator */}
            <ellipse
              cx="78"
              cy="110"
              rx="9"
              ry="3"
              fill="#f59e0b"
              style={{ filter: "drop-shadow(0 0 6px #f59e0b)" }}
            />
            <ellipse
              cx="132"
              cy="110"
              rx="9"
              ry="3"
              fill="#f59e0b"
              style={{ filter: "drop-shadow(0 0 6px #f59e0b)" }}
            />
            {/* Dynamic analyzing path */}
            <path
              d="M 85,134 H 125"
              stroke="#f59e0b"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="4 4"
              className="thinking-mouth"
            />
          </g>
        );
      case "respondiendo":
        // Energetic talking wave eyes
        return (
          <g>
            <ellipse
              cx="78"
              cy="110"
              rx="9"
              ry="6"
              fill="#2dd4bf"
              style={{ filter: "drop-shadow(0 0 8px #2dd4bf)" }}
            />
            <ellipse
              cx="132"
              cy="110"
              rx="9"
              ry="6"
              fill="#2dd4bf"
              style={{ filter: "drop-shadow(0 0 8px #2dd4bf)" }}
            />
            {/* Talking voice lines */}
            <path
              d="M 94,136 Q 105,124 116,136"
              fill="none"
              stroke="#2dd4bf"
              strokeWidth="4"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 5px #2dd4bf)" }}
            />
          </g>
        );
      case "foco":
        // Lavender strict laser lines
        return (
          <g>
            <line
              x1="68"
              y1="110"
              x2="88"
              y2="110"
              stroke="#a78bfa"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px #a78bfa)" }}
            />
            <line
              x1="122"
              y1="110"
              x2="142"
              y2="110"
              stroke="#a78bfa"
              strokeWidth="5"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 6px #a78bfa)" }}
            />
            {/* Strict direct mouth */}
            <line
              x1="94"
              y1="130"
              x2="116"
              y2="130"
              stroke="#a78bfa"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </g>
        );
      default:
        return null;
    }
  };

  // Cute pop text floating bubble on top of the robot based on the states
  const getFloatingBubbleText = () => {
    switch (state) {
      case "calma":
        return "¡ME ENCANTA!";
      case "escucha":
        return "REGISTRANDO...";
      case "pensando":
        return "EXPULSANDODRAMA...";
      case "respondiendo":
        // Pragmatic action statement
        return "¡PRAGMATISMO!";
      case "foco":
        return "SINTETIZANDO...";
      default:
        return "¡ME ENCANTA!";
    }
  };

  const getThemeHighlight = () => {
    switch (state) {
      case "escucha":
        return "#fca5a5";
      case "pensando":
        return "#f59e0b";
      case "foco":
        return "#a78bfa";
      default:
        return "#2dd4bf";
    }
  };

  return (
    <div id="robot-container" className="flex flex-col items-center justify-center p-1 w-full relative">
      <style>{`
        @keyframes floatRobot {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(1deg); }
        }
        @keyframes slowBeat {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes speakMouthCycle {
          0% { transform: scaleX(0.9); }
          100% { transform: scaleX(1.1); }
        }
        .robot-floating-body {
          animation: floatRobot 5s ease-in-out infinite;
        }
        .glowing-heart {
          animation: slowBeat 1.8s ease-in-out infinite;
          transform-origin: 105px 197px; /* Center of the heart */
        }
        .thinking-mouth {
          animation: speakMouthCycle 0.4s ease-in-out infinite alternate;
          transform-origin: center;
        }
      `}</style>

      {/* Rioplatense Speech Bubble like in the mockup */}
      <div className="absolute -top-3 left-[5%] transform -translate-y-1 animate-bounce select-none z-20">
        <div className="bg-slate-950/90 border-2 border-teal-400 text-teal-350 text-[10px] font-extrabold px-3 py-1.5 rounded-2xl rounded-bl-none shadow-lg shadow-teal-500/10 tracking-wider">
          {getFloatingBubbleText()}
        </div>
        {/* Balloon tail */}
        <div className="w-2.5 h-2.5 bg-slate-950 border-r-2 border-b-2 border-teal-400 transform rotate-45 -mt-1 ml-3" />
      </div>

      {/* meditational background ring aura */}
      <div className="absolute w-36 h-36 rounded-full border border-dashed border-slate-800/40 animate-spin" style={{ animationDuration: "25s" }} />

      {/* SVG Container: White Meditative cross-legged robot with Copper joints, Green chest heart, CRT-screen & smiling wink visual */}
      <svg
        viewBox="0 0 210 240"
        className="w-[124px] h-[142px] robot-floating-body select-none relative z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Shiny plastic finish helmet gradients */}
          <linearGradient id="bodyWhite" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
          {/* Copper joints */}
          <linearGradient id="copperMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="55%" stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          {/* Inner Visor Shadow */}
          <radialGradient id="screenVisor" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* 1. HEAD SEGMENT (Smooth sphere helmet) */}
        <g id="head">
          {/* Neck ring mount */}
          <ellipse cx="105" cy="154" rx="22" ry="6" fill="url(#copperMetal)" />
          <ellipse cx="105" cy="158" rx="14" ry="4" fill="#475569" />

          {/* Right Ear piece (Copper connector pivot) */}
          <circle cx="172" cy="115" r="14" fill="url(#copperMetal)" />
          <path d="M172,106 H184 V124 H172 Z" fill="#64748b" />
          <circle cx="180" cy="115" r="5" fill="#1e293b" />

          {/* Left Ear piece (Copper connector pivot) */}
          <circle cx="38" cy="115" r="14" fill="url(#copperMetal)" />
          <path d="M38,106 H26 V124 H38 Z" fill="#64748b" />
          <circle cx="30" cy="115" r="5" fill="#1e293b" />

          {/* Rounded White Plastic Helmet Shell */}
          <ellipse cx="105" cy="112" rx="63" ry="54" fill="url(#bodyWhite)" stroke="#94a3b8" strokeWidth="2.5" />
          {/* Subtle light reflections */}
          <path d="M 60,70 A 50,40 0 0,1 150,70" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.8" />

          {/* Inner Glossy CRT Screen Visor */}
          <rect x="52" y="80" width="106" height="62" rx="24" fill="url(#screenVisor)" stroke="#475569" strokeWidth="3" />
          {/* Pixelated grid guidelines */}
          <rect x="56" y="84" width="98" height="54" rx="20" fill="none" stroke={getThemeHighlight()} strokeWidth="1.5" strokeOpacity="0.12" />

          {/* FACIAL ACTIONS */}
          {renderFaceExpression()}
        </g>

        {/* 2. BODY SEGMENT (Chubby white chest with green heart) */}
        <g id="body">
          {/* Upper chest */}
          <path
            d="M 80,158 L 130,158 L 140,196 L 70,196 Z"
            fill="url(#bodyWhite)"
            stroke="#94a3b8"
            strokeWidth="2"
          />
          {/* Inner chest accent cover plate */}
          <path
            d="M 86,164 L 124,164 L 130,190 L 80,190 Z"
            fill="#cbd5e1"
            fillOpacity="0.7"
          />

          {/* GLOWING GREEN HEART (Exactly as user's mockup!) */}
          <g className="glowing-heart">
            {/* Heart shape */}
            <path
              d="M 105,191 C 105,191 100,183 96,183 C 91,183 89,187 89,191 C 89,197 100,205 105,207 C 110,205 121,197 121,191 C 121,187 119,183 114,183 C 110,183 105,191 105,191 Z"
              fill="#2dd4bf"
              stroke="#0f766e"
              strokeWidth="1.5"
              style={{ filter: "drop-shadow(0 0 6px #2dd4bf)" }}
            />
            {/* Soft inner core shine */}
            <circle cx="102" cy="187" r="2.5" fill="#ffffff" fillOpacity="0.9" />
          </g>
        </g>

        {/* 3. ARMS SEGMENTS (Relaxed meditating placement) */}
        <g id="arms">
          {/* Left Arm joints connected to resting knee */}
          <circle cx="68" cy="174" r="8" fill="url(#copperMetal)" />
          <path d="M 64,178 Q 42,192 56,214" fill="none" stroke="url(#bodyWhite)" strokeWidth="12" strokeLinecap="round" />
          <circle cx="56" cy="214" r="6" fill="url(#copperMetal)" />

          {/* Right Arm joints connected to resting knee */}
          <circle cx="142" cy="174" r="8" fill="url(#copperMetal)" />
          <path d="M 146,178 Q 168,192 154,214" fill="none" stroke="url(#bodyWhite)" strokeWidth="12" strokeLinecap="round" />
          <circle cx="154" cy="214" r="6" fill="url(#copperMetal)" />
        </g>

        {/* 4. MEDITATIVE FOLDED LOTUS LEGS (Crossed legs at basement base) */}
        <g id="folded-legs">
          {/* Lower basin pivot pelvis */}
          <ellipse cx="105" cy="208" rx="20" ry="10" fill="#475569" />

          {/* Meditating Folded Legs / Left leg */}
          <path
            d="M 75,204 Q 45,210 65,232 Q 105,236 125,230"
            fill="none"
            stroke="url(#bodyWhite)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Meditating Folded Legs / Right leg */}
          <path
            d="M 135,204 Q 165,210 145,232 Q 105,236 85,230"
            fill="none"
            stroke="url(#bodyWhite)"
            strokeWidth="16"
            strokeLinecap="round"
          />

          {/* Bronze Joint Sole Caps resting neatly */}
          <circle cx="70" cy="226" r="6.5" fill="url(#copperMetal)" />
          <circle cx="140" cy="226" r="6.5" fill="url(#copperMetal)" />
        </g>
      </svg>
    </div>
  );
}
