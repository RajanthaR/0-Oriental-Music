import React from "react";
import Link from "next/link";
import { Heart, ShieldCheck, BookOpen, Music } from "lucide-react";

export default function AttributionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-100 text-xs font-bold text-primary mb-3">
          <Heart className="w-4 h-4 text-rose-600" />
          <span>හිමිකම් හා කෘතඥතාව</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          කෘතඥතාව සහ හිමිකම් සටහන
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          ශ්‍රී ලංකා පෙරදිග සංගීත ගුරු පරපුර, සංගීත පර්යේෂකයන් සහ විවෘත මෘදුකාංග නිර්මාණකරුවන් වෙත අපගේ උසස් ගෞරවය පුද කරමු.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-md space-y-6 text-xs sm:text-sm text-text-secondary leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">1. අධ්‍යාපනික හා විෂය නිර්දේශ මූලාශ්‍ර</h2>
          <p>
            ජාතික අධ්‍යාපන ආයතනය (NIE), අධ්‍යාපන ප්‍රකාශන දෙපාර්තමේන්තුව සහ ශ්‍රී ලංකා විභාග දෙපාර්තමේන්තුව විසින් ප්‍රකාශිත පෙරදිග සංගීතය විෂය නිර්දේශ, ගුරු මාර්ගෝපදේශ සහ ඇගයීම් වාර්තාවල අන්තර්ගත නිපුණතා ආකෘති මෙහි සංකල්ප සකස් කිරීමට පාදක කරගන්නා ලදී.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">2. කෘත්‍රිම ශ්‍රව්‍ය තාක්ෂණය (Web Audio Synthesis)</h2>
          <p>
            මෙම වේදිකාවේ අඩංගු සියලුම ස්වර, තාන්පුර නාද සහ තබ්ලා බෝල් ශබ්ද බ්‍රවුසරයේ Web Audio API මඟින් සජීවීව සංස්ලේෂණය (Synthesized) කෙරේ. කිසිදු ප්‍රකාශන හිමිකම් සහිත වාණිජ ශබ්ද පටයක් බාගත කර හෝ ප්‍රතිනිෂ්පාදනය කර නොමැත.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-primary">3. නිදහස් හා විවෘත මූලාශ්‍ර මෘදුකාංග</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Next.js & React (MIT License)</li>
            <li>Tailwind CSS (MIT License)</li>
            <li>Lucide Icons (ISC License)</li>
            <li>Google Fonts: Noto Sans Sinhala & Noto Serif Sinhala (SIL Open Font License)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
