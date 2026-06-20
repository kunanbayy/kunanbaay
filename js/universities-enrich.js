/* ===== SHYRAQ EDUCATION — UNIVERSITIES ENRICHMENT v1.0 =====
   UNIVERSITIES_SEED мәліметтерін толықтыратын файл.
   city, short_name, university_type, category, official_website,
   grant, dorm, specialties, tuition, minScore, color
*/

window.UNIVERSITIES_ENRICH = {
  1:  { city:'Астана',   short:'Bolashaq',  type:'Жеке',          cat:'гуманитарлық', web:'https://bolashaq.kz',     grant:false, dorm:false, sp:20, fee:'500 000–900 000 ₸',    min:42, color:'#7C3AED', desc:'Бизнес, гуманитарлық, педагогика мамандықтары.' },
  2:  { city:'Қызылорда',short:'Болашақ-ҚО',type:'Жеке',          cat:'гуманитарлық', web:'https://bolashaq-kz.kz',  grant:false, dorm:false, sp:16, fee:'440 000–780 000 ₸',    min:38, color:'#0E7490', desc:'Педагогика, экономика, гуманитарлық мамандықтар.' },
  3:  { city:'Шымкент',  short:'Мирас',     type:'Жеке',          cat:'техника',      web:'https://miras.edu.kz',    grant:false, dorm:false, sp:22, fee:'520 000–900 000 ₸',    min:45, color:'#B45309', desc:'Технология, медицина, педагогика мамандықтары.' },
  4:  { city:'Алматы',   short:'Нұр-Мүбарак',type:'Халықаралық',  cat:'гуманитарлық', web:'https://nurmubarak.kz',   grant:true,  dorm:true,  sp:8,  fee:'350 000–650 000 ₸',    min:40, color:'#15803D', desc:'Ислам мәдениеті, теология, Шығыс тілдері.' },
  5:  { city:'Астана',   short:'Тұран-Астана',type:'Жеке',         cat:'бизнес',       web:'https://turanastana.kz',  grant:false, dorm:false, sp:19, fee:'700 000–1 300 000 ₸',  min:48, color:'#92400E', desc:'Экономика, заң, педагогика мамандықтары.' },
  6:  { city:'Семей',    short:'ABU',        type:'Жеке',          cat:'гуманитарлық', web:'https://abu.edu.kz',      grant:false, dorm:false, sp:18, fee:'500 000–900 000 ₸',    min:45, color:'#1D4ED8', desc:'Гуманитарлық және педагогикалық мамандықтар.' },
  7:  { city:'Астана',   short:'AITU',       type:'Жеке',          cat:'IT',            web:'https://aitu.edu.kz',     logo:'assets/university-logos/aitu-university.svg', logoSource:'https://astanait.edu.kz/', grant:true,  dorm:true,  sp:20, fee:'1 500 000–2 800 000 ₸', min:75, color:'#0E7490', desc:'IT және цифрлық экономикаға мамандандырылған ЖОО.' },
  8:  { city:'Астана',   short:'Esil',       type:'Жеке',          cat:'бизнес',       web:'https://yesil.edu.kz',    grant:false, dorm:false, sp:22, fee:'650 000–1 100 000 ₸',  min:48, color:'#6D28D9', desc:'Бизнес, педагогика, IT мамандықтары.' },
  9:  { city:'Қаскелен', short:'SDU',        type:'Халықаралық',   cat:'бизнес',       web:'https://sdu.edu.kz',      logo:'assets/university-logos/sdu-university.svg', logoSource:'https://sdu.edu.kz/', grant:true,  dorm:true,  sp:48, fee:'1 200 000–2 500 000 ₸', min:70, color:'#1E3A5F', desc:'Халықаралық деңгейдегі университет. Турция-Қазақстан.' },
  10: { city:'Алматы',   short:'ҚМУ-ДС',    type:'Жеке',          cat:'медицина',     web:'https://kmu.kz',          grant:false, dorm:false, sp:6,  fee:'800 000–1 500 000 ₸',  min:80, color:'#DC2626', desc:'Денсаулық сақтау, медицина, MBA мамандықтары.' },
  11: { city:'Талдықорған',short:'Жетісу',   type:'Мемлекеттік',   cat:'классикалық',  web:'https://zhetysu-uni.edu.kz',grant:true,dorm:true,  sp:35, fee:'470 000–850 000 ₸',    min:45, color:'#15803D', desc:'Педагогика, гуманитарлық, табиғи ғылымдар.' },
  12: { city:'Қостанай', short:'ҚРУ',        type:'Мемлекеттік',   cat:'классикалық',  web:'https://kru.edu.kz',      grant:true,  dorm:true,  sp:50, fee:'490 000–880 000 ₸',    min:48, color:'#1D4ED8', desc:'Педагогика, техника, гуманитарлық мамандықтар.' },
  13: { city:'Көкшетау', short:'КМУ',        type:'Жеке',          cat:'бизнес',       web:'https://kmu.edu.kz',      grant:false, dorm:true,  sp:28, fee:'470 000–820 000 ₸',    min:42, color:'#0891B2', desc:'Бизнес, педагогика, IT мамандықтары.' },
  14: { city:'Алматы',   short:'ҚазҰПУ',     type:'Мемлекеттік',   cat:'педагогика',   web:'https://kaznpu.kz',       logo:'assets/university-logos/abai-university.svg', logoSource:'https://www.abai.university/', grant:true,  dorm:true,  sp:90, fee:'550 000–950 000 ₸',    min:55, color:'#BE185D', desc:'Педагогикалық білім берудің басты орталығы.' },
  15: { city:'Алматы',   short:'ХҚ және ДТУ',type:'Мемлекеттік',  cat:'гуманитарлық', web:'https://ablaikhan.kz',    grant:true,  dorm:true,  sp:28, fee:'560 000–950 000 ₸',    min:60, color:'#1E3A5F', desc:'Шетел тілдері, халықаралық қатынастар, аударма.' },
  16: { city:'Алматы',   short:'АГА',        type:'Мемлекеттік',   cat:'техника',      web:'https://acakz.kz',        grant:true,  dorm:true,  sp:12, fee:'600 000–1 100 000 ₸',  min:58, color:'#1E40AF', desc:'Азаматтық авиация, ұшу навигациясы.' },
  17: { city:'Шымкент',  short:'ХДДУ',       type:'Жеке',          cat:'гуманитарлық', web:'https://hddu.edu.kz',     grant:false, dorm:true,  sp:20, fee:'480 000–850 000 ₸',    min:42, color:'#15803D', desc:'Гуманитарлық, педагогика, техника мамандықтары.' },
  18: { city:'Қарағанды',short:'ҚарУ',        type:'Мемлекеттік',   cat:'классикалық',  web:'https://ksu.kz',          grant:true,  dorm:true,  sp:90, fee:'550 000–1 100 000 ₸',  min:55, color:'#7C3AED', desc:'Орталық Қазақстанның ірі классикалық университеті.' },
  19: { city:'Қостанай', short:'ҚӘТУ',        type:'Мемлекеттік',   cat:'техника',      web:'https://kstu-kz.kz',      grant:true,  dorm:true,  sp:25, fee:'480 000–860 000 ₸',    min:45, color:'#065F46', desc:'Техника, инженерия, IT мамандықтары.' },
  20: { city:'Екібастұз',short:'ЕИТИ',        type:'Мемлекеттік',   cat:'техника',      web:'https://eiti.edu.kz',     grant:true,  dorm:true,  sp:15, fee:'460 000–820 000 ₸',    min:42, color:'#0891B2', desc:'Инженерлік-техникалық мамандықтар. Павлодар облысы.' },
  21: { city:'Алматы',   short:'АГЭУ',        type:'Жеке',          cat:'гуманитарлық', web:'https://ageu.edu.kz',     grant:false, dorm:false, sp:20, fee:'550 000–950 000 ₸',    min:45, color:'#B45309', desc:'Экономика, психология, педагогика, заң.' },
  22: { city:'Алматы',   short:'AlmaU',       type:'Жеке',          cat:'бизнес',       web:'https://almau.edu.kz',    logo:'assets/university-logos/almau-university.svg', logoSource:'https://almau.edu.kz/', grant:false, dorm:false, sp:20, fee:'1 100 000–2 000 000 ₸', min:65, color:'#B45309', desc:'Бизнес, менеджмент, кәсіпкерлік мектебі.' },
  23: { city:'Алматы',   short:'АТУ',         type:'Мемлекеттік',   cat:'техника',      web:'https://atu.kz',          grant:true,  dorm:true,  sp:30, fee:'550 000–950 000 ₸',    min:52, color:'#0891B2', desc:'Тамақ технологиясы, биотехнология, туризм.' },
  24: { city:'Астана',   short:'АМУ',         type:'Мемлекеттік',   cat:'медицина',     web:'https://amu.kz',          grant:true,  dorm:true,  sp:9,  fee:'750 000–1 500 000 ₸',  min:88, color:'#DC2626', desc:'Медицина және денсаулық сақтау мамандықтары.' },
  25: { city:'Астана',   short:'АХУ',         type:'Жеке',          cat:'бизнес',       web:'https://aiu.edu.kz',      grant:false, dorm:false, sp:16, fee:'900 000–1 700 000 ₸',  min:60, color:'#1E40AF', desc:'Халықаралық бизнес, заң. Ағылшын тілінде.' },
  26: { city:'Атырау',   short:'АИГИ',        type:'Жеке',          cat:'техника',      web:'https://aigi.edu.kz',     grant:false, dorm:false, sp:16, fee:'470 000–840 000 ₸',    min:42, color:'#065F46', desc:'Мұнай-газ, педагогика, гуманитарлық мамандықтар.' },
  27: { city:'Ақтөбе',   short:'Баишев',      type:'Жеке',          cat:'бизнес',       web:'https://baishev.edu.kz',  grant:false, dorm:true,  sp:20, fee:'520 000–920 000 ₸',    min:45, color:'#7C3AED', desc:'Бизнес, педагогика, IT мамандықтары.' },
  28: { city:'Орал',     short:'БҚИТУ',       type:'Жеке',          cat:'IT',            web:'https://wkitu.edu.kz',    grant:false, dorm:false, sp:14, fee:'460 000–820 000 ₸',    min:40, color:'#7C3AED', desc:'Инновациялық технология, IT, бизнес.' },
  29: { city:'Шымкент',  short:'ГТА',         type:'Жеке',          cat:'гуманитарлық', web:'https://gta.edu.kz',      grant:false, dorm:false, sp:16, fee:'450 000–800 000 ₸',    min:40, color:'#0E7490', desc:'Гуманитарлық-техникалық мамандықтар.' },
  30: { city:'Өскемен',  short:'ШҚТУ',        type:'Мемлекеттік',   cat:'техника',      web:'https://ektu.kz',         grant:true,  dorm:true,  sp:55, fee:'500 000–950 000 ₸',    min:50, color:'#B45309', desc:'Техника, инженерия, IT, металлургия.' },
  31: { city:'Алматы',   short:'DMU',         type:'Халықаралық',   cat:'бизнес',       web:'https://dmu.kz',          grant:false, dorm:false, sp:15, fee:'1 800 000–3 200 000 ₸', min:80, color:'#1D4ED8', desc:'Британдық Де Монтфорт университетінің филиалы.' },
  32: { city:'Алматы',   short:'ДША',         type:'Мемлекеттік',   cat:'спорт',        web:'https://kasc.kz',         grant:true,  dorm:true,  sp:12, fee:'450 000–800 000 ₸',    min:40, color:'#065F46', desc:'Дене тәрбиесі, спорт, физическая культура.' },
  33: { city:'Астана',   short:'ЕГИ',         type:'Жеке',          cat:'гуманитарлық', web:'https://egikz.edu.kz',    grant:false, dorm:false, sp:18, fee:'550 000–900 000 ₸',    min:45, color:'#7C3AED', desc:'Педагогика, психология, тіл мамандықтары.' },
  34: { city:'Алматы',   short:'ЕТУ',         type:'Жеке',          cat:'техника',      web:'https://etu.edu.kz',      grant:false, dorm:false, sp:16, fee:'580 000–980 000 ₸',    min:48, color:'#0891B2', desc:'Технология, инженерия, IT мамандықтары.' },
  35: { city:'Шымкент',  short:'ЖАТ Ун-т',   type:'Мемлекеттік',   cat:'классикалық',  web:'https://zspu.edu.kz',     grant:true,  dorm:true,  sp:35, fee:'490 000–880 000 ₸',    min:48, color:'#1E3A5F', desc:'Педагогика, техника, гуманитарлық мамандықтар.' },
  36: { city:'Орал',     short:'БҚАТУ',       type:'Мемлекеттік',   cat:'ауыл шаруашылығы',web:'https://wkau.kz',     grant:true,  dorm:true,  sp:30, fee:'480 000–870 000 ₸',    min:45, color:'#15803D', desc:'Аграрлық технология, ветеринария, инженерия.' },
  37: { city:'Павлодар', short:'ИнЕУ',        type:'Жеке',          cat:'техника',      web:'https://ineu.edu.kz',     grant:false, dorm:true,  sp:30, fee:'480 000–850 000 ₸',    min:45, color:'#7C3AED', desc:'Инженерия, бизнес, педагогика мамандықтары.' },
  38: { city:'Алматы',   short:'KIMEP',       type:'Жеке',          cat:'бизнес',       web:'https://www.kimep.kz',    grant:false, dorm:true,  sp:25, fee:'2 000 000–3 500 000 ₸', min:85, color:'#B45309', desc:'Халықаралық бизнес, заң. Ағылшын тілінде.' },
  39: { city:'Алматы',   short:'Каспий',      type:'Жеке',          cat:'құқық',        web:'https://cu.edu.kz',       grant:false, dorm:false, sp:23, fee:'900 000–1 600 000 ₸',  min:60, color:'#7C3AED', desc:'Заң, IT, бизнес бағыттары.' },
  40: { city:'Алматы',   short:'UIB',         type:'Жеке',          cat:'бизнес',       web:'https://uib.kz',          grant:false, dorm:false, sp:18, fee:'750 000–1 400 000 ₸',  min:55, color:'#0E7490', desc:'Бизнес, экономика, маркетинг, заң.' },
  41: { city:'Алматы',   short:'ҚАЖ',         type:'Мемлекеттік',   cat:'техника',      web:'https://kazadi.kz',       grant:true,  dorm:true,  sp:15, fee:'500 000–900 000 ₸',    min:50, color:'#1D4ED8', desc:'Автомобиль жолдары, инженерия мамандықтары.' },
  42: { city:'Астана',   short:'ЕҰУ',         type:'Мемлекеттік',   cat:'классикалық',  web:'https://enu.kz',          logo:'assets/university-logos/enu-university.svg', logoSource:'https://enu.kz/', grant:true,  dorm:true,  sp:150,fee:'600 000–1 300 000 ₸',  min:60, color:'#1D4ED8', desc:'Астананың жетекші мемлекеттік университеті.' },
  43: { city:'Алматы',   short:'АЛиТ',        type:'Мемлекеттік',   cat:'техника',      web:'https://alt.kz',          grant:true,  dorm:true,  sp:18, fee:'500 000–900 000 ₸',    min:50, color:'#B45309', desc:'Логистика, көлік инженериясы, темір жол.' },
  44: { city:'Қостанай', short:'ҚИЭУ',        type:'Мемлекеттік',   cat:'техника',      web:'https://kieu.kz',         grant:true,  dorm:true,  sp:28, fee:'480 000–860 000 ₸',    min:45, color:'#065F46', desc:'Инженерия, экономика, IT мамандықтары.' },
  45: { city:'Астана',   short:'КАЗГЮУ',      type:'Жеке',          cat:'құқық',        web:'https://kazguu.kz',       grant:true,  dorm:false, sp:30, fee:'1 200 000–2 200 000 ₸', min:75, color:'#0E7490', desc:'Заң, бизнес, халықаралық қатынастар.' },
  46: { city:'Тараз',    short:'ТарРУ',       type:'Мемлекеттік',   cat:'классикалық',  web:'https://tru.edu.kz',      grant:true,  dorm:true,  sp:45, fee:'480 000–880 000 ₸',    min:48, color:'#0891B2', desc:'Педагогика, гуманитарлық, техника мамандықтары.' },
  47: { city:'Петропавл',short:'СҚУ',         type:'Мемлекеттік',   cat:'классикалық',  web:'https://nku.edu.kz',      grant:true,  dorm:true,  sp:55, fee:'500 000–950 000 ₸',    min:50, color:'#15803D', desc:'Солтүстік Қазақстанның жетекші ЖОО.' },
  48: { city:'Шымкент',  short:'ОҚУ',         type:'Мемлекеттік',   cat:'классикалық',  web:'https://sku.edu.kz',      grant:true,  dorm:true,  sp:70, fee:'500 000–1 000 000 ₸',  min:55, color:'#15803D', desc:'Оңтүстік Қазақстанның ірі мемлекеттік ЖОО.' },
  49: { city:'Ақтөбе',   short:'БҚМУ',        type:'Мемлекеттік',   cat:'медицина',     web:'https://wkmu.edu.kz',     grant:true,  dorm:true,  sp:8,  fee:'650 000–1 300 000 ₸',  min:83, color:'#DC2626', desc:'Медицина, фармация, стоматология мамандықтары.' },
  50: { city:'Орал',     short:'БҚУ',         type:'Мемлекеттік',   cat:'классикалық',  web:'https://wku.edu.kz',      grant:true,  dorm:true,  sp:45, fee:'490 000–880 000 ₸',    min:48, color:'#065F46', desc:'Педагогика, гуманитарлық, табиғи ғылымдар.' },
  51: { city:'Алматы',   short:'Нархоз',      type:'Жеке',          cat:'бизнес',       web:'https://narxoz.kz',       logo:'assets/university-logos/narxoz-university.svg', logoSource:'https://narxoz.edu.kz/', grant:true,  dorm:false, sp:35, fee:'1 300 000–2 200 000 ₸', min:68, color:'#6D28D9', desc:'Экономика, бизнес және заң саласы.' },
  52: { city:'Жезқазған',short:'ЖезУ',        type:'Мемлекеттік',   cat:'техника',      web:'https://zhezkaz-uni.edu.kz',grant:true,dorm:true,  sp:22, fee:'460 000–820 000 ₸',    min:42, color:'#0891B2', desc:'Техника, бизнес, педагогика мамандықтары.' },
  53: { city:'Шымкент',  short:'ОАИУ',        type:'Жеке',          cat:'IT',            web:'https://caiu.edu.kz',     grant:false, dorm:false, sp:16, fee:'480 000–860 000 ₸',    min:42, color:'#6D28D9', desc:'IT, инновация, бизнес мамандықтары.' },
  54: { city:'Қарағанды',short:'ОҚА',         type:'Жеке',          cat:'бизнес',       web:'https://cka.edu.kz',      grant:false, dorm:false, sp:18, fee:'490 000–880 000 ₸',    min:42, color:'#B45309', desc:'Бизнес, экономика, гуманитарлық мамандықтар.' },
  55: { city:'Шымкент',  short:'ОҚМА',        type:'Мемлекеттік',   cat:'медицина',     web:'https://skma.edu.kz',     grant:true,  dorm:true,  sp:10, fee:'700 000–1 400 000 ₸',  min:85, color:'#DC2626', desc:'Медицина, стоматология, фармация, мейірбикелік.' },
  56: { city:'Шымкент',  short:'ОҚМПУ',       type:'Мемлекеттік',   cat:'педагогика',   web:'https://skpu.edu.kz',     grant:true,  dorm:true,  sp:30, fee:'480 000–860 000 ₸',    min:48, color:'#BE185D', desc:'Педагогика мамандары даярлайтын ЖОО.' },
  57: { city:'Рудный',   short:'РИИ',         type:'Мемлекеттік',   cat:'техника',      web:'https://rii.kz',          grant:true,  dorm:true,  sp:20, fee:'460 000–820 000 ₸',    min:42, color:'#7C3AED', desc:'Техника, металлургия, инженерия. Рудный қаласы.' },
  58: { city:'Алматы',   short:'ҚазҰМУ',      type:'Мемлекеттік',   cat:'медицина',     web:'https://kaznmu.kz',       grant:true,  dorm:true,  sp:12, fee:'800 000–1 800 000 ₸',  min:90, color:'#DC2626', desc:'Медицина саласының жетекші ЖОО.' },
  59: { city:'Астана',   short:'ҚазАТУ',      type:'Мемлекеттік',   cat:'ауыл шаруашылығы',web:'https://katu.edu.kz', grant:true,  dorm:true,  sp:45, fee:'490 000–900 000 ₸',    min:48, color:'#15803D', desc:'Ауыл шаруашылығы, ветеринария, аграрлық инженерия.' },
  60: { city:'Атырау',   short:'АтМГУ',       type:'Мемлекеттік',   cat:'техника',      web:'https://agtu.edu.kz',     grant:true,  dorm:true,  sp:22, fee:'600 000–1 100 000 ₸',  min:55, color:'#B45309', desc:'Мұнай-газ инженериясы, геология, химия.' },
  61: { city:'Семей',    short:'СМУ',         type:'Мемлекеттік',   cat:'медицина',     web:'https://smu.edu.kz',      grant:true,  dorm:true,  sp:8,  fee:'650 000–1 200 000 ₸',  min:84, color:'#1E40AF', desc:'Медицина, стоматология, денсаулық сақтау.' },
  62: { city:'Семей',    short:'Шәкәрім',     type:'Мемлекеттік',   cat:'классикалық',  web:'https://semgu.kz',        grant:true,  dorm:true,  sp:45, fee:'490 000–880 000 ₸',    min:48, color:'#0E7490', desc:'Педагогика, техника, гуманитарлық бағыттар.' },
  63: { city:'Өскемен',  short:'ШҚУ',         type:'Мемлекеттік',   cat:'классикалық',  web:'https://vku.edu.kz',      grant:true,  dorm:true,  sp:50, fee:'490 000–880 000 ₸',    min:48, color:'#065F46', desc:'Гуманитарлық, педагогикалық мамандықтар.' },
  64: { city:'Павлодар', short:'TorU',        type:'Мемлекеттік',   cat:'классикалық',  web:'https://tou.edu.kz',      grant:true,  dorm:true,  sp:60, fee:'500 000–950 000 ₸',    min:50, color:'#065F46', desc:'Павлодардың жетекші мемлекеттік университеті.' },
  65: { city:'Алматы',   short:'Туран',       type:'Жеке',          cat:'бизнес',       web:'https://turan-edu.kz',    grant:false, dorm:false, sp:45, fee:'600 000–1 200 000 ₸',  min:50, color:'#92400E', desc:'Экономика, бизнес, гуманитарлық бағыттар.' },
  66: { city:'Атырау',   short:'АтУ',         type:'Мемлекеттік',   cat:'классикалық',  web:'https://atyrau-uni.edu.kz',grant:true, dorm:true,  sp:40, fee:'500 000–900 000 ₸',    min:48, color:'#0891B2', desc:'Педагогика, гуманитарлық, техника мамандықтары.' },
  67: { city:'Алматы',   short:'IITU',        type:'Жеке',          cat:'IT',            web:'https://iitu.edu.kz',     grant:true,  dorm:false, sp:18, fee:'1 000 000–1 800 000 ₸', min:72, color:'#1E3A5F', desc:'IT саласына мамандандырылған университет.' },
  68: { city:'Алматы',   short:'МОК',         type:'Жеке',          cat:'IT',            web:'https://mok.edu.kz',      grant:false, dorm:false, sp:18, fee:'750 000–1 400 000 ₸',  min:55, color:'#7C3AED', desc:'IT, дизайн, экономика мамандықтары.' },
  69: { city:'Шымкент',  short:'ХИТУ',        type:'Жеке',          cat:'техника',      web:'https://hitu.edu.kz',     grant:false, dorm:false, sp:16, fee:'470 000–840 000 ₸',    min:42, color:'#0E7490', desc:'Инженерлік-техникалық мамандықтар.' },
  70: { city:'Астана',   short:'ХКГУ',        type:'Жеке',          cat:'гуманитарлық', web:'https://htgu.edu.kz',     grant:false, dorm:false, sp:14, fee:'500 000–880 000 ₸',    min:42, color:'#B45309', desc:'Көлік, туризм, гуманитарлық мамандықтар.' },
  71: { city:'Алматы',   short:'ХТҚУ',        type:'Жеке',          cat:'туризм',       web:'https://uthk.edu.kz',     grant:false, dorm:false, sp:10, fee:'550 000–950 000 ₸',    min:45, color:'#6D28D9', desc:'Туризм, қонақжайлылық, сервис мамандықтары.' },
  72: { city:'Ақтау',    short:'КАСПИ',       type:'Мемлекеттік',   cat:'техника',      web:'https://yu.edu.kz',       grant:true,  dorm:true,  sp:30, fee:'530 000–980 000 ₸',    min:52, color:'#0E7490', desc:'Мұнай-газ, IT, экономика мамандықтары.' },
  73: { city:'Көкшетау', short:'КУ-Ш',        type:'Мемлекеттік',   cat:'классикалық',  web:'https://ku.edu.kz',       grant:true,  dorm:true,  sp:50, fee:'480 000–900 000 ₸',    min:48, color:'#1D4ED8', desc:'Педагогика, гуманитарлық, техникалық мамандықтар.' },
  74: { city:'Тараз',    short:'ХТИИ',        type:'Жеке',          cat:'гуманитарлық', web:'https://htii.edu.kz',     grant:false, dorm:false, sp:12, fee:'440 000–780 000 ₸',    min:38, color:'#B45309', desc:'Гуманитарлық, педагогика мамандықтары.' },
  75: { city:'Шымкент',  short:'ШУ',          type:'Жеке',          cat:'бизнес',       web:'https://univer.shymkent.kz',grant:false,dorm:false,sp:25, fee:'500 000–900 000 ₸',    min:45, color:'#0891B2', desc:'Экономика, педагогика, заң мамандықтары.' },
  76: { city:'Арқалық',  short:'АРКПИ',       type:'Мемлекеттік',   cat:'педагогика',   web:'https://arkalyk-peda.kz', grant:true,  dorm:true,  sp:18, fee:'440 000–780 000 ₸',    min:40, color:'#BE185D', desc:'Педагогика, тіл мамандықтары. Арқалық қаласы.' },
  77: { city:'Алматы',   short:'АЭБУ',        type:'Мемлекеттік',   cat:'техника',      web:'https://aues.kz',         grant:true,  dorm:true,  sp:25, fee:'550 000–1 000 000 ₸',  min:55, color:'#1E40AF', desc:'Энергетика, телекоммуникация, IT.' },
  78: { city:'Түркістан',short:'ХҚТУ',        type:'Халықаралық',   cat:'классикалық',  web:'https://iktu.kz',         grant:true,  dorm:true,  sp:60, fee:'550 000–1 000 000 ₸',  min:52, color:'#1E3A5F', desc:'Халықаралық Қазақ-Түрік серіктестігі.' },
  79: { city:'Ақтөбе',   short:'АӨУ',         type:'Мемлекеттік',   cat:'классикалық',  web:'https://aru.edu.kz',      grant:true,  dorm:true,  sp:45, fee:'490 000–880 000 ₸',    min:48, color:'#7C3AED', desc:'Педагогика, техника, гуманитарлық мамандықтар.' },
  80: { city:'Алматы',   short:'Satbayev',    type:'Мемлекеттік',   cat:'техника',      web:'https://satbayev.university', logo:'assets/university-logos/satbayev-university.svg', logoSource:'https://satbayev.university/', grant:true,dorm:true,  sp:80, fee:'700 000–1 400 000 ₸',  min:68, color:'#065F46', desc:'Техникалық ғылымдардың жетекші орталығы.' },
  81: { city:'Алматы',   short:'ҚазАСТ',      type:'Мемлекеттік',   cat:'спорт',        web:'https://kast.kz',         grant:true,  dorm:true,  sp:15, fee:'450 000–800 000 ₸',    min:45, color:'#0E7490', desc:'Спорт, дене тәрбиесі және туризм.' },
  82: { city:'Астана',   short:'ҚазТБУ',      type:'Жеке',          cat:'бизнес',       web:'https://kaztu.edu.kz',    grant:false, dorm:false, sp:18, fee:'580 000–980 000 ₸',    min:48, color:'#0891B2', desc:'Технология және бизнес мамандықтары.' },
  83: { city:'Алматы',   short:'ҚазҰАЗУ',     type:'Мемлекеттік',   cat:'ауыл шаруашылығы',web:'https://kaznaru.edu.kz',grant:true,dorm:true,  sp:40, fee:'500 000–900 000 ₸',    min:50, color:'#15803D', desc:'Аграрлық ғылымдар, ветеринария, экология.' },
  84: { city:'Астана',   short:'ҰХА',         type:'Мемлекеттік',   cat:'өнер',         web:'https://ballet.edu.kz',   grant:true,  dorm:true,  sp:5,  fee:'400 000–700 000 ₸',    min:30, color:'#BE185D', desc:'Классикалық балет, хореография өнері.' },
  85: { city:'Алматы',   short:'ҚӘПУ',        type:'Мемлекеттік',   cat:'педагогика',   web:'https://kzpu.kz',         grant:true,  dorm:true,  sp:35, fee:'480 000–850 000 ₸',    min:50, color:'#BE185D', desc:'Педагогика мамандықтары. Тек әйелдерге.' },
  86: { city:'Алматы',   short:'ҚазҰӨА',      type:'Мемлекеттік',   cat:'өнер',         web:'https://kaznai.kz',       grant:true,  dorm:true,  sp:12, fee:'480 000–900 000 ₸',    min:40, color:'#BE185D', desc:'Театр, кино, музыка, сурет өнері.' },
  87: { city:'Астана',   short:'ҚазҰӨУ',      type:'Мемлекеттік',   cat:'өнер',         web:'https://kaznau.edu.kz',   grant:true,  dorm:true,  sp:14, fee:'490 000–880 000 ₸',    min:38, color:'#7C3AED', desc:'Өнер, дизайн, мәдениет мамандықтары.' },
  88: { city:'Ақтөбе',   short:'ҚОУ',         type:'Жеке',          cat:'гуманитарлық', web:'https://koru.kz',         grant:false, dorm:true,  sp:18, fee:'480 000–860 000 ₸',    min:42, color:'#1D4ED8', desc:'Гуманитарлық, педагогика мамандықтары.' },
  89: { city:'Алматы',   short:'ҚИТУ',        type:'Жеке',          cat:'IT',            web:'https://kitu.edu.kz',     grant:false, dorm:false, sp:14, fee:'650 000–1 100 000 ₸',  min:52, color:'#0891B2', desc:'IT, телекоммуникация мамандықтары.' },
  90: { city:'Өскемен',  short:'КАФУ',        type:'Жеке',          cat:'бизнес',       web:'https://kafu.kz',         grant:false, dorm:false, sp:18, fee:'600 000–1 100 000 ₸',  min:48, color:'#1D4ED8', desc:'Американ жүйесіндегі университет. IT, бизнес.' },
  91: { city:'Алматы',   short:'ҚБТУ',        type:'Жеке',          cat:'техника',      web:'https://kbtu.kz',         logo:'assets/university-logos/kbtu-university.svg', logoSource:'https://kbtu.edu.kz/', grant:true,  dorm:true,  sp:28, fee:'1 000 000–2 000 000 ₸', min:70, color:'#92400E', desc:'Британ жүйесіндегі техникалық университет.' },
  92: { city:'Алматы',   short:'DKU',         type:'Халықаралық',   cat:'бизнес',       web:'https://dku.kz',          grant:false, dorm:false, sp:15, fee:'1 000 000–1 800 000 ₸', min:70, color:'#1D4ED8', desc:'Неміс жүйесіндегі халықаралық университет.' },
  93: { city:'Алматы',   short:'ҚРМУ',        type:'Жеке',          cat:'медицина',     web:'https://krmu.edu.kz',     grant:true,  dorm:true,  sp:10, fee:'750 000–1 500 000 ₸',  min:80, color:'#DC2626', desc:'Медицина, фармация. Орыс-қазақ тілдерінде.' },
  94: { city:'Қарағанды',short:'ҚарЭУ',       type:'Жеке',          cat:'бизнес',       web:'https://keu.kz',          grant:false, dorm:true,  sp:25, fee:'500 000–900 000 ₸',    min:48, color:'#B45309', desc:'Экономика, бухгалтерия, сауда, туризм.' },
  95: { city:'Алматы',   short:'Қайнар',      type:'Жеке',          cat:'гуманитарлық', web:'https://kainar.edu.kz',   grant:false, dorm:false, sp:18, fee:'490 000–850 000 ₸',    min:40, color:'#6D28D9', desc:'Гуманитарлық, экономика, заң мамандықтары.' },
  96: { city:'Теміртау', short:'ҚИУ',         type:'Мемлекеттік',   cat:'техника',      web:'https://kariiu.edu.kz',   grant:true,  dorm:true,  sp:20, fee:'460 000–820 000 ₸',    min:42, color:'#0891B2', desc:'Техника, инженерия мамандықтары. Теміртау қаласы.' },
  97: { city:'Қарағанды',short:'ҚарМУ',       type:'Мемлекеттік',   cat:'медицина',     web:'https://qmu.edu.kz',      grant:true,  dorm:true,  sp:10, fee:'700 000–1 400 000 ₸',  min:86, color:'#BE185D', desc:'Медицина, стоматология, фармация.' },
  98: { city:'Қонаев',   short:'Қонаев Ун-т', type:'Жеке',          cat:'бизнес',       web:'https://qonaev-uni.kz',   grant:false, dorm:false, sp:16, fee:'550 000–950 000 ₸',    min:45, color:'#1E3A5F', desc:'IT, бизнес, педагогика мамандықтары.' },
  99: { city:'Қызылорда',short:'ҚызУ',        type:'Мемлекеттік',   cat:'классикалық',  web:'https://korkyt.edu.kz',   grant:true,  dorm:true,  sp:40, fee:'470 000–860 000 ₸',    min:45, color:'#B45309', desc:'Педагогика, техника, гуманитарлық мамандықтар.' },
  100:{ city:'Қызылорда',short:'ҚАШ',         type:'Жеке',          cat:'гуманитарлық', web:'https://openuniversity.kz',grant:false,dorm:false, sp:12, fee:'380 000–680 000 ₸',    min:35, color:'#0E7490', desc:'Қашықтықтан оқыту, гуманитарлық мамандықтар.' },
  101:{ city:'Алматы',   short:'Консерватория',type:'Мемлекеттік',  cat:'өнер',         web:'https://conservatoire.kz', grant:true,  dorm:true,  sp:8,  fee:'400 000–700 000 ₸',    min:35, color:'#7C3AED', desc:'Қазақ музыкасы мен классикалық музыка.' },
  102:{ city:'Қарағанды',short:'ҚарТУ',       type:'Мемлекеттік',   cat:'техника',      web:'https://kstu.kz',         grant:true,  dorm:true,  sp:50, fee:'550 000–1 000 000 ₸',  min:52, color:'#0891B2', desc:'Тау-кен, металлургия, IT, инженерия.' },
  103:{ city:'Алматы',   short:'ҚазҰУ',       type:'Мемлекеттік',   cat:'классикалық',  web:'https://www.kaznu.kz',    logo:'assets/university-logos/kaznu-university.svg', logoSource:'https://www.kaznu.kz/', grant:true,  dorm:true,  sp:200,fee:'650 000–1 500 000 ₸',  min:65, color:'#1E3A5F', desc:'Қазақстанның ең ірі классикалық университеті.' },
  104:{ city:'Павлодар', short:'ПедУ',        type:'Мемлекеттік',   cat:'педагогика',   web:'https://ppu.kz',          grant:true,  dorm:true,  sp:25, fee:'460 000–820 000 ₸',    min:45, color:'#BE185D', desc:'Педагогика, психология, тіл мамандықтары.' }
};

