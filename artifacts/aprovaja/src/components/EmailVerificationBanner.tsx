import { useState } from "react";
import { useSession } from "@/hooks/useSession";
import { MailWarning, X, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function EmailVerificationBanner() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!session?.authenticated) return null;
  if (session.emailVerified) return null;
  if (dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao reenviar.");
      setSent(true);
      toast({ title: "Email enviado", description: "Verifique sua caixa de entrada." });
    } catch (err: any) {
      toast({
        title: "Não foi possível reenviar",
        description: err.message ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="sticky top-0 z-40 border-b border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/15 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-2.5 max-w-7xl mx-auto">
        <MailWarning className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="flex-1 text-xs sm:text-sm text-amber-100/90">
          <span className="font-semibold text-amber-300">Confirme seu email</span>
          <span className="hidden sm:inline"> — enviamos um link para <span className="font-mono">{session.email}</span>. Verificar protege sua conta e libera a recuperação de senha.</span>
        </p>
        {sent ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" /> Enviado
          </span>
        ) : (
          <button
            onClick={resend}
            disabled={sending}
            className="text-xs font-semibold px-3 py-1.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {sending && <Loader2 className="w-3 h-3 animate-spin" />}
            {sending ? "Enviando…" : "Reenviar email"}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-300/60 hover:text-amber-200 transition-colors"
          aria-label="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
