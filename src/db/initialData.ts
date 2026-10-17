import { Component, Device, Compatibility, Equivalent, WorkshopSettings, Customer, Supplier, Technician, Purchase, Sale } from './types';

export const INITIAL_COMPONENTS: Component[] = [
  // --- 1. PWM & SMPS Controllers ---
  {
    id: 1,
    part_number: 'VIPer12A',
    package_type: 'DIP-8',
    category: 'PWM Controller',
    description: 'مذبذب ومفتاح متكامل لدوائر التغذية الخافضة SMPS بقدرة حتى 13 واط تردد 60kHz، شائع في دوائر الستاندباي والشواحن',
    stock_quantity: 14,
    bin_location: 'رف A / درج 01 / علبة 1',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 2,
    part_number: 'VIPer22A',
    package_type: 'DIP-8',
    category: 'PWM Controller',
    description: 'مذبذب متكامل بقدرة أعلى حتى 20 واط، بديل قوي ومباشر لـ VIPer12A بحرارة أقل وعمر أطول',
    stock_quantity: 8,
    bin_location: 'رف A / درج 01 / علبة 2',
    image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 3,
    part_number: 'VIPer12A-SMD',
    package_type: 'SOP-8',
    category: 'PWM Controller',
    description: 'نسخة تركيب سطحي SMD من آي سي الباور VIPer12A لشواحن البطاريات وبوردات التحكم الصغيرة',
    stock_quantity: 12,
    bin_location: 'رف A / درج 01 / علبة 3'
  },
  {
    id: 4,
    part_number: 'OB2269CP',
    package_type: 'SOP-8',
    category: 'PWM Controller',
    description: 'آي سي مذبذب نبضي عالي الأداء مع حماية OVP لدوائر الباور العكسية Flyback في الشاشات الصينية وأجهزة الاستقبال',
    stock_quantity: 3,
    bin_location: 'رف A / درج 04 / علبة 3',
    image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 5,
    part_number: 'OB2268CP',
    package_type: 'SOP-8',
    category: 'PWM Controller',
    description: 'مذبذب تردد 65kHz متوافق كهربائياً مع OB2269 مع تطابق مباشر في أطراف التوصيل ووظائف الحماية',
    stock_quantity: 5,
    bin_location: 'رف A / درج 04 / علبة 4'
  },
  {
    id: 6,
    part_number: 'LD7535',
    package_type: 'SOT-23-6',
    category: 'PWM Controller',
    description: 'مذبذب باور متناهي الصغر 6 أطراف SOT-23 لدوائر تغذية شاشات LED واللوحات المدمجة Combo Board',
    stock_quantity: 18,
    bin_location: 'رف A / درج 05 / علبة 1'
  },
  {
    id: 7,
    part_number: 'OB2263',
    package_type: 'SOT-23-6',
    category: 'PWM Controller',
    description: 'بديل مباشر شهير لـ LD7535 في كروت شاشات التلفزيون والشواحن الصغيرة مع تردد 65kHz',
    stock_quantity: 10,
    bin_location: 'رف A / درج 05 / علبة 2'
  },
  {
    id: 8,
    part_number: 'DK124',
    package_type: 'DIP-8',
    category: 'PWM Controller',
    description: 'آي سي باور مدمج Mosfet داخلي لدوائر الشواحن وأجهزة الرسيفر حتى 24 واط دون حاجة لموسفيت خارجي',
    stock_quantity: 2,
    bin_location: 'رف A / درج 02 / علبة 1'
  },
  {
    id: 9,
    part_number: 'DK112',
    package_type: 'DIP-8',
    category: 'PWM Controller',
    description: 'آي سي باور مدمج بقدرة 12 واط، بديل مناسب لدائرة شواحن الرسيفر والمصابيح',
    stock_quantity: 6,
    bin_location: 'رف A / درج 02 / علبة 2'
  },
  {
    id: 10,
    part_number: 'TNY268PN',
    package_type: 'DIP-8',
    category: 'PWM Controller',
    description: 'آي سي باور TinySwitch-II لدوائر ستاندباي الشاشات والمايكروويف وبوردات الغسالات حتى 15W',
    stock_quantity: 7,
    bin_location: 'رف A / درج 07 / علبة 1'
  },
  {
    id: 11,
    part_number: 'TNY277PN',
    package_type: 'DIP-8',
    category: 'PWM Controller',
    description: 'آي سي باور TinySwitch-III بقدرة أعلى حتى 23W بديل قوي لـ TNY268 مع كفاءة طاقة أفضل',
    stock_quantity: 4,
    bin_location: 'رف A / درج 07 / علبة 2'
  },
  {
    id: 12,
    part_number: 'LNK304GN',
    package_type: 'SMD-8',
    category: 'LinkSwitch',
    description: 'آي سي باور خافض Buck لدوائر التحكم في الغسالات وغلايات المياه دون محول عزل',
    stock_quantity: 3,
    bin_location: 'رف A / درج 08 / علبة 2'
  },
  {
    id: 13,
    part_number: 'LNK304PN',
    package_type: 'DIP-8',
    category: 'LinkSwitch',
    description: 'النسخة الأرجل DIP-8 من آي سي LNK304 لكروت غسالات سامسونج وإل جي والمجففات',
    stock_quantity: 5,
    bin_location: 'رف A / درج 08 / علبة 1'
  },
  {
    id: 14,
    part_number: 'TOP247YN',
    package_type: 'TO-220-7',
    category: 'SMPS Switcher',
    description: 'آي سي باور متكامل لدوائر الباور الكبيرة وأجهزة التلفاز والشواحن الثقيلة حتى 85W',
    stock_quantity: 2,
    bin_location: 'رف D / درج 01 / علبة 4'
  },
  {
    id: 15,
    part_number: 'TOP249YN',
    package_type: 'TO-220-7',
    category: 'SMPS Switcher',
    description: 'بديل قدرة أكبر لنفس عائلة TOPSwitch-GX حتى 120 واط، يركب على نفس المشتت الحراري',
    stock_quantity: 0,
    bin_location: 'رف D / درج 01 / علبة 5'
  },
  {
    id: 16,
    part_number: 'FSFR1700US',
    package_type: 'SIP-9',
    category: 'Resonant Controller',
    description: 'مذبذب رنيني نصف قنطرة Half-Bridge مدمج بموسفيتات لدوائر باور شاشات سامسونج وإل جي LED/Smart',
    stock_quantity: 3,
    bin_location: 'رف A / درج 09 / علبة 1'
  },
  {
    id: 17,
    part_number: 'FSFR1800US',
    package_type: 'SIP-9',
    category: 'Resonant Controller',
    description: 'بديل مباشر بقدرة تيار وتحمل أعلى 260W لعائلة FSFR1700، ممتاز للحد من سخونة اللوحة',
    stock_quantity: 2,
    bin_location: 'رف A / درج 09 / علبة 2'
  },
  {
    id: 18,
    part_number: 'STR-W6053S',
    package_type: 'TO-220F-6',
    category: 'SMPS Controller',
    description: 'آي سي باور متكامل لدوائر تغذية شاشات LG وتوشيبا وبوردات الطاقة المعزولة 60W',
    stock_quantity: 4,
    bin_location: 'رف A / درج 10 / علبة 1'
  },

  // --- 2. Power MOSFETs & IGBTs ---
  {
    id: 19,
    part_number: '7N65',
    package_type: 'TO-220F',
    category: 'Power MOSFET',
    description: 'موسفيت تقطيع رئيسي 650V 7A معزول البكج، القطعة القياسية في بوردات الشاشات الـ LED من 32 إلى 43 بوصة',
    stock_quantity: 11,
    bin_location: 'رف C / درج 01 / علبة 1'
  },
  {
    id: 20,
    part_number: '10N65',
    package_type: 'TO-220F',
    category: 'Power MOSFET',
    description: 'موسفيت قدرة 650V 10A معزول، بديل مباشر ومطور لـ 7N65 يقلل حرارة الشاسيه ويتحمل التذبذب',
    stock_quantity: 9,
    bin_location: 'رف C / درج 01 / علبة 2'
  },
  {
    id: 21,
    part_number: '12N65',
    package_type: 'TO-220F',
    category: 'Power MOSFET',
    description: 'موسفيت قدرة 650V 12A لشاشات LED الكبيرة 50 و 55 بوصة ومصادر التغذية عالية الأمبير',
    stock_quantity: 6,
    bin_location: 'رف C / درج 01 / علبة 3'
  },
  {
    id: 22,
    part_number: 'IRF3205',
    package_type: 'TO-220',
    category: 'Power MOSFET',
    description: 'موسفيت قدرة N-Channel 55V 110A لدوائر الإنفرتر 12V والتحكم بالمحركات ومكبرات الصوت',
    stock_quantity: 15,
    bin_location: 'رف C / درج 02 / علبة 1'
  },
  {
    id: 23,
    part_number: 'IRFB3206',
    package_type: 'TO-220',
    category: 'Power MOSFET',
    description: 'موسفيت قدرة عالي الكفاءة 60V 120A بمقاومة Rds(on) منخفضة جداً، بديل ممتاز ومطور لـ IRF3205',
    stock_quantity: 7,
    bin_location: 'رف C / درج 02 / علبة 2'
  },
  {
    id: 24,
    part_number: 'IRFP460',
    package_type: 'TO-247',
    category: 'Power MOSFET',
    description: 'موسفيت قدرة كبير 500V 20A لماكينات اللحام الإلكترونية وإنفرترات الطاقة الشمسية',
    stock_quantity: 5,
    bin_location: 'رف C / درج 03 / علبة 1'
  },
  {
    id: 25,
    part_number: 'H20R1203',
    package_type: 'TO-247',
    category: 'IGBT Transistor',
    description: 'ترانزستور IGBT رنيني 1200V 20A مدمج بدايود سريع لطباخات الحث الكهرومغناطيسي (Induction Cooker)',
    stock_quantity: 4,
    bin_location: 'رف C / درج 04 / علبة 1'
  },
  {
    id: 26,
    part_number: 'FGH40N60SFD',
    package_type: 'TO-247',
    category: 'IGBT Transistor',
    description: 'ترانزستور IGBT عالي السرعة 600V 40A لإنفرترات الطاقة الشمسية وتكييفات الإنفرتر ومحركات السرعة',
    stock_quantity: 3,
    bin_location: 'رف C / درج 04 / علبة 2'
  },

  // --- 3. Regulators, Diodes & Optocouplers ---
  {
    id: 27,
    part_number: 'TL431',
    package_type: 'TO-92',
    category: 'Precision Shunt',
    description: 'دايود زينر مبرمج ومحدد جهد مرجعي 2.5V إلى 36V لدائرة الفيدباك ومراقبة الجهد الخارجي',
    stock_quantity: 45,
    bin_location: 'رف B / درج 05 / علبة 1'
  },
  {
    id: 28,
    part_number: 'PC817',
    package_type: 'DIP-4',
    category: 'Optocoupler',
    description: 'عازل ضوئي قياسي لعزل منطقة الـ Hot عن الـ Cold في دوائر التغذية وحماية المعالج',
    stock_quantity: 60,
    bin_location: 'رف B / درج 06 / علبة 1'
  },
  {
    id: 29,
    part_number: 'EL817',
    package_type: 'DIP-4',
    category: 'Optocoupler',
    description: 'عازل ضوئي قياسي من شركة Everlight، بديل مباشر ومطابق تماماً بنسبة 100% لـ PC817',
    stock_quantity: 35,
    bin_location: 'رف B / درج 06 / علبة 2'
  },
  {
    id: 30,
    part_number: '7805',
    package_type: 'TO-220',
    category: 'Linear Regulator',
    description: 'منظم جهد خطي موجب قياسي 5 فولت 1.5 أمبير لدوائر الكنترول وشاشات العرض الرقمية',
    stock_quantity: 35,
    bin_location: 'رف E / درج 03 / علبة 1'
  },
  {
    id: 31,
    part_number: '7812',
    package_type: 'TO-220',
    category: 'Linear Regulator',
    description: 'منظم جهد خطي موجب 12 فولت 1.5 أمبير لتغذية الريليهات والمراوح ودوائر الصوت',
    stock_quantity: 20,
    bin_location: 'رف E / درج 03 / علبة 2'
  },
  {
    id: 32,
    part_number: 'AMS1117-3.3',
    package_type: 'SOT-223',
    category: 'Linear Regulator',
    description: 'منظم جهد LDO سطحي 3.3V لتغذية معالجات الشاشات وفلاشات SPI وفلاشات الرسيفر',
    stock_quantity: 28,
    bin_location: 'رف E / درج 05 / علبة 1'
  },
  {
    id: 33,
    part_number: 'AMS1117-1.8',
    package_type: 'SOT-223',
    category: 'Linear Regulator',
    description: 'منظم جهد سطحي 1.8V لتغذية رامات DDR ونواة المعالجات في الشاشات الذكية',
    stock_quantity: 16,
    bin_location: 'رف E / درج 05 / علبة 2'
  },
  {
    id: 34,
    part_number: 'LM2596S-5.0',
    package_type: 'TO-263',
    category: 'Step-Down Buck',
    description: 'محول جهد خافض سويتشينج 5V 3A عالي الكفاءة، بديل ممتاز للتخلص من حرارة المنظم الخطي 7805',
    stock_quantity: 6,
    bin_location: 'رف E / درج 08 / علبة 2'
  },
  {
    id: 35,
    part_number: 'MBR20100CT',
    package_type: 'TO-220',
    category: 'Schottky Diode',
    description: 'دايود شوتكي مزدوج سريع 100V 20A لتوحيد خط خرج 12V في كروت باور الشاشات الـ LED',
    stock_quantity: 14,
    bin_location: 'رف B / درج 02 / علبة 1'
  },
  {
    id: 36,
    part_number: 'MBR20200CT',
    package_type: 'TO-220',
    category: 'Schottky Diode',
    description: 'دايود شوتكي مزدوج 200V 20A بديل قدرة وتحمل أعلى لخطوط 12V و 24V في الشاشات الكبيرة',
    stock_quantity: 8,
    bin_location: 'رف B / درج 02 / علبة 2'
  },

  // --- 4. Audio Amplifiers ---
  {
    id: 37,
    part_number: 'TDA2030A',
    package_type: 'TO-220-5',
    category: 'Audio Amp',
    description: 'مضخم صوت كلاسيكي 18W لصب ووفر السماعات المنزلية وأجهزة الاستقبال',
    stock_quantity: 12,
    bin_location: 'رف F / درج 01 / علبة 1'
  },
  {
    id: 38,
    part_number: 'TDA2050',
    package_type: 'TO-220-5',
    category: 'Audio Amp',
    description: 'مضخم صوت 32W بديل مباشر متطابق في الأطراف لـ TDA2030 مع قدرة ونقاء صوتي أعلى',
    stock_quantity: 6,
    bin_location: 'رف F / درج 01 / علبة 2'
  },
  {
    id: 39,
    part_number: 'LM1875',
    package_type: 'TO-220-5',
    category: 'Audio Amp',
    description: 'مضخم صوت Hi-Fi فائق الجودة 20W بديل مباشر عالي الدقة لـ TDA2030A بتشوه صوتي أقل',
    stock_quantity: 4,
    bin_location: 'رف F / درج 01 / علبة 3'
  },
  {
    id: 40,
    part_number: 'TDA7294',
    package_type: 'Multiwatt-15',
    category: 'Audio Amp',
    description: 'مضخم صوت عالي القدرة 100W DMOS لسماعات الحفلات والصبات الكبيرة ومكبرات المساجد',
    stock_quantity: 3,
    bin_location: 'رف F / درج 03 / علبة 1'
  }
];

