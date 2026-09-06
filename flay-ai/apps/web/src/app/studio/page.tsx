import { redirect } from "next/navigation";

/** 스튜디오 진입점 — 대표 도구로 이동한다. */
export default function StudioIndex() {
  redirect("/studio/video");
}
