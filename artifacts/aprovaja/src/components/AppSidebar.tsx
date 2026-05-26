import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { 
  Home, 
  Calendar, 
  FileText, 
  PenTool, 
  Layers, 
  Trophy, 
  User, 
  Target,
  Flame,
  Zap,
  BookOpen,
  Brain,
  MessageSquareText,
  Sparkles,
  LogOut,
  Loader2,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMe, useGetGamificationStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar() {
  const [location, navigate] = useLocation();
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: stats, isLoading: isStatsLoading } = useGetGamificationStats();
  const [logoutStage, setLogoutStage] = useState<"idle" | "confirm" | "loading">("idle");

  const handleLogoutClick = () => {
    if (logoutStage === "idle") {
      setLogoutStage("confirm");
      return;
    }
    if (logoutStage === "confirm") {
      setLogoutStage("loading");
      // Call backend to destroy the session, then clear local state
      fetch("/api/auth/logout", { method: "POST", credentials: "include" })
        .catch(() => {})
        .finally(() => {
          try {
            localStorage.clear();
            sessionStorage.clear();
          } catch {}
          window.location.href = "/?saiu=true";
        });
    }
  };

  const handleCancelLogout = () => setLogoutStage("idle");

  const isAdmin = user?.role === "admin";

  const menuItems = [
    { title: "Dashboard", icon: Home, path: "/dashboard" },
    { title: "Professor IA", icon: MessageSquareText, path: "/professor-ia" },
    { title: "Gerar com IA", icon: Sparkles, path: "/ia-conteudo" },
    { title: "Estudar Hoje", icon: Brain, path: "/estude-hoje" },
    { title: "Plano de Estudos", icon: Calendar, path: "/plano-de-estudos" },
    { title: "Simulados", icon: FileText, path: "/simulados" },
    { title: "Praticar", icon: BookOpen, path: "/pratica" },
    { title: "Redação", icon: PenTool, path: "/redacao" },
    { title: "Flashcards", icon: Layers, path: "/flashcards" },
    { title: "Missões", icon: Target, path: "/missoes" },
    { title: "Ranking", icon: Trophy, path: "/ranking" },
    { title: "Perfil", icon: User, path: "/perfil" },
  ];

  const adminItems = isAdmin
    ? [{ title: "Painel Admin", icon: Shield, path: "/admin" }]
    : [];

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar/50 backdrop-blur-xl">
      <SidebarHeader className="p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            AprovaJá
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 mb-4">
            <div className="p-4 rounded-xl bg-card/50 border border-border backdrop-blur-sm flex flex-col gap-3">
              {isUserLoading || isStatsLoading ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ) : user && stats ? (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarImage src={user.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm line-clamp-1">{user.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        Nível {stats.level} • <Flame className="w-3 h-3 text-orange-500" /> {stats.streak}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>XP</span>
                      <span>{stats.xp} / {stats.xp + stats.xpToNextLevel}</span>
                    </div>
                    <Progress value={(stats.xp / (stats.xp + stats.xpToNextLevel)) * 100} className="h-1.5 bg-muted" />
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground font-semibold px-6">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.path}
                    className="hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Link href={item.path} className="flex items-center gap-3 px-4">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin section — only visible to users with role=admin */}
        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarSeparator />
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-primary/70 font-semibold px-6 mt-1">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.path}
                      className="hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Link href={item.path} className="flex items-center gap-3 px-4">
                        <item.icon className="w-4 h-4 text-primary" />
                        <span className="text-primary font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <AnimatePresence mode="wait">
          {logoutStage === "confirm" ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className="rounded-xl border border-rose-500/25 bg-rose-500/[0.08] p-3 space-y-2.5"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300/90 leading-snug">
                  Tem certeza que deseja sair da conta?
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelLogout}
                  className="flex-1 py-1.5 rounded-lg border border-white/[0.10] bg-white/[0.04] text-xs text-muted-foreground hover:text-white hover:border-white/[0.2] transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="flex-1 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 text-xs text-rose-400 hover:bg-rose-500/25 hover:border-rose-500/60 hover:text-rose-300 transition-all font-semibold"
                >
                  Confirmar
                </button>
              </div>
            </motion.div>
          ) : logoutStage === "loading" ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-2.5 py-3 rounded-xl border border-white/[0.06] bg-white/[0.03]"
            >
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">Encerrando sessão…</span>
            </motion.div>
          ) : (
            <motion.button
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleLogoutClick}
              whileHover={{ x: 2 }}
              className="group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-transparent hover:border-rose-500/20 hover:bg-rose-500/[0.07] transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg border border-white/[0.08] bg-white/[0.04] group-hover:border-rose-500/30 group-hover:bg-rose-500/10 flex items-center justify-center transition-all">
                <LogOut className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-rose-400 transition-colors" />
              </div>
              <span className="text-xs text-muted-foreground/70 group-hover:text-rose-400 font-medium transition-colors">
                Sair da Conta
              </span>
            </motion.button>
          )}
        </AnimatePresence>
        <div className="text-[10px] text-muted-foreground/30 text-center pb-1">
          AprovaJá v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
