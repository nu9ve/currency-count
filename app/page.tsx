"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { MONEY, type MoneyItem } from "../lib/money";

const STORAGE_KEY = "cuenta-pesos-v1";
const THEME_STORAGE_KEY = "cuenta-pesos-theme-v1";
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
          {item.type === "bill" && (
            <Image
              className="money-image-backdrop"
              src={item.image}
              alt=""
              fill
              sizes="(max-width: 620px) 48vw, 360px"
              aria-hidden="true"
            />
          )}
          <Image
            className="money-image"
            src={item.image}
            alt={`${item.type === "coin" ? "Moneda" : "Billete"} mexicano de ${item.label}`}
            fill
            sizes={item.type === "coin" ? "(max-width: 620px) 22vw, 72px" : "(max-width: 620px) 48vw, 360px"}
            priority={item.value >= 20000}
          />
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
  const [dark, setDark] = useState(false);
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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        setDark(window.localStorage.getItem(THEME_STORAGE_KEY) === "dark");
      } catch {
        setDark(false);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // El tema sigue funcionando aunque el navegador bloquee el almacenamiento local.
    }
  }, [dark]);

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
    <main className="app-shell" id="inicio">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Cuenta Pesos, herramienta de Vanily">
          <Image
            className="brand-logo"
            src={dark ? "/brand/logo-dorado.png" : "/brand/logo-vino.png"}
            width={140}
            height={87}
            alt="Vanily"
            priority
          />
          <span className="brand-divider" aria-hidden="true" />
          <span className="brand-copy">
            <small>Herramienta gratuita de</small>
            <strong>Cuenta Pesos</strong>
          </span>
        </a>
        <nav className="topbar-nav" aria-label="Secciones del contador">
          <a href="#billetes">Billetes</a>
          <a href="#monedas">Monedas</a>
        </nav>
        <div className="topbar-actions">
          <span className="saved"><i /> Guardado local</span>
          <button
            className="theme-switch"
            type="button"
            onClick={() => setDark((value) => !value)}
            aria-label={dark ? "Activar tema claro" : "Activar tema oscuro"}
            title={dark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          >
            <span aria-hidden="true">{dark ? "☀" : "☾"}</span>
          </button>
        </div>
      </header>

      <section className="total-card" aria-live="polite">
        <div>
          <p className="total-kicker">Vanily · control de caja</p>
          <span className="total-label">Total contado</span>
          <strong>{pesos.format(totalCents / 100)}</strong>
          <span>MXN</span>
        </div>
        <div className="piece-summary">
          <span><b>{totalPieces}</b> piezas</span>
          <span>{billPieces} billetes · {coinPieces} monedas</span>
        </div>
      </section>

      <section className="money-section bills-section" id="billetes">
        <div className="section-heading">
          <h2>Billetes</h2>
          <span>Familia G</span>
        </div>
        <div className="money-grid bills-grid">
          {bills.map((item) => <MoneyCard key={item.id} item={item} count={counts[item.id] || 0} onAdd={(n) => update(item.id, n)} onSubtract={() => update(item.id, -1)} />)}
        </div>
      </section>

      <section className="money-section coins-section" id="monedas">
        <div className="section-heading">
          <h2>Monedas</h2>
          <span>9 denominaciones</span>
        </div>
        <div className="money-grid coins-grid">
          {coins.map((item) => <MoneyCard key={item.id} item={item} count={counts[item.id] || 0} onAdd={(n) => update(item.id, n)} onSubtract={() => update(item.id, -1)} />)}
        </div>
      </section>

      <div className="action-bar" role="region" aria-label="Acciones de sesión">
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
      </div>

      <p className="source-note">Imágenes de referencia: Banco de México · Los datos se guardan únicamente en este dispositivo.</p>

      <footer className="site-footer">
        <div className="footer-copy">
          <span className="footer-kicker">Una herramienta abierta para cualquier negocio</span>
          <p>Cuenta Pesos te ayuda a cerrar tu caja en segundos. Gratis, simple y con el sello de Vanily.</p>
        </div>
        <div className="footer-credit">
          <span>Diseñado y desarrollado por</span>
          <Image
            src={dark ? "/brand/nu9vexyz.png" : "/brand/nu9vexyz-black.png"}
            width={455}
            height={108}
            alt="Nu9ve"
          />
        </div>
        <div className="footer-bottom">
          <span>Cuenta Pesos · Vanily</span>
          <span>Hecho por Nu9ve</span>
        </div>
      </footer>
    </main>
  );
}
