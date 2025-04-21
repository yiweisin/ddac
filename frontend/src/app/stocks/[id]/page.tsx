"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getStock,
  getStockHistory,
  getStockPrices,
  createTrade,
} from "@/lib/api";
import { Stock } from "@/types/stock";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function StockDetailPage() {
  // CSS for animations
  const animationStyles = `
    @keyframes fade-in {
      from { opacity: 0; transform: translate(-50%, -20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    .animate-fade-in {
      animation: fade-in 0.3s ease-out forwards;
    }
  `;

  const params = useParams();
  const router = useRouter();
  const stockId = Number(params.id);

  const [stock, setStock] = useState<Stock | null>(null);
  const [priceHistory, setPriceHistory] = useState<
    { date: string; price: number }[]
  >([]);
  const [weeklyChange, setWeeklyChange] = useState<number | null>(null);
  const [threeDayChange, setThreeDayChange] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [timeRange, setTimeRange] = useState<"1W" | "1M" | "3M" | "1Y" | "ALL">(
    "1M"
  );
  const [showBuySuccess, setShowBuySuccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Initial data load
  useEffect(() => {
    const fetchStockData = async () => {
      if (!stockId || isNaN(stockId)) {
        setError("Invalid stock ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch stock details using existing getStock function
        const stockData = await getStock(stockId);
        setStock(stockData);

        // Fetch price history
        const history = await getStockHistory(stockId);
        // Sort history in ascending order (oldest first)
        const sortedHistory = history.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        setPriceHistory(sortedHistory);

        // Calculate percentage changes
        calculatePercentageChanges(sortedHistory);
      } catch (err) {
        console.error("Failed to fetch stock data:", err);
        setError("Failed to load stock information");
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();

    // Start auto-refresh timer - using same speed as StocksList (500ms)
    const timer = setInterval(() => {
      setRefreshCounter((prev) => prev + 1);
    }, 500);

    return () => clearInterval(timer);
  }, [stockId]);

  // Calculate percentage changes based on the price history
  const calculatePercentageChanges = (
    history: { date: string; price: number }[]
  ) => {
    if (!history || history.length < 4) {
      // Need at least 4 data points for weekly change (assuming daily data)
      setWeeklyChange(null);
      setThreeDayChange(null);
      return;
    }

    const currentPrice = history[history.length - 1].price;

    // Calculate 3-day change
    const threeDaysAgoIndex = Math.max(0, history.length - 4);
    const threeDaysAgoPrice = history[threeDaysAgoIndex].price;
    const threeDayChangePercent =
      ((currentPrice - threeDaysAgoPrice) / threeDaysAgoPrice) * 100;
    setThreeDayChange(threeDayChangePercent);

    // Calculate weekly change (7 days)
    const weekAgoIndex = Math.max(0, history.length - 8);
    const weekAgoPrice = history[weekAgoIndex].price;
    const weeklyChangePercent =
      ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100;
    setWeeklyChange(weeklyChangePercent);
  };

  // Auto-refresh stock price
  useEffect(() => {
    if (refreshCounter > 0 && stock) {
      const updatePrice = async () => {
        try {
          const stockPrices = await getStockPrices();
          const updatedPrice = stockPrices.find((sp) => sp.id === stockId);

          if (updatedPrice) {
            setStock((prevStock) => {
              if (!prevStock) return null;
              return {
                ...prevStock,
                price: updatedPrice.price,
              };
            });

            // Also update percentage changes when price updates
            if (priceHistory.length > 0) {
              const updatedHistory = [...priceHistory];
              // Update the latest history point or add a new one
              // This depends on your implementation, here we're just recalculating
              calculatePercentageChanges(updatedHistory);
            }
          }
        } catch (err) {
          console.error("Failed to update price:", err);
        }
      };

      updatePrice();
    }
  }, [refreshCounter, stockId, stock, priceHistory]);

  const handleBack = () => {
    router.back();
  };

  const handleBuyStock = async () => {
    setIsPurchasing(true);
    try {
      if (stock)
        await createTrade({
          stockId,
          entryPrice: stock.price,
          isHolding: true,
        });
      setIsPurchasing(false);
      setShowBuySuccess(true);
    } catch (err) {
      setError("Failed to add trade");
      console.error(err);
    }
  };

  const renderPercentageChange = (value: number | null) => {
    if (value === null) return <span className="text-gray-400">N/A</span>;

    const isPositive = value >= 0;
    const colorClass = isPositive ? "text-emerald-600" : "text-rose-600";
    const sign = isPositive ? "+" : "";

    return (
      <span className={`font-semibold ${colorClass}`}>
        {sign}
        {value.toFixed(2)}%
      </span>
    );
  };

  const getFilteredChartData = () => {
    if (priceHistory.length === 0) return [];

    const now = new Date();
    let cutoffDate = new Date();

    switch (timeRange) {
      case "1W":
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case "1M":
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case "3M":
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case "1Y":
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      case "ALL":
      default:
        cutoffDate = new Date(0);
    }

    const allData = priceHistory.map((item) => {
      const dateObj = new Date(item.date);
      return {
        fullDate: dateObj,
        date: item.date,
        price: item.price,
      };
    });

    return allData
      .filter((item) => item.fullDate >= cutoffDate)
      .sort((a, b) => a.fullDate.getTime() - b.fullDate.getTime());
  };

  const filteredChartData = getFilteredChartData();

  const minPrice =
    filteredChartData.length > 0
      ? Math.min(...filteredChartData.map((d) => d.price)) * 0.98
      : 0;

  const maxPrice =
    filteredChartData.length > 0
      ? Math.max(...filteredChartData.map((d) => d.price)) * 1.02
      : 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">
            Loading stock information...
          </p>
        </div>
      </div>
    );
  }

  if (error || !stock) {
    return (
      <div className="max-w-7xl mx-auto my-8 px-6">
        <button
          onClick={handleBack}
          className="mb-4 px-5 py-2.5 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors font-medium flex items-center"
        >
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
            className="mr-2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to Stocks
        </button>
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
          <h3 className="text-lg font-semibold mb-2">Error Loading Stock</h3>
          <p>{error || "Stock not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-8 px-6">
      {/* Inject animation styles */}
      <style>{animationStyles}</style>

      {/* Success Alert */}
      {showBuySuccess && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-white shadow-xl rounded-lg border border-emerald-100 p-4 flex items-center max-w-md animate-fade-in">
          <div className="bg-emerald-100 rounded-full p-2 mr-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">
              Purchase Successful!
            </h3>
            <p className="text-sm text-slate-600">
              You&apos;ve successfully purchased {stock.symbol} shares.
            </p>
          </div>
          <button
            onClick={() => setShowBuySuccess(false)}
            className="ml-4 text-slate-400 hover:text-slate-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      <button
        onClick={handleBack}
        className="mb-6 px-5 py-2.5 bg-slate-700 text-white rounded-md hover:bg-slate-800 transition-colors font-medium flex items-center"
      >
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
          className="mr-2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Stocks
      </button>

      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Header with company information and auto-refresh indicator */}
        <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-7 text-white">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center">
                <h1 className="text-3xl font-bold">{stock.symbol}</h1>
                <span className="mx-3 text-slate-400">|</span>
                <h2 className="text-2xl font-medium text-slate-100">
                  {stock.name}
                </h2>
              </div>
              <div className="mt-5 flex items-baseline">
                <span className="text-4xl font-bold">
                  ${stock.price.toFixed(2)}
                </span>

                {/* Percentage Changes */}
                <div className="ml-4 flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 uppercase font-medium">
                      3D
                    </span>
                    <div className="text-base">
                      {renderPercentageChange(threeDayChange)}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-300 uppercase font-medium">
                      7D
                    </span>
                    <div className="text-base">
                      {renderPercentageChange(weeklyChange)}
                    </div>
                  </div>
                </div>
              </div>

              {/* One-Click Buy Button */}
              <button
                onClick={handleBuyStock}
                disabled={isPurchasing}
                className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPurchasing ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      ></path>
                    </svg>
                    Buy Now
                  </>
                )}
              </button>
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
        </div>

        {/* Chart Section */}
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-slate-800">
              Price History
            </h3>
            <div className="flex bg-slate-100 rounded-lg overflow-hidden">
              {["1W", "1M", "3M", "1Y", "ALL"].map((range) => (
                <button
                  key={range}
                  onClick={() =>
                    setTimeRange(range as "1W" | "1M" | "3M" | "1Y" | "ALL")
                  }
                  className={`px-4 py-1.5 text-sm font-medium ${
                    timeRange === range
                      ? "bg-slate-700 text-white"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {filteredChartData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredChartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 30,
                  }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#475569" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      if (timeRange === "1W" || timeRange === "1M") {
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        });
                      } else {
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          year: "2-digit",
                        });
                      }
                    }}
                  />
                  <YAxis
                    tick={{ fill: "#475569" }}
                    domain={[minPrice, maxPrice]}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                  />
                  <Tooltip
                    formatter={(value) => {
                      if (typeof value === "number") {
                        return [`$${value.toFixed(2)}`, "Price"];
                      }
                      return [`${value}`, "Price"];
                    }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderColor: "#e2e8f0",
                      borderRadius: "6px",
                      boxShadow:
                        "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                      padding: "12px",
                    }}
                  />
                  <ReferenceLine
                    y={stock.price}
                    stroke="#6366f1"
                    strokeDasharray="3 3"
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{
                      r: 6,
                      fill: "#047857",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 w-full flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-slate-500 font-medium">
                No price history available for the selected time range.
              </p>
            </div>
          )}
        </div>

        {/* Company Description and Additional Info */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
          <h3 className="text-xl font-semibold text-slate-800 mb-4">
            About {stock.name}
          </h3>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
            <p className="text-slate-700 leading-relaxed">
              {stock.description ||
                "No description available for this company."}
            </p>

            {/* Additional company details could go here */}
            <div className="grid grid-cols-2 gap-6 mt-8">
              <div className="border-l-4 border-indigo-500 pl-4">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Sector
                </p>
                <p className="text-slate-800 font-medium">Technology</p>
              </div>
              <div className="border-l-4 border-emerald-500 pl-4">
                <p className="text-xs text-slate-500 uppercase font-medium">
                  Exchange
                </p>
                <p className="text-slate-800 font-medium">NASDAQ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
