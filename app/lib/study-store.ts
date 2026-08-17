import type { PracticeArea } from "@/app/data/practice";
import type { VocabularyLevel } from "@/app/lib/vocabulary-types";

export type StudyRating = "again" | "hard" | "good";
export type MasteryState = "new" | "learning" | "review" | "mastered";
export type CourseCompletionStatus = "not_started" | "in_progress" | "completed";
export type StudyEventType =
  | "lesson_started"
  | "lesson_completed"
  | "concept_review"
  | "vocab_review"
  | "listening_drill"
  | "practice_answer"
  | "diagnostic_answer"
  | "study_activity";
export type StudyContentType =
  | "problem"
  | "concept"
  | "vocabulary"
  | "reading"
  | "listening";
export type StudyDomain = "language" | "reading" | "listening";

export type StudyEvent = {
  id: string;
  clientEventId: string;
  userId?: string;
  deviceId: string;
  type: StudyEventType;
  contentType: StudyContentType;
  contentId: string;
  problemId?: string;
  unitId?: string;
  domain: StudyDomain;
  skill?: string;
  rating?: StudyRating;
  correct?: boolean;
  durationSeconds?: number;
  createdAt: string;
  syncedAt?: string | null;
};

export type StudyEventFilter = {
  since?: string;
  until?: string;
  type?: StudyEventType | StudyEventType[];
  contentType?: StudyContentType;
  domain?: StudyDomain;
  contentId?: string;
  problemId?: string;
  unitId?: string;
  unsyncedOnly?: boolean;
};

export type ReviewState = {
  contentId: string;
  problemId?: string;
  unitId?: string;
  contentType: StudyContentType;
  level?: VocabularyLevel;
  domain: StudyDomain;
  skill?: string;
  rating: StudyRating;
  mastery: MasteryState;
  reviewCount: number;
  lastReviewedAt: string;
  nextReviewAt: string;
};

export type CourseCompletionState = {
  contentId: string;
  problemId: string;
  unitId?: string;
  domain: StudyDomain;
  status: CourseCompletionStatus;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
};

export type ReviewStateFilter = {
  level?: VocabularyLevel;
  contentType?: StudyContentType;
  domain?: StudyDomain;
  mastery?: MasteryState;
  dueBefore?: string;
};

export type LocalPracticeSession = {
  id: string;
  mode: "diagnostic" | "practice";
  area: PracticeArea | "all";
  questionIds: string[];
  seed?: string;
  activeSeconds?: number;
  answers: Record<string, number>;
  startedAt: string;
  completedAt?: string | null;
};

export type LocalStudyProfile = {
  key: "profile";
  targetExamDate: string;
  dailyMinutes: number;
  updatedAt: string;
};

export interface StudyStore {
  addEvent(event: StudyEvent): Promise<void>;
  addEvents(events: StudyEvent[]): Promise<void>;
  getEvents(filter?: StudyEventFilter): Promise<StudyEvent[]>;
  saveReviewState(state: ReviewState): Promise<void>;
  getReviewState(contentId: string): Promise<ReviewState | undefined>;
  getReviewStates(filter?: ReviewStateFilter | VocabularyLevel): Promise<ReviewState[]>;
  getCourseCompletions(): Promise<CourseCompletionState[]>;
  saveSession(session: LocalPracticeSession): Promise<void>;
  getSession(id: string): Promise<LocalPracticeSession | undefined>;
  getActiveSession(): Promise<LocalPracticeSession | null>;
  saveProfile(profile: Omit<LocalStudyProfile, "key" | "updatedAt">): Promise<LocalStudyProfile>;
  getProfile(): Promise<LocalStudyProfile | null>;
  getDeviceId(): Promise<string>;
  getSyncCursor(): Promise<string | null>;
  setSyncCursor(cursor: string): Promise<void>;
  markEventsSynced(clientEventIds: string[], syncedAt?: string): Promise<void>;
  clearLocalData(): Promise<void>;
}

const databaseName = "jlpt-study-garden";
const databaseVersion = 3;
const eventStoreName = "study_events";
const reviewStoreName = "review_states";
const metadataStoreName = "metadata";
const sessionStoreName = "practice_sessions";
const profileStoreName = "study_profile";

function requestResult<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("本地学习记录写入失败。"));
  });
}

function transactionDone(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("本地学习记录写入失败。"));
    transaction.onabort = () => reject(transaction.error ?? new Error("本地学习记录写入已取消。"));
  });
}

function ensureIndex(store: IDBObjectStore, name: string, keyPath: string) {
  if (!store.indexNames.contains(name)) store.createIndex(name, keyPath);
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);
    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;
      const events = database.objectStoreNames.contains(eventStoreName)
        ? transaction?.objectStore(eventStoreName)
        : database.createObjectStore(eventStoreName, { keyPath: "clientEventId" });
      if (events) {
        ensureIndex(events, "createdAt", "createdAt");
        ensureIndex(events, "contentId", "contentId");
        ensureIndex(events, "domain", "domain");
        ensureIndex(events, "problemId", "problemId");
        ensureIndex(events, "unitId", "unitId");
      }

      const reviews = database.objectStoreNames.contains(reviewStoreName)
        ? transaction?.objectStore(reviewStoreName)
        : database.createObjectStore(reviewStoreName, { keyPath: "contentId" });
      if (reviews) {
        ensureIndex(reviews, "level", "level");
        ensureIndex(reviews, "nextReviewAt", "nextReviewAt");
        ensureIndex(reviews, "contentType", "contentType");
        ensureIndex(reviews, "mastery", "mastery");
      }

      if (!database.objectStoreNames.contains(metadataStoreName)) {
        database.createObjectStore(metadataStoreName, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(sessionStoreName)) {
        const sessions = database.createObjectStore(sessionStoreName, { keyPath: "id" });
        sessions.createIndex("startedAt", "startedAt");
      }
      if (!database.objectStoreNames.contains(profileStoreName)) {
        database.createObjectStore(profileStoreName, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("无法打开本地学习记录。"));
  });
}

