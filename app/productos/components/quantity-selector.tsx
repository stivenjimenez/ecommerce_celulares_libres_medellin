"use client";

import styles from "../product-detail.module.css";

type Props = {
  value: number;
  onChange: (nextValue: number) => void;
  min?: number;
  max?: number;
};

export function QuantitySelector({ value, onChange, min = 1, max = 99 }: Props) {
  const safeValue = Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : min;

  function update(nextValue: number) {
    onChange(Math.min(max, Math.max(min, Math.trunc(nextValue))));
  }

  return (
    <div className={styles.quantitySelector} aria-label="Selector de cantidad">
      <button
        type="button"
        className={styles.qtyButton}
        onClick={() => update(safeValue - 1)}
        disabled={safeValue <= min}
        aria-label="Disminuir cantidad"
      >
        -
      </button>

      <input
        type="number"
        min={min}
        max={max}
        step={1}
        inputMode="numeric"
        value={safeValue}
        onChange={(event) => update(Number(event.target.value))}
        className={styles.qtyInput}
        aria-label="Cantidad de productos"
      />

      <button
        type="button"
        className={styles.qtyButton}
        onClick={() => update(safeValue + 1)}
        disabled={safeValue >= max}
        aria-label="Aumentar cantidad"
      >
        +
      </button>
    </div>
  );
}
