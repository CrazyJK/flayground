"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "../_components/AppHeader";
import { DropOverlay, useImageDropPaste } from "../_components/useImageDropPaste";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://ai.kamoru.jk:8000";

const ALL_SIZES = [256, 128, 64, 48, 32, 16] as const;
const PREVIEW = 256; // 미리보기 캔버스 한 변(px)

type Mode = "round" | "feather" | "square" | "rounded";
type Anchor = "center" | "top" | "bottom";

const MODES: { key: Mode; label: string }[] = [
  { key: "round", label: "원형" },
  { key: "feather", label: "페더" },
  { key: "square", label: "사각" },
  { key: "rounded", label: "둥근사각" },
];

const MODE_SUFFIX: Record<Mode, string> = {
  round: "_round",
  feather: "_feather",
  square: "_square",
  rounded: "_rounded",
};

const ANCHORS: { key: Anchor; label: string }[] = [
  { key: "top", label: "위" },
  { key: "center", label: "중앙" },
  { key: "bottom", label: "아래" },
];

/** 캔버스에 둥근사각형 경로를 그린다(채우기는 호출 측에서). */
function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export default function IcoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<Mode>("round");
  const [feather, setFeather] = useState(0.18);
  const [radius, setRadius] = useState(0.2);
  const [anchor, setAnchor] = useState<Anchor>("center");
  const [sizes, setSizes] = useState<number[]>([...ALL_SIZES]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function onPick(f: File | null) {
    setErr(null);
    setFile(f);
    setImgUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return f ? URL.createObjectURL(f) : null;
    });
  }

  // 업로드 파일 -> HTMLImageElement (미리보기 소스)
  useEffect(() => {
    if (!imgUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImg(null); // 파일 해제 시 미리보기 reset(정상 패턴)
      return;
    }
    const im = new Image();
    im.onload = () => setImg(im);
    im.onerror = () => setErr("이미지를 읽을 수 없습니다");
    im.src = imgUrl;
  }, [imgUrl]);

  // 옵션/이미지 변경 시 캔버스 미리보기 다시 그림(클라이언트 즉시 반영).
  // 정식 멀티해상도 .ico 는 서버가 생성하며, 여기서는 모양만 동일하게 보여준다.
  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, PREVIEW, PREVIEW);
    if (!img) return;

    // 중앙 기준 정사각 크롭(anchor 로 세로 위치 선택)
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    let sy = (img.height - side) / 2;
    if (anchor === "top") sy = 0;
    else if (anchor === "bottom") sy = img.height - side;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, PREVIEW, PREVIEW);

    if (mode === "square") return; // 마스크 없음

    // destination-in: 그려둔 이미지에서 마스크 알파만 남긴다
    ctx.globalCompositeOperation = "destination-in";
    const R = PREVIEW / 2;
    if (mode === "round") {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(R, R, R, 0, Math.PI * 2);
      ctx.fill();
    } else if (mode === "rounded") {
      const r = Math.max(0, Math.min(0.5, radius)) * PREVIEW;
      ctx.fillStyle = "#fff";
      roundedRectPath(ctx, 0, 0, PREVIEW, PREVIEW, r);
      ctx.fill();
    } else if (mode === "feather") {
      const f = Math.max(0, Math.min(0.5, feather));
      const inner = Math.min(R - 0.5, R * (1 - f));
      const g = ctx.createRadialGradient(R, R, inner, R, R, R);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, PREVIEW, PREVIEW);
    }
    ctx.globalCompositeOperation = "source-over";
  }, [img, mode, feather, radius, anchor]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 드래그&드롭 / 붙여넣기 업로드
  const { dragOver, dropProps } = useImageDropPaste((f) => {
    if (fileRef.current) fileRef.current.value = "";
    onPick(f);
  });

  function toggleSize(s: number) {
    setSizes((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s].sort((a, b) => b - a),
    );
  }

  async function convert() {
    if (!file) return;
    if (sizes.length === 0) {
      setErr("해상도를 최소 1개 선택하세요");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", mode);
      fd.append("feather", String(feather));
      fd.append("radius", String(radius));
      fd.append("anchor", anchor);
      fd.append("sizes", sizes.join(","));
      const r = await fetch(`${API_BASE}/api/ico/convert`, { method: "POST", body: fd });
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      const base = file.name.replace(/\.[^.]+$/, "") || "icon";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}${MODE_SUFFIX[mode]}.ico`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex-1 flex flex-col" {...dropProps}>
      {dragOver && <DropOverlay />}
      <AppHeader active="ico" />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] px-4 py-6 grid gap-8 md:grid-cols-2">
          {/* 좌: 업로드 + 옵션 */}
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-tight">이미지</h2>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => onPick(e.target.files?.[0] ?? null)}
                className="text-sm w-full"
              />
              <p className="text-xs text-muted-foreground">
                파일 선택 · 드래그&드롭 · 붙여넣기. 중앙을 정사각으로 잘라 변환합니다.
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-tight">모양</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`px-3 py-1 rounded-full active:scale-95 transition-transform ${
                      mode === m.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {mode === "feather" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex justify-between">
                  <span>페더 강도</span>
                  <span className="tabular-nums">{feather.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={feather}
                  onChange={(e) => setFeather(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}

            {mode === "rounded" && (
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground flex justify-between">
                  <span>모서리 반경</span>
                  <span className="tabular-nums">{radius.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
            )}

            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-tight">크롭 위치</h2>
              <div className="flex gap-2 text-sm">
                {ANCHORS.map((a) => (
                  <button
                    key={a.key}
                    onClick={() => setAnchor(a.key)}
                    className={`px-3 py-1 rounded-full active:scale-95 transition-transform ${
                      anchor === a.key
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-tight">포함 해상도</h2>
              <div className="flex flex-wrap gap-2 text-xs">
                {ALL_SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={`px-3 py-1 rounded-full tabular-nums active:scale-95 transition-transform ${
                      sizes.includes(s)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 우: 미리보기 + 다운로드 */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-tight">미리보기</h2>
            <div className="rounded-[18px] border border-border bg-muted p-4 flex items-center justify-center aspect-square">
              {img ? (
                <canvas
                  ref={canvasRef}
                  width={PREVIEW}
                  height={PREVIEW}
                  className="max-w-full h-auto"
                  style={{ imageRendering: "auto" }}
                />
              ) : (
                <span className="text-xs text-muted-foreground">이미지를 올리면 여기에 미리보기가 표시됩니다</span>
              )}
            </div>

            <button
              onClick={convert}
              disabled={busy || !file}
              className="w-full rounded-full bg-primary text-primary-foreground px-[22px] py-[11px] text-sm disabled:bg-muted disabled:text-muted-foreground active:scale-95 transition-transform"
            >
              {busy ? "변환 중…" : "변환 · 다운로드"}
            </button>

            <p className="text-xs text-muted-foreground">
              {sizes.length}개 해상도({[...sizes].sort((a, b) => b - a).join(", ")})를 담은 단일 .ico
              파일로 저장됩니다.
            </p>
            {err && <p className="text-xs text-destructive break-all">{err}</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
