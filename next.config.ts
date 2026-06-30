import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 도메인.kr/kiosk 서브패스로 서빙 (멀티존). 모든 페이지·정적자산이 /kiosk 아래로.
  basePath: "/kiosk",
};

export default nextConfig;
