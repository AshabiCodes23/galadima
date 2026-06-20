import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AuthProvider } from "@/providers/AuthProvider";
import AppShell from "@/components/layout/AppShell";


export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  // proxy.ts already redirects unauthenticated requests — this is the
  // belt-and-suspenders check for the server component tree itself.
  if (!user) redirect("/login");

  const authUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    employeeId: user.employeeId,
  };

  return (
    <AuthProvider user={authUser}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}