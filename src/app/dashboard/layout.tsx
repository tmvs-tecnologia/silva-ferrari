"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  FileText, 
  Briefcase, 
  Shield, 
  Home, 
  Globe, 
  LogOut, 
  Menu, 
  Bell, 
  X, 
  ChevronLeft, 
  User, 
  Settings, 
  Search, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";
import { OptimizedLink } from "@/components/optimized-link";
import { 
  prefetchAcoesTrabalhistas, 
  prefetchAcoesCiveis, 
  prefetchAcoesCriminais,
  prefetchCompraVenda,
  prefetchPerdaNacionalidade,
  prefetchVistos,
  prefetchDashboard
} from "@/utils/prefetch-functions";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

// Mapeamento de prefetch functions por rota
const PREFETCH_FUNCTIONS = {
  "/dashboard": prefetchDashboard,
  "/dashboard/acoes-trabalhistas": prefetchAcoesTrabalhistas,
  "/dashboard/acoes-civeis": prefetchAcoesCiveis,
  "/dashboard/acoes-criminais": prefetchAcoesCriminais,
  "/dashboard/compra-venda": prefetchCompraVenda,
  "/dashboard/perda-nacionalidade": prefetchPerdaNacionalidade,
  "/dashboard/vistos": prefetchVistos,
};

