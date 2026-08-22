import React from "react";
import Link from "next/link";
import { Music, ShieldCheck, Heart, ExternalLink, BookOpen } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#211B19] text-[#EDE7E1] pt-12 pb-8 border-t border-border-dark mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Purpose */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-amber-400">
                <Music className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white">ස්වර මඟ</span>
            </div>
            <p className="text-xs text-[#B8AEA3] leading-relaxed mb-4">
              ශ්‍රී ලංකා පාසල් පෙරදිග සංගීතය (6–11 ශ්‍රේණි) සඳහා මූලාශ්‍ර සමාලෝචනයට යටත් නොමිලේ විවෘත අධ්‍යාපනික ඉගෙනුම් වේදිකාව.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>100% වෙළඳ දැන්වීම් රහිතයි • ළමා ආරක්ෂිතයි</span>
            </div>
          </div>

          {/* Col 2: Navigation Strands */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 tracking-wide">
              ප්‍රධාන විෂය ධාරා
            </h4>
            <ul className="space-y-2 text-xs text-[#B8AEA3]">
              <li>
                <Link href="/strands/strand-fundamentals" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  මූලික සංගීත දැනුම
                </Link>
              </li>
              <li>
                <Link href="/strands/strand-swara-shruti" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  ස්වර හා ශ්‍රැති වාදය
                </Link>
              </li>
              <li>
                <Link href="/strands/strand-laya-tala" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  ලය හා තාල ශාස්ත්‍රය
                </Link>
              </li>
              <li>
                <Link href="/strands/strand-ragas" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  රාග ලෝකය
                </Link>
              </li>
              <li>
                <Link href="/instruments" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  පෙරදිග හා දේශීය වාද්‍ය භාණ්ඩ
                </Link>
              </li>
              <li>
                <Link href="/traditions" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  ශ්‍රී ලාංකීය ජන හා නාට්‍ය සංගීතය
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Tools & Resources */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 tracking-wide">
              මෙවලම් හා විභාග
            </h4>
            <ul className="space-y-2 text-xs text-[#B8AEA3]">
              <li>
                <Link href="/practice" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  ස්වර යතුරුපුවරුව & තාන්පුරය
                </Link>
              </li>
              <li>
                <Link href="/practice?tool=pitch" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  දේශීය හඬ තාරතා පුහුණුව
                </Link>
              </li>
              <li>
                <Link href="/practice?tool=tala" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  තාල දෘශ්‍යකාරකය
                </Link>
              </li>
              <li>
                <Link href="/exams" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  සා.පෙළ මාදිලි ප්‍රශ්න (සමාලෝචනයට යටත්)
                </Link>
              </li>
              <li>
                <Link href="/glossary" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  සිංහල සංගීත ශබ්දකෝෂය
                </Link>
              </li>
              <li>
                <Link href="/teachers" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  ගුරුවරුන් සඳහා වන මෙවලම්
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Canonical Sources & Policies */}
          <div>
            <h4 className="text-sm font-bold text-white mb-3 tracking-wide">
              මූලාශ්‍ර හා විනිවිදභාවය
            </h4>
            <ul className="space-y-2 text-xs text-[#B8AEA3]">
              <li>
                <Link href="/sources" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  නිල මූලාශ්‍ර නාමාවලිය (SOURCES.md)
                </Link>
              </li>
              <li>
                <Link href="/attributions" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  හිමිකම් හා ගෞරව සම්ප්‍රදාය (ATTRIBUTIONS.md)
                </Link>
              </li>
              <li>
                <Link href="/curriculum-map" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  විෂය නිර්දේශ සිතියම (Curriculum Map)
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors">
                  ළමා ආරක්ෂාව හා රහස්‍යතාව
                </Link>
              </li>
              <li>
                <Link href="/admin" className="inline-flex items-center min-h-[44px] py-2 hover:text-amber-400 transition-colors font-bold text-amber-300">
                  පරිපාලන සමාලෝචන පද්ධතිය (CMS)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Disclaimer & Traceability Statement */}
        <div className="pt-6 border-t border-white/10 text-center text-xs text-[#9E9489] space-y-2">
          <p>
            * වගකීම් ප්‍රකාශය: මෙම ඉගෙනුම් වේදිකාව ජාතික අධ්‍යාපන ආයතනයේ (NIE) සහ විභාග දෙපාර්තමේන්තුවේ විෂය නිර්දේශ නිපුණතාවන්ට අනුකූලව ශිෂ්‍ය ප්‍රයෝජනය පිණිස නිර්මාණය කරන ලද්දක් වන අතර, අධ්‍යාපන අමාත්‍යාංශයේ ඍජු නිල අනුමැතියක් සටහන් කර නොමැත.
          </p>
          <p>© {new Date().getFullYear()} ස්වර මඟ - Sri Lankan School Oriental Music Digital Platform. සියලුම හිමිකම් අධ්‍යාපනික භාවිතය සඳහා විවෘතයි.</p>
        </div>
      </div>
    </footer>
  );
};
