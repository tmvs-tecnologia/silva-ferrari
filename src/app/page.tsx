"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/page-transition";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        // Force light mode by default to match original design
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Credenciais inválidas");
                setLoading(false);
                return;
            }

            if (typeof window !== "undefined") {
                localStorage.setItem("user", JSON.stringify(data));
            }

            setTimeout(() => {
                router.push("/dashboard");
            }, 100);
        } catch (err) {
            console.error("Login error:", err);
            alert("Erro ao conectar com o servidor");
            setLoading(false);
        }
    };

    return (
        <>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600;700&display=swap" rel="stylesheet" />
            <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

            {/* Force explicit background color to override global styles */}
            <div className={`min-h-screen flex items-center justify-center relative overflow-hidden transition-colors duration-500 font-sans selection:bg-primary-custom selection:text-white bg-background-light text-slate-800 z-0`}>

                {/* Background Gradients & Effects */}
                <style jsx global>{`
                .bg-custom-gradient {
                    background-image: 
                        radial-gradient(at 0% 0%, hsla(217,91%,60%,0.2) 0px, transparent 50%),
                        radial-gradient(at 100% 0%, hsla(196,91%,70%,0.2) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, hsla(245,91%,70%,0.2) 0px, transparent 50%),
                        radial-gradient(at 0% 100%, hsla(280,91%,70%,0.2) 0px, transparent 50%);
                    background-attachment: fixed;
                    background-size: cover;
                }
                .prism-flare {
                    position: absolute;
                    width: 300px;
                    height: 300px;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 0;
                    filter: blur(40px);
                    mix-blend-mode: overlay;
                }
            `}</style>

                <div className="absolute inset-0 bg-custom-gradient -z-10"></div>

                <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full blur-[100px] animate-pulse"></div>
                <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-300/30 rounded-full blur-[100px] animate-pulse delay-1000"></div>
                <div className="prism-flare top-1/4 left-1/4 animate-float opacity-60"></div>
                <div className="prism-flare bottom-1/4 right-1/4 animate-float delay-500 opacity-60"></div>

                <main className="w-full max-w-md p-6 relative z-10 flex flex-col items-center justify-center">
                    <PageTransition>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="text-center mb-8"
                        >
                            <div className="flex items-center justify-center space-x-3 mb-2">
                                <div className="relative w-[240px] h-[80px]">
                                    <Image
                                        src="https://i.imgur.com/9R0VFkm.png"
                                        alt="Sistema Jurídico Logo"
                                        fill
                                        className="object-contain"
                                        priority
                                        unoptimized
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="w-full bg-glass-light backdrop-blur-xl border border-glass-border-light rounded-3xl p-8 shadow-glass relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none"></div>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 drop-shadow-sm">Sistema Jurídico</h2>
                                <p className="text-sm text-slate-500 mt-1 font-medium">Gestão de Ações e Processos</p>
                            </div>

                            <form className="space-y-6" onSubmit={handleLogin}>
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="group/input"
                                >
                                    <label className="block text-sm font-medium text-slate-600 mb-1 ml-1" htmlFor="email">Email</label>
                                    <div className="relative transition-all duration-300 transform focus-within:scale-[1.02]">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 text-[20px] group-focus-within/input:text-primary-custom transition-colors">mail</span>
                                        </div>
                                        <input
                                            className="block w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-custom/50 focus:border-primary-custom transition-all shadow-inner"
                                            id="email"
                                            placeholder="seu@email.com"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="group/input"
                                >
                                    <label className="block text-sm font-medium text-slate-600 mb-1 ml-1" htmlFor="password">Senha</label>
                                    <div className="relative transition-all duration-300 transform focus-within:scale-[1.02]">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="material-symbols-outlined text-slate-400 text-[20px] group-focus-within/input:text-primary-custom transition-colors">lock</span>
                                        </div>
                                        <input
                                            className="block w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 bg-white/50 backdrop-blur-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-custom/50 focus:border-primary-custom transition-all shadow-inner"
                                            id="password"
                                            placeholder="••••••••"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={loading}
                                        />
                                        <div
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer hover:text-primary-custom transition-colors"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            <span className="material-symbols-outlined text-slate-400 text-[20px]">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <a className="text-xs font-medium text-slate-500 hover:text-primary-custom transition-colors" href="#">Esqueceu a senha?</a>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="pt-2"
                                >
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-primary-custom to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform transition-all duration-200 relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {loading ? "Entrando..." : "Entrar"}
                                            {!loading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                                    </motion.button>
                                </motion.div>
                            </form>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="mt-8 text-center"
                        >
                            <p className="text-xs text-slate-500 font-medium">© 2025 Silva & Ferrari Advogados Associados.</p>
                            <p className="text-[10px] text-slate-400 mt-1">Todos os direitos reservados.</p>
                        </motion.div>
                    </PageTransition>
                </main>
            </div>
        </>
    );
}