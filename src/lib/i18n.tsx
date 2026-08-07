import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { extraAr, extraEn, extraFr } from "./i18n-extra";


export type Lang = "fr" | "ar" | "en";

export const LANGS: { code: Lang; label: string; short: string; dir: "ltr" | "rtl" }[] = [
  { code: "fr", label: "Français", short: "FR", dir: "ltr" },
  { code: "ar", label: "العربية", short: "AR", dir: "rtl" },
  { code: "en", label: "English", short: "EN", dir: "ltr" },
];

type Dict = Record<string, string>;

const fr: Dict = {
  "nav.search": "Rechercher un trajet",
  "nav.publish": "Publier un trajet",
  "nav.how": "Comment ça marche",
  "nav.help": "Aide",
  "nav.login": "Se connecter",
  "nav.signup": "S'inscrire",
  "hero.badge": "Le covoiturage intelligent au Maroc",
  "hero.title": "Voyagez ensemble,",
  "hero.titleAccent": "économisez davantage.",
  "hero.subtitle":
    "DiniM3ak relie les conducteurs qui ont des places libres aux passagers qui vont dans la même direction, partout au Maroc.",
  "search.from": "Départ",
  "search.to": "Destination",
  "search.date": "Date",
  "search.seats": "Passagers",
  "search.cta": "Rechercher",
  "search.fromPlaceholder": "Casablanca",
  "search.toPlaceholder": "Marrakech",
  "search.popular": "Trajets populaires",
  "stats.members": "Membres vérifiés",
  "stats.routes": "Villes desservies",
  "stats.saved": "Économisé par trajet",
  "stats.co2": "CO₂ évité",
  "how.title": "Comment ça marche",
  "how.subtitle": "Trois étapes, deux minutes. Pas plus.",
  "how.s1.title": "Cherchez votre trajet",
  "how.s1.text":
    "Indiquez votre ville de départ, votre destination et la date. Comparez les prix en dirhams et les horaires.",
  "how.s2.title": "Réservez en toute confiance",
  "how.s2.text":
    "Consultez le profil du conducteur, ses avis et sa vérification d'identité avant de confirmer votre place.",
  "how.s3.title": "Prenez la route",
  "how.s3.text":
    "Retrouvez votre conducteur au point de rendez-vous, payez sur place ou en ligne et voyagez ensemble.",
  "trips.title": "Prochains départs",
  "trips.subtitle": "Des trajets vérifiés publiés par notre communauté.",
  "trips.seatsLeft": "places disponibles",
  "trips.seatLeft": "place disponible",
  "trips.book": "Réserver",
  "trips.viewAll": "Voir tous les trajets",
  "trips.results": "trajets trouvés",
  "trips.empty": "Aucun trajet ne correspond à votre recherche.",
  "trips.emptyHint": "Essayez une autre date ou une ville voisine.",
  "trips.instant": "Réservation instantanée",
  "trips.verified": "Identité vérifiée",
  "filters.title": "Filtres",
  "filters.sort": "Trier par",
  "filters.sort.early": "Départ le plus tôt",
  "filters.sort.price": "Prix le plus bas",
  "filters.sort.rating": "Meilleure note",
  "filters.max": "Prix maximum",
  "filters.reset": "Réinitialiser",
  "trust.title": "La sécurité avant tout",
  "trust.subtitle": "La confiance est notre premier kilomètre.",
  "trust.t1": "Identité vérifiée",
  "trust.t1.text": "CIN, permis et numéro de téléphone contrôlés pour chaque conducteur.",
  "trust.t2": "Avis authentiques",
  "trust.t2.text": "Seuls les passagers ayant voyagé peuvent laisser une note.",
  "trust.t3": "Paiement protégé",
  "trust.t3.text": "Vos paiements en MAD sont sécurisés jusqu'à la fin du trajet.",
  "trust.t4": "Support 7j/7",
  "trust.t4.text": "Une équipe marocaine joignable en darija, français et anglais.",
  "driver.title": "Vous conduisez ? Rentabilisez vos places vides.",
  "driver.text":
    "Publiez votre trajet en moins d'une minute, choisissez vos passagers et partagez les frais de route.",
  "driver.cta": "Publier un trajet",
  "driver.b1": "Vous fixez votre prix par place",
  "driver.b2": "Vous validez chaque demande",
  "driver.b3": "Aucun frais pour publier",
  "publish.title": "Publier un trajet",
  "publish.subtitle": "Indiquez votre itinéraire, votre prix et le nombre de places.",
  "publish.route": "Itinéraire",
  "publish.when": "Départ",
  "publish.time": "Heure",
  "publish.price": "Prix par place (MAD)",
  "publish.car": "Véhicule",
  "publish.carPlaceholder": "Dacia Logan — Gris",
  "publish.notes": "Informations pour les passagers",
  "publish.notesPlaceholder": "Point de rendez-vous, bagages, animaux…",
  "publish.submit": "Publier mon trajet",
  "publish.success": "Trajet prêt à être publié",
  "publish.successText": "Voici le récapitulatif de votre annonce.",
  "how.pageTitle": "Comment fonctionne DiniM3ak",
  "footer.tagline": "Voyagez ensemble, économisez davantage.",
  "footer.product": "Plateforme",
  "footer.company": "DiniM3ak",
  "footer.legal": "Légal",
  "footer.about": "À propos",
  "footer.careers": "Carrières",
  "footer.press": "Presse",
  "footer.terms": "Conditions générales",
  "footer.privacy": "Confidentialité",
  "footer.cookies": "Cookies",
  "footer.rights": "Tous droits réservés.",
  "footer.morocco": "Conçu au Maroc 🇲🇦",
  "common.currency": "MAD",
  "common.perSeat": "/ place",
  "common.rating": "note",
  "common.trips": "trajets",
  "common.language": "Langue",
};

