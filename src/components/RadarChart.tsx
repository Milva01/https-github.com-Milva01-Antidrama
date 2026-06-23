import React from "react";
import { RadarMetrics } from "../types";
import { AlertCircle, Zap, Target } from "lucide-react";

interface RadarChartProps {
  metrics: RadarMetrics;
}

export default function RadarChart({ metrics }: RadarChartProps) {
  const { saturacion, foco, energia } = metrics;

  return (
    <div id="radar-visualizer" className="bg-slate-950/40 border border-slate-900 rounded-2xl p-3 w-full shadow-inner">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-mono tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          Radar Operativo de Ruido
        </h3>
        <span className="text-[10px] font-mono text-slate-500">Lectura Estimada</span>
      </div>

      <div className="space-y-3.5">
        {/* SATURACIÓN (Saturated index - Coral Color) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <AlertCircle size={14} className="text-rose-300" />
              Saturación
            </span>
            <span className="font-mono text-xs font-semibold text-rose-300 transition-all duration-700">
              {saturacion}%
            </span>
          </div>
          <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-rose-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${saturacion}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>Calma absoluta</span>
            <span>Estallido mental</span>
          </div>
        </div>

        {/* FOCO (Claridad/Dirección - Violet Color) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Target size={14} className="text-violet-400" />
              Foco Operativo
            </span>
            <span className="font-mono text-xs font-semibold text-violet-400 transition-all duration-700">
              {foco}%
            </span>
          </div>
          <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-violet-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${foco}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>Caos disperso</span>
            <span>Dirección láser</span>
          </div>
        </div>

        {/* ENERGÍA (Fuerza vital/operativa - Teal Color) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Zap size={14} className="text-[#2dd4bf]" />
              Reserva Operativa
            </span>
            <span className="font-mono text-xs font-semibold text-[#2dd4bf] transition-all duration-700">
              {energia}%
            </span>
          </div>
          <div className="relative w-full h-2 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#2dd4bf] rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${energia}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
            <span>Agotado</span>
            <span>Batería llena</span>
          </div>
        </div>
      </div>
    </div>
  );
}
