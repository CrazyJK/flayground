"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "../_components/AppHeader";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://ai.kamoru.jk:8000";

// 서버 config(enhance.max_input_seconds)와 맞춘 안내용 상수 — 초과 시 서버가 거부
const MAX_INPUT_SECONDS = 30;

// 목표 중심 프리셋 — 누르면 업스케일·배속·보간을 한 번에
const PRESETS = [
  { key: "slowmo4k", label: "4K 슬로모션", upscale: "4k", speed: 0.5, interp: "smooth" },
  { key: "quality", label: "화질만 개선", upscale: "4k", speed: 1, interp: "off" },
  { key: "smoothonly", label: "부드럽게만", upscale: "none", speed: 0.5, interp: "smooth" },
] as const;

const UPSCALES = [
  { key: "none", label: "원본 크기", desc: "해상도는 그대로 두고 배속·보간만 적용합니다." },
  { key: "2x", label: "2배", desc: "AI 업스케일 후 원본의 2배 크기로 냅니다." },
  { key: "4k", label: "4K", desc: "AI 업스케일로 4K(짧은 변 2160px)까지 키웁니다." },
] as const;

const SPEEDS = [
  { key: 1, label: "1× 그대로", desc: "속도 유지 — 화질 개선만 합니다(소리 유지)." },
  { key: 0.5, label: "½× 슬로모션", desc: "2배 느리게. 보간을 켜면 중간 프레임을 AI 로 생성해 부드럽습니다." },
  { key: 0.25, label: "¼× 초슬로모션", desc: "4배 느리게. 보간 필수 수준 — 끄면 매우 끊깁니다." },
] as const;

const UPSCALE_LABEL: Record<string, string> = { none: "원본 크기", "2x": "2배", "4k": "4K" };
const SPEED_LABEL: Record<string, string> = { "1": "1×", "0.5": "½×", "0.25": "¼×" };
const MODEL_LABEL: Record<string, string> = { photo: "실사", anime: "애니" };
const STATUS_LABEL: Record<string, string> = {
  queued: "대기 중",
  running: "처리 중",
  done: "완료",
  failed: "실패",
  canceled: "취소됨",
};
// 처리 단계(원형 불빛) 라벨 — 실제 흐름은 status.plan.stages 순서를 따른다
const STAGE_LABEL: Record<string, string> = {
  probe: "분석",
  extract: "프레임 추출",
  upscale: "업스케일",
  interpolate: "프레임 보간",
  encode: "인코딩",
};

type Params = { upscale: string; speed: number; interpolate: string; model: string };
type Plan = {
  n_in: number;
  n_out: number;
  upscale_on: boolean;
  rife_on: boolean;
  out_w: number;
  out_h: number;
  out_fps: number;
  out_duration: number;
  stages: Record<string, [number, number]>;
  total_seconds: number;
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
  input?: {
    width: number;
    height: number;
    fps: number;
    duration: number;
    format?: string;
    has_audio?: boolean;
  } | null;
  plan?: Plan | null;
  outputs?: JobOutput[];
  error?: string | null;
  note?: string | null;
  created_at?: number;
};

const TERMINAL = new Set(["done", "failed", "canceled"]);

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

// 서버 plan 근사식의 클라이언트판 — 파일 선택 직후 예상 소요를 미리 보여준다(30fps 가정)
function estimateSeconds(dur: number, upscale: string, speed: number, interp: string): number {
  const f = dur * 30;
  const fout = interp === "smooth" ? f / speed : f;
  let t = f * 0.02 + fout * 0.08;
  if (upscale !== "none") t += f * 4.5; // 업스케일이 지배 비용(프레임당 ~4.5초 실측)
  if (interp === "smooth" && speed < 1) t += fout * 0.3;
  return Math.round(t);
}

function paramSummary(p?: Params): string {
  if (!p) return "";
  const parts = [UPSCALE_LABEL[p.upscale] ?? p.upscale, SPEED_LABEL[String(p.speed)] ?? `${p.speed}×`];
  if (p.interpolate === "smooth" && p.speed < 1) parts.push("보간");
  if (p.model === "anime") parts.push("애니");
  return parts.join(" · ");
}