const en: Dict = {
  "nav.search": "Find a ride",
  "nav.publish": "Publish a ride",
  "nav.how": "How it works",
  "nav.help": "Help",
  "nav.login": "Log in",
  "nav.signup": "Sign up",
  "hero.badge": "Smart carpooling in Morocco",
  "hero.title": "Travel together,",
  "hero.titleAccent": "save more.",
  "hero.subtitle":
    "DiniM3ak connects drivers with empty seats to passengers heading the same way, all across Morocco.",
  "search.from": "From",
  "search.to": "To",
  "search.date": "Date",
  "search.seats": "Passengers",
  "search.cta": "Search",
  "search.fromPlaceholder": "Casablanca",
  "search.toPlaceholder": "Marrakech",
  "search.popular": "Popular routes",
  "stats.members": "Verified members",
  "stats.routes": "Cities covered",
  "stats.saved": "Saved per trip",
  "stats.co2": "CO₂ avoided",
  "how.title": "How it works",
  "how.subtitle": "Three steps, two minutes. That's it.",
  "how.s1.title": "Search your ride",
  "how.s1.text":
    "Enter your departure city, destination and date. Compare prices in dirhams and departure times.",
  "how.s2.title": "Book with confidence",
  "how.s2.text":
    "Check the driver's profile, reviews and ID verification before confirming your seat.",
  "how.s3.title": "Hit the road",
  "how.s3.text":
    "Meet your driver at the pickup point, pay online or in cash, and travel together.",
  "trips.title": "Upcoming departures",
  "trips.subtitle": "Verified rides published by our community.",
  "trips.seatsLeft": "seats left",
  "trips.seatLeft": "seat left",
  "trips.book": "Book",
  "trips.viewAll": "See all rides",
  "trips.results": "rides found",
  "trips.empty": "No ride matches your search.",
  "trips.emptyHint": "Try another date or a nearby city.",
  "trips.instant": "Instant booking",
  "trips.verified": "ID verified",
  "filters.title": "Filters",
  "filters.sort": "Sort by",
  "filters.sort.early": "Earliest departure",
  "filters.sort.price": "Lowest price",
  "filters.sort.rating": "Best rated",
  "filters.max": "Maximum price",
  "filters.reset": "Reset",
  "trust.title": "Safety first",
  "trust.subtitle": "Trust is our first kilometre.",
  "trust.t1": "Verified identity",
  "trust.t1.text": "ID, licence and phone number checked for every driver.",
  "trust.t2": "Real reviews",
  "trust.t2.text": "Only passengers who travelled can leave a rating.",
  "trust.t3": "Protected payment",
  "trust.t3.text": "Your MAD payments stay secured until the ride is completed.",
  "trust.t4": "Support 7 days a week",
  "trust.t4.text": "A Moroccan team reachable in Darija, French and English.",
  "driver.title": "Driving anyway? Make your empty seats count.",
  "driver.text":
    "Publish your ride in under a minute, pick your passengers and share the cost of the road.",
  "driver.cta": "Publish a ride",
  "driver.b1": "You set your price per seat",
  "driver.b2": "You approve every request",
  "driver.b3": "Publishing is always free",
  "publish.title": "Publish a ride",
  "publish.subtitle": "Set your route, your price and the number of seats.",
  "publish.route": "Route",
  "publish.when": "Departure",
  "publish.time": "Time",
  "publish.price": "Price per seat (MAD)",
  "publish.car": "Vehicle",
  "publish.carPlaceholder": "Dacia Logan — Grey",
  "publish.notes": "Notes for passengers",
  "publish.notesPlaceholder": "Pickup point, luggage, pets…",
  "publish.submit": "Publish my ride",
  "publish.success": "Ride ready to publish",
  "publish.successText": "Here is the summary of your listing.",
  "how.pageTitle": "How DiniM3ak works",
  "footer.tagline": "Travel together, save more.",
  "footer.product": "Platform",
  "footer.company": "DiniM3ak",
  "footer.legal": "Legal",
  "footer.about": "About",
  "footer.careers": "Careers",
  "footer.press": "Press",
  "footer.terms": "Terms",
  "footer.privacy": "Privacy",
  "footer.cookies": "Cookies",
  "footer.rights": "All rights reserved.",
  "footer.morocco": "Made in Morocco 🇲🇦",
  "common.currency": "MAD",
  "common.perSeat": "/ seat",
  "common.rating": "rating",
  "common.trips": "rides",
  "common.language": "Language",
};

