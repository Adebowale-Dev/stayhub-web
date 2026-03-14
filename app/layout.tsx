import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/themeprovider";
export const metadata: Metadata = {
    title: "StayHub - Student Accommodation Management",
    description: "Manage student hostel accommodation with ease",
    icons: {
        icon: '/favicon.ico',
    },
    manifest: '/manifest.json',
};
export const viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        </ThemeProvider>
      </body>
    </html>);
}
