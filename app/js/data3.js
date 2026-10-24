// v3 additions: more place types (charging, rental, lockers, diet shops), allergy profile, search/section strings
Object.assign(S, {
  g_safety: ['Safety', 'सुरक्षा', '安全', 'あんぜん'],
  g_daily: ['Daily', 'दैनिक', '日常', 'にちじょう'],
  g_travel: ['Travel', 'यात्रा', '旅行', 'りょこう'],
  g_food: ['Diet food', 'आहार अनुसार खाना', '食事', 'しょくじ'],
  c_pharmacy: ['Pharmacy', 'औषधि पसल', '薬局', 'やっきょく'],
  c_exchange: ['Money exchange', 'मुद्रा साटासाट', '両替', 'りょうがえ'],
  c_charge: ['Phone charging', 'फोन चार्ज', '充電スポット', 'じゅうでん すぽっと'],
  c_rental: ['Bike / rental', 'बाइक / भाडामा', 'レンタル', 'れんたる'],
  c_locker: ['Coin lockers', 'कोइन लकर', 'コインロッカー', 'こいん ろっかー'],
  c_veg: ['Vegetarian', 'शाकाहारी', 'ベジタリアン', 'さいしょく'],
  c_halal: ['Halal', 'हलाल', 'ハラール', 'はらーる'],
  c_gf: ['Gluten-free', 'ग्लुटेन-मुक्त', 'グルテンフリー', 'ぐるてんふりー'],
  a_crab: ['crab', 'केकडा', 'かに', 'かに'],
  a_peanut: ['peanut', 'बदाम (मूँगफली)', '落花生', 'らっかせい'],
  a_buckwheat: ['buckwheat', 'फापर', 'そば', 'そば'],
  profile: ['My allergies', 'मेरो एलर्जी', 'アレルギー設定', 'あれるぎー せってい'],
  profile_sub: ['Allergy card & safe menu', 'एलर्जी कार्ड र सुरक्षित मेनु', 'アレルギーカード', 'あれるぎー かーど'],
  my_allergies: ['I am allergic to', 'मलाई एलर्जी छ', '食べられないもの', 'たべられない もの'],
  my_diet: ['My diet', 'मेरो आहार', '食事のきまり', 'しょくじの きまり'],
  allergy_card: ['Show allergy card', 'एलर्जी कार्ड देखाउनुहोस्', 'アレルギーカードを見せる', 'あれるぎー かーどを みせる'],
  allergy_none: ['Choose at least one allergen first.', 'पहिले कम्तीमा एउटा छान्नुहोस्।', 'まず1つ以上えらんでください。', 'まず 1つ いじょう えらんで ください。'],
  you_allergic: ['Contains YOUR allergen', 'तपाईंको एलर्जी भएको सामग्री', 'あなたのアレルゲンを含む', 'あなたの あれるげんを ふくむ'],
  f_safe: ['Safe for me', 'मेरो लागि सुरक्षित', '私に安全', 'わたしに あんぜん'],
  set_profile: ['Set my allergies', 'मेरो एलर्जी राख्नुहोस्', 'アレルギーを設定', 'あれるぎーを せってい'],
  saved_auto: ['Saved automatically on this device.', 'यो उपकरणमा स्वतः सुरक्षित हुन्छ।', 'この端末に自動で保存されます。', 'この たんまつに じどうで ほぞん されます。'],
  diet_note: ['Google has no allergen data for shops. These searches find vegetarian, halal or gluten-free places. Always confirm with staff.', 'गुगलसँग पसलको एलर्जी डाटा हुँदैन। यी खोजीले शाकाहारी, हलाल वा ग्लुटेन-मुक्त ठाउँ देखाउँछन्। कर्मचारीसँग पुष्टि गर्नुहोस्।', 'Googleにはお店のアレルギー情報がありません。ベジタリアン・ハラール・グルテンフリーのお店を探します。必ず店員さんに確認してください。', 'ぐーぐるには おみせの あれるぎー じょうほうが ありません。さいしょく・はらーる・ぐるてんふりーの おみせを さがします。かならず てんいんに かくにん して ください。'],
  search_all: ['Search places, phrases, help…', 'ठाउँ, वाक्य, मद्दत खोज्नुहोस्…', '場所・フレーズ・助けを検索…', 'ばしょ・ふれーず・たすけを さがす…'],
  no_results: ['No results', 'नतिजा भेटिएन', '見つかりません', 'みつかりません'],
  sec_around: ['Around me', 'मेरो वरिपरि', '近くを探す', 'ちかくを さがす'],
  sec_talk: ['Talk & eat', 'कुरा र खाना', '話す・食べる', 'はなす・たべる'],
  sec_plan: ['Plan & move', 'योजना र यात्रा', '計画・移動', 'けいかく・いどう'],
  sec_help: ['Help', 'मद्दत', '助け', 'たすけ'],
  delete: ['Delete', 'हटाउनुहोस्', '削除', 'さくじょ'],
  deleted: ['Deleted', 'हटाइयो', '削除しました', 'さくじょ しました'],
  more_cats: ['More places', 'थप ठाउँ', 'もっと見る', 'もっと みる'],
  theme: ['Theme', 'थिम', 'テーマ', 'てーま'],
  map_btn: ['Map', 'नक्सा', '地図', 'ちず'],
});

