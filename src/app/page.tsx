"use client";

import dynamic from "next/dynamic";

// 옷장은 이 브라우저에 저장되므로 서버에서는 그리지 않는다.
const Closet = dynamic(() => import("@/components/Closet"), { ssr: false });

export default function Home() {
  return <Closet />;
}
