import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { EmailVerificationBanner } from "./EmailVerificationBanner";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground overflow-hidden">
        <AppSidebar />
        <main className="flex-1 flex flex-col relative h-[100dvh] overflow-y-auto">
          {/* Subtle noise texture overlay */}
          <div className="pointer-events-none fixed inset-0 opacity-[0.03] z-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxwYXRoIGQ9Ik0wIDBIMVYxSDBaTTIgMEgzVjFIMlpNMSAxSDJWMkgxWk0zIDFINFYySDNaTTAgMkgxVjNIMFpNMiAySDNWM0gyWk0xIDNIMlY0SDFaTTMgM0g0VjRIM1oiIGZpbGw9IiMwMDAiIG9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')]"></div>
          <EmailVerificationBanner />
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
