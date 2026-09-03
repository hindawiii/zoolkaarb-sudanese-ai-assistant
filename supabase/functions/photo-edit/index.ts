const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PROMPTS: Record<string, string> = {
  "remove-bg":
    "Remove the background from this image completely. Return ONLY the main subject with a fully transparent background. Preserve fine details like hair edges. Output as PNG with transparency.",
  restore:
    "Restore this old or damaged photo. Remove scratches, noise, and blemishes. Recover natural colors and sharpness while keeping the original composition and faces identical. Output a clean, high-quality version.",
  enhance:
    "Enhance this photo with AI: improve sharpness, lighting, color balance, and overall clarity. Make it look like a professional high-resolution shot. Do not change the subject or composition.",
  "filter-bw":
    "Convert this photo to a high-contrast cinematic black and white. Keep crisp details and tonal depth. No color tint.",
  "filter-warm":
    "Apply a warm, golden-hour color filter to this photo. Boost warm tones (orange/gold), keep skin tones natural, slight film grain.",
  "filter-cool":
    "Apply a cool cinematic color grade to this photo. Cyan-blue shadows, gentle highlights, modern moody look. Keep faces natural.",

  // AI Studio Suite
  "anime-hero":
    "Transform the person in this photo into a high-quality Japanese anime character. Vibrant colors, clean cel-shading, expressive eyes, dynamic hair. Keep recognizable facial features and pose.",
  "clothes-formal":
    "Replace the clothing of the person in this photo with elegant formal wear (sharp suit or evening dress). Match lighting, shadows, and skin tone perfectly. Keep face, hair, and pose identical.",
  "clothes-traditional":
    "Replace the clothing of the person in this photo with traditional Sudanese attire (jalabiya/thobe with imma turban for men, vibrant toub for women). Match lighting, shadows, and skin tone. Keep face and pose identical.",
  "clothes-casual":
    "Replace the clothing of the person in this photo with stylish modern casual streetwear. Match lighting, shadows, and skin tone. Keep face, hair, and pose identical.",
  "face-swap":
    "Take the face from the SECOND image and seamlessly blend it onto the person in the FIRST image. Match skin tone, lighting direction, shadows, and color grading perfectly. Preserve the body, pose, and background of the first image. Photorealistic result.",
  "smart-blender":
    "Merge the provided images into a single cohesive composition. Apply AI color harmonization to unify lighting, shadows, and color grading across all elements so they look like one natural photo.",
};

