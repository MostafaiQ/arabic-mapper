import React, { useEffect, useMemo, useRef, useState } from "react";
import Fuse from "fuse.js";
import { toHijri } from "hijri-converter";

// ============================================================
// Arabic Body‑Part Mapper + Hijri Day Widget (final App.jsx)
// – Light‑mode forced, RTL, mobile‑first, sentiment colors + emojis
// – No external APIs
// ============================================================

// ---------- Arabic normalization ----------
function normalizeArabic(str = "") {
  return str
    .trim()
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// ---------- Dataset (full) ----------
const BODY_PARTS = [
  {
    key: "الرأس و اليافوخ",
    meaning: "إصابة مُلك و شرف و مال و ذكر جميل.",
    synonyms: ["اليافوخ", "رأس", "راس", "قمه الراس"],
  },
  {
    key: "الراس",
    meaning: "خير و محبة و صحة في الرأس و رزق و راحة.",
    synonyms: ["الرأس", "راس", "رأس"],
  },
  {
    key: "ما بين اليافوخ و الجبهة",
    meaning: "مال و سعة رزق و ينال خير كثير في السفر.",
    synonyms: ["يالافوخ", "بين الراس والجبهه"],
  },
  {
    key: "شق الرأس الأيمن",
    meaning: "همّ يلحقه من تعبٍ ونصبٍ و ينقضي عنه بسرعة.",
    synonyms: ["شق يمين الراس"],
  },
  {
    key: "شق الرأس الأيسر",
    meaning: "صحة جسمه و قرّة عين بفرحٍ يأتيه و مال و بشارة.",
    synonyms: ["شق يسار الراس"],
  },
  {
    key: "الجبهة",
    meaning: "إصابة خير و عزّ و سلطنة و في رواية يُخشى عليه من سلطان.",
    synonyms: ["جبهه"],
  },
  {
    key: "الحاجب الأيمن",
    meaning: "إصابة خير و يرى من يحب و زيادة في الرزق، و علوّ مرتبة.",
    synonyms: ["حاجب يمين"],
  },
  {
    key: "الحاجب الأيسر",
    meaning: "إصابة فرح أو حديث يغيظه أو مشقة تزول.",
    synonyms: ["حاجب يسار"],
  },
  {
    key: "العين اليمنى كلها",
    meaning: "يصلح حاله و يصيبه خير.",
    synonyms: ["عين يمين"],
  },
  {
    key: "العين اليسرى كلها",
    meaning: "إصابة خير و سرور و يُدفع عنه شر.",
    synonyms: ["عين يسار"],
  },
  {
    key: "جفن الأعلى لليمنى",
    meaning: "يتحدث الناس فيه بما يكره و قيل عزّ و مال.",
    synonyms: ["جفن علوي يمين"],
  },
  {
    key: "جفن الأعلى لليسرى",
    meaning: "كذلك و قيل قدوم غائب و ظفر بالمطلوب.",
    synonyms: ["جفن علوي يسار"],
  },
  {
    key: "جفن الأسفل لليمنى",
    meaning: "يتحدث الناس فيه بخير و منفعة له.",
    synonyms: ["جفن سفلي يمين"],
  },
  {
    key: "جفن الأسفل لليسرى",
    meaning: "يلتقي بغائب و سرور و غبطة و سفر بعيد.",
    synonyms: ["جفن سفلي يسار"],
  },
  {
    key: "مؤخرة العين اليمنى",
    meaning: "وصول غائب يخبره عن وفاة ميت.",
    synonyms: ["زاويه خلفيه عين يمين"],
  },
  {
    key: "مؤخرة العين اليسرى",
    meaning: "يلتقي بغائب ينتظره.",
    synonyms: ["زاويه خلفيه عين يسار"],
  },
  {
    key: "مجموع العينين",
    meaning: "صحة جسمه و إزالة مرض يؤذيه.",
    synonyms: ["العينان"],
  },
  {
    key: "جنب الأنف الأيمن",
    meaning: "ينجو من شرّ يخافه و يبلغه خبر يسرّه.",
    synonyms: ["جنب الانف يمين"],
  },
  {
    key: "جنب الأنف الأيسر",
    meaning: "يلقى مضرة و في رواية خير و نعمة و ظفر على الأعداء.",
    synonyms: ["جنب الانف يسار"],
  },
  {
    key: "جملة الأنف كله",
    meaning: "غنى و مال كثير و رفعة.",
    synonyms: ["الانف"],
  },
  {
    key: "أذن اليمنى",
    meaning:
      "يسمع كلاما يعجبه و يسرّه و يأتي أرضاً غير أرضه و يصيبه مال كثيراً حلالاً و يرجع سالماً.",
    synonyms: ["اذن يمين"],
  },
  {
    key: "شحمة الأذن اليمنى",
    meaning: "نصرة من خصومة.",
    synonyms: ["شحمة يمين"],
  },
  {
    key: "الأذن اليسرى",
    meaning: "قدر يصيبه و ينجو منه وإن كانت امرأة تتزوج أو رزق.",
    synonyms: ["اذن يسار"],
  },
  {
    key: "شحمة الأذن اليسرى",
    meaning: "ظفر بالمطلوب أو قدوم غائب.",
    synonyms: ["شحمة يسار"],
  },
  {
    key: "الخد الأيمن",
    meaning: "يسمع حديثا شرّا و يصح جسمه و يأتيه من يحب أو نصرة.",
    synonyms: ["خد يمين"],
  },
  {
    key: "الخد الأيسر",
    meaning: "يأتيه داء في جسمه و يزول و مرض يعقبه شفاء.",
    synonyms: ["خد يسار"],
  },
  {
    key: "طرف الوجه الأيمن",
    meaning: "يُقال في حقّه كلام لا يليق بمقامه.",
    synonyms: ["طرف الوجه يمين"],
  },
  {
    key: "طرف الوجه الأيسر",
    meaning: "ينال فرحاً و سروراً.",
    synonyms: ["طرف الوجه يسار"],
  },
  {
    key: "جانب الفم الأيمن",
    meaning: "خير يعتريه و نفع يعمّه.",
    synonyms: ["جانب الفم يمين"],
  },
  {
    key: "جانب الفم الأيسر",
    meaning: "يسمع كلاما يحبّه.",
    synonyms: ["جانب الفم يسار"],
  },
  { key: "الفم بأسره", meaning: "يعانق من يحب.", synonyms: ["الفم"] },
  {
    key: "جانب اللسان الأيمن",
    meaning: "شرّ يعتريه و همّ يعرضه.",
    synonyms: ["لسان يمين"],
  },
  {
    key: "جانب اللسان الأيسر",
    meaning: "صلاح أمره و كلامه.",
    synonyms: ["لسان يسار"],
  },
  { key: "اللسان كله", meaning: "صحة من تعب.", synonyms: ["لسان"] },
  {
    key: "الشفة اليمنى العليا و السفلى",
    meaning:
      "حديث يغمّه و لغط و خصومة و ينجو عن قريب و قيل يلد له مولود و يدل على السرور أو اجتماع بمن يحب و أكل ما يشتهي.",
    synonyms: ["شفة يمين"],
  },
  {
    key: "الشفة اليسرى العليا",
    meaning: "يدل على إنسان يبغضه.",
    synonyms: ["شفة يسار عليا"],
  },
  {
    key: "الشفة اليسرى السفلى",
    meaning: "يقع في خصومة و يتكلم الناس بما يكرهه أو رزق قريب و إصابة مال.",
    synonyms: ["شفة يسار سفلى"],
  },
  { key: "الذقن", meaning: "بركة و رزق.", synonyms: ["ذقن"] },
  {
    key: "الشارب الأيمن",
    meaning: "إصابة خير و يرى من يحب.",
    synonyms: ["شارب يمين"],
  },
  {
    key: "الشارب الأيسر",
    meaning: "سفر فيه خير و بركة بإذنه تعالى.",
    synonyms: ["شارب يسار"],
  },
  {
    key: "الجيد الأيمن",
    meaning: "يأتيه خير و سرور و فرح.",
    synonyms: ["جيد يمين", "عنق يمين"],
  },
  {
    key: "جانب العنق الأيسر",
    meaning: "إصابة خير و سعة مال و رزق كثير.",
    synonyms: ["عنق يسار"],
  },
  {
    key: "العنق بأكمله",
    meaning: "يستعاذ بالله منه، و قيل معانقة من يحب.",
    synonyms: ["العنق"],
  },
  {
    key: "الكتف الأيمن",
    meaning: "ينال خيراً كثيراً و سعة في الرزق و يلبس لباساً جديدا.",
    synonyms: ["كتف يمين"],
  },
  {
    key: "الكتف الأيسر",
    meaning: "فرح و سرور و فائدة كثيرة و ينال مطلوبه و يحصل مراده.",
    synonyms: ["كتف يسار"],
  },
  {
    key: "المنكب الأيمن",
    meaning: "همّ و حزن و مصيبة و في رواية رزق عظيم.",
    synonyms: ["منكب يمين"],
  },
  {
    key: "المنكب الأيسر",
    meaning: "يعمل عملا يكسب فيه خيرا كثيراً أو نوم في موضع غريب.",
    synonyms: ["منكب يسار"],
  },
  {
    key: "العضد الأيمن",
    meaning: "مرض يصيبه و ينجو منه.",
    synonyms: ["عضد يمين"],
  },
  {
    key: "العضد الأيسر",
    meaning: "فرح يأتيه و سرور يعتريه.",
    synonyms: ["عضد يسار"],
  },
  {
    key: "المرفق الأيمن",
    meaning: "وجع شديد في أحد أعضائه أو رزق و سرور.",
    synonyms: ["مرفق يمين"],
  },
  {
    key: "المرفق الأيسر",
    meaning: "فرح و سرور و قيل تعب.",
    synonyms: ["مرفق يسار"],
  },
  { key: "الذراع الأيمن", meaning: "معانقة حبيب.", synonyms: ["ذراع يمين"] },
  {
    key: "الذراع الأيسر",
    meaning: "رزق واسع يأتيه وخير كثير يلحقه.",
    synonyms: ["ذراع يسار"],
  },
  {
    key: "الكف الأيمن",
    meaning: "يخاصم و يضرب بعصا أو سوط و تدل على خصومة.",
    synonyms: ["كف يمين"],
  },
  {
    key: "الكف الأيسر",
    meaning: "إصابة خير و منفعة من مال لا يُرتجى انتفاعه.",
    synonyms: ["كف يسار"],
  },
  {
    key: "الإبهام الأيمن",
    meaning: "إصابة كرامة و بركة قرب من السلطان.",
    synonyms: ["ابهام يمين"],
  },
  {
    key: "الإبهام الأيسر",
    meaning: "رفعة و علو شأن لا يرجى منه أو خصومة من صديق أو غنى.",
    synonyms: ["ابهام يسار"],
  },
  {
    key: "السبابة اليمنى",
    meaning: "حديث سوء تسمعه.",
    synonyms: ["سبابه يمين"],
  },
  {
    key: "السبابة اليسرى",
    meaning: "بشارة له من غائب أو من مال أو من صحة مريض.",
    synonyms: ["سبابه يسار"],
  },
  {
    key: "الوسطى اليمنى",
    meaning: "عزة و رفعة بين الناس و رزق بتعب.",
    synonyms: ["وسطى يمين"],
  },
  {
    key: "الوسطى اليسرى",
    meaning: "ظفر و غلبة على الخصم و الأعداء بعد حرب و قهر.",
    synonyms: ["وسطى يسار"],
  },
  {
    key: "البنصر اليمنى",
    meaning: "يصيبه خير من صديق أو سلطان.",
    synonyms: ["بنصر يمين"],
  },
  {
    key: "البنصر اليسرى",
    meaning: "غائب يأتيه و مسافر يلحقه و يعانقه.",
    synonyms: ["بنصر يسار"],
  },
  {
    key: "الخنصر الأيمن",
    meaning: "رزق يأتيه من حيث لا يحتسب و لا يرتقب.",
    synonyms: ["خنصر يمين"],
  },
  {
    key: "الخنصر الأيسر",
    meaning: "فرح و قوة و نشاط و سرور و دفع شر.",
    synonyms: ["خنصر يسار"],
  },
  { key: "جملة اليد اليمنى", meaning: "مال عظيم.", synonyms: ["يد يمين"] },
  { key: "جملة اليد اليسرى", meaning: "عز.", synonyms: ["يد يسار"] },
  {
    key: "الظهر",
    meaning: "مال كثير و سعة في الرزق و سرور و فرح.",
    synonyms: ["ظهر"],
  },
  {
    key: "جانب الظهر الأيمن",
    meaning: "يتحول من مكان أو يسافر.",
    synonyms: ["ظهر يمين"],
  },
  {
    key: "جانب الظهر الأيسر",
    meaning: "مرض يصيبه و شر يلحقه و يشفى منه.",
    synonyms: ["ظهر يسار"],
  },
  {
    key: "العجزين اليمنى و اليسرى",
    meaning: "فرح و سرور من حيث لا يدري.",
    synonyms: ["عجزين"],
  },
  {
    key: "الإبطين",
    meaning: "فرح وسرور ولينتف شعره أفضل.",
    synonyms: ["ابط", "ابطين"],
  },
  {
    key: "الخاصرتين اليمنى",
    meaning: "أمر يقرّ عينيه.",
    synonyms: ["خاصره يمين"],
  },
  {
    key: "الخاصرتين اليسرى",
    meaning: "يتزوج بمن يريد و يحب و يقصد و سرور.",
    synonyms: ["خاصره يسار"],
  },
  {
    key: "الوركين الأيمن",
    meaning: "يفعل شيئا يحمد عليه.",
    synonyms: ["ورك يمين"],
  },
  {
    key: "الوركين الأيسر",
    meaning: "هم يزول عنه إن شاء الله.",
    synonyms: ["ورك يسار"],
  },
  {
    key: "الآليتان اليمنى",
    meaning: "فرح و سرور يأتيه و يعتريه.",
    synonyms: ["اليه يمين"],
  },
  { key: "الآليتان اليسرى", meaning: "تكذب عليه.", synonyms: ["اليه يسار"] },
  { key: "الصدر", meaning: "يعانق من يحب و سرور.", synonyms: ["صدر"] },
  {
    key: "الثدي الأيمن",
    meaning: "يكثر ماله و يرزق من حيث لا يحتسب.",
    synonyms: ["ثدي يمين"],
  },
  {
    key: "الثدي الأيسر",
    meaning: "علو منزله و رفعة درجة.",
    synonyms: ["ثدي يسار"],
  },
  {
    key: "الفؤاد",
    meaning: "هم و غم و حزن فجأة يرتفع سريعاً.",
    synonyms: ["قلب", "فؤاد"],
  },
  {
    key: "السرة",
    meaning: "فرح و سرور و اجتماع بالأولاد وكثرة البركة و الرزق.",
    synonyms: ["سره"],
  },
  {
    key: "ما بين السرة و العانة",
    meaning: "جلالة شرف و رفعة قدر.",
    synonyms: ["بين السره والعانه"],
  },
  {
    key: "الذكر",
    meaning: "فرح و سرور و في رواية يفعل قبيحين ويتقِ الله.",
    synonyms: ["ذكر"],
  },
  {
    key: "البيضة اليمنى",
    meaning: "تقضى حوائجه بإذن الله تعالى.",
    synonyms: ["بيضه يمين"],
  },
  { key: "البيضة اليسرى", meaning: "نكاح جديد.", synonyms: ["بيضه يسار"] },
  { key: "الفخذين الأيمن", meaning: "سرور يتجدد.", synonyms: ["فخذ يمين"] },
  {
    key: "الفخذين الأيسر",
    meaning: "يملك دابة أو شفاء من مرض.",
    synonyms: ["فخذ يسار"],
  },
  { key: "الركبتين اليمنى", meaning: "صحبة سلطان.", synonyms: ["ركبه يمين"] },
  { key: "الركبتين اليسرى", meaning: "رفعة عند ملك.", synonyms: ["ركبه يسار"] },
  {
    key: "الساق الأيمن",
    meaning: "خصومة و سفر في طلب معاش.",
    synonyms: ["ساق يمين"],
  },
  {
    key: "الساق الأيسر",
    meaning: "فرح و سرور و خير إن شاء الله و موت أعدائه رزق جديد.",
    synonyms: ["ساق يسار"],
  },
  {
    key: "الكعبين اليمنى",
    meaning: "يلقى ما يكره و يحصل ما لا يريد.",
    synonyms: ["كعب يمين"],
  },
  {
    key: "الكعبين اليسرى",
    meaning: "رفعة من سلطان أو ملك.",
    synonyms: ["كعب يسار"],
  },
  {
    key: "عموم القدمين",
    meaning: "سرور و يسافر و يغنم.",
    synonyms: ["القدمين"],
  },
  {
    key: "أظافر الرجل اليمنى",
    meaning: "انقلاب و فتنة.",
    synonyms: ["اظافر يمين"],
  },
  {
    key: "أظافر الرجل اليسرى",
    meaning: "سرور و رفعة و فرح ويحصل مراده.",
    synonyms: ["اظافر يسار"],
  },
  {
    key: "ظاهر القدم اليمنى",
    meaning: "يكره كلامه و لا يحصل على مرامه أو سرور.",
    synonyms: ["ظاهر قدم يمين"],
  },
  {
    key: "ظاهر القدم اليسرى",
    meaning: "صدع حاله و تكذيب مقاله.",
    synonyms: ["ظاهر قدم يسار"],
  },
  {
    key: "باطن القدم اليمنى",
    meaning: "تدل على صنعة بين الناس.",
    synonyms: ["باطن قدم يمين"],
  },
  {
    key: "باطن القدم اليسرى",
    meaning: "منزلة جديدة و رفعة.",
    synonyms: ["باطن قدم يسار"],
  },
  {
    key: "إبهام الرجل اليمنى",
    meaning: "خير إن شاء الله أو رزق أو قدوم غائب.",
    synonyms: ["ابهام قدم يمين"],
  },
  {
    key: "إبهام الرجل اليسرى",
    meaning: "يفعل خيرا و يحسن عليه و قيل سعي في الخير و قيل في جنازة.",
    synonyms: ["ابهام قدم يسار"],
  },
  {
    key: "سبابة الرجل اليمنى",
    meaning: "يمرض مرض شديدا و يبرأ سريعا.",
    synonyms: ["سبابه قدم يمين"],
  },
  {
    key: "سبابة الرجل اليسرى",
    meaning: "يخاصم شخصا و يظفر عليه.",
    synonyms: ["سبابه قدم يسار"],
  },
  {
    key: "الوسطى في الرجل اليمنى",
    meaning: "غنيمة تناله و خير يلحقه.",
    synonyms: ["وسطى قدم يمين"],
  },
  {
    key: "الوسطى في الرجل اليسرى",
    meaning: "يكثر ماله و يزيد.",
    synonyms: ["وسطى قدم يسار"],
  },
  {
    key: "بنصر الرجل اليمنى",
    meaning: "فرح و قرة عين له و سعي في الخير.",
    synonyms: ["بنصر قدم يمين"],
  },
  {
    key: "بنصر الرجل اليسرى",
    meaning: "كرامة في سفر.",
    synonyms: ["بنصر قدم يسار"],
  },
  {
    key: "خنصر الرجل اليمنى",
    meaning: "رزق واسع.",
    synonyms: ["خنصر قدم يمين"],
  },
  {
    key: "خنصر الرجل اليسرى",
    meaning: "يرجع إليه ماله.",
    synonyms: ["خنصر قدم يسار"],
  },
  {
    key: "أصابع الرجل اليمنى كلها",
    meaning: "تكبر نفسه في المعيشة.",
    synonyms: ["اصابع قدم يمين"],
  },
  {
    key: "أصابع الرجل اليسرى كلها",
    meaning: "تناله مشقة و تعب.",
    synonyms: ["اصابع قدم يسار"],
  },
  {
    key: "القدم اليمنى كلها",
    meaning: "يسافر و يغنم.",
    synonyms: ["قدم يمين"],
  },
  {
    key: "القدم اليسرى كلها",
    meaning: "يسافر و يغنم بأصدقائه.",
    synonyms: ["قدم يسار"],
  },
];

// Build index + fuzzy search
const INDEX = BODY_PARTS.map((x) => ({
  ...x,
  normKey: normalizeArabic(x.key),
  normSyns: (x.synonyms || []).map((s) => normalizeArabic(s)),
}));
const fuse = new Fuse(INDEX, {
  includeScore: true,
  threshold: 0.35,
  distance: 100,
  keys: [
    { name: "normKey", getFn: (o) => o.normKey },
    { name: "normSyns", getFn: (o) => o.normSyns.join(" ") },
  ],
});

// ---------- Hijri rules ----------
const HIJRI_DAY_RULES = {
  1: "الرؤيا فيه باطلة.",
  2: "تعبيرها بالعكس.",
  3: "تعبيرها بالعكس.",
  4: "تعبيرها تتأخر.",
  5: "تعبيرها بالتأخير.",
  6: "صحيح. وفي رواية سلمان بعد يوم أو يومين يظهر تعبيرها.",
  7: "صحيح.",
  8: "صحيح.",
  9: "صحيح. وفي رواية سلمان يظهر تعبيرها في نفس اليوم.",
  10: "تقع بالتأخير. وفي رواية سلمان بعد 20 يوم يظهر التعبير.",
  11: "تقع بالتأخير. وفي رواية سلمان بعد 20 يوم يظهر التعبير.",
  12: "تقع بالتأخير.",
  13: "لا خير ولا شر. وفي رواية سلمان بعد 9 أيام يظهر التعبير.",
  14: "لا خير ولا شر. وفي رواية سلمان بعد 26 يوم يظهر التعبير.",
  15: "لا خير ولا شر. وفي رواية سلمان بعد 3 أيام يظهر التعبير.",
  16: "بالتأخير.",
  17: "بالتأخير.",
  18: "الرؤيا صحيحة.",
  19: "الرؤيا صحيحة.",
  20: "الرؤيا كاذبة.",
  21: "الرؤيا كاذبة.",
  22: "فرح وسرور.",
  23: "فرح وسرور.",
  24: "تعبيرها بالعكس.",
  25: "تعبيرها بالعكس.",
  26: "تعبيرها بالعكس. وفي رواية سلمان يظهر التعبير في نفس اليوم.",
  27: "تعبيرها بالعكس.",
  28: "صحيح.",
  29: "صحيح. وفي رواية سلمان يظهر التعبير في نفس اليوم وتتحقق.",
  30: "صحيح.",
};

function useHijriToday() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  const hijri = useMemo(() => {
    const { hy, hm, hd } = toHijri(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate()
    );
    return { hy, hm, hd };
  }, [now]);
  const rule = HIJRI_DAY_RULES[hijri.hd] || "لا توجد قاعدة لهذا اليوم.";
  return { hijri, rule };
}

