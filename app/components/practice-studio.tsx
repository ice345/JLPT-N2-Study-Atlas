"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { JapaneseAudioPlayer } from "@/app/components/japanese-audio-player";
import { audioAssetForText } from "@/app/lib/audio-assets";
import {
  diagnosticQuestions,
  diagnosticQuestionsFor,
  practiceAreaNames,
  practiceQuestions,
  questionsFor,
  type PracticeArea,
  type PracticeQuestion,
} from "@/app/data/practice";
import { analyzeDiagnostic } from "@/app/lib/diagnostic";
import type { AiDiagnosticInterpretation } from "@/app/lib/ai/diagnostic-interpretation";
import { getProblemCatalogEntry, getUnitCatalogEntry } from "@/app/lib/learning-catalog";
import {
  createStudyId,
  getStudyStore,
  makeStudyEvent,
  type LocalPracticeSession,
  type StudyEvent,
} from "@/app/lib/study-store";
import { syncStudyStore } from "@/app/lib/study-sync";
import { makeRulePlan, type RulePlan } from "@/app/lib/study";
import {
  AiProviderSettings,
  emptyPersonalAiProvider,
  type PersonalAiProvider,
} from "./ai-provider-settings";
import { ShareButton } from "./share-button";
import { JapaneseReading } from "./japanese-reading";

type Attempt = {
  questionId: string;
  area: PracticeArea;
  skill: string;
  correct: boolean;
  createdAt: string;
};
type StoredPlan = RulePlan & {
  headline: string;
  analysis: string;
  weeklyPlan: string[];
  reviewRule: string;
  interpretation?: AiDiagnosticInterpretation;
  source: "ai" | "rule";
  generatedAt: string;
  targetExamDate: string | null;
};
type Profile = { targetExamDate: string; dailyMinutes: number };

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function attemptsFromEvents(events: StudyEvent[]): Attempt[] {
  return events
    .filter(
      (event) =>
        (event.type === "practice_answer" || event.type === "diagnostic_answer") &&
        typeof event.correct === "boolean",
    )
    .map((event) => ({
      questionId: event.contentId,
      area: event.domain,
      skill: event.skill ?? "综合判断",
      correct: Boolean(event.correct),
      createdAt: event.createdAt,
    }));
}

function localPlan(attempts: Attempt[], profile: Profile): StoredPlan {
  const rule = makeRulePlan(attempts, profile.dailyMinutes);
  return {
    ...rule,
    headline: `先巩固${practiceAreaNames[rule.focus]}，再回到混合训练。`,
    analysis: rule.summary,
    weeklyPlan: rule.dailyLoop,
    reviewRule: "错题先回到相关学习单元；隔天重做，连续两次答对后进入每周复测。",
    source: "rule",
    generatedAt: new Date().toISOString(),
    targetExamDate: profile.targetExamDate || null,
  };
}