// ===== Anime Transformation Studio (ControlNet/LoRA-style prompt composer) =====
const STYLE_PROMPTS: Record<string, string> = {
  dbz: "Akira Toriyama Dragon Ball Z / Super shonen anime style: bold thick black inking, cel-shaded primary colors, hyper-defined muscular anatomy, sharp angular jawlines, large expressive determined eyes, dramatic speed-line backgrounds.",
  naruto: "Masashi Kishimoto Naruto Shippuden style: clean cel-shaded line art, slightly muted earthy palette, sharp shonen facial geometry, ninja-headband-friendly composition, dynamic shinobi posture.",
  "one-piece": "Eiichiro Oda One Piece style: exaggerated proportions, expressive cartoon-leaning faces, bold inking, vibrant tropical adventure palette, pirate-era ambience.",
  hxh: "Yoshihiro Togashi Hunter x Hunter style: refined detailed line art, painterly soft cel-shading, rich saturated highlights, mature shonen character design.",
  conan: "Gosho Aoyama Detective Conan style: classic 90s shonen mystery look, cleaner softer line art, realistic proportions, urban detective ambience.",
  "black-clover": "Black Clover (Yūki Tabata) style: heavy dramatic inking, high-contrast cel shading, magic-knight uniforms with capes, swirling grimoire magic particles, fierce determined expressions, dark fantasy battlefield ambience.",
  "seven-deadly-sins": "The Seven Deadly Sins (Nakaba Suzuki) style: soft rounded line art with vivid saturated colors, ornate fantasy armor, glowing demonic/holy power marks, medieval fantasy lighting, dramatic power surges.",
  bleach: "Bleach (Tite Kubo) style: sleek elongated proportions, razor-sharp minimalist inking, monochrome black shihakusho robes with white accents, cold blue-white reiatsu spirit pressure distorting the air, stylish cinematic framing.",
  "sakamoto-days": "Sakamoto Days (Yuto Suzuki) style: modern crisp clean line art, semi-realistic proportions, slick urban action-thriller ambience, precise motion blur, sharp confident deadpan expression.",
  "demon-slayer": "Demon Slayer / Kimetsu no Yaiba (ufotabe) style: exquisite ukiyo-e influenced effects, water/flame breathing energy painted like traditional Japanese woodblock waves, checkered haori patterns, Taisho-era ambience, luminous particle VFX.",
  "jujutsu-kaisen": "Jujutsu Kaisen (Gege Akutami) style: gritty modern shonen inking, dark cursed-energy smoke, school uniform silhouettes, intense sharp eyes, cinematic contrast and heavy shadow.",
  aot: "Attack on Titan (Hajime Isayama) style: rough gritty realistic line art, muted desaturated military palette, Survey Corps uniform with green cape, ODM gear straps, grim war-torn atmosphere.",
  "one-punch": "One Punch Man (Murata) style: hyper-detailed realistic rendering with immaculate line work, explosive impact shockwaves, dramatic destruction debris, cinematic hero framing.",
  "tokyo-ghoul": "Tokyo Ghoul (Sui Ishida) style: dark gothic palette, red-black kagune tendrils, cracked mask aesthetics, melancholic horror atmosphere, fine detailed hatching.",
  "chainsaw-man": "Chainsaw Man (Tatsuki Fujimoto) style: raw sketchy expressive inking, grim urban devil-hunter mood, blood-red highlights, unhinged intense energy.",
  "solo-leveling": "Solo Leveling manhwa style: ultra-polished digital painting, glowing purple-blue shadow monarch aura, sharp cinematic rim lighting, dark armored fantasy design, epic scale.",
  "fairy-tail": "Fairy Tail (Hiro Mashima) style: energetic bold line art, warm vivid palette, fiery/celestial magic effects, guild-mark tattoo, adventurous heroic mood.",
};
const HERO_PROMPTS: Record<string, string> = {
  goku: "Force the identity of Son Goku from Dragon Ball Z: signature spiky black (or golden Super Saiyan) upright spiky hair, orange gi with blue undershirt and belt, Kanji symbol on chest, confident grin.",
  naruto: "Force the identity of Naruto Uzumaki: bright spiky blond hair, blue eyes, three whisker marks on each cheek, orange and black tracksuit jacket, Konoha forehead protector.",
  asta: "Force the identity of Asta from Black Clover: short spiky ash-blond hair, fierce green eyes, black Bull squad robe, giant black anti-magic demon-slayer sword, faint black demon aura.",
  yami: "Force the identity of Yami Sukehiro: tall imposing build, slicked-back black hair, cigarette, Black Bulls captain coat, dark cursed katana with black dark-magic slashes.",
  meliodas: "Force the identity of Meliodas from Seven Deadly Sins: messy blond hair, green eyes, black Boar Hat outfit with white cravat, dragon sin mark, dark demonic aura swirling.",
  escanor: "Force the identity of Escanor at noon: towering muscular build, blazing golden sunlight aura, Divine Axe Rhitta, immense prideful presence.",
  ichigo: "Force the identity of Ichigo Kurosaki: bright orange spiky hair, black shihakusho robe, giant Zangetsu cleaver blade, blue-white reiatsu spirit pressure.",
  sakamoto: "Force the identity of Taro Sakamoto (Sakamoto Days): calm deadpan expression, slick black hair, dark suit, effortless lethal poise.",
  tanjiro: "Force the identity of Tanjiro Kamado: burgundy-tipped dark hair, scar on forehead, green-black checkered haori, nichirin katana, water-breathing wave effects.",
  gojo: "Force the identity of Satoru Gojo: white spiky hair, glowing blue infinity eyes (or black blindfold), dark high-collar jujutsu uniform, limitless cursed energy distortion.",
  sukuna: "Force the identity of Ryomen Sukuna: pink-blond hair, black tattoo markings across the face and body, cruel grin, crimson cursed slashes in the air.",
  levi: "Force the identity of Levi Ackerman: black undercut hair, cold sharp eyes, Survey Corps uniform with green cape and ODM gear, dual blades.",
  saitama: "Force the identity of Saitama: completely bald head, plain blank expression, yellow hero jumpsuit with red gloves, boots and white cape, devastating shockwave behind.",
  kaneki: "Force the identity of Ken Kaneki: white hair, one red kakugan eye, black leather mask with steel teeth, red kagune tendrils.",
  denji: "Force the identity of Denji / Chainsaw Man: messy blond hair, sharp-toothed grin, white shirt with black tie, chainsaw pull-cord chest, chainsaw blades.",
  "sung-jinwoo": "Force the identity of Sung Jinwoo (Solo Leveling): black hair, glowing violet eyes, black shadow-monarch armored coat, purple shadow aura and kneeling shadow soldiers.",
  natsu: "Force the identity of Natsu Dragneel: spiky pink hair, white scaled scarf, black open vest, blazing orange fire fists.",
  luffy: "Force the identity of Monkey D. Luffy: messy black hair under iconic straw hat with red ribbon, scar under left eye, red open vest, blue shorts, wide carefree smile.",
};
const AURA_PROMPTS: Record<string, string> = {
  kaio: "Add an explosive Dragon Ball Ki aura: blazing golden-white energy bursting from the torso outward, lightning sparks, ground debris floating upward, intense rim light on the subject.",
  chakra: "Add a swirling blue Naruto Chakra aura around the torso: translucent flowing energy ribbons, soft cyan glow, faint kanji-like sigils.",
  nen: "Add a Hunter x Hunter Nen aura: dense controlled energy outline hugging the body, subtle multicolor shimmer, focused intense vibe.",
  haki: "Add a One Piece Conqueror's Haki aura: dark purple-black smoky energy radiating from the torso with crackling lightning, oppressive overpowering atmosphere.",
};
const HAIR_PROMPTS: Record<string, string> = {
  spiky: "Transform hair into Dragon Ball-style upright spiky shonen hair, sharp gravity-defying spikes, bold inking.",
  "ssj-gold": "Transform hair into Super Saiyan golden upright flame-shaped spiky hair, glowing yellow.",
  keep: "Keep the original hairstyle but redrawn in the chosen anime style.",
};
// Props are POSE-ADAPTIVE. The AI must reuse one of the subject's EXISTING hands
// (repositioning the arm naturally within anatomically plausible range) — never
// grow an extra arm. If no hand is free or visible in the frame, the "prop" must
// be rendered as a floating energy manifestation next to the subject instead of
// a physical held object. Never duplicate limbs, fingers, or hands.
const PROP_PROMPTS: Record<string, string> = {
  none: "",
  saber: "Give the subject a glowing energy saber-style sword. IMPORTANT: do NOT add a new arm — reuse one of the subject's existing hands. If a hand is already visible and free, gracefully reposition that same arm so the hand grips the saber hilt in a natural, anatomically correct way (elbow, shoulder, and wrist must remain consistent with a single body). If both hands are occupied, hidden, or cropped out of the frame, render the saber as a floating blade of energy hovering beside the subject instead of a held sword. The blade casts cyan/white rim light on the face and torso.",
  rasengan: "Give the subject a swirling blue Rasengan chakra sphere. IMPORTANT: do NOT add a new arm — reuse one of the subject's existing hands. If a hand is visible and free, reposition that same arm so the open palm faces up/forward holding the sphere, keeping the shoulder-elbow-wrist chain anatomically consistent. If no hand is free or visible, render the Rasengan as a floating chakra orb hovering beside the subject with cyan energy trails. Cyan rim light on hand and face.",
  staff: "Give the subject a mystical shonen battle staff with subtle glowing runes. IMPORTANT: do NOT add a new arm — reuse one of the subject's existing hands. If a hand is visible and free, reposition that arm so the fingers wrap around the staff naturally. If no hand is free or visible, render the staff as a floating rune-lit staff hovering vertically beside the subject instead of held.",
};

