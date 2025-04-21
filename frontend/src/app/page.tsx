"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Trade } from "../types/trade";
import { getTrades, getStocks, getStockPrices, sellTrade } from "../lib/api";
import TradeItem from "@/components/TradeItem";

// Define interfaces for API response types
interface StockPrice {
  id: number;
  price: number;
}

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [trades, setTrades] = useState<Trade[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [tradesData, , stockPrices] = await Promise.all([
        getTrades(),
        getStocks(),
        getStockPrices(),
      ]);

      setAllTrades(tradesData);

      const holdingTrades = tradesData.filter(
        (trade: Trade) => trade.isHolding
      );

      const tradesWithCurrentPrices = holdingTrades.map((trade: Trade) => {
        const stockPrice = stockPrices.find(
          (sp: StockPrice) => sp.id === trade.stockId
        );
        if (stockPrice) {
          return {
            ...trade,
            currentPrice: stockPrice.price,
          };
        }
        return trade;
      });

      setTrades(tradesWithCurrentPrices);
    } catch (err) {
      setError("Failed to fetch data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [fetchData, user]);

  useEffect(() => {
    if (!user) return;

    const timer = setInterval(() => {
      setRefreshCounter((prev) => prev + 1);
    }, 500);

    return () => clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (refreshCounter > 0 && user) {
      const updatePrices = async () => {
        try {
          const stockPrices = await getStockPrices();

          setTrades((prevTrades) =>
            prevTrades.map((trade) => {
              const stockPrice = stockPrices.find(
                (sp: StockPrice) => sp.id === trade.stockId
              );
              if (stockPrice) {
                return {
                  ...trade,
                  currentPrice: stockPrice.price,
                };
              }
              return trade;
            })
          );
        } catch (err) {
          console.error("Failed to update prices:", err);
        }
      };

      updatePrices();
    }
  }, [refreshCounter, user]);

  const handleSellTrade = async (id: number, pnl: number) => {
    try {
      await sellTrade(id, pnl);
      fetchData();
    } catch (err) {
      setError("Failed to sell trade");
      console.error(err);
    }
  };

  const activePositions = trades.length;
  const totalPnL = allTrades.reduce((sum, trade) => {
    if (!trade.isHolding) {
      return sum + trade.pnl;
    }

    if (trade.isHolding) {
      const currentTrade = trades.find((t) => t.id === trade.id);
      if (currentTrade && currentTrade.currentPrice) {
        return sum + (currentTrade.currentPrice - trade.entryPrice);
      }
    }

    return sum;
  }, 0);

  const winningTrades = allTrades.filter((trade) => {
    if (!trade.isHolding) return trade.pnl > 0;

    const activeTrade = trades.find((t) => t.id === trade.id);
    return activeTrade && activeTrade.currentPrice
      ? activeTrade.currentPrice > trade.entryPrice
      : false;
  });

  const winRate =
    allTrades.length > 0 ? (winningTrades.length / allTrades.length) * 100 : 0;

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (loading && trades.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">
            Loading your portfolio...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto my-8 px-6">
        <div className="text-center py-8 px-4 bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-3 text-rose-500"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-8 px-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user.username}</h1>
              <p className="text-slate-300 mt-1">Your Portfolio Dashboard</p>
            </div>
            <div className="bg-slate-600/40 rounded-lg px-4 py-2 flex items-center">
              <div
                className={`h-2 w-2 rounded-full mr-2 ${
                  refreshCounter > 0
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-slate-400"
                }`}
              ></div>
              <span className="text-sm font-medium text-slate-200">
                {refreshCounter > 0 ? "Live Updates" : "Connecting..."}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="mr-4 bg-indigo-400/20 rounded-lg p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-indigo-300"
                  >
                    <rect
                      x="2"
                      y="3"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                    ></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-slate-300 uppercase font-medium">
                    Active Positions
                  </span>
                  <p className="text-2xl font-bold mt-1">{activePositions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="mr-4 bg-emerald-400/20 rounded-lg p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={
                      totalPnL >= 0 ? "text-emerald-300" : "text-rose-300"
                    }
                  >
                    <line x1="12" y1="20" x2="12" y2="10"></line>
                    <line x1="18" y1="20" x2="18" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="16"></line>
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-slate-300 uppercase font-medium">
                    Total P&L
                  </span>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {totalPnL >= 0 ? "+" : ""}
                    {totalPnL.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="mr-4 bg-blue-400/20 rounded-lg p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-300"
                  >
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-slate-300 uppercase font-medium">
                    Win Rate
                  </span>
                  <p className="text-2xl font-bold mt-1">
                    {winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center">
                <div className="mr-4 bg-violet-400/20 rounded-lg p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-violet-300"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-slate-300 uppercase font-medium">
                    Total Trades
                  </span>
                  <p className="text-2xl font-bold mt-1">{allTrades.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Link
              href="/stocks"
              className="px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all flex items-center bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Buy Stock
            </Link>

            <Link
              href="/trades"
              className="px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Trade History
            </Link>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {/* Active Positions */}
          <div>
            <h2 className="text-xl font-semibold mb-6 text-slate-800 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 text-indigo-500"
              >
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              Active Positions
            </h2>

            {trades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mb-4 text-slate-400"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 15h8M9 9h.01M15 9h.01"></path>
                </svg>
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  No Active Positions
                </h3>
                <p className="text-slate-500 max-w-md">
                  You don&apos;t have any active positions at the moment. Click
                  the &quot;Buy Stock&quot; button to add your first position.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="bg-slate-50">
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Stock
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Entry Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Current Price
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        P&L
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {trades.map((trade) => (
                      <TradeItem
                        key={trade.id}
                        trade={trade}
                        onSell={handleSellTrade}
                        onDelete={() => {}}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
