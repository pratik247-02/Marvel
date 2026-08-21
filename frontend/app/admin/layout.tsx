"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LogOut } from "lucide-react";
import { useAuth } from "@/modules/auth";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Guard for every /admin route.
 *
 * This is a convenience gate, not the security boundary. The API rejects any
 * write without an admin token regardless of what the client renders, so a
 * user who forces their way to this UI can still see nothing and do nothing.
 * Hiding it is about not showing a broken screen, not about protection.
 */
export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { isAdmin, isRestoring, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (!isRestoring && !isAdmin && !isLoginPage) {
      router.replace("/admin/login");
    }
  }, [isRestoring, isAdmin, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  // Distinguishing "still checking" from "signed out" avoids flashing the
  // login redirect on every reload while the refresh call is in flight.
  if (isRestoring) {
    return (
      <Container className="py-24">
        <Skeleton className="mx-auto h-8 w-48" />
      </Container>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen pt-16">
      <div className="border-b border-border bg-card/50">
        <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-primary h-5 w-5" />
            <div>
              <p className="font-semibold leading-tight">Admin</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/admin/characters">
              <Button variant="ghost" size="sm">
                Characters
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              <LogOut className="mr-1.5 h-4 w-4" />
              Sign out
            </Button>
          </nav>
        </Container>
      </div>
      {children}
    </div>
  );
}
