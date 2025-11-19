import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Silva & Ferrari - Sistema Jurídico Integrado",
  description: "Sistema completo de gestão jurídica para escritórios de advocacia. Gerencie clientes, processos, documentos e muito mais de forma integrada e eficiente.",
  keywords: ["advocacia", "sistema jurídico", "gestão de processos", "escritório de advocacia", "Silva & Ferrari"],
  authors: [{ name: "Silva & Ferrari Escritório de Advocacia" }],
  creator: "Silva & Ferrari",
  publisher: "Silva & Ferrari",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://silvaferrariadvogados.vercel.app"),
  openGraph: {
    title: "Silva & Ferrari - Sistema Jurídico Integrado",
    description: "Sistema completo de gestão jurídica para escritórios de advocacia. Gerencie clientes, processos, documentos e muito mais.",
    url: "https://silvaferrariadvogados.vercel.app",
    siteName: "Silva & Ferrari",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Silva & Ferrari - Sistema Jurídico Integrado",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Silva & Ferrari - Sistema Jurídico Integrado",
    description: "Sistema completo de gestão jurídica para escritórios de advocacia.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased force-light">
        <ErrorReporter />
        {/* Temporarily disabled VisualEditsMessenger to test preview issues
        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />
        */}
        {children}
        {/* Temporarily disabled VisualEditsMessenger to test preview issues
        <VisualEditsMessenger />
        */}
      </body>
    </html>
  );
}