// ---------- Sentiment + Duaa ----------
const DUAA_TEXT = `بسمه تعالى\nدعاء و تحصين يقرأ عند الخوف\nقال الإمام الكاظم عليه السلام : من أوجس في نفسه شيء أو خيف من الشؤم فليقل :\nاللهم لا طير إلا طيرك و لا ضير إلا ضيرك و لا خير إلا خيرك و لا إله غيرك اعتصمت بك يا\nربّ من شرّ ما أجد في نفسي فاعصمني بمحمد و آل محمد صلى الله عليه و آله من\nذلك. فإنه يُعصم من ذلك الشيء.`;

function classifySentiment(text = "") {
  const positive = /(خير|سرور|رزق|فرح|رفعة|ظفر|بركة|صحه|صحة)/g;
  const negative = /(هم|حزن|شر|تعب|وجع|مرض|مضرة|تكذب|خصومة)/g;
  const delay = /(تأخير|تتأخر|بالتأخير)/g;
  const inverse = /(بالعكس)/g;
  const p = (text.match(positive) || []).length;
  const n = (text.match(negative) || []).length;
  if (p > n && p > 0) return "positive";
  if (n > p && n > 0) return "negative";
  if (delay.test(text)) return "delay";
  if (inverse.test(text)) return "inverse";
  return "neutral";
}