export function createStudyId(prefix: string) {
  const randomId = globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${randomId}`;
}

function matchesEvent(event: StudyEvent, filter?: StudyEventFilter) {
  if (!filter) return true;
  if (filter.since && event.createdAt < filter.since) return false;
  if (filter.until && event.createdAt > filter.until) return false;
  const types = Array.isArray(filter.type) ? filter.type : filter.type ? [filter.type] : [];
  if (types.length && !types.includes(event.type)) return false;
  if (filter.contentType && event.contentType !== filter.contentType) return false;
  if (filter.domain && event.domain !== filter.domain) return false;
  if (filter.contentId && event.contentId !== filter.contentId) return false;
  if (filter.problemId && event.problemId !== filter.problemId) return false;
  if (filter.unitId && event.unitId !== filter.unitId) return false;
  if (filter.unsyncedOnly && event.syncedAt) return false;
  return true;
}

class IndexedDbStudyStore implements StudyStore {
  async addEvent(event: StudyEvent) {
    await this.addEvents([event]);
  }

  async addEvents(events: StudyEvent[]) {
    if (!events.length) return;
    const database = await openDatabase();
    const transaction = database.transaction(eventStoreName, "readwrite");
    const completed = transactionDone(transaction);
    const store = transaction.objectStore(eventStoreName);
    for (const event of events) store.put(event);
    await completed;
    database.close();
  }

  async getEvents(filter?: StudyEventFilter) {
    const database = await openDatabase();
    const transaction = database.transaction(eventStoreName, "readonly");
    const completed = transactionDone(transaction);
    const events = await requestResult<StudyEvent[]>(transaction.objectStore(eventStoreName).getAll());
    await completed;
    database.close();
    return events
      .map(enrichStudyEventHierarchy)
      .filter((event) => matchesEvent(event, filter))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async saveReviewState(state: ReviewState) {
    const database = await openDatabase();
    const transaction = database.transaction(reviewStoreName, "readwrite");
    const completed = transactionDone(transaction);
    transaction.objectStore(reviewStoreName).put(state);
    await completed;
    database.close();
  }

  async getReviewState(contentId: string) {
    const database = await openDatabase();
    const transaction = database.transaction(reviewStoreName, "readonly");
    const completed = transactionDone(transaction);
    const state = await requestResult<ReviewState | undefined>(transaction.objectStore(reviewStoreName).get(contentId));
    await completed;
    database.close();
    return state ? enrichReviewStateHierarchy(state) : undefined;
  }

  async getReviewStates(filter?: ReviewStateFilter | VocabularyLevel) {
    const normalizedFilter = typeof filter === "string" ? { level: filter } : filter;
    const database = await openDatabase();
    const transaction = database.transaction(reviewStoreName, "readonly");
    const completed = transactionDone(transaction);
    const states = await requestResult<ReviewState[]>(transaction.objectStore(reviewStoreName).getAll());
    await completed;
    database.close();
    return states.map(enrichReviewStateHierarchy).filter((state) => {
      if (!normalizedFilter) return true;
      if (normalizedFilter.level && state.level !== normalizedFilter.level) return false;
      if (normalizedFilter.contentType && state.contentType !== normalizedFilter.contentType) return false;
      if (normalizedFilter.domain && state.domain !== normalizedFilter.domain) return false;
      if (normalizedFilter.mastery && state.mastery !== normalizedFilter.mastery) return false;
      if (normalizedFilter.dueBefore && state.nextReviewAt > normalizedFilter.dueBefore) return false;
      return true;
    });
  }

  async getCourseCompletions() {
    return courseCompletionsFromEvents(await this.getEvents());
  }

  async saveSession(session: LocalPracticeSession) {
    const database = await openDatabase();
    const transaction = database.transaction(sessionStoreName, "readwrite");
    const completed = transactionDone(transaction);
    transaction.objectStore(sessionStoreName).put(session);
    await completed;
    database.close();
  }

  async getSession(id: string) {
    const database = await openDatabase();
    const transaction = database.transaction(sessionStoreName, "readonly");
    const completed = transactionDone(transaction);
    const session = await requestResult<LocalPracticeSession | undefined>(transaction.objectStore(sessionStoreName).get(id));
    await completed;
    database.close();
    return session;
  }

  async getActiveSession() {
    const database = await openDatabase();
    const transaction = database.transaction(sessionStoreName, "readonly");
    const completed = transactionDone(transaction);
    const sessions = await requestResult<LocalPracticeSession[]>(transaction.objectStore(sessionStoreName).getAll());
    await completed;
    database.close();
    return sessions
      .filter((session) => !session.completedAt)
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0] ?? null;
  }

  async saveProfile(profile: Omit<LocalStudyProfile, "key" | "updatedAt">) {
    const value: LocalStudyProfile = { ...profile, key: "profile", updatedAt: new Date().toISOString() };
    const database = await openDatabase();
    const transaction = database.transaction(profileStoreName, "readwrite");
    const completed = transactionDone(transaction);
    transaction.objectStore(profileStoreName).put(value);
    await completed;
    database.close();
    return value;
  }

  async getProfile() {
    const database = await openDatabase();
    const transaction = database.transaction(profileStoreName, "readonly");
    const completed = transactionDone(transaction);
    const profile = await requestResult<LocalStudyProfile | undefined>(transaction.objectStore(profileStoreName).get("profile"));
    await completed;
    database.close();
    return profile ?? null;
  }

  async getMetadataValue(key: string) {
    const database = await openDatabase();
    const transaction = database.transaction(metadataStoreName, "readonly");
    const completed = transactionDone(transaction);
    const existing = await requestResult<{ key: string; value: string } | undefined>(transaction.objectStore(metadataStoreName).get(key));
    await completed;
    database.close();
    return existing?.value ?? null;
  }

  async setMetadataValue(key: string, value: string) {
    const database = await openDatabase();
    const transaction = database.transaction(metadataStoreName, "readwrite");
    const completed = transactionDone(transaction);
    transaction.objectStore(metadataStoreName).put({ key, value });
    await completed;
    database.close();
  }

  async getDeviceId() {
    const existing = await this.getMetadataValue("deviceId");
    if (existing) return existing;
    const deviceId = createStudyId("device");
    await this.setMetadataValue("deviceId", deviceId);
    return deviceId;
  }

  async getSyncCursor() {
    return this.getMetadataValue("syncCursor");
  }

  async setSyncCursor(cursor: string) {
    await this.setMetadataValue("syncCursor", cursor);
  }

  async markEventsSynced(clientEventIds: string[], syncedAt = new Date().toISOString()) {
    if (!clientEventIds.length) return;
    const identifiers = new Set(clientEventIds);
    const events = await this.getEvents();
    await this.addEvents(events.filter((event) => identifiers.has(event.clientEventId)).map((event) => ({ ...event, syncedAt })));
  }

  async clearLocalData() {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(databaseName);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("无法清除本地学习记录。"));
      request.onblocked = () => reject(new Error("请关闭其他打开的本站页面后再清除。"));
    });
  }
}

let studyStore: StudyStore | null = null;

export function getStudyStore(): StudyStore {
  if (typeof indexedDB === "undefined") {
    throw new Error("当前浏览器不支持本地学习记录。请更新浏览器后再试。");
  }
  studyStore ??= new IndexedDbStudyStore();
  return studyStore;
}

export async function clearLocalStudyData() {
  const store = getStudyStore();
  await store.clearLocalData();
  studyStore = null;
}

export async function makeStudyEvent(
  input: Omit<StudyEvent, "id" | "clientEventId" | "deviceId" | "createdAt"> & { createdAt?: string },
) {
  const store = getStudyStore();
  const clientEventId = createStudyId("event");
  return enrichStudyEventHierarchy({
    ...input,
    id: clientEventId,
    clientEventId,
    deviceId: await store.getDeviceId(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    syncedAt: null,
  } satisfies StudyEvent);
}

export async function recordStudyEvent(input: Parameters<typeof makeStudyEvent>[0]) {
  const event = await makeStudyEvent(input);
  await getStudyStore().addEvent(event);
  return event;
}

export function makeReviewState(
  input: Pick<ReviewState, "contentId" | "contentType" | "domain"> & Partial<Pick<ReviewState, "level" | "skill" | "problemId" | "unitId">>,
  rating: StudyRating,
  previous?: ReviewState,
  reviewedAt = new Date(),
): ReviewState {
  const reviewCount = (previous?.reviewCount ?? 0) + 1;
  const intervalMinutes = rating === "again" ? 10 : rating === "hard" ? 24 * 60 : [3, 7, 14, 30][Math.min(reviewCount - 1, 3)] * 24 * 60;
  const mastery: MasteryState = rating === "again" ? "learning" : rating === "hard" ? "review" : reviewCount >= 3 ? "mastered" : "review";
  const nextReviewAt = new Date(reviewedAt.getTime() + intervalMinutes * 60 * 1000);
  return {
    ...input,
    rating,
    mastery,
    reviewCount,
    lastReviewedAt: reviewedAt.toISOString(),
    nextReviewAt: nextReviewAt.toISOString(),
  };
}

export function makeVocabularyReviewState(
  contentId: string,
  level: VocabularyLevel,
  rating: StudyRating,
  previous?: ReviewState,
  reviewedAt = new Date(),
): ReviewState {
  return makeReviewState(
    { contentId, contentType: "vocabulary", domain: "language", level, skill: `vocabulary:${level}` },
    rating,
    previous,
    reviewedAt,
  );
}

export async function recordReview(
  eventType: Extract<StudyEventType, "concept_review" | "vocab_review" | "listening_drill">,
  input: Pick<ReviewState, "contentId" | "contentType" | "domain"> & Partial<Pick<ReviewState, "level" | "skill" | "problemId" | "unitId">>,
  rating: StudyRating,
  previous?: ReviewState,
) {
  const store = getStudyStore();
  const reviewedAt = new Date();
  const state = makeReviewState(input, rating, previous, reviewedAt);
  const event = await makeStudyEvent({
    type: eventType,
    contentType: input.contentType,
    contentId: input.contentId,
    domain: input.domain,
    skill: input.skill,
    problemId: input.problemId,
    unitId: input.unitId,
    rating,
    createdAt: reviewedAt.toISOString(),
  });
  await Promise.all([store.saveReviewState(state), store.addEvent(event)]);
  return state;
}

export async function recordVocabularyReview(
  contentId: string,
  level: VocabularyLevel,
  rating: StudyRating,
  previous?: ReviewState,
  word?: string,
) {
  return recordReview(
    "vocab_review",
    { contentId, contentType: "vocabulary", domain: "language", level, skill: `vocabulary:${level}${word ? `:${word}` : ""}` },
    rating,
    previous,
  );
}

export async function rebuildReviewStatesFromEvents(events?: StudyEvent[]) {
  const store = getStudyStore();
  const ratedEvents = (events ?? await store.getEvents())
    .filter((event): event is StudyEvent & { rating: StudyRating } => Boolean(event.rating))
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  const rebuilt = new Map<string, ReviewState>();
  for (const event of ratedEvents) {
    const levelMatch = event.skill?.match(/^vocabulary:(N[1-5])(?::.+)?$/u);
    const input = {
      contentId: event.contentId,
      contentType: event.contentType,
      domain: event.domain,
      skill: event.skill,
      level: levelMatch?.[1] as VocabularyLevel | undefined,
      problemId: event.problemId,
      unitId: event.unitId,
    };
    rebuilt.set(
      event.contentId,
      makeReviewState(input, event.rating, rebuilt.get(event.contentId), new Date(event.createdAt)),
    );
  }
  await Promise.all([...rebuilt.values()].map((state) => store.saveReviewState(state)));
  return [...rebuilt.values()];
}

function inferredHierarchy(contentId: string, domain: StudyDomain) {
  const diagnostic = contentId.match(/^diagnostic-(?:language|reading|listening)-(q\d+|problem-\d+)-/u);
  if (diagnostic) return { problemId: diagnostic[1] };
  const reading = contentId.match(/^reading-(q1[0-4])$/u);
  if (reading) return { problemId: reading[1], unitId: contentId };
  const languageUnit = contentId.match(/^(q[1-9])-/u);
  if (domain === "language" && languageUnit) return { problemId: languageUnit[1], unitId: contentId };
  const listeningUnit = contentId.match(/^p([1-5])-/u);
  if (domain === "listening" && listeningUnit) return { problemId: `problem-${listeningUnit[1]}`, unitId: contentId };
  if (/^q(?:[1-9]|1[0-4])$/u.test(contentId)) return { problemId: contentId };
  if (/^problem-[1-5]$/u.test(contentId)) return { problemId: contentId };
  return {};
}

export function enrichStudyEventHierarchy(event: StudyEvent): StudyEvent {
  const inferred = inferredHierarchy(event.contentId, event.domain);
  return {
    ...event,
    problemId: event.problemId ?? inferred.problemId,
    unitId: event.unitId ?? inferred.unitId,
  };
}

function enrichReviewStateHierarchy(state: ReviewState): ReviewState {
  const inferred = inferredHierarchy(state.contentId, state.domain);
  return {
    ...state,
    problemId: state.problemId ?? inferred.problemId,
    unitId: state.unitId ?? inferred.unitId,
  };
}

export function courseCompletionsFromEvents(events: StudyEvent[]) {
  const states = new Map<string, CourseCompletionState>();
  for (const rawEvent of [...events].sort((left, right) => left.createdAt.localeCompare(right.createdAt))) {
    if (rawEvent.type !== "lesson_started" && rawEvent.type !== "lesson_completed") continue;
    const event = enrichStudyEventHierarchy(rawEvent);
    const problemId = event.problemId;
    if (!problemId) continue;
    const contentId = event.unitId ?? event.contentId;
    const previous = states.get(contentId);
    const completed = previous?.status === "completed" || event.type === "lesson_completed";
    states.set(contentId, {
      contentId,
      problemId,
      unitId: event.unitId,
      domain: event.domain,
      status: completed ? "completed" : "in_progress",
      startedAt: previous?.startedAt ?? event.createdAt,
      completedAt: completed ? previous?.completedAt ?? event.createdAt : undefined,
      updatedAt: event.createdAt,
    });
  }
  return [...states.values()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}
