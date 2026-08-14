import React from "react";
import { ShieldCheck, Lock, EyeOff, Radio, CheckCircle2 } from "lucide-react";

export default function PrivacyAndChildSafetyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-xs font-bold text-green-900 mb-3">
          <ShieldCheck className="w-4 h-4 text-forest-green" />
          <span>ළමා ආරක්ෂාව හා පෞද්ගලිකත්වය</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-primary mb-2">
          ළමා ආරක්ෂාව සහ රහස්‍යතා ප්‍රතිපත්තිය
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
          ශ්‍රී ලංකා පාසල් සිසුන්ගේ අධ්‍යාපනික පෞද්ගලිකත්වය සහ මාර්ගගත ආරක්ෂාව සුරැකීම සඳහා වන අපගේ දැඩි ප්‍රමිතීන්.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border shadow-warm-md space-y-6 text-xs sm:text-sm text-text-secondary leading-relaxed">
        <section className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <Lock className="w-5 h-5 text-forest-green" />
            <h2>1. මයික්‍රෆෝන භාවිතය සහ ශබ්ද විශ්ලේෂණය</h2>
          </div>
          <p>
            ස්වර තාරතා පුහුණු මෙවලම (Pitch Practice) මඟින් ඔබේ මයික්‍රෆෝනය භාවිත කරන්නේ ඔබ සජීවීව &apos;අරඹන්න&apos; ක්ලික් කළ විට පමණි. එම ශබ්ද සංඛ්‍යාතය (Hz) විශ්ලේෂණය වන්නේ ඔබගේ පරිගණකයේ හෝ දුරකථනයේ බ්‍රවුසරය තුළ පමණි (100% Client-Side Local Autocorrelation).
          </p>
          <div className="bg-green-50 p-4 rounded-2xl border border-green-200 text-green-950 font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-forest-green shrink-0" />
            <span>කිසිදු හඬ පටයක් කිසිම අවස්ථාවක සේවාදායකයකට (Server) උඩුගත වීම හෝ පටිගත වීම සිදු නොවේ.</span>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <EyeOff className="w-5 h-5 text-accent" />
            <h2>2. වෙළඳ දැන්වීම් හා හඹායෑම් රහිත පරිසරය (Zero Tracking & No Ads)</h2>
          </div>
          <p>
            මෙම වෙබ් අඩවිය තුළ කිසිදු තෙවන පාර්ශවීය වෙළඳ දැන්වීමක් (No Ads), වෙළඳ හඹායෑම් කුකීස් (No Ad Tracking Cookies), හෝ ළමුන්ගේ පෞද්ගලික තොරතුරු රැස් කිරීමක් සිදු නොවේ.
          </p>
        </section>

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <Radio className="w-5 h-5 text-primary" />
            <h2>3. ගිණුම් නිර්මාණය කිරීමකින් තොරව භාවිතය</h2>
          </div>
          <p>
            සිසුන්ට කිසිදු දුරකථන අංකයක්, ඊමේල් ලිපිනයක් හෝ මුරපදයක් ලබාදීමකින් තොරව ඍජුවම වේදිකාවට පිවිස ඉගෙනුම් කටයුතුවල නිරත විය හැක. ඔබගේ පාඩම් ප්‍රගතිය සුරැකෙන්නේ ඔබගේම උපාංගයේ බ්‍රවුසරය (LocalStorage) තුළ පමණි.
          </p>
        </section>
      </div>
    </div>
  );
}
