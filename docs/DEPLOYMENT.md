# ස්ථාපන සහ යෙදවුම් මාර්ගෝපදේශය (DEPLOYMENT.md)
## “ස්වර මඟ” පෙරදිග සංගීතය ඉගෙනුම් වේදිකාව

මෙම ලේඛනය “ස්වර මඟ” යෙදුම දේශීයව (Local development), පරීක්ෂණ ධාවනය (Testing), නිෂ්පාදන ගොඩනැගීම (Production build), සහ සජීවී සේවාදායකයක යෙදවීම (Deployment) සඳහා වන සම්පූර්ණ විධාන සහ උපදෙස් සපයයි.

---

## 1. පද්ධති අවශ්‍යතා (Prerequisites)

- **Node.js**: v18.18.0 හෝ ඊට ඉහළ (නිර්දේශිත: v20 LTS හෝ v22)
- **NPM**: v9.0.0 හෝ ඊට ඉහළ
- **Web Browser**: නවීන ඕනෑම බ්‍රවුසරයක් (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+) Web Audio API සහ Service Worker සහාය සහිත.

---

## 2. දේශීය සංවර්ධනය සහ ධාවනය (Local Development)

```bash
# 1. පරායත්තතා ස්ථාපනය (Install dependencies)
npm install

# 2. දේශීය සංවර්ධන සේවාදායකය ආරම්භ කිරීම (Start dev server)
npm run dev

# බ්‍රවුසරය මඟින් පිවිසෙන්න: http://localhost:3000
```

---

## 3. පරීක්ෂණ සහ තත්ත්ව පරීක්ෂාව (Testing & Code Quality)

```bash
# වර්ග පරීක්ෂාව (Type-check)
npm run type-check

# කේත විලාස පරීක්ෂාව (Linting)
npm run lint

# ස්වයංක්‍රීය ඒකක සහ සංරචක පරීක්ෂණ (Unit & Component Tests)
npm run test

# පරීක්ෂණ නිරීක්ෂණ මාදිලිය (Watch Mode)
npm run test:watch
```

---

## 4. නිෂ්පාදන ගොඩනැගීම (Production Build)

```bash
# නිෂ්පාදන සංස්කරණය ගොඩනැගීම (Build production bundle)
npm run build

# නිෂ්පාදන සේවාදායකය දේශීයව ධාවනය (Start production server)
npm run start
```

---

## 5. නොබැඳි භාවිතය සහ PWA (Offline & PWA Deployment)

- යෙදුම ස්වයංක්‍රීයව Service Worker මඟින් App Shell එක, සජීවිකරණ, අන්තර්ගත දත්ත ගොනු, සහ ශිෂ්‍ය ප්‍රගතිය දේශීයව Cache කරගනී.
- අන්තර්ජාල සම්බන්ධතාව බිඳවැටුණු අවස්ථාවලදී පවා කලින් පරිශීලනය කළ පාඩම් සහ ස්වර යතුරුපුවරුව නොබැඳිව (Offline) පරිහරණය කළ හැක.

---

## 6. පරිසර විචල්‍යයන් (Environment Variables)

යෙදුම 100% බ්‍රවුසර පාදක දේශීය ශ්‍රව්‍ය තාක්ෂණයෙන් ක්‍රියාත්මක වන බැවින් කිසිදු මිල අධික හෝ බාහිර ගෙවුම් API යතුරු (Paid API Keys) අවශ්‍ය නොවේ. 

අනාගත විශ්ලේෂණ හෝ වෛකල්පිත වින්‍යාසයන් සඳහා `.env.example` ගොනුව භාවිතා කළ හැක:
```env
NEXT_PUBLIC_APP_NAME="ස්වර මඟ"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_LOCALE="si"
```
