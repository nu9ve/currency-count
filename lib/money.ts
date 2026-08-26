export type MoneyItem = {
  id: string;
  value: number;
  label: string;
  image: string;
  type: "coin" | "bill";
};

export const MONEY: MoneyItem[] = [
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
