// v2 additions: extra strings, reply phrases, help wizard, listen dictionary, tips
Object.assign(S, {
  help_btn: ['I need help', 'मलाई मद्दत चाहियो', '助けが必要です', 'たすけが ひつよう です'],
  help_q: ['What happened?', 'के भयो?', 'どうしましたか？', 'どう しましたか？'],
  h_lost: ['I am lost', 'म हराएँ', '道に迷った', 'みちに まよった'],
  h_sick: ['Sick or injured', 'बिरामी वा घाइते', '具合が悪い・けが', 'ぐあいが わるい・けが'],
  h_stolen: ['Stolen / lost something', 'चोरी भयो / सामान हरायो', '盗まれた・なくした', 'ぬすまれた・なくした'],
  h_accident: ['Accident / danger', 'दुर्घटना / खतरा', '事故・危険', 'じこ・きけん'],
  h_nocomm: ["I can't communicate", 'कुरा गर्न सक्दिनँ', '話が通じない', 'はなしが つうじない'],
  step_phr: ['Show this to people nearby', 'नजिकका मानिसलाई यो देखाउनुहोस्', '近くの人に見せる', 'ちかくの ひとに みせる'],
  step_near: ['Nearest help', 'नजिकको सहायता', '近くの助け', 'ちかくの たすけ'],
  near_you: ['Near you', 'तपाईंको नजिक', '近くにあるもの', 'ちかくに あるもの'],
  near_sub: ['Live from your location', 'तपाईंको स्थानबाट', '現在地から', 'いまの ばしょから'],
  allow_loc: ['Allow location', 'स्थान अनुमति दिनुहोस्', '位置情報を許可', 'いちじょうほうを きょか'],
  using_sample: ['Using sample location (Shinjuku). Allow location for real results.', 'नमूना स्थान (शिन्जुकु) प्रयोग भइरहेको छ। वास्तविक नतिजाका लागि स्थान अनुमति दिनुहोस्।', 'サンプルの場所（新宿）を使用中。位置情報を許可すると実際の結果が出ます。', 'さんぷるの ばしょ（しんじゅく）を つかって います。いちじょうほうを きょかすると ほんとうの けっかが でます。'],
  loc_ok: ['Live location on', 'लाइभ स्थान चालु', '現在地を使用中', 'いまの ばしょを つかって います'],
  sights_near: ['Sights near you', 'तपाईंको नजिकका पर्यटन स्थल', '近くの観光地', 'ちかくの かんこうち'],
  you_near: ['You are near', 'तपाईं नजिक हुनुहुन्छ', '現在地付近', 'いまの ちかく'],
  add_bin: ['There is a trash bin here', 'यहाँ डस्टबिन छ', 'ここにゴミ箱があります', 'ここに ごみばこが あります'],
  bin_added: ['Thanks! Saved on this device.', 'धन्यवाद! यो उपकरणमा सुरक्षित भयो।', 'ありがとう！この端末に保存しました。', 'ありがとう！この たんまつに ほぞん しました。'],
  listen: ['Listen', 'सुन्नुहोस्', '聞き取り', 'ききとり'],
  listen_sub: ['Turn speech into text', 'बोली लेखमा', '相手の言葉を文字に', 'あいての ことばを もじに'],
  tap_speak: ['Tap, then let them speak Japanese', 'थिच्नुहोस्, अनि उहाँलाई जापानी बोल्न लगाउनुहोस्', 'ボタンを押して、相手に話してもらう', 'ぼたんを おして、あいてに はなして もらう'],
  heard: ['Heard', 'सुनियो', '聞こえた言葉', 'きこえた ことば'],
  no_match: ['Not in my small word list. Ask them to use gestures or write it down.', 'मेरो सानो सूचीमा छैन। इशारा वा लेखेर देखाउन भन्नुहोस्।', '小さな辞書にありません。身ぶりや筆談をお願いしましょう。', 'ちいさな じしょに ありません。みぶりや ひつだんを おねがい しましょう。'],
  listen_note: ['Needs Chrome/Edge and internet. Meanings come from a small built-in list (demo).', 'Chrome/Edge र इन्टरनेट चाहिन्छ। अर्थ सानो बिल्ट-इन सूचीबाट (डेमो)।', 'ChromeかEdgeとネットが必要。意味は小さな内蔵リスト（デモ）。', 'Chromeか Edgeと ねっとが ひつよう。いみは ちいさな ないぞうの りすと（でも）。'],
  listen_nosup: ['Voice input is not supported in this browser.', 'यो ब्राउजरमा आवाज इनपुट समर्थित छैन।', 'このブラウザは音声入力に対応していません。', 'この ぶらうざは おんせいにゅうりょくに たいおう して いません。'],
  mic_denied: ['Microphone not allowed or no speech heard. Try again.', 'माइक्रोफोन अनुमति छैन वा केही सुनिएन। फेरि प्रयास गर्नुहोस्।', 'マイクが使えないか、声が聞こえませんでした。もう一度。', 'まいくが つかえないか、こえが きこえません でした。もういちど。'],
  listening: ['Listening…', 'सुन्दै…', '聞いています…', 'きいて います…'],
  tips: ['Japan tips', 'जापान सुझाव', '日本のマナー', 'にほんの まなー'],
  tips_sub: ['Manners · money · trains', 'शिष्टाचार · पैसा · रेल', 'マナー・お金・電車', 'まなー・おかね・でんしゃ'],
  cat_answer: ['Replies', 'जवाफ', '返事', 'へんじ'],
  offline_ok: ['Works offline', 'अफलाइन पनि चल्छ', 'オフラインでも使えます', 'おふらいんでも つかえます'],
  recenter: ['My location', 'मेरो स्थान', '現在地', 'いまの ばしょ'],
  help_sub: ['Tap if something is wrong', 'केही समस्या भए थिच्नुहोस्', 'こまったときはここ', 'こまった ときは ここ'],
  from_osm: ['Trash bins: OpenStreetMap + pins from travellers', 'डस्टबिन: OpenStreetMap + यात्रुका पिन', 'ゴミ箱：OpenStreetMapと旅行者のピン', 'ごみばこ：OpenStreetMapと りょこうしゃの ぴん'],
});

