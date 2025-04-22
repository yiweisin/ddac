"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/api";
import { NotificationPreferences } from "@/types/notification";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: "",
    emailNotificationsEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchPreferences();
    }
  }, [user, loading, router]);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getNotificationPreferences();
      setPreferences(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load notification preferences";
      setError(errorMessage);
      console.error("Error fetching preferences:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setPreferences((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await updateNotificationPreferences(preferences);
      setSuccess(
        "Notification preferences updated successfully. If you enabled email notifications, please check your inbox for a confirmation email."
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update notification preferences";
      setError(errorMessage);
      console.error("Error updating preferences:", err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-96 bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">
            Loading notification settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto my-8 px-6">
      <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6 text-white">
          <h1 className="text-2xl font-bold">Email Notification Settings</h1>
          <p className="text-slate-300 mt-1">
            Manage how you receive email notifications
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-rose-50 border-l-4 border-rose-500 text-rose-700 p-4 rounded-md">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-md">
              <p className="font-medium">Success</p>
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Email Notifications
              </h2>

              <div className="flex items-center mb-4">
                <input
                  id="emailNotificationsEnabled"
                  name="emailNotificationsEnabled"
                  type="checkbox"
                  checked={preferences.emailNotificationsEnabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="emailNotificationsEnabled"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Enable email notifications
                </label>
              </div>

              <div className="mt-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={preferences.email || ""}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="your.email@example.com"
                  disabled={!preferences.emailNotificationsEnabled}
                />
                <p className="mt-2 text-sm text-slate-500">
                  Important: After enabling email notifications, you will
                  receive a confirmation email from AWS SNS. Please check your
                  inbox and click the confirmation link to start receiving
                  notifications.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center disabled:opacity-50"
              >
                {isSaving ? (
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
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
