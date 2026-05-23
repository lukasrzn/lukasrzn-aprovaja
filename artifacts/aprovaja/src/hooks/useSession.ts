import { useQuery } from "@tanstack/react-query";

export interface SessionData {
  authenticated: boolean;
  role: "user" | "admin";
  isAdmin: boolean;
}

async function fetchSession(): Promise<SessionData> {
  const res = await fetch("/api/auth/session");
  if (!res.ok) return { authenticated: false, role: "user", isAdmin: false };
  return res.json();
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: fetchSession,
    staleTime: 60_000,
    retry: 0,
  });
}
