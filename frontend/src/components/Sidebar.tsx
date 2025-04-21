"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const DashboardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

const StocksIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const TradesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const ProfileIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Sidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: <DashboardIcon /> },
    { path: "/stocks", label: "Markets", icon: <StocksIcon /> },
    { path: "/trades", label: "My Trades", icon: <TradesIcon /> },
    { path: "/profile", label: "Profile", icon: <ProfileIcon /> },
  ];

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed md:hidden z-90 bottom-10 right-10 bg-slate-700 w-12 h-12 rounded-full drop-shadow-lg flex justify-center items-center text-white hover:bg-slate-800 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } fixed top-0 left-0 h-screen w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-30 md:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* App Title */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 py-6 px-6">
            <h1 className="text-xl font-bold text-white">MONEYYY</h1>
            <p className="text-slate-300 text-sm mt-1">A TRADING APP</p>
          </div>

          {/* Profile Summary */}
          {user && (
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white flex items-center justify-center text-lg font-bold shadow-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{user.username}</p>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 mr-2"></div>
                    <p className="text-xs text-slate-500">Active</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-grow py-6 px-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">
              Navigation
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center px-4 py-3 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors ${
                      pathname === item.path
                        ? "bg-slate-100 text-slate-800 font-medium"
                        : ""
                    }`}
                  >
                    <span
                      className={`mr-3 ${
                        pathname === item.path
                          ? "text-indigo-600"
                          : "text-slate-500"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>

                    {pathname === item.path && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600"></span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Logout */}
          {user && (
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <span className="mr-3 text-slate-500">
                  <LogoutIcon />
                </span>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
