import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "verifying" | "success" | "error";

export default function VerificarEmail() {
  const [status, setStatus] = useState<Status>("verifying");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [, navigate] = useLocation();

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setErrorMsg("Token ausente no link.");
      return;
    }

    fetch("/api/auth/verify-email", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Falha na verificação.");
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setErrorMsg(err.message ?? "Token inválido ou expirado.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8 cursor-pointer">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          AprovaJá
        </span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-card/60 backdrop-blur-xl p-8 text-center space-y-5 shadow-2xl">
        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
            <div>
              <h1 className="text-xl font-bold text-white mb-1">Confirmando seu email…</h1>
              <p className="text-sm text-muted-foreground">Só um instante.</p>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Email confirmado!</h1>
              <p className="text-sm text-muted-foreground">
                Sua conta agora está totalmente verificada. Bons estudos!
              </p>
            </div>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-11"
              onClick={() => navigate("/dashboard")}
            >
              Ir para o Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto">
              <XCircle className="w-9 h-9 text-rose-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Não foi possível verificar</h1>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <p className="text-xs text-muted-foreground/60 mt-3">
                Faça login e clique em "Reenviar email" no aviso laranja no topo da página.
              </p>
            </div>
            <Button
              variant="outline"
              className="w-full border-white/[0.12] h-11"
              onClick={() => navigate("/login")}
            >
              Ir para o Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
