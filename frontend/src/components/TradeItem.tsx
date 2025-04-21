"use client";

import React from "react";
import { Trade } from "../types/trade";

interface TradeItemProps {
  trade: Trade;
  onSell: (id: number, pnl: number) => void;
  onDelete: (id: number) => void;
}

export default function TradeItem({ trade, onSell, onDelete }: TradeItemProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const pnl =
    trade.isHolding && trade.currentPrice
      ? ((trade.currentPrice - trade.entryPrice) * 100) / 100
      : trade.pnl;

  const pnlDisplay = pnl.toFixed(2);
  const pnlClass = pnl >= 0 ? "text-emerald-600" : "text-rose-600";

  const percentChange =
    trade.isHolding && trade.currentPrice
      ? ((trade.currentPrice - trade.entryPrice) / trade.entryPrice) * 100
      : (trade.pnl / trade.entryPrice) * 100;

  const percentChangeDisplay = percentChange.toFixed(2);
  const percentChangeSign = percentChange >= 0 ? "+" : "";

  const handleSell = async () => {
    if (trade.isHolding && trade.currentPrice) {
      await onSell(trade.id, pnl);
    }
  };

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="font-medium text-slate-800">{trade.stockSymbol}</div>
        <div className="text-sm text-slate-500">{trade.stockName}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="font-medium text-slate-700">
          ${trade.entryPrice.toFixed(2)}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right">
        {trade.isHolding && trade.currentPrice ? (
          <div className="font-medium text-slate-800">
            ${trade.currentPrice.toFixed(2)}
          </div>
        ) : (
          <div className="text-slate-400">—</div>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className={`font-medium ${pnlClass}`}>
          {pnl >= 0 ? "+" : ""}
          {pnlDisplay}
          <span className="text-xs ml-1">
            ({percentChangeSign}
            {percentChangeDisplay}%)
          </span>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-slate-600">{formatDate(trade.date)}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            trade.isHolding
              ? "bg-indigo-100 text-indigo-800"
              : "bg-slate-100 text-slate-800"
          }`}
        >
          {trade.isHolding ? "Active" : "Closed"}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-center">
        <div className="flex justify-center space-x-2">
          {trade.isHolding ? (
            <button
              onClick={handleSell}
              className="px-3 py-1.5 text-xs bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors shadow-sm flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
              Sell
            </button>
          ) : (
            <button
              onClick={() => onDelete(trade.id)}
              className="px-3 py-1.5 text-xs bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors shadow-sm flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              Delete
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}
