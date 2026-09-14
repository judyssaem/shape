import { GoogleGenAI } from "@google/genai";

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

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { audioBase64, mimeType } = req.body || {};

    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    const ai = getAi();
    const effectiveMimeType = mimeType || "audio/webm";

    const prompt = `이 오디오는 초등학교 1학년 어린이가 동그라미, 네모, 세모로 만들고 싶은 모양(단어 또는 짧은 문장)을 우리말로 말한 음성입니다.
아이의 목소리를 귀 기울여 듣고, 만들고자 하는 핵심 대상(명사) 하나를 정확히 찾아주세요.

예시:
- "토끼" -> 토끼
- "토끼 만들어줘" -> 토끼
- "비행기요" -> 비행기
- "기차 모양" -> 기차
- "사과" -> 사과
- "곰돌이" -> 곰
- "나비 날아가는 거" -> 나비
- "자동차가 좋아" -> 자동차
- "로봇" -> 로봇
- "해바라기" -> 해바라기
- "물고기" -> 물고기
- "집" -> 집
- "하트" -> 하트

반드시 지켜야 할 규칙:
1. 따옴표, 쉼표, 마침표, 줄바꿈, 존댓말, 부가 설명 없이 오직 핵심 낱말 하나(1~8글자)만 단독으로 출력하세요.
2. 아무 말도 들리지 않거나 기침/잡음뿐이면 "EMPTY"라고만 출력하세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: effectiveMimeType,
            data: audioBase64,
          },
        },
        {
          text: prompt,
        },
      ],
    });

    const rawText = (response.text || "").trim();
    if (!rawText || rawText.toUpperCase().includes("EMPTY")) {
      return res.json({ ok: false, error: "no_speech", word: "" });
    }

    // Clean any accidental punctuation or whitespace
    let word = rawText.replace(/[.,?!~^'"_#@\n\r\t]/g, "").trim();
    // If response was multiple words, take the last core token
    const parts = word.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      word = parts[parts.length - 1];
    }

    return res.json({
      ok: true,
      word,
      raw: rawText,
    });
  } catch (error: any) {
    console.error("Audio transcription error:", error?.message || error);
    return res.status(500).json({
      ok: false,
      error: error?.message || "Failed to transcribe audio",
    });
  }
}