// ===== Mythical Guardian / spirit beast manifestations =====
const GUARDIAN_PROMPTS: Record<string, string> = {
  none: "",
  "dragon-behind": "Manifest a colossal oriental dragon spirit rising BEHIND the subject as a loyal guardian: massive scaled serpentine body, glowing eyes, whiskers flowing in the wind, smoke and embers, towering far above the subject while the subject stays exactly the same size and position in the frame. The dragon must be clearly behind, never overlapping the subject's face.",
  "dragon-coil": "Manifest a translucent dragon made of pure energy COILING around the subject's body and arms like a living aura ribbon, emerging from the subject's own power, glowing scales, energy particles trailing. The dragon never covers the subject's face and never adds limbs to the subject.",
  "phoenix-behind": "Manifest a giant blazing phoenix spirit spreading its wings BEHIND the subject, feathers of fire and gold light, embers rising, radiant halo of flame.",
  "wolf-behind": "Manifest a colossal spectral wolf standing BEHIND the subject as a guardian beast, glowing blue-white spirit fur, bared fangs, frozen mist breath.",
  "tiger-aura": "Manifest a roaring spirit tiger made of energy lunging outward from the subject's aura, striped light trails, ferocious presence.",
  "serpent-coil": "Manifest an enormous energy serpent coiling in spirals around the subject from feet to shoulders, hypnotic glowing scales, venomous mist.",
  "oni-behind": "Manifest a towering demonic Oni spirit looming BEHIND the subject with horned mask, glowing red eyes and dark purple smoke, oppressive intimidating presence.",
  "kitsune-behind": "Manifest a nine-tailed spirit fox (kitsune) BEHIND the subject, tails fanned out in glowing amber-orange flame, ancient mystical presence.",
};

// ===== Outfitter Studio (ControlNet-style pose-locked outfit composer) =====
const OUTFIT_VARIANTS: Record<string, string> = {
  // Heritage (Sudanese)
  "galabiya": "Replace clothing with a clean traditional Sudanese white jalabiya (galabiya) only — no headwear, no accessories.",
  "galabiya-imma": "Replace clothing with a traditional Sudanese white jalabiya AND a properly wrapped white Imma turban on the head.",
  "galabiya-imma-shawl-cane": "Replace clothing with a Sudanese white jalabiya, a wrapped white Imma turban, an elegant shawl draped over the shoulder, and a wooden Sudanese cane (3aja3) held in hand.",
  "galabiya-imma-shawl-cane-markoub": "Replace clothing with a Sudanese white jalabiya, wrapped white Imma turban, shoulder shawl, wooden Sudanese cane in hand, AND traditional Sudanese Markoub leather shoes on the feet.",
  "ansar": "Replace clothing with an Ansar-style Sudanese jalabiya (patched colorful cloth pattern characteristic of Ansar/Mahdi tradition).",
  // Premium heritage designs
  "arban-blue": "Replace clothing with an elegant sky-blue Arban-style Khaleeji jalabiya (long, loose cut with a straight vertical placket), a matching light-blue wrapped Imma turban on the head, and a long white scarf with a bold cobalt-blue geometric Arban pattern draped over one shoulder down to the waist. Fabric looks premium cotton with a soft satin sheen.",
  "emirati-white-cane": "Replace clothing with a pristine white Emirati-style long thobe with wide sleeves, a small embroidered chest pocket with tassels in turquoise and gold, a white wrapped Imma turban, a white scarf with turquoise-and-gold fringed ends draped over the shoulder, and a black polished wooden cane held in hand. Luxurious, formal Gulf aesthetic.",
  "sheikh-gold-embroidered": "Replace clothing with an elegant white Sudanese jalabiya paired with a heavy brown shawl richly embroidered with intricate gold Arabic calligraphy patterns and tassels, and a matching white Imma turban wrapped in the traditional Sheikh style. Rich, ceremonial, ustaz/sheikh appearance.",
  "sino-black-gold-shawl": "Replace clothing with a clean white Sudanese jalabiya, a small white Taqiya on the head, and a long black shawl with an ornate gold-and-copper geometric medallion pattern along its length and fringed ends, draped over one shoulder. Premium Sino-style Sudanese design.",
  "dark-embroidered-jalabiya": "Replace clothing with a modern dark chocolate-brown (or midnight black) Sudanese jalabiya featuring intricate tone-on-tone embroidered patterns along the chest placket, cuffs, and hem in matching silk thread. Contemporary luxury traditional look.",
  "purple-thobe-turban": "Replace clothing with a rich royal-purple simple Sudanese thobe (plain cut, no embroidery), a crisp white Imma turban wrapped on the head with the tail hanging over one shoulder, and a slim polished wooden cane held in hand.",
  "black-thobe-white-turban": "Replace clothing with a sharp jet-black simple Sudanese thobe (plain, straight cut), a crisp white Imma turban wrapped on the head with the tail hanging over one shoulder, and a slim polished wooden cane held in hand. Striking monochrome contrast.",
  // Formal
  "classic": "Replace clothing with an elegant classic black/charcoal two-piece formal suit with crisp white shirt and tie.",
  "blazer": "Replace clothing with a tailored modern blazer over a dress shirt with smart chinos.",
  "wedding": "Replace clothing with a luxurious wedding suit (ivory or navy tuxedo with bow tie and pocket square).",
  "navy-slim-suit": "Replace clothing with a tailored slim-fit navy-blue two-piece suit, crisp white dress shirt, light-blue silk tie, and brown leather Oxford shoes. Sharp business-formal look, professional editorial lighting.",
  "charcoal-modern-suit": "Replace clothing with a modern charcoal-grey slim two-piece suit, white shirt, dark silk tie with subtle pattern, and polished black leather derby shoes. Contemporary corporate elegance.",
  "olive-green-suit": "Replace clothing with a stylish olive-green tailored two-piece suit, patterned dress shirt (subtle floral or paisley) with open collar, and brown suede loafers. Fashion-forward warm formal look.",
  "ivory-summer-suit": "Replace clothing with a luxurious ivory / off-white tailored two-piece summer suit, matching white shirt with open collar, and clean white leather sneakers or white loafers. Bright, airy, high-end resort-formal aesthetic.",
  "double-breasted-navy": "Replace clothing with a sharp double-breasted navy-blue suit with peak lapels and gold buttons, white shirt, burnt-orange knitted tie, brown pocket square, and dark brown leather dress shoes. Refined Italian-style tailoring.",
  "double-breasted-black": "Replace clothing with a sleek double-breasted jet-black suit with peak lapels, black turtleneck underneath, and polished black Chelsea boots. Minimalist high-fashion monochrome formal.",
  "cream-blazer-turtleneck": "Replace clothing with a cream / beige tailored blazer over a light turtleneck sweater, slim mid-blue jeans, and brown leather loafers. Smart-casual editorial menswear look.",
  "overcoat-suit": "Replace clothing with a long tailored wool overcoat (camel or charcoal grey) worn open over a full grey three-piece suit with white shirt and tie, plus polished leather Oxford shoes. Sophisticated winter-formal ensemble.",
  "grey-suit-turtleneck": "Replace clothing with a light-grey tailored two-piece suit worn over a fine white turtleneck sweater (no tie), and clean white leather sneakers. Modern minimalist formal.",
  "light-blue-suit": "Replace clothing with a light sky-blue tailored two-piece suit, crisp white shirt, dark navy tie with subtle pattern, and brown leather brogues. Fresh contemporary formal look.",
  // ===== WOMEN — Heritage (modest Islamic dress: Sudanese / Maghrebi / Gulf) =====
  "w-thob-sudani-garmasees": "Replace clothing with an authentic Sudanese women's Thob (toub): a single long 4.5-meter lightweight fabric elegantly wrapped over a full-length modest under-dress with long sleeves, in a vivid Garmasees silk style with a glossy sheen and a decorative woven border, draped over the head and one shoulder in the traditional Sudanese manner. Fully modest, loose, opaque, covering hair, arms, and ankles.",
  "w-thob-chiffon-embroidered": "Replace clothing with a Sudanese women's chiffon Thob (toub) in a soft pastel tone with delicate floral embroidery and a beaded border, wrapped over a long-sleeved full-length modest inner dress, draped over the head and shoulder. Airy, elegant, completely opaque and modest.",
  "w-thob-zaffa-bridal": "Replace clothing with a festive Sudanese bridal Zaffa Thob in rich saturated colors (gold, magenta, emerald) with shimmering metallic threads and an ornate wide border, wrapped over a long-sleeved floor-length modest dress, draped gracefully over the head and shoulder. Ceremonial, luxurious, fully modest.",
  "w-thob-white-classic": "Replace clothing with a classic plain white Sudanese women's Thob (toub) of fine cotton, wrapped over a modest long-sleeved ankle-length white dress, draped over the head and one shoulder. Simple, dignified, fully covering.",
  "w-kaftan-moroccan": "Replace clothing with a luxurious Moroccan Kaftan: floor-length loose robe with long sleeves, handmade Sfifa braid trim and Aqad button detailing along the front placket, rich jewel-tone satin/brocade fabric with subtle gold embroidery. Fully modest, loose fit, high neckline.",
  "w-takchita-belted": "Replace clothing with a two-layer Moroccan Takchita: an inner Tahtiya dress and a sheer embroidered outer layer (Dfina), cinched with an ornate wide Mdamma belt at the waist, long sleeves, floor length, opulent embroidery. Modest and completely opaque.",
  "w-djellaba-hooded": "Replace clothing with a Moroccan women's Djellaba: loose ankle-length hooded robe (with the pointed Qob hood resting on the back), long sleeves, soft neutral or pastel fabric with tone-on-tone embroidered trim along the placket and cuffs. Everyday modest Maghrebi elegance.",
  "w-jabador-maghrebi": "Replace clothing with a Maghrebi women's Jabador set: an embroidered long tunic top with long sleeves over matching loose wide-leg Serwal trousers, silk fabric with fine Randa trim. Modest two-piece traditional set.",
  "w-melhfa-mauritanian": "Replace clothing with a Mauritanian Melhfa: a long flowing colorful veil-wrap of light fabric with tie-dye or printed patterns, wound around the entire body and head over a modest long dress, one edge draped over the shoulder. Fully covering, airy desert elegance.",
  "w-jebba-tunisian": "Replace clothing with a Tunisian women's traditional Jebba/Fouta-Blouza inspired ensemble: a long embroidered silk dress with gold Tel embroidery on the chest and sleeves, worn with a matching modest head covering. Floor-length, long-sleeved, opaque.",
  "w-karakou-algerian": "Replace clothing with an Algerian Karakou: a velvet jacket richly embroidered with gold Medjboud thread over a floor-length skirt or wide Serwal Chalka trousers, long sleeves, ceremonial Algerian elegance, fully modest.",
  "w-abaya-black-embroidered": "Replace clothing with a classic black Gulf Abaya: floor-length loose open-front overgarment in flowing crepe fabric with tasteful embroidery and crystal detailing along the sleeves and front edges, worn with a matching black Shayla headscarf covering the hair. Completely modest, opaque and non-figure-hugging.",
  "w-abaya-butterfly": "Replace clothing with an elegant butterfly-sleeve Abaya (Farasha): flowing wide-cut floor-length abaya with dramatic draped kimono sleeves in black or deep charcoal with a subtle satin border, matching headscarf covering the hair. Loose, modest, graceful movement.",
  "w-abaya-colored-cloche": "Replace clothing with a modern colored Kloosh (cloche) Abaya in a soft muted tone (beige, dusty rose, olive or navy) with flared A-line panels, long sleeves, and delicate contrast piping, plus a coordinated modest headscarf. Contemporary Gulf modest fashion.",
  "w-thob-nashal": "Replace clothing with a traditional Khaleeji Thob Al-Nashal: a wide, floor-length sheer overgarment densely embroidered with gold Zari thread in floral motifs, worn over a modest long inner dress, with a matching head covering. Ceremonial Gulf heritage, fully modest.",
  "w-daraa-emirati": "Replace clothing with an Emirati Jalabiya/Daraa: loose floor-length dress with wide sleeves and rich gold Talli embroidery along the neckline, cuffs and hem, in a vibrant fabric, worn with a matching Shayla headscarf. Comfortable, modest, traditional Gulf.",
  "w-jalabiya-egyptian": "Replace clothing with an Egyptian countryside Jalabiya: loose ankle-length printed cotton dress with long sleeves, a modest round embroidered neckline and a coordinated head scarf tied traditionally. Fully modest folk style.",
  "w-thob-palestinian": "Replace clothing with a Palestinian embroidered Thob: floor-length black or natural linen dress with vivid red Tatreez cross-stitch embroidery panels on the chest, sleeves and skirt, long sleeves, worn with a white embroidered head veil. Heritage, fully modest.",
  // ===== WOMEN — Formal (modest Islamic business & evening wear) =====
  "w-abaya-formal-plain": "Replace clothing with a sharply tailored plain formal Abaya in matte black or deep navy: straight floor-length silhouette, structured shoulders, long sleeves with minimal cuff detail, worn with a neatly wrapped matching hijab. Professional, refined and fully modest.",
  "w-abaya-blazer": "Replace clothing with a modern Abaya-Blazer: a structured long blazer-style open abaya with notched lapels and belted waist over a modest long inner dress, in charcoal or camel wool-blend fabric, with a coordinated satin hijab. Executive modest fashion.",
  "w-blazer-wideleg-set": "Replace clothing with a modest formal set: an oversized tailored blazer over a high-neck blouse and wide-leg palazzo trousers in a matching neutral tone (beige, grey or navy), full coverage with long sleeves and loose fit, plus a coordinated hijab.",
  "w-suit-maxi-skirt": "Replace clothing with a women's formal suit adapted for modesty: a tailored single-breasted jacket with long sleeves over a floor-length straight maxi skirt in matching fabric, high-neck blouse underneath, and a neatly styled hijab. Corporate and fully covered.",
  "w-navy-pleated-skirt-suit": "Replace clothing with a navy formal skirt suit: a fitted-but-loose long blazer over an ankle-length pleated midi-maxi skirt, a cream high-neck blouse, and a soft navy hijab. Polished professional modest look.",
  "w-office-jilbab": "Replace clothing with a long office Jilbab: a one-piece floor-length coat-dress with a front button placket, tailored collar, long sleeves and a belted waist in a muted professional tone, with a matching plain hijab. Clean, modern, fully modest.",
  "w-maxi-dress-modest": "Replace clothing with an elegant modest maxi dress: floor-length flowing A-line dress with long bishop sleeves, a closed high neckline and subtle tonal texture, in a refined solid color, paired with a matching hijab. Loose and completely opaque.",
  "w-evening-embroidered": "Replace clothing with a luxurious modest Islamic evening gown: floor-length embroidered gown with long sleeves, closed neckline, hand-beaded bodice and a flowing skirt with a soft train, paired with an elegantly draped matching hijab. Formal, glamorous, fully covering.",
  "w-modest-wedding-gown": "Replace clothing with a modest Islamic bridal gown: ivory floor-length A-line wedding dress with long lace sleeves, a high closed neckline, pearl and lace embellishment, and a long matching veil covering the hair. Elegant, fully modest.",
  "w-kaftan-evening-belted": "Replace clothing with a premium evening Kaftan: floor-length loose kaftan gown in rich satin with gold embroidery along the neckline and sleeves, cinched by an ornate jeweled belt, plus a coordinated headscarf. Festive and modest.",
  "w-chiffon-layered-gown": "Replace clothing with a layered chiffon modest gown: multiple soft flowing chiffon layers in gradient pastel tones, long sleeves, closed neckline, floor length, with a light matching hijab draped elegantly. Airy, feminine, fully covered.",
  // Casual

  "tshirt-jeans": "Replace clothing with a stylish fitted t-shirt and modern blue jeans.",
  "hoodie": "Replace clothing with a premium streetwear hoodie and joggers.",
  "polo": "Replace clothing with a clean polo shirt and casual shorts.",
  "denim-jacket": "Replace clothing with a denim jacket over a plain t-shirt with dark jeans.",
  "black-overshirt-set": "Replace clothing with a black waffle-knit button-up overshirt jacket with a collar, chest and side flap pockets and silver snap buttons, worn open over a crisp white crew-neck t-shirt, with slim black tapered trousers. Clean modern Korean-style casual menswear, soft studio lighting.",
  "brown-overshirt-beige": "Replace clothing with a rich chocolate-brown wool overshirt jacket worn open over a white crew-neck t-shirt, tucked-in relaxed fit, with beige / khaki slim chino trousers and clean white leather sneakers. Warm minimal smart-casual outfit-inspiration look.",
  "navy-overshirt-cream": "Replace clothing with a deep navy-blue textured overshirt jacket worn open over a white crew-neck t-shirt, with cream / off-white slim chino trousers and white leather sneakers. Crisp contemporary smart-casual styling.",
  "charcoal-overshirt-black": "Replace clothing with a dark charcoal-grey zip-front lightweight overshirt jacket worn open over a white crew-neck t-shirt, with black slim tapered trousers and clean white sneakers. Monochrome modern casual look.",
  "grey-bomber-black": "Replace clothing with a grey leather bomber jacket with a spread collar, ribbed black cuffs and hem, worn over a plain black crew-neck t-shirt, with slim black jeans and black leather Chelsea boots. Urban street-style editorial mood.",
  "camel-jacket-turtleneck": "Replace clothing with a camel / beige suede zip-up bomber jacket over a charcoal fine-knit turtleneck sweater, black tailored trousers and black leather Chelsea boots. Refined autumn smart-casual menswear.",

  // Sport & Pajamas
  "tracksuit-grey-black": "Replace clothing with a premium two-piece athletic tracksuit: a fitted light-grey zip-up track jacket with a bold black chest panel and small sporty logo, matching slim-fit black joggers with a grey side stripe, and clean white low-top sneakers. Modern athleisure editorial look.",
  "tracksuit-dragon-navy": "Replace clothing with a stylish navy-blue two-piece streetwear tracksuit: long-sleeve navy sweatshirt with a large white oriental dragon print running along one side and vertical white 'DRAGON' lettering, matching navy joggers with the same dragon graphic on one leg and vertical text on the other, and white running sneakers.",
  "tracksuit-dragon-brown": "Replace clothing with a mocha-brown two-piece streetwear tracksuit: long-sleeve brown sweatshirt with an oriental dragon print in cream running along one side and vertical 'DRAGON' lettering, matching brown joggers with the same dragon graphic on one leg, and white sneakers. Warm earthy athleisure vibe.",
  "tracksuit-adidas-white": "Replace clothing with a clean off-white zip-up hooded tracksuit featuring three thin black stripes down each sleeve and down the outer sides of matching white joggers, small embroidered sport logo on the chest, and pristine white sneakers. Classic sport aesthetic.",
  "hoodie-dragon-black": "Replace clothing with an oversized black cotton pullover hoodie featuring a large white oriental dragon print wrapping around the sleeve and side, plus vertical white Japanese katakana lettering on the chest, paired with plain black joggers or dark jeans. Streetwear anime aesthetic.",
  "hoodie-sakura-white": "Replace clothing with an oversized clean white pullover hoodie featuring a delicate cherry-blossom (sakura) branch print with pink and red flowers stretching across the chest and shoulder, plus small vertical Japanese katakana lettering on the side, paired with light-wash jeans or beige joggers. Minimal Japanese streetwear.",
  "hoodie-berserk-white": "Replace clothing with an oversized white pullover hoodie featuring a large centered black-and-red manga-style anime warrior illustration with bold red Japanese kanji title above and small English quote text below, paired with black joggers. Premium anime streetwear.",
  "hoodie-anime-black": "Replace clothing with an oversized black pullover hoodie featuring a bold anime character print on the chest with electric blue lightning effects and Japanese kanji lettering, paired with black joggers and dark sneakers. Edgy otaku streetwear.",
  "hoodie-jujutsu-navy": "Replace clothing with a raglan-sleeve hoodie combining a white body panel with navy-blue sleeves and hood, featuring a centered anime character illustration on the chest with vertical Japanese lettering, paired with dark joggers. Sporty anime streetwear.",
  "pajama-cotton-set": "Replace clothing with a comfortable matching two-piece cotton pajama set: soft long-sleeve button-up pajama shirt with a subtle stripe or small dot pattern in navy/white and matching pajama pants with elastic waistband. Cozy home aesthetic, barefoot or house slippers.",
  "pajama-silk-luxury": "Replace clothing with a luxurious matching two-piece silk pajama set with satin sheen in deep burgundy or midnight-navy, notched-collar button-up top with contrast piping and matching relaxed-fit trousers. Elegant loungewear.",
  "shorts-tank-gym": "Replace clothing with athletic gym wear: a fitted moisture-wicking sleeveless tank top in black or heather grey, matching mid-thigh sport shorts with side pockets, and clean training sneakers. Fit, sporty, gym-ready look.",
};
const EYEWEAR_PROMPTS: Record<string, string> = {
  "none": "Do not add any eyewear; if the subject already wears glasses keep them unchanged.",
  "sunglasses-aviator": "Add classic aviator sunglasses on the face, properly aligned to the eyes, with realistic reflections and matching shadow on the cheekbones.",
  "sunglasses-wayfarer": "Add modern wayfarer sunglasses on the face, properly aligned to the eyes, realistic reflections.",
  "glasses-clear": "Add stylish clear prescription glasses on the face, properly aligned to the eyes, subtle lens reflections.",
};
const HEADWEAR_PROMPTS: Record<string, string> = {
  "none": "Do not add any headwear; keep the original hair visible exactly as is.",
  "cap": "Add a casual modern baseball cap on the head, fitted to the head shape with realistic shadow on the forehead.",
  "taqiya": "Add a traditional white Sudanese Taqiya (skull cap) on the head, fitted naturally.",
  "tarboush": "Add a classic red Tarboush (fez) on the head, fitted naturally with subtle shadow.",
};

