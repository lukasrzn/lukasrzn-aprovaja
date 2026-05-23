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
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetMe, useGetGamificationStats } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSidebar() {
  const [location] = useLocation();
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: stats, isLoading: isStatsLoading } = useGetGamificationStats();

  const menuItems = [
    { title: "Dashboard", icon: Home, path: "/dashboard" },
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
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-xs text-muted-foreground/50 text-center">
          AprovaJá v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
