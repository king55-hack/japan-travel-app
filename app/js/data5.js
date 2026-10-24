// v5: romaji address, hotels and stations, reservations, sight details
Object.assign(S, {
  say_romaji: ['Say it like this (romaji)', 'यसरी भन्नुहोस् (रोमाजी)', 'ローマ字で読む', 'ろーまじで よむ'],
  c_station: ['Station', 'स्टेशन', '駅', 'えき'],
  c_hotel: ['Hotel', 'होटल', 'ホテル', 'ほてる'],
  book: ['Reservations', 'आरक्षण', '予約', 'よやく'],
  book_sub: ['Plan, remind, phone script', 'योजना, रिमाइन्डर, फोन स्क्रिप्ट', '予定・リマインド・電話', 'よてい・りまいんど・でんわ'],
  bk_new: ['New reservation', 'नयाँ आरक्षण', '新しい予約', 'あたらしい よやく'],
  bk_place: ['Place or restaurant', 'ठाउँ वा रेस्टुरेन्ट', '場所・お店', 'ばしょ・おみせ'],
  bk_date: ['Date', 'मिति', '日付', 'ひづけ'],
  bk_time: ['Time', 'समय', '時間', 'じかん'],
  bk_people: ['People', 'मानिस', '人数', 'にんずう'],
  bk_name: ['Name (English letters)', 'नाम (अंग्रेजी अक्षर)', 'お名前（ローマ字）', 'おなまえ（ろーまじ）'],
  bk_note: ['Note (allergy is added for you)', 'टिप्पणी (एलर्जी आफैं थपिन्छ)', 'メモ（アレルギーは自動で入ります）', 'めも（あれるぎーは じどうで はいります）'],
  bk_status: ['Status', 'स्थिति', '状態', 'じょうたい'],
  st_planned: ['Planned', 'योजना', '予定', 'よてい'],
  st_requested: ['Requested', 'अनुरोध गरियो', '申込み済み', 'もうしこみずみ'],
  st_confirmed: ['Confirmed', 'पुष्टि भयो', '確定', 'かくてい'],
  bk_conf: ['Confirmation no.', 'पुष्टि नम्बर', '予約番号', 'よやく ばんごう'],
  bk_save: ['Save', 'सुरक्षित गर्नुहोस्', '保存', 'ほぞん'],
  bk_site: ['Official site', 'आधिकारिक साइट', '公式サイト', 'こうしき さいと'],
  bk_search: ['Find booking options', 'बुकिङ विकल्प खोज्नुहोस्', '予約方法を探す', 'よやく ほうほうを さがす'],
  bk_ics: ['Add to calendar', 'क्यालेन्डरमा थप्नुहोस्', 'カレンダーに追加', 'かれんだーに ついか'],
  bk_show: ['Show to staff', 'कर्मचारीलाई देखाउनुहोस्', 'スタッフに見せる', 'すたっふに みせる'],
  bk_phone: ['Phone script', 'फोन स्क्रिप्ट', '電話の言い方', 'でんわの いいかた'],
  bk_empty: ['No reservations yet.', 'अहिलेसम्म आरक्षण छैन।', 'まだ予約はありません。', 'まだ よやくは ありません。'],
  bk_need: ['Enter a place and a date.', 'ठाउँ र मिति राख्नुहोस्।', '場所と日付を入れてください。', 'ばしょと ひづけを いれて ください。'],
  tb_book: ['Saves your plan only – book on the official site or by phone', 'योजना मात्र सुरक्षित गर्छ – आधिकारिक साइट वा फोनबाट बुक गर्नुहोस्', '予定の保存のみ・予約は公式サイトか電話で', 'よていの ほぞんだけ・よやくは こうしき さいとか でんわで'],
  bk_note_real: ['This app does not make the booking for you. Use the official site or call, then paste the confirmation number here.', 'यो एपले बुकिङ गर्दैन। आधिकारिक साइट वा फोन प्रयोग गरेर पुष्टि नम्बर यहाँ राख्नुहोस्।', 'このアプリは予約を代わりにしません。公式サイトか電話で予約し、予約番号をここに保存してください。', 'この あぷりは よやくを かわりに しません。こうしき さいとか でんわで よやくし、よやく ばんごうを ここに ほぞん して ください。'],
  sp_hours: ['Hours (approx.)', 'खुल्ने समय (अनुमान)', '営業時間（目安）', 'えいぎょう じかん（めやす）'],
  sp_access: ['How to get there', 'कसरी पुग्ने', '行き方', 'いきかた'],
  sp_fee: ['Entry', 'प्रवेश', '入場', 'にゅうじょう'],
  sp_tip: ['Tip', 'सुझाव', 'ヒント', 'ひんと'],
  sp_reserve: ['Reservation', 'आरक्षण', '予約', 'よやく'],
  rs_req: ['Required', 'आवश्यक', '必要', 'ひつよう'],
  rs_rec: ['Recommended', 'सिफारिस गरिएको', 'おすすめ', 'おすすめ'],
  rs_none: ['Not needed', 'आवश्यक छैन', '不要', 'ふよう'],
  sp_verify: ['Hours and prices change. Check the official site before you go.', 'समय र मूल्य फेरिन सक्छ। जानु अघि आधिकारिक साइट हेर्नुहोस्।', '時間や料金は変わります。行く前に公式サイトで確認してください。', 'じかんや りょうきんは かわります。いく まえに こうしき さいとで かくにん して ください。'],
  sp_book: ['Reserve / plan a visit', 'आरक्षण / भ्रमण योजना', '予約・訪問を計画', 'よやく・ほうもんを けいかく'],
  sp_dir: ['Directions', 'बाटो', '道案内', 'みちあんない'],
  sp_crowd: ['Crowd estimate', 'भीडको अनुमान', '混雑の目安', 'こんざつの めやす'],
  free_entry: ['Free', 'निःशुल्क', '無料', 'むりょう'],
});

