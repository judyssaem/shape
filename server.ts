import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/generate-shapes", async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || typeof word !== "string" || !word.trim()) {
      return res.status(400).json({ ok: false, error: "만들고 싶은 단어를 입력해 주세요." });
    }

    const cleanWord = word.trim().slice(0, 20);

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        ok: false,
        error: "GEMINI_API_KEY가 설정되지 않았습니다. 기본 추천 그림을 선택해 보세요."
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
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      responseText = response.text || "{}";
    } catch (modelErr: any) {
      console.warn("gemini-3.8-flash unavailable, attempting gemini-3.1-flash-lite fallback:", modelErr?.message);
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      responseText = fallbackResponse.text || "{}";
    }
    let parsed: any;
    try {
      parsed = JSON.parse(responseText.trim().replace(/^```json|```$/g, "").trim());
    } catch {
      return res.status(500).json({ ok: false, error: "모양을 만드는 중 해석 오류가 발생했어요." });
    }

    if (!parsed || !parsed.ok || !Array.isArray(parsed.shapes) || parsed.shapes.length === 0) {
      return res.json({
        ok: false,
        error: `"${cleanWord}"은(는) 도형으로 만들기 어려워요. 다른 것을 써 볼까요?`
      });
    }

    const cleanShapes = parsed.shapes
      .filter((s: any) => s && ["c", "r", "t"].includes(s.t))
      .slice(0, 16);

    return res.json({
      ok: true,
      name: cleanWord,
      shapes: cleanShapes
    });
  } catch (error: any) {
    console.error("Gemini shape generation error:", error);
    return res.status(500).json({
      ok: false,
      error: "지금은 AI 연결이 원활하지 않아요. 아래 추천 그림 중에서 골라 보세요."
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
