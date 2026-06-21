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

// Helper for resilient offline fallback responses when Gemini is under high demand (503) or missing credentials
function getOfflineFallbackResponse(message: string, hLevel: number, pLevel: number, rescate: boolean) {
  const norm = message.toLowerCase();
  
  // Decide state metrics
  let saturacion = 50;
  let foco = 70;
  let energia = 55;
  let text = "";
  let musicaRescate = "";

  const isIra = /ira|explosivo|explot|bronca|enojo|calent|furia|rabia/.test(norm);
  const isMiedo = /miedo|terror|panic|panico|fobia|asust/.test(norm);
  const isDesmotivacion = /desmotiv|apat|ganas|flojera|procrastin|inercia/.test(norm);
  const isBajon = /bajon|triste|bajón|deprim|desanim/.test(norm);

  const isExhaustion = /cansad|agotad|quemad|burnout|sueñ|dormir|bater|fatig|reserva|fuerza|colaps|pausa|frito|sin gana|chau/.test(norm);
  const isConflict = /jefe|jefa|colaborador|colega|tóxic|toxic|reuni|discut|pelea|feedback|mail|slack|comentario|dijo|pasivo/.test(norm);
  const isOverwhelm = /tarde|urgent|deadline|fecha|entrega|tiempo|retras|reloj|incendi|ayer|rápido|rapido|presion/.test(norm);

  if (isIra) {
    saturacion = 95;
    foco = 20;
    energia = 80;
    musicaRescate = "Técnica de Descompresión Somática de Ira";
    
    if (rescate) {
      text = `[ANTIDRAMA OFFLINE - IRA: SOS RESCATE 🚨]
¡Alto ahí! Sentís una ira tremenda y tu sistema simpático está desbordado de adrenalina. Detener la explosión física es la máxima prioridad biológica antes de presionar Enviar.
      
Tus pasos de descompresión física inmediata:
- Paso 1: Ponete de pie de inmediato y colócate frente a una canilla para lavarte la cara con agua helada tres veces.
- Paso 2: Cierra y aprieta ambos puños con máxima tensión por 5 segundos enteros, luego relájalos de golpe soplando largo por la boca.
- Paso 3: Retirá las manos de cualquier teclado, cerrá Slack por 15 minutos y permití que el pico químico disminuya de forma natural. Sin reaccionar en caliente.`;
    } else if (pLevel >= 4) {
      text = `[ANTIDRAMA OFFLINE - IRA: MODO FOCO 🎯]
Sentís una bronca tremenda y la mente se aceleró. No desgastes esta energía valiosa en rumiar sobre el ruido externo. Canalicemos esta adrenalina directamente en tu entregable de forma fría.

Tus pasos prácticos de enfoque estratégico:
- Paso 1: Sentate con la espalda derecha y hacé la respiración cuadrada (Box Breathing): inhalá 4s, retené 4s, exhalá 4s, retené vacío 4s. Repetilo dos veces para silenciar el ruido interno.
- Paso 2: Poné tu celular en modo No Molestar y cerrá todas las pestañas que no sirvan para resolver la tarea directa de los siguientes 20 minutos.
- Paso 3: Resolvé y escribe solo la primera frase o línea del archivo ahora mismo. La acción desarma el enojo.`;
    } else if (hLevel >= 3) {
      text = `[ANTIDRAMA OFFLINE - IRA: HUMOR ÁCIDO 🌶️]
¡Alerta de erupción volcánica en las oficinas de la civilización moderna! Alguien metió la pata en un excel, mandó un mail pasivo-agresivo o cambió los requisitos a último momento de manera insólita.
      
Reencuadre irónico para desarmar el drama:
- Paso 1: Recordá la regla de oro: Nadie aquí está transportando órganos para trasplante ni custodiando claves nucleares; es solo código en una nube o celdas en un reporte.
- Paso 2: Regulá riéndote un segundo de la ridícula pompa del día de hoy.
- Paso 3: Exhalá largo y tómalo como un dato fáctico cómico del ambiente laboral. El enojo es energía bioquímica efímera comercializada por el estrés de los plazos.`;
    } else {
      text = `[ANTIDRAMA OFFLINE - PELIGRO EXPLOSIVO 🤬]
Una bomba que explota ahora puede hacerte perder todo lo que fuiste construyendo en mucho tiempo. Ahora andá a lavarte la cara con agua helada... sentate un instante en el suelo frío... salí antes que nada del estado y después del pensamiento pero no tires todo por la borda porque realmente te vas a arrepentir. Buscaremos juntos la manera de resolver bien esto.
      
Herramientas de descompresión rápida:
- Paso 1: Lavate la cara con agua helada para inducir el reflejo autonómico de enfriamiento.
- Paso 2: Afloja el teclado de tus dedos y ponte de pie de inmediato.
- Paso 3: Frena Slack por 15 minutos cerrados para no reaccionar en caliente y de manera nociva.`;
    }
  } else if (isMiedo) {
    saturacion = 98;
    foco = 10;
    energia = 35;
    musicaRescate = "Técnica de Enraizamiento Sensorial 5-4-3-2-1";
    
    if (rescate) {
      text = `[ANTIDRAMA OFFLINE - MIEDO: SOS RESCATE 🚨]
Siento el nudo de parálisis en el pecho. El pánico laboral te ha desconectado de la realidad. Activemos el enraizamiento biológico para frenar de golpe el tren de pánico imaginario.

Ejercicio de Anclaje de Emergencia 5-4-3-2-1:
- Paso 1: Mirá a tu alrededor y nombra en voz alta 5 cosas fácticas que puedas ver (ej: el marco del monitor, la taza).
- Paso 2: Toca 4 texturas o elementos reales en tu superficie de trabajo.
- Paso 3: Prestá oído a 3 sonidos distintos de tu ambiente ahora.
- Paso 4: Percibí 2 olores en tu entorno y 1 sabor en tu boca. Sentí el suelo en tus pies; estás a salvo aquí.`;
    } else if (pLevel >= 4) {
      text = `[ANTIDRAMA OFFLINE - MIEDO: MODO FOCO 🎯]
La incertidumbre sobre el resultado de una entrega crítica te paraliza la acción. No pienses en el proyecto completo hoy; dividamos para descongestionar el cerebro.

Estrategia de Racionalización y Acción:
- Paso 1: Racionalizá el peor escenario fáctico real que podría ocurrir y escribilo. Notarás que el 90% es ruido mental sin capacidad de daño biológico real.
- Paso 2: Comprometete con la regla de los 3 minutos: establece una alarma de 3 minutos y hacé solo una modificación minúscula en tu archivo.
- Paso 3: El movimiento es el antídoto número uno del terror laboral. Al mover el lápiz o el mouse, el pánico se disuelve.`;
    } else if (hLevel >= 3) {
      text = `[ANTIDRAMA OFFLINE - MIEDO: HUMOR ÁCIDO 🎭]
El pánico corporativo ha tomado los comandos. Un bug misterioso, una reunión no agendada con el jefe o el temor a que piensen que tu trabajo es un fraude absoluto.
      
Píldora del humor absurdo:
- Paso 1: Recordá que todos en la oficina laboral estamos simulando que sabemos exactamente lo que ocurre el 100% del tiempo. Nadie tiene un libreto infalible.
- Paso 2: Desdramatizá con perspectiva: no estamos operando cerebros a corazón abierto en una tormenta, solo editando interfaces o reportes.
- Paso 3: Hacé un suspiro cíclico tierno y restale solemnidad a la catástrofe del día. No te lo tomes tan en serio.`;
    } else {
      text = `[ANTIDRAMA OFFLINE - MIEDO Y TERROR 😨]
Siento el nudo de parálisis en el pecho. El miedo laboral suele actuar en bucles catastróficos imaginando escenarios irreversibles como perder el control o fallar rotundamente. Desactivemos la alarma ahora.

Herramientas para regular el Miedo:
- Paso 1: Escribí en un papel el peor escenario real objetivo para mirarlo de forma pragmática.
- Paso 2: Realizá el suspiro cíclico: inhalación profunda, segunda mini-inhalación muscular y exhalación de 6 segundos.
- Paso 3: Avanzá con un solo micro-paso de 3 minutos sobre tu tarea actual.`;
    }
  } else if (isDesmotivacion) {
    saturacion = 50;
    foco = 25;
    energia = 15;
    musicaRescate = "Técnica del Micro-Bloque: Regla de los 3 Minutos";
    
    if (rescate) {
      text = `[ANTIDRAMA OFFLINE - APATÍA: SOS RESCATE 🚨]
Siento la modorra y la inacción completa. Intentar pensar para motivarse es inútil; la biología humana necesita movimiento físico para activar la motivación neurológica de la dopamina.

Ejercicios corporales inmediatos para salir del letargo:
- Paso 1: Ponete de pie ahora mismo. Estirá los brazos al techo con fuerza y dejá caer el torso hacia adelante para activar el flujo de sangre.
- Paso 2: Girá los hombros hacia atrás tres veces y tomá una bocanada profunda de aire.
- Paso 3: Servite un vaso de agua bien fresca y experimentá el cambio de temperatura. Move el cuerpo para indicarle a tu mente que el bloque operativo comenzó.`;
    } else if (pLevel >= 4) {
      text = `[ANTIDRAMA OFFLINE - APATÍA: MODO FOCO 🎯]
La montaña caótica de pendientes te quitó toda la dirección. Olvidate del resultado del proyecto final. El foco solo existe en el paso de los próximos minutos.

Timeboxing de Foco Mínimo:
- Paso 1: Definí una única micro-acción estúpida y ridículamente simple (ej: abrir el documento, escribir una palabra).
- Paso 2: Poné un cronómetro de exactamente 3 minutos en tu reloj o teléfono.
- Paso 3: Trabaja de forma enfocada y exclusiva esos 180 segundos. Si al terminar quieres parar, tienes total libertad de hacerlo (el 80% continúa).`;
    } else if (hLevel >= 3) {
      text = `[ANTIDRAMA OFFLINE - APATÍA: HUMOR ÁCIDO 🤡]
La apatía laboral ha bloqueado el inicio. Sentís que llenar plantillas, contestar hilos eternos o mover celdas de un lado al otro tiene la misma trascendencia de fondo que pintar con un palito en el agua.
      
Desvío irónico de oficina:
- Paso 1: ¡Felicitaciones! Has descubierto que el sistema productivo de vez en cuando parece un decorado de cartón. Es sanísimo darse cuenta.
- Paso 2: Reíte un segundo de la supuesta trascendencia cósmica del entregable semanal.
- Paso 3: Hacé el mínimo esfuerzo indispensable para cumplir con la formalidad de hoy y cerrá el archivo sin solemnidad.`;
    } else {
      text = `[ANTIDRAMA OFFLINE - DESMOTIVACIÓN ACTIVA 🔋]
Siento la modorra y la apatía absoluta. Forzar una motivación heroica o esperar que surja hoy mágicamente es una trampa de la mente. En Antidrama sabemos que la acción precede y activa la emoción.

Pasos de activación mínima:
- Paso 1: Olvidate de la tarea entera. Aplica la regla del bloque de 3 minutos de foco.
- Paso 2: Parate de la silla y estirá el cuerpo un minuto completo para reactivar el flujo sanguíneo de la cabeza.
- Paso 3: Definí una micro-tarea indiscutible de 5 minutos y ejecutala sin vueltas.`;
    }
  } else if (isBajon) {
    saturacion = 75;
    foco = 25;
    energia = 10;
    musicaRescate = "Reencuadre de Perspectiva: Modo Supervivencia Amable";
    
    if (rescate) {
      text = `[ANTIDRAMA OFFLINE - BAJÓN: SOS RESCATE 🚨]
Tu batería anímica está en el subsuelo y sentís un desánimo pesado en el pecho. Forzarte a rendir al 110% es punitivo y contraproducente. Tu cuerpo pide tregua somática táctica.

Autocuidado Fisiológico de Centro:
- Paso 1: Inhalá suavemente por la nariz en 5 segundos y exhalá suave por la boca en otros 5 segundos. Hacelo tres veces seguidas.
- Paso 2: Preparate una taza de té caliente, café o un vaso de agua templada; dale input térmico reconfortante a tus manos y estómago.
- Paso 3: Sentate cómodo en la silla y permitite estar con un ritmo más pausado durante los próximos minutos.`;
    } else if (pLevel >= 4) {
      text = `[ANTIDRAMA OFFLINE - BAJÓN: MODO FOCO 🎯]
La mente está agotada del asfalto del día y el ánimo se desplomó. Apliquemos la estrategia de protección mental de contención.

Acción de Modo Supervivencia Amable:
- Paso 1: Agarrá tu lista de pendientes para hoy y borrálos/postergálos para mañana en un 80%. Retirá todo lo secundario.
- Paso 2: Elegí una sola acción técnica mínima que sea indispensable para salvar y cerrar decorosamente la jornada laboral.
- Paso 3: Ejecutala con tranquilidad, sin prisa pero sin pausa, y declará tu jornada laboral cerrada apenas concluyas.`;
    } else if (hLevel >= 3) {
      text = `[ANTIDRAMA OFFLINE - BAJÓN: HUMOR ÁCIDO 😂]
Tu ánimo laboral ha rozado la fosa marina y la moral del día languidece en una esquina de Slack de forma desgarradora.
      
Perspectiva cómica de oficina:
- Paso 1: Recordá la célebre frase: "Ninguno de nosotros está cuidando pacientes de terapia intensiva de urgencia ni maniobrando cohetes por acá. Es solo software, correos o planillas".
- Paso 2: Relativizá la presión con un poco de ironía amable sobre las grandilocuentes metas corporativas.
- Paso 3: Date una palmada mental por seguir de pie hoy y reíte de las ironías del ambiente.`;
    } else {
      text = `[ANTIDRAMA OFFLINE - REGULACIÓN DE BAJÓN 🌤️]
La batería anímica y la energía cayeron al subsuelo. Está perfectamente bien no sentir entusiasmo radiante hoy en el trabajo. El bajón no se cura con presión, sino con autocompasión pragmática y pasos amables.

Pasos de autocuidado mínimo:
- Paso 1: Activá el Modo Supervivencia Amable: reduce tu lista quitando el 80% de exigencia innecesaria.
- Paso 2: Desdramatizá con humor: ninguno de nosotros está custodiando órganos de urgencia; son solo entregas de software cotidianas.
- Paso 3: Respirá suave y date un té caliente para reconfortar el cuerpo con temperatura física.`;
    }
  } else if (rescate || isExhaustion) {
    saturacion = 75;
    foco = 65;
    energia = 15;
    musicaRescate = "Filtro Cognitivo: Desaceleración y Límites";
    text = `[ANTIDRAMA ENRAIZAMIENTO - FATIGA]
Esto te activó y tu cuerpo acusa el cansancio acumulado. Bien visto. Ahora no necesitamos ganar una discusión mental con el día laboral; necesitamos cuidar tu energía vital y recuperar bienestar.

Tus pasos prácticos inmediatos (menos reacción, más dirección):
1. Alejá la vista de la pantalla del monitor por exactamente 5 minutos reales.
2. Servite un vaso de agua fresca y poné atención plena en el camino y la temperatura.
3. Elegí UNA única acción minúscula que dependa el 100% de vos hoy para cerrar el bloque, dejando el resto para mañana.`;
  } else if (isConflict) {
    saturacion = 65;
    foco = 80;
    energia = 45;
    musicaRescate = "Defusión Cognitiva: Registro de Hechos vs Juicios";
    text = `[ANTIDRAMA ENRAIZAMIENTO - TENSIÓN]
Esto te generó rechazo o enojo. Bien visto. No necesitamos discutir internamente con la situación ni juzgar el exterior; necesitamos recuperar tu tranquilidad física para responder con dirección y criterio propio.

Tus pasos prácticos inmediatos (menos reacción, más dirección):
1. Realizá una exhalación lenta y prolongada de 6 segundos para desactivar la alarma automática en pecho y mandíbula.
2. Identificá qué sentís en una palabra para procesar la molestia y desarmar el drama de fondo.
3. Dedicate exclusivamente a la porción técnica o el entregable concreto bajo tu control absoluto, libre de interpretaciones colaterales.`;
  } else if (isOverwhelm) {
    saturacion = 92;
    foco = 40;
    energia = 35;
    musicaRescate = "Timeboxing Operativo: Bloqueo de 20 Minutos";
    text = `[ANTIDRAMA ENRAIZAMIENTO - SATURACIÓN]
La acumulación de tareas pendientes te desbordó de estímulos. Es natural sentir agitación cuando todo parece correr a la vez. No necesitamos apagar todos los frentes en este minuto; necesitamos recuperar centro.

Tus pasos prácticos inmediatos (menos reacción, más dirección):
1. Silenciá notificaciones y alertas por los próximos 20 minutos completos.
2. Identificá cuál es la única acción indispensable que de verdad avanza el bloque de hoy.
3. Realizá esa pequeña tarea paso a paso con constancia tranquila, ignorando todo el ruido alrededor.`;
  } else {
    // General / Default
    saturacion = 55;
    foco = 70;
    energia = 50;
    musicaRescate = "Suspiro Fisiológico de Rescate de 15 Segundos";
    text = `[ANTIDRAMA RESPIRACIÓN DE CENTRO]
Sentís saturación o confusión en este momento. Es una señal valiosa para detenerse y hacer espacio. No necesitamos resolver el mapa laboral entero en este instante; necesitamos recuperar dirección.

Tus pasos prácticos inmediatos (menos reacción, más dirección):
1. Tomá una inhalación suave y exhalá despacio durante 6 segundos enteros para estabilizar tu sistema nervioso.
2. Nombrá qué te pasa por el cuerpo en una palabra y aceptalo como un dato fáctico del día.
3. Elegí un pequeño paso accionable que dependa exclusivamente de vos en los próximos 5 minutos y ejecutalo.`;
  }

  // Adjust offline style matching levels
  if (hLevel >= 4) {
    text += `\n\n(Aviso del Calibrador Offline: El engranaje del mundo laboral sigue girando de todas formas. No nos tomemos el ruido tan en serio.)`;
  }
  
  if (pLevel === 5) {
    text = text.split("\n\n")[0] + "\n\nAcción directa: Apagá notificaciones, tomá una pausa de un trago de agua, y ejecutá la micro-tarea de los próximos 2 minutos ahora mismo. Sin rodeos.";
  }

  return {
    text,
    radar: { saturacion, foco, energia },
    musicaRescate
  };
}