Object.assign(PLACE_TYPES, {
  station: { types: ['train_station', 'subway_station'], icon: '🚉', q: 'train station' },
  hotel: { types: ['hotel', 'hostel', 'guest_house'], icon: '🏨', q: 'hotel' },
});
GROUPS.travel = ['station', 'hotel', 'charge', 'rental', 'locker'];
POI.push(
  { type: 'station', en: 'Shinjuku Station', ja: '新宿駅', hi: 'しんじゅくえき', lat: 35.6896, lng: 139.7006 },
  { type: 'station', en: 'Shibuya Station', ja: '渋谷駅', hi: 'しぶやえき', lat: 35.658, lng: 139.7016 },
  { type: 'station', en: 'Tokyo Station', ja: '東京駅', hi: 'とうきょうえき', lat: 35.6812, lng: 139.7671 },
  { type: 'station', en: 'Ueno Station', ja: '上野駅', hi: 'うえのえき', lat: 35.7141, lng: 139.7774 },
  { type: 'station', en: 'Asakusa Station', ja: '浅草駅', hi: 'あさくさえき', lat: 35.7119, lng: 139.7976 },
  { type: 'hotel', en: 'Hotel (Shinjuku, sample)', ja: 'ホテル（新宿・サンプル）', hi: 'ほてる（しんじゅく・さんぷる）', lat: 35.6938, lng: 139.7034 },
  { type: 'hotel', en: 'Hostel (Asakusa, sample)', ja: 'ホステル（浅草・サンプル）', hi: 'ほすてる（あさくさ・さんぷる）', lat: 35.7128, lng: 139.7939 },
);

const PREF_EN = ['Hokkaido', 'Aomori-ken', 'Iwate-ken', 'Miyagi-ken', 'Akita-ken', 'Yamagata-ken', 'Fukushima-ken', 'Ibaraki-ken', 'Tochigi-ken', 'Gunma-ken', 'Saitama-ken', 'Chiba-ken', 'Tokyo-to', 'Kanagawa-ken', 'Niigata-ken', 'Toyama-ken', 'Ishikawa-ken', 'Fukui-ken', 'Yamanashi-ken', 'Nagano-ken', 'Gifu-ken', 'Shizuoka-ken', 'Aichi-ken', 'Mie-ken', 'Shiga-ken', 'Kyoto-fu', 'Osaka-fu', 'Hyogo-ken', 'Nara-ken', 'Wakayama-ken', 'Tottori-ken', 'Shimane-ken', 'Okayama-ken', 'Hiroshima-ken', 'Yamaguchi-ken', 'Tokushima-ken', 'Kagawa-ken', 'Ehime-ken', 'Kochi-ken', 'Fukuoka-ken', 'Saga-ken', 'Nagasaki-ken', 'Kumamoto-ken', 'Oita-ken', 'Miyazaki-ken', 'Kagoshima-ken', 'Okinawa-ken'];

