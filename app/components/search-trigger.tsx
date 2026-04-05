"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

import styles from "./search-trigger.module.css";

export function SearchTrigger() {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={() => router.push("/search")}
      aria-label="Ir a búsqueda de productos"
    >
      <Search className={styles.triggerIcon} />
      <span className={styles.triggerText}>Buscar productos...</span>
    </button>
  );
}