function ResultCard({ item }) {
  if (!item) return null;
  const sentiment = classifySentiment(item.meaning);
  const palette = {
    positive: {
      ring: "ring-emerald-300",
      text: "text-emerald-800",
      chip: "bg-emerald-50 border-emerald-200",
      emoji: "✅",
    },
    negative: {
      ring: "ring-rose-300",
      text: "text-rose-800",
      chip: "bg-rose-50 border-rose-200",
      emoji: "⚠️",
    },
    delay: {
      ring: "ring-amber-300",
      text: "text-amber-800",
      chip: "bg-amber-50 border-amber-200",
      emoji: "⏳",
    },
    inverse: {
      ring: "ring-violet-300",
      text: "text-violet-800",
      chip: "bg-violet-50 border-violet-200",
      emoji: "🔁",
    },
    neutral: {
      ring: "ring-gray-200",
      text: "text-gray-800",
      chip: "bg-gray-50 border-gray-200",
      emoji: "🛈",
    },
  }[sentiment];

  return (
    <div
      className={`rounded-2xl shadow-md p-4 border bg-white text-right ring-1 ${palette.ring}`}
    >
      <div className={`text-xl font-semibold mb-2 ${palette.text}`}>
        <span className="ml-1">{palette.emoji}</span> {item.key}
      </div>
      <div className="text-gray-700 leading-relaxed">{item.meaning}</div>
      {(sentiment === "negative" ||
        sentiment === "delay" ||
        sentiment === "inverse") && (
        <div
          className={`mt-4 p-3 rounded-xl border ${palette.chip} text-sm leading-7 whitespace-pre-line`}
        >
          {DUAA_TEXT}
        </div>
      )}
    </div>
  );
}