const ar: Dict = {
  "nav.search": "ابحث عن رحلة",
  "nav.publish": "أضف رحلة",
  "nav.how": "كيف يعمل",
  "nav.help": "المساعدة",
  "nav.login": "تسجيل الدخول",
  "nav.signup": "إنشاء حساب",
  "hero.badge": "النقل التشاركي الذكي في المغرب",
  "hero.title": "سافروا معًا،",
  "hero.titleAccent": "ووفّروا أكثر.",
  "hero.subtitle":
    "دّيني معاك تربط السائقين الذين لديهم مقاعد فارغة بالمسافرين في نفس الاتجاه، في كل أنحاء المغرب.",
  "search.from": "من",
  "search.to": "إلى",
  "search.date": "التاريخ",
  "search.seats": "المسافرون",
  "search.cta": "بحث",
  "search.fromPlaceholder": "الدار البيضاء",
  "search.toPlaceholder": "مراكش",
  "search.popular": "أشهر الرحلات",
  "stats.members": "أعضاء موثّقون",
  "stats.routes": "مدينة مغطاة",
  "stats.saved": "توفير في الرحلة",
  "stats.co2": "ثاني أكسيد الكربون الموفَّر",
  "how.title": "كيف يعمل",
  "how.subtitle": "ثلاث خطوات في دقيقتين فقط.",
  "how.s1.title": "ابحث عن رحلتك",
  "how.s1.text": "أدخل مدينة الانطلاق والوصول والتاريخ، وقارن الأسعار بالدرهم وأوقات الانطلاق.",
  "how.s2.title": "احجز بثقة",
  "how.s2.text": "تحقّق من ملف السائق وتقييماته وتوثيق هويته قبل تأكيد مقعدك.",
  "how.s3.title": "انطلق في الطريق",
  "how.s3.text": "التقِ بالسائق في نقطة اللقاء، وادفع نقدًا أو إلكترونيًا، وسافروا معًا.",
  "trips.title": "الرحلات القادمة",
  "trips.subtitle": "رحلات موثّقة نشرها أعضاء مجتمعنا.",
  "trips.seatsLeft": "مقاعد متاحة",
  "trips.seatLeft": "مقعد متاح",
  "trips.book": "احجز",
  "trips.viewAll": "كل الرحلات",
  "trips.results": "رحلة متوفرة",
  "trips.empty": "لا توجد رحلة تطابق بحثك.",
  "trips.emptyHint": "جرّب تاريخًا آخر أو مدينة قريبة.",
  "trips.instant": "حجز فوري",
  "trips.verified": "هوية موثّقة",
  "filters.title": "تصفية",
  "filters.sort": "ترتيب حسب",
  "filters.sort.early": "الانطلاق الأقرب",
  "filters.sort.price": "الأقل سعرًا",
  "filters.sort.rating": "الأعلى تقييمًا",
  "filters.max": "أقصى سعر",
  "filters.reset": "إعادة تعيين",
  "trust.title": "السلامة أولًا",
  "trust.subtitle": "الثقة هي أول كيلومتر لنا.",
  "trust.t1": "هوية موثّقة",
  "trust.t1.text": "البطاقة الوطنية ورخصة السياقة ورقم الهاتف مُتحقَّق منها لكل سائق.",
  "trust.t2": "تقييمات حقيقية",
  "trust.t2.text": "المسافرون الذين سافروا فعلًا هم فقط من يمكنهم التقييم.",
  "trust.t3": "دفع محمي",
  "trust.t3.text": "مدفوعاتك بالدرهم محفوظة إلى حين انتهاء الرحلة.",
  "trust.t4": "دعم طوال الأسبوع",
  "trust.t4.text": "فريق مغربي متوفر بالدارجة والفرنسية والإنجليزية.",
  "driver.title": "هل تسوق سيارتك؟ استفد من مقاعدك الفارغة.",
  "driver.text": "انشر رحلتك في أقل من دقيقة، اختر مسافريك وشارك تكاليف الطريق.",
  "driver.cta": "أضف رحلة",
  "driver.b1": "أنت تحدد السعر لكل مقعد",
  "driver.b2": "أنت توافق على كل طلب",
  "driver.b3": "النشر مجاني دائمًا",
  "publish.title": "أضف رحلة",
  "publish.subtitle": "حدّد مسارك وسعرك وعدد المقاعد.",
  "publish.route": "المسار",
  "publish.when": "الانطلاق",
  "publish.time": "الوقت",
  "publish.price": "السعر لكل مقعد (درهم)",
  "publish.car": "السيارة",
  "publish.carPlaceholder": "داسيا لوغان — رمادي",
  "publish.notes": "معلومات للمسافرين",
  "publish.notesPlaceholder": "نقطة اللقاء، الأمتعة، الحيوانات…",
  "publish.submit": "نشر رحلتي",
  "publish.success": "الرحلة جاهزة للنشر",
  "publish.successText": "هذا ملخّص إعلانك.",
  "how.pageTitle": "كيف تعمل دّيني معاك",
  "footer.tagline": "سافروا معًا، ووفّروا أكثر.",
  "footer.product": "المنصة",
  "footer.company": "دّيني معاك",
  "footer.legal": "قانوني",
  "footer.about": "من نحن",
  "footer.careers": "الوظائف",
  "footer.press": "الصحافة",
  "footer.terms": "الشروط العامة",
  "footer.privacy": "الخصوصية",
  "footer.cookies": "ملفات التعريف",
  "footer.rights": "جميع الحقوق محفوظة.",
  "footer.morocco": "صُنع في المغرب 🇲🇦",
  "common.currency": "درهم",
  "common.perSeat": "/ مقعد",
  "common.rating": "تقييم",
  "common.trips": "رحلة",
  "common.language": "اللغة",
};