function Sidebar({
  searchQuery,
  setSearchQuery,
  pathname,
  menuItems,
  onNavigate,
  user,
  handleLogout,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  pathname: string | null;
  menuItems: { title: string; href: string; icon: any; description: string }[];
  onNavigate: () => void;
  user: User | null;
  handleLogout: () => void;
}) {
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="p-6 border-b border-slate-200">
        <div className="mb-4 flex justify-center">
          <Image
            src="https://i.imgur.com/9R0VFkm.png"
            alt="Sistema Jurídico Logo"
            width={180}
            height={60}
            className="object-contain"
            priority
            unoptimized
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            className="pl-9 bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400"
          />
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <OptimizedLink
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            prefetchData={PREFETCH_FUNCTIONS[item.href as keyof typeof PREFETCH_FUNCTIONS]}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
              pathname === item.href
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900 hover:shadow-sm"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <div className="flex-1">
              <div className="text-sm font-medium">{item.title}</div>
              <div className="text-xs opacity-75">{item.description}</div>
            </div>
          </OptimizedLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <Card className="p-3 bg-white/70 backdrop-blur-sm border-slate-200">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
                {user?.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">Administrador</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-slate-400 hover:text-slate-600"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let active = true;
    setSearching(true);
    const fetchAll = async () => {
      try {
        const enc = encodeURIComponent(q);
        const [civeis, trab, crim, comp, perda, vistos] = await Promise.all([
          fetch(`/api/acoes-civeis?search=${enc}&limit=5`).then(r => r.ok ? r.json() : [] ).catch(() => []),
          fetch(`/api/acoes-trabalhistas?search=${enc}&limit=5`).then(r => r.ok ? r.json() : [] ).catch(() => []),
          fetch(`/api/acoes-criminais?search=${enc}&limit=5`).then(r => r.ok ? r.json() : [] ).catch(() => []),
          fetch(`/api/compra-venda-imoveis?search=${enc}&limit=5`).then(r => r.ok ? r.json() : [] ).catch(() => []),
          fetch(`/api/perda-nacionalidade?search=${enc}&limit=5`).then(r => r.ok ? r.json() : [] ).catch(() => []),
          fetch(`/api/vistos?search=${enc}&limit=5`).then(r => r.ok ? r.json() : [] ).catch(() => []),
        ]);
        if (!active) return;
        const toItem = (it: any, mod: string) => {
          const title = it?.clientName || it?.client_name || it?.enderecoImovel || it?.endereco_imovel || "";
          const subtitle = it?.type || "";
          let href = "";
          switch (mod) {
            case "Ações Cíveis":
              href = `/dashboard/acoes-civeis/${it.id}`;
              break;
            case "Ações Trabalhistas":
              href = `/dashboard/acoes-trabalhistas/${it.id}`;
              break;
            case "Ações Criminais":
              href = `/dashboard/acoes-criminais/${it.id}`;
              break;
            case "Compra e Venda":
              href = `/dashboard/compra-venda/${it.id}`;
              break;
            case "Perda de Nacionalidade":
              href = `/dashboard/perda-nacionalidade/${it.id}`;
              break;
            case "Vistos":
              href = `/dashboard/vistos/${it.id}`;
              break;
            default:
              href = `/dashboard`;
          }
          return { module: mod, id: it.id, title, subtitle, status: it?.status || "Em andamento", href };
        };
        const all = []
          .concat((Array.isArray(civeis) ? civeis : []).map((it: any) => toItem(it, "Ações Cíveis")))
          .concat((Array.isArray(trab) ? trab : []).map((it: any) => toItem(it, "Ações Trabalhistas")))
          .concat((Array.isArray(crim) ? crim : []).map((it: any) => toItem(it, "Ações Criminais")))
          .concat((Array.isArray(comp) ? comp : []).map((it: any) => toItem(it, "Compra e Venda")))
          .concat((Array.isArray(perda) ? perda : []).map((it: any) => toItem(it, "Perda de Nacionalidade")))
          .concat((Array.isArray(vistos) ? vistos : []).map((it: any) => toItem(it, "Vistos")));
        setSearchResults(all);
      } finally {
        if (active) setSearching(false);
      }
    };
    fetchAll();
    return () => { active = false; };
  }, [searchQuery]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/");
        return;
      }
      setUser(JSON.parse(storedUser));
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user");
    }
    router.push("/");
  };

  const menuItems = [
    {
      title: "Visão Geral",
      href: "/dashboard",
      icon: LayoutDashboard,
      description: "Dashboard principal",
    },
    {
      title: "Ações Cíveis",
      href: "/dashboard/acoes-civeis",
      icon: FileText,
      description: "Processos cíveis",
    },
    {
      title: "Ações Trabalhistas",
      href: "/dashboard/acoes-trabalhistas",
      icon: Briefcase,
      description: "Processos trabalhistas",
    },
    {
      title: "Ações Criminais",
      href: "/dashboard/acoes-criminais",
      icon: Shield,
      description: "Processos criminais",
    },
    {
      title: "Compra e Venda",
      href: "/dashboard/compra-venda",
      icon: Home,
      description: "Transações imobiliárias",
    },
    {
      title: "Perda de Nacionalidade",
      href: "/dashboard/perda-nacionalidade",
      icon: Globe,
      description: "Processos de nacionalidade",
    },
    {
      title: "Vistos",
      href: "/dashboard/vistos",
      icon: Globe,
      description: "Processos de vistos",
    },
  ];


  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r border-slate-200/50 w-80">
        <Sidebar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          pathname={pathname}
          menuItems={menuItems}
          onNavigate={() => setMobileMenuOpen(false)}
          user={user}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-80">
        {/* Desktop Header */}
        <header className="hidden lg:block sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="grid grid-cols-3 items-center px-6 py-4">
            <div className="flex items-center gap-4">
              {pathname === "/dashboard" && (
                <h1 className="text-2xl font-bold gradient-text">
                  {menuItems.find(item => item.href === pathname)?.title || "Dashboard"}
                </h1>
              )}
            </div>
            <div className="flex justify-center">
              {pathname === "/dashboard" && (
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 justify-end">
              {pathname === "/dashboard" && (
                <>
                  <NotificationBell />
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <Sidebar
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  pathname={pathname}
                  menuItems={menuItems}
                  onNavigate={() => setMobileMenuOpen(false)}
                  user={user}
                  handleLogout={handleLogout}
                />
              </SheetContent>
            </Sheet>
            <Image
              src="https://i.imgur.com/9R0VFkm.png"
              alt="Sistema Jurídico Logo"
              width={96}
              height={32}
              className="object-contain"
              priority
              unoptimized
            />
          </div>
            
            <div className="flex items-center gap-2">
              {pathname === "/dashboard" && <NotificationBell />}
              {pathname === "/dashboard" && (
                <Button variant="ghost" size="icon" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <User className="w-5 h-5 text-red-600" />
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          {searchQuery.trim() ? (
            <div className="space-y-4">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Resultados da Busca</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {searching ? (
                    <div className="text-sm text-slate-500">Buscando...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-sm text-slate-500">Nenhum resultado</div>
                  ) : (
                    searchResults.map((item, i) => (
                      <Link key={`${item.module}-${item.id}-${i}`} href={item.href}>
                        <Card
                          className="border-slate-200 hover:shadow-md transition-all cursor-pointer"
                          role="button"
                          tabIndex={0}
                          onClick={() => router.push(item.href)}
                          onKeyDown={(e) => { if (e.key === 'Enter') router.push(item.href); }}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-semibold truncate">{item.title}</div>
                                <div className="text-xs text-slate-500 truncate">{item.subtitle || item.module}</div>
                              </div>
                              <Badge className={`text-xs ${item.status === 'Finalizado' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>{item.status || 'Em andamento'}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="w-full">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}