function Suggestions({ items, onPick }) {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3 justify-end">
      {items.slice(0, 6).map((it, idx) => (
        <button
          key={idx}
          onClick={() => onPick(it.item)}
          className="px-3 py-2 rounded-full border bg-white hover:bg-gray-50 text-sm active:scale-95 transition"
        >
          {it.item.key}
        </button>
      ))}
    </div>
  );
}

// Floating card for tablet/desktop
function FixedHijriWidget() {
  const { hijri, rule } = useHijriToday();
  const HM = [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الآخر",
    "جمادى الأولى",
    "جمادى الآخرة",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
  ];
  return (
    <div className="hidden sm:block fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))] w-full max-w-xs z-50">
      <div className="rounded-2xl border shadow-lg bg-white p-4 text-right">
        <div className="text-sm text-gray-500">حسب التقويم الهجري</div>
        <div className="text-lg font-semibold mt-1">
          اليوم {hijri.hd} من {HM[hijri.hm - 1]} {hijri.hy}هـ
        </div>
        <div className="mt-2 text-gray-800">{rule}</div>
      </div>
    </div>
  );
}

// Full-width sticky banner for phones
function HijriBannerMobile() {
  const { hijri, rule } = useHijriToday();
  const HM = [
    "محرم",
    "صفر",
    "ربيع الأول",
    "ربيع الآخر",
    "جمادى الأولى",
    "جمادى الآخرة",
    "رجب",
    "شعبان",
    "رمضان",
    "شوال",
    "ذو القعدة",
    "ذو الحجة",
  ];
  return (
    <div className="block sm:hidden sticky top-0 z-50">
      <div className="bg-gradient-to-l from-emerald-50 to-teal-50 border-b px-4 py-3 text-right">
        <div className="text-xs text-gray-600">حسب التقويم الهجري</div>
        <div className="text-base font-bold">
          اليوم {hijri.hd} من {HM[hijri.hm - 1]} {hijri.hy}هـ
        </div>
        <div className="text-sm text-gray-800 mt-1">{rule}</div>
      </div>
    </div>
  );
}