const DICTS: Record<Lang, Dict> = {
  fr: { ...fr, ...extraFr },
  ar: { ...ar, ...extraAr },
  en: { ...en, ...extraEn },
};

export const CITIES: Record<Lang, Record<string, string>> = {
  fr: {},
  en: {},
  ar: {
    Casablanca: "الدار البيضاء",
    Rabat: "الرباط",
    Marrakech: "مراكش",
    Fès: "فاس",
    Tanger: "طنجة",
    Agadir: "أكادير",
    Meknès: "مكناس",
    Oujda: "وجدة",
    Kénitra: "القنيطرة",
    Tétouan: "تطوان",
    Essaouira: "الصويرة",
    "El Jadida": "الجديدة",
    Ifrane: "إفران",
    Chefchaouen: "شفشاون",
    Béni_Mellal: "بني ملال",
  },
};

type Ctx = {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  city: (name: string) => string;
  money: (amount: number) => string;
  date: (d: Date) => string;
};

const I18nContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "dinim3ak.lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored && stored in DICTS) setLangState(stored);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const value = useMemo<Ctx>(() => {
    const dict = DICTS[lang];
    return {
      lang,
      dir,
      setLang,
      t: (key) => dict[key] ?? DICTS.fr[key] ?? key,
      city: (name) => CITIES[lang]?.[name] ?? name,
      money: (amount) =>
        lang === "ar"
          ? `${amount.toLocaleString("ar-MA")} درهم`
          : `${amount.toLocaleString("fr-MA")} MAD`,
      date: (d) => {
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${d.getFullYear()}`;
      },
    };
  }, [lang, dir, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