const buildOutfitterPrompt = (p: {
  category?: string; variant?: string; eyewear?: string; headwear?: string;
  mixMatch?: boolean; mixTarget?: string; pose?: string;
  framing?: string; includeShoes?: boolean; includeCane?: boolean;
}) => {
  let variantPrompt = OUTFIT_VARIANTS[p.variant ?? ""] ?? OUTFIT_VARIANTS["galabiya-imma"];
  const eyewearPrompt = EYEWEAR_PROMPTS[p.eyewear ?? "none"];
  const headwearPrompt = HEADWEAR_PROMPTS[p.headwear ?? "none"];

  const mixMatchPrompt = p.mixMatch
    ? `IMPORTANT: This is a Mix & Match inpainting operation. Modify ONLY the ${p.mixTarget ?? "top"} clothing region. Keep ALL other clothing pieces, accessories, headwear, and eyewear that the subject is currently wearing 100% untouched and pixel-identical.`
    : "";

  const poseHint = p.pose && p.pose !== "natural"
    ? `Detected pose: ${p.pose}. Preserve this exact body posture without altering limb positions.`
    : "Preserve the subject's exact original body posture without altering limb positions.";

  // Framing / accessory guardrails: strip shoes & cane references when the photo isn't full-body,
  // or when the user explicitly disabled them. Otherwise floating shoes/canes appear where the
  // frame is cropped above the feet.
  const isFullBody = p.framing === "full";
  const shoesAllowed = p.includeShoes !== false && isFullBody;
  const caneAllowed = p.includeCane !== false && isFullBody;

  if (!shoesAllowed) {
    variantPrompt = variantPrompt
      .replace(/,?\s*(?:with\s+)?(?:brown|black|white|tan|leather|oxford|derby|loafer|dress|markoub|cognac|burgundy)?\s*shoes?[^.,]*/gi, "")
      .replace(/,?\s*(?:with\s+)?sneakers?[^.,]*/gi, "");
  }
  if (!caneAllowed) {
    variantPrompt = variantPrompt.replace(/,?\s*(?:holding|with|and)?\s*(?:a\s+)?(?:black|wooden|traditional)?\s*(?:cane|walking stick|staff|3aga|3agaz|agaz)[^.,]*/gi, "");
  }

  const framingRule = isFullBody
    ? "Full-body composition: render the entire outfit including footwear naturally on the ground plane."
    : "CRITICAL FRAMING RULE: The source photo is a half-body / portrait crop where the feet and lower legs are NOT visible. DO NOT add shoes, sandals, boots, markoub, or any footwear anywhere in the frame — they must not float or appear cropped at the bottom. DO NOT add a cane, walking stick, or staff. Keep the crop identical to the original photo (do not extend the canvas downward).";

  const accessoryOverride = (!shoesAllowed || !caneAllowed)
    ? `Explicitly OMIT the following from the output: ${[!shoesAllowed && "any footwear/shoes/markoub", !caneAllowed && "any cane/walking stick/staff"].filter(Boolean).join(", ")}. If the outfit description mentions them, ignore that part.`
    : "";

  return [
    "Photorealistic outfit replacement with strict pose preservation (ControlNet-style hard constraint).",
    "MANDATORY: Preserve the subject's facial identity, skin tone, hair (unless headwear is added), exact body pose, head tilt, hand positions, and background 100%.",
    poseHint,
    framingRule,
    variantPrompt,
    eyewearPrompt,
    headwearPrompt,
    accessoryOverride,
    mixMatchPrompt,
    "Match lighting direction, shadows, color temperature, and grain of the original photo perfectly so the new clothing looks naturally photographed on the subject. No deformation of body proportions. No extra limbs. No identity drift.",
  ].filter(Boolean).join(" ");
};

