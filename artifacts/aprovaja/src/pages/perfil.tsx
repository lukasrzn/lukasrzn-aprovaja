import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  useGetMe,
  useGetGamificationStats,
  useGetMedals,
  useGetRedacoes,
  useGetSimulados,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Star, Flame, Zap, Clock, Trophy, Target, Layers,
  PenTool, Crown, BookOpen, Brain, ChevronRight,
  Lock, Sparkles, TrendingUp, Medal as MedalIcon,
  Shield, Sword, Gem, LogOut, AlertTriangle, Loader2,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";

// ─── Icon registry ────────────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Star, Flame, Zap, Clock, Trophy, Target, Layers, PenTool, Crown,
  BookOpen, Brain, Sparkles, TrendingUp, Shield, Sword, Gem,
  MedalIcon, Lock,
};

// ─── Rarity config ─────────────────────────────────────────────────────────────
const RARITY: Record<string, {
  label: string; color: string; textColor: string; borderColor: string;
  glow: string; bg: string; ring: string; gradFrom: string; gradTo: string;
}> = {
  common: {
    label: "Comum",
    color:      "zinc",
    textColor:  "text-zinc-300",
    borderColor:"border-zinc-500/40",
    glow:       "shadow-zinc-500/20",
    bg:         "bg-zinc-500/10",
    ring:       "ring-zinc-500/20",
    gradFrom:   "from-zinc-600/20",
    gradTo:     "to-zinc-500/5",
  },
  rare: {
    label: "Raro",
    color:      "cyan",
    textColor:  "text-cyan-400",
    borderColor:"border-cyan-500/40",
    glow:       "shadow-cyan-500/30",
    bg:         "bg-cyan-500/10",
    ring:       "ring-cyan-500/20",
    gradFrom:   "from-cyan-600/20",
    gradTo:     "to-cyan-500/5",
  },
  epic: {
    label: "Épico",
    color:      "violet",
    textColor:  "text-violet-400",
    borderColor:"border-violet-500/40",
    glow:       "shadow-violet-500/30",
    bg:         "bg-violet-500/10",
    ring:       "ring-violet-500/20",
    gradFrom:   "from-violet-600/20",
    gradTo:     "to-violet-500/5",
  },
  legendary: {
    label: "Lendário",
    color:      "amber",
    textColor:  "text-amber-400",
    borderColor:"border-amber-500/40",
    glow:       "shadow-amber-500/40",
    bg:         "bg-amber-500/10",
    ring:       "ring-amber-500/30",
    gradFrom:   "from-amber-600/25",
    gradTo:     "to-amber-500/5",
  },
};

function getRarity(key: string) {
  return RARITY[key.toLowerCase()] ?? RARITY.common;
}

// ─── XP ring around avatar ────────────────────────────────────────────────────
function XpRing({ pct }: { pct: number }) {
  const R = 66;
  const circ = 2 * Math.PI * R;
  const offset = circ - (circ * pct) / 100;
  return (
    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 148 148">
      <circle cx="74" cy="74" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <motion.circle
        cx="74" cy="74" r={R} fill="none"
        stroke="url(#xpGrad)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
      />
      <defs>
        <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon, value, label, color = "text-muted-foreground", delay = 0,
}: {
  icon: React.ElementType; value: string | number; label: string;
  color?: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center gap-1.5 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] text-center"
    >
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-xl font-black text-white">{value}</span>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-tight">{label}</span>
    </motion.div>
  );
}

