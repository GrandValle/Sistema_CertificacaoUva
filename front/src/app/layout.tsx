import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner"; // Importando o componente de notificações
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Sistema Certificação-Uva",
    description: "GrandValle Certifications",
    icons: {
        icon: "/navegador.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-br" suppressHydrationWarning>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                {/* O Toaster fica aqui para as notificações aparecerem sobre as telas */}
                <Toaster position="top-right" richColors closeButton />

                {children}
            </body>
        </html>
    );
}