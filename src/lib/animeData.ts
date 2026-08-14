// Madar — Anime Studio data: characters (hero / villain / powerhouse) with their
// transformation forms, plus per-universe combat auras and hair transformations.

export type CharRole = "hero" | "villain" | "power";

export interface AnimeForm {
  id: string;
  ar: string;
  en: string;
  /** English prompt fragment describing the transformation state */
  prompt: string;
}

export interface AnimeCharacter {
  id: string;
  ar: string;
  en: string;
  style: string;
  role: CharRole;
  /** English prompt fragment forcing the identity */
  prompt: string;
  forms: AnimeForm[];
}

export interface AnimeAura {
  id: string;
  ar: string;
  en: string;
  emoji: string;
  prompt: string;
}

export interface AnimeHair {
  id: string;
  ar: string;
  en: string;
  prompt: string;
}

export const ROLE_LABEL: Record<CharRole, { ar: string; en: string; emoji: string }> = {
  hero: { ar: "البطل", en: "Hero", emoji: "🛡️" },
  villain: { ar: "الشرير", en: "Villain", emoji: "😈" },
  power: { ar: "قوي", en: "Powerhouse", emoji: "⚡" },
};

const base = (prompt: string) => prompt;

export const CHARACTERS: AnimeCharacter[] = [
  /* ===== Dragon Ball Z ===== */
  {
    id: "goku", ar: "غوكو", en: "Goku", style: "dbz", role: "hero",
    prompt: base("Force the identity of Son Goku: spiky black upright hair, orange gi with blue undershirt and belt, confident grin."),
    forms: [
      { id: "base", ar: "الوضع الأساسي", en: "Base", prompt: "Base form, black spiky hair, calm confident stance." },
      { id: "ssj1", ar: "سوبر ساين 1", en: "Super Saiyan", prompt: "Super Saiyan 1: golden flame-shaped upright hair, teal eyes, blazing golden ki aura." },
      { id: "ssj3", ar: "سوبر ساين 3", en: "Super Saiyan 3", prompt: "Super Saiyan 3: extremely long golden hair reaching the waist, no eyebrows, violent crackling golden lightning aura." },
      { id: "blue", ar: "سوبر ساين بلو", en: "Super Saiyan Blue", prompt: "Super Saiyan Blue: bright cyan-blue hair and eyes, serene godly blue ki aura with divine flame." },
      { id: "ui", ar: "الغريزة الفائقة", en: "Ultra Instinct", prompt: "Ultra Instinct: silver-white hair, glowing silver eyes, calm silver aura with sparkling particles and rippling air." },
    ],
  },
  {
    id: "vegeta", ar: "فيجيتا", en: "Vegeta", style: "dbz", role: "power",
    prompt: base("Force the identity of Vegeta: flame-shaped widow's-peak black hair, proud scowl, blue Saiyan battle armor with white chest plate."),
    forms: [
      { id: "base", ar: "الوضع الأساسي", en: "Base", prompt: "Base form with Saiyan battle armor." },
      { id: "ssj", ar: "سوبر ساين", en: "Super Saiyan", prompt: "Super Saiyan: golden upright flame hair, teal eyes, golden aura." },
      { id: "blue-evo", ar: "بلو إيفولوشن", en: "Blue Evolution", prompt: "Super Saiyan Blue Evolution: deep royal-blue hair, purple-blue explosive aura, cracked ground." },
      { id: "ultra-ego", ar: "الأنا الفائقة", en: "Ultra Ego", prompt: "Ultra Ego: violet-purple spiky hair, magenta destruction aura, battle-torn armor." },
    ],
  },
  {
    id: "frieza", ar: "فريزا", en: "Frieza", style: "dbz", role: "villain",
    prompt: base("Force the identity of Frieza: sleek alien tyrant with smooth white-and-purple bio armor plating, crimson eyes, cruel smirk."),
    forms: [
      { id: "final", ar: "الطور النهائي", en: "Final Form", prompt: "Final form: pure white body with purple bio-gem plates, cold cruel expression." },
      { id: "golden", ar: "فريزا الذهبي", en: "Golden Frieza", prompt: "Golden Frieza: gleaming metallic gold body, blazing golden-purple aura." },
      { id: "black", ar: "فريزا الأسود", en: "Black Frieza", prompt: "Black Frieza: obsidian-black body with crimson accents, overwhelming dark red aura." },
    ],
  },

  /* ===== Naruto ===== */
  {
    id: "naruto", ar: "ناروتو", en: "Naruto", style: "naruto", role: "hero",
    prompt: base("Force the identity of Naruto Uzumaki: bright spiky blond hair, blue eyes, three whisker marks per cheek, orange-black jacket, Konoha headband."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Base genin/shinobi form, orange jacket." },
      { id: "sage", ar: "وضع الناسك", en: "Sage Mode", prompt: "Sage Mode: orange pigment around the eyes, yellow toad-like irises, calm natural energy aura." },
      { id: "kurama", ar: "عباءة كوراما", en: "Kurama Cloak", prompt: "Kurama Chakra Mode: glowing golden chakra cloak with black seal markings covering the body, flame-like chakra shroud." },
      { id: "baryon", ar: "وضع باريون", en: "Baryon Mode", prompt: "Baryon Mode: incandescent orange-red chakra body, fox ears of chakra, searing burning aura." },
    ],
  },
  {
    id: "sasuke", ar: "ساسكي", en: "Sasuke", style: "naruto", role: "power",
    prompt: base("Force the identity of Sasuke Uchiha: black spiky hair with long bangs, cold expression, dark cloak, katana on the back."),
    forms: [
      { id: "sharingan", ar: "الشارينغان", en: "Sharingan", prompt: "Sharingan activated: crimson eyes with three tomoe." },
      { id: "mangekyo", ar: "المانغيكيو", en: "Mangekyo", prompt: "Eternal Mangekyo Sharingan: intricate crimson pinwheel eyes, black Susanoo ribcage forming behind." },
      { id: "susanoo", ar: "سوسانو الكامل", en: "Perfect Susanoo", prompt: "Perfect Susanoo: colossal purple armored spirit warrior towering behind the subject with a blade of energy." },
      { id: "rinnegan", ar: "الرينيغان", en: "Rinnegan", prompt: "Rinnegan: rippled purple left eye, dark six-paths chakra aura." },
    ],
  },
  {
    id: "madara", ar: "مادارا", en: "Madara", style: "naruto", role: "villain",
    prompt: base("Force the identity of Madara Uchiha: long wild black hair, red Uchiha armor, menacing grin, gunbai war fan."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Classic Uchiha armor, sharingan eyes." },
      { id: "six-paths", ar: "المسارات الست", en: "Six Paths", prompt: "Six Paths Madara: rinnegan eyes, ten-tails jinchuriki markings, glowing black rods, godly aura." },
    ],
  },

  /* ===== One Piece ===== */
  {
    id: "luffy", ar: "لوفي", en: "Luffy", style: "one-piece", role: "hero",
    prompt: base("Force the identity of Monkey D. Luffy: straw hat, scar under the left eye, red open vest, carefree wide grin."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Base form with straw hat." },
      { id: "gear4", ar: "جير فور", en: "Gear 4", prompt: "Gear Fourth: massively inflated muscular arms with red haki flame tattoos steaming, glowing red eyes." },
      { id: "gear5", ar: "جير فايف", en: "Gear 5", prompt: "Gear Fifth Nika: pure white hair and clothes, white swirling smoke aura, joyful wild grin, cartoonish godlike energy." },
    ],
  },
  {
    id: "zoro", ar: "زورو", en: "Zoro", style: "one-piece", role: "power",
    prompt: base("Force the identity of Roronoa Zoro: green hair, scar over the left eye, green haramaki, three katanas (one in the mouth)."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Three-sword style stance." },
      { id: "asura", ar: "أسورا", en: "Asura", prompt: "Asura: demonic nine-sword illusion with three heads and six arms of dark spirit energy behind the subject (illusion only, the real body keeps two arms)." },
      { id: "haki", ar: "هاكي متقدم", en: "Advanced Haki", prompt: "Advanced Conqueror's Haki: black-coated blades crackling with red-black lightning." },
    ],
  },
  {
    id: "doflamingo", ar: "دوفلامينغو", en: "Doflamingo", style: "one-piece", role: "villain",
    prompt: base("Force the identity of Donquixote Doflamingo: pink feathered coat, orange sunglasses, wide sinister grin, string threads glowing between the fingers."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Pink feather coat, string strings glowing." },
      { id: "awakened", ar: "الاستيقاظ", en: "Awakened", prompt: "Awakened String-String fruit: entire environment turning into threads, blood-red string armor around the body." },
    ],
  },

  /* ===== Hunter x Hunter ===== */
  {
    id: "gon", ar: "غون", en: "Gon", style: "hxh", role: "hero",
    prompt: base("Force the identity of Gon Freecss: spiky green-black hair, green jacket, fishing rod, bright determined eyes."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Young hunter form with green outfit." },
      { id: "adult", ar: "التحول الكامل", en: "Adult Gon", prompt: "Adult Gon transformation: towering muscular adult body, extremely long flowing black hair, blank furious eyes, overwhelming nen." },
    ],
  },
  {
    id: "killua", ar: "كيلوا", en: "Killua", style: "hxh", role: "power",
    prompt: base("Force the identity of Killua Zoldyck: silver-white messy hair, blue cat-like eyes, purple turtleneck."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Calm assassin stance." },
      { id: "godspeed", ar: "سرعة الإله", en: "Godspeed", prompt: "Godspeed: body wrapped in crackling electric white-blue lightning, hair standing upright, afterimages." },
    ],
  },
  {
    id: "hisoka", ar: "هيسوكا", en: "Hisoka", style: "hxh", role: "villain",
    prompt: base("Force the identity of Hisoka: red-orange slicked hair, star and teardrop face paint, jester outfit, unsettling smile, playing cards."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Jester outfit with cards." },
      { id: "bungee", ar: "علكة المطاط", en: "Bungee Gum", prompt: "Bungee Gum aura: pink elastic nen strands stretching from the hands, bloodlust aura." },
    ],
  },

  /* ===== Detective Conan ===== */
  {
    id: "conan", ar: "كونان", en: "Conan", style: "conan", role: "hero",
    prompt: base("Force the identity of Conan Edogawa: round glasses, blue jacket with red bowtie, sharp analytical stare."),
    forms: [
      { id: "base", ar: "كونان", en: "Conan", prompt: "Boy detective form with glasses and bowtie." },
      { id: "shinichi", ar: "شينيتشي", en: "Shinichi", prompt: "Shinichi Kudo: grown teen detective in a school blazer, confident deductive pose." },
    ],
  },
  {
    id: "kid", ar: "كيد", en: "Kaito Kid", style: "conan", role: "power",
    prompt: base("Force the identity of Kaito Kid: white top hat and cape, monocle, white suit, moonlit rooftop, playful smirk."),
    forms: [{ id: "base", ar: "عادي", en: "Base", prompt: "White cape flowing in the moonlight." }],
  },
  {
    id: "gin", ar: "جين", en: "Gin", style: "conan", role: "villain",
    prompt: base("Force the identity of Gin from the Black Organization: long silver hair, black fedora and long black coat, cold green eyes, cigarette."),
    forms: [{ id: "base", ar: "عادي", en: "Base", prompt: "Sinister noir lighting, black coat." }],
  },

  /* ===== Black Clover ===== */
  {
    id: "asta", ar: "أستا", en: "Asta", style: "black-clover", role: "hero",
    prompt: base("Force the identity of Asta: short spiky ash-blond hair, fierce green eyes, Black Bulls robe, giant black anti-magic sword."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Black Bulls robe with anti-magic sword." },
      { id: "black-asta", ar: "أستا الأسود", en: "Black Asta", prompt: "Black Asta: black demonic anti-magic covering one arm and half the body, single black horn, glowing green eyes." },
      { id: "devil-union", ar: "اتحاد الشيطان", en: "Devil Union", prompt: "Devil Union: full black demon armor with wings of anti-magic, two curved horns, blazing green eyes." },
    ],
  },
  {
    id: "yami", ar: "يامي", en: "Yami", style: "black-clover", role: "power",
    prompt: base("Force the identity of Yami Sukehiro: tall imposing build, slicked-back black hair, cigarette, captain coat, dark katana."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Captain coat, katana drawn." },
      { id: "dark-cloaked", ar: "عباءة الظلام", en: "Dark Cloaked", prompt: "Dark Cloaked Menace: black dark-magic mist coating the blade and body, ominous slashes tearing the air." },
    ],
  },
  {
    id: "licht", ar: "ليخت", en: "Licht", style: "black-clover", role: "villain",
    prompt: base("Force the identity of Licht the elf: long silver-white hair, pointed elf ears, glowing sword of light."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Elf form with radiant light sword." },
      { id: "demon", ar: "شكل الشيطان", en: "Demon Form", prompt: "Demon form: massive dark demonic body with white light wings and glowing runes." },
    ],
  },

  /* ===== Seven Deadly Sins ===== */
  {
    id: "meliodas", ar: "ميليوداس", en: "Meliodas", style: "seven-deadly-sins", role: "hero",
    prompt: base("Force the identity of Meliodas: messy blond hair, green eyes, black Boar Hat outfit with white cravat."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Boar Hat tavern outfit." },
      { id: "assault", ar: "وضع الهجوم", en: "Assault Mode", prompt: "Assault Mode: dark demon mark spreading over half the face and body, black wings, glowing black-red aura." },
      { id: "demon-king", ar: "ملك الشياطين", en: "Demon King", prompt: "Demon King vessel: pitch-black demonic body, multiple glowing eyes on the shoulders, overwhelming darkness." },
    ],
  },
  {
    id: "escanor", ar: "إسكانور", en: "Escanor", style: "seven-deadly-sins", role: "power",
    prompt: base("Force the identity of Escanor: proud expression, Divine Axe Rhitta, sunlight radiance."),
    forms: [
      { id: "day", ar: "النهار", en: "Daytime", prompt: "Daytime Escanor: towering muscular build, blazing golden sunlight aura." },
      { id: "one", ar: "ذا وان", en: "The One", prompt: "The One at noon: blinding solar corona around the body, molten golden light, absolute supremacy." },
    ],
  },
  {
    id: "zeldris", ar: "زيلدريس", en: "Zeldris", style: "seven-deadly-sins", role: "villain",
    prompt: base("Force the identity of Zeldris: black hair, cold expression, dark commandment armor, black-red demonic aura."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Dark commandment armor." },
      { id: "commandment", ar: "الوصية", en: "Commandment", prompt: "Commandment released: black demon marks covering the body, crimson piety energy blade." },
    ],
  },

  /* ===== Bleach ===== */
  {
    id: "ichigo", ar: "إيتشيغو", en: "Ichigo", style: "bleach", role: "hero",
    prompt: base("Force the identity of Ichigo Kurosaki: bright orange spiky hair, black shihakusho robe, giant Zangetsu cleaver."),
    forms: [
      { id: "shikai", ar: "شيكاي", en: "Shikai", prompt: "Shikai: black cleaver blade, blue-white reiatsu." },
      { id: "bankai", ar: "بانكاي", en: "Bankai", prompt: "Bankai Tensa Zangetsu: slim black daito, black coat with tattered tails, dense black-red reiatsu." },
      { id: "hollow", ar: "قناع الهولو", en: "Hollow Mask", prompt: "Vasto Lorde hollow mask: white bone mask with red stripes over the face, black sclera with gold irises, violent black-red reiatsu." },
      { id: "true", ar: "بانكاي الحقيقي", en: "True Bankai", prompt: "True Bankai: dual blades, white-black quincy coat, immense white spiritual pressure." },
    ],
  },
  {
    id: "aizen", ar: "آيزن", en: "Aizen", style: "bleach", role: "villain",
    prompt: base("Force the identity of Sosuke Aizen: slicked-back brown hair, calm superior smile, white Espada coat."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "White coat, calm godlike composure." },
      { id: "hogyoku", ar: "اندماج الهوغيوكو", en: "Hogyoku Fusion", prompt: "Hogyoku fusion: butterfly-like white wings and hollow-hole chest, purple third eye, transcendent aura." },
    ],
  },
  {
    id: "grimmjow", ar: "غريمجو", en: "Grimmjow", style: "bleach", role: "power",
    prompt: base("Force the identity of Grimmjow: spiky electric-blue hair, teal jaw fragment mask, savage grin, white Espada jacket."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "White Espada jacket, feral stance." },
      { id: "resurreccion", ar: "الريسوريكسيون", en: "Resurreccion", prompt: "Resurreccion Pantera: panther-like armored form, claws, long blue hair, blue-black energy." },
    ],
  },

  /* ===== Sakamoto Days ===== */
  {
    id: "sakamoto", ar: "ساكاموتو", en: "Sakamoto", style: "sakamoto-days", role: "hero",
    prompt: base("Force the identity of Taro Sakamoto: calm deadpan expression, slick black hair, dark suit."),
    forms: [
      { id: "shop", ar: "صاحب الدكان", en: "Shopkeeper", prompt: "Chubby shopkeeper form with apron, gentle smile." },
      { id: "hitman", ar: "القاتل الأسطوري", en: "Legendary Hitman", prompt: "Legendary hitman form: lean sharp physique, black suit, cold lethal stare, motion-blurred precision." },
    ],
  },
  {
    id: "shin", ar: "شين", en: "Shin", style: "sakamoto-days", role: "power",
    prompt: base("Force the identity of Shin Asakura: bleached blond hair, sunglasses, tracksuit, esper mind-reading aura."),
    forms: [{ id: "base", ar: "عادي", en: "Base", prompt: "Mind-reading aura lines around the head." }],
  },
  {
    id: "slur", ar: "سلور", en: "Slur", style: "sakamoto-days", role: "villain",
    prompt: base("Force the identity of Slur: black hooded cloak, blank white mask with a slit, ominous calm presence."),
    forms: [{ id: "base", ar: "عادي", en: "Base", prompt: "Masked cloaked assassin in shadows." }],
  },

  /* ===== Demon Slayer ===== */
  {
    id: "tanjiro", ar: "تانجيرو", en: "Tanjiro", style: "demon-slayer", role: "hero",
    prompt: base("Force the identity of Tanjiro Kamado: burgundy-tipped dark hair, forehead scar, green-black checkered haori, nichirin katana."),
    forms: [
      { id: "water", ar: "تنفس الماء", en: "Water Breathing", prompt: "Water Breathing: swirling ukiyo-e style blue water waves around the slash." },
      { id: "hinokami", ar: "رقصة إله النار", en: "Hinokami Kagura", prompt: "Hinokami Kagura: blazing sun-flame dance, orange-red fire arcs, glowing flame mark spreading over the face." },
      { id: "demon", ar: "شكل الشيطان", en: "Demon Form", prompt: "Demon Tanjiro: pale skin, single horn on the forehead, red-veined eyes, wild aura." },
    ],
  },
  {
    id: "muzan", ar: "موزان", en: "Muzan", style: "demon-slayer", role: "villain",
    prompt: base("Force the identity of Muzan Kibutsuji: pale skin, wavy black hair, white fedora and suit, crimson demon eyes."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "White suit and fedora, cold cruel elegance." },
      { id: "demon", ar: "شكل الوحش", en: "Monstrous Form", prompt: "Monstrous demon king form: fleshy tendrils with mouths, multiple glowing eyes, grotesque power." },
    ],
  },
  {
    id: "rengoku", ar: "رينغوكو", en: "Rengoku", style: "demon-slayer", role: "power",
    prompt: base("Force the identity of Kyojuro Rengoku: flame-colored yellow-red spiky hair, white demon slayer uniform, flame-pattern haori."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Flame haori, bold heroic stance." },
      { id: "ninth", ar: "الشكل التاسع", en: "Ninth Form", prompt: "Flame Breathing Ninth Form Rengoku: enormous fire serpent of flame erupting from the blade, blazing red-gold inferno." },
    ],
  },

  /* ===== Jujutsu Kaisen ===== */
  {
    id: "gojo", ar: "غوجو", en: "Gojo", style: "jujutsu-kaisen", role: "hero",
    prompt: base("Force the identity of Satoru Gojo: white spiky hair, dark high-collar jujutsu uniform."),
    forms: [
      { id: "blindfold", ar: "العصابة", en: "Blindfolded", prompt: "Black blindfold over the eyes, relaxed confident smirk." },
      { id: "six-eyes", ar: "العيون الست", en: "Six Eyes", prompt: "Six Eyes revealed: glowing infinite blue eyes, limitless cursed energy distorting space." },
      { id: "domain", ar: "التوسع النطاقي", en: "Unlimited Void", prompt: "Domain Expansion Unlimited Void: infinite starfield void domain enveloping the background, blue-purple cosmic energy." },
    ],
  },
  {
    id: "sukuna", ar: "سوكونا", en: "Sukuna", style: "jujutsu-kaisen", role: "villain",
    prompt: base("Force the identity of Ryomen Sukuna: pink-blond hair, black tattoo markings across the face, cruel grin."),
    forms: [
      { id: "vessel", ar: "داخل الوعاء", en: "In Vessel", prompt: "Sukuna within the vessel: tattooed face, second eyes under the eyes, sinister smile." },
      { id: "true", ar: "الشكل الحقيقي", en: "True Form", prompt: "True form King of Curses: four arms and two faces rendered as cursed illusion behind the subject (the real body keeps two arms), crimson malevolent shrine aura." },
    ],
  },
  {
    id: "yuji", ar: "يوجي", en: "Yuji", style: "jujutsu-kaisen", role: "power",
    prompt: base("Force the identity of Yuji Itadori: short pink hair, hoodie under a dark school uniform, determined eyes."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "School uniform, fighting stance." },
      { id: "black-flash", ar: "الوميض الأسود", en: "Black Flash", prompt: "Black Flash: black lightning distortion exploding at the fist impact point, red cursed energy sparks." },
    ],
  },

  /* ===== Attack on Titan ===== */
  {
    id: "eren", ar: "إيرين", en: "Eren", style: "aot", role: "hero",
    prompt: base("Force the identity of Eren Yeager: brown shoulder-length hair, intense green eyes, Survey Corps gear."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Survey Corps uniform with ODM gear." },
      { id: "attack-titan", ar: "عملاق الهجوم", en: "Attack Titan", prompt: "Attack Titan transformation: steaming titan muscle body rising behind/around, exposed jaw teeth, glowing green eyes, lightning strike effect." },
      { id: "founding", ar: "العملاق المؤسس", en: "Founding Titan", prompt: "Founding Titan: colossal skeletal spine titan with long hair of flesh, apocalyptic sky, immense scale." },
    ],
  },
  {
    id: "levi", ar: "ليفاي", en: "Levi", style: "aot", role: "power",
    prompt: base("Force the identity of Levi Ackerman: black undercut hair, cold eyes, Survey Corps uniform with green cape, dual blades."),
    forms: [{ id: "base", ar: "عادي", en: "Base", prompt: "Mid-air ODM spin with dual blades, motion trails." }],
  },
  {
    id: "zeke", ar: "زيك", en: "Zeke", style: "aot", role: "villain",
    prompt: base("Force the identity of Zeke Yeager: blond hair, beard, round glasses, Marleyan coat, sinister calm."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Marleyan coat with glasses." },
      { id: "beast", ar: "العملاق الوحش", en: "Beast Titan", prompt: "Beast Titan: huge ape-like fur-covered titan looming behind, throwing boulders, steam." },
    ],
  },

  /* ===== One Punch Man ===== */
  {
    id: "saitama", ar: "سايتاما", en: "Saitama", style: "one-punch", role: "hero",
    prompt: base("Force the identity of Saitama: completely bald head, blank expression, yellow hero jumpsuit with red gloves, boots and white cape."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Blank bored expression." },
      { id: "serious", ar: "اللكمة الجادة", en: "Serious Punch", prompt: "Serious Series: sharply drawn hyper-detailed intense face, atmosphere-splitting shockwave punch." },
    ],
  },
  {
    id: "genos", ar: "جينوس", en: "Genos", style: "one-punch", role: "power",
    prompt: base("Force the identity of Genos: blond hair, black cyborg body with metal arms, glowing yellow eyes."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Cyborg arms with vents." },
      { id: "incinerate", ar: "المدفع الحارق", en: "Incinerate", prompt: "Incineration Cannons: palms erupting with jet flames, superheated orange glow." },
    ],
  },
  {
    id: "boros", ar: "بوروس", en: "Boros", style: "one-punch", role: "villain",
    prompt: base("Force the identity of Lord Boros: pale skin, single glowing eye, long red mane, dark alien armor."),
    forms: [
      { id: "armored", ar: "المدرع", en: "Armored", prompt: "Restraining armor, cosmic tyrant presence." },
      { id: "meteoric", ar: "الاندفاع النيزكي", en: "Meteoric Burst", prompt: "Meteoric Burst: body engulfed in violet-blue energy flames, blinding regenerative aura." },
    ],
  },

  /* ===== Tokyo Ghoul ===== */
  {
    id: "kaneki", ar: "كانيكي", en: "Kaneki", style: "tokyo-ghoul", role: "hero",
    prompt: base("Force the identity of Ken Kaneki: white hair, one red kakugan eye, black leather outfit."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Black hair, human appearance, melancholic look." },
      { id: "white", ar: "كانيكي الأبيض", en: "White Kaneki", prompt: "White-haired Kaneki: steel-toothed black mask, red kagune tendrils rising from the back." },
      { id: "kakuja", ar: "الكاكوجا", en: "Kakuja", prompt: "Centipede Kakuja: monstrous black-red exoskeleton armor with a horned mask, writhing kagune tendrils." },
    ],
  },
  {
    id: "touka", ar: "توكا", en: "Touka", style: "tokyo-ghoul", role: "power",
    prompt: base("Force the identity of Touka Kirishima: short purple-blue hair, cafe uniform, fierce red kakugan eye."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Cafe uniform, sharp glare." },
      { id: "ukaku", ar: "أوكاكو", en: "Ukaku Kagune", prompt: "Ukaku kagune: crystalline red-purple wing of energy shards on one shoulder." },
    ],
  },
  {
    id: "eto", ar: "إيتو", en: "Eto", style: "tokyo-ghoul", role: "villain",
    prompt: base("Force the identity of Eto Yoshimura: green messy hair, bandage-wrapped body, unsettling grin."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Bandaged ghoul form." },
      { id: "owl", ar: "البومة ذات العين الواحدة", en: "One-Eyed Owl", prompt: "One-Eyed Owl kakuja: monstrous winged flesh armor with a beaked mask, chaotic dark red kagune." },
    ],
  },

  /* ===== Chainsaw Man ===== */
  {
    id: "denji", ar: "دينجي", en: "Denji", style: "chainsaw-man", role: "hero",
    prompt: base("Force the identity of Denji: messy blond hair, sharp-toothed grin, white shirt with a black tie, chest pull-cord."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "White shirt, black tie, pull-cord on the chest." },
      { id: "chainsaw", ar: "رجل المنشار", en: "Chainsaw Devil", prompt: "Chainsaw Devil: chainsaw blade erupting from the head and both forearms, blood spray, roaring engine smoke." },
    ],
  },
  {
    id: "power", ar: "باور", en: "Power", style: "chainsaw-man", role: "power",
    prompt: base("Force the identity of Power: long messy blonde hair, red devil horns, yellow cross-shaped pupils, wild grin."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Devil horns, chaotic energy." },
      { id: "blood", ar: "سلاح الدم", en: "Blood Weapon", prompt: "Blood Fiend: giant crystallized blood hammer formed from her own blood, crimson splatter." },
    ],
  },
  {
    id: "makima", ar: "ماكيما", en: "Makima", style: "chainsaw-man", role: "villain",
    prompt: base("Force the identity of Makima: braided reddish hair, ringed golden eyes, white shirt and black trousers, calm smile."),
    forms: [{ id: "base", ar: "عادي", en: "Base", prompt: "Control Devil aura: unsettling ringed eyes, invisible dominating presence." }],
  },

  /* ===== Solo Leveling ===== */
  {
    id: "sung-jinwoo", ar: "سونغ جين وو", en: "Sung Jinwoo", style: "solo-leveling", role: "hero",
    prompt: base("Force the identity of Sung Jinwoo: black hair, glowing violet eyes, black hunter coat."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Black hunter outfit with dual daggers." },
      { id: "monarch", ar: "ملك الظلال", en: "Shadow Monarch", prompt: "Shadow Monarch: black-and-gold armored coat, violet shadow flames, an army of shadow soldiers kneeling in the background." },
    ],
  },
  {
    id: "beru", ar: "بيرو", en: "Beru", style: "solo-leveling", role: "power",
    prompt: base("Force the identity of Beru the ant shadow: chitinous black-purple insectoid armor, glowing violet eyes."),
    forms: [{ id: "base", ar: "عادي", en: "Base", prompt: "Shadow ant marshal standing guard." }],
  },
  {
    id: "antking", ar: "ملك النمل", en: "Ant King", style: "solo-leveling", role: "villain",
    prompt: base("Force the identity of the Ant King: towering white-armored insectoid monarch, glowing red eyes, brutal presence."),
    forms: [{ id: "base", ar: "عادي", en: "Base", prompt: "Menacing monster boss aura." }],
  },

  /* ===== Fairy Tail ===== */
  {
    id: "natsu", ar: "ناتسو", en: "Natsu", style: "fairy-tail", role: "hero",
    prompt: base("Force the identity of Natsu Dragneel: spiky pink hair, white scaled scarf, black open vest."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Fire fists blazing orange." },
      { id: "dragon-force", ar: "قوة التنين", en: "Dragon Force", prompt: "Dragon Force: red dragon scales spreading over the face and arms, roaring fire aura, slitted dragon eyes." },
      { id: "lightning-flame", ar: "وضع البرق واللهب", en: "Lightning Flame", prompt: "Lightning Flame Dragon Mode: golden lightning intertwined with orange flames swirling around the body." },
    ],
  },
  {
    id: "erza", ar: "إرزا", en: "Erza", style: "fairy-tail", role: "power",
    prompt: base("Force the identity of Erza Scarlet: long scarlet hair, silver armor breastplate, sword drawn."),
    forms: [
      { id: "base", ar: "الدرع الفضي", en: "Heart Kreuz", prompt: "Silver Heart Kreuz armor, commanding stance." },
      { id: "purgatory", ar: "درع المطهر", en: "Purgatory", prompt: "Purgatory Armor: black spiked armor with a massive mace, dark ominous glow." },
    ],
  },
  {
    id: "zeref", ar: "زيريف", en: "Zeref", style: "fairy-tail", role: "villain",
    prompt: base("Force the identity of Zeref: black hair, black-and-white high-collar robe, sorrowful cruel eyes."),
    forms: [
      { id: "base", ar: "عادي", en: "Base", prompt: "Black wizard robe." },
      { id: "ankhseram", ar: "لعنة أنكسرام", en: "Ankhseram Curse", prompt: "Ankhseram black magic: swirling black death aura consuming everything around, red eyes." },
    ],
  },
];