const buildAnimePrompt = (p: {
  style?: string; hero?: string; aura?: string; hair?: string; prop?: string;
  bodyPose?: string; visibleHand?: string; safeMode?: boolean; guardian?: string;
  heroText?: string; formLabel?: string; auraText?: string; hairText?: string;
}) => {
  const hasProp = p.prop && p.prop !== "none" && PROP_PROMPTS[p.prop];
  const forceFloating = !!p.safeMode || p.visibleHand === "none";
  const bodyPoseHint =
    p.bodyPose === "standing" ? "The subject is standing upright — preserve the full standing posture with feet planted." :
    p.bodyPose === "half" ? "The subject is framed from the waist / chest up (half-body portrait) — do NOT invent legs, feet, or ground beyond the original crop." :
    p.bodyPose === "sitting" ? "The subject is seated — preserve the seated posture, folded legs, and any chair/surface underneath exactly as in the source photo." :
    "Preserve the subject's natural body posture as it appears in the source photo.";
  const handHint =
    p.visibleHand === "left" ? "Only the subject's LEFT hand is clearly visible and free — if a prop is added it MUST be held by that left hand only; the right arm stays exactly where it is." :
    p.visibleHand === "right" ? "Only the subject's RIGHT hand is clearly visible and free — if a prop is added it MUST be held by that right hand only; the left arm stays exactly where it is." :
    p.visibleHand === "both" ? "Both hands are visible — you may use either one to hold the prop, but never both and never spawn a new arm." :
    p.visibleHand === "none" ? "NO hands are clearly visible or free. DO NOT render a held object — the prop MUST appear as floating energy beside the subject instead." :
    "";
  const propBlock = hasProp
    ? (forceFloating
        ? `${PROP_PROMPTS[p.prop!]} SAFE FALLBACK MODE: render the prop STRICTLY as a floating energy manifestation hovering beside the subject in the direction the body is facing — do NOT render any held-object grip, do NOT reposition any arm, do NOT add a new limb.`
        : PROP_PROMPTS[p.prop!])
    : "";
  const parts = [
    "Transform the person in this photo into a high-fidelity Japanese Shonen anime illustration.",
    "Strictly preserve the subject's base pose, head tilt, facial expression, and any headphones or eyewear they are wearing.",
    "Preserve recognizable facial identity (natural eye shape, symmetric facial features, one nose, one mouth, correct ear count). No warped, melted, or distorted face. No duplicated facial features.",
    "STRICT ANATOMY RULES: The subject has exactly ONE head, TWO arms, TWO hands with FIVE fingers each, and TWO legs. Absolutely NO extra limbs, NO third arm, NO third hand, NO floating disembodied hands, NO duplicated fingers, NO merged limbs. If a limb is cropped or hidden in the original photo, keep it cropped/hidden — do not invent a new visible limb to hold objects or make poses.",
    bodyPoseHint,
    handHint,
    STYLE_PROMPTS[p.style ?? ""] ?? STYLE_PROMPTS["dbz"],
    p.heroText || (p.hero && HERO_PROMPTS[p.hero] ? HERO_PROMPTS[p.hero] : ""),
    p.formLabel ? `Render the character specifically in the "${p.formLabel}" transformation state, with all of its signature visual traits (hair, eyes, aura, costume changes) applied to the subject while keeping the subject's real facial identity recognizable.` : "",
    p.hairText || (p.hair && HAIR_PROMPTS[p.hair] ? HAIR_PROMPTS[p.hair] : ""),
    p.auraText || (p.aura && AURA_PROMPTS[p.aura] ? AURA_PROMPTS[p.aura] : ""),
    p.guardian && GUARDIAN_PROMPTS[p.guardian] ? `${GUARDIAN_PROMPTS[p.guardian]} The guardian creature is an energy manifestation of the subject's own willpower and destructive strength — it must never replace, occlude, or deform the subject, and must never add extra human limbs.` : "",
    propBlock,
    hasProp && !forceFloating
      ? "POSE ADAPTATION FOR THE PROP: analyze which of the subject's hands is most visible and free. Use THAT existing hand — gently re-articulate the same arm (shoulder → elbow → wrist within a natural range of motion) so it holds the item convincingly. Never spawn a new arm from the torso, shoulder, or back. If both hands are already occupied (in pockets, holding something, behind back, or off-frame), render the prop as floating energy instead."
      : "",
    "Zero tolerance for generic 'anime filter' look. Output a clean, professional, publishable Shonen anime illustration with crisp inking, cel shading, dynamic composition, correct anatomy, and accurate hero-specific styling.",
  ].filter(Boolean);
  return parts.join(" ");
};

