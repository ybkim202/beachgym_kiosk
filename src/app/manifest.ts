import type { MetadataRoute } from "next";

/** PWA 매니페스트 — '설치' 시 탭·주소창 없는 전체화면 앱처럼 실행 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ILSAN BEACH GYM 키오스크",
    short_name: "BEACH GYM",
    description: "일산비치짐 · 해파랑 웰니스파크 무인 키오스크",
    start_url: "/kiosk",
    scope: "/kiosk",
    display: "fullscreen",
    orientation: "landscape",
    background_color: "#fefefe",
    theme_color: "#437eba",
    icons: [
      {
        src: "/kiosk/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
