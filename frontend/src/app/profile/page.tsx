"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { getTrades } from "../../lib/api";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState({
    username: "",
    tradesCount: 0,
    winRate: 0,
    avgPnlPerTrade: 0,
    totalPnL: 0,
    bestTrade: 0,
    worstTrade: 0,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      const fetchTradeStats = async () => {
        try {
          const trades = await getTrades();

          const totalTrades = trades.length;
          const winningTrades = trades.filter(
            (trade) =>
              trade.pnl > 0 ||
              (trade.isHolding &&
                trade.currentPrice &&
                trade.currentPrice > trade.entryPrice)
          );

          const winRate =
            totalTrades > 0
              ? ((winningTrades.length / totalTrades) * 100).toFixed(2)
              : 0;

          const totalPnL = trades.reduce((sum, trade) => {
            if (!trade.isHolding) return sum + trade.pnl;

            return trade.currentPrice
              ? sum + (trade.currentPrice - trade.entryPrice)
              : sum;
          }, 0);

          const avgPnlPerTrade =
            totalTrades > 0 ? Number((totalPnL / totalTrades).toFixed(2)) : 0;

          let bestTrade = 0;
          let worstTrade = 0;

          if (trades.length > 0) {
            bestTrade = Math.max(
              ...trades.map((trade) =>
                !trade.isHolding
                  ? trade.pnl
                  : trade.currentPrice
                  ? trade.currentPrice - trade.entryPrice
                  : 0
              )
            );

            worstTrade = Math.min(
              ...trades.map((trade) =>
                !trade.isHolding
                  ? trade.pnl
                  : trade.currentPrice
                  ? trade.currentPrice - trade.entryPrice
                  : 0
              )
            );
          }

          setProfileData({
            username: user.username,
            tradesCount: totalTrades,
            winRate: Number(winRate),
            avgPnlPerTrade: avgPnlPerTrade,
            totalPnL,
            bestTrade,
            worstTrade,
          });
        } catch (error) {
          console.error("Failed to fetch trade stats", error);
        }
      };

      fetchTradeStats();
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto my-8 px-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-10 text-white">
          <div className="flex items-center">
            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="ml-8">
              <h2 className="text-3xl font-bold">{user.username}</h2>
              <div className="flex items-center mt-2"></div>
            </div>
          </div>

          {/* Highlight Total Trades with larger display */}
          <div className="mt-8 flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <span className="text-sm text-slate-300 uppercase font-medium mb-1">
              Total Trades
            </span>
            <span className="text-5xl font-bold">
              {profileData.tradesCount}
            </span>
            <div className="w-24 h-1 bg-indigo-500 rounded-full mt-4"></div>
          </div>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex flex-col">
              <span className="text-xs text-slate-300 uppercase font-medium">
                Win Rate
              </span>
              <span className="text-2xl font-bold mt-1">
                {profileData.winRate}%
              </span>
              <div className="w-full bg-slate-600/30 rounded-full h-2 mt-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${profileData.winRate}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <span className="text-xs text-slate-300 uppercase font-medium">
                Total P&L
              </span>
              <div
                className={`text-2xl font-bold mt-1 ${
                  profileData.totalPnL >= 0
                    ? "text-emerald-400"
                    : "text-rose-400"
                }`}
              >
                {profileData.totalPnL >= 0 ? "+" : ""}
                {profileData.totalPnL.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8">
          <h3 className="text-xl font-semibold text-slate-800 mb-6">
            Performance Metrics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Trading Statistics */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
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
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Trading Performance
              </h4>

              <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Average P&L per Trade
                    </p>
                    <p
                      className={`text-lg font-semibold ${
                        profileData.avgPnlPerTrade >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {profileData.avgPnlPerTrade >= 0 ? "+" : ""}$
                      {profileData.avgPnlPerTrade.toFixed(2)}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      profileData.avgPnlPerTrade >= 0
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-rose-100 text-rose-600"
                    }`}
                  >
                    {profileData.avgPnlPerTrade >= 0 ? (
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
                        <path d="M12 19V5M5 12l7-7 7 7" />
                      </svg>
                    ) : (
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
                        <path d="M12 5v14M5 12l7 7 7-7" />
                      </svg>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Best Trade
                    </p>
                    <p className="text-lg font-semibold text-emerald-600">
                      +${profileData.bestTrade.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
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
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Worst Trade
                    </p>
                    <p className="text-lg font-semibold text-rose-600">
                      ${profileData.worstTrade.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
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
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
              <h4 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                Account Activity
              </h4>

              <div className="grid grid-cols-1 gap-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Win Rate
                    </p>
                    <div className="flex items-center">
                      <p className="text-lg font-semibold text-slate-800">
                        {profileData.winRate}%
                      </p>
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                        {profileData.winRate >= 50
                          ? "Good"
                          : "Needs Improvement"}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
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
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                    </svg>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">
                      Account Status
                    </p>
                    <div className="flex items-center">
                      <p className="text-lg font-semibold text-slate-800">
                        Active
                      </p>
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Premium
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
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
                      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
