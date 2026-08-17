"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { practiceAreaNames, type PracticeArea } from "@/app/data/practice";
import { problemIdForEvent, problemTargets, resolveEventCatalogEntry, unitCatalog } from "@/app/lib/learning-catalog";
import {
  getStudyStore,
  type CourseCompletionState,
  type ReviewState,
  type StudyDomain,
  type StudyEvent,
} from "@/app/lib/study-store";
import { syncStudyStore } from "@/app/lib/study-sync";

type RangeKey = "today" | "7d" | "30d";

const rangeLabels: Record<RangeKey, string> = {
  today: "Today",
  "7d": "7 Days",
  "30d": "30 Days",
};

const domainLabels: Record<StudyDomain, string> = {
  language: "Language",
  reading: "Reading",
  listening: "Listening",
};

const contentLabels: Record<string, string> = {
  vocabulary: "Vocabulary",
  listening: "Listening cards",
  concept: "Concepts",
  problem: "Problems",
  reading: "Reading",
};

function rangeStart(range: RangeKey) {
  const now = new Date();
  if (range === "today") now.setHours(0, 0, 0, 0);
  else now.setDate(now.getDate() - (range === "7d" ? 7 : 30));
  return now.toISOString();
}

function minutes(events: StudyEvent[]) {
  return Math.round(events.reduce((sum, event) => sum + (event.durationSeconds ?? 0), 0) / 60);
}

function eventTitle(event: StudyEvent) {
  const catalog = resolveEventCatalogEntry(event);
  const title = catalog?.title ?? event.skill ?? (event.domain === "language" ? "语言知识练习" : event.domain === "reading" ? "阅读练习" : "听力练习");
  if (event.type === "lesson_completed") return `${title} · 课程完成`;
  if (event.type === "lesson_started") return `${title} · 开始学习`;
  if (event.type === "concept_review") return `${title} · 掌握判断`;
  if (event.type === "vocab_review") return `${event.contentId.replace(/^n\d-(legacy-)?/u, "")} · 词汇回忆`;
  if (event.type === "listening_drill") return `${title} · 即时应答`;
  if (event.type === "diagnostic_answer") return `${title} · 基线诊断`;
  if (event.type === "study_activity") return `${title} · 有效学习`;
  return `${title} · 练习作答`;
}

