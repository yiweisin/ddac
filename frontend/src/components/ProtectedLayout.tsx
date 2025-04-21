"use client";

import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-700 font-medium">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen bg-slate-50">{children}</div>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-0 md:ml-72 p-6 transition-all duration-300 ease-in-out">
        {children}
      </main>
    </div>
  );
}