/** Per-universe combat auras / signature skills */
export const AURAS_BY_STYLE: Record<string, AnimeAura[]> = {
  dbz: [
    { id: "ki", ar: "هالة الكي", en: "Ki Aura", emoji: "🔥", prompt: "Explosive golden-white Ki aura bursting upward, crackling lightning, floating debris, cracked ground." },
    { id: "kamehameha", ar: "كاميهاميها", en: "Kamehameha", emoji: "💥", prompt: "Charging a blinding blue Kamehameha energy wave between cupped palms, blue rim light." },
    { id: "god-ki", ar: "كي إلهي", en: "God Ki", emoji: "✨", prompt: "Serene divine blue-red god ki flame aura with calm rippling air." },
  ],
  naruto: [
    { id: "chakra", ar: "تشاكرا", en: "Chakra", emoji: "🌀", prompt: "Swirling blue chakra aura ribbons with faint sigils." },
    { id: "rasengan", ar: "راسنغان", en: "Rasengan", emoji: "🔵", prompt: "Spinning blue chakra sphere of condensed energy with cyan trails." },
    { id: "amaterasu", ar: "أماتيراسو", en: "Amaterasu", emoji: "🖤", prompt: "Black inextinguishable Amaterasu flames burning around the subject." },
  ],
  "one-piece": [
    { id: "haki", ar: "هاكي الملوك", en: "Conqueror's Haki", emoji: "⚡", prompt: "Dark purple-black conqueror's haki lightning radiating outward, oppressive pressure." },
    { id: "armament", ar: "هاكي التسليح", en: "Armament", emoji: "🖤", prompt: "Armament haki: arms and weapon coated in glossy black hardened energy with red veins." },
  ],
  hxh: [
    { id: "nen", ar: "نين", en: "Nen", emoji: "💠", prompt: "Dense controlled nen aura hugging the body with multicolor shimmer." },
    { id: "godspeed", ar: "سرعة الإله", en: "Godspeed", emoji: "⚡", prompt: "Crackling white-blue electricity enveloping the body with afterimages." },
  ],
  conan: [
    { id: "deduction", ar: "هالة الاستنتاج", en: "Deduction", emoji: "🔍", prompt: "Blue analytical deduction aura: floating clue fragments and glowing case threads around the subject." },
    { id: "noir", ar: "أجواء نوار", en: "Noir", emoji: "🌃", prompt: "Cinematic noir lighting with rain, dramatic shadow and a moonlit skyline." },
  ],
  "black-clover": [
    { id: "anti-magic", ar: "مضاد السحر", en: "Anti-Magic", emoji: "⚫", prompt: "Black anti-magic energy swirling around the blade and arm, devouring nearby light." },
    { id: "grimoire", ar: "الغريموار", en: "Grimoire", emoji: "📖", prompt: "Open floating grimoire beside the subject with glowing magic runes and clover mark." },
    { id: "dark-magic", ar: "سحر الظلام", en: "Dark Magic", emoji: "🌑", prompt: "Dark magic mist tearing space in dark crescent slashes." },
  ],
  "seven-deadly-sins": [
    { id: "demon-mark", ar: "علامة الشيطان", en: "Demon Mark", emoji: "😈", prompt: "Black demon markings spreading over the face and arm with dark red aura." },
    { id: "sunshine", ar: "أشعة الشمس", en: "Sunshine", emoji: "☀️", prompt: "Blinding molten golden sunshine aura radiating heat waves." },
  ],
  bleach: [
    { id: "reiatsu", ar: "الضغط الروحي", en: "Reiatsu", emoji: "🌬️", prompt: "Dense blue-white reiatsu spirit pressure column erupting upward and cracking the ground." },
    { id: "getsuga", ar: "غيتسوغا تينشو", en: "Getsuga Tensho", emoji: "🌙", prompt: "Black-red crescent moon energy slash launched from the blade." },
    { id: "cero", ar: "سيرو", en: "Cero", emoji: "🔴", prompt: "Crimson cero energy beam charging from the palm with hollow distortion." },
  ],
  "sakamoto-days": [
    { id: "precision", ar: "دقة قاتلة", en: "Lethal Precision", emoji: "🎯", prompt: "Motion-blurred trajectory lines and bullet-time trails around the subject, ultra-precise poise." },
    { id: "esper", ar: "قدرات إسبر", en: "Esper", emoji: "🧠", prompt: "Purple psychic ripple waves emanating from the head, floating debris." },
  ],
  "demon-slayer": [
    { id: "water", ar: "تنفس الماء", en: "Water Breathing", emoji: "🌊", prompt: "Ukiyo-e style blue water dragon waves swirling with the slash." },
    { id: "flame", ar: "تنفس اللهب", en: "Flame Breathing", emoji: "🔥", prompt: "Roaring orange-red flame serpent erupting along the blade." },
    { id: "thunder", ar: "تنفس الرعد", en: "Thunder Breathing", emoji: "⚡", prompt: "Golden lightning bolt trail exploding forward in a single instant step." },
    { id: "demon-blood", ar: "فن الدم الشيطاني", en: "Blood Demon Art", emoji: "🩸", prompt: "Crimson blood demon art crescents warping the air." },
  ],
  "jujutsu-kaisen": [
    { id: "cursed", ar: "طاقة ملعونة", en: "Cursed Energy", emoji: "🌫️", prompt: "Dark violet cursed energy smoke coiling around the body with distortion." },
    { id: "domain", ar: "التوسع النطاقي", en: "Domain Expansion", emoji: "🌌", prompt: "Domain expansion sphere unfolding: surreal void domain interior with cosmic patterns." },
    { id: "black-flash", ar: "الوميض الأسود", en: "Black Flash", emoji: "◼️", prompt: "Black flash: black lightning distortion cracking space at the impact point." },
  ],
  aot: [
    { id: "titan-steam", ar: "بخار العملاق", en: "Titan Steam", emoji: "💨", prompt: "Scalding titan steam bursting around the subject with a lightning strike pillar." },
    { id: "odm", ar: "معدات المناورة", en: "ODM Blitz", emoji: "🗡️", prompt: "ODM gear gas trails spiraling with dual blades and motion lines." },
  ],
  "one-punch": [
    { id: "shockwave", ar: "موجة الصدمة", en: "Shockwave", emoji: "💢", prompt: "Atmosphere-splitting shockwave ring exploding behind the punch, clouds parting." },
    { id: "incinerate", ar: "لهب المدفع", en: "Incinerate", emoji: "🔥", prompt: "Cyborg jet-flame cannons erupting from the palms with superheated glow." },
  ],
  "tokyo-ghoul": [
    { id: "kagune", ar: "الكاغوني", en: "Kagune", emoji: "🩸", prompt: "Red crystalline kagune tendrils erupting from the back and writhing in the air." },
    { id: "kakugan", ar: "الكاكوغان", en: "Kakugan", emoji: "👁️", prompt: "Kakugan eye: black sclera with a glowing red iris, veins spreading around the eye." },
  ],
  "chainsaw-man": [
    { id: "chainsaw", ar: "المناشير", en: "Chainsaw", emoji: "🪚", prompt: "Roaring chainsaw blades and engine smoke with blood spray and grit." },
    { id: "blood", ar: "سلاح الدم", en: "Blood Weapon", emoji: "🗡️", prompt: "Crystallized blood weapon forming from splattered crimson blood." },
  ],
  "solo-leveling": [
    { id: "shadow", ar: "جيش الظلال", en: "Shadow Army", emoji: "🌑", prompt: "Violet shadow flames pouring from the ground with kneeling shadow soldiers behind." },
    { id: "monarch", ar: "هالة الملك", en: "Monarch Aura", emoji: "👑", prompt: "Shadow Monarch aura: black-violet crown of energy and rippling dark pressure." },
  ],
  "fairy-tail": [
    { id: "fire-dragon", ar: "زئير تنين النار", en: "Fire Dragon Roar", emoji: "🐉", prompt: "Torrent of dragon fire roaring outward with ember sparks." },
    { id: "requip", ar: "تبديل الدروع", en: "Requip", emoji: "⚔️", prompt: "Requip magic circle: golden magic seals and floating swords surrounding the subject." },
  ],
};