export const INITIAL_DEVICES: Device[] = [
  // --- شاشات صينية شائعة ---
  {
    id: 1,
    device_type: 'شاشة ذكية Smart TV',
    brand: 'Universal / الصين',
    model_number: 'Universal 32-43 Inch',
    board_number: 'TP.MS338E.PB801',
    image_url: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 2,
    device_type: 'شاشة LED عادية',
    brand: 'Universal / الصين',
    model_number: 'China LED 32 Inch',
    board_number: 'TP.RD8503.PB816',
    image_url: 'https://images.unsplash.com/photo-1588508065123-287b28e013da?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 3,
    device_type: 'شاشة سمارت أندرويد',
    brand: 'Universal / الصين',
    model_number: 'Smart Android 43/50',
    board_number: 'CV338H-U42'
  },

  // --- شاشات LG ---
  {
    id: 4,
    device_type: 'شاشة LED',
    brand: 'LG',
    model_number: '32LM550BPTA',
    board_number: 'EAX68253901',
    image_url: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 5,
    device_type: 'شاشة Smart LED 43"',
    brand: 'LG',
    model_number: '43LJ550V',
    board_number: 'EAX67209001 (LGP43-17PL1)'
  },

  // --- شاشات Samsung ---
  {
    id: 6,
    device_type: 'شاشة LED 32"',
    brand: 'Samsung',
    model_number: 'UE32J4000',
    board_number: 'BN44-00801A',
    image_url: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 7,
    device_type: 'شاشة Smart 40"',
    brand: 'Samsung',
    model_number: 'UE40J5200',
    board_number: 'BN44-00605A (L42S1_DSM)'
  },

  // --- شاشات توشيبا وفيستل ---
  {
    id: 8,
    device_type: 'شاشة LED',
    brand: 'Toshiba / Vestel',
    model_number: '32L2433DG',
    board_number: '17IPS19-5'
  },
  {
    id: 9,
    device_type: 'شاشة Smart 40"',
    brand: 'Toshiba',
    model_number: '40L5435DG',
    board_number: '17IPS62'
  },

  // --- أجهزة منزلية ---
  {
    id: 10,
    device_type: 'خلاط ومفرمة',
    brand: 'Moulinex',
    model_number: 'Blendforce LM240',
    board_number: 'PCB-MLX-MOTOR-CTRL-V2'
  },
  {
    id: 11,
    device_type: 'قلاية هوائية Airfryer',
    brand: 'Philips',
    model_number: 'Essential HD9252/90',
    board_number: '4203-036-12841'
  },
  {
    id: 12,
    device_type: 'ميكروويف ديجيتال',
    brand: 'Panasonic',
    model_number: 'NN-ST34HM',
    board_number: 'F606Y-POWER-BOARD'
  },
  {
    id: 13,
    device_type: 'غسالة ملابس ديجيتال',
    brand: 'Samsung',
    model_number: 'EcoBubble WW80J5410GX',
    board_number: 'DC92-01236B'
  },
  {
    id: 14,
    device_type: 'طباخ حث كهرومغناطيسي',
    brand: 'Midea',
    model_number: 'Induction MC-ID351',
    board_number: 'MD-IND-PWR-REV5'
  },
  {
    id: 15,
    device_type: 'إنفرتر طاقة شمسية 12V',
    brand: 'Torom / Suoer',
    model_number: 'Modified Sine 1000W',
    board_number: 'INV-1000W-DCAC-V3'
  },
  {
    id: 16,
    device_type: 'كشاف ومصباح طوارئ',
    brand: 'Geepas',
    model_number: 'GE5595 Rechargeable',
    board_number: 'GP-LED-CHG-REV3'
  },
  {
    id: 17,
    device_type: 'صب ووفر ومكبر صوت 2.1',
    brand: 'Creative / Microlab',
    model_number: 'M-108 Subwoofer',
    board_number: 'AMP-2030-SUB-V1'
  }
];