// ─── Medal card ───────────────────────────────────────────────────────────────
function MedalCard({
  medal,
  index,
}: {
  medal: {
    id: number; name: string; description: string; icon: string;
    rarity: string; earned: boolean; earnedAt?: string | null;
  };
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const r = getRarity(medal.rarity);
  const Icon = ICON_MAP[medal.icon] ?? Star;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`relative aspect-square rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 ${
        medal.earned
          ? `${r.borderColor} bg-gradient-to-br ${r.gradFrom} ${r.gradTo} shadow-lg ${r.glow}`
          : "border-white/[0.06] bg-white/[0.02] grayscale opacity-40"
      }`}
    >
      {/* Animated glow on hover (earned only) */}
      {medal.earned && (
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${r.gradFrom} to-transparent`}
          animate={{ opacity: hovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Legendary shimmer */}
      {medal.earned && medal.rarity === "legendary" && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
        />
      )}

      <div className="relative z-10 flex flex-col items-center justify-center h-full p-3 gap-2">
        {/* Icon */}
        <motion.div
          animate={hovered && medal.earned ? { scale: 1.15, rotate: [0, -8, 8, 0] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            medal.earned ? `${r.bg} border ${r.borderColor}` : "bg-white/[0.04] border border-white/[0.06]"
          }`}
        >
          {medal.earned
            ? <Icon className={`w-6 h-6 ${r.textColor}`} />
            : <Lock className="w-5 h-5 text-muted-foreground/40" />
          }
        </motion.div>

        {/* Name */}
        <p className={`font-bold text-[11px] leading-tight text-center ${medal.earned ? "text-white" : "text-muted-foreground/50"}`}>
          {medal.name}
        </p>

        {/* Rarity badge */}
        {medal.earned && (
          <span className={`text-[9px] font-bold uppercase tracking-widest ${r.textColor}`}>
            {r.label}
          </span>
        )}

        {/* Earned date */}
        {medal.earned && medal.earnedAt && (
          <span className="text-[8px] text-muted-foreground/50 font-mono">
            {new Date(medal.earnedAt).toLocaleDateString("pt-BR")}
          </span>
        )}
      </div>

      {/* Tooltip on hover */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-44 rounded-xl border border-white/[0.1] bg-[#0f0f1a]/95 backdrop-blur-lg p-3 text-center pointer-events-none shadow-xl"
          >
            <p className={`font-bold text-xs mb-1 ${medal.earned ? r.textColor : "text-muted-foreground"}`}>
              {medal.name}
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">{medal.description}</p>
            {!medal.earned && (
              <p className="text-[10px] text-muted-foreground/50 mt-1 italic">Ainda não desbloqueado</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Level badge ──────────────────────────────────────────────────────────────
function levelTitle(level: number) {
  if (level >= 20) return { title: "Lenda", icon: Crown, color: "text-amber-400" };
  if (level >= 15) return { title: "Mestre", icon: Trophy, color: "text-violet-400" };
  if (level >= 10) return { title: "Expert", icon: Sword, color: "text-cyan-400" };
  if (level >= 5)  return { title: "Avançado", icon: Shield, color: "text-emerald-400" };
  return              { title: "Iniciante", icon: Star, color: "text-zinc-400" };
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Perfil() {
  const { data: user, isLoading: loadingUser } = useGetMe();
  const { data: stats, isLoading: loadingStats } = useGetGamificationStats();
  const { data: medals, isLoading: loadingMedals } = useGetMedals();
  const { data: redacoes } = useGetRedacoes();
  const { data: simulados } = useGetSimulados();

  const [activeTab, setActiveTab] = useState<"conquistas" | "estatisticas">("conquistas");
  const [logoutStage, setLogoutStage] = useState<"idle" | "confirm" | "loading">("idle");
  const [deleteStage, setDeleteStage] = useState<"idle" | "confirm" | "typing" | "loading">("idle");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: session } = useSession();

  const handleDeleteAccount = async () => {
    setDeleteStage("loading");
    try {
      const res = await fetch("/api/auth/me", {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Erro ao excluir conta.");
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
      toast({ title: "Conta excluída", description: "Todos os seus dados foram removidos." });
      setTimeout(() => navigate("/?conta=excluida"), 600);
    } catch (err: any) {
      setDeleteStage("idle");
      setDeleteConfirmText("");
      toast({
        title: "Não foi possível excluir",
        description: err.message ?? "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    if (logoutStage === "idle") { setLogoutStage("confirm"); return; }
    if (logoutStage === "confirm") {
      setLogoutStage("loading");
      try { localStorage.clear(); sessionStorage.clear(); } catch {}
      setTimeout(() => navigate("/?saiu=true"), 900);
    }
  };

  const xpPct = stats
    ? Math.round((stats.xp / (stats.xp + stats.xpToNextLevel)) * 100)
    : 0;

  const earnedMedals  = medals?.filter(m => m.earned)  ?? [];
  const lockedMedals  = medals?.filter(m => !m.earned) ?? [];
  const studyHours    = Math.floor((stats?.totalStudyMinutes ?? 0) / 60);
  const studyMins     = (stats?.totalStudyMinutes ?? 0) % 60;

  const lvl = stats?.level ?? 1;
  const { title: lvlTitle, icon: LvlIcon, color: lvlColor } = levelTitle(lvl);

  const redacoesCount = redacoes?.length ?? 0;
  const simuladosCount = simulados?.length ?? 0;

  return (
    <div className="flex-1 p-6 md:p-8 pt-6 max-w-5xl mx-auto space-y-8">

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.08]">
        {/* Animated gradient background */}
        <div className="relative h-44 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/60 via-[#0d0d1f] to-cyan-900/40" />
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-violet-600/20 via-transparent to-cyan-600/20"
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-white/20"
              style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }}
              animate={{ y: [-4, 4, -4], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2.5 + i * 0.4, repeat: Infinity }}
            />
          ))}
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
          />
        </div>

        {/* Profile info — overlapping the banner */}
        <div className="bg-[#0d0d1f]/90 backdrop-blur-xl border-t border-white/[0.06] px-7 pb-7 pt-0">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 relative z-10">
            {/* Avatar with XP ring */}
            <div className="relative w-36 h-36 shrink-0">
              {!loadingStats && <XpRing pct={xpPct} />}
              <Avatar className="w-28 h-28 absolute inset-0 m-auto border-4 border-[#0d0d1f] shadow-2xl shadow-black/60">
                <AvatarImage src={user?.avatarUrl ?? ""} />
                <AvatarFallback className="text-4xl bg-primary/20 text-primary font-black">
                  {user?.name?.charAt(0) ?? "E"}
                </AvatarFallback>
              </Avatar>
              {/* Level badge */}
              {stats && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-cyan-600 text-white font-black text-xs px-3 py-1 rounded-full border-2 border-[#0d0d1f] shadow-lg whitespace-nowrap z-10">
                  Nível {stats.level}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left pb-1 space-y-2">
              {loadingUser ? (
                <div className="space-y-2"><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-32" /></div>
              ) : (
                <>
                  <h1 className="text-2xl font-black text-white">{user?.name ?? "Estudante"}</h1>
                  <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${lvlColor} bg-white/[0.04] border-white/[0.08]`}>
                      <LvlIcon className="w-3.5 h-3.5" /> {lvlTitle}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.03]">
                      <Target className="w-3.5 h-3.5" /> {user?.goal ?? "ENEM 2026"}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20 bg-amber-500/[0.06]">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" /> {stats?.streak ?? 0} dias seguidos
                    </div>
                  </div>
                  {/* XP bar */}
                  {stats && (
                    <div className="max-w-xs space-y-1">
                      <Progress value={xpPct} className="h-2 bg-white/[0.06]" />
                      <p className="text-[11px] text-muted-foreground">
                        {stats.xp.toLocaleString("pt-BR")} XP — faltam <span className="text-primary font-semibold">{stats.xpToNextLevel.toLocaleString("pt-BR")} XP</span> para Nível {stats.level + 1}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pb-2">
              <Button variant="outline" size="sm" className="border-white/[0.1] bg-white/[0.03] hover:bg-white/[0.07] text-muted-foreground gap-2">
                <TrendingUp className="w-3.5 h-3.5" /> Ver Ranking
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats grid ──────────────────────────────────────────── */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Estatísticas Vitais</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          <StatPill icon={Zap}       value={`${stats?.xp?.toLocaleString("pt-BR") ?? 0}`} label="XP Total"     color="text-primary"      delay={0}    />
          <StatPill icon={Trophy}    value={`#${stats?.rank ?? "?"}`}                       label="Ranking"      color="text-amber-400"    delay={0.05} />
          <StatPill icon={Flame}     value={stats?.streak ?? 0}                             label="Streak"       color="text-orange-400"   delay={0.10} />
          <StatPill icon={Clock}     value={studyHours > 0 ? `${studyHours}h${studyMins > 0 ? studyMins + "m" : ""}` : `${studyMins}m`} label="Tempo estudo" color="text-cyan-400" delay={0.15} />
          <StatPill icon={FileIcon}  value={simuladosCount}                                  label="Simulados"    color="text-violet-400"   delay={0.20} />
          <StatPill icon={PenTool}   value={redacoesCount}                                   label="Redações"     color="text-emerald-400"  delay={0.25} />
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div>
        <div className="flex gap-1 p-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] w-fit mb-6">
          {(["conquistas", "estatisticas"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? "bg-primary text-white shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {tab === "conquistas" ? "🏅 Conquistas" : "📊 Estatísticas"}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "conquistas" && (
            <motion.div
              key="conquistas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Earned */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-bold text-white">Desbloqueadas</p>
                  </div>
                  <Badge className="bg-primary/10 border border-primary/20 text-primary text-xs">
                    {earnedMedals.length} / {medals?.length ?? 0}
                  </Badge>
                </div>

                {loadingMedals ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
                  </div>
                ) : earnedMedals.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {earnedMedals.map((m, i) => (
                      <MedalCard key={m.id} medal={m} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 rounded-2xl border-2 border-dashed border-white/[0.06] text-sm text-muted-foreground">
                    Ainda sem conquistas. Complete missões para desbloqueá-las!
                  </div>
                )}
              </div>

              {/* Locked */}
              {lockedMedals.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-muted-foreground/50" />
                    <p className="text-sm font-bold text-muted-foreground">Ainda por desbloquear</p>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {lockedMedals.map((m, i) => (
                      <MedalCard key={m.id} medal={m} index={i} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rarity legend */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Raridade das Conquistas</p>
                <div className="flex flex-wrap gap-4">
                  {(["common","rare","epic","legendary"] as const).map(r => {
                    const cfg = RARITY[r];
                    return (
                      <div key={r} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${cfg.bg} border ${cfg.borderColor} shadow-sm ${cfg.glow}`} />
                        <span className={`text-xs font-semibold ${cfg.textColor}`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "estatisticas" && (
            <motion.div
              key="estatisticas"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Progress to next level */}
              {stats && (
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">Progressão de Nível</p>
                        <p className="text-xs text-muted-foreground">Nível {stats.level} → {stats.level + 1}</p>
                      </div>
                    </div>
                    <span className="text-2xl font-black text-white">{xpPct}%</span>
                  </div>
                  <Progress value={xpPct} className="h-3 bg-white/[0.06]" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{stats.xp.toLocaleString("pt-BR")} XP atual</span>
                    <span>Faltam {stats.xpToNextLevel.toLocaleString("pt-BR")} XP</span>
                  </div>
                </div>
              )}

              {/* Detailed stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Trophy,    color:"text-amber-400",   bg:"bg-amber-500/10",  border:"border-amber-500/20", label:"Posição no Ranking",     value:`#${stats?.rank ?? "?"}` },
                  { icon: Flame,     color:"text-orange-400",  bg:"bg-orange-500/10", border:"border-orange-500/20",label:"Maior Streak",            value:`${stats?.streak ?? 0} dias` },
                  { icon: Clock,     color:"text-cyan-400",    bg:"bg-cyan-500/10",   border:"border-cyan-500/20",  label:"Total de Estudo",         value:`${studyHours}h ${studyMins}m` },
                  { icon: MedalIcon, color:"text-violet-400",  bg:"bg-violet-500/10", border:"border-violet-500/20",label:"Conquistas Desbloqueadas", value:`${stats?.medalsEarned ?? 0} / ${medals?.length ?? 0}` },
                  { icon: FileIcon,  color:"text-indigo-400",  bg:"bg-indigo-500/10", border:"border-indigo-500/20",label:"Simulados Realizados",    value:simuladosCount },
                  { icon: PenTool,   color:"text-emerald-400", bg:"bg-emerald-500/10",border:"border-emerald-500/20",label:"Redações Enviadas",       value:redacoesCount },
                ].map(({ icon: Icon, color, bg, border, label, value }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4"
                  >
                    <div className={`w-10 h-10 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-lg font-black text-white">{value}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  </motion.div>
                ))}
              </div>

              {/* Goal */}
              {user?.goal && (
                <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Objetivo Principal</p>
                    <p className="font-bold text-white">{user.goal}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Account / Logout section ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conta</p>
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {logoutStage === "loading" ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-3 py-4"
              >
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span className="text-sm text-muted-foreground">Encerrando sua sessão…</span>
              </motion.div>
            ) : logoutStage === "confirm" ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="rounded-xl border border-rose-500/25 bg-rose-500/[0.07] p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Sair da conta?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Você será redirecionado para a página inicial. Seu progresso está salvo.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoutStage("idle")}
                    className="flex-1 border-white/[0.12] text-xs"
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleLogout}
                    className="flex-1 bg-rose-500/15 border border-rose-500/40 text-rose-400 hover:bg-rose-500/25 hover:text-rose-300 hover:border-rose-500/60 text-xs font-semibold"
                    variant="outline"
                  >
                    Confirmar saída
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.button
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileHover={{ x: 3 }}
                onClick={handleLogout}
                className="group w-full flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-rose-500/20 hover:bg-rose-500/[0.06] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] group-hover:border-rose-500/30 group-hover:bg-rose-500/10 flex items-center justify-center transition-all shrink-0">
                  <LogOut className="w-4 h-4 text-muted-foreground/50 group-hover:text-rose-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/80 group-hover:text-rose-400 transition-colors">Sair da Conta</p>
                  <p className="text-xs text-muted-foreground/60">Encerrar sessão atual</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-rose-400/50 transition-colors shrink-0" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Danger zone: Delete account (LGPD) ─────────────────────── */}
      {!session?.isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.03] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-rose-500/15">
            <p className="text-xs font-semibold text-rose-400/80 uppercase tracking-wider">Zona de Perigo</p>
          </div>

          <div className="p-4">
            <AnimatePresence mode="wait">
              {deleteStage === "loading" ? (
                <motion.div
                  key="del-loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3 py-4"
                >
                  <Loader2 className="w-5 h-5 text-rose-400 animate-spin" />
                  <span className="text-sm text-muted-foreground">Excluindo sua conta e todos os dados…</span>
                </motion.div>
              ) : deleteStage === "confirm" || deleteStage === "typing" ? (
                <motion.div
                  key="del-confirm"
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="rounded-xl border border-rose-500/30 bg-rose-500/[0.07] p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Excluir conta permanentemente?</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Esta ação é <strong className="text-rose-300">irreversível</strong>. Seus dados de estudo, simulados, redações, flashcards e conversas com a IA serão apagados.
                        {session?.email && <> Se você tem uma assinatura ativa, ela será cancelada no Stripe.</>}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">
                      Para confirmar, digite <code className="font-mono text-rose-300 bg-rose-500/10 px-1 py-0.5 rounded">EXCLUIR</code> abaixo:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => {
                        setDeleteConfirmText(e.target.value);
                        setDeleteStage("typing");
                      }}
                      placeholder="EXCLUIR"
                      autoComplete="off"
                      className="w-full h-9 px-3 rounded-lg bg-background/60 border border-white/[0.1] focus:border-rose-500/50 focus:outline-none text-sm text-white font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setDeleteStage("idle"); setDeleteConfirmText(""); }}
                      className="flex-1 border-white/[0.12] text-xs"
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      disabled={deleteConfirmText !== "EXCLUIR"}
                      onClick={handleDeleteAccount}
                      className="flex-1 bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 hover:text-rose-200 hover:border-rose-500/60 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      variant="outline"
                    >
                      Excluir minha conta
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="del-idle"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  whileHover={{ x: 3 }}
                  onClick={() => setDeleteStage("confirm")}
                  className="group w-full flex items-center gap-4 p-3 rounded-xl border border-transparent hover:border-rose-500/25 hover:bg-rose-500/[0.06] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-xl border border-white/[0.08] bg-white/[0.04] group-hover:border-rose-500/35 group-hover:bg-rose-500/10 flex items-center justify-center transition-all shrink-0">
                    <Trash2 className="w-4 h-4 text-muted-foreground/50 group-hover:text-rose-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/80 group-hover:text-rose-400 transition-colors">Excluir minha conta</p>
                    <p className="text-xs text-muted-foreground/60">Direito ao esquecimento (LGPD) — apaga todos os dados</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-rose-400/50 transition-colors shrink-0" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

    </div>
  );
}

// Inline icon component for FileText (simulados) 
function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  );
}