export default function App() {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState(null);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const qq = normalizeArabic(q);
    if (!qq) return [];
    return fuse.search(qq);
  }, [q]);

  const top = results?.[0]?.item || null;
  useEffect(() => {
    setPicked(top || null);
  }, [q]);

  // Enforce RTL + light color scheme regardless of OS dark mode
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("dir", "rtl");
      document.documentElement.setAttribute("lang", "ar");
      // Force light mode so text never goes invisible in dark OS
      document.documentElement.style.colorScheme = "light";
      document.body.style.background =
        "linear-gradient(to bottom, #ffffff, #f3f4f6)";
    }
  }, []);

  return (
    <div className="min-h-screen" dir="rtl">
      <HijriBannerMobile />
      <div className="max-w-screen-sm mx-auto p-4 sm:p-6 text-right">
        <header className="mt-2 mb-4">
          <h1 className="text-3xl font-bold tracking-tight">
            اختلاجات الأعضاء
          </h1>
          <p className="text-gray-600 mt-2">
            اكتب اسم العضو المختلج بالعربية وسيتم مطابقة المدلول الأقرب
            تلقائياً.
          </p>
        </header>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <label className="block text-sm font-medium mb-2">
            اسم العضو المختلج
          </label>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="مثال: الجبهة، الكتف الأيمن، ظاهر القدم اليسرى"
            className="w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-black/10 text-base"
            dir="rtl"
            inputMode="text"
          />
          <Suggestions items={results} onPick={(it) => setPicked(it)} />
        </div>

        <div className="mt-6">
          <ResultCard item={picked} />
        </div>

        <footer className="mt-10 text-xs text-gray-500 pb-24">
          المصادر: نص مروي عن الإمام الصادق عليه السلام. هذه أداة إرشادية وليست
          فتوى.
        </footer>
      </div>
      <FixedHijriWidget />
    </div>
  );
}