export const INITIAL_COMPATIBILITIES: Compatibility[] = [
  // بوردة الشاشة الصينية الشهيرة TP.MS338E.PB801
  {
    id: 1,
    component_id: 4, // OB2269CP
    device_id: 1,
    circuit_role: 'مذبذب الباور الرئيسي لجهد الستاندباي والإنفرتر',
    board_location: 'UB101',
    technician_notes: 'ملاحظة: التأكد من سلامة ترانزستور الموسفيت 7N65 ومقاومة السورس 0.22Ω ومكثف الـ VDD 47uF 50V'
  },
  {
    id: 2,
    component_id: 19, // 7N65
    device_id: 1,
    circuit_role: 'موسفيت التقطيع الرئيسي لمحول الشوبر SMPS',
    board_location: 'QB101',
    technician_notes: 'جهد البوابة من 10V إلى 12V؛ فحص دايود الزنر 18V ومقاومة الـ Gate 10Ω قبل تشغيل البوردة'
  },
  {
    id: 3,
    component_id: 28, // PC817
    device_id: 1,
    circuit_role: 'عازل ضوئي لدائرة التغذية العكسية Feedback',
    board_location: 'U102',
    technician_notes: 'في حال كان خرج الجهد يتذبذب (Pumping)، يجب استبدال الأوبتوكبلر مع TL431 معاً'
  },
  {
    id: 4,
    component_id: 27, // TL431
    device_id: 1,
    circuit_role: 'محدد الجهد المرجعي لدائرة الـ Feedback',
    board_location: 'U103',
    technician_notes: 'فحص مقاومات مقسم الجهد المتصلة بطرف الـ Reference بدقة'
  },
  {
    id: 5,
    component_id: 35, // MBR20100CT
    device_id: 1,
    circuit_role: 'دايود توحيد شوتكي لخط خرج 12V الرئيسي',
    board_location: 'DB101',
    technician_notes: 'في حال وجود شورت صريح على خط 12V فغالباً العطل من هذا الدايود المزدوج'
  },
  {
    id: 6,
    component_id: 32, // AMS1117-3.3
    device_id: 1,
    circuit_role: 'منظم جهد 3.3V لمعالج الشاشة وفلاشة الـ SPI',
    board_location: 'U5',
    technician_notes: 'تأكد من وجود خرج 3.3V ثابت بدون ريبل عند محاولة إقلاع الشاشة من اللمبة الحمراء'
  },

  // بوردة الشاشة الصينية TP.RD8503.PB816
  {
    id: 7,
    component_id: 6, // LD7535
    device_id: 2,
    circuit_role: 'مذبذب الباور 6 أطراف SOT-23-6',
    board_location: 'U101',
    technician_notes: 'يمكن استبداله بـ OB2263 مباشرة دون أي تعديل بالأطراف'
  },
  {
    id: 8,
    component_id: 19, // 7N65
    device_id: 2,
    circuit_role: 'موسفيت التقطيع الرئيسي لمحول الشوبر',
    board_location: 'Q101',
    technician_notes: 'يفضل تركيب 10N65 لتقليل درجة الحرارة وإطالة عمر البوردة'
  },

  // شاشة LG 32LM550 (EAX68253901)
  {
    id: 9,
    component_id: 18, // STR-W6053S
    device_id: 4,
    circuit_role: 'آي سي الباور المتكامل لجهد التغذية الرئيسي',
    board_location: 'IC901',
    technician_notes: 'فحص مكثف التنعيم الرئيسي ومقاومة البدء 2.2MΩ والدايود الزنر على طرف VDD'
  },
  {
    id: 10,
    component_id: 28, // PC817
    device_id: 4,
    circuit_role: 'عازل ضوئي لحماية دائرة الباور',
    board_location: 'PC901',
    technician_notes: 'استبدال مباشر مع تنظيف مكان الغراء الأسود أسفل البوردة لتجنب التسريب الكهربائي'
  },

  // شاشة Samsung UE32J4000 (BN44-00801A)
  {
    id: 11,
    component_id: 16, // FSFR1700US
    device_id: 6,
    circuit_role: 'مذبذب رنيني لجهود المين ودائرة الإنفرتر',
    board_location: 'ICM801',
    technician_notes: 'في حال تلفه، فحص دايودات الخرج ومكثفات السيراميك الرنينية الزرقاء 1KV'
  },

  // غسالة سامسونج ديجيتال EcoBubble (DC92-01236B)
  {
    id: 12,
    component_id: 12, // LNK304GN
    device_id: 13,
    circuit_role: 'محول التغذية المباشر لكارت الغسالة (Buck Converter)',
    board_location: 'U2',
    technician_notes: 'إلزامي: فحص الملف الخانق L1 1mH، والمقاومة الفيوزية 47Ω 3W، والدايود فائق السرعة UF4007'
  },

  // ميكروويف باناسونيك (F606Y-POWER-BOARD)
  {
    id: 13,
    component_id: 10, // TNY268PN
    device_id: 12,
    circuit_role: 'تغذية شاشة العرض الرقمية والريليهات والميكروكونترولر',
    board_location: 'IC3',
    technician_notes: 'تغيير مكثف التنعيم 10uF 450V إلزامي مع استبدال الآي سي لمنع تكرار الاحتراق'
  },

  // خلاط ومفرمة مولينكس Blendforce
  {
    id: 14,
    component_id: 1, // VIPer12A
    device_id: 10,
    circuit_role: 'تغذية لوحة الكنترول وحساسات الأمان',
    board_location: 'U101',
    technician_notes: 'فحص زينر 18V المتصل بطرف VDD قبل تركيب الآي سي الجديد'
  },

  // كشاف طوارئ Geepas
  {
    id: 15,
    component_id: 1, // VIPer12A
    device_id: 16,
    circuit_role: 'دائرة الشحن والتغذية الرئيسية SMPS',
    board_location: 'IC1',
    technician_notes: 'في حال الاحتراق، فحص المقاومة الفيوزية 10Ω ومكثف 400V والبطارية'
  },

  // طباخ حث كهرومغناطيسي Midea
  {
    id: 16,
    component_id: 25, // H20R1203
    device_id: 14,
    circuit_role: 'ترانزستور IGBT الترددي لملف التسخين الكهرومغناطيسي',
    board_location: 'Q1',
    technician_notes: 'وضع معجون حراري عالي الجودة وتغيير مكثفات البولي بروبلين 0.3uF و 5uF 400V وفحص قنطرة الدايود'
  },

  // إنفرتر طاقة شمسية Torom 1000W
  {
    id: 17,
    component_id: 22, // IRF3205
    device_id: 15,
    circuit_role: 'موسفيتات تقطيع الجهد المستمر 12V لرافع الجهد Push-Pull',
    board_location: 'Q1-Q4',
    technician_notes: 'عند احتراق موسفيت واحد في البنك، يجب استبدال جميع الموسفيتات المتوازية معاً مع مقاومات الـ Gate 10Ω'
  },

  // صب ووفر Microlab M-108
  {
    id: 18,
    component_id: 37, // TDA2030A
    device_id: 17,
    circuit_role: 'مضخم الصوت لقناة الباص وسماعات اليمين واليسار',
    board_location: 'IC1-IC3',
    technician_notes: 'يمكن ترقيته بـ TDA2050 أو LM1875 لصوت أقوى وأنقى دون تعديل بالأطراف'
  }
];

export const INITIAL_EQUIVALENTS: Equivalent[] = [
  // --- بدائل مباشرة Drop-In ---
  {
    id: 1,
    original_id: 1, // VIPer12A
    substitute_id: 2, // VIPer22A
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر (Drop-in): VIPer22A يتحمل تيار وقدرة أعلى من VIPer12A دون أي تعديل بالأطراف، وهو الحل الموصى به لتقليل السخونة.'
  },
  {
    id: 2,
    original_id: 4, // OB2269CP
    substitute_id: 5, // OB2268CP
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر بنسبة 100%: تطابق كامل في الأطراف (Pin-to-Pin) ووظائف الحماية وتردد العمل 65kHz.'
  },
  {
    id: 3,
    original_id: 5, // OB2268CP
    substitute_id: 4, // OB2269CP
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر متطابق في التوصيل SOP-8.'
  },
  {
    id: 4,
    original_id: 6, // LD7535
    substitute_id: 7, // OB2263
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر متطابق في الأطراف SOT-23-6 والتردد، يستخدم بكثرة في بوردات الشاشات الـ Combo.'
  },
  {
    id: 5,
    original_id: 7, // OB2263
    substitute_id: 6, // LD7535
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر 100% لـ OB2263 في شاشات التلفاز الصينية والشواحن.'
  },
  {
    id: 6,
    original_id: 10, // TNY268PN
    substitute_id: 11, // TNY277PN
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر بقدرة واط أكبر، تطابق كامل في أرجل الـ DIP-8 مع كفاءة أفضل في وضع الستاندباي.'
  },
  {
    id: 7,
    original_id: 16, // FSFR1700US
    substitute_id: 17, // FSFR1800US
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر بقدرة أمبير أكبر 260W مقابل 200W، يركب فوراً ويقلل السخونة في شاشات سامسونج.'
  },
  {
    id: 8,
    original_id: 19, // 7N65
    substitute_id: 20, // 10N65
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر ذو كفاءة أعلى: 10N65 يتحمل تيار 10A مقابل 7A، يقلل سخونة الشاسيه ويطيل عمر لوحة الباور.'
  },
  {
    id: 9,
    original_id: 20, // 10N65
    substitute_id: 21, // 12N65
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر ذو تحمل أعلى 12A، مناسب جداً عند ترقية شاشات 43 بوصة وما فوق.'
  },
  {
    id: 10,
    original_id: 22, // IRF3205
    substitute_id: 23, // IRFB3206
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر ذو كفاءة أعلى: IRFB3206 يمتلك مقاومة داخلية أقل Rds(on) وتحمل تيار أعلى 120A مقابل 110A.'
  },
  {
    id: 11,
    original_id: 28, // PC817
    substitute_id: 29, // EL817
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر متطابق 100%: تطابق كامل في نسبة نقل التيار CTR وعزل الجهد 5000V.'
  },
  {
    id: 12,
    original_id: 29, // EL817
    substitute_id: 28, // PC817
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر متبادل تماماً.'
  },
  {
    id: 13,
    original_id: 35, // MBR20100CT
    substitute_id: 36, // MBR20200CT
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر بتحمل جهد أعلى 200V مقابل 100V، يمنع تلف الدايود الناتج عن النبضات الراجعة.'
  },
  {
    id: 14,
    original_id: 37, // TDA2030A
    substitute_id: 38, // TDA2050
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر مميز: TDA2050 يعطي قدرة صوتية 32 واط ونقاء أعلى على نفس التوصيلات TO-220-5.'
  },
  {
    id: 15,
    original_id: 37, // TDA2030A
    substitute_id: 39, // LM1875
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر عالي الدقة Hi-Fi: LM1875 متطابق في الأطراف تماماً مع تشويه صوتي أقل بكثير.'
  },
  {
    id: 16,
    original_id: 14, // TOP247YN
    substitute_id: 15, // TOP249YN
    equivalence_type: 'Direct_Drop_In',
    modification_instructions: 'بديل مباشر لنفس السلسلة بقدرة واط أكبر، يركب على نفس مشتت التبريد TO-220-7.'
  },

  // --- بدائل مع تعديل فني Requires Modification ---
  {
    id: 17,
    original_id: 1, // VIPer12A
    substitute_id: 8, // DK124
    equivalence_type: 'Requires_Modification',
    modification_instructions: 'يتطلب تعديل أطراف: آي سي DK124 يختلف في ترتيب أطراف Drain و VDD و Feedback. يلزم قطع خط البوردة لطرف 4 و 5 وعكس التوصيل مع مراجعة مخطط الداتا شيت.'
  },
  {
    id: 18,
    original_id: 30, // 7805
    substitute_id: 34, // LM2596S-5.0
    equivalence_type: 'Requires_Modification',
    modification_instructions: 'تعديل تقني مفضل: LM2596S خافض سويتشينج يتطلب ملف خارجي 33uH ومكثف ودايود شوتكي، ويعطي حرارة شبه معدومة مقارنة بـ 7805 الخطي.'
  },
  {
    id: 19,
    original_id: 12, // LNK304GN
    substitute_id: 13, // LNK304PN
    equivalence_type: 'Requires_Modification',
    modification_instructions: 'تعديل تغليف (SMD إلى DIP): يتم ثني وتطويل أرجل نسخة الـ DIP-8 لتلحيمها على مسارات الـ SMD السطحية في كروت الغسالات عند عدم توفر النسخة السطحية.'
  }
];

