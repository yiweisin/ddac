"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Stock } from "@/types/stock";
import { getStocks, getStockPrices, getStockHistory } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function StocksList() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [yesterdayPrices, setYesterdayPrices] = useState<
    Record<number, number>
  >({});
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  }>({
    key: "symbol",
    direction: "ascending",
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getStocks();
        setStocks(data);
        const yesterdayData: Record<number, number> = {};
        for (const stock of data) {
          try {
            const history = await getStockHistory(stock.id);
            if (history.length >= 2) {
              yesterdayData[stock.id] = history[1].price;
            }
          } catch (err) {
            console.error(
              `Failed to fetch history for stock ${stock.id}:`,
              err
            );
          }
        }
        setYesterdayPrices(yesterdayData);
      } catch (err) {
        setError("Failed to fetch stocks");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStocks();

    const timer = setInterval(() => {
      setRefreshCounter((prev) => prev + 1);
    }, 500);

    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (refreshCounter > 0) {
      const updatePrices = async () => {
        try {
          const stockPrices = await getStockPrices();

          setStocks((prevStocks) =>
            prevStocks.map((stock) => {
              const updatedPrice = stockPrices.find((sp) => sp.id === stock.id);
              if (updatedPrice) {
                return {
                  ...stock,
                  price: updatedPrice.price,
                };
              }
              return stock;
            })
          );
        } catch (err) {
          console.error("Failed to update prices:", err);
        }
      };

      updatePrices();
    }
  }, [refreshCounter]);

  const calculateDailyChange = useCallback(
    (stock: Stock) => {
      const yesterdayPrice = yesterdayPrices[stock.id];
      if (!yesterdayPrice) return { value: 0, percentage: 0 };

      const change = stock.price - yesterdayPrice;
      const percentage = (change / yesterdayPrice) * 100;

      return {
        value: change,
        percentage: percentage,
      };
    },
    [yesterdayPrices]
  );

  const getChangeClass = (change: number) => {
    if (change > 0) return "text-emerald-600";
    if (change < 0) return "text-rose-600";
    return "text-slate-500";
  };

  const handleStockClick = (stockId: number) => {
    router.push(`/stocks/${stockId}`);
  };

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedStocks = React.useMemo(() => {
    const sortableStocks = [...filteredStocks];
    if (sortConfig.key) {
      sortableStocks.sort((a, b) => {
        if (sortConfig.key === "daily") {
          const changeA = calculateDailyChange(a).percentage;
          const changeB = calculateDailyChange(b).percentage;
          if (changeA < changeB) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          if (changeA > changeB) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        } else {
          // @ts-expect-error Dynamic property access
          if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === "ascending" ? -1 : 1;
          }
          // @ts-expect-error Dynamic property access
          if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === "ascending" ? 1 : -1;
          }
          return 0;
        }
      });
    }
    return sortableStocks;
    // Since calculateDailyChange uses yesterdayPrices internally, we don't need to include both
  }, [filteredStocks, sortConfig, calculateDailyChange]);

  const getSortDirectionIndicator = (columnName: string) => {
    if (sortConfig.key !== columnName) {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1 text-slate-400 opacity-0 group-hover:opacity-100"
        >
          <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
        </svg>
      );
    }

    return sortConfig.direction === "ascending" ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-1 text-slate-700"
      >
        <path d="M18 15l-6-6-6 6" />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="ml-1 text-slate-700"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    );
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading stocks...</p>
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
          <h3 className="text-lg font-semibold mb-2">Error Loading Stocks</h3>
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
            <h1 className="text-2xl font-bold">Market Overview</h1>
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

          {/* Search Bar */}
          <div className="mt-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by symbol or company name..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full py-3 px-4 pr-10 bg-white/10 backdrop-blur-sm border border-slate-600/50 rounded-lg text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-12 top-1/2 transform -translate-y-1/2 text-slate-300 hover:text-white"
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
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </button>
              )}
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-300">
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
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr className="bg-slate-50">
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer group"
                  onClick={() => requestSort("symbol")}
                >
                  <div className="flex items-center">
                    Symbol
                    {getSortDirectionIndicator("symbol")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-left text-sm font-semibold text-slate-700 cursor-pointer group"
                  onClick={() => requestSort("name")}
                >
                  <div className="flex items-center">
                    Company
                    {getSortDirectionIndicator("name")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-sm font-semibold text-slate-700 cursor-pointer group"
                  onClick={() => requestSort("price")}
                >
                  <div className="flex items-center justify-end">
                    Price
                    {getSortDirectionIndicator("price")}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-right text-sm font-semibold text-slate-700 cursor-pointer group"
                  onClick={() => requestSort("daily")}
                >
                  <div className="flex items-center justify-end">
                    Daily Change
                    {getSortDirectionIndicator("daily")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {sortedStocks.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-slate-500"
                  >
                    {searchTerm
                      ? `No stocks found matching "${searchTerm}"`
                      : "No stocks available."}
                  </td>
                </tr>
              ) : (
                sortedStocks.map((stock) => {
                  const change = calculateDailyChange(stock);
                  const changeClass = getChangeClass(change.value);
                  return (
                    <tr
                      key={stock.id}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => handleStockClick(stock.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">
                          {stock.symbol}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-700">{stock.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="font-medium text-slate-800">
                          ${stock.price.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`font-medium ${changeClass}`}>
                          {change.value > 0 ? "+" : ""}
                          {change.value.toFixed(2)} (
                          {change.value > 0 ? "+" : ""}
                          {change.percentage.toFixed(2)}%)
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
