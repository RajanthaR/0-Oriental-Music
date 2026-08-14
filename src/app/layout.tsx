import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "ස්වර මඟ (Swara Maga) - ශ්‍රී ලංකා පාසල් පෙරදිග සංගීතය ඉගෙනුම් වේදිකාව",
  description:
    "6 ශ්‍රේණියේ සිට 13 ශ්‍රේණිය (උසස් පෙළ) දක්වා ශ්‍රී ලාංකීය පාසල් සිසුන් සඳහා නිපුණතා පාදක පෙරදිග සංගීතය ඩිජිටල් ඉගෙනුම් වේදිකාව.",
  keywords: [
    "පෙරදිග සංගීතය",
    "ස්වර මඟ",
    "Sri Lankan Oriental Music",
    "රාග",
    "තාල",
    "සාමාන්‍ය පෙළ සංගීතය",
    "උසස් පෙළ සංගීතය",
    "NIE Sri Lanka",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="si">
      <body className="min-h-screen flex flex-col bg-background text-text antialiased">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
