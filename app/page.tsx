"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { MONEY, type MoneyItem } from "../lib/money";

const STORAGE_KEY = "cuenta-pesos-v1";
const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

function MoneyCard({ item, count, onAdd, onSubtract }: {
  item: MoneyItem;
  count: number;
  onAdd: (amount: number) => void;
  onSubtract: () => void;
}) {
  const subtotal = (item.value * count) / 100;

  return (
    <article className={`money-card ${item.type} ${count ? "active" : ""}`}>
      <button className="money-main" onClick={() => onAdd(1)} aria-label={`Agregar un ${item.type === "coin" ? "moneda" : "billete"} de ${item.label}`}>
        <span className="money-picture">
          <Image src={item.image} alt={`${item.type === "coin" ? "Moneda" : "Billete"} mexicano de ${item.label}`} fill sizes={item.type === "coin" ? "72px" : "160px"} priority={item.value >= 20000} />
        </span>
        <span className="money-info">
          <strong>{item.label}</strong>
          <small>{count ? pesos.format(subtotal) : "Toca para sumar"}</small>
        </span>
      </button>
      <div className="count-control">
        <button className="minus" onClick={onSubtract} disabled={!count} aria-label={`Quitar un ${item.label}`}>−</button>
        <span className="count" aria-label={`${count} piezas`}>{count}</span>
        <button className="times-ten" onClick={() => onAdd(10)} aria-label={`Agregar diez de ${item.label}`}>×10</button>
      </div>
    </article>
  );
}

export default function Home() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [exportState, setExportState] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) setCounts(JSON.parse(saved));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      setLoaded(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
  }, [counts, loaded]);

  const { totalCents, totalPieces, coinPieces, billPieces } = useMemo(() => MONEY.reduce(
    (totals, item) => {
      const count = counts[item.id] || 0;
      totals.totalCents += item.value * count;
      totals.totalPieces += count;
      if (item.type === "coin") totals.coinPieces += count;
      else totals.billPieces += count;
      return totals;
    },
    { totalCents: 0, totalPieces: 0, coinPieces: 0, billPieces: 0 },
  ), [counts]);

  const update = (id: string, change: number) => {
    setCounts((current) => ({ ...current, [id]: Math.max(0, (current[id] || 0) + change) }));
    setConfirmClear(false);
  };

  const clear = () => {
    if (!confirmClear && totalPieces) {
      setConfirmClear(true);
      window.setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setCounts({});
    setConfirmClear(false);
  };

  const exportDailyCut = async () => {
    if (!totalPieces || exportState === "loading") return;
    setExportState("loading");

    try {
      const now = new Date();
      const localDate = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      const response = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counts,
          generatedAt: now.toISOString(),
          localDate,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!response.ok) throw new Error("No se pudo generar el archivo");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `corte-pesos-${localDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportState("success");
      window.setTimeout(() => setExportState("idle"), 2200);
    } catch {
      setExportState("error");
      window.setTimeout(() => setExportState("idle"), 3000);
    }
  };

  const bills = MONEY.filter((item) => item.type === "bill").sort((a, b) => b.value - a.value);
  const coins = MONEY.filter((item) => item.type === "coin").sort((a, b) => b.value - a.value);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">$</div>
        <div>
          <p>CAJA RÁPIDA</p>
          <h1>Cuenta Pesos</h1>
        </div>
        <span className="saved"><i /> Guardado local</span>
      </header>

      <section className="total-card" aria-live="polite">
        <div>
          <p>Total contado</p>
          <strong>{pesos.format(totalCents / 100)}</strong>
          <span>MXN</span>
        </div>
        <div className="piece-summary">
          <span><b>{totalPieces}</b> piezas</span>
          <span>{billPieces} billetes · {coinPieces} monedas</span>
        </div>
      </section>

      <section className="money-section bills-section">
        <div className="section-heading">
          <h2>Billetes</h2>
          <span>Familia G</span>
        </div>
        <div className="money-grid bills-grid">
          {bills.map((item) => <MoneyCard key={item.id} item={item} count={counts[item.id] || 0} onAdd={(n) => update(item.id, n)} onSubtract={() => update(item.id, -1)} />)}
        </div>
      </section>

      <section className="money-section coins-section">
        <div className="section-heading">
          <h2>Monedas</h2>
          <span>9 denominaciones</span>
        </div>
        <div className="money-grid coins-grid">
          {coins.map((item) => <MoneyCard key={item.id} item={item} count={counts[item.id] || 0} onAdd={(n) => update(item.id, n)} onSubtract={() => update(item.id, -1)} />)}
        </div>
      </section>

      <footer className="action-bar">
        <div>
          <span>Total de sesión</span>
          <strong>{pesos.format(totalCents / 100)}</strong>
        </div>
        <div className="footer-actions">
          <button className={`export-button ${exportState}`} onClick={exportDailyCut} disabled={!totalPieces || exportState === "loading"}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 20h14" /></svg>
            {exportState === "loading" ? "Generando…" : exportState === "success" ? "¡Descargado!" : exportState === "error" ? "Reintentar" : "Exportar Excel"}
          </button>
          <button className={`clear-button ${confirmClear ? "confirm" : ""}`} onClick={clear} disabled={!totalPieces}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>
            {confirmClear ? "¿Confirmar?" : "Limpiar"}
          </button>
        </div>
      </footer>

      <p className="source-note">Imágenes de referencia: Banco de México · Los datos se guardan únicamente en este dispositivo.</p>
    </main>
  );
}
