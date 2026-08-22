import type { GradeBandType } from "@/types/content";

/**
 * Canonical curriculum strand identifiers.  This module intentionally has no
 * dependency on the repository or publication policy so that runtime
 * contracts can use the same finite domain without creating an import cycle.
 */
export const CURRICULUM_STRAND_IDS = [
  "strand-fundamentals",
  "strand-swara-shruti",
  "strand-laya-tala",
  "strand-ragas",
  "strand-vocal-instrumental",
  "strand-instruments",
  "strand-folk-music",
  "strand-theatre-music",
  "strand-appreciation",
  "strand-creativity-tech",
  "strand-exam-practice",
] as const;

export type CurriculumStrandId = (typeof CURRICULUM_STRAND_IDS)[number];

export interface StrandInfo {
  id: CurriculumStrandId;
  name_si: string;
  name_en: string;
  description_si: string;
  iconName: string;
  gradeBands: GradeBandType[];
}

export const CURRICULUM_STRANDS: StrandInfo[] = [
  {
    id: "strand-fundamentals",
    name_si: "මූලික සංගීත දැනුම",
    name_en: "Music Fundamentals",
    description_si: "නාදය, ශබ්දයේ ලක්ෂණ සහ සංගීත මූලධර්ම",
    iconName: "Volume2",
    gradeBands: ["6-7", "8-9"],
  },
  {
    id: "strand-swara-shruti",
    name_si: "ස්වර හා ශ්‍රැති",
    name_en: "Swara and Shruti",
    description_si: "සප්ත ස්වර, ශුද්ධ/කෝමල/තීව්‍ර ස්වර, සප්තක සහ ශ්‍රැති වාදය",
    iconName: "Music",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-laya-tala",
    name_si: "ලය හා තාල",
    name_en: "Laya and Tala",
    description_si: "මාත්‍රා, විභාග, තාළි, ඛාලි සහ උත්තර භාරතීය තාල",
    iconName: "Activity",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-ragas",
    name_si: "රාග ලෝකය",
    name_en: "World of Ragas",
    description_si: "ථාට 10, රාග ලක්ෂණ, ආරෝහණ/අවරෝහණ සහ පකඩ්",
    iconName: "Compass",
    gradeBands: ["8-9", "10-11"],
  },
  {
    id: "strand-vocal-instrumental",
    name_si: "ගායන හා වාදන පුහුණුව",
    name_en: "Vocal and Instrumental Practice",
    description_si: "හඬ පුහුණුව, ආසන, තාන්පුර ශ්‍රැතිය හා අලංකාර",
    iconName: "Mic",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-instruments",
    name_si: "වාද්‍ය භාණ්ඩ",
    name_en: "Musical Instruments",
    description_si: "චතුර්විධ වර්ගීකරණය, සිතාරය, තබ්ලාව සහ දේශීය බෙර",
    iconName: "Radio",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-folk-music",
    name_si: "ජන හා දේශීය සංගීතය",
    name_en: "Folk and Indigenous Music",
    description_si: "ගොයම්, කරත්ත, පාරු කවි, රබන් පද සහ ශාන්තිකර්ම",
    iconName: "Feather",
    gradeBands: ["6-7", "8-9", "10-11"],
  },
  {
    id: "strand-theatre-music",
    name_si: "නාට්‍ය හා රංග සංගීතය",
    name_en: "Theatre and Dramatic Music",
    description_si: "නාඩගම්, නූර්ති, සොකරි සහ කෝලම් සංගීත සම්ප්‍රදාය",
    iconName: "Drama",
    gradeBands: ["8-9", "10-11"],
  },
  {
    id: "strand-appreciation",
    name_si: "ගී රසවිඳීම හා ඉතිහාසය",
    name_en: "Music Appreciation and History",
    description_si: "ගීත විචාරය, සංගීතමය අංග සහ පුරෝගාමීන්",
    iconName: "Sparkles",
    gradeBands: ["10-11"],
  },
  {
    id: "strand-creativity-tech",
    name_si: "නිර්මාණ හා සංගීත තාක්ෂණය",
    name_en: "Creativity and Music Tech",
    description_si: "තනු හා රිද්ම නිර්මාණ, ප්‍රස්තාරගත කිරීම සහ ඩිජිටල් මෙවලම්",
    iconName: "Wand2",
    gradeBands: ["8-9", "10-11"],
  },
  {
    id: "strand-exam-practice",
    name_si: "ප්‍රශ්න හා විභාග පුහුණුව",
    name_en: "Exam Practice",
    description_si: "10–11 ශ්‍රේණි විභාග අභ්‍යාස සහ මූලාශ්‍ර සමාලෝචන සටහන්",
    iconName: "Award",
    gradeBands: ["10-11"],
  },
];