// Post-generation anatomy safety check (text-only LLM verdict).
const verifyAnatomy = async (imageDataUrl: string, apiKey: string): Promise<{
  ok: boolean; issues: string[]; suggestedProp?: string;
}> => {
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: "You are an anatomy safety checker for anime image generation. Inspect the image and reply with STRICT JSON only, no prose. Schema: {\"ok\": boolean, \"issues\": string[], \"suggestedProp\": \"none\"|\"saber\"|\"rasengan\"|\"staff\"}. Set ok=false if you detect ANY of: third arm/hand, extra floating disembodied hand, more than 5 fingers on a hand, merged/fused limbs, duplicated faces, or a held prop that clearly grows from the wrong shoulder. If ok=false, suggest \"none\" to drop the prop." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        }],
      }),
    });
    if (!res.ok) return { ok: true, issues: [] };
    const data = await res.json();
    const raw: string = data?.choices?.[0]?.message?.content ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: true, issues: [] };
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      ok: !!parsed.ok,
      issues: Array.isArray(parsed.issues) ? parsed.issues.slice(0, 5) : [],
      suggestedProp: typeof parsed.suggestedProp === "string" ? parsed.suggestedProp : undefined,
    };
  } catch (e) {
    console.error("verifyAnatomy failed", e);
    return { ok: true, issues: [] };
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { imageBase64, images, action, anime, outfitter, sceneSwap } = await req.json();
    const imageList: string[] = Array.isArray(images) && images.length > 0
      ? images
      : imageBase64
        ? [imageBase64]
        : [];
    const noImageActions = ["outfit-swatch"];
    if (imageList.length === 0 && !noImageActions.includes(action)) {
      return new Response(JSON.stringify({ error: "imageBase64 or images is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Standalone anatomy verification action (called after generation).
    if (action === "verify-anime-anatomy") {
      const toDataUrl2 = (s: string) => s.startsWith("data:") ? s : `data:image/png;base64,${s}`;
      const verdict = await verifyAnatomy(toDataUrl2(imageList[0]), LOVABLE_API_KEY);
      return new Response(JSON.stringify(verdict), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let prompt: string | undefined = PROMPTS[action];
    if (action === "outfit-swatch") {
      const desc = OUTFIT_VARIANTS[outfitter?.variant ?? ""] ?? "";
      prompt = [
        "Studio product photo of a men's outfit displayed on an invisible mannequin (ghost mannequin effect), full outfit visible head-to-toe, centered, on a clean neutral light-beige seamless background with soft professional studio lighting and a subtle shadow.",
        "No human face, no person, no text, no watermark. E-commerce lookbook quality, ultra sharp fabric texture.",
        `Outfit to display: ${desc.replace(/^Replace clothing with /i, "")}`,
      ].join(" ");
    }
    if (action === "anime-scene-swap") {
      prompt = [
        "You are given TWO images. The FIRST image is the reference artwork/scene. The SECOND image is a real photo of a person.",
        "Task: replace the specified character inside the FIRST image with the person from the SECOND image, keeping that character's exact pose, outfit, scale, camera angle, lighting and position in the composition.",
        sceneSwap?.targetHint
          ? `Target character to replace: ${sceneSwap.targetHint}.`
          : "Target character to replace: the main/most prominent character in the scene.",
        sceneSwap?.characterName ? `The user wants to become the character known as: ${sceneSwap.characterName}.` : "",
        "CRITICAL: preserve the real person's exact facial identity, facial proportions, skin tone and hairline — only restyle them into the artwork's rendering style. No identity drift, no generic anime face.",
        "Keep every other character and every background element of the FIRST image pixel-identical.",
        "STRICT ANATOMY: one head, two arms, two hands with five fingers each, two legs. No extra limbs, no duplicated faces, no warped features.",
        "Blend lighting, shading, color grading and line weight so the replacement looks natively drawn in the original artwork.",
      ].filter(Boolean).join(" ");
    }
    if (action === "anime-studio") {
      prompt = buildAnimePrompt(anime ?? {});
    }
    if (action === "outfitter-studio") {
      prompt = buildOutfitterPrompt(outfitter ?? {});
    }
    if (!prompt) {
      return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const toDataUrl = (s: string) =>
      s.startsWith("data:") ? s : `data:image/png;base64,${s}`;
    const content: Array<Record<string, unknown>> = [{ type: "text", text: prompt }];
    for (const img of imageList) {
      content.push({ type: "image_url", image_url: { url: toDataUrl(img) } });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          error: "AI credits exhausted. Please add credits in Lovable workspace settings.",
          code: "AI_CREDITS_EXHAUSTED",
          recoverable: true,
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Photo edit failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const imageUrl: string | undefined =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image returned:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("photo-edit error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
