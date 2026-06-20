"use client";

import { UserRole } from "@/lib/types";
import { createContext, useContext } from "react";


export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  employeeId: string;
}

const AuthContext = createContext<AuthUser | null>(null);

export function AuthProvider({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

/** Use inside any client component under app/(protected) to read the logged-in user. */
export function useAuth() {
  const user = useContext(AuthContext);
  if (!user) throw new Error("useAuth() must be called inside <AuthProvider> — only available under app/(protected)");
  return user;
}