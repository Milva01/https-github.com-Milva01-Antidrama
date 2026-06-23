export type RobotState = "calma" | "escucha" | "pensando" | "respondiendo" | "foco";

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  radarSnapshot?: RadarMetrics;
  musicaRescate?: string;
}

export interface RadarMetrics {
  saturacion: number; // 0-100
  foco: number; // 0-100
  energia: number; // 0-100
}

export interface AntidramaModes {
  foco: boolean;
  humor: boolean;
  rescate: boolean;
}
