"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type MoneyItem = {
  id: string;
  value: number;
  label: string;
  image: string;
  type: "coin" | "bill";
};

const MONEY: MoneyItem[] = [
  { id: "coin-005", value: 5, label: "5¢", image: "/money/coin-005.png", type: "coin" },
  { id: "coin-010", value: 10, label: "10¢", image: "/money/coin-010.png", type: "coin" },
  { id: "coin-020", value: 20, label: "20¢", image: "/money/coin-020.png", type: "coin" },
  { id: "coin-050", value: 50, label: "50¢", image: "/money/coin-050.png", type: "coin" },
  { id: "coin-1", value: 100, label: "$1", image: "/money/coin-1.png", type: "coin" },
  { id: "coin-2", value: 200, label: "$2", image: "/money/coin-2.png", type: "coin" },
  { id: "coin-5", value: 500, label: "$5", image: "/money/coin-5.png", type: "coin" },
  { id: "coin-10", value: 1000, label: "$10", image: "/money/coin-10.png", type: "coin" },
  { id: "coin-20", value: 2000, label: "$20", image: "/money/coin-20.png", type: "coin" },
  { id: "bill-20", value: 2000, label: "$20", image: "/money/bill-20.png", type: "bill" },
  { id: "bill-50", value: 5000, label: "$50", image: "/money/bill-50.png", type: "bill" },
  { id: "bill-100", value: 10000, label: "$100", image: "/money/bill-100.png", type: "bill" },
  { id: "bill-200", value: 20000, label: "$200", image: "/money/bill-200.png", type: "bill" },
  { id: "bill-500", value: 50000, label: "$500", image: "/money/bill-500.png", type: "bill" },
  { id: "bill-1000", value: 100000, label: "$1,000", image: "/money/bill-1000.png", type: "bill" },
];

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
        <button className={confirmClear ? "confirm" : ""} onClick={clear} disabled={!totalPieces}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" /></svg>
          {confirmClear ? "¿Confirmar?" : "Limpiar"}
        </button>
      </footer>

      <p className="source-note">Imágenes de referencia: Banco de México · Los datos se guardan únicamente en este dispositivo.</p>
    </main>
  );
}
