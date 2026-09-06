"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-[calc(100vh-57px)]" />;
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg text-center">
        {user ? (
          <>
            <h1 className="text-3xl font-semibold text-gray-900 mb-3">
              Welcome back, {user.name.split(" ")[0]}
            </h1>
            <p className="text-gray-500 mb-8">
              Pick up where you left off, or start a new practice session.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/roles"
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Continue practicing
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-100"
              >
                View dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-semibold text-gray-900 mb-3">
              Practice interviews that actually match your target role
            </h1>
            <p className="text-gray-500 mb-8">
              Role-based MCQs, mock interviews with AI feedback, and your own
              progress dashboard.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/signup"
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-100"
              >
                Log in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
