"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 파일별 구역 기억 키 — 같은 영상으로 조건을 바꿔 비교할 때 사각형 재사용
const regionKey = (f: File) => `showcase.region:${f.name}:${f.size}`;
import AppHeader from "../_components/AppHeader";
import { useEventStream } from "../_components/useEventStream";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://ai.kamoru.jk:8000";

// 서버 config(showcase.max_clip_seconds)와 맞춘 안내용 상수 — 초과 시 서버가 거부
const MAX_CLIP_SECONDS = 10;

const STRENGTHS = [
  { key: "dejitter", label: "흔들림만", desc: "이동·추종은 보존하고 떨림만 제거 (트래블 샷)" },
  { key: "smooth", label: "부분 고정", desc: "떨림 + 느린 움직임 일부 정리 (기본)" },
  { key: "lock", label: "완전 고정", desc: "느린 드리프트까지 평탄화 (정지형 구간)" },
] as const;

const UPSCALES = [
  { key: "none", label: "원본 크기" },
  { key: "2x", label: "2배" },
  { key: "4k", label: "4K" },
] as const;

const SPEEDS = [
  { key: 1, label: "1× 그대로" },
  { key: 0.5, label: "½× 슬로모션" },
  { key: 0.25, label: "¼× 초슬로모션" },
] as const;

const UPSCALE_LABEL: Record<string, string> = { none: "원본 크기", "2x": "2배", "4k": "4K" };
const SPEED_LABEL: Record<string, string> = { "1": "1×", "0.5": "½×", "0.25": "¼×" };
const STRENGTH_LABEL: Record<string, string> = {
  dejitter: "흔들림만",
  smooth: "부분 고정",
  lock: "완전 고정",
};
const STATUS_LABEL: Record<string, string> = {
  queued: "대기 중",
  running: "처리 중",
  done: "완료",
  failed: "실패",
  canceled: "취소됨",
};
// 체인 단계(원형 불빛) — sub(서브 잡)의 세부 단계는 진행중 항목 옆에 덧붙인다
const FLOW = [
  { key: "trim", label: "구간 추출" },
  { key: "stabilize", label: "안정화 (피사체 고정·크롭)" },
  { key: "enhance", label: "화질 개선 (업스케일·슬로모션)" },
] as const;
const SUB_STAGE_LABEL: Record<string, string> = {
  decode: "디코딩",
  detect: "분석",
  track: "추적",
  transform: "보정",
  warp: "합성",
  encode: "인코딩",
  probe: "분석",
  extract: "프레임 추출",
  upscale: "업스케일",
  interpolate: "프레임 보간",
};

type Region = { x: number; y: number; w: number; h: number };
type Params = {
  start: number;
  end: number;
  strength: string;
  edge: string;
  upscale: string;
  speed: number;
  interpolate: string;
  model: string;
  fps?: number;
  subject?: { t: number; x: number; y: number };
  region?: Region;
};
type Sub = {
  kind: string;
  job_id: string;
  stage?: string | null;
  progress?: number;
  plan?: { total_seconds?: number } | null;
};
type JobOutput = {
  variant: string;
  file: string;
  metrics?: { out_w?: number; out_h?: number; out_fps?: number; duration?: number };
};
type JobStatus = {
  job_id: string;
  status: "queued" | "running" | "done" | "failed" | "canceled";
  params: Params;
  stage?: string | null;
  progress?: number;
  sub?: Sub | null;
  input?: { width: number; height: number; fps: number; duration: number } | null;
  outputs?: JobOutput[];
  error?: string | null;
  note?: string | null;
  created_at?: number;
};

const TERMINAL = new Set(["done", "failed", "canceled"]);

// SSE(/jobs/{id}/events) 이벤트 — 변화 시만 push, 종료 상태 후 서버가 스트림을 닫는다
type JobEvent = { type: "status"; job: JobStatus } | { type: "gone" };

function relTime(ts?: number): string {
  if (!ts) return "";
  const s = Date.now() / 1000 - ts;
  if (s < 60) return "방금";
  if (s < 3600) return `${Math.floor(s / 60)}분 전`;
  if (s < 86400) return `${Math.floor(s / 3600)}시간 전`;
  return `${Math.floor(s / 86400)}일 전`;
}