PHRASES.push(
  { id: 'yes', cat: 'answer', en: 'Yes', np: 'हो', ja: 'はい', hi: 'はい', ro: 'hai' },
  { id: 'no', cat: 'answer', en: 'No', np: 'होइन', ja: 'いいえ', hi: 'いいえ', ro: 'iie' },
  { id: 'wait', cat: 'answer', en: 'Please wait a moment', np: 'कृपया एकछिन पर्खनुहोस्', ja: '少し待ってください', hi: 'すこし まって ください', ro: 'sukoshi matte kudasai' },
  { id: 'again', cat: 'answer', en: 'Once more, please', np: 'कृपया फेरि भन्नुहोस्', ja: 'もう一度お願いします', hi: 'もういちど おねがいします', ro: 'mou ichido onegai shimasu' },
  { id: 'dontknow', cat: 'answer', en: "I don't understand", np: 'मैले बुझिनँ', ja: 'わかりません', hi: 'わかりません', ro: 'wakarimasen' },
  { id: 'write', cat: 'answer', en: 'Please write it down', np: 'कृपया लेखिदिनुहोस्', ja: '書いてください', hi: 'かいて ください', ro: 'kaite kudasai' },
  { id: 'left', cat: 'answer', en: 'Left', np: 'बायाँ', ja: '左', hi: 'ひだり', ro: 'hidari' },
  { id: 'right', cat: 'answer', en: 'Right', np: 'दायाँ', ja: '右', hi: 'みぎ', ro: 'migi' },
  { id: 'straight', cat: 'answer', en: 'Straight', np: 'सिधा', ja: 'まっすぐ', hi: 'まっすぐ', ro: 'massugu' },
);

// Help wizard: phrases to show, nearest POI type, numbers to call
const HELP = [
  { id: 'lost', ic: '🧭', phrases: ['lost', 'station', 'english'], poi: 'police', tels: [] },
  { id: 'sick', ic: '🤒', phrases: ['sick', 'hospital', 'ambulance'], poi: 'hospital', tels: ['119'] },
  { id: 'stolen', ic: '👜', phrases: ['stolen', 'passport', 'police'], poi: 'police', tels: ['110'] },
  { id: 'accident', ic: '🚨', phrases: ['help', 'ambulance', 'police'], poi: 'hospital', tels: ['119', '110'] },
  { id: 'nocomm', ic: '🗣️', phrases: ['english', 'slowly', 'write'], poi: null, tels: ['05038162787'], listen: true },
];

