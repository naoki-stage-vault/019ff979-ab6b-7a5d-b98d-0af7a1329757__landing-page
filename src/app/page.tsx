"use client";

import dynamic from "next/dynamic";

const DoodleStudio = dynamic(() => import("@/components/DoodleStudio"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center text-sm text-[#787774]">
      Cargando Doodle Studio…
    </div>
  ),
});

export default function Page() {
  return <DoodleStudio />;
}
