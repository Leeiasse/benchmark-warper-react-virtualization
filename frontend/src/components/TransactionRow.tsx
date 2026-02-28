import React from "react";
import type { Transaction } from "../types/transaction";

interface TransactionRowProps {
  transaction: Transaction;
  style: React.CSSProperties;
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#22c55e",
  pending: "#eab308",
  failed: "#ef4444",
  refunded: "#8b5cf6",
  processing: "#3b82f6",
};

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const TransactionRow = React.memo(function TransactionRow({
  transaction: tx,
  style,
}: TransactionRowProps) {
  return (
    <div className="tx-row" style={style}>
      <span className="tx-id">{tx.id}</span>
      <span className="tx-ref">{tx.reference}</span>
      <span className="tx-amount">{formatAmount(tx.amount, tx.currency)}</span>
      <span
        className="tx-status"
        style={{ color: STATUS_COLORS[tx.status] || "#888" }}
      >
        {tx.status}
      </span>
      <span className="tx-merchant">{tx.merchant}</span>
      <span className="tx-category">{tx.category}</span>
      <span className="tx-date">{formatDate(tx.created_at)}</span>
    </div>
  );
});