// 단계별 원형 불빛 — plan.stages 순서(없으면 기본 전체 흐름)를 따라 그린다
function StageLights({ status }: { status: JobStatus }) {
  const keys = status.plan?.stages
    ? ["probe", ...Object.keys(status.plan.stages)]
    : ["probe", "extract", "upscale", "interpolate", "encode"];
  const cur = status.stage ?? "";
  const curIdx = keys.indexOf(cur);
  const isDone = status.status === "done";
  const isFailed = status.status === "failed";
  return (
    <ul className="space-y-2">
      {keys.map((k, i) => {
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
          <li key={k} className="flex items-center gap-2 text-xs">
            <span className={`h-3 w-3 shrink-0 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`} />
            <span className={txt}>{STAGE_LABEL[k] ?? k}</span>
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

export default function EnhancePage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null); // 미리보기 메타에서
  const [upscale, setUpscale] = useState<string>("4k");
  const [speed, setSpeed] = useState<number>(0.5);
  const [interp, setInterp] = useState<string>("smooth");
  const [model, setModel] = useState<string>("photo");

  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [jobs, setJobs] = useState<JobStatus[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const origRef = useRef<HTMLVideoElement>(null);
  const resRef = useRef<HTMLVideoElement>(null);
  const [syncPlaying, setSyncPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  function onPick(f: File | null) {
    setFile(f);
    setDuration(null);
    setJobId(null);
    setStatus(null);
    setSyncPlaying(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && (f.type.startsWith("video") || f.type === "image/gif")) onPick(f);
  }

  const loadJobs = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/enhance/jobs`);
      if (r.ok) setJobs((await r.json()).jobs ?? []);
    } catch {
      /* 무시 */
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/api/enhance/jobs`);
        if (alive && r.ok) setJobs((await r.json()).jobs ?? []);
      } catch {
        /* 무시 */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!jobId) return;
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/enhance/jobs/${jobId}`);
        if (r.ok) {
          const s: JobStatus = await r.json();
          if (!alive) return;
          setStatus(s);
          if (!TERMINAL.has(s.status)) {
            timer = setTimeout(tick, 1500);
          } else {
            loadJobs();
          }
          return;
        }
      } catch {
        /* 재시도 */
      }
      if (alive) timer = setTimeout(tick, 2500);
    };
    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [jobId, loadJobs]);

  async function submit() {
    if (!file || submitting) return;
    setSubmitting(true);
    setErr(null);
    setStatus(null);
    setSyncPlaying(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upscale", upscale);
      fd.append("speed", String(speed));
      fd.append("interpolate", interp);
      fd.append("model", model);
      const r = await fetch(`${API_BASE}/api/enhance/jobs`, { method: "POST", body: fd });
      if (!r.ok) throw new Error(await r.text());
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
    await fetch(`${API_BASE}/api/enhance/jobs/${jobId}/cancel`, { method: "POST" }).catch(() => {});
  }

  async function retryJob(id: string) {
    setErr(null);
    try {
      const r = await fetch(`${API_BASE}/api/enhance/jobs/${id}/retry`, { method: "POST" });
      if (!r.ok) throw new Error(await r.text());
      setSyncPlaying(false);
      setJobId(id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  async function removeJob(id: string) {
    await fetch(`${API_BASE}/api/enhance/jobs/${id}`, { method: "DELETE" }).catch(() => {});
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
        fetch(`${API_BASE}/api/enhance/jobs/${j.job_id}`, { method: "DELETE" }).catch(() => {}),
      ),
    );
    setJobId(null);
    setStatus(null);
    loadJobs();
  }

  function backToSetup() {
    setStatus(null);
    setJobId(null);
    setSyncPlaying(false);
    if (origRef.current) origRef.current.playbackRate = 1;
  }

  function applyPreset(p: (typeof PRESETS)[number]) {
    setUpscale(p.upscale);
    setSpeed(p.speed);
    setInterp(p.interp);
  }

  // ── 전후 동시 비교: 원본을 결과와 같은 배속으로 낮춰 내용 시점을 맞춘다.
  //    (0.5x 결과는 2배 길다 — 원본 playbackRate=0.5 로 재생하면 장면이 일치하고,
  //     보간 없는 원본의 끊김 vs AI 보간 결과의 차이가 그대로 드러난다.)
  const doneJob = status && status.status === "done" ? status : null;
  const resSpeed = doneJob?.params?.speed ?? 1;

  function _pair(): [HTMLVideoElement | null, HTMLVideoElement | null] {
    return [origRef.current, resRef.current];
  }
  function syncToggle() {
    const [o, r] = _pair();
    if (!o || !r) return;
    if (syncPlaying) {
      o.pause();
      r.pause();
      o.playbackRate = 1;
      setSyncPlaying(false);
    } else {
      o.playbackRate = resSpeed;
      r.playbackRate = 1;
      r.currentTime = Math.min(o.currentTime / resSpeed, Math.max(r.duration - 0.05, 0));
      o.play().catch(() => {});
      r.play().catch(() => {});
      setSyncPlaying(true);
    }
  }
  function syncRestart() {
    const [o, r] = _pair();
    if (!o || !r) return;
    o.playbackRate = resSpeed;
    r.playbackRate = 1;
    o.currentTime = 0;
    r.currentTime = 0;
    o.play().catch(() => {});
    r.play().catch(() => {});
    setSyncPlaying(true);
  }
  function onMasterTime() {
    if (!syncPlaying) return;
    const [o, r] = _pair();
    if (!o || !r) return;
    const want = o.currentTime / resSpeed;
    if (Math.abs(r.currentTime - want) > 0.3) r.currentTime = want;
  }

  const running = status && !TERMINAL.has(status.status);
  const done = status?.status === "done";
  const resultUrl = jobId ? `${API_BASE}/api/enhance/jobs/${jobId}/result` : null;
  const isImage = !!file && file.type.startsWith("image"); // gif — 원본을 img 로
  const activePreset = PRESETS.find(
    (p) => p.upscale === upscale && p.speed === speed && p.interp === interp,
  );
  const est = duration ? estimateSeconds(duration, upscale, speed, interp) : null;
  const tooLong = duration != null && duration > MAX_INPUT_SECONDS + 0.5;
  const outs = doneJob?.outputs ?? [];
  const m = outs[0]?.metrics;
  // 원본: 방금 올린 파일 우선, 최근작업에서 열면 서버 원본(?variant=original)
  const origIsImage = doneJob
    ? previewUrl
      ? isImage
      : ((doneJob.input?.format ?? "").includes("gif"))
    : isImage;
  const origSrc = previewUrl ?? (done && resultUrl ? `${resultUrl}?variant=original` : null);
  const canSync = !!done && !!origSrc && !origIsImage;
  // ETA — plan 예상 총소요 × 남은 비율
  const eta =
    running && status?.plan?.total_seconds
      ? status.plan.total_seconds * (1 - (status.progress ?? 0) / 100)
      : null;

  return (
    <div className="relative flex-1 flex flex-col">
      <AppHeader active="enhance" />
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/*,image/gif"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      {/* 가로 모니터에선 폭을 넓게, 세로는 자연히 좁아짐 (stabilize 와 동일 골격) */}
      <div className="mx-auto w-full max-w-[2400px] px-4 py-4">
        <div
          className={`grid gap-4 items-start ${
            doneJob
              ? "landscape:grid-cols-[minmax(330px,360px)_1fr_minmax(330px,360px)]"
              : "landscape:grid-cols-[minmax(330px,360px)_minmax(0,1261px)_minmax(330px,360px)] landscape:justify-center"
          }`}
        >
          {/* ===== 좌: 옵션 + 처리중 ===== */}
          <div className="space-y-4 landscape:sticky landscape:top-4">
            <section className="rounded-lg border border-border bg-card p-4 space-y-4">
              {file ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="truncate">
                    🎞 {file.name} · {(file.size / 1024 / 1024).toFixed(1)}MB
                    {duration != null ? ` · ${duration.toFixed(1)}초` : ""}
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
                <span className="text-sm font-semibold">프리셋</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      onClick={() => applyPreset(p)}
                      className={`px-2 py-1 rounded text-xs ${
                        activePreset?.key === p.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-semibold">업스케일</span>
                <div className="flex flex-nowrap gap-1.5">
                  {UPSCALES.map((u) => (
                    <button
                      key={u.key}
                      onClick={() => setUpscale(u.key)}
                      className={`px-2.5 py-1.5 rounded-lg text-sm active:scale-95 transition-transform whitespace-nowrap ${
                        upscale === u.key ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {u.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {UPSCALES.find((u) => u.key === upscale)?.desc}
                </p>
              </div>

              <div className="space-y-1.5">
                <span className="text-sm font-semibold">배속</span>
                <div className="flex flex-nowrap gap-1.5">
                  {SPEEDS.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setSpeed(s.key)}
                      className={`px-2.5 py-1.5 rounded-lg text-sm active:scale-95 transition-transform whitespace-nowrap ${
                        speed === s.key ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {SPEEDS.find((s) => s.key === speed)?.desc}
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={interp === "smooth"}
                  onChange={(e) => setInterp(e.target.checked ? "smooth" : "off")}
                  className="accent-primary"
                />
                AI 프레임 보간(RIFE) — 슬로모션 중간 프레임을 생성해 부드럽게
              </label>
              {interp === "smooth" && speed === 1 && (
                <p className="text-xs text-muted-foreground -mt-2">
                  1× 에서는 보간이 적용되지 않습니다(생성할 중간 프레임 없음).
                </p>
              )}

              <div className="space-y-1.5">
                <span className="text-sm font-semibold">소스 종류</span>
                <div className="flex gap-2">
                  {(["photo", "anime"] as const).map((mk) => (
                    <button
                      key={mk}
                      onClick={() => setModel(mk)}
                      className={`px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform ${
                        model === mk ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {MODEL_LABEL[mk]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  업스케일 모델 선택 — 실사 영상은 실사, 애니메이션 소스는 애니.
                </p>
              </div>

              {est != null && !tooLong && (
                <p className="text-xs text-muted-foreground">
                  예상 처리 시간 ≈ <span className="text-foreground">{fmtDur(est)}</span>
                  {upscale !== "none" ? " (업스케일이 대부분)" : ""}
                </p>
              )}
              {tooLong && (
                <p className="text-xs text-destructive">
                  영상이 {duration?.toFixed(0)}초 — 제한({MAX_INPUT_SECONDS}초)을 넘어 서버가
                  거부합니다. 짧게 잘라서 올려 주세요.
                </p>
              )}

              <button
                onClick={submit}
                disabled={!file || submitting || !!running || tooLong}
                className="w-full px-4 py-2 rounded-full text-sm active:scale-95 transition-transform bg-primary hover:bg-primary/90 text-primary-foreground disabled:bg-muted disabled:text-muted-foreground"
              >
                {submitting ? "업로드 중…" : running ? "처리 중…" : "화질 개선 시작"}
              </button>
              {err && <p className="text-sm text-destructive whitespace-pre-wrap">{err}</p>}
            </section>

            {/* 처리중/실패 — 단계별 원형 불빛 + 남은 시간 */}
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
                    <button
                      onClick={backToSetup}
                      className="px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80"
                    >
                      ↩ 다시 설정
                    </button>
                  )}
                </div>
                <StageLights status={status} />
                {eta != null && eta > 3 && (
                  <p className="text-xs text-muted-foreground">
                    남은 시간 ≈ {fmtDur(eta)} (전체 ≈ {fmtDur(status.plan!.total_seconds)})
                  </p>
                )}
                {status.note && <p className="text-xs text-muted-foreground">참고: {status.note}</p>}
                {status.status === "failed" && (
                  <>
                    <p className="text-sm text-destructive whitespace-pre-wrap">{status.error}</p>
                    <button
                      onClick={() => retryJob(status.job_id)}
                      className="px-2 py-1 rounded text-xs bg-muted hover:bg-muted/80"
                    >
                      ↻ 이어서 재시도
                    </button>
                  </>
                )}
              </section>
            )}
          </div>

          {/* ===== 가운데: 미리보기/결과 ===== */}
          <div className="min-w-0">
            {doneJob && resultUrl ? (
              // 결과: 전/후 비교 (원본은 결과 배속에 맞춰 동시 재생)
              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex justify-center items-start gap-2">
                  {origSrc && (
                    <figure className="space-y-1 min-w-0" style={{ maxWidth: "calc(50% - 4px)" }}>
                      <figcaption className="text-xs text-muted-foreground">
                        원본
                        {canSync && resSpeed !== 1 ? ` (비교 시 ${SPEED_LABEL[String(resSpeed)]} 재생)` : ""}
                      </figcaption>
                      {origIsImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={origSrc}
                          alt="원본"
                          className="block mx-auto max-w-full max-h-[82vh] rounded border border-border bg-black"
                        />
                      ) : (
                        <video
                          ref={origRef}
                          src={origSrc}
                          controls
                          muted={muted}
                          onTimeUpdate={onMasterTime}
                          onPause={() => {
                            if (syncPlaying) resRef.current?.pause();
                          }}
                          onPlay={() => {
                            if (syncPlaying) resRef.current?.play().catch(() => {});
                          }}
                          onEnded={() => setSyncPlaying(false)}
                          className="block mx-auto max-w-full max-h-[82vh] rounded border border-border bg-black"
                        />
                      )}
                    </figure>
                  )}
                  <figure className="space-y-1 min-w-0" style={{ maxWidth: origSrc ? "calc(50% - 4px)" : "100%" }}>
                    <figcaption className="flex items-center gap-2 text-xs">
                      <span className="text-success">개선 결과</span>
                      {m && (
                        <span className="text-muted-foreground">
                          {m.out_w}×{m.out_h} · {m.out_fps}fps · {fmtDur(m.duration ?? 0)}
                        </span>
                      )}
                      <a
                        href={resultUrl}
                        download
                        className="text-muted-foreground hover:text-foreground"
                        title="다운로드"
                      >
                        ⬇
                      </a>
                    </figcaption>
                    <video
                      ref={resRef}
                      src={resultUrl}
                      controls
                      muted
                      className="block mx-auto max-w-full max-h-[82vh] rounded border border-border bg-black"
                    />
                  </figure>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {canSync && (
                    <>
                      <button
                        onClick={syncToggle}
                        className="px-3 py-1.5 rounded-full text-sm active:scale-95 transition-transform bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {syncPlaying ? "⏸ 동시 정지" : "▶ 동시 비교"}
                      </button>
                      <button
                        onClick={syncRestart}
                        className="px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform bg-muted hover:bg-muted/80"
                      >
                        ↺ 처음부터
                      </button>
                      <button
                        onClick={() => setMuted((v) => !v)}
                        className="px-3 py-1.5 rounded-lg text-sm active:scale-95 transition-transform bg-muted hover:bg-muted/80"
                        title="원본 소리 끄기/켜기"
                      >
                        {muted ? "🔇 음소거" : "🔊 소리"}
                      </button>
                    </>
                  )}
                  <span className="text-xs text-muted-foreground">{paramSummary(doneJob.params)}</span>
                  {doneJob.note && (
                    <span className="text-xs text-muted-foreground">· {doneJob.note}</span>
                  )}
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
              </section>
            ) : previewUrl ? (
              // 설정: 미리보기 + 안내
              <section className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="relative mx-auto w-fit max-w-full">
                  {isImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrl}
                      alt="원본"
                      className="block max-h-[64vh] max-w-full rounded bg-black"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || null)}
                      className="block max-h-[64vh] max-w-full rounded bg-black"
                    />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-semibold">미리보기</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    왼쪽에서 업스케일·배속·보간을 고르고 &ldquo;화질 개선 시작&rdquo;을 누르세요.
                    업스케일은 프레임당 수 초가 걸립니다 — 짧은 영상(≤{MAX_INPUT_SECONDS}초)만
                    받습니다.
                  </p>
                </div>
              </section>
            ) : (
              // 업로드: 크게, 드래그&드롭
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed min-h-[64vh] text-center p-10 transition-colors ${
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
                  짧은 영상(≤{MAX_INPUT_SECONDS}초) — 4K 업스케일 · 슬로모션 · AI 프레임 보간
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
                          setSyncPlaying(false);
                          if (previewUrl) URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                          setFile(null);
                          setJobId(j.job_id);
                          setStatus(j);
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
                      {(j.status === "failed" || j.status === "canceled") && (
                        <button
                          onClick={() => retryJob(j.job_id)}
                          className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
                          title="멈춘 단계부터 이어서 재시도"
                        >
                          ↻
                        </button>
                      )}
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
