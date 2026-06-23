"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "../_components/AppHeader";
import { DropOverlay, useImageDropPaste } from "../_components/useImageDropPaste";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://ai.kamoru.jk:8000";

const ALL_SIZES = [256, 128, 64, 48, 32, 16] as const;
const PREVIEW = 256; // 미리보기 캔버스 한 변(px)

type Anchor = "center" | "top" | "bottom";
type Orient = "square" | "portrait" | "landscape";

const ANCHOR_KEYS: Anchor[] = ["top", "center", "bottom"];
// 크롭 위치 라벨은 '잘려나가는 축'에 따라 달라진다(코어 _square_box 와 동일 규칙).
const ANCHOR_LABELS: Record<Orient, [string, string, string]> = {
  portrait: ["위", "중앙", "아래"],
  landscape: ["왼쪽", "중앙", "오른쪽"],
  square: ["—", "중앙", "—"],
};

// 둥글기 프리셋(슬라이더 값을 빠르게 설정). 0=각진 사각, 0.5=원형.
const ROUND_PRESETS: { label: string; v: number }[] = [
  { label: "사각", v: 0 },
  { label: "둥근사각", v: 0.25 },
  { label: "원형", v: 0.5 },
];

/** 다운로드 파일명 접미사 — 현재 둥글기/페더에서 모양을 사람이 읽을 수 있게. */
function shapeSuffix(radius: number, feather: number): string {
  const shape = radius >= 0.45 ? "round" : radius <= 0.05 ? "square" : "rounded";
  return "_" + shape + (feather > 0.02 ? "-soft" : "");
}

export default function IcoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [radius, setRadius] = useState(0.5); // 0=각진 사각 ~ 0.5=원형
  const [feather, setFeather] = useState(0.0); // 0=또렷 ~ 0.5=부드럽게
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
  // 서버 shape_mask 와 동일한 둥근사각 SDF 로 알파를 곱해 결과와 일치시킨다.
  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, PREVIEW, PREVIEW);
    if (!img) return;

    // 정사각 크롭. anchor 는 잘려나가는 축에만 적용(코어 _square_box 와 동일).
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const side = Math.min(nw, nh);
    let sx = (nw - side) / 2;
    let sy = (nh - side) / 2;
    if (nh >= nw) {
      if (anchor === "top") sy = 0;
      else if (anchor === "bottom") sy = nh - side;
    } else {
      if (anchor === "top") sx = 0;
      else if (anchor === "bottom") sx = nw - side;
    }
    ctx.drawImage(img, sx, sy, side, side, 0, 0, PREVIEW, PREVIEW);

    // 둥근사각 SDF 알파(코어 shape_mask 와 동일 수식). d<0 내부, d>0 외부.
    const S = PREVIEW;
    const r = Math.max(0, Math.min(0.5, radius)) * S;
    const half = S / 2;
    const c = (S - 1) / 2;
    const band = Math.max(0, Math.min(0.5, feather)) * half;
    const id = ctx.getImageData(0, 0, S, S);
    const data = id.data;
    for (let y = 0; y < S; y++) {
      const qy = Math.abs(y - c) - half + r;
      for (let x = 0; x < S; x++) {
        const qx = Math.abs(x - c) - half + r;
        const ox = qx > 0 ? qx : 0;
        const oy = qy > 0 ? qy : 0;
        const outside = Math.sqrt(ox * ox + oy * oy);
        const mxy = qx > qy ? qx : qy;
        const inside = mxy < 0 ? mxy : 0;
        const d = outside + inside - r;
        let a = band > 0 ? -d / band : 0.5 - d;
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        const idx = ((y * S + x) << 2) + 3;
        data[idx] = Math.round(data[idx] * a);
      }
    }
    ctx.putImageData(id, 0, 0);
  }, [img, radius, feather, anchor]);

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
      fd.append("radius", String(radius));
      fd.append("feather", String(feather));
      fd.append("anchor", anchor);
      fd.append("sizes", sizes.join(","));
      const r = await fetch(`${API_BASE}/api/ico/convert`, { method: "POST", body: fd });
      if (!r.ok) throw new Error(await r.text());
      const blob = await r.blob();
      const base = file.name.replace(/\.[^.]+$/, "") || "icon";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${base}${shapeSuffix(radius, feather)}.ico`;
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

  // 원본 방향: 잘리는 축(=anchor 가 의미를 갖는 축)을 결정. 정사각이면 크롭 불필요.
  const orient: Orient = !img
    ? "square"
    : img.naturalWidth === img.naturalHeight
      ? "square"
      : img.naturalHeight > img.naturalWidth
        ? "portrait"
        : "landscape";
  const cropDisabled = orient === "square";

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

            <div className="space-y-4">
              <h2 className="text-sm font-semibold tracking-tight">모양</h2>

              {/* 모서리 둥글기: 0=각진 사각 ~ 0.5=원형 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>모서리 둥글기</span>
                  <span className="tabular-nums">
                    {radius <= 0.001
                      ? "각진 사각"
                      : radius >= 0.499
                        ? "원형"
                        : `${Math.round((radius / 0.5) * 100)}%`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex gap-2 text-xs">
                  {ROUND_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setRadius(p.v)}
                      className={`px-3 py-1 rounded-full active:scale-95 transition-transform ${
                        Math.abs(radius - p.v) < 0.001
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 가장자리 페더: 0=또렷 ~ 0.5=부드럽게 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>가장자리 페더</span>
                  <span className="tabular-nums">
                    {feather <= 0.001 ? "또렷" : `${Math.round((feather / 0.5) * 100)}%`}
                  </span>
                </div>
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
            </div>

            <div className="space-y-2">
              <h2 className="text-sm font-semibold tracking-tight">크롭 위치</h2>
              <div className="flex gap-2 text-sm">
                {ANCHOR_KEYS.map((key, i) => (
                  <button
                    key={key}
                    onClick={() => setAnchor(key)}
                    disabled={cropDisabled}
                    className={`px-3 py-1 rounded-full active:scale-95 transition-transform disabled:opacity-40 ${
                      anchor === key && !cropDisabled
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    }`}
                  >
                    {ANCHOR_LABELS[orient][i]}
                  </button>
                ))}
              </div>
              {img && (
                <p className="text-xs text-muted-foreground">
                  원본 {img.naturalWidth}×{img.naturalHeight} ·{" "}
                  {orient === "square"
                    ? "정사각 — 크롭 위치는 비정사각 이미지에서만 적용됩니다"
                    : orient === "portrait"
                      ? "세로형 — 위/중앙/아래로 남길 위치 선택"
                      : "가로형 — 왼쪽/중앙/오른쪽으로 남길 위치 선택"}
                </p>
              )}
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
                <span className="text-xs text-muted-foreground">
                  이미지를 올리면 여기에 미리보기가 표시됩니다
                </span>
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