// ==========================================
// 5. إعدادات ورشة الصيانة الافتراضية
// ==========================================
export const INITIAL_SETTINGS: WorkshopSettings = {
  shopName: 'المتحكمات الكهربائية',
  subTitle: 'لصيانة الأجهزة والمتحكمات الإلكترونية وبدائل القطع',
  phone: '+218 91 123 4567',
  address: 'شارع الصناعة - عمارة النور للإلكترونيات - الطابق الأرضي',
  currency: 'د.ل',
  invoiceFooterNote: 'القطع الإلكترونية المباعة تخضع للفحص المباشر قبل الاستلام • كفالة الصيانة 15 يوماً على نفس العطل المشخص',
  warrantyTerms: 'يرجى إبراز رقم السند عند الاستلام. لا يشمل الضمان التلف الناتج عن سوء الاستخدام أو التذبذب الكهربائي الحاد أو كسر البوردة.'
};

// ==========================================
// 6. قائمة العملاء الافتراضية
// ==========================================
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 1,
    name: 'عميل نقدي / عام',
    phone: '—',
    address: 'مباشر في المحل',
    notes: 'مبيعات نقدية سريعة وزبائن واجهة المحل',
    createdAt: '2026-01-15'
  },
  {
    id: 2,
    name: 'م. أحمد السعدي',
    phone: '0770 112 3344',
    address: 'بغداد - الكرادة',
    notes: 'فني صيانة شاشات وأجهزة منزلية معتاد',
    createdAt: '2026-02-10'
  },
  {
    id: 3,
    name: 'ورشة الأمل للأنظمة والتكييف',
    phone: '0780 998 7766',
    address: 'البصرة - حي الجزائر',
    notes: 'إصلاح كروت مكيفات سبليت وإنفرتر',
    createdAt: '2026-02-20'
  },
  {
    id: 4,
    name: 'الأستاذ حيدر الموسوي',
    phone: '0750 443 2211',
    address: 'النجف الأشرف - حي السعد',
    notes: 'صيانة كارت غسالة ومجفف أوتوماتيك',
    createdAt: '2026-03-05'
  }
];