function fmtDur(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return "0초";
  if (sec < 90) return `${Math.max(1, Math.round(sec))}초`;
  const m = Math.floor(sec / 60);
  if (m < 90) return `${m}분${Math.round(sec % 60) ? ` ${Math.round(sec % 60)}초` : ""}`;
  return `${Math.floor(m / 60)}시간 ${m % 60}분`;
}

// 구간 길이 → 대략 예상 소요(60fps 촬영 가정, 업스케일 프레임당 ~4.5초 실측 지배)
function estimateSeconds(clipSec: number, upscale: string, speed: number, interp: string): number {
  const f = clipSec * 60;
  const fout = interp === "smooth" ? f / speed : f;
  let t = 60 + f * 0.1 + fout * 0.08; // 트림+안정화(추적·합성) 근사 + 인코딩
  if (upscale !== "none") t += f * 4.5;
  if (interp === "smooth" && fout > f) t += fout * 0.3;
  return Math.round(t);
}

// 실패 응답에서 사용자용 메시지만 추출 — FastAPI 는 {"detail": "..."} JSON 으로 온다
async function readErr(r: Response): Promise<string> {
  const t = await r.text();
  try {
    const j = JSON.parse(t) as { detail?: unknown };
    if (j?.detail) return String(j.detail);
  } catch {
    /* JSON 아니면 원문 그대로 */
  }
  return t;
}

function paramSummary(p?: Params): string {
  if (!p) return "";
  const parts = [
    `${p.start.toFixed(1)}~${p.end.toFixed(1)}s`,
    STRENGTH_LABEL[p.strength] ?? p.strength,
    UPSCALE_LABEL[p.upscale] ?? p.upscale,
    SPEED_LABEL[String(p.speed)] ?? `${p.speed}×`,
  ];
  if (p.fps === 60) parts.push("60fps");
  parts.push(p.interpolate === "off" ? "보간없음" : "AI보간");
  if (p.region) parts.push("구역");
  return parts.join(" · ");
}

