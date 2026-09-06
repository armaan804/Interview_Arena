"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, API_URL } from "@/context/AuthContext";
import AuthGuard from "@/components/shared/AuthGuard";

interface Role {
  id: string;
  name: string;
  description: string | null;
}

function RolesContent() {
  const { token } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/roles`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setRoles(data.roles || []))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Choose your target role
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          We&apos;ll tailor practice questions and mock interviews to this
          role.
        </p>

        {loading ? (
          <p className="text-sm text-gray-500">Loading roles...</p>
        ) : roles.length === 0 ? (
          <div className="text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg p-8 text-center">
            No roles found. Run{" "}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded">
              npm run prisma:seed
            </code>{" "}
            in the backend to populate the Role table.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-sm transition"
              >
                <h2 className="font-medium text-gray-900 mb-1">
                  {role.name}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  {role.description}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/practice/mcq/${role.id}`}
                    className="flex-1 text-center text-sm font-medium text-indigo-600 border border-indigo-200 rounded-lg py-2 hover:bg-indigo-50"
                  >
                    MCQ Practice
                  </Link>
                  <Link
                    href={`/practice/interview/${role.id}`}
                    className="flex-1 text-center text-sm font-medium text-white bg-indigo-600 rounded-lg py-2 hover:bg-indigo-700"
                  >
                    Mock Interview
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RolesPage() {
  return (
    <AuthGuard>
      <RolesContent />
    </AuthGuard>
  );
}