// ==========================================
// 7. قائمة الموردين الافتراضية
// ==========================================
export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 1,
    name: 'شركة النور للتجهيزات والقطع الإلكترونية',
    company: 'Al-Noor Electronics Co.',
    phone: '0771 888 9900',
    address: 'شارع الصناعة - مجمع الرواد التجاري',
    notes: 'مورد معتمد لمتحكمات SMPS والآيسيهات الأصلية',
    createdAt: '2026-01-01'
  },
  {
    id: 2,
    name: 'توريدات دبي للترانزستور والمكثفات',
    company: 'Dubai Tech Components',
    phone: '0782 555 4433',
    address: 'شارع الرشيد - ساحة الوثبة',
    notes: 'توريد ترانزستورات MOSFET و IGBT ودايودات شوتكي',
    createdAt: '2026-01-10'
  },
  {
    id: 3,
    name: 'الرواد للميكروكنترولر والمبرمجات',
    company: 'Al-Rowad Microcontrollers',
    phone: '0750 111 2233',
    address: 'أربيل - مجمع تكنولوجيا المعلومات',
    notes: 'توريد وحدات ATmega والمبرمجات CH341 و RT809H',
    createdAt: '2026-02-01'
  }
];

// ==========================================
// 7.5. قائمة مهندسي وفنيي الصيانة الافتراضية
// ==========================================
export const INITIAL_TECHNICIANS: Technician[] = [
  {
    id: 1,
    name: 'م. سرمد الكرخي',
    phone: '0770 123 9988',
    specialty: 'دوائر التغذية SMPS وشاشات العرض الذكية LED',
    notes: 'خبير في فحص وتعديل آيسيهات الباور ومساطر الليد والتغذية النبضية',
    createdAt: '2026-01-01'
  },
  {
    id: 2,
    name: 'م. علي البصري',
    phone: '0780 445 6677',
    specialty: 'كروت التكييف والسبليت والإنفرتر',
    notes: 'متخصص في تشخيص أكواد الأعطال E1-E6 ودوائر المروحة ومحركات BLDC',
    createdAt: '2026-01-15'
  },
  {
    id: 3,
    name: 'م. عمر الليبي',
    phone: '091 234 5678',
    specialty: 'كروت الغسالات الأوتوماتيك والإنفرتر المنزلي',
    notes: 'صيانة كروت الغسالات الدايركت درايف وبوردات التحكم الرقمية',
    createdAt: '2026-02-01'
  }
];

