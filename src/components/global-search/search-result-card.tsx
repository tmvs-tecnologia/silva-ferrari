import { motion } from "motion/react";
import { ArrowRight, FileText, Gavel, Scale, Home, Globe, Plane } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchResultItem } from "@/hooks/use-global-search";
import Link from "next/link";

interface SearchResultCardProps {
    item: SearchResultItem;
    index: number;
}

const getModuleIcon = (module: string) => {
    switch (module) {
        case "Ações Cíveis": return <Scale className="h-4 w-4 text-blue-500" />;
        case "Ações Trabalhistas": return <Gavel className="h-4 w-4 text-amber-500" />;
        case "Ações Criminais": return <Gavel className="h-4 w-4 text-red-500" />;
        case "Compra e Venda": return <Home className="h-4 w-4 text-emerald-500" />;
        case "Perda de Nacionalidade": return <Globe className="h-4 w-4 text-indigo-500" />;
        case "Vistos": return <FileText className="h-4 w-4 text-purple-500" />;
        case "Turismo": return <Plane className="h-4 w-4 text-sky-500" />;
        default: return <FileText className="h-4 w-4 text-slate-500" />;
    }
};

const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("finalizado") || s.includes("concluído") || s.includes("aprovado")) return "bg-emerald-500/10 text-emerald-700 border-emerald-200";
    if (s.includes("cancelado") || s.includes("rejeitado")) return "bg-red-500/10 text-red-700 border-red-200";
    if (s.includes("aguardando") || s.includes("análise")) return "bg-amber-500/10 text-amber-700 border-amber-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
};

export function SearchResultCard({ item, index }: SearchResultCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
        >
            <Link href={item.href}>
                <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200/60 hover:border-blue-300/50 bg-white/80 backdrop-blur-sm cursor-pointer overflow-hidden">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                                {getModuleIcon(item.module)}
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h4>
                                    <Badge variant="outline" className={`hidden sm:inline-flex text-[10px] h-5 px-1.5 font-normal ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="font-medium">{item.module}</span>
                                    {item.subtitle && (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                                            <span className="truncate">{item.subtitle}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <Badge variant="outline" className={`sm:hidden text-[10px] h-5 px-1.5 font-normal ${getStatusColor(item.status)}`}>
                                {item.status}
                            </Badge>
                            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300">
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-gradient-to-r from-blue-500 to-indigo-500 group-hover:w-full transition-all duration-500" />
                </Card>
            </Link>
        </motion.div>
    );
}