export function StudyDashboard({
  signedIn,
  signInPath,
}: {
  signedIn: boolean;
  signInPath: string;
}) {
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [reviewStates, setReviewStates] = useState<ReviewState[]>([]);
  const [completions, setCompletions] = useState<CourseCompletionState[]>([]);
  const [range, setRange] = useState<RangeKey>("today");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const store = getStudyStore();
    const [storedEvents, states, courseStates] = await Promise.all([
      store.getEvents(),
      store.getReviewStates(),
      store.getCourseCompletions(),
    ]);
    setEvents(storedEvents);
    setReviewStates(states);
    setCompletions(courseStates);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      load().catch(() => {
        if (active) {
          setMessage("无法读取此设备上的学习记录。");
          setLoading(false);
        }
      });
      if (signedIn) {
        syncStudyStore()
          .then(({ pushed, pulled }) => {
            if (!active) return;
            setMessage(`已合并云端记录：上传 ${pushed} 条，读取 ${pulled} 条。`);
            return load();
          })
          .catch((reason: Error) => {
            if (active) setMessage(reason.message);
          });
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [load, signedIn]);

  const visibleEvents = useMemo(
    () => events.filter((event) => event.createdAt >= rangeStart(range)),
    [events, range],
  );
  const todayEvents = useMemo(
    () => events.filter((event) => event.createdAt >= rangeStart("today")),
    [events],
  );
  const dueStates = useMemo(
    () => reviewStates.filter((state) => state.nextReviewAt <= new Date().toISOString()),
    [reviewStates],
  );
  const answerEvents = visibleEvents.filter(
    (event) =>
      (event.type === "practice_answer" || event.type === "diagnostic_answer") &&
      typeof event.correct === "boolean",
  );
  const reviewedEvents = visibleEvents.filter((event) => event.rating).length;
  const accuracy = answerEvents.length
    ? Math.round(answerEvents.filter((event) => event.correct).length / answerEvents.length * 100)
    : null;

  const byDomain = (Object.keys(domainLabels) as StudyDomain[]).map((domain) => ({
    domain,
    minutes: minutes(todayEvents.filter((event) => event.domain === domain)),
    items: todayEvents.filter((event) => event.domain === domain && event.type !== "study_activity").length,
  }));
  const dueByType = Object.entries(
    dueStates.reduce<Record<string, number>>((result, state) => {
      result[state.contentType] = (result[state.contentType] ?? 0) + 1;
      return result;
    }, {}),
  ).sort((left, right) => right[1] - left[1]);
  const mastery = reviewStates.reduce<Record<string, number>>((result, state) => {
    result[state.mastery] = (result[state.mastery] ?? 0) + 1;
    return result;
  }, {});
  const coverage = (Object.keys(practiceAreaNames) as PracticeArea[]).map((domain) => ({
    domain,
    studied: new Set(
      events
        .filter((event) => event.domain === domain && event.contentType !== "vocabulary")
        .map(problemIdForEvent)
        .filter((value): value is string => Boolean(value)),
    ).size,
    target: problemTargets[domain],
  }));
  const completedLessons = completions.filter((state) => state.status === "completed").length;
  const inProgressLessons = completions.filter((state) => state.status === "in_progress").length;
  const notStartedLessons = Math.max(0, unitCatalog.length + 5 - completedLessons - inProgressLessons);
  const visibleActions = todayEvents.filter((event) => event.type !== "study_activity");

  return (
    <section className="dashboard-shell">
      <header className="dashboard-heading dashboard-heading-local">
        <div>
          <span>MY STUDY DESK · LOCAL FIRST</span>
          <h1>{events.length ? "今天从上次停下的地方继续。" : "今天先完成一个小循环。"}</h1>
          <p>
            {signedIn
              ? "本机记录与云端按事件合并；重复事件不会重复计算。"
              : "不登录也能完整学习。当前记录只保存在此设备，登录后可以跨设备同步。"}
          </p>
        </div>
        <div className="dashboard-actions">
          <Link className="primary-link" href={dueStates.length ? "/n2/review" : "/n2/listening/problem-4"}>
            {dueStates.length ? "Start Today Review" : "学习問題4"} →
          </Link>
          {!signedIn && <a href={signInPath}>登录并同步</a>}
        </div>
      </header>

      <section className="today-panel" aria-labelledby="today-title">
        <div className="today-total">
          <span id="today-title">TODAY</span>
          <strong>{minutes(todayEvents)}<small> min</small></strong>
          <p>{visibleActions.length} 个学习动作 · 已排除后台与闲置时间</p>
        </div>
        <div className="today-domains">
          {byDomain.map((item) => (
            <article key={item.domain}>
              <span>{domainLabels[item.domain]}</span>
              <strong>{item.minutes}<small> min</small></strong>
              <em>{item.items} items</em>
            </article>
          ))}
        </div>
      </section>

      <div className="dashboard-time-tabs" aria-label="统计时间范围">
        {(Object.keys(rangeLabels) as RangeKey[]).map((item) => (
          <button
            aria-pressed={range === item}
            className={range === item ? "active" : ""}
            key={item}
            onClick={() => setRange(item)}
            type="button"
          >
            {rangeLabels[item]}
          </button>
        ))}
      </div>

      <div className="dashboard-stat-grid dashboard-stat-grid-four">
        <article><span>Learning minutes</span><strong>{minutes(visibleEvents)}</strong><small>真实计时事件</small></article>
        <article><span>Items reviewed</span><strong>{reviewedEvents}</strong><small>主动回忆与判断</small></article>
        <article><span>Questions answered</span><strong>{answerEvents.length}</strong><small>练习与诊断</small></article>
        <article><span>Accuracy</span><strong>{accuracy === null ? "—" : `${accuracy}%`}</strong><small>仅基于已作答题目</small></article>
      </div>

      <div className="dashboard-two-column">
        <section className="dashboard-completed">
          <div className="section-heading">
            <div><span>TODAY COMPLETED</span><h2>今天完成</h2></div>
          </div>
          {todayEvents.length ? (
            <ol>
              {todayEvents.slice(0, 8).map((event) => (
                <li key={event.clientEventId}>
                  <span>{event.domain.slice(0, 1).toUpperCase()}</span>
                  <div><strong>{eventTitle(event)}</strong><small>{new Date(event.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}</small></div>
                  {event.rating && <em>{event.rating === "good" ? "会了" : event.rating === "hard" ? "模糊" : "不会"}</em>}
                  {typeof event.correct === "boolean" && <em>{event.correct ? "答对" : "错题"}</em>}
                </li>
              ))}
            </ol>
          ) : (
            <div className="dashboard-empty"><strong>今天还没有学习事件</strong><p>完成一个单元、回忆一个词或提交一道题后，这里才会变化。</p></div>
          )}
        </section>

        <section className="dashboard-due">
          <div className="section-heading">
            <div><span>DUE REVIEW</span><h2>待复习</h2></div>
            <strong>{dueStates.length}</strong>
          </div>
          {dueByType.length ? (
            <ul>
              {dueByType.map(([type, count]) => <li key={type}><span>{contentLabels[type] ?? type}</span><strong>{count}</strong></li>)}
            </ul>
          ) : (
            <div className="dashboard-empty"><strong>当前没有到期项目</strong><p>仍可以进入 Review Center 做自由复习。</p></div>
          )}
          <Link href="/n2/review">打开 Review Center →</Link>
        </section>
      </div>

      <div className="dashboard-two-column coverage-mastery">
        <section>
          <div className="section-heading"><div><span>COVERAGE</span><h2>学过多少范围</h2></div></div>
          {coverage.map((item) => (
            <article key={item.domain}>
              <div><span>{practiceAreaNames[item.domain]}</span><strong>{Math.min(item.studied, item.target)} / {item.target}</strong></div>
              <div className="area-meter"><i style={{ width: `${Math.min(100, item.studied / item.target * 100)}%` }} /></div>
            </article>
          ))}
          <small>Coverage 只表示产生过有效学习或作答事件，不代表掌握。</small>
        </section>
        <section>
          <div className="section-heading"><div><span>MASTERY</span><h2>当前掌握状态</h2></div></div>
          <div className="mastery-grid">
            <article><span>Mastered</span><strong>{mastery.mastered ?? 0}</strong></article>
            <article><span>Review</span><strong>{mastery.review ?? 0}</strong></article>
            <article><span>Learning</span><strong>{mastery.learning ?? 0}</strong></article>
            <article><span>Not Started</span><strong>—</strong></article>
          </div>
          <small>Mastery 来自明确的“不会 / 模糊 / 会了”判断，不使用页面浏览量推断。</small>
        </section>
      </div>

      <div className="dashboard-two-column coverage-mastery">
        <section>
          <div className="section-heading"><div><span>COURSE COMPLETION</span><h2>课程完成度</h2></div></div>
          <div className="mastery-grid">
            <article><span>Completed</span><strong>{completedLessons}</strong></article>
            <article><span>In Progress</span><strong>{inProgressLessons}</strong></article>
            <article><span>Not Started</span><strong>{notStartedLessons}</strong></article>
          </div>
          <small>只有点击“完成这节课”才会计入 Completed；它与掌握度、正确率分别计算。</small>
        </section>
        <section>
          <div className="section-heading"><div><span>METRIC GUIDE</span><h2>四个数字分别说明什么</h2></div></div>
          <ul className="dashboard-metric-guide"><li><strong>Coverage</strong><span>接触过多少题型</span></li><li><strong>Completion</strong><span>主动完成多少课程</span></li><li><strong>Mastery</strong><span>回忆判断进入哪个阶段</span></li><li><strong>Accuracy</strong><span>已作答题目的正确率</span></li></ul>
        </section>
      </div>

      {loading && <p className="practice-sync-message">正在读取此设备上的学习记录…</p>}
      {message && <p className="practice-sync-message" role="status">{message}</p>}
    </section>
  );
}