// Place search config: type = Places "primary type", text = text search. q = Google Maps web search fallback
Object.assign(PLACE_TYPES, {
  police: { type: 'police', icon: '🚓', q: 'police station' },
  hospital: { type: 'hospital', icon: '🏥', q: 'hospital' },
  pharmacy: { type: 'pharmacy', icon: '💊', q: 'pharmacy' },
  shop: { type: 'convenience_store', icon: '🏪', q: 'convenience store' },
  toilet: { type: 'public_bathroom', icon: '🚻', q: 'public toilet' },
  atm: { type: 'atm', icon: '🏧', q: 'ATM' },
  exchange: { text: 'currency exchange', icon: '💱', q: 'currency exchange' },
  trash: { icon: '🗑️', q: 'trash can' },
  charge: { text: 'ChargeSPOT', icon: '🔌', q: 'ChargeSPOT phone charger' },
  rental: { text: 'bicycle rental', icon: '🚲', q: 'bike rental' },
  locker: { text: 'coin lockers', icon: '🧳', q: 'coin lockers' },
  veg: { type: 'vegetarian_restaurant', icon: '🥗', q: 'vegetarian restaurant' },
  halal: { text: 'halal restaurant', icon: '🥙', q: 'halal restaurant' },
  gf: { text: 'gluten free restaurant', icon: '🌾', q: 'gluten free restaurant' },
});
const GROUPS = { safety: ['police', 'hospital', 'pharmacy'], daily: ['shop', 'toilet', 'atm', 'exchange', 'trash'], travel: ['charge', 'rental', 'locker'], food: ['veg', 'halal', 'gf'] };

POI.push(
  { type: 'pharmacy', en: 'Pharmacy (Shinjuku)', ja: '薬局（新宿）', hi: 'やっきょく（しんじゅく）', lat: 35.691, lng: 139.702 },
  { type: 'exchange', en: 'Currency exchange (Shinjuku)', ja: '両替所（新宿）', hi: 'りょうがえじょ（しんじゅく）', lat: 35.6921, lng: 139.7022 },
  { type: 'charge', en: 'Phone charging spot (Shinjuku Station)', ja: '充電スポット（新宿駅）', hi: 'じゅうでん すぽっと（しんじゅくえき）', lat: 35.6905, lng: 139.7007 },
  { type: 'rental', en: 'Bike rental (Asakusa)', ja: 'レンタサイクル（浅草）', hi: 'れんたさいくる（あさくさ）', lat: 35.7123, lng: 139.7955 },
  { type: 'locker', en: 'Coin lockers (Shinjuku Station)', ja: 'コインロッカー（新宿駅）', hi: 'こいんろっかー（しんじゅくえき）', lat: 35.6898, lng: 139.7 },
  { type: 'veg', en: 'Vegetarian cafe (sample)', ja: 'ベジタリアンカフェ（サンプル）', hi: 'さいしょく かふぇ（さんぷる）', lat: 35.6942, lng: 139.7031 },
  { type: 'halal', en: 'Halal restaurant (sample)', ja: 'ハラールレストラン（サンプル）', hi: 'はらーる れすとらん（さんぷる）', lat: 35.7013, lng: 139.7 },
  { type: 'gf', en: 'Gluten-free cafe (sample)', ja: 'グルテンフリーカフェ（サンプル）', hi: 'ぐるてんふりー かふぇ（さんぷる）', lat: 35.6874, lng: 139.6985 },
);

// Allergens (Japan labels 7 mandatory: egg, milk, wheat, buckwheat, peanut, shrimp, crab) + common extras
const ALLERGENS = ['egg', 'milk', 'wheat', 'buckwheat', 'peanut', 'shrimp', 'crab', 'fish', 'soy', 'sesame', 'pork', 'beef', 'chicken', 'alcohol'];
const ALLERGEN_JA = {
  egg: ['卵', 'たまご'], milk: ['乳', 'ぎゅうにゅう'], wheat: ['小麦', 'こむぎ'], buckwheat: ['そば', 'そば'], peanut: ['落花生（ピーナッツ）', 'らっかせい（ぴーなっつ）'],
  shrimp: ['えび', 'えび'], crab: ['かに', 'かに'], fish: ['魚', 'さかな'], soy: ['大豆', 'だいず'], sesame: ['ごま', 'ごま'],
  pork: ['豚肉', 'ぶたにく'], beef: ['牛肉', 'ぎゅうにく'], chicken: ['鶏肉', 'とりにく'], alcohol: ['お酒', 'おさけ'],
};
DISHES.soba = { ja: 'ざるそば', hi: 'ざるそば', n: ['Cold soba (buckwheat noodles)', 'चिसो सोबा (फापरको नुडल्स)'], price: 800, al: ['buckwheat', 'wheat', 'soy'] };
MENUS[1].items.push('soba');

const FEATURES = [['help', 'help_btn'], ['map', 'map'], ['phrases', 'phrases'], ['chat', 'ai'], ['sos', 'sos'], ['menu', 'menu'], ['profile', 'profile'], ['listen', 'listen'], ['wait', 'wait'], ['plan', 'plan'], ['fare', 'fare'], ['tips', 'tips'], ['nearby', 'near_you']];
