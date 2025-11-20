// scripts/gemini.ts

export interface FeedbackOptions {
  topic?: string;
  writingType?: string;
  goalChars?: string;
}

const GEMINI_API_KEY = "...";

const GEMINI_MODEL = "gemini-flash-latest";


async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
  }

  const trimmedPrompt = prompt.trim();
  console.log("[Gemini] prompt length:", trimmedPrompt.length);

  let res: Response;
  try {
    res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        GEMINI_MODEL +
        ":generateContent?key=" +
        GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: trimmedPrompt }] }],
        }),
      }
    );
  } catch (err) {
    console.log("[Gemini] fetch error:", err);
    throw new Error("네트워크 오류로 Gemini API를 호출하지 못했습니다.");
  }

  const json: any = await res.json();
  console.log("[Gemini] HTTP status =", res.status);
  console.log("[Gemini] raw json =", JSON.stringify(json).slice(0, 500));

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      `Gemini API 오류 (status ${res.status})가 발생했습니다.`;
    throw new Error(msg);
  }

  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text || "")
      .join("") || "";

  if (!text || !text.trim()) {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  return text.trim();
}

// 1) Self-Growth: 주제 추천
export async function askGeminiForGrowthTopics(
  writingType: string,
  goalChars: string
): Promise<string[]> {
  const prompt = `
너는 대학생 글쓰기 튜터야.

학생이 '${writingType}' 형식의 Self-Growth 글을 쓰려고 해.
목표 분량은 대략 ${goalChars}자 정도야.

조건:
- Self-Growth(자기 성장)과 직접 연결되는 주제만.
- 실제 과제/보고서/에세이에 써도 어색하지 않을 것.
- 각 주제는 "제목 한 줄"만 작성. 설명 절대 금지.
- 번호, 불릿 없이 한 줄에 하나씩 총 5개.

출력 예시:
나의 감정 일기 쓰기를 통해 이해한 자기 변화 보고서
팀 프로젝트 실패 경험을 통해 성장한 협업 태도 보고서
  `.trim();

  try {
    const raw = await callGemini(prompt);

    const lines = raw
      .split("\n")
      .map((l) => l.replace(/^[\d\.\)\-\s•]+/, "").trim())
      .filter((l) => l.length > 0);

    const topics = lines.slice(0, 5);

    if (topics.length === 0) {
      throw new Error("주제 후보가 비어 있습니다.");
    }

    return topics;
  } catch (e) {
    console.log("askGeminiForGrowthTopics error:", e);
   
    return [
      "프로젝트 경험을 통해 성장한 나의 학습 태도 보고서",
      "감정 일기 쓰기를 통해 이해한 자기 변화 심층 보고서",
      "실패 경험을 통해 배운 점과 다음 실천 계획 정리 보고서",
      "하루 루틴 분석을 통한 시간 관리 습관 개선 보고서",
      "팀 프로젝트 협업 경험으로 돌아본 나의 커뮤니케이션 스타일",
    ];
  }
}

// 2) 문장별 힌트 (Hint)
export async function askGeminiForHint(
  text: string,
  options?: FeedbackOptions
): Promise<string> {
  const { topic, writingType, goalChars } = options || {};
  const typeLabel = writingType || "Self-Growth 글";
  const goal = goalChars ? `${goalChars}자` : "자유 분량";

  const prompt = `
넌 대학생 글쓰기 튜터야.
아래 학생 글을 읽고, 문장별로 "고쳐야 할 부분만" 아주 짧게 힌트를 줘.

- 장점/잘한 점은 말하지 마. (칭찬 금지)
- 문법, 어색한 표현, 논리 흐름이 어긋난 부분 위주로만.
- 각 힌트는 최대 1~2문장, 한국어로.
- "어디가 문제인지 + 어떻게 바꾸면 좋은지"만 말해.
- 출력 형식:
[문장 1] ~~에 대한 힌트: ...
[문장 2] ~~에 대한 힌트: ...
이런 식으로 bullet 없이 줄바꿈만 사용.
- 위 형식을 반드시 지켜. 다른 설명이나 머리/꼬리 문장은 쓰지 마.

${topic ? `평가 기준 주제: ${topic}\n` : ""}
글 형식: ${typeLabel}
목표 분량: ${goal}

--- 학생 글 시작 ---
${text}
--- 학생 글 끝 ---
  `.trim();

  return await callGemini(prompt);
}

//  전체 피드백 
export async function askGeminiForReview(
  text: string,
  options?: FeedbackOptions
): Promise<string> {
  const { topic, writingType, goalChars } = options || {};
  const typeLabel = writingType || "Self-Growth 글";
  const goal = goalChars ? `${goalChars}자` : "자유 분량";

  const prompt = `
넌 대학생 글쓰기 튜터야.
아래 학생 글을 읽고 전체적인 피드백을 줘.

- ${typeLabel} 형식에 맞게 잘 쓰였는지 평가해.
- ${
    topic
      ? `주제 "${topic}" 에 얼마나 잘 맞는지도 평가해.`
      : "글의 주제가 얼마나 명확한지도 평가해."
  }
- 장점은 최대 2줄 안에서 아주 짧게만 말하거나, 생략해도 좋다.
- 고쳐야 할 점(구조, 논리, 구체성 부족, 어색한 표현 등)을 자세히 설명해.
- 전체 텍스트의 90% 이상은 '단점과 개선점'에 집중해.
- 문장 예시는 1~2개 정도만.
- 전체 분량은 10~15줄 이내의 한국어 텍스트로.

출력 구조는 반드시 아래 순서를 지켜:
1. 형식/구조 평가
2. 주제 적합성 평가
3. 개선하면 좋은 점 (단점/보완점 리스트 위주)
4. 다음 글 쓸 때 한 줄 조언

글 형식: ${typeLabel}
목표 분량: ${goal}
${topic ? `평가 기준 주제: ${topic}` : ""}

--- 학생 글 시작 ---
${text}
--- 학생 글 끝 ---
  `.trim();

  return await callGemini(prompt);
}
