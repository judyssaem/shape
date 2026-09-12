import { GoogleGenAI } from "@google/genai";

// In-memory cache for serverless instance
const shapeCache = new Map<string, any[]>();

let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function normalizeShapeType(val: any): 'c' | 'r' | 't' | null {
  if (!val || typeof val !== 'string') return null;
  const lower = val.toLowerCase().trim();
  if (lower === 'c' || lower.includes('circle') || lower.includes('원') || lower.includes('동그라미')) return 'c';
  if (lower === 'r' || lower.includes('rect') || lower.includes('square') || lower.includes('네모') || lower.includes('사각')) return 'r';
  if (lower === 't' || lower.includes('tri') || lower.includes('세모') || lower.includes('삼각')) return 't';
  return null;
}

function cleanShape(raw: any): any | null {
  if (!raw || typeof raw !== 'object') return null;
  const t = normalizeShapeType(raw.t || raw.type || raw.shape);
  if (!t) return null;

  const co = typeof raw.co === 'string' && raw.co.startsWith('#') ? raw.co : undefined;
  const rot = typeof raw.rot === 'number' ? raw.rot : (Number(raw.rot) || undefined);

  if (t === 'c') {
    const cx = Number(raw.cx ?? 50);
    const cy = Number(raw.cy ?? 50);
    const r = Math.max(2, Math.min(45, Number(raw.r ?? 10)));
    return { t: 'c', cx, cy, r, co, rot };
  }

  if (t === 'r') {
    const x = Number(raw.x ?? 10);
    const y = Number(raw.y ?? 10);
    const w = Math.max(2, Math.min(90, Number(raw.w ?? 20)));
    const h = Math.max(2, Math.min(90, Number(raw.h ?? 20)));
    return { t: 'r', x, y, w, h, co, rot };
  }

  if (t === 't') {
    const cx = Number(raw.cx ?? 50);
    const cy = Number(raw.cy ?? 50);
    const s = Math.max(4, Math.min(90, Number(raw.s ?? 20)));
    return { t: 't', cx, cy, s, co, rot };
  }

  return null;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers for Vercel deployment
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "POST 요청만 지원합니다." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { word } = body;

    if (!word || typeof word !== "string" || !word.trim()) {
      return res.status(400).json({ ok: false, error: "만들고 싶은 단어를 입력해 주세요." });
    }

    const cleanWord = word.trim().slice(0, 20);

    // In-memory cache check
    if (shapeCache.has(cleanWord)) {
      return res.json({
        ok: true,
        name: cleanWord,
        shapes: shapeCache.get(cleanWord)
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({
        ok: false,
        error: "Vercel 환경 변수에 GEMINI_API_KEY가 등록되지 않았습니다. Vercel 대시보드(Settings → Environment Variables)에서 GEMINI_API_KEY를 추가해 주세요."
      });
    }

    const ai = getAi();
    const prompt = `너는 초등학교 1학년 수학 수업 도우미다.
아이가 색종이 도형(동그라미, 네모, 세모)으로 "${cleanWord}"을(를) 만들 수 있도록, 아주 단순하고 예쁜 도형 배치를 JSON으로만 출력해라.

규칙
- 0~100 정사각형 캔버스. 그림은 x 8~92, y 8~92 안에 크고 시원하게 중앙 배치한다.
- 도형은 5~12개. 오직 동그라미(c), 네모(r), 세모(t)만 쓴다.
- 동그라미: {"t":"c","cx":50,"cy":50,"r":10,"co":"#RRGGBB"}
- 네모: {"t":"r","x":10,"y":10,"w":30,"h":20,"rot":0,"co":"#RRGGBB"}
- 세모: {"t":"t","cx":50,"cy":50,"s":20,"rot":0,"co":"#RRGGBB"} (s는 한 변/밑변 크기, rot 0이면 위가 뾰족)
- 배열 순서는 아이가 붙이는 순서다. 뒤쪽·큰 밑판 도형부터 앞쪽·작은 도형 순서로 넣는다.
- 가장 큰 특징만 남기고 단순하게. 선, 글자, 곡선, 얼굴 표정 세부는 넣지 않는다.
- 6~7세 아이에게 부적절하거나 도형으로 표현하기 어려운 낱말이면 {"ok":false}

출력은 반드시 유효한 JSON 형식이어야 한다. 설명이나 마크다운 코드블록 없이 JSON 객체만 반환해라:
{"ok":true,"name":"${cleanWord}","shapes":[{"t":"r","x":20,"y":40,"w":60,"h":30,"co":"#4E96D6"}]}`;

    let responseText = "";
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      responseText = response.text || "{}";
    } catch (primaryErr: any) {
      console.warn("gemini-3.1-flash-lite error, attempting fallback:", primaryErr?.message);
      try {
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        responseText = fallbackResponse.text || "{}";
      } catch (secondErr: any) {
        console.warn("gemini-2.5-flash error, attempting third fallback:", secondErr?.message);
        const lastResponse = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        responseText = lastResponse.text || "{}";
      }
    }

    let parsed: any;
    try {
      const cleanedJson = responseText
        .trim()
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/g, "")
        .trim();
      parsed = JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("JSON parse error:", responseText);
      return res.status(500).json({ ok: false, error: "모양을 만드는 중 해석 오류가 발생했어요. 다시 시도해 주세요." });
    }

    if (!parsed || parsed.ok === false || !Array.isArray(parsed.shapes) || parsed.shapes.length === 0) {
      return res.json({
        ok: false,
        error: `"${cleanWord}"은(는) 도형으로 만들기 어려워요. 다른 것을 써 볼까요?`
      });
    }

    const cleanShapes = parsed.shapes
      .map(cleanShape)
      .filter((s: any) => s !== null)
      .slice(0, 16);

    if (cleanShapes.length === 0) {
      return res.json({
        ok: false,
        error: `"${cleanWord}"은(는) 도형으로 만들기 어려워요. 다른 것을 써 볼까요?`
      });
    }

    shapeCache.set(cleanWord, cleanShapes);

    return res.json({
      ok: true,
      name: cleanWord,
      shapes: cleanShapes
    });
  } catch (error: any) {
    console.error("Shape generation error:", error);
    return res.status(500).json({
      ok: false,
      error: "지금은 AI 연결이 원활하지 않아요. 아래 추천 그림 중에서 골라 보세요."
    });
  }
}
