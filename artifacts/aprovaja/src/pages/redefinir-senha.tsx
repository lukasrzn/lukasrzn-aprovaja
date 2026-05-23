import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Zap, Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";

type State = "validating" | "invalid" | "form" | "success";

export default function RedefinirSenha() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [state, setState] = useState<State>("validating");
  const [invalidReason, setInvalidReason] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token") ?? "";

    if (!t) {
      setState("invalid");
      setInvalidReason("Link inválido. Solicite um novo link de recuperação.");
      return;
    }

    setToken(t);

    fetch(`/api/auth/reset-password/validate?token=${encodeURIComponent(t)}`)
      .then(r => r.json())
      .then((data: { valid: boolean; reason?: string }) => {
        if (data.valid) {
          setState("form");
        } else {
          setState("invalid");
          setInvalidReason(data.reason ?? "Token inválido ou expirado.");
        }
      })
      .catch(() => {
        setState("invalid");
        setInvalidReason("Erro ao validar link. Tente novamente.");
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setIsLoading(true);
    try {
      const resp = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await resp.json() as { ok?: boolean; error?: string };

      if (!resp.ok || !data.ok) {
        setError(data.error ?? "Erro ao redefinir senha. Tente novamente.");
        return;
      }

      setState("success");
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.5)]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            AprovaJá
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-card/50 border border-white/8 rounded-2xl p-8 backdrop-blur-sm"
        >
          {/* Validating */}
          {state === "validating" && (
            <div className="text-center py-8">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Validando seu link…</p>
            </div>
          )}

          {/* Invalid token */}
          {state === "invalid" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-destructive/15 border border-destructive/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-bold mb-2">Link inválido</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">{invalidReason}</p>
              <Button
                onClick={() => navigate("/recuperar-senha")}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Solicitar novo link
              </Button>
            </div>
          )}

          {/* Reset form */}
          {state === "form" && (
            <>
              <div className="text-center mb-7">
                <div className="w-12 h-12 bg-primary/15 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Nova senha</h1>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Crie uma senha forte com pelo menos 8 caracteres.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-sm font-medium">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      autoFocus
                      className="h-11 bg-background/50 border-white/10 focus:border-primary/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 bg-background/50 border-white/10 focus:border-primary/50"
                  />
                </div>

                {/* Password strength hints */}
                {newPassword.length > 0 && (
                  <div className="space-y-1.5">
                    {[
                      { ok: newPassword.length >= 8, label: "Mínimo 8 caracteres" },
                      { ok: /[A-Z]/.test(newPassword), label: "Letra maiúscula" },
                      { ok: /[0-9]/.test(newPassword), label: "Número" },
                    ].map(hint => (
                      <div key={hint.label} className={`flex items-center gap-2 text-xs transition-colors ${hint.ok ? "text-green-400" : "text-muted-foreground"}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${hint.ok ? "bg-green-400" : "bg-muted-foreground/40"}`} />
                        {hint.label}
                      </div>
                    ))}
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando…
                    </span>
                  ) : "Redefinir senha"}
                </Button>
              </form>
            </>
          )}

          {/* Success */}
          {state === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 bg-green-500/15 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Senha redefinida!</h2>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                Sua senha foi atualizada com sucesso. Você já pode fazer login com a nova senha.
              </p>
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                Ir para o login
              </Button>
            </motion.div>
          )}

          {state !== "success" && state !== "validating" && (
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o login
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