/* ─── SEED + ENRICH біріктіру функциясы ─── */
window.getEnrichedUniversities = function() {
  if (!window.UNIVERSITIES_SEED) return [];
  return window.UNIVERSITIES_SEED.map(u => {
    if (u.data_source === 'kazakhstan_universities_data.json') {
      return Object.assign({}, u, {
        city: u.city || '—',
        short_name: u.short_name || u.name_kz.substring(0, 6),
        university_type: u.university_type || '—',
        category: u.category || '—',
        official_website: u.official_website || null,
        logo_url: u.logo_url || null,
        logo_source_url: u.logo_source_url || null,
        description: u.description || null,
        grant: Array.isArray(u.specialties) && u.specialties.length > 0,
        dorm: Boolean(u.dormitory),
        specialtiesCount: Array.isArray(u.specialties) ? u.specialties.length : 0,
        specialties: u.specialties || [],
        tuition: 'Кейін толтырылады',
        minScore: Array.isArray(u.specialties) && u.specialties.length
          ? Math.min(...u.specialties.map(s => Number(s.thresholdScore) || 50))
          : 50,
        color: '#1E3A5F'
      });
    }
    const e = window.UNIVERSITIES_ENRICH[u.id] || {};
    return Object.assign({}, u, {
      city:            e.city            || u.city            || '—',
      short_name:      e.short           || u.short_name      || u.name_kz.substring(0, 6),
      university_type: e.type            || u.university_type || '—',
      category:        e.cat             || u.category        || '—',
      official_website:e.web             || u.official_website|| null,
      logo_url:        e.logo            || u.logo_url        || null,
      logo_source_url: e.logoSource      || u.logo_source_url || null,
      description:     e.desc            || u.description     || null,
      grant:           e.grant           !== undefined ? e.grant  : false,
      dorm:            e.dorm            !== undefined ? e.dorm   : false,
      specialties:     e.sp              || 10,
      tuition:         e.fee             || '—',
      minScore:        e.min             || 50,
      color:           e.color           || '#1E3A5F'
    });
  });
};

/* ─── Placeholder логотип генератор ─── */
window.getUniPlaceholder = function(u) {
  const abbr = (u.short_name || u.name_kz).substring(0, 5);
  const bg   = encodeURIComponent(u.color || '#1E3A5F');
  const fs   = abbr.length > 4 ? 7 : abbr.length > 3 ? 9 : 11;
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56">
      <rect width="56" height="56" rx="10" fill="${u.color||'#1E3A5F'}"/>
      <text x="28" y="34" font-family="Arial" font-weight="900" font-size="${fs}"
        fill="#fff" text-anchor="middle">${abbr}</text></svg>`
  )}`;
};
