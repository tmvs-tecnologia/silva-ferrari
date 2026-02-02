import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this exists or I'll implement a simple one

export interface SearchResultItem {
    module: string;
    id: number;
    title: string;
    subtitle: string;
    status: string;
    href: string;
}

export function useGlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        const q = debouncedQuery.trim();
        if (!q) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        let active = true;
        setIsSearching(true);

        const fetchAll = async () => {
            try {
                const enc = encodeURIComponent(q);
                // Using Promise.allSettled to avoid failing everything if one endpoint fails
                const responses = await Promise.allSettled([
                    fetch(`/api/acoes-civeis?search=${enc}&limit=5`).then(r => r.ok ? r.json() : []),
                    fetch(`/api/acoes-trabalhistas?search=${enc}&limit=5`).then(r => r.ok ? r.json() : []),
                    fetch(`/api/acoes-criminais?search=${enc}&limit=5`).then(r => r.ok ? r.json() : []),
                    fetch(`/api/compra-venda-imoveis?search=${enc}&limit=5`).then(r => r.ok ? r.json() : []),
                    fetch(`/api/perda-nacionalidade?search=${enc}&limit=5`).then(r => r.ok ? r.json() : []),
                    fetch(`/api/vistos?search=${enc}&limit=5`).then(r => r.ok ? r.json() : []),
                    fetch(`/api/turismo?search=${enc}&limit=5`).then(r => r.ok ? r.json() : []),
                ]);

                if (!active) return;

                const getValue = (res: PromiseSettledResult<any>) => res.status === 'fulfilled' ? res.value : [];

                const [civeis, trab, crim, comp, perda, vistos, turismo] = responses.map(getValue);

                const toItem = (it: any, mod: string, slug: string) => {
                    // Fallback logic for title
                    const title = it?.clientName || it?.client_name || it?.enderecoImovel || it?.endereco_imovel || "Sem Título";

                    // Fallback logic for status
                    const status = it?.status || "Em Andamento";

                    return {
                        module: mod,
                        id: it.id,
                        title,
                        subtitle: it?.type || mod,
                        status,
                        href: `/dashboard/${slug}/${it.id}`,
                    };
                };

                const all: SearchResultItem[] = [
                    ...(Array.isArray(civeis) ? civeis : []).map((it: any) => toItem(it, "Ações Cíveis", "acoes-civeis")),
                    ...(Array.isArray(trab) ? trab : []).map((it: any) => toItem(it, "Ações Trabalhistas", "acoes-trabalhistas")),
                    ...(Array.isArray(crim) ? crim : []).map((it: any) => toItem(it, "Ações Criminais", "acoes-criminais")),
                    ...(Array.isArray(comp) ? comp : []).map((it: any) => toItem(it, "Compra e Venda", "compra-venda")),
                    ...(Array.isArray(perda) ? perda : []).map((it: any) => toItem(it, "Perda de Nacionalidade", "perda-nacionalidade")),
                    ...(Array.isArray(vistos) ? vistos : []).map((it: any) => toItem(it, "Vistos", "vistos")),
                    ...(Array.isArray(turismo) ? turismo : []).map((it: any) => toItem(it, "Turismo", "turismo")),
                ];

                setResults(all);
            } catch (err) {
                console.error("Search error", err);
                setResults([]);
            } finally {
                if (active) setIsSearching(false);
            }
        };

        fetchAll();

        return () => { active = false; };
    }, [debouncedQuery]);

    return {
        query,
        setQuery,
        results,
        isSearching
    };
}

// Simple debounce hook if it doesn't exist in the project separately,
// though usually it's good practice to have it in a separate file.
// I will assume for now I can place it here or check if it exists.
// Checking file existence first is better practice but for speed in this tool loop
// I will include the hook implementation in a separate file if needed or inline it if I must.
// But wait, the previous code didn't import it. I'll check for it.