export function PracticeStudio({
  signedIn,
  signInPath,
  initialCardId,
}: {
  signedIn: boolean;
  signInPath: string;
  initialCardId?: string;
}) {
  const [mode, setMode] = useState<"home" | "diagnostic" | "practice" | "result">("home");
  const [area, setArea] = useState<PracticeArea | "all">("all");
  const [session, setSession] = useState<PracticeQuestion[]>([]);
  const [activeSession, setActiveSession] = useState<LocalPracticeSession | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [seconds, setSeconds] = useState(0);
  const [profile, setProfile] = useState<Profile>({ targetExamDate: "", dailyMinutes: 25 });
  const [plan, setPlan] = useState<StoredPlan | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [resumableSession, setResumableSession] = useState<LocalPracticeSession | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [aiProvider, setAiProvider] = useState<PersonalAiProvider>(emptyPersonalAiProvider);
  const [diagnosticPreset, setDiagnosticPreset] = useState<30 | 38 | 57 | "custom">(38);
  const [customDiagnosticCount, setCustomDiagnosticCount] = useState(42);
  const lastInteractionAt = useRef(0);
  const secondsRef = useRef(0);
  useEffect(() => { secondsRef.current = seconds; }, [seconds]);

  useEffect(() => {
    lastInteractionAt.current = Date.now();
    let active = true;
    async function loadLocal() {
      const store = getStudyStore();
      const [storedProfile, events, unfinished] = await Promise.all([
        store.getProfile(),
        store.getEvents({ type: ["practice_answer", "diagnostic_answer"] }),
        store.getActiveSession(),
      ]);
      if (!active) return;
      if (storedProfile) {
        setProfile({
          targetExamDate: storedProfile.targetExamDate,
          dailyMinutes: storedProfile.dailyMinutes,
        });
      }
      const localAttempts = attemptsFromEvents(events);
      setAttempts(localAttempts);
      if (localAttempts.length) {
        setPlan(localPlan(localAttempts, {
          targetExamDate: storedProfile?.targetExamDate ?? "",
          dailyMinutes: storedProfile?.dailyMinutes ?? 25,
        }));
      }
      setResumableSession(unfinished);
    }

    loadLocal().catch(() => setError("无法读取此设备上的学习记录。"));
    if (signedIn) {
      syncStudyStore()
        .then(({ pushed, pulled }) => {
          if (!active) return;
          setSyncMessage(`同步完成：上传 ${pushed} 条，合并 ${pulled} 条云端记录。`);
          return loadLocal();
        })
        .catch((reason: Error) => {
          if (active) setSyncMessage(reason.message);
        });
      fetch("/api/study/bootstrap")
        .then(async (response) => response.ok ? response.json() : null)
        .then((data: { plan?: StoredPlan | null } | null) => {
          if (active && data?.plan) setPlan(data.plan);
        })
        .catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [signedIn]);

  useEffect(() => {
    const noteInteraction = () => { lastInteractionAt.current = Date.now(); };
    const interactions: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];
    interactions.forEach((eventName) => window.addEventListener(eventName, noteInteraction, { passive: true }));
    return () => interactions.forEach((eventName) => window.removeEventListener(eventName, noteInteraction));
  }, []);

  useEffect(() => {
    if (!activeSession || (mode !== "diagnostic" && mode !== "practice")) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && Date.now() - lastInteractionAt.current <= 90_000) {
        setSeconds((value) => value + 1);
      }
    }, 1000);
    const persistence = window.setInterval(() => {
      getStudyStore().saveSession({ ...activeSession, answers, activeSeconds: secondsRef.current }).catch(() => undefined);
    }, 15_000);
    return () => {
      window.clearInterval(timer);
      window.clearInterval(persistence);
    };
  }, [activeSession, answers, mode]);

  const answered = Object.keys(answers).length;
  const correct = useMemo(
    () => session.filter((item) => answers[item.id] === item.answer).length,
    [answers, session],
  );
  const diagnosticCount = diagnosticPreset === "custom" ? Math.min(57, Math.max(30, customDiagnosticCount)) : diagnosticPreset;
  const diagnosticReport = useMemo(
    () => activeSession?.mode === "diagnostic" ? analyzeDiagnostic(session, answers, seconds) : null,
    [activeSession?.mode, answers, seconds, session],
  );
  const focusArea = plan?.focus ?? (["language", "reading", "listening"] as PracticeArea[]).sort((left, right) => {
    const leftScore = attempts.filter((item) => item.area === left);
    const rightScore = attempts.filter((item) => item.area === right);
    const leftRate = leftScore.length ? leftScore.filter((item) => item.correct).length / leftScore.length : -1;
    const rightRate = rightScore.length ? rightScore.filter((item) => item.correct).length / rightScore.length : -1;
    return leftRate - rightRate;
  })[0];
  const requestedCard = initialCardId ? practiceQuestions.find((question) => question.id === initialCardId) : undefined;

  async function saveProfile() {
    await getStudyStore().saveProfile(profile);
    if (!signedIn) return;
    await fetch("/api/study/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    }).catch(() => undefined);
  }

  async function start(nextMode: "diagnostic" | "practice", nextArea: PracticeArea | "all", questionCount = diagnosticCount) {
    setError("");
    setSaving(true);
    try {
      await saveProfile();
      const seed = createStudyId("diagnostic-seed");
      const pool = nextMode === "diagnostic"
        ? diagnosticQuestionsFor(questionCount, seed)
        : prioritisedQuestions(nextArea, attempts, focusArea);
      const nextSession: LocalPracticeSession = {
        id: createStudyId("session"),
        mode: nextMode,
        area: nextArea,
        questionIds: pool.map((item) => item.id),
        seed,
        activeSeconds: 0,
        answers: {},
        startedAt: new Date().toISOString(),
        completedAt: null,
      };
      await getStudyStore().saveSession(nextSession);
      setSession(pool);
      setActiveSession(nextSession);
      setResumableSession(null);
      setAnswers({});
      setSeconds(0);
      setShowAnswers(false);
      setArea(nextArea);
      setMode(nextMode);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "无法开始练习。");
    } finally {
      setSaving(false);
    }
  }

  async function startRequestedCard() {
    if (!requestedCard) return;
    const nextSession: LocalPracticeSession = {
      id: createStudyId("session"),
      mode: "practice",
      area: requestedCard.area,
      questionIds: [requestedCard.id],
      seed: createStudyId("review-seed"),
      activeSeconds: 0,
      answers: {},
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    try {
      await getStudyStore().saveSession(nextSession);
      setSession([requestedCard]);
      setActiveSession(nextSession);
      setResumableSession(null);
      setAnswers({});
      setSeconds(0);
      setArea(requestedCard.area);
      setMode("practice");
    } catch {
      setError("无法打开这张复习卡，请稍后重试。");
    }
  }

  function resume() {
    if (!resumableSession) return;
    const savedQuestions = resumableSession.questionIds
      .map((id) => practiceQuestions.find((item) => item.id === id))
      .filter((item): item is PracticeQuestion => Boolean(item));
    if (savedQuestions.length !== resumableSession.questionIds.length) {
      setError("这轮未完成练习的题目已更新，请重新开始。");
      setResumableSession(null);
      return;
    }
    setSession(savedQuestions);
    setAnswers(resumableSession.answers);
    setActiveSession(resumableSession);
    setSeconds(resumableSession.activeSeconds ?? 0);
    setArea(resumableSession.area);
    setMode(resumableSession.mode);
  }

  function chooseAnswer(questionId: string, answer: number) {
    const nextAnswers = { ...answers, [questionId]: answer };
    setAnswers(nextAnswers);
    if (activeSession) {
      const updated = { ...activeSession, answers: nextAnswers, activeSeconds: seconds };
      setActiveSession(updated);
      getStudyStore().saveSession(updated).catch(() => setError("答案暂时没有保存成功，请重试。"));
    }
  }

  async function submit() {
    if (!activeSession || answered !== session.length) return;
    setSaving(true);
    setError("");
    const completedAt = new Date().toISOString();
    try {
      const completedSession = { ...activeSession, answers, activeSeconds: seconds, completedAt };
      const durationPerQuestion = Math.max(1, Math.round(seconds / Math.max(1, session.length)));
      const events = await Promise.all(session.map((item) => makeStudyEvent({
        type: activeSession.mode === "diagnostic" ? "diagnostic_answer" : "practice_answer",
        contentType: item.area === "reading" ? "reading" : item.area === "listening" ? "listening" : "problem",
        contentId: item.id,
        problemId: item.problem,
        unitId: item.relatedContentIds.find((id) => id !== item.problem),
        domain: item.area,
        skill: item.skill,
        correct: answers[item.id] === item.answer,
        durationSeconds: durationPerQuestion,
        createdAt: completedAt,
      })));
      const store = getStudyStore();
      await Promise.all([store.saveSession(completedSession), store.addEvents(events)]);
      const freshAttempts = attemptsFromEvents(events);
      const allAttempts = [...freshAttempts, ...attempts];
      setAttempts(allAttempts);
      const nextPlan = localPlan(allAttempts, profile);
      setPlan(nextPlan);
      setActiveSession(completedSession);
      setMode("result");

      if (signedIn) {
        try {
          await syncStudyStore();
          setSyncMessage("本轮记录已同步到云端。");
        } catch (reason) {
          setSyncMessage(reason instanceof Error ? reason.message : "云端同步失败；本地记录已经保存。");
        }
      }
      const personalProviderSelected = Boolean(aiProvider.apiKey || aiProvider.credentialId);
      if (signedIn || personalProviderSelected) {
        try {
          const aiResponse = await fetch("/api/study/ai-plan", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              provider: personalProviderSelected ? aiProvider : undefined,
              local: { attempts: allAttempts, targetExamDate: profile.targetExamDate, dailyMinutes: profile.dailyMinutes },
            }),
          });
          const aiBody = await aiResponse.json() as { plan?: StoredPlan; error?: string };
          if (aiResponse.ok && aiBody.plan) setPlan(aiBody.plan);
          else if (personalProviderSelected) setSyncMessage(aiBody.error ?? "AI 计划未生成；规则计划仍然可用。");
        } catch {
          if (personalProviderSelected) setSyncMessage("AI 计划未生成；规则计划与本地记录仍然可用。");
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "交卷失败，请重试。");
    } finally {
      setSaving(false);
    }
  }

  if (mode === "home") {
    return (
      <section className="practice-studio" id="practice-studio">
        <header className="practice-heading">
          <div>
            <span>TRAIN · REVIEW · ADJUST</span>
            <h2>不登录也能开始，<br />每次作答都会留下记录。</h2>
            <p>练习、未完成场次和诊断结果先保存在此设备；登录只负责跨设备同步，不是学习门槛。</p>
          </div>
          <aside>
            <small>当前重点</small>
            <strong>{plan ? practiceAreaNames[plan.focus] : "等待诊断"}</strong>
            <em>{plan ? `每天 ${plan.dailyMinutes} 分钟` : `${diagnosticQuestions.length} 题库 · 19 题型`}</em>
          </aside>
        </header>

        {!signedIn && (
          <div className="practice-login-note">
            <strong>本地学习已启用</strong>
            <p>当前设备会自动保存。需要在手机和电脑间延续进度时，再登录同步。</p>
            <a href={signInPath}>登录并合并本地记录 →</a>
          </div>
        )}

        {initialCardId && (
          <div className="resume-session">
            <div>
              <span>REVIEW CARD</span>
              <strong>{requestedCard ? requestedCard.skill : "这张旧练习卡已更新"}</strong>
              <p>{requestedCard ? "从复习队列直接重做这一题；答对后会自动更新当前错题。" : "找不到原题时，可以回到混合练习继续校准。"}</p>
            </div>
            {requestedCard ? <button type="button" onClick={startRequestedCard}>重做这题 →</button> : <Link href="/n2/review">返回复习中心 →</Link>}
          </div>
        )}

        {resumableSession && (
          <div className="resume-session">
            <div>
              <span>未完成练习</span>
              <strong>{resumableSession.mode === "diagnostic" ? "继续全域基线" : "继续上一次练习"}</strong>
              <p>已作答 {Object.keys(resumableSession.answers).length} 题，答案保存在此设备。</p>
            </div>
            <button type="button" onClick={resume}>继续 →</button>
          </div>
        )}

        <div className="practice-launch-grid">
          <article className="diagnostic-card">
            <span>01 · BASELINE</span>
            <h3>{plan ? "重新校准学习重点" : "先做一次全域基线"}</h3>
            <p>每种模式都覆盖语言知识 9 题型、阅读 5 题型与听力 5 题型。题量越多，系统对具体薄弱能力的判断越稳定。</p>
            <div className="diagnostic-presets" aria-label="选择诊断题量">
              {([
                [30, "快速", "约 20 分钟"],
                [38, "标准", "约 28 分钟"],
                [57, "深入", "约 42 分钟"],
              ] as const).map(([count, label, time]) => (
                <button
                  type="button"
                  className={diagnosticPreset === count ? "active" : ""}
                  aria-pressed={diagnosticPreset === count}
                  key={count}
                  onClick={() => setDiagnosticPreset(count)}
                >
                  <strong>{count} 题</strong><span>{label}</span><small>{time}{count === 38 ? " · 推荐" : ""}</small>
                </button>
              ))}
              <button
                type="button"
                className={diagnosticPreset === "custom" ? "active" : ""}
                aria-pressed={diagnosticPreset === "custom"}
                onClick={() => setDiagnosticPreset("custom")}
              >
                <strong>自定义</strong><span>30–57 题</span><small>控制练习长度</small>
              </button>
            </div>
            {diagnosticPreset === "custom" && (
              <label>
                自定义题量
                <input type="number" min="30" max="57" value={customDiagnosticCount} onChange={(event) => setCustomDiagnosticCount(Number(event.target.value))} />
              </label>
            )}
            <label>
              目标考试日期（可选）
              <input type="date" value={profile.targetExamDate} onChange={(event) => setProfile((current) => ({ ...current, targetExamDate: event.target.value }))} />
            </label>
            <label>
              每天可投入分钟
              <input type="number" min="10" max="180" value={profile.dailyMinutes} onChange={(event) => setProfile((current) => ({ ...current, dailyMinutes: Number(event.target.value) }))} />
            </label>
            <button type="button" disabled={saving} onClick={() => start("diagnostic", "all", diagnosticCount)}>
              {saving ? "准备中…" : `开始 ${diagnosticCount} 题全域基线`}
            </button>
          </article>
          <div className="practice-area-list">
            {(Object.keys(practiceAreaNames) as PracticeArea[]).map((item) => (
              <button key={item} type="button" disabled={saving} onClick={() => start("practice", item)}>
                <span>{practiceAreaNames[item]}</span>
                <strong>{questionsFor(item).length} 题</strong>
                <em>开始专项 →</em>
              </button>
            ))}
            <button type="button" disabled={saving} onClick={() => start("practice", "all")}>
              <span>综合练习</span>
              <strong>{practiceQuestions.length} 题</strong>
              <em>混合计时 →</em>
            </button>
          </div>
        </div>
        <AiProviderSettings onChange={setAiProvider} signedIn={signedIn} value={aiProvider} />
        {syncMessage && <p className="practice-sync-message" role="status">{syncMessage}</p>}
        {error && <p className="practice-error" role="alert">{error}</p>}
      </section>
    );
  }

  if (mode === "result") {
    return (
      <section className="practice-studio practice-result">
        <span>SESSION COMPLETE</span>
        <h2>{activeSession?.mode === "diagnostic" ? "你的本地学习起点已经生成。" : "这一轮练习已保存。"}</h2>
        <div className="result-score">
          <strong>{correct}<small> / {session.length}</small></strong>
          <span>答对题数 · 用时 {formatTime(seconds)}</span>
        </div>
        {diagnosticReport && (
          <section className="diagnostic-report" aria-labelledby="diagnostic-report-title">
            <div className="diagnostic-report-lead">
              <div>
                <span>READINESS</span>
                <strong id="diagnostic-report-title">{diagnosticReport.readinessLabel}</strong>
                <p>本次答对 {diagnosticReport.percent}% · 平均每题 {diagnosticReport.averageSeconds} 秒</p>
              </div>
              <div>
                <span>结果参考度</span>
                <strong>{diagnosticReport.confidenceLabel}</strong>
                <p>已覆盖 {diagnosticReport.coveredProblems} / {diagnosticReport.totalProblems} 个题型 · 本次区间约 {diagnosticReport.scoreInterval[0]}–{diagnosticReport.scoreInterval[1]}%</p>
              </div>
            </div>
            <div className="diagnostic-domain-scores">
              {diagnosticReport.domainScores.map((score) => (
                <article key={score.key}>
                  <span>{score.label}</span><strong>{score.percent}%</strong><small>{score.correct} / {score.total}</small>
                  <i><b style={{ width: `${score.percent}%` }} /></i>
                </article>
              ))}
            </div>
            <div className="diagnostic-skill-grid">
              <div><span>优先校准</span><ul>{diagnosticReport.weakestSkills.map((score) => <li key={score.key}><strong>{score.label}</strong><small>{score.percent}% · {score.total} 题</small></li>)}</ul></div>
              <div><span>目前较稳定</span><ul>{diagnosticReport.strongestSkills.map((score) => <li key={score.key}><strong>{score.label}</strong><small>{score.percent}% · {score.total} 题</small></li>)}</ul></div>
            </div>
            <p className="diagnostic-disclaimer">{diagnosticReport.confidenceNote} 这是一份站内学习诊断，用于安排复习顺序，不等同于官方 JLPT 成绩、能力认证或合格预测。</p>
          </section>
        )}
        {plan && (
          <div className="plan-prescription">
            <div>
              <span>{plan.source === "ai" ? "AI 学习计划" : "规则学习计划 · 无需 AI"}</span>
              <h3>{plan.headline}</h3>
              <p>{plan.analysis}</p>
              <ul>{plan.weeklyPlan.map((item) => <li key={item}>{item}</li>)}</ul>
              <small>{plan.reviewRule}</small>
              {plan.interpretation && (
                <div className="ai-interpretation">
                  <section>
                    <span>优先行动</span>
                    {plan.interpretation.priorities.length ? plan.interpretation.priorities.map((item) => {
                      const target = getUnitCatalogEntry(item.unitId) ?? getProblemCatalogEntry(item.problemId);
                      return <article key={`${item.problemId}:${item.unitId ?? "problem"}`}><strong>{target?.title ?? "相关学习内容"}</strong><p>{item.reason}</p><em>{item.action}</em>{target && <Link href={target.href}>打开课程 →</Link>}</article>;
                    }) : <p>先完成更多题目，再生成细分优先级。</p>}
                  </section>
                  <section>
                    <span>证据边界</span>
                    {[...plan.interpretation.strengths, ...plan.interpretation.risks].slice(0, 4).map((item) => <article key={item.skillId}><strong>{item.skillId.split(":").slice(1).join(":")}</strong><p>{item.evidence}</p><em>{item.interpretation}</em></article>)}
                    {plan.interpretation.needsMoreEvidence.length > 0 && <p>另有 {plan.interpretation.needsMoreEvidence.length} 项能力样本不足，暂不判定强弱。</p>}
                  </section>
                </div>
              )}
            </div>
            <div className="plan-scores">
              {(Object.keys(plan.scores) as PracticeArea[]).map((item) => (
                <span key={item}>
                  <small>{practiceAreaNames[item]}</small>
                  <b>{plan.scores[item] === null ? "—" : `${plan.scores[item]}%`}</b>
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="result-actions">
          <button type="button" onClick={() => setShowAnswers((value) => !value)}>{showAnswers ? "收起解析" : "查看逐题解析"}</button>
          <button type="button" onClick={() => { setMode("home"); setShowAnswers(false); }}>返回练习台</button>
          <Link href="/n2/review">进入今日复习</Link>
          <ShareButton title="我的 JLPT N2 练习结果" text={`我刚完成了 ${session.length} 题 JLPT N2 练习，答对 ${correct} 题。`} />
        </div>
        {showAnswers && (
          <div className="answer-review">
            {session.map((item, index) => (
              <article key={item.id} className={answers[item.id] === item.answer ? "correct" : "wrong"}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{practiceAreaNames[item.area]} · {item.skill}</small>
                  <h3><JapaneseReading text={item.prompt} /></h3>
                  <p><b>{answers[item.id] === item.answer ? "答对" : "需要复习"}</b>　正确答案：<JapaneseReading text={item.choices[item.answer]} /></p>
                  <em><JapaneseReading text={item.explanation} /></em>
                  {answers[item.id] !== item.answer && (
                    <Link href={learningLink(item)}>回到相关学习内容 →</Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
        {syncMessage && <p className="practice-sync-message" role="status">{syncMessage}</p>}
      </section>
    );
  }

  const isDiagnostic = mode === "diagnostic";
  return (
    <section className="practice-studio practice-session">
      <header className="session-header">
        <button type="button" onClick={() => setMode("home")}>← 返回练习台</button>
        <div>
          <span>{isDiagnostic ? "STRATIFIED BASELINE" : `${area === "all" ? "MIXED" : practiceAreaNames[area]} PRACTICE`}</span>
          <strong>{answered} / {session.length} 已作答</strong>
        </div>
        <time aria-label={`已用时 ${formatTime(seconds)}`}>{formatTime(seconds)}</time>
      </header>
      <div className="session-progress" aria-label="练习完成进度"><i style={{ width: `${(answered / session.length) * 100}%` }} /></div>
      <div className="question-stack">
        {session.map((item, index) => (
          <article className="practice-question" key={item.id}>
            <div className="question-top">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><small>{practiceAreaNames[item.area]} · {item.title}</small><strong>{item.skill}</strong></div>
              {item.audioText && (() => { const asset = audioAssetForText(item.audioText!); return <JapaneseAudioPlayer compact src={asset?.src} duration={asset?.duration} label="播放题干" text={item.audioText!} />; })()}
            </div>
            {item.context && <p className="question-context"><JapaneseReading text={item.context} /></p>}
            <h3><JapaneseReading text={item.prompt} /></h3>
            <div className={`choice-list${item.choiceLayout === "inline" ? " choice-list-inline" : ""}`}>
              {item.choices.map((choice, choiceIndex) => (
                <label className={answers[item.id] === choiceIndex ? "selected" : ""} key={choice}>
                  <input type="radio" name={item.id} checked={answers[item.id] === choiceIndex} onChange={() => chooseAnswer(item.id, choiceIndex)} />
                  <span>{String.fromCharCode(65 + choiceIndex)}</span><JapaneseReading text={choice} />
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>
      <footer className="submit-bar">
        <span>{answered === session.length ? "所有题目已完成，可以交卷。" : `还有 ${session.length - answered} 题未作答。`}</span>
        <button type="button" disabled={answered !== session.length || saving} onClick={submit}>{saving ? "保存中…" : "交卷并生成反馈 →"}</button>
      </footer>
      {error && <p className="practice-error" role="alert">{error}</p>}
    </section>
  );
}

function prioritisedQuestions(area: PracticeArea | "all", attempts: Attempt[], focus: PracticeArea) {
  const pool = questionsFor(area);
  const missed = new Set(attempts.filter((item) => !item.correct).map((item) => item.questionId));
  return [
    ...pool.filter((item) => missed.has(item.id)),
    ...pool.filter((item) => !missed.has(item.id) && item.area === focus),
    ...pool.filter((item) => !missed.has(item.id) && item.area !== focus),
  ].slice(0, Math.min(8, pool.length));
}

function learningLink(question: PracticeQuestion) {
  if (question.area === "reading") return `/n2/reading/${question.problem}`;
  const unitSlug = question.relatedContentIds[1];
  if (question.area === "listening") return unitSlug ? `/n2/listening/${question.problem}/${unitSlug}` : `/n2/listening/${question.problem}`;
  return unitSlug ? `/n2/language/${question.problem}/${unitSlug}` : `/n2/language/${question.problem}`;
}
