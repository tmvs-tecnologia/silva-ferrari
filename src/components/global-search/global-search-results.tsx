import { motion } from "motion/react";
import { SearchResultItem } from "@/hooks/use-global-search";
import { SearchResultCard } from "./search-result-card";
import { AlertCircle, Search } from "lucide-react";

interface GlobalSearchResultsProps {
    results: SearchResultItem[];
    isSearching: boolean;
    query: string;
}

export function GlobalSearchResults({ results, isSearching, query }: GlobalSearchResultsProps) {
    if (isSearching) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-slate-100 border-t-blue-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Search className="h-5 w-5 text-blue-500" />
                    </div>
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Buscando resultados...</p>
            </div>
        );
    }

    if (results.length === 0 && query) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 space-y-4 text-center"
            >
                <div className="h-20 w-20 rounded-full bg-slate-50 flex items-center justify-center">
                    <Search className="h-10 w-10 text-slate-300" />
                </div>
                <div className="max-w-md">
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Nenhum resultado encontrado</h3>
                    <p className="text-slate-500 text-sm">
                        Não encontramos nada para <span className="font-medium text-slate-900">"{query}"</span>.
                        Tente verificar a ortografia ou usar termos mais genéricos.
                    </p>
                </div>
            </motion.div>
        );
    }

    // Group results by module
    const groupedResults = results.reduce((acc, item) => {
        if (!acc[item.module]) acc[item.module] = [];
        acc[item.module].push(item);
        return acc;
    }, {} as Record<string, SearchResultItem[]>);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">
                    Resultados da busca
                    <span className="ml-2 text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {results.length} encontrado{results.length !== 1 ? 's' : ''}
                    </span>
                </h2>
            </div>

            {Object.entries(groupedResults).map(([moduleName, items], moduleIndex) => (
                <motion.section
                    key={moduleName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: moduleIndex * 0.1 }}
                    className="space-y-4"
                >
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">{moduleName}</h3>
                        <span className="text-xs text-slate-400">({items.length})</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {items.map((item, index) => (
                            <SearchResultCard key={`${item.module}-${item.id}`} item={item} index={index} />
                        ))}
                    </div>
                </motion.section>
            ))}
        </div>
    );
}