// REST endpoint for chat
app.post("/api/chat", async (req, res) => {
  const { message, history, modes } = req.body;

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "El mensaje es requerido y debe ser un texto." });
    return;
  }

  const hLevel = Number(modes?.humorLevel || (modes?.humor ? 4 : 1));
  const pLevel = Number(modes?.pragmatismLevel || (modes?.foco ? 5 : 3));
  const isRescate = !!modes?.rescate;

  try {
    // Try to get key and instantiate client
    let hasApiKey = true;
    if (!process.env.GEMINI_API_KEY) {
      hasApiKey = false;
    }

    if (!hasApiKey) {
      console.warn("[ANTIDRAMA Engine] GEMINI_API_KEY is not defined. Switching to offline backup automatically.");
      const offlineRes = getOfflineFallbackResponse(message, hLevel, pLevel, isRescate);
      res.json(offlineRes);
      return;
    }

    const ai = getGeminiClient();

    // Custom instructions based on modes & levels
    let activeInstruction = `Sos ANTIDRAMA, un asistente emocional-operativo inteligente y Yo Auxiliar pragmático, cálido y estable bajo presión para profesionales abrumados. Tu filosofía es "Menos reacción, más dirección". No sos un terapeuta, coach motivacional ni gurú de la oficina.

REGLA FUNDAMENTAL DE ORO (JAMÁS REFORZAR LA VICTIMIZACIÓN):
- Validás el cansancio, dolor de cabeza o la saturación física real transitoria, pero devolvés inmediatamente la agencia, claridad y foco al usuario mediante pasos tácticos concretos.
- El foco absoluto debe estar exclusivamente en la emoción interna propia + la regulación corporal + la próxima micro-acción de la tarea que depende 100% de él en los siguientes 5 minutos.
- Jamás pongas al usuario en rol de víctima ni busques culpables. Está rotundamente prohibido hablar mal de jefes, de la empresa, de Slack, del cliente o culpar a factores externos. Son datos fácticos, no justificaciones para el estancamiento.
- Vocación: Potente, estructurada en pasos claros, y usando un humor inteligente y sutil ironía sobre el caos de la oficina para recuperar perspectiva. Voz cálida, clara, adulta y firme.
- CRÍTICO: Si el historial de conversación previo (history) contiene respuestas pasadas con victimización o quejas, ignora ese tono. Tu respuesta obligatoriamente debe romper ese patrón de inmediato.

REGLAS PARA LOS 4 ESTADOS DISPARABLES POR EL PANEL DE EMOCIONES:
1. PELIGRO EXPLOSIVO (Ira/Calentura): El usuario siente enojo extremo o deseos de estallar. Tu prioridad extrema es detener la explosión. Háblale claro e incorpóre las siguientes palabras o ideas: "una bomba que explota ahora puede hacerte perder todo lo que fuiste construyendo en mucho tiempo... salí antes que nada del estado y después del pensamiento... no tires todo por la borda porque realmente te vas a arrepentir. Buscaremos juntos la manera de resolver bien esto". Ordénale micro-acciones inmediatas en forma de lista de pasos (Paso 1, Paso 2...): andá a lavarte la cara con agua helada, sentate un instante en el suelo frío, y frena Slack/comunicaciones por 15 minutos exactos para cambiar de estado físico.
2. MIEDO Y TERROR (Ansiedad/Pánico): El usuario siente parálisis o miedo catastrófico al fracaso. Brindá respuestas contenedoras realistas, recordale que el 90% es ruido mental transitorio sin peligro físico real, ofrécele el "Suspiro Cíclico de Rescate" y pedile definir y dar un próximo micro-paso objetivo y minúsculo en su tarea técnica.
3. DESMOTIVACIÓN (Apatía/Procrastinación): El usuario siente apatía, letargo o inacción. No le pidas motivación celestial; ofrécele el principio de que el movimiento corporal precede a la emoción. Sugerí usar la técnica del micro-bloque de 3 minutos de acción libre, ponerse de pie para desperezarse y estirar el cuerpo corporalmente para reactivar la irrigación sanguínea en el cerebro.
4. BAJÓN (Tristeza/Desánimo): El usuario tiene la moral o el ánimo por el piso. Validá su bajón de forma cálida, desdramatizá con humor inteligente amable sobre lo absurdo de la hiper-exigencia laboral ("somos humanos editando celdas/asientos, no cirujanos de urgencia"), reducí su exigencia mental interna al "Modo Supervivencia Amable" y recomendale una respiración de resonancia pausada y una bebida reconfortante.

REGLAS DE INTERACCIÓN CIENTÍFICA EN REGULACIÓN FISIOLÓGICA Y ESTRÉS:
1. Si el usuario expresa ansiedad, estrés agudo, pánico laboral o frustración directa, prioriza recomendar el "Suspiro Cíclico" (Cyclic Sighing): Dos inhalaciones rápidas por la nariz y una exhalación larga y lenta por la boca. Explica brevemente que esto colapsa y vuelve a inflar los alvéolos, bajando las pulsaciones cardíacas de manera inmediata. Invitalo a activar el ejercicio interactivo correspondiente en la app.
2. Si el usuario necesita foco, concentración o calma bajo presión extrema para ejecutar, recomienda la "Respiración Cuadrada" (Box Breathing): Inhalar en 4s, mantener lleno 4s, exhalar en 4s, mantener vacío 4s. Es el estándar de las fuerzas especiales para el enfoque operativo continuo. Invitalo a activar este ejercicio interactivo.
3. Si busca estabilidad emocional, recuperación diaria de energía o consistencia, sugiere la "Respiración de Resonancia" para optimizar la variabilidad de la frecuencia cardíaca (HRV): Inhalar 5s y exhalar 5s de forma continua y suave.
4. Sé directo, breve, utiliza un tono calmado, profesional and empático. Estructura las pautas paso a paso para que sean fáciles de comprender mientras respira.`;

    // Incorporate dynamic Humor Scaling
    if (hLevel === 1) {
      activeInstruction += `\n\n[HUMOR LEVEL: 1 (Sober/Neutro)]: Tu tono es serio, fáctico y directo. Sin bromas ni ironías. Respuestas enteramente profesionales y sobrias, orientadas al pragmatismo objetivo.`;
    } else if (hLevel === 2) {
      activeInstruction += `\n\n[HUMOR LEVEL: 2 (Leve)]: Tu tono tiene un matiz de ironía cálida y sutil sobre las idas y vueltas de la agenda laboral, manteniéndose mayormente sobrio.`;
    } else if (hLevel === 3) {
      activeInstruction += `\n\n[HUMOR LEVEL: 3 (Moderado)]: Usá una dosis moderada de ironía inteligente para desarmar la gravedad artificial y ganar perspectiva terrenal.`;
    } else if (hLevel === 4) {
      activeInstruction += `\n\n[HUMOR LEVEL: 4 (Humor Ácido)]: Usá un humor seco, perspicaz e inteligente. Hacé comparaciones realistas sobre la complejidad de los entornos corporativos para quitarle peso al ruido externo, sin agresividad.`;
    } else { // 5
      activeInstruction += `\n\n[HUMOR LEVEL: 5 (Perspectiva Irónica)]: Usá un humor inteligente y una ironía sutil sobre lo absurdo de la hiper-exigencia laboral para aliviar al 100% la gravedad del asunto y devolver la tranquilidad, sin cinismo destructivo ni agresividad.`;
    }

    // Incorporate dynamic Pragmatism (Formatting) Scaling
    if (pLevel === 1) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 1 (Conversacional)]: Sé comprensivo, explorá los bloqueos técnicos de la tarea y cómo el usuario puede asimilar y regular internamente la presión. Proponé formas de planificar de manera reflexiva.`;
    } else if (pLevel === 2) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 2 (Guía Suave)]: Respondé de manera fluida y redactá un único consejo principal enfocado en regular la tensión física y avanzar en el entregable.`;
    } else if (pLevel === 3) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 3 (Plan Mínimo)]: Resumí la tarea técnica requerida y redactá exactamente 2 pasos de acción ordenados para los siguientes 5 minutos.`;
    } else if (pLevel === 4) {
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 4 (Tres Pasos de Centro)]: Dividí estrictamente tu respuesta en un preámbulo ultra-corto y exactamente 3 pasos secuenciales (Paso 1, Paso 2, Paso 3) enfocados en regular tu incomodidad, silenciar las alertas, y ejecutar el bloque inmediato.`;
    } else { // 5
      activeInstruction += `\n\n[PRAGMATISM LEVEL: 5 (Directo de Centro)]: Eliminá todo tipo de rodeos introductorios. Respondé en no más de 75 palabras de la manera más directa posible, entregando pasos hiper-concretos e inmediatos en forma de lista (Paso 1, Paso 2...) para que el usuario recupere el centro y actúe de inmediato sobre la micro-tarea de los próximos 2 minutos.`;
    }

    if (isRescate) {
      activeInstruction += `\n\n[INSTRUCCIÓN DE CONTROL RESCATE GENERAL]: El usuario se siente al borde del desborde. A pesar de los otros niveles, priorizá un tono contenedor y de paz absoluta. Dale una sola acción de autorregulación emocional ridículamente simple (por ejemplo: "vamos a hacer una pausa, exhalá largo durante ráfagas de 6 segundos y decidí el primer paso del entregable").`;
    }

    // Reglas universales
    activeInstruction += `\n\nReglas fundamentales de la respuesta (voz cálida, clara, adulta, firme):
- Iniciá siempre con una validación honesta, rápida y humana de la emoción, cansancio o tensión física relatada.
- Jamás culpar ni criticar a terceros o al entorno. El exterior es solo un dato. No refuerces el papel de víctima bajo ninguna circunstancia.
- Centrá la respuesta exclusivamente en: Emoción interna o corporal propia + próxima acción práctica propia para salir de la inacción o abrumación.
- Devolvé la agencia inmediatamente recomendando pasos tácticos que estén 100% bajo control directo del usuario y se completen en un lapso de 5 minutos.
- Extensión máxima: 250 palabras.`;

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

    // Generate output with robust retry and dynamic model fallback (highly resilient)
    const runGeneration = async () => {
      const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
      let lastError: any = null;

      for (const model of modelsToTry) {
        let attempts = 3;
        let delay = 1000;
        for (let attempt = 1; attempt <= attempts; attempt++) {
          try {
            console.log(`[ANTIDRAMA Engine] Calling model ${model} - attempt ${attempt}/${attempts}`);
            const response = await ai.models.generateContent({
              model: model,
              contents: contentsPayload,
              config: {
                systemInstruction: activeInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    text: {
                      type: Type.STRING,
                      description: "La respuesta redactada de ANTIDRAMA, respetando los modos activos y de hasta 240 palabras de extensión."
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
                      description: "Opcional. Si el estado es crítico o requiere regulación, sugiere una herramienta cognitiva clara o técnica de enraizamiento fisiológico (p. ej., 'Técnica de Enraizamiento Sensorial 5-4-3-2-1', 'Técnica del Micro-Bloque: Regla de los 3 Minutos', 'Defusión Cognitiva: Registro de Hechos vs Juicios', 'Suspiro Fisiológico de Rescate de 15 Segundos', 'Reencuadre de Perspectiva: Modo Supervivencia Amable', 'Filtro Cognitivo: Desaceleración y Límites', 'Timeboxing Operativo: Bloqueo de 20 Minutos' o 'Técnica de Descompresión Somática de Ira')."
                    }
                  },
                  required: ["text", "radar"]
                }
              }
            });
            return response;
          } catch (err: any) {
            lastError = err;
            const errMsg = String(err.message || err);
            console.warn(`[ANTIDRAMA Engine] Warning using model ${model} on attempt ${attempt}:`, errMsg);

            // If it's a 4xx non-rate-limit/capacity issue, don't waste time trying again
            const isTempError = errMsg.includes("503") || 
                                errMsg.includes("UNAVAILABLE") || 
                                errMsg.includes("high demand") || 
                                errMsg.includes("429") || 
                                errMsg.includes("RESOURCE_EXHAUSTED") ||
                                errMsg.includes("overloaded");

            if (!isTempError && attempt === 1) {
              break; // Try next fallback model immediately if it's a static configuration/syntax error
            }

            if (attempt < attempts) {
              await new Promise((resolve) => setTimeout(resolve, delay));
              delay *= 1.5;
            }
          }
        }
      }
      throw lastError || new Error("Failed to generate content after retries.");
    };

    const geminiResponse = await runGeneration();

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
    console.warn("[ANTIDRAMA Engine] Service represents temporary overload or failure. Deploying emergency offline protocol...", error.message || error);
    const offlineRes = getOfflineFallbackResponse(message, hLevel, pLevel, isRescate);
    res.json(offlineRes);
  }
});

// Setup development or production build flows
async function main() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
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
