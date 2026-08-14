"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Music,
  Compass,
  BookOpen,
  Radio,
  Feather,
  Drama,
  Sparkles,
  Award,
  Users,
  ShieldAlert,
  Search,
  Menu,
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ProgressStorage } from "@/lib/storage/progress-storage";

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLowBandwidth, setIsLowBandwidth] = useState(false);

  useEffect(() => {
    setIsLowBandwidth(ProgressStorage.getLowBandwidthMode());
  }, []);

  const toggleLowBandwidth = () => {
    const next = !isLowBandwidth;
    setIsLowBandwidth(next);
    ProgressStorage.setLowBandwidthMode(next);
    if (next) {
      document.body.classList.add("reduced-motion", "low-bandwidth-mode");
    } else {
      document.body.classList.remove("reduced-motion", "low-bandwidth-mode");
    }
  };

  const navLinks = [
    { href: "/", label_si: "මුල් පිටුව", icon: Music },
    { href: "/learning-paths", label_si: "ඉගෙනුම් මාර්ග", icon: Compass },
    { href: "/lessons", label_si: "පාඩම් මාලාව", icon: BookOpen },
    { href: "/ragas", label_si: "රාග ලෝකය", icon: Sparkles },
    { href: "/talas", label_si: "ලය හා තාල", icon: Feather },
    { href: "/instruments", label_si: "වාද්‍ය භාණ්ඩ", icon: Radio },
    { href: "/traditions", label_si: "ජන සංගීතය", icon: Feather },
    { href: "/theatre", label_si: "නාට්‍ය සංගීතය", icon: Drama },
    { href: "/practice", label_si: "පුහුණු මෙවලම්", icon: Music },
    { href: "/exams", label_si: "විභාග පුහුණුව", icon: Award },
    { href: "/glossary", label_si: "ශබ්දකෝෂය", icon: BookOpen },
    { href: "/progress", label_si: "මගේ ප්‍රගතිය", icon: Sparkles },
    { href: "/teachers", label_si: "ගුරුවරුන්ට", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-border shadow-warm-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-amber-400 shadow-warm-sm group-hover:scale-105 transition-transform">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-primary tracking-tight flex items-center gap-1">
              ස්වර මඟ
            </span>
            <span className="text-[10px] text-text-muted font-medium block leading-none">
              පෙරදිග සංගීතය ඉගෙනුම් වේදිකාව
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Quick Links */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-text-secondary">
          <Link
            href="/learning-paths"
            className={`px-3 py-1.5 rounded-lg transition-colors hover:text-primary ${
              pathname.startsWith("/learning-paths") ? "bg-primary-50 text-primary font-bold" : ""
            }`}
          >
            ඉගෙනුම් මාර්ග
          </Link>
          <Link
            href="/lessons"
            className={`px-3 py-1.5 rounded-lg transition-colors hover:text-primary ${
              pathname.startsWith("/lessons") ? "bg-primary-50 text-primary font-bold" : ""
            }`}
          >
            පාඩම්
          </Link>
          <Link
            href="/ragas"
            className={`px-3 py-1.5 rounded-lg transition-colors hover:text-primary ${
              pathname.startsWith("/ragas") ? "bg-primary-50 text-primary font-bold" : ""
            }`}
          >
            රාග
          </Link>
          <Link
            href="/talas"
            className={`px-3 py-1.5 rounded-lg transition-colors hover:text-primary ${
              pathname.startsWith("/talas") ? "bg-primary-50 text-primary font-bold" : ""
            }`}
          >
            තාල
          </Link>
          <Link
            href="/practice"
            className={`px-3 py-1.5 rounded-lg transition-colors hover:text-primary ${
              pathname.startsWith("/practice") ? "bg-primary-50 text-primary font-bold" : ""
            }`}
          >
            පුහුණු මෙවලම්
          </Link>
          <Link
            href="/exams"
            className={`px-3 py-1.5 rounded-lg transition-colors hover:text-primary ${
              pathname.startsWith("/exams") ? "bg-primary-50 text-primary font-bold" : ""
            }`}
          >
            විභාග
          </Link>
          <Link
            href="/progress"
            className={`px-3 py-1.5 rounded-lg transition-colors hover:text-primary ${
              pathname === "/progress" ? "bg-primary-50 text-primary font-bold" : ""
            }`}
          >
            ප්‍රගතිය
          </Link>
          <Link
            href="/teachers"
            className={`px-3 py-1.5 rounded-lg transition-colors hover:text-primary ${
              pathname.startsWith("/teachers") ? "bg-primary-50 text-primary font-bold" : ""
            }`}
          >
            ගුරු පියස
          </Link>
        </nav>

        {/* Right Action Icons: Low bandwidth toggle, Search shortcut & Mobile Menu button */}
        <div className="flex items-center gap-2">
          {/* Low Bandwidth Mode Toggle Button */}
          <button
            type="button"
            onClick={toggleLowBandwidth}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isLowBandwidth
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : "bg-surface-warm text-text-muted border-border hover:bg-white"
            }`}
            title={isLowBandwidth ? "අඩු දත්ත මාදිලිය සක්‍රියයි" : "අඩු දත්ත මාදිලිය (Lite Mode)"}
            aria-label="අඩු දත්ත මාදිලිය මාරු කරන්න"
          >
            {isLowBandwidth ? <WifiOff className="w-4 h-4 text-amber-700" /> : <Wifi className="w-4 h-4" />}
            <span className="hidden sm:inline text-[11px]">
              {isLowBandwidth ? "Lite Mode" : "දත්ත සුරකින්න"}
            </span>
          </button>

          {/* Search Quick Link */}
          <Link
            href="/search"
            className="p-2 rounded-xl border border-border bg-surface-warm text-text-secondary hover:text-primary hover:bg-white transition-all"
            aria-label="සෙවුම වෙත යන්න"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Mobile Drawer Hamburger Button */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl border border-border bg-surface-warm text-text"
            aria-label="මෙනුව විවෘත කරන්න"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-border px-4 pt-3 pb-6 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 mb-4">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                    isActive
                      ? "bg-primary text-white border-primary-dark shadow-sm"
                      : "bg-surface-warm text-text border-border-light hover:bg-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label_si}</span>
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border-light flex items-center justify-between text-xs text-text-muted">
            <Link
              href="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-primary font-bold hover:underline"
            >
              පරිපාලන සමාලෝචන පුවරුව (CMS)
            </Link>
            <Link
              href="/privacy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:underline"
            >
              ළමා ආරක්ෂාව
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
