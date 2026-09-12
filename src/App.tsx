import { useState, useEffect, useCallback } from 'react';
import { HelpLevel, Shape } from './types';
import { PRESETS } from './presets';
import { SearchAndChips } from './components/SearchAndChips';
import { ShapeCanvas } from './components/ShapeCanvas';
import { LevelSelector } from './components/LevelSelector';

export default function App() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [title, setTitle] = useState<string>('');
  const [level, setLevel] = useState<HelpLevel>('shadow');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Initialize with the first preset (기차) so the child sees a ready example
  useEffect(() => {
    if (PRESETS['기차']) {
      setShapes(PRESETS['기차']);
      setTitle('기차');
    }
  }, []);

  const handleSelectWord = useCallback(async (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;

    // Stop speaking if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // Preset match
    if (PRESETS[trimmed]) {
      setShapes(PRESETS[trimmed]);
      setTitle(trimmed);
      return;
    }

    // AI Generation via server-side Gemini
    setIsLoading(true);
    setLoadingMessage(`${trimmed} 모양을 찾고 있어요…`);

    try {
      const res = await fetch('/api/generate-shapes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word: trimmed }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !Array.isArray(data.shapes) || data.shapes.length === 0) {
        const errorText =
          data.error || `"${trimmed}"은(는) 도형으로 만들기 어려워요. 다른 것을 써 볼까요?`;
        setLoadingMessage(errorText);
        setTimeout(() => {
          setIsLoading(false);
        }, 2600);
        return;
      }

      setShapes(data.shapes);
      setTitle(data.name || trimmed);
      setIsLoading(false);
    } catch (err) {
      console.error('Shape generation failed:', err);
      setLoadingMessage('지금은 AI 연결이 원활하지 않아요. 추천 그림 중에서 골라 보세요.');
      setTimeout(() => {
        setIsLoading(false);
      }, 2600);
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleSpeak = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      alert('이 브라우저는 음성 안내를 지원하지 않아요.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const circles = shapes.filter((s) => s.t === 'c').length;
    const rects = shapes.filter((s) => s.t === 'r').length;
    const triangles = shapes.filter((s) => s.t === 't').length;

    const text = `${title}! 동그라미 ${circles}개, 네모 ${rects}개, 세모 ${triangles}개로 만들어요. 색종이를 알맞게 오려서 그림자 위에 올려 놓아 보세요!`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // Slightly slower and clearer for children

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, shapes, title]);

  const circlesCount = shapes.filter((s) => s.t === 'c').length;
  const rectsCount = shapes.filter((s) => s.t === 'r').length;
  const trianglesCount = shapes.filter((s) => s.t === 't').length;

  return (
    <div className="min-h-screen py-5 px-4 sm:px-6 pb-12">
      <div className="wrap max-w-[620px] mx-auto">
        {/* Printable Worksheet Header (Visible only when printing) */}
        <div className="hidden print-only mb-4 text-center border-b-2 border-dashed border-[#B08968] pb-3">
          <div className="flex items-center justify-between text-base text-[#456F22] font-jua">
            <span>새싹 수학 정원 · 여러 가지 모양 놀이</span>
            <span>1학년 반 이름: ___________</span>
          </div>
          <h1 className="font-jua text-3xl text-[#456F22] mt-1">
            🌱 모양 그림 만들기: {title || '나만의 작품'}
          </h1>
          <p className="font-gaegu text-xl text-[#3C3A32] mt-1">
            동그라미 {circlesCount}개, 네모 {rectsCount}개, 세모 {trianglesCount}개를 색종이로 붙여
            보세요!
          </p>
        </div>

        {/* Regular Header */}
        <header className="text-center mb-4.5 no-print">
          <h1 className="font-jua text-3xl sm:text-4xl text-[#456F22] tracking-tight m-0 flex items-center justify-center gap-1.5">
            <span className="leaf inline-block -rotate-12">🌱</span>
            <span>모양 그림 도우미</span>
          </h1>
          <p className="sub font-gaegu text-xl sm:text-2xl text-[#B08968] mt-1 m-0">
            만들고 싶은 것을 쓰면, 동그라미·네모·세모로 알려 줘요
          </p>
        </header>

        {/* Search & Word Chips */}
        <div className="no-print">
          <SearchAndChips
            onSelectWord={handleSelectWord}
            activeWord={title}
            disabled={isLoading}
          />
        </div>

        {/* Stage Container */}
        <div className="stage grid gap-4 mt-4.5 max-w-[620px] mx-auto">
          {/* Canvas Card */}
          <div className="print-card">
            <ShapeCanvas
              shapes={shapes}
              title={title}
              level={level}
              isLoading={isLoading}
              loadingMessage={loadingMessage}
            />
          </div>

          {/* Level Selector */}
          <div className="no-print">
            <LevelSelector
              level={level}
              onLevelChange={setLevel}
              onPrint={handlePrint}
              onSpeak={handleSpeak}
              isSpeaking={isSpeaking}
              hasShapes={shapes.length > 0}
            />
          </div>

          {/* Worksheet Checkbox Table for Print */}
          <div className="hidden print-only mt-4 border border-[#E4DCC4] p-3 rounded-lg">
            <h3 className="font-jua text-lg mb-2">내가 찾은 모양 개수 적어보기</h3>
            <div className="grid grid-cols-3 text-center font-gaegu text-xl gap-2">
              <div className="border border-[#E4DCC4] p-2 rounded">
                동그라미 ( ) 개
              </div>
              <div className="border border-[#E4DCC4] p-2 rounded">
                네모 ( ) 개
              </div>
              <div className="border border-[#E4DCC4] p-2 rounded">
                세모 ( ) 개
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