// Spoken Japanese helpers for the reservation phone script
const RO_MONTH = ['', 'ichi', 'ni', 'san', 'shi', 'go', 'roku', 'shichi', 'hachi', 'ku', 'juu', 'juu-ichi', 'juu-ni'];
const RO_NUM = ['zero', 'ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyuu', 'juu', 'juu-ichi', 'juu-ni', 'juu-san', 'juu-yon', 'juu-go', 'juu-roku', 'juu-shichi', 'juu-hachi', 'juu-kyuu', 'ni-juu', 'ni-juu-ichi', 'ni-juu-ni', 'ni-juu-san', 'ni-juu-yon'];
const RO_DAY = { 1: 'tsuitachi', 2: 'futsuka', 3: 'mikka', 4: 'yokka', 5: 'itsuka', 6: 'muika', 7: 'nanoka', 8: 'youka', 9: 'kokonoka', 10: 'tooka', 14: 'juu-yokka', 20: 'hatsuka', 24: 'ni-juu-yokka' };
const RO_PEOPLE = ['', 'hitori', 'futari', 'san-nin', 'yo-nin', 'go-nin', 'roku-nin', 'shichi-nin', 'hachi-nin', 'kyuu-nin', 'juu-nin'];
const RO_HOUR = { 4: 'yo-ji', 7: 'shichi-ji', 9: 'ku-ji' };
function roDay(d) { if (RO_DAY[d]) return RO_DAY[d]; const t = Math.floor(d / 10), o = d % 10; return `${t > 1 ? RO_NUM[t] + '-' : ''}${t ? 'juu' : ''}${o ? '-' + RO_NUM[o] : ''}-nichi`.replace(/^-/, ''); }
const roHour = h => RO_HOUR[h] || `${RO_NUM[h]}-ji`;

