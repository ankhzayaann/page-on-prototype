import React, { useRef, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// @ts-ignore - module declaration for PNGs not present in this project
import logoIcon from "@/assets/images/assetspage_on_icon.png";
// @ts-ignore - module declaration for PNGs not present in this project
import logoText from "@/assets/images/assetspage_on_text.png";

import {
  askGeminiForGrowthTopics,
  askGeminiForHint,
  askGeminiForReview,
} from "@/scripts/gemini";

//SCREEN KEYS 
const SCREEN = {
  HOME: "home",
  GROWTH_TYPE: "growth_type",
  GROWTH_LENGTH: "growth_length",
  TOPIC_SUGGEST: "topic_suggest",
  GROWTH_WRITE: "growth_write",
  FEEDBACK_DETAIL: "feedback_detail",
} as const;

type ScreenType = (typeof SCREEN)[keyof typeof SCREEN];

export default function Index() {
  const [screen, setScreen] = useState<ScreenType>(SCREEN.HOME);

  // STATES 

  // Self-Growth 설정
  const [writingType, setWritingType] = useState("");
  const [goalChars, setGoalChars] = useState("500");

  // 선택한 주제(제목)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // 오늘 쓴 글
  const [growthText, setGrowthText] = useState("");
  const [growthSummary, setGrowthSummary] = useState("");

  // 주제 추천
  const [topicSuggestions, setTopicSuggestions] = useState<string[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [topicsError, setTopicsError] = useState<string | null>(null);
  const [customTopic, setCustomTopic] = useState(""); // 🔹 직접 주제 입력용

  // Gemini 피드백 & 힌트
  const [aiFeedback, setAiFeedback] = useState<string | null>(null); // 전체 리뷰
  const [feedbackHints, setFeedbackHints] = useState<string[]>([]); // 문장별 힌트
  const [loadingHint, setLoadingHint] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  // 분량 입력 TextInput 포커스에 사용
  const goalInputRef = useRef<TextInput | null>(null);

  // -GROWTH SUMMARY 
  const analyzeGrowthText = () => {
    if (!growthText.trim()) {
      setGrowthSummary(
        "오늘은 작성된 글이 없어요. 먼저 초안을 편하게 써볼까요?"
      );
      return;
    }

    const length = growthText.replace(/\s/g, "").length;
    const goal = parseInt(goalChars || "0", 10);
    let summary = "";

    if (goal > 0) {
      const ratio = Math.round((length / goal) * 100);
      summary += `현재 분량은 ${length}자 — 목표(${goal}자)의 ${ratio}% 달성!\n\n`;
    }

    summary +=
      "오늘 글에서 좋았던 점과 보완하면 좋을 점을 1–2개씩 적어보세요.";
    setGrowthSummary(summary);
  };

  // 문장별 힌트 전용 호출
  const runGeminiHint = async () => {
    if (!growthText.trim()) {
      setGeminiError("먼저 오늘 쓴 글을 조금이라도 작성해 주세요.");
      return;
    }

    setLoadingHint(true);
    setGeminiError(null);
    setFeedbackHints([]);

    try {
      const answer = await askGeminiForHint(growthText, {
        topic: selectedTopic ?? undefined,
        writingType: writingType || "Self-Growth",
        goalChars,
      });

      const lines = answer
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // [문장 1] ... , 번호/불릿 등만 힌트로 사용
      const bulletLines = lines.filter(
        (l) =>
          l.startsWith("[문장") ||
          l.startsWith("-") ||
          l.startsWith("•") ||
          /^\d+\./.test(l)
      );

      if (bulletLines.length > 0) {
        setFeedbackHints(bulletLines);
      } else {
        setFeedbackHints(lines.slice(0, 8));
      }
    } catch (e: any) {
      console.log("Gemini hint error:", e);
      setGeminiError(
        e instanceof Error
          ? `힌트 오류: ${e.message}`
          : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoadingHint(false);
    }
  };

  //  GEMINI: 전체 피드백 전용 호출 
  const runGeminiFullFeedback = async () => {
    if (!growthText.trim()) {
      setGeminiError("먼저 오늘 쓴 글을 조금이라도 작성해 주세요.");
      return;
    }

    setLoadingReview(true);
    setGeminiError(null);
    setAiFeedback(null);

    try {
      const answer = await askGeminiForReview(growthText, {
        topic: selectedTopic ?? undefined,
        writingType: writingType || "Self-Growth",
        goalChars,
      });
      setAiFeedback(answer.trim());
    } catch (e: any) {
      console.log("Gemini review error:", e);
      setGeminiError(
        e instanceof Error
          ? `피드백 오류: ${e.message}`
          : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setLoadingReview(false);
    }
  };

  // GEMINI: 주제 추천 
  const handleLoadTopics = async () => {
    if (!writingType) {
      setTopicsError("먼저 글 종류를 선택해 주세요.");
      return;
    }

    setLoadingTopics(true);
    setTopicsError(null);
    setTopicSuggestions([]);

    try {
      const topics = await askGeminiForGrowthTopics(writingType, goalChars);
      setTopicSuggestions(topics);
    } catch (e) {
      console.log("Gemini topics error:", e);
      setTopicsError(
        "AI 주제를 불러오는 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요."
      );
    } finally {
      setLoadingTopics(false);
    }
  };

  //  SCREENS 

  const HomeScreen = () => (
    <View style={styles.container}>
      {/* LOGO */}
      <View style={styles.logoWrapper}>
        <Image source={logoIcon} style={styles.logoIconImg} />
        <Image source={logoText} style={styles.logoTextImg} />
      </View>

      <Text style={styles.title}>How To Use?</Text>
      <Text style={styles.homeDesc}>
        글쓰기 목표 설정부터 AI 피드백까지{"\n"}한 번에 도와주는 PAGE ON입니다.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, { marginTop: 40 }]}
        onPress={() => setScreen(SCREEN.GROWTH_TYPE)}
      >
        <Text style={styles.primaryButtonText}>글 쓰기 시작 ✏️</Text>
      </TouchableOpacity>
    </View>
  );

  const GrowthTypeScreen = () => (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backChip}
        onPress={() => setScreen(SCREEN.HOME)}
      >
        <Text style={styles.backChipText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Self-Growth</Text>
      <Text style={styles.centerEmoji}>🤔</Text>
      <Text style={styles.questionText}>어떤 글을 써볼까요?</Text>

      <View style={styles.chipWrap}>
        {["보고서", "논문", "기획안", "대외활동", "대본", "??"].map((t) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.chipLarge,
              writingType === t && styles.chipSelected,
            ]}
            onPress={() => {
              setWritingType(t);
              setSelectedTopic(null);
              setGrowthText("");
              setScreen(SCREEN.GROWTH_LENGTH);
            }}
          >
            <Text
              style={[
                styles.chipLargeText,
                writingType === t && styles.chipTextSelected,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const GrowthLengthScreen = () => {
    const presetValues = ["500", "1000", "2000"];
    const isPreset = presetValues.includes(goalChars);

    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backChip}
          onPress={() => setScreen(SCREEN.GROWTH_TYPE)}
        >
          <Text style={styles.backChipText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Self-Growth</Text>
        <Text style={styles.centerEmoji}>🤔</Text>
        <Text style={styles.questionText}>어느 정도 분량으로 할까요?</Text>

        <Text style={styles.smallLabel}>자 (글자수)</Text>
        <TextInput
          ref={goalInputRef}
          style={styles.textInput}
          keyboardType="numeric"
          value={goalChars}
          onChangeText={setGoalChars}
          placeholder="예: 800"
          placeholderTextColor="#555"
        />

        <View style={styles.chipRow}>
          {presetValues.map((num) => (
            <TouchableOpacity
              key={num}
              style={[styles.chip, goalChars === num && styles.chipSelected]}
              onPress={() => setGoalChars(num)}
            >
              <Text
                style={[
                  styles.chipText,
                  goalChars === num && styles.chipTextSelected,
                ]}
              >
                {num}자
              </Text>
            </TouchableOpacity>
          ))}

          {/* 🔹 직접 입력하기 칩 */}
          <TouchableOpacity
            style={[
              styles.chip,
              styles.chipOutline,
              !isPreset && goalChars !== "" && styles.chipOutlineActive,
            ]}
            onPress={() => {
              // 현재 값이 프리셋이면 비워서 사용자 입력 유도
              if (isPreset) {
                setGoalChars("");
              }
              goalInputRef.current?.focus();
            }}
          >
            <Text
              style={[
                styles.chipText,
                styles.chipOutlineText,
                !isPreset && goalChars !== "" && styles.chipOutlineTextActive,
              ]}
            >
              직접 입력하기
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setScreen(SCREEN.TOPIC_SUGGEST)}
        >
          <Text style={styles.primaryButtonText}>다음 →</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const TopicSuggestScreen = () => (
    <ScrollView
      style={styles.scrollDark}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.backChip}
        onPress={() => setScreen(SCREEN.GROWTH_LENGTH)}
      >
        <Text style={styles.backChipText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Self-Growth</Text>
      <Text style={styles.centerEmoji}>✨</Text>
      <Text style={styles.questionText}>
        {writingType || "자유 형식"} · 목표 {goalChars}자 기준으로{"\n"}쓰기 좋은
        주제를 골라보세요.
      </Text>

      {/* AI 추천 버튼 */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleLoadTopics}
        disabled={loadingTopics}
      >
        <Text style={styles.primaryButtonText}>
          {loadingTopics ? "AI가 주제 생각 중... 🤖" : "AI 주제 추천 받기 🤖"}
        </Text>
      </TouchableOpacity>

      {topicsError && (
        <Text style={{ color: "red", marginTop: 8 }}>{topicsError}</Text>
      )}

      {/* 혹은 직접 주제 입력 */}
      <View style={styles.manualTopicBox}>
        <Text style={styles.smallLabel}>직접 주제 입력하기</Text>
        <TextInput
          style={styles.textInput}
          placeholder="예: 팀 프로젝트 협업 경험으로 돌아본 나의 커뮤니케이션 스타일"
          placeholderTextColor="#777"
          value={customTopic}
          onChangeText={setCustomTopic}
          multiline
        />
        <TouchableOpacity
          style={[styles.primaryButton, styles.outlineButton]}
          onPress={() => {
            if (!customTopic.trim()) {
              setTopicsError("먼저 직접 주제를 입력해 주세요.");
              return;
            }
            setSelectedTopic(customTopic.trim());
            setGrowthText("");
            setAiFeedback(null);
            setGeminiError(null);
            setGrowthSummary("");
            setFeedbackHints([]);
            setTopicsError(null);
            setScreen(SCREEN.GROWTH_WRITE);
          }}
        >
          <Text style={styles.outlineButtonText}>이 주제로 글 쓰기 ✏️</Text>
        </TouchableOpacity>
      </View>

      {/* AI 추천 리스트 */}
      {topicSuggestions.length > 0 && (
        <View style={[styles.summaryBox, { marginTop: 20 }]}>
          <View style={styles.summaryHeaderRow}>
            <Text style={styles.summaryTitle}>추천 글 주제</Text>
            <Text style={styles.summaryBadge}>AI 추천</Text>
          </View>
          <Text style={styles.summaryText}>
            마음에 드는 주제를 탭하면{"\n"}다음 화면에서 바로 이어서 작성할 수
            있어요.
          </Text>

          {topicSuggestions.map((topic, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.topicItem}
              onPress={() => {
                setSelectedTopic(topic);
                setGrowthText("");
                setAiFeedback(null);
                setGeminiError(null);
                setGrowthSummary("");
                setFeedbackHints([]);
                setScreen(SCREEN.GROWTH_WRITE);
              }}
            >
              <View style={styles.topicIndexCircle}>
                <Text style={styles.topicIndexText}>{idx + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.topicTitle}>{topic}</Text>
                <Text style={styles.topicSubText}>이 주제로 글 써보기</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );

  const GrowthWriteScreen = () => (
    <ScrollView
      style={styles.scrollDark}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.backChip}
        onPress={() => setScreen(SCREEN.TOPIC_SUGGEST)}
      >
        <Text style={styles.backChipText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Self-Growth</Text>

      {/* 선택한 주제 카드 */}
      {selectedTopic && (
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>오늘의 글 주제</Text>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>형식</Text>
            <Text style={styles.goalValue}>{writingType}</Text>
          </View>
          <View style={[styles.goalRow, { alignItems: "flex-start" }]}>
            <Text style={styles.goalLabel}>주제</Text>
            <Text style={[styles.goalValue, { flex: 1 }]}>{selectedTopic}</Text>
          </View>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>목표 분량</Text>
            <Text style={styles.goalValue}>{goalChars}자</Text>
          </View>
        </View>
      )}

      <Text style={[styles.smallLabel, { marginTop: 18 }]}>오늘 쓴 글</Text>
      <TextInput
        style={styles.textArea}
        multiline
        placeholder="위 주제에 맞춰 자유롭게 작성해 보세요."
        placeholderTextColor="#777"
        value={growthText}
        onChangeText={(t) => {
          setGrowthText(t);
          setGrowthSummary("");
          setAiFeedback(null);
          setGeminiError(null);
          setFeedbackHints([]);
        }}
      />

      <Text style={styles.lengthInfo}>
        현재 분량: {growthText.replace(/\s/g, "").length}자 / 목표 {goalChars}자
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={analyzeGrowthText}>
        <Text style={styles.primaryButtonText}>오늘 요약 보기</Text>
      </TouchableOpacity>

      {growthSummary.length > 0 && (
        <View style={[styles.summaryBox, { marginTop: 12 }]}>
          <Text style={styles.summaryTitle}>오늘 작성한 글 정리</Text>
          <Text style={styles.summaryText}>{growthSummary}</Text>
        </View>
      )}

      {/* 피드백 탭으로 이동 */}
      <TouchableOpacity
        style={[styles.primaryButton, { marginTop: 20 }]}
        onPress={() => setScreen(SCREEN.FEEDBACK_DETAIL)}
      >
        <Text style={styles.primaryButtonText}>
          Gemini AI 피드백 탭으로 이동 🤖
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // 새 피드백 전용 탭
  const FeedbackDetailScreen = () => (
    <ScrollView
      style={styles.scrollDark}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity
        style={styles.backChip}
        onPress={() => setScreen(SCREEN.GROWTH_WRITE)}
      >
        <Text style={styles.backChipText}>← Back</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Feed back</Text>
      <Text style={styles.centerEmoji}>✍️</Text>

      {selectedTopic && (
        <View style={[styles.goalCard, { marginTop: 0 }]}>
          <Text style={styles.goalTitle}>평가 기준 주제</Text>
          <Text style={[styles.goalValue, { marginTop: 4 }]}>
            {selectedTopic}
          </Text>
        </View>
      )}

      <Text style={[styles.smallLabel, { marginTop: 18 }]}>
        Self-Growth에서 작성한 오늘의 글
      </Text>
      <TextInput
        style={styles.textArea}
        multiline
        placeholder="여기에 글을 작성하거나 수정할 수 있어요."
        placeholderTextColor="#777"
        value={growthText}
        onChangeText={(t) => {
          setGrowthText(t);
          setAiFeedback(null);
          setGeminiError(null);
          setFeedbackHints([]);
        }}
      />

      <Text style={styles.lengthInfo}>
        현재 분량: {growthText.replace(/\s/g, "").length}자 / 목표 {goalChars}자
      </Text>

      {/* 힌트 / 피드백 버튼 */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={runGeminiHint}
        disabled={loadingHint || loadingReview}
      >
        <Text style={styles.primaryButtonText}>
          {loadingHint ? "AI가 힌트 분석 중... 🤖" : "문장별 힌트 마커 보기 💡"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, { marginTop: 8 }]}
        onPress={runGeminiFullFeedback}
        disabled={loadingHint || loadingReview}
      >
        <Text style={styles.primaryButtonText}>
          {loadingReview
            ? "AI가 전체 피드백 작성 중... 🤖"
            : "전체 Gemini AI 피드백 받기 📝"}
        </Text>
      </TouchableOpacity>

      {geminiError && (
        <Text style={{ color: "red", marginTop: 8 }}>{geminiError}</Text>
      )}

      {feedbackHints.length > 0 && (
        <View style={[styles.hintListBox, { marginTop: 12 }]}>
          <Text style={styles.hintTitle}>AI Hint Marker</Text>
          {feedbackHints.map((h, idx) => (
            <Text key={idx} style={styles.hintItem}>
              • {h}
            </Text>
          ))}
        </View>
      )}

      {aiFeedback && (
        <View style={[styles.hintListBox, { marginTop: 12 }]}>
          <Text style={styles.hintTitle}>Gemini AI Feedback</Text>
          <Text style={styles.hintItem}>{aiFeedback}</Text>
        </View>
      )}
    </ScrollView>
  );

  //  RENDER SWITCH 
  const renderScreen = () => {
    switch (screen) {
      case SCREEN.GROWTH_TYPE:
        return GrowthTypeScreen();
      case SCREEN.GROWTH_LENGTH:
        return GrowthLengthScreen();
      case SCREEN.TOPIC_SUGGEST:
        return TopicSuggestScreen();
      case SCREEN.GROWTH_WRITE:
        return GrowthWriteScreen();
      case SCREEN.FEEDBACK_DETAIL:
        return FeedbackDetailScreen();
      case SCREEN.HOME:
      default:
        return HomeScreen();
    }
  };

  return <View style={{ flex: 1, backgroundColor: "#000" }}>{renderScreen()}</View>;
}

// STYLES
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
    backgroundColor: "#000",
  },

  scrollDark: { flex: 1, backgroundColor: "#000" },

  // LOGO
  logoWrapper: { alignItems: "center", marginBottom: 20 },

  logoIconImg: {
    width: 75,
    height: 75,
    resizeMode: "contain",
    marginBottom: 6,
  },
  logoTextImg: {
    width: 160,
    height: 40,
    resizeMode: "contain",
    marginBottom: 30,
  },

  // TEXTS
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 16,
  },
  homeDesc: {
    fontSize: 14,
    color: "#C7CED1",
    textAlign: "center",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  centerEmoji: {
    fontSize: 40,
    marginVertical: 12,
  },
  smallLabel: {
    fontSize: 12,
    color: "#C7CED1",
    marginBottom: 6,
    alignSelf: "flex-start",
  },
  questionText: {
    fontSize: 15,
    color: "#C7CED1",
    marginVertical: 10,
    textAlign: "center",
  },

  // BUTTONS
  primaryButton: {
    backgroundColor: "#00E07B",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#000",
    fontWeight: "700",
  },
  backChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#2E363B",
    backgroundColor: "#111",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  backChipText: { color: "#fff" },

  // CHIP
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginVertical: 12 },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
    justifyContent: "center",
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2E363B",
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#11171A",
  },
  chipLarge: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2E363B",
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: "#11171A",
  },
  chipText: { fontSize: 13, color: "#E5ECEF" },
  chipLargeText: { fontSize: 14, color: "#E5ECEF" },
  chipSelected: { backgroundColor: "#00E07B", borderColor: "#00E07B" },
  chipTextSelected: { color: "#000", fontWeight: "700" },

  //  직접 입력하기 칩 스타일
  chipOutline: {
    backgroundColor: "transparent",
    borderStyle: "dashed",
    borderColor: "#3A4349",
  },
  chipOutlineActive: {
    borderColor: "#00E07B",
    borderWidth: 1.2,
  },
  chipOutlineText: {
    color: "#8A9499",
  },
  chipOutlineTextActive: {
    color: "#00E07B",
    fontWeight: "700",
  },

  // HINT / SUMMARY / BOXES
  hintListBox: {
    backgroundColor: "#11171A",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E363B",
    width: "100%",
    marginBottom: 16,
  },
  hintTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 6 },
  hintItem: { color: "#C7CED1", fontSize: 13, marginVertical: 2 },

  summaryBox: {
    backgroundColor: "#11171A",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2E363B",
    width: "100%",
  },
  summaryHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  summaryTitle: { color: "#fff", fontWeight: "700", fontSize: 15 },
  summaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#00E07B22",
    color: "#00E07B",
    fontSize: 11,
    overflow: "hidden",
  },
  summaryText: { color: "#C7CED1", lineHeight: 20, fontSize: 13 },

  // INPUTS
  textArea: {
    minHeight: 150,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2E363B",
    padding: 14,
    fontSize: 14,
    textAlignVertical: "top",
    backgroundColor: "#050708",
    color: "#E5ECEF",
    width: "100%",
    marginBottom: 10,
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#2E363B",
    padding: 12,
    fontSize: 14,
    backgroundColor: "#050708",
    color: "#E5ECEF",
    width: "100%",
    marginBottom: 12,
  },

  // GROWTH
  goalCard: {
    marginTop: 24,
    backgroundColor: "#11171A",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2E363B",
    width: "100%",
  },
  goalTitle: { fontSize: 16, color: "#fff", fontWeight: "700", marginBottom: 8 },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  goalLabel: { color: "#C7CED1", fontSize: 13 },
  goalValue: { color: "#fff", fontWeight: "700", fontSize: 13 },

  lengthInfo: { fontSize: 12, color: "#777", marginVertical: 6 },

  // Topic list
  topicItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2E363B",
    backgroundColor: "#050708",
    marginTop: 10,
  },
  topicIndexCircle: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "#00E07B22",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  topicIndexText: {
    color: "#00E07B",
    fontWeight: "700",
    fontSize: 13,
  },
  topicTitle: {
    color: "#E5ECEF",
    fontSize: 13,
    lineHeight: 18,
  },
  topicSubText: {
    color: "#8A9499",
    fontSize: 11,
    marginTop: 3,
  },

  // 직접 주제 입력 박스
  manualTopicBox: {
    width: "100%",
    marginTop: 18,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2E363B",
    backgroundColor: "#050708",
  },

  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#00E07B",
    marginTop: 6,
  },
  outlineButtonText: {
    color: "#00E07B",
    fontWeight: "700",
  },
});