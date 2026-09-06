import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 도구 페이지는 /studio 영역으로 분리됨 — 옛 경로(북마크·외부 링크)는 영구 리다이렉트.
  // 안정화·화질·연출은 영상 스튜디오(/studio/video) 한 화면으로 통합.
  async redirects() {
    const video = ["stabilize", "enhance", "showcase"];
    return [
      ...video.map((p) => ({ source: `/${p}`, destination: "/studio/video", permanent: true })),
      ...video.map((p) => ({ source: `/studio/${p}`, destination: "/studio/video", permanent: true })),
      { source: "/ico", destination: "/studio/ico", permanent: true },
    ];
  },
};

export default nextConfig;