// Details for sights. h = hours (approx.), ac = [en, ja, hi] how to get there, t = tip [en, np, ja, hi], rs = reservation (none/rec/req), site = official site
const DETAILS = {
  sensoji: { h: 'Grounds always open · Main hall 6:00–17:00', ac: ['Asakusa Station (Ginza, Asakusa lines), 5 min walk', '浅草駅（銀座線・浅草線）から徒歩5分', 'あさくさえき（ぎんざせん・あさくさせん）から あるいて 5ふん'], t: ['Come before 9:00 for fewer people. Nakamise shops open about 10:00.', 'कम भीडका लागि बिहान ९ बजे अघि जानुहोस्। नाकामिसे पसल करिब १० बजे खुल्छ।', '9時前だと空いています。仲見世のお店は10時ごろ開きます。', '9じまえだと すいて います。なかみせの おみせは 10じごろ あきます。'], rs: 'none', site: 'https://www.senso-ji.jp/english/' },
  meiji: { h: 'Sunrise to sunset', ac: ['Harajuku Station (JR) or Meiji-jingumae Station, 3 min walk', '原宿駅（JR）・明治神宮前駅から徒歩3分', 'はらじゅくえき・めいじじんぐうまええきから あるいて 3ふん'], t: ['The walk from the gate to the shrine takes about 10 minutes. Be quiet inside.', 'गेटबाट मन्दिरसम्म हिँड्न करिब १० मिनेट लाग्छ। भित्र शान्त रहनुहोस्।', '入口から本殿まで歩いて約10分。中では静かに。', 'いりぐちから ほんでんまで あるいて やく 10ぷん。なかでは しずかに。'], rs: 'none', site: 'https://www.meijijingu.or.jp/en/' },
  shibuya: { h: 'Crossing: always · Shibuya Sky deck: about 10:00–22:30', ac: ['Shibuya Station, Hachiko exit, 1 min walk', '渋谷駅ハチ公口からすぐ', 'しぶやえき はちこうぐちから すぐ'], t: ['For the Shibuya Sky deck, book a time slot online. Sunset slots sell out first.', 'शिबुया स्काई डेकका लागि अनलाइन समय बुक गर्नुहोस्। सूर्यास्तको समय पहिले सकिन्छ।', '渋谷スカイは時間を決めてネット予約がおすすめ。夕方は早く売り切れます。', 'しぶや すかいは じかんを きめて ねっとで よやくが おすすめ。ゆうがたは はやく うりきれます。'], rs: 'rec', site: 'https://www.shibuya-scramble-square.com/sky/en/' },
  tsukiji: { h: 'Shops about 5:00–14:00 · many close Sundays and some Wednesdays', ac: ['Tsukiji Station (Hibiya line), 1 min walk', '築地駅（日比谷線）からすぐ', 'つきじえき（ひびやせん）から すぐ'], t: ['Go hungry and early. Some shops are cash only.', 'भोकै र चाँडै जानुहोस्। केही पसलमा नगद मात्र चल्छ।', 'おなかをすかせて早めに。現金のみのお店もあります。', 'おなかを すかせて はやめに。げんきんのみの おみせも あります。'], rs: 'none', site: null },
  ueno: { h: 'Park about 5:00–23:00 · museums about 9:30–17:00', ac: ['Ueno Station (JR, Ginza, Hibiya lines), 2 min walk', '上野駅（JR・銀座線・日比谷線）から徒歩2分', 'うえのえき（JR・ぎんざせん・ひびやせん）から あるいて 2ふん'], t: ['Many museums close on Mondays.', 'धेरै संग्रहालय सोमबार बन्द हुन्छन्।', '月曜日は休みの博物館が多いです。', 'げつようびは やすみの はくぶつかんが おおいです。'], rs: 'none', site: null },
  akiba: { h: 'Shops about 10:00–20:00', ac: ['Akihabara Station (JR, Hibiya line), 1 min walk', '秋葉原駅（JR・日比谷線）からすぐ', 'あきはばらえき（JR・ひびやせん）から すぐ'], t: ['Many shops give tax-free shopping: bring your passport.', 'धेरै पसलमा कर-मुक्त किनमेल हुन्छ: राहदानी लैजानुहोस्।', '免税の店が多いので、パスポートを持って行きましょう。', 'めんぜいの みせが おおいので、ぱすぽーとを もって いきましょう。'], rs: 'none', site: null },
  skytree: { h: 'Observation deck about 10:00–21:00', ac: ['Tokyo Skytree Station (Tobu) or Oshiage Station, 1 min walk', '東京スカイツリー駅（東武）・押上駅からすぐ', 'とうきょう すかいつりーえき・おしあげえきから すぐ'], t: ['Buy tickets online in advance: it is cheaper and you skip the long line. Pick a clear day.', 'अनलाइन अग्रिम टिकट लिनुहोस्: सस्तो र लाइन बच्छ। सफा मौसमको दिन छान्नुहोस्।', '事前にネットでチケットを買うと安くて並びません。晴れの日がおすすめ。', 'じぜんに ねっとで ちけっとを かうと やすくて ならびません。はれの ひが おすすめ。'], rs: 'rec', site: 'https://www.tokyo-skytree.jp/en/' },
  fushimi: { h: 'Open 24 hours', ac: ['JR Inari Station, in front of the shrine', 'JR稲荷駅の目の前', 'JRいなりえきの めの まえ'], t: ['Walking to the top takes about 2 hours. Early morning or evening is quiet. Wear good shoes.', 'टुप्पोसम्म हिँड्न करिब २ घण्टा लाग्छ। बिहान वा साँझ शान्त हुन्छ। राम्रो जुत्ता लगाउनुहोस्।', '山頂まで歩いて約2時間。朝か夕方が空いています。歩きやすい靴で。', 'さんちょうまで あるいて やく 2じかん。あさか ゆうがたが すいて います。あるきやすい くつで。'], rs: 'none', site: 'https://inari.jp/en/' },
  kinkaku: { h: 'About 9:00–17:00', ac: ['Bus from Kyoto Station (about 40 min) to Kinkakuji-michi', '京都駅からバスで約40分、金閣寺道', 'きょうとえきから ばすで やく 40ぷん、きんかくじみち'], t: ['There is no train. The buses are crowded, so a taxi can be easier for groups.', 'रेल छैन। बस भीड हुन्छ, समूहका लागि ट्याक्सी सजिलो हुन सक्छ।', '電車はありません。バスは混むので、グループはタクシーも便利です。', 'でんしゃは ありません。ばすは こむので、ぐるーぷは たくしーも べんりです。'], rs: 'none', site: 'https://www.shokoku-ji.jp/en/kinkakuji/' },
  kiyomizu: { h: 'About 6:00–18:00 (changes by season)', ac: ['Bus to Kiyomizu-michi, then walk uphill about 10 min', 'バスで清水道、そこから坂を徒歩約10分', 'ばすで きよみずみち、そこから さかを あるいて やく 10ぷん'], t: ['The street up to the temple is steep and crowded. Go early. Evening light-ups happen in some seasons.', 'मन्दिरसम्मको बाटो उकालो र भीडभाड हुन्छ। चाँडै जानुहोस्।', '参道は坂で混みます。早めに行きましょう。季節によって夜のライトアップもあります。', 'さんどうは さかで こみます。はやめに いきましょう。きせつに よって よるの らいとあっぷも あります。'], rs: 'none', site: 'https://www.kiyomizudera.or.jp/en/' },
  arashiyama: { h: 'Always open (outdoors)', ac: ['JR Saga-Arashiyama Station, about 10 min walk', 'JR嵯峨嵐山駅から徒歩約10分', 'JRさがあらしやまえきから あるいて やく 10ぷん'], t: ['Very crowded after 10:00. Come at sunrise for photos.', '१० बजेपछि धेरै भीड हुन्छ। फोटोका लागि सूर्योदयमा आउनुहोस्।', '10時すぎはとても混みます。写真なら朝いちばんがおすすめ。', '10じ すぎは とても こみます。しゃしんなら あさ いちばんが おすすめ。'], rs: 'none', site: null },
  nishiki: { h: 'Shops about 10:00–18:00', ac: ['Karasuma Station (Hankyu) or Shijo Station, about 5 min walk', '烏丸駅（阪急）・四条駅から徒歩約5分', 'からすまえき（はんきゅう）・しじょうえきから あるいて やく 5ふん'], t: ['Eating while walking is discouraged: eat at the shop or in the eating area.', 'हिँड्दै खाने गर्न निरुत्साहित गरिन्छ: पसलमै वा खाने ठाउँमा खानुहोस्।', '歩きながら食べるのは控えて、お店や食べる場所でどうぞ。', 'あるきながら たべるのは ひかえて、おみせや たべる ばしょで どうぞ。'], rs: 'none', site: null },
  osakajo: { h: 'Park open · main tower about 9:00–17:00', ac: ['Osakajokoen Station (JR Loop line), 10 min walk', '大阪城公園駅（JR環状線）から徒歩約10分', 'おおさかじょうこうえんえき（JRかんじょうせん）から あるいて やく 10ぷん'], t: ['The park is big and free. Paying is only for the inside of the tower.', 'पार्क ठूलो र निःशुल्क छ। टावर भित्र जान मात्र शुल्क लाग्छ।', '公園は広くて無料。天守閣の中だけ有料です。', 'こうえんは ひろくて むりょう。てんしゅかくの なかだけ ゆうりょう です。'], rs: 'none', site: 'https://www.osakacastle.net/english/' },
  dotonbori: { h: 'Area is open 24 hours · shops from late morning', ac: ['Namba Station, about 5 min walk', 'なんば駅から徒歩約5分', 'なんばえきから あるいて やく 5ふん'], t: ['Best after dark for the neon. Popular takoyaki shops have lines at dinner time.', 'नियोनका लागि अँध्यारोपछि उत्तम। खानाको समयमा लाइन हुन्छ।', 'ネオンは夜がきれい。夕食時はたこ焼き屋さんに行列ができます。', 'ねおんは よるが きれい。ゆうしょくじは たこやきやさんに ぎょうれつが できます。'], rs: 'none', site: null },
  kuromon: { h: 'Shops about 9:00–17:00 · some close Sundays', ac: ['Nippombashi Station, 2 min walk', '日本橋駅から徒歩2分', 'にっぽんばしえきから あるいて 2ふん'], t: ['Go in the morning. Many stalls stop selling in the afternoon.', 'बिहान जानुहोस्। दिउँसो धेरै पसल बन्द हुन्छन्।', '午前中がおすすめ。午後は閉まる店が多いです。', 'ごぜんちゅうが おすすめ。ごごは しまる みせが おおいです。'] , rs: 'none', site: null },
};
const FEATURES_BOOK = [['book', 'book']];
FEATURES.push(...FEATURES_BOOK);
