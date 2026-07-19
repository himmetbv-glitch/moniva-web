/**
 * Managed page section datalarına _i18n: { en, ru, ar } partial override ekler.
 * TR alanları root'ta kalır (default). EN/RU/AR sadece görünür metin alanlarını override eder.
 *
 * Kullanım:
 *   npx tsx prisma/import/managed-pages-i18n.ts
 *
 * Idempotent: her koşuşta mevcut _i18n'ı yeniden yazar (üstüne bindirir).
 */
import { prisma } from "@/lib/prisma";

// pageKey → sectionKey → _i18n bloğu
type LocOverride = Record<string, unknown>;
type SectionI18n = { en: LocOverride; ru: LocOverride; ar: LocOverride };
type Payload = Record<string, Record<string, SectionI18n>>;

const PAYLOAD: Payload = {
  // ============================================================
  // ABOUT (6 section)
  // ============================================================
  about: {
    hero: {
      en: {
        lead: "Since 1999 Moniva has supplied fleet operators, distributors and service centers in the heavy-duty and trailer industry with OEM-grade spare parts — from our Konya headquarters to more than 80 markets.",
        title: "Built with trust.\nDelivered with precision.",
        eyebrow: "Our Story",
        crumbLabel: "About",
        stats: [
          { l: "Founded", v: "1999" },
          { l: "Export Markets", v: "80+" },
          { l: "Team Members", v: "240" },
        ],
      },
      ru: {
        lead: "С 1999 года Moniva поставляет автопаркам, дистрибьюторам и сервисным центрам в отрасли тяжёлых грузовиков и прицепов запасные части OEM-качества — из штаб-квартиры в Конье более чем в 80 стран.",
        title: "Построено с доверием.\nДоставлено с точностью.",
        eyebrow: "Наша история",
        crumbLabel: "О нас",
        stats: [
          { l: "Основано", v: "1999" },
          { l: "Экспортных рынков", v: "80+" },
          { l: "Сотрудников", v: "240" },
        ],
      },
      ar: {
        lead: "منذ عام 1999، تزوّد Moniva مشغّلي الأساطيل والموزّعين ومراكز الخدمة في قطاع المركبات الثقيلة والمقطورات بقطع غيار بجودة OEM — من مقرّنا في قونيا إلى أكثر من 80 سوقاً.",
        title: "مبنيّ بالثقة.\nيُسلَّم بدقّة.",
        eyebrow: "قصّتنا",
        crumbLabel: "من نحن",
        stats: [
          { l: "تأسّست", v: "1999" },
          { l: "سوق تصدير", v: "+80" },
          { l: "أعضاء الفريق", v: "240" },
        ],
      },
    },
    facility: {
      en: {
        body: "Our 12,000 m² warehouse in Konya Selçuklu holds over 50,000 SKUs across eight automated picking lines. Quality control, packing and shipping happen under one roof — enabling us to guarantee 24-hour dispatch on 92% of stocked parts.",
        title: "One facility. End-to-end control.",
        caption: "KONYA HEADQUARTERS · SELÇUKLU",
        eyebrow: "Inside Moniva",
        stats: [
          { l: "Warehouse area", v: "12,000 m²" },
          { l: "Automated picking lines", v: "8" },
          { l: "Products (SKUs)", v: "50,000+" },
        ],
      },
      ru: {
        body: "Наш склад площадью 12 000 м² в Селчуклу (Конья) содержит более 50 000 SKU на восьми автоматизированных линиях сборки заказов. Контроль качества, упаковка и отгрузка выполняются под одной крышей — что позволяет гарантировать отгрузку 92% товаров со склада в течение 24 часов.",
        title: "Одна площадка. Полный контроль.",
        caption: "ГЛАВНЫЙ ОФИС В КОНЬЕ · СЕЛЧУКЛУ",
        eyebrow: "Внутри Moniva",
        stats: [
          { l: "Складская площадь", v: "12 000 м²" },
          { l: "Автоматических линий", v: "8" },
          { l: "Товаров (SKU)", v: "50 000+" },
        ],
      },
      ar: {
        body: "يحتوي مستودعنا البالغة مساحته 12,000 م² في سلجوقلو-قونيا على أكثر من 50,000 صنف موزّعة على ثمانية خطوط انتقاء آليّة. تتم مراقبة الجودة والتعبئة والشحن تحت سقف واحد — ما يمكّننا من ضمان الشحن خلال 24 ساعة لـ 92% من القطع المتوفّرة في المخزون.",
        title: "منشأة واحدة. تحكّم شامل.",
        caption: "المقر الرئيسي في قونيا · سلجوقلو",
        eyebrow: "داخل Moniva",
        stats: [
          { l: "مساحة المستودع", v: "12,000 م²" },
          { l: "خطوط انتقاء آليّة", v: "8" },
          { l: "منتج (SKU)", v: "+50,000" },
        ],
      },
    },
    mv: {
      en: {
        columns: [
          {
            tag: "Mission",
            body: "We source, stock and ship the right part, the right way. We bridge OEM manufacturers and the service networks that depend on them — removing friction at every step, from quote to delivery.",
            title: "Keeping the world's commercial fleets in motion.",
          },
          {
            tag: "Vision",
            body: "By 2030 Moniva will be the first name that comes to mind for verified spare parts across Europe, the Middle East, Central Asia and North Africa — known for technical depth and 24-hour reliability.",
            title: "The reference name in heavy-duty spare parts.",
          },
        ],
      },
      ru: {
        columns: [
          {
            tag: "Миссия",
            body: "Мы находим, храним и отгружаем нужную деталь правильным способом. Мы соединяем производителей OEM и сервисные сети, которые от них зависят — устраняя трения на каждом этапе, от запроса до доставки.",
            title: "Обеспечиваем движение коммерческих автопарков мира.",
          },
          {
            tag: "Видение",
            body: "К 2030 году Moniva станет первым именем, которое приходит на ум при упоминании проверенных запасных частей в Европе, на Ближнем Востоке, в Центральной Азии и Северной Африке — известным за техническую глубину и 24-часовую надёжность.",
            title: "Эталонное имя в запасных частях для тяжёлой техники.",
          },
        ],
      },
      ar: {
        columns: [
          {
            tag: "الرسالة",
            body: "نحن نُوفّر ونخزّن ونشحن القطعة الصحيحة بالطريقة الصحيحة. نبني جسراً بين مصنّعي OEM وشبكات الخدمة التي تعتمد عليهم — مزيلين الاحتكاك في كل خطوة، من عرض السعر إلى التسليم.",
            title: "الحفاظ على حركة الأساطيل التجاريّة في العالم.",
          },
          {
            tag: "الرؤية",
            body: "بحلول عام 2030 ستكون Moniva الاسم الأوّل الذي يخطر بالبال لقطع الغيار المعتمَدة عبر أوروبا والشرق الأوسط وآسيا الوسطى وشمال إفريقيا — معروفةً بعمقها التقنيّ وموثوقيّة 24 ساعة.",
            title: "الاسم المرجعيّ في قطع غيار المركبات الثقيلة.",
          },
        ],
      },
    },
    timeline: {
      en: {
        title: "27 years on the road.",
        eyebrow: "Milestones",
        entries: [
          { year: "1999", title: "Founded in Konya", body: "Started as a brake component distributor for Turkish trailer manufacturers." },
          { year: "2006", title: "First export contract", body: "Signed a long-term supply agreement with a German fleet operator." },
          { year: "2012", title: "Warehouse expansion", body: "Moved to a 12,000 m² facility with fully automated picking lines." },
          { year: "2018", title: "ISO 9001:2015", body: "Quality systems re-certified. Full traceability across all products." },
          { year: "2021", title: "Reached 50,000 SKUs", body: "Air suspension and electrical groups added — covering all major truck OEMs." },
          { year: "2026", title: "80+ markets", body: "Authorized distributor network now spans three continents." },
        ],
      },
      ru: {
        title: "27 лет в пути.",
        eyebrow: "Вехи",
        entries: [
          { year: "1999", title: "Основана в Конье", body: "Начали как дистрибьютор тормозных компонентов для турецких производителей прицепов." },
          { year: "2006", title: "Первый экспортный контракт", body: "Подписано долгосрочное соглашение о поставках с немецким автопарком." },
          { year: "2012", title: "Расширение склада", body: "Переезд в объект площадью 12 000 м² с полностью автоматизированными линиями сборки." },
          { year: "2018", title: "ISO 9001:2015", body: "Системы качества ресертифицированы. Полная прослеживаемость всех продуктов." },
          { year: "2021", title: "Достигли 50 000 SKU", body: "Добавлены группы пневмоподвески и электрики — охват всех крупных OEM грузовиков." },
          { year: "2026", title: "80+ рынков", body: "Сеть официальных дистрибьюторов теперь охватывает три континента." },
        ],
      },
      ar: {
        title: "27 عاماً على الطريق.",
        eyebrow: "المحطّات",
        entries: [
          { year: "1999", title: "التأسيس في قونيا", body: "بدأنا كموزّع لمكوّنات الفرامل لمصنّعي المقطورات الأتراك." },
          { year: "2006", title: "أوّل عقد تصدير", body: "توقيع اتّفاقيّة توريد طويلة الأمد مع مشغّل أسطول ألماني." },
          { year: "2012", title: "توسيع المستودع", body: "الانتقال إلى منشأة بمساحة 12,000 م² مع خطوط انتقاء آليّة بالكامل." },
          { year: "2018", title: "ISO 9001:2015", body: "إعادة اعتماد أنظمة الجودة. تتبّع كامل لجميع المنتجات." },
          { year: "2021", title: "وصلنا إلى 50,000 صنف", body: "أُضيفت مجموعات التعليق الهوائي والكهرباء — لتشمل جميع مصنّعي الشاحنات الرئيسيّين." },
          { year: "2026", title: "أكثر من 80 سوقاً", body: "شبكة الموزّعين المعتمَدين تمتدّ الآن عبر ثلاث قارّات." },
        ],
      },
    },
    certs: {
      en: {
        title: "Certified to international standards.",
        eyebrow: "Quality & Compliance",
        certs: [
          { code: "ISO 9001:2015", body: "Certified quality management system across sourcing, warehousing and shipping operations." },
          { code: "ECE R90", body: "All brake components comply with UN/ECE Regulation 90 for replacement brake parts." },
          { code: "TS EN ISO 14001", body: "Environmental management system — waste reduction, recycling and energy efficiency." },
          { code: "AEO-S", body: "Authorised Economic Operator status for expedited customs clearance across the EU." },
        ],
      },
      ru: {
        title: "Сертифицировано по международным стандартам.",
        eyebrow: "Качество и соответствие",
        certs: [
          { code: "ISO 9001:2015", body: "Сертифицированная система менеджмента качества по всем операциям снабжения, хранения и отгрузки." },
          { code: "ECE R90", body: "Все тормозные компоненты соответствуют Правилам ООН/ЕЭК № 90 для запасных тормозных частей." },
          { code: "TS EN ISO 14001", body: "Система экологического менеджмента — сокращение отходов, переработка и энергоэффективность." },
          { code: "AEO-S", body: "Статус уполномоченного экономического оператора для ускоренного таможенного оформления в ЕС." },
        ],
      },
      ar: {
        title: "معتمَد وفق المعايير الدوليّة.",
        eyebrow: "الجودة والامتثال",
        certs: [
          { code: "ISO 9001:2015", body: "نظام إدارة جودة معتمَد يشمل عمليّات التوريد والتخزين والشحن." },
          { code: "ECE R90", body: "جميع مكوّنات الفرامل تتوافق مع لائحة الأمم المتّحدة/ECE رقم 90 لقطع غيار الفرامل." },
          { code: "TS EN ISO 14001", body: "نظام إدارة بيئيّ — تقليل النفايات وإعادة التدوير وكفاءة الطاقة." },
          { code: "AEO-S", body: "وضع المُشغّل الاقتصاديّ المعتمَد لتخليص جمركيّ مُعجَّل في جميع أنحاء الاتّحاد الأوروبي." },
        ],
      },
    },
    cta: {
      en: {
        body: "We host fleet operators and distributors at our Konya facility every week. Write to us — let's arrange a tour for you.",
        title: "Visit us in Konya or reach out to our export team",
        eyebrow: "Get in Touch",
        primaryLabel: "Explore Products ▶",
        secondaryLabel: "Contact Export Team",
        contacts: [
          { icon: "✉", label: "Email", value: "export@moniva.com.tr" },
          { icon: "✆", label: "Phone", value: "+90 332 239 03 05" },
          { icon: "◎", label: "Location", value: "Konya, Türkiye" },
        ],
      },
      ru: {
        body: "Мы принимаем автопарки и дистрибьюторов на нашем объекте в Конье каждую неделю. Напишите нам — организуем для вас экскурсию.",
        title: "Посетите нас в Конье или свяжитесь с нашей экспортной командой",
        eyebrow: "Связаться",
        primaryLabel: "Изучить продукцию ▶",
        secondaryLabel: "Написать экспортной команде",
        contacts: [
          { icon: "✉", label: "Email", value: "export@moniva.com.tr" },
          { icon: "✆", label: "Телефон", value: "+90 332 239 03 05" },
          { icon: "◎", label: "Местоположение", value: "Конья, Турция" },
        ],
      },
      ar: {
        body: "نستقبل مشغّلي الأساطيل والموزّعين في منشأتنا بقونيا كل أسبوع. اكتب لنا — لنُنظّم لك جولة.",
        title: "زُرنا في قونيا أو تواصل مع فريق التصدير لدينا",
        eyebrow: "تواصل معنا",
        primaryLabel: "استكشف المنتجات ▶",
        secondaryLabel: "راسل فريق التصدير",
        contacts: [
          { icon: "✉", label: "البريد الإلكترونيّ", value: "export@moniva.com.tr" },
          { icon: "✆", label: "الهاتف", value: "+90 332 239 03 05" },
          { icon: "◎", label: "الموقع", value: "قونيا، تركيا" },
        ],
      },
    },
  },

  // ============================================================
  // CAREERS (1 section)
  // ============================================================
  careers: {
    info: {
      en: {
        lead: "We supply commercial vehicle components to fleet operators in 80+ countries. Send your details — we review every application and respond within two weeks.",
        stats: [
          { l: "Team members", v: "240+" },
          { l: "Nationalities", v: "12" },
          { l: "In the industry", v: "25 years" },
          { l: "Countries served", v: "80+" },
        ],
        emailPre: "Send your CV directly to",
        emailPost: "",
        titleRest: " join the team behind the truck parts.",
        crumbLabel: "Careers",
        emailLabel: "Prefer email?",
        titleAccent: "50,000+",
      },
      ru: {
        lead: "Мы поставляем компоненты коммерческого транспорта автопаркам в 80+ странах. Отправьте свои данные — мы рассматриваем каждую заявку и отвечаем в течение двух недель.",
        stats: [
          { l: "Сотрудников", v: "240+" },
          { l: "Национальностей", v: "12" },
          { l: "В отрасли", v: "25 лет" },
          { l: "Обслуживаемых стран", v: "80+" },
        ],
        emailPre: "Отправьте резюме напрямую на",
        emailPost: "",
        titleRest: " присоединяйтесь к команде за грузовыми запчастями.",
        crumbLabel: "Карьера",
        emailLabel: "Предпочитаете email?",
        titleAccent: "50 000+",
      },
      ar: {
        lead: "نُزوّد مشغّلي الأساطيل في أكثر من 80 دولةً بمكوّنات المركبات التجاريّة. أرسل بياناتك — نراجع كل طلب ونردّ خلال أسبوعين.",
        stats: [
          { l: "أعضاء الفريق", v: "+240" },
          { l: "جنسيّة", v: "12" },
          { l: "في القطاع", v: "25 سنة" },
          { l: "دولة نخدمها", v: "+80" },
        ],
        emailPre: "أرسل سيرتك الذاتيّة مباشرةً إلى",
        emailPost: "",
        titleRest: " انضمّ إلى الفريق وراء قطع الشاحنات.",
        crumbLabel: "الوظائف",
        emailLabel: "تُفضّل البريد الإلكترونيّ؟",
        titleAccent: "+50,000",
      },
    },
  },

  // ============================================================
  // CONTACT (5 section)
  // ============================================================
  contact: {
    hero: {
      en: {
        lead: "Request a quote, technical support or become a distributor — our team responds within 4 business hours, Monday to Friday.",
        stats: [
          { l: "Avg. response time", v: "4 h" },
          { l: "Supported languages", v: "3" },
        ],
        title: "Talk to our team.",
        eyebrow: "Get in Touch",
        crumbLabel: "Contact",
      },
      ru: {
        lead: "Запросите предложение, техническую поддержку или станьте дистрибьютором — наша команда отвечает в течение 4 рабочих часов с понедельника по пятницу.",
        stats: [
          { l: "Среднее время ответа", v: "4 ч" },
          { l: "Поддерживаемые языки", v: "3" },
        ],
        title: "Свяжитесь с нашей командой.",
        eyebrow: "Связаться",
        crumbLabel: "Контакты",
      },
      ar: {
        lead: "اطلب عرض سعر أو دعماً تقنيّاً أو انضمّ كموزّع — يردّ فريقنا خلال 4 ساعات عمل من الاثنين إلى الجمعة.",
        stats: [
          { l: "متوسّط زمن الردّ", v: "4 س" },
          { l: "اللغات المدعومة", v: "3" },
        ],
        title: "تحدّث مع فريقنا.",
        eyebrow: "تواصل معنا",
        crumbLabel: "اتّصل بنا",
      },
    },
    info: {
      en: {
        eyebrow: "Headquarters",
        emailLabel: "Email",
        hoursLabel: "Working hours",
        hoursLines: [
          "Monday – Friday: 08:00 – 18:00",
          "Saturday: 09:00 – 14:00",
          "Sunday: Closed",
        ],
        phoneLabel: "Phone",
        companyName: "MONIVA Automotive & Food\nInd. Trade Inc.",
        addressLabel: "Address",
        addressLines: [
          "Konya Organized Industrial Zone",
          "Küçükıldız Sokak No:6 PK.42050",
          "Selçuklu / Konya, TÜRKİYE",
        ],
      },
      ru: {
        eyebrow: "Главный офис",
        emailLabel: "Email",
        hoursLabel: "Рабочее время",
        hoursLines: [
          "Понедельник – Пятница: 08:00 – 18:00",
          "Суббота: 09:00 – 14:00",
          "Воскресенье: закрыто",
        ],
        phoneLabel: "Телефон",
        companyName: "MONIVA Otomotiv ve Gıda\nSan. Tic. A.Ş.",
        addressLabel: "Адрес",
        addressLines: [
          "Организованная промышленная зона Конья",
          "Küçükıldız Sokak No:6 PK.42050",
          "Селчуклу / Конья, ТУРЦИЯ",
        ],
      },
      ar: {
        eyebrow: "المقر الرئيسي",
        emailLabel: "البريد الإلكترونيّ",
        hoursLabel: "ساعات العمل",
        hoursLines: [
          "الاثنين – الجمعة: 08:00 – 18:00",
          "السبت: 09:00 – 14:00",
          "الأحد: مُغلَق",
        ],
        phoneLabel: "الهاتف",
        companyName: "MONIVA Otomotiv ve Gıda\nSan. Tic. A.Ş.",
        addressLabel: "العنوان",
        addressLines: [
          "المنطقة الصناعيّة المنظّمة في قونيا",
          "Küçükıldız Sokak No:6 PK.42050",
          "سلجوقلو / قونيا، تركيا",
        ],
      },
    },
    quick: {
      en: {
        tiles: [
          { sub: "For quotes & orders", icon: "✉", label: "Email", valueType: "email", valueCustom: "" },
          { sub: "Mon–Fri 08:00–18:00", icon: "✆", label: "Call us", valueType: "phone", valueCustom: "" },
          { sub: "By appointment", icon: "◎", label: "Visit us", valueType: "custom", valueCustom: "Konya, Türkiye" },
          { sub: "OEM cross-reference", icon: "⚙", label: "Technical support", valueType: "email", valueCustom: "" },
        ],
      },
      ru: {
        tiles: [
          { sub: "Для запросов и заказов", icon: "✉", label: "Email", valueType: "email", valueCustom: "" },
          { sub: "Пн–Пт 08:00–18:00", icon: "✆", label: "Позвоните нам", valueType: "phone", valueCustom: "" },
          { sub: "По записи", icon: "◎", label: "Посетите нас", valueType: "custom", valueCustom: "Конья, Турция" },
          { sub: "OEM перекрёстные ссылки", icon: "⚙", label: "Техническая поддержка", valueType: "email", valueCustom: "" },
        ],
      },
      ar: {
        tiles: [
          { sub: "لعروض الأسعار والطلبات", icon: "✉", label: "البريد الإلكترونيّ", valueType: "email", valueCustom: "" },
          { sub: "الاثنين–الجمعة 08:00–18:00", icon: "✆", label: "اتّصل بنا", valueType: "phone", valueCustom: "" },
          { sub: "بموعد مسبق", icon: "◎", label: "زُرنا", valueType: "custom", valueCustom: "قونيا، تركيا" },
          { sub: "المرجع المتقاطع لـ OEM", icon: "⚙", label: "الدعم التقنيّ", valueType: "email", valueCustom: "" },
        ],
      },
    },
    loc: {
      en: {
        body: "45 minutes from Konya Airport · direct logistics access via O-21 motorway · Central Anatolia's largest organized industrial zone.",
        title: "Konya Organized Industrial Zone",
        eyebrow: "Find Us",
        coordLat: "37.952° N",
        coordLng: "32.500° E",
        cardTitle: "MONIVA HQ",
        cardLocation: "Konya, Türkiye",
        cardAddressLines: [
          "Konya Organized Industrial Zone",
          "Küçükıldız Sokak No:6 PK.42050",
          "Selçuklu / Konya, TÜRKİYE",
        ],
      },
      ru: {
        body: "45 минут от аэропорта Коньи · прямой логистический доступ по автомагистрали O-21 · крупнейшая организованная промышленная зона Центральной Анатолии.",
        title: "Организованная промышленная зона Конья",
        eyebrow: "Найдите нас",
        coordLat: "37.952° С",
        coordLng: "32.500° В",
        cardTitle: "MONIVA HQ",
        cardLocation: "Конья, Турция",
        cardAddressLines: [
          "Организованная промышленная зона Конья",
          "Küçükıldız Sokak No:6 PK.42050",
          "Селчуклу / Конья, ТУРЦИЯ",
        ],
      },
      ar: {
        body: "45 دقيقةً من مطار قونيا · وصول لوجستيّ مباشر عبر طريق O-21 السريع · أكبر منطقة صناعيّة منظّمة في وسط الأناضول.",
        title: "المنطقة الصناعيّة المنظّمة في قونيا",
        eyebrow: "اعثر علينا",
        coordLat: "37.952° شمالاً",
        coordLng: "32.500° شرقاً",
        cardTitle: "المقر الرئيسي لـ MONIVA",
        cardLocation: "قونيا، تركيا",
        cardAddressLines: [
          "المنطقة الصناعيّة المنظّمة في قونيا",
          "Küçükıldız Sokak No:6 PK.42050",
          "سلجوقلو / قونيا، تركيا",
        ],
      },
    },
    depts: {
      en: {
        title: "Reach the right team.",
        eyebrow: "Direct Lines",
        depts: [
          { name: "Export — Europe", hours: "Mon–Fri 08:00–18:00 CET", contact: "Export Team" },
          { name: "Export — Eastern Markets", hours: "Mon–Fri 09:00–18:00 MSK", contact: "Export Team" },
          { name: "Technical Support", hours: "Mon–Fri 08:00–17:00", contact: "Technical Team" },
          { name: "Press & Media", hours: "Mon–Fri 09:00–17:00", contact: "Corporate Communications" },
        ],
      },
      ru: {
        title: "Свяжитесь с нужной командой.",
        eyebrow: "Прямые линии",
        depts: [
          { name: "Экспорт — Европа", hours: "Пн–Пт 08:00–18:00 CET", contact: "Экспортная команда" },
          { name: "Экспорт — Восточные рынки", hours: "Пн–Пт 09:00–18:00 MSK", contact: "Экспортная команда" },
          { name: "Техническая поддержка", hours: "Пн–Пт 08:00–17:00", contact: "Техническая команда" },
          { name: "Пресса и медиа", hours: "Пн–Пт 09:00–17:00", contact: "Корпоративные коммуникации" },
        ],
      },
      ar: {
        title: "تواصل مع الفريق المناسب.",
        eyebrow: "خطوط مباشرة",
        depts: [
          { name: "التصدير — أوروبا", hours: "الاثنين–الجمعة 08:00–18:00 CET", contact: "فريق التصدير" },
          { name: "التصدير — الأسواق الشرقيّة", hours: "الاثنين–الجمعة 09:00–18:00 MSK", contact: "فريق التصدير" },
          { name: "الدعم التقنيّ", hours: "الاثنين–الجمعة 08:00–17:00", contact: "الفريق التقنيّ" },
          { name: "الصحافة والإعلام", hours: "الاثنين–الجمعة 09:00–17:00", contact: "الاتّصالات المؤسسيّة" },
        ],
      },
    },
  },

  // ============================================================
  // CATALOG (3 section)
  // ============================================================
  catalog: {
    banner: {
      en: {
        title: "Products",
        subtitle: "OEM and aftermarket spare parts for trucks, trailers and commercial vehicles. Prices are not shown — add products to your quote list and our expert team will respond with a tailored price within 24 hours.",
        statBrand: "Brand",
        crumbLabel: "Products",
        statFamily: "Family",
        statProduct: "Product",
      },
      ru: {
        title: "Продукция",
        subtitle: "OEM и aftermarket запасные части для грузовиков, прицепов и коммерческих автомобилей. Цены не отображаются — добавьте товары в список запросов, и наша команда ответит индивидуальной ценой в течение 24 часов.",
        statBrand: "Бренд",
        crumbLabel: "Продукция",
        statFamily: "Семейство",
        statProduct: "Товар",
      },
      ar: {
        title: "المنتجات",
        subtitle: "قطع غيار OEM وبديلة للشاحنات والمقطورات والمركبات التجاريّة. الأسعار غير معروضة — أضف المنتجات إلى قائمة طلبات الأسعار وسيردّ فريقنا الخبير بسعر مخصّص خلال 24 ساعة.",
        statBrand: "علامة",
        crumbLabel: "المنتجات",
        statFamily: "مجموعة",
        statProduct: "منتج",
      },
    },
    card: {
      en: { addLabel: "Add to Quote List", quoteText: "Request a quote", addedLabel: "Added" },
      ru: { addLabel: "Добавить в запрос", quoteText: "Запросить цену", addedLabel: "Добавлено" },
      ar: { addLabel: "أضف إلى قائمة الطلبات", quoteText: "اطلب عرض سعر", addedLabel: "أُضيف" },
    },
    detail: {
      en: {
        rows: [
          { label: "Avg. shipping", value: "24 hours" },
          { label: "Min. order", value: "1 unit" },
          { label: "Origin", value: "Konya, TR" },
        ],
        addLabel: "Add to My Quote List",
        addedLabel: "Added",
        docsHeading: "Documents",
        quickHeading: "Quick Info",
        specsHeading: "Technical Specifications",
        relatedHeading: "Similar Products",
      },
      ru: {
        rows: [
          { label: "Ср. срок отгрузки", value: "24 часа" },
          { label: "Мин. заказ", value: "1 шт" },
          { label: "Происхождение", value: "Конья, Турция" },
        ],
        addLabel: "Добавить в мой запрос",
        addedLabel: "Добавлено",
        docsHeading: "Документы",
        quickHeading: "Краткая информация",
        specsHeading: "Технические характеристики",
        relatedHeading: "Похожие товары",
      },
      ar: {
        rows: [
          { label: "متوسّط الشحن", value: "24 ساعة" },
          { label: "الحدّ الأدنى للطلب", value: "1 وحدة" },
          { label: "المنشأ", value: "قونيا، تركيا" },
        ],
        addLabel: "أضف إلى قائمة طلباتي",
        addedLabel: "أُضيف",
        docsHeading: "المستندات",
        quickHeading: "معلومات سريعة",
        specsHeading: "المواصفات التقنيّة",
        relatedHeading: "منتجات مشابهة",
      },
    },
  },

  // ============================================================
  // QUALITY (4 section)
  // ============================================================
  quality: {
    banner: {
      en: {
        sub: "Every component leaves our facility tested, audited and traceable. Engineered for reliability across 80+ markets, certified to global automotive standards.",
        stats: [
          { l: "Lab stations", v: "7" },
          { l: "Certifications", v: "8" },
          { l: "Tested", v: "100%" },
        ],
        title: "Quality.",
        eyebrow: "Quality Assurance",
        crumbLabel: "Quality",
      },
      ru: {
        sub: "Каждый компонент покидает наш объект протестированным, проверенным и прослеживаемым. Разработано для надёжности на 80+ рынках, сертифицировано по мировым автомобильным стандартам.",
        stats: [
          { l: "Лабораторных станций", v: "7" },
          { l: "Сертификатов", v: "8" },
          { l: "Протестировано", v: "100%" },
        ],
        title: "Качество.",
        eyebrow: "Гарантия качества",
        crumbLabel: "Качество",
      },
      ar: {
        sub: "كل مكوّن يغادر منشأتنا مُختبَراً ومُدقَّقاً وقابلاً للتتبّع. مُصمَّم للموثوقيّة في أكثر من 80 سوقاً، ومعتمَد وفق المعايير العالميّة للسيّارات.",
        stats: [
          { l: "محطّة مختبريّة", v: "7" },
          { l: "شهادة", v: "8" },
          { l: "مُختبَر", v: "100٪" },
        ],
        title: "الجودة.",
        eyebrow: "ضمان الجودة",
        crumbLabel: "الجودة",
      },
    },
    mission: {
      en: {
        body: "Beyond our own lab stations, all aging tests — including demanding Kos and ozone endurance protocols — are conducted in KOSGEB-accredited laboratories; ensuring every part we ship meets the durability profile our customers in European, Middle Eastern and Eurasian markets rely on.",
        lead: "Moniva Otomotiv continues to raise the quality standard on every line producing service brake chambers, spring brake chambers and air/hydraulic brake systems for commercial vehicles — supported by a young and dynamic R&D team dedicated to developing world-class products.",
        title: "Our Quality Mission.",
      },
      ru: {
        body: "За пределами наших собственных лабораторных станций все испытания на старение — включая жёсткие протоколы Kos и озоновой стойкости — проводятся в лабораториях, аккредитованных KOSGEB; это гарантирует, что каждая отгружаемая деталь соответствует профилю долговечности, на который полагаются наши клиенты на европейских, ближневосточных и евразийских рынках.",
        lead: "Moniva Otomotiv продолжает повышать стандарт качества на каждой линии по производству рабочих тормозных камер, пружинных тормозных камер и пневматических/гидравлических тормозных систем для коммерческих автомобилей — при поддержке молодой и динамичной команды R&D, посвящённой разработке продукции мирового класса.",
        title: "Наша миссия по качеству.",
      },
      ar: {
        body: "علاوةً على محطّات مختبراتنا الخاصّة، تُجرى جميع اختبارات التقادم — بما فيها بروتوكولات Kos وتحمّل الأوزون الصارمة — في مختبرات معتمَدة من KOSGEB؛ ما يضمن أن كل قطعة نشحنها تُلبّي ملفّ المتانة الذي يعتمد عليه عملاؤنا في الأسواق الأوروبيّة والشرق أوسطيّة والأوراسيّة.",
        lead: "تواصل Moniva Otomotiv رفع معايير الجودة على كل خطّ إنتاج لغرف الفرامل الخدميّة وغرف فرامل النوابض وأنظمة الفرامل الهوائيّة/الهيدروليكيّة للمركبات التجاريّة — بدعمٍ من فريق بحث وتطوير شابّ ونشط مكرَّس لتطوير منتجات بمستوىً عالميّ.",
        title: "رسالتنا في الجودة.",
      },
    },
    standards: {
      en: {
        sub: "Independent audit and certification against six core standards governing automotive quality, environment and regional market access.",
        title: "International Standards.",
        standards: [
          { org: "International Organization for Standardization", code: "ISO 9001", year: "2015", scope: "Quality Management Systems" },
          { org: "International Automotive Task Force", code: "IATF 16949", year: "2016", scope: "Automotive QMS — top tier" },
          { org: "UN Economic Commission for Europe", code: "ECE R90", year: "Rev. 02", scope: "Replacement Brake Lining Assemblies" },
          { org: "European Conformity", code: "CE Mark", year: "EU 2024", scope: "Compliance with EU directives" },
          { org: "Eurasian Conformity (RU/BY/KZ)", code: "EAC", year: "TR-CU", scope: "Customs Union approval" },
          { org: "ISO Environmental", code: "ISO 14001", year: "2015", scope: "Environmental Management System" },
        ],
      },
      ru: {
        sub: "Независимый аудит и сертификация по шести основным стандартам, регулирующим автомобильное качество, окружающую среду и доступ на региональные рынки.",
        title: "Международные стандарты.",
        standards: [
          { org: "Международная организация по стандартизации", code: "ISO 9001", year: "2015", scope: "Системы менеджмента качества" },
          { org: "Международная автомобильная рабочая группа", code: "IATF 16949", year: "2016", scope: "Автомобильная СМК — высший уровень" },
          { org: "Европейская экономическая комиссия ООН", code: "ECE R90", year: "Ред. 02", scope: "Сменные тормозные накладки" },
          { org: "Европейское соответствие", code: "CE Mark", year: "ЕС 2024", scope: "Соответствие директивам ЕС" },
          { org: "Евразийское соответствие (RU/BY/KZ)", code: "EAC", year: "TR-CU", scope: "Одобрение Таможенного союза" },
          { org: "ISO Экология", code: "ISO 14001", year: "2015", scope: "Система экологического менеджмента" },
        ],
      },
      ar: {
        sub: "تدقيق واعتماد مستقلّان وفق ستّة معايير أساسيّة تحكم جودة السيّارات والبيئة والوصول إلى الأسواق الإقليميّة.",
        title: "المعايير الدوليّة.",
        standards: [
          { org: "المنظّمة الدوليّة للتوحيد القياسيّ", code: "ISO 9001", year: "2015", scope: "أنظمة إدارة الجودة" },
          { org: "فريق مهمّات صناعة السيّارات الدوليّ", code: "IATF 16949", year: "2016", scope: "نظام إدارة جودة السيّارات — المستوى الأعلى" },
          { org: "لجنة الأمم المتّحدة الاقتصاديّة لأوروبا", code: "ECE R90", year: "المراجعة 02", scope: "أطقم بطانات الفرامل البديلة" },
          { org: "المطابقة الأوروبيّة", code: "CE Mark", year: "الاتّحاد الأوروبي 2024", scope: "الامتثال لتوجيهات الاتّحاد الأوروبي" },
          { org: "المطابقة الأوراسيّة (RU/BY/KZ)", code: "EAC", year: "TR-CU", scope: "اعتماد الاتّحاد الجمركيّ" },
          { org: "ISO البيئيّة", code: "ISO 14001", year: "2015", scope: "نظام الإدارة البيئيّة" },
        ],
      },
    },
    docs: {
      en: {
        sub: "Downloadable certificates and the corporate Quality Policy — in multiple languages for regional procurement teams.",
        title: "Documents.",
        docs: [
          { flag: "🇷🇺", lang: "Eurasian Conformity", name: "EAC Certificate — Part 1", size: "1.4 MB", type: "pdf" },
          { flag: "🇷🇺", lang: "Eurasian Conformity", name: "EAC Certificate — Part 2", size: "1.2 MB", type: "pdf" },
          { flag: "🌐", lang: "Corporate Statement", name: "Quality Policy", size: "12.3 MB", type: "pdf" },
          { flag: "🇩🇪", lang: "TÜV / DAkkS scope", name: "Certificate — Germany", size: "640 KB", type: "img" },
          { flag: "🇸🇦", lang: "Middle East market", name: "Certificate — Arabic", size: "580 KB", type: "img" },
          { flag: "🇹🇷", lang: "TSE document", name: "Certificate — Turkish", size: "620 KB", type: "img" },
          { flag: "🇬🇧", lang: "International edition", name: "Certificate — English", size: "590 KB", type: "img" },
          { flag: "🇷🇺", lang: "CIS distribution", name: "Certificate — Russian", size: "560 KB", type: "img" },
        ],
      },
      ru: {
        sub: "Скачиваемые сертификаты и корпоративная Политика качества — на нескольких языках для региональных отделов закупок.",
        title: "Документы.",
        docs: [
          { flag: "🇷🇺", lang: "Евразийское соответствие", name: "Сертификат EAC — часть 1", size: "1,4 МБ", type: "pdf" },
          { flag: "🇷🇺", lang: "Евразийское соответствие", name: "Сертификат EAC — часть 2", size: "1,2 МБ", type: "pdf" },
          { flag: "🌐", lang: "Корпоративное заявление", name: "Политика качества", size: "12,3 МБ", type: "pdf" },
          { flag: "🇩🇪", lang: "Область TÜV / DAkkS", name: "Сертификат — Германия", size: "640 КБ", type: "img" },
          { flag: "🇸🇦", lang: "Ближневосточный рынок", name: "Сертификат — арабский", size: "580 КБ", type: "img" },
          { flag: "🇹🇷", lang: "Документ TSE", name: "Сертификат — турецкий", size: "620 КБ", type: "img" },
          { flag: "🇬🇧", lang: "Международное издание", name: "Сертификат — английский", size: "590 КБ", type: "img" },
          { flag: "🇷🇺", lang: "Дистрибуция в СНГ", name: "Сертификат — русский", size: "560 КБ", type: "img" },
        ],
      },
      ar: {
        sub: "شهادات قابلة للتنزيل وسياسة الجودة المؤسسيّة — بعدّة لغات لفرق المشتريات الإقليميّة.",
        title: "المستندات.",
        docs: [
          { flag: "🇷🇺", lang: "المطابقة الأوراسيّة", name: "شهادة EAC — الجزء 1", size: "1٫4 م.ب", type: "pdf" },
          { flag: "🇷🇺", lang: "المطابقة الأوراسيّة", name: "شهادة EAC — الجزء 2", size: "1٫2 م.ب", type: "pdf" },
          { flag: "🌐", lang: "بيان مؤسسيّ", name: "سياسة الجودة", size: "12٫3 م.ب", type: "pdf" },
          { flag: "🇩🇪", lang: "نطاق TÜV / DAkkS", name: "شهادة — ألمانيا", size: "640 ك.ب", type: "img" },
          { flag: "🇸🇦", lang: "سوق الشرق الأوسط", name: "شهادة — عربيّة", size: "580 ك.ب", type: "img" },
          { flag: "🇹🇷", lang: "وثيقة TSE", name: "شهادة — تركيّة", size: "620 ك.ب", type: "img" },
          { flag: "🇬🇧", lang: "الإصدار الدوليّ", name: "شهادة — إنجليزيّة", size: "590 ك.ب", type: "img" },
          { flag: "🇷🇺", lang: "توزيع رابطة الدول المستقلّة", name: "شهادة — روسيّة", size: "560 ك.ب", type: "img" },
        ],
      },
    },
  },

  // ============================================================
  // HOME (8 section, brands invisible skipped)
  // ============================================================
  home: {
    hero: {
      en: {
        slides: [
          { head: "Reliable Parts. Global Reach.", sub: "Premium spare parts for trucks, trailers and commercial vehicles — competitive prices and fast dispatch across Europe." },
          { head: "Built for Heavy-Duty.", sub: "Suspension bellows, shock absorbers and levelling valves — from the world's leading OEM manufacturers." },
          { head: "Thousands of Part Numbers. In Stock.", sub: "Clutches, transmissions and drivetrain components for every major truck brand. Ready to ship." },
        ],
        ctaPrimary: { label: "Explore Products", href: "/urunler" },
        ctaSecondary: { label: "Request a Quote", href: "/teklif-listem" },
      },
      ru: {
        slides: [
          { head: "Надёжные детали. Глобальный охват.", sub: "Премиум-запчасти для грузовиков, прицепов и коммерческих автомобилей — конкурентные цены и быстрая отгрузка по всей Европе." },
          { head: "Создано для тяжёлой техники.", sub: "Пневморессоры, амортизаторы и клапаны уровня — от ведущих мировых OEM-производителей." },
          { head: "Тысячи артикулов. В наличии.", sub: "Сцепления, коробки передач и компоненты трансмиссии для всех крупных марок грузовиков. Готовы к отгрузке." },
        ],
        ctaPrimary: { label: "Изучить продукцию", href: "/urunler" },
        ctaSecondary: { label: "Запросить цену", href: "/teklif-listem" },
      },
      ar: {
        slides: [
          { head: "قطع موثوقة. وصول عالميّ.", sub: "قطع غيار مميّزة للشاحنات والمقطورات والمركبات التجاريّة — أسعار تنافسيّة وشحن سريع في جميع أنحاء أوروبا." },
          { head: "مصنوعة للمركبات الثقيلة.", sub: "منافيخ التعليق وممتصّات الصدمات وصمّامات الاستواء — من كبار مصنّعي OEM في العالم." },
          { head: "آلاف أرقام القطع. في المخزون.", sub: "قوابض وناقلات حركة ومكوّنات نقل الحركة لكل علامة شاحنات كبرى. جاهزة للشحن." },
        ],
        ctaPrimary: { label: "استكشف المنتجات", href: "/urunler" },
        ctaSecondary: { label: "اطلب عرض سعر", href: "/teklif-listem" },
      },
    },
    categories: {
      en: { title: "Product Categories. Our Core Business.", ctaLabel: "See all products ▶" },
      ru: { title: "Категории продукции. Наш основной бизнес.", ctaLabel: "Смотреть все товары ▶" },
      ar: { title: "فئات المنتجات. نشاطنا الأساسيّ.", ctaLabel: "شاهد جميع المنتجات ▶" },
    },
    why: {
      en: {
        title: "Why Moniva.",
        pillars: [
          { num: "01", title: "Technical Expertise.", body: "OEM-grade parts supply for fleet operators and distributors. Our technical team supports part matching for every major truck brand." },
          { num: "02", title: "Fast Global Shipping.", body: "Direct shipping lanes from our Konya warehouse to Europe and the Middle East. Average order-to-dispatch time: 24 hours." },
          { num: "03", title: "Verified Quality.", body: "ISO 9001:2015 certified. All products meet ECE / EU homologation requirements. Full traceability with every shipment." },
          { num: "04", title: "Competitive Pricing.", body: "Direct sourcing relationships with leading OEM and aftermarket manufacturers. Volume pricing for fleet accounts." },
        ],
      },
      ru: {
        title: "Почему Moniva.",
        pillars: [
          { num: "01", title: "Техническая экспертиза.", body: "Поставка запчастей OEM-уровня для автопарков и дистрибьюторов. Наша техническая команда обеспечивает подбор деталей для всех крупных марок грузовиков." },
          { num: "02", title: "Быстрая глобальная отгрузка.", body: "Прямые маршруты доставки с нашего склада в Конье в Европу и на Ближний Восток. Среднее время от заказа до отгрузки: 24 часа." },
          { num: "03", title: "Проверенное качество.", body: "Сертификат ISO 9001:2015. Все товары соответствуют требованиям омологации ECE / ЕС. Полная прослеживаемость каждой отгрузки." },
          { num: "04", title: "Конкурентные цены.", body: "Прямые отношения с ведущими OEM и aftermarket производителями. Объёмное ценообразование для автопарков." },
        ],
      },
      ar: {
        title: "لماذا Moniva.",
        pillars: [
          { num: "01", title: "خبرة تقنيّة.", body: "توريد قطع بجودة OEM لمشغّلي الأساطيل والموزّعين. يدعم فريقنا التقنيّ مطابقة القطع لكل علامة شاحنات كبرى." },
          { num: "02", title: "شحن عالميّ سريع.", body: "خطوط شحن مباشرة من مستودعنا في قونيا إلى أوروبا والشرق الأوسط. متوسّط وقت الطلب حتى الشحن: 24 ساعة." },
          { num: "03", title: "جودة مُعتمَدة.", body: "معتمَد ISO 9001:2015. جميع المنتجات تُلبّي متطلّبات المطابقة ECE / الاتّحاد الأوروبي. تتبّع كامل مع كل شحنة." },
          { num: "04", title: "أسعار تنافسيّة.", body: "علاقات توريد مباشرة مع كبار مصنّعي OEM والبدائل. تسعير بالحجم لحسابات الأساطيل." },
        ],
      },
    },
    reach: {
      en: {
        title: "Global Export Network.",
        cardSub: "We're looking for distributors in new markets. Contact our export team. ▶",
        regions: [
          { count: 12, region: "Western Europe", countries: "DE · FR · NL · BE · AT · CH · IT · ES" },
          { count: 14, region: "Eastern Europe", countries: "PL · RO · CZ · HU · SK · BG · HR" },
          { count: 11, region: "Middle East", countries: "TR · UAE · SA · JO · IQ · KW · QA" },
          { count: 8, region: "North Africa", countries: "EG · MA · TN · LY · DZ" },
          { count: 6, region: "Central Asia", countries: "KZ · AZ · GE · UZ · TM" },
          { count: 9, region: "Other Markets", countries: "UK · Scandinavia · Baltics" },
        ],
        stats: [
          { l: "Export Countries", v: "80+" },
          { l: "Active SKUs", v: "50,000+" },
          { l: "Continents", v: "3" },
          { l: "Avg. Dispatch", v: "24h" },
        ],
        cardHead: "Become an Authorized Distributor.",
      },
      ru: {
        title: "Глобальная экспортная сеть.",
        cardSub: "Мы ищем дистрибьюторов на новых рынках. Свяжитесь с нашей экспортной командой. ▶",
        regions: [
          { count: 12, region: "Западная Европа", countries: "DE · FR · NL · BE · AT · CH · IT · ES" },
          { count: 14, region: "Восточная Европа", countries: "PL · RO · CZ · HU · SK · BG · HR" },
          { count: 11, region: "Ближний Восток", countries: "TR · UAE · SA · JO · IQ · KW · QA" },
          { count: 8, region: "Северная Африка", countries: "EG · MA · TN · LY · DZ" },
          { count: 6, region: "Центральная Азия", countries: "KZ · AZ · GE · UZ · TM" },
          { count: 9, region: "Другие рынки", countries: "UK · Скандинавия · Балтия" },
        ],
        stats: [
          { l: "Экспортных стран", v: "80+" },
          { l: "Активных SKU", v: "50 000+" },
          { l: "Континентов", v: "3" },
          { l: "Ср. отгрузка", v: "24ч" },
        ],
        cardHead: "Станьте официальным дистрибьютором.",
      },
      ar: {
        title: "شبكة تصدير عالميّة.",
        cardSub: "نحن نبحث عن موزّعين في أسواق جديدة. تواصل مع فريق التصدير لدينا. ▶",
        regions: [
          { count: 12, region: "أوروبا الغربيّة", countries: "DE · FR · NL · BE · AT · CH · IT · ES" },
          { count: 14, region: "أوروبا الشرقيّة", countries: "PL · RO · CZ · HU · SK · BG · HR" },
          { count: 11, region: "الشرق الأوسط", countries: "TR · UAE · SA · JO · IQ · KW · QA" },
          { count: 8, region: "شمال إفريقيا", countries: "EG · MA · TN · LY · DZ" },
          { count: 6, region: "آسيا الوسطى", countries: "KZ · AZ · GE · UZ · TM" },
          { count: 9, region: "أسواق أخرى", countries: "UK · اسكندنافيا · دول البلطيق" },
        ],
        stats: [
          { l: "دولة تصدير", v: "+80" },
          { l: "SKU نشط", v: "+50,000" },
          { l: "قارّات", v: "3" },
          { l: "متوسّط الشحن", v: "24س" },
        ],
        cardHead: "كُن موزّعاً معتمَداً.",
      },
    },
    featured: {
      en: { title: "Featured Products.", ctaLabel: "Full catalog ▶" },
      ru: { title: "Избранные товары.", ctaLabel: "Весь каталог ▶" },
      ar: { title: "منتجات مختارة.", ctaLabel: "الكتالوج الكامل ▶" },
    },
    news: {
      en: { title: "Newsroom.", sideTitle: "Latest News." },
      ru: { title: "Новости.", sideTitle: "Последние новости." },
      ar: { title: "غرفة الأخبار.", sideTitle: "آخر الأخبار." },
    },
    cta: {
      en: {
        sub: "Our sales team is available weekdays 08:00–18:00. Fast quotes, technical support, volume pricing for fleet accounts.",
        head: "Ready to source premium truck and trailer parts?",
        kicker: "Get in Touch",
        contacts: [
          { icon: "✉", label: "Email", value: "export@moniva.com.tr" },
          { icon: "✆", label: "Phone", value: "+90 332 239 03 05" },
          { icon: "◎", label: "Location", value: "Konya, Türkiye" },
        ],
        primaryLabel: "Request a Quote ▶",
        secondaryLabel: "Contact Sales",
      },
      ru: {
        sub: "Наша команда продаж доступна в будние дни с 08:00 до 18:00. Быстрые предложения, техническая поддержка, объёмные цены для автопарков.",
        head: "Готовы к поставке премиум-запчастей для грузовиков и прицепов?",
        kicker: "Связаться",
        contacts: [
          { icon: "✉", label: "Email", value: "export@moniva.com.tr" },
          { icon: "✆", label: "Телефон", value: "+90 332 239 03 05" },
          { icon: "◎", label: "Местоположение", value: "Конья, Турция" },
        ],
        primaryLabel: "Запросить цену ▶",
        secondaryLabel: "Связаться с отделом продаж",
      },
      ar: {
        sub: "فريق المبيعات لدينا متاح أيّام العمل من 08:00 إلى 18:00. عروض أسعار سريعة، ودعم تقنيّ، وتسعير بالحجم لحسابات الأساطيل.",
        head: "هل أنت جاهز للحصول على قطع غيار مميّزة للشاحنات والمقطورات؟",
        kicker: "تواصل معنا",
        contacts: [
          { icon: "✉", label: "البريد الإلكترونيّ", value: "export@moniva.com.tr" },
          { icon: "✆", label: "الهاتف", value: "+90 332 239 03 05" },
          { icon: "◎", label: "الموقع", value: "قونيا، تركيا" },
        ],
        primaryLabel: "اطلب عرض سعر ▶",
        secondaryLabel: "تواصل مع المبيعات",
      },
    },
  },
};

async function main() {
  let updated = 0;
  let missing = 0;

  for (const [pageKey, sections] of Object.entries(PAYLOAD)) {
    const page = await prisma.managedPage.findUnique({
      where: { key: pageKey },
      select: { id: true },
    });
    if (!page) {
      console.warn(`[warn] page not found: ${pageKey}`);
      missing++;
      continue;
    }

    for (const [sectionKey, i18n] of Object.entries(sections)) {
      const section = await prisma.pageSection.findFirst({
        where: { pageId: page.id, key: sectionKey },
        select: { id: true, data: true },
      });
      if (!section) {
        console.warn(`[warn] section not found: ${pageKey}/${sectionKey}`);
        missing++;
        continue;
      }

      const currentData = (section.data ?? {}) as Record<string, unknown>;
      const { _i18n: _old, ...rest } = currentData as Record<string, unknown> & {
        _i18n?: unknown;
      };
      void _old;

      const nextData = {
        ...rest,
        _i18n: i18n,
      };

      await prisma.pageSection.update({
        where: { id: section.id },
        data: { data: nextData },
      });
      console.log(`[ok]  ${pageKey}/${sectionKey}`);
      updated++;
    }
  }

  console.log(`\ndone. updated=${updated} missing=${missing}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
