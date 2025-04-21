"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { PriceAlert } from "@/types/alert";
import { getPriceAlerts, deletePriceAlert } from "@/lib/api";
import Link from "next/link";

export default function AlertsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchAlerts();
    }
  }, [user, loading, router]);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getPriceAlerts();
      setAlerts(data);
    } catch (err) {
      setError("Failed to load price alerts");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await deletePriceAlert(id);
      setAlerts(alerts.filter((alert) => alert.id !== id));
    } catch (err) {
      setError("Failed to delete alert");
      console.error(err);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">Loading price alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-8 px-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Price Alerts</h1>
              <p className="text-slate-300 mt-1">
                Get notified when stocks hit your target prices
              </p>
            </div>
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
              Create New Alert
            </Link>
          </div>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-md">
              {error}
            </div>
          )}

          {alerts.length === 0 ? (
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
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                No Price Alerts Set
              </h3>
              <p className="text-slate-500 max-w-md">
                You haven't set any price alerts yet. Create an alert to get
                notified when a stock hits your target price.
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
                      Target Price
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Alert Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Created
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
                  {alerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800">
                          {alert.stockSymbol}
                        </div>
                        <div className="text-sm text-slate-500">
                          {alert.stockName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="font-medium text-slate-700">
                          ${alert.targetPrice.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alert.isAboveTarget
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {alert.isAboveTarget ? "Above" : "Below"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alert.isTriggered
                              ? "bg-slate-100 text-slate-800"
                              : "bg-indigo-100 text-indigo-800"
                          }`}
                        >
                          {alert.isTriggered ? "Triggered" : "Active"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-slate-600">
                          {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="px-3 py-1.5 text-xs bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors shadow-sm flex items-center mx-auto"
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
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
