"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  LogOut,
  Menu,
  Search as SearchIcon,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NotificationBell } from "@/components/notification-bell";
import { OptimizedLink } from "@/components/optimized-link";
import { PageTransition } from "@/components/page-transition";
import {
  prefetchAcoesTrabalhistas,
  prefetchAcoesCiveis,
  prefetchAcoesCriminais,
  prefetchCompraVenda,
  prefetchPerdaNacionalidade,
  prefetchVistos,
  prefetchTurismo,
  prefetchDashboard
} from "@/utils/prefetch-functions";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { GlobalSearchResults } from "@/components/global-search/global-search-results";

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
  "/dashboard/turismo": prefetchTurismo,
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
            alt="Silva & Ferrari"
            width={180}
            height={60}
            className="object-contain"
            priority
            unoptimized
          />
        </div>
        <div className="relative group">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            placeholder="Buscar em todo o sistema..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            className="pl-9 bg-white/50 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all font-medium"
          />
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => (
          <motion.div
            key={item.href}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <OptimizedLink
              href={item.href}
              onClick={onNavigate}
              prefetchData={PREFETCH_FUNCTIONS[item.href as keyof typeof PREFETCH_FUNCTIONS]}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${pathname === item.href
                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20"
                : "text-slate-600 hover:bg-white/70 hover:text-slate-900 hover:shadow-sm"
                }`}
            >
              {typeof item.icon === 'string' ? (
                <img src={item.icon} alt={item.title} className="h-5 w-5 object-contain" />
              ) : (
                <item.icon className="h-5 w-5" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium">{item.title}</div>
                <div className={`text-xs ${pathname === item.href ? "text-blue-100" : "text-slate-400"}`}>{item.description}</div>
              </div>
            </OptimizedLink>
          </motion.div>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 font-medium"
        >
          <LogOut className="h-4 w-4" />
          Sair do Sistema
        </Button>
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

  // Use custom global search hook
  const { query, setQuery, results, isSearching } = useGlobalSearch();

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

  // Clear search when navigating (optional, depends on UX preference)
  // useEffect(() => {
  //   setQuery("");
  // }, [pathname, setQuery]); 
  // I'll keep the search active if the user navigates, or maybe clear it? 
  // Usually if they click a result, they navigate, so `query` stays but main view changes.
  // Integrating the "result view" inside existing layout means if `query` is present, show results.

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
      icon: "https://cdn-icons-png.flaticon.com/512/15135/15135113.png",
      description: "Dashboard principal",
    },
    {
      title: "Ações Cíveis",
      href: "/dashboard/acoes-civeis",
      icon: "https://cdn-icons-png.flaticon.com/512/1157/1157026.png",
      description: "Processos cíveis",
    },
    {
      title: "Ações Trabalhistas",
      href: "/dashboard/acoes-trabalhistas",
      icon: "https://cdn-icons-png.flaticon.com/512/3135/3135687.png",
      description: "Processos trabalhistas",
    },
    {
      title: "Ações Criminais",
      href: "/dashboard/acoes-criminais",
      icon: "https://cdn-icons-png.flaticon.com/512/929/929429.png",
      description: "Processos criminais",
    },
    {
      title: "Compra e Venda",
      href: "/dashboard/compra-venda",
      icon: "https://cdn-icons-png.flaticon.com/512/14523/14523054.png",
      description: "Transações imobiliárias",
    },
    {
      title: "Perda de Nacionalidade",
      href: "/dashboard/perda-nacionalidade",
      icon: "https://cdn-icons-png.flaticon.com/512/4284/4284504.png",
      description: "Processos de nacionalidade",
    },
    {
      title: "Vistos",
      href: "/dashboard/vistos",
      icon: "https://cdn-icons-png.flaticon.com/512/7082/7082001.png",
      description: "Processos de vistos",
    },
    {
      title: "Turismo",
      href: "/dashboard/turismo",
      icon: "https://cdn-icons-png.flaticon.com/512/2200/2200326.png",
      description: "Vistos de Turismo",
    },
  ];


  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r border-slate-200/50 w-64 bg-white/50 backdrop-blur-xl z-50">
        <Sidebar
          searchQuery={query}
          setSearchQuery={setQuery}
          pathname={pathname}
          menuItems={menuItems}
          onNavigate={() => setMobileMenuOpen(false)}
          user={user}
          handleLogout={handleLogout}
        />
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className={`${pathname === "/dashboard" ? "lg:hidden hidden" : "lg:hidden"} sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50`}>
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
                    searchQuery={query}
                    setSearchQuery={setQuery}
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
                alt="Silva & Ferrari"
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
        <main className={`flex-1 ${pathname === "/dashboard" ? "" : "p-4 lg:p-6"}`}>
          {query.trim() ? (
            <div className="p-6 max-w-7xl mx-auto w-full">
              <GlobalSearchResults
                results={results}
                isSearching={isSearching}
                query={query}
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <PageTransition key={pathname} className="w-full h-full">
                {children}
              </PageTransition>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