// What staff might say to you (Listen screen). n = [en, np, ja, hi]
const LISTEN_DICT = [
  { ja: 'どうしましたか', hi: 'どうしましたか', n: ['What is wrong?', 'के भयो?', 'どうしましたか', 'どうしましたか'] },
  { ja: '大丈夫ですか', hi: 'だいじょうぶですか', n: ['Are you okay?', 'तपाईं ठीक हुनुहुन्छ?', '大丈夫ですか', 'だいじょうぶですか'] },
  { ja: '少々お待ちください', hi: 'しょうしょうおまちください', n: ['Please wait a moment', 'कृपया एकछिन पर्खनुहोस्', '少し待ってください', 'すこし まって ください'] },
  { ja: 'パスポートを見せてください', hi: 'ぱすぽーとをみせてください', n: ['Please show your passport', 'कृपया राहदानी देखाउनुहोस्', 'パスポートを見せてください', 'ぱすぽーとを みせて ください'] },
  { ja: 'こちらへどうぞ', hi: 'こちらへどうぞ', n: ['This way, please', 'कृपया यता आउनुहोस्', 'こちらへどうぞ', 'こちらへ どうぞ'] },
  { ja: '右です', hi: 'みぎです', n: ['It is on the right', 'दायाँ तिर छ', '右です', 'みぎです'] },
  { ja: '左です', hi: 'ひだりです', n: ['It is on the left', 'बायाँ तिर छ', '左です', 'ひだりです'] },
  { ja: 'まっすぐです', hi: 'まっすぐです', n: ['Go straight', 'सिधा जानुहोस्', 'まっすぐです', 'まっすぐです'] },
  { ja: 'いらっしゃいませ', hi: 'いらっしゃいませ', n: ['Welcome', 'स्वागत छ', 'いらっしゃいませ', 'いらっしゃいませ'] },
  { ja: '現金のみです', hi: 'げんきんのみです', n: ['Cash only', 'नगद मात्र', '現金のみです', 'げんきんのみです'] },
  { ja: 'カードは使えません', hi: 'かーどはつかえません', n: ['Cards are not accepted', 'कार्ड चल्दैन', 'カードは使えません', 'かーどは つかえません'] },
  { ja: 'いくつですか', hi: 'いくつですか', n: ['How many?', 'कति वटा?', 'いくつですか', 'いくつですか'] },
  { ja: 'ここに書いてください', hi: 'ここにかいてください', n: ['Please write here', 'कृपया यहाँ लेख्नुहोस्', 'ここに書いてください', 'ここに かいて ください'] },
  { ja: '警察を呼びます', hi: 'けいさつをよびます', n: ['I will call the police', 'म प्रहरी बोलाउँछु', '警察を呼びます', 'けいさつを よびます'] },
  { ja: '救急車を呼びます', hi: 'きゅうきゅうしゃをよびます', n: ['I will call an ambulance', 'म एम्बुलेन्स बोलाउँछु', '救急車を呼びます', 'きゅうきゅうしゃを よびます'] },
  { ja: '駅はあちらです', hi: 'えきはあちらです', n: ['The station is over there', 'स्टेशन उता छ', '駅はあちらです', 'えきは あちらです'] },
];

// [icon, [en, np, ja, hi]]
const TIPS = [
  ['💴', ['Carry some cash — many small shops and temples are cash only.', 'केही नगद राख्नुहोस् — धेरै साना पसल र मन्दिरमा नगद मात्र चल्छ।', '現金を少し持ち歩こう。小さなお店やお寺は現金のみが多い。', 'げんきんを すこし もちあるこう。ちいさな おみせや おてらは げんきんのみが おおい。']],
  ['🗑️', ['Trash bins are rare. Carry a small bag and bin things at konbini or stations.', 'डस्टबिन कम हुन्छन्। सानो झोला राख्नुहोस्।', 'ゴミ箱は少ない。小さい袋を持ち、コンビニや駅で捨てよう。', 'ごみばこは すくない。ちいさい ふくろを もち、こんびにや えきで すてよう。']],
  ['🚃', ['Be quiet on trains and avoid phone calls.', 'रेलमा शान्त रहनुहोस् र फोनमा कुरा नगर्नुहोस्।', '電車の中では静かに。電話は控えよう。', 'でんしゃの なかでは しずかに。でんわは ひかえよう。']],
  ['🎫', ['Get an IC card (Suica / Pasmo) for trains and buses.', 'रेल र बसका लागि IC कार्ड (Suica / Pasmo) लिनुहोस्।', '電車やバスにはICカード（Suica・Pasmo）が便利。', 'でんしゃや ばすには ICかーど（Suica・Pasmo）が べんり。']],
  ['👟', ['Take your shoes off where there is a step at the entrance (genkan).', 'प्रवेशद्वारमा खुट्किलो (गेन्कान) भए जुत्ता खोल्नुहोस्।', '玄関に段差があるところでは靴をぬごう。', 'げんかんに だんさが ある ところでは くつを ぬごう。']],
  ['🙏', ['No tipping in Japan. A polite "arigatou" is enough.', 'जापानमा टिप दिइँदैन। "अरिगातो" भन्नु नै पर्याप्त छ।', 'チップは不要。「ありがとう」でOK。', 'ちっぷは ふよう。「ありがとう」で OK。']],
  ['⛩️', ['At shrines and temples: bow lightly, stay quiet, follow photo rules.', 'मन्दिरमा: सानो झुक्नुहोस्, शान्त रहनुहोस्, फोटो नियम मान्नुहोस्।', '神社・お寺では軽くおじぎ、静かに、撮影ルールを守ろう。', 'じんじゃ・おてらでは かるく おじぎ、しずかに、さつえいの るーるを まもろう。']],
  ['🌏', ['Earthquake? Stay calm and follow staff instructions. Keep your phone charged.', 'भूकम्प आए शान्त रहनुहोस् र कर्मचारीको निर्देशन मान्नुहोस्। फोन चार्ज राख्नुहोस्।', '地震のときは落ち着いて、係員の指示に従う。スマホは充電しておこう。', 'じしんの ときは おちついて、かかりいんの しじに したがう。すまほは じゅうでん して おこう。']],
];
