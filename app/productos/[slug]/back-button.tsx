"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

type Props = {
  className?: string;
};

export function BackButton({ className }: Props) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/productos");
  }

  return (
    <button type="button" className={className} onClick={handleBack}>
      <ArrowLeft /> Volver atrás
    </button>
  );
}
