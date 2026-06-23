"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AppHeader from "../_components/AppHeader";
import { DropOverlay, useImageDropPaste } from "../_components/useImageDropPaste";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://ai.kamoru.jk:8000";

const ALL_SIZES = [256, 128, 64, 48, 32, 16] as const;
const PREVIEW = 256; // 미리보기 캔버스 한 변(px)
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

// 둥글기 프리셋(슬라이더 값을 빠르게 설정). 0=각진 사각, 0.5=원형.
const ROUND_PRESETS: { label: string; v: number }[] = [
  { label: "사각", v: 0 },
  { label: "둥근사각", v: 0.25 },
  { label: "원형", v: 0.5 },
];

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

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
  const [zoom, setZoom] = useState(1.0); // 1=꽉 참, >1 확대, <1 축소
  const [offx, setOffx] = useState(0.0); // -1~1 가로 위치
  const [offy, setOffy] = useState(0.0); // -1~1 세로 위치
  const [sizes, setSizes] = useState<number[]>([...ALL_SIZES]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  // 휠 핸들러(네이티브 리스너)가 항상 최신 zoom/offx/offy 를 읽도록 ref 로 미러링.
  const viewRef = useRef({ zoom, offx, offy });

  function onPick(f: File | null) {
    setErr(null);
    setFile(f);
    setZoom(1.0);
    setOffx(0.0);
    setOffy(0.0);
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
  // 크롭(zoom/offx/offy)·모양(SDF)을 서버 core 와 동일 수식으로 적용해 결과와 일치.
  const draw = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, PREVIEW, PREVIEW);
    if (!img) return;

    // 크롭 영역(원본 px) -> 캔버스로 forward 매핑(범위 밖은 투명 패딩).
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const cropSide = Math.min(nw, nh) / zoom;
    const left = ((nw - cropSide) / 2) * (1 + offx);
    const top = ((nh - cropSide) / 2) * (1 + offy);
    const ds = PREVIEW / cropSide; // 캔버스 px / 원본 px
    ctx.drawImage(img, -left * ds, -top * ds, nw * ds, nh * ds);

    // 둥근사각 SDF 알파(코어 shape_mask 와 동일 수식). d<0 내부, d>0 외부.
    const S = PREVIEW;
    const r = clamp(radius, 0, 0.5) * S;
    const half = S / 2;
    const c = (S - 1) / 2;
    const band = clamp(feather, 0, 0.5) * half;
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
  }, [img, radius, feather, zoom, offx, offy]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 휠 핸들러가 읽을 최신 뷰 상태를 ref 에 동기화(렌더 중 ref 쓰기 금지 회피).
  useEffect(() => {
    viewRef.current = { zoom, offx, offy };
  }, [zoom, offx, offy]);

  // 마우스 휠로 확대/축소(커서 위치 기준 — 스크롤한 지점이 고정되도록 offx/offy 보정).
  // React onWheel 은 passive 라 preventDefault 가 안 먹어 네이티브 비-passive 로 건다.
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv || !img) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom: z, offx: ox, offy: oy } = viewRef.current;
      const rect = cv.getBoundingClientRect();
      const sc = PREVIEW / rect.width; // client px -> 캔버스 px
      const cxp = (e.clientX - rect.left) * sc;
      const cyp = (e.clientY - rect.top) * sc;
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16; // 라인 단위 -> px 근사
      dy = clamp(dy, -120, 120);
      const nz = clamp(z * Math.exp(-dy * 0.0015), ZOOM_MIN, ZOOM_MAX); // 위로=확대
      if (nz === z) return;
      const nw = img.naturalWidth;
      const nh = img.naturalHeight;
      const base = Math.min(nw, nh);
      const cropOld = base / z;
      const cropNew = base / nz;
      // 커서 아래의 원본 점을 구해, 새 zoom 에서도 같은 화면 위치에 오도록 역산.
      const srcX = ((nw - cropOld) / 2) * (1 + ox) + (cxp * cropOld) / PREVIEW;
      const srcY = ((nh - cropOld) / 2) * (1 + oy) + (cyp * cropOld) / PREVIEW;
      const slackX = (nw - cropNew) / 2;
      const slackY = (nh - cropNew) / 2;
      setZoom(nz);
      setOffx(slackX > 0.5 ? clamp((srcX - (cxp * cropNew) / PREVIEW) / slackX - 1, -1, 1) : 0);
      setOffy(slackY > 0.5 ? clamp((srcY - (cyp * cropNew) / PREVIEW) / slackY - 1, -1, 1) : 0);
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    return () => cv.removeEventListener("wheel", onWheel);
  }, [img]);

  // 미리보기 드래그 -> 위치(offx/offy). 슬랙(여유)이 있는 축에서만 동작.
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current || !img) return;
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    const scale = PREVIEW / rect.width; // client px -> canvas px
    const dxc = (e.clientX - dragRef.current.x) * scale;
    const dyc = (e.clientY - dragRef.current.y) * scale;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const cropSide = Math.min(img.naturalWidth, img.naturalHeight) / zoom;
    const slackX = (img.naturalWidth - cropSide) / 2;
    const slackY = (img.naturalHeight - cropSide) / 2;
    // 이미지를 포인터와 같이 끌면 crop 은 반대로 이동 -> left/top 감소.
    if (slackX > 0.5) setOffx((v) => clamp(v + (-dxc * (cropSide / PREVIEW)) / slackX, -1, 1));
    if (slackY > 0.5) setOffy((v) => clamp(v + (-dyc * (cropSide / PREVIEW)) / slackY, -1, 1));
  }
  function onPointerUp() {
    dragRef.current = null;
  }

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
      fd.append("zoom", String(zoom));
      fd.append("offx", String(offx));
      fd.append("offy", String(offy));
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

  // 화질 경고: 가장 큰 해상도보다 잘라낼 원본 영역이 작으면 업스케일 발생.
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const cropSidePx = img ? Math.round(Math.min(img.naturalWidth, img.naturalHeight) / zoom) : 0;
  const lowQuality = img !== null && cropSidePx > 0 && cropSidePx < maxSize;
  const canPan =
    img !== null && Math.min(img.naturalWidth, img.naturalHeight) / zoom < Math.max(img.naturalWidth, img.naturalHeight);

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
                파일 선택 · 드래그&드롭 · 붙여넣기. 정사각으로 잘라 변환합니다.
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

            {/* 확대/위치 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-tight">확대 · 위치</h2>
                <button
                  onClick={() => {
                    setZoom(1);
                    setOffx(0);
                    setOffy(0);
                  }}
                  className="text-xs rounded-lg border border-border px-2 py-0.5 active:scale-95 transition-transform"
                >
                  1:1 초기화
                </button>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>확대</span>
                <span className="tabular-nums">{zoom.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={0.05}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted-foreground">
                {img
                  ? canPan
                    ? "미리보기에서 스크롤로 확대 · 드래그로 위치 이동."
                    : "미리보기에서 스크롤로 확대(확대하면 드래그로 위치 이동)."
                  : "이미지를 올리면 확대·위치를 조절할 수 있습니다."}
              </p>
              {lowQuality && (
                <p className="text-xs text-destructive">
                  ⚠ 원본이 작아 이 확대에서는 화질이 떨어질 수 있습니다(잘라낼 영역 {cropSidePx}px &lt;{" "}
                  {maxSize}px).
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
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  className={`max-w-full h-auto touch-none ${canPan ? "cursor-grab active:cursor-grabbing" : ""}`}
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
              {img && `원본 ${img.naturalWidth}×${img.naturalHeight} · `}
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