/** Per-universe hair transformations */
export const HAIRS_BY_STYLE: Record<string, AnimeHair[]> = {
  dbz: [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "spiky", ar: "سبايكي أسود", en: "Black Spiky", prompt: "Dragon Ball black upright spiky hair with sharp gravity-defying spikes." },
    { id: "ssj1", ar: "ساين ذهبي", en: "Super Saiyan Gold", prompt: "Golden flame-shaped upright Super Saiyan hair, glowing yellow." },
    { id: "ssj3", ar: "ساين 3 طويل", en: "SSJ3 Long Gold", prompt: "Extremely long golden Super Saiyan 3 hair reaching the waist, no eyebrows." },
    { id: "blue", ar: "شعر أزرق", en: "Saiyan Blue", prompt: "Bright cyan-blue Super Saiyan Blue hair with soft glow." },
    { id: "ui-silver", ar: "فضي الغريزة", en: "Ultra Instinct Silver", prompt: "Silver-white Ultra Instinct hair with sparkling particles." },
  ],
  naruto: [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "blond-spiky", ar: "أشقر سبايكي", en: "Blond Spiky", prompt: "Bright spiky blond shinobi hair." },
    { id: "sage-white", ar: "شعر الناسك", en: "Sage White", prompt: "Long spiky white sage hair with horned bangs." },
    { id: "uchiha", ar: "شعر أوتشيها", en: "Uchiha Black", prompt: "Black Uchiha hair with long front bangs framing the face." },
  ],
  "one-piece": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "messy-black", ar: "أسود فوضوي", en: "Messy Black", prompt: "Messy black pirate hair under a straw hat." },
    { id: "gear5-white", ar: "أبيض جير5", en: "Gear 5 White", prompt: "Pure white swirling Gear Fifth hair with smoke wisps." },
    { id: "green", ar: "أخضر قصير", en: "Green Short", prompt: "Short moss-green swordsman hair." },
  ],
  hxh: [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "gon-spiky", ar: "سبايكي أخضر", en: "Green Spiky", prompt: "Spiky green-black hunter hair." },
    { id: "long-black", ar: "أسود طويل", en: "Long Black", prompt: "Extremely long flowing black hair (Adult Gon style)." },
    { id: "silver", ar: "فضي مبعثر", en: "Silver Messy", prompt: "Messy silver-white assassin hair." },
  ],
  conan: [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "detective", ar: "شعر المحقق", en: "Detective", prompt: "Neat dark detective hair with a signature cowlick." },
    { id: "silver-long", ar: "فضي طويل", en: "Long Silver", prompt: "Long straight silver hair under a black fedora." },
  ],
  "black-clover": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "ash-spiky", ar: "رمادي سبايكي", en: "Ash Spiky", prompt: "Short spiky ash-blond magic-knight hair." },
    { id: "demon-horn", ar: "قرن شيطاني", en: "Demon Horn", prompt: "Dark hair with a single black demon horn emerging from the forehead." },
    { id: "elf-silver", ar: "فضي إلفي", en: "Elf Silver", prompt: "Long silver-white elf hair with pointed ears." },
  ],
  "seven-deadly-sins": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "blond-messy", ar: "أشقر فوضوي", en: "Messy Blond", prompt: "Messy blond fantasy hair." },
    { id: "sun-gold", ar: "ذهبي شمسي", en: "Sun Gold", prompt: "Slicked golden hair glowing with sunlight." },
  ],
  bleach: [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "orange-spiky", ar: "برتقالي سبايكي", en: "Orange Spiky", prompt: "Bright orange spiky soul-reaper hair." },
    { id: "bankai-long", ar: "أسود طويل", en: "Bankai Long Black", prompt: "Long straight black hair flowing with spiritual pressure." },
    { id: "hollow-white", ar: "أبيض هولو", en: "Hollow White", prompt: "Wild white hollow hair with black-gold eyes." },
  ],
  "sakamoto-days": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "slick-black", ar: "أسود مصفف", en: "Slick Black", prompt: "Slicked-back sharp black hitman hair." },
    { id: "bleached", ar: "أشقر مبيض", en: "Bleached Blond", prompt: "Bleached blond messy street hair." },
  ],
  "demon-slayer": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "burgundy", ar: "أطراف حمراء", en: "Burgundy Tips", prompt: "Dark hair with burgundy-red flame tips, Taisho-era cut." },
    { id: "flame", ar: "شعر اللهب", en: "Flame Hair", prompt: "Yellow-red flame-shaped hair rising like fire." },
    { id: "demon-white", ar: "أبيض شيطاني", en: "Demon White", prompt: "Pale white demon hair with a single forehead horn." },
  ],
  "jujutsu-kaisen": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "white-spiky", ar: "أبيض سبايكي", en: "White Spiky", prompt: "White spiky sorcerer hair with a blindfold band." },
    { id: "pink-short", ar: "وردي قصير", en: "Pink Short", prompt: "Short pink sorcerer hair with undercut." },
    { id: "curse-marks", ar: "شعر مع أوشام", en: "Cursed Marked", prompt: "Pink-blond hair with black curse tattoo lines across the face." },
  ],
  aot: [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "long-brown", ar: "بني طويل", en: "Long Brown", prompt: "Shoulder-length brown hair tied back." },
    { id: "undercut", ar: "أندركت أسود", en: "Black Undercut", prompt: "Sharp black undercut military haircut." },
  ],
  "one-punch": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "bald", ar: "أصلع", en: "Bald", prompt: "Completely bald shiny head." },
    { id: "cyborg-blond", ar: "أشقر سايبورغ", en: "Cyborg Blond", prompt: "Neat blond cyborg hair." },
  ],
  "tokyo-ghoul": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "white", ar: "أبيض غول", en: "Ghoul White", prompt: "Stark white ghoul hair falling over one eye." },
    { id: "purple-bob", ar: "بنفسجي قصير", en: "Purple Bob", prompt: "Short purple-blue bob with side bangs." },
  ],
  "chainsaw-man": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "blond-messy", ar: "أشقر فوضوي", en: "Messy Blond", prompt: "Messy short blond devil-hunter hair." },
    { id: "horns", ar: "شعر بقرون", en: "Horned", prompt: "Long messy blonde hair with red devil horns." },
  ],
  "solo-leveling": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "black-sharp", ar: "أسود حاد", en: "Sharp Black", prompt: "Sleek black hunter hair with sharp bangs and violet glow." },
    { id: "monarch", ar: "شعر الملك", en: "Monarch", prompt: "Black hair floating upward in shadow energy with violet highlights." },
  ],
  "fairy-tail": [
    { id: "keep", ar: "نفس الشعر", en: "Keep", prompt: "Keep the original hairstyle redrawn in the anime style." },
    { id: "pink-spiky", ar: "وردي سبايكي", en: "Pink Spiky", prompt: "Spiky pink dragon-slayer hair." },
    { id: "scarlet", ar: "أحمر طويل", en: "Long Scarlet", prompt: "Long flowing scarlet knight hair." },
  ],
};

export const charactersFor = (style: string) => CHARACTERS.filter((c) => c.style === style);
export const aurasFor = (style: string) => AURAS_BY_STYLE[style] ?? AURAS_BY_STYLE.dbz;
export const hairsFor = (style: string) => HAIRS_BY_STYLE[style] ?? HAIRS_BY_STYLE.dbz;