// ==========================================
// 8. فواتير المشتريات وتوريد المخزون الافتراضية
// ==========================================
export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 1,
    invoiceNumber: 'PUR-2026-0101',
    supplierId: 1,
    supplierName: 'شركة النور للتجهيزات والقطع الإلكترونية',
    date: '2026-03-01',
    totalAmount: 166,
    paidAmount: 166,
    paymentStatus: 'paid',
    notes: 'توريد شحنة جديدة من آيسيهات الباور VIPer و OB2269 (مسددة بالكامل نقدياً)',
    items: [
      { id: 1, purchaseId: 1, componentId: 1, partNumber: 'VIPer12A', quantity: 15, unitCost: 6, salePrice: 12, totalCost: 90 },
      { id: 2, purchaseId: 1, componentId: 2, partNumber: 'VIPer22A', quantity: 10, unitCost: 7, salePrice: 15, totalCost: 70 },
      { id: 3, purchaseId: 1, componentId: 4, partNumber: 'OB2269CP', quantity: 1, unitCost: 6, salePrice: 14, totalCost: 6 },
    ]
  },
  {
    id: 2,
    invoiceNumber: 'PUR-2026-0102',
    supplierId: 2,
    supplierName: 'توريدات دبي للترانزستور والمكثفات',
    date: '2026-03-15',
    totalAmount: 216,
    paidAmount: 100,
    paymentStatus: 'partial',
    notes: 'توريد مكثفات ضغط عالي وموسفت FQP10N60C (دفعة 100 د.ل والمتبقي بذمتنا 116 د.ل)',
    items: [
      { id: 4, purchaseId: 2, componentId: 27, partNumber: '100uF/450V', quantity: 12, unitCost: 8, salePrice: 15, totalCost: 96 },
      { id: 5, purchaseId: 2, componentId: 21, partNumber: 'FQP10N60C', quantity: 10, unitCost: 12, salePrice: 20, totalCost: 120 },
    ]
  }
];

