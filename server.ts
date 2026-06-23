import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Please add it via the Secrets panel in AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiInstance;
}

// REST endpoint for chat
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, modes } = req.body;

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "El mensaje es requerido y debe ser un texto." });
      return;
    }

    const ai = getGeminiClient();

    // Custom instructions based on modes & levels
    const hLevel = Number(modes?.humorLevel || (modes?.humor ? 4 : 1));
    const pLevel = Number(modes?.pragmatismLevel || (modes?.foco ? 5 : 3));

    let activeInstruction = `Actuás como ANTIDRAMA, un asistente de soporte emocional-operativo de urgencia corporativa para profesionales abrumados. Tu filosofía de operaciones es "Menos reacción, más dirección". No sos terapeuta, coach de autoayuda, médico ni gurú de la positividad de oficina. Validás el cansancio, la presión y la saturación reales sin reforzarlas ni dar rienda suelta al melodrama, trayendo al usuario de vuelta a la lucidez pragmática rápidamente. Tu tono es comprensivo en el fondo pero implacable en la forma, con complicidad pragmática rioplatense neutra.`;

    // Incorporate dynamic Humor Scaling
    if (hLevel === 1) {
      activeInstruction += `\n\n[HUMOR LEVEL: 1 (Sober/Neutro)]: Tu tono es serio, fáctico y directo. Sin bromas corporativas ni ironías cínicas. Respuestas totalmente neutras y sobrias, con pragmatismo crudo.`;
    } else if (hLevel === 2) {
      activeInstruction += `\n\n[HUMOR LEVEL: 2 (Leve)]: Tu tono tiene un matiz de ironía muy sutil para aliviar la tensión superficial, pero manteniéndose mayormente sobrio.`;
    } else if (hLevel === 3) {
      activeInstruction += `\n\n[HUMOR LEVEL: 3 (Moderado)]: Usá una dosis moderada de sarcasmo cómplice sobre el surrealismo corporativo (el mail pasivo-agresivo, el loop eterno de Slack, las reuniones para planificar reuniones) para desarmar la gravedad artificial de los problemas.`;
    } else if (hLevel === 4) {
      activeInstruction += `\n\n[HUMOR LEVEL: 4 (Humor Ácido)]: Usá un humor ácido, inteligente y pícaro. Hacé chistes secos, analogías con robots o con el inútil teatro corporativo ("vender aire", "fuegos artificiales de management"). Cuestioná el drama con un cinismo constructivo elegante.`;
    } else { // 5
      activeInstruction += `\n\n[HUMOR LEVEL: 5 (Cínico Destructivo)]: Usá un humor negro de oficina o un cinismo absoluto pero sumamente divertido y cómplice sobre el sinsentido gerencial. Hacé analogías muy graciosas o reíte del laberinto corporativo para restarle el 100% del poder de asustar al usuario. Decile verdades ácidas sin pelos en la lengua.`;
    }

    // Incorporate dynamic Pragmatism (Formatting) Scaling
    if (pLevel === 1) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 1 (Conversacional)]: Sé comprensivo, explorá la situación del usuario mediante un diálogo reflexivo y extendido, analizá el juego de poder en la oficina. No saltes inmediatamente a pasos rindiendo cuentas si no quiere.`;
    } else if (pLevel === 2) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 2 (Guía Suave)]: Respondé de manera fluida y redactá un único consejo táctico principal intercalado en el texto de forma natural.`;
    } else if (pLevel === 3) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 3 (Plan Mínimo)]: Resumí la situación laboral y redactá exactamente 2 pasos de acción ordenados para los siguientes 5 minutos.`;
    } else if (pLevel === 4) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 4 (Tres Pasos Clásicos)]: Dividí estrictamente tu respuesta en un preámbulo ultra-corto y exactamente 3 pasos secuenciales (Paso 1, Paso 2, Paso 3) enfocados en controlar los decibelios metales, desarmar lo irreal, y accionar ya.`;
    } else { // 5
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 5 (Táctico Extremo)]: Eliminá todo tipo de rodeos introductorios, palabras amables, saludos o explicaciones largas. Respondé en no más de 75 palabras de la manera más directa y cortante posible, entregando pasos hiper-concretos e inmediatos en forma de lista o bullets (Paso 1, Paso 2...) para que el usuario actúe de inmediato en los próximos 2 minutos.`;
    }

    if (modes?.rescate) {
      activeInstruction += `\n\n[INSTRUCCIÓN DE CONTROL RESCATE GENERAL]: El usuario está al borde de un ataque de pánico o colapso por saturación. A pesar de los otros niveles, priorizá un tono contenedor y de paz absoluta. Dale una sola acción ridículamente simple (por ejemplo: "apagá Slack, servite un vaso de agua fría y mirá por la ventana 1 minuto").`;
    }

    // Reglas universales
    activeInstruction += `\n\nReglas fundamentales de la respuesta:
- Extensión máxima: 125 palabras.
- Iniciar siempre con una validación honesta, rápida y humana de la situación descrita, sin sonar artificial.
- Traducir el "drama" a hechos fríos y operables.
- Terminar con una micro-tarea específica e inmediata.`;

    // Convert history to Gemini format
    const contentsPayload: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((turn: any) => {
        contentsPayload.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }]
        });
      });
    }

    // Add current user message
    contentsPayload.push({
      role: "user",
      parts: [{ text: message }]
    });

    // Generate output with JSON schema
    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        systemInstruction: activeInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "La respuesta redactada de ANTIDRAMA, respetando los modos activos y de hasta 120 palabras de extensión."
            },
            radar: {
              type: Type.OBJECT,
              description: "Estimación del estado emocional actual del usuario basado en sus mensajes.",
              properties: {
                saturacion: {
                  type: Type.INTEGER,
                  description: "Nivel estimado de saturación o abrumamiento de 0 a 100."
                },
                foco: {
                  type: Type.INTEGER,
                  description: "Nivel estimado de concentración o claridad de 0 a 100."
                },
                energia: {
                  type: Type.INTEGER,
                  description: "Nivel estimado de energía vital/operativa de 0 a 100."
                }
              },
              required: ["saturacion", "foco", "energia"]
            },
            musicaRescate: {
              type: Type.STRING,
              description: "Opcional. Si el estado es crítico, sugiere un tipo de audio con tono sci-fi o calmante (p. ej. 'Ondas delta 432Hz para disolver urgencias fantasma', 'Sintetizador ambiental analógico 55 BPM', 'Ruido blanco estelar')."
            }
          },
          required: ["text", "radar"]
        }
      }
    });

    const outputText = geminiResponse.text;
    if (!outputText) {
      throw new Error("No se recibió respuesta de Gemini.");
    }

    // Parse safety parsing
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(outputText);
    } catch (parseError) {
      console.error("JSON parse error on expression:", outputText);
      // Fallback
      parsedResponse = {
        text: outputText,
        radar: { saturacion: 70, foco: 50, energia: 40 }
      };
    }

    res.json(parsedResponse);
  } catch (error: any) {
    console.error("Error in /api/chat:", error);
    res.status(500).json({
      error: "Ocurrió un error procesando tu solicitud.",
      details: error.message || error
    });
  }
});

// Setup development or production build flows
async function main() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      configLoader: "native",
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ANTIDRAMA backend running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
});