// 체인 단계별 원형 불빛 — 대기(회색)·진행중(주황 점멸)·완료(초록)·실패(빨강)
function StageLights({ status }: { status: JobStatus }) {
  const cur = status.stage ?? "";
  const curIdx = FLOW.findIndex((d) => d.key === cur);
  const isDone = status.status === "done";
  const isFailed = status.status === "failed";
  const subLabel =
    status.sub?.stage != null ? (SUB_STAGE_LABEL[status.sub.stage] ?? status.sub.stage) : null;
  return (
    <ul className="space-y-2">
      {FLOW.map((d, i) => {
        let dot = "bg-muted";
        let txt = "text-muted-foreground";
        let pulse = false;
        if (isDone || (curIdx >= 0 && i < curIdx)) {
          dot = "bg-success";
          txt = "";
        } else if (curIdx === i) {
          if (isFailed) {
            dot = "bg-destructive";
            txt = "text-destructive";
          } else {
            dot = "bg-amber-500";
            txt = "text-foreground";
            pulse = true;
          }
        }
        return (
          <li key={d.key} className="flex items-center gap-2 text-xs">
            <span
              className={`h-3 w-3 shrink-0 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`}
            />
            <span className={txt}>
              {d.label}
              {curIdx === i && subLabel ? ` — ${subLabel}` : ""}
            </span>
            {curIdx === i && !isFailed && (
              <span className="ml-auto tabular-nums text-muted-foreground">
                {status.progress ?? 0}%
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default function ShowcasePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [videoDur, setVideoDur] = useState(0);
  const [strength, setStrength] = useState<string>("smooth");
  const [upscale, setUpscale] = useState<string>("4k");
  const [speed, setSpeed] = useState<number>(0.5);
  const [interp, setInterp] = useState(true); // AI 보간 — 끄면 fps 를 낮춰 원본 프레임만 재생
  const [fps60, setFps60] = useState(false);

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pickVideoRef = useRef<HTMLVideoElement>(null);
  const [subject, setSubject] = useState<{ t: number; x: number; y: number } | null>(null);
  const [pickMode, setPickMode] = useState(false);
  const [curT, setCurT] = useState(0); // 미리보기 현재 위치(0.1초 단위 탐색·표시용)

  // 처리 구역(0~1 상대 사각형) — 지정 시 원본 해상도에서 이 구역만 잘라 처리(피사체 확대).
  // 미리보기에 사각형이 항상 표시되고, 경계(모서리·변)·이동 핸들을 끌어 조정한다.
  const [region, setRegion] = useState<Region | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null); // 비디오 래퍼 — 핸들 드래그 좌표 기준

  // 조정된 구역을 파일별로 기억(브라우저 저장) — 삭제는 "구역 해제" 버튼에서만
  useEffect(() => {
    if (!file || !region) return;
    try {
      localStorage.setItem(regionKey(file), JSON.stringify(region));
    } catch {
      /* 저장 불가 환경은 무시 */
    }
  }, [region, file]);

  function onPick(f: File | null) {
    setFile(f);
    setSubject(null);
    setPickMode(false);
    setRegion(null);
    setStart(0);
    setEnd(0);
    setVideoDur(0);
    setJobId(null);
    setStatus(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("video")) onPick(f);
  }

  function onPickClick(e: React.MouseEvent<HTMLDivElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const x = Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1);
    const y = Math.min(Math.max((e.clientY - box.top) / box.height, 0), 1);
    setSubject({ t: pickVideoRef.current?.currentTime ?? 0, x, y });
    setPickMode(false);
  }

  // 구역 핸들 드래그 — mode: "move"(전체 이동) | n/s/e/w/ne/nw/se/sw(경계 이동=리사이즈).
  // window 리스너로 래퍼 밖까지 추적하고 mouseup 에서 해제한다.
  function startHandle(e: React.MouseEvent, mode: string) {
    e.preventDefault();
    e.stopPropagation();
    const orig = region;
    const wrap = wrapRef.current;
    if (!orig || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const MIN = 0.05; // 최소 한 변 5%
    const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
    const r3 = (v: number) => Math.round(v * 1000) / 1000;
    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - sx) / rect.width;
      const dy = (ev.clientY - sy) / rect.height;
      let { x, y, w, h } = orig;
      if (mode === "move") {
        x = clamp(orig.x + dx, 0, 1 - orig.w);
        y = clamp(orig.y + dy, 0, 1 - orig.h);
      } else {
        if (mode.includes("w")) {
          const nx = clamp(orig.x + dx, 0, orig.x + orig.w - MIN);
          w = orig.w + (orig.x - nx);
          x = nx;
        }
        if (mode.includes("e")) w = clamp(orig.w + dx, MIN, 1 - orig.x);
        if (mode.includes("n")) {
          const ny = clamp(orig.y + dy, 0, orig.y + orig.h - MIN);
          h = orig.h + (orig.y - ny);
          y = ny;
        }
        if (mode.includes("s")) h = clamp(orig.h + dy, MIN, 1 - orig.y);
      }
      setRegion({ x: r3(x), y: r3(y), w: r3(w), h: r3(h) });
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // 미리보기 재생 위치를 구간 시작/끝으로 캡처 (0.1초 단위)
  function markStart() {
    const t = Math.round((pickVideoRef.current?.currentTime ?? 0) * 10) / 10;
    setStart(t);
    if (end <= t) setEnd(Math.min(t + 4, videoDur || t + 4));
  }
  function markEnd() {
    const t = Math.round((pickVideoRef.current?.currentTime ?? 0) * 10) / 10;
    setEnd(t);
    if (start >= t) setStart(Math.max(t - 4, 0));
  }

  // 미리보기를 d초만큼 이동(±0.1/±1) — 일시정지 후 0.1초 격자에 스냅해 정밀 탐색
  function seekBy(d: number) {
    const v = pickVideoRef.current;
    if (!v) return;
    v.pause();
    const max = videoDur || v.duration || 0;
    const t = Math.round((v.currentTime + d) * 10) / 10;
    v.currentTime = Math.min(Math.max(t, 0), max);
  }

  // 잡의 설정을 좌측 폼에 반영 — 새로고침 복원·최근 작업 선택 시 어떤 조건인지 보이게
  function applyParams(p?: Params) {
    if (!p) return;
    setStart(p.start ?? 0);
    setEnd(p.end ?? 0);
    if (p.strength) setStrength(p.strength);
    if (p.upscale) setUpscale(p.upscale);
    if (p.speed) setSpeed(p.speed);
    setInterp(p.interpolate !== "off");
    setFps60(p.fps === 60);
  }

  const loadJobs = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/showcase/jobs`);
      if (r.ok) setJobs((await r.json()).jobs ?? []);
    } catch {
      /* 무시 */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/showcase/jobs`);
        if (alive && r.ok) {
          const js: JobStatus[] = (await r.json()).jobs ?? [];
          setJobs(js);
          // 새로고침 복원 — 진행 중 잡이 있으면 자동으로 이어서 표시(SSE 재구독)
          const running = js.find((j) => !TERMINAL.has(j.status));
          if (running) {
            setJobId(running.job_id);
            setStatus(running);
            applyParams(running.params);
          }
        }
      } catch {
        /* 무시 */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 잡 상태 SSE 구독 — 실행 중일 때만 연결(종료 상태를 받으면 url 을 null 로 바꿔 닫음)
  const streaming = !!jobId && !(status && TERMINAL.has(status.status));
  useEventStream<JobEvent>(
    streaming ? `${API_BASE}/api/showcase/jobs/${jobId}/events` : null,
    (ev) => {
      if (ev.type === "status") {
        setStatus(ev.job);
        if (TERMINAL.has(ev.job.status)) loadJobs();
      } else if (ev.type === "gone") {
        setJobId(null);
        setStatus(null);
        loadJobs();
      }
    },
  );

  async function submit() {
    if (!file || submitting) return;
    setSubmitting(true);
    setErr(null);
    setStatus(null);
    // jobId 도 함께 비운다 — 남겨두면 업로드 동안 이전(완료) 잡 SSE 를 재구독해
    // 완료 상태가 status 에 되살아나고, 새 잡 id 가 와도 스트림을 열지 않는다.
    setJobId(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("start", String(start));
      fd.append("end", String(end));
      fd.append("strength", strength);
      fd.append("edge", "crop");
      fd.append("upscale", upscale);
      fd.append("speed", String(speed));
      fd.append("interpolate", interp ? "smooth" : "off");
      fd.append("model", "photo");
      fd.append("fps", interp && fps60 ? "60" : "keep");
      if (subject) fd.append("subject", JSON.stringify(subject));
      if (region) fd.append("region", JSON.stringify(region));
      const r = await fetch(`${API_BASE}/api/showcase/jobs`, { method: "POST", body: fd });
      if (!r.ok) throw new Error(await readErr(r));
      const j = await r.json();
      setJobId(j.job_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelJob() {
    if (!jobId) return;
    await fetch(`${API_BASE}/api/showcase/jobs/${jobId}/cancel`, { method: "POST" }).catch(() => {});
  }

  async function retryJob(id: string) {
    setErr(null);
    try {
      const r = await fetch(`${API_BASE}/api/showcase/jobs/${id}/retry`, { method: "POST" });
      if (!r.ok) throw new Error(await readErr(r));
      setJobId(id);
      setStatus(null);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function removeJob(id: string) {
    await fetch(`${API_BASE}/api/showcase/jobs/${id}`, { method: "DELETE" }).catch(() => {});
    if (id === jobId) {
      setJobId(null);
      setStatus(null);
    }
    loadJobs();
  }

  async function removeAllJobs() {
    if (!jobs.length || !window.confirm("최근 작업을 모두 삭제할까요?")) return;
    await Promise.all(
      jobs.map((j) =>
        fetch(`${API_BASE}/api/showcase/jobs/${j.job_id}`, { method: "DELETE" }).catch(() => {}),
      ),
    );
    setJobId(null);
    setStatus(null);
    loadJobs();
  }

  function backToSetup() {
    setStatus(null);
    setJobId(null);
  }

  const running = status && !TERMINAL.has(status.status);
  const done = status?.status === "done";
  const doneJob = status && status.status === "done" ? status : null;
  const resultUrl = jobId ? `${API_BASE}/api/showcase/jobs/${jobId}/result` : null;
  const clipSec = Math.max(end - start, 0);
  const clipValid = clipSec > 0 && clipSec <= MAX_CLIP_SECONDS;
  const est = clipValid ? estimateSeconds(clipSec, upscale, speed, interp ? "smooth" : "off") : 0;
  const metrics = doneJob?.outputs?.[0]?.metrics;

  return (
    <div className="relative flex-1 flex flex-col">
      <AppHeader active="showcase" />
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      <div className="mx-auto w-full max-w-[2000px] px-4 py-4">
        <div className="grid gap-4 items-start landscape:grid-cols-[minmax(330px,380px)_minmax(0,1fr)_minmax(300px,340px)]">
          {/* ===== 좌: 옵션 + 처리중 ===== */}
          <div className="space-y-4 landscape:sticky landscape:top-4">
            <section className="rounded-lg border border-border bg-card p-4 space-y-4">
              {file ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="truncate">
                    📹 {file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="ml-auto shrink-0 px-2 py-1 rounded bg-muted hover:bg-muted/80"
                  >
                    변경
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-2 rounded-full text-sm active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  영상 파일 선택
                </button>
              )}

              <div className="space-y-1.5">
                <span className="text-sm font-semibold">추출 구간</span>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={start}
                    onChange={(e) => setStart(Math.max(0, Number(e.target.value)))}
                    className="w-20 rounded border border-border bg-background px-2 py-1 tabular-nums"
                    aria-label="시작(초)"
                  />
                  <span className="text-muted-foreground">~</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={end}
                    onChange={(e) => setEnd(Math.max(0, Number(e.target.value)))}
                    className="w-20 rounded border border-border bg-background px-2 py-1 tabular-nums"
                    aria-label="끝(초)"
                  />
                  <span className="text-xs text-muted-foreground">
                    초 ({clipSec.toFixed(1)}초)
                  </span>
                </div>
                <p className={`text-xs ${clipValid || !file ? "text-muted-foreground" : "text-destructive"}`}>
                  최대 {MAX_CLIP_SECONDS}초. 미리보기에서 “여기부터/여기까지”로도 지정됩니다.
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-semibold">고정 강도</span>
                <div className="flex flex-nowrap gap-1.5">
                  {STRENGTHS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setStrength(s.key)}
                      className={`px-2 py-1.5 rounded-lg text-sm active:scale-95 transition-transform whitespace-nowrap ${
                        strength === s.key ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {STRENGTHS.find((s) => s.key === strength)?.desc}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-semibold">업스케일</span>
                <div className="flex gap-1.5">
                  {UPSCALES.map((u) => (
                    <button
                      key={u.key}
                      onClick={() => setUpscale(u.key)}
                      className={`px-2 py-1.5 rounded-lg text-sm active:scale-95 transition-transform ${
                        upscale === u.key ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-semibold">재생 속도</span>
                <div className="flex gap-1.5">
                  {SPEEDS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSpeed(s.key)}
                      className={`px-2 py-1.5 rounded-lg text-sm active:scale-95 transition-transform whitespace-nowrap ${
                        speed === s.key ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  슬로모션은 AI 보간으로 중간 프레임을 생성해 fps 를 유지합니다(무음).
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={interp}
                  onChange={(e) => setInterp(e.target.checked)}
                  className="accent-primary"
                />
                AI 프레임 보간 — 끄면 fps 를 낮춰 원본 프레임만 재생(보간 워핑 없음, 덜 부드러움)
              </label>
              <label
                className={`flex items-center gap-2 text-xs cursor-pointer ${
                  interp ? "text-muted-foreground" : "text-muted-foreground/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={interp && fps60}
                  disabled={!interp}
                  onChange={(e) => setFps60(e.target.checked)}
                  className="accent-primary"
                />
                60fps 목표 — 입력이 60fps 미만일 때만 프레임을 더 생성
              </label>

              {file && clipValid && !running && (
                <p className="text-xs text-muted-foreground">예상 소요: 약 {fmtDur(est)}</p>
              )}

              <button
                onClick={submit}
                disabled={!file || !clipValid || submitting || !!running}
                className="w-full px-4 py-2 rounded-full text-sm active:scale-95 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                {submitting ? "업로드 중…" : running ? "처리 중…" : "연출 클립 만들기"}
              </button>
              {err && <p className="text-sm text-destructive whitespace-pre-wrap">{err}</p>}
            </section>

            {/* 처리중/실패 — 체인 단계별 원형 불빛 */}
            {status && !done && (
              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">
                    <span
                      className={status.status === "failed" ? "text-destructive" : "text-foreground"}
                    >
                      {STATUS_LABEL[status.status] ?? status.status}
                    </span>
                  </h2>
                  {running ? (
                    <button onClick={cancelJob} className="px-2 py-1 rounded text-xs bg-muted">
                      취소
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      {(status.status === "failed" || status.status === "canceled") && (
                        <button
                          onClick={() => retryJob(status.job_id)}
                          className="px-2 py-1 rounded text-xs bg-primary text-primary-foreground"
                        >
                          이어서 재시도
                        </button>
                      )}
                      <button
                        onClick={backToSetup}
                        className="px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80"
                      >
                        ↩ 다시 설정
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{paramSummary(status.params)}</p>
                <StageLights status={status} />
                {status.note && <p className="text-xs text-muted-foreground">참고: {status.note}</p>}
                {status.status === "failed" && (
                  <p className="text-sm text-destructive whitespace-pre-wrap">{status.error}</p>
                )}
              </section>
            )}
          </div>

          {/* ===== 가운데: 미리보기/결과 ===== */}
          <div className="min-w-0">
            {doneJob && resultUrl ? (
              // 결과 — 완성 클립 재생 + 다운로드
              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <video
                  src={resultUrl}
                  controls
                  autoPlay
                  loop
                  muted
                  className="block mx-auto max-w-full max-h-[78vh] rounded border border-border bg-black"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <a
                    href={resultUrl}
                    download
                    className="px-3 py-1.5 rounded-full text-sm active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    ⬇ 다운로드
                  </a>
                  <span className="text-xs text-muted-foreground">
                    {paramSummary(doneJob.params)}
                    {metrics?.out_w
                      ? ` → ${metrics.out_w}×${metrics.out_h} · ${metrics.out_fps}fps · ${metrics.duration}s`
                      : ""}
                  </span>
                  <div className="ml-auto flex items-center gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform bg-muted hover:bg-muted/80"
                    >
                      ＋ 새 영상
                    </button>
                    <button
                      onClick={backToSetup}
                      className="px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform bg-muted hover:bg-muted/80"
                    >
                      ↩ 다시 설정
                    </button>
                  </div>
                </div>
                {doneJob.note && (
                  <p className="text-xs text-muted-foreground">참고: {doneJob.note}</p>
                )}
              </section>
            ) : previewUrl ? (
              // 설정 — 미리보기에서 구간·주인공 지정
              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div ref={wrapRef} className="relative mx-auto w-fit max-w-full">
                  <video
                    ref={pickVideoRef}
                    src={previewUrl}
                    controls
                    onLoadedMetadata={(e) => {
                      const d = e.currentTarget.duration;
                      setVideoDur(d);
                      if (end <= 0) setEnd(Math.min(Math.round(d * 10) / 10, MAX_CLIP_SECONDS));
                      // 처리 구역 — 같은 파일에 기억해 둔 사각형이 있으면 복원, 없으면 중앙 기본값
                      let saved: Region | null = null;
                      try {
                        const s = file ? localStorage.getItem(regionKey(file)) : null;
                        if (s) saved = JSON.parse(s) as Region;
                      } catch {
                        /* 복원 실패는 기본값으로 */
                      }
                      setRegion((r) => r ?? saved ?? { x: 0.25, y: 0.2, w: 0.5, h: 0.6 });
                    }}
                    onTimeUpdate={(e) => setCurT(e.currentTarget.currentTime)}
                    onSeeked={(e) => setCurT(e.currentTarget.currentTime)}
                    className="block max-h-[62vh] max-w-full rounded bg-black"
                  />
                  {pickMode && (
                    <div
                      className="absolute inset-0 cursor-crosshair"
                      onClick={onPickClick}
                      aria-label="주인공 클릭"
                    />
                  )}
                  {region && !pickMode && (
                    // 처리 구역 박스 — 내부는 투명(비디오 조작 유지), 경계·이동 핸들만 잡힌다
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        left: `${region.x * 100}%`,
                        top: `${region.y * 100}%`,
                        width: `${region.w * 100}%`,
                        height: `${region.h * 100}%`,
                      }}
                    >
                      <div className="absolute inset-0 border-2 border-primary bg-primary/10" />
                      {/* 이동 핸들(상단 중앙 바깥) */}
                      <div
                        onMouseDown={(e) => startHandle(e, "move")}
                        className="absolute pointer-events-auto cursor-move -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs select-none"
                        title="구역 이동"
                      >
                        ✥ 이동
                      </div>
                      {/* 변 핸들 — 경계선을 끌어 그 변만 이동 */}
                      {(
                        [
                          ["n", "left-1/2 -translate-x-1/2 -top-1.5 cursor-ns-resize"],
                          ["s", "left-1/2 -translate-x-1/2 -bottom-1.5 cursor-ns-resize"],
                          ["w", "top-1/2 -translate-y-1/2 -left-1.5 cursor-ew-resize"],
                          ["e", "top-1/2 -translate-y-1/2 -right-1.5 cursor-ew-resize"],
                        ] as const
                      ).map(([m, cls]) => (
                        <div
                          key={m}
                          onMouseDown={(e) => startHandle(e, m)}
                          className={`absolute pointer-events-auto h-3 w-3 rounded-sm bg-primary border border-background ${cls}`}
                        />
                      ))}
                      {/* 모서리 핸들 — 두 변을 함께 이동 */}
                      {(
                        [
                          ["nw", "-top-1.5 -left-1.5 cursor-nwse-resize"],
                          ["ne", "-top-1.5 -right-1.5 cursor-nesw-resize"],
                          ["sw", "-bottom-1.5 -left-1.5 cursor-nesw-resize"],
                          ["se", "-bottom-1.5 -right-1.5 cursor-nwse-resize"],
                        ] as const
                      ).map(([m, cls]) => (
                        <div
                          key={m}
                          onMouseDown={(e) => startHandle(e, m)}
                          className={`absolute pointer-events-auto h-3 w-3 rounded-sm bg-primary border border-background ${cls}`}
                        />
                      ))}
                    </div>
                  )}
                  {subject && (
                    <div
                      className="absolute h-5 w-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-success bg-success/30 pointer-events-none"
                      style={{ left: `${subject.x * 100}%`, top: `${subject.y * 100}%` }}
                    />
                  )}
                </div>
                {/* 0.1초 단위 정밀 탐색 — 원하는 프레임 근처로 미세 이동 후 구간 지정 */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap text-sm">
                  <button
                    onClick={() => seekBy(-1)}
                    className="px-2 py-1 rounded bg-muted hover:bg-muted/80 tabular-nums"
                  >
                    −1s
                  </button>
                  <button
                    onClick={() => seekBy(-0.1)}
                    className="px-2 py-1 rounded bg-muted hover:bg-muted/80 tabular-nums"
                  >
                    −0.1s
                  </button>
                  <span className="px-2 tabular-nums text-muted-foreground min-w-[4.5rem] text-center">
                    {curT.toFixed(1)}s
                  </span>
                  <button
                    onClick={() => seekBy(0.1)}
                    className="px-2 py-1 rounded bg-muted hover:bg-muted/80 tabular-nums"
                  >
                    +0.1s
                  </button>
                  <button
                    onClick={() => seekBy(1)}
                    className="px-2 py-1 rounded bg-muted hover:bg-muted/80 tabular-nums"
                  >
                    +1s
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={markStart}
                    className="px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform bg-muted hover:bg-muted/80"
                  >
                    ⇤ 여기부터 ({start.toFixed(1)}s)
                  </button>
                  <button
                    onClick={markEnd}
                    className="px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform bg-muted hover:bg-muted/80"
                  >
                    여기까지 ({end.toFixed(1)}s) ⇥
                  </button>
                  <span className="h-4 w-px bg-border" aria-hidden />
                  <button
                    onClick={() => setPickMode((v) => !v)}
                    className={`px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform ${
                      pickMode ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {pickMode ? "인물을 클릭…" : subject ? "주인공 다시 지정" : "주인공 클릭 지정"}
                  </button>
                  {subject && (
                    <button
                      onClick={() => setSubject(null)}
                      className="px-2 py-1.5 rounded-lg text-sm bg-muted hover:bg-muted/80 text-muted-foreground"
                    >
                      지우기
                    </button>
                  )}
                  {region ? (
                    <button
                      onClick={() => {
                        setRegion(null);
                        try {
                          if (file) localStorage.removeItem(regionKey(file));
                        } catch {
                          /* 무시 */
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform bg-muted hover:bg-muted/80"
                    >
                      구역 해제 (전체 처리)
                    </button>
                  ) : (
                    <button
                      onClick={() => setRegion({ x: 0.25, y: 0.2, w: 0.5, h: 0.6 })}
                      className="px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform bg-muted hover:bg-muted/80"
                    >
                      처리 구역 표시
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  영상을 원하는 지점에 멈춘 뒤 “여기부터/여기까지”로 구간을 잡고, 주인공(얼굴/몸통)을
                  클릭해 지정하세요. 미지정 시 중앙의 인물이 자동 선택됩니다. 파란 사각형이 처리
                  구역입니다 — 경계(모서리·변)와 “✥ 이동”을 끌어 피사체 주변에 맞추면 그 구역만
                  원본 해상도에서 잘라 처리해 화질 개선이 뚜렷해집니다(구간 내 피사체 이동을 감안해
                  넉넉히). 전체 화면을 처리하려면 “구역 해제”.
                  {subject
                    ? ` · 주인공 지정됨(${(subject.x * 100).toFixed(0)}%, ${(subject.y * 100).toFixed(0)}%, t=${subject.t.toFixed(1)}s)`
                    : ""}
                  {region
                    ? ` · 구역(${(region.w * 100).toFixed(0)}%×${(region.h * 100).toFixed(0)}%)`
                    : ""}
                </p>
              </section>
            ) : (
              // 업로드 — 드래그&드롭
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed min-h-[62vh] text-center p-10 transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-border bg-card/40"
                }`}
              >
                <svg
                  width="44"
                  height="44"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                  aria-hidden
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <p className="text-lg font-semibold">영상을 여기에 끌어다 놓으세요</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-full text-sm active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  또는 파일 선택
                </button>
                <p className="text-xs text-muted-foreground">
                  구간을 골라 흔들림 보정 + 피사체 크롭 + 슬로모션 + 업스케일을 한 번에
                </p>
              </div>
            )}
          </div>

          {/* ===== 우: 최근 작업 ===== */}
          <div className="landscape:sticky landscape:top-4">
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold">최근 작업</h2>
                {jobs.length > 0 && (
                  <button
                    onClick={removeAllJobs}
                    className="text-[11px] text-muted-foreground hover:text-destructive"
                  >
                    전체 삭제
                  </button>
                )}
              </div>
              {jobs.length === 0 ? (
                <p className="text-xs text-muted-foreground">아직 작업이 없습니다.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {jobs.map((j) => (
                    <li key={j.job_id} className="flex items-center gap-2 py-2">
                      <button
                        onClick={() => {
                          setJobId(j.job_id);
                          setStatus(j);
                          applyParams(j.params);
                        }}
                        className="text-left min-w-0 flex-1"
                      >
                        <div className={`text-xs ${j.job_id === jobId ? "text-foreground" : ""}`}>
                          {paramSummary(j.params)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span
                            className={
                              j.status === "done"
                                ? "text-success"
                                : j.status === "failed"
                                  ? "text-destructive"
                                  : ""
                            }
                          >
                            {STATUS_LABEL[j.status] ?? j.status}
                          </span>
                          {j.created_at ? ` · ${relTime(j.created_at)}` : ""}
                        </div>
                      </button>
                      <button
                        onClick={() => removeJob(j.job_id)}
                        className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                      >
                        삭제
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