// ==========================================
// 9. عمليات المبيعات (المباشرة والمرتبطة بالصيانة) بالدينار الليبي د.ل
// ==========================================
export const INITIAL_SALES: Sale[] = [
  // 1. مبيعات مباشرة (بيع قطع إلكترونية بدون صيانة)
  {
    id: 1,
    invoiceNumber: 'INV-2026-001',
    saleType: 'direct',
    customerId: 1,
    customerName: 'عميل نقدي / عام',
    customerPhone: '—',
    date: '2026-03-18',
    items: [
      { id: 1, componentId: 1, partNumber: 'VIPer12A', quantity: 2, unitPrice: 12, unitCost: 6, totalPrice: 24, totalCost: 12 },
      { id: 2, componentId: 19, partNumber: 'PC817', quantity: 3, unitPrice: 3, unitCost: 1, totalPrice: 9, totalCost: 3 },
    ],
    partsTotal: 33,
    discount: 0,
    totalAmount: 33,
    totalCost: 15,
    profit: 18,
    paidAmount: 33,
    paymentStatus: 'paid',
    notes: 'شراء مباشر لقطع صيانة باور سبلاي'
  },
  {
    id: 2,
    invoiceNumber: 'INV-2026-002',
    saleType: 'direct',
    customerId: 2,
    customerName: 'م. أحمد السعدي',
    customerPhone: '091 112 3344',
    date: '2026-03-22',
    items: [
      { id: 3, componentId: 21, partNumber: 'FQP10N60C', quantity: 2, unitPrice: 20, unitCost: 12, totalPrice: 40, totalCost: 24 },
      { id: 4, componentId: 7, partNumber: 'UC3842B', quantity: 1, unitPrice: 10, unitCost: 5, totalPrice: 10, totalCost: 5 },
    ],
    partsTotal: 50,
    discount: 5,
    totalAmount: 45,
    totalCost: 29,
    profit: 16,
    paidAmount: 45,
    paymentStatus: 'paid',
    notes: 'خصم خاص لفني صيانة معتمد'
  },

  // 2. مبيعات مرتبطة بعملية صيانة متكاملة
  {
    id: 3,
    invoiceNumber: 'MNT-2026-001',
    saleType: 'maintenance',
    customerId: 4,
    customerName: 'الأستاذ حيدر الموسوي',
    customerPhone: '092 443 2211',
    date: '2026-03-25',
    maintenance: {
      deviceType: 'كارت غسالة أوتوماتيك',
      brand: 'LG',
      modelOrBoard: 'Inverter Direct Drive - EBR7894',
      serialOrChassis: 'SN-LG-88721',
      faultDescription: 'الجهاز قاطع كهرباء تماماً، انفجار في دائرة التغذية الخافضة LNK304 وتلف مقاومة الفيوز ومكثف الترشيح',
      technicianName: 'م. سرمد الكرخي',
      technicianFee: 95, // أجرة الفني والتركيب بالدينار الليبي
      extraServicesDescription: 'تنظيف كيميائي للبوردة وإعادة لحام حراري وقائي لمسارات الباور ومراجعة ريليهات الموتور',
      extraServicesFee: 20, // رسوم خدمات إضافية على العميل
      extraExpensesCost: 5, // تكلفة المواد المستخدمة
      status: 'delivered',
      receivedDate: '2026-03-24',
      deliveryDate: '2026-03-25'
    },
    items: [
      { id: 5, componentId: 12, partNumber: 'LNK304GN', quantity: 1, unitPrice: 20, unitCost: 8, totalPrice: 20, totalCost: 8 },
      { id: 6, componentId: 27, partNumber: '100uF/450V', quantity: 1, unitPrice: 15, unitCost: 6, totalPrice: 15, totalCost: 6 },
    ],
    partsTotal: 35,
    discount: 0,
    totalAmount: 150, // 35 قطع + 95 أجرة + 20 خدمات
    totalCost: 19,   // 14 تكلفة قطع + 5 مصاريف
    profit: 131,     // 150 - 19
    paidAmount: 150,
    paymentStatus: 'paid',
    notes: 'تم فحص الكارت على طاولة الاختبار بنجاح وتسليمه للعميل مع ضمان 15 يوماً'
  },
  {
    id: 4,
    invoiceNumber: 'MNT-2026-002',
    saleType: 'maintenance',
    customerId: 3,
    customerName: 'ورشة الأمل للأنظمة والتكييف',
    customerPhone: '091 998 7766',
    date: '2026-03-28',
    maintenance: {
      deviceType: 'كارت مكيف سبليت إنفرتر',
      brand: 'Media (ميديا)',
      modelOrBoard: 'CE-KFR35GW/I1Y',
      serialOrChassis: 'MD-2023-4410',
      faultDescription: 'ظهور كود خطأ E1 على الشاشة، توقف التغذية النبضية بسبب شورت في آي سي VIPer22A ودايود الفوتوكبلر',
      technicianName: 'م. علي البصري',
      technicianFee: 75,
      extraServicesDescription: 'فحص مجهري لمقاومات الـ SMD وقياس استقرار الفولتيات 12V و 5V بالأوسيلوسكوب',
      extraServicesFee: 20,
      extraExpensesCost: 2,
      status: 'ready',
      receivedDate: '2026-03-27'
    },
    items: [
      { id: 7, componentId: 2, partNumber: 'VIPer22A', quantity: 1, unitPrice: 15, unitCost: 7, totalPrice: 15, totalCost: 7 },
      { id: 8, componentId: 19, partNumber: 'PC817', quantity: 1, unitPrice: 4, unitCost: 1, totalPrice: 4, totalCost: 1 },
    ],
    partsTotal: 19,
    discount: 0,
    totalAmount: 114, // 19 قطع + 75 أجرة + 20 خدمات
    totalCost: 10,   // 8 تكلفة قطع + 2 مصاريف
    profit: 104,
    paidAmount: 60,
    paymentStatus: 'partial',
    notes: 'تم استلام عربون 60 د.ل، والمتبقي 54 د.ل عند الاستلام'
  },
  {
    id: 5,
    invoiceNumber: 'MNT-2026-003',
    saleType: 'maintenance',
    customerId: 2,
    customerName: 'م. أحمد السعدي',
    customerPhone: '091 112 3344',
    date: '2026-04-02',
    maintenance: {
      deviceType: 'شاشة تلفزيون 55 بوصة LED',
      brand: 'Samsung',
      modelOrBoard: 'UA55NU7100 - كارت باور L55E7_KHS',
      serialOrChassis: 'SM-55-90112',
      faultDescription: 'شورت في مرحلة التقطيع الرئيسية PFC، تلف ترانزستور الموسفت FQP10N60C وآي سي التحكم OB2269CP',
      technicianName: 'م. سرمد الكرخي',
      technicianFee: 110,
      extraServicesDescription: 'تعديل حماية تيار مسطرة الليدات (Current Limiter Modification) لتقليل إجهاد الباور وتطويل عمر الشاشة',
      extraServicesFee: 35,
      extraExpensesCost: 8,
      status: 'under_repair',
      receivedDate: '2026-04-02'
    },
    items: [
      { id: 9, componentId: 21, partNumber: 'FQP10N60C', quantity: 1, unitPrice: 24, unitCost: 12, totalPrice: 24, totalCost: 12 },
      { id: 10, componentId: 4, partNumber: 'OB2269CP', quantity: 1, unitPrice: 14, unitCost: 6, totalPrice: 14, totalCost: 6 },
    ],
    partsTotal: 38,
    discount: 0,
    totalAmount: 183, // 38 قطع + 110 أجرة + 35 خدمات
    totalCost: 26,   // 18 تكلفة قطع + 8 مصاريف
    profit: 157,
    paidAmount: 0,
    paymentStatus: 'unpaid',
    notes: 'الجهاز قيد الصيانة والاختبار الحراري على طاولة الورشة'
  }
];

