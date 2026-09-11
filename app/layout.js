import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SaaS Starter",
  description: "Next.js server-side boilerplate with Firebase Auth",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen bg-[#FDFDFF] antialiased">
        <FavoritesProvider>{children}</FavoritesProvider>
      </body>
    </html>
  );
}
