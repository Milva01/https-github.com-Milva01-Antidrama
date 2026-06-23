import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined. Configure it in your deployment environment.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "antidrama-vercel",
        },
      },
    });
  }
  return aiInstance;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { message, history, modes } = req.body || {};

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "El mensaje es requerido y debe ser un texto." });
      return;
    }

    const ai = getGeminiClient();
    const hLevel = Number(modes?.humorLevel || (modes?.humor ? 4 : 1));
    const pLevel = Number(modes?.pragmatismLevel || (modes?.foco ? 5 : 3));

    let activeInstruction = `Actuas como ANTIDRAMA, un asistente de soporte emocional-operativo de urgencia corporativa para profesionales abrumados. Tu filosofia de operaciones es "Menos reaccion, mas direccion". No sos terapeuta, coach de autoayuda, medico ni guru de la positividad de oficina. Validas el cansancio, la presion y la saturacion reales sin reforzarlas ni dar rienda suelta al melodrama, trayendo al usuario de vuelta a la lucidez pragmatica rapidamente. Tu tono es comprensivo en el fondo pero implacable en la forma, con complicidad pragmatica rioplatense neutra.`;

    if (hLevel === 1) {
      activeInstruction += `\n\n[HUMOR LEVEL: 1]: Tono serio, factico y directo.`;
    } else if (hLevel === 2) {
      activeInstruction += `\n\n[HUMOR LEVEL: 2]: Ironia muy sutil para aliviar tension superficial.`;
    } else if (hLevel === 3) {
      activeInstruction += `\n\n[HUMOR LEVEL: 3]: Sarcasmo complice moderado sobre surrealismo corporativo.`;
    } else if (hLevel === 4) {
      activeInstruction += `\n\n[HUMOR LEVEL: 4]: Humor acido, inteligente y picaro.`;
    } else {
      activeInstruction += `\n\n[HUMOR LEVEL: 5]: Cinismo de oficina muy divertido y complice, sin crueldad hacia el usuario.`;
    }

    if (pLevel === 1) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 1]: Dialogo reflexivo y extendido.`;
    } else if (pLevel === 2) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 2]: Un consejo tactico principal en texto natural.`;
    } else if (pLevel === 3) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 3]: Exactamente 2 pasos de accion para los siguientes 5 minutos.`;
    } else if (pLevel === 4) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 4]: Preambulo ultra-corto y exactamente 3 pasos secuenciales.`;
    } else {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 5]: Maximo 75 palabras, directo, en pasos hiper-concretos.`;
    }

    if (modes?.rescate) {
      activeInstruction += `\n\n[RESCATE]: Prioriza calma absoluta y una accion ridiculamente simple.`;
    }

    activeInstruction += `\n\nReglas: maximo 125 palabras, validar rapido, traducir drama a hechos operables y terminar con una micro-tarea inmediata.`;

    const contentsPayload: any[] = [];
    if (Array.isArray(history)) {
      history.forEach((turn: any) => {
        contentsPayload.push({
          role: turn.role === "user" ? "user" : "model",
          parts: [{ text: turn.text }],
        });
      });
    }
    contentsPayload.push({ role: "user", parts: [{ text: message }] });

    const geminiResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        systemInstruction: activeInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            radar: {
              type: Type.OBJECT,
              properties: {
                saturacion: { type: Type.INTEGER },
                foco: { type: Type.INTEGER },
                energia: { type: Type.INTEGER },
              },
              required: ["saturacion", "foco", "energia"],
            },
            musicaRescate: { type: Type.STRING },
          },
          required: ["text", "radar"],
        },
      },
    });

    const outputText = geminiResponse.text;
    if (!outputText) {
      throw new Error("No se recibio respuesta de Gemini.");
    }

    try {
      res.status(200).json(JSON.parse(outputText));
    } catch {
      res.status(200).json({
        text: outputText,
        radar: { saturacion: 70, foco: 50, energia: 40 },
      });
    }
  } catch (error: any) {
    res.status(500).json({
      error: "Ocurrio un error procesando tu solicitud.",
      details: error.message || String(error),
    });
  }
}
