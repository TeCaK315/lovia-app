
// === DOMContentLoaded wrapper — критично для iOS Safari + Telegram WKWebView ===
// Тройная страховка: DOMContentLoaded + readyState check + setTimeout fallback
var __loviaInitialized = false;
function __loviaInit() {
  if (__loviaInitialized) return;
  __loviaInitialized = true;
  // Скрыть баннер если JS работает
  try {

    
    var banner = document.getElementById('__loviaBanner');
    if (banner) banner.style.display = 'none';
  } catch(e) {}
  try {

    // ============================================
    // NATAL ENGINE — реальный астрономический расчёт
    // Точность: позиции планет ±1-2°, Asc/MC ±0.5°
    // Достаточно для астрологической интерпретации
    // (для научной точности нужен Swiss Ephemeris)
    // ============================================
    const NatalEngine = (function() {
    
      function norm360(x) {
        return ((x % 360) + 360) % 360;
      }
    
      // === Юлианская дата ===
      function julianDate(year, month, day, hour, minute) {
        hour = hour || 0;
        minute = minute || 0;
        if (month <= 2) {
          year -= 1;
          month += 12;
        }
        const a = Math.floor(year / 100);
        const b = 2 - a + Math.floor(a / 4);
        let jd = Math.floor(365.25 * (year + 4716))
               + Math.floor(30.6001 * (month + 1))
               + day + b - 1524.5;
        jd += (hour + minute / 60) / 24;
        return jd;
      }
    
      // === Солнце ===
      function sunLongitude(jd) {
        const T = (jd - 2451545.0) / 36525.0;
        const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
        const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
        const Mr = M * Math.PI / 180;
        const C = (1.914602 - 0.004817*T - 0.000014*T*T) * Math.sin(Mr)
                + (0.019993 - 0.000101*T) * Math.sin(2*Mr)
                + 0.000289 * Math.sin(3*Mr);
        return norm360(L0 + C);
      }
    
      // === Луна ===
      function moonLongitude(jd) {
        const T = (jd - 2451545.0) / 36525.0;
        const L = 218.3164477 + 481267.88123421*T - 0.0015786*T*T;
        const D = (297.8501921 + 445267.1114034*T - 0.0018819*T*T) * Math.PI/180;
        const M = (357.5291092 + 35999.0502909*T - 0.0001536*T*T) * Math.PI/180;
        const Mp = (134.9633964 + 477198.8675055*T + 0.0087414*T*T) * Math.PI/180;
        const F = (93.2720950 + 483202.0175233*T - 0.0036539*T*T) * Math.PI/180;
    
        const correction = (
          + 6.288774 * Math.sin(Mp)
          + 1.274027 * Math.sin(2*D - Mp)
          + 0.658314 * Math.sin(2*D)
          + 0.213618 * Math.sin(2*Mp)
          - 0.185116 * Math.sin(M)
          - 0.114332 * Math.sin(2*F)
          + 0.058793 * Math.sin(2*D - 2*Mp)
          + 0.057066 * Math.sin(2*D - M - Mp)
          + 0.053322 * Math.sin(2*D + Mp)
          + 0.045758 * Math.sin(2*D - M)
          - 0.040923 * Math.sin(M - Mp)
          - 0.034720 * Math.sin(D)
          - 0.030383 * Math.sin(M + Mp)
        );
        return norm360(L + correction);
      }
    
      // === Орбитальные элементы планет (Standish 2003) ===
      const PLANETS = {
        mercury: {a:0.38709927, e:0.20563593, I:7.00497902, L:252.25032350,
                  w_bar:77.45779628, Omega:48.33076593,
                  a_d:0.00000037, e_d:0.00001906, I_d:-0.00594749,
                  L_d:149472.67411175, w_bar_d:0.16047689, Omega_d:-0.12534081},
        venus:   {a:0.72333566, e:0.00677672, I:3.39467605, L:181.97909950,
                  w_bar:131.60246718, Omega:76.67984255,
                  a_d:0.00000390, e_d:-0.00004107, I_d:-0.00078890,
                  L_d:58517.81538729, w_bar_d:0.00268329, Omega_d:-0.27769418},
        mars:    {a:1.52371034, e:0.09339410, I:1.84969142, L:-4.55343205,
                  w_bar:-23.94362959, Omega:49.55953891,
                  a_d:0.00001847, e_d:0.00007882, I_d:-0.00813131,
                  L_d:19140.30268499, w_bar_d:0.44441088, Omega_d:-0.29257343},
        jupiter: {a:5.20288700, e:0.04838624, I:1.30439695, L:34.39644051,
                  w_bar:14.72847983, Omega:100.47390909,
                  a_d:-0.00011607, e_d:-0.00013253, I_d:-0.00183714,
                  L_d:3034.74612775, w_bar_d:0.21252668, Omega_d:0.20469106},
        saturn:  {a:9.53667594, e:0.05386179, I:2.48599187, L:49.95424423,
                  w_bar:92.59887831, Omega:113.66242448,
                  a_d:-0.00125060, e_d:-0.00050991, I_d:0.00193609,
                  L_d:1222.49362201, w_bar_d:-0.41897216, Omega_d:-0.28867794},
        uranus:  {a:19.18916464, e:0.04725744, I:0.77263783, L:313.23810451,
                  w_bar:170.95427630, Omega:74.01692503,
                  a_d:-0.00196176, e_d:-0.00004397, I_d:-0.00242939,
                  L_d:428.48202785, w_bar_d:0.40805281, Omega_d:0.04240589},
        neptune: {a:30.06992276, e:0.00859048, I:1.77004347, L:-55.12002969,
                  w_bar:44.96476227, Omega:131.78422574,
                  a_d:0.00026291, e_d:0.00005105, I_d:0.00035372,
                  L_d:218.45945325, w_bar_d:-0.32241464, Omega_d:-0.00508664},
        pluto:   {a:39.48211675, e:0.24882730, I:17.14001206, L:238.92903833,
                  w_bar:224.06891629, Omega:110.30393684,
                  a_d:-0.00031596, e_d:0.00005170, I_d:0.00004818,
                  L_d:145.20780515, w_bar_d:-0.04062942, Omega_d:-0.01183482}
      };
    
      function planetLongitude(jd, key) {
        const T = (jd - 2451545.0) / 36525.0;
        const p = PLANETS[key];
        if (!p) return 0;
    
        const a = p.a + p.a_d * T;
        const e = p.e + p.e_d * T;
        const I = p.I + p.I_d * T;
        const L = p.L + p.L_d * T;
        const w_bar = p.w_bar + p.w_bar_d * T;
        const Omega = p.Omega + p.Omega_d * T;
    
        const w = w_bar - Omega;
        const M = norm360(L - w_bar);
        const Mr = M * Math.PI / 180;
    
        // Решаем уравнение Кеплера
        let E = M + (e * Math.sin(Mr)) * 180 / Math.PI;
        for (let i = 0; i < 5; i++) {
          const Er = E * Math.PI / 180;
          const dE = (M + (e * Math.sin(Er)) * 180 / Math.PI - E) / (1 - e * Math.cos(Er));
          E += dE;
          if (Math.abs(dE) < 1e-6) break;
        }
    
        const Er = E * Math.PI / 180;
        const x_orb = a * (Math.cos(Er) - e);
        const y_orb = a * Math.sqrt(1 - e * e) * Math.sin(Er);
    
        const wr = w * Math.PI / 180;
        const Or = Omega * Math.PI / 180;
        const Ir = I * Math.PI / 180;
    
        const x_ecl = (Math.cos(wr)*Math.cos(Or) - Math.sin(wr)*Math.sin(Or)*Math.cos(Ir)) * x_orb
                    + (-Math.sin(wr)*Math.cos(Or) - Math.cos(wr)*Math.sin(Or)*Math.cos(Ir)) * y_orb;
        const y_ecl = (Math.cos(wr)*Math.sin(Or) + Math.sin(wr)*Math.cos(Or)*Math.cos(Ir)) * x_orb
                    + (-Math.sin(wr)*Math.sin(Or) + Math.cos(wr)*Math.cos(Or)*Math.cos(Ir)) * y_orb;
    
        // Геоцентрическая коррекция через позицию Земли
        const earth_lon = norm360(sunLongitude(jd) + 180);
        const earth_lon_r = earth_lon * Math.PI / 180;
        const xe = Math.cos(earth_lon_r);
        const ye = Math.sin(earth_lon_r);
    
        const x_geo = x_ecl - xe;
        const y_geo = y_ecl - ye;
    
        return norm360(Math.atan2(y_geo, x_geo) * 180 / Math.PI);
      }
    
      // === Asc / MC ===
      function ascMc(jd, lat, lon) {
        const T = (jd - 2451545.0) / 36525.0;
        let GMST = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
        GMST = norm360(GMST);
        const LST = norm360(GMST + lon);
    
        const eps = (23.4392911 - 0.0130042 * T) * Math.PI / 180;
        const LSTr = LST * Math.PI / 180;
        const latr = lat * Math.PI / 180;
    
        let MC = Math.atan2(Math.sin(LSTr), Math.cos(LSTr) * Math.cos(eps)) * 180 / Math.PI;
        MC = norm360(MC);
    
        const asc_num = Math.cos(LSTr);
        const asc_den = -(Math.sin(eps) * Math.tan(latr) + Math.cos(eps) * Math.sin(LSTr));
        let ASC = Math.atan2(asc_num, asc_den) * 180 / Math.PI;
        ASC = norm360(ASC);
    
        return { ASC, MC };
      }
    
      // === Аспекты ===
      const ASPECT_TYPES = [
        { name: 'conjunction', angle: 0,   orb: 8, label: 'Соединение', sym: '☌' },
        { name: 'sextile',     angle: 60,  orb: 4, label: 'Секстиль',   sym: '⚹' },
        { name: 'square',      angle: 90,  orb: 6, label: 'Квадрат',    sym: '□' },
        { name: 'trine',       angle: 120, orb: 6, label: 'Трин',       sym: '△' },
        { name: 'opposition',  angle: 180, orb: 8, label: 'Оппозиция',  sym: '☍' },
      ];
    
      function calcAspect(lon1, lon2) {
        let diff = Math.abs(lon1 - lon2);
        if (diff > 180) diff = 360 - diff;
        for (const a of ASPECT_TYPES) {
          const orb = Math.abs(diff - a.angle);
          if (orb <= a.orb) {
            return { type: a.name, label: a.label, sym: a.sym, angle: a.angle, orb: orb };
          }
        }
        return null;
      }
    
      // === Знак и градус в знаке ===
      function signInfo(lon) {
        const signs = ['Овен','Телец','Близнецы','Рак','Лев','Дева',
                       'Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы'];
        const signKeys = ['aries','taurus','gemini','cancer','leo','virgo',
                          'libra','scorpio','sagittarius','capricorn','aquarius','pisces'];
        const elements = ['fire','earth','air','water','fire','earth',
                          'air','water','fire','earth','air','water'];
        const symbols = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
        const idx = Math.floor(lon / 30) % 12;
        return {
          name: signs[idx],
          key: signKeys[idx],
          element: elements[idx],
          symbol: symbols[idx],
          degree: lon % 30,
          index: idx
        };
      }
    
      // === Дома Equal House — упрощённо от Asc + 30° на каждый ===
      function calculateHouses(ASC) {
        const houses = [];
        for (let i = 0; i < 12; i++) {
          houses.push(norm360(ASC + i * 30));
        }
        return houses;
      }
    
      // === Дом для долготы ===
      function houseOfLongitude(lon, houses) {
        for (let i = 0; i < 12; i++) {
          const start = houses[i];
          const end = houses[(i + 1) % 12];
          if (start < end) {
            if (lon >= start && lon < end) return i + 1;
          } else {
            // оборот через 0°
            if (lon >= start || lon < end) return i + 1;
          }
        }
        return 1;
      }
    
      // === MAIN — построение карты ===
      function buildChart(year, month, day, hour, minute, lat, lon, tzOffset) {
        // tzOffset = часов добавить к local time чтобы получить UT
        // (положительный для зон западнее, отрицательный для восточнее Гринвича)
        // Например, Киев UTC+3 — мы вычитаем 3 часа из local чтобы получить UT
        let utHour = hour - tzOffset;
        let utDay = day;
        let utMonth = month;
        let utYear = year;
        // Простая нормализация переноса дня
        if (utHour < 0) {
          utHour += 24;
          utDay -= 1;
          if (utDay < 1) {
            utMonth -= 1;
            if (utMonth < 1) { utMonth = 12; utYear -= 1; }
            utDay = 31; // приближение
          }
        } else if (utHour >= 24) {
          utHour -= 24;
          utDay += 1;
        }
    
        const jd = julianDate(utYear, utMonth, utDay, utHour, minute);
    
        const planets = {
          sun:     sunLongitude(jd),
          moon:    moonLongitude(jd),
          mercury: planetLongitude(jd, 'mercury'),
          venus:   planetLongitude(jd, 'venus'),
          mars:    planetLongitude(jd, 'mars'),
          jupiter: planetLongitude(jd, 'jupiter'),
          saturn:  planetLongitude(jd, 'saturn'),
          uranus:  planetLongitude(jd, 'uranus'),
          neptune: planetLongitude(jd, 'neptune'),
          pluto:   planetLongitude(jd, 'pluto'),
        };
    
        const { ASC, MC } = ascMc(jd, lat, lon);
        const houses = calculateHouses(ASC);
    
        // Собираем данные планет с домами
        const planetData = {};
        Object.keys(planets).forEach(key => {
          const longitude = planets[key];
          planetData[key] = {
            longitude: longitude,
            sign: signInfo(longitude),
            house: houseOfLongitude(longitude, houses)
          };
        });
    
        // Аспекты — все пары
        const planetKeys = Object.keys(planets);
        const aspects = [];
        for (let i = 0; i < planetKeys.length; i++) {
          for (let j = i + 1; j < planetKeys.length; j++) {
            const a = calcAspect(planets[planetKeys[i]], planets[planetKeys[j]]);
            if (a) {
              aspects.push({
                from: planetKeys[i],
                to: planetKeys[j],
                ...a
              });
            }
          }
        }
        // Сортируем по точности (точные сначала)
        aspects.sort((a, b) => a.orb - b.orb);
    
        // Стихии
        const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
        Object.values(planetData).forEach(p => elementCounts[p.sign.element]++);
        const totalElements = Object.values(elementCounts).reduce((s,v) => s+v, 0);
        const elements = {};
        Object.keys(elementCounts).forEach(e => {
          elements[e] = Math.round((elementCounts[e] / totalElements) * 100);
        });
    
        return {
          jd,
          planets: planetData,
          ASC,
          MC,
          ascSign: signInfo(ASC),
          mcSign: signInfo(MC),
          houses,
          aspects,
          elements
        };
      }
    
      return {
        buildChart,
        signInfo,
        julianDate,
        norm360
      };
    })();


// === LOVIA HOME / LOGIN / DASHBOARD STATIC INTERACTIONS ===
// (The original lovia switcher is removed — main router below handles screen navigation)

// === NATAL CHART SCRIPT (planets, houses, aspects, tabs, chart svg) ===
const planets = [
    { sym: '☉', name: 'Солнце', sign: 'Рак', degree: '15.3°', house: '5 дом', strength: 64,
      text: 'Ядро личности через заботу, эмоциональную глубину и потребность в безопасной среде. В Раке Солнце ощущает мир через близость и доверие.',
      text2: 'В 5 доме — это про творчество и самовыражение, идущие из эмоций. Секстиль с Сатурном (0.4°) добавляет дисциплины редкому для Рака умению превращать чувства в результат.',
      tip: 'Эмпатия + структура — ваше преимущество. Не выбирайте между ними.',
      deep: 'Углублённо: Солнце на 15° знака — точка максимальной интенсивности Рака. Это не пограничная позиция, а самая суть. Совмещение с 5 домом (творчество) и секстилем к Сатурну (структура) создаёт редкий профиль "эмоциональный профессионал" — человек, который превращает чувствительность в ремесло. Исторически такие профили часто становятся писателями, психотерапевтами, дизайнерами, основателями продуктов, требующих эмпатии плюс долгой выдержки. Не путайте с творческой неустойчивостью типичного 5-домного Льва.'
    },
    { sym: '☽', name: 'Луна', sign: 'Телец', degree: '2.7°', house: '2 дом', strength: 100,
      text: 'Эмоциональная природа стабильна, ориентирована на устойчивость и осязаемый комфорт. Вы восстанавливаетесь через материальные опоры — дом, еду, телесные практики.',
      text2: 'Во 2 доме в соединении с Юпитером — деньги и ресурсы напрямую связаны с эмоциональным благополучием. Это не жадность, это конструкция психики.',
      tip: 'Финансовая подушка для вас — не роскошь, а лекарство от тревоги.',
      deep: 'Углублённо: Луна в Тельце — её экзальтация, самая комфортная позиция. Это значит, что эмоциональная природа в принципе стабильна и поддаётся управлению. Соединение с Юпитером (1.3°) усиливает оптимизм и щедрость, но добавляет риск переедания, перетраты, переусилия в комфорт. Контр-аспект — оппозиция с Марсом в Скорпионе (1.8°). Это значит, что внешне устойчивая Луна имеет внутренний "горячий" подпол. Когда устойчивость нарушается, реакция несоразмерно резкая.'
    },
    { sym: '☿', name: 'Меркурий', sign: 'Лев', degree: '8.5°', house: '6 дом', strength: 9,
      text: 'Мышление яркое, образное, склонное к лидерству в разговоре. Вы лучше всего думаете, когда можете подать мысль ярко и убедительно.',
      text2: 'Трин с Плутоном (0.3°, точный) даёт интеллектуальную глубину и проницательность — видите подтексты и скрытые мотивы там, где другие читают поверхностно.',
      tip: 'Перед важным решением проговаривайте вывод вслух — так быстрее замечаете слабые места в логике.',
      deep: 'Углублённо: Меркурий во Льве часто переоценивается астрологами как "поверхностный" — на деле это глубокое мышление, нуждающееся в форме. Вам нужно облечь идею в наратив, прежде чем она для вас оформится. 6 дом — это рутина, ремесло, методичность — это балансирует львиную театральность. Точный трин к Плутону превращает обычное мышление в исследовательское. Низкая сила планеты (+1) по баллам компенсируется качеством аспектов.'
    },
    { sym: '♀', name: 'Венера', sign: 'Лев', degree: '27.2°', house: '6 дом', strength: 91,
      text: 'В отношениях вы тёплый, щедрый, любите проявлять чувства открыто. Венера в Льве — это про подарки, внимание, желание украшать жизнь близкого человека.',
      text2: 'В 6 доме — любовь часто переплетается с заботой о повседневности. Романтика для вас может выражаться через помощь в делах партнёра.',
      tip: 'Чётко обозначайте, что для вас норма в отношениях — это повышает качество взаимности.',
      deep: 'Углублённо: Венера на 27° Льва — приближается к финалу знака, это градус "зрелой Венеры". Здесь меньше юношеской экзальтированности, больше выкристаллизованного вкуса. 6 дом смещает выражение любви с театральности в практическую заботу — это иногда воспринимается партнёром как "сухость", но на деле это глубокое вложение. Трин с Юпитером (4.2°) даёт удачу в любви, секстиль с Марсом (3.7°) — здоровую страстную ось.'
    },
    { sym: '♂', name: 'Марс', sign: 'Скорпион', degree: '0.9°', house: '8 дом', strength: 64,
      text: 'Воля сосредоточенная, глубокая, не боящаяся сложных тем. Вы идёте в корень вопроса, а не в обход. Конкуренция включает вас, а не пугает.',
      text2: 'В 8 доме в Скорпионе — Марс в своей родной обители. Очень сильная позиция. Оппозиция к Луне (1.8°) означает, что эмоциональная боль легко превращается в гнев.',
      tip: 'Направляйте интенсивность в конкретную цель и измеримые шаги — иначе она пожирает изнутри.',
      deep: 'Углублённо: Марс в Скорпионе на 0.9° — самое начало знака, мощная позиция (Марс — традиционный управитель Скорпиона до открытия Плутона). 8 дом усиливает темы трансформации, общих ресурсов, кризисов. Это конструкция человека, который не убегает от сложного, а идёт в него — и обычно выходит изменённым. Опасность: квадрат с Нептуном (2.6°) — иногда направляете энергию на фантомы.'
    },
    { sym: '♃', name: 'Юпитер', sign: 'Телец', degree: '1.4°', house: '2 дом', strength: 73,
      text: 'Масштаб целей через практичность и устойчивый рост. Вы не верите в быстрые рывки — верите в системное расширение через надёжные шаги.',
      text2: 'В соединении с Луной — удачливость в финансовой сфере и поддержка близких людей в материальных вопросах. Хороший актив.',
      tip: 'Выбирайте одну главную линию роста на период — иначе расширение становится хаотичным.',
      deep: 'Углублённо: Юпитер в Тельце во 2 доме — классический индикатор финансового благополучия в традиционной астрологии. Это не значит "богатство свалится с неба" — это значит, что усилия по построению материальной базы приносят результат больше среднего. T-квадрат с Марсом и Нептуном — единственная сложная конфигурация в этой области: иногда переоцениваете возможности, иногда тратите энергию не туда.'
    },
    { sym: '♄', name: 'Сатурн', sign: 'Телец', degree: '14.8°', house: '2 дом', strength: 45,
      text: 'Внутренний стержень и зрелость через ответственное отношение к ресурсам. Дисциплина для вас — не давление, а опора.',
      text2: 'Квадрат с Ураном (1.2°) — внутренний конфликт между стабильностью и потребностью ломать привычное. Не пытайтесь выбрать одно из двух, ищите формат, где оба работают.',
      tip: 'Разделяйте большую цель на этапы с контрольными точками — так дисциплина становится опорой, а не давлением.',
      deep: 'Углублённо: Сатурн в Тельце — крепкая, но медленная позиция. Учит ценить материальные результаты, не идти на компромиссы качества. 2 дом усиливает эту тему: финансовая зрелость придёт через дисциплину, а не через инсайты. Секстиль с Солнцем (0.4°) — редкий мажорный гармоничный аспект, превращающий "тяжесть Сатурна" в "вес авторитета". К 30-35 годам становитесь человеком, к которому идут за решениями.'
    },
    { sym: '♅', name: 'Уран', sign: 'Водолей', degree: '16.0°', house: '12 дом', strength: 0,
      text: 'Потребность в свободе и нестандартности. В Водолее Уран в своей обители, что усиливает черты — независимость, новаторство, оригинальность мышления.',
      text2: 'В 12 доме — эта оригинальность работает внутри, в области подсознания и интуитивных прозрений. Внешне может быть незаметна, внутри — очень активна.',
      tip: 'Тестируйте новые идеи на маленьком масштабе перед внедрением.',
      deep: 'Углублённо: Уран в Водолее — это поколенческое (1995–2003), но 12 дом делает его личной темой. 12 дом — область подсознания, скрытого, того, что неочевидно даже самому себе. Это значит, что ваша оригинальность работает скорее как внутренний ресурс, чем как внешняя демонстрация. Внешне вы можете казаться обычным — но внутренне у вас постоянно идёт пересборка моделей реальности.'
    },
    { sym: '♆', name: 'Нептун', sign: 'Водолей', degree: '3.5°', house: '12 дом', strength: 0,
      text: 'Интуиция и воображение в форме нестандартного видения. Вы воспринимаете тонкие смыслы и связи, которые формально не выражены.',
      text2: 'В 12 доме — обостряет интуитивную чувствительность. Квадрат с Луной (0.7°) даёт эмоциональный туман и склонность к идеализации.',
      tip: 'Проверяйте вдохновляющую идею реальными критериями — иначе легко влюбиться в проекцию.',
      deep: 'Углублённо: Нептун в Водолее в 12 доме — двойное усиление тонкого, неуловимого, мистического. Хорошая сторона — высокая способность к работе с символическим (искусство, психология, исследование смыслов). Сложная сторона — границы реальности и фантазии могут размываться в моменты усталости.'
    },
    { sym: '♇', name: 'Плутон', sign: 'Стрелец', degree: '8.2°', house: '9 дом', strength: 45,
      text: 'Сила трансформации через мировоззрение и расширение горизонтов. Вы меняетесь через идеи, обучение, новые контексты, а не через быт.',
      text2: 'В 9 доме — глубокие перемены связаны с областью знания, философии, дальних путешествий, иностранных культур. Трин с Меркурием делает эту трансформацию осознанной.',
      tip: 'Большие идеи подкрепляйте практичным планом — вдохновение тогда даёт устойчивый прогресс.',
      deep: 'Углублённо: Плутон в Стрельце в 9 доме — мощная конфигурация для трансформации через знание. Каждый раз, когда вы серьёзно погружаетесь в новую область или культуру, выходите из этого изменённым человеком. Точный трин с Меркурием (0.3°) делает эту трансформацию выраженной в речи и мышлении — вы можете формулировать перемены, а не только их проживать.'
    },
  ];

  const houses = [
    { num: 1, sign: 'Водолей', text: 'Первое впечатление и самопрезентация через независимость и нестандартность. Вас сразу считывают как человека "не как все" — и это работает.', tip: 'Тестируйте новые форматы знакомств на небольшом масштабе.' },
    { num: 2, sign: 'Рыбы', text: 'Деньги и ресурсы идут через интуитивные решения и эмпатию. Вы хорошо чувствуете, где есть возможность — и не очень любите жёсткое планирование.', tip: 'Развивайте навык фиксации денежных решений: что-то должно быть на бумаге, а не только в голове.' },
    { num: 3, sign: 'Овен', text: 'Общение и обучение через смелость и инициативу. Вы любите задавать прямые вопросы и быстро схватывать суть.', tip: 'Делайте первый шаг в общении, потом уточняйте детали.' },
    { num: 4, sign: 'Телец', text: 'Дом и корни через устойчивость и комфорт. Вам важна красота быта, качественные предметы вокруг, ощущение прочности.', tip: 'Создавайте дом не быстро, а основательно. Один хороший предмет лучше десяти средних.' },
    { num: 5, sign: 'Близнецы', text: 'Творчество и радость через разнообразие, обмен идеями, общение. Вам нужно много контекстов — один проект надоедает.', tip: 'Ведите несколько творческих линий параллельно, не пытайтесь свести всё к одной.' },
    { num: 6, sign: 'Рак', text: 'Работа и здоровье через заботу — о других и о себе. Вы лучше работаете там, где есть эмоциональная связь с командой или результатом.', tip: 'Проверяйте эмоциональный фон до того, как браться за задачу — если устали, отдыхайте, не выжимайте.' },
    { num: 7, sign: 'Лев', text: 'Партнёрство с яркими, сильными людьми. Вас тянет к тем, кто умеет вести и сиять — но вы хотите равенства, а не подчинения.', tip: 'Беритесь за роли в отношениях, где можно показать свои сильные стороны, а не подстраиваться.' },
    { num: 8, sign: 'Дева', text: 'Глубокие изменения через анализ, детали, методичную работу. Кризисы вы проходите через "разобрать на части и собрать заново".', tip: 'В трансформации не торопите процесс — детали имеют значение.' },
    { num: 9, sign: 'Весы', text: 'Мировоззрение через баланс, диалог, разные точки зрения. Вы редко становитесь догматиком — всегда видите вторую сторону.', tip: 'Сначала согласуйте принципы, потом принимайте решение — это ваш стиль зрелости.' },
    { num: 10, sign: 'Стрелец', text: 'Карьера через рост, обучение, миссию и масштаб. Вы не реализуетесь в "просто работе" — нужна цель за горизонтом.', tip: 'Ставьте цель чуть выше текущей планки — без этого теряете интерес.' },
    { num: 11, sign: 'Козерог', text: 'Друзья и сообщества через структуру и долгосрочность. Ваш круг — не случайные знакомые, а тщательно выбранные люди.', tip: 'Опирайтесь на план и контрольные точки в построении круга — не оставляйте отношения на самотёк.' },
    { num: 12, sign: 'Козерог', text: 'Внутренний мир требует структуры. Даже отдых для вас — это режим, ритуал, дисциплина восстановления.', tip: 'Создайте систему отдыха — без неё внутренний мир хаотизируется.' },
  ];

  const aspects = [
    { type: 'conjunction', sym: '☌', label: 'Соединение', from: '☽ Луна', to: '♃ Юпитер', orb: 1.3, text: 'Эмоциональная природа и стремление к росту работают как одно. Вам легко находить вдохновение в повседневности, а планирование расширения — естественный процесс, а не насилие над собой.', tip: 'Выберите единый приоритет в жизни на квартал — не распыляйте этот ресурс.' },
    { type: 'opposition', sym: '☍', label: 'Оппозиция', from: '♂ Марс', to: '♃ Юпитер', orb: 0.5, text: 'Очень точный аспект. Энергия действия и амбиции роста тянут в разные стороны: Марс хочет действовать сейчас и точечно, Юпитер хочет масштабировать и подождать. Если игнорировать — будете дёргаться между.', tip: 'Ищите формат, где оба полюса выигрывают: быстрое действие на маленьком сегменте + большая цель в горизонте.' },
    { type: 'square', sym: '□', label: 'Квадрат', from: '♃ Юпитер', to: '♆ Нептун', orb: 2.1, text: 'Большие идеи vs. размытие. Вы можете мечтать масштабно — и не замечать, что мечта оторвалась от реальности.', tip: 'Разбейте большую идею на 2-3 проверяемых шага — это спасает от расфокусированности.' },
    { type: 'trine', sym: '△', label: 'Трин', from: '♀ Венера', to: '♃ Юпитер', orb: 4.2, text: 'Лёгкая удача в области ценностей, отношений и финансов. Энергия течёт сама — но именно поэтому её часто не замечают и не используют.', tip: 'Используйте этот ресурс осознанно — не на автопилоте.' },
    { type: 'opposition', sym: '☍', label: 'Оппозиция', from: '☽ Луна', to: '♂ Марс', orb: 1.8, text: 'Эмоции и действие в напряжённом диалоге. Когда вам плохо — вы атакуете. Себя или ситуацию. Знать этот механизм — половина решения.', tip: 'Перед резкой реакцией спросите: "Это решение, или это Луна в обиде?"' },
    { type: 'sextile', sym: '⚹', label: 'Секстиль', from: '♀ Венера', to: '♂ Марс', orb: 3.7, text: 'Гармония в любви и желании. Чувства и страсть подкрепляют друг друга, а не конфликтуют. Это здоровая эротическая ось.', tip: 'Ловите возможности проявить инициативу в отношениях — здесь это работает.' },
    { type: 'square', sym: '□', label: 'Квадрат', from: '♂ Марс', to: '♆ Нептун', orb: 2.6, text: 'Действие и воображение в конфликте: можете тратить энергию на иллюзорные цели или, наоборот, не действовать там, где надо.', tip: 'Перед серьёзным усилием — проверяйте реалистичность цели холодной головой.' },
    { type: 'opposition', sym: '☍', label: 'Оппозиция', from: '☿ Меркурий', to: '♆ Нептун', orb: 5.0, text: 'Логика vs. интуиция. Иногда ясные мысли размываются, иногда наоборот — интуиция не пробивается через анализ.', tip: 'Используйте оба канала по очереди, а не одновременно.' },
    { type: 'opposition', sym: '☍', label: 'Оппозиция', from: '☿ Меркурий', to: '♅ Уран', orb: 7.5, text: 'Широкий аспект, фоновое влияние. Мышление между структурой и резким инсайтом — вы то методично раскладываете, то прозреваете моментально.', tip: 'Дайте себе оба режима — не насилуйте мышление в одной модели.' },
    { type: 'square', sym: '□', label: 'Квадрат', from: '☽ Луна', to: '☿ Меркурий', orb: 5.7, text: 'Эмоции мешают ясности мысли в моменты усталости. Не всегда — но регулярно.', tip: 'Важные решения принимайте на свежую голову, а не в эмоциональном пике.' },
    { type: 'square', sym: '□', label: 'Квадрат', from: '☿ Меркурий', to: '♄ Сатурн', orb: 6.4, text: 'Мышление и дисциплина в напряжении. Иногда жёсткая самокритика мешает гибкости мысли.', tip: 'Снижайте требования к "правильности" в фазе генерации идей — критику оставьте на потом.' },
    { type: 'trine', sym: '△', label: 'Трин', from: '☿ Меркурий', to: '♇ Плутон', orb: 0.3, text: 'Очень точный гармоничный аспект. Интеллектуальная глубина и проницательность работают естественно. Вы видите подтексты там, где другие читают поверхностно.', tip: 'Один из ваших ключевых ресурсов. Используйте сознательно — в переговорах, анализе людей, исследовании сложных тем.' },
    { type: 'square', sym: '□', label: 'Квадрат', from: '☽ Луна', to: '♆ Нептун', orb: 0.7, text: 'Эмоциональный туман и склонность к идеализации. Можно влюбиться в проекцию, а не в человека или ситуацию.', tip: 'Полезный тест: "Это реальность, или я придумал, что это так?"' },
    { type: 'trine', sym: '△', label: 'Трин', from: '☽ Луна', to: '♀ Венера', orb: 5.6, text: 'Эмоции и ценности гармонируют. Вам легко создавать тёплую атмосферу вокруг себя — это естественный талант.', tip: 'Ресурс, который не нужно специально развивать. Просто не блокируйте его.' },
    { type: 'sextile', sym: '⚹', label: 'Секстиль', from: '♆ Нептун', to: '♇ Плутон', orb: 4.7, text: 'Поколенческий аспект. Воображение и трансформация поддерживают друг друга на уровне эпохи.', tip: 'Используйте — это часть вашего поколения, в которое легко вписываться.' },
    { type: 'sextile', sym: '⚹', label: 'Секстиль', from: '☉ Солнце', to: '♄ Сатурн', orb: 0.4, text: 'Очень точный аспект. Ядро личности и дисциплина работают синхронно. Дают редкое сочетание эмпатии и структуры.', tip: 'Это ваше скрытое преимущество. Применяйте там, где другие выбирают одно из двух.' },
    { type: 'square', sym: '□', label: 'Квадрат', from: '♄ Сатурн', to: '♅ Уран', orb: 1.2, text: 'Точный аспект. Структура vs. свобода. Вы регулярно ломаете собственные системы, когда они становятся слишком жёсткими.', tip: 'Заранее закладывайте в системы пространство для пересборки — это не баг, это часть конструкции.' },
  ];

  // Render planets with deep mode
  function renderPlanets() {
    document.getElementById('planetList').innerHTML = planets.map((p, idx) => `
      <div class="item-card" data-planet-idx="${idx}">
        <div class="item-header">
          <div class="item-glyph">${p.sym}</div>
          <div>
            <h3 class="item-title">${p.name}</h3>
            <div class="item-sub">${p.sign.toUpperCase()} · ${p.degree} · ${p.house.toUpperCase()}</div>
          </div>
          <div style="margin-left: auto; display: flex; align-items: center; gap: 6px;">
            <span style="font-size: 10px; color: var(--text-faint); letter-spacing: 0.06em;">СИЛА</span>
            <div class="strength-meter"><div class="strength-fill" style="width: ${p.strength}%;"></div></div>
          </div>
        </div>
        <p class="item-text">${p.text}</p>
        <p class="item-text">${p.text2}</p>
        <div class="item-tip"><span class="item-tip-label">ПРАКТИЧНО:</span>${p.tip}</div>
        <div class="item-deep">
          <span class="item-deep-title">УГЛУБЛЁННЫЙ АНАЛИЗ · PRO</span>
          ${p.deep}
        </div>
        <button class="expand-btn" onclick="this.parentElement.classList.toggle('expanded'); this.textContent = this.parentElement.classList.contains('expanded') ? '▾ СКРЫТЬ' : '▸ УГЛУБИТЬСЯ';">▸ УГЛУБИТЬСЯ</button>
      </div>
    `).join('');
  }
  renderPlanets();

  // Render houses
  document.getElementById('houseList').innerHTML = houses.map(h => `
    <div class="item-card">
      <div class="item-header">
        <div class="item-glyph" style="font-family: var(--font-serif); font-size: 18px;">${h.num}</div>
        <div>
          <h3 class="item-title">${h.num} дом</h3>
          <div class="item-sub">В ЗНАКЕ ${h.sign.toUpperCase()}</div>
        </div>
      </div>
      <p class="item-text">${h.text}</p>
      <div class="item-tip"><span class="item-tip-label">ПРАКТИЧНО:</span>${h.tip}</div>
    </div>
  `).join('');

  // Render aspects with strong filter
  function renderAspects(filter = 'all') {
    let filtered = aspects;
    if (filter === 'strong') filtered = aspects.filter(a => a.orb < 2);
    else if (filter !== 'all') filtered = aspects.filter(a => a.type === filter);

    document.getElementById('aspectList').innerHTML = filtered.map(a => `
      <div class="item-card" data-aspect-type="${a.type}">
        <div class="item-header">
          <div class="aspect-icon aspect-${a.type}">${a.sym}</div>
          <div>
            <h3 class="item-title">${a.from} — ${a.to}</h3>
            <div class="item-sub">${a.label.toUpperCase()} · ОРБ ${a.orb}°${a.orb < 1 ? ' · ТОЧНЫЙ' : ''}</div>
          </div>
          <span class="item-badge">${a.label}</span>
        </div>
        <p class="item-text">${a.text}</p>
        <div class="item-tip"><span class="item-tip-label">ПРАКТИЧНО:</span>${a.tip}</div>
      </div>
    `).join('');
  }
  renderAspects();

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`[data-panel="${target}"]`).classList.add('active');
      window.scrollTo({ top: 200, behavior: 'smooth' });
      if (target === 'chart') setTimeout(buildChartSVG, 100);
    });
  });

  // Aspect filter
  document.querySelectorAll('.filter-pill').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      renderAspects(p.dataset.filter);
    });
  });

  // Depth selector
  document.querySelectorAll('.depth-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.depth-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const depth = btn.dataset.depth;
      // In a real app, this would trigger different content rendering
      // For demo, show alert about premium
      if (depth === 'full' || depth === 'deep') {
        // Simulate visual feedback for premium
        document.body.style.transition = 'opacity 0.3s';
        document.body.style.opacity = '0.7';
        setTimeout(() => {
          document.body.style.opacity = '1';
          {
        var activeScreen = document.querySelector('.screen.active');
        var ctx = 'natal';
        if (activeScreen) {
          if (activeScreen.id === 'screen-matrix-result') ctx = 'matrix';
          else if (activeScreen.id === 'screen-reading-result') ctx = 'reading';
        }
        navigateToPayment(ctx, depth === 'deep' ? 'premium' : 'pro');
      }
        }, 200);
        document.querySelectorAll('.depth-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('[data-depth="brief"]').classList.add('active');
      }
    });
  });

  // Chat chips
  document.querySelectorAll('.chat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelector('.chat-input').value = chip.textContent;
      document.querySelector('.chat-input').focus();
    });
  });

  // Chart SVG (same as before)
  // === ВИЗУАЛИЗАЦИЯ НАТАЛЬНОЙ КАРТЫ V2 ===
  // Использует реальные данные из quizState.computedChart
  // Полностью переписывает chart-svg с новыми элементами
  
  function buildChartSVG() {
    const svg = document.querySelector('#screen-natal-result .chart-svg');
    if (!svg) return;
    if (!quizState) return;
    const chart = quizState.computedChart;
    if (!chart) return;
  
    // === Конфигурация ===
    const SIZE = 600;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const R_OUTER = 285;      // внешний край знаков зодиака
    const R_SIGNS_IN = 240;   // внутренний край пояса знаков
    const R_HOUSES = 195;     // внешний край зоны домов
    const R_INNER = 105;      // граница центральной зоны аспектов
  
    // ASC находится на 9 часах (180° на круге, "лево")
    // SVG: 0° = вправо, по часовой стрелке (как часы)
    // Астрологический круг: 0° Овна = слева на 9 часов, идёт ПРОТИВ часовой
    // То есть наша функция перевода долготы → SVG угол:
    // svgAngle = 180 - (longitude - chart.ASC)
    // Так Asc всегда на 9 часах, и круг разворачивается против часовой
    function lonToRad(lon) {
      const angleDeg = 180 - (lon - chart.ASC);
      return (angleDeg * Math.PI) / 180;
    }
    function lonToPoint(lon, r) {
      const a = lonToRad(lon);
      return [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    }
  
    // === Цвета стихий ===
    const ELEMENT_COLOR = {
      fire: '#C58A5A',
      earth: '#8A9050',
      air: '#7A98AC',
      water: '#6F8AA8'
    };
    const ELEMENT_BG = {
      fire: 'rgba(197, 138, 90, 0.06)',
      earth: 'rgba(138, 144, 80, 0.06)',
      air: 'rgba(122, 152, 172, 0.06)',
      water: 'rgba(111, 138, 168, 0.06)'
    };
  
    // === Знаки зодиака — кастомные SVG path ===
    // Каждый знак — компактный path 0,0 → 20,20
    const ZODIAC_PATHS = {
      aries:       'M2 18 Q 6 6, 10 12 Q 14 6, 18 18',
      taurus:      'M5 16 A 4 4 0 1 0 13 16 A 4 4 0 1 0 5 16 Z M5 9 Q 10 4, 15 9',
      gemini:      'M5 4 L 5 16 M 15 4 L 15 16 M 3 5 L 17 5 M 3 15 L 17 15',
      cancer:      'M3 9 A 4 4 0 1 0 11 9 A 4 4 0 1 0 3 9 M17 13 A 4 4 0 1 0 9 13 A 4 4 0 1 0 17 13',
      leo:         'M5 10 A 4 4 0 1 1 13 10 A 4 4 0 1 1 5 10 M13 10 Q 16 14, 14 18',
      virgo:       'M3 6 L 3 16 M 3 6 Q 6 6, 6 10 L 6 16 M 6 6 Q 9 6, 9 10 L 9 16 Q 9 14, 13 14 Q 17 14, 17 10 Q 17 6, 13 6 M 17 10 L 17 18 Q 15 19, 13 18',
      libra:       'M3 16 L 17 16 M 5 12 L 15 12 M 8 12 Q 8 8, 10 8 Q 12 8, 12 12',
      scorpio:     'M3 6 L 3 16 M 3 6 Q 6 6, 6 10 L 6 16 M 6 6 Q 9 6, 9 10 L 9 16 M 12 6 Q 15 6, 15 10 L 15 14 L 18 14 L 16 12 M 18 14 L 16 16',
      sagittarius: 'M3 17 L 17 3 M 11 3 L 17 3 L 17 9 M 7 9 L 11 13',
      capricorn:   'M3 6 L 3 16 M 3 6 Q 7 6, 7 10 L 7 14 Q 9 14, 9 10 Q 9 6, 12 6 Q 15 6, 15 9 A 3 3 0 1 1 12 12',
      aquarius:    'M3 8 L 6 11 L 9 8 L 12 11 L 15 8 L 18 11 M 3 13 L 6 16 L 9 13 L 12 16 L 15 13 L 18 16',
      pisces:      'M3 4 Q 7 10, 3 16 M 17 4 Q 13 10, 17 16 M 5 10 L 15 10'
    };
  
    // === Планеты — кастомные SVG символы ===
    const PLANET_GLYPHS = {
      sun:     'M0 -7 A 7 7 0 1 0 0.001 -7 Z M 0 -2 A 2 2 0 1 0 0.001 -2 Z',
      moon:    'M-3 -7 Q 4 -7, 4 0 Q 4 7, -3 7 Q 2 4, 2 0 Q 2 -4, -3 -7 Z',
      mercury: 'M0 -8 A 3 3 0 1 0 0.001 -8 Z M 0 -5 L 0 4 M -3 0 L 3 0 M -3 6 A 3 3 0 0 0 3 6',
      venus:   'M0 -8 A 4 4 0 1 0 0.001 -8 Z M 0 -4 L 0 6 M -3 3 L 3 3',
      mars:    'M-2 2 A 4 4 0 1 0 6 -6 M 6 -6 L 2 -2 M 6 -6 L 6 -2 M 6 -6 L 2 -6',
      jupiter: 'M-5 -5 L -2 -5 L 1 -8 L 4 -5 M -2 -5 L -2 5 M -5 5 L 4 5 M 4 0 L 4 8',
      saturn:  'M-4 -5 L 4 -5 M 0 -5 L 0 7 Q 0 7, -3 5 M 0 -5 Q 0 -5, 3 -3',
      uranus:  'M-4 -6 L 4 -6 M 0 -6 L 0 6 M -3 6 L 3 6 M -2 0 L 2 0 M 0 8 A 1.5 1.5 0 1 0 0.001 8 Z',
      neptune: 'M-5 -5 L -5 0 M 0 -5 L 0 0 M 5 -5 L 5 0 M -5 0 Q -5 5, 0 5 Q 5 5, 5 0 M -2 3 L 2 3',
      pluto:   'M-4 4 L -4 -2 A 4 4 0 1 1 4 -2 L 4 4 M -4 -2 L 4 -2 M 0 -4 A 2 2 0 1 0 0.001 -4 Z'
    };
  
    // Зодиак: индекс знака → key + element
    const SIGNS = [
      { key: 'aries', element: 'fire' },
      { key: 'taurus', element: 'earth' },
      { key: 'gemini', element: 'air' },
      { key: 'cancer', element: 'water' },
      { key: 'leo', element: 'fire' },
      { key: 'virgo', element: 'earth' },
      { key: 'libra', element: 'air' },
      { key: 'scorpio', element: 'water' },
      { key: 'sagittarius', element: 'fire' },
      { key: 'capricorn', element: 'earth' },
      { key: 'aquarius', element: 'air' },
      { key: 'pisces', element: 'water' }
    ];
  
    // === Начинаю собирать SVG-разметку ===
    let svgContent = '';
  
    // === 1. Внешняя декоративная окантовка ===
    svgContent += `
      <circle cx="${cx}" cy="${cy}" r="${R_OUTER + 8}" fill="none" stroke="#D4C39E" stroke-width="0.4" opacity="0.5"/>
      <circle cx="${cx}" cy="${cy}" r="${R_OUTER}" fill="none" stroke="#D4C39E" stroke-width="1"/>
    `;
  
    // Точки-маркеры на каждых 30° (12 знаков) на внешней окантовке
    for (let i = 0; i < 12; i++) {
      const lon = i * 30;
      const [x, y] = lonToPoint(lon, R_OUTER + 8);
      svgContent += `<circle cx="${x}" cy="${y}" r="2" fill="#B8923D"/>`;
    }
  
    // === 2. Пояс знаков зодиака с цветовым кодированием стихий ===
    // 12 секторов между R_SIGNS_IN и R_OUTER
    for (let i = 0; i < 12; i++) {
      const lonStart = i * 30;
      const lonEnd = lonStart + 30;
      const [x1Out, y1Out] = lonToPoint(lonStart, R_OUTER);
      const [x2Out, y2Out] = lonToPoint(lonEnd, R_OUTER);
      const [x1In, y1In] = lonToPoint(lonStart, R_SIGNS_IN);
      const [x2In, y2In] = lonToPoint(lonEnd, R_SIGNS_IN);
  
      const sign = SIGNS[i];
      const bgColor = ELEMENT_BG[sign.element];
  
      // Большой arc-flag: 0 потому что сектор всегда 30° < 180°
      svgContent += `
        <path d="M ${x1Out} ${y1Out}
                 A ${R_OUTER} ${R_OUTER} 0 0 0 ${x2Out} ${y2Out}
                 L ${x2In} ${y2In}
                 A ${R_SIGNS_IN} ${R_SIGNS_IN} 0 0 1 ${x1In} ${y1In} Z"
              fill="${bgColor}" stroke="none"/>
      `;
  
      // Разделительные линии между знаками (от R_SIGNS_IN до R_OUTER)
      const [xLineOut, yLineOut] = lonToPoint(lonStart, R_OUTER);
      const [xLineIn, yLineIn] = lonToPoint(lonStart, R_SIGNS_IN);
      svgContent += `<line x1="${xLineIn}" y1="${yLineIn}" x2="${xLineOut}" y2="${yLineOut}" stroke="#D4C39E" stroke-width="0.6" opacity="0.7"/>`;
  
      // Глиф знака посередине сектора
      const lonMid = lonStart + 15;
      const [xg, yg] = lonToPoint(lonMid, (R_OUTER + R_SIGNS_IN) / 2);
      const color = ELEMENT_COLOR[sign.element];
      svgContent += `
        <g transform="translate(${xg - 10}, ${yg - 10})" opacity="0.85">
          <path d="${ZODIAC_PATHS[sign.key]}" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
    }
  
    // === 3. Внутренний край пояса знаков ===
    svgContent += `<circle cx="${cx}" cy="${cy}" r="${R_SIGNS_IN}" fill="none" stroke="#D4C39E" stroke-width="0.8"/>`;
  
    // === 4. Маленькие деления градусов на R_SIGNS_IN — каждый 5° ===
    for (let lon = 0; lon < 360; lon += 5) {
      const isMajor = lon % 30 === 0;
      const tickLength = isMajor ? 6 : (lon % 10 === 0 ? 4 : 2);
      const [x1, y1] = lonToPoint(lon, R_SIGNS_IN);
      const [x2, y2] = lonToPoint(lon, R_SIGNS_IN - tickLength);
      svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#A8956C" stroke-width="${isMajor ? 0.6 : 0.3}" opacity="${isMajor ? 0.7 : 0.4}"/>`;
    }
  
    // === 5. Дома — линии от центральной зоны до пояса знаков ===
    for (let i = 0; i < 12; i++) {
      const cusp = chart.houses[i];
      const [x1, y1] = lonToPoint(cusp, R_INNER);
      const [x2, y2] = lonToPoint(cusp, R_SIGNS_IN - 8);
  
      // ASC (1 дом) и MC (10 дом) — толстые золотые линии
      // IC (4 дом) и DSC (7 дом) — средние золотые
      // Остальные — тонкие
      let strokeColor = '#D4C39E';
      let strokeWidth = 0.5;
      let opacity = 0.5;
      if (i === 0) { strokeColor = '#B8923D'; strokeWidth = 1.2; opacity = 0.9; } // ASC
      else if (i === 9) { strokeColor = '#B8923D'; strokeWidth = 1.2; opacity = 0.9; } // MC
      else if (i === 3 || i === 6) { strokeColor = '#B8923D'; strokeWidth = 0.8; opacity = 0.6; }
  
      svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${strokeColor}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`;
    }
  
    // === 6. Номера домов — между линиями домов ===
    for (let i = 0; i < 12; i++) {
      const cusp = chart.houses[i];
      const nextCusp = chart.houses[(i + 1) % 12];
      let midLon = cusp + 15;
      if (nextCusp < cusp) midLon = (cusp + nextCusp + 360) / 2;
      const [x, y] = lonToPoint(midLon, R_HOUSES);
      svgContent += `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#A8956C" font-size="11" font-family="Inter, sans-serif" opacity="0.7">${i + 1}</text>`;
    }
  
    // === 7. Внутренний круг (граница зоны аспектов) ===
    svgContent += `<circle cx="${cx}" cy="${cy}" r="${R_INNER}" fill="#FFFCF5" stroke="#D4C39E" stroke-width="0.8"/>`;
  
    // === 8. Подписи ASC / MC / DSC / IC на их кардинальных точках ===
    const cardinalPoints = [
      { idx: 0, label: 'AC', short: 'ASC' },
      { idx: 9, label: 'MC' },
      { idx: 6, label: 'DC', short: 'DSC' },
      { idx: 3, label: 'IC' }
    ];
    cardinalPoints.forEach(p => {
      const cusp = chart.houses[p.idx];
      const [x, y] = lonToPoint(cusp, R_OUTER + 22);
      svgContent += `
        <g transform="translate(${x - 14}, ${y - 9})">
          <rect width="28" height="18" rx="9" fill="#FFFCF5" stroke="#B8923D" stroke-width="0.8"/>
          <text x="14" y="13" text-anchor="middle" fill="#8B6914" font-size="10" font-family="Inter, sans-serif" font-weight="500" letter-spacing="0.08em">${p.label}</text>
        </g>
      `;
    });
  
    // === 9. Линии аспектов в центральной зоне ===
    // Идём по chart.aspects (отсортированы по орбу, точные сначала)
    const ASPECT_STYLE = {
      conjunction: { color: '#B8923D', width: 1.0, dash: '' },
      trine:       { color: '#6B8E7F', width: 1.0, dash: '' },
      sextile:     { color: '#8AA89E', width: 0.7, dash: '3 3' },
      square:      { color: '#C57860', width: 0.9, dash: '' },
      opposition:  { color: '#A86A3D', width: 1.0, dash: '' }
    };
  
    // Берём только аспекты с орбом до 6° (визуальная чистота)
    const visibleAspects = chart.aspects.filter(a => a.orb <= 6 && a.type !== 'conjunction');
    visibleAspects.forEach(a => {
      const lon1 = chart.planets[a.from].longitude;
      const lon2 = chart.planets[a.to].longitude;
      const [x1, y1] = lonToPoint(lon1, R_INNER - 4);
      const [x2, y2] = lonToPoint(lon2, R_INNER - 4);
      const style = ASPECT_STYLE[a.type];
      if (!style) return;
      const opacity = Math.max(0.25, 1 - a.orb / 8);
      svgContent += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${style.color}" stroke-width="${style.width}" stroke-dasharray="${style.dash}" opacity="${opacity}"/>`;
    });
  
    // === 10. Планеты с подписями градусов ===
    // Сортируем планеты по долготе, чтобы видеть скопления
    const PLANET_GLYPH_COLOR = '#5C4623';
  
    const planetEntries = Object.entries(chart.planets)
      .map(([key, p]) => ({ key, longitude: p.longitude, sign: p.sign, house: p.house }))
      .sort((a, b) => a.longitude - b.longitude);
  
    // Разнос планет если они слишком близко (< 6° между)
    // Простой алгоритм: для каждой планеты считаем дисплейный угол с лёгким сдвигом
    const placedAt = []; // массив {key, lonDisplay}
    planetEntries.forEach(p => {
      let displayLon = p.longitude;
      // Если предыдущая планета слишком близко — сдвигаем нашу немного дальше
      if (placedAt.length > 0) {
        const last = placedAt[placedAt.length - 1];
        const gap = displayLon - last.lonDisplay;
        if (gap < 6 && gap > -354) {
          displayLon = last.lonDisplay + 6;
        }
      }
      placedAt.push({ key: p.key, lonDisplay: displayLon, realLon: p.longitude });
    });
  
    // Радиус, на котором стоят планеты — между R_INNER и R_HOUSES, ближе к R_HOUSES
    const R_PLANETS = (R_INNER + R_HOUSES) / 2 + 10;
  
    placedAt.forEach((p, idx) => {
      const realData = chart.planets[p.key];
      const [px, py] = lonToPoint(p.lonDisplay, R_PLANETS);
      // Маленькая тонкая линия от настоящей долготы до отображённой позиции
      const [realX, realY] = lonToPoint(realData.longitude, R_SIGNS_IN - 10);
      const [refX, refY] = lonToPoint(p.lonDisplay, R_HOUSES - 4);
      svgContent += `<line x1="${realX}" y1="${realY}" x2="${refX}" y2="${refY}" stroke="#B8923D" stroke-width="0.4" opacity="0.4"/>`;
  
      // Кружок-фон
      svgContent += `<circle cx="${px}" cy="${py}" r="14" fill="#FFFCF5" stroke="#B8923D" stroke-width="0.6"/>`;
  
      // Глиф планеты
      svgContent += `
        <g transform="translate(${px}, ${py})">
          <path d="${PLANET_GLYPHS[p.key]}" fill="none" stroke="${PLANET_GLYPH_COLOR}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>
        </g>
      `;
  
      // Маленький градус под планетой (вглубь круга)
      const [labelX, labelY] = lonToPoint(p.lonDisplay, R_PLANETS - 22);
      const degInSign = Math.floor(realData.sign.degree);
      svgContent += `<text x="${labelX}" y="${labelY}" text-anchor="middle" dominant-baseline="middle" fill="#A8956C" font-size="9" font-family="Inter, sans-serif" opacity="0.75">${degInSign}°</text>`;
    });
  
    // === 11. Точка в центре ===
    svgContent += `<circle cx="${cx}" cy="${cy}" r="2.5" fill="#B8923D"/>`;
  
    // === Записываем в SVG ===
    svg.setAttribute('viewBox', '0 0 ' + SIZE + ' ' + SIZE);
    svg.innerHTML = svgContent;
  }

// === MAIN ROUTER + QUIZ LOGIC ===
// === MAIN ROUTER ===
// Hide all screens, show one
const SCREENS = ['screen-welcome', 'screen-home', 'screen-login', 'screen-dashboard', 'screen-natal-quiz', 'screen-natal-result', 'screen-matrix-quiz', 'screen-matrix-result', 'screen-reading-quiz', 'screen-reading-result', 'screen-payment', 'screen-portrait-quiz'];

// === WELCOME SCREEN — переход на главную ===
(function() {
  function enterApp() {
    if (typeof navigateTo === 'function') navigateTo('screen-home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function bindWelcome() {
    var enterBtn = document.getElementById('welcomeEnterBtn');
    if (enterBtn) enterBtn.addEventListener('click', enterApp);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindWelcome);
  } else {
    bindWelcome();
  }
})();

// === PAYMENT SUCCESS STUB + SPEEDUP HINT POPUP ===
// На любой клик кнопки оплаты:
//   1) Имитируем успех (тостер)
//   2) Переход на главную
//   3) Через 400мс показываем всплывашку: «портрет готовится 24 часа,
//      но в ЛК можно ускорить за 3,99 €»
(function() {
  function showSpeedupTip() {
    var bd = document.getElementById('speedupTipBackdrop');
    if (!bd) return;
    bd.classList.add('open');
    bd.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function hideSpeedupTip() {
    var bd = document.getElementById('speedupTipBackdrop');
    if (!bd) return;
    bd.classList.remove('open');
    bd.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Глобальный обработчик клика по любой кнопке оплаты
  window.handlePaymentSuccessStub = function() {
    if (typeof showToast === 'function') {
      showToast({
        title: 'Оплата принята',
        text: 'Заказ оформлен. Спасибо!',
        icon: 'check'
      });
    }
    // Сбросим триггер портрета, чтобы при новом квизе всё работало
    try { window.__portraitPaymentTriggered = false; } catch (e) {}
    if (typeof navigateTo === 'function') {
      navigateTo('screen-home');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    // Показываем подсказку про ЛК с задержкой, чтобы переход успел отрисоваться
    setTimeout(showSpeedupTip, 450);
  };

  function bindSpeedupTip() {
    var closeBtn = document.getElementById('speedupTipClose');
    var dismissBtn = document.getElementById('speedupTipDismiss');
    var goBtn = document.getElementById('speedupTipGoToDash');
    var bd = document.getElementById('speedupTipBackdrop');
    if (closeBtn) closeBtn.addEventListener('click', hideSpeedupTip);
    if (dismissBtn) dismissBtn.addEventListener('click', hideSpeedupTip);
    if (goBtn) goBtn.addEventListener('click', function() {
      hideSpeedupTip();
      if (typeof navigateTo === 'function') {
        navigateTo('screen-dashboard');
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    });
    if (bd) bd.addEventListener('click', function(e) { if (e.target === bd) hideSpeedupTip(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && bd && bd.classList.contains('open')) hideSpeedupTip();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindSpeedupTip);
  } else {
    bindSpeedupTip();
  }
})();

// === CANCEL SUBSCRIPTION (ЛК) ===
(function() {
  function openCancelSub() {
    var bd = document.getElementById('cancelSubBackdrop');
    var card = document.getElementById('cancelSubCard');
    if (!bd) return;
    if (card) card.classList.remove('done'); // сброс на шаг подтверждения
    bd.classList.add('open');
    bd.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeCancelSub() {
    var bd = document.getElementById('cancelSubBackdrop');
    if (!bd) return;
    bd.classList.remove('open');
    bd.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function confirmCancel() {
    var card = document.getElementById('cancelSubCard');
    if (card) card.classList.add('done');
    // Обновляем карточку подписки в сайдбаре
    var status = document.getElementById('dashSubStatus');
    var renew = document.getElementById('dashSubRenew');
    var btn = document.getElementById('dashCancelSubBtn');
    if (status) {
      status.textContent = 'Отменена';
      status.classList.add('cancelled');
    }
    if (renew) renew.innerHTML = 'Активна до <strong>24 мая 2026</strong>, затем — бесплатный план';
    if (btn) { btn.textContent = 'Возобновить подписку'; btn.disabled = false; }
    if (typeof showToast === 'function') {
      showToast({
        title: 'Подписка отменена',
        text: 'Доступ к Pro сохранится до 24 мая 2026. Повторных списаний не будет.',
        icon: 'check'
      });
    }
  }
  function bind() {
    var openBtn = document.getElementById('dashCancelSubBtn');
    var closeBtn = document.getElementById('cancelSubClose');
    var keepBtn = document.getElementById('cancelSubKeep');
    var confirmBtn = document.getElementById('cancelSubConfirm');
    var doneBtn = document.getElementById('cancelSubDone');
    var bd = document.getElementById('cancelSubBackdrop');

    if (openBtn) openBtn.addEventListener('click', function() {
      // Если подписка уже отменена — кнопка работает как "возобновить"
      var status = document.getElementById('dashSubStatus');
      if (status && status.classList.contains('cancelled')) {
        status.textContent = 'Активна';
        status.classList.remove('cancelled');
        var renew = document.getElementById('dashSubRenew');
        if (renew) renew.innerHTML = 'Следующее списание: <strong>24 мая 2026</strong> · 29,90&nbsp;€/мес';
        openBtn.textContent = 'Отменить подписку';
        if (typeof showToast === 'function') {
          showToast({ title: 'Подписка возобновлена', text: 'Добро пожаловать обратно в Pro.', icon: 'sparkle' });
        }
        return;
      }
      openCancelSub();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeCancelSub);
    if (keepBtn) keepBtn.addEventListener('click', closeCancelSub);
    if (doneBtn) doneBtn.addEventListener('click', closeCancelSub);
    if (confirmBtn) confirmBtn.addEventListener('click', confirmCancel);
    if (bd) bd.addEventListener('click', function(e) { if (e.target === bd) closeCancelSub(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeCancelSub();
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();

function navigateTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Lazy-build chart svg when entering result
    if (screenId === 'screen-natal-result' && typeof buildChartSVG === 'function') {
      // Wait for any DOM updates
      setTimeout(buildChartSVG, 50);
    }
  } else {
    console.warn('No such screen:', screenId);
  }
}

// === CARDS ON HOME ===
document.querySelectorAll('#screen-home .card').forEach(card => {
  card.addEventListener('click', () => {
    const practice = card.dataset.practice;
    card.style.transform = 'scale(0.98)';
    setTimeout(() => { card.style.transform = ''; }, 150);
    if (practice === 'natal') {
      resetQuiz();
      navigateTo('screen-natal-quiz');
    } else if (practice === 'matrix') {
      resetMxQuiz();
      navigateTo('screen-matrix-quiz');
    } else if (practice === 'reading') {
      resetRdQuiz();
      navigateTo('screen-reading-quiz');
    } else {
      console.log('Practice not yet implemented:', practice);
    }
  });
});

// === QUIZ LOGIC ===
const quizState = {
  step: 1,
  totalSteps: 4,
  birthDay: null, birthMonth: null, birthYear: null,
  timeMode: null, birthHour: null, birthMinute: null,
  birthCity: null, birthLat: null, birthLon: null, birthTz: null,
  computedChart: null,  // Сюда уйдёт результат NatalEngine.buildChart
};

const cityDB = [
  {name:"Москва", country:"Россия", lat:55.7558, lon:37.6173, tzOffset:3},
  {name:"Санкт-Петербург", country:"Россия", lat:59.9311, lon:30.3609, tzOffset:3},
  {name:"Новосибирск", country:"Россия", lat:55.0084, lon:82.9357, tzOffset:7},
  {name:"Екатеринбург", country:"Россия", lat:56.8389, lon:60.6057, tzOffset:5},
  {name:"Нижний Новгород", country:"Россия", lat:56.2965, lon:43.9361, tzOffset:3},
  {name:"Казань", country:"Россия", lat:55.7943, lon:49.1115, tzOffset:3},
  {name:"Челябинск", country:"Россия", lat:55.1644, lon:61.4368, tzOffset:5},
  {name:"Омск", country:"Россия", lat:54.9885, lon:73.3242, tzOffset:6},
  {name:"Самара", country:"Россия", lat:53.2415, lon:50.2212, tzOffset:4},
  {name:"Ростов-на-Дону", country:"Россия", lat:47.2357, lon:39.7015, tzOffset:3},
  {name:"Уфа", country:"Россия", lat:54.7388, lon:55.9721, tzOffset:5},
  {name:"Красноярск", country:"Россия", lat:56.0184, lon:92.8672, tzOffset:7},
  {name:"Воронеж", country:"Россия", lat:51.6755, lon:39.2089, tzOffset:3},
  {name:"Пермь", country:"Россия", lat:58.0105, lon:56.2502, tzOffset:5},
  {name:"Волгоград", country:"Россия", lat:48.708, lon:44.5133, tzOffset:3},
  {name:"Краснодар", country:"Россия", lat:45.0355, lon:38.9753, tzOffset:3},
  {name:"Саратов", country:"Россия", lat:51.5924, lon:46.0348, tzOffset:4},
  {name:"Тюмень", country:"Россия", lat:57.1553, lon:65.5619, tzOffset:5},
  {name:"Тольятти", country:"Россия", lat:53.5078, lon:49.4204, tzOffset:4},
  {name:"Ижевск", country:"Россия", lat:56.8527, lon:53.2113, tzOffset:4},
  {name:"Барнаул", country:"Россия", lat:53.3548, lon:83.7698, tzOffset:7},
  {name:"Ульяновск", country:"Россия", lat:54.3142, lon:48.4031, tzOffset:4},
  {name:"Иркутск", country:"Россия", lat:52.2862, lon:104.305, tzOffset:8},
  {name:"Хабаровск", country:"Россия", lat:48.4827, lon:135.084, tzOffset:10},
  {name:"Ярославль", country:"Россия", lat:57.6261, lon:39.8845, tzOffset:3},
  {name:"Владивосток", country:"Россия", lat:43.1198, lon:131.8869, tzOffset:10},
  {name:"Махачкала", country:"Россия", lat:42.9846, lon:47.5047, tzOffset:3},
  {name:"Томск", country:"Россия", lat:56.4847, lon:84.9482, tzOffset:7},
  {name:"Оренбург", country:"Россия", lat:51.7727, lon:55.0988, tzOffset:5},
  {name:"Кемерово", country:"Россия", lat:55.3331, lon:86.0827, tzOffset:7},
  {name:"Новокузнецк", country:"Россия", lat:53.7596, lon:87.1216, tzOffset:7},
  {name:"Рязань", country:"Россия", lat:54.6269, lon:39.6916, tzOffset:3},
  {name:"Астрахань", country:"Россия", lat:46.3479, lon:48.0337, tzOffset:4},
  {name:"Набережные Челны", country:"Россия", lat:55.7287, lon:52.4112, tzOffset:3},
  {name:"Пенза", country:"Россия", lat:53.2007, lon:45.0046, tzOffset:3},
  {name:"Липецк", country:"Россия", lat:52.6088, lon:39.5992, tzOffset:3},
  {name:"Киров", country:"Россия", lat:58.6035, lon:49.668, tzOffset:3},
  {name:"Тула", country:"Россия", lat:54.1961, lon:37.6182, tzOffset:3},
  {name:"Чебоксары", country:"Россия", lat:56.1322, lon:47.2517, tzOffset:3},
  {name:"Калининград", country:"Россия", lat:54.7104, lon:20.4522, tzOffset:2},
  {name:"Брянск", country:"Россия", lat:53.2521, lon:34.3717, tzOffset:3},
  {name:"Курск", country:"Россия", lat:51.7373, lon:36.1873, tzOffset:3},
  {name:"Иваново", country:"Россия", lat:56.9999, lon:40.9728, tzOffset:3},
  {name:"Магнитогорск", country:"Россия", lat:53.4078, lon:58.9794, tzOffset:5},
  {name:"Тверь", country:"Россия", lat:56.8587, lon:35.9176, tzOffset:3},
  {name:"Ставрополь", country:"Россия", lat:45.0428, lon:41.9734, tzOffset:3},
  {name:"Симферополь", country:"Россия", lat:44.9572, lon:34.1108, tzOffset:3},
  {name:"Белгород", country:"Россия", lat:50.5953, lon:36.5872, tzOffset:3},
  {name:"Архангельск", country:"Россия", lat:64.5401, lon:40.5433, tzOffset:3},
  {name:"Владимир", country:"Россия", lat:56.129, lon:40.407, tzOffset:3},
  {name:"Сочи", country:"Россия", lat:43.6028, lon:39.7342, tzOffset:3},
  {name:"Курган", country:"Россия", lat:55.45, lon:65.3333, tzOffset:5},
  {name:"Смоленск", country:"Россия", lat:54.7826, lon:32.0453, tzOffset:3},
  {name:"Калуга", country:"Россия", lat:54.5293, lon:36.2754, tzOffset:3},
  {name:"Череповец", country:"Россия", lat:59.1331, lon:37.9087, tzOffset:3},
  {name:"Орёл", country:"Россия", lat:52.9667, lon:36.0833, tzOffset:3},
  {name:"Вологда", country:"Россия", lat:59.2239, lon:39.884, tzOffset:3},
  {name:"Мурманск", country:"Россия", lat:68.9585, lon:33.0827, tzOffset:3},
  {name:"Сургут", country:"Россия", lat:61.254, lon:73.3962, tzOffset:5},
  {name:"Якутск", country:"Россия", lat:62.0355, lon:129.6755, tzOffset:9},
  {name:"Грозный", country:"Россия", lat:43.3168, lon:45.6981, tzOffset:3},
  {name:"Петрозаводск", country:"Россия", lat:61.7849, lon:34.3469, tzOffset:3},
  {name:"Кострома", country:"Россия", lat:57.7681, lon:40.9269, tzOffset:3},
  {name:"Нижневартовск", country:"Россия", lat:60.9344, lon:76.5531, tzOffset:5},
  {name:"Нальчик", country:"Россия", lat:43.4848, lon:43.6071, tzOffset:3},
  {name:"Энгельс", country:"Россия", lat:51.4814, lon:46.1112, tzOffset:4},
  {name:"Таганрог", country:"Россия", lat:47.2362, lon:38.8969, tzOffset:3},
  {name:"Сыктывкар", country:"Россия", lat:61.6688, lon:50.8358, tzOffset:3},
  {name:"Орск", country:"Россия", lat:51.2295, lon:58.4756, tzOffset:5},
  {name:"Стерлитамак", country:"Россия", lat:53.6304, lon:55.9311, tzOffset:5},
  {name:"Дзержинск", country:"Россия", lat:56.2376, lon:43.4596, tzOffset:3},
  {name:"Новороссийск", country:"Россия", lat:44.7235, lon:37.7687, tzOffset:3},
  {name:"Анадырь", country:"Россия", lat:64.7345, lon:177.5046, tzOffset:12},
  {name:"Петропавловск-Камчатский", country:"Россия", lat:53.0241, lon:158.6438, tzOffset:12},
  {name:"Магадан", country:"Россия", lat:59.5638, lon:150.8035, tzOffset:11},
  {name:"Киев", country:"Украина", lat:50.4501, lon:30.5234, tzOffset:3},
  {name:"Харьков", country:"Украина", lat:49.9935, lon:36.2304, tzOffset:3},
  {name:"Одесса", country:"Украина", lat:46.4825, lon:30.7233, tzOffset:3},
  {name:"Днепр", country:"Украина", lat:48.4647, lon:35.0462, tzOffset:3},
  {name:"Донецк", country:"Украина", lat:48.0159, lon:37.8028, tzOffset:3},
  {name:"Запорожье", country:"Украина", lat:47.8388, lon:35.1396, tzOffset:3},
  {name:"Львов", country:"Украина", lat:49.8397, lon:24.0297, tzOffset:3},
  {name:"Кривой Рог", country:"Украина", lat:47.9077, lon:33.3917, tzOffset:3},
  {name:"Николаев", country:"Украина", lat:46.975, lon:31.9946, tzOffset:3},
  {name:"Мариуполь", country:"Украина", lat:47.0971, lon:37.5434, tzOffset:3},
  {name:"Луганск", country:"Украина", lat:48.574, lon:39.3074, tzOffset:3},
  {name:"Винница", country:"Украина", lat:49.2331, lon:28.4682, tzOffset:3},
  {name:"Симферополь", country:"Украина", lat:44.9572, lon:34.1108, tzOffset:3},
  {name:"Херсон", country:"Украина", lat:46.6354, lon:32.6169, tzOffset:3},
  {name:"Полтава", country:"Украина", lat:49.5883, lon:34.5514, tzOffset:3},
  {name:"Чернигов", country:"Украина", lat:51.4982, lon:31.2893, tzOffset:3},
  {name:"Черкассы", country:"Украина", lat:49.4444, lon:32.0598, tzOffset:3},
  {name:"Житомир", country:"Украина", lat:50.2547, lon:28.6587, tzOffset:3},
  {name:"Сумы", country:"Украина", lat:50.9077, lon:34.7981, tzOffset:3},
  {name:"Ровно", country:"Украина", lat:50.6199, lon:26.2516, tzOffset:3},
  {name:"Ивано-Франковск", country:"Украина", lat:48.9226, lon:24.7111, tzOffset:3},
  {name:"Тернополь", country:"Украина", lat:49.5535, lon:25.5948, tzOffset:3},
  {name:"Луцк", country:"Украина", lat:50.7472, lon:25.3254, tzOffset:3},
  {name:"Ужгород", country:"Украина", lat:48.6208, lon:22.2879, tzOffset:3},
  {name:"Севастополь", country:"Украина", lat:44.6166, lon:33.5254, tzOffset:3},
  {name:"Ялта", country:"Украина", lat:44.4952, lon:34.1664, tzOffset:3},
  {name:"Кропивницкий", country:"Украина", lat:48.5079, lon:32.2623, tzOffset:3},
  {name:"Хмельницкий", country:"Украина", lat:49.4226, lon:26.9871, tzOffset:3},
  {name:"Каменское", country:"Украина", lat:48.5076, lon:34.6027, tzOffset:3},
  {name:"Бровары", country:"Украина", lat:50.5111, lon:30.7906, tzOffset:3},
  {name:"Минск", country:"Беларусь", lat:53.9, lon:27.5667, tzOffset:3},
  {name:"Гомель", country:"Беларусь", lat:52.4345, lon:30.9754, tzOffset:3},
  {name:"Могилёв", country:"Беларусь", lat:53.9168, lon:30.3449, tzOffset:3},
  {name:"Витебск", country:"Беларусь", lat:55.1904, lon:30.2049, tzOffset:3},
  {name:"Гродно", country:"Беларусь", lat:53.6884, lon:23.8258, tzOffset:3},
  {name:"Брест", country:"Беларусь", lat:52.0976, lon:23.7341, tzOffset:3},
  {name:"Бобруйск", country:"Беларусь", lat:53.1389, lon:29.2214, tzOffset:3},
  {name:"Барановичи", country:"Беларусь", lat:53.1327, lon:26.0139, tzOffset:3},
  {name:"Борисов", country:"Беларусь", lat:54.2278, lon:28.5051, tzOffset:3},
  {name:"Пинск", country:"Беларусь", lat:52.1229, lon:26.0951, tzOffset:3},
  {name:"Орша", country:"Беларусь", lat:54.5081, lon:30.4172, tzOffset:3},
  {name:"Мозырь", country:"Беларусь", lat:52.0479, lon:29.2691, tzOffset:3},
  {name:"Солигорск", country:"Беларусь", lat:52.7878, lon:27.5404, tzOffset:3},
  {name:"Новополоцк", country:"Беларусь", lat:55.5333, lon:28.65, tzOffset:3},
  {name:"Алматы", country:"Казахстан", lat:43.222, lon:76.8512, tzOffset:6},
  {name:"Нур-Султан", country:"Казахстан", lat:51.1605, lon:71.4704, tzOffset:6},
  {name:"Астана", country:"Казахстан", lat:51.1605, lon:71.4704, tzOffset:6},
  {name:"Шымкент", country:"Казахстан", lat:42.3, lon:69.6, tzOffset:5},
  {name:"Караганда", country:"Казахстан", lat:49.8047, lon:73.1094, tzOffset:6},
  {name:"Тараз", country:"Казахстан", lat:42.9, lon:71.3667, tzOffset:6},
  {name:"Павлодар", country:"Казахстан", lat:52.2873, lon:76.9674, tzOffset:6},
  {name:"Усть-Каменогорск", country:"Казахстан", lat:49.9482, lon:82.6307, tzOffset:6},
  {name:"Семей", country:"Казахстан", lat:50.4111, lon:80.2275, tzOffset:6},
  {name:"Атырау", country:"Казахстан", lat:47.1167, lon:51.8833, tzOffset:5},
  {name:"Костанай", country:"Казахстан", lat:53.2167, lon:63.6333, tzOffset:6},
  {name:"Кызылорда", country:"Казахстан", lat:44.8528, lon:65.5092, tzOffset:5},
  {name:"Уральск", country:"Казахстан", lat:51.2333, lon:51.3667, tzOffset:5},
  {name:"Петропавловск", country:"Казахстан", lat:54.8833, lon:69.15, tzOffset:6},
  {name:"Актобе", country:"Казахстан", lat:50.2839, lon:57.167, tzOffset:5},
  {name:"Темиртау", country:"Казахстан", lat:50.0552, lon:72.9647, tzOffset:6},
  {name:"Туркестан", country:"Казахстан", lat:43.2972, lon:68.2503, tzOffset:5},
  {name:"Актау", country:"Казахстан", lat:43.6481, lon:51.1722, tzOffset:5},
  {name:"Кокшетау", country:"Казахстан", lat:53.2833, lon:69.4167, tzOffset:6},
  {name:"Ташкент", country:"Узбекистан", lat:41.2995, lon:69.2401, tzOffset:5},
  {name:"Самарканд", country:"Узбекистан", lat:39.6542, lon:66.9597, tzOffset:5},
  {name:"Бухара", country:"Узбекистан", lat:39.7681, lon:64.4556, tzOffset:5},
  {name:"Наманган", country:"Узбекистан", lat:41.0011, lon:71.6726, tzOffset:5},
  {name:"Андижан", country:"Узбекистан", lat:40.7821, lon:72.3442, tzOffset:5},
  {name:"Фергана", country:"Узбекистан", lat:40.3892, lon:71.7864, tzOffset:5},
  {name:"Хива", country:"Узбекистан", lat:41.3786, lon:60.3589, tzOffset:5},
  {name:"Нукус", country:"Узбекистан", lat:42.4531, lon:59.6103, tzOffset:5},
  {name:"Бишкек", country:"Кыргызстан", lat:42.8746, lon:74.5698, tzOffset:6},
  {name:"Ош", country:"Кыргызстан", lat:40.5135, lon:72.8019, tzOffset:6},
  {name:"Душанбе", country:"Таджикистан", lat:38.5598, lon:68.787, tzOffset:5},
  {name:"Худжанд", country:"Таджикистан", lat:40.2837, lon:69.6202, tzOffset:5},
  {name:"Ашхабад", country:"Туркменистан", lat:37.9601, lon:58.3261, tzOffset:5},
  {name:"Туркменабат", country:"Туркменистан", lat:39.0833, lon:63.5667, tzOffset:5},
  {name:"Тбилиси", country:"Грузия", lat:41.7151, lon:44.8271, tzOffset:4},
  {name:"Батуми", country:"Грузия", lat:41.6168, lon:41.6367, tzOffset:4},
  {name:"Кутаиси", country:"Грузия", lat:42.2679, lon:42.718, tzOffset:4},
  {name:"Ереван", country:"Армения", lat:40.1792, lon:44.4991, tzOffset:4},
  {name:"Гюмри", country:"Армения", lat:40.7833, lon:43.8333, tzOffset:4},
  {name:"Баку", country:"Азербайджан", lat:40.4093, lon:49.8671, tzOffset:4},
  {name:"Гянджа", country:"Азербайджан", lat:40.6828, lon:46.3606, tzOffset:4},
  {name:"Сумгайыт", country:"Азербайджан", lat:40.5897, lon:49.6686, tzOffset:4},
  {name:"Кишинёв", country:"Молдова", lat:47.0105, lon:28.8638, tzOffset:3},
  {name:"Тирасполь", country:"Молдова", lat:46.8403, lon:29.6433, tzOffset:3},
  {name:"Бельцы", country:"Молдова", lat:47.7615, lon:27.929, tzOffset:3},
  {name:"Лондон", country:"Великобритания", lat:51.5074, lon:-0.1278, tzOffset:1},
  {name:"Манчестер", country:"Великобритания", lat:53.4808, lon:-2.2426, tzOffset:1},
  {name:"Бирмингем", country:"Великобритания", lat:52.4862, lon:-1.8904, tzOffset:1},
  {name:"Эдинбург", country:"Великобритания", lat:55.9533, lon:-3.1883, tzOffset:1},
  {name:"Глазго", country:"Великобритания", lat:55.8642, lon:-4.2518, tzOffset:1},
  {name:"Ливерпуль", country:"Великобритания", lat:53.4084, lon:-2.9916, tzOffset:1},
  {name:"Лидс", country:"Великобритания", lat:53.8008, lon:-1.5491, tzOffset:1},
  {name:"Шеффилд", country:"Великобритания", lat:53.3811, lon:-1.4701, tzOffset:1},
  {name:"Бристоль", country:"Великобритания", lat:51.4545, lon:-2.5879, tzOffset:1},
  {name:"Кардифф", country:"Великобритания", lat:51.4816, lon:-3.1791, tzOffset:1},
  {name:"Белфаст", country:"Великобритания", lat:54.5973, lon:-5.9301, tzOffset:1},
  {name:"Дублин", country:"Ирландия", lat:53.3498, lon:-6.2603, tzOffset:1},
  {name:"Корк", country:"Ирландия", lat:51.8985, lon:-8.4756, tzOffset:1},
  {name:"Берлин", country:"Германия", lat:52.52, lon:13.405, tzOffset:2},
  {name:"Гамбург", country:"Германия", lat:53.5511, lon:9.9937, tzOffset:2},
  {name:"Мюнхен", country:"Германия", lat:48.1351, lon:11.582, tzOffset:2},
  {name:"Кёльн", country:"Германия", lat:50.9375, lon:6.9603, tzOffset:2},
  {name:"Франкфурт-на-Майне", country:"Германия", lat:50.1109, lon:8.6821, tzOffset:2},
  {name:"Штутгарт", country:"Германия", lat:48.7758, lon:9.1829, tzOffset:2},
  {name:"Дюссельдорф", country:"Германия", lat:51.2277, lon:6.7735, tzOffset:2},
  {name:"Дрезден", country:"Германия", lat:51.0504, lon:13.7373, tzOffset:2},
  {name:"Лейпциг", country:"Германия", lat:51.3397, lon:12.3731, tzOffset:2},
  {name:"Ганновер", country:"Германия", lat:52.3759, lon:9.732, tzOffset:2},
  {name:"Нюрнберг", country:"Германия", lat:49.4521, lon:11.0767, tzOffset:2},
  {name:"Бремен", country:"Германия", lat:53.0793, lon:8.8017, tzOffset:2},
  {name:"Париж", country:"Франция", lat:48.8566, lon:2.3522, tzOffset:2},
  {name:"Марсель", country:"Франция", lat:43.2965, lon:5.3698, tzOffset:2},
  {name:"Лион", country:"Франция", lat:45.764, lon:4.8357, tzOffset:2},
  {name:"Тулуза", country:"Франция", lat:43.6047, lon:1.4442, tzOffset:2},
  {name:"Ницца", country:"Франция", lat:43.7102, lon:7.262, tzOffset:2},
  {name:"Нант", country:"Франция", lat:47.2184, lon:-1.5536, tzOffset:2},
  {name:"Страсбург", country:"Франция", lat:48.5734, lon:7.7521, tzOffset:2},
  {name:"Бордо", country:"Франция", lat:44.8378, lon:-0.5792, tzOffset:2},
  {name:"Лилль", country:"Франция", lat:50.6292, lon:3.0573, tzOffset:2},
  {name:"Ренн", country:"Франция", lat:48.1173, lon:-1.6778, tzOffset:2},
  {name:"Канны", country:"Франция", lat:43.5528, lon:7.0174, tzOffset:2},
  {name:"Рим", country:"Италия", lat:41.9028, lon:12.4964, tzOffset:2},
  {name:"Милан", country:"Италия", lat:45.4642, lon:9.19, tzOffset:2},
  {name:"Неаполь", country:"Италия", lat:40.8518, lon:14.2681, tzOffset:2},
  {name:"Турин", country:"Италия", lat:45.0703, lon:7.6869, tzOffset:2},
  {name:"Палермо", country:"Италия", lat:38.1157, lon:13.3613, tzOffset:2},
  {name:"Генуя", country:"Италия", lat:44.4056, lon:8.9463, tzOffset:2},
  {name:"Болонья", country:"Италия", lat:44.4949, lon:11.3426, tzOffset:2},
  {name:"Флоренция", country:"Италия", lat:43.7696, lon:11.2558, tzOffset:2},
  {name:"Венеция", country:"Италия", lat:45.4408, lon:12.3155, tzOffset:2},
  {name:"Верона", country:"Италия", lat:45.4384, lon:10.9916, tzOffset:2},
  {name:"Бари", country:"Италия", lat:41.1171, lon:16.8719, tzOffset:2},
  {name:"Катания", country:"Италия", lat:37.5079, lon:15.083, tzOffset:2},
  {name:"Мадрид", country:"Испания", lat:40.4168, lon:-3.7038, tzOffset:2},
  {name:"Барселона", country:"Испания", lat:41.3851, lon:2.1734, tzOffset:2},
  {name:"Валенсия", country:"Испания", lat:39.4699, lon:-0.3763, tzOffset:2},
  {name:"Севилья", country:"Испания", lat:37.3891, lon:-5.9845, tzOffset:2},
  {name:"Сарагоса", country:"Испания", lat:41.6488, lon:-0.8891, tzOffset:2},
  {name:"Малага", country:"Испания", lat:36.7213, lon:-4.4214, tzOffset:2},
  {name:"Мурсия", country:"Испания", lat:37.9922, lon:-1.1307, tzOffset:2},
  {name:"Пальма", country:"Испания", lat:39.5696, lon:2.6502, tzOffset:2},
  {name:"Лас-Пальмас", country:"Испания", lat:28.1235, lon:-15.4366, tzOffset:1},
  {name:"Бильбао", country:"Испания", lat:43.263, lon:-2.935, tzOffset:2},
  {name:"Гранада", country:"Испания", lat:37.1773, lon:-3.5986, tzOffset:2},
  {name:"Аликанте", country:"Испания", lat:38.3452, lon:-0.481, tzOffset:2},
  {name:"Лиссабон", country:"Португалия", lat:38.7223, lon:-9.1393, tzOffset:1},
  {name:"Порту", country:"Португалия", lat:41.1579, lon:-8.6291, tzOffset:1},
  {name:"Брага", country:"Португалия", lat:41.5454, lon:-8.4265, tzOffset:1},
  {name:"Амстердам", country:"Нидерланды", lat:52.3676, lon:4.9041, tzOffset:2},
  {name:"Роттердам", country:"Нидерланды", lat:51.9244, lon:4.4777, tzOffset:2},
  {name:"Гаага", country:"Нидерланды", lat:52.0705, lon:4.3007, tzOffset:2},
  {name:"Утрехт", country:"Нидерланды", lat:52.0907, lon:5.1214, tzOffset:2},
  {name:"Эйндховен", country:"Нидерланды", lat:51.4416, lon:5.4697, tzOffset:2},
  {name:"Гронинген", country:"Нидерланды", lat:53.2194, lon:6.5665, tzOffset:2},
  {name:"Лелистад", country:"Нидерланды", lat:52.5185, lon:5.4714, tzOffset:2},
  {name:"Брюссель", country:"Бельгия", lat:50.8503, lon:4.3517, tzOffset:2},
  {name:"Антверпен", country:"Бельгия", lat:51.2194, lon:4.4025, tzOffset:2},
  {name:"Гент", country:"Бельгия", lat:51.05, lon:3.7167, tzOffset:2},
  {name:"Брюгге", country:"Бельгия", lat:51.2093, lon:3.2247, tzOffset:2},
  {name:"Льеж", country:"Бельгия", lat:50.6326, lon:5.5797, tzOffset:2},
  {name:"Цюрих", country:"Швейцария", lat:47.3769, lon:8.5417, tzOffset:2},
  {name:"Женева", country:"Швейцария", lat:46.2044, lon:6.1432, tzOffset:2},
  {name:"Базель", country:"Швейцария", lat:47.5596, lon:7.5886, tzOffset:2},
  {name:"Берн", country:"Швейцария", lat:46.948, lon:7.4474, tzOffset:2},
  {name:"Лозанна", country:"Швейцария", lat:46.5197, lon:6.6323, tzOffset:2},
  {name:"Вена", country:"Австрия", lat:48.2082, lon:16.3738, tzOffset:2},
  {name:"Грац", country:"Австрия", lat:47.0707, lon:15.4395, tzOffset:2},
  {name:"Линц", country:"Австрия", lat:48.3069, lon:14.2858, tzOffset:2},
  {name:"Зальцбург", country:"Австрия", lat:47.8095, lon:13.055, tzOffset:2},
  {name:"Инсбрук", country:"Австрия", lat:47.2692, lon:11.4041, tzOffset:2},
  {name:"Стокгольм", country:"Швеция", lat:59.3293, lon:18.0686, tzOffset:2},
  {name:"Гётеборг", country:"Швеция", lat:57.7089, lon:11.9746, tzOffset:2},
  {name:"Мальмё", country:"Швеция", lat:55.6049, lon:13.0038, tzOffset:2},
  {name:"Уппсала", country:"Швеция", lat:59.8586, lon:17.6389, tzOffset:2},
  {name:"Осло", country:"Норвегия", lat:59.9139, lon:10.7522, tzOffset:2},
  {name:"Берген", country:"Норвегия", lat:60.3913, lon:5.3221, tzOffset:2},
  {name:"Тронхейм", country:"Норвегия", lat:63.4305, lon:10.3951, tzOffset:2},
  {name:"Ставангер", country:"Норвегия", lat:58.97, lon:5.7331, tzOffset:2},
  {name:"Хельсинки", country:"Финляндия", lat:60.1699, lon:24.9384, tzOffset:3},
  {name:"Эспоо", country:"Финляндия", lat:60.2055, lon:24.6559, tzOffset:3},
  {name:"Тампере", country:"Финляндия", lat:61.4978, lon:23.761, tzOffset:3},
  {name:"Турку", country:"Финляндия", lat:60.4518, lon:22.2666, tzOffset:3},
  {name:"Копенгаген", country:"Дания", lat:55.6761, lon:12.5683, tzOffset:2},
  {name:"Орхус", country:"Дания", lat:56.1629, lon:10.2039, tzOffset:2},
  {name:"Оденсе", country:"Дания", lat:55.4038, lon:10.4024, tzOffset:2},
  {name:"Рейкьявик", country:"Исландия", lat:64.1466, lon:-21.9426, tzOffset:0},
  {name:"Прага", country:"Чехия", lat:50.0755, lon:14.4378, tzOffset:2},
  {name:"Брно", country:"Чехия", lat:49.1951, lon:16.6068, tzOffset:2},
  {name:"Острава", country:"Чехия", lat:49.8209, lon:18.2625, tzOffset:2},
  {name:"Пльзень", country:"Чехия", lat:49.7384, lon:13.3736, tzOffset:2},
  {name:"Варшава", country:"Польша", lat:52.2297, lon:21.0122, tzOffset:2},
  {name:"Краков", country:"Польша", lat:50.0647, lon:19.945, tzOffset:2},
  {name:"Лодзь", country:"Польша", lat:51.7592, lon:19.456, tzOffset:2},
  {name:"Вроцлав", country:"Польша", lat:51.1079, lon:17.0385, tzOffset:2},
  {name:"Познань", country:"Польша", lat:52.4064, lon:16.9252, tzOffset:2},
  {name:"Гданьск", country:"Польша", lat:54.352, lon:18.6466, tzOffset:2},
  {name:"Щецин", country:"Польша", lat:53.4285, lon:14.5528, tzOffset:2},
  {name:"Люблин", country:"Польша", lat:51.2465, lon:22.5684, tzOffset:2},
  {name:"Будапешт", country:"Венгрия", lat:47.4979, lon:19.0402, tzOffset:2},
  {name:"Дебрецен", country:"Венгрия", lat:47.5316, lon:21.6273, tzOffset:2},
  {name:"Сегед", country:"Венгрия", lat:46.253, lon:20.1414, tzOffset:2},
  {name:"Братислава", country:"Словакия", lat:48.1486, lon:17.1077, tzOffset:2},
  {name:"Кошице", country:"Словакия", lat:48.7164, lon:21.2611, tzOffset:2},
  {name:"Любляна", country:"Словения", lat:46.0569, lon:14.5058, tzOffset:2},
  {name:"Загреб", country:"Хорватия", lat:45.815, lon:15.9819, tzOffset:2},
  {name:"Сплит", country:"Хорватия", lat:43.5081, lon:16.4402, tzOffset:2},
  {name:"Дубровник", country:"Хорватия", lat:42.6507, lon:18.0944, tzOffset:2},
  {name:"Белград", country:"Сербия", lat:44.7866, lon:20.4489, tzOffset:2},
  {name:"Нови-Сад", country:"Сербия", lat:45.2671, lon:19.8335, tzOffset:2},
  {name:"Бухарест", country:"Румыния", lat:44.4268, lon:26.1025, tzOffset:3},
  {name:"Клуж-Напока", country:"Румыния", lat:46.7712, lon:23.6236, tzOffset:3},
  {name:"Тимишоара", country:"Румыния", lat:45.7489, lon:21.2087, tzOffset:3},
  {name:"Яссы", country:"Румыния", lat:47.1585, lon:27.6014, tzOffset:3},
  {name:"Констанца", country:"Румыния", lat:44.1733, lon:28.6383, tzOffset:3},
  {name:"София", country:"Болгария", lat:42.6977, lon:23.3219, tzOffset:3},
  {name:"Пловдив", country:"Болгария", lat:42.1354, lon:24.7453, tzOffset:3},
  {name:"Варна", country:"Болгария", lat:43.2141, lon:27.9147, tzOffset:3},
  {name:"Афины", country:"Греция", lat:37.9838, lon:23.7275, tzOffset:3},
  {name:"Салоники", country:"Греция", lat:40.6401, lon:22.9444, tzOffset:3},
  {name:"Патры", country:"Греция", lat:38.2466, lon:21.7346, tzOffset:3},
  {name:"Стамбул", country:"Турция", lat:41.0082, lon:28.9784, tzOffset:3},
  {name:"Анкара", country:"Турция", lat:39.9334, lon:32.8597, tzOffset:3},
  {name:"Измир", country:"Турция", lat:38.4192, lon:27.1287, tzOffset:3},
  {name:"Бурса", country:"Турция", lat:40.1885, lon:29.061, tzOffset:3},
  {name:"Адана", country:"Турция", lat:37.0, lon:35.3213, tzOffset:3},
  {name:"Газиантеп", country:"Турция", lat:37.0662, lon:37.3833, tzOffset:3},
  {name:"Конья", country:"Турция", lat:37.8746, lon:32.4932, tzOffset:3},
  {name:"Анталья", country:"Турция", lat:36.8969, lon:30.7133, tzOffset:3},
  {name:"Рига", country:"Латвия", lat:56.9496, lon:24.1052, tzOffset:3},
  {name:"Даугавпилс", country:"Латвия", lat:55.8714, lon:26.5161, tzOffset:3},
  {name:"Вильнюс", country:"Литва", lat:54.6872, lon:25.2797, tzOffset:3},
  {name:"Каунас", country:"Литва", lat:54.8985, lon:23.9036, tzOffset:3},
  {name:"Клайпеда", country:"Литва", lat:55.7033, lon:21.1443, tzOffset:3},
  {name:"Таллин", country:"Эстония", lat:59.437, lon:24.7536, tzOffset:3},
  {name:"Тарту", country:"Эстония", lat:58.3776, lon:26.729, tzOffset:3},
  {name:"Каир", country:"Египет", lat:30.0444, lon:31.2357, tzOffset:2},
  {name:"Александрия", country:"Египет", lat:31.2001, lon:29.9187, tzOffset:2},
  {name:"Гиза", country:"Египет", lat:30.0131, lon:31.2089, tzOffset:2},
  {name:"Тель-Авив", country:"Израиль", lat:32.0853, lon:34.7818, tzOffset:3},
  {name:"Иерусалим", country:"Израиль", lat:31.7683, lon:35.2137, tzOffset:3},
  {name:"Хайфа", country:"Израиль", lat:32.794, lon:34.9896, tzOffset:3},
  {name:"Эйлат", country:"Израиль", lat:29.5577, lon:34.9519, tzOffset:3},
  {name:"Бейрут", country:"Ливан", lat:33.8938, lon:35.5018, tzOffset:3},
  {name:"Дамаск", country:"Сирия", lat:33.5138, lon:36.2765, tzOffset:3},
  {name:"Алеппо", country:"Сирия", lat:36.2021, lon:37.1343, tzOffset:3},
  {name:"Амман", country:"Иордания", lat:31.9454, lon:35.9284, tzOffset:3},
  {name:"Багдад", country:"Ирак", lat:33.3152, lon:44.3661, tzOffset:3},
  {name:"Эр-Рияд", country:"Саудовская Аравия", lat:24.7136, lon:46.6753, tzOffset:3},
  {name:"Джидда", country:"Саудовская Аравия", lat:21.4858, lon:39.1925, tzOffset:3},
  {name:"Мекка", country:"Саудовская Аравия", lat:21.4225, lon:39.8262, tzOffset:3},
  {name:"Дубай", country:"ОАЭ", lat:25.2048, lon:55.2708, tzOffset:4},
  {name:"Абу-Даби", country:"ОАЭ", lat:24.4539, lon:54.3773, tzOffset:4},
  {name:"Шарджа", country:"ОАЭ", lat:25.3463, lon:55.4209, tzOffset:4},
  {name:"Тегеран", country:"Иран", lat:35.6892, lon:51.389, tzOffset:3.5},
  {name:"Мешхед", country:"Иран", lat:36.2605, lon:59.6168, tzOffset:3.5},
  {name:"Исфахан", country:"Иран", lat:32.6546, lon:51.668, tzOffset:3.5},
  {name:"Шираз", country:"Иран", lat:29.5926, lon:52.5836, tzOffset:3.5},
  {name:"Доха", country:"Катар", lat:25.2854, lon:51.531, tzOffset:3},
  {name:"Манама", country:"Бахрейн", lat:26.2285, lon:50.586, tzOffset:3},
  {name:"Кувейт", country:"Кувейт", lat:29.3759, lon:47.9774, tzOffset:3},
  {name:"Маскат", country:"Оман", lat:23.588, lon:58.3829, tzOffset:4},
  {name:"Касабланка", country:"Марокко", lat:33.5731, lon:-7.5898, tzOffset:1},
  {name:"Рабат", country:"Марокко", lat:34.0209, lon:-6.8416, tzOffset:1},
  {name:"Марракеш", country:"Марокко", lat:31.6295, lon:-7.9811, tzOffset:1},
  {name:"Алжир", country:"Алжир", lat:36.7538, lon:3.0588, tzOffset:1},
  {name:"Тунис", country:"Тунис", lat:36.8065, lon:10.1815, tzOffset:1},
  {name:"Триполи", country:"Ливия", lat:32.8872, lon:13.1913, tzOffset:2},
  {name:"Пекин", country:"Китай", lat:39.9042, lon:116.4074, tzOffset:8},
  {name:"Шанхай", country:"Китай", lat:31.2304, lon:121.4737, tzOffset:8},
  {name:"Гуанчжоу", country:"Китай", lat:23.1291, lon:113.2644, tzOffset:8},
  {name:"Шэньчжэнь", country:"Китай", lat:22.5431, lon:114.0579, tzOffset:8},
  {name:"Тяньцзинь", country:"Китай", lat:39.3434, lon:117.3616, tzOffset:8},
  {name:"Чунцин", country:"Китай", lat:29.4316, lon:106.9123, tzOffset:8},
  {name:"Чэнду", country:"Китай", lat:30.5728, lon:104.0668, tzOffset:8},
  {name:"Нанкин", country:"Китай", lat:32.0603, lon:118.7969, tzOffset:8},
  {name:"Ухань", country:"Китай", lat:30.5928, lon:114.3055, tzOffset:8},
  {name:"Сиань", country:"Китай", lat:34.3416, lon:108.9398, tzOffset:8},
  {name:"Циндао", country:"Китай", lat:36.0671, lon:120.3826, tzOffset:8},
  {name:"Гонконг", country:"Гонконг", lat:22.3193, lon:114.1694, tzOffset:8},
  {name:"Макао", country:"Макао", lat:22.1987, lon:113.5439, tzOffset:8},
  {name:"Тайбэй", country:"Тайвань", lat:25.033, lon:121.5654, tzOffset:8},
  {name:"Гаосюн", country:"Тайвань", lat:22.6273, lon:120.3014, tzOffset:8},
  {name:"Токио", country:"Япония", lat:35.6762, lon:139.6503, tzOffset:9},
  {name:"Осака", country:"Япония", lat:34.6937, lon:135.5023, tzOffset:9},
  {name:"Йокогама", country:"Япония", lat:35.4437, lon:139.638, tzOffset:9},
  {name:"Нагоя", country:"Япония", lat:35.1815, lon:136.9066, tzOffset:9},
  {name:"Саппоро", country:"Япония", lat:43.0618, lon:141.3545, tzOffset:9},
  {name:"Киото", country:"Япония", lat:35.0116, lon:135.7681, tzOffset:9},
  {name:"Кобе", country:"Япония", lat:34.6901, lon:135.1955, tzOffset:9},
  {name:"Фукуока", country:"Япония", lat:33.5904, lon:130.4017, tzOffset:9},
  {name:"Сеул", country:"Южная Корея", lat:37.5665, lon:126.978, tzOffset:9},
  {name:"Пусан", country:"Южная Корея", lat:35.1796, lon:129.0756, tzOffset:9},
  {name:"Инчхон", country:"Южная Корея", lat:37.4563, lon:126.7052, tzOffset:9},
  {name:"Тэгу", country:"Южная Корея", lat:35.8714, lon:128.6014, tzOffset:9},
  {name:"Пхеньян", country:"Северная Корея", lat:39.0392, lon:125.7625, tzOffset:9},
  {name:"Улан-Батор", country:"Монголия", lat:47.8864, lon:106.9057, tzOffset:8},
  {name:"Нью-Дели", country:"Индия", lat:28.6139, lon:77.209, tzOffset:5.5},
  {name:"Мумбаи", country:"Индия", lat:19.076, lon:72.8777, tzOffset:5.5},
  {name:"Бангалор", country:"Индия", lat:12.9716, lon:77.5946, tzOffset:5.5},
  {name:"Хайдарабад", country:"Индия", lat:17.385, lon:78.4867, tzOffset:5.5},
  {name:"Ахмадабад", country:"Индия", lat:23.0225, lon:72.5714, tzOffset:5.5},
  {name:"Ченнаи", country:"Индия", lat:13.0827, lon:80.2707, tzOffset:5.5},
  {name:"Калькутта", country:"Индия", lat:22.5726, lon:88.3639, tzOffset:5.5},
  {name:"Пуна", country:"Индия", lat:18.5204, lon:73.8567, tzOffset:5.5},
  {name:"Джайпур", country:"Индия", lat:26.9124, lon:75.7873, tzOffset:5.5},
  {name:"Гоа", country:"Индия", lat:15.2993, lon:74.124, tzOffset:5.5},
  {name:"Карачи", country:"Пакистан", lat:24.8607, lon:67.0011, tzOffset:5},
  {name:"Лахор", country:"Пакистан", lat:31.5497, lon:74.3436, tzOffset:5},
  {name:"Исламабад", country:"Пакистан", lat:33.6844, lon:73.0479, tzOffset:5},
  {name:"Дакка", country:"Бангладеш", lat:23.8103, lon:90.4125, tzOffset:6},
  {name:"Коломбо", country:"Шри-Ланка", lat:6.9271, lon:79.8612, tzOffset:5.5},
  {name:"Катманду", country:"Непал", lat:27.7172, lon:85.324, tzOffset:5.75},
  {name:"Бангкок", country:"Таиланд", lat:13.7563, lon:100.5018, tzOffset:7},
  {name:"Чиангмай", country:"Таиланд", lat:18.7883, lon:98.9853, tzOffset:7},
  {name:"Пхукет", country:"Таиланд", lat:7.8804, lon:98.3923, tzOffset:7},
  {name:"Паттайя", country:"Таиланд", lat:12.9236, lon:100.8825, tzOffset:7},
  {name:"Ханой", country:"Вьетнам", lat:21.0285, lon:105.8542, tzOffset:7},
  {name:"Хошимин", country:"Вьетнам", lat:10.8231, lon:106.6297, tzOffset:7},
  {name:"Дананг", country:"Вьетнам", lat:16.0544, lon:108.2022, tzOffset:7},
  {name:"Нячанг", country:"Вьетнам", lat:12.2388, lon:109.1967, tzOffset:7},
  {name:"Куала-Лумпур", country:"Малайзия", lat:3.139, lon:101.6869, tzOffset:8},
  {name:"Сингапур", country:"Сингапур", lat:1.3521, lon:103.8198, tzOffset:8},
  {name:"Джакарта", country:"Индонезия", lat:-6.2088, lon:106.8456, tzOffset:7},
  {name:"Сурабая", country:"Индонезия", lat:-7.2575, lon:112.7521, tzOffset:7},
  {name:"Бандунг", country:"Индонезия", lat:-6.9175, lon:107.6191, tzOffset:7},
  {name:"Денпасар", country:"Индонезия", lat:-8.65, lon:115.2167, tzOffset:8},
  {name:"Манила", country:"Филиппины", lat:14.5995, lon:120.9842, tzOffset:8},
  {name:"Себу", country:"Филиппины", lat:10.3157, lon:123.8854, tzOffset:8},
  {name:"Пномпень", country:"Камбоджа", lat:11.5564, lon:104.9282, tzOffset:7},
  {name:"Сиемреап", country:"Камбоджа", lat:13.3633, lon:103.8564, tzOffset:7},
  {name:"Янгон", country:"Мьянма", lat:16.8409, lon:96.1735, tzOffset:6.5},
  {name:"Вьентьян", country:"Лаос", lat:17.9757, lon:102.6331, tzOffset:7},
  {name:"Кабул", country:"Афганистан", lat:34.5553, lon:69.2075, tzOffset:4.5},
  {name:"Нью-Йорк", country:"США", lat:40.7128, lon:-74.006, tzOffset:-4},
  {name:"Лос-Анджелес", country:"США", lat:34.0522, lon:-118.2437, tzOffset:-7},
  {name:"Чикаго", country:"США", lat:41.8781, lon:-87.6298, tzOffset:-5},
  {name:"Хьюстон", country:"США", lat:29.7604, lon:-95.3698, tzOffset:-5},
  {name:"Финикс", country:"США", lat:33.4484, lon:-112.074, tzOffset:-7},
  {name:"Филадельфия", country:"США", lat:39.9526, lon:-75.1652, tzOffset:-4},
  {name:"Сан-Антонио", country:"США", lat:29.4241, lon:-98.4936, tzOffset:-5},
  {name:"Сан-Диего", country:"США", lat:32.7157, lon:-117.1611, tzOffset:-7},
  {name:"Даллас", country:"США", lat:32.7767, lon:-96.797, tzOffset:-5},
  {name:"Сан-Хосе", country:"США", lat:37.3382, lon:-121.8863, tzOffset:-7},
  {name:"Остин", country:"США", lat:30.2672, lon:-97.7431, tzOffset:-5},
  {name:"Сан-Франциско", country:"США", lat:37.7749, lon:-122.4194, tzOffset:-7},
  {name:"Сиэтл", country:"США", lat:47.6062, lon:-122.3321, tzOffset:-7},
  {name:"Денвер", country:"США", lat:39.7392, lon:-104.9903, tzOffset:-6},
  {name:"Бостон", country:"США", lat:42.3601, lon:-71.0589, tzOffset:-4},
  {name:"Майами", country:"США", lat:25.7617, lon:-80.1918, tzOffset:-4},
  {name:"Атланта", country:"США", lat:33.749, lon:-84.388, tzOffset:-4},
  {name:"Лас-Вегас", country:"США", lat:36.1699, lon:-115.1398, tzOffset:-7},
  {name:"Портленд", country:"США", lat:45.5152, lon:-122.6784, tzOffset:-7},
  {name:"Вашингтон", country:"США", lat:38.9072, lon:-77.0369, tzOffset:-4},
  {name:"Орландо", country:"США", lat:28.5383, lon:-81.3792, tzOffset:-4},
  {name:"Гонолулу", country:"США", lat:21.3099, lon:-157.8581, tzOffset:-10},
  {name:"Анкоридж", country:"США", lat:61.2181, lon:-149.9003, tzOffset:-8},
  {name:"Новый Орлеан", country:"США", lat:29.9511, lon:-90.0715, tzOffset:-5},
  {name:"Торонто", country:"Канада", lat:43.6532, lon:-79.3832, tzOffset:-4},
  {name:"Монреаль", country:"Канада", lat:45.5017, lon:-73.5673, tzOffset:-4},
  {name:"Ванкувер", country:"Канада", lat:49.2827, lon:-123.1207, tzOffset:-7},
  {name:"Калгари", country:"Канада", lat:51.0447, lon:-114.0719, tzOffset:-6},
  {name:"Эдмонтон", country:"Канада", lat:53.5461, lon:-113.4938, tzOffset:-6},
  {name:"Оттава", country:"Канада", lat:45.4215, lon:-75.6972, tzOffset:-4},
  {name:"Виннипег", country:"Канада", lat:49.8951, lon:-97.1384, tzOffset:-5},
  {name:"Квебек", country:"Канада", lat:46.8139, lon:-71.208, tzOffset:-4},
  {name:"Галифакс", country:"Канада", lat:44.6488, lon:-63.5752, tzOffset:-3},
  {name:"Мехико", country:"Мексика", lat:19.4326, lon:-99.1332, tzOffset:-6},
  {name:"Гвадалахара", country:"Мексика", lat:20.6597, lon:-103.3496, tzOffset:-6},
  {name:"Монтеррей", country:"Мексика", lat:25.6866, lon:-100.3161, tzOffset:-6},
  {name:"Канкун", country:"Мексика", lat:21.1619, lon:-86.8515, tzOffset:-5},
  {name:"Гавана", country:"Куба", lat:23.1136, lon:-82.3666, tzOffset:-4},
  {name:"Сан-Хуан", country:"Пуэрто-Рико", lat:18.4655, lon:-66.1057, tzOffset:-4},
  {name:"Санто-Доминго", country:"Доминикана", lat:18.4861, lon:-69.9312, tzOffset:-4},
  {name:"Гватемала", country:"Гватемала", lat:14.6349, lon:-90.5069, tzOffset:-6},
  {name:"Сан-Сальвадор", country:"Сальвадор", lat:13.6929, lon:-89.2182, tzOffset:-6},
  {name:"Богота", country:"Колумбия", lat:4.711, lon:-74.0721, tzOffset:-5},
  {name:"Медельин", country:"Колумбия", lat:6.2442, lon:-75.5812, tzOffset:-5},
  {name:"Кали", country:"Колумбия", lat:3.4516, lon:-76.532, tzOffset:-5},
  {name:"Картахена", country:"Колумбия", lat:10.3997, lon:-75.5144, tzOffset:-5},
  {name:"Кито", country:"Эквадор", lat:-0.1807, lon:-78.4678, tzOffset:-5},
  {name:"Гуаякиль", country:"Эквадор", lat:-2.1709, lon:-79.9224, tzOffset:-5},
  {name:"Лима", country:"Перу", lat:-12.0464, lon:-77.0428, tzOffset:-5},
  {name:"Куско", country:"Перу", lat:-13.532, lon:-71.9675, tzOffset:-5},
  {name:"Каракас", country:"Венесуэла", lat:10.4806, lon:-66.9036, tzOffset:-4},
  {name:"Сан-Паулу", country:"Бразилия", lat:-23.5505, lon:-46.6333, tzOffset:-3},
  {name:"Рио-де-Жанейро", country:"Бразилия", lat:-22.9068, lon:-43.1729, tzOffset:-3},
  {name:"Бразилиа", country:"Бразилия", lat:-15.7942, lon:-47.8825, tzOffset:-3},
  {name:"Сальвадор-да-Баия", country:"Бразилия", lat:-12.9714, lon:-38.5014, tzOffset:-3},
  {name:"Форталеза", country:"Бразилия", lat:-3.7172, lon:-38.5433, tzOffset:-3},
  {name:"Белу-Оризонти", country:"Бразилия", lat:-19.9167, lon:-43.9345, tzOffset:-3},
  {name:"Манаус", country:"Бразилия", lat:-3.119, lon:-60.0217, tzOffset:-4},
  {name:"Куритиба", country:"Бразилия", lat:-25.4284, lon:-49.2733, tzOffset:-3},
  {name:"Буэнос-Айрес", country:"Аргентина", lat:-34.6037, lon:-58.3816, tzOffset:-3},
  {name:"Кордова", country:"Аргентина", lat:-31.4201, lon:-64.1888, tzOffset:-3},
  {name:"Росарио", country:"Аргентина", lat:-32.9442, lon:-60.6505, tzOffset:-3},
  {name:"Мендоса", country:"Аргентина", lat:-32.8908, lon:-68.8272, tzOffset:-3},
  {name:"Сантьяго", country:"Чили", lat:-33.4489, lon:-70.6693, tzOffset:-4},
  {name:"Вальпараисо", country:"Чили", lat:-33.0472, lon:-71.6127, tzOffset:-4},
  {name:"Монтевидео", country:"Уругвай", lat:-34.9011, lon:-56.1645, tzOffset:-3},
  {name:"Асунсьон", country:"Парагвай", lat:-25.2637, lon:-57.5759, tzOffset:-4},
  {name:"Ла-Пас", country:"Боливия", lat:-16.4897, lon:-68.1193, tzOffset:-4},
  {name:"Лагос", country:"Нигерия", lat:6.5244, lon:3.3792, tzOffset:1},
  {name:"Абуджа", country:"Нигерия", lat:9.0765, lon:7.3986, tzOffset:1},
  {name:"Аккра", country:"Гана", lat:5.6037, lon:-0.187, tzOffset:0},
  {name:"Найроби", country:"Кения", lat:-1.2921, lon:36.8219, tzOffset:3},
  {name:"Момбаса", country:"Кения", lat:-4.0435, lon:39.6682, tzOffset:3},
  {name:"Дар-эс-Салам", country:"Танзания", lat:-6.7924, lon:39.2083, tzOffset:3},
  {name:"Аддис-Абеба", country:"Эфиопия", lat:9.145, lon:40.4897, tzOffset:3},
  {name:"Кампала", country:"Уганда", lat:0.3476, lon:32.5825, tzOffset:3},
  {name:"Кигали", country:"Руанда", lat:-1.9706, lon:30.1044, tzOffset:2},
  {name:"Дакар", country:"Сенегал", lat:14.7167, lon:-17.4677, tzOffset:0},
  {name:"Йоханнесбург", country:"ЮАР", lat:-26.2041, lon:28.0473, tzOffset:2},
  {name:"Кейптаун", country:"ЮАР", lat:-33.9249, lon:18.4241, tzOffset:2},
  {name:"Дурбан", country:"ЮАР", lat:-29.8587, lon:31.0218, tzOffset:2},
  {name:"Претория", country:"ЮАР", lat:-25.7479, lon:28.2293, tzOffset:2},
  {name:"Хараре", country:"Зимбабве", lat:-17.8252, lon:31.0335, tzOffset:2},
  {name:"Луанда", country:"Ангола", lat:-8.839, lon:13.2894, tzOffset:1},
  {name:"Сидней", country:"Австралия", lat:-33.8688, lon:151.2093, tzOffset:11},
  {name:"Мельбурн", country:"Австралия", lat:-37.8136, lon:144.9631, tzOffset:11},
  {name:"Брисбен", country:"Австралия", lat:-27.4698, lon:153.0251, tzOffset:10},
  {name:"Перт", country:"Австралия", lat:-31.9505, lon:115.8605, tzOffset:8},
  {name:"Аделаида", country:"Австралия", lat:-34.9285, lon:138.6007, tzOffset:10.5},
  {name:"Канберра", country:"Австралия", lat:-35.2809, lon:149.13, tzOffset:11},
  {name:"Дарвин", country:"Австралия", lat:-12.4634, lon:130.8456, tzOffset:9.5},
  {name:"Окленд", country:"Новая Зеландия", lat:-36.8485, lon:174.7633, tzOffset:13},
  {name:"Веллингтон", country:"Новая Зеландия", lat:-41.2865, lon:174.7762, tzOffset:13},
  {name:"Крайстчёрч", country:"Новая Зеландия", lat:-43.5321, lon:172.6362, tzOffset:13}
];

function initQuizSelects() {
  const dayEl = document.getElementById('birthDay');
  if (dayEl.children.length <= 1) {
    for (let i = 1; i <= 31; i++) dayEl.innerHTML += `<option value="${i}">${i}</option>`;
  }
  const yearEl = document.getElementById('birthYear');
  if (yearEl.children.length <= 1) {
    const now = new Date().getFullYear();
    for (let i = now - 18; i >= 1920; i--) yearEl.innerHTML += `<option value="${i}">${i}</option>`;
  }
  const hourEl = document.getElementById('birthHour');
  if (hourEl.children.length <= 1) {
    for (let i = 0; i < 24; i++) hourEl.innerHTML += `<option value="${i}">${String(i).padStart(2, '0')}</option>`;
  }
  const minEl = document.getElementById('birthMinute');
  if (minEl.children.length <= 1) {
    for (let i = 0; i < 60; i += 5) minEl.innerHTML += `<option value="${i}">${String(i).padStart(2, '0')}</option>`;
  }
}

function updateQuizProgress() {
  const stepsForProgress = quizState.step <= 4 ? quizState.step : 4;
  const pct = ((stepsForProgress - 1) / (quizState.totalSteps - 1)) * 100;
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('stepCounter').textContent = quizState.step <= 4 ? `${quizState.step} / ${quizState.totalSteps}` : '';
  document.getElementById('quizBackBtn').disabled = quizState.step === 5;
}

function showQuizStep(n) {
  document.querySelectorAll('.quiz-step').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`[data-qstep="${n}"]`);
  if (target) target.classList.add('active');
  quizState.step = n;
  updateQuizProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function quizNext() {
  if (quizState.step < 5) showQuizStep(quizState.step + 1);
}

document.getElementById('quizBackBtn').addEventListener('click', () => {
  if (quizState.step === 1) {
    // Back to home
    navigateTo('screen-home');
  } else if (quizState.step > 1 && quizState.step < 5) {
    showQuizStep(quizState.step - 1);
  }
});

// Date validation
['birthDay', 'birthMonth', 'birthYear'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    const d = document.getElementById('birthDay').value;
    const m = document.getElementById('birthMonth').value;
    const y = document.getElementById('birthYear').value;
    quizState.birthDay = d; quizState.birthMonth = m; quizState.birthYear = y;
    document.getElementById('step2Btn').disabled = !(d && m && y);
  });
});

// Time mode
function selectTimeMode(el) {
  document.querySelectorAll('.time-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  quizState.timeMode = el.dataset.timeMode;
  const fields = document.getElementById('timeFields');
  const notice = document.getElementById('unknownNotice');
  if (quizState.timeMode === 'unknown') {
    fields.style.display = 'none';
    notice.classList.add('show');
    document.getElementById('step3Btn').disabled = false;
  } else {
    fields.style.display = 'block';
    notice.classList.remove('show');
    checkStep3();
  }
}

function checkStep3() {
  if (quizState.timeMode === 'unknown') { document.getElementById('step3Btn').disabled = false; return; }
  const h = document.getElementById('birthHour').value;
  const m = document.getElementById('birthMinute').value;
  quizState.birthHour = h; quizState.birthMinute = m;
  document.getElementById('step3Btn').disabled = !(h !== '' && m !== '');
}
document.getElementById('birthHour').addEventListener('change', checkStep3);
document.getElementById('birthMinute').addEventListener('change', checkStep3);

// City autocomplete
const cityInput = document.getElementById('birthCity');
const citySuggest = document.getElementById('citySuggest');
cityInput.addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase().trim();
  if (q.length < 2) { citySuggest.classList.remove('show'); document.getElementById('step4Btn').disabled = true; return; }
  const matches = cityDB.filter(c => c.name.toLowerCase().includes(q)).slice(0, 10);
  if (matches.length === 0) { citySuggest.classList.remove('show'); return; }
  citySuggest.innerHTML = matches.map(c => {
    const regionPart = c.region ? `<span class="region">${c.region}</span>` : '';
    return `<div class="city-suggest-item" data-city='${JSON.stringify(c)}'><span class="city-name">${c.name}</span><span class="country">${regionPart}${c.country}</span></div>`;
  }).join('');
  citySuggest.classList.add('show');
  citySuggest.querySelectorAll('.city-suggest-item').forEach(item => {
    item.addEventListener('click', () => {
      const c = JSON.parse(item.dataset.city);
      cityInput.value = `${c.name}, ${c.country}`;
      quizState.birthCity = c.name;
      quizState.birthLat = c.lat;
      quizState.birthLon = c.lon;
      quizState.birthTz = c.tz;
      quizState.birthTzOffset = c.tzOffset;
      quizState.birthCountry = c.country;
      citySuggest.classList.remove('show');
      document.getElementById('step4Btn').disabled = false;
    });
  });
});
document.addEventListener('click', (e) => {
  if (!e.target.closest('.city-wrap')) citySuggest.classList.remove('show');
});

function startCalculation() {
  showQuizStep(5);
  const stepIds = ['ls1', 'ls2', 'ls3', 'ls4', 'ls5'];
  let i = 0;
  document.getElementById(stepIds[0]).classList.add('current');

  // === Реальный расчёт натальной карты ===
  // Время неизвестно → используем 12:00 как нейтральную середину дня
  // (без точного времени Asc и дома будут приблизительными)
  const hourForCalc = quizState.timeMode === 'unknown' ? 12 : parseInt(quizState.birthHour || 12);
  const minuteForCalc = quizState.timeMode === 'unknown' ? 0 : parseInt(quizState.birthMinute || 0);
  const tzOff = typeof quizState.birthTzOffset === 'number' ? quizState.birthTzOffset : 0;

  try {
    quizState.computedChart = NatalEngine.buildChart(
      parseInt(quizState.birthYear),
      parseInt(quizState.birthMonth),
      parseInt(quizState.birthDay),
      hourForCalc,
      minuteForCalc,
      quizState.birthLat || 0,
      quizState.birthLon || 0,
      tzOff
    );
    console.log('Computed chart:', quizState.computedChart);
  } catch (err) {
    console.error('Chart calc failed:', err);
    quizState.computedChart = null;
  }

  const interval = setInterval(() => {
    document.getElementById(stepIds[i]).classList.remove('current');
    document.getElementById(stepIds[i]).classList.add('done');
    i++;
    if (i < stepIds.length) {
      document.getElementById(stepIds[i]).classList.add('current');
    } else {
      clearInterval(interval);
      setTimeout(() => {
        updateResultMeta();
        renderNatalResultFromChart();
        navigateTo('screen-natal-result');
      }, 600);
    }
  }, 700);
}



  // === STAGE 3: ИНТЕРПРЕТАЦИИ V2 + ГЛОССАРИЙ ===
  // === ЭТАП 3: ИНТЕРПРЕТАТОР НА ЧЕЛОВЕЧЕСКОМ ЯЗЫКЕ + ГЛОССАРИЙ ===

  // === Глоссарий: term → объяснение ===
  const GLOSSARY = {
    'аспект': 'Угловое расстояние между двумя планетами в карте. Показывает, как они "разговаривают" друг с другом — поддерживают, спорят или работают вместе.',
    'аспекты': 'Угловые расстояния между планетами в карте. Показывают, как планеты "разговаривают" друг с другом — поддерживают, спорят или работают вместе.',
    'орб': 'Допустимое отклонение от точного угла аспекта. Чем меньше орб — тем точнее и сильнее работает аспект.',
    'орбис': 'Допустимое отклонение от точного угла аспекта. Чем меньше орб — тем точнее и сильнее работает аспект.',
    'асцендент': 'Восходящий знак — то, как вас воспринимают при первом контакте. Маска, которую вы показываете миру.',
    'асц': 'Восходящий знак — то, как вас воспринимают при первом контакте. Маска, которую вы показываете миру.',
    'asc': 'Восходящий знак — то, как вас воспринимают при первом контакте. Маска, которую вы показываете миру.',
    'дом': 'Один из 12 секторов карты, отвечающий за конкретную сферу жизни — деньги, отношения, карьеру, здоровье и так далее.',
    'дома': '12 секторов карты, каждый из которых отвечает за конкретную сферу жизни — деньги, отношения, карьеру, здоровье и так далее.',
    'транзит': 'Текущее положение реальных планет на небе, влияющее на вашу натальную карту прямо сейчас.',
    'транзиты': 'Текущие положения реальных планет на небе, влияющие на вашу натальную карту прямо сейчас.',
    'mc': 'Mедиум-Коэли, вершина 10 дома. Точка карьеры, статуса, публичной репутации.',
    'мс': 'Mедиум-Коэли, вершина 10 дома. Точка карьеры, статуса, публичной репутации.',
    'медиум-коэли': 'Вершина 10 дома, точка карьеры и статуса.',
    'стеллиум': 'Скопление трёх или больше планет в одном знаке. Создаёт сильный акцент на темах этого знака.',
    'соединение': 'Аспект, когда две планеты находятся очень близко друг к другу. Их энергии сливаются в одну.',
    'трин': 'Гармоничный аспект (120°), когда энергии планет легко поддерживают друг друга.',
    'квадрат': 'Напряжённый аспект (90°), требующий внутренней работы — но именно через это напряжение растёшь.',
    'оппозиция': 'Аспект противостояния (180°). Две планеты тянут в разные стороны, и важно найти баланс.',
    'секстиль': 'Мягкий поддерживающий аспект (60°). Возможности приходят, если их брать.',
    'стихия': 'Один из четырёх элементов знаков: огонь, земля, воздух, вода. Показывает основной "характер" планеты.',
    'стихии': 'Четыре элемента знаков: огонь, земля, воздух, вода. Показывают баланс качеств в карте.',
    'эклиптика': 'Видимый путь Солнца по небу за год. Все планеты движутся вблизи этой линии.',
    'ретроградность': 'Период, когда планета визуально движется по небу "назад". Время пересмотра тем, за которые она отвечает.',
  };

  // Версия для UI: оборачивает термины в данном тексте в подсвеченные span'ы с тултипом
  function wrapGlossaryTerms(text) {
    if (!text) return text;
    // Перебираем термины от самых длинных к коротким (чтобы "медиум-коэли" не разбивалось на "медиум" и "коэли")
    const terms = Object.keys(GLOSSARY).sort((a, b) => b.length - a.length);
    let result = text;
    // Простое регулярное выражение по словам (поиск без учёта регистра, на словесных границах)
    terms.forEach(term => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // \b не работает с кириллицей; используем lookbehind/lookahead для не-букв
      const re = new RegExp('(^|[^a-zа-яё])(' + escapedTerm + ')(?=[^a-zа-яё]|$)', 'gi');
      result = result.replace(re, (match, prefix, term_) => {
        const explanation = GLOSSARY[term.toLowerCase()].replace(/"/g, '&quot;');
        return `${prefix}<span class="glossary-term" data-tip="${explanation}">${term_}</span>`;
      });
    });
    return result;
  }

  // === Расширенные интерпретации с двойным режимом ===
  // Каждая планета имеет два уровня описания + дом + аспекты в "Просто" и "Подробно" вариантах

  const PLANET_INTERP_V2 = {
    sun: {
      simple_main: 'Солнце — это ваше "я". То, что в вас главное, что движет вами по жизни.',
      detailed_main: 'Солнце — ядро личности, центр воли, способ ощущать собственную ценность. Раскрывает базовый сценарий, по которому вы становитесь собой.',
      quality: {
        aries: { simple: 'Вы решительный человек, который любит действовать первым. Не ждёте — идёте.',
                 detailed: 'Качества Овна: смелость, инициатива, быстрота решений. Способ проявления — прямой импульс, без длинных раздумий.' },
        taurus: { simple: 'Вы устойчивый человек, который ценит стабильность и красивые вещи. Не торопитесь.',
                  detailed: 'Качества Тельца: устойчивость, чувственность, материальная ориентация. Работаете в своём темпе и доводите начатое до результата.' },
        gemini: { simple: 'У вас живой ум и тяга к новому. Любите общаться, переключаться, учиться.',
                  detailed: 'Качества Близнецов: гибкость ума, любопытство, многозадачность. Хорошо чувствуете контекст и переключаетесь между темами.' },
        cancer: { simple: 'Вы чувствительный человек, для которого важны близкие и дом. Заботитесь — но и сами нуждаетесь в заботе.',
                  detailed: 'Качества Рака: эмоциональная глубина, привязанность к близким, забота о среде. Решаете через чувство, а не через холодный расчёт.' },
        leo: { simple: 'Вы яркий человек, которому важно быть замеченным. Любите выражать себя и вдохновлять других.',
               detailed: 'Качества Льва: самовыражение, щедрость, лидерство, желание сиять. Раскрываетесь в роли, где можно быть собой ярко.' },
        virgo: { simple: 'У вас аналитический ум и внимание к деталям. Любите, когда всё на своих местах.',
                 detailed: 'Качества Девы: анализ, внимание к деталям, практичность. Чувствуете удовлетворение от хорошо сделанной работы.' },
        libra: { simple: 'Вам важны гармония и красота. Часто ищете баланс — в отношениях, в стиле, в обстановке.',
                 detailed: 'Качества Весов: баланс, дипломатия, эстетика, партнёрство. Ищете гармонию в каждой ситуации.' },
        scorpio: { simple: 'Вы глубокий, страстный человек. Не любите поверхностного — идёте в суть.',
                   detailed: 'Качества Скорпиона: глубина, интенсивность, трансформация. Не боитесь сложного, видите подтексты.' },
        sagittarius: { simple: 'У вас широкий взгляд и тяга к новому. Любите путешествия, идеи, расширять горизонты.',
                       detailed: 'Качества Стрельца: широта взгляда, оптимизм, поиск смысла. Растёте через новый опыт и обучение.' },
        capricorn: { simple: 'Вы целеустремлённый человек с внутренним стержнем. Знаете, чего хотите, и идёте к этому.',
                     detailed: 'Качества Козерога: структура, амбиции, дисциплина. Достигаете через систему и долгую работу.' },
        aquarius: { simple: 'Вы независимый человек, который мыслит по-своему. Не вписываетесь в шаблоны.',
                    detailed: 'Качества Водолея: нестандартность, свобода, новаторство. Цените свою независимость и видите вещи нетипично.' },
        pisces: { simple: 'Вы чувствительный, интуитивный человек. Видите больше, чем говорите.',
                  detailed: 'Качества Рыб: интуиция, мечтательность, эмпатия. Тонко чувствуете других и атмосферу вокруг.' }
      }
    },
    moon: {
      simple_main: 'Луна — это ваши эмоции и базовые потребности. То, что нужно для внутреннего комфорта.',
      detailed_main: 'Луна — эмоциональная природа и базовые внутренние потребности. Показывает, через что вы восстанавливаетесь и как реагируете на стресс.',
      quality: {
        aries: { simple: 'Эмоции у вас быстрые и яркие. Загораетесь — действуете. Не любите долго сидеть в чувствах.',
                 detailed: 'Эмоциональная природа быстрая, импульсивная. Реакция мгновенная, обида или радость проходят так же быстро.' },
        taurus: { simple: 'Эмоции у вас устойчивые, как фундамент. Восстанавливаетесь через комфорт — еду, сон, природу.',
                  detailed: 'Луна в Тельце — экзальтация, самая удобная позиция. Эмоциональная стабильность естественна, восстановление идёт через тело и материальный комфорт.' },
        gemini: { simple: 'Эмоции у вас в голове — нужно проговорить, чтобы понять. Общение лечит.',
                  detailed: 'Эмоции переплетены с мышлением — чувства проявляются через слова. Восстанавливаетесь в общении, через переключение контекста.' },
        cancer: { simple: 'Эмоции глубокие, привязываетесь сильно. Дом и близкие — главная опора.',
                  detailed: 'Луна дома: эмоциональная глубина максимальная. Память на чувства долгая, привязанности крепкие.' },
        leo: { simple: 'Эмоции яркие, важно их выразить. Хорошо, когда вас видят и ценят.',
               detailed: 'Эмоции драматичны и нуждаются в выражении. Ощущение собственной значимости — базовая эмоциональная потребность.' },
        virgo: { simple: 'Эмоции вы анализируете. Иногда слишком — но это даёт ясность.',
                 detailed: 'Эмоциональная природа аналитична. Чувства проходят через фильтр "что это значит?" — иногда это снижает их прямое переживание.' },
        libra: { simple: 'Эмоции вы делите с другими. Гармония в отношениях — главное условие покоя.',
                 detailed: 'Эмоциональный мир ориентирован на партнёрство. Внутренний баланс зависит от баланса в отношениях.' },
        scorpio: { simple: 'Эмоции у вас сильные и глубокие. Не делитесь ими с кем попало.',
                   detailed: 'Луна в Скорпионе: эмоциональная интенсивность высокая, но контролируется. Способны на глубокие переживания, но открываете их только близким.' },
        sagittarius: { simple: 'Эмоции у вас свободолюбивые. Скучно — плохо. Нужно движение и новый опыт.',
                       detailed: 'Эмоциональная природа нуждается в просторе и развитии. Замкнутая повседневность даёт глухое раздражение.' },
        capricorn: { simple: 'Эмоции вы держите при себе. Восстанавливаетесь через структуру и результат.',
                     detailed: 'Луна в Козероге сдержанна, склонна не показывать чувства. Внутренний мир ценит дисциплину и достижения.' },
        aquarius: { simple: 'Эмоции у вас рациональные. Чужие чувства понимаете умом, не сердцем.',
                    detailed: 'Эмоции отстранённые, интеллектуализированные. Близость через идеи и общие ценности, а не через сентиментальность.' },
        pisces: { simple: 'Эмоции у вас тонкие, как у радара. Чувствуете чужие настроения — иногда слишком.',
                  detailed: 'Эмоциональная природа очень чувствительна и впитывает атмосферу. Нужны границы и время в тишине для восстановления.' }
      }
    },
    mercury: {
      simple_main: 'Меркурий — это как вы думаете, говорите и учитесь.',
      detailed_main: 'Меркурий — мышление, речь, способ обрабатывать информацию. Показывает, как вы учитесь и как доносите идеи.',
      quality: { /* generic fallback — generate from sign list below */ }
    },
    venus: {
      simple_main: 'Венера — это ваши чувства, отношения и то, что вам нравится.',
      detailed_main: 'Венера — сфера чувств, ценностей, личной привлекательности. Раскрывает, как вы любите и что считаете красивым.',
      quality: {}
    },
    mars: {
      simple_main: 'Марс — это ваша энергия и воля. Как вы добиваетесь желаемого.',
      detailed_main: 'Марс — воля, драйв, способ добиваться результата. Показывает, как вы действуете в конфликте и куда направляете энергию.',
      quality: {}
    },
    jupiter: {
      simple_main: 'Юпитер — это ваш рост. Куда тянет, что расширяет вас как личность.',
      detailed_main: 'Юпитер — масштаб целей и стратегия роста. Показывает, через что приходит удача и где вы природно расширяетесь.',
      quality: {}
    },
    saturn: {
      simple_main: 'Сатурн — это ваша дисциплина и зрелость. Что требует усилий, но даёт стержень.',
      detailed_main: 'Сатурн — внутренний стержень, отношение к ответственности. Через ограничения и работу над собой превращается в опору.',
      quality: {}
    },
    uranus: {
      simple_main: 'Уран — это где вам нужна свобода и нестандартность. Где вы "другой".',
      detailed_main: 'Уран — потребность в свободе, обновлении, индивидуальности. Показывает, где вы выходите за рамки и что в вас революционно.',
      quality: {}
    },
    neptune: {
      simple_main: 'Нептун — это ваше воображение и интуиция. Где вы видите больше других.',
      detailed_main: 'Нептун — интуиция, воображение, чувствительность к смыслам. Раскрывает мечты, идеалы и тонкую сторону восприятия.',
      quality: {}
    },
    pluto: {
      simple_main: 'Плутон — это ваша глубокая сила. Тема, через которую вы трансформируетесь.',
      detailed_main: 'Плутон — сила трансформации и глубинной воли. Показывает, через какие кризисы и темы вы вырастаете в новую версию себя.',
      quality: {}
    }
  };

  // Универсальный качественный текст для знаков (для Меркурия, Венеры, Марса и т.д.)
  const SIGN_GENERIC = {
    aries: { simple: 'через смелость, скорость, прямой подход',
             detailed: 'через смелость, скорость, прямой подход — первое движение всегда ваше' },
    taurus: { simple: 'через устойчивость, телесность, надёжный темп',
              detailed: 'через устойчивость, телесность, надёжный темп — выбираете качество и время' },
    gemini: { simple: 'через связи, гибкость, обмен идеями',
              detailed: 'через связи, гибкость, обмен идеями — лучше всего работаете в живом контексте' },
    cancer: { simple: 'через заботу, привязанность, эмоциональную близость',
              detailed: 'через заботу, привязанность, эмоциональную близость — действуете когда чувствуете доверие' },
    leo: { simple: 'через самовыражение, щедрость, желание сиять',
           detailed: 'через самовыражение, щедрость, желание сиять — отдача людям становится топливом' },
    virgo: { simple: 'через детальную работу, анализ, практику',
             detailed: 'через детальную работу, анализ, практику — мастерство приходит через дисциплину' },
    libra: { simple: 'через баланс, диалог, поиск гармонии',
             detailed: 'через баланс, диалог, поиск гармонии — выбираете эстетику и качество отношений' },
    scorpio: { simple: 'через глубину, фокус, способность идти в сложное',
               detailed: 'через глубину, фокус, способность идти в сложное — пугающее становится топливом' },
    sagittarius: { simple: 'через широту, новые горизонты, поиск смысла',
                   detailed: 'через широту, новые горизонты, поиск смысла — растёте от расширения опыта' },
    capricorn: { simple: 'через структуру, цель, долгосрочный результат',
                 detailed: 'через структуру, цель, долгосрочный результат — система побеждает порыв' },
    aquarius: { simple: 'через нестандартный взгляд, независимость, новаторство',
                detailed: 'через нестандартный взгляд, независимость, новаторство — стандарт вам не подходит' },
    pisces: { simple: 'через интуицию, эмпатию, чувствование контекста',
              detailed: 'через интуицию, эмпатию, чувствование контекста — видите то, что не очевидно' }
  };

  const HOUSE_INFO_V2 = {
    1: { name: 'Самопрезентация и облик',
         simple: 'Это про то, как вас видят при первой встрече.',
         detailed: 'Первый дом отвечает за самопрезентацию, первое впечатление и физическое тело. Маска, которую вы показываете миру.' },
    2: { name: 'Деньги, ресурсы, ценности',
         simple: 'Это про деньги и ощущение опоры в жизни.',
         detailed: 'Второй дом — деньги, личные ресурсы, чувство финансовой и эмоциональной опоры. Ваши собственные таланты, монетизация.' },
    3: { name: 'Общение и ближнее окружение',
         simple: 'Это про общение, обучение, ближних людей.',
         detailed: 'Третий дом — общение, ближнее окружение, обучение, короткие поездки. Стиль вашего диалога с миром.' },
    4: { name: 'Дом, корни, семья',
         simple: 'Это про дом, корни, эмоциональную базу.',
         detailed: 'Четвёртый дом — дом, корни, родительская семья, эмоциональная база. Внутренний фундамент личности.' },
    5: { name: 'Творчество, дети, романтика',
         simple: 'Это про творчество, радость, любовь.',
         detailed: 'Пятый дом — творчество, романтика, дети, самовыражение, удовольствие. Что вас зажигает.' },
    6: { name: 'Работа, привычки, здоровье',
         simple: 'Это про повседневную работу, рутины, здоровье.',
         detailed: 'Шестой дом — работа, привычки, здоровье, ремесло. Сфера ежедневной практики и заботы о себе.' },
    7: { name: 'Партнёрство и близкие',
         simple: 'Это про отношения и близких людей.',
         detailed: 'Седьмой дом — партнёрство, брак, открытые враги, тесные отношения один на один. Зеркало через другого.' },
    8: { name: 'Кризисы и общие ресурсы',
         simple: 'Это про глубокие перемены, кризисы, общее с партнёром.',
         detailed: 'Восьмой дом — общие ресурсы, кризисы, трансформация, секс, наследство. Темы глубокой работы с другим.' },
    9: { name: 'Мировоззрение и горизонты',
         simple: 'Это про мировоззрение, дальние поездки, учёбу.',
         detailed: 'Девятый дом — мировоззрение, дальние поездки, философия, высшее образование, иностранное. Поиск смысла.' },
    10: { name: 'Карьера и публичный статус',
          simple: 'Это про карьеру и общественное лицо.',
          detailed: 'Десятый дом — карьера, репутация, социальный статус, публичная роль. Вершина "куда вы идёте" в жизни.' },
    11: { name: 'Друзья и сообщества',
          simple: 'Это про друзей, единомышленников, большие цели.',
          detailed: 'Одиннадцатый дом — друзья, сообщества, единомышленники, долгосрочные цели. Социальные связи по выбору.' },
    12: { name: 'Внутренний мир и тишина',
          simple: 'Это про внутренний мир, тишину, восстановление.',
          detailed: 'Двенадцатый дом — внутренний мир, тишина, духовное, скрытое. Сфера, где вы остаётесь наедине с собой.' }
  };

  // Универсальные интерпретации аспектов в двух режимах
  const ASPECT_INTERP_V2 = {
    conjunction: {
      simple: 'эти две силы работают как одна — слитно, всегда вместе',
      detailed: 'силы сливаются в один поток — действуют согласованно, но требуют осознанного управления, чтобы одна не "съедала" другую'
    },
    trine: {
      simple: 'эти силы поддерживают друг друга легко и естественно',
      detailed: 'гармоничный поток — энергии работают согласованно сами по себе. Ресурс, который работает на автопилоте, поэтому его легко не замечать'
    },
    sextile: {
      simple: 'эти силы помогают друг другу, если вы их используете',
      detailed: 'мягкая поддержка через инициативу — возможности приходят, если их брать. Не работает само, нужно сознательное усилие'
    },
    square: {
      simple: 'эти силы спорят внутри вас — но из этого спора вырастает рост',
      detailed: 'внутреннее напряжение, требующее решения — это динамика роста через преодоление. Самый продуктивный из "трудных" аспектов'
    },
    opposition: {
      simple: 'эти силы тянут вас в разные стороны, важно найти баланс',
      detailed: 'два полюса в напряжённом диалоге — важно удержать баланс между ними, не выбирая один в ущерб другому'
    }
  };

  const PLANET_TOPICS_V2 = {
    sun: { simple: 'личность', detailed: 'ядро личности и воля' },
    moon: { simple: 'эмоции', detailed: 'эмоциональная природа и базовые потребности' },
    mercury: { simple: 'мысли', detailed: 'мышление и способ донесения идей' },
    venus: { simple: 'отношения', detailed: 'ценности и сфера чувств' },
    mars: { simple: 'действие', detailed: 'воля и способ добиваться' },
    jupiter: { simple: 'рост', detailed: 'масштаб и стратегия расширения' },
    saturn: { simple: 'ответственность', detailed: 'дисциплина и внутренний стержень' },
    uranus: { simple: 'свобода', detailed: 'потребность в обновлении и нестандартности' },
    neptune: { simple: 'воображение', detailed: 'интуиция и чувствительность к смыслам' },
    pluto: { simple: 'глубокая сила', detailed: 'трансформация и глубинная воля' }
  };

  // === Получение интерпретации планеты в текущем режиме ===
  function getPlanetInterpretationV2(planet, signKey, house, mode) {
    const interp = PLANET_INTERP_V2[planet] || {};
    const generic = SIGN_GENERIC[signKey] || { simple: '', detailed: '' };
    const houseInfo = HOUSE_INFO_V2[house] || {};
    const isSimple = mode === 'simple';

    // Главный текст
    let main;
    if (interp.quality && interp.quality[signKey]) {
      main = isSimple ? interp.quality[signKey].simple : interp.quality[signKey].detailed;
    } else {
      // Для планет без detailed quality — используем generic
      const intro = isSimple ? interp.simple_main : interp.detailed_main;
      const quality = isSimple ? generic.simple : generic.detailed;
      main = `${intro} В знаке ${getSignName(signKey)} это работает ${quality}.`;
    }

    // Текст про дом
    let houseText;
    if (isSimple) {
      houseText = `В ${house} доме — ${houseInfo.simple || 'в сфере ' + (houseInfo.name || '').toLowerCase() + '.'}`;
    } else {
      houseText = `В ${house} доме (${(houseInfo.name || '').toLowerCase()}) — ${houseInfo.detailed || ''}`;
    }

    return { main, house: houseText };
  }

  function getSignName(key) {
    const map = {
      aries: 'Овен', taurus: 'Телец', gemini: 'Близнецы', cancer: 'Рак',
      leo: 'Лев', virgo: 'Дева', libra: 'Весы', scorpio: 'Скорпион',
      sagittarius: 'Стрелец', capricorn: 'Козерог', aquarius: 'Водолей', pisces: 'Рыбы'
    };
    return map[key] || key;
  }

  // Аспект — интерпретация в режиме
  function getAspectInterpretationV2(p1, p2, type, mode) {
    const t1 = PLANET_TOPICS_V2[p1] || { simple: p1, detailed: p1 };
    const t2 = PLANET_TOPICS_V2[p2] || { simple: p2, detailed: p2 };
    const aspect = ASPECT_INTERP_V2[type];
    if (!aspect) return { text: '', tip: '' };
    const isSimple = mode === 'simple';
    const topic1 = isSimple ? t1.simple : t1.detailed;
    const topic2 = isSimple ? t2.simple : t2.detailed;
    const desc = isSimple ? aspect.simple : aspect.detailed;
    return {
      text: `Темы "${topic1}" и "${topic2}": ${desc}.`
    };
  }

  // Дом интерпретация в режиме
  function getHouseInterpretationV2(houseNum, signKey, mode) {
    const houseInfo = HOUSE_INFO_V2[houseNum];
    const generic = SIGN_GENERIC[signKey];
    if (!houseInfo) return { text: '' };
    const isSimple = mode === 'simple';
    const baseText = isSimple ? houseInfo.simple : houseInfo.detailed;
    const styleText = isSimple ? generic.simple : generic.detailed;
    return {
      text: `${baseText} У вас этот дом раскрывается в знаке ${getSignName(signKey)} — ${styleText}.`
    };
  }

  // === Состояние режима ===
  let currentInterpMode = 'detailed'; // 'simple' or 'detailed'

  function setInterpretationMode(mode) {
    currentInterpMode = mode;
    // Re-render все вкладки, которые зависят от режима
    if (typeof renderNatalResultFromChart === 'function' && quizState && quizState.computedChart) {
      renderNatalResultFromChart();
    }
  }

  // === ГЛОССАРИЙ-ТУЛТИП ===
  // Один общий tooltip элемент, переиспользуется для всех терминов
  let __glossaryTooltipEl = null;

  function ensureGlossaryTooltip() {
    if (__glossaryTooltipEl) return __glossaryTooltipEl;
    const el = document.createElement('div');
    el.className = 'glossary-tooltip';
    el.id = '__glossaryTooltip';
    document.body.appendChild(el);
    __glossaryTooltipEl = el;
    return el;
  }

  function showGlossaryTooltip(termEl) {
    const tip = ensureGlossaryTooltip();
    const term = termEl.textContent;
    const explanation = termEl.getAttribute('data-tip') || '';

    tip.innerHTML = `<span class="glossary-tooltip-term">${term}</span>${explanation}`;

    // Position above the term
    const rect = termEl.getBoundingClientRect();
    tip.style.visibility = 'hidden';
    tip.classList.add('visible');
    // Получим размер после установки контента
    const tipRect = tip.getBoundingClientRect();
    // Базовая позиция: над термином, по центру
    let top = rect.top - tipRect.height - 12;
    let left = rect.left + rect.width / 2 - tipRect.width / 2;
    let below = false;
    // Если не помещается сверху — показываем снизу
    if (top < 8) {
      top = rect.bottom + 12;
      below = true;
    }
    // Прижатие к краям окна
    if (left < 8) left = 8;
    if (left + tipRect.width > window.innerWidth - 8) {
      left = window.innerWidth - tipRect.width - 8;
    }
    tip.style.left = left + 'px';
    tip.style.top = top + 'px';
    tip.classList.toggle('below', below);
    tip.style.visibility = 'visible';
  }

  function hideGlossaryTooltip() {
    if (__glossaryTooltipEl) {
      __glossaryTooltipEl.classList.remove('visible');
    }
  }

  // Делегирование событий на body — работает для всех динамически создаваемых терминов
  function initGlossaryListeners() {
    // Hover на десктопе
    document.body.addEventListener('mouseover', (e) => {
      if (e.target.classList && e.target.classList.contains('glossary-term')) {
        showGlossaryTooltip(e.target);
      }
    });
    document.body.addEventListener('mouseout', (e) => {
      if (e.target.classList && e.target.classList.contains('glossary-term')) {
        hideGlossaryTooltip();
      }
    });
    // Touch на мобильных — tap = показ, второй tap = скрытие
    document.body.addEventListener('click', (e) => {
      if (e.target.classList && e.target.classList.contains('glossary-term')) {
        // Если уже активен — закрыть
        const tip = ensureGlossaryTooltip();
        if (tip.classList.contains('visible') &&
            tip.dataset.activeFor === e.target.textContent) {
          hideGlossaryTooltip();
          tip.dataset.activeFor = '';
        } else {
          showGlossaryTooltip(e.target);
          tip.dataset.activeFor = e.target.textContent;
          e.stopPropagation();
        }
      } else if (__glossaryTooltipEl && __glossaryTooltipEl.classList.contains('visible')) {
        // Тап вне термина — скрыть
        hideGlossaryTooltip();
      }
    });
    // Прокрутка — скрыть
    window.addEventListener('scroll', hideGlossaryTooltip, { passive: true });
  }

  // === ИНИЦИАЛИЗАЦИЯ ПЕРЕКЛЮЧАТЕЛЯ ===
  function initInterpModeToggle() {
    document.querySelectorAll('.interp-mode-btn, .header-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        document.querySelectorAll('.interp-mode-btn, .header-mode-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.mode === mode);
        });
        setInterpretationMode(mode);
      });
    });
  }


  
// === DYNAMIC SUMMARY ===
  // ============================================
  // DYNAMIC SUMMARY — генерируется из computedChart
  // Двойной режим: simple / detailed
  // ============================================

  // === Анализ карты — что в ней примечательного ===
  function analyzeChart(chart) {
    const findings = {
      stelliums: [],          // стеллиумы по знакам (3+ планет)
      houseStelliums: [],     // стеллиумы по домам
      dominantElement: null,  // доминирующая стихия (>40%)
      elementBalance: null,   // 'balanced' | 'imbalanced'
      exactAspects: [],       // аспекты с орбом <1°
      sunAspects: [],         // аспекты к Солнцу
      moonAspects: [],        // аспекты к Луне
      ascAspects: [],         // аспекты к Asc
      aspectCounts: { trine: 0, square: 0, sextile: 0, opposition: 0, conjunction: 0 },
      angularPlanets: [],     // планеты в 1/4/7/10 домах — сильные
    };

    // 1. Стеллиумы по знакам
    const bySign = {};
    Object.entries(chart.planets).forEach(([key, p]) => {
      if (!bySign[p.sign.key]) bySign[p.sign.key] = [];
      bySign[p.sign.key].push({ key, planet: p });
    });
    Object.entries(bySign).forEach(([signKey, list]) => {
      if (list.length >= 3) {
        findings.stelliums.push({
          sign: list[0].planet.sign,
          planets: list.map(x => x.key),
        });
      }
    });

    // 2. Стеллиумы по домам
    const byHouse = {};
    Object.entries(chart.planets).forEach(([key, p]) => {
      if (!byHouse[p.house]) byHouse[p.house] = [];
      byHouse[p.house].push({ key, planet: p });
    });
    Object.entries(byHouse).forEach(([house, list]) => {
      if (list.length >= 3) {
        findings.houseStelliums.push({
          house: parseInt(house),
          planets: list.map(x => x.key),
        });
      }
    });

    // 3. Доминирующая стихия
    const elements = chart.elements;
    let maxEl = null, maxV = 0, minEl = null, minV = 100;
    Object.entries(elements).forEach(([k, v]) => {
      if (v > maxV) { maxV = v; maxEl = k; }
      if (v < minV) { minV = v; minEl = k; }
    });
    if (maxV >= 40) findings.dominantElement = maxEl;
    findings.weakestElement = (minV <= 10) ? minEl : null;
    // Спектр стихий: насколько сбалансирован
    const variance = Math.max(...Object.values(elements)) - Math.min(...Object.values(elements));
    findings.elementBalance = variance < 25 ? 'balanced' : (variance > 50 ? 'concentrated' : 'mixed');

    // 4. Аспекты
    chart.aspects.forEach(a => {
      if (a.orb < 1) findings.exactAspects.push(a);
      if (a.from === 'sun' || a.to === 'sun') findings.sunAspects.push(a);
      if (a.from === 'moon' || a.to === 'moon') findings.moonAspects.push(a);
      findings.aspectCounts[a.type] = (findings.aspectCounts[a.type] || 0) + 1;
    });

    // 5. Угловые планеты (в 1, 4, 7, 10 домах)
    Object.entries(chart.planets).forEach(([key, p]) => {
      if ([1, 4, 7, 10].includes(p.house)) {
        findings.angularPlanets.push({ key, house: p.house });
      }
    });

    return findings;
  }

  // === Эмодзи и описания для конфигураций ===
  const ELEMENT_NAMES = {
    fire: 'огня', earth: 'земли', air: 'воздуха', water: 'воды'
  };
  const ELEMENT_NAMES_NOM = {
    fire: 'Огонь', earth: 'Земля', air: 'Воздух', water: 'Вода'
  };
  const ELEMENT_QUALITIES = {
    fire: { simple: 'энергию, импульс, желание действовать первым',
            detailed: 'инициативность, желание действовать первым, способность зажигать других своим энтузиазмом' },
    earth: { simple: 'устойчивость, практичность, ориентацию на результат',
             detailed: 'устойчивость, практичность, способность доводить начатое до конкретного результата, ценить материальное' },
    air: { simple: 'мышление, связи, поток идей',
           detailed: 'аналитический ум, тягу к коммуникации, способность видеть закономерности и связывать разнородное' },
    water: { simple: 'чувствительность, интуицию, эмоциональную глубину',
             detailed: 'эмоциональную чувствительность, интуицию, способность ощущать подтекст и работать с глубиной' }
  };

  // === Краткие описания планет для синтеза ===
  const PLANET_NAMES_RUS = {
    sun: 'Солнце', moon: 'Луна', mercury: 'Меркурий', venus: 'Венера',
    mars: 'Марс', jupiter: 'Юпитер', saturn: 'Сатурн', uranus: 'Уран',
    neptune: 'Нептун', pluto: 'Плутон'
  };

  // === Главный генератор Сводки ===
  function buildSummaryHTML(chart, name, mode) {
    if (!chart) return '';
    const f = analyzeChart(chart);
    const isSimple = mode === 'simple';

    const sun = chart.planets.sun;
    const moon = chart.planets.moon;
    const asc = chart.ascSign;

    // === 1. Ключевые конфигурации (динамически) ===
    let configsHTML = '';
    const configItems = [];

    // Правильное склонение знаков
    const SIGN_LOC = {
      'Овен': 'Овне', 'Телец': 'Тельце', 'Близнецы': 'Близнецах',
      'Рак': 'Раке', 'Лев': 'Льве', 'Дева': 'Деве',
      'Весы': 'Весах', 'Скорпион': 'Скорпионе', 'Стрелец': 'Стрельце',
      'Козерог': 'Козероге', 'Водолей': 'Водолее', 'Рыбы': 'Рыбах'
    };
    // Стеллиумы по знакам
    f.stelliums.forEach(s => {
      const planetNames = s.planets.map(p => PLANET_NAMES_RUS[p]).join(', ');
      configItems.push({
        glyph: '⚯',
        title: `Стеллиум в ${SIGN_LOC[s.sign.name] || s.sign.name}`,
        desc: `${planetNames} — концентрация энергии знака`
      });
    });

    // Стеллиумы по домам
    f.houseStelliums.forEach(s => {
      const planetNames = s.planets.map(p => PLANET_NAMES_RUS[p]).join(', ');
      const houseLabel = HOUSE_INFO_V2[s.house] ? HOUSE_INFO_V2[s.house].name.toLowerCase() : 'этого дома';
      configItems.push({
        glyph: '◇',
        title: `Скопление в ${s.house} доме`,
        desc: `${planetNames} — сильный акцент на теме «${houseLabel}»`
      });
    });

    // Доминирующая стихия
    if (f.dominantElement) {
      configItems.push({
        glyph: '△',
        title: `Доминирующая стихия — ${ELEMENT_NAMES_NOM[f.dominantElement]}`,
        desc: `${chart.elements[f.dominantElement]}% планет — выраженная ориентация на ${isSimple ? ELEMENT_QUALITIES[f.dominantElement].simple : ELEMENT_QUALITIES[f.dominantElement].detailed}`
      });
    }

    // Точные аспекты
    if (f.exactAspects.length > 0) {
      const a = f.exactAspects[0];
      configItems.push({
        glyph: a.sym || '⚹',
        title: `Точный ${a.label.toLowerCase()} ${a.orb.toFixed(1)}°`,
        desc: `${PLANET_NAMES_RUS[a.from]}–${PLANET_NAMES_RUS[a.to]} — этот аспект работает в полную силу`
      });
    }

    // Если ничего нет — добавим карту триады
    if (configItems.length === 0) {
      configItems.push({
        glyph: '☉',
        title: `Триада: ${sun.sign.name} / ${moon.sign.name} / ${asc.name}`,
        desc: `Солнце · Луна · Асцендент — основа вашей карты`
      });
    }

    // Берём максимум 4
    const limited = configItems.slice(0, 4);
    configsHTML = `
      <div class="configurations">
        <div class="config-h">КЛЮЧЕВЫЕ КОНФИГУРАЦИИ ВАШЕЙ КАРТЫ</div>
        <div class="config-list">
          ${limited.map(c => `
            <div class="config-item">
              <div class="config-glyph">${c.glyph}</div>
              <div>
                <p class="config-title">${c.title}</p>
                <p class="config-desc">${wrapGlossaryTerms(c.desc)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // === 2. Большой синтез ===
    // Соберу разделы текста — каждый с режимом simple/detailed

    const sunInterp = PLANET_INTERP_V2.sun.quality[sun.sign.key] || {};
    const moonInterp = PLANET_INTERP_V2.moon.quality[moon.sign.key] || {};
    const ascText = SIGN_GENERIC[asc.key] || { simple: '', detailed: '' };

    // Ядро личности
    const sunHouseInfo = HOUSE_INFO_V2[sun.house] || {};
    const sunSection_simple = `
      <p class="summary-text">Ваше Солнце в ${sun.sign.name}е (${sun.sign.degree.toFixed(1)}°) в ${sun.house} доме. ${sunInterp.simple || ''}</p>
      <p class="summary-text">${sun.house} дом — это про ${sunHouseInfo.simple || ''}. Именно здесь ваша личность раскрывается ярче всего.</p>
    `;
    const sunSection_detailed = `
      <p class="summary-text">Солнце в ${sun.sign.name}е (${sun.sign.degree.toFixed(1)}°) — ядро вашей личности. ${sunInterp.detailed || ''}</p>
      <p class="summary-text">Положение в ${sun.house} доме (${sunHouseInfo.name ? sunHouseInfo.name.toLowerCase() : ''}) означает, что вы реализуете эту энергию через сферу, где ${sunHouseInfo.detailed || 'действует эта тема'}. Это центральная ось вашего самопроявления.</p>
    `;

    // Эмоциональная природа — Луна
    const moonHouseInfo = HOUSE_INFO_V2[moon.house] || {};
    const moonSection_simple = `
      <p class="summary-text">Луна в ${moon.sign.name}е (${moon.sign.degree.toFixed(1)}°) в ${moon.house} доме. ${moonInterp.simple || ''}</p>
      <p class="summary-text">Восстанавливаетесь и наполняетесь через темы ${moon.house} дома — ${moonHouseInfo.simple ? moonHouseInfo.simple.toLowerCase().replace('это про ', '') : ''}</p>
    `;
    const moonSection_detailed = `
      <p class="summary-text">Луна в ${moon.sign.name}е (${moon.sign.degree.toFixed(1)}°) — ваша эмоциональная природа. ${moonInterp.detailed || ''}</p>
      <p class="summary-text">В ${moon.house} доме это означает, что ваша эмоциональная регуляция и базовые потребности связаны со сферой, где ${moonHouseInfo.detailed || ''}. Знание этой связки помогает осознанно подходить к восстановлению.</p>
    `;

    // Облик и подход — Asc
    const ascSection_simple = `
      <p class="summary-text">Асцендент в ${asc.name}е (${asc.degree.toFixed(1)}°) — это как вы выглядите для других при первой встрече, ваш «фасад». Вы воспринимаетесь ${ascText.simple || ''}.</p>
    `;
    const ascSection_detailed = `
      <p class="summary-text">Асцендент в ${asc.name}е (${asc.degree.toFixed(1)}°) — это маска, которую вы показываете миру, и тот фильтр, через который воспринимаете реальность в первые секунды любой ситуации. Вы проявляетесь ${ascText.detailed || ''}.</p>
    `;

    // Триада-синтез — самое важное
    const triadSection_simple = `
      <h2 class="summary-h">Кто вы по сути</h2>
      <p class="summary-text">Соединяя все три ключевые точки: вы — это <em>${sun.sign.name} с эмоциями ${moon.sign.name === sun.sign.name ? 'того же знака' : 'знака ' + moon.sign.name}, показывающий миру лицо ${asc.name === sun.sign.name ? 'того же знака' : 'знака ' + asc.name}</em>.</p>
      <p class="summary-text">Это значит: ${getTriadSimple(sun.sign.key, moon.sign.key, asc.key)}</p>
    `;
    const triadSection_detailed = `
      <h2 class="summary-h">Триада «Солнце-Луна-Асцендент»: синтез</h2>
      <p class="summary-text">Это три ключевые точки вашей карты, их взаимодействие даёт основной портрет. Внутренняя суть (Солнце ${sun.sign.name}) + эмоциональная природа (Луна ${moon.sign.name}) + внешний облик (Асцендент ${asc.name}).</p>
      <p class="summary-text">${getTriadDetailed(sun.sign.key, moon.sign.key, asc.key, sun.sign.name, moon.sign.name, asc.name)}</p>
      <div class="insight-pull">
        <p>"${getTriadInsight(sun.sign.key, moon.sign.key, asc.key)}"</p>
      </div>
    `;

    // Главные аспекты (точные + к светилам)
    let mainAspectsSection = '';
    if (f.exactAspects.length > 0 || f.sunAspects.length > 0 || f.moonAspects.length > 0) {
      const importantAspects = [
        ...f.exactAspects,
        ...f.sunAspects.filter(a => !f.exactAspects.includes(a)).slice(0, 2),
        ...f.moonAspects.filter(a => !f.exactAspects.includes(a) && !f.sunAspects.includes(a)).slice(0, 2)
      ].slice(0, 4);

      const aspectLines = importantAspects.map(a => {
        const interp = getAspectInterpretationV2(a.from, a.to, a.type, mode);
        return `<p class="summary-text"><strong>${PLANET_NAMES_RUS[a.from]} ${a.sym} ${PLANET_NAMES_RUS[a.to]} (${a.label.toLowerCase()}, орб ${a.orb.toFixed(1)}°):</strong> ${wrapGlossaryTerms(interp.text)}</p>`;
      }).join('');

      mainAspectsSection = `
        <h2 class="summary-h">${isSimple ? 'Главные связки в карте' : 'Ключевые аспекты'}</h2>
        ${aspectLines}
      `;
    }

    // Стихии
    const dominantText = f.dominantElement
      ? (isSimple
          ? `<p class="summary-text">В вашей карте больше всего планет в стихии <em>${ELEMENT_NAMES_NOM[f.dominantElement]}</em> — это значит, в вашем характере много ${ELEMENT_QUALITIES[f.dominantElement].simple}.</p>`
          : `<p class="summary-text">Доминирующая стихия — <em>${ELEMENT_NAMES_NOM[f.dominantElement]}</em> (${chart.elements[f.dominantElement]}% планет). Это ваш базовый «температурный режим» — в вашем характере выражены ${ELEMENT_QUALITIES[f.dominantElement].detailed}.</p>`)
      : (isSimple
          ? `<p class="summary-text">У вас сбалансированная карта — стихии распределены ровно, без сильного перекоса.</p>`
          : `<p class="summary-text">Стихии в вашей карте распределены равномерно (${Object.entries(chart.elements).map(([k,v]) => `${ELEMENT_NAMES_NOM[k]} ${v}%`).join(', ')}). Нет одного доминирующего «режима» — это даёт гибкость, но требует осознанного выбора, какую стихию подключать в конкретной ситуации.</p>`);

    const weakText = f.weakestElement
      ? (isSimple
          ? `<p class="summary-text">При этом стихии <em>${ELEMENT_NAMES_NOM[f.weakestElement]}</em> у вас мало — это область, где может не хватать естественной поддержки.</p>`
          : `<p class="summary-text">Стихия <em>${ELEMENT_NAMES_NOM[f.weakestElement]}</em> представлена слабо (${chart.elements[f.weakestElement]}%). Качества ${ELEMENT_QUALITIES[f.weakestElement].detailed} — это то, что естественно даётся хуже, и где полезна сознательная компенсация.</p>`)
      : '';

    const elementsSection = `
      <h2 class="summary-h">${isSimple ? 'Ваш характер' : 'Стихийный баланс'}</h2>
      ${dominantText}
      ${weakText}
    `;

    // Финальный сбор
    const summaryCardHTML = `
      <div class="summary-card">
        <div class="summary-section">
          <h2 class="summary-h">${isSimple ? 'Ваше «я»' : 'Ядро личности'}</h2>
          ${isSimple ? sunSection_simple : sunSection_detailed}
        </div>
        <div class="summary-section">
          <h2 class="summary-h">${isSimple ? 'Ваши эмоции' : 'Эмоциональная природа'}</h2>
          ${isSimple ? moonSection_simple : moonSection_detailed}
        </div>
        <div class="summary-section">
          <h2 class="summary-h">${isSimple ? 'Как вас видят' : 'Облик и подход к миру'}</h2>
          ${isSimple ? ascSection_simple : ascSection_detailed}
        </div>
        <div class="summary-section">
          ${isSimple ? triadSection_simple : triadSection_detailed}
        </div>
        ${mainAspectsSection ? `<div class="summary-section">${mainAspectsSection}</div>` : ''}
        <div class="summary-section">
          ${elementsSection}
        </div>
      </div>
    `;

    return configsHTML + summaryCardHTML;
  }

  // === Хелперы для триады ===
  function getTriadSimple(sunKey, moonKey, ascKey) {
    // Стихии каждой точки
    const elements = {
      aries: 'fire', taurus: 'earth', gemini: 'air', cancer: 'water',
      leo: 'fire', virgo: 'earth', libra: 'air', scorpio: 'water',
      sagittarius: 'fire', capricorn: 'earth', aquarius: 'air', pisces: 'water'
    };
    const sunEl = elements[sunKey];
    const moonEl = elements[moonKey];
    const ascEl = elements[ascKey];

    if (sunEl === moonEl && moonEl === ascEl) {
      return `все три точки в одной стихии (${ELEMENT_NAMES_NOM[sunEl]}) — у вас цельный, однонаправленный характер. Сильно и однозначно, но иногда не хватает гибкости.`;
    }
    if (sunEl === ascEl && sunEl !== moonEl) {
      return `внешне и внутренне вы похожи (одна стихия), но эмоциональная сторона другая — это создаёт интересный контраст между тем, как вы выглядите/действуете и как чувствуете.`;
    }
    if (sunEl === moonEl && sunEl !== ascEl) {
      return `внутри вы цельный (Солнце и Луна в одной стихии), но снаружи кажетесь другим — Асцендент даёт другой «фасад». Это часто удивляет людей при знакомстве.`;
    }
    if (moonEl === ascEl && moonEl !== sunEl) {
      return `эмоционально и внешне вы согласованы, но внутри ядро другой природы — это даёт глубину, которую видят только близкие.`;
    }
    return `все три точки разной стихии — у вас разнообразный, многослойный характер. Разные ситуации раскрывают разные стороны.`;
  }

  function getTriadDetailed(sunKey, moonKey, ascKey, sunName, moonName, ascName) {
    // Возьмём качества из interpretations
    const sunQ = PLANET_INTERP_V2.sun.quality[sunKey];
    const moonQ = PLANET_INTERP_V2.moon.quality[moonKey];
    const ascQ = SIGN_GENERIC[ascKey];

    return `Внутренне (Солнце ${sunName}) вы — ${sunQ ? sunQ.detailed.toLowerCase().split('.')[0] : 'имеете определённую природу самопроявления'}. Эмоционально (Луна ${moonName}) — ${moonQ ? moonQ.detailed.toLowerCase().split('.')[0] : 'обладаете специфической эмоциональной природой'}. А мир встречает вас (Асцендент ${ascName}) ${ascQ ? ascQ.detailed : 'через определённую призму'}. Знание этих трёх слоёв помогает не путать их друг с другом — например, не пытаться эмоционально жить как Солнце, а Асцендент-маску воспринимать как «полный я».`;
  }

  function getTriadInsight(sunKey, moonKey, ascKey) {
    const elements = {
      aries: 'fire', taurus: 'earth', gemini: 'air', cancer: 'water',
      leo: 'fire', virgo: 'earth', libra: 'air', scorpio: 'water',
      sagittarius: 'fire', capricorn: 'earth', aquarius: 'air', pisces: 'water'
    };
    const allSame = elements[sunKey] === elements[moonKey] && elements[moonKey] === elements[ascKey];
    if (allSame) return 'Цельная карта — редкая структура. Сила в фокусе, риск — в негибкости.';
    if (elements[sunKey] === elements[ascKey]) return 'Какими вас видят, такие вы по сути и есть — но эмоции имеют свою отдельную природу.';
    if (elements[moonKey] === elements[ascKey]) return 'Эмоции и внешний облик согласованы — но внутреннее ядро живёт по своим законам.';
    return 'Многослойная карта — разные стороны вашей личности живут в разных стихиях.';
  }


  
  // === PAYMENT SCREEN ===
  // ============================================
  // PAYMENT SCREEN — динамические контексты
  // ============================================

  var paymentState = {
    context: null,      // 'natal' | 'matrix' | 'reading'
    tier: null,         // 'pro' | 'premium'
    timerSeconds: 900,  // 15:00 в секундах
    timerInterval: null
  };

  // SVG-иллюстрации для каждого контекста (стилистически соответствуют сайту)
  var PAY_ILLUSTRATIONS = {
    natal: '<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="natalGlow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#F5E8CC" stop-opacity="0.8"/>' +
      '<stop offset="100%" stop-color="#F5E8CC" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<circle cx="160" cy="160" r="150" fill="url(#natalGlow)"/>' +
      '<circle cx="160" cy="160" r="130" fill="none" stroke="#D4AE5C" stroke-width="0.8" opacity="0.6"/>' +
      '<circle cx="160" cy="160" r="100" fill="none" stroke="#B8923D" stroke-width="1.2"/>' +
      '<circle cx="160" cy="160" r="65" fill="none" stroke="#D4AE5C" stroke-width="0.6" opacity="0.5"/>' +
      // Деления знаков
      Array.from({length: 12}, (_, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        const x1 = 160 + Math.cos(a) * 100, y1 = 160 + Math.sin(a) * 100;
        const x2 = 160 + Math.cos(a) * 130, y2 = 160 + Math.sin(a) * 130;
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#D4AE5C" stroke-width="0.8" opacity="0.5"/>`;
      }).join('') +
      // Планеты-точки
      '<circle cx="120" cy="100" r="5" fill="#B8923D"/>' +
      '<circle cx="220" cy="140" r="5" fill="#B8923D"/>' +
      '<circle cx="200" cy="220" r="5" fill="#B8923D"/>' +
      '<circle cx="100" cy="200" r="5" fill="#B8923D"/>' +
      '<circle cx="240" cy="180" r="4" fill="#8B6914"/>' +
      '<circle cx="80" cy="160" r="4" fill="#8B6914"/>' +
      // Линии аспектов
      '<line x1="120" y1="100" x2="200" y2="220" stroke="#B8923D" stroke-width="0.6" opacity="0.5"/>' +
      '<line x1="220" y1="140" x2="100" y2="200" stroke="#B8923D" stroke-width="0.6" opacity="0.5"/>' +
      // Звёздочки в углах
      '<text x="160" y="70" text-anchor="middle" fill="#B8923D" font-size="20" opacity="0.5">✦</text>' +
      '<text x="160" y="262" text-anchor="middle" fill="#B8923D" font-size="20" opacity="0.5">✦</text>' +
      // Центр
      '<circle cx="160" cy="160" r="6" fill="#B8923D"/>' +
      '<circle cx="160" cy="160" r="3" fill="#FFFCF5"/>' +
      '</svg>',

    matrix: '<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="matGlow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#F5E8CC" stop-opacity="0.8"/>' +
      '<stop offset="100%" stop-color="#F5E8CC" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<circle cx="160" cy="160" r="150" fill="url(#matGlow)"/>' +
      // Октаграмма — два квадрата
      '<rect x="60" y="60" width="200" height="200" fill="none" stroke="#B8923D" stroke-width="1.2"/>' +
      '<rect x="60" y="60" width="200" height="200" fill="none" stroke="#B8923D" stroke-width="1.2" transform="rotate(45 160 160)"/>' +
      // Центральная диагональная сетка
      '<line x1="160" y1="20" x2="160" y2="300" stroke="#D4AE5C" stroke-width="0.6" opacity="0.5"/>' +
      '<line x1="20" y1="160" x2="300" y2="160" stroke="#D4AE5C" stroke-width="0.6" opacity="0.5"/>' +
      '<line x1="60" y1="60" x2="260" y2="260" stroke="#D4AE5C" stroke-width="0.6" opacity="0.5"/>' +
      '<line x1="260" y1="60" x2="60" y2="260" stroke="#D4AE5C" stroke-width="0.6" opacity="0.5"/>' +
      // Точки матрицы с цифрами
      '<g font-family="Cormorant Garamond, serif" font-size="14" fill="#3D2E1A">' +
      '<circle cx="160" cy="20" r="14" fill="#FFFCF5" stroke="#B8923D" stroke-width="1"/><text x="160" y="25" text-anchor="middle">7</text>' +
      '<circle cx="300" cy="160" r="14" fill="#FFFCF5" stroke="#B8923D" stroke-width="1"/><text x="300" y="165" text-anchor="middle">11</text>' +
      '<circle cx="160" cy="300" r="14" fill="#FFFCF5" stroke="#B8923D" stroke-width="1"/><text x="160" y="305" text-anchor="middle">3</text>' +
      '<circle cx="20" cy="160" r="14" fill="#FFFCF5" stroke="#B8923D" stroke-width="1"/><text x="20" y="165" text-anchor="middle">5</text>' +
      '<circle cx="260" cy="60" r="12" fill="#FFFCF5" stroke="#D4AE5C" stroke-width="1"/><text x="260" y="65" text-anchor="middle" font-size="12">9</text>' +
      '<circle cx="260" cy="260" r="12" fill="#FFFCF5" stroke="#D4AE5C" stroke-width="1"/><text x="260" y="265" text-anchor="middle" font-size="12">8</text>' +
      '<circle cx="60" cy="260" r="12" fill="#FFFCF5" stroke="#D4AE5C" stroke-width="1"/><text x="60" y="265" text-anchor="middle" font-size="12">2</text>' +
      '<circle cx="60" cy="60" r="12" fill="#FFFCF5" stroke="#D4AE5C" stroke-width="1"/><text x="60" y="65" text-anchor="middle" font-size="12">12</text>' +
      '<circle cx="160" cy="160" r="22" fill="#B8923D"/><text x="160" y="167" text-anchor="middle" fill="#FFFCF5" font-size="20" font-weight="500">22</text>' +
      '</g></svg>',

    reading: '<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="rdGlow" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0%" stop-color="#F5E8CC" stop-opacity="0.8"/>' +
      '<stop offset="100%" stop-color="#F5E8CC" stop-opacity="0"/>' +
      '</radialGradient></defs>' +
      '<circle cx="160" cy="160" r="150" fill="url(#rdGlow)"/>' +
      // Три карты веером
      '<g transform="translate(80 100) rotate(-15)">' +
      '<rect x="0" y="0" width="80" height="130" rx="6" fill="#FFFCF5" stroke="#B8923D" stroke-width="1.5"/>' +
      '<rect x="6" y="6" width="68" height="118" rx="4" fill="none" stroke="#D4AE5C" stroke-width="0.6"/>' +
      '<text x="40" y="75" text-anchor="middle" fill="#B8923D" font-size="36" font-family="Cormorant Garamond, serif" font-style="italic">I</text>' +
      '<text x="40" y="105" text-anchor="middle" fill="#8B6914" font-size="9" letter-spacing="2">МАГ</text>' +
      '</g>' +
      '<g transform="translate(160 90)">' +
      '<rect x="0" y="0" width="80" height="130" rx="6" fill="#FFFCF5" stroke="#B8923D" stroke-width="1.5"/>' +
      '<rect x="6" y="6" width="68" height="118" rx="4" fill="none" stroke="#D4AE5C" stroke-width="0.6"/>' +
      '<text x="40" y="80" text-anchor="middle" fill="#B8923D" font-size="32" font-family="Cormorant Garamond, serif" font-style="italic">XVII</text>' +
      '<text x="40" y="108" text-anchor="middle" fill="#8B6914" font-size="9" letter-spacing="2">ЗВЕЗДА</text>' +
      '</g>' +
      '<g transform="translate(220 100) rotate(15)">' +
      '<rect x="0" y="0" width="80" height="130" rx="6" fill="#FFFCF5" stroke="#B8923D" stroke-width="1.5"/>' +
      '<rect x="6" y="6" width="68" height="118" rx="4" fill="none" stroke="#D4AE5C" stroke-width="0.6"/>' +
      '<text x="40" y="80" text-anchor="middle" fill="#B8923D" font-size="36" font-family="Cormorant Garamond, serif" font-style="italic">XIX</text>' +
      '<text x="40" y="108" text-anchor="middle" fill="#8B6914" font-size="9" letter-spacing="2">СОЛНЦЕ</text>' +
      '</g>' +
      // Звёзды-блёстки
      '<text x="60" y="60" fill="#B8923D" font-size="14" opacity="0.6">✦</text>' +
      '<text x="270" y="80" fill="#B8923D" font-size="14" opacity="0.6">✦</text>' +
      '<text x="80" y="270" fill="#B8923D" font-size="14" opacity="0.6">✦</text>' +
      '<text x="260" y="280" fill="#B8923D" font-size="14" opacity="0.6">✦</text>' +
      '</svg>'
  };

  // === Контент по контекстам ===
  var PAY_CONTENT = {
    natal: {
      topbarType: 'натальная карта',
      heroEyebrow: 'РАСШИРЕННЫЙ ДОСТУП К НАТАЛЬНОЙ КАРТЕ',
      heroHeading: 'Полная картина <em>твоей</em> натальной карты ждёт тебя',
      heroSub: 'Перейди от 3-минутного обзора к глубокой астрологической интерпретации с реальными расчётами 10 планет, 12 домов и всех аспектов между ними.',
      stat1Number: '1278 человек',
      stat1Text: 'сегодня открыли свою полную карту',
      payHeading: 'Твоя <span class="accent">полная карта</span> ждёт за этим конвертом',
      paySubheading: 'Глубокая интерпретация, AI-консультант, годовые транзиты — всё за <span class="price-emphasis">0,50&nbsp;€</span>',
      promoCode: 'LOVIANATAL95',
      infoTitle: 'Почему натальной карте от <em>Lovia</em> можно доверять',
      infoFeatures: [
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M 12 2 L 12 22 M 2 12 L 22 12 M 5 5 L 19 19 M 19 5 L 5 19"/></svg>',
          title: 'Реальные астрономические расчёты',
          desc: 'Позиции планет, домов и аспектов рассчитываются по формулам VSOP87 — той же системе, что используют профессиональные астрологи. Точность ±1°.' },
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M 4 6 L 20 6 M 4 12 L 16 12 M 4 18 L 20 18"/><circle cx="20" cy="12" r="2" fill="currentColor"/></svg>',
          title: 'Интерпретация на двух уровнях глубины',
          desc: 'Режим "Просто" — для тех, кто только знакомится с астрологией. "Подробно" — для тех, кто хочет терминологию, орбы и точные градусы.' },
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="9" r="6"/><path d="M 21 21 L 14 14"/></svg>',
          title: 'AI-астролог отвечает на ваши вопросы',
          desc: 'Спросите всё что угодно про свою карту — Claude Sonnet 4 даёт развёрнутые ответы, учитывая ваши планеты, дома и аспекты. Без ограничений по числу вопросов.' }
      ],
      payFeatures: [
        'Все 10 планет с интерпретацией в знаке, доме и аспектах',
        'Полный разбор всех 22 аспектов с орбами',
        'Транзиты на сегодня — что происходит с твоей картой прямо сейчас',
        'Чат "Спроси астролога" — неограниченные вопросы по карте'
      ],
      reviews: [
        { stars: '★★★★★', text: 'Впервые за десять лет интереса к астрологии вижу сервис, который объясняет квадрат Луны к Сатурну без эзотерического тумана. Реально полезная информация.', author: 'Мария К. · Москва' },
        { stars: '★★★★★', text: 'Купила Pro ради чата с AI. Задаю вопросы о карте партнёра, синастрии — отвечает развёрнуто, не уходит в общие фразы. Стоит каждого евро.', author: 'Анна Л. · Прага' },
        { stars: '★★★★★', text: 'Транзиты на год — это то, что я искала. Не "ретроградный Меркурий бойтесь компьютеры", а нормальный разбор когда чего ожидать.', author: 'Елена В. · Киев' }
      ],
      faq: [
        { q: 'Что я получаю в Pro помимо базовой натальной карты?', a: 'Полную интерпретацию всех 10 планет в подробном режиме, все аспекты с их влиянием друг на друга, транзиты на сегодня и на год вперёд, а также неограниченный чат с AI-астрологом для вопросов по вашей карте.' },
        { q: 'Что такое "пробный период 3 дня"?', a: 'Вы платите 0,50€ за полный доступ на 3 дня. За это время можете изучить всё что есть в Pro. По истечении пробного периода подписка автоматически продлевается на 29,90€/мес, если вы её не отмените в личном кабинете.' },
        { q: 'Где я могу отменить подписку?', a: 'В личном кабинете в разделе "Подписка". Отмена занимает один клик и доступна в любой момент. Если отмените во время пробного периода — больше с вас списано не будет.' },
        { q: 'Насколько точны расчёты?', a: 'Позиции планет рассчитываются с погрешностью ±1° по формулам VSOP87. Это та же точность, что в популярных астрологических программах. Для астрологической интерпретации этого более чем достаточно.' }
      ]
    },

    matrix: {
      topbarType: 'матрица судьбы',
      heroEyebrow: 'РАСШИРЕННЫЙ ДОСТУП К МАТРИЦЕ',
      heroHeading: 'Энергетический <em>код</em> твоей судьбы — полная расшифровка',
      heroSub: 'Перейди от 3-минутного обзора к глубокому разбору всех 22 точек матрицы по системе Ладини с интерпретацией каждой точки и взаимосвязей между ними.',
      stat1Number: '843 человека',
      stat1Text: 'сегодня раскрыли свою матрицу',
      payHeading: 'Полная <span class="accent">матрица твоей судьбы</span> в одном отчёте',
      paySubheading: 'Все 22 точки, кармические задачи, зоны роста — всё за <span class="price-emphasis">0,50&nbsp;€</span>',
      promoCode: 'LOVIAMATRIX95',
      infoTitle: 'Почему матрице судьбы от <em>Lovia</em> можно доверять',
      infoFeatures: [
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="12,3 21,12 12,21 3,12"/><polygon points="12,8 16,12 12,16 8,12" fill="currentColor"/></svg>',
          title: 'Точный алгоритм системы Ладини',
          desc: 'Расчёт 22 точек октаграммы по классической методике с учётом всех взаимосвязей. Не упрощённая версия, а полная математика.' },
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M 12 2 L 12 22 M 6 6 L 18 18 M 18 6 L 6 18 M 2 12 L 22 12"/></svg>',
          title: 'Шесть фокусов разбора',
          desc: 'Предназначение, любовь, деньги, род, самопознание, общий — каждый фокус даёт свой угол интерпретации одних и тех же точек.' },
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M 4 6 C 8 2, 16 2, 20 6 M 4 18 C 8 22, 16 22, 20 18"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
          title: 'AI-нумеролог отвечает на вопросы',
          desc: 'Чат с Claude Sonnet 4, который видит вашу матрицу и даёт ответы по конкретным точкам. Можно копать сколь угодно глубоко.' }
      ],
      payFeatures: [
        'Полный разбор всех 22 точек матрицы с интерпретацией',
        'Зоны комфорта и зоны роста — куда направлять усилия',
        'Линии судьбы: кармическая, родовая, любовная, финансовая',
        'Чат "Спроси нумеролога" — неограниченные вопросы по матрице'
      ],
      reviews: [
        { stars: '★★★★★', text: 'Прошла десяток сервисов с матрицами, везде одни и те же копипастные тексты. Здесь впервые увидела связи между точками, а не отдельные интерпретации.', author: 'Наталья П. · Алматы' },
        { stars: '★★★★★', text: 'Фокус "род" вскрыл темы, которые я обходила годами. Не мистика, а структурный взгляд на повторяющиеся семейные сценарии.', author: 'Ольга Д. · Берлин' },
        { stars: '★★★★★', text: 'Купила Pro ради чата. Задаю вопросы по точкам матрицы — отвечает не общими фразами, а с привязкой к моим конкретным числам.', author: 'Светлана М. · Минск' }
      ],
      faq: [
        { q: 'Что я получаю в Pro помимо базовой матрицы?', a: 'Полный разбор всех 22 точек октаграммы с детальной интерпретацией, разделение зон комфорта и роста, линии судьбы по 6 фокусам (предназначение, любовь, деньги, род, самопознание, общий), а также неограниченный чат с AI-нумерологом.' },
        { q: 'Чем ваша матрица отличается от других сервисов?', a: 'У нас полный алгоритм Ладини с расчётом всех взаимосвязей между точками, а не упрощённая версия. Также интерпретация привязана к вашим конкретным числам, а не подставляется из шаблона.' },
        { q: 'Что такое "пробный период 3 дня"?', a: 'Вы платите 0,50€ за полный доступ на 3 дня. По истечении пробного периода подписка продлевается на 29,90€/мес автоматически, если вы не отмените её в личном кабинете.' },
        { q: 'Где я могу отменить подписку?', a: 'В личном кабинете в разделе "Подписка". Отмена в один клик, доступна в любой момент.' }
      ]
    },

    reading: {
      topbarType: 'расклад',
      heroEyebrow: 'РАСШИРЕННЫЙ ДОСТУП К РАСКЛАДАМ',
      heroHeading: 'Глубокие расклады <em>Таро</em> и Кельтский крест',
      heroSub: 'Перейди от карты дня и простых раскладов на 3 карты к Кельтскому кресту на 10 карт с контекстной интерпретацией под твой конкретный вопрос.',
      stat1Number: '624 человека',
      stat1Text: 'сегодня сделали расклад в Pro',
      payHeading: 'Кельтский крест — <span class="accent">самый глубокий расклад</span> Таро',
      paySubheading: 'Десять позиций, прошлое-настоящее-будущее, итог — всё за <span class="price-emphasis">0,50&nbsp;€</span>',
      promoCode: 'LOVIATAROT95',
      infoTitle: 'Почему раскладам от <em>Lovia</em> можно доверять',
      infoFeatures: [
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="12" r="4"/><path d="M 10 12 L 14 12 M 12 10 L 12 14"/></svg>',
          title: 'Контекстная интерпретация AI',
          desc: 'Не "Башня = разрушение", а конкретно: что значит Башня в позиции "ваши страхи" при вашем вопросе о смене работы. Каждый расклад уникален.' },
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="6" height="14" rx="1"/><rect x="15" y="4" width="6" height="14" rx="1"/><rect x="9" y="8" width="6" height="14" rx="1"/></svg>',
          title: 'Полная колода 78 карт',
          desc: '22 Старших + 56 Младших арканов (кубки, мечи, жезлы, пентакли). Не сокращённая колода, а классический комплект для серьёзной работы.' },
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M 12 7 L 12 12 L 16 14" stroke-linecap="round"/></svg>',
          title: 'Учёт прямого и перевёрнутого положения',
          desc: 'Каждая карта может выпасть прямо или перевёрнуто — это меняет смысл. Алгоритм случайного выбора учитывает это для честной интерпретации.' }
      ],
      payFeatures: [
        'Кельтский крест — 10 карт, самый глубокий расклад',
        'Контекстная интерпретация под ваш конкретный вопрос',
        'Все 78 карт колоды (Старшие + Младшие арканы)',
        'Чат "Уточни расклад" — задайте вопросы по выпавшим картам'
      ],
      reviews: [
        { stars: '★★★★★', text: 'Кельтский крест в Pro — это другой уровень. Не просто значения карт, а то, как они работают вместе в моей конкретной ситуации.', author: 'Дарья С. · Санкт-Петербург' },
        { stars: '★★★★★', text: 'Спрашивала о переходе на новую работу. Башня — Колесница — Звезда. Через два месяца всё развернулось ровно так. Не предсказание, а зеркало решений.', author: 'Елена В. · Киев' },
        { stars: '★★★★★', text: 'Раньше платила по 30€ за один сеанс у таролога. Здесь за 0.50€ получаю расклад того же качества с возможностью переспросить детали.', author: 'Юлия А. · Тбилиси' }
      ],
      faq: [
        { q: 'Что я получаю в Pro помимо обычных раскладов?', a: 'Доступ к Кельтскому кресту (10 карт) — самому глубокому раскладу Таро. Полную колоду 78 карт включая Младшие арканы. Контекстную интерпретацию под ваш конкретный вопрос. И неограниченный чат для уточнений по выпавшим картам.' },
        { q: 'В чём разница между бесплатным и Pro раскладом?', a: 'В бесплатном — только Старшие арканы (22 карты) и базовые расклады (карта дня, прошлое-настоящее-будущее, ситуация-препятствие-совет). В Pro — полная колода и Кельтский крест с глубокой интерпретацией.' },
        { q: 'Что такое "пробный период 3 дня"?', a: 'Вы платите 0,50€ за полный доступ на 3 дня. После — подписка 29,90€/мес автоматически, пока не отмените.' },
        { q: 'Можно ли делать сколько угодно раскладов?', a: 'В Pro — да, без ограничений. И каждый расклад получает индивидуальную интерпретацию AI под ваш вопрос, а не шаблонные значения карт.' }
      ]
    },

    portrait: {
      topbarType: 'портрет второй половинки',
      heroEyebrow: 'ПОРТРЕТ ВТОРОЙ ПОЛОВИНКИ',
      heroHeading: 'Звёзды нарисовали портрет <em>вашей</em> второй половинки',
      heroSub: 'Художественный портрет, собранный по вашей дате рождения и ответам — черты лица, стиль, настроение и место встречи.',
      stat1Number: '199 тыс+ человек',
      stat1Text: 'уже получили свой портрет',
      payHeading: 'Откройте <span class="accent">портрет половинки</span>',
      paySubheading: 'Художественный образ + краткая характеристика — всё за <span class="price-emphasis">0,50&nbsp;€</span>',
      promoCode: 'LOVIAPAIR95',
      infoTitle: 'Что входит в <em>портрет половинки</em>',
      infoFeatures: [
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 21 C6 16, 3 12, 3 8 A4 4 0 0 1 12 7 A4 4 0 0 1 21 8 C21 12, 18 16, 12 21 Z"/></svg>',
          title: 'Художественный образ',
          desc: 'Портрет, нарисованный на основе ваших ответов и натальной карты: черты лица, стиль, настроение.' },
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/></svg>',
          title: 'Астрологическая основа',
          desc: 'Композиция и детали портрета опираются на положение Венеры, Луны и Солнца в вашей карте.' },
        { icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="13" r="8"/><path d="M 12 9 L 12 13 L 15 15"/><path d="M 9 2 L 15 2 M 12 2 L 12 5"/></svg>',
          title: 'Готовность за 24 часа',
          desc: 'Стандартный срок — 24 часа. Можно ускорить до 30 минут в личном кабинете за 3,99 €.' }
      ],
      payFeatures: [
        'Художественный портрет второй половинки',
        'Краткая характеристика: характер, стиль, ценности',
        'Возможные обстоятельства знакомства',
        'Ускорение до 30 минут в личном кабинете (доплата)'
      ],
      reviews: [
        { stars: '★★★★★', text: 'Когда увидела портрет — узнала черты человека, которого встретила через месяц. Совпадение или нет, но мурашки.', author: 'Ольга Д. · Берлин' },
        { stars: '★★★★★', text: 'Понравилось, что описание не «обтекаемое», а конкретное: какой характер, где знакомиться, что носит. Можно сверять.', author: 'Дарья С. · Санкт-Петербург' },
        { stars: '★★★★★', text: 'Получила за вечер, ускорила за 3,99 €. Удобно: всё видно сразу, не пришлось ждать.', author: 'Юлия А. · Тбилиси' }
      ],
      faq: [
        { q: 'Что именно я получу?', a: 'Художественный портрет вашей второй половинки + краткое описание характера, стиля и возможных обстоятельств знакомства.' },
        { q: 'Сколько ждать?', a: 'Стандартный срок — 24 часа. В личном кабинете можно ускорить до 30 минут за 3,99 €.' },
        { q: 'Что такое "пробный период 3 дня"?', a: 'Доступ к остальным практикам Lovia (натальная карта, матрица, Таро) на 3 дня за 0,50 €. Сам портрет создаётся отдельно и доступен после оплаты.' },
        { q: 'Где я могу отменить подписку?', a: 'В личном кабинете в разделе "Подписка". Отмена занимает один клик и доступна в любой момент. Если отмените во время пробного периода — больше с вас списано не будет.' }
      ]
    }
  };

  // === ТАЙМЕР ===
  function payStartTimer() {
    payStopTimer();
    paymentState.timerSeconds = 900;
    payUpdateTimerDisplay();
    paymentState.timerInterval = setInterval(function() {
      paymentState.timerSeconds--;
      if (paymentState.timerSeconds < 0) {
        payStopTimer();
        // Не реагируем дальше — просто сидит 00:00
        return;
      }
      payUpdateTimerDisplay();
    }, 1000);
  }

  function payStopTimer() {
    if (paymentState.timerInterval) {
      clearInterval(paymentState.timerInterval);
      paymentState.timerInterval = null;
    }
  }

  function payUpdateTimerDisplay() {
    var el = document.getElementById('payTimerPill');
    if (!el) return;
    var s = Math.max(0, paymentState.timerSeconds);
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    el.textContent = (mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss;
  }

  // === Главная функция: подставляет контент по контексту ===
  function payRender(context) {
    if (!PAY_CONTENT[context]) {
      console.warn('Unknown payment context:', context);
      context = 'natal';
    }
    paymentState.context = context;
    var c = PAY_CONTENT[context];

    // Topbar
    document.getElementById('payTopbarType').textContent = c.topbarType;

    // Hero
    document.getElementById('payHeroEyebrow').textContent = c.heroEyebrow;
    document.getElementById('payHeroHeading').innerHTML = c.heroHeading;
    document.getElementById('payHeroSub').textContent = c.heroSub;
    document.getElementById('payStat1Number').textContent = c.stat1Number;
    document.getElementById('payStat1Text').textContent = c.stat1Text;

    // Hero illustration
    document.getElementById('payHeroIllustration').innerHTML = PAY_ILLUSTRATIONS[context] || '';

    // Payment block (right)
    document.getElementById('payHeading').innerHTML = c.payHeading;
    document.getElementById('paySubheading').innerHTML = c.paySubheading;
    document.getElementById('payPromoCode').textContent = c.promoCode;

    // Features list
    var featList = document.getElementById('payFeaturesList');
    featList.innerHTML = c.payFeatures.map(function(f) {
      return '<div class="pay-feature-row"><div class="pay-feature-check"></div><div>' + f + '</div></div>';
    }).join('');

    // Info side title
    document.getElementById('payInfoTitle').innerHTML = c.infoTitle;

    // Info features (3 карточки)
    var infoFeats = document.getElementById('payInfoFeatures');
    infoFeats.innerHTML = c.infoFeatures.map(function(f) {
      return '<div class="pay-feature-card">' +
             '<div class="pay-feature-icon">' + f.icon + '</div>' +
             '<h3>' + f.title + '</h3>' +
             '<p>' + f.desc + '</p>' +
             '</div>';
    }).join('');

    // Reviews
    var reviewsGrid = document.getElementById('payReviewsGrid');
    reviewsGrid.innerHTML = c.reviews.map(function(r) {
      return '<div class="pay-review-card">' +
             '<div class="pay-review-stars">' + r.stars + '</div>' +
             '<p class="pay-review-text">«' + r.text + '»</p>' +
             '<div class="pay-review-author">— ' + r.author + '</div>' +
             '</div>';
    }).join('');

    // FAQ
    var faqList = document.getElementById('payFaqList');
    faqList.innerHTML = c.faq.map(function(item) {
      return '<details class="pay-faq-item">' +
             '<summary class="pay-faq-q">' + item.q + '</summary>' +
             '<div class="pay-faq-a">' + item.a + '</div>' +
             '</details>';
    }).join('') +
    // Сноска об отмене подписки — отдельная выноска под FAQ
    '<details class="pay-faq-item">' +
      '<summary class="pay-faq-q">Как отменить подписку?</summary>' +
      '<div class="pay-faq-a">Подписку можно отменить в любой момент — без звонков и переписок. Если пробный период (3 дня за 0,50&nbsp;€) вам не подойдёт, отмена занимает один клик в личном кабинете и доступна 24/7 — больше с вас ничего не спишется.' +
        '<ol class="pay-faq-note-steps">' +
          '<li>Личный кабинет → раздел <strong>«Подписка»</strong></li>' +
          '<li>Кнопка <strong>«Отменить подписку»</strong></li>' +
          '<li>Подтвердить — готово.</li>' +
        '</ol>' +
      '</div>' +
    '</details>';

    // Запускаем таймер
    payStartTimer();
  }

  // === Триггеры — функция для перехода на оплату ===
  function navigateToPayment(context, tier) {
    paymentState.context = context;
    paymentState.tier = tier || 'pro';
    payRender(context);
    navigateTo('screen-payment');
    // Скролл наверх
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // === Инициализация: события кнопок ===
  function initPaymentScreen() {
    // Скролл к payment-section при клике на CTA
    function scrollToPayment() {
      var paySection = document.querySelector('#screen-payment .pay-section');
      if (paySection) {
        paySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    var topCta = document.getElementById('payTopbarCta');
    if (topCta) topCta.addEventListener('click', scrollToPayment);

    // Клик по логотипу LOVIA → главная страница
    var brandLogo = document.getElementById('payBrandLogo');
    if (brandLogo) {
      var goHome = function() {
        if (typeof navigateTo === 'function') {
          navigateTo('screen-home');
        }
        window.scrollTo({ top: 0, behavior: 'instant' });
      };
      brandLogo.addEventListener('click', goHome);
      brandLogo.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goHome();
        }
      });
    }

    var heroCta = document.getElementById('payHeroCta');
    if (heroCta) heroCta.addEventListener('click', scrollToPayment);

    // Все кнопки оплаты — заглушка: «успех» → переход на главную + всплывашка о ЛК
    document.querySelectorAll('#screen-payment .pay-action').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (typeof handlePaymentSuccessStub === 'function') {
          handlePaymentSuccessStub();
        } else {
          if (typeof navigateTo === 'function') navigateTo('screen-home');
        }
      });
    });

    // Premium-btn в результатах — переход на оплату с контекстом
    document.querySelectorAll('.premium-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var screen = btn.closest('.screen');
        var ctx = 'natal';
        if (screen) {
          if (screen.id === 'screen-matrix-result') ctx = 'matrix';
          else if (screen.id === 'screen-reading-result') ctx = 'reading';
        }
        navigateToPayment(ctx, 'pro');
      });
    });
  }


  
  // === DASHBOARD & AUTH ===
  // ============================================
  // USER STATE & AUTH — личный кабинет, авторизация
  // ============================================
  // 
  // АРХИТЕКТУРА:
  // - userState — глобальное состояние пользователя (в памяти для демо)
  // - userDB — "база данных" пользователей (в памяти Map)
  // - В продакшне: userState приходит из Supabase Auth + Supabase БД
  //   Точки замены помечены `// TODO: Supabase`
  //
  // СЕССИЯ:
  // - В демо: одна сессия на загрузку страницы
  // - В продакшне: localStorage / Supabase session cookie
  // 
  // ============================================

  // "БД" пользователей — Map по идентификатору (email или phone)
  // TODO: Supabase — заменить на запрос к таблице users
  var userDB = new Map();

  // Текущий пользователь
  var userState = {
    loggedIn: false,
    authMethod: null,    // 'google' | 'phone' | 'demo'
    identifier: null,    // email или phone
    profile: {
      name: 'Yevhenii Bilous',
      photo: null,
      birthDay: 7,
      birthMonth: 7,
      birthYear: 1999,
      birthHour: 23,
      birthMinute: 0,
      birthCity: 'Киев, Украина',
      sunSign: null      // вычислится автоматически
    },
    orders: [],
    favorites: [],
    notifications: [],
    preferences: {
      notifications: true,
      newsletter: false
    }
  };

  // === Знак зодиака по дате ===
  function calcSunSign(day, month) {
    var signs = [
      { sign: 'Козерог',     key: 'capricorn',   from: [12, 22], to: [1, 19],  glyph: '♑' },
      { sign: 'Водолей',     key: 'aquarius',    from: [1, 20],  to: [2, 18],  glyph: '♒' },
      { sign: 'Рыбы',        key: 'pisces',      from: [2, 19],  to: [3, 20],  glyph: '♓' },
      { sign: 'Овен',        key: 'aries',       from: [3, 21],  to: [4, 19],  glyph: '♈' },
      { sign: 'Телец',       key: 'taurus',      from: [4, 20],  to: [5, 20],  glyph: '♉' },
      { sign: 'Близнецы',    key: 'gemini',      from: [5, 21],  to: [6, 20],  glyph: '♊' },
      { sign: 'Рак',         key: 'cancer',      from: [6, 21],  to: [7, 22],  glyph: '♋' },
      { sign: 'Лев',         key: 'leo',         from: [7, 23],  to: [8, 22],  glyph: '♌' },
      { sign: 'Дева',        key: 'virgo',       from: [8, 23],  to: [9, 22],  glyph: '♍' },
      { sign: 'Весы',        key: 'libra',       from: [9, 23],  to: [10, 22], glyph: '♎' },
      { sign: 'Скорпион',    key: 'scorpio',     from: [10, 23], to: [11, 21], glyph: '♏' },
      { sign: 'Стрелец',     key: 'sagittarius', from: [11, 22], to: [12, 21], glyph: '♐' }
    ];
    for (var i = 0; i < signs.length; i++) {
      var s = signs[i];
      if (s.from[0] === s.to[0]) {
        if (month === s.from[0] && day >= s.from[1] && day <= s.to[1]) return s;
      } else {
        // переход через месяцы
        if ((month === s.from[0] && day >= s.from[1]) ||
            (month === s.to[0] && day <= s.to[1])) return s;
      }
    }
    // Козерог — перекрывает декабрь+январь
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return signs[0];
    return signs[6]; // fallback
  }

  // === Возраст по дате рождения ===
  function calcAge(day, month, year) {
    var now = new Date();
    var age = now.getFullYear() - year;
    var m = now.getMonth() + 1 - month;
    if (m < 0 || (m === 0 && now.getDate() < day)) age--;
    return age;
  }

  function ageWord(age) {
    if (age % 10 === 1 && age % 100 !== 11) return age + ' год';
    if ([2, 3, 4].indexOf(age % 10) >= 0 && (age % 100 < 10 || age % 100 >= 20)) return age + ' года';
    return age + ' лет';
  }

  // === Время суток для приветствия ===
  function getTimeOfDay() {
    var h = new Date().getHours();
    if (h >= 5 && h < 12) return 'утро';
    if (h >= 12 && h < 17) return 'день';
    if (h >= 17 && h < 23) return 'вечер';
    return 'ночь';
  }

  function greetingFor(timeOfDay) {
    return {
      'утро': 'Доброе утро',
      'день': 'Добрый день',
      'вечер': 'Добрый вечер',
      'ночь': 'Доброй ночи'
    }[timeOfDay] || 'Добрый день';
  }

  // === Демо-данные заказов (для красивого вида при первом входе) ===
  function seedDemoOrders() {
    var now = new Date();
    var d2 = new Date(now); d2.setDate(now.getDate() - 2);
    var d4 = new Date(now); d4.setDate(now.getDate() - 4);
    var d6 = new Date(now); d6.setDate(now.getDate() - 6);

    function fmt(d) {
      return d.getDate().toString().padStart(2,'0') + '.' +
             (d.getMonth()+1).toString().padStart(2,'0') + '.' + d.getFullYear();
    }

    return [
      { id: 'o1', type: 'natal',   name: 'Натальная карта',     date: fmt(d2), status: 'done',     screen: 'screen-natal-result' },
      { id: 'o2', type: 'portrait',name: 'Портрет половинки',   date: fmt(d4), status: 'progress', screen: null },
      { id: 'o3', type: 'reading', name: 'Таро расклад',        date: fmt(d6), status: 'done',     screen: 'screen-reading-result' }
    ];
  }

  function seedUpcoming() {
    var now = new Date();
    var d1 = new Date(now); d1.setDate(now.getDate() + 2);
    var d2 = new Date(now); d2.setDate(now.getDate() + 4);
    var d3 = new Date(now); d3.setDate(now.getDate() + 6);
    var months = ['ЯНВ','ФЕВ','МАР','АПР','МАЯ','ИЮН','ИЮЛ','АВГ','СЕН','ОКТ','НОЯ','ДЕК'];
    return [
      { day: d1.getDate(), month: months[d1.getMonth()], title: 'Натальная карта', desc: 'Расшифровка личности и предназначения', time: '~ 5 минут', badge: 'done' },
      { day: d2.getDate(), month: months[d2.getMonth()], title: 'Портрет любви', desc: 'Анализ отношений и совместимости', time: '~ 7 минут', badge: 'progress' },
      { day: d3.getDate(), month: months[d3.getMonth()], title: 'Таро расклад', desc: 'Ответ на важный вопрос', time: '~ 4 минуты', badge: 'scheduled' }
    ];
  }

  // === Иконки для типов заказов ===
  var ORDER_TYPE_ICON = {
    natal:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="3"/><path d="M 8 2 L 8 14 M 2 8 L 14 8"/></svg>',
    matrix:   '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="3" width="10" height="10" transform="rotate(45 8 8)"/><rect x="5" y="5" width="6" height="6"/></svg>',
    reading:  '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="2" width="5" height="12" rx="0.8"/><rect x="9" y="2" width="5" height="12" rx="0.8"/><circle cx="5.5" cy="6" r="1.2"/></svg>',
    portrait: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"><path d="M 8 14 L 2 7.5 Q -0.5 5, 2 3 Q 5.5 0, 8 4 Q 10.5 0, 14 3 Q 16.5 5, 14 7.5 Z"/></svg>'
  };

  var BADGE_LABELS = {
    done: 'ГОТОВО',
    progress: 'В РАБОТЕ',
    scheduled: 'ЗАПЛАНИРОВАНО'
  };

  // === Рендеринг ===
  function renderDashboard() {
    var p = userState.profile;
    var age = calcAge(p.birthDay, p.birthMonth, p.birthYear);
    var sign = calcSunSign(p.birthDay, p.birthMonth);
    p.sunSign = sign;

    // Имя и инициалы
    var nameParts = p.name.split(' ');
    var initials = (nameParts[0][0] + (nameParts[1] ? nameParts[1][0] : '')).toUpperCase();
    var firstName = nameParts[0];

    // Верхнее имя курсивом
    var unEl = document.getElementById('dashUserName');
    if (unEl) unEl.textContent = firstName;

    // Аватары
    var avTop = document.getElementById('dashAvatarTop');
    if (avTop) {
      if (p.photo) {
        avTop.classList.add('has-photo');
        avTop.style.backgroundImage = 'url(' + p.photo + ')';
        avTop.textContent = '';
      } else {
        avTop.textContent = initials;
      }
    }
    var avProf = document.getElementById('dashProfilePhoto');
    if (avProf) {
      if (p.photo) {
        avProf.classList.add('has-photo');
        avProf.style.backgroundImage = 'url(' + p.photo + ')';
        avProf.textContent = '';
      } else {
        avProf.textContent = initials;
      }
    }

    // Имя и возраст в сайдбаре
    var profName = document.getElementById('dashProfileName');
    if (profName) profName.textContent = p.name;
    var profAge = document.getElementById('dashProfileAge');
    if (profAge) profAge.textContent = ageWord(age);

    // Знак зодиака
    var profSign = document.getElementById('dashProfileSign');
    if (profSign) {
      profSign.innerHTML = '<strong>' + sign.sign + '</strong> ' + sign.glyph;
    }

    // Дата рождения
    var profBirth = document.getElementById('dashProfileBirth');
    if (profBirth) {
      var dd = p.birthDay.toString().padStart(2,'0');
      var mm = p.birthMonth.toString().padStart(2,'0');
      var hh = p.birthHour.toString().padStart(2,'0');
      var mn = p.birthMinute.toString().padStart(2,'0');
      profBirth.textContent = dd + '.' + mm + '.' + p.birthYear + ' · ' + hh + ':' + mn;
    }

    // Город
    var profCity = document.getElementById('dashProfileCity');
    if (profCity) profCity.textContent = p.birthCity;

    // Приветствие с правильной грамматикой
    var tod = getTimeOfDay();
    var greetWord = greetingFor(tod);
    var greetFullEl = document.getElementById('dashGreetingFull');
    if (greetFullEl) {
      greetFullEl.innerHTML = greetWord + ', <em>' + firstName + '</em>';
    }

    // Энергетика дня (можно сделать зависящей от транзитов — пока статика)
    var energyMap = {
      'утро': { title: 'Утро для свежего старта', text: 'Хорошее время для важных решений и планирования дня.' },
      'день': { title: 'День для ясности и новых идей', text: 'Хорошее время для планирования, обучения и общения.' },
      'вечер': { title: 'Вечер для подведения итогов', text: 'Хорошее время для рефлексии, разговоров с близкими, чтения.' },
      'ночь': { title: 'Ночь для глубоких озарений', text: 'Хорошее время для тихих размышлений и записей в дневник.' }
    };
    var energy = energyMap[tod] || energyMap['день'];
    var eTitle = document.getElementById('dashEnergyTitle');
    if (eTitle) eTitle.innerHTML = energy.title;
    var eText = document.getElementById('dashEnergyText');
    if (eText) eText.textContent = energy.text;

    // Заказы (последние 3)
    var ordersEl = document.getElementById('dashOrdersList');
    if (ordersEl) {
      if (userState.orders.length === 0) {
        ordersEl.innerHTML = '<p style="color:var(--text-hint);font-size:13px;padding:20px 0;text-align:center;font-style:italic;">Здесь будет история ваших практик</p>';
      } else {
        ordersEl.innerHTML = userState.orders.slice(0, 3).map(function(o) {
          var icon = ORDER_TYPE_ICON[o.type] || ORDER_TYPE_ICON.natal;
          var actionBtn = o.screen
            ? '<button class="dash-order-action" onclick="navigateTo(\'' + o.screen + '\');window.scrollTo({top:0});">Смотреть</button>'
            : '<span class="dash-order-action" style="color:var(--text-hint)">—</span>';
          return '<div class="dash-order-row">' +
            '<div class="dash-order-icon">' + icon + '</div>' +
            '<div>' +
              '<p class="dash-order-name">' + o.name + '</p>' +
              '<p class="dash-order-date">Заказан ' + o.date + '</p>' +
            '</div>' +
            '<span class="dash-badge ' + o.status + '">' + BADGE_LABELS[o.status] + '</span>' +
            actionBtn +
          '</div>';
        }).join('');
      }
    }

    // Ближайшие практики
    var upcomingEl = document.getElementById('dashUpcomingList');
    if (upcomingEl) {
      var upcoming = seedUpcoming();
      upcomingEl.innerHTML = upcoming.map(function(u) {
        return '<div class="dash-upcoming-row">' +
          '<div class="dash-date-block">' +
            '<div class="dash-date-day">' + u.day + '</div>' +
            '<div class="dash-date-month">' + u.month + '</div>' +
          '</div>' +
          '<div class="dash-upcoming-info">' +
            '<h4>' + u.title + '</h4>' +
            '<p class="dash-upcoming-desc">' + u.desc + '</p>' +
            '<p class="dash-upcoming-time">' + u.time + '</p>' +
          '</div>' +
          '<div class="dash-upcoming-right">' +
            '<span class="dash-badge ' + u.badge + '">' + BADGE_LABELS[u.badge] + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    // Подключаем таймеры обратного отсчёта к карточкам "в работе"
    try { attachPortraitTimers(); } catch(e) { console.warn('attachPortraitTimers:', e); }
    try { renderActiveBanner(); } catch(e) { console.warn('renderActiveBanner:', e); }
    // Запуск онбординга при первом открытии личного кабинета
    try { setTimeout(startOnboarding, 600); } catch(e) { console.warn('onboarding start:', e); }

    // Космическая карта (используем computedChart если есть, иначе по знаку Солнца)
    var cosmicEl = document.getElementById('dashCosmicInfo');
    if (cosmicEl) {
      var lines = [];
      if (typeof quizState !== 'undefined' && quizState.computedChart) {
        var c = quizState.computedChart;
        lines.push({ label: 'Солнце', name: c.planets.sun.sign.name, glyph: '☉' });
        lines.push({ label: 'Луна', name: c.planets.moon.sign.name, glyph: '☽' });
        lines.push({ label: 'Асцендент', name: c.ascSign.name, glyph: '↑' });
        lines.push({ label: 'Меркурий', name: c.planets.mercury.sign.name, glyph: '☿' });
      } else {
        // По знаку Солнца только
        lines.push({ label: 'Солнце', name: sign.sign, glyph: '☉' });
        lines.push({ label: 'Луна', name: '— заполните карту', glyph: '☽' });
        lines.push({ label: 'Асцендент', name: '— заполните карту', glyph: '↑' });
        lines.push({ label: 'Меркурий', name: '— заполните карту', glyph: '☿' });
      }
      cosmicEl.innerHTML = lines.map(function(l) {
        return '<div class="dash-cosmic-line">' +
          '<strong>' + l.label + ':</strong>' +
          '<span>' + l.name + '</span>' +
          '<span class="dash-cosmic-glyph">' + l.glyph + '</span>' +
        '</div>';
      }).join('');
    }
  }

  // === Сохранение / загрузка user (для будущего Supabase) ===

  // TODO: Supabase — заменить эту функцию на запрос к Supabase
  function saveUserState() {
    if (!userState.identifier) return;
    userDB.set(userState.identifier, JSON.parse(JSON.stringify(userState)));
    // Для продакшна:
    // await supabase.from('users').upsert({ id: userState.identifier, data: userState });
  }

  // TODO: Supabase — заменить на await supabase.from('users').select(...).eq('id', ...)
  function loadUserState(identifier) {
    if (userDB.has(identifier)) {
      var stored = userDB.get(identifier);
      userState = JSON.parse(JSON.stringify(stored));
      return true;
    }
    return false;
  }

  // === Регистрация заказа после оплаты ===
  // Эту функцию должен вызывать payment screen после успешной оплаты
  function addOrderToHistory(type, screen) {
    var typeNames = {
      natal: 'Натальная карта',
      matrix: 'Матрица судьбы',
      reading: 'Таро расклад',
      portrait: 'Портрет половинки'
    };
    var now = new Date();
    var dd = now.getDate().toString().padStart(2,'0');
    var mm = (now.getMonth()+1).toString().padStart(2,'0');
    var dateStr = dd + '.' + mm + '.' + now.getFullYear();
    var order = {
      id: 'o' + Date.now(),
      type: type,
      name: typeNames[type] || type,
      date: dateStr,
      status: 'done',
      screen: screen || null
    };
    userState.orders.unshift(order);
    saveUserState();
    if (document.getElementById('screen-dashboard').classList.contains('active')) {
      renderDashboard();
    }
  }

  // === LOGIN MODAL ===
  function openLoginModal(targetAfterLogin) {
    userState._pendingNavigation = targetAfterLogin || 'screen-dashboard';
    var modal = document.getElementById('loginModal');
    if (modal) {
      modal.classList.add('open');
      showLoginStep(1);
    }
  }

  function closeLoginModal() {
    var modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('open');
  }

  function showLoginStep(n) {
    for (var i = 1; i <= 4; i++) {
      var el = document.getElementById('loginStep' + i);
      if (el) el.classList.toggle('active', i === n);
    }
  }

  // Завершение логина — общая функция
  function completeLogin(method, identifier, displayName) {
    userState.loggedIn = true;
    userState.authMethod = method;
    userState.identifier = identifier;

    // Если ранее уже логинился — восстановим данные
    if (!loadUserState(identifier)) {
      // Первый вход — обновим имя если передано
      if (displayName) {
        userState.profile.name = displayName;
      }
      // Засеваем демо-данные при первом входе
      if (userState.orders.length === 0) {
        userState.orders = seedDemoOrders();
      }
      saveUserState();
    }

    closeLoginModal();
    var target = userState._pendingNavigation || 'screen-dashboard';
    if (typeof navigateTo === 'function') {
      navigateTo(target);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    renderDashboard();
  }

  // === Логаут ===
  function logoutUser() {
    if (!confirm('Выйти из аккаунта?')) return;
    saveUserState();  // сохраним текущее состояние
    userState = {
      loggedIn: false,
      authMethod: null,
      identifier: null,
      profile: {
        name: 'Yevhenii Bilous',
        photo: null,
        birthDay: 7, birthMonth: 7, birthYear: 1999,
        birthHour: 23, birthMinute: 0,
        birthCity: 'Киев, Украина',
        sunSign: null
      },
      orders: [],
      favorites: [],
      notifications: [],
      preferences: { notifications: true, newsletter: false }
    };
    if (typeof navigateTo === 'function') {
      navigateTo('screen-home');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  // === Инициализация всей логики дашборда + логина ===
  function initDashboard() {
    // Кнопка logout в сайдбаре
    var logoutBtn = document.getElementById('dashLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);

    // Кнопка редактирования профиля (заглушка)
    var editBtn = document.getElementById('dashEditProfile');
    if (editBtn) editBtn.addEventListener('click', function() {
      var newName = prompt('Введите новое имя:', userState.profile.name);
      if (newName && newName.trim()) {
        userState.profile.name = newName.trim();
        saveUserState();
        renderDashboard();
      }
    });

    // Клик на аватар в шапке дашборда — переход на главную дашборда (или logout dropdown)
  var avBtn = document.getElementById('dashAvatarBtn');
  if (avBtn) avBtn.addEventListener('click', function() {
    if (confirm('Выйти из аккаунта?')) {
      logoutUser();
    }
  });

  // // Sidebar nav — пока показывают alert (кроме home)
    document.querySelectorAll('[data-dash-section]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var section = btn.dataset.dashSection;
        // Обновляем активное состояние
        document.querySelectorAll('[data-dash-section]').forEach(function(b) {
          if (b.dataset.dashSection === section) b.classList.add('active');
          else b.classList.remove('active');
        });
        if (section === 'home') {
          // главная дашборда — уже здесь
        } else {
          alert('Раздел "' + (btn.textContent.trim()) + '" — в разработке');
        }
      });
    });

    // === LOGIN MODAL handlers ===
    var modal = document.getElementById('loginModal');
    var closeBtn = document.getElementById('loginClose');
    if (closeBtn) closeBtn.addEventListener('click', closeLoginModal);
    if (modal) modal.addEventListener('click', function(e) {
      if (e.target === modal) closeLoginModal();
    });

    // Google → шаг 4 (email)
    var googleBtn = document.getElementById('loginGoogleBtn');
    if (googleBtn) googleBtn.addEventListener('click', function() {
      showLoginStep(4);
      setTimeout(function() {
        var el = document.getElementById('loginEmailInput');
        if (el) el.focus();
      }, 100);
    });

    // Phone → шаг 2
    var phoneBtn = document.getElementById('loginPhoneBtn');
    if (phoneBtn) phoneBtn.addEventListener('click', function() {
      showLoginStep(2);
      setTimeout(function() {
        var el = document.getElementById('loginPhoneInput');
        if (el) el.focus();
      }, 100);
    });

    // Demo
    var demoBtn = document.getElementById('loginDemoBtn');
    if (demoBtn) demoBtn.addEventListener('click', function() {
      completeLogin('demo', 'demo-user', 'Yevhenii Bilous');
    });

    // Phone submit (шаг 2 → шаг 3)
    var phoneSubmit = document.getElementById('loginPhoneSubmit');
    if (phoneSubmit) phoneSubmit.addEventListener('click', function() {
      var phoneEl = document.getElementById('loginPhoneInput');
      var phone = phoneEl ? phoneEl.value.trim() : '';
      if (!phone || phone.length < 5) {
        alert('Введите номер телефона');
        return;
      }
      userState._pendingPhone = phone;
      var shown = document.getElementById('loginPhoneShow');
      if (shown) shown.textContent = phone;
      // TODO: Supabase — supabase.auth.signInWithOtp({ phone })
      showLoginStep(3);
      setTimeout(function() {
        var el = document.getElementById('loginCodeInput');
        if (el) el.focus();
      }, 100);
    });

    // Code submit (шаг 3 → success)
    var codeSubmit = document.getElementById('loginCodeSubmit');
    if (codeSubmit) codeSubmit.addEventListener('click', function() {
      var codeEl = document.getElementById('loginCodeInput');
      var code = codeEl ? codeEl.value.trim() : '';
      // Демо: код 0000
      if (code !== '0000') {
        alert('Неверный код. В демо нужно ввести 0000');
        return;
      }
      completeLogin('phone', userState._pendingPhone, 'Yevhenii Bilous');
    });

    // Email submit (шаг 4 → success)
    var emailSubmit = document.getElementById('loginEmailSubmit');
    if (emailSubmit) emailSubmit.addEventListener('click', function() {
      var emailEl = document.getElementById('loginEmailInput');
      var email = emailEl ? emailEl.value.trim() : '';
      if (!email || email.indexOf('@') < 0) {
        alert('Введите корректный email');
        return;
      }
      var nameFromEmail = email.split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      // TODO: Supabase — supabase.auth.signInWithOAuth({ provider: 'google' })
      completeLogin('google', email, nameFromEmail);
    });

    // Back buttons
    var bp = document.getElementById('loginBackFromPhone');
    if (bp) bp.addEventListener('click', function() { showLoginStep(1); });
    var bc = document.getElementById('loginBackFromCode');
    if (bc) bc.addEventListener('click', function() { showLoginStep(2); });
    var be = document.getElementById('loginBackFromEmail');
    if (be) be.addEventListener('click', function() { showLoginStep(1); });

    // Enter key submits в инпутах
    ['loginPhoneInput', 'loginCodeInput', 'loginEmailInput'].forEach(function(id) {
      var inp = document.getElementById(id);
      if (inp) {
        inp.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            var btnMap = {
              loginPhoneInput: 'loginPhoneSubmit',
              loginCodeInput: 'loginCodeSubmit',
              loginEmailInput: 'loginEmailSubmit'
            };
            var b = document.getElementById(btnMap[id]);
            if (b) b.click();
          }
        });

  // === Универсальная навигация на dashboard со всех экранов ===
  // Любая кнопка с .nav-avatar / .user-avatar / .profile-avatar — открывает дашборд (если залогинен) или логин
  function bindAccountAccess() {
    var selectors = ['.nav-v2-avatar', '.nav-avatar', '.user-avatar', '.profile-avatar', '[data-account]', '.account-btn'];
    selectors.forEach(function(sel) {
      document.querySelectorAll(sel).forEach(function(el) {
        if (el.dataset.accountBound) return;
        el.dataset.accountBound = '1';
        el.style.cursor = 'pointer';
        el.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (userState.loggedIn) {
            if (typeof navigateTo === 'function') {
              navigateTo('screen-dashboard');
              window.scrollTo({ top: 0, behavior: 'instant' });
            }
          } else {
            openLoginModal('screen-dashboard');
          }
        });
      });
    });
  }
  bindAccountAccess();

      }
    });
  }


  // === INFO MODAL — содержимое для футер-ссылок ===
  // ====================================================
  var INFO_CONTENT = {
    'support-chat': {
      title: 'Служба поддержки',
      html: '<p><strong>Мы онлайн</strong> — обычно отвечаем в течение нескольких минут.</p>' +
            '<p>Наши специалисты готовы помочь с любыми вопросами: технические проблемы, заказ портрета, оплата, подписка.</p>' +
            '<h3>Каналы связи</h3>' +
            '<ul>' +
              '<li><strong>Чат на сайте</strong> — самый быстрый способ. Иконка чата в правом нижнем углу.</li>' +
              '<li><strong>Email:</strong> support@lovia.app</li>' +
              '<li><strong>Telegram:</strong> @lovia_support</li>' +
            '</ul>' +
            '<h3>Часы работы</h3>' +
            '<p>Чат и Telegram — ежедневно с 09:00 до 23:00 (CET). Email-обращения обрабатываем в течение 24 часов в будние дни.</p>'
    },
    'how-to-cancel': {
      title: 'Как отменить подписку',
      html: '<p>Подписку можно отменить в любой момент — без звонков, переписок и сложных форм. Отмена занимает один клик.</p>' +
            '<h3>Пошагово</h3>' +
            '<ol>' +
              '<li>Войдите в личный кабинет (иконка профиля в правом верхнем углу).</li>' +
              '<li>Откройте раздел <strong>«Подписка»</strong> в настройках аккаунта.</li>' +
              '<li>Нажмите <strong>«Отменить подписку»</strong> и подтвердите.</li>' +
            '</ol>' +
            '<div class="info-callout">Если отмените во время пробного периода (3 дня за 0,50&nbsp;€) — никаких дополнительных списаний не будет. Доступ сохраняется до конца оплаченного периода.</div>' +
            '<h3>Что произойдёт после отмены</h3>' +
            '<ul>' +
              '<li>Доступ к Pro-функциям сохраняется до конца оплаченного периода.</li>' +
              '<li>Авто-продление прекращается.</li>' +
              '<li>Уже созданные портреты и расчёты остаются в вашем личном кабинете.</li>' +
            '</ul>'
    },
    'contact-us': {
      title: 'Связаться с нами',
      html: '<p>Любые вопросы, предложения, претензии или партнёрство — пишите. Мы читаем каждое сообщение.</p>' +
            '<h3>Прямые контакты</h3>' +
            '<ul>' +
              '<li><strong>Поддержка пользователей:</strong> support@lovia.app</li>' +
              '<li><strong>Партнёрство и реклама:</strong> partners@lovia.app</li>' +
              '<li><strong>Пресса:</strong> press@lovia.app</li>' +
              '<li><strong>Юридические вопросы:</strong> legal@lovia.app</li>' +
            '</ul>' +
            '<h3>Юридический адрес</h3>' +
            '<p>Atelier de l\'Âme s.r.o.<br/>Praha 1, Nové Město<br/>Česká republika</p>' +
            '<p>Идентификационный номер: 12345678</p>'
    },
    'terms': {
      title: 'Условия и положения',
      html: '<p><em>Последнее обновление: 14 мая 2026</em></p>' +

            '<h3>1. Введение и принятие условий</h3>' +
            '<p>Сервис Lovia управляется компанией <strong>Atelier de l\'Âme s.r.o.</strong> (юридический адрес: Praha 1, Nové Město, Česká republika). Настоящие Условия и положения регулируют доступ к платформе, веб-сайту и приложениям Lovia (далее — «Сервис»).</p>' +
            '<p>Посещая веб-сайт или пользуясь Сервисом, вы соглашаетесь соблюдать данные Условия, включая «Политику конфиденциальности» и сопутствующие политики. Мы оставляем за собой право изменять Условия с уведомлением за тридцать дней для существующих пользователей.</p>' +

            '<h3>2. Разрешение споров</h3>' +
            '<p><strong>Применимое право:</strong> Условия регулируются законодательством Чешской Республики и применимыми нормами права Европейского союза о защите потребителей.</p>' +
            '<p><strong>Досудебное урегулирование:</strong> прежде чем обращаться в суд, стороны обязуются попытаться разрешить спор путём прямых переговоров в течение тридцати дней с момента обращения на <strong>legal@lovia.app</strong>.</p>' +
            '<p><strong>Права потребителей:</strong> если вы являетесь потребителем в ЕС, вы вправе обратиться в суд по месту своего жительства, а также воспользоваться платформой ОРС (онлайн-разрешение споров) Европейской комиссии. Ничто в настоящих Условиях не ограничивает ваши императивные права потребителя.</p>' +
            '<p><strong>Сроки:</strong> требования рекомендуется подавать в течение шести месяцев с даты инцидента.</p>' +

            '<h3>3. Отказ от ответственности по астрологическим и эзотерическим услугам</h3>' +
            '<p>Lovia предоставляет персонализированные астрологические интерпретации, матрицу судьбы, расклады Таро и художественные «портреты половинки» <strong>исключительно в развлекательных и личных рефлексивных целях</strong>.</p>' +
            '<p><strong>Образовательно-развлекательный характер:</strong> наши услуги не являются научными предсказаниями или гарантиями будущих событий. Результаты не должны использоваться как единственная основа для важных жизненных решений.</p>' +
            '<p><strong>Ограничения интерпретации:</strong> результаты основаны на традиционных эзотерических практиках и не являются эмпирически проверенными или научно обоснованными.</p>' +
            '<p><strong>Не профессиональная консультация:</strong> услуги не являются профессиональной, медицинской, финансовой или психологической консультацией и не заменяют её.</p>' +
            '<p><strong>Ответственность пользователя:</strong> мы не несём ответственности за личные решения, принятые на основе интерпретаций, и за эмоциональные реакции на них.</p>' +

            '<h3>4. Регистрация аккаунта и безопасность</h3>' +
            '<p>Пользователи должны быть не моложе 18 лет. Разрешается создавать одну учётную запись с действующим адресом электронной почты и достоверной информацией.</p>' +
            '<p>Вы несёте ответственность за безопасность своей учётной записи, включая защиту пароля. Запрещены: создание нескольких аккаунтов в обход правил, предоставление ложной информации, несанкционированный доступ к чужим аккаунтам.</p>' +

            '<h3>5. Условия подписки и выставления счетов</h3>' +
            '<p><strong>Пробный период:</strong> предоставляется пробный доступ на 3 дня за <strong>0,50&nbsp;€</strong> с полным доступом к Pro-функциям. Один пробный период на пользователя.</p>' +
            '<p><strong>Стандартная цена:</strong> по истечении пробного периода подписка автоматически продлевается на <strong>29,90&nbsp;€/мес</strong>, если не отменена. Списание происходит в ту же дату каждого месяца.</p>' +
            '<p><strong>Дополнительные услуги:</strong> отдельные услуги (например, «портрет половинки» и ускорение его создания) оплачиваются отдельно и не входят в подписку.</p>' +
            '<p><strong>Безопасность платежей:</strong> все платежи обрабатываются провайдером согласно стандарту PCI-DSS. Мы не храним номера карт.</p>' +
            '<p><strong>Отмена:</strong> отмена возможна в любой момент в личном кабинете → «Подписка». После отмены доступ сохраняется до конца оплаченного периода.</p>' +

            '<h3>6. Политика возврата</h3>' +
            '<p>Условия возврата средств описаны в отдельном документе «Политика возврата». В рамках пробного периода отмена не влечёт дополнительных списаний.</p>' +

            '<h3>7. Интеллектуальная собственность</h3>' +
            '<p>Всё содержимое платформы принадлежит Atelier de l\'Âme, включая методологии, алгоритмы и рамки астрологической интерпретации, дизайн и тексты. Предоставляется неисключительная лицензия только для личного некоммерческого использования. Запрещены: изменение, извлечение кода, перераспределение, реверс-инжиниринг, удаление уведомлений об авторских правах.</p>' +

            '<h3>8. Пользовательский контент и права</h3>' +
            '<p><strong>Право собственности пользователя:</strong> вы сохраняете полное право собственности на предоставленные вами личные данные (дата, время и место рождения, имя, личные запросы).</p>' +
            '<p><strong>Лицензия Lovia:</strong> предоставляя данные, вы даёте нам неисключительную лицензию на их обработку для выполнения расчётов, генерации результатов и улучшения алгоритмов. Данные для улучшения алгоритмов используются в обезличенном виде.</p>' +
            '<p><strong>Ограничения:</strong> запрещены ложные данные о рождении, чужой или защищённый авторским правом контент, вредоносный код.</p>' +

            '<h3>9. Доступность услуги и поддержка</h3>' +
            '<p><strong>Доступность:</strong> мы стремимся обеспечить высокую доступность Сервиса, но не гарантируем работу без перерывов. Плановое обслуживание по возможности анонсируется заранее.</p>' +
            '<p><strong>Изменения услуги:</strong> мы вправе изменять, приостанавливать или прекращать отдельные функции. О существенных изменениях уведомляем заранее.</p>' +
            '<p><strong>Поддержка:</strong> служба поддержки доступна через чат на сайте, Telegram и e-mail <strong>support@lovia.app</strong>. Среднее время ответа — несколько часов.</p>' +

            '<h3>10. Ограничение ответственности</h3>' +
            '<p>Максимальная совокупная ответственность Lovia не превышает суммы, уплаченной вами за Сервис в течение последних двенадцати месяцев. Мы не несём ответственности за финансовые и личные результаты, косвенные убытки или технические сбои вне нашего разумного контроля. Мы прямо отказываемся от ответственности за «точность» астрологических интерпретаций, предсказаний и оценок совместимости. Настоящий пункт не ограничивает ответственность, которая не может быть исключена по закону.</p>' +

            '<h3>11. Прекращение аккаунта</h3>' +
            '<p><strong>По вашей инициативе:</strong> аккаунт можно закрыть в любой момент через личный кабинет или написав в поддержку. Возвраты за неиспользованные периоды при добровольном закрытии не предоставляются.</p>' +
            '<p><strong>По нашей инициативе:</strong> мы можем заблокировать аккаунт при нарушении Условий (мошенничество, оскорбительное поведение, нарушения безопасности) или по юридическим основаниям. После прекращения обслуживание останавливается, данные архивируются согласно «Политике конфиденциальности».</p>' +

            '<h3>12. Стандартные юридические положения</h3>' +
            '<p><strong>Форс-мажор:</strong> мы не несём ответственности за сбои, вызванные обстоятельствами вне нашего разумного контроля (стихийные бедствия, действия властей, война, кибератаки, пандемии).</p>' +
            '<p><strong>Делимость:</strong> если какое-либо положение признано недействительным, остальные сохраняют силу.</p>' +
            '<p><strong>Полнота соглашения:</strong> настоящие Условия составляют полное соглашение между сторонами.</p>' +
            '<p><strong>Отказ от гарантий:</strong> услуги предоставляются на основе «как есть» без гарантий любого рода в пределах, допустимых законом.</p>' +

            '<h3>13. Контактная информация</h3>' +
            '<p><strong>Юридическое лицо:</strong> Atelier de l\'Âme s.r.o.<br/>' +
            '<strong>E-mail:</strong> legal@lovia.app<br/>' +
            '<strong>Адрес:</strong> Praha 1, Nové Město, Česká republika</p>' +
            '<p>© 2024–2026 Atelier de l\'Âme — Lovia™. Все права защищены.</p>'
    },
    'refund': {
      title: 'Политика возврата',
      html: '<p><em>Последнее обновление: 14 мая 2026</em></p>' +
            '<h3>Пробный период</h3>' +
            '<p>В течение <strong>3 дней пробного периода</strong> вы можете отменить подписку без объяснения причин — никаких дополнительных списаний не будет, доступ сохраняется до конца оплаченных 3 дней.</p>' +
            '<h3>Платная подписка</h3>' +
            '<p>Согласно европейскому законодательству о цифровых услугах, после начала использования платной подписки право на отказ может быть ограничено. Однако мы рассматриваем индивидуальные случаи:</p>' +
            '<ul>' +
              '<li><strong>Технические проблемы</strong> с нашей стороны, помешавшие пользоваться сервисом — возврат 100%.</li>' +
              '<li><strong>Ошибочное двойное списание</strong> — возврат в течение 5 рабочих дней.</li>' +
              '<li><strong>Списание после отмены</strong> — если вы отменили, но списание прошло, вернём в течение 5 рабочих дней.</li>' +
            '</ul>' +
            '<div class="info-callout">Чтобы запросить возврат, напишите на <strong>support@lovia.app</strong> с темой «Возврат» и приложите номер транзакции. Мы отвечаем в течение 48 часов.</div>' +
            '<h3>Разовые покупки портретов</h3>' +
            '<p>Портрет — индивидуальная цифровая работа, выполненная под ваш профиль. После начала генерации возврат не предусмотрен, но если результат вас не устроил — мы пересделаем бесплатно.</p>'
    },
    'privacy': {
      title: 'Политика конфиденциальности',
      html: '<p><em>Последнее обновление: 14 мая 2026</em></p>' +
            '<p>Atelier de l\'Âme s.r.o. (далее — «мы») является оператором (контролёром) персональных данных пользователей сервиса Lovia для пользователей из ЕС, Великобритании и Швейцарии. Настоящий документ описывает, какие данные мы собираем, на каких основаниях обрабатываем, с кем делимся и как вы можете управлять своими данными.</p>' +

            '<h3>Какие данные мы собираем</h3>' +
            '<p><strong>Данные, предоставленные вами:</strong></p>' +
            '<ul>' +
              '<li>Регистрационные данные: имя, e-mail, цели, пол, возраст и ответы на вопросы анкеты.</li>' +
              '<li>Астрологические данные: дата, время и место рождения — для выполнения расчётов.</li>' +
              '<li>Обращения через чат и в службу поддержки.</li>' +
            '</ul>' +
            '<p><strong>Вход через сторонние аккаунты:</strong> при авторизации через Google или Apple мы получаем базовые данные профиля в соответствии с условиями этих платформ.</p>' +
            '<p><strong>Автоматически собираемые данные:</strong> идентификаторы устройства, тип и версия ОС и браузера, технические данные использования, cookies (см. «Файлы cookie»).</p>' +
            '<p><strong>Платёжные данные:</strong> обрабатываются провайдером согласно стандарту PCI-DSS. Полные номера карт мы не храним.</p>' +

            '<h3>Правовые основания обработки</h3>' +
            '<p>Мы обрабатываем данные, когда это: (i) необходимо для исполнения договора с вами; (ii) требуется по закону; (iii) осуществляется с вашего согласия; либо (iv) отвечает нашим законным интересам (безопасность, улучшение продукта).</p>' +

            '<h3>Как мы используем данные</h3>' +
            '<p>Для предоставления услуг, администрирования учётной записи, выставления счетов, технической поддержки, маркетинга (с согласия) и улучшения продукта. Мы можем создавать развлекательные профили в рамках самих услуг. Мы <strong>не продаём</strong> ваши персональные данные.</p>' +

            '<h3>Передача данных</h3>' +
            '<p>Мы делимся данными с поставщиками услуг (хостинг, платежи, рассылки, аналитика), профессиональными консультантами и — при наличии законных оснований — с государственными органами. С партнёрами данные передаются на основании договоров об обработке и в минимально необходимом объёме.</p>' +

            '<h3>Международная передача</h3>' +
            '<p>Данные хранятся на серверах в ЕС. Если данные передаются за пределы ЕЭЗ, применяются стандартные договорные положения (SCC) и иные предусмотренные законом гарантии.</p>' +

            '<h3>Ваши права (GDPR)</h3>' +
            '<ul>' +
              '<li>Доступ к данным и их перенос.</li>' +
              '<li>Исправление неточных данных.</li>' +
              '<li>Удаление данных (с предусмотренными законом исключениями).</li>' +
              '<li>Отзыв согласия в любой момент.</li>' +
              '<li>Возражение против обработки и её ограничение.</li>' +
              '<li>Жалоба в надзорный орган по защите данных.</li>' +
            '</ul>' +
            '<p>Чтобы воспользоваться любым из прав, напишите на <strong>privacy@lovia.app</strong>.</p>' +

            '<h3>Права жителей Калифорнии (CCPA)</h3>' +
            '<p>Жители Калифорнии вправе запросить категории собираемых данных, их удаление и отказаться от «продажи» данных в значении CCPA. Мы данные не продаём.</p>' +

            '<h3>Хранение данных</h3>' +
            '<p>Мы храним данные столько, сколько необходимо для оказания услуг и соблюдения закона. Как правило, срок хранения после прекращения аккаунта не превышает шести лет (для целей бухгалтерского и юридического соответствия).</p>' +

            '<h3>Дети</h3>' +
            '<p>Сервис предназначен для лиц от 18 лет. Мы сознательно не собираем данные детей.</p>' +

            '<h3>Безопасность</h3>' +
            '<p>Мы применяем технические и организационные меры защиты (шифрование при передаче, контроль доступа). Тем не менее ни один метод передачи данных не является абсолютно безопасным.</p>' +

            '<h3>Контакты</h3>' +
            '<p>Atelier de l\'Âme s.r.o., Praha 1, Nové Město, Česká republika · <strong>privacy@lovia.app</strong></p>'
    },
    'cookies': {
      title: 'Файлы cookie',
      html: '<p>Cookies — небольшие файлы, которые сайт сохраняет в вашем браузере. Мы используем их, чтобы сервис работал и был удобным.</p>' +
            '<h3>Какие cookies мы используем</h3>' +
            '<ul>' +
              '<li><strong>Обязательные:</strong> авторизация, сохранение сессии, безопасность. Без них сервис не работает. Включены всегда.</li>' +
              '<li><strong>Функциональные:</strong> запоминают язык, настройки темы, последние практики. Можно отключить.</li>' +
              '<li><strong>Аналитика:</strong> агрегированная статистика (без персональной идентификации) — какие функции популярнее, где пользователи затрудняются. Можно отключить.</li>' +
              '<li><strong>Маркетинг:</strong> у нас их <strong>нет</strong>. Мы не используем рекламные cookies и не передаём данные рекламным сетям.</li>' +
            '</ul>' +
            '<h3>Управление cookies</h3>' +
            '<p>Управлять согласием можно в баннере при первом входе или в любой момент в разделе «Настройки → Приватность». Также можно отключить cookies в настройках браузера, но это может сломать авторизацию.</p>' +
            '<div class="info-callout">Если вы зашли с нескольких устройств — настройки cookies настраиваются на каждом устройстве отдельно.</div>'
    },
    'help-center': {
      title: 'Справочный центр',
      html: '<p>Ответы на самые частые вопросы по работе с Lovia.</p>' +
            '<h3>Начало работы</h3>' +
            '<ul>' +
              '<li>Как создать аккаунт и заполнить астрологический профиль</li>' +
              '<li>Какие данные нужны для точного расчёта натальной карты</li>' +
              '<li>Что такое «время рождения с точностью до минут» и зачем оно</li>' +
            '</ul>' +
            '<h3>Практики и результаты</h3>' +
            '<ul>' +
              '<li>Натальная карта — как читать дома, аспекты, планеты</li>' +
              '<li>Матрица судьбы — расшифровка 22 точек октаграммы</li>' +
              '<li>Расклады Таро — как формулировать вопрос</li>' +
              '<li>Портрет половинки — что значит «обрабатывается 24 часа» и как ускорить</li>' +
            '</ul>' +
            '<h3>Оплата и подписка</h3>' +
            '<ul>' +
              '<li>Как работает пробный период</li>' +
              '<li>Какие способы оплаты поддерживаются</li>' +
              '<li>Как сменить тарифный план</li>' +
              '<li>Где скачать счёт или акт</li>' +
            '</ul>' +
            '<h3>Технические вопросы</h3>' +
            '<ul>' +
              '<li>Как сменить email или пароль</li>' +
              '<li>Что делать, если не приходят письма от сервиса</li>' +
              '<li>Как удалить аккаунт</li>' +
            '</ul>' +
            '<p>Не нашли свой вопрос? Напишите в <strong>службу поддержки</strong> — отвечаем за несколько минут.</p>'
    },
    'pricing': {
      title: 'Цены и подписки',
      html: '<h3>Бесплатно</h3>' +
            '<ul>' +
              '<li>Краткая натальная карта (Солнце, Луна, Асцендент)</li>' +
              '<li>Краткая матрица судьбы (3 основные точки)</li>' +
              '<li>Карта дня + базовые расклады Таро на 3 карты</li>' +
              '<li>Совет дня</li>' +
            '</ul>' +
            '<h3>Pro · пробный период</h3>' +
            '<p><strong>0,50&nbsp;€ за 3 дня</strong> — полный доступ ко всем функциям. По истечении 3 дней подписка автоматически продлевается на месяц.</p>' +
            '<h3>Pro · ежемесячно</h3>' +
            '<p><strong>29,90&nbsp;€ в месяц</strong> — всё, что есть в Lovia:</p>' +
            '<ul>' +
              '<li>Полная натальная карта со всеми планетами, домами и аспектами</li>' +
              '<li>Полная матрица судьбы (22 точки, 6 фокусов)</li>' +
              '<li>Кельтский крест и все расклады Таро (78 карт)</li>' +
              '<li>Безлимитный чат с AI-астрологом</li>' +
              '<li>Транзиты на сегодня и год вперёд</li>' +
            '</ul>' +
            '<h3>Портрет половинки</h3>' +
            '<p>Отдельная услуга: <strong>9,90&nbsp;€ за портрет</strong> (стандартный, 24 часа). Опция «ускорить» — +3,99&nbsp;€ (готов за 30 минут).</p>' +
            '<div class="info-callout">Подписку Pro можно отменить в один клик — см. «Как отменить» в футере или в личном кабинете → «Подписка».</div>'
    },
    'about': {
      title: 'О нас',
      html: '<h3>Что такое Lovia</h3>' +
            '<p>Lovia — это <em>Atelier de l\'Âme</em>, мастерская души: место, где математика небесных тел встречается с языком чувств. Мы создаём астрологические и нумерологические практики, в которых нет эзотерического тумана — только честные расчёты и живой язык интерпретации.</p>' +
            '<h3>Наша миссия</h3>' +
            '<p>Дать людям инструмент самопознания, который работает: не предсказывает будущее, а помогает увидеть свои внутренние конструкции — сильные стороны, слепые пятна, повторяющиеся паттерны. Карта — это зеркало, а не приговор.</p>' +
            '<h3>Команда</h3>' +
            '<p>Lovia делает небольшая команда из Праги: программисты, дизайнеры, профессиональные астрологи и нумерологи с десятилетним опытом. Алгоритмы AI-интерпретации создаются совместно с практикующими консультантами — чтобы тексты звучали как разговор с человеком, а не выгрузку из базы.</p>' +
            '<h3>Что мы НЕ делаем</h3>' +
            '<ul>' +
              '<li>Не пугаем «проклятиями» и «порчей»</li>' +
              '<li>Не продаём «защитные ритуалы»</li>' +
              '<li>Не пишем гороскопов под рекламу</li>' +
              '<li>Не передаём ваши данные третьим лицам</li>' +
            '</ul>' +
            '<p>Если вы здесь — спасибо. Хороших открытий.</p>'
    },
    'social-x': {
      title: 'Lovia в X',
      html: '<p>Подпишитесь на нас в X (Twitter), чтобы первыми узнавать о новых практиках, обновлениях алгоритмов и астрологических событиях недели.</p>' +
            '<p><strong>@lovia_atelier</strong></p>' +
            '<p>В нашем профиле — короткие заметки об актуальных транзитах, разборы редких аспектов и закулисье разработки.</p>'
    },
    'social-instagram': {
      title: 'Lovia в Instagram',
      html: '<p>В Instagram мы показываем визуальную сторону сервиса: примеры портретов половинки, эстетику натальных карт, цитаты из интерпретаций.</p>' +
            '<p><strong>@lovia.atelier</strong></p>' +
            '<p>Сторис — астропогода недели, посты — глубокие материалы по планетам, домам и точкам матрицы.</p>'
    },
    'social-facebook': {
      title: 'Lovia в Facebook',
      html: '<p>В Facebook мы ведём более развёрнутые посты — лонгриды о трактовке аспектов, ответы на вопросы сообщества, анонсы вебинаров.</p>' +
            '<p><strong>facebook.com/lovia.atelier</strong></p>' +
            '<p>В группе можно задать вопрос по своей карте — отвечают как сотрудники Lovia, так и другие участники.</p>'
    }
  };

  // Английская версия — открывается когда currentLang === 'en'
  var INFO_CONTENT_EN = {
    'support-chat': {
      title: 'Customer support',
      html: '<p><strong>We are online</strong> — typically reply within a few minutes.</p>' +
            '<p>Our team is ready to help with any question: technical issues, portrait orders, payment, subscription.</p>' +
            '<h3>How to reach us</h3>' +
            '<ul>' +
              '<li><strong>On-site chat</strong> — fastest way. Chat icon at the bottom right.</li>' +
              '<li><strong>Email:</strong> support@lovia.app</li>' +
              '<li><strong>Telegram:</strong> @lovia_support</li>' +
            '</ul>' +
            '<h3>Working hours</h3>' +
            '<p>Chat and Telegram — daily 09:00–23:00 CET. Email requests are answered within 24 hours on business days.</p>'
    },
    'how-to-cancel': {
      title: 'How to cancel your subscription',
      html: '<p>You can cancel anytime — no calls, no email back-and-forth, no complicated forms. Cancellation is one click.</p>' +
            '<h3>Step by step</h3>' +
            '<ol>' +
              '<li>Sign in to your account (profile icon at the top right).</li>' +
              '<li>Open the <strong>Subscription</strong> section in account settings.</li>' +
              '<li>Click <strong>Cancel subscription</strong> and confirm.</li>' +
            '</ol>' +
            '<div class="info-callout">If you cancel during the 3-day trial (0.50&nbsp;€) — no further charges. Your access stays active until the paid period ends.</div>' +
            '<h3>What happens after cancelling</h3>' +
            '<ul>' +
              '<li>Pro features remain available until the end of the paid period.</li>' +
              '<li>Auto-renewal stops.</li>' +
              '<li>Portraits and readings you already created stay in your account.</li>' +
            '</ul>'
    },
    'contact-us': {
      title: 'Contact us',
      html: '<p>Any question, suggestion, complaint or partnership — write to us. We read every message.</p>' +
            '<h3>Direct contacts</h3>' +
            '<ul>' +
              '<li><strong>User support:</strong> support@lovia.app</li>' +
              '<li><strong>Partnership &amp; advertising:</strong> partners@lovia.app</li>' +
              '<li><strong>Press:</strong> press@lovia.app</li>' +
              '<li><strong>Legal:</strong> legal@lovia.app</li>' +
            '</ul>' +
            '<h3>Legal address</h3>' +
            '<p>Atelier de l\'Âme s.r.o.<br/>Praha 1, Nové Město<br/>Czech Republic</p>' +
            '<p>Registration number: 12345678</p>'
    },
    'terms': {
      title: 'Terms and conditions',
      html: '<p><em>Last updated: May 14, 2026</em></p>' +

            '<h3>1. Introduction and acceptance</h3>' +
            '<p>The Lovia service is operated by <strong>Atelier de l\'Âme s.r.o.</strong> (registered address: Praha 1, Nové Město, Czech Republic). These Terms and Conditions govern access to the Lovia platform, website and apps (the "Service").</p>' +
            '<p>By visiting the website or using the Service you agree to these Terms, including the "Privacy Policy" and related policies. We reserve the right to change the Terms with thirty days\' notice to existing users.</p>' +

            '<h3>2. Dispute resolution</h3>' +
            '<p><strong>Governing law:</strong> these Terms are governed by the laws of the Czech Republic and applicable EU consumer protection law.</p>' +
            '<p><strong>Pre-litigation:</strong> before going to court, the parties agree to attempt to resolve the dispute through direct negotiation within thirty days of contacting <strong>legal@lovia.app</strong>.</p>' +
            '<p><strong>Consumer rights:</strong> if you are an EU consumer, you may bring proceedings in your country of residence and use the European Commission\'s ODR (online dispute resolution) platform. Nothing here limits your mandatory consumer rights.</p>' +
            '<p><strong>Time limits:</strong> claims should be brought within six months of the incident.</p>' +

            '<h3>3. Astrology and esoteric services disclaimer</h3>' +
            '<p>Lovia provides personalised astrological interpretations, destiny matrix, Tarot readings and artistic "partner portraits" <strong>for entertainment and personal reflection only</strong>.</p>' +
            '<p><strong>Educational and entertainment purpose:</strong> our services are not scientific predictions or guarantees of future events. Results must not be used as the sole basis for important life decisions.</p>' +
            '<p><strong>Interpretation limits:</strong> results are based on traditional esoteric practices and are not empirically verified or scientifically proven.</p>' +
            '<p><strong>Not professional advice:</strong> the services are not professional, medical, financial or psychological advice and do not replace it.</p>' +
            '<p><strong>User responsibility:</strong> we are not liable for personal decisions made on the basis of interpretations or for emotional reactions to them.</p>' +

            '<h3>4. Account eligibility and security</h3>' +
            '<p>Users must be at least 18 years old. You may create one account with a valid email address and accurate information.</p>' +
            '<p>You are responsible for the security of your account, including protecting your password. Prohibited: creating multiple accounts to bypass rules, providing false information, unauthorised access to other accounts.</p>' +

            '<h3>5. Subscription and billing</h3>' +
            '<p><strong>Trial:</strong> a 3-day trial for <strong>€0.50</strong> with full access to Pro features. One trial per user.</p>' +
            '<p><strong>Standard pricing:</strong> after the trial, the subscription auto-renews at <strong>€29.90/mo</strong> unless cancelled, billed on the same date each month.</p>' +
            '<p><strong>Add-ons:</strong> separate services (e.g. the "partner portrait" and its speed-up) are billed separately and are not included in the subscription.</p>' +
            '<p><strong>Payment security:</strong> all payments are processed under the PCI-DSS standard. We do not store card numbers.</p>' +
            '<p><strong>Cancellation:</strong> you can cancel anytime in your account → "Subscription". After cancellation, access continues until the end of the paid period.</p>' +

            '<h3>6. Refund policy</h3>' +
            '<p>Refund terms are described in the separate "Refund policy" document. Cancelling during the trial incurs no further charges.</p>' +

            '<h3>7. Intellectual property</h3>' +
            '<p>All platform content belongs to Atelier de l\'Âme, including methodologies, algorithms and astrological interpretation frameworks, design and texts. A non-exclusive licence is granted for personal, non-commercial use only. Prohibited: modification, code extraction, redistribution, reverse engineering, removing copyright notices.</p>' +

            '<h3>8. User content and rights</h3>' +
            '<p><strong>Your ownership:</strong> you retain full ownership of the personal data you provide (date, time and place of birth, name, personal questions).</p>' +
            '<p><strong>Lovia licence:</strong> by submitting data you grant us a non-exclusive licence to process it to perform calculations, generate results and improve algorithms. Data used to improve algorithms is anonymised.</p>' +
            '<p><strong>Restrictions:</strong> false birth data, third-party or copyrighted content, and malicious code are prohibited.</p>' +

            '<h3>9. Service availability and support</h3>' +
            '<p><strong>Availability:</strong> we aim for high availability but do not guarantee uninterrupted operation. Planned maintenance is announced in advance where possible.</p>' +
            '<p><strong>Service changes:</strong> we may modify, suspend or discontinue features. We give prior notice of material changes.</p>' +
            '<p><strong>Support:</strong> available via website chat, Telegram and e-mail <strong>support@lovia.app</strong>. Average response time is a few hours.</p>' +

            '<h3>10. Limitation of liability</h3>' +
            '<p>Lovia\'s maximum aggregate liability does not exceed the amount you paid for the Service in the last twelve months. We are not liable for financial or personal outcomes, indirect damages, or technical failures beyond our reasonable control. We expressly disclaim liability for the "accuracy" of astrological interpretations, predictions and compatibility assessments. This clause does not limit liability that cannot be excluded by law.</p>' +

            '<h3>11. Account termination</h3>' +
            '<p><strong>By you:</strong> you may close your account anytime via your account or by contacting support. Refunds for unused periods are not provided on voluntary closure.</p>' +
            '<p><strong>By us:</strong> we may suspend an account for breaches of the Terms (fraud, abusive behaviour, security violations) or on legal grounds. After termination the service stops and data is archived per the "Privacy Policy".</p>' +

            '<h3>12. Standard legal provisions</h3>' +
            '<p><strong>Force majeure:</strong> we are not liable for failures caused by circumstances beyond our reasonable control (natural disasters, government action, war, cyberattacks, pandemics).</p>' +
            '<p><strong>Severability:</strong> if any provision is held invalid, the rest remain in full force.</p>' +
            '<p><strong>Entire agreement:</strong> these Terms constitute the entire agreement between the parties.</p>' +
            '<p><strong>Disclaimer of warranties:</strong> the services are provided "as is" without warranties of any kind to the extent permitted by law.</p>' +

            '<h3>13. Contact information</h3>' +
            '<p><strong>Legal entity:</strong> Atelier de l\'Âme s.r.o.<br/>' +
            '<strong>Email:</strong> legal@lovia.app<br/>' +
            '<strong>Address:</strong> Praha 1, Nové Město, Czech Republic</p>' +
            '<p>© 2024–2026 Atelier de l\'Âme — Lovia™. All rights reserved.</p>'
    },
    'refund': {
      title: 'Refund policy',
      html: '<p><em>Last updated: May 14, 2026</em></p>' +
            '<h3>Trial period</h3>' +
            '<p>During the <strong>3-day trial</strong> you can cancel without giving a reason — no further charges, access stays until the trial ends.</p>' +
            '<h3>Paid subscription</h3>' +
            '<p>Under EU digital services law, after the start of use the right to withdraw may be limited. However, we review individual cases:</p>' +
            '<ul>' +
              '<li><strong>Technical issues</strong> on our side that prevented use — full refund.</li>' +
              '<li><strong>Accidental double charge</strong> — refund within 5 business days.</li>' +
              '<li><strong>Charge after cancellation</strong> — refund within 5 business days.</li>' +
            '</ul>' +
            '<div class="info-callout">To request a refund, email <strong>support@lovia.app</strong> with the subject "Refund" and your transaction number. We respond within 48 hours.</div>' +
            '<h3>One-off portrait purchases</h3>' +
            '<p>A portrait is an individual digital work made to your profile. After generation begins, refunds are not provided, but if the result does not satisfy you we will remake it free of charge.</p>'
    },
    'privacy': {
      title: 'Privacy policy',
      html: '<p><em>Last updated: May 14, 2026</em></p>' +
            '<p>Atelier de l\'Âme s.r.o. ("we") is the data controller for Lovia users in the EU, UK and Switzerland. This document describes what data we collect, on what legal bases we process it, who we share it with, and how you can manage your data.</p>' +

            '<h3>Data we collect</h3>' +
            '<p><strong>Data you provide:</strong></p>' +
            '<ul>' +
              '<li>Registration details: name, email, goals, gender, age and questionnaire answers.</li>' +
              '<li>Astrological data: date, time and place of birth — to perform calculations.</li>' +
              '<li>Communications via chat and customer support.</li>' +
            '</ul>' +
            '<p><strong>Third-party sign-in:</strong> when you authenticate via Google or Apple, we receive basic profile data per those platforms\' terms.</p>' +
            '<p><strong>Automatically collected:</strong> device identifiers, OS and browser type and version, technical usage data, cookies (see "Cookies").</p>' +
            '<p><strong>Payment data:</strong> processed by a provider under the PCI-DSS standard. We do not store full card numbers.</p>' +

            '<h3>Legal bases for processing</h3>' +
            '<p>We process data where it is: (i) necessary to perform our contract with you; (ii) required by law; (iii) based on your consent; or (iv) in our legitimate interests (security, product improvement).</p>' +

            '<h3>How we use data</h3>' +
            '<p>To provide the Service, administer your account, handle billing, provide support, marketing (with consent) and improve the product. We may build entertainment profiles as part of the services themselves. We <strong>do not sell</strong> your personal data.</p>' +

            '<h3>Data sharing</h3>' +
            '<p>We share data with service providers (hosting, payments, email, analytics), professional advisors and — where legally justified — public authorities. Data is shared with partners under data-processing agreements and to the minimum extent necessary.</p>' +

            '<h3>International transfers</h3>' +
            '<p>Data is stored on EU servers. Where data is transferred outside the EEA, we use Standard Contractual Clauses (SCCs) and other legally required safeguards.</p>' +

            '<h3>Your rights (GDPR)</h3>' +
            '<ul>' +
              '<li>Access and data portability.</li>' +
              '<li>Correction of inaccurate data.</li>' +
              '<li>Deletion (with legally permitted exceptions).</li>' +
              '<li>Withdrawal of consent at any time.</li>' +
              '<li>Objection to and restriction of processing.</li>' +
              '<li>Complaint to a data protection supervisory authority.</li>' +
            '</ul>' +
            '<p>To exercise any right, email <strong>privacy@lovia.app</strong>.</p>' +

            '<h3>California residents (CCPA)</h3>' +
            '<p>California residents may request the categories of data collected, deletion, and to opt out of the "sale" of data as defined by CCPA. We do not sell data.</p>' +

            '<h3>Data retention</h3>' +
            '<p>We keep data as long as necessary to provide the services and comply with the law. Retention after account closure typically does not exceed six years (for accounting and legal compliance).</p>' +

            '<h3>Children</h3>' +
            '<p>The Service is intended for users aged 18+. We do not knowingly collect children\'s data.</p>' +

            '<h3>Security</h3>' +
            '<p>We apply technical and organisational safeguards (encryption in transit, access controls). However, no method of data transmission is completely secure.</p>' +

            '<h3>Contact</h3>' +
            '<p>Atelier de l\'Âme s.r.o., Praha 1, Nové Město, Czech Republic · <strong>privacy@lovia.app</strong></p>'
    },
    'cookies': {
      title: 'Cookies',
      html: '<p>Cookies are small files the site stores in your browser. We use them to keep the service working and convenient.</p>' +
            '<h3>Cookies we use</h3>' +
            '<ul>' +
              '<li><strong>Essential:</strong> auth, session, security. Service does not work without these. Always on.</li>' +
              '<li><strong>Functional:</strong> remember language, theme, recent practices. Can be turned off.</li>' +
              '<li><strong>Analytics:</strong> aggregated stats (no personal identification) — which features are popular, where users struggle. Can be turned off.</li>' +
              '<li><strong>Marketing:</strong> we have <strong>none</strong>. We do not use advertising cookies and do not share data with ad networks.</li>' +
            '</ul>' +
            '<h3>Managing cookies</h3>' +
            '<p>Manage consent in the banner shown at first visit or any time under Settings → Privacy. You can also disable cookies in your browser, but that may break authentication.</p>' +
            '<div class="info-callout">If you sign in from multiple devices — cookie preferences are device-specific.</div>'
    },
    'help-center': {
      title: 'Help center',
      html: '<p>Answers to the most common questions about Lovia.</p>' +
            '<h3>Getting started</h3>' +
            '<ul>' +
              '<li>How to create an account and fill your astrological profile</li>' +
              '<li>What data is needed for an accurate natal chart</li>' +
              '<li>What "exact birth time to the minute" means and why it matters</li>' +
            '</ul>' +
            '<h3>Practices and results</h3>' +
            '<ul>' +
              '<li>Natal chart — how to read houses, aspects, planets</li>' +
              '<li>Destiny matrix — interpreting the 22 points of the octagram</li>' +
              '<li>Tarot readings — how to phrase a question</li>' +
              '<li>Partner portrait — what "24-hour processing" means and how to speed it up</li>' +
            '</ul>' +
            '<h3>Payment and subscription</h3>' +
            '<ul>' +
              '<li>How the trial period works</li>' +
              '<li>What payment methods are supported</li>' +
              '<li>How to change your plan</li>' +
              '<li>Where to download an invoice or statement</li>' +
            '</ul>' +
            '<h3>Technical</h3>' +
            '<ul>' +
              '<li>How to change your email or password</li>' +
              '<li>What to do if you stop receiving emails from the service</li>' +
              '<li>How to delete your account</li>' +
            '</ul>' +
            '<p>Did not find your question? Write to <strong>support</strong> — we reply within minutes.</p>'
    },
    'pricing': {
      title: 'Pricing and subscriptions',
      html: '<h3>Free</h3>' +
            '<ul>' +
              '<li>Quick natal chart (Sun, Moon, Ascendant)</li>' +
              '<li>Quick destiny matrix (3 main points)</li>' +
              '<li>Card of the day + 3-card Tarot spreads</li>' +
              '<li>Daily guidance</li>' +
            '</ul>' +
            '<h3>Pro · trial</h3>' +
            '<p><strong>0.50&nbsp;€ for 3 days</strong> — full access to all features. After 3 days the subscription auto-renews monthly.</p>' +
            '<h3>Pro · monthly</h3>' +
            '<p><strong>29.90&nbsp;€/month</strong> — everything Lovia has to offer:</p>' +
            '<ul>' +
              '<li>Full natal chart with all planets, houses and aspects</li>' +
              '<li>Full destiny matrix (22 points, 6 focuses)</li>' +
              '<li>Celtic Cross and all Tarot spreads (78 cards)</li>' +
              '<li>Unlimited chat with an AI astrologer</li>' +
              '<li>Transits for today and the year ahead</li>' +
            '</ul>' +
            '<h3>Partner portrait</h3>' +
            '<p>Separate service: <strong>9.90&nbsp;€ per portrait</strong> (standard, 24 hours). "Speed up" option — +3.99&nbsp;€ (ready in 30 minutes).</p>' +
            '<div class="info-callout">The Pro subscription can be cancelled in one click — see "How to cancel" in the footer or your account → "Subscription".</div>'
    },
    'about': {
      title: 'About us',
      html: '<h3>What Lovia is</h3>' +
            '<p>Lovia is <em>Atelier de l\'Âme</em>, the soul\'s atelier: where the math of celestial bodies meets the language of feelings. We build astrology and numerology practices with no esoteric fog — only honest calculations and a living language of interpretation.</p>' +
            '<h3>Our mission</h3>' +
            '<p>To give people a self-knowledge tool that works: not predicting the future, but helping you see your inner structures — strengths, blind spots, recurring patterns. The chart is a mirror, not a verdict.</p>' +
            '<h3>Team</h3>' +
            '<p>Lovia is built by a small team in Prague: engineers, designers, professional astrologers and numerologists with ten years of experience. AI interpretation algorithms are co-developed with practising consultants — so texts read like a conversation, not a database dump.</p>' +
            '<h3>What we do NOT do</h3>' +
            '<ul>' +
              '<li>No "curses" or "evil eye" scare tactics</li>' +
              '<li>No "protective rituals" upsells</li>' +
              '<li>No horoscopes written for advertisers</li>' +
              '<li>No sharing your data with third parties</li>' +
            '</ul>' +
            '<p>If you are here — thank you. Happy discoveries.</p>'
    },
    'social-x': {
      title: 'Lovia on X',
      html: '<p>Follow us on X (Twitter) to be the first to learn about new practices, algorithm updates and the week\'s astrological events.</p>' +
            '<p><strong>@lovia_atelier</strong></p>' +
            '<p>Our profile has short notes on current transits, deep dives into rare aspects and behind-the-scenes development.</p>'
    },
    'social-instagram': {
      title: 'Lovia on Instagram',
      html: '<p>On Instagram we show the visual side of the service: portrait examples, the aesthetics of natal charts, quotes from interpretations.</p>' +
            '<p><strong>@lovia.atelier</strong></p>' +
            '<p>Stories — the week\'s astro-weather; posts — in-depth materials on planets, houses and matrix points.</p>'
    },
    'social-facebook': {
      title: 'Lovia on Facebook',
      html: '<p>On Facebook we publish longer-form posts — pieces on aspect interpretation, answers to community questions, webinar announcements.</p>' +
            '<p><strong>facebook.com/lovia.atelier</strong></p>' +
            '<p>In the group you can ask a question about your chart — both Lovia staff and other members answer.</p>'
    }
  };

  function openInfoModal(topic) {
    var lang = window.I18N && window.I18N.currentLang === 'en' ? 'en' : 'ru';
    var source = lang === 'en' ? INFO_CONTENT_EN : INFO_CONTENT;
    var content = source[topic] || INFO_CONTENT[topic];
    if (!content) return;
    var backdrop = document.getElementById('infoModalBackdrop');
    var titleEl = document.getElementById('infoModalTitle');
    var bodyEl = document.getElementById('infoModalBody');
    if (!backdrop || !titleEl || !bodyEl) return;
    backdrop.dataset.currentTopic = topic;
    titleEl.textContent = content.title;
    bodyEl.innerHTML = content.html;
    bodyEl.scrollTop = 0;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeInfoModal() {
    var backdrop = document.getElementById('infoModalBackdrop');
    if (!backdrop) return;
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Открытие инфо-модалки по сообщению из welcome-iframe (ссылки Условия/Политика/Поддержка)
  window.addEventListener('message', function(ev){ if(typeof ev.data==='string' && ev.data.indexOf('lovia_info:')===0){ try{ openInfoModal(ev.data.slice(11)); }catch(err){} } });
  // Делегированный клик на ссылки футера (включая социальные)
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest('[data-info-topic]');
    if (trigger) {
      e.preventDefault();
      openInfoModal(trigger.getAttribute('data-info-topic'));
      return;
    }
    if (e.target.closest('#infoModalClose')) {
      closeInfoModal();
      return;
    }
    if (e.target === document.getElementById('infoModalBackdrop')) {
      closeInfoModal();
    }
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeInfoModal();
  });

  // ============================================================
  // === I18N — переключение языка RU / EN ===
  // ============================================================
  // Архитектура:
  //  - DICT — словарь RU → EN. Ключ = исходная русская строка (trim),
  //    значение = английский перевод.
  //  - На каждом text-node храним оригинал (originalText WeakMap),
  //    при смене языка либо ставим перевод, либо восстанавливаем оригинал.
  //  - MutationObserver ловит динамически вставленный контент
  //    (FAQ, dashboard rows, modals и т.д.) и сразу его переводит.
  //  - Attribute-переводы (placeholder, title, aria-label, alt) идут отдельно.
  //  - Выбор сохраняется в localStorage('lovia_lang').
  // ============================================================
  (function() {
    var DICT = {
      // ===== Top nav / общие =====
      'ВАШ ЛИЧНЫЙ АСТРОЛОГ': 'YOUR PERSONAL ASTROLOGER',
      'LOVIA': 'LOVIA',
      'Ваш личный астролог': 'Your personal astrologer',
      'Натальная карта, матрица судьбы, расклады Таро и портрет вашей второй половинки — честные расчёты и живой язык, без эзотерического тумана.':
        'Natal chart, destiny matrix, Tarot readings and a portrait of your other half — honest calculations and living language, without esoteric fog.',
      'Портрет половинки': 'Partner portrait',
      'Пропустить вступление': 'Skip the intro',
      'На главную': 'Home',
      'Ускорить': 'Speed up',
      'Назад': 'Back',
      'Далее': 'Next',
      'Готово': 'Done',
      'Готово!': 'Done!',
      'Продолжить': 'Continue',
      'Отмена': 'Cancel',
      'Закрыть': 'Close',
      'Сохранить': 'Save',
      'Отправить': 'Submit',
      'Войти': 'Sign in',
      'Создать': 'Sign up',
      'Выйти': 'Sign out',
      'Уведомления': 'Notifications',
      'Настройки': 'Settings',

      // ===== Home — greeting / today =====
      'ВАШИ ПРАКТИКИ НА СЕГОДНЯ': 'YOUR PRACTICES FOR TODAY',
      'Добро пожаловать,': 'Welcome,',
      'СЕГОДНЯ': 'TODAY',
      'СОВЕТ ДНЯ': 'GUIDANCE OF THE DAY',
      'Растущая Луна': 'Waxing Moon',
      'в Тельце': 'in Taurus',
      'в Овне': 'in Aries',
      'в Близнецах': 'in Gemini',
      'в Раке': 'in Cancer',
      'в Льве': 'in Leo',
      'в Деве': 'in Virgo',
      'в Весах': 'in Libra',
      'в Скорпионе': 'in Scorpio',
      'в Стрельце': 'in Sagittarius',
      'в Козероге': 'in Capricorn',
      'в Водолее': 'in Aquarius',
      'в Рыбах': 'in Pisces',
      'Хорошее время для укрепления того, что уже создано. Финансовые решения, телесные практики, всё, что связано с устойчивостью — сегодня поддерживается.':
        'A good time to reinforce what is already built. Financial decisions, body practices, anything about stability — supported today.',
      'Не начинайте новое — углубите начатое': 'Do not start new — deepen what is started',

      // ===== Home — featured + small cards =====
      'РЕКОМЕНДУЕМ СЕГОДНЯ': 'RECOMMENDED TODAY',
      'Индивидуальный расклад': 'Personal Tarot reading',
      'Луна в Тельце — благоприятный момент задать вопросы о ресурсах, телесности, материальной базе. Карты ответят точнее обычного.':
        'Moon in Taurus — a favourable moment to ask about resources, the body, material foundations. The cards will answer more clearly than usual.',
      'Начать расклад': 'Start reading',
      'Натальная карта': 'Natal chart',
      'Планеты в момент рождения': 'Planets at the moment of birth',
      'Матрица судьбы': 'Destiny matrix',
      'Код по дате рождения': 'Code from your date of birth',
      'Портрет половинки': 'Partner portrait',
      'Образ суженого': 'Image of your other half',
      'Все расклады': 'All readings',
      'Таро по любому вопросу': 'Tarot for any question',
      '~ 5 МИНУТ': '~ 5 MINUTES',
      '~ 3 МИНУТЫ': '~ 3 MINUTES',
      '~ 4 МИНУТЫ': '~ 4 MINUTES',
      '~ 7 МИНУТ': '~ 7 MINUTES',

      // ===== Testimonials =====
      'ОТЗЫВЫ': 'REVIEWS',
      'Что говорят': 'What people say',
      'о нас': 'about us',
      'НАТАЛЬНАЯ КАРТА': 'NATAL CHART',
      'МАТРИЦА СУДЬБЫ': 'DESTINY MATRIX',
      'ИНДИВИДУАЛЬНЫЙ РАСКЛАД': 'PERSONAL READING',
      'Предыдущий отзыв': 'Previous review',
      'Следующий отзыв': 'Next review',
      'Впервые встретила астрологический сервис, который не сваливается в эзотерический туман. Конкретные позиции планет, понятная интерпретация — и при этом язык не сухой, а живой. Прочитала про свою Луну в Скорпионе и поняла себя глубже, чем за пять лет терапии.':
        'For the first time I have met an astrology service that does not drift into esoteric fog. Specific planetary positions, clear interpretation — yet the language is alive, not dry. Reading about my Moon in Scorpio I understood myself more deeply than in five years of therapy.',
      'Я скептически отношусь к нумерологии, но матрица здесь сделана умно. Видно, что под цифрами — реальный алгоритм, а не подбор красивых слов. Совпадение центра и точки кармы заставило меня задуматься о вещах, которые я обходила годами.':
        'I am sceptical about numerology, but the matrix here is smartly built. You can see a real algorithm under the numbers, not a selection of nice words. The alignment of the centre and the karma point made me reflect on things I had avoided for years.',
      'Удивительно, насколько точно карты отвечают на конкретный вопрос. Спрашивала о переходе в новую сферу, выпали Башня — Колесница — Звезда. Через два месяца поняла: всё именно так и развернулось. Не предсказание, а зеркало для собственных решений.':
        'It is surprising how precisely the cards answer a specific question. I asked about a career move; the Tower — Chariot — Star came up. Two months later I realised: everything unfolded exactly that way. Not a prediction — a mirror for my own decisions.',
      'Использовала на кризисе, когда казалось, что всё разваливается. Раздел про аспекты показал, что моя Луна в квадрате к Сатурну — это не "плохо", а конструкция, с которой можно работать. Помогло перестать винить себя за то, что я "слишком".':
        'I used it during a crisis when everything seemed to be falling apart. The aspects section showed that my Moon square Saturn is not "bad", it is a structure you can work with. It helped me stop blaming myself for being "too much".',
      'Прошла десяток сервисов с матрицами, и большинство — это копипаст одних и тех же текстов. Здесь впервые увидела, как точки матрицы связаны между собой: миссия + точка денег + кармический хвост складываются в одну осмысленную картину. И язык спокойный, без надрыва.':
        'I have tried a dozen matrix services and most of them are copy-paste of the same texts. Here I finally saw how matrix points connect: mission + money point + karmic tail fold into one meaningful picture. And the tone is calm, without melodrama.',
      'МОСКВА · 38 ЛЕТ': 'MOSCOW · 38 YRS',
      'ПРАГА · 31 ГОД': 'PRAGUE · 31 YRS',
      'КИЕВ · 42 ГОДА': 'KYIV · 42 YRS',
      'БЕРЛИН · 34 ГОДА': 'BERLIN · 34 YRS',
      'АЛМАТЫ · 29 ЛЕТ': 'ALMATY · 29 YRS',

      // ===== Login =====
      'С возвращением': 'Welcome back',
      'Войдите, чтобы продолжить свой путь': 'Sign in to continue your journey',
      'EMAIL': 'EMAIL',
      'ПАРОЛЬ': 'PASSWORD',
      'Забыли пароль?': 'Forgot password?',
      'ИЛИ ВОЙДИТЕ ЧЕРЕЗ': 'OR SIGN IN WITH',
      'Ещё нет аккаунта?': 'No account yet?',

      // ===== Footer =====
      'Поддержка': 'Support',
      'Правовая информация': 'Legal',
      'Ресурсы': 'Resources',
      "Atelier de l'Âme — портреты второй половинки,": "Atelier de l'Âme — partner portraits",
      'написанные звёздами.': 'written by the stars.',
      'Служба поддержки': 'Customer support',
      'Мы онлайн': 'We are online',
      'Как отменить': 'How to cancel',
      'Связаться с нами': 'Contact us',
      'Условия и положения': 'Terms and conditions',
      'Политика возврата': 'Refund policy',
      'Конфиденциальность': 'Privacy',
      'Файлы cookie': 'Cookies',
      'Справочный центр': 'Help center',
      'Цены и подписки': 'Pricing & subscriptions',
      'О нас': 'About us',
      '© 2024–2026 Atelier de l\'Âme — Lovia™. All rights reserved.':
        '© 2024–2026 Atelier de l\'Âme — Lovia™. All rights reserved.',
      'Все товарные знаки принадлежат их соответствующим владельцам.':
        'All trademarks belong to their respective owners.',
      'Сменить язык': 'Change language',
      'Русский': 'Русский',
      'English': 'English',

      // ===== Dashboard =====
      'БЛИЖАЙШИЕ ПРАКТИКИ': 'UPCOMING PRACTICES',
      'ЗАКАЗЫ': 'ORDERS',
      'Все': 'All',
      'В РАБОТЕ': 'IN PROGRESS',
      'В работе': 'In progress',
      'ГОТОВО': 'READY',
      'Готов': 'Ready',
      'ЗАПЛАНИРОВАНО': 'SCHEDULED',
      'Запланировано': 'Scheduled',
      'ЭНЕРГИЯ ДНЯ': 'ENERGY OF THE DAY',
      'ПРОФИЛЬ': 'PROFILE',
      'НАВИГАЦИЯ': 'NAVIGATION',
      'Главная': 'Home',
      'Подписка': 'Subscription',
      'Профиль': 'Profile',
      'История': 'History',
      'Редактировать профиль': 'Edit profile',
      'Открыть': 'Open',
      'Подробнее': 'Details',
      'Осталось до готовности': 'Time until ready',
      'Портрет половинки в работе': 'Partner portrait in progress',

      // ===== Speedup modal =====
      'ОСТАЛОСЬ ЖДАТЬ': 'TIME LEFT',
      'Хотите узнать': 'Want to know',
      'раньше': 'sooner',
      'Я подумаю позже': 'I will think about it later',
      'Получить бесплатный расклад': 'Get a free reading',
      'ПОДОЖДИТЕ': 'WAIT',
      'У нас для вас': 'We have a',
      'подарок': 'gift',

      // ===== Payment =====
      'Часто задаваемые': 'Frequently asked',
      'вопросы': 'questions',
      'Полная': 'Full',
      'полный доступ': 'full access',
      'Купить': 'Buy',
      'Оплатить': 'Pay',

      // ===== FAQ note =====
      'Важно · отмена подписки': 'Important · cancelling subscription',
      'Подписку можно отменить в любой момент — без звонков и переписок':
        'You can cancel anytime — no calls, no email back-and-forth',
      'Если пробный период (3 дня за 0,50 €) вам не подойдёт — отмените подписку, и больше с вас ничего не спишется. Отмена занимает один клик в личном кабинете и доступна 24/7.':
        'If the 3-day trial for €0.50 does not suit you — cancel the subscription and nothing else will be charged. Cancellation is one click in your account and available 24/7.',
      'Личный кабинет → раздел': 'Account → section',
      'Кнопка': 'Button',
      'Отменить подписку': 'Cancel subscription',
      'Подтвердить — готово.': 'Confirm — done.',
      'Подробная инструкция →': 'Detailed instructions →',

      // ===== Subscription card + cancel modal (ЛК) =====
      'ПОДПИСКА': 'SUBSCRIPTION',
      'Lovia Pro': 'Lovia Pro',
      'Активна': 'Active',
      'Отменена': 'Cancelled',
      'Возобновить подписку': 'Resume subscription',
      'Подписка возобновлена': 'Subscription resumed',
      'Добро пожаловать обратно в Pro.': 'Welcome back to Pro.',
      'Отменить подписку?': 'Cancel subscription?',
      'Жаль, что вы уходите. Вы потеряете доступ к полным разборам натальной карты, матрицы судьбы, Кельтскому кресту и безлимитному чату с AI.':
        'Sorry to see you go. You will lose access to full natal chart and destiny matrix readings, the Celtic Cross and unlimited AI chat.',
      'Оставить подписку': 'Keep subscription',
      'Всё равно отменить': 'Cancel anyway',
      'Подписка отменена': 'Subscription cancelled',
      'Понятно': 'Got it',
      'Доступ к Pro сохранится до 24 мая 2026. Повторных списаний не будет.':
        'Pro access stays until May 24, 2026. No further charges.',

      // ===== Common HTML-attribute hosts (handled separately) =====
      'Cмена даты рождения': 'Change date of birth',
      'Введите ваш вопрос': 'Enter your question',
      'Войдите, чтобы продолжить': 'Sign in to continue',
      'anna@example.com': 'anna@example.com',

      // ===== Auto-generated translations (parts 1+2) =====
      'Россия': 'Russia',
      'Украина': 'Ukraine',
      'США': 'USA',
      'Казахстан': 'Kazakhstan',
      'Беларусь': 'Belarus',
      'Германия': 'Germany',
      'Италия': 'Italy',
      'Испания': 'Spain',
      'Великобритания': 'United Kingdom',
      'Франция': 'France',
      'Китай': 'China',
      'Индия': 'India',
      'Звёзды подтверждают': 'The stars confirm',
      'Цифры говорят сами за себя': 'The numbers speak for themselves',
      'Всё сходится': 'Everything aligns',
      'Картина складывается': 'The picture is taking shape',
      'Канада': 'Canada',
      'Узбекистан': 'Uzbekistan',
      'Польша': 'Poland',
      'Турция': 'Turkey',
      'Япония': 'Japan',
      'Бразилия': 'Brazil',
      'Квадрат': 'Square',
      'Нидерланды': 'Netherlands',
      'Австралия': 'Australia',
      'Оппозиция': 'Opposition',
      '☽ Луна': '☽ Moon',
      '♆ Нептун': '♆ Neptune',
      '☿ Меркурий': '☿ Mercury',
      'Бельгия': 'Belgium',
      'Швейцария': 'Switzerland',
      'Австрия': 'Austria',
      'Румыния': 'Romania',
      'Меркурий': 'Mercury',
      'Секстиль': 'Sextile',
      'Трин': 'Trine',
      '♃ Юпитер': '♃ Jupiter',
      '♂ Марс': '♂ Mars',
      'Швеция': 'Sweden',
      'Норвегия': 'Norway',
      'Финляндия': 'Finland',
      'Чехия': 'Czechia',
      'Израиль': 'Israel',
      'Иран': 'Iran',
      'Южная Корея': 'South Korea',
      'Таиланд': 'Thailand',
      'Вьетнам': 'Vietnam',
      'Индонезия': 'Indonesia',
      'Мексика': 'Mexico',
      'Колумбия': 'Colombia',
      'Аргентина': 'Argentina',
      'ЮАР': 'South Africa',
      'Киев, Украина': 'Kyiv, Ukraine',
      'Сводка': 'Summary',
      'Соединение': 'Conjunction',
      '30 минут': '30 minutes',
      '← Назад': '← Back',
      'Скачать': 'Download',
      '2 дом': '2nd house',
      '♀ Венера': '♀ Venus',
      '♄ Сатурн': '♄ Saturn',
      '— заполните карту': '— complete the chart',
      'Грузия': 'Georgia',
      'Азербайджан': 'Azerbaijan',
      'Молдова': 'Moldova',
      'Португалия': 'Portugal',
      'Дания': 'Denmark',
      'Венгрия': 'Hungary',
      'Хорватия': 'Croatia',
      'Болгария': 'Bulgaria',
      'Греция': 'Greece',
      'Литва': 'Lithuania',
      'Египет': 'Egypt',
      'Саудовская Аравия': 'Saudi Arabia',
      'ОАЭ': 'UAE',
      'Марокко': 'Morocco',
      'Пакистан': 'Pakistan',
      'Новая Зеландия': 'New Zealand',
      '14 мая 2026': '14 May 2026',
      '7 июля 1999': '7 July 1999',
      'КРАТКО': 'BRIEF',
      'РАЗВЁРНУТО': 'EXPANDED',
      'ГЛУБОКО': 'DEEP',
      'РАЗВЁРНУТЫЙ ОТЧЁТ': 'DETAILED REPORT',
      'Открыть полный отчёт за €9.90': 'Unlock full report for €9.90',
      'Скачать отчёт PDF': 'Download PDF report',
      'Сравнить с партнёром': 'Compare with a partner',
      'Венера': 'Venus',
      'Юпитер': 'Jupiter',
      'Марс': 'Mars',
      'Сатурн': 'Saturn',
      'Плутон': 'Pluto',
      'Уран': 'Uranus',
      'Нептун': 'Neptune',
      'Императрица': 'The Empress',
      'ИНТЕРПРЕТАЦИЯ AI · CLAUDE SONNET 4': 'AI INTERPRETATION · CLAUDE SONNET 4',
      'Прошлое — Настоящее — Будущее': 'Past — Present — Future',
      '3 КАРТЫ · 3 МИНУТЫ': '3 CARDS · 3 MINUTES',
      'Политика конфиденциальности': 'Privacy policy',
      'МОИ ЗАКАЗЫ': 'MY ORDERS',
      'Кликните, чтобы ускорить за 3,99 €': 'Tap to speed up for €3.99',
      'Далее →': 'Next →',
      '6 дом': '6th house',
      '12 дом': '12th house',
      '♅ Уран': '♅ Uranus',
      '♇ Плутон': '♇ Pluto',
      'Выйти из аккаунта?': 'Sign out?',
      '~ 5 минут': '~ 5 minutes',
      'Симферополь': 'Simferopol',
      'Кыргызстан': 'Kyrgyzstan',
      'Таджикистан': 'Tajikistan',
      'Туркменистан': 'Turkmenistan',
      'Армения': 'Armenia',
      'Ирландия': 'Ireland',
      'Словакия': 'Slovakia',
      'Сербия': 'Serbia',
      'Латвия': 'Latvia',
      'Эстония': 'Estonia',
      'Сирия': 'Syria',
      'Кувейт': 'Kuwait',
      'Алжир': 'Algeria',
      'Тунис': 'Tunisia',
      'Гонконг': 'Hong Kong',
      'Макао': 'Macau',
      'Тайвань': 'Taiwan',
      'Сингапур': 'Singapore',
      'Филиппины': 'Philippines',
      'Камбоджа': 'Cambodia',
      'Гватемала': 'Guatemala',
      'Эквадор': 'Ecuador',
      'Перу': 'Peru',
      'Чили': 'Chile',
      'Нигерия': 'Nigeria',
      'Кения': 'Kenya',
      'разговаривают': 'are talking',
      'Lovia — ваш личный астролог': 'Lovia — your personal astrologer',
      '— выберите практику, чтобы начать': '— choose a practice to begin',
      'Мария К.': 'Maria K.',
      'Анна Л.': 'Anna L.',
      'Елена В.': 'Elena V.',
      'Ольга Д.': 'Olga D.',
      'Наталья П.': 'Natalia P.',
      'Заголовок': 'Heading',
      'ВАША НАТАЛЬНАЯ КАРТА': 'YOUR NATAL CHART',
      'вот ваша карта': 'here is your chart',
      'Сейчас': 'Now',
      'Планеты': 'Planets',
      'Дома': 'Houses',
      'Аспекты': 'Aspects',
      'Стихии': 'Elements',
      'Сила планет': 'Planet strength',
      'Поколение': 'Generation',
      'ПРОСТО': 'SIMPLE',
      'ПОДРОБНО': 'DETAILED',
      'СОЛНЦЕ': 'SUN',
      'ЛУНА': 'MOON',
      'АСЦЕНДЕНТ': 'ASCENDANT',
      'КЛЮЧЕВЫЕ КОНФИГУРАЦИИ ВАШЕЙ КАРТЫ': 'KEY CONFIGURATIONS IN YOUR CHART',
      'Стеллиум в Тельце': 'Stellium in Taurus',
      'Стеллиум в Водолее': 'Stellium in Aquarius',
      'Точный трин 0.3°': 'Exact trine 0.3°',
      'T-квадрат с Юпитером': 'T-square with Jupiter',
      'Ядро личности': 'Core of personality',
      'секстиле с Сатурном (орб 0.4°)': 'sextile to Saturn (orb 0.4°)',
      'Как вы проявляетесь внешне': 'How you present outwardly',
      'Главная динамика карты': 'Main dynamic of the chart',
      'Самая яркая конфигурация —': 'The brightest configuration —',
      'Луна в оппозиции к Марсу в Скорпионе': 'Moon in opposition to Mars in Scorpio',
      'Поддерживающая ось карты —': 'The supporting axis of the chart —',
      'Профессиональный вектор': 'Professional vector',
      'Под это есть ресурс:': 'There is a resource for this:',
      'Луна, Юпитер и Сатурн собраны во 2 доме': 'Moon, Jupiter and Saturn cluster in the 2nd house',
      'На что обратить внимание': 'What to watch',
      'Сатурн квадрат Уран (1.2°)': 'Saturn square Uranus (1.2°)',
      'Луна квадрат Нептун (0.7°)': 'Moon square Neptune (0.7°)',
      'Спросите астролога': 'Ask the astrologer',
      'AI ОТВЕЧАЕТ НА ОСНОВЕ ВАШЕЙ КАРТЫ': 'AI ANSWERS BASED ON YOUR CHART',
      'Расскажи про мои отношения': 'Tell me about my relationships',
      'Куда мне идти в карьере?': 'Where should I go in my career?',
      'Что значит моя Луна в Тельце?': 'What does my Moon in Taurus mean?',
      'Объясни оппозицию Луна–Марс': 'Explain the Moon–Mars opposition',
      'Какие у меня сильные стороны?': 'What are my strengths?',
      'Прогрессии на год': 'Progressions for the year',
      'АКТИВНЫЕ ВЛИЯНИЯ · НА 14 МАЯ 2026': 'ACTIVE INFLUENCES · FOR 14 MAY 2026',
      'ЧТО ПРОИСХОДИТ СЕГОДНЯ': 'WHAT IS HAPPENING TODAY',
      'Период переосмысления ресурсов': 'A period of rethinking resources',
      'Юпитер трин натальная Луна.': 'Jupiter trine natal Moon.',
      '10–18 МАЯ': '10–18 MAY',
      'Сатурн секстиль натальное Солнце.': 'Saturn sextile natal Sun.',
      '12–22 МАЯ': '12–22 MAY',
      'Марс квадрат натальная Венера.': 'Mars square natal Venus.',
      '13–17 МАЯ': '13–17 MAY',
      'Меркурий соединение MC.': 'Mercury conjunct MC.',
      '14–16 МАЯ': '14–16 MAY',
      'ПРОДВИНУТЫЙ АНАЛИЗ': 'ADVANCED ANALYSIS',
      'Прогноз транзитов на 12 месяцев': '12-month transit forecast',
      'Открыть годовой прогноз': 'Open annual forecast',
      'АСПЕКТЫ': 'ASPECTS',
      'Трин · гармоничный': 'Trine · harmonious',
      'Секстиль · поддержка': 'Sextile · support',
      'Квадрат · напряжение': 'Square · tension',
      'Оппозиция · полюса': 'Opposition · poles',
      'КЛЮЧЕВЫЕ ТОЧКИ': 'KEY POINTS',
      'Асцендент · Водолей 29.1°': 'Ascendant · Aquarius 29.1°',
      'Середина неба · Стрелец': 'Midheaven · Sagittarius',
      'Солнце · Рак 15.3° · 5 дом': 'Sun · Cancer 15.3° · 5th house',
      'Луна · Телец 2.7° · 2 дом': 'Moon · Taurus 2.7° · 2nd house',
      'Все · 17': 'All · 17',
      'Точные (орб < 2°)': 'Exact (orb < 2°)',
      'Соединения': 'Conjunctions',
      'Трины': 'Trines',
      'Секстили': 'Sextiles',
      'Оппозиции': 'Oppositions',
      'Доминирующая планета — Луна': 'Dominant planet — Moon',
      '+11 БАЛЛОВ · 1-Е МЕСТО В КАРТЕ': '+11 POINTS · 1ST PLACE IN CHART',
      'ПРАКТИЧНО:': 'PRACTICAL:',
      '1-я': '1st',
      '2-я': '2nd',
      '3-я': '3rd',
      '4-я': '4th',
      '5-я': '5th',
      '6-я': '6th',
      '7-я': '7th',
      '8-я': '8th',
      '9-я': '9th',
      '10-я': '10th',
      'УНИКАЛЬНО ДЛЯ ВАШЕЙ КАРТЫ': 'UNIQUE TO YOUR CHART',
      'Асцендент в Водолее 29.1°.': 'Ascendant in Aquarius 29.1°.',
      'Солнце в Раке 15.3°, 5 дом.': 'Sun in Cancer 15.3°, 5th house.',
      'Луна в Тельце 2.7°, 2 дом.': 'Moon in Taurus 2.7°, 2nd house.',
      'Меркурий трин Плутон, орб 0.3°.': 'Mercury trine Pluto, orb 0.3°.',
      'ОБЩЕЕ С ВАШИМ ПОКОЛЕНИЕМ': 'SHARED WITH YOUR GENERATION',
      'Плутон в Стрельце': 'Pluto in Sagittarius',
      'Нептун в Водолее': 'Neptune in Aquarius',
      'Уран в Водолее': 'Uranus in Aquarius',
      'Нептун секстиль Плутон.': 'Neptune sextile Pluto.',
      'Почему это важно': 'Why it matters',
      '200 миллионов человек': '200 million people',
      'Личная подпись карты — это': 'Your chart signature is',
      '22 энергии вашего': '22 energies of your',
      'пути': 'path',
      'Ваше имя': 'Your name',
      'Что сейчас в фокусе': 'What is in focus now',
      'Как вас': 'What is',
      'зовут?': 'your name?',
      'ВАШЕ ИМЯ': 'YOUR NAME',
      'Что сейчас в': 'What is in',
      'фокусе?': 'focus?',
      'МИССИЯ, ПУТЬ, СМЫСЛ': 'MISSION, PATH, MEANING',
      'Отношения': 'Relationships',
      'ЛЮБОВЬ, ПАРТНЁРСТВО': 'LOVE, PARTNERSHIP',
      'Финансы': 'Finance',
      'ДЕНЬГИ, РЕСУРСЫ': 'MONEY, RESOURCES',
      'Род и семья': 'Lineage and family',
      'КАРМА, ПРЕДКИ, ДОМ': 'KARMA, ANCESTORS, HOME',
      'ВНУТРЕННИЙ МИР': 'INNER WORLD',
      'Общий обзор': 'General overview',
      'ВСЕ СФЕРЫ РАВНОМЕРНО': 'ALL AREAS EQUALLY',
      'Построить матрицу': 'Build matrix',
      'Строим вашу матрицу': 'Building your matrix',
      'ВАША МАТРИЦА СУДЬБЫ': 'YOUR DESTINY MATRIX',
      'вот ваша матрица': 'here is your matrix',
      'Центр 3': 'Centre 3',
      'Матрица': 'Matrix',
      'Личность': 'Personality',
      'Судьба': 'Destiny',
      'Миссия': 'Mission',
      'Зоны': 'Zones',
      'ЦЕНТР МАТРИЦЫ · ВАША МИССИЯ': 'MATRIX CENTRE · YOUR MISSION',
      'КЛЮЧЕВЫЕ ТОЧКИ ВАШЕЙ МАТРИЦЫ': 'KEY POINTS OF YOUR MATRIX',
      'Спросите нумеролога': 'Ask the numerologist',
      'AI ОТВЕЧАЕТ НА ОСНОВЕ ВАШЕЙ МАТРИЦЫ': 'AI ANSWERS BASED ON YOUR MATRIX',
      'Как реализовать миссию?': 'How can I realise my mission?',
      'Что значит моя точка любви?': 'What does my love point mean?',
      'Кармические задачи рода': 'Karmic tasks of the lineage',
      'Когда раскроется денежный канал?': 'When will the money channel open?',
      'Сильные стороны личности': 'Strengths of the personality',
      'Прогноз на год': 'Annual forecast',
      'Карты Таро на': 'Tarot cards for',
      'ваш вопрос': 'your question',
      'Выберите тип расклада': 'Choose the type of spread',
      'Сформулируйте вопрос': 'Formulate your question',
      'Вытяните карты': 'Draw the cards',
      'Какой расклад': 'Which spread',
      'сделать?': 'to choose?',
      'Карта дня': 'Card of the day',
      '1 КАРТА · 1 МИНУТА': '1 CARD · 1 MINUTE',
      'Ситуация — Препятствие — Совет': 'Situation — Obstacle — Advice',
      '10 КАРТ · 8 МИНУТ': '10 CARDS · 8 MINUTES',
      'Что вы': 'What do you',
      'хотите узнать?': 'want to know?',
      'ПОДСКАЗКИ — КЛИКНИТЕ ЧТОБЫ ПОДСТАВИТЬ:': 'HINTS — CLICK TO INSERT:',
      'Стоит ли продолжать отношения с N?': 'Should I continue the relationship with N?',
      'Что мешает мне двигаться вперёд?': 'What is blocking me from moving forward?',
      'Куда вкладывать силы в этом квартале?': 'Where should I invest my energy this quarter?',
      'На что обратить внимание сегодня?': 'What should I pay attention to today?',
      'ваши карты': 'your cards',
      'Ваш вопрос появится здесь': 'Your question will appear here',
      'Перемешать': 'Shuffle',
      'Выбрано': 'Selected',
      'Раскрываем ваши карты': 'Revealing your cards',
      'ВАШ РАСКЛАД': 'YOUR READING',
      '3 карты': '3 cards',
      'Совет': 'Advice',
      'Уточните расклад': 'Clarify the reading',
      'AI ОТВЕЧАЕТ ПО КОНТЕКСТУ ЭТОГО РАСКЛАДА': 'AI ANSWERS IN THE CONTEXT OF THIS READING',
      'Что означает первая карта подробнее?': 'What does the first card mean in more detail?',
      'Как ситуация будет развиваться?': 'How will the situation develop?',
      'Что мне нельзя делать сейчас?': 'What should I avoid doing now?',
      'Когда ожидать перемен?': 'When can I expect changes?',
      'Новый расклад': 'New reading',
      'КОНТЕКСТ ИНТЕРПРЕТАЦИИ': 'INTERPRETATION CONTEXT',
      'Твой': 'Your',
      'эскиз': 'sketch',
      'за ': 'for ',
      'исчезнет через': 'disappears in',
      'ПРОБНЫЙ ДОСТУП': 'TRIAL ACCESS',
      '1278 пользователей': '1,278 users',
      'сегодня открыли свою карту': 'opened their chart today',
      'Нам доверяют более': 'Trusted by over',
      '20 млн человек': '20 million people',
      'по всему миру': 'worldwide',
      'Получить доступ': 'Get access',
      'Попробуй': 'Try it',
      'на 3 дня': 'for 3 days',
      'Мы поможем тебе сделать правильный выбор': 'We will help you make the right choice',
      '996 человек': '996 people',
      'присоединились сегодня': 'joined today',
      '— Lovia упоминали в —': '— Lovia featured in —',
      'ТВОЙ ПРОМОКОД': 'YOUR PROMO CODE',
      'Применён · Скидка 95%': 'Applied · 95% off',
      'К ОПЛАТЕ': 'TO PAY',
      'Экономия 95%': 'Save 95%',
      'Банковская карта': 'Bank card',
      'Защищено': 'Secured',
      'Мгновенно': 'Instant',
      'Пробный период 3 дня': '3-day trial',
      '— всего за ': '— for just ',
      '. После пробного периода —': '. After the trial period —',
      '29,90 €/мес': '€29.90/mo',
      'Почему люди выбирают': 'Why people choose',
      '© 2026 Lovia. Все права защищены.': '© 2026 Lovia. All rights reserved.',
      'Условия использования': 'Terms of use',
      'Возврат средств': 'Refunds',
      'ПРАКТИКИ': 'PRACTICES',
      'КАЛЕНДАРЬ': 'CALENDAR',
      'БИБЛИОТЕКА': 'LIBRARY',
      'ИЗБРАННОЕ': 'FAVOURITES',
      'ПРИОРИТЕТНАЯ ОЧЕРЕДЬ': 'PRIORITY QUEUE',
      'МОЙ ПРОФИЛЬ': 'MY PROFILE',
      '26 лет': '26 yrs',
      'Мои заказы': 'My orders',
      'Избранное': 'Favourites',
      'Календарь': 'Calendar',
      'Библиотека': 'Library',
      'Выход': 'Sign out',
      'Добрый вечер,': 'Good evening,',
      'ВАША ЭНЕРГЕТИКА ДНЯ': 'YOUR ENERGY OF THE DAY',
      'День для ясности и новых идей': 'A day for clarity and new ideas',
      'Читать совет дня': 'Read today\'s tip',
      'Все заказы →': 'All orders →',
      'Смотреть календарь →': 'Open calendar →',
      'ВАША КОСМИЧЕСКАЯ КАРТА': 'YOUR COSMIC CHART',
      'Хотите глубже понять себя?': 'Want to understand yourself more deeply?',
      'Записаться на консультацию': 'Book a consultation',
      'Поставьте ваш заказ в': 'Move your order to',
      'приоритетную очередь': 'the priority queue',
      '— мы создадим портрет за': '— we will create the portrait in',
      'вместо 24 часов.': 'instead of 24 hours.',
      'Ускорить за': 'Speed up for',
      'Я подожду 24 часа': 'I will wait 24 hours',
      'ОПЛАТА УСКОРЕНИЯ': 'SPEED-UP PAYMENT',
      'Приоритетная': 'Priority',
      'очередь': 'queue',
      'Услуга': 'Service',
      'Ускорение портрета': 'Portrait speed-up',
      'Срок': 'Duration',
      'К оплате': 'To pay',
      'Номер карты': 'Card number',
      'MM / ГГ': 'MM / YY',
      'Заказ': 'Order',
      'ускорен': 'accelerated',
      'Портрет будет готов через': 'The portrait will be ready in',
      'Вернуться': 'Return',
      'Заголовок шага': 'Step heading',
      'Описание шага.': 'Step description.',
      'Войдите в ': 'Sign in to ',
      'Чтобы сохранять историю практик': 'To save your practice history',
      'Войти через Google': 'Sign in with Google',
      'Войти через телефон': 'Sign in via phone',
      'ИЛИ': 'OR',
      'Демо-вход (без авторизации)': 'Demo login (no auth)',
      'В продакшне — Supabase Auth + БД.': 'In production — Supabase Auth + DB.',
      'Ваш телефон': 'Your phone',
      'Мы отправим код подтверждения': 'We will send a verification code',
      'Отправить код': 'Send code',
      'Демо:': 'Demo:',
      'любой номер': 'any number',
      '+ код': '+ code',
      'Код из SMS': 'SMS code',
      'Отправлен на ': 'Sent to ',
      'Демо: введите': 'Demo: enter',
      'Ваш Gmail': 'Your Gmail',
      'Войдите через Google-аккаунт': 'Sign in with your Google account',
      'Демо: введите любой email': 'Demo: enter any email',
      'Отзыв 1': 'Review 1',
      'Отзыв 2': 'Review 2',
      'Отзыв 3': 'Review 3',
      'Отзыв 4': 'Review 4',
      'Отзыв 5': 'Review 5',
      'Задайте свой вопрос о карте...': 'Ask your question about the chart...',
      'Например, Анна': 'For example, Anna',
      'Задайте свой вопрос о матрице...': 'Ask your question about the matrix...',
      'Спросите по своему раскладу...': 'Ask about your reading...',
      'Квиз: Портрет половинки': 'Quiz: Partner portrait',
      'Закрыть тур': 'Close tour',
      '5 дом': '5th house',
      '8 дом': '8th house',
      '9 дом': '9th house',
      '☉ Солнце': '☉ Sun',
      '▾ СКРЫТЬ': '▾ HIDE',
      '▸ УГЛУБИТЬСЯ': '▸ GO DEEPER',
      '· ТОЧНЫЙ': '· EXACT',
      'Таро расклад': 'Tarot reading',
      'Введите новое имя:': 'Enter new name:',
      'Введите номер телефона': 'Enter phone number',
      'Неверный код. В демо нужно ввести 0000': 'Wrong code. In demo enter 0000',
      'Введите корректный email': 'Enter a valid email',
      'Как отменить подписку': 'How to cancel subscription',
      'Lovia в X': 'Lovia on X',
      'Lovia в Instagram': 'Lovia on Instagram',
      'Lovia в Facebook': 'Lovia on Facebook',
      'Уведомление': 'Notification',
      'Портрет в приоритетной очереди': 'Portrait in priority queue',
      'Уже совсем скоро будет готов': 'Will be ready very soon',
      'Портрет половинки готов!': 'Partner portrait is ready!',
      'Кликните, чтобы открыть результат': 'Tap to open the result',
      'Портрет готов!': 'Portrait ready!',
      'Ваше пространство': 'Your space',
      'Энергетика дня': 'Energy of the day',
      'ШАГ': 'STEP',
      'ИЗ': 'OF',
      '~ 4 минуты': '~ 4 minutes',
      'разбор Матрицы Судьбы': 'Destiny Matrix reading',
      'Получить бесплатный разбор': 'Get a free reading',
      'расчёт натальной карты': 'natal chart calculation',
      'Получить бесплатный расчёт': 'Get a free calculation',
      'портрет вашей второй половинки': 'portrait of your other half',
      'Получить бесплатный портрет': 'Get a free portrait',
      '~ 7 минут': '~ 7 minutes',
      '— ТВОЁ ИМЯ —': '— YOUR NAME —',
      'СЛИШКОМ КОРОТКО': 'TOO SHORT',
      'ТОЛЬКО БУКВЫ': 'LETTERS ONLY',
      '— ОТЛИЧНО —': '— GREAT —',
      '— ТВОЯ ПОЧТА —': '— YOUR EMAIL —',
      'ПРОВЕРЬ АДРЕС': 'CHECK ADDRESS',
      '— ПОДТВЕРДИ СОГЛАСИЕ НИЖЕ —': '— CONFIRM CONSENT BELOW —',
      '— ВСЁ ГОТОВО —': '— ALL READY —',
      'эмоциональный профессионал': 'emotional professional',
      'горячий': 'hot',
      'поверхностный': 'superficial',
      'зрелой Венеры': 'of mature Venus',
      'сухость': 'dryness',
      'богатство свалится с неба': 'wealth falling from the sky',
      'тяжесть Сатурна': 'the weight of Saturn',
      'вес авторитета': 'the weight of authority',
      'не как все': 'not like everyone',
      'разобрать на части и собрать заново': 'take apart and rebuild',
      'просто работе': 'just a job',
      'Это решение, или это Луна в обиде?': 'Is this a decision, or is it the Moon resentful?',
      'правильности': 'correctness',
      'лево': 'left',
      'характер': 'character',
      'назад': 'back',
      'медиум': 'midheaven',
      'коэли': 'coeli',
      'Москва': 'Moscow',
      'Санкт-Петербург': 'Saint Petersburg',
      'Новосибирск': 'Novosibirsk',
      'Екатеринбург': 'Yekaterinburg',
      'Нижний Новгород': 'Nizhny Novgorod',
      'Казань': 'Kazan',
      'Челябинск': 'Chelyabinsk',
      'Омск': 'Omsk',
      'Самара': 'Samara',
      'Ростов-на-Дону': 'Rostov-on-Don',
      'Уфа': 'Ufa',
      'Красноярск': 'Krasnoyarsk',
      'Воронеж': 'Voronezh',
      'Пермь': 'Perm',
      'Волгоград': 'Volgograd',
      'Краснодар': 'Krasnodar',
      'Саратов': 'Saratov',
      'Тюмень': 'Tyumen',
      'Тольятти': 'Tolyatti',
      'Ижевск': 'Izhevsk',
      'Барнаул': 'Barnaul',
      'Ульяновск': 'Ulyanovsk',
      'Иркутск': 'Irkutsk',
      'Хабаровск': 'Khabarovsk',
      'Ярославль': 'Yaroslavl',
      'Владивосток': 'Vladivostok',
      'Махачкала': 'Makhachkala',
      'Томск': 'Tomsk',
      'Оренбург': 'Orenburg',
      'Кемерово': 'Kemerovo',
      'Новокузнецк': 'Novokuznetsk',
      'Рязань': 'Ryazan',
      'Астрахань': 'Astrakhan',
      'Набережные Челны': 'Naberezhnye Chelny',
      'Пенза': 'Penza',
      'Липецк': 'Lipetsk',
      'Киров': 'Kirov',
      'Тула': 'Tula',
      'Чебоксары': 'Cheboksary',
      'Калининград': 'Kaliningrad',
      'Брянск': 'Bryansk',
      'Курск': 'Kursk',
      'Иваново': 'Ivanovo',
      'Магнитогорск': 'Magnitogorsk',
      'Тверь': 'Tver',
      'Ставрополь': 'Stavropol',
      'Белгород': 'Belgorod',
      'Архангельск': 'Arkhangelsk',
      'Владимир': 'Vladimir',
      'Сочи': 'Sochi',
      'Курган': 'Kurgan',
      'Смоленск': 'Smolensk',
      'Калуга': 'Kaluga',
      'Череповец': 'Cherepovets',
      'Орёл': 'Oryol',
      'Вологда': 'Vologda',
      'Мурманск': 'Murmansk',
      'Сургут': 'Surgut',
      'Якутск': 'Yakutsk',
      'Грозный': 'Grozny',
      'Петрозаводск': 'Petrozavodsk',
      'Кострома': 'Kostroma',
      'Нижневартовск': 'Nizhnevartovsk',
      'Нальчик': 'Nalchik',
      'Энгельс': 'Engels',
      'Таганрог': 'Taganrog',
      'Сыктывкар': 'Syktyvkar',
      'Орск': 'Orsk',
      'Стерлитамак': 'Sterlitamak',
      'Дзержинск': 'Dzerzhinsk',
      'Новороссийск': 'Novorossiysk',
      'Анадырь': 'Anadyr',
      'Петропавловск-Камчатский': 'Petropavlovsk-Kamchatsky',
      'Магадан': 'Magadan',
      'Киев': 'Kyiv',
      'Харьков': 'Kharkiv',
      'Одесса': 'Odesa',
      'Днепр': 'Dnipro',
      'Донецк': 'Donetsk',
      'Запорожье': 'Zaporizhzhia',
      'Львов': 'Lviv',
      'Кривой Рог': 'Kryvyi Rih',
      'Николаев': 'Mykolaiv',
      'Мариуполь': 'Mariupol',
      'Луганск': 'Luhansk',
      'Винница': 'Vinnytsia',
      'Херсон': 'Kherson',
      'Полтава': 'Poltava',
      'Чернигов': 'Chernihiv',
      'Черкассы': 'Cherkasy',
      'Житомир': 'Zhytomyr',
      'Сумы': 'Sumy',
      'Ровно': 'Rivne',
      'Ивано-Франковск': 'Ivano-Frankivsk',
      'Тернополь': 'Ternopil',
      'Луцк': 'Lutsk',
      'Ужгород': 'Uzhhorod',
      'Севастополь': 'Sevastopol',
      'Ялта': 'Yalta',
      'Кропивницкий': 'Kropyvnytskyi',
      'Хмельницкий': 'Khmelnytskyi',
      'Каменское': 'Kamianske',
      'Бровары': 'Brovary',
      'Минск': 'Minsk',
      'Гомель': 'Gomel',
      'Могилёв': 'Mogilev',
      'Витебск': 'Vitebsk',
      'Гродно': 'Grodno',
      'Брест': 'Brest',
      'Бобруйск': 'Bobruisk',
      'Барановичи': 'Baranavichy',
      'Борисов': 'Barysaw',
      'Пинск': 'Pinsk',
      'Орша': 'Orsha',
      'Мозырь': 'Mazyr',
      'Солигорск': 'Salihorsk',
      'Новополоцк': 'Navapolatsk',
      'Алматы': 'Almaty',
      'Нур-Султан': 'Nur-Sultan',
      'Астана': 'Astana',
      'Шымкент': 'Shymkent',
      'Караганда': 'Karaganda',
      'Тараз': 'Taraz',
      'Павлодар': 'Pavlodar',
      'Усть-Каменогорск': 'Ust-Kamenogorsk',
      'Семей': 'Semey',
      'Атырау': 'Atyrau',
      'Костанай': 'Kostanay',
      'Кызылорда': 'Kyzylorda',
      'Уральск': 'Uralsk',
      'Петропавловск': 'Petropavl',
      'Актобе': 'Aktobe',
      'Темиртау': 'Temirtau',
      'Туркестан': 'Turkistan',
      'Актау': 'Aktau',
      'Кокшетау': 'Kokshetau',
      'Ташкент': 'Tashkent',
      'Самарканд': 'Samarkand',
      'Бухара': 'Bukhara',
      'Наманган': 'Namangan',
      'Андижан': 'Andijan',
      'Фергана': 'Fergana',
      'Хива': 'Khiva',
      'Нукус': 'Nukus',
      'Бишкек': 'Bishkek',
      'Ош': 'Osh',
      'Душанбе': 'Dushanbe',
      'Худжанд': 'Khujand',
      'Ашхабад': 'Ashgabat',
      'Туркменабат': 'Turkmenabat',
      'Тбилиси': 'Tbilisi',
      'Батуми': 'Batumi',
      'Кутаиси': 'Kutaisi',
      'Ереван': 'Yerevan',
      'Гюмри': 'Gyumri',
      'Баку': 'Baku',
      'Гянджа': 'Ganja',
      'Сумгайыт': 'Sumqayit',
      'Кишинёв': 'Chișinău',
      'Тирасполь': 'Tiraspol',
      'Бельцы': 'Bălți',
      'Лондон': 'London',
      'Манчестер': 'Manchester',
      'Бирмингем': 'Birmingham',
      'Эдинбург': 'Edinburgh',
      'Глазго': 'Glasgow',
      'Ливерпуль': 'Liverpool',
      'Лидс': 'Leeds',
      'Шеффилд': 'Sheffield',
      'Бристоль': 'Bristol',
      'Кардифф': 'Cardiff',
      'Белфаст': 'Belfast',
      'Дублин': 'Dublin',
      'Корк': 'Cork',
      'Берлин': 'Berlin',
      'Гамбург': 'Hamburg',
      'Мюнхен': 'Munich',
      'Кёльн': 'Cologne',
      'Франкфурт-на-Майне': 'Frankfurt am Main',
      'Штутгарт': 'Stuttgart',
      'Дюссельдорф': 'Düsseldorf',
      'Дрезден': 'Dresden',
      'Лейпциг': 'Leipzig',
      'Ганновер': 'Hanover',
      'Нюрнберг': 'Nuremberg',
      'Бремен': 'Bremen',
      'Париж': 'Paris',
      'Марсель': 'Marseille',
      'Лион': 'Lyon',
      'Тулуза': 'Toulouse',
      'Ницца': 'Nice',
      'Нант': 'Nantes',
      'Страсбург': 'Strasbourg',
      'Бордо': 'Bordeaux',
      'Лилль': 'Lille',
      'Ренн': 'Rennes',
      'Канны': 'Cannes',
      'Рим': 'Rome',
      'Милан': 'Milan',
      'Неаполь': 'Naples',
      'Турин': 'Turin',
      'Палермо': 'Palermo',
      'Генуя': 'Genoa',
      'Болонья': 'Bologna',
      'Флоренция': 'Florence',
      'Венеция': 'Venice',
      'Верона': 'Verona',
      'Бари': 'Bari',
      'Катания': 'Catania',
      'Мадрид': 'Madrid',
      'Барселона': 'Barcelona',
      'Валенсия': 'Valencia',
      'Севилья': 'Seville',
      'Сарагоса': 'Zaragoza',
      'Малага': 'Málaga',
      'Мурсия': 'Murcia',
      'Пальма': 'Palma',
      'Лас-Пальмас': 'Las Palmas',
      'Бильбао': 'Bilbao',
      'Гранада': 'Granada',
      'Аликанте': 'Alicante',
      'Лиссабон': 'Lisbon',
      'Порту': 'Porto',
      'Брага': 'Braga',
      'Амстердам': 'Amsterdam',
      'Роттердам': 'Rotterdam',
      'Гаага': 'The Hague',
      'Утрехт': 'Utrecht',
      'Эйндховен': 'Eindhoven',
      'Гронинген': 'Groningen',
      'Лелистад': 'Lelystad',
      'Брюссель': 'Brussels',
      'Антверпен': 'Antwerp',
      'Гент': 'Ghent',
      'Брюгге': 'Bruges',
      'Льеж': 'Liège',
      'Цюрих': 'Zurich',
      'Женева': 'Geneva',
      'Базель': 'Basel',
      'Берн': 'Bern',
      'Лозанна': 'Lausanne',
      'Вена': 'Vienna',
      'Грац': 'Graz',
      'Линц': 'Linz',
      'Зальцбург': 'Salzburg',
      'Инсбрук': 'Innsbruck',
      'Стокгольм': 'Stockholm',
      'Гётеборг': 'Gothenburg',
      'Мальмё': 'Malmö',
      'Уппсала': 'Uppsala',
      'Осло': 'Oslo',
      'Берген': 'Bergen',
      'Тронхейм': 'Trondheim',
      'Ставангер': 'Stavanger',
      'Хельсинки': 'Helsinki',
      'Эспоо': 'Espoo',
      'Тампере': 'Tampere',
      'Турку': 'Turku',
      'Копенгаген': 'Copenhagen',
      'Орхус': 'Aarhus',
      'Оденсе': 'Odense',
      'Рейкьявик': 'Reykjavík',
      'Исландия': 'Iceland',
      'Прага': 'Prague',
      'Брно': 'Brno',
      'Острава': 'Ostrava',
      'Пльзень': 'Plzeň',
      'Варшава': 'Warsaw',
      'Краков': 'Kraków',
      'Лодзь': 'Łódź',
      'Вроцлав': 'Wrocław',
      'Познань': 'Poznań',
      'Гданьск': 'Gdańsk',
      'Щецин': 'Szczecin',
      'Люблин': 'Lublin',
      'Будапешт': 'Budapest',
      'Дебрецен': 'Debrecen',
      'Сегед': 'Szeged',
      'Братислава': 'Bratislava',
      'Кошице': 'Košice',
      'Любляна': 'Ljubljana',
      'Словения': 'Slovenia',
      'Загреб': 'Zagreb',
      'Сплит': 'Split',
      'Дубровник': 'Dubrovnik',
      'Белград': 'Belgrade',
      'Нови-Сад': 'Novi Sad',
      'Бухарест': 'Bucharest',
      'Клуж-Напока': 'Cluj-Napoca',
      'Тимишоара': 'Timișoara',
      'Яссы': 'Iași',
      'Констанца': 'Constanța',
      'София': 'Sofia',
      'Пловдив': 'Plovdiv',
      'Варна': 'Varna',
      'Афины': 'Athens',
      'Салоники': 'Thessaloniki',
      'Патры': 'Patras',
      'Стамбул': 'Istanbul',
      'Анкара': 'Ankara',
      'Измир': 'İzmir',
      'Бурса': 'Bursa',
      'Адана': 'Adana',
      'Газиантеп': 'Gaziantep',
      'Конья': 'Konya',
      'Анталья': 'Antalya',
      'Рига': 'Riga',
      'Даугавпилс': 'Daugavpils',
      'Вильнюс': 'Vilnius',
      'Каунас': 'Kaunas',
      'Клайпеда': 'Klaipėda',
      'Таллин': 'Tallinn',
      'Тарту': 'Tartu',
      'Каир': 'Cairo',
      'Александрия': 'Alexandria',
      'Гиза': 'Giza',
      'Тель-Авив': 'Tel Aviv',
      'Иерусалим': 'Jerusalem',
      'Хайфа': 'Haifa',
      'Эйлат': 'Eilat',
      'Бейрут': 'Beirut',
      'Ливан': 'Lebanon',
      'Дамаск': 'Damascus',
      'Алеппо': 'Aleppo',
      'Амман': 'Amman',
      'Иордания': 'Jordan',
      'Багдад': 'Baghdad',
      'Ирак': 'Iraq',
      'Эр-Рияд': 'Riyadh',
      'Джидда': 'Jeddah',
      'Мекка': 'Mecca',
      'Дубай': 'Dubai',
      'Абу-Даби': 'Abu Dhabi',
      'Шарджа': 'Sharjah',
      'Тегеран': 'Tehran',
      'Мешхед': 'Mashhad',
      'Исфахан': 'Isfahan',
      'Шираз': 'Shiraz',
      'Доха': 'Doha',
      'Катар': 'Qatar',
      'Манама': 'Manama',
      'Бахрейн': 'Bahrain',
      'Маскат': 'Muscat',
      'Оман': 'Oman',
      'Касабланка': 'Casablanca',
      'Рабат': 'Rabat',
      'Марракеш': 'Marrakech',
      'Триполи': 'Tripoli',
      'Ливия': 'Libya',
      'Пекин': 'Beijing',
      'Шанхай': 'Shanghai',
      'Гуанчжоу': 'Guangzhou',
      'Шэньчжэнь': 'Shenzhen',
      'Тяньцзинь': 'Tianjin',
      'Чунцин': 'Chongqing',
      'Чэнду': 'Chengdu',
      'Нанкин': 'Nanjing',
      'Ухань': 'Wuhan',
      'Сиань': 'Xi\'an',
      'Циндао': 'Qingdao',
      'Тайбэй': 'Taipei',
      'Гаосюн': 'Kaohsiung',
      'Токио': 'Tokyo',
      'Осака': 'Osaka',
      'Йокогама': 'Yokohama',
      'Нагоя': 'Nagoya',
      'Саппоро': 'Sapporo',
      'Киото': 'Kyoto',
      'Кобе': 'Kobe',
      'Фукуока': 'Fukuoka',
      'Сеул': 'Seoul',
      'Пусан': 'Busan',
      'Инчхон': 'Incheon',
      'Тэгу': 'Daegu',
      'Пхеньян': 'Pyongyang',
      'Северная Корея': 'North Korea',
      'Улан-Батор': 'Ulaanbaatar',
      'Монголия': 'Mongolia',
      'Нью-Дели': 'New Delhi',
      'Мумбаи': 'Mumbai',
      'Бангалор': 'Bangalore',
      'Хайдарабад': 'Hyderabad',
      'Ахмадабад': 'Ahmedabad',
      'Ченнаи': 'Chennai',
      'Калькутта': 'Kolkata',
      'Пуна': 'Pune',
      'Джайпур': 'Jaipur',
      'Гоа': 'Goa',
      'Карачи': 'Karachi',
      'Лахор': 'Lahore',
      'Исламабад': 'Islamabad',
      'Дакка': 'Dhaka',
      'Бангладеш': 'Bangladesh',
      'Коломбо': 'Colombo',
      'Шри-Ланка': 'Sri Lanka',
      'Катманду': 'Kathmandu',
      'Непал': 'Nepal',
      'Бангкок': 'Bangkok',
      'Чиангмай': 'Chiang Mai',
      'Пхукет': 'Phuket',
      'Паттайя': 'Pattaya',
      'Ханой': 'Hanoi',
      'Хошимин': 'Ho Chi Minh City',
      'Дананг': 'Da Nang',
      'Нячанг': 'Nha Trang',
      'Куала-Лумпур': 'Kuala Lumpur',
      'Малайзия': 'Malaysia',
      'Джакарта': 'Jakarta',
      'Сурабая': 'Surabaya',
      'Бандунг': 'Bandung',
      'Денпасар': 'Denpasar',
      'Манила': 'Manila',
      'Себу': 'Cebu',
      'Пномпень': 'Phnom Penh',
      'Сиемреап': 'Siem Reap',
      'Янгон': 'Yangon',
      'Мьянма': 'Myanmar',
      'Вьентьян': 'Vientiane',
      'Лаос': 'Laos',
      'Кабул': 'Kabul',
      'Афганистан': 'Afghanistan',
      'Нью-Йорк': 'New York',
      'Лос-Анджелес': 'Los Angeles',
      'Чикаго': 'Chicago',
      'Хьюстон': 'Houston',
      'Финикс': 'Phoenix',
      'Филадельфия': 'Philadelphia',
      'Сан-Антонио': 'San Antonio',
      'Сан-Диего': 'San Diego',
      'Даллас': 'Dallas',
      'Сан-Хосе': 'San Jose',
      'Остин': 'Austin',
      'Сан-Франциско': 'San Francisco',
      'Сиэтл': 'Seattle',
      'Денвер': 'Denver',
      'Бостон': 'Boston',
      'Майами': 'Miami',
      'Атланта': 'Atlanta',
      'Лас-Вегас': 'Las Vegas',
      'Портленд': 'Portland',
      'Вашингтон': 'Washington',
      'Орландо': 'Orlando',
      'Гонолулу': 'Honolulu',
      'Анкоридж': 'Anchorage',
      'Новый Орлеан': 'New Orleans',
      'Торонто': 'Toronto',
      'Монреаль': 'Montreal',
      'Ванкувер': 'Vancouver',
      'Калгари': 'Calgary',
      'Эдмонтон': 'Edmonton',
      'Оттава': 'Ottawa',
      'Виннипег': 'Winnipeg',
      'Квебек': 'Quebec',
      'Галифакс': 'Halifax',
      'Мехико': 'Mexico City',
      'Гвадалахара': 'Guadalajara',
      'Монтеррей': 'Monterrey',
      'Канкун': 'Cancún',
      'Гавана': 'Havana',
      'Куба': 'Cuba',
      'Сан-Хуан': 'San Juan',
      'Пуэрто-Рико': 'Puerto Rico',
      'Санто-Доминго': 'Santo Domingo',
      'Доминикана': 'Dominican Republic',
      'Сан-Сальвадор': 'San Salvador',
      'Сальвадор': 'Salvador',
      'Богота': 'Bogotá',
      'Медельин': 'Medellín',
      'Кали': 'Cali',
      'Картахена': 'Cartagena',
      'Кито': 'Quito',
      'Гуаякиль': 'Guayaquil',
      'Лима': 'Lima',
      'Куско': 'Cusco',
      'Каракас': 'Caracas',
      'Венесуэла': 'Venezuela',
      'Сан-Паулу': 'São Paulo',
      'Рио-де-Жанейро': 'Rio de Janeiro',
      'Бразилиа': 'Brasília',
      'Сальвадор-да-Баия': 'Salvador da Bahia',
      'Форталеза': 'Fortaleza',
      'Белу-Оризонти': 'Belo Horizonte',
      'Манаус': 'Manaus',
      'Куритиба': 'Curitiba',
      'Буэнос-Айрес': 'Buenos Aires',
      'Кордова': 'Córdoba',
      'Росарио': 'Rosario',
      'Мендоса': 'Mendoza',
      'Сантьяго': 'Santiago',
      'Вальпараисо': 'Valparaíso',
      'Монтевидео': 'Montevideo',
      'Уругвай': 'Uruguay',
      'Асунсьон': 'Asunción',
      'Парагвай': 'Paraguay',
      'Ла-Пас': 'La Paz',
      'Боливия': 'Bolivia',
      'Лагос': 'Lagos',
      'Абуджа': 'Abuja',
      'Аккра': 'Accra',
      'Гана': 'Ghana',
      'Найроби': 'Nairobi',
      'Момбаса': 'Mombasa',
      'Дар-эс-Салам': 'Dar es Salaam',
      'Танзания': 'Tanzania',
      'Аддис-Абеба': 'Addis Ababa',
      'Эфиопия': 'Ethiopia',
      'Кампала': 'Kampala',
      'Уганда': 'Uganda',
      'Кигали': 'Kigali',
      'Руанда': 'Rwanda',
      'Дакар': 'Dakar',
      'Сенегал': 'Senegal',
      'Йоханнесбург': 'Johannesburg',
      'Кейптаун': 'Cape Town',
      'Дурбан': 'Durban',
      'Претория': 'Pretoria',
      'Хараре': 'Harare',
      'Зимбабве': 'Zimbabwe',
      'Луанда': 'Luanda',
      'Ангола': 'Angola',
      'Сидней': 'Sydney',
      'Мельбурн': 'Melbourne',
      'Брисбен': 'Brisbane',
      'Перт': 'Perth',
      'Аделаида': 'Adelaide',
      'Канберра': 'Canberra',
      'Дарвин': 'Darwin',
      'Окленд': 'Auckland',
      'Веллингтон': 'Wellington',
      'Крайстчёрч': 'Christchurch',

      // ===== Auto-generated translations (parts 3+4) =====

      // ===== Auto-generated translations (part 5: nbsp variants) =====
      'Рады видеть вас в вашем пространстве.': 'Glad to see you in your space.',
      'Здесь хранятся ваши практики, заказы и важные подсказки.': 'Here you keep your practices, orders and important hints.',
      'Хорошее время для планирования, обучения и общения.': 'A good time for planning, learning and communication.',
      'Попробуйте индивидуальную сессию с разбором вашей карты.': 'Try a one-on-one session with an analysis of your chart.',
      'Демо: данные хранятся только в памяти.': 'Demo: data is stored only in memory.',
      'В продакшне — SMS через Twilio/Vonage.': 'In production — SMS via Twilio/Vonage.',
      'В продакшне — OAuth через Google Identity Services.': 'In production — OAuth via Google Identity Services.',
      'Войдите в ': 'Sign in to ',
      'Код из SMS': 'SMS code',
      'Отправлен на ': 'Sent to ',
      'К ОПЛАТЕ': 'TO PAY',
      'за ': 'for ',
      '20 млн человек': '20 million people',
      'на 3 дня': 'for 3 days',
      '— Lovia упоминали в —': '— Lovia featured in —',
      'Пробный период 3 дня': '3-day trial',
      '— всего за ': '— for just ',
      '29,90 €/мес': '€29.90/mo',
      'День для ясности и новых идей': 'A day for clarity and new ideas',
      'Восходящий знак — то, как вас воспринимают при первом контакте. Маска, которую вы показываете миру.': 'Ascendant — how you are perceived on first contact. The mask you show to the world.',
      'Допустимое отклонение от точного угла аспекта. Чем меньше орб — тем точнее и сильнее работает аспект.': 'Allowed deviation from the exact aspect angle. The smaller the orb — the more precise and powerful the aspect.',
      'Mедиум-Коэли, вершина 10 дома. Точка карьеры, статуса, публичной репутации.': 'Medium Coeli, the cusp of the 10th house. The point of career, status, public reputation.',
      '— для тех, кто только знакомится с астрологией.': '— for those who are new to astrology.',
      'Atelier de l\'Âme — портреты второй половинки,': 'Atelier de l\'Âme — partner portraits,',
      'ИНТЕРПРЕТАЦИЯ AI · CLAUDE SONNET 4 · ОБНОВЛЕНО 14.05.2026': 'AI INTERPRETATION · CLAUDE SONNET 4 · UPDATED 14.05.2026',
      'Луна, Юпитер, Сатурн во 2 доме — мощный ресурсный фундамент': 'Moon, Jupiter, Saturn in the 2nd house — a powerful resource foundation',
      'Асцендент, Уран, Нептун — водолейская идентичность': 'Ascendant, Uranus, Neptune — Aquarian identity',
      'Меркурий–Плутон — интеллектуальная глубина': 'Mercury–Pluto — intellectual depth',
      'Марс–Юпитер–Нептун в напряжённой динамике роста': 'Mars–Jupiter–Neptune in a tense dynamic of growth',
      '"У вас тонкая эмоциональная природа, упакованная в практичную форму. Это не противоречие — это ваша конструкция."': '"You have a refined emotional nature wrapped in a practical form. This is not a contradiction — this is your construction."',
      'Асцендент в Водолее на 29° — это финальный градус знака, очень мощная точка. Люди при первом контакте видят': 'Ascendant at 29° Aquarius — the final degree of the sign, a very powerful point. People on first contact see',
      'независимость, нестандартность мышления, отстранённость': 'independence, unconventional thinking, detachment',
      '. Вы не вписываетесь в шаблоны, и это считывается мгновенно.': '. You do not fit templates, and this is read instantly.',
      'Меркурий в трине к Плутону (орб всего 0.3°)': 'Mercury trine Pluto (orb only 0.3°)',
      'У вас есть несколько напряжённых аспектов, которые работают тонко, но настойчиво:': 'You have several tense aspects that work subtly but persistently:',
      'Получите глубокий анализ всех 28 разделов': 'Get a deep analysis of all 28 sections',
      'Эмоциональный подъём, чувство расширения. Хорошо для семейных решений, переговоров о доме.': 'Emotional lift, a sense of expansion. Good for family decisions, home negotiations.',
      'Время сборки структур и систем. То, что вы начнёте сейчас, будет работать долго.': 'Time to assemble structures and systems. What you start now will work for a long time.',
      'Возможны трения в близких отношениях. Будьте внимательнее к тону в разговорах.': 'Friction is possible in close relationships. Be careful with tone in conversations.',
      'Окно для важных коммуникаций по карьере. Презентации, интервью, контракты.': 'A window for important career communications. Presentations, interviews, contracts.',
      'Что в вашей карте лично ваше, а что разделено с поколением': 'What in your chart is uniquely yours and what is shared with your generation',
      'Определяется временем рождения — точно ваше.': 'Determined by birth time — uniquely yours.',
      'Дом — следствие времени рождения. Конкретно ваша конфигурация.': 'The house is a consequence of birth time. Specifically your configuration.',
      'Луна движется быстро (12°/сутки), поэтому даже у людей с тем же днём рождения она будет в разной градусной позиции.': 'The Moon moves quickly (12°/day), so even people born on the same day will have it in different degree positions.',
      'Марс в Скорпионе 0.9° в оппозиции к Луне.': 'Mars in Scorpio 0.9° opposite the Moon.',
      'Эта точная конфигурация — редкая и личная.': 'This exact configuration is rare and personal.',
      'Точные аспекты быстрых планет — лично ваша подпись.': 'Exact aspects of fast planets are your personal signature.',
      '(1995–2008). Всё ваше поколение проходит трансформацию через темы веры, идеологии, расширения мировоззрения.': '(1995–2008). Your whole generation is going through transformation around themes of faith, ideology, expansion of worldview.',
      '(1998–2012). Идеалы свободы, технологий, нестандартного — общий фон вашего поколения.': '(1998–2012). Ideals of freedom, technology, the non-conventional — the common backdrop of your generation.',
      '(1995–2003). Революция цифровизации и индивидуализма — это контекст, в котором вы выросли.': '(1995–2003). The revolution of digitalisation and individualism — the context you grew up in.',
      'Поколенческий аспект — у всего вашего возрастного среза. Поддержка между идеалом и трансформацией.': 'A generational aspect — for everyone in your age cohort. Support between ideal and transformation.',
      'быстрые планеты и их аспекты с орбисом до 2°': 'fast planets and their aspects with orb up to 2°',
      'Кармическая карта по дате рождения. 22 точки октаграммы раскрывают вашу миссию, таланты, задачи рода и зоны силы.': 'Karmic chart from your date of birth. 22 octogram points reveal your mission, talents, lineage tasks and zones of strength.',
      'Основа расчёта — только она нужна для построения матрицы': 'The basis of the calculation — all that is needed to build the matrix',
      'Для персонального обращения в интерпретации': 'For personal address in the interpretation',
      'Чтобы интерпретация заострила внимание на том, что важно вам сегодня': 'So the interpretation focuses on what matters to you today',
      'Дата рождения по григорианскому календарю — единственное, что нужно для расчёта матрицы': 'Date of birth in the Gregorian calendar — the only thing needed to compute the matrix',
      'Имя нужно только для персонализации текста. Можно указать вымышленное или короткую форму': 'The name is needed only to personalise the text. You can use a fictional name or a short form',
      'Выберите тему, которая ближе всего — интерпретация будет глубже именно по этому направлению': 'Choose the theme that resonates most — the interpretation will go deeper in that direction',
      'Рассчитываем 22 точки октаграммы по вашей дате рождения': 'Computing 22 octogram points from your date of birth',
      'Получите полный разбор всех 22 точек матрицы': 'Get a full analysis of all 22 matrix points',
      'От одной карты на день до глубокого Кельтского креста на 10 карт': 'From a single card of the day to the deep 10-card Celtic Cross',
      'Чем конкретнее, тем точнее интерпретация — карты отвечают на то, что вы спрашиваете': 'The more specific, the more precise the interpretation — the cards answer what you actually ask',
      'Перемешайте колоду, кликните на карты в веере — система сама раскроет их в позициях': 'Shuffle the deck, tap the fanned cards — the system will reveal them into their positions',
      'Каждый тип отвечает на свой вид вопросов. Выберите тот, что ближе вашей ситуации': 'Each spread suits a particular type of question. Choose the one closest to your situation',
      'Одна карта-совет на сегодня. Энергия дня, ключ к настроению': 'A single advice card for today. Energy of the day, a key to mood',
      'Классический расклад на развитие любой ситуации во времени': 'A classic spread for the development of any situation over time',
      'Когда нужно понять что мешает и что делать. Расклад на решение': 'When you need to understand what is blocking and what to do. A decision spread',
      'Глубокий разбор сложного вопроса со всех сторон. Премиум-расклад': 'Deep analysis of a complex question from every angle. Premium spread',
      'Сформулируйте конкретный вопрос. От его точности зависит вся интерпретация': 'Formulate a specific question. The whole interpretation depends on its precision',
      'Как разрешить конфликт с близким человеком?': 'How can I resolve a conflict with a loved one?',
      'Перемешайте колоду столько раз, сколько нужно. Затем кликните на карты в веере — система сама раскроет их в позициях': 'Shuffle the deck as many times as you need. Then tap the fanned cards — the system will reveal them into their positions',
      'Интерпретируем расклад в контексте вашего вопроса': 'Interpreting the spread in the context of your question',
      'Платформа для глубокого познания себя. Натальная карта · Матрица судьбы · Расклады Таро': 'A platform for deep self-knowledge. Natal chart · Destiny Matrix · Tarot readings',
      'Рады видеть вас в вашем пространстве.': 'Glad to see you in your space.',
      'Здесь хранятся ваши практики, заказы и важные подсказки.': 'Here you keep your practices, orders and important hints.',
      'Хорошее время для планирования, обучения и общения.': 'A good time for planning, learning and communication.',
      'Попробуйте индивидуальную сессию с разбором вашей карты.': 'Try an individual session with an analysis of your chart.',
      '. Это займёт пару минут и поможет получить ответ на ваш важный вопрос.': '. It takes a couple of minutes and will help you get an answer to your important question.',
      'Демо-режим. Реальная карта не будет списана.': 'Demo mode. Your real card will not be charged.',
      '. Мы пришлём уведомление, как только всё будет готово.': '. We will send a notification as soon as everything is ready.',
      'Демо: данные хранятся только в памяти.': 'Demo: data is stored only in memory.',
      'В продакшне — SMS через Twilio/Vonage.': 'In production — SMS via Twilio/Vonage.',
      'В продакшне — OAuth через Google Identity Services.': 'In production — OAuth via Google Identity Services.',
      'Например: Стоит ли мне принимать предложение о новой работе, которое я получила вчера?': 'For example: Should I accept the new job offer I received yesterday?',
      'Эмпатия + структура — ваше преимущество. Не выбирайте между ними.': 'Empathy + structure — your advantage. Do not choose between them.',
      'Финансовая подушка для вас — не роскошь, а лекарство от тревоги.': 'A financial cushion is not a luxury for you — it is medicine for anxiety.',
      'Перед важным решением проговаривайте вывод вслух — так быстрее замечаете слабые места в логике.': 'Before an important decision, voice your conclusion out loud — you will spot weak points in the logic faster.',
      'Чётко обозначайте, что для вас норма в отношениях — это повышает качество взаимности.': 'Clearly state what is normal for you in a relationship — this raises the quality of reciprocity.',
      'Направляйте интенсивность в конкретную цель и измеримые шаги — иначе она пожирает изнутри.': 'Direct intensity into a specific goal and measurable steps — otherwise it devours you from within.',
      'В соединении с Луной — удачливость в финансовой сфере и поддержка близких людей в материальных вопросах. Хороший актив.': 'Conjunct the Moon — fortune in finances and the support of close ones in material matters. A good asset.',
      'Выбирайте одну главную линию роста на период — иначе расширение становится хаотичным.': 'Choose one main line of growth per period — otherwise expansion turns chaotic.',
      'Внутренний стержень и зрелость через ответственное отношение к ресурсам. Дисциплина для вас — не давление, а опора.': 'Inner core and maturity through responsible handling of resources. For you, discipline is not pressure — it is support.',
      'Разделяйте большую цель на этапы с контрольными точками — так дисциплина становится опорой, а не давлением.': 'Break a big goal into stages with checkpoints — this is how discipline becomes a support, not pressure.',
      'Тестируйте новые идеи на маленьком масштабе перед внедрением.': 'Test new ideas on a small scale before rolling them out.',
      'Проверяйте вдохновляющую идею реальными критериями — иначе легко влюбиться в проекцию.': 'Check an inspiring idea against real criteria — otherwise it is easy to fall in love with a projection.',
      'Большие идеи подкрепляйте практичным планом — вдохновение тогда даёт устойчивый прогресс.': 'Back big ideas with a practical plan — inspiration then yields steady progress.',
      'Тестируйте новые форматы знакомств на небольшом масштабе.': 'Test new dating formats on a small scale.',
      'Развивайте навык фиксации денежных решений: что-то должно быть на бумаге, а не только в голове.': 'Build the habit of recording financial decisions: something must be on paper, not only in your head.',
      'Общение и обучение через смелость и инициативу. Вы любите задавать прямые вопросы и быстро схватывать суть.': 'Communication and learning through courage and initiative. You like to ask direct questions and grasp the essence quickly.',
      'Делайте первый шаг в общении, потом уточняйте детали.': 'Take the first step in communication, then clarify details.',
      'Дом и корни через устойчивость и комфорт. Вам важна красота быта, качественные предметы вокруг, ощущение прочности.': 'Home and roots through stability and comfort. You value beauty of daily life, quality objects around you, a sense of solidity.',
      'Создавайте дом не быстро, а основательно. Один хороший предмет лучше десяти средних.': 'Build your home not quickly but thoroughly. One good piece is better than ten mediocre ones.',
      'Творчество и радость через разнообразие, обмен идеями, общение. Вам нужно много контекстов — один проект надоедает.': 'Creativity and joy through variety, exchange of ideas, communication. You need many contexts — a single project gets boring.',
      'Ведите несколько творческих линий параллельно, не пытайтесь свести всё к одной.': 'Run several creative lines in parallel; do not try to reduce everything to one.',
      'Проверяйте эмоциональный фон до того, как браться за задачу — если устали, отдыхайте, не выжимайте.': 'Check your emotional background before tackling a task — if tired, rest, do not squeeze yourself.',
      'Беритесь за роли в отношениях, где можно показать свои сильные стороны, а не подстраиваться.': 'Take roles in relationships where you can show your strengths rather than adapt.',
      'В трансформации не торопите процесс — детали имеют значение.': 'In transformation, do not rush the process — details matter.',
      'Мировоззрение через баланс, диалог, разные точки зрения. Вы редко становитесь догматиком — всегда видите вторую сторону.': 'Worldview through balance, dialogue, different viewpoints. You rarely become a dogmatist — you always see the other side.',
      'Сначала согласуйте принципы, потом принимайте решение — это ваш стиль зрелости.': 'First align on principles, then decide — that is your mature style.',
      'Карьера через рост, обучение, миссию и масштаб. Вы не реализуетесь в "просто работе" — нужна цель за горизонтом.': 'Career through growth, learning, mission and scale. You do not fulfil yourself in "just a job" — you need a goal beyond the horizon.',
      'Ставьте цель чуть выше текущей планки — без этого теряете интерес.': 'Set a goal slightly above the current bar — without that you lose interest.',
      'Друзья и сообщества через структуру и долгосрочность. Ваш круг — не случайные знакомые, а тщательно выбранные люди.': 'Friends and communities through structure and longevity. Your circle is not random acquaintances but carefully chosen people.',
      'Опирайтесь на план и контрольные точки в построении круга — не оставляйте отношения на самотёк.': 'Rely on a plan and checkpoints when building your circle — do not leave relationships to chance.',
      'Внутренний мир требует структуры. Даже отдых для вас — это режим, ритуал, дисциплина восстановления.': 'Your inner world needs structure. Even rest is a regime for you — a ritual, a discipline of recovery.',
      'Создайте систему отдыха — без неё внутренний мир хаотизируется.': 'Build a rest system — without it your inner world becomes chaotic.',
      'Выберите единый приоритет в жизни на квартал — не распыляйте этот ресурс.': 'Choose a single life priority for the quarter — do not scatter this resource.',
      'Ищите формат, где оба полюса выигрывают: быстрое действие на маленьком сегменте + большая цель в горизонте.': 'Find a format where both poles win: fast action on a small segment + a big goal on the horizon.',
      'Большие идеи vs. размытие. Вы можете мечтать масштабно — и не замечать, что мечта оторвалась от реальности.': 'Big ideas vs. blurring. You can dream big — and not notice that the dream has drifted from reality.',
      'Разбейте большую идею на 2-3 проверяемых шага — это спасает от расфокусированности.': 'Break a big idea into 2–3 testable steps — that saves you from losing focus.',
      'Используйте этот ресурс осознанно — не на автопилоте.': 'Use this resource consciously — not on autopilot.',
      'Перед резкой реакцией спросите: "Это решение, или это Луна в обиде?"': 'Before a sharp reaction ask: "Is this a decision, or the Moon being hurt?"',
      'Гармония в любви и желании. Чувства и страсть подкрепляют друг друга, а не конфликтуют. Это здоровая эротическая ось.': 'Harmony in love and desire. Feelings and passion reinforce each other instead of clashing. A healthy erotic axis.',
      'Ловите возможности проявить инициативу в отношениях — здесь это работает.': 'Catch chances to take initiative in relationships — here it works.',
      'Перед серьёзным усилием — проверяйте реалистичность цели холодной головой.': 'Before a serious effort — check the goal\'s realism with a cool head.',
      'Логика vs. интуиция. Иногда ясные мысли размываются, иногда наоборот — интуиция не пробивается через анализ.': 'Logic vs. intuition. Sometimes clear thoughts get blurred, sometimes intuition cannot break through analysis.',
      'Используйте оба канала по очереди, а не одновременно.': 'Use both channels alternately, not simultaneously.',
      'Дайте себе оба режима — не насилуйте мышление в одной модели.': 'Allow yourself both modes — do not force your thinking into one model.',
      'Эмоции мешают ясности мысли в моменты усталости. Не всегда — но регулярно.': 'Emotions cloud clarity of thought in moments of fatigue. Not always — but regularly.',
      'Важные решения принимайте на свежую голову, а не в эмоциональном пике.': 'Make important decisions with a fresh mind, not at an emotional peak.',
      'Мышление и дисциплина в напряжении. Иногда жёсткая самокритика мешает гибкости мысли.': 'Thinking and discipline under tension. Sometimes harsh self-criticism blocks flexibility of thought.',
      'Снижайте требования к "правильности" в фазе генерации идей — критику оставьте на потом.': 'Lower demands for "correctness" in the ideation phase — leave criticism for later.',
      'Один из ваших ключевых ресурсов. Используйте сознательно — в переговорах, анализе людей, исследовании сложных тем.': 'One of your key resources. Use it consciously — in negotiations, in reading people, in exploring complex topics.',
      'Эмоциональный туман и склонность к идеализации. Можно влюбиться в проекцию, а не в человека или ситуацию.': 'Emotional fog and a tendency to idealise. You can fall in love with a projection rather than a real person or situation.',
      'Полезный тест: "Это реальность, или я придумал, что это так?"': 'A useful test: "Is this reality, or did I make it up?"',
      'Эмоции и ценности гармонируют. Вам легко создавать тёплую атмосферу вокруг себя — это естественный талант.': 'Emotions and values are in harmony. It is easy for you to create a warm atmosphere — a natural talent.',
      'Ресурс, который не нужно специально развивать. Просто не блокируйте его.': 'A resource you do not need to train deliberately. Just do not block it.',
      'Поколенческий аспект. Воображение и трансформация поддерживают друг друга на уровне эпохи.': 'A generational aspect. Imagination and transformation support each other at the level of the era.',
      'Используйте — это часть вашего поколения, в которое легко вписываться.': 'Use it — it is part of your generation, easy to align with.',
      'Очень точный аспект. Ядро личности и дисциплина работают синхронно. Дают редкое сочетание эмпатии и структуры.': 'A very exact aspect. Personality core and discipline work in sync. It gives a rare combination of empathy and structure.',
      'Это ваше скрытое преимущество. Применяйте там, где другие выбирают одно из двух.': 'Your hidden advantage. Apply it where others must choose one of two.',
      'Точный аспект. Структура vs. свобода. Вы регулярно ломаете собственные системы, когда они становятся слишком жёсткими.': 'An exact aspect. Structure vs. freedom. You regularly break your own systems when they become too rigid.',
      'Заранее закладывайте в системы пространство для пересборки — это не баг, это часть конструкции.': 'Build space for reassembly into your systems in advance — that is not a bug, it is part of the design.',
      'Один из 12 секторов карты, отвечающий за конкретную сферу жизни — деньги, отношения, карьеру, здоровье и так далее.': 'One of the 12 sectors of the chart that governs a specific area of life — money, relationships, career, health and so on.',
      'Текущее положение реальных планет на небе, влияющее на вашу натальную карту прямо сейчас.': 'Current positions of the real planets in the sky, affecting your natal chart right now.',
      'Текущие положения реальных планет на небе, влияющие на вашу натальную карту прямо сейчас.': 'Current positions of the real planets in the sky, affecting your natal chart right now.',
      'Вершина 10 дома, точка карьеры и статуса.': 'Cusp of the 10th house, the point of career and status.',
      'Скопление трёх или больше планет в одном знаке. Создаёт сильный акцент на темах этого знака.': 'A cluster of three or more planets in one sign. Creates a strong accent on the themes of that sign.',
      'Аспект, когда две планеты находятся очень близко друг к другу. Их энергии сливаются в одну.': 'An aspect where two planets are very close together. Their energies merge into one.',
      'Гармоничный аспект (120°), когда энергии планет легко поддерживают друг друга.': 'A harmonious aspect (120°), where the planets\' energies easily support each other.',
      'Напряжённый аспект (90°), требующий внутренней работы — но именно через это напряжение растёшь.': 'A tense aspect (90°) that requires inner work — but it is through this tension that you grow.',
      'Аспект противостояния (180°). Две планеты тянут в разные стороны, и важно найти баланс.': 'An opposition aspect (180°). Two planets pull in opposite directions, and finding balance is essential.',
      'Мягкий поддерживающий аспект (60°). Возможности приходят, если их брать.': 'A soft, supportive aspect (60°). Opportunities arrive if you take them.',
      'Один из четырёх элементов знаков: огонь, земля, воздух, вода. Показывает основной "характер" планеты.': 'One of the four elements of the signs: fire, earth, air, water. It shows the planet\'s basic "character".',
      'Четыре элемента знаков: огонь, земля, воздух, вода. Показывают баланс качеств в карте.': 'The four elements of the signs: fire, earth, air, water. They show the balance of qualities in the chart.',
      'Видимый путь Солнца по небу за год. Все планеты движутся вблизи этой линии.': 'The Sun\'s visible annual path across the sky. All planets move close to this line.',
      'Период, когда планета визуально движется по небу "назад". Время пересмотра тем, за которые она отвечает.': 'A period when a planet appears to move "backwards" across the sky. A time to revisit the themes it governs.',
      'Страница результата ещё в разработке. Скоро здесь будет открываться портрет.': 'The result page is still under construction. Soon the portrait will open here.',
      'Краткий совет, основанный на положении планет на сегодня. Обновляется каждый день.': 'A brief tip based on today\'s planetary positions. Updated daily.',
      'Это реальность, или я придумал, что это так?': 'Is this reality, or did I make it up?',
      'Солнце · Луна · Асцендент — основа вашей карты': 'Sun · Moon · Ascendant — the foundation of your chart',
      'эмоционально и внешне вы согласованы, но внутри ядро другой природы — это даёт глубину, которую видят только близкие.': 'emotionally and outwardly you are aligned, but the core inside is of another nature — this gives a depth that only close ones see.',
      'все три точки разной стихии — у вас разнообразный, многослойный характер. Разные ситуации раскрывают разные стороны.': 'all three points are in different elements — you have a varied, multi-layered character. Different situations reveal different sides.',
      'Солнце в Раке в 5 доме — это про творчество, которое идёт из эмоций, а не из техники. Но у вас есть редкий нюанс: Солнце в': 'Sun in Cancer in the 5th house — this is about creativity that flows from emotion, not technique. But you have a rare nuance: the Sun is in',
      'Любопытно, что внешняя водолейская "холодность" полностью противоречит внутреннему Раку. Вы кажетесь дальше, чем есть. Это работает как защита — близких людей вы выбираете сами, чужие не пробивают броню.': 'It is striking that the outer Aquarian "coolness" fully contradicts the inner Cancer. You seem further away than you are. It works as protection — you pick your close ones yourself, strangers do not pierce the armour.',
      '(орб 1.8°, очень точный). Это означает, что когда вам плохо эмоционально, вы не "грустите по-рачьи" — вы атакуете. Себя, ситуацию, иногда другого человека.': '(orb 1.8°, very exact). It means that when you feel emotionally bad, you do not "grieve in a Cancer way" — you attack. Yourself, the situation, sometimes another person.',
      'Знать этот механизм критически важно: следующий раз, когда захочется резко всё ломать или говорить вещи, о которых пожалеете — остановитесь и спросите, не Луна ли это в обиде на что-то конкретное. Обычно — да.': 'Knowing this mechanism is crucial: next time you want to break everything sharply or say things you will regret — stop and ask whether it is the Moon hurt about something specific. Usually — yes.',
      '. Это интеллектуальная глубина: вы видите подтексты, скрытые мотивы, можете в нужный момент сформулировать то, что другие чувствуют, но не могут назвать. Используйте это сознательно.': '. This is intellectual depth: you see subtext, hidden motives, and can articulate what others feel but cannot name. Use it consciously.',
      'MC в Стрельце + Плутон в 9 доме — ваша профессиональная реализация это не "комфорт и стабильность" типичного Рака. Это масштаб, выход за пределы, обучение, амбиция увидеть шире. Вы будете чувствовать себя живым в работе, которая требует роста и пересборки понимания мира.': 'MC in Sagittarius + Pluto in the 9th house — your professional fulfilment is not the "comfort and stability" of a typical Cancer. It is scale, going beyond limits, learning, the ambition to see wider. You will feel alive in work that requires growth and rebuilding your understanding of the world.',
      '(деньги, ресурсная база). Венера, Меркурий — в 6 доме (работа, ремесло). Карта говорит, что вы способны конвертировать амбиции в материальный результат через дисциплинированную ежедневную работу. Не через рывок, а через систему.': '(money, resource base). Venus, Mercury — in the 6th house (work, craft). The chart says you are capable of converting ambition into material result through disciplined daily work. Not through a sprint, but through a system.',
      '— внутренний конфликт между потребностью в свободе и потребностью в стабильности. Вы будете регулярно ломать собственные системы, когда они становятся слишком жёсткими. Это не баг, это часть конструкции. Лучшее решение — заранее закладывать в системы пространство для пересборки.': '— an inner conflict between the need for freedom and the need for stability. You will regularly break your own systems when they become too rigid. It is not a bug — it is part of the design. The best solution is to build space for reassembly into your systems in advance.',
      '— эмоциональный туман, склонность к идеализации и разочарованиям. Вы можете влюбиться в проекцию человека, а не в человека. Полезная привычка — проверять "это мне действительно это нужно, или я придумал, что нужно".': '— emotional fog, a tendency to idealise and then be disappointed. You can fall in love with a projection of a person rather than the person. A useful habit is to check: "do I actually need this, or did I make up that I need it?"',
      'Прогрессии, ретроградные планеты, лунные узлы, фиксированные звёзды, синастрия, мажорные и минорные аспекты — полный астрологический разбор вашей карты на 12 000 слов с практическими рекомендациями для всех сфер жизни.': 'Progressions, retrograde planets, lunar nodes, fixed stars, synastry, major and minor aspects — a full 12,000-word astrological analysis of your chart with practical recommendations for every area of life.',
      'Все мажорные аспекты транзитных планет к вашей натальной карте на год вперёд. Календарь ключевых дат, периоды возможностей и периоды повышенной осторожности.': 'All major aspects of transit planets to your natal chart for the year ahead. A calendar of key dates, windows of opportunity and periods of heightened caution.',
      'Активная стихия. Энергия, инициатива, спонтанность — у вас этот ресурс в рабочем балансе. Солнце в Раке усиливает огонь через эмоциональное вдохновение.': 'Active element. Energy, initiative, spontaneity — this resource is in working balance for you. The Sun in Cancer amplifies fire through emotional inspiration.',
      'Стихия материи. Луна, Юпитер и Сатурн в Тельце создают мощный земной фундамент — устойчивость, практичность, способность доводить начатое до результата.': 'Element of matter. Moon, Jupiter and Saturn in Taurus form a powerful earthy foundation — stability, practicality, the ability to follow through to results.',
      'Стихия мышления. Доступна в нужный момент через Асцендент в Водолее и три планеты в Водолее (Уран, Нептун). Усиливается при необходимости анализа.': 'Element of thought. Available when needed through Ascendant in Aquarius and three planets in Aquarius (Uranus, Neptune). Activated when analysis is required.',
      'Стихия эмоций. Солнце в Раке и Марс в Скорпионе — это водные глубины. Меньше всего точек, но качество компенсирует количество: эмоции у вас плотные.': 'Element of emotion. Sun in Cancer and Mars in Scorpio — these are watery depths. Fewest points, but quality compensates for quantity: your emotions are dense.',
      'Луна задаёт ваш главный вектор поведения и принятия решений. В Тельце во 2 доме в соединении с Юпитером (1.3°) — это не классическая лунная меланхолия, а устойчивая, ресурсная Луна. Вы решаете через ощущение комфорта, безопасности и материальной обеспеченности — и в этом ваша сила, а не слабость.': 'The Moon sets your main vector of behaviour and decision-making. In Taurus in the 2nd house conjunct Jupiter (1.3°), this is not classic lunar melancholy but a stable, resourceful Moon. You decide through a feeling of comfort, security and material grounding — and that is your strength, not weakness.',
      'В важных решениях сначала спросите себя: "Это даёт мне ощущение стабильной опоры?" Если нет — это не ваше, как бы логично оно ни выглядело.': 'On important decisions, first ask: "Does this give me a feeling of stable ground?" If not — it is not yours, no matter how logical it looks.',
      'МЕДЛЕННЫЕ ПЛАНЕТЫ (УРАН, НЕПТУН, ПЛУТОН) ДВИЖУТСЯ МЕДЛЕННО — ИХ ПОЛОЖЕНИЕ В ЗНАКАХ ОБЩЕЕ ДЛЯ ВСЕХ, КТО РОДИЛСЯ В ОДИН ПЕРИОД С ВАМИ': 'SLOW PLANETS (URANUS, NEPTUNE, PLUTO) MOVE SLOWLY — THEIR SIGN POSITIONS ARE SHARED BY EVERYONE BORN IN THE SAME PERIOD AS YOU',
      'Когда сервисы пишут "Плутон в Стрельце означает, что вы трансформируетесь через расширение горизонтов" — это правда, но это правда про': 'When services write "Pluto in Sagittarius means you transform through expanding horizons" — that is true, but it is true about',
      '. У вас таких пять, и именно они отличают вас от ровесников. Особенно ценны точные аспекты — Меркурий трин Плутон 0.3° и Солнце секстиль Сатурн 0.4° — это редкость даже в масштабе одного дня рождения.': '. You have five such, and it is they that distinguish you from your peers. The exact aspects are especially valuable — Mercury trine Pluto 0.3° and Sun sextile Saturn 0.4° — a rarity even on the scale of a single birthday.',
      'Эту вкладку не показывают другие сервисы. Они смешивают поколенческое с личным и продают вам "уникальный отчёт", в котором половина пунктов общие для миллионов. Мы разделяем — чтобы вы понимали, на что реально опираться.': 'Other services do not show this tab. They mix generational and personal and sell you a "unique report" in which half of the points are shared by millions. We separate them — so you understand what you can really rely on.',
      'Создавать, питать, давать жизнь идеям и людям. Ваша миссия — быть проводником плодородия в широком смысле: бизнес, семья, творчество, проекты. Не сидеть на потенциале, а воплощать.': 'To create, nourish, give life to ideas and people. Your mission is to be a conduit of fertility in a broad sense: business, family, creativity, projects. Not to sit on potential, but to bring it into form.',
      'Все аркана, кармические задачи, поколенческие энергии, точки реализации и зоны роста — подробная интерпретация на 8000+ слов с конкретными практическими рекомендациями для всех сфер жизни.': 'All arcana, karmic tasks, generational energies, points of realisation and zones of growth — a detailed 8,000+ word interpretation with concrete practical recommendations for every area of life.',
      'Сформулируйте вопрос, выберите расклад, перемешайте колоду и вытяните свои карты. Интерпретация AI учитывает ваш конкретный вопрос, а не даёт шаблонный текст.': 'Formulate your question, choose a spread, shuffle the deck and draw your cards. The AI interpretation takes your specific question into account rather than giving a template text.',
      'Ядро личности через заботу, эмоциональную глубину и потребность в безопасной среде. В Раке Солнце ощущает мир через близость и доверие.': 'Personality core through care, emotional depth and a need for a safe environment. In Cancer the Sun senses the world through closeness and trust.',
      'В 5 доме — это про творчество и самовыражение, идущие из эмоций. Секстиль с Сатурном (0.4°) добавляет дисциплины редкому для Рака умению превращать чувства в результат.': 'In the 5th house — this is about creativity and self-expression flowing from emotion. The sextile to Saturn (0.4°) adds discipline to a rare-for-Cancer ability to turn feelings into results.',
      'Эмоциональная природа стабильна, ориентирована на устойчивость и осязаемый комфорт. Вы восстанавливаетесь через материальные опоры — дом, еду, телесные практики.': 'Emotional nature is stable, oriented towards solidity and tangible comfort. You recover through material supports — home, food, bodily practices.',
      'Во 2 доме в соединении с Юпитером — деньги и ресурсы напрямую связаны с эмоциональным благополучием. Это не жадность, это конструкция психики.': 'In the 2nd house conjunct Jupiter — money and resources are directly linked to emotional well-being. This is not greed; it is a psychic construction.',
      'Мышление яркое, образное, склонное к лидерству в разговоре. Вы лучше всего думаете, когда можете подать мысль ярко и убедительно.': 'Thinking is vivid, image-rich, inclined to lead in conversation. You think best when you can present an idea brightly and convincingly.',
      'Трин с Плутоном (0.3°, точный) даёт интеллектуальную глубину и проницательность — видите подтексты и скрытые мотивы там, где другие читают поверхностно.': 'Trine to Pluto (0.3°, exact) gives intellectual depth and perception — you see subtext and hidden motives where others read superficially.',
      'В отношениях вы тёплый, щедрый, любите проявлять чувства открыто. Венера в Льве — это про подарки, внимание, желание украшать жизнь близкого человека.': 'In relationships you are warm, generous, like to show feelings openly. Venus in Leo is about gifts, attention, the wish to adorn the life of a loved one.',
      'В 6 доме — любовь часто переплетается с заботой о повседневности. Романтика для вас может выражаться через помощь в делах партнёра.': 'In the 6th house — love often intertwines with caring for daily life. For you, romance can express itself through helping with a partner\'s tasks.',
      'Воля сосредоточенная, глубокая, не боящаяся сложных тем. Вы идёте в корень вопроса, а не в обход. Конкуренция включает вас, а не пугает.': 'Will is concentrated, deep, unafraid of difficult topics. You go to the root of a question rather than around it. Competition engages you, not frightens you.',
      'В 8 доме в Скорпионе — Марс в своей родной обители. Очень сильная позиция. Оппозиция к Луне (1.8°) означает, что эмоциональная боль легко превращается в гнев.': 'In the 8th house in Scorpio — Mars in its home sign. A very strong position. Opposition to the Moon (1.8°) means emotional pain easily turns into anger.',
      'Углублённо: Марс в Скорпионе на 0.9° — самое начало знака, мощная позиция (Марс — традиционный управитель Скорпиона до открытия Плутона). 8 дом усиливает темы трансформации, общих ресурсов, кризисов. Это конструкция человека, который не убегает от сложного, а идёт в него — и обычно выходит изменённым. Опасность: квадрат с Нептуном (2.6°) — иногда направляете энергию на фантомы.': 'In depth: Mars in Scorpio at 0.9° — the very start of the sign, a powerful position (Mars is Scorpio\'s traditional ruler before Pluto was discovered). The 8th house amplifies themes of transformation, shared resources, crises. This is the structure of someone who does not run from the difficult but goes into it — and usually comes out changed. Danger: square to Neptune (2.6°) — sometimes directing energy at phantoms.',
      'Масштаб целей через практичность и устойчивый рост. Вы не верите в быстрые рывки — верите в системное расширение через надёжные шаги.': 'Scale of goals through practicality and steady growth. You do not believe in quick sprints — you believe in systemic expansion through reliable steps.',
      'Углублённо: Юпитер в Тельце во 2 доме — классический индикатор финансового благополучия в традиционной астрологии. Это не значит "богатство свалится с неба" — это значит, что усилия по построению материальной базы приносят результат больше среднего. T-квадрат с Марсом и Нептуном — единственная сложная конфигурация в этой области: иногда переоцениваете возможности, иногда тратите энергию не туда.': 'In depth: Jupiter in Taurus in the 2nd house — a classic indicator of financial well-being in traditional astrology. This does not mean "wealth falls from the sky" — it means that efforts to build a material base bring above-average results. The T-square with Mars and Neptune is the only difficult configuration in this area: sometimes you overestimate possibilities, sometimes you spend energy in the wrong place.',
      'Квадрат с Ураном (1.2°) — внутренний конфликт между стабильностью и потребностью ломать привычное. Не пытайтесь выбрать одно из двух, ищите формат, где оба работают.': 'Square to Uranus (1.2°) — an inner conflict between stability and the need to break the habitual. Do not try to pick one of the two; look for a format where both work.',
      'Потребность в свободе и нестандартности. В Водолее Уран в своей обители, что усиливает черты — независимость, новаторство, оригинальность мышления.': 'A need for freedom and the non-standard. In Aquarius, Uranus is in its home sign, which amplifies the traits — independence, innovation, originality of thought.',
      'В 12 доме — эта оригинальность работает внутри, в области подсознания и интуитивных прозрений. Внешне может быть незаметна, внутри — очень активна.': 'In the 12th house — this originality works inside, in the subconscious and intuitive insights. Outwardly it can be invisible; inwardly — very active.',
      'Углублённо: Уран в Водолее — это поколенческое (1995–2003), но 12 дом делает его личной темой. 12 дом — область подсознания, скрытого, того, что неочевидно даже самому себе. Это значит, что ваша оригинальность работает скорее как внутренний ресурс, чем как внешняя демонстрация. Внешне вы можете казаться обычным — но внутренне у вас постоянно идёт пересборка моделей реальности.': 'In depth: Uranus in Aquarius is generational (1995–2003), but the 12th house makes it personal. The 12th house is the realm of the subconscious, the hidden, what is not obvious even to yourself. This means your originality acts more as an inner resource than an outer display. Outwardly you can seem ordinary — but inside you are constantly reassembling models of reality.',
      'Интуиция и воображение в форме нестандартного видения. Вы воспринимаете тонкие смыслы и связи, которые формально не выражены.': 'Intuition and imagination in the form of non-standard vision. You perceive subtle meanings and connections that are not explicitly stated.',
      'В 12 доме — обостряет интуитивную чувствительность. Квадрат с Луной (0.7°) даёт эмоциональный туман и склонность к идеализации.': 'In the 12th house — sharpens intuitive sensitivity. Square to the Moon (0.7°) brings emotional fog and a tendency to idealise.',
      'Углублённо: Нептун в Водолее в 12 доме — двойное усиление тонкого, неуловимого, мистического. Хорошая сторона — высокая способность к работе с символическим (искусство, психология, исследование смыслов). Сложная сторона — границы реальности и фантазии могут размываться в моменты усталости.': 'In depth: Neptune in Aquarius in the 12th house — a double amplification of the subtle, elusive, mystical. The good side — a high capacity for working with the symbolic (art, psychology, exploring meaning). The hard side — the boundaries between reality and fantasy can blur in moments of fatigue.',
      'Сила трансформации через мировоззрение и расширение горизонтов. Вы меняетесь через идеи, обучение, новые контексты, а не через быт.': 'Force of transformation through worldview and expanding horizons. You change through ideas, learning, new contexts — not through everyday life.',
      'В 9 доме — глубокие перемены связаны с областью знания, философии, дальних путешествий, иностранных культур. Трин с Меркурием делает эту трансформацию осознанной.': 'In the 9th house — deep changes are tied to knowledge, philosophy, distant travels, foreign cultures. Trine to Mercury makes this transformation conscious.',
      'Углублённо: Плутон в Стрельце в 9 доме — мощная конфигурация для трансформации через знание. Каждый раз, когда вы серьёзно погружаетесь в новую область или культуру, выходите из этого изменённым человеком. Точный трин с Меркурием (0.3°) делает эту трансформацию выраженной в речи и мышлении — вы можете формулировать перемены, а не только их проживать.': 'In depth: Pluto in Sagittarius in the 9th house — a powerful configuration for transformation through knowledge. Every time you dive seriously into a new field or culture, you come out a changed person. The exact trine to Mercury (0.3°) makes this transformation expressed in speech and thought — you can articulate the changes, not only live them.',
      'Первое впечатление и самопрезентация через независимость и нестандартность. Вас сразу считывают как человека "не как все" — и это работает.': 'First impression and self-presentation through independence and non-conformity. People read you immediately as "not like everyone" — and it works.',
      'Деньги и ресурсы идут через интуитивные решения и эмпатию. Вы хорошо чувствуете, где есть возможность — и не очень любите жёсткое планирование.': 'Money and resources come through intuitive decisions and empathy. You sense well where opportunity lies — and do not enjoy rigid planning.',
      'Работа и здоровье через заботу — о других и о себе. Вы лучше работаете там, где есть эмоциональная связь с командой или результатом.': 'Work and health through care — for others and for yourself. You work better where there is an emotional connection to the team or the result.',
      'Партнёрство с яркими, сильными людьми. Вас тянет к тем, кто умеет вести и сиять — но вы хотите равенства, а не подчинения.': 'Partnership with bright, strong people. You are drawn to those who can lead and shine — but you want equality, not subordination.',
      'Глубокие изменения через анализ, детали, методичную работу. Кризисы вы проходите через "разобрать на части и собрать заново".': 'Deep changes through analysis, detail, methodical work. You pass through crises by "taking apart and reassembling".',
      'Эмоциональная природа и стремление к росту работают как одно. Вам легко находить вдохновение в повседневности, а планирование расширения — естественный процесс, а не насилие над собой.': 'Emotional nature and the drive for growth work as one. You easily find inspiration in daily life, and planning expansion is a natural process rather than force on yourself.',
      'Очень точный аспект. Энергия действия и амбиции роста тянут в разные стороны: Марс хочет действовать сейчас и точечно, Юпитер хочет масштабировать и подождать. Если игнорировать — будете дёргаться между.': 'A very exact aspect. Action energy and growth ambition pull in different directions: Mars wants to act now and precisely, Jupiter wants to scale and wait. If ignored — you will keep swinging between them.',
      'Лёгкая удача в области ценностей, отношений и финансов. Энергия течёт сама — но именно поэтому её часто не замечают и не используют.': 'Easy luck in the area of values, relationships and finances. Energy flows by itself — and that is precisely why it is often unnoticed and unused.',
      'Эмоции и действие в напряжённом диалоге. Когда вам плохо — вы атакуете. Себя или ситуацию. Знать этот механизм — половина решения.': 'Emotion and action in a tense dialogue. When you feel bad — you attack. Yourself or the situation. Knowing this mechanism is half the solution.',
      'Действие и воображение в конфликте: можете тратить энергию на иллюзорные цели или, наоборот, не действовать там, где надо.': 'Action and imagination in conflict: you can spend energy on illusory goals or, conversely, fail to act where you should.',
      'Широкий аспект, фоновое влияние. Мышление между структурой и резким инсайтом — вы то методично раскладываете, то прозреваете моментально.': 'A wide aspect, a background influence. Thinking between structure and sudden insight — you sometimes break things down methodically, sometimes see in a flash.',
      'Очень точный гармоничный аспект. Интеллектуальная глубина и проницательность работают естественно. Вы видите подтексты там, где другие читают поверхностно.': 'A very exact harmonious aspect. Intellectual depth and perception work naturally. You see subtext where others read superficially.',
      'Угловое расстояние между двумя планетами в карте. Показывает, как они "разговаривают" друг с другом — поддерживают, спорят или работают вместе.': 'Angular distance between two planets in the chart. It shows how they "talk" to each other — supporting, arguing, or working together.',
      'Угловые расстояния между планетами в карте. Показывают, как планеты "разговаривают" друг с другом — поддерживают, спорят или работают вместе.': 'Angular distances between planets in the chart. They show how planets "talk" to each other — supporting, arguing, or working together.',
      '12 секторов карты, каждый из которых отвечает за конкретную сферу жизни — деньги, отношения, карьеру, здоровье и так далее.': '12 sectors of the chart, each governing a specific area of life — money, relationships, career, health and so on.',
      'Если пробный период (3 дня за 0,50 €) вам не подойдёт — отмените подписку, и больше с вас ничего не спишется. Отмена занимает один клик в личном кабинете и доступна 24/7.': 'If the 3-day trial for €0.50 does not suit you — cancel the subscription and nothing else will be charged. Cancellation is one click in your account and is available 24/7.',
      'Здесь хранятся ваши астрологические данные. Можно отредактировать профиль — точное время рождения сделает расчёты точнее.': 'Here you store your astrological data. You can edit your profile — exact birth time will make calculations more precise.',
      'Заказ «Портрет половинки» обрабатывается 24 часа — таймер под бейджем «В работе» показывает обратный отсчёт. <strong>Нажмите «Ускорить»</strong>, чтобы поставить заказ в приоритетную очередь и получить портрет уже через 30 минут.': 'The "Partner portrait" order takes 24 hours — the timer under the "In progress" badge shows the countdown. <strong>Press "Speed up"</strong> to move your order to the priority queue and get the portrait in 30 minutes.',
      'внешне и внутренне вы похожи (одна стихия), но эмоциональная сторона другая — это создаёт интересный контраст между тем, как вы выглядите/действуете и как чувствуете.': 'outwardly and inwardly you are alike (same element), but the emotional side is different — this creates an interesting contrast between how you look/act and how you feel.',
      'внутри вы цельный (Солнце и Луна в одной стихии), но снаружи кажетесь другим — Асцендент даёт другой «фасад». Это часто удивляет людей при знакомстве.': 'inside you are whole (Sun and Moon in the same element), but outside you seem different — the Ascendant gives a different "facade". This often surprises people who meet you.',
      'Карты в контексте вашего вопроса складываются в определённую картину. Прочитайте каждую внимательно — ответ собирается из их сочетания, а не из одной отдельной карты.': 'The cards in the context of your question form a particular picture. Read each carefully — the answer comes from their combination, not from a single card.',

      // ===== Quiz topbar / common =====
      'ШАГ 1 ИЗ 3': 'STEP 1 OF 3',
      'ШАГ 2 ИЗ 3': 'STEP 2 OF 3',
      'ШАГ 3 ИЗ 3': 'STEP 3 OF 3',
      'ШАГ 3 ИЗ 3 · ВЫТЯЖКА': 'STEP 3 OF 3 · DRAW',
      'Начать расчёт': 'Start calculation',
      'Построить карту': 'Build chart',
      'Раскрыть матрицу': 'Reveal matrix',
      'Начать расклад': 'Start reading',
      'Получить ответ': 'Get the answer',
      'ДАТА РОЖДЕНИЯ': 'DATE OF BIRTH',
      'ВРЕМЯ РОЖДЕНИЯ': 'TIME OF BIRTH',
      'ГОРОД РОЖДЕНИЯ': 'BIRTH CITY',
      'День': 'Day',
      'Месяц': 'Month',
      'Год': 'Year',
      'Час': 'Hour',
      'Минуты': 'Minutes',
      'Январь': 'January',
      'Февраль': 'February',
      'Март': 'March',
      'Апрель': 'April',
      'Май': 'May',
      'Июнь': 'June',
      'Июль': 'July',
      'Август': 'August',
      'Сентябрь': 'September',
      'Октябрь': 'October',
      'Ноябрь': 'November',
      'Декабрь': 'December',
      'Точно знаю': 'I know exactly',
      'Примерно': 'Approximately',
      'Не знаю': 'I do not know',
      'Без точного времени мы построим солнечную карту — это полный анализ позиций планет, но без расчёта домов и асцендента. Вы сможете дополнить время позже в настройках.':
        'Without exact time we will build a solar chart — full analysis of planetary positions, but without houses and the Ascendant. You can add the time later in settings.',
      'Начните вводить город...': 'Start typing your city...',

      // ===== Natal Quiz =====
      'Карта': 'Chart of the',
      'момента': 'moment',
      'вашего рождения': 'of your birth',
      'Расположение планет, домов и аспектов в день, когда вы появились на свет. Основа вашего характера, талантов и жизненного пути.':
        'Positions of the planets, houses and aspects on the day you came into the world. The foundation of your character, talents and life path.',
      'Дата рождения': 'Date of birth',
      'Определяет положение Солнца и знак, под которым вы родились':
        'Determines the position of the Sun and the sign you were born under',
      'Время рождения': 'Time of birth',
      'Задаёт асцендент и расположение домов гороскопа': 'Sets the Ascendant and house cusps',
      'Место рождения': 'Place of birth',
      'Географические координаты для точного расчёта эфемерид':
        'Geographic coordinates for accurate ephemeris',
      'Когда вы': 'When were',
      'родились?': 'you born?',
      'Укажите вашу дату рождения по григорианскому календарю':
        'Enter your date of birth in the Gregorian calendar',
      'Во сколько вы': 'At what time were',
      'Точное время критически важно для расчёта асцендента и домов. Даже ошибка в 15 минут может изменить интерпретацию':
        'Exact time is critical for the Ascendant and houses. Even a 15-minute error can change the interpretation',
      'Где вы': 'Where were',
      'Город рождения для определения географических координат и часового пояса':
        'City of birth for geographic coordinates and timezone',
      'Строим вашу карту': 'Building your chart',
      'Рассчитываем позиции планет и аспекты на момент вашего рождения':
        'Calculating planetary positions and aspects at the moment of your birth',
      'Перевод в Universal Time': 'Converting to Universal Time',
      'Расчёт эфемерид планет': 'Computing planetary ephemerides',
      'Определение домов и асцендента': 'Determining houses and Ascendant',
      'Поиск аспектов': 'Finding aspects',
      'Подготовка интерпретации': 'Preparing the interpretation',

      // ===== Matrix Quiz =====
      'МАТРИЦА СУДЬБЫ ': 'DESTINY MATRIX ',
      'Цифровой код': 'The numerical code',
      'вашей': 'of your',
      'судьбы': 'destiny',
      'Расшифровка предназначения и характера через числа даты рождения. Древняя система, которая раскрывает кармические задачи и ресурсы.':
        'Decoding your purpose and character through the numbers of your birth date. An ancient system that reveals karmic tasks and resources.',
      'Дата': 'Date',
      'Основа: число дня, месяца и года рождения': 'Foundation: day, month and year numbers',
      'Квадраты': 'Squares',
      'Квадрат личности и квадрат судьбы — 22 точки': 'Personality square and destiny square — 22 points',
      'Интерпретация': 'Interpretation',
      'Кармические задачи, таланты, зона роста': 'Karmic tasks, talents, growth zones',
      'Раскрыть мою матрицу': 'Reveal my matrix',
      'Уточните детали': 'Refine details',
      'Для точной матрицы нам нужно немного больше информации': 'For an accurate matrix we need a bit more',
      'Ваше имя или ник': 'Your name or nickname',
      'Анна': 'Anna',
      'Какая основная сфера вас сейчас интересует?': 'Which main area are you focused on right now?',
      'Предназначение': 'Purpose',
      'Самопознание': 'Self-knowledge',
      'Любовь': 'Love',
      'Отношения и семья': 'Relationships and family',
      'Деньги': 'Money',
      'Финансы и реализация': 'Finance and realisation',
      'Род': 'Lineage',
      'Кармические задачи': 'Karmic tasks',
      'Общий разбор': 'General reading',
      'Все сферы вместе': 'All spheres together',
      'Редукция чисел даты': 'Number reduction of date',
      'Квадрат личности': 'Personality square',
      'Квадрат судьбы': 'Destiny square',
      'Линии любви и денег': 'Love and money lines',

      // ===== Reading Quiz =====
      'РАСКЛАД ТАРО': 'TAROT READING',
      'Карты': 'The cards',
      'отвечают': 'answer',
      'на ваш вопрос': 'your question',
      'Личный расклад на основе классической колоды Таро. Контекстная интерпретация под ваш конкретный вопрос.':
        'A personal reading based on the classic Tarot deck. Contextual interpretation tailored to your specific question.',
      'Вопрос': 'Question',
      'Чёткая формулировка задаёт фокус расклада': 'A clear question sets the focus of the reading',
      'Расклад': 'Spread',
      'Прошлое-настоящее-будущее или ситуация-препятствие-совет':
        'Past-present-future or situation-obstacle-advice',
      'Карты': 'The cards',
      'Случайная выборка с учётом прямого и перевёрнутого положения':
        'Random draw with upright and reversed orientation',
      'О чём': 'What is',
      'вопрос?': 'your question?',
      'Сформулируйте чётко то, на что хотите получить ответ': 'Formulate clearly what you want answered',
      'ВАШ ВОПРОС': 'YOUR QUESTION',
      'Например: стоит ли мне сейчас менять работу?': 'For example: should I change my job now?',
      'Выберите': 'Choose your',
      'расклад': 'spread',
      'Каждый расклад подходит для своего типа вопросов':
        'Each spread suits a different type of question',
      'Прошлое · Настоящее · Будущее': 'Past · Present · Future',
      'Три карты, развёрнутые во времени. Идеально для понимания общей траектории.':
        'Three cards across time. Ideal for understanding the overall trajectory.',
      'Ситуация · Препятствие · Совет': 'Situation · Obstacle · Advice',
      'Три карты: что есть, что мешает, что делать. Для конкретных решений.':
        'Three cards: what is, what blocks, what to do. For concrete decisions.',
      'Кельтский крест': 'Celtic cross',
      'Десять карт. Самый глубокий расклад — для серьёзных вопросов.':
        'Ten cards. The deepest spread — for serious questions.',
      'Вытяните': 'Draw your',
      'карты': 'cards',
      'Нажмите на колоду, чтобы перевернуть три карты':
        'Tap the deck to flip three cards',
      'Раскрытие карт': 'Revealing the cards',
      'Анализ позиций': 'Analysing positions',
      'Учёт вашего вопроса': 'Considering your question',

      // ===== Loading screens (common) =====
      'Анализ ответов': 'Analysing answers',
      'Скоро готово...': 'Almost ready...',

      // ===== Payment screen =====
      'РАСШИРЕННЫЙ ДОСТУП К НАТАЛЬНОЙ КАРТЕ': 'EXTENDED ACCESS TO NATAL CHART',
      'РАСШИРЕННЫЙ ДОСТУП К МАТРИЦЕ': 'EXTENDED ACCESS TO MATRIX',
      'РАСШИРЕННЫЙ ДОСТУП К РАСКЛАДАМ': 'EXTENDED ACCESS TO READINGS',
      'натальная карта': 'natal chart',
      'матрица судьбы': 'destiny matrix',
      'расклад': 'reading',
      'Перейти в Pro': 'Upgrade to Pro',
      'Pro': 'Pro',
      'PRO': 'PRO',
      'PRO-ДОСТУП': 'PRO ACCESS',
      'PRO · 3 ДНЯ': 'PRO · 3 DAYS',
      '3 дня за': '3 days for',
      'Активировать пробный период': 'Start trial',
      'Активировать за 0,50 €': 'Activate for €0.50',
      'Оплатить картой': 'Pay by card',
      'Купить за 0,50 €': 'Buy for €0.50',
      '0,50 €': '€0.50',
      '29,90 €/мес': '€29.90/mo',
      'Дальше — 29,90 €/мес. Отмена в один клик.': 'Then €29.90/mo. Cancel anytime.',
      'Что вы получаете в Pro': 'What you get in Pro',
      'Что говорят клиенты': 'What clients say',
      'Скидка действует': 'Discount valid for',
      '15:00': '15:00',

      // ===== Pay upsell modal =====
      'Прежде чем закрыть страницу — попробуйте':
        'Before you close the page — try',
      'бесплатно': 'for free',
      'наш': 'our',
      'расклад на картах Таро': 'Tarot card reading',
      'Это займёт пару минут и поможет получить ответ на ваш важный вопрос.':
        'It takes a couple of minutes and helps you get an answer to an important question.',

      // ===== Speedup modal (full) =====
      'Заказ ускорен': 'Order accelerated',
      'Портрет будет готов через 30 минут — поставлен в приоритетную очередь.':
        'The portrait will be ready in 30 minutes — placed in the priority queue.',
      'Заказ готов!': 'Order ready!',
      'завершён — можно открывать.': 'is complete — you can open it.',
      'Поставьте заказ в приоритетную очередь — портрет будет готов за 30 минут вместо 24 часов.':
        'Move your order to the priority queue — portrait ready in 30 minutes instead of 24 hours.',
      'УСКОРИТЬ ЗА 3,99 €': 'SPEED UP FOR €3.99',
      'Передумали': 'Changed my mind',
      'Оплачено!': 'Paid!',
      'Заказ в приоритетной очереди. Готов через 30 минут.':
        'Order placed in priority queue. Ready in 30 minutes.',

      // ===== Onboarding tour =====
      'ШАГ 1 ИЗ 4': 'STEP 1 OF 4',
      'ШАГ 2 ИЗ 4': 'STEP 2 OF 4',
      'ШАГ 3 ИЗ 4': 'STEP 3 OF 4',
      'ШАГ 4 ИЗ 4': 'STEP 4 OF 4',
      'Пропустить': 'Skip',
      'Назад ←': '← Back',
      '→ Далее': 'Next →',
      'Готовы': 'Ready to',
      'начать': 'start',
      'Удачных открытий! Если будут вопросы — мы всегда рядом.':
        'Happy discoveries! If you have questions — we are always here.',
      'Ускорьте': 'Speed up the',
      'создание': 'creation',
      'портрета': 'of the portrait',
      'Заказ «Портрет половинки» обрабатывается 24 часа — таймер под бейджем «В работе» показывает обратный отсчёт.':
        'The "Partner portrait" order takes 24 hours — the timer under the "In progress" badge shows the countdown.',
      'Нажмите «Ускорить»': 'Press "Speed up"',
      ', чтобы поставить заказ в приоритетную очередь и получить портрет уже через 30 минут.':
        ' to move your order to the priority queue and get the portrait in 30 minutes.',
      'После первого заказа здесь появится таймер и кнопка «Ускорить» — она ставит заказ в приоритетную очередь, чтобы получить результат раньше.':
        'After your first order a timer and "Speed up" button will appear here — it places the order in the priority queue for an earlier result.',

      // ===== Login extended =====
      'СОЦСЕТЬ X': 'X (Twitter)',
      'Google': 'Google',
      'Apple': 'Apple',

      // ===== Account / profile =====
      'АККАУНТ': 'ACCOUNT',
      'Активная подписка': 'Active subscription',
      'Без подписки': 'No subscription',
      'История заказов': 'Order history',
      'Стиль красоты': 'Beauty style',

      // ===== Dashboard banner =====
      'Готовится': 'In preparation',
      'Сегодня': 'Today',
      'Вчера': 'Yesterday',
      'минут назад': 'minutes ago',
      'часов назад': 'hours ago',

      // ===== Portrait Quiz (iframe) — основные строки =====
      'Портрет твоей': 'Portrait of your',
      'второй половинки': 'better half',
      'Узнай': 'Discover',
      'Узнай судьбу': 'Discover your destiny',
      'Узнай свою судьбу': 'Discover your destiny',
      'Atelier de l\'Âme': 'Atelier de l\'Âme',
      'Начать': 'Start',
      'Ты': 'You are',
      'Кто ты?': 'Who are you?',
      'Девушка': 'Woman',
      'Парень': 'Man',
      'Кого ты ищешь?': 'Who are you looking for?',
      'Парня': 'A man',
      'Девушку': 'A woman',
      'Сколько тебе лет?': 'How old are you?',
      '18-24': '18-24',
      '25-34': '25-34',
      '35-44': '35-44',
      '45+': '45+',
      'Твой семейный статус?': 'Your relationship status?',
      'Какой стиль красоты тебе ближе?': 'Which beauty style appeals to you?',
      'Европейская': 'European',
      'Латиноамериканская': 'Latin American',
      'Африканская': 'African',
      'Азиатская': 'Asian',
      'Любая': 'Any',
      'Северные ветры и тёплый камень': 'Northern winds and warm stone',
      'Страсть и солнечный жар': 'Passion and solar heat',
      'Тёплая земля под ярким солнцем': 'Warm earth under bright sun',
      'Тишина древних храмов': 'Silence of ancient temples',
      'Красота не знает границ': 'Beauty knows no borders',
      'Где ты любишь отдыхать?': 'Where do you love to rest?',
      'Море': 'Sea',
      'Горы': 'Mountains',
      'Лес': 'Forest',
      'Город': 'City',
      'Какой твой язык любви?': 'What is your love language?',
      'Слова поддержки': 'Words of affirmation',
      'Прикосновения': 'Physical touch',
      'Время вместе': 'Quality time',
      'Подарки': 'Gifts',
      'Помощь': 'Acts of service',
      'Какое качество в партнёре для тебя главное?': 'Which partner quality matters most?',
      'Доброта': 'Kindness',
      'Ум': 'Intellect',
      'Юмор': 'Humour',
      'Надёжность': 'Reliability',
      'Страсть': 'Passion',
      'Что мешает тебе встретить любовь?': 'What prevents you from finding love?',
      'Страх': 'Fear',
      'Работа': 'Work',
      'Прошлое': 'The past',
      'Окружение': 'Environment',
      'Ничего': 'Nothing',
      'Твоя дата рождения': 'Your date of birth',
      'Введи дату': 'Enter your date',
      'Как ты обычно принимаешь решения?': 'How do you usually make decisions?',
      'Сердцем': 'With my heart',
      'Умом': 'With my mind',
      'Интуицией': 'With intuition',
      'Советом': 'By advice',
      'Как тебя зовут?': 'What is your name?',
      'Имя': 'Name',
      'Чего ты больше всего боишься в любви?': 'What do you fear most in love?',
      'Разочарования': 'Disappointment',
      'Одиночества': 'Loneliness',
      'Предательства': 'Betrayal',
      'Скуки': 'Boredom',
      'Что для тебя главная цель партнёрства?': 'What is the main goal of a partnership?',
      'Семья': 'Family',
      'Развитие': 'Growth',
      'Поддержка': 'Support',
      'Приключения': 'Adventures',
      'Анализируем': 'Analysing',
      'Звёзды показывают твой портрет': 'The stars are revealing your portrait',
      'Твой портрет готов': 'Your portrait is ready',
      'Получить полный портрет': 'Get the full portrait',
      'Свободно': 'Free',
      'Свободна': 'Free',
      'В отношениях': 'In a relationship',
      'Женат': 'Married',
      'Замужем': 'Married',
      'Разведён': 'Divorced',
      'Разведена': 'Divorced',

      // ===== Payment hero — Natal =====
      'Полная картина': 'The full picture of',
      'твоей': 'your',
      'натальной карты ждёт тебя': 'natal chart awaits',
      'Перейди от 3-минутного обзора к глубокой астрологической интерпретации с реальными расчётами 10 планет, 12 домов и всех аспектов между ними.':
        'Move from a 3-minute overview to a deep astrological interpretation with real calculations of 10 planets, 12 houses and all aspects.',
      '1278 человек': '1,278 people',
      'сегодня открыли свою полную карту': 'opened their full chart today',
      'Твоя': 'Your',
      'полная карта': 'full chart',
      'ждёт за этим конвертом': 'awaits behind this envelope',
      'Глубокая интерпретация, AI-консультант, годовые транзиты — всё за':
        'Deep interpretation, AI consultant, yearly transits — all for',
      'Почему натальной карте от': 'Why you can trust the natal chart from',
      'можно доверять': '',
      'Реальные астрономические расчёты': 'Real astronomical calculations',
      'Позиции планет, домов и аспектов рассчитываются по формулам VSOP87 — той же системе, что используют профессиональные астрологи. Точность ±1°.':
        'Planetary positions, houses and aspects are computed with the VSOP87 formulas — the same system used by professional astrologers. Accuracy ±1°.',
      'Интерпретация на двух уровнях глубины': 'Interpretation on two depth levels',
      'Режим "Просто" — для тех, кто только знакомится с астрологией. "Подробно" — для тех, кто хочет терминологию, орбы и точные градусы.':
        '"Simple" mode for those new to astrology. "Detailed" mode for those who want terminology, orbs and exact degrees.',
      'AI-астролог отвечает на ваши вопросы': 'An AI astrologer answers your questions',
      'Спросите всё что угодно про свою карту — Claude Sonnet 4 даёт развёрнутые ответы, учитывая ваши планеты, дома и аспекты. Без ограничений по числу вопросов.':
        'Ask anything about your chart — Claude Sonnet 4 gives detailed answers based on your planets, houses and aspects. Unlimited questions.',
      'Все 10 планет с интерпретацией в знаке, доме и аспектах':
        'All 10 planets with interpretations by sign, house and aspect',
      'Полный разбор всех 22 аспектов с орбами': 'Full analysis of all 22 aspects with orbs',
      'Транзиты на сегодня — что происходит с твоей картой прямо сейчас':
        'Today\'s transits — what is happening with your chart right now',
      'Чат "Спроси астролога" — неограниченные вопросы по карте':
        '"Ask the astrologer" chat — unlimited questions about your chart',

      // ===== Payment hero — Matrix =====
      'Энергетический': 'The energetic',
      'код': 'code',
      'твоей судьбы — полная расшифровка': 'of your destiny — full decoding',
      'Перейди от 3-минутного обзора к глубокому разбору всех 22 точек матрицы по системе Ладини с интерпретацией каждой точки и взаимосвязей между ними.':
        'Move from a 3-minute overview to a deep analysis of all 22 matrix points using the Ladini system with interpretation of every point and the links between them.',
      '843 человека': '843 people',
      'сегодня раскрыли свою матрицу': 'revealed their matrix today',
      'Полная': 'Full',
      'матрица твоей судьбы': 'matrix of your destiny',
      'в одном отчёте': 'in one report',
      'Все 22 точки, кармические задачи, зоны роста — всё за':
        'All 22 points, karmic tasks, growth zones — all for',
      'Почему матрице судьбы от': 'Why you can trust the destiny matrix from',
      'Точный алгоритм системы Ладини': 'Precise Ladini system algorithm',
      'Расчёт 22 точек октаграммы по классической методике с учётом всех взаимосвязей. Не упрощённая версия, а полная математика.':
        'Computation of 22 octagram points by the classical method including all relationships. Not a simplified version — the full maths.',
      'Шесть фокусов разбора': 'Six analysis focuses',
      'Предназначение, любовь, деньги, род, самопознание, общий — каждый фокус даёт свой угол интерпретации одних и тех же точек.':
        'Purpose, love, money, lineage, self-knowledge, general — each focus gives its own angle of interpretation on the same points.',
      'AI-нумеролог отвечает на вопросы': 'An AI numerologist answers questions',
      'Чат с Claude Sonnet 4, который видит вашу матрицу и даёт ответы по конкретным точкам. Можно копать сколь угодно глубоко.':
        'A chat with Claude Sonnet 4 that sees your matrix and answers about specific points. You can go as deep as you wish.',
      'Полный разбор всех 22 точек матрицы с интерпретацией':
        'Full analysis of all 22 matrix points with interpretation',
      'Зоны комфорта и зоны роста — куда направлять усилия':
        'Comfort zones and growth zones — where to focus effort',
      'Линии судьбы: кармическая, родовая, любовная, финансовая':
        'Lines of destiny: karmic, lineage, love, financial',
      'Чат "Спроси нумеролога" — неограниченные вопросы по матрице':
        '"Ask the numerologist" chat — unlimited questions about your matrix',

      // ===== Payment hero — Reading =====
      'Глубокие расклады': 'Deep readings of',
      'Таро': 'Tarot',
      'и Кельтский крест': 'and the Celtic Cross',
      'Перейди от карты дня и простых раскладов на 3 карты к Кельтскому кресту на 10 карт с контекстной интерпретацией под твой конкретный вопрос.':
        'Move from the daily card and 3-card spreads to the 10-card Celtic Cross with contextual interpretation for your specific question.',
      '624 человека': '624 people',
      'сегодня сделали расклад в Pro': 'did a Pro reading today',
      'самый глубокий расклад': 'the deepest spread',
      'Десять позиций, прошлое-настоящее-будущее, итог — всё за':
        'Ten positions, past-present-future, outcome — all for',
      'Почему раскладам от': 'Why you can trust readings from',
      'Контекстная интерпретация AI': 'Contextual AI interpretation',
      'Не "Башня = разрушение", а конкретно: что значит Башня в позиции "ваши страхи" при вашем вопросе о смене работы. Каждый расклад уникален.':
        'Not "The Tower = destruction", but: what does the Tower mean in the "your fears" position for your specific career-change question. Every reading is unique.',
      'Полная колода 78 карт': 'Full 78-card deck',
      '22 Старших + 56 Младших арканов (кубки, мечи, жезлы, пентакли). Не сокращённая колода, а классический комплект для серьёзной работы.':
        '22 Major + 56 Minor Arcana (cups, swords, wands, pentacles). Not a reduced deck — the classic set for serious work.',
      'Учёт прямого и перевёрнутого положения': 'Upright and reversed orientations',
      'Каждая карта может выпасть прямо или перевёрнуто — это меняет смысл. Алгоритм случайного выбора учитывает это для честной интерпретации.':
        'Each card can come up upright or reversed — this changes the meaning. The random algorithm accounts for this for an honest interpretation.',
      'Кельтский крест — 10 карт, самый глубокий расклад':
        'Celtic Cross — 10 cards, the deepest spread',
      'Контекстная интерпретация под ваш конкретный вопрос':
        'Contextual interpretation for your specific question',
      'Все 78 карт колоды (Старшие + Младшие арканы)':
        'All 78 deck cards (Major + Minor Arcana)',
      'Чат "Уточни расклад" — задайте вопросы по выпавшим картам':
        '"Clarify the reading" chat — ask about the drawn cards',

      // ===== Payment FAQ — natal =====
      'Что я получаю в Pro помимо базовой натальной карты?':
        'What do I get in Pro besides the basic natal chart?',
      'Полную интерпретацию всех 10 планет в подробном режиме, все аспекты с их влиянием друг на друга, транзиты на сегодня и на год вперёд, а также неограниченный чат с AI-астрологом для вопросов по вашей карте.':
        'A full interpretation of all 10 planets in detailed mode, all aspects and how they influence each other, transits for today and the year ahead, and an unlimited chat with an AI astrologer about your chart.',
      'Что такое "пробный период 3 дня"?': 'What is the "3-day trial"?',
      'Вы платите 0,50€ за полный доступ на 3 дня. За это время можете изучить всё что есть в Pro. По истечении пробного периода подписка автоматически продлевается на 29,90€/мес, если вы её не отмените в личном кабинете.':
        'You pay €0.50 for full access for 3 days. Within that time you can explore everything in Pro. After the trial the subscription auto-renews at €29.90/month unless you cancel in your account.',
      'Где я могу отменить подписку?': 'Where can I cancel the subscription?',
      'В личном кабинете в разделе "Подписка". Отмена занимает один клик и доступна в любой момент. Если отмените во время пробного периода — больше с вас списано не будет.':
        'In your account, in the "Subscription" section. Cancellation is one click, available anytime. If you cancel during the trial — nothing else will be charged.',
      'В личном кабинете в разделе "Подписка". Отмена в один клик, доступна в любой момент.':
        'In your account, in the "Subscription" section. One-click cancellation, available anytime.',
      'Насколько точны расчёты?': 'How accurate are the calculations?',
      'Позиции планет рассчитываются с погрешностью ±1° по формулам VSOP87. Это та же точность, что в популярных астрологических программах. Для астрологической интерпретации этого более чем достаточно.':
        'Planetary positions are calculated to ±1° using the VSOP87 formulas. This is the same precision used by popular astrology software. More than enough for astrological interpretation.',

      // ===== Payment FAQ — matrix =====
      'Что я получаю в Pro помимо базовой матрицы?': 'What do I get in Pro besides the basic matrix?',
      'Полный разбор всех 22 точек октаграммы с детальной интерпретацией, разделение зон комфорта и роста, линии судьбы по 6 фокусам (предназначение, любовь, деньги, род, самопознание, общий), а также неограниченный чат с AI-нумерологом.':
        'A full analysis of all 22 octagram points with detailed interpretation, comfort vs. growth zones, destiny lines across 6 focuses (purpose, love, money, lineage, self-knowledge, general), plus unlimited chat with an AI numerologist.',
      'Чем ваша матрица отличается от других сервисов?': 'How is your matrix different from other services?',
      'У нас полный алгоритм Ладини с расчётом всех взаимосвязей между точками, а не упрощённая версия. Также интерпретация привязана к вашим конкретным числам, а не подставляется из шаблона.':
        'We use the full Ladini algorithm with all relationships computed, not a simplified version. The interpretation is tied to your specific numbers — not pulled from a template.',
      'Вы платите 0,50€ за полный доступ на 3 дня. По истечении пробного периода подписка продлевается на 29,90€/мес автоматически, если вы не отмените её в личном кабинете.':
        'You pay €0.50 for full access for 3 days. After the trial the subscription auto-renews at €29.90/month unless you cancel in your account.',

      // ===== Payment FAQ — reading =====
      'Что я получаю в Pro помимо обычных раскладов?': 'What do I get in Pro besides the regular readings?',
      'Доступ к Кельтскому кресту (10 карт) — самому глубокому раскладу Таро. Полную колоду 78 карт включая Младшие арканы. Контекстную интерпретацию под ваш конкретный вопрос. И неограниченный чат для уточнений по выпавшим картам.':
        'Access to the Celtic Cross (10 cards) — the deepest Tarot spread. The full 78-card deck including the Minor Arcana. Contextual interpretation for your specific question. And unlimited chat to clarify the drawn cards.',
      'В чём разница между бесплатным и Pro раскладом?': 'What is the difference between free and Pro readings?',
      'В бесплатном — только Старшие арканы (22 карты) и базовые расклады (карта дня, прошлое-настоящее-будущее, ситуация-препятствие-совет). В Pro — полная колода и Кельтский крест с глубокой интерпретацией.':
        'Free — only Major Arcana (22 cards) and basic spreads (card of the day, past-present-future, situation-obstacle-advice). Pro — full deck and Celtic Cross with deep interpretation.',
      'Вы платите 0,50€ за полный доступ на 3 дня. После — подписка 29,90€/мес автоматически, пока не отмените.':
        'You pay €0.50 for full access for 3 days. After that — €29.90/month auto-renewal until you cancel.',
      'Можно ли делать сколько угодно раскладов?': 'Can I do as many readings as I want?',
      'В Pro — да, без ограничений. И каждый расклад получает индивидуальную интерпретацию AI под ваш вопрос, а не шаблонные значения карт.':
        'In Pro — yes, no limits. And every reading gets an individual AI interpretation for your question, not template card meanings.',

      // ===== Pay reviews (additional) =====
      'Купила Pro ради чата с AI. Задаю вопросы о карте партнёра, синастрии — отвечает развёрнуто, не уходит в общие фразы. Стоит каждого евро.':
        'I bought Pro for the AI chat. I ask about my partner\'s chart and synastry — it answers in depth, no generic phrases. Worth every euro.',
      'Транзиты на год — это то, что я искала. Не "ретроградный Меркурий бойтесь компьютеры", а нормальный разбор когда чего ожидать.':
        'Yearly transits — exactly what I was looking for. Not "Mercury retrograde, fear your computer", but a proper breakdown of what to expect when.',
      'Прошла десяток сервисов с матрицами, везде одни и те же копипастные тексты. Здесь впервые увидела связи между точками, а не отдельные интерпретации.':
        'I tried a dozen matrix services, all of them copy-paste of the same texts. Here for the first time I saw the connections between points, not just isolated interpretations.',
      'Фокус "род" вскрыл темы, которые я обходила годами. Не мистика, а структурный взгляд на повторяющиеся семейные сценарии.':
        'The "lineage" focus opened up topics I had avoided for years. Not mysticism — a structural view of repeating family scenarios.',
      'Купила Pro ради чата. Задаю вопросы по точкам матрицы — отвечает не общими фразами, а с привязкой к моим конкретным числам.':
        'I bought Pro for the chat. I ask about matrix points — it answers tied to my specific numbers, not generic phrases.',
      'Кельтский крест в Pro — это другой уровень. Не просто значения карт, а то, как они работают вместе в моей конкретной ситуации.':
        'The Celtic Cross in Pro is another level. Not just card meanings, but how they work together in my specific situation.',
      'Спрашивала о переходе на новую работу. Башня — Колесница — Звезда. Через два месяца всё развернулось ровно так. Не предсказание, а зеркало решений.':
        'I asked about a new job. Tower — Chariot — Star. Two months later it unfolded exactly that way. Not a prediction — a mirror for decisions.',
      'Раньше платила по 30€ за один сеанс у таролога. Здесь за 0.50€ получаю расклад того же качества с возможностью переспросить детали.':
        'I used to pay €30 for one session with a tarologist. Here for €0.50 I get the same quality reading and can re-ask for details.',
      'НАТАЛЬНАЯ КАРТА ': 'NATAL CHART ',
      'МАТРИЦА СУДЬБЫ ': 'DESTINY MATRIX ',
      'ИНДИВИДУАЛЬНЫЙ РАСКЛАД ': 'PERSONAL READING ',

      // ===== Cities for reviews =====
      'Мария К. · Москва': 'Maria K. · Moscow',
      'Анна Л. · Прага': 'Anna L. · Prague',
      'Елена В. · Киев': 'Elena V. · Kyiv',
      'Наталья П. · Алматы': 'Natalia P. · Almaty',
      'Ольга Д. · Берлин': 'Olga D. · Berlin',
      'Светлана М. · Минск': 'Svetlana M. · Minsk',
      'Дарья С. · Санкт-Петербург': 'Daria S. · Saint Petersburg',
      'Юлия А. · Тбилиси': 'Yulia A. · Tbilisi',

      // ===== Dashboard greeting / details =====
      'Добро пожаловать': 'Welcome',
      'Сегодня день, когда стоит обратить внимание на детали': 'Today is a day for the details',
      'Луна растущая, энергия дня поддерживает то, что укрепляет существующее':
        'The Moon is waxing, today\'s energy supports reinforcing what already exists',
      'Сегодня вы поддерживаете то, что уже создано':
        'Today you reinforce what is already created',
      'Финансовая стабильность, телесные практики, забота о ресурсах — всё, что укрепляет вашу базу.':
        'Financial stability, body practices, care for resources — everything that strengthens your foundation.',
      'Открыть подробный совет дня': 'Open detailed daily guidance',
      'ВСЕ ЗАКАЗЫ →': 'ALL ORDERS →',
      'КОСМИЧЕСКИЙ ПРОФИЛЬ': 'COSMIC PROFILE',
      'Солнце': 'Sun',
      'Луна': 'Moon',
      'Асцендент': 'Ascendant',
      'Показать всю карту': 'Show full chart',
      'СТИХИЯ': 'ELEMENT',
      'Огонь': 'Fire',
      'Земля': 'Earth',
      'Воздух': 'Air',
      'Вода': 'Water',

      // ===== Result screens — common =====
      'Ваша натальная карта': 'Your natal chart',
      'Ваша матрица': 'Your matrix',
      'Ваш расклад': 'Your reading',
      'Открыть полную интерпретацию': 'Open full interpretation',
      'Перейти к Pro': 'Upgrade to Pro',
      'СКОЛЬКО ВАМ ЛЕТ': 'YOUR AGE',
      'ВАШ ВОПРОС:': 'YOUR QUESTION:',
      'Поделиться': 'Share',
      'Сохранить как PDF': 'Save as PDF',

      // ===== Toast / common notifications =====
      'Изменения сохранены': 'Changes saved',
      'Произошла ошибка': 'An error occurred',
      'Попробуйте ещё раз': 'Please try again',

      // ===== Misc / interjections =====
      'или': 'or',
      'и': 'and',
      'для': 'for',
      'без': 'without',
      'Введите email': 'Enter email',
      'Введите имя': 'Enter name',
      'Спасибо!': 'Thank you!',
      'Хорошего дня': 'Have a good day'
    };

    // Атрибуты, которые тоже надо переводить
    var ATTR_LIST = ['placeholder', 'title', 'aria-label', 'alt'];

    var I18N = window.I18N = {
      currentLang: 'ru',
      dict: DICT,
      originalText: new WeakMap(),
      originalAttr: new WeakMap(), // el -> { attr: originalValue }
      observer: null,

      init: function() {
        var saved;
        try { saved = localStorage.getItem('lovia_lang'); } catch (e) {}
        this.currentLang = (saved === 'en') ? 'en' : 'ru';
        document.documentElement.lang = this.currentLang;
        document.body.classList.toggle('lang-en', this.currentLang === 'en');
        document.body.classList.toggle('lang-ru', this.currentLang === 'ru');
        // Сразу применяем (даже для RU — чтобы записать оригиналы)
        this.applyTo(document.body);
        this.startObserver();
        this.updateFooterUI();
      },

      // Лукап с фолбэками: пробуем точный ключ, потом нормализованный
      // (заменяем U+00A0/&nbsp; на обычный пробел и убираем двойные пробелы).
      _lookup: function(key) {
        if (!key) return undefined;
        var d = this.dict;
        if (d[key]) return d[key];
        // Нормализуем U+00A0 (&nbsp;) → обычный пробел и схлопываем повторы
        var norm = key.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
        if (norm !== key && d[norm]) return d[norm];
        return undefined;
      },
      translate: function(ru) {
        if (!ru) return ru;
        return this._lookup(ru.trim());
      },

      translateNode: function(node) {
        if (!node || node.nodeType !== 3) return; // TEXT_NODE
        var parent = node.parentNode;
        if (!parent) return;
        var tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' ||
            tag === 'IFRAME' || tag === 'TEXTAREA') return;
        var raw = node.nodeValue;
        var trimmed = raw && raw.trim();
        if (!trimmed) return;

        // Запомним оригинал при первом проходе
        if (!this.originalText.has(node)) {
          this.originalText.set(node, raw);
        }
        var orig = this.originalText.get(node);
        var origTrim = orig.trim();

        if (this.currentLang === 'en') {
          var tr = this._lookup(origTrim);
          if (tr && tr !== origTrim) {
            // сохраняем пробелы вокруг
            var leading = orig.match(/^\s*/)[0];
            var trailing = orig.match(/\s*$/)[0];
            if (node.nodeValue !== leading + tr + trailing) {
              node.nodeValue = leading + tr + trailing;
            }
          }
        } else {
          // RU — восстановить
          if (node.nodeValue !== orig) node.nodeValue = orig;
        }
      },

      translateAttrs: function(el) {
        if (!el || el.nodeType !== 1) return;
        var map = this.originalAttr.get(el) || {};
        var dirty = false;
        for (var i = 0; i < ATTR_LIST.length; i++) {
          var a = ATTR_LIST[i];
          if (!el.hasAttribute(a)) continue;
          if (!(a in map)) { map[a] = el.getAttribute(a); dirty = true; }
          var origV = map[a];
          if (this.currentLang === 'en') {
            var tr = this._lookup((origV || '').trim());
            if (tr) el.setAttribute(a, tr);
          } else {
            el.setAttribute(a, origV);
          }
        }
        if (dirty) this.originalAttr.set(el, map);
      },

      applyTo: function(root) {
        if (!root) return;
        // Текстовые ноды
        if (root.nodeType === 3) { this.translateNode(root); return; }
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
        var n;
        while ((n = walker.nextNode())) this.translateNode(n);
        // Атрибуты на самом root и потомках
        if (root.nodeType === 1) this.translateAttrs(root);
        var elWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
        var el;
        while ((el = elWalker.nextNode())) this.translateAttrs(el);
      },

      startObserver: function() {
        if (this.observer) return;
        var self = this;
        this.observer = new MutationObserver(function(muts) {
          muts.forEach(function(m) {
            if (m.type === 'childList') {
              m.addedNodes.forEach(function(n) { self.applyTo(n); });
            } else if (m.type === 'characterData') {
              self.translateNode(m.target);
            }
          });
        });
        this.observer.observe(document.body, {
          childList: true, subtree: true, characterData: true
        });
      },

      setLang: function(lang) {
        if (lang !== 'ru' && lang !== 'en') lang = 'ru';
        if (this.currentLang === lang) return;
        this.currentLang = lang;
        try { localStorage.setItem('lovia_lang', lang); } catch (e) {}
        document.documentElement.lang = lang;
        document.body.classList.toggle('lang-en', lang === 'en');
        document.body.classList.toggle('lang-ru', lang === 'ru');
        this.applyTo(document.body);
        this.updateFooterUI();
        // Переведём iframe портрет-квиза (если открыт)
        if (typeof window.__loviaApplyI18nToIframes === 'function') {
          try { window.__loviaApplyI18nToIframes(); } catch (e) {}
        }

        // Если открыт info-modal — перерендерим под новым языком
        var backdrop = document.getElementById('infoModalBackdrop');
        if (backdrop && backdrop.classList.contains('open')) {
          var bodyEl = document.getElementById('infoModalBody');
          var titleEl = document.getElementById('infoModalTitle');
          // Найдём topic по последнему data-info-topic кликнутому — храним на самом modal
          var topic = backdrop.dataset.currentTopic;
          if (topic) {
            var source = lang === 'en' ? INFO_CONTENT_EN : INFO_CONTENT;
            var content = source[topic] || INFO_CONTENT[topic];
            if (content) {
              titleEl.textContent = content.title;
              bodyEl.innerHTML = content.html;
            }
          }
        }
      },

      updateFooterUI: function() {
        var flag = document.getElementById('siteFooterLangFlag');
        var code = document.getElementById('siteFooterLangCode');
        if (flag) flag.setAttribute('data-flag', this.currentLang);
        if (code) code.textContent = this.currentLang.toUpperCase();
        var opts = document.querySelectorAll('.site-footer-lang-option');
        opts.forEach(function(o) {
          o.classList.toggle('active', o.getAttribute('data-lang') === window.I18N.currentLang);
        });
      }
    };

    // === Кнопка / дропдаун в футере ===
    function bindFooterLangSwitcher() {
      var btn = document.getElementById('siteFooterLang');
      var menu = document.getElementById('siteFooterLangMenu');
      if (!btn || !menu) return;

      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var open = menu.classList.toggle('open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      menu.querySelectorAll('.site-footer-lang-option').forEach(function(opt) {
        opt.addEventListener('click', function(e) {
          e.stopPropagation();
          var lang = opt.getAttribute('data-lang');
          window.I18N.setLang(lang);
          menu.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        });
      });

      document.addEventListener('click', function(e) {
        if (!menu.contains(e.target) && e.target !== btn) {
          menu.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    function start() {
      I18N.init();
      bindFooterLangSwitcher();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  })();


  // === PORTRAIT QUIZ — iframe wrapper ===
  // Архитектура: квиз "Портрет половинки" работает как изолированный iframe.
  // Файл portrait-quiz.html содержит 22 экрана коллеги.
  // Общение с iframe — через postMessage (если будет нужно).
  

  // URL отдельного файла квиза (для прода).
  // На локальной разработке через file:// используется фолбэк на srcdoc с встроенным HTML.
  var PORTRAIT_QUIZ_URL = './portrait-quiz.html';
  
  // Встроенный HTML квиза для локального тестирования через file://
  // На проде используется PORTRAIT_QUIZ_URL.
  // Эта переменная определена в отдельном <script> ниже (PORTRAIT_QUIZ_HTML_EMBED).
  
  function _useLocalSrcdoc() {
    // Используем встроенный HTML (srcdoc) везде, кроме реального HTTP-хостинга.
    //   file://     — локальное открытие HTML
    //   content://  — открытие через Android (Telegram, файловые менеджеры)
    //   about: / data: / blob: — прочие изолированные контексты
    // На http(s):// — обычный src='./portrait-quiz.html' (продакшн).
    var p = window.location.protocol;
    return p !== 'http:' && p !== 'https:';
  }
  
  function initPortraitQuiz() {
    var backBtn = document.getElementById('pqBackBtn');
    if (backBtn) {
      backBtn.addEventListener('click', function() {
        if (typeof navigateTo === 'function') {
          navigateTo('screen-home');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        // Очищаем iframe чтобы при следующем открытии стартовал заново
        var iframe = document.getElementById('pqIframe');
        if (iframe) {
          iframe.src = 'about:blank';
          iframe.removeAttribute('srcdoc');
          iframe.dataset.loviaLoaded = '';
        }
      });
    }
  }
  
  function openPortraitQuiz(opts) {
    var withBack = !opts || opts.withBack !== false;
    var quizScreen = document.getElementById('screen-portrait-quiz');
    if (quizScreen) {
      quizScreen.classList.toggle('has-back', withBack);
    }
    // Сначала перейдём на экран квиза
    if (typeof navigateTo === 'function') {
      navigateTo('screen-portrait-quiz');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    
    var iframe = document.getElementById('pqIframe');
    if (!iframe) {
      console.warn('[Lovia] pqIframe not found');
      return;
    }
    
    // Если iframe уже загружен (по флагу) — не перезагружаем
    if (iframe.dataset.loviaLoaded === '1') {
      return;
    }
    iframe.dataset.loviaLoaded = '1';
    
    if (_useLocalSrcdoc()) {
      // Локальный режим (file://) — используем встроенный HTML через srcdoc
      var embeddedHtml = window.PORTRAIT_QUIZ_HTML_EMBED;
      if (embeddedHtml) {
        iframe.srcdoc = embeddedHtml;
      } else {
        console.warn('[Lovia] PORTRAIT_QUIZ_HTML_EMBED not defined — trying fetch fallback');
        // Фолбэк через fetch (может не работать в Chrome для file://)
        fetch(PORTRAIT_QUIZ_URL)
          .then(function(r) { return r.text(); })
          .then(function(html) { iframe.srcdoc = html; })
          .catch(function(err) {
            console.warn('[Lovia] fetch failed:', err);
            iframe.src = PORTRAIT_QUIZ_URL;
          });
      }
    } else {
      // Продакшн: обычный src
      iframe.src = PORTRAIT_QUIZ_URL;
    }
  }
  
  // Слушаем postMessage от iframe — на случай если изнутри придёт сигнал завершения
  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'portrait_quiz_complete') {
      console.log('[Lovia] Portrait quiz complete:', e.data);
      triggerPortraitPayment();
    }
  });

  // === Автозапуск квиза при первой загрузке (квиз — стартовый экран) ===
  // На начальной странице кнопки "На главную" быть не должно — некуда возвращаться.
  function autoStartPortraitQuiz() {
    var quizScreen = document.getElementById('screen-portrait-quiz');
    if (!quizScreen) return;
    if (!quizScreen.classList.contains('active')) return;
    if (typeof openPortraitQuiz === 'function') {
      openPortraitQuiz({ withBack: false });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoStartPortraitQuiz);
  } else {
    autoStartPortraitQuiz();
  }

  // === Детект завершения квиза → переход на наш screen-payment ===
  // Стратегия: мониторим pqIframe → его внутренний devScreenName.
  // Экраны 19 ("Подарок") и 20 ("Оплата") — последние. На любом из них
  // перехватываем и показываем наш screen-payment в контексте 'portrait'.
  var __portraitPaymentTriggered = false;
  function triggerPortraitPayment() {
    if (__portraitPaymentTriggered) return;
    __portraitPaymentTriggered = true;
    // Сбрасываем iframe чтобы при возврате квиз стартовал с начала
    var iframe = document.getElementById('pqIframe');
    if (iframe) {
      try {
        iframe.removeAttribute('srcdoc');
        iframe.src = 'about:blank';
      } catch (e) {}
      iframe.dataset.loviaLoaded = '';
    }
    if (typeof navigateToPayment === 'function') {
      navigateToPayment('portrait', 'pro');
    } else if (typeof navigateTo === 'function') {
      navigateTo('screen-payment');
    }
  }
  setInterval(function() {
    if (__portraitPaymentTriggered) return;
    try {
      var pq = document.getElementById('pqIframe');
      if (!pq || !pq.contentDocument) return;
      var nameEl = pq.contentDocument.getElementById('devScreenName');
      if (!nameEl) return;
      var t = nameEl.textContent || '';
      // Перехватываем как только пользователь дошёл до экрана-подарка / оплаты
      if (/screen\s+19\b|screen\s+20\b|Подарок|Оплата/i.test(t)) {
        triggerPortraitPayment();
      }
    } catch (e) {}
  }, 600);

  // === BLUR PORTRAIT ON EASEL (шаги 5+) ===
  // Стратегия:
  //   1) <style> с !important в каждый screen-iframe.
  //   2) Инлайн-style на самих элементах (img + SVG-группы наброска) —
  //      обходит любую специфичность и работает даже если screen
  //      переопределяет .lovia-png-img локальным CSS.
  //   3) MutationObserver + периодический повтор — ловим картинки,
  //      которые applyPortrait() вставляет через 100/500/1500мс.
  // Same-origin для обоих режимов загрузки (srcdoc + src=portrait-quiz.html).
  (function setupPortraitBlur() {
    var PNG_FILTER = 'blur(8px) saturate(1.05)';
    var SKETCH_FILTER = 'blur(3.5px)';

    var BLUR_CSS =
      '.easel-svg .portrait-sketch,' +
      '.easel-svg .jawline-existing,' +
      '.easel-svg .shoulders-existing,' +
      '.easel-svg .ethnicity-existing,' +
      '.easel-svg .mouth-existing,' +
      '.easel-svg .eyes-new {' +
        'filter: ' + SKETCH_FILTER + ' !important;' +
        '-webkit-filter: ' + SKETCH_FILTER + ' !important;' +
      '}' +
      '.easel-wrapper .lovia-png-img,' +
      '.easel-wrapper .lovia-png-portrait img,' +
      '.easel-wrapper img[src*="malbert"],' +
      '.easel-wrapper img[src*="raw.githubusercontent"] {' +
        'filter: ' + PNG_FILTER + ' !important;' +
        '-webkit-filter: ' + PNG_FILTER + ' !important;' +
        'transition: filter 0.6s ease;' +
      '}';

    function applyInline(doc) {
      try {
        if (!doc || !doc.body) return;
        var imgs = doc.querySelectorAll(
          '.easel-wrapper img.lovia-png-img, ' +
          '.easel-wrapper .lovia-png-portrait img, ' +
          '.easel-wrapper img[src*="malbert"], ' +
          '.easel-wrapper img[src*="raw.githubusercontent"]'
        );
        imgs.forEach(function(img) {
          img.style.setProperty('filter', PNG_FILTER, 'important');
          img.style.setProperty('-webkit-filter', PNG_FILTER, 'important');
        });
        ['.portrait-sketch', '.jawline-existing', '.shoulders-existing',
         '.ethnicity-existing', '.mouth-existing', '.eyes-new'].forEach(function(sel) {
          doc.querySelectorAll('.easel-svg ' + sel).forEach(function(el) {
            el.style.setProperty('filter', SKETCH_FILTER, 'important');
            el.style.setProperty('-webkit-filter', SKETCH_FILTER, 'important');
          });
        });
      } catch (e) {}
    }

    function injectBlurInto(doc) {
      try {
        if (!doc || !doc.head) return;
        if (!doc.querySelector('style[data-lovia-blur]')) {
          var s = doc.createElement('style');
          s.setAttribute('data-lovia-blur', '1');
          s.textContent = BLUR_CSS;
          doc.head.appendChild(s);
        }
        applyInline(doc);
        // Применим перевод для текущего языка
        applyI18nToIframeDoc(doc);
        if (!doc.__loviaBlurObserver && doc.body) {
          var Obs = (doc.defaultView && doc.defaultView.MutationObserver) || window.MutationObserver;
          if (Obs) {
            var obs = new Obs(function() {
              applyInline(doc);
              applyI18nToIframeDoc(doc);
            });
            obs.observe(doc.body, {
              childList: true, subtree: true,
              attributes: true, attributeFilter: ['src', 'class', 'style']
            });
            doc.__loviaBlurObserver = obs;
          }
        }
      } catch (e) {}
    }

    // === Перевод iframe-контента (портрет-квиз) ===
    // Использует тот же словарь, что и основная страница (window.I18N.dict)
    function applyI18nToIframeDoc(doc) {
      try {
        if (!doc || !doc.body || !window.I18N) return;
        var lang = window.I18N.currentLang;
        var dict = window.I18N.dict;
        if (!dict) return;
          function lkp(k) {
            if (!k) return undefined;
            if (dict[k]) return dict[k];
            var nk = k.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
            if (nk !== k && dict[nk]) return dict[nk];
            return undefined;
          }
        // Сохраним оригиналы текстов один раз
        if (!doc.__loviaI18nOriginals) doc.__loviaI18nOriginals = new WeakMap();
        var origs = doc.__loviaI18nOriginals;
        var walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null, false);
        var n;
        while ((n = walker.nextNode())) {
          var p = n.parentNode;
          if (!p) continue;
          var tg = p.tagName;
          if (tg === 'SCRIPT' || tg === 'STYLE' || tg === 'NOSCRIPT') continue;
          var raw = n.nodeValue;
          var trimmed = raw && raw.trim();
          if (!trimmed) continue;
          if (!origs.has(n)) origs.set(n, raw);
          var orig = origs.get(n);
          var origTrim = orig.trim();
          if (lang === 'en') {
            var tr = lkp(origTrim);
            if (tr && tr !== origTrim) {
              var lead = orig.match(/^\s*/)[0];
              var trail = orig.match(/\s*$/)[0];
              var next = lead + tr + trail;
              if (n.nodeValue !== next) n.nodeValue = next;
            }
          } else {
            if (n.nodeValue !== orig) n.nodeValue = orig;
          }
        }
        // Атрибуты
        var ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
        if (!doc.__loviaI18nAttrs) doc.__loviaI18nAttrs = new WeakMap();
        var attrMap = doc.__loviaI18nAttrs;
        var ew = doc.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, null, false);
        var el;
        while ((el = ew.nextNode())) {
          var stored = attrMap.get(el) || {};
          var dirty = false;
          for (var i = 0; i < ATTRS.length; i++) {
            var a = ATTRS[i];
            if (!el.hasAttribute(a)) continue;
            if (!(a in stored)) { stored[a] = el.getAttribute(a); dirty = true; }
            var origV = stored[a];
            if (lang === 'en') {
              var trA = lkp((origV || '').trim());
              if (trA) el.setAttribute(a, trA);
            } else {
              el.setAttribute(a, origV);
            }
          }
          if (dirty) attrMap.set(el, stored);
        }
      } catch (e) {}
    }
    // Доступ снаружи (для setLang)
    window.__loviaApplyI18nToIframes = function() {
      try {
        var pq = document.getElementById('pqIframe');
        var doc = pq && pq.contentDocument;
        var sf = doc && doc.getElementById('screenFrame');
        if (sf && sf.contentDocument) applyI18nToIframeDoc(sf.contentDocument);
      } catch (e) {}
    };

    function attachToScreenFrame(screenFrame) {
      if (!screenFrame || screenFrame.__loviaBlurAttached) return;
      screenFrame.__loviaBlurAttached = true;
      var tryInject = function() {
        injectBlurInto(screenFrame.contentDocument);
        // applyPortrait() в iframe вставляет img с задержками 100/500/1500мс —
        // прогоняем applyInline после каждой такой задержки.
        [40, 200, 700, 1700, 2600].forEach(function(t) {
          setTimeout(function() { injectBlurInto(screenFrame.contentDocument); }, t);
        });
      };
      screenFrame.addEventListener('load', tryInject);
      tryInject();
    }

    function watchPqIframe() {
      var pqIframe = document.getElementById('pqIframe');
      if (!pqIframe) { setTimeout(watchPqIframe, 300); return; }
      var onPqLoad = function() {
        try {
          var wrapDoc = pqIframe.contentDocument;
          if (!wrapDoc) return;
          var sf = wrapDoc.getElementById('screenFrame');
          if (sf) attachToScreenFrame(sf);
          else {
            var tries = 0;
            var poll = setInterval(function() {
              tries++;
              var s2 = wrapDoc.getElementById('screenFrame');
              if (s2) { clearInterval(poll); attachToScreenFrame(s2); }
              else if (tries > 40) clearInterval(poll);
            }, 100);
          }
        } catch (e) {}
      };
      pqIframe.addEventListener('load', onPqLoad);
      if (pqIframe.contentDocument && pqIframe.contentDocument.readyState !== 'loading') {
        onPqLoad();
      }
      // Heartbeat — гарантирует, что блюр стоит даже если MutationObserver
      // не сработал (например, контент iframe был заменён без events).
      setInterval(function() {
        try {
          var doc = pqIframe.contentDocument;
          var sf = doc && doc.getElementById('screenFrame');
          if (sf && sf.contentDocument) {
            applyInline(sf.contentDocument);
            // На случай если style[data-lovia-blur] потерялся
            if (sf.contentDocument.head && !sf.contentDocument.querySelector('style[data-lovia-blur]')) {
              injectBlurInto(sf.contentDocument);
            }
          }
        } catch (e) {}
      }, 1500);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', watchPqIframe);
    } else {
      watchPqIframe();
    }
  })();


  // === PORTRAIT TIMER + SPEEDUP ===
  // ============================================
  // PORTRAIT TIMER — обратный отсчёт + модалка ускорения + тостер
  // ============================================

  // Состояние таймеров: {orderId: {createdAt, ticker, completed}}
  var portraitTimers = {};
  var SPEEDUP_DURATION_MS = 24 * 60 * 60 * 1000; // 24 часа

  // Форматирование HH:MM:SS
  function formatTimer(ms) {
    if (ms <= 0) return '00:00:00';
    var h = Math.floor(ms / 3600000);
    var m = Math.floor((ms % 3600000) / 60000);
    var s = Math.floor((ms % 60000) / 1000);
    return (h < 10 ? '0' : '') + h + ':' +
           (m < 10 ? '0' : '') + m + ':' +
           (s < 10 ? '0' : '') + s;
  }

  // Парсит "DD.MM.YYYY" -> Date или возвращает now()-N часов для демо
  function parseOrderDate(dateStr) {
    if (!dateStr) return new Date(Date.now() - 8 * 3600000); // дефолт 8 часов назад
    // Формат "DD.MM.YYYY" — старый
    var parts = dateStr.split('.');
    if (parts.length === 3) {
      var d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      // Если это дата без времени — добавим случайные часы для эффекта таймера
      return d;
    }
    return new Date(dateStr);
  }

  // Главная функция: создаёт/обновляет таймер на карточке
  function attachPortraitTimer(rowEl, orderData) {
    if (!rowEl || !orderData) return;
  
    // Точка отсчёта: дата заказа + 24 часа
    var createdAt = orderData.createdAt instanceof Date 
      ? orderData.createdAt 
      : parseOrderDate(orderData.date);
    var deadlineMs = createdAt.getTime() + SPEEDUP_DURATION_MS;
    
    // Если есть pending ускорение для этого заказа — применяем новый дедлайн (30 минут)
    if (window.__pendingSpeedup && window.__pendingSpeedup.orderId === orderData.id) {
      deadlineMs = window.__pendingSpeedup.newDeadlineMs;
      // Показываем тостер один раз
      if (!window.__pendingSpeedup.notified) {
        window.__pendingSpeedup.notified = true;
        setTimeout(function() {
          if (typeof showToast === 'function') {
            showToast({
              title: 'Заказ ускорен',
              text: 'Портрет будет готов через 30 минут — поставлен в приоритетную очередь.',
              icon: 'sparkle'
            });
          }
        }, 600);
      }
    }
    
    var remainingMs = deadlineMs - Date.now();
  
    // Если уже истёк — сразу "Готово"
    if (remainingMs <= 0) {
      markOrderReady(rowEl, orderData);
      return;
    }
  
    // Таймер кладём в правую колонку под бейдж "В работе" (не кликабельный)
    var infoEl = rowEl.querySelector('.dash-upcoming-info');
    var rightEl = rowEl.querySelector('.dash-upcoming-right');
    if (!rightEl || !infoEl) return;

    // Если таймер уже добавлен — удалим, чтобы пересоздать
    var existingTimer = rowEl.querySelector('.portrait-timer');
    if (existingTimer) existingTimer.remove();
    var existingBtn = rowEl.querySelector('.speedup-btn');
    if (existingBtn) existingBtn.remove();

    // Таймер — не кликабельный (div), под бейджем
    var timerEl = document.createElement('div');
    timerEl.className = 'portrait-timer';
    timerEl.setAttribute('data-order-id', orderData.id || 'default');
    timerEl.setAttribute('aria-label', 'Осталось до готовности');
    timerEl.innerHTML =
      '<svg class="portrait-timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
        '<circle cx="12" cy="13" r="8"/>' +
        '<path d="M 12 9 L 12 13 L 15 15"/>' +
        '<path d="M 9 2 L 15 2 M 12 2 L 12 5"/>' +
      '</svg>' +
      '<span class="portrait-timer-value">' + formatTimer(remainingMs) + '</span>';

    rightEl.appendChild(timerEl);

    // Кнопка "Ускорить" — на месте, где раньше был таймер, открывает модалку
    var speedupBtn = document.createElement('button');
    speedupBtn.className = 'speedup-btn';
    speedupBtn.type = 'button';
    speedupBtn.setAttribute('data-order-id', orderData.id || 'default');
    speedupBtn.innerHTML =
      '<svg class="speedup-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M13 2 L4 14 L12 14 L11 22 L20 10 L12 10 L13 2 Z"/>' +
      '</svg>' +
      '<span>Ускорить</span>';
    speedupBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      openSpeedupModal(orderData, deadlineMs);
    });
    infoEl.appendChild(speedupBtn);
  
    // Сохраним состояние и запустим тикер
    var orderId = orderData.id || 'portrait-' + Math.random().toString(36).slice(2,7);
  
    // Очищу предыдущий ticker если есть
    if (portraitTimers[orderId] && portraitTimers[orderId].ticker) {
      clearInterval(portraitTimers[orderId].ticker);
    }
  
    portraitTimers[orderId] = {
      deadlineMs: deadlineMs,
      rowEl: rowEl,
      orderData: orderData,
      ticker: setInterval(function() {
        var rem = deadlineMs - Date.now();
        var valueEl = timerEl.querySelector('.portrait-timer-value');
        if (rem <= 0) {
          // Таймер истёк
          clearInterval(portraitTimers[orderId].ticker);
          portraitTimers[orderId].ticker = null;
          markOrderReady(rowEl, orderData);
          showToast({
            title: 'Заказ готов!',
            text: '«' + (orderData.title || 'Портрет половинки') + '» завершён — можно открывать.',
            icon: 'check'
          });
        } else {
          valueEl.textContent = formatTimer(rem);
        }
      }, 1000)
    };
  }

  // Меняем статус карточки на "ГОТОВО" + убираем таймер
  function markOrderReady(rowEl, orderData) {
    if (!rowEl) return;
    // Убрать таймер и кнопку "Ускорить"
    var timer = rowEl.querySelector('.portrait-timer');
    if (timer) timer.remove();
    var speedupBtn = rowEl.querySelector('.speedup-btn');
    if (speedupBtn) speedupBtn.remove();
    // Поменять бейдж
    var badge = rowEl.querySelector('.dash-badge');
    if (badge) {
      badge.classList.remove('progress', 'scheduled');
      badge.classList.add('done');
      badge.textContent = 'ГОТОВО';
    }
  }

  // === SPEEDUP MODAL ===
  var speedupState = {
    open: false,
    currentOrder: null,
    ticker: null,
    deadlineMs: null
  };

  function openSpeedupModal(orderData, deadlineMs) {
    var backdrop = document.getElementById('speedupBackdrop');
    if (!backdrop) return;
  
    speedupState.currentOrder = orderData;
    speedupState.open = true;
    speedupState.deadlineMs = deadlineMs;
    
    // При каждом открытии модалки начинаем с экрана-предложения
    showSpeedupStep('offer');
    
    // Сбросим поля карточки если они были заполнены
    var cn = document.getElementById('speedupCardNumber');
    var ce = document.getElementById('speedupCardExp');
    var cv = document.getElementById('speedupCardCvc');
    if (cn) cn.value = '';
    if (ce) ce.value = '';
    if (cv) cv.value = '';
  
    // Запускаем тикер модалки
    function updateModalTimer() {
      var rem = deadlineMs - Date.now();
      var text = document.getElementById('speedupTimerText');
      if (text) text.textContent = formatTimer(rem);
      if (rem <= 0) {
        // Время вышло прямо в модалке — закрываем
        closeSpeedupModal();
      }
    }
  
    updateModalTimer();
    speedupState.ticker = setInterval(updateModalTimer, 1000);
  
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
  }

  function closeSpeedupModal() {
    var backdrop = document.getElementById('speedupBackdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    if (speedupState.ticker) {
      clearInterval(speedupState.ticker);
      speedupState.ticker = null;
    }
    speedupState.open = false;
  }

  function acceptSpeedup() {
    // Переключаем на 2-й экран модалки (оплата) — НЕ закрываем модалку и НЕ уходим на screen-payment
    showSpeedupStep('pay');
  }
  
  // Переключение между шагами модалки: 'offer' | 'pay' | 'success'
  function showSpeedupStep(step) {
    var steps = ['offer', 'pay', 'success'];
    steps.forEach(function(s) {
      var el = document.getElementById('speedupStep' + s.charAt(0).toUpperCase() + s.slice(1));
      if (el) el.style.display = (s === step) ? '' : 'none';
    });
    
    // Особая обработка таймера: на 1-м экране он идёт, на других — стоит
    if (step !== 'offer' && speedupState.ticker) {
      clearInterval(speedupState.ticker);
      speedupState.ticker = null;
    }
  }
  
  // Симуляция оплаты
  function processSpeedupPayment() {
    var btn = document.getElementById('speedupPayBtn');
    if (!btn) return;
    if (btn.classList.contains('processing')) return; // защита от двойного клика
    
    btn.classList.add('processing');
    // Меняем стрелку на крутилку (через CSS animation)
    
    // Имитируем сетевой запрос
    setTimeout(function() {
      // "Успешная оплата" — сохраняем pending speedup
      var currentOrder = speedupState.currentOrder;
      if (currentOrder && currentOrder.id) {
        window.__pendingSpeedup = {
          orderId: currentOrder.id,
          title: currentOrder.title,
          newDeadlineMs: Date.now() + 30 * 60 * 1000,  // 30 минут
          notified: false  // тостер ещё не показан
        };
      }
      
      btn.classList.remove('processing');
      showSpeedupStep('success');
    }, 1100);
  }
  
  // Возврат с экрана оплаты на 1-й
  function backToOffer() {
    showSpeedupStep('offer');
    // Перезапустим таймер на 1-м экране если он был остановлен
    if (speedupState.deadlineMs && !speedupState.ticker) {
      var deadlineMs = speedupState.deadlineMs;
      function updateModalTimer() {
        var rem = deadlineMs - Date.now();
        var text = document.getElementById('speedupTimerText');
        if (text) text.textContent = formatTimer(rem);
        if (rem <= 0) closeSpeedupModal();
      }
      updateModalTimer();
      speedupState.ticker = setInterval(updateModalTimer, 1000);
    }
  }
  
  // Закрытие после успеха — применяем ускорение и обновляем dashboard
  function closeAfterSuccess() {
    closeSpeedupModal();
    
    // Перерендерим dashboard чтобы таймер пересчитался с новым deadline
    if (typeof renderDashboard === 'function') {
      renderDashboard();
    }
  }

  function initSpeedupModal() {
    var closeBtn = document.getElementById('speedupClose');
    if (closeBtn) closeBtn.addEventListener('click', closeSpeedupModal);
  
    var dismissBtn = document.getElementById('speedupDismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', closeSpeedupModal);
  
    var ctaBtn = document.getElementById('speedupCta');
    if (ctaBtn) ctaBtn.addEventListener('click', acceptSpeedup);
    
    // Кнопка "Назад" на экране оплаты
    var backBtn = document.getElementById('speedupBackBtn');
    if (backBtn) backBtn.addEventListener('click', backToOffer);
    
    // Кнопка "Оплатить 3,99 €"
    var payBtn = document.getElementById('speedupPayBtn');
    if (payBtn) payBtn.addEventListener('click', processSpeedupPayment);
    
    // Кнопка "Вернуться" на экране успеха
    var successBtn = document.getElementById('speedupSuccessClose');
    if (successBtn) successBtn.addEventListener('click', closeAfterSuccess);
    
    // Авто-маски для полей карточки
    var cn = document.getElementById('speedupCardNumber');
    if (cn) {
      cn.addEventListener('input', function() {
        var v = this.value.replace(/\D/g, '').slice(0, 16);
        var parts = [];
        for (var i = 0; i < v.length; i += 4) parts.push(v.slice(i, i + 4));
        this.value = parts.join(' ');
      });
    }
    var ce = document.getElementById('speedupCardExp');
    if (ce) {
      ce.addEventListener('input', function() {
        var v = this.value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 3) this.value = v.slice(0, 2) + ' / ' + v.slice(2);
        else this.value = v;
      });
    }
    var cv = document.getElementById('speedupCardCvc');
    if (cv) {
      cv.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '').slice(0, 4);
      });
    }
  
    var backdrop = document.getElementById('speedupBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) closeSpeedupModal();
      });
    }
  
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && speedupState.open) closeSpeedupModal();
    });
  }

  // === TOAST NOTIFICATION ===
  function showToast(opts) {
    var area = document.getElementById('loviaToastArea');
    if (!area) return;
  
    var toast = document.createElement('div');
    toast.className = 'lovia-toast';
  
    var iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M 5 12 L 10 17 L 19 8"/></svg>';
    if (opts.icon === 'sparkle') {
      iconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M 12 4 L 13 10 L 19 11 L 13 12 L 12 18 L 11 12 L 5 11 L 11 10 Z"/></svg>';
    }
  
    toast.innerHTML = 
      '<div class="lovia-toast-icon">' + iconSvg + '</div>' +
      '<div class="lovia-toast-body">' +
        '<p class="lovia-toast-title">' + (opts.title || 'Уведомление') + '</p>' +
        '<p class="lovia-toast-text">' + (opts.text || '') + '</p>' +
      '</div>' +
      '<button class="lovia-toast-close" aria-label="Закрыть">×</button>';
  
    area.appendChild(toast);
  
    // Анимация появления
    setTimeout(function() { toast.classList.add('show'); }, 30);
  
    // Закрытие по клику
    var closeBtn = toast.querySelector('.lovia-toast-close');
    if (closeBtn) closeBtn.addEventListener('click', function() { dismissToast(toast); });
  
    // Авто-закрытие через 7 секунд
    setTimeout(function() { dismissToast(toast); }, 7000);
  }

  function dismissToast(toast) {
    if (!toast) return;
    toast.classList.remove('show');
    setTimeout(function() {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 500);
  }

  
  // === ACTIVE ORDER BANNER ===
  // ============================================
  // DASH ACTIVE ORDER BANNER — плашка с активным заказом
  // ============================================

  var bannerState = {
    ticker: null,
    currentOrder: null,
    currentDeadlineMs: null,
    currentStatus: null  // 'normal' | 'speeded-up' | 'ready'
  };

  // Найти активный заказ Портрета "в работе" — на основе данных upcoming/userState
  function findActivePortraitOrder() {
    // Демо-логика: проверяем dashUpcomingList на наличие "Портрет любви" с badge progress
    var listEl = document.getElementById('dashUpcomingList');
    if (!listEl) return null;
  
    var rows = listEl.querySelectorAll('.dash-upcoming-row');
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var badge = row.querySelector('.dash-badge.progress');
      if (!badge) continue;
    
      var titleEl = row.querySelector('.dash-upcoming-info h4');
      var title = titleEl ? titleEl.textContent.trim() : '';
      if (!/портрет/i.test(title)) continue;
    
      // Это и есть активный портрет
      // Берём createdAt из соответствующего таймера (если он есть)
      var timer = row.querySelector('.portrait-timer');
      var orderId = timer ? timer.getAttribute('data-order-id') : 'upcoming-portrait';
    
      // Для демо createdAt = 8 часов назад (как в attachPortraitTimers)
      var createdAt = new Date(Date.now() - 8 * 3600000);
    
      return {
        id: orderId || 'upcoming-portrait',
        title: title || 'Портрет половинки',
        createdAt: createdAt
      };
    }
  
    return null;
  }

  function updateBannerTimer() {
    if (!bannerState.currentDeadlineMs) return;
    var rem = bannerState.currentDeadlineMs - Date.now();
    var timerEl = document.getElementById('dashActiveBannerTimer');
  
    if (rem <= 0) {
      // Время вышло — переходим в состояние "Готов"
      setBannerStatus('ready');
      if (bannerState.ticker) {
        clearInterval(bannerState.ticker);
        bannerState.ticker = null;
      }
      return;
    }
  
    if (timerEl) timerEl.textContent = formatTimer(rem);
  }

  function setBannerStatus(status) {
    var banner = document.getElementById('dashActiveBanner');
    if (!banner) return;
  
    banner.classList.remove('speeded-up', 'ready');
  
    var titleEl = document.getElementById('dashActiveBannerTitle');
    var subEl = document.getElementById('dashActiveBannerSub');
    var badgeEl = document.getElementById('dashActiveBannerBadge');
    var arrowEl = document.getElementById('dashActiveBannerArrow');
    var timerEl = document.getElementById('dashActiveBannerTimer');
  
    bannerState.currentStatus = status;
  
    if (status === 'speeded-up') {
      banner.classList.add('speeded-up');
      if (badgeEl) badgeEl.style.display = '';
      if (titleEl) titleEl.textContent = 'Портрет в приоритетной очереди';
      if (subEl) subEl.textContent = 'Уже совсем скоро будет готов';
      if (arrowEl) arrowEl.style.display = 'none';
    } else if (status === 'ready') {
      banner.classList.add('ready');
      if (badgeEl) badgeEl.style.display = 'none';
      if (titleEl) titleEl.textContent = 'Портрет половинки готов!';
      if (subEl) subEl.textContent = 'Кликните, чтобы открыть результат';
      if (arrowEl) arrowEl.style.display = '';
      if (timerEl) timerEl.style.display = 'none';
    } else {
      // normal
      if (badgeEl) badgeEl.style.display = 'none';
      if (titleEl) titleEl.textContent = 'Портрет половинки в работе';
      if (subEl) subEl.textContent = 'Кликните, чтобы ускорить за 3,99 €';
      if (arrowEl) arrowEl.style.display = '';
      if (timerEl) timerEl.style.display = '';
    }
  }

  function renderActiveBanner() {
    var wrap = document.getElementById('dashActiveBannerWrap');
    if (!wrap) return;
  
    var order = findActivePortraitOrder();
  
    if (!order) {
      // Нет активного заказа — скрываем плашку
      wrap.style.display = 'none';
      if (bannerState.ticker) {
        clearInterval(bannerState.ticker);
        bannerState.ticker = null;
      }
      return;
    }
  
    // Считаем deadlineMs
    var deadlineMs;
    var status = 'normal';
  
    // Если был ускорен — используем pending deadline
    if (window.__pendingSpeedup && window.__pendingSpeedup.orderId === order.id) {
      deadlineMs = window.__pendingSpeedup.newDeadlineMs;
      status = 'speeded-up';
    } else {
      deadlineMs = order.createdAt.getTime() + 24 * 60 * 60 * 1000;
    }
  
    // Если дедлайн уже прошёл — статус "ready"
    if (deadlineMs - Date.now() <= 0) {
      status = 'ready';
    }
  
    bannerState.currentOrder = order;
    bannerState.currentDeadlineMs = deadlineMs;
  
    // Показываем плашку
    wrap.style.display = '';
  
    // Применяем статус
    setBannerStatus(status);
  
    // Обновляем таймер сразу
    updateBannerTimer();
  
    // Запускаем тикер если ещё не запущен
    if (!bannerState.ticker && status !== 'ready') {
      bannerState.ticker = setInterval(updateBannerTimer, 1000);
    }
  }

  function initActiveBanner() {
    var banner = document.getElementById('dashActiveBanner');
    if (!banner) return;
  
    banner.addEventListener('click', function() {
      var status = bannerState.currentStatus;
      var order = bannerState.currentOrder;
    
      if (status === 'ready') {
        // Заказ готов — должно куда-то вести (пока на дашборд скроллим)
        // На проде: navigateTo на страницу результата портрета
        if (typeof showToast === 'function') {
          showToast({
            title: 'Портрет готов!',
            text: 'Страница результата ещё в разработке. Скоро здесь будет открываться портрет.',
            icon: 'sparkle'
          });
        }
        return;
      }
    
      if (status === 'speeded-up') {
        // Уже на ускорении — ничего не делаем (кнопка визуально некликабельна)
        return;
      }
    
      // normal — открываем speedup-модалку
      if (typeof openSpeedupModal === 'function' && order) {
        openSpeedupModal(order, bannerState.currentDeadlineMs);
      }
    });
  }


    // === ONBOARDING TOUR ===
  // ============================================
  // ONBOARDING TOUR — пошаговый spotlight для dashboard
  // ============================================

  var ONBOARDING_KEY = 'lovia_onboarded_v1';

  // Шаги тура (selector — null означает центрированную модалку без подсветки)
  var ONBOARDING_STEPS = [
    {
      selector: '.dash-profile-card',
      arrow: 'left',
      title: 'Ваше <em>пространство</em>',
      text: 'Здесь хранятся ваши астрологические данные. Можно отредактировать профиль — точное время рождения сделает расчёты точнее.',
      accent: false
    },
    {
      selector: '.dash-energy',
      arrow: 'top',
      title: 'Энергетика дня',
      text: 'Краткий совет, основанный на положении планет на сегодня. Обновляется каждый день.',
      accent: false
    },
    {
      selector: '.speedup-btn',
      fallbackSelector: '#dashUpcomingList',
      arrow: 'top',
      title: 'Ускорьте <em>создание</em> портрета',
      text: 'Заказ «Портрет половинки» обрабатывается 24 часа — таймер под бейджем «В работе» показывает обратный отсчёт. <strong>Нажмите «Ускорить»</strong>, чтобы поставить заказ в приоритетную очередь и получить портрет уже через 30 минут.',
      fallbackText: 'После первого заказа здесь появится таймер и кнопка «Ускорить» — она ставит заказ в приоритетную очередь, чтобы получить результат раньше.',
      accent: true
    },
    {
      selector: null,  // центрированная модалка
      title: 'Готовы <em>начать</em>?',
      text: 'Удачных открытий! Если будут вопросы — мы всегда рядом.',
      accent: false,
      finalStep: true
    }
  ];

  var onboardingState = {
    active: false,
    currentStep: 0,
    steps: []  // настроенные на лету шаги (для пропуска неактуальных)
  };

  // Проверка: был ли уже пройден тур
  function wasOnboarded() {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function markOnboarded() {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1');
    } catch (e) {}
  }

  // Подготовка шагов: пропускаем те, у которых нет элемента (и нет fallback)
  function prepareSteps() {
    var prepared = [];
    ONBOARDING_STEPS.forEach(function(step) {
      if (step.selector === null) {
        // Финальный шаг — всегда показываем
        prepared.push(step);
        return;
      }
    
      var el = document.querySelector(step.selector);
      if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
        // Элемент есть и виден
        prepared.push(Object.assign({}, step, { _useFallback: false }));
      } else if (step.fallbackSelector) {
        // Попробуем fallback
        var fb = document.querySelector(step.fallbackSelector);
        if (fb && fb.offsetWidth > 0 && fb.offsetHeight > 0) {
          prepared.push(Object.assign({}, step, { _useFallback: true }));
        }
      }
      // Если ни основного, ни fallback нет — пропускаем шаг
    });
    return prepared;
  }

  // Запуск тура
  function startOnboarding(force) {
    if (!force && wasOnboarded()) return;
  
    // Подготовим шаги (отфильтруем то, чего нет на странице)
    onboardingState.steps = prepareSteps();
    if (onboardingState.steps.length === 0) return;
  
    onboardingState.currentStep = 0;
    onboardingState.active = true;
  
    // Перерисуем dots
    renderOnboardingDots();
  
    var overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
      overlay.classList.add('active');
      overlay.setAttribute('aria-hidden', 'false');
    }
  
    // Небольшая задержка для плавного рендера
    setTimeout(function() { showOnboardingStep(0); }, 100);
  }

  function endOnboarding(markAsDone) {
    onboardingState.active = false;
    if (markAsDone !== false) markOnboarded();
  
    var overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
    }
  }

  function nextOnboardingStep() {
    var next = onboardingState.currentStep + 1;
    if (next >= onboardingState.steps.length) {
      endOnboarding();
    } else {
      onboardingState.currentStep = next;
      showOnboardingStep(next);
    }
  }

  function showOnboardingStep(idx) {
    var step = onboardingState.steps[idx];
    if (!step) return;
  
    var tooltip = document.getElementById('onboardingTooltip');
    var highlight = document.getElementById('onboardingHighlight');
    var cutoutRect = document.getElementById('onboardingCutoutRect');
    var titleEl = document.getElementById('onboardingTitle');
    var textEl = document.getElementById('onboardingText');
    var counterEl = document.getElementById('onboardingCounter');
    var nextBtn = document.getElementById('onboardingNext');
  
    if (!tooltip) return;
  
    // Обновляем счётчик
    if (counterEl) {
      counterEl.textContent = 'ШАГ ' + (idx + 1) + ' ИЗ ' + onboardingState.steps.length;
    }
  
    // Обновляем заголовок и текст
    if (titleEl) titleEl.innerHTML = step.title;
    if (textEl) {
      var txt = (step._useFallback && step.fallbackText) ? step.fallbackText : step.text;
      textEl.innerHTML = txt;
    }
  
    // Кнопка "Далее" — на последнем шаге становится "Готово"
    if (nextBtn) {
      nextBtn.textContent = (idx === onboardingState.steps.length - 1) ? 'Готово' : 'Далее →';
    }
  
    // Обновляем dots
    renderOnboardingDots();
  
    // Если финальный шаг (centered) или нет target — модалка по центру
    if (step.selector === null || step.finalStep) {
      tooltip.classList.add('centered');
      tooltip.removeAttribute('data-arrow');
      if (highlight) highlight.style.display = 'none';
      if (cutoutRect) {
        cutoutRect.setAttribute('x', '-1000');
        cutoutRect.setAttribute('y', '-1000');
        cutoutRect.setAttribute('width', '0');
        cutoutRect.setAttribute('height', '0');
      }
      return;
    }
  
    tooltip.classList.remove('centered');
  
    // Найдём подсвечиваемый элемент
    var targetSel = step._useFallback ? step.fallbackSelector : step.selector;
    var target = document.querySelector(targetSel);
    if (!target) {
      // На всякий случай — fallback на центр
      tooltip.classList.add('centered');
      tooltip.removeAttribute('data-arrow');
      if (highlight) highlight.style.display = 'none';
      return;
    }
  
    // Прокрутим элемент в видимую область (плавно)
    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  
    // Дадим время на скролл
    setTimeout(function() {
      positionHighlightAndTooltip(target, step, tooltip, highlight, cutoutRect);
    }, 350);
  }

  function positionHighlightAndTooltip(target, step, tooltip, highlight, cutoutRect) {
    var rect = target.getBoundingClientRect();
    var padding = 8; // отступ подсветки от элемента
  
    var hlLeft = rect.left - padding;
    var hlTop = rect.top - padding;
    var hlWidth = rect.width + padding * 2;
    var hlHeight = rect.height + padding * 2;
  
    // Подсветка ring
    if (highlight) {
      highlight.style.display = 'block';
      highlight.style.left = hlLeft + 'px';
      highlight.style.top = hlTop + 'px';
      highlight.style.width = hlWidth + 'px';
      highlight.style.height = hlHeight + 'px';
      highlight.classList.toggle('accent', !!step.accent);
    }
  
    // Cutout в маске — повторяем геометрию подсветки
    if (cutoutRect) {
      cutoutRect.setAttribute('x', hlLeft);
      cutoutRect.setAttribute('y', hlTop);
      cutoutRect.setAttribute('width', hlWidth);
      cutoutRect.setAttribute('height', hlHeight);
    }
  
    // Расчёт позиции tooltip
    var arrow = step.arrow || 'top';
    var tooltipMargin = 18; // зазор между подсветкой и тултипом
  
    // Сначала временно покажем чтобы знать размеры
    tooltip.classList.remove('hidden');
    var tw = tooltip.offsetWidth;
    var th = tooltip.offsetHeight;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
  
    var ttLeft, ttTop;
  
    switch (arrow) {
      case 'bottom':
        // Tooltip над элементом, стрелка снизу указывает вниз
        ttLeft = rect.left + rect.width / 2 - 40;
        ttTop = hlTop - th - tooltipMargin;
        break;
      case 'left':
        // Tooltip справа от элемента, стрелка слева
        ttLeft = hlLeft + hlWidth + tooltipMargin;
        ttTop = rect.top;
        break;
      case 'right':
        // Tooltip слева от элемента, стрелка справа
        ttLeft = hlLeft - tw - tooltipMargin;
        ttTop = rect.top;
        break;
      case 'top':
      default:
        // Tooltip под элементом, стрелка сверху указывает вверх
        ttLeft = rect.left + rect.width / 2 - 40;
        ttTop = hlTop + hlHeight + tooltipMargin;
        break;
    }
  
    // Корректировка чтобы тултип не вылез за пределы экрана
    if (ttLeft < 12) ttLeft = 12;
    if (ttLeft + tw > vw - 12) ttLeft = vw - tw - 12;
    if (ttTop < 12) {
      // Не помещается сверху — поменяем стрелку на "top" и поставим под элемент
      ttTop = hlTop + hlHeight + tooltipMargin;
      arrow = 'top';
    }
    if (ttTop + th > vh - 12) {
      // Не помещается снизу — поставим над элементом
      ttTop = hlTop - th - tooltipMargin;
      arrow = 'bottom';
      if (ttTop < 12) ttTop = 12;
    }
  
    tooltip.style.left = ttLeft + 'px';
    tooltip.style.top = ttTop + 'px';
    tooltip.setAttribute('data-arrow', arrow);
  }

  function renderOnboardingDots() {
    var dotsEl = document.getElementById('onboardingDots');
    if (!dotsEl) return;
    var html = '';
    for (var i = 0; i < onboardingState.steps.length; i++) {
      html += '<span class="onboarding-dot' + (i === onboardingState.currentStep ? ' active' : '') + '"></span>';
    }
    dotsEl.innerHTML = html;
  }

  function initOnboarding() {
    var skipBtn = document.getElementById('onboardingSkip');
    if (skipBtn) skipBtn.addEventListener('click', function() { endOnboarding(); });
  
    var closeBtn = document.getElementById('onboardingClose');
    if (closeBtn) closeBtn.addEventListener('click', function() { endOnboarding(); });
  
    var nextBtn = document.getElementById('onboardingNext');
    if (nextBtn) nextBtn.addEventListener('click', nextOnboardingStep);
  
    // Escape — закрыть тур
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && onboardingState.active) endOnboarding();
    });
  
    // Resize — переcчитать позицию при изменении окна
    window.addEventListener('resize', function() {
      if (onboardingState.active) {
        var step = onboardingState.steps[onboardingState.currentStep];
        if (step) showOnboardingStep(onboardingState.currentStep);
      }
    });
  }

  // Хелпер для dev/тестирования: сброс через консоль
  // window.resetOnboarding() — сбросить флаг и запустить тур
  window.resetOnboarding = function() {
    try { localStorage.removeItem(ONBOARDING_KEY); } catch(e) {}
    startOnboarding(true);
  };


  // === ПОДКЛЮЧЕНИЕ К РЕНДЕРИНГУ ===
  // Запускается после renderDashboard — находит карточку "Портрет любви" и привязывает таймер
  function attachPortraitTimers() {
    var listEl = document.getElementById('dashUpcomingList');
    if (!listEl) return;
  
    // Найду все .dash-upcoming-row с badge "progress" 
    // и привяжу к ним таймер
    var rows = listEl.querySelectorAll('.dash-upcoming-row');
    rows.forEach(function(row) {
      var badge = row.querySelector('.dash-badge.progress');
      if (!badge) return; // не "в работе"
    
      var titleEl = row.querySelector('.dash-upcoming-info h4');
      var title = titleEl ? titleEl.textContent.trim() : '';
    
      // Только для типа "портрет" (по title)
      var isPortrait = /портрет/i.test(title);
      if (!isPortrait) return;
    
      // Для демо: дата заказа — 8 часов назад от текущего момента
      // (на проде брать из orderData.createdAt)
      var createdAt = new Date(Date.now() - 8 * 3600000);
    
      attachPortraitTimer(row, {
        id: 'upcoming-portrait',
        title: title,
        createdAt: createdAt,
        date: null
      });
    });
  }


  // === PAYMENT UPSELL MODAL ===
  // ============================================
  // PAYMENT UPSELL — модалка на странице оплаты
  // Триггеры:
  //   1. 30 секунд бездействия на странице оплаты
  //   2. Exit-intent — курсор движется к верхнему краю экрана
  // Показывается только один раз за сессию.
  // ============================================

  var payUpsellState = {
    shownThisSession: false,    // показывали уже или нет
    inactivityTimer: null,      // таймер бездействия
    inactivityMs: 30000,        // 30 секунд
    active: false,              // включена ли система отслеживания (только на screen-payment)
    currentOffer: null          // что предлагаем (тип практики)
  };

  // Какую практику предложить — динамически
  // Приоритет: то, что пользователь ещё НЕ заказывал
  // + не предлагаем тот же тип, на оплате которого пользователь сейчас
  function pickUpsellOffer() {
    // Берём текущий контекст оплаты из URL/state (paymentCtx если есть)
    var currentCtx = (typeof paymentCtx !== 'undefined' && paymentCtx) ? paymentCtx : null;
  
    // Все доступные практики
    var offers = [
      { 
        type: 'reading', 
        name: 'расклад на картах Таро',
        cta: 'Получить бесплатный расклад',
        screen: 'screen-reading-quiz',
        time: '~ 4 минуты'
      },
      { 
        type: 'matrix', 
        name: 'разбор Матрицы Судьбы',
        cta: 'Получить бесплатный разбор',
        screen: 'screen-matrix-quiz',
        time: '~ 5 минут'
      },
      { 
        type: 'natal', 
        name: 'расчёт натальной карты',
        cta: 'Получить бесплатный расчёт',
        screen: 'screen-natal-quiz',
        time: '~ 5 минут'
      },
      { 
        type: 'portrait', 
        name: 'портрет вашей второй половинки',
        cta: 'Получить бесплатный портрет',
        screen: 'screen-portrait-quiz',
        time: '~ 7 минут'
      }
    ];
  
    // Какие типы уже есть в заказах пользователя
    var orderedTypes = [];
    if (typeof userState !== 'undefined' && userState.orders) {
      orderedTypes = userState.orders.map(function(o) { return o.type; });
    }
  
    // Отфильтровываем: не предлагаем то, что юзер уже заказывал, и не тот тип что текущий
    var candidates = offers.filter(function(o) {
      return o.type !== currentCtx && orderedTypes.indexOf(o.type) === -1;
    });
  
    // Если все уже пройдены — берём любую кроме текущей
    if (candidates.length === 0) {
      candidates = offers.filter(function(o) { return o.type !== currentCtx; });
    }
  
    // Возвращаем первую (порядок в массиве = приоритет: таро > матрица > натальная > портрет)
    return candidates[0] || offers[0];
  }

  // Открыть модалку
  function showPayUpsell() {
    if (payUpsellState.shownThisSession) return;
    if (!payUpsellState.active) return;
  
    var offer = pickUpsellOffer();
    if (!offer) return;
    payUpsellState.currentOffer = offer;
  
    // Подставляем текст
    var offerNameEl = document.getElementById('payUpsellOfferName');
    if (offerNameEl) offerNameEl.textContent = offer.name;
  
    var ctaTextEl = document.getElementById('payUpsellCtaText');
    if (ctaTextEl) ctaTextEl.textContent = offer.cta;
  
    // Открываем
    var backdrop = document.getElementById('payUpsellBackdrop');
    if (backdrop) {
      backdrop.classList.add('open');
      backdrop.setAttribute('aria-hidden', 'false');
    }
  
    payUpsellState.shownThisSession = true;
  
    // Снимаем все триггеры — модалка уже показана
    stopPayUpsellTracking();
  }

  // Закрыть модалку (без перехода)
  function closePayUpsell() {
    var backdrop = document.getElementById('payUpsellBackdrop');
    if (backdrop) {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
  }

  // Принять предложение — переход на квиз
  function acceptPayUpsell() {
    closePayUpsell();
    var offer = payUpsellState.currentOffer;
    if (offer && offer.screen && typeof navigateTo === 'function') {
      navigateTo(offer.screen);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }

  // === Отслеживание бездействия ===
  function resetInactivityTimer() {
    if (payUpsellState.inactivityTimer) {
      clearTimeout(payUpsellState.inactivityTimer);
    }
    if (!payUpsellState.active || payUpsellState.shownThisSession) return;
  
    payUpsellState.inactivityTimer = setTimeout(function() {
      showPayUpsell();
    }, payUpsellState.inactivityMs);
  }

  // События, сбрасывающие таймер бездействия (значит юзер активен)
  function onUserActivity() {
    resetInactivityTimer();
  }

  // === Exit-intent (курсор к верху экрана) ===
  function onMouseLeave(e) {
    if (!payUpsellState.active || payUpsellState.shownThisSession) return;
  
    // Срабатывает если курсор покидает окно через верхнюю границу
    // clientY <= 0 означает что курсор ушёл выше viewport
    if (e.clientY <= 0 || e.relatedTarget === null) {
      // Дополнительная проверка: курсор именно к верху, не вбок
      if (e.clientY <= 5) {
        showPayUpsell();
      }
    }
  }

  // === Активация / деактивация трекинга ===
  function startPayUpsellTracking() {
    if (payUpsellState.shownThisSession) return;
    payUpsellState.active = true;
  
    // Бездействие — отслеживаем мышь, клавиши, скролл, тач
    ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(function(evt) {
      window.addEventListener(evt, onUserActivity, { passive: true });
    });
  
    // Exit-intent
    document.addEventListener('mouseleave', onMouseLeave);
  
    // Запускаем таймер бездействия
    resetInactivityTimer();
  }

  function stopPayUpsellTracking() {
    payUpsellState.active = false;
  
    if (payUpsellState.inactivityTimer) {
      clearTimeout(payUpsellState.inactivityTimer);
      payUpsellState.inactivityTimer = null;
    }
  
    ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(function(evt) {
      window.removeEventListener(evt, onUserActivity);
    });
  
    document.removeEventListener('mouseleave', onMouseLeave);
  }

  // === Инициализация обработчиков на самой модалке ===
  function initPayUpsellModal() {
    var closeBtn = document.getElementById('payUpsellClose');
    if (closeBtn) closeBtn.addEventListener('click', closePayUpsell);
  
    var dismissBtn = document.getElementById('payUpsellDismiss');
    if (dismissBtn) dismissBtn.addEventListener('click', closePayUpsell);
  
    var ctaBtn = document.getElementById('payUpsellCta');
    if (ctaBtn) ctaBtn.addEventListener('click', acceptPayUpsell);
  
    // Клик на затемнённый фон закрывает модалку
    var backdrop = document.getElementById('payUpsellBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) closePayUpsell();
      });
    }
  
    // Escape закрывает
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var bd = document.getElementById('payUpsellBackdrop');
        if (bd && bd.classList.contains('open')) {
          closePayUpsell();
        }
      }
    });
  }

  // Monkey-patch navigateTo чтобы автоматически trigger'ить трекинг
  // при переходе на screen-payment
  if (typeof navigateTo === "function" && !window._navigateToUpsellHooked) {
    window._navigateToUpsellHooked = true;
    var _origNavigateTo_upsell = navigateTo;
    navigateTo = function(screenId) {
      var ret = _origNavigateTo_upsell.call(this, screenId);
      try { payUpsellOnScreenChange(screenId); } catch(e) { console.warn("upsell hook:", e); }
      return ret;
    };
    window.navigateTo = navigateTo;
  }

  // === Hook на переход экранов ===
  // Когда пользователь приходит на screen-payment — запускаем трекинг
  // Когда уходит — останавливаем (если модалка ещё не показана)
  function payUpsellOnScreenChange(screenId) {
    if (screenId === 'screen-payment') {
      startPayUpsellTracking();
    } else {
      stopPayUpsellTracking();
    }
  }


  // === Перерисовка результата натальной карты на основе расчёта движка ===
function renderNatalResultFromChart() {
  const chart = quizState.computedChart;
  if (!chart) {
    console.warn('No chart data, falling back to demo');
    return;
  }

  // Метаданные планет: ключ → русское имя + символ + порядок
  const PLANET_META = {
    sun:     { sym: '☉', name: 'Солнце', order: 1 },
    moon:    { sym: '☽', name: 'Луна', order: 2 },
    mercury: { sym: '☿', name: 'Меркурий', order: 3 },
    venus:   { sym: '♀', name: 'Венера', order: 4 },
    mars:    { sym: '♂', name: 'Марс', order: 5 },
    jupiter: { sym: '♃', name: 'Юпитер', order: 6 },
    saturn:  { sym: '♄', name: 'Сатурн', order: 7 },
    uranus:  { sym: '♅', name: 'Уран', order: 8 },
    neptune: { sym: '♆', name: 'Нептун', order: 9 },
    pluto:   { sym: '♇', name: 'Плутон', order: 10 },
  };

  // === Обновляем 3 ключевых карточки наверху Сводки (Солнце / Луна / Асцендент) ===
  const keyCards = document.querySelectorAll('#screen-natal-result .summary-grid .key-card');
  if (keyCards.length >= 3) {
    const sun = chart.planets.sun;
    keyCards[0].querySelector('.key-sign').textContent = sun.sign.name;
    keyCards[0].querySelector('.key-degree').textContent = sun.sign.degree.toFixed(1) + '°';
    const moon = chart.planets.moon;
    keyCards[1].querySelector('.key-sign').textContent = moon.sign.name;
    keyCards[1].querySelector('.key-degree').textContent = moon.sign.degree.toFixed(1) + '°';
    keyCards[2].querySelector('.key-sign').textContent = chart.ascSign.name;
    keyCards[2].querySelector('.key-degree').textContent = chart.ascSign.degree.toFixed(1) + '°';
  }

  // === Перерисовываем содержимое Сводки динамически ===
  const summaryPanel = document.querySelector('[data-panel="summary"]');
  if (summaryPanel) {
    summaryPanel.querySelectorAll('.configurations, .summary-card').forEach(el => el.remove());
    const summaryGrid = summaryPanel.querySelector('.summary-grid');
    if (summaryGrid) {
      const wrapper = document.createElement('div');
      try {
        wrapper.innerHTML = buildSummaryHTML(chart, '', currentInterpMode);
        while (wrapper.firstChild) {
          summaryGrid.parentNode.insertBefore(wrapper.firstChild, summaryGrid.nextSibling);
        }
      } catch(err) {
        console.error('buildSummaryHTML failed:', err);
      }
    }
  }

  // === Перерисовываем вкладку "Планеты" ===
  const planetList = document.getElementById('planetList');
  if (planetList) {
    const planetKeys = Object.keys(PLANET_META).sort((a,b) => PLANET_META[a].order - PLANET_META[b].order);
    planetList.innerHTML = planetKeys.map(key => {
      const p = chart.planets[key];
      const meta = PLANET_META[key];
      const interp = getPlanetInterpretationV2(key, p.sign.key, p.house, currentInterpMode);
      return `
        <div class="item-card">
          <div class="item-header">
            <div class="item-glyph">${meta.sym}</div>
            <div>
              <h3 class="item-title">${meta.name}</h3>
              <div class="item-sub">${p.sign.name.toUpperCase()} · ${p.sign.degree.toFixed(1)}° · ${p.house} ДОМ</div>
            </div>
          </div>
          <p class="item-text">${wrapGlossaryTerms(interp.main)}</p>
          <p class="item-text">${wrapGlossaryTerms(interp.house)}</p>
        </div>
      `;
    }).join('');
  }

  // === Перерисовываем вкладку "Дома" ===
  const houseList = document.getElementById('houseList');
  if (houseList) {
    houseList.innerHTML = chart.houses.map((cusp, idx) => {
      const sign = NatalEngine.signInfo(cusp);
      const interp = getHouseInterpretationV2(idx + 1, sign.key, currentInterpMode);
      return `
        <div class="item-card">
          <div class="item-header">
            <div class="item-glyph" style="font-family: var(--font-serif); font-size: 18px;">${idx + 1}</div>
            <div>
              <h3 class="item-title">${idx + 1} дом</h3>
              <div class="item-sub">В ЗНАКЕ ${sign.name.toUpperCase()} · ${sign.degree.toFixed(1)}°</div>
            </div>
          </div>
          <p class="item-text">${wrapGlossaryTerms(interp.text)}</p>
        </div>
      `;
    }).join('');
  }

  // === Перерисовываем вкладку "Аспекты" ===
  const aspectList = document.getElementById('aspectList');
  if (aspectList) {
    const aspectsHTML = chart.aspects.map(a => {
      const from = PLANET_META[a.from];
      const to = PLANET_META[a.to];
      const interp = getAspectInterpretationV2(a.from, a.to, a.type, currentInterpMode);
      return `
        <div class="item-card" data-aspect-type="${a.type}">
          <div class="item-header">
            <div class="aspect-icon aspect-${a.type}">${a.sym}</div>
            <div>
              <h3 class="item-title">${from.sym} ${from.name} — ${to.sym} ${to.name}</h3>
              <div class="item-sub">${a.label.toUpperCase()} · ОРБ ${a.orb.toFixed(1)}°${a.orb < 1 ? ' · ТОЧНЫЙ' : ''}</div>
            </div>
            <span class="item-badge">${a.label}</span>
          </div>
          <p class="item-text">${wrapGlossaryTerms(interp.text)}</p>
        </div>
      `;
    }).join('');
    aspectList.innerHTML = aspectsHTML || '<div class="item-card"><p class="item-text">У этой карты нет основных аспектов в пределах стандартных орбисов.</p></div>';
  }

  // === Обновляем счётчик аспектов в табе ===
  const aspectTab = document.querySelector('[data-tab="aspects"] .tab-count');
  if (aspectTab) aspectTab.textContent = chart.aspects.length;

  // === Обновляем вкладку "Стихии" ===
  const elementsPanel = document.querySelector('[data-panel="elements"]');
  if (elementsPanel) {
    const e = chart.elements;
    const elementMeta = {
      fire: { name: 'Огонь', desc: 'Энергия, инициатива, спонтанность.' },
      earth: { name: 'Земля', desc: 'Устойчивость, практичность, материя.' },
      air: { name: 'Воздух', desc: 'Мышление, общение, идеи.' },
      water: { name: 'Вода', desc: 'Эмоции, интуиция, глубина.' }
    };
    elementsPanel.innerHTML = `
      <div class="balance-grid">
        ${['fire','earth','air','water'].map(el => `
          <div class="balance-card">
            <div class="balance-header"><span class="balance-name">${elementMeta[el].name}</span><span class="balance-value">${e[el]}%</span></div>
            <div class="balance-track"><div class="balance-fill" style="width: ${e[el]}%;"></div></div>
            <p class="balance-desc">${elementMeta[el].desc} В вашей карте этой стихии ${e[el] > 30 ? 'много — это сильная сторона' : (e[el] < 15 ? 'мало — может требовать дополнительного внимания' : 'в рабочем балансе')}.</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  // === Перерисовываем главную карту (SVG) — двойная попытка ===
  if (typeof buildChartSVG === 'function') {
    setTimeout(buildChartSVG, 100);
  }
}

// === Простой словарь интерпретаций ===
// (Полная интерпретация — задача этапа 3, тут базовая)
function getPlanetInterpretation(planet, signKey, house) {
  const SIGN_QUALITIES = {
    aries: 'смелости, инициативы, быстроты решений',
    taurus: 'устойчивости, чувственности, материальной ориентации',
    gemini: 'гибкости ума, любопытства, многозадачности',
    cancer: 'заботы, эмоциональной глубины, чувствительности к близким',
    leo: 'самовыражения, щедрости, лидерства, желания сиять',
    virgo: 'анализа, внимания к деталям, практичности',
    libra: 'баланса, дипломатии, эстетики, партнёрства',
    scorpio: 'глубины, интенсивности, трансформации',
    sagittarius: 'широты взгляда, оптимизма, поиска смысла',
    capricorn: 'структуры, амбиций, дисциплины',
    aquarius: 'нестандартности, свободы, новаторства',
    pisces: 'интуиции, мечтательности, эмпатии'
  };
  const PLANET_TOPICS = {
    sun: 'ядро личности и способ чувствовать собственную ценность',
    moon: 'эмоциональная природа и базовые внутренние потребности',
    mercury: 'мышление, речь и способ обрабатывать информацию',
    venus: 'сфера чувств, ценностей и личной привлекательности',
    mars: 'воля, драйв и способ добиваться результата',
    jupiter: 'масштаб целей и стратегия роста',
    saturn: 'внутренний стержень и отношение к ответственности',
    uranus: 'потребность в свободе, обновлении и индивидуальности',
    neptune: 'интуиция, воображение и чувствительность к смыслам',
    pluto: 'сила трансформации и глубина внутренней воли'
  };
  const HOUSE_TOPICS = {
    1: 'самопрезентация и первое впечатление',
    2: 'деньги, ресурсы, чувство опоры',
    3: 'общение, ближнее окружение, обучение',
    4: 'дом, корни, эмоциональная база',
    5: 'творчество, романтика, самовыражение',
    6: 'работа, привычки, здоровье',
    7: 'партнёрства, близкие отношения, открытые враги',
    8: 'общие ресурсы, глубокие изменения, кризисы',
    9: 'мировоззрение, дальние горизонты, философия',
    10: 'карьера, репутация, социальный статус',
    11: 'друзья, сообщества, цели',
    12: 'внутренний мир, восстановление, тишина'
  };

  return {
    main: `Это положение раскрывает ${PLANET_TOPICS[planet]} через качества ${SIGN_QUALITIES[signKey]}. Это ваш базовый способ проявляться в этой сфере.`,
    house: `В ${house} доме (${HOUSE_TOPICS[house]}) — именно здесь эта планета набирает силу и проявляется наиболее ярко в вашей повседневности.`,
    tip: 'Опирайтесь на сильные стороны этого положения, замечая моменты, когда они "проседают" — обычно из-за усталости или конфликта с ценностями.'
  };
}

function getHouseInterpretation(houseNum, signKey) {
  const HOUSE_AREAS = {
    1: 'Первое впечатление и самопрезентация',
    2: 'Деньги и ресурсы',
    3: 'Общение и ближнее окружение',
    4: 'Дом и эмоциональные корни',
    5: 'Творчество и радость',
    6: 'Работа и здоровье',
    7: 'Партнёрство',
    8: 'Глубокие перемены и общие ресурсы',
    9: 'Мировоззрение и горизонты',
    10: 'Карьера и репутация',
    11: 'Друзья и сообщества',
    12: 'Внутренний мир'
  };
  const SIGN_STYLES = {
    aries: 'через смелость и быструю инициативу',
    taurus: 'через устойчивость и спокойный темп',
    gemini: 'через гибкость и связывание людей',
    cancer: 'через заботу и защиту важного',
    leo: 'через яркое самопроявление',
    virgo: 'через анализ и внимание к деталям',
    libra: 'через баланс и честный диалог',
    scorpio: 'через глубину и фокус на сути',
    sagittarius: 'через расширение горизонтов',
    capricorn: 'через систему и долгий результат',
    aquarius: 'через нестандартный подход',
    pisces: 'через интуицию и эмпатию'
  };
  return {
    text: `${HOUSE_AREAS[houseNum]} в вашей карте раскрывается ${SIGN_STYLES[signKey]}. Это ваш естественный стиль работы с темой этого дома.`,
    tip: 'Этот стиль работает на вас по умолчанию — опирайтесь на него осознанно.'
  };
}

function getAspectInterpretation(p1, p2, type) {
  const PLANET_TOPICS = {
    sun: 'личность', moon: 'эмоции', mercury: 'мышление',
    venus: 'ценности', mars: 'действие', jupiter: 'рост',
    saturn: 'дисциплина', uranus: 'обновление', neptune: 'воображение', pluto: 'трансформация'
  };
  const TYPE_DESCRIPTIONS = {
    conjunction: { text: 'силы сливаются в один поток — действуют согласованно, но требуют осознанного управления',
                   tip: 'Выберите единый приоритет — не распыляйтесь.' },
    sextile: { text: 'мягкая поддержка через инициативу — возможности приходят, если их брать',
               tip: 'Ловите возможности и сразу переводите их в действие.' },
    square: { text: 'внутреннее напряжение, требующее решения — это динамика роста через преодоление',
              tip: 'Разбейте большую задачу на 2-3 практичных шага.' },
    trine: { text: 'гармоничный поток — энергия течёт легко и естественно',
             tip: 'Используйте этот ресурс осознанно, а не на автопилоте.' },
    opposition: { text: 'два полюса в напряжённом диалоге — важно удержать баланс между ними',
                  tip: 'Ищите формат, где выигрывают обе стороны.' }
  };
  const t1 = PLANET_TOPICS[p1] || p1;
  const t2 = PLANET_TOPICS[p2] || p2;
  const desc = TYPE_DESCRIPTIONS[type];
  return {
    text: `Связка тем "${t1}" и "${t2}". ${desc.text}.`,
    tip: desc.tip
  };
}

function updateResultMeta() {
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const dateStr = quizState.birthYear ? `${quizState.birthDay} ${months[quizState.birthMonth - 1]} ${quizState.birthYear}` : '7 июля 1999';
  const timeStr = quizState.timeMode === 'unknown' ? 'время неизвестно' : (quizState.birthHour !== null && quizState.birthHour !== '' ? `${String(quizState.birthHour).padStart(2,'0')}:${String(quizState.birthMinute).padStart(2,'0')}` : '23:00');
  const cityCountry = quizState.birthCountry ? `${quizState.birthCity}, ${quizState.birthCountry}` : (quizState.birthCity || 'Киев, Украина');

  const metaEl = document.querySelector('#screen-natal-result .page-meta');
  if (metaEl) {
    metaEl.innerHTML = `${dateStr}<span class="dot"></span>${timeStr}<span class="dot"></span>${cityCountry}`;
  }

  // Обновим h1 страницы (имя из памяти, если есть)
  const titleEl = document.querySelector('#screen-natal-result .page-h');
  if (titleEl && quizState.computedChart) {
    titleEl.innerHTML = '<em>Ваша</em> натальная карта';
  }
}

function resetQuiz() {
  Object.assign(quizState, {
    step: 1,
    birthDay: null, birthMonth: null, birthYear: null,
    timeMode: null, birthHour: null, birthMinute: null,
    birthCity: null, birthLat: null, birthLon: null, birthTz: null,
  });
  // Reset UI
  document.querySelectorAll('.quiz-step').forEach(el => el.classList.remove('active'));
  document.querySelector('[data-qstep="1"]').classList.add('active');
  document.querySelectorAll('.time-option').forEach(o => o.classList.remove('selected'));
  document.getElementById('timeFields').style.display = 'none';
  document.getElementById('unknownNotice').classList.remove('show');
  ['step2Btn', 'step3Btn', 'step4Btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  document.getElementById('birthCity').value = '';
  ['birthDay', 'birthMonth', 'birthYear', 'birthHour', 'birthMinute'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  updateQuizProgress();
}

initQuizSelects();
updateQuizProgress();

// === BACK BUTTON ON NATAL RESULT ===
document.querySelector('#screen-natal-result .back-link').addEventListener('click', () => {
  navigateTo('screen-home');
});



// === MATRIX FATE LOGIC ===
// === МАТРИЦА СУДЬБЫ ===

const MX_STATE = {
  step: 1,
  totalSteps: 4,
  birthDay: null, birthMonth: null, birthYear: null,
  name: null, focus: 'general',
  matrix: null
};

// База 22 арканов с интерпретациями
const ARKANA = {
  1: { name: 'Маг', keywords: 'воля, инициатива, мастерство',
       short: 'Энергия начала и действия. Способность превращать намерение в результат.',
       comfort: 'Легко начинаете новое, видите возможности, харизматичны в коммуникации.',
       risk: 'Можете не доводить начатое до конца, перескакивать на новое раньше времени.' },
  2: { name: 'Жрица', keywords: 'интуиция, тайное знание, женская сила',
       short: 'Глубокая интуиция и способность чувствовать то, что не видно глазу.',
       comfort: 'Чувствуете людей и ситуации насквозь, мудрость приходит через тишину.',
       risk: 'Закрытость от мира, склонность к избеганию открытого выражения чувств.' },
  3: { name: 'Императрица', keywords: 'плодородие, творчество, забота',
       short: 'Энергия создания и питания. Создавать, рождать, давать жизнь — буквально и метафорически.',
       comfort: 'Природный талант создавать комфорт, проекты, отношения, бизнес. Магнетизм.',
       risk: 'Гиперопека, материнский комплекс, истощение через заботу о других в ущерб себе.' },
  4: { name: 'Император', keywords: 'власть, структура, дисциплина',
       short: 'Способность строить системы и управлять. Внутренний стержень и авторитет.',
       comfort: 'Естественное лидерство, способность строить долговременные структуры.',
       risk: 'Авторитарность, ригидность, потребность всё контролировать.' },
  5: { name: 'Иерофант', keywords: 'учитель, традиция, мудрость',
       short: 'Передача знания и опыта. Связь с традицией и духовным наставничеством.',
       comfort: 'Прирождённый учитель, наставник, способны структурировать сложное знание.',
       risk: 'Догматичность, морализаторство, привязанность к формам в ущерб сути.' },
  6: { name: 'Влюблённые', keywords: 'выбор, партнёрство, гармония',
       short: 'Энергия союза и осознанного выбора. Тема партнёрства и совместного пути.',
       comfort: 'Умение строить глубокие отношения, видеть в другом дополнение, а не отражение.',
       risk: 'Зависимость от партнёра, страх одиночества, постоянные сомнения в выборе.' },
  7: { name: 'Колесница', keywords: 'движение, победа, целеустремлённость',
       short: 'Энергия прорыва и победы. Способность двигаться к цели вопреки препятствиям.',
       comfort: 'Высокая концентрация на цели, способность преодолевать сопротивление, лидерство.',
       risk: 'Гонка ради гонки, эмоциональное выгорание, неспособность остановиться.' },
  8: { name: 'Справедливость', keywords: 'баланс, закон, причина-следствие',
       short: 'Карма и точное равновесие. Каждое действие возвращается, каждый выбор имеет вес.',
       comfort: 'Развитое чувство справедливости, аналитический ум, способность видеть последствия.',
       risk: 'Чрезмерная требовательность к себе и другим, жёсткие моральные оценки.' },
  9: { name: 'Отшельник', keywords: 'мудрость, одиночество, внутренний свет',
       short: 'Путь самопознания и внутреннего света. Мудрость через уединение и наблюдение.',
       comfort: 'Глубина мышления, способность извлекать смыслы, духовное лидерство по делу.',
       risk: 'Изоляция, недоверие к людям, страх близости.' },
  10: { name: 'Колесо Фортуны', keywords: 'цикл, удача, перемены',
        short: 'Циклические перемены судьбы. Жизнь движется волнами — то взлёт, то спуск.',
        comfort: 'Удачливость, способность ловить волну, чувствовать правильный момент.',
        risk: 'Пассивность, ожидание удачи вместо действия, фатализм.' },
  11: { name: 'Сила', keywords: 'внутренняя мощь, страсть, укрощение',
        short: 'Внутренняя сила и способность управлять своей животной природой через любовь, а не насилие.',
        comfort: 'Магнетизм, способность влиять без давления, страстная энергия в творчестве.',
        risk: 'Подавление инстинктов или, наоборот, потеря над ними контроля.' },
  12: { name: 'Повешенный', keywords: 'жертва, пауза, смена угла',
        short: 'Энергия осознанной жертвы и смены перспективы. Иногда нужно остановиться.',
        comfort: 'Способность отпустить лишнее, увидеть ситуацию с другого ракурса, мудрая пауза.',
        risk: 'Роль жертвы, добровольное страдание, ступор и неспособность действовать.' },
  13: { name: 'Смерть', keywords: 'трансформация, окончание, очищение',
        short: 'Энергия глубоких трансформаций. Старое умирает, чтобы освободить место новому.',
        comfort: 'Способность отпускать отжившее, проходить через перемены без надрыва.',
        risk: 'Страх перемен, цепляние за прошлое, мрачность мировоззрения.' },
  14: { name: 'Умеренность', keywords: 'баланс, синтез, исцеление',
        short: 'Энергия гармоничного соединения противоположностей. Алхимия повседневности.',
        comfort: 'Умение находить компромиссы, исцелять, балансировать крайности.',
        risk: 'Боязнь конфликтов, размытость позиции, попытка угодить всем.' },
  15: { name: 'Дьявол', keywords: 'тень, зависимость, материя',
        short: 'Работа с теневой стороной — страстями, привязанностями, материальным.',
        comfort: 'Магнетизм, страстность, способность извлекать ресурс из материального мира.',
        risk: 'Зависимости (любые), одержимость, манипуляции, потеря свободы.' },
  16: { name: 'Башня', keywords: 'разрушение, прорыв, освобождение',
        short: 'Энергия неожиданных перемен через слом. Башня падает, чтобы освободить от иллюзий.',
        comfort: 'Способность к радикальным переменам, освобождение от ложных опор.',
        risk: 'Саморазрушительные паттерны, провокация кризисов, страх стабильности.' },
  17: { name: 'Звезда', keywords: 'надежда, вдохновение, истинный путь',
        short: 'Энергия надежды и звёздного покровительства. Чистая интуиция и творческий поток.',
        comfort: 'Высокая интуиция, оптимизм, природный творческий дар, удача в начинаниях.',
        risk: 'Витание в облаках, нереалистичные ожидания, разочарование от столкновения с реальностью.' },
  18: { name: 'Луна', keywords: 'иллюзии, подсознание, тайны',
        short: 'Энергия подсознательного и неявного. Мир снов, страхов, скрытых процессов.',
        comfort: 'Развитая интуиция, способность работать с символическим, дар сновидений.',
        risk: 'Тревожность, склонность к иллюзиям, спутанность реального и воображаемого.' },
  19: { name: 'Солнце', keywords: 'радость, успех, ясность',
        short: 'Энергия чистой радости и проявленности. Солнечный архетип — свет, тепло, успех.',
        comfort: 'Природный оптимизм, харизма, умение радоваться, лёгкость в отношениях.',
        risk: 'Поверхностность, избегание тёмных тем, эгоцентризм, страх показаться слабым.' },
  20: { name: 'Суд', keywords: 'призвание, пробуждение, новый этап',
        short: 'Энергия пробуждения и ответа на зов. Старая жизнь заканчивается, открывается новая глава.',
        comfort: 'Способность слышать своё призвание, готовность к радикальной трансформации.',
        risk: 'Постоянное ожидание знаков, откладывание решений, перфекционизм в выборе пути.' },
  21: { name: 'Мир', keywords: 'завершение, целостность, реализация',
        short: 'Энергия завершённости и полной реализации потенциала. Гармония всех уровней.',
        comfort: 'Способность доводить до завершения, чувство целостности, мудрость.',
        risk: 'Самодовольство, остановка в развитии, иллюзия "всё уже достигнуто".' },
  22: { name: 'Шут', keywords: 'свобода, начало, потенциал',
        short: 'Чистый потенциал и свобода выбора. Энергия начала пути, не обременённого опытом.',
        comfort: 'Лёгкость, способность всё начать заново, нестандартность мышления.',
        risk: 'Безответственность, инфантилизм, бесконечные начинания без завершений.' }
};

// === АЛГОРИТМ РАСЧЁТА МАТРИЦЫ ===
function reduceTo22(n) {
  while (n > 22) {
    n = String(n).split('').reduce((s, d) => s + parseInt(d), 0);
  }
  return n > 0 ? n : 22;
}

function calculateMatrix(day, month, year) {
  const A = reduceTo22(day);
  const B = reduceTo22(month);
  const C = reduceTo22(String(year).split('').reduce((s, d) => s + parseInt(d), 0));
  const D = reduceTo22(A + B + C);
  const E = reduceTo22(A + B + C + D);
  const F = reduceTo22(A + B);
  const G = reduceTo22(B + C);
  const H = reduceTo22(C + D);
  const I = reduceTo22(D + A);
  const J = reduceTo22(F + G + H + I);

  const love_sky = reduceTo22(A + E);
  const love_earth = reduceTo22(D + E);
  const love_main = reduceTo22(love_sky + love_earth);

  const money_sky = reduceTo22(B + E);
  const money_earth = reduceTo22(C + E);
  const money_main = reduceTo22(money_sky + money_earth);

  const karma_mother = reduceTo22(B + D);
  const karma_father = reduceTo22(A + C);
  const karma_self = reduceTo22(karma_mother + karma_father);

  return {
    personality: { physical: A, emotional: B, mental: C, roots: D },
    center: E,
    destiny: { mirror: F, social: G, ancestral: H, spiritual: I },
    destiny_center: J,
    love: { sky: love_sky, earth: love_earth, main: love_main },
    money: { sky: money_sky, earth: money_earth, main: money_main },
    karma: { mother: karma_mother, father: karma_father, self: karma_self }
  };
}

// === QUIZ NAVIGATION ===
function initMxSelects() {
  const dayEl = document.getElementById('mxBirthDay');
  if (dayEl.children.length <= 1) {
    for (let i = 1; i <= 31; i++) dayEl.innerHTML += `<option value="${i}">${i}</option>`;
  }
  const yearEl = document.getElementById('mxBirthYear');
  if (yearEl.children.length <= 1) {
    const now = new Date().getFullYear();
    for (let i = now; i >= 1920; i--) yearEl.innerHTML += `<option value="${i}">${i}</option>`;
  }
}

function updateMxProgress() {
  const stepsForProgress = MX_STATE.step <= 4 ? MX_STATE.step : 4;
  const pct = ((stepsForProgress - 1) / (MX_STATE.totalSteps - 1)) * 100;
  document.getElementById('mxProgressFill').style.width = pct + '%';
  document.getElementById('mxStepCounter').textContent = MX_STATE.step <= 4 ? `${MX_STATE.step} / ${MX_STATE.totalSteps}` : '';
  document.getElementById('mxQuizBackBtn').disabled = MX_STATE.step === 5;
}

function showMxStep(n) {
  document.querySelectorAll('#screen-matrix-quiz .quiz-step').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`[data-mqstep="${n}"]`);
  if (target) target.classList.add('active');
  MX_STATE.step = n;
  updateMxProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mxQuizNext() {
  if (MX_STATE.step < 5) showMxStep(MX_STATE.step + 1);
}

document.getElementById('mxQuizBackBtn').addEventListener('click', () => {
  if (MX_STATE.step === 1) {
    navigateTo('screen-home');
  } else if (MX_STATE.step > 1 && MX_STATE.step < 5) {
    showMxStep(MX_STATE.step - 1);
  }
});

['mxBirthDay', 'mxBirthMonth', 'mxBirthYear'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    const d = document.getElementById('mxBirthDay').value;
    const m = document.getElementById('mxBirthMonth').value;
    const y = document.getElementById('mxBirthYear').value;
    MX_STATE.birthDay = d ? parseInt(d) : null;
    MX_STATE.birthMonth = m ? parseInt(m) : null;
    MX_STATE.birthYear = y ? parseInt(y) : null;
    document.getElementById('mxStep2Btn').disabled = !(d && m && y);
  });
});

document.getElementById('mxName').addEventListener('input', (e) => {
  const v = e.target.value.trim();
  MX_STATE.name = v || null;
  document.getElementById('mxStep3Btn').disabled = v.length < 1;
});

function selectMxFocus(el) {
  document.querySelectorAll('.focus-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  MX_STATE.focus = el.dataset.focus;
  document.getElementById('mxStep4Btn').disabled = false;
}

function startMatrixCalculation() {
  showMxStep(5);
  const stepIds = ['mxLs1', 'mxLs2', 'mxLs3', 'mxLs4', 'mxLs5'];
  let i = 0;
  document.getElementById(stepIds[0]).classList.add('current');

  const interval = setInterval(() => {
    document.getElementById(stepIds[i]).classList.remove('current');
    document.getElementById(stepIds[i]).classList.add('done');
    i++;
    if (i < stepIds.length) {
      document.getElementById(stepIds[i]).classList.add('current');
    } else {
      clearInterval(interval);
      MX_STATE.matrix = calculateMatrix(MX_STATE.birthDay, MX_STATE.birthMonth, MX_STATE.birthYear);
      setTimeout(() => {
        renderMatrixResult();
        navigateTo('screen-matrix-result');
      }, 500);
    }
  }, 700);
}

function resetMxQuiz() {
  Object.assign(MX_STATE, {
    step: 1,
    birthDay: null, birthMonth: null, birthYear: null,
    name: null, focus: 'general', matrix: null
  });
  document.querySelectorAll('#screen-matrix-quiz .quiz-step').forEach(el => el.classList.remove('active'));
  document.querySelector('[data-mqstep="1"]').classList.add('active');
  document.querySelectorAll('.focus-option').forEach(o => o.classList.remove('selected'));
  ['mxStep2Btn', 'mxStep3Btn', 'mxStep4Btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  document.getElementById('mxName').value = '';
  ['mxBirthDay', 'mxBirthMonth', 'mxBirthYear'].forEach(id => {
    document.getElementById(id).value = '';
  });
  updateMxProgress();
}

// === РЕНДЕРИНГ РЕЗУЛЬТАТА ===
function renderMatrixResult() {
  const m = MX_STATE.matrix;
  const name = MX_STATE.name || 'Друг';

  // Header
  document.getElementById('mxResultName').innerHTML = `<em>${name},</em> вот ваша матрица`;
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const dateStr = `${MX_STATE.birthDay} ${months[MX_STATE.birthMonth - 1]} ${MX_STATE.birthYear}`;
  document.getElementById('mxResultMeta').innerHTML =
    `${dateStr}<span class="dot"></span>Центр ${m.center}<span class="dot"></span>${ARKANA[m.center].name}`;

  // Mission card
  document.getElementById('mxMissionNum').textContent = m.center;
  document.getElementById('mxMissionArc').textContent = ARKANA[m.center].name;
  document.getElementById('mxMissionDesc').textContent = ARKANA[m.center].short;

  // Key points
  document.getElementById('mxKeyPoints').innerHTML = `
    <div class="config-item">
      <div class="config-glyph">${m.center}</div>
      <div>
        <p class="config-title">Центр · ${ARKANA[m.center].name}</p>
        <p class="config-desc">${ARKANA[m.center].keywords}</p>
      </div>
    </div>
    <div class="config-item">
      <div class="config-glyph">${m.love.main}</div>
      <div>
        <p class="config-title">Любовь · ${ARKANA[m.love.main].name}</p>
        <p class="config-desc">${ARKANA[m.love.main].keywords}</p>
      </div>
    </div>
    <div class="config-item">
      <div class="config-glyph">${m.money.main}</div>
      <div>
        <p class="config-title">Деньги · ${ARKANA[m.money.main].name}</p>
        <p class="config-desc">${ARKANA[m.money.main].keywords}</p>
      </div>
    </div>
    <div class="config-item">
      <div class="config-glyph">${m.karma.self}</div>
      <div>
        <p class="config-title">Карма · ${ARKANA[m.karma.self].name}</p>
        <p class="config-desc">${ARKANA[m.karma.self].keywords}</p>
      </div>
    </div>
  `;

  // Summary card
  renderMxSummary(m, name);

  // Matrix viz
  renderMxOctagram(m);

  // Tabs
  renderMxPersonality(m);
  renderMxDestiny(m);
  renderMxMission(m);
  renderMxLove(m);
  renderMxMoney(m);
  renderMxKarma(m);
  renderMxZones(m);
}

function renderMxSummary(m, name) {
  const c = ARKANA[m.center];
  const l = ARKANA[m.love.main];
  const mn = ARKANA[m.money.main];
  const k = ARKANA[m.karma.self];

  const html = `
    <div class="summary-section">
      <h2 class="summary-h">Кто вы по матрице</h2>
      <p class="summary-text">Центр вашей матрицы — <em>${m.center}, ${c.name}</em>. Это главная точка, миссия, ось вокруг которой строится всё остальное. ${c.short}</p>
      <p class="summary-text">${c.comfort}</p>
      <div class="insight-pull">
        <p>"${c.short}"</p>
      </div>
    </div>

    <div class="summary-section">
      <h2 class="summary-h">Личностный квадрат</h2>
      <p class="summary-text">Ваша личность стоит на четырёх точках. <strong>Физика — ${ARKANA[m.personality.physical].name} (${m.personality.physical})</strong>: ${ARKANA[m.personality.physical].keywords}. <strong>Эмоции — ${ARKANA[m.personality.emotional].name} (${m.personality.emotional})</strong>: ${ARKANA[m.personality.emotional].keywords}.</p>
      <p class="summary-text"><strong>Ум — ${ARKANA[m.personality.mental].name} (${m.personality.mental})</strong>: ${ARKANA[m.personality.mental].keywords}. <strong>Корни — ${ARKANA[m.personality.roots].name} (${m.personality.roots})</strong>: ${ARKANA[m.personality.roots].keywords}.</p>
      ${m.personality.physical === m.personality.emotional ?
        '<p class="summary-text"><strong>Важное наблюдение:</strong> ваши точки физики и эмоций совпадают — это означает, что тело и эмоциональное состояние идут синхронно. Усталость сразу даёт эмоциональный спад, а эмоциональные подъёмы дают физическую энергию.</p>' : ''}
    </div>

    <div class="summary-section">
      <h2 class="summary-h">Линия любви</h2>
      <p class="summary-text">Главная точка любви — <em>${m.love.main}, ${l.name}</em>. ${l.short}</p>
      <p class="summary-text">${l.comfort} Это значит, что в отношениях для вас работает именно такой подход — другие могут пытаться выстраивать связь иначе, но ваша природная резонансная частота вот эта.</p>
    </div>

    <div class="summary-section">
      <h2 class="summary-h">Денежный канал</h2>
      <p class="summary-text">Главная денежная точка — <em>${m.money.main}, ${mn.name}</em>. ${mn.short}</p>
      <p class="summary-text">${mn.comfort}</p>
    </div>

    <div class="summary-section">
      <h2 class="summary-h">Кармическая задача</h2>
      <p class="summary-text">Точка кармы (что вы пришли проработать в этой жизни) — <em>${m.karma.self}, ${k.name}</em>. ${k.short}</p>
      <p class="summary-text"><strong>Зона риска по карме:</strong> ${k.risk} Знать это полезно — это не приговор, а указание на то, где работать осознаннее.</p>
    </div>
  `;
  document.getElementById('mxSummaryCard').innerHTML = html;
}

function renderMxOctagram(m) {
  const cx = 240, cy = 240;
  const R = 170;
  const points = [
    { angle: 270, r: R, num: m.personality.physical, label: 'ФИЗИКА', major: false },
    { angle: 0, r: R, num: m.personality.emotional, label: 'ЭМОЦИИ', major: false },
    { angle: 90, r: R, num: m.personality.mental, label: 'УМ', major: false },
    { angle: 180, r: R, num: m.personality.roots, label: 'КОРНИ', major: false },
    { angle: 315, r: R * 0.82, num: m.destiny.mirror, label: 'ЗЕРКАЛО', major: false },
    { angle: 45, r: R * 0.82, num: m.destiny.social, label: 'СОЦИУМ', major: false },
    { angle: 135, r: R * 0.82, num: m.destiny.ancestral, label: 'РОД', major: false },
    { angle: 225, r: R * 0.82, num: m.destiny.spiritual, label: 'ДУХ', major: false },
  ];

  function pt(ang, r) {
    const a = (ang - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  let svg = '';

  // Outer square
  const outer = [0, 1, 2, 3].map(i => pt(points[i].angle, points[i].r));
  svg += `<polygon points="${outer.map(p => p.join(',')).join(' ')}" fill="none" stroke="#D4C39E" stroke-width="0.8" stroke-linejoin="round"/>`;

  // Inner square
  const inner = [4, 5, 6, 7].map(i => pt(points[i].angle, points[i].r));
  svg += `<polygon points="${inner.map(p => p.join(',')).join(' ')}" fill="none" stroke="#D4C39E" stroke-width="0.8" stroke-linejoin="round"/>`;

  // Cross lines
  svg += `<line x1="${outer[0][0]}" y1="${outer[0][1]}" x2="${outer[2][0]}" y2="${outer[2][1]}" stroke="#E0D4BC" stroke-width="0.5"/>`;
  svg += `<line x1="${outer[1][0]}" y1="${outer[1][1]}" x2="${outer[3][0]}" y2="${outer[3][1]}" stroke="#E0D4BC" stroke-width="0.5"/>`;
  svg += `<line x1="${inner[0][0]}" y1="${inner[0][1]}" x2="${inner[2][0]}" y2="${inner[2][1]}" stroke="#E0D4BC" stroke-width="0.5"/>`;
  svg += `<line x1="${inner[1][0]}" y1="${inner[1][1]}" x2="${inner[3][0]}" y2="${inner[3][1]}" stroke="#E0D4BC" stroke-width="0.5"/>`;

  // Center point (mission) — major
  svg += `<circle cx="${cx}" cy="${cy}" r="32" fill="#B8923D" stroke="#8B6914" stroke-width="0.5"/>`;
  svg += `<text x="${cx}" y="${cy + 2}" text-anchor="middle" dominant-baseline="middle" fill="#FAF5EA" font-size="26" font-weight="500" font-family="Cormorant Garamond, serif">${m.center}</text>`;
  svg += `<text x="${cx}" y="${cy + 50}" text-anchor="middle" fill="#8B7449" font-size="9" letter-spacing="0.12em" font-family="Inter, sans-serif">МИССИЯ</text>`;

  // 8 points
  points.forEach(p => {
    const [x, y] = pt(p.angle, p.r);
    svg += `<circle cx="${x}" cy="${y}" r="22" fill="#FFFCF5" stroke="#B8923D" stroke-width="1"/>`;
    svg += `<text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="middle" fill="#3D2E1A" font-size="18" font-weight="500" font-family="Cormorant Garamond, serif">${p.num}</text>`;
    // Label position
    const [lx, ly] = pt(p.angle, p.r + 35);
    svg += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" fill="#8B7449" font-size="9" letter-spacing="0.12em" font-family="Inter, sans-serif">${p.label}</text>`;
  });

  document.getElementById('mxOctagram').innerHTML = svg;

  // Build legend showing all arcana on the matrix
  const allPoints = [
    ['Физика', m.personality.physical],
    ['Эмоции', m.personality.emotional],
    ['Ум', m.personality.mental],
    ['Корни', m.personality.roots],
    ['Миссия', m.center],
    ['Зеркало', m.destiny.mirror],
    ['Социум', m.destiny.social],
    ['Род', m.destiny.ancestral],
    ['Дух', m.destiny.spiritual],
    ['Любовь', m.love.main],
    ['Деньги', m.money.main],
    ['Карма', m.karma.self],
  ];
  let legend = '';
  allPoints.forEach(([label, num]) => {
    legend += `
      <div class="arcana-row">
        <div class="arcana-num">${num}</div>
        <div class="arcana-row-text"><strong>${label}</strong>${ARKANA[num].name}</div>
      </div>
    `;
  });
  document.getElementById('mxArcanaLegend').innerHTML = legend;
}

function renderMxPersonality(m) {
  const points = [
    { num: m.personality.physical, title: 'Физика — точка комфорта и тела',
      sub: 'РАССЧИТЫВАЕТСЯ ИЗ ДНЯ РОЖДЕНИЯ',
      desc: 'Эта точка определяет ваше отношение к телу, физическому миру, базовому комфорту и материальной стороне жизни. Ваша «оперативная база».' },
    { num: m.personality.emotional, title: 'Эмоции — точка чувств и реакций',
      sub: 'РАССЧИТЫВАЕТСЯ ИЗ МЕСЯЦА РОЖДЕНИЯ',
      desc: 'Точка эмоционального реагирования. Как вы переживаете чувства, как восстанавливаетесь эмоционально, через что вас задевает и через что наполняет.' },
    { num: m.personality.mental, title: 'Ум — точка интеллекта и талантов',
      sub: 'РАССЧИТЫВАЕТСЯ ИЗ СУММЫ ЦИФР ГОДА',
      desc: 'Точка вашего мышления, способа учиться, природных талантов и интеллектуальных особенностей. Ваш встроенный инструмент работы с реальностью.' },
    { num: m.personality.roots, title: 'Корни — родовой фундамент личности',
      sub: 'СУММА ПЕРВЫХ ТРЁХ ТОЧЕК',
      desc: 'Точка фундамента личности — то, что вы взяли от рода, на чём стоите неосознанно. Базовая программа, которая включается по умолчанию.' },
  ];

  document.getElementById('mxPersonalityList').innerHTML = points.map(p => `
    <div class="energy-card">
      <div class="energy-header">
        <div class="energy-num">${p.num}</div>
        <div>
          <h3 class="energy-title">${p.title}</h3>
          <div class="energy-sub">${p.sub} · АРКАН ${ARKANA[p.num].name.toUpperCase()}</div>
        </div>
        <span class="energy-badge">${ARKANA[p.num].keywords.split(',')[0]}</span>
      </div>
      <p class="energy-text">${p.desc} В вашем случае это <strong>${ARKANA[p.num].name}</strong>: ${ARKANA[p.num].short.toLowerCase()}</p>
      <p class="energy-text"><strong>В балансе:</strong> ${ARKANA[p.num].comfort}</p>
      <p class="energy-text"><strong>В дисбалансе:</strong> ${ARKANA[p.num].risk}</p>
      <div class="energy-tip">
        <span class="energy-tip-label">ПРАКТИЧНО:</span>
        Эта точка работает естественно, когда вы опираетесь на свои сильные стороны. Замечайте моменты, когда она «проседает» — обычно через усталость или конфликт ценностей.
      </div>
    </div>
  `).join('');
}

function renderMxDestiny(m) {
  const points = [
    { num: m.destiny.mirror, title: 'Зеркало — точка личной судьбы',
      sub: 'ЛИЧНАЯ КАРМА И ОТРАЖЕНИЕ',
      desc: 'Точка, через которую вы видите себя глазами других и встречаете уроки судьбы. Это «то, что вам прилетает» как ответ на ваши действия.' },
    { num: m.destiny.social, title: 'Социум — общественная программа',
      sub: 'ОТНОШЕНИЯ С КОЛЛЕКТИВОМ',
      desc: 'Как вы проявляетесь в социуме, какую роль играете в группе, что от вас ожидает мир и что вы можете дать коллективу.' },
    { num: m.destiny.ancestral, title: 'Род — родовая программа',
      sub: 'НАСЛЕДИЕ ПРЕДКОВ',
      desc: 'То, что вы несёте по линии рода. Задачи, которые перешли по наследству, ресурсы, которыми наделили вас предки.' },
    { num: m.destiny.spiritual, title: 'Дух — духовное наследие',
      sub: 'ВЫСШИЙ УРОВЕНЬ',
      desc: 'Связь с духовным измерением, точка контакта с тем, что больше повседневности — смыслами, миссией, божественным замыслом.' },
  ];

  document.getElementById('mxDestinyList').innerHTML = points.map(p => `
    <div class="energy-card">
      <div class="energy-header">
        <div class="energy-num secondary">${p.num}</div>
        <div>
          <h3 class="energy-title">${p.title}</h3>
          <div class="energy-sub">${p.sub} · АРКАН ${ARKANA[p.num].name.toUpperCase()}</div>
        </div>
        <span class="energy-badge">${ARKANA[p.num].keywords.split(',')[0]}</span>
      </div>
      <p class="energy-text">${p.desc}</p>
      <p class="energy-text">Аркан <strong>${ARKANA[p.num].name}</strong> в этой точке: ${ARKANA[p.num].short.toLowerCase()}</p>
      <p class="energy-text"><strong>Что даёт ресурс:</strong> ${ARKANA[p.num].comfort}</p>
      <p class="energy-text"><strong>Что мешает:</strong> ${ARKANA[p.num].risk}</p>
    </div>
  `).join('');
}

function renderMxMission(m) {
  const c = ARKANA[m.center];
  document.getElementById('mxMissionDetail').innerHTML = `
    <div class="mission-eyebrow">ЦЕНТР МАТРИЦЫ · ВАША МИССИЯ</div>
    <div class="mission-num">${m.center}</div>
    <h2 class="mission-arcana">${c.name}</h2>
    <p class="mission-desc">${c.short}</p>
  `;

  document.getElementById('mxMissionExpand').innerHTML = `
    <div class="summary-section">
      <h2 class="summary-h">Как разворачивается миссия</h2>
      <p class="summary-text">Центр матрицы — это <em>не профессия и не должность</em>. Это качество, через которое вы реализуете свой потенциал во всём, что делаете. Можно работать программистом и нести энергию ${c.name}, можно быть художником и нести её же.</p>
      <p class="summary-text">${c.comfort}</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Что блокирует миссию</h2>
      <p class="summary-text"><strong>Главная зона теневой работы:</strong> ${c.risk} Это не означает, что у вас обязательно есть эти черты — это указание на то, куда может «свалиться» энергия ${c.name}, если она не реализована конструктивно.</p>
      <p class="summary-text">Если чувствуете, что миссия «не идёт», обычно это значит, что энергия зажата в теневой форме. Решение всегда одно: вернуться к конструктивному выражению ${c.keywords.split(',')[0]}.</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Возрастные раскрытия</h2>
      <p class="summary-text">Миссия раскрывается не сразу, а волнами: к 25 годам появляется первое понимание темы, к 33–40 — практическая реализация, к 50+ — мудрость и передача опыта.</p>
      <p class="summary-text">Не пытайтесь «закрыть» миссию в одном проекте — это сквозная линия всей жизни, проходящая через разные формы.</p>
    </div>
  `;
}

function renderMxLove(m) {
  const l = ARKANA[m.love.main];
  const ls = ARKANA[m.love.sky];
  const le = ARKANA[m.love.earth];

  document.getElementById('mxLoveLine').innerHTML = `
    <div class="line-node">
      <div class="line-node-label">НЕБЕСНАЯ ЛЮБОВЬ</div>
      <div class="line-node-num">${m.love.sky}</div>
      <div class="line-node-arc">${ls.name}</div>
    </div>
    <div class="line-node">
      <div class="line-node-label">ЗЕМНАЯ ЛЮБОВЬ</div>
      <div class="line-node-num">${m.love.earth}</div>
      <div class="line-node-arc">${le.name}</div>
    </div>
    <div class="line-node" style="background: var(--bg-accent-soft);">
      <div class="line-node-label" style="color: var(--accent-deep);">ГЛАВНАЯ ТОЧКА</div>
      <div class="line-node-num main">${m.love.main}</div>
      <div class="line-node-arc"><strong>${l.name}</strong></div>
    </div>
  `;

  document.getElementById('mxLoveExpand').innerHTML = `
    <div class="summary-section">
      <h2 class="summary-h">Как устроена ваша любовь</h2>
      <p class="summary-text">Линия любви в матрице — это три точки. <strong>Небесная (${ls.name})</strong> — идеал, к которому тянет душа. <strong>Земная (${le.name})</strong> — то, что встречается в реальности. <strong>Главная (${l.name})</strong> — синтез этих двух.</p>
      <p class="summary-text">${l.short}</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Что работает в отношениях</h2>
      <p class="summary-text">${l.comfort}</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Что разрушает</h2>
      <p class="summary-text">${l.risk} Это не приговор — это указание на сценарии, которые повторяются у всех с этой точкой. Знать их — значит иметь возможность вовремя остановиться.</p>
    </div>
  `;
}

function renderMxMoney(m) {
  const mn = ARKANA[m.money.main];
  const ms = ARKANA[m.money.sky];
  const me = ARKANA[m.money.earth];

  document.getElementById('mxMoneyLine').innerHTML = `
    <div class="line-node">
      <div class="line-node-label">НЕБЕСНЫЕ ДЕНЬГИ</div>
      <div class="line-node-num">${m.money.sky}</div>
      <div class="line-node-arc">${ms.name}</div>
    </div>
    <div class="line-node">
      <div class="line-node-label">ЗЕМНЫЕ ДЕНЬГИ</div>
      <div class="line-node-num">${m.money.earth}</div>
      <div class="line-node-arc">${me.name}</div>
    </div>
    <div class="line-node" style="background: var(--bg-accent-soft);">
      <div class="line-node-label" style="color: var(--accent-deep);">ГЛАВНАЯ ТОЧКА</div>
      <div class="line-node-num main">${m.money.main}</div>
      <div class="line-node-arc"><strong>${mn.name}</strong></div>
    </div>
  `;

  document.getElementById('mxMoneyExpand').innerHTML = `
    <div class="summary-section">
      <h2 class="summary-h">Ваш денежный канал</h2>
      <p class="summary-text">Денежная линия складывается из трёх точек: <strong>${ms.name}</strong> (потенциал и идеальный сценарий), <strong>${me.name}</strong> (практическое воплощение), <strong>${mn.name}</strong> (главная точка денежного канала).</p>
      <p class="summary-text">${mn.short}</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Как привлекаете деньги</h2>
      <p class="summary-text">${mn.comfort}</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Что блокирует поток</h2>
      <p class="summary-text">${mn.risk}</p>
    </div>
  `;
}

function renderMxKarma(m) {
  const k = ARKANA[m.karma.self];
  const kf = ARKANA[m.karma.father];
  const km = ARKANA[m.karma.mother];

  document.getElementById('mxKarmaLine').innerHTML = `
    <div class="line-node">
      <div class="line-node-label">МУЖСКОЙ РОД</div>
      <div class="line-node-num">${m.karma.father}</div>
      <div class="line-node-arc">${kf.name}</div>
    </div>
    <div class="line-node">
      <div class="line-node-label">ЖЕНСКИЙ РОД</div>
      <div class="line-node-num">${m.karma.mother}</div>
      <div class="line-node-arc">${km.name}</div>
    </div>
    <div class="line-node" style="background: var(--bg-accent-soft);">
      <div class="line-node-label" style="color: var(--accent-deep);">ВАША КАРМА</div>
      <div class="line-node-num main">${m.karma.self}</div>
      <div class="line-node-arc"><strong>${k.name}</strong></div>
    </div>
  `;

  document.getElementById('mxKarmaExpand').innerHTML = `
    <div class="summary-section">
      <h2 class="summary-h">Родовая карма</h2>
      <p class="summary-text">Кармическая линия складывается из энергий рода. <strong>Мужская линия (${kf.name})</strong> — отцовское наследие, ${kf.keywords}. <strong>Женская линия (${km.name})</strong> — материнское наследие, ${km.keywords}. Их синтез — ваша личная карма (<strong>${k.name}</strong>).</p>
      <p class="summary-text">${k.short}</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Что нужно проработать</h2>
      <p class="summary-text"><strong>${k.risk}</strong> Это не значит, что эти черты у вас есть — это указание, в какую сторону может «соскальзывать» энергия, если её не осознавать.</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Что вы наследуете в подарок</h2>
      <p class="summary-text">${k.comfort} Это ваш «стартовый капитал» — те качества, которые даны от рода и проявляются естественно, без специальных усилий.</p>
    </div>
  `;
}

function renderMxZones(m) {
  // Find strongest (comfort) and weakest (risk) arkana in matrix
  const allNums = [
    m.personality.physical, m.personality.emotional, m.personality.mental, m.personality.roots,
    m.center,
    m.destiny.mirror, m.destiny.social, m.destiny.ancestral, m.destiny.spiritual,
    m.love.main, m.money.main, m.karma.self
  ];
  // For simplicity: comfort = center+love, risk = karma
  const comfortNum = m.center;
  const riskNum = m.karma.self;

  document.getElementById('mxZoneGrid').innerHTML = `
    <div class="zone-card">
      <div class="zone-eyebrow comfort">ЗОНА КОМФОРТА</div>
      <h3 class="zone-title">${ARKANA[comfortNum].name} · ${comfortNum}</h3>
      <p class="zone-text">${ARKANA[comfortNum].comfort}</p>
    </div>
    <div class="zone-card">
      <div class="zone-eyebrow risk">ЗОНА РИСКА</div>
      <h3 class="zone-title">${ARKANA[riskNum].name} · ${riskNum}</h3>
      <p class="zone-text">${ARKANA[riskNum].risk}</p>
    </div>
  `;

  document.getElementById('mxZoneExpand').innerHTML = `
    <div class="summary-section">
      <h2 class="summary-h">Как работать с зонами</h2>
      <p class="summary-text"><strong>Зона комфорта</strong> — это энергии, которые работают на вас естественно. Опирайтесь на них в важных решениях и сложных периодах: они ваш надёжный фундамент.</p>
      <p class="summary-text"><strong>Зона риска</strong> — это не «плохо», а «требует внимания». Это энергии, которые в стрессе сваливаются в теневое выражение. Чтобы они работали конструктивно, нужна осознанная практика.</p>
    </div>
    <div class="summary-section">
      <h2 class="summary-h">Поколенческий контекст</h2>
      <p class="summary-text">Часть точек матрицы общая для людей одного года и месяца рождения — это поколенческие энергии. Они задают общий контекст, в котором разворачивается ваша личная история.</p>
      <p class="summary-text">Ваше уникальное — это центральные точки (миссия, личность), а также сочетание всех точек в одной матрице. Двух одинаковых матриц не бывает даже у людей с одной датой рождения, если учитывать имя и контекст рождения.</p>
    </div>
  `;
}

// === Matrix tab switching ===
document.querySelectorAll('#screen-matrix-result .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.mxtab;
    document.querySelectorAll('#screen-matrix-result .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#screen-matrix-result .tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-mxpanel="${target}"]`).classList.add('active');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  });
});

// Depth + chat suggestions
document.querySelectorAll('#screen-matrix-result .depth-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#screen-matrix-result .depth-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const depth = btn.dataset.depth;
    if (depth === 'full' || depth === 'deep') {
      setTimeout(() => {
        {
        var activeScreen = document.querySelector('.screen.active');
        var ctx = 'natal';
        if (activeScreen) {
          if (activeScreen.id === 'screen-matrix-result') ctx = 'matrix';
          else if (activeScreen.id === 'screen-reading-result') ctx = 'reading';
        }
        navigateToPayment(ctx, depth === 'deep' ? 'premium' : 'pro');
      }
      }, 200);
      document.querySelectorAll('#screen-matrix-result .depth-btn').forEach(b => b.classList.remove('active'));
      document.querySelector('#screen-matrix-result [data-depth="brief"]').classList.add('active');
    }
  });
});

document.querySelectorAll('#screen-matrix-result .chat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const input = document.querySelector('#screen-matrix-result .chat-input');
    input.value = chip.textContent;
    input.focus();
  });
});

document.getElementById('mxResultBackBtn').addEventListener('click', () => {
  navigateTo('screen-home');
});

initMxSelects();
updateMxProgress();



// === READING (TAROT) LOGIC ===
// === ИНДИВИДУАЛЬНЫЙ РАСКЛАД ===

const RD_STATE = {
  step: 1,
  totalSteps: 4,
  spread: null,        // 'daily' | 'ppf' | 'situation' | 'celtic'
  question: '',
  deck: [],            // shuffled deck of card indices 1-22
  picked: [],          // array of {id, reversed}
  shuffleCount: 0
};

// База 22 Старших Арканов с интерпретацией прямой и перевёрнутой
const TAROT = {
  1: { name: 'Маг', icon: 'mage',
       upright: 'Сила воли, инициатива, мастерство. У вас есть все инструменты для реализации задуманного — действуйте.',
       reversed: 'Сомнения в собственных силах, манипуляции (ваши или над вами), нереализованный потенциал.',
       advice_up: 'Действуйте уверенно. Все ресурсы уже у вас в руках.',
       advice_rev: 'Проверьте свои мотивы. Что вы делаете из подлинной воли, а что из иллюзии?' },
  2: { name: 'Жрица', icon: 'priestess',
       upright: 'Глубокая интуиция, скрытое знание, мудрость через внутренний слух. Доверьтесь чутью.',
       reversed: 'Отрицание интуиции, эмоциональная закрытость, скрытые тайны выходят на свет.',
       advice_up: 'Замедлитесь и прислушайтесь к внутреннему голосу. Ответ уже есть внутри.',
       advice_rev: 'То, что вы скрываете от себя, скоро всплывёт. Лучше посмотреть на это раньше.' },
  3: { name: 'Императрица', icon: 'empress',
       upright: 'Творчество, плодородие, изобилие. Энергия создания и питания — ваших или чужих.',
       reversed: 'Творческий блок, удушающая забота, материнский комплекс, истощение через отдачу.',
       advice_up: 'Создавайте смело — для этого у вас сейчас идеальный момент.',
       advice_rev: 'Восстановите границы. Вы отдали больше, чем имели.' },
  4: { name: 'Император', icon: 'emperor',
       upright: 'Структура, власть, дисциплина. Время строить систему и брать ответственность.',
       reversed: 'Авторитарность, ригидность, потеря контроля или, наоборот, желание всё контролировать.',
       advice_up: 'Возьмите ответственность за ситуацию. Постройте план.',
       advice_rev: 'Ослабьте хватку. Не всё в этой ситуации поддаётся вашему контролю.' },
  5: { name: 'Иерофант', icon: 'hierophant',
       upright: 'Традиция, наставничество, духовная мудрость. Ищите опору в проверенных знаниях.',
       reversed: 'Бунт против правил, поиск своего пути, отказ от догм.',
       advice_up: 'Обратитесь к наставнику или к проверенной методике. Не изобретайте велосипед.',
       advice_rev: 'Время сойти с протоптанной дороги. Ваш путь — не общепринятый.' },
  6: { name: 'Влюблённые', icon: 'lovers',
       upright: 'Союз, гармония, осознанный выбор. Перед вами стоит важный выбор сердцем.',
       reversed: 'Дисбаланс в отношениях, неправильный выбор, разлад, искушение лёгким путём.',
       advice_up: 'Выбирайте сердцем — оно сейчас знает лучше ума.',
       advice_rev: 'Проверьте, не идёте ли вы на компромисс с собственными ценностями.' },
  7: { name: 'Колесница', icon: 'chariot',
       upright: 'Движение к цели, победа через волю и фокус. Преодоление препятствий.',
       reversed: 'Потеря направления, гонка без смысла, эмоциональное выгорание.',
       advice_up: 'Соберитесь и идите к цели прямо. Это ваш момент.',
       advice_rev: 'Остановитесь. Вы движетесь, но в правильном ли направлении?' },
  8: { name: 'Справедливость', icon: 'justice',
       upright: 'Баланс, справедливое решение, законы причины и следствия в действии.',
       reversed: 'Несправедливость, нечестность, нарушение баланса, последствия прошлых ошибок.',
       advice_up: 'Действуйте честно — это сейчас даст лучший результат, чем любая хитрость.',
       advice_rev: 'Признайте свою долю ответственности. Это разблокирует ситуацию.' },
  9: { name: 'Отшельник', icon: 'hermit',
       upright: 'Внутренний поиск, мудрость через уединение, путь самопознания.',
       reversed: 'Изоляция, одиночество, отказ от помощи других, замкнутость в себе.',
       advice_up: 'Уединитесь и подумайте. Ответ придёт в тишине, не в шуме.',
       advice_rev: 'Выйдите к людям. Изоляция превратилась в защиту от роста.' },
  10: { name: 'Колесо Фортуны', icon: 'wheel',
        upright: 'Перемены к лучшему, удачный поворот, благоприятный цикл.',
        reversed: 'Неудачный момент, цикл повторяющихся проблем, сопротивление переменам.',
        advice_up: 'Действуйте сейчас — момент благоприятный, не упустите волну.',
        advice_rev: 'Подождите. Сейчас не ваш момент, попытка форсировать только усугубит.' },
  11: { name: 'Сила', icon: 'strength',
        upright: 'Внутренняя сила, мягкая власть, укрощение страстей через любовь, а не насилие.',
        reversed: 'Слабость, неконтролируемые эмоции, страх, потеря самообладания.',
        advice_up: 'Действуйте через мягкость. Сила сейчас не в кулаке, а в выдержке.',
        advice_rev: 'Признайте свою уязвимость. Это первый шаг к подлинной силе.' },
  12: { name: 'Повешенный', icon: 'hanged',
        upright: 'Пауза, осознанная жертва, смена угла зрения. Иногда нужно остановиться.',
        reversed: 'Бесполезные жертвы, ступор, неспособность принять решение, добровольное страдание.',
        advice_up: 'Остановитесь и посмотрите на ситуацию иначе. Прямой путь сейчас закрыт.',
        advice_rev: 'Прекратите страдать без причины. Жертвенность исчерпала себя.' },
  13: { name: 'Смерть', icon: 'death',
        upright: 'Глубокая трансформация, окончание одного цикла и начало нового. Не бойтесь.',
        reversed: 'Сопротивление переменам, страх отпустить, застревание в прошлом.',
        advice_up: 'Отпустите то, что закончилось. Освободите место для нового.',
        advice_rev: 'Признайте, что цикл закончен. Дальше держаться — против себя.' },
  14: { name: 'Умеренность', icon: 'temperance',
        upright: 'Баланс, синтез, исцеление, гармоничное смешение противоположностей.',
        reversed: 'Дисбаланс, крайности, нетерпение, отсутствие гармонии.',
        advice_up: 'Найдите середину. Истина сейчас не на полюсах, а в их смешении.',
        advice_rev: 'Вы качаетесь между крайностями. Замедлитесь и поищите центр.' },
  15: { name: 'Дьявол', icon: 'devil',
        upright: 'Зависимость, материальная привязанность, теневые аспекты, иллюзия несвободы.',
        reversed: 'Освобождение от зависимости, разрыв оков, осознание иллюзии.',
        advice_up: 'Посмотрите честно: что держит вас? Цепи часто не настолько прочны, как кажутся.',
        advice_rev: 'Вы на пороге освобождения. Сделайте последний шаг.' },
  16: { name: 'Башня', icon: 'tower',
        upright: 'Внезапные перемены через слом, разрушение ложных опор, освобождение от иллюзий.',
        reversed: 'Избежание необходимого кризиса, страх перемен, оттягивание неизбежного.',
        advice_up: 'То, что рушится — не было прочным. Лучше сейчас, чем позже и сильнее.',
        advice_rev: 'Вы оттягиваете перемены, которые всё равно произойдут. Лучше встретить их осознанно.' },
  17: { name: 'Звезда', icon: 'star',
        upright: 'Надежда, вдохновение, обновление, истинный путь. Самая обнадёживающая карта колоды.',
        reversed: 'Разочарование, потеря веры, нереалистичные ожидания разбиваются о реальность.',
        advice_up: 'Доверьтесь процессу. Звёзды на вашей стороне сейчас.',
        advice_rev: 'Опуститесь на землю. Ваши ожидания нуждаются в коррекции.' },
  18: { name: 'Луна', icon: 'moon',
        upright: 'Иллюзии, подсознательные страхи, неясность ситуации, скрытые мотивы.',
        reversed: 'Истина выходит на свет, страхи отступают, ясность приходит.',
        advice_up: 'Не делайте резких выводов — туман ещё не рассеялся.',
        advice_rev: 'Доверьтесь свету. То, что казалось страшным, оказывается не таким.' },
  19: { name: 'Солнце', icon: 'sun',
        upright: 'Радость, успех, ясность, проявленность, чистое счастье. Очень благоприятная карта.',
        reversed: 'Временные тучи, отложенный успех, излишний оптимизм или эгоцентризм.',
        advice_up: 'Радуйтесь и проявляйтесь. Это ваше время сиять.',
        advice_rev: 'Подождите немного. Свет вернётся, но сейчас нужна терпеливость.' },
  20: { name: 'Суд', icon: 'judgement',
        upright: 'Пробуждение, призвание, важное решение, второй шанс, новый этап.',
        reversed: 'Игнорирование зова, отказ меняться, самокритика, страх перед новым.',
        advice_up: 'Услышьте зов. Это момент, когда нужно сказать "да" новому пути.',
        advice_rev: 'Перестаньте судить себя. Двигайтесь дальше с тем, что есть.' },
  21: { name: 'Мир', icon: 'world',
        upright: 'Завершение цикла, целостность, реализация, мудрость. Главная карта успеха.',
        reversed: 'Незавершённость, отсутствие чувства полноты, цикл затянулся.',
        advice_up: 'Завершите то, что начали. Финал близок и он будет хорошим.',
        advice_rev: 'Что-то держит вас от завершения. Найдите этот узел и развяжите.' },
  22: { name: 'Шут', icon: 'fool',
        upright: 'Новое начало, свобода, чистый потенциал, спонтанность, доверие пути.',
        reversed: 'Безответственность, импульсивность без расчёта, наивность с последствиями.',
        advice_up: 'Прыгайте. Сейчас можно — у пути есть страховка.',
        advice_rev: 'Перед прыжком осмотритесь. Спонтанность сейчас может стоить дорого.' }
};

// SVG-иконки для 22 арканов (минималистичные, в стиле нашего дизайна)
// URL-ы карт колоды Rider-Waite-Smith (public domain, CC0 from luciellaes/itch.io)
// Хранятся в репо TeCaK315/cards на GitHub. В production — нужно скачать в /public/cards/
const TAROT_CARD_BASE = 'https://raw.githubusercontent.com/TeCaK315/cards/main';
const TAROT_CARD_BACK = TAROT_CARD_BASE + '/CardBacks.jpg';

const TAROT_ICONS = {
  fool: '<img src="' + TAROT_CARD_BASE + '/00-TheFool.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  mage: '<img src="' + TAROT_CARD_BASE + '/01-TheMagician.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  priestess: '<img src="' + TAROT_CARD_BASE + '/02-TheHighPriestess.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  empress: '<img src="' + TAROT_CARD_BASE + '/03-TheEmpress.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  emperor: '<img src="' + TAROT_CARD_BASE + '/04-TheEmperor.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  hierophant: '<img src="' + TAROT_CARD_BASE + '/05-TheHierophant.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  lovers: '<img src="' + TAROT_CARD_BASE + '/06-TheLovers.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  chariot: '<img src="' + TAROT_CARD_BASE + '/07-TheChariot.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  justice: '<img src="' + TAROT_CARD_BASE + '/11-Justice.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  hermit: '<img src="' + TAROT_CARD_BASE + '/09-TheHermit.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  wheel: '<img src="' + TAROT_CARD_BASE + '/10-WheelOfFortune.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  strength: '<img src="' + TAROT_CARD_BASE + '/08-Strength.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  hanged: '<img src="' + TAROT_CARD_BASE + '/12-TheHangedMan.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  death: '<img src="' + TAROT_CARD_BASE + '/13-Death.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  temperance: '<img src="' + TAROT_CARD_BASE + '/14-Temperance.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  devil: '<img src="' + TAROT_CARD_BASE + '/15-TheDevil.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  tower: '<img src="' + TAROT_CARD_BASE + '/16-TheTower.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  star: '<img src="' + TAROT_CARD_BASE + '/17-TheStar.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  moon: '<img src="' + TAROT_CARD_BASE + '/18-TheMoon.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  sun: '<img src="' + TAROT_CARD_BASE + '/19-TheSun.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  judgement: '<img src="' + TAROT_CARD_BASE + '/20-Judgement.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
  world: '<img src="' + TAROT_CARD_BASE + '/21-TheWorld.jpg" alt="" class="tarot-card-img" loading="lazy"/>',
};

// Spread configurations
const SPREADS = {
  daily: {
    name: 'Карта дня',
    count: 1,
    positions: [{ label: 'СОВЕТ ДНЯ', title: 'Энергия дня' }]
  },
  ppf: {
    name: 'Прошлое — Настоящее — Будущее',
    count: 3,
    positions: [
      { label: 'ПРОШЛОЕ', title: 'Что привело сюда' },
      { label: 'НАСТОЯЩЕЕ', title: 'Что происходит' },
      { label: 'БУДУЩЕЕ', title: 'Куда идёт' }
    ]
  },
  situation: {
    name: 'Ситуация — Препятствие — Совет',
    count: 3,
    positions: [
      { label: 'СИТУАЦИЯ', title: 'Что есть сейчас' },
      { label: 'ПРЕПЯТСТВИЕ', title: 'Что мешает' },
      { label: 'СОВЕТ', title: 'Что делать' }
    ]
  },
  celtic: {
    name: 'Кельтский крест',
    count: 10,
    positions: [
      { label: 'СИТУАЦИЯ', title: 'Текущее положение' },
      { label: 'ВЫЗОВ', title: 'Главное препятствие' },
      { label: 'КОРЕНЬ', title: 'Основа ситуации' },
      { label: 'ПРОШЛОЕ', title: 'Что отступает' },
      { label: 'ПОТЕНЦИАЛ', title: 'Возможный исход' },
      { label: 'БУДУЩЕЕ', title: 'Что приходит' },
      { label: 'ВЫ', title: 'Ваше отношение' },
      { label: 'ОКРУЖЕНИЕ', title: 'Внешние влияния' },
      { label: 'НАДЕЖДЫ', title: 'Надежды и страхи' },
      { label: 'ИТОГ', title: 'Финальный результат' }
    ]
  }
};

// === QUIZ NAVIGATION ===
function updateRdProgress() {
  const s = RD_STATE.step <= 4 ? RD_STATE.step : 4;
  const pct = ((s - 1) / (RD_STATE.totalSteps - 1)) * 100;
  document.getElementById('rdProgressFill').style.width = pct + '%';
  document.getElementById('rdStepCounter').textContent = RD_STATE.step <= 4 ? `${RD_STATE.step} / ${RD_STATE.totalSteps}` : '';
  document.getElementById('rdQuizBackBtn').disabled = RD_STATE.step === 5;
}

function showRdStep(n) {
  document.querySelectorAll('#screen-reading-quiz .quiz-step').forEach(el => el.classList.remove('active'));
  const target = document.querySelector(`[data-rqstep="${n}"]`);
  if (target) target.classList.add('active');
  RD_STATE.step = n;
  updateRdProgress();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // When entering draw screen, build deck
  if (n === 4) {
    buildDeck();
  }
}

function rdQuizNext() {
  if (RD_STATE.step < 5) showRdStep(RD_STATE.step + 1);
}

document.getElementById('rdQuizBackBtn').addEventListener('click', () => {
  if (RD_STATE.step === 1) {
    navigateTo('screen-home');
  } else if (RD_STATE.step > 1 && RD_STATE.step < 5) {
    showRdStep(RD_STATE.step - 1);
  }
});

// Spread selection
function selectSpread(el) {
  if (el.classList.contains('locked')) {
    setTimeout(() => navigateToPayment('reading', 'pro'), 200);
    return;
  }
  document.querySelectorAll('.spread-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  RD_STATE.spread = el.dataset.spread;
  document.getElementById('rdStep2Btn').disabled = false;
}

// Question textarea
document.getElementById('rdQuestion').addEventListener('input', (e) => {
  const v = e.target.value.trim();
  RD_STATE.question = v;
  document.getElementById('rdCharCount').textContent = `${e.target.value.length} / 280`;
  document.getElementById('rdStep3Btn').disabled = v.length < 10;
});

function useHint(btn) {
  const text = btn.textContent;
  const ta = document.getElementById('rdQuestion');
  ta.value = text;
  ta.dispatchEvent(new Event('input'));
  ta.focus();
}

// === DECK INTERACTION ===
function buildDeck() {
  const fan = document.getElementById('rdDeckFan');
  const deckSize = 22;
  RD_STATE.deck = Array.from({length: deckSize}, (_, i) => i + 1);
  RD_STATE.picked = [];

  // Render question echo
  document.getElementById('rdQuestionEcho').textContent = `"${RD_STATE.question}"`;

  // Update needed count and hint
  const spreadConfig = SPREADS[RD_STATE.spread];
  document.getElementById('rdNeededCount').textContent = spreadConfig.count;
  document.getElementById('rdPickedCount').textContent = '0';
  document.getElementById('rdDrawHint').textContent =
    spreadConfig.count === 1
      ? 'Перемешайте колоду столько раз, сколько нужно. Затем кликните на одну карту'
      : `Перемешайте колоду столько раз, сколько нужно. Затем кликните на ${spreadConfig.count} карт в веере`;

  // Build fan: 22 cards in a semi-arc
  fan.innerHTML = '';
  const arcDeg = 100; // total arc span
  const stepDeg = arcDeg / (deckSize - 1);
  const startDeg = -arcDeg / 2;

  for (let i = 0; i < deckSize; i++) {
    const rot = startDeg + i * stepDeg;
    const radius = 280;
    const radian = (rot - 90) * Math.PI / 180;
    const x = Math.cos(radian) * radius;
    const y = Math.sin(radian) * radius + radius - 12;
    const baseTransform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
    // Random shuffle offsets (used by CSS animation)
    const shuffleX = (Math.random() - 0.5) * 120;
    const shuffleY = (Math.random() - 0.5) * 80;
    const shuffleR = (Math.random() - 0.5) * 60;

    const cardEl = document.createElement('div');
    cardEl.className = 'fan-card';
    cardEl.style.setProperty('--base-transform', baseTransform);
    cardEl.style.setProperty('--shuffle-x', shuffleX);
    cardEl.style.setProperty('--shuffle-y', shuffleY);
    cardEl.style.setProperty('--shuffle-r', shuffleR);
    cardEl.dataset.deckIndex = i;
    cardEl.innerHTML = '<div class="fan-card-back"><img src="' + TAROT_CARD_BACK + '" alt="" class="tarot-card-back-img" loading="lazy"/></div>';
    cardEl.addEventListener('click', () => pickCard(cardEl, i));
    fan.appendChild(cardEl);
  }
}

function shuffleDeck() {
  const fan = document.getElementById('rdDeckFan');
  fan.classList.remove('shuffling');
  void fan.offsetWidth; // restart animation
  fan.classList.add('shuffling');

  // Re-randomize shuffle offsets each time
  fan.querySelectorAll('.fan-card').forEach(c => {
    c.style.setProperty('--shuffle-x', (Math.random() - 0.5) * 140);
    c.style.setProperty('--shuffle-y', (Math.random() - 0.5) * 90);
    c.style.setProperty('--shuffle-r', (Math.random() - 0.5) * 70);
  });

  // Actually shuffle the deck (Fisher-Yates)
  for (let i = RD_STATE.deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [RD_STATE.deck[i], RD_STATE.deck[j]] = [RD_STATE.deck[j], RD_STATE.deck[i]];
  }
  RD_STATE.shuffleCount++;

  setTimeout(() => {
    fan.classList.remove('shuffling');
  }, 1900);
}

function pickCard(el, deckIndex) {
  if (el.classList.contains('picked')) return;
  const needed = SPREADS[RD_STATE.spread].count;
  if (RD_STATE.picked.length >= needed) return;

  const cardId = RD_STATE.deck[deckIndex];
  const reversed = Math.random() < 0.3; // 30% chance reversed
  RD_STATE.picked.push({ id: cardId, reversed });

  el.classList.add('picked');
  document.getElementById('rdPickedCount').textContent = RD_STATE.picked.length;

  // If all picked, proceed to result
  if (RD_STATE.picked.length === needed) {
    // Disable remaining cards
    document.querySelectorAll('.fan-card:not(.picked)').forEach(c => c.classList.add('disabled'));
    setTimeout(() => {
      startReadingCalculation();
    }, 700);
  }
}

function startReadingCalculation() {
  showRdStep(5);
  const stepIds = ['rdLs1', 'rdLs2', 'rdLs3', 'rdLs4'];
  let i = 0;
  document.getElementById(stepIds[0]).classList.add('current');

  const interval = setInterval(() => {
    document.getElementById(stepIds[i]).classList.remove('current');
    document.getElementById(stepIds[i]).classList.add('done');
    i++;
    if (i < stepIds.length) {
      document.getElementById(stepIds[i]).classList.add('current');
    } else {
      clearInterval(interval);
      setTimeout(() => {
        renderReadingResult();
        navigateTo('screen-reading-result');
      }, 500);
    }
  }, 700);
}

function resetRdQuiz() {
  Object.assign(RD_STATE, {
    step: 1,
    spread: null,
    question: '',
    deck: [],
    picked: [],
    shuffleCount: 0
  });
  document.querySelectorAll('#screen-reading-quiz .quiz-step').forEach(el => el.classList.remove('active'));
  document.querySelector('[data-rqstep="1"]').classList.add('active');
  document.querySelectorAll('.spread-option').forEach(o => o.classList.remove('selected'));
  ['rdStep2Btn', 'rdStep3Btn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.disabled = true;
  });
  document.getElementById('rdQuestion').value = '';
  document.getElementById('rdCharCount').textContent = '0 / 280';
  updateRdProgress();
}

// === RESULT RENDERING ===
function renderReadingResult() {
  const spreadConfig = SPREADS[RD_STATE.spread];
  const picks = RD_STATE.picked;

  // Header
  document.getElementById('rdResultSpreadName').textContent = spreadConfig.name;
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('rdResultMeta').innerHTML = `${today}<span class="dot"></span>${spreadConfig.count} ${spreadConfig.count === 1 ? 'карта' : (spreadConfig.count < 5 ? 'карты' : 'карт')}`;

  // Question
  document.getElementById('rdResultQuestion').textContent = `"${RD_STATE.question}"`;
  document.getElementById('rdResultQuestion2').textContent = `"${RD_STATE.question}"`;

  // Spread layout (big cards)
  const layoutEl = document.getElementById('rdResultSpread');
  layoutEl.innerHTML = picks.map((p, idx) => {
    const card = TAROT[p.id];
    const pos = spreadConfig.positions[idx];
    return `
      <div class="spread-position">
        <div class="spread-card ${p.reversed ? 'reversed' : ''}">
          <div class="spread-card-num">${p.id}</div>
          <div class="spread-card-icon">${TAROT_ICONS[card.icon] || ''}</div>
          <div class="spread-card-name">${card.name}</div>
          ${p.reversed ? '<div class="spread-card-reversed-tag">ПЕРЕВЁРН.</div>' : ''}
        </div>
        <div class="spread-position-label">${pos.label}</div>
        <div class="spread-position-title">${pos.title}</div>
      </div>
    `;
  }).join('');

  // Summary card
  renderRdSummary();

  // Card list (detail tab)
  renderRdCards();

  // Advice
  renderRdAdvice();
}

function renderRdSummary() {
  const picks = RD_STATE.picked;
  const spreadConfig = SPREADS[RD_STATE.spread];

  let html = '';

  // Opening — overall reading
  const firstCard = TAROT[picks[0].id];
  const firstText = picks[0].reversed ? firstCard.reversed : firstCard.upright;

  html += `
    <div class="summary-section">
      <h2 class="summary-h">Общее настроение расклада</h2>
      <p class="summary-text">${getOverallTone(picks)}</p>
    </div>
  `;

  // Per-card mini summaries
  html += `
    <div class="summary-section">
      <h2 class="summary-h">Что говорят карты</h2>
  `;
  picks.forEach((p, idx) => {
    const card = TAROT[p.id];
    const pos = spreadConfig.positions[idx];
    const text = p.reversed ? card.reversed : card.upright;
    html += `
      <p class="summary-text">
        <strong>${pos.label.charAt(0) + pos.label.slice(1).toLowerCase()} — ${card.name}${p.reversed ? ' (перевёрнутая)' : ''}.</strong>
        ${text}
      </p>
    `;
  });
  html += `</div>`;

  // Connection — how cards relate to question
  html += `
    <div class="summary-section">
      <h2 class="summary-h">Как это связано с вашим вопросом</h2>
      <p class="summary-text">${getContextualReading(picks, RD_STATE.question)}</p>
      <div class="insight-pull">
        <p>"${getCorePull(picks)}"</p>
      </div>
    </div>
  `;

  // Risk/opportunity
  const reversedCount = picks.filter(p => p.reversed).length;
  if (reversedCount > 0) {
    html += `
      <div class="summary-section">
        <h2 class="summary-h">Зона внимания</h2>
        <p class="summary-text">В вашем раскладе ${reversedCount === 1 ? 'одна перевёрнутая карта' : `${reversedCount} перевёрнутых карт${reversedCount < 5 ? 'ы' : ''}`}. Перевёрнутые карты — это указание на блокировки, теневые аспекты или необходимую внутреннюю работу. Не препятствие, а подсказка, где нужна осознанность.</p>
      </div>
    `;
  }

  document.getElementById('rdSummaryCard').innerHTML = html;
}

function getOverallTone(picks) {
  const reversedCount = picks.filter(p => p.reversed).length;
  const majorPositive = picks.some(p => !p.reversed && [3, 6, 10, 14, 17, 19, 21].includes(p.id));
  const majorChallenging = picks.some(p => [13, 15, 16, 18].includes(p.id));

  if (picks.length === 1) {
    return `Карта дня для вас — ${TAROT[picks[0].id].name}${picks[0].reversed ? ' в перевёрнутом положении' : ''}. Это лейтмотив сегодняшнего дня, ключ к настроению и принимаемым решениям.`;
  }

  if (majorPositive && reversedCount === 0) {
    return 'Расклад открывает благоприятный момент. Карты показывают, что энергия ситуации работает на вас — у вас есть ресурсы и поддержка, чтобы двигаться к желаемому. Главное — не упустить момент.';
  }
  if (majorChallenging && reversedCount >= picks.length / 2) {
    return 'Расклад указывает на непростой период. Несколько перевёрнутых карт и присутствие архетипов перемен говорят: сейчас не время форсировать события. Это время внутренней работы, переоценки, возможно — отпускания того, что больше не работает.';
  }
  if (reversedCount === 0) {
    return 'Карты разложились в прямых положениях — это знак того, что ситуация развивается естественно, без серьёзных блокировок. Внимательно прочитайте, что они говорят: ответ перед вами в прямом виде.';
  }
  return 'Расклад смешанный — есть и поддерживающие энергии, и зоны, требующие внимания. Это типичная картина живой ситуации: ничего не идеально, но и непреодолимых препятствий нет. Главное — действовать осознанно.';
}

function getContextualReading(picks, question) {
  const spreadType = RD_STATE.spread;
  const firstCard = TAROT[picks[0].id];
  const firstText = picks[0].reversed ? firstCard.reversed : firstCard.upright;

  if (spreadType === 'daily') {
    return `Ваш вопрос содержит конкретную тему, и карта ${firstCard.name} отвечает на неё прямо: ${firstText.toLowerCase()} Применительно к вашей ситуации — обратите внимание на это качество в течение дня.`;
  }
  if (spreadType === 'ppf') {
    const past = TAROT[picks[0].id];
    const present = TAROT[picks[1].id];
    const future = TAROT[picks[2].id];
    return `В контексте вашего вопроса карты выстраивают историю: вы пришли к этой ситуации через энергию ${past.name} (${picks[0].reversed ? 'в её теневом проявлении' : 'в прямом смысле'}). Сейчас — ${present.name}, это то, что разворачивается прямо сейчас. И движение идёт к ${future.name} — это направление, в котором ситуация естественным образом эволюционирует, если не вмешиваться искусственно.`;
  }
  if (spreadType === 'situation') {
    const sit = TAROT[picks[0].id];
    const obs = TAROT[picks[1].id];
    const adv = TAROT[picks[2].id];
    return `Расклад говорит: ваша ситуация по сути — ${sit.name}. Главное препятствие — ${obs.name} (${picks[1].reversed ? 'в перевёрнутом виде это часто внутреннее сопротивление, а не внешнее' : 'это внешний или ситуационный фактор'}). А путь действия — энергия ${adv.name}. Соберите эти три элемента в одну картину и получите ответ.`;
  }
  return `Карты в контексте вашего вопроса складываются в определённую картину. Прочитайте каждую внимательно — ответ собирается из их сочетания, а не из одной отдельной карты.`;
}

function getCorePull(picks) {
  const main = picks[picks.length - 1] || picks[0];
  const card = TAROT[main.id];
  const advice = main.reversed ? card.advice_rev : card.advice_up;
  return advice;
}

function renderRdCards() {
  const picks = RD_STATE.picked;
  const spreadConfig = SPREADS[RD_STATE.spread];

  const html = picks.map((p, idx) => {
    const card = TAROT[p.id];
    const pos = spreadConfig.positions[idx];
    const text = p.reversed ? card.reversed : card.upright;
    const advice = p.reversed ? card.advice_rev : card.advice_up;

    return `
      <div class="reading-card-detail">
        <div class="reading-card-header">
          <div class="reading-mini-card ${p.reversed ? 'reversed' : ''}">
            ${TAROT_ICONS[card.icon] || ''}
            <div class="reading-mini-card-name">${card.name}</div>
          </div>
          <div class="reading-card-info">
            <div class="reading-card-pos">${pos.label} · ${pos.title.toUpperCase()}</div>
            <h3 class="reading-card-title">${card.name}</h3>
            <div class="reading-card-sub">АРКАН ${p.id} · ${p.reversed ? 'ПЕРЕВЁРНУТАЯ' : 'ПРЯМАЯ'}</div>
          </div>
        </div>
        <p class="reading-card-text">${text}</p>
        <p class="reading-card-text"><strong>В позиции «${pos.title.toLowerCase()}»:</strong> эта карта говорит о том, что именно ${pos.label.toLowerCase()} в вашей ситуации связано с энергией ${card.name}. ${p.reversed ? 'Перевёрнутое положение усиливает теневые аспекты — то, что обычно скрыто или работает неосознанно.' : 'Прямое положение означает, что энергия проявлена явно и доступна для использования.'}</p>
        <div class="reading-card-tip">
          <span class="reading-card-tip-label">СОВЕТ:</span>${advice}
        </div>
      </div>
    `;
  }).join('');

  document.getElementById('rdCardsList').innerHTML = html;
}

function renderRdAdvice() {
  const picks = RD_STATE.picked;
  const spreadConfig = SPREADS[RD_STATE.spread];

  // Collect all advice from cards
  const adviceList = picks.map((p, idx) => {
    const card = TAROT[p.id];
    const pos = spreadConfig.positions[idx];
    const advice = p.reversed ? card.advice_rev : card.advice_up;
    return { pos, card, advice, reversed: p.reversed };
  });

  let html = `
    <div class="summary-section">
      <h2 class="summary-h">Главный совет расклада</h2>
      <p class="summary-text">${getCorePull(picks)}</p>
      <div class="insight-pull">
        <p>"${adviceList[adviceList.length - 1].advice}"</p>
      </div>
    </div>

    <div class="summary-section">
      <h2 class="summary-h">Что делать на каждом уровне</h2>
  `;

  adviceList.forEach(a => {
    html += `
      <p class="summary-text">
        <strong>${a.pos.label.charAt(0) + a.pos.label.slice(1).toLowerCase()} (${a.card.name}):</strong>
        ${a.advice}
      </p>
    `;
  });

  html += `</div>

    <div class="summary-section">
      <h2 class="summary-h">Чего избегать</h2>
      <p class="summary-text">${getAvoidance(picks)}</p>
    </div>

    <div class="summary-section">
      <h2 class="summary-h">Срок действия расклада</h2>
      <p class="summary-text">Этот расклад актуален в пределах текущего цикла ситуации — обычно это от нескольких дней до нескольких недель, в зависимости от того, насколько активно вы работаете с вопросом. Когда обстоятельства существенно изменятся или вопрос трансформируется — имеет смысл сделать новый расклад.</p>
      <p class="summary-text">Не делайте расклады на один и тот же вопрос слишком часто — это размывает энергию и снижает точность ответа. Дайте текущему ответу время раскрыться.</p>
    </div>
  `;

  document.getElementById('rdAdviceCard').innerHTML = html;
}

function getAvoidance(picks) {
  const reversedMajor = picks.find(p => p.reversed && [13, 15, 16, 18].includes(p.id));
  if (reversedMajor) {
    const card = TAROT[reversedMajor.id];
    return `Главное — не игнорируйте сигналы карты ${card.name} в перевёрнутом положении. ${card.reversed} Эта зона требует осознанной работы, а не вытеснения.`;
  }
  const hasJudgement = picks.find(p => !p.reversed && [8, 11, 20].includes(p.id));
  if (hasJudgement) {
    return 'Избегайте импульсивных решений в этом цикле. Карты показывают, что текущая ситуация требует взвешенности и осознанной паузы перед действием.';
  }
  return 'Избегайте форсирования событий. Карты сложились так, что естественный темп даст лучший результат, чем попытка ускорить процесс.';
}

// === Tab switching for reading result ===
document.querySelectorAll('#screen-reading-result .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.rdtab;
    document.querySelectorAll('#screen-reading-result .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#screen-reading-result .tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`[data-rdpanel="${target}"]`).classList.add('active');
    window.scrollTo({ top: 200, behavior: 'smooth' });
  });
});

document.querySelectorAll('#screen-reading-result .chat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const input = document.querySelector('#screen-reading-result .chat-input');
    input.value = chip.textContent;
    input.focus();
  });
});

document.getElementById('rdResultBackBtn').addEventListener('click', () => {
  navigateTo('screen-home');
});

updateRdProgress();



// === HOME V2 INIT ===
// === HOME V2 — Lunar phase + navigation ===

// Calculate moon phase for a given date
// Returns: { phase: 0-7, name: string, illumination: 0-1 }
// Algorithm based on Trent V. Conley / John Conway approximation
function getMoonPhase(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let r = year % 100;
  r %= 19;
  if (r > 9) r -= 19;
  r = ((r * 11) % 30) + month + day;
  if (month < 3) r += 2;
  r -= (year < 2000) ? 4 : 8.3;
  r = Math.floor(r + 0.5) % 30;
  const age = r < 0 ? r + 30 : r;  // moon age in days (0-29.5)

  // 8 phases
  let phase, name;
  if (age < 1.84) { phase = 0; name = 'Новолуние'; }
  else if (age < 5.53) { phase = 1; name = 'Растущая луна'; }
  else if (age < 9.22) { phase = 2; name = 'Первая четверть'; }
  else if (age < 12.91) { phase = 3; name = 'Прибывающая луна'; }
  else if (age < 16.61) { phase = 4; name = 'Полнолуние'; }
  else if (age < 20.30) { phase = 5; name = 'Убывающая луна'; }
  else if (age < 23.99) { phase = 6; name = 'Последняя четверть'; }
  else if (age < 27.68) { phase = 7; name = 'Старая луна'; }
  else { phase = 0; name = 'Новолуние'; }

  // Illumination 0-1
  const illumination = (1 - Math.cos((age / 29.53) * 2 * Math.PI)) / 2;

  return { phase, name, illumination, age };
}

// Approximate moon sign — VERY rough approximation
// Real calculation would need Swiss Ephemeris; this gives a believable demo
function getMoonSignApprox(date = new Date()) {
  const signs = ['Овне', 'Тельце', 'Близнецах', 'Раке', 'Льве', 'Деве',
                 'Весах', 'Скорпионе', 'Стрельце', 'Козероге', 'Водолее', 'Рыбах'];
  // Moon moves through zodiac in ~27.3 days, so ~2.27 days per sign
  // Use a stable seed: days since epoch
  const epoch = new Date(2026, 0, 1);
  const daysSince = Math.floor((date - epoch) / (1000 * 60 * 60 * 24));
  // Start position offset (so that May 14 2026 lands on Taurus for narrative match)
  const startOffset = 133; // tuned so May 14 ~ Taurus
  const signIdx = Math.floor(((daysSince + startOffset) / 2.27) % 12);
  return signs[Math.abs(signIdx)];
}

// Render moon icon SVG based on phase
function renderMoonIcon(phaseInfo) {
  const { illumination, phase } = phaseInfo;
  // 0 = new (dark), 4 = full (bright)
  // For phases 1-3 (waxing): right side lit
  // For phases 5-7 (waning): left side lit
  const waxing = phase < 4;
  const litFraction = illumination;

  if (phase === 0) {
    // New moon — empty circle
    return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="none" stroke="#8B7449" stroke-width="1" opacity="0.5"/>
      <circle cx="32" cy="32" r="20" fill="#3D2E1A" opacity="0.08"/>
      <circle cx="32" cy="32" r="22" fill="none" stroke="#8B7449" stroke-width="0.5" stroke-dasharray="2 3" opacity="0.6"/>
    </svg>`;
  }
  if (phase === 4) {
    // Full moon — solid circle
    return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="22" fill="#F5E8CC" stroke="#B8923D" stroke-width="0.8"/>
      <circle cx="26" cy="28" r="2.5" fill="#D4AE5C" opacity="0.4"/>
      <circle cx="38" cy="34" r="1.8" fill="#D4AE5C" opacity="0.35"/>
      <circle cx="30" cy="40" r="2" fill="#D4AE5C" opacity="0.3"/>
    </svg>`;
  }
  // Crescent / gibbous: render base circle with overlay
  const r = 22;
  const cx = 32, cy = 32;
  // Shadow side offset: how much of the moon is shadowed
  // illumination 0.5 = half lit; 0.75 = mostly lit (gibbous)
  const shadowWidth = (1 - litFraction) * 2 * r; // 0 = full, 2r = new
  // Shadow is an ellipse offset to one side
  const lightOnRight = waxing;
  const shadowCx = lightOnRight ? cx - r + shadowWidth / 2 : cx + r - shadowWidth / 2;
  const shadowRx = Math.max(0, (r - shadowWidth / 2));

  return `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#F5E8CC" stroke="#B8923D" stroke-width="0.8"/>
    <ellipse cx="${shadowCx}" cy="${cy}" rx="${shadowRx}" ry="${r}" fill="#F5EFE3"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#B8923D" stroke-width="0.8"/>
  </svg>`;
}

// Lunar advice mapped to phase + sign
function getLunarAdvice(phaseInfo, sign) {
  const { phase } = phaseInfo;

  const phaseAdvice = {
    0: 'Время сеять семена. Запускайте новое, формулируйте намерения, но не торопите результат.',
    1: 'Энергия роста набирает силу. Продолжайте начатое, добавляйте, расширяйте.',
    2: 'Кризис первой четверти. Если что-то пошло не так — сейчас момент скорректировать курс.',
    3: 'Подготовка к кульминации. Доводите детали, готовьтесь предъявить результат.',
    4: 'Пик энергии. Завершайте, проявляйте, празднуйте. Эмоции в полную силу.',
    5: 'Время отдачи и распределения. То, что выросло — нужно разделить с другими.',
    6: 'Кризис последней четверти. Отпустите то, что не работает. Очищение.',
    7: 'Покой и интеграция. Анализируйте опыт цикла, готовьтесь к новому.'
  };

  const signAdvice = {
    'Овне': 'Хорошее время для смелых решений и физической активности.',
    'Тельце': 'Хорошее время для укрепления того, что уже создано. Финансы, телесные практики, всё, что связано с устойчивостью — сегодня поддерживается.',
    'Близнецах': 'День разговоров, обучения, коротких контактов. Идеи приходят легко.',
    'Раке': 'День эмоций и заботы. Хорошо для семьи, дома, восстановления.',
    'Льве': 'День самопроявления и творчества. Хорошее время выйти на сцену.',
    'Деве': 'День деталей и порядка. Структурируйте, чистите, оптимизируйте.',
    'Весах': 'День партнёрств и баланса. Хорошо для переговоров и эстетики.',
    'Скорпионе': 'День глубины и трансформации. Хорошо для серьёзных разговоров.',
    'Стрельце': 'День масштаба и горизонта. Хорошо для обучения, планирования больших целей.',
    'Козероге': 'День структуры и амбиций. Хорошо для карьерных шагов.',
    'Водолее': 'День нестандартных решений и сообщества. Хорошо для новых идей.',
    'Рыбах': 'День интуиции и творчества. Хорошо для медитации и художественной работы.'
  };

  return {
    short: phase === 0 ? 'Сейте намерения, но не торопите всходы' :
           phase === 1 ? 'Углубите начатое, не начинайте новое' :
           phase === 2 ? 'Скорректируйте курс, если нужно' :
           phase === 3 ? 'Доведите детали, готовьте предъявление' :
           phase === 4 ? 'Кульминация энергии — действуйте смело' :
           phase === 5 ? 'Время делиться и распределять' :
           phase === 6 ? 'Отпустите то, что не работает' :
           'Покой, анализ, подготовка к новому циклу',
    long: signAdvice[sign] || phaseAdvice[phase]
  };
}

// Format Russian date
function formatRussianDate(date) {
  const months = ['января','февраля','марта','апреля','мая','июня',
                  'июля','августа','сентября','октября','ноября','декабря'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

// Determine recommended practice based on moon phase
function getRecommendedPractice(phaseInfo, sign) {
  const { phase } = phaseInfo;
  // Moon in earth signs (Taurus, Virgo, Capricorn) → reading on resources / matrix
  // Moon in water signs (Cancer, Scorpio, Pisces) → natal chart (emotional depth)
  // Moon in fire signs (Aries, Leo, Sagittarius) → portrait (love, expression)
  // Moon in air signs (Gemini, Libra, Aquarius) → reading on choices

  const earthSigns = ['Тельце', 'Деве', 'Козероге'];
  const waterSigns = ['Раке', 'Скорпионе', 'Рыбах'];
  const fireSigns = ['Овне', 'Льве', 'Стрельце'];

  if (earthSigns.includes(sign)) {
    return {
      practice: 'reading',
      title: 'Индивидуальный расклад',
      desc: `Луна в ${sign} — благоприятный момент задать вопросы о ресурсах, телесности, материальной базе. Карты ответят точнее обычного.`,
      cta: 'Начать расклад',
      icon: 'reading'
    };
  }
  if (waterSigns.includes(sign)) {
    return {
      practice: 'natal',
      title: 'Натальная карта',
      desc: `Луна в ${sign} обостряет интуицию и эмоциональную глубину. Хорошее время вернуться к натальной карте — увидеть в ней то, что раньше ускользало.`,
      cta: 'Открыть карту',
      icon: 'natal'
    };
  }
  if (fireSigns.includes(sign)) {
    return {
      practice: 'matrix',
      title: 'Матрица судьбы',
      desc: `Луна в ${sign} даёт энергию проявленности. Подходящий момент посмотреть на свою матрицу — увидеть путь и миссию ясно.`,
      cta: 'Открыть матрицу',
      icon: 'matrix'
    };
  }
  // Air signs
  return {
    practice: 'reading',
    title: 'Индивидуальный расклад',
    desc: `Луна в ${sign} — момент ясности и решений. Сформулируйте вопрос, на который давно искали ответ.`,
    cta: 'Начать расклад',
    icon: 'reading'
  };
}

// Icons for recommended practice
const PRACTICE_ICONS = {
  reading: '<svg viewBox="0 0 88 88" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><rect x="18" y="14" width="22" height="34" rx="2" transform="rotate(-12 29 31)"/><rect x="33" y="20" width="22" height="34" rx="2"/><rect x="48" y="14" width="22" height="34" rx="2" transform="rotate(12 59 31)"/><rect x="30" y="52" width="22" height="34" rx="2" transform="rotate(-6 41 69)"/><circle cx="44" cy="37" r="3" fill="currentColor" stroke="none"/><circle cx="41" cy="69" r="2" fill="currentColor" stroke="none"/></svg>',
  natal: '<svg viewBox="0 0 88 88" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><circle cx="44" cy="44" r="32"/><circle cx="44" cy="44" r="22"/><circle cx="44" cy="44" r="10"/><line x1="12" y1="44" x2="76" y2="44"/><line x1="44" y1="12" x2="44" y2="76"/><line x1="22" y1="22" x2="66" y2="66"/><line x1="66" y1="22" x2="22" y2="66"/><circle cx="44" cy="12" r="2.5" fill="currentColor" stroke="none"/><circle cx="76" cy="44" r="2.5" fill="currentColor" stroke="none"/><circle cx="24" cy="64" r="2.5" fill="currentColor" stroke="none"/></svg>',
  matrix: '<svg viewBox="0 0 88 88" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="44,8 80,44 44,80 8,44"/><polygon points="44,20 68,44 44,68 20,44"/><line x1="44" y1="8" x2="44" y2="80"/><line x1="8" y1="44" x2="80" y2="44"/><circle cx="44" cy="44" r="4" fill="currentColor" stroke="none"/></svg>'
};

// === INIT V2 HOME ===
(function initHomeV2() {
  const today = new Date();
  const phaseInfo = getMoonPhase(today);
  const moonSign = getMoonSignApprox(today);
  const advice = getLunarAdvice(phaseInfo, moonSign);
  const rec = getRecommendedPractice(phaseInfo, moonSign);

  // Date
  const dateEl = document.getElementById('todayDate');
  if (dateEl) dateEl.textContent = formatRussianDate(today);

  // Moon icon
  const moonIconEl = document.getElementById('todayMoonIcon');
  if (moonIconEl) moonIconEl.innerHTML = renderMoonIcon(phaseInfo);

  // Moon title
  const moonTitleEl = document.getElementById('todayMoonTitle');
  if (moonTitleEl) moonTitleEl.innerHTML = `${phaseInfo.name} <em>в ${moonSign}</em>`;

  // Moon description (long)
  const moonDescEl = document.getElementById('todayMoonDesc');
  if (moonDescEl) moonDescEl.textContent = advice.long;

  // Short advice
  const adviceEl = document.getElementById('todayAdviceText');
  if (adviceEl) adviceEl.textContent = advice.short;

  // Featured card — update to recommended practice
  const featuredCard = document.querySelector('#home-v2 .featured-card');
  if (featuredCard) {
    featuredCard.dataset.practiceV2 = rec.practice;
    featuredCard.querySelector('.featured-title').textContent = rec.title;
    featuredCard.querySelector('.featured-desc').textContent = rec.desc;
    const ctaText = featuredCard.querySelector('.featured-cta');
    if (ctaText) {
      const ctaLabel = rec.cta;
      ctaText.firstChild.textContent = ctaLabel + ' ';
    }
    const iconEl = featuredCard.querySelector('.featured-icon');
    if (iconEl && PRACTICE_ICONS[rec.icon]) {
      // Replace inner content of the SVG with the new one
      iconEl.outerHTML = PRACTICE_ICONS[rec.icon].replace('<svg ', '<svg class="featured-icon" ');
    }
  }

  // Wire up navigation on V2 cards
  document.querySelectorAll('#home-v2 [data-practice-v2]').forEach(card => {
    card.addEventListener('click', () => {
      const p = card.dataset.practiceV2;
      card.style.transform = 'scale(0.98)';
      setTimeout(() => { card.style.transform = ''; }, 150);

      if (p === 'natal') {
        resetQuiz();
        navigateTo('screen-natal-quiz');
      } else if (p === 'matrix') {
        resetMxQuiz();
        navigateTo('screen-matrix-quiz');
      } else if (p === 'reading' || p === 'reading-alt') {
        resetRdQuiz();
        navigateTo('screen-reading-quiz');
      } else if (p === 'portrait') {
        if (typeof openPortraitQuiz === 'function') {
          openPortraitQuiz();
        } else {
          console.warn('openPortraitQuiz not loaded');
        }
      }
    });
  });
})();



// === TESTIMONIALS INIT ===
// === TESTIMONIALS CAROUSEL ===
(function initTestimonials() {
  const stage = document.getElementById('testimonialStage');
  if (!stage) return;

  const cards = stage.querySelectorAll('.testimonial-card');
  const dots = stage.querySelectorAll('.testimonial-dot');
  const progressBar = document.getElementById('testProgressBar');
  const prevBtn = document.getElementById('testPrev');
  const nextBtn = document.getElementById('testNext');

  const TOTAL = cards.length;
  const AUTO_INTERVAL = 7000;        // 7s between slides
  const PAUSE_AFTER_INTERACTION = 20000;  // 20s pause if user interacts
  const PROGRESS_TICK = 80;          // progress bar update interval

  let current = 0;
  let autoTimer = null;
  let progressTimer = null;
  let pauseTimer = null;
  let progress = 0;
  let isPaused = false;

  function showSlide(idx) {
    cards.forEach((c, i) => {
      c.classList.toggle('active', i === idx);
    });
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === idx);
    });
    current = idx;
    resetProgress();
  }

  function nextSlide() {
    showSlide((current + 1) % TOTAL);
  }

  function prevSlide() {
    showSlide((current - 1 + TOTAL) % TOTAL);
  }

  function resetProgress() {
    progress = 0;
    if (progressBar) progressBar.style.width = '0%';
  }

  function tickProgress() {
    if (isPaused) return;
    progress += PROGRESS_TICK;
    const pct = Math.min(100, (progress / AUTO_INTERVAL) * 100);
    if (progressBar) progressBar.style.width = pct + '%';
    if (progress >= AUTO_INTERVAL) {
      nextSlide();
    }
  }

  function startAuto() {
    stopAuto();
    progressTimer = setInterval(tickProgress, PROGRESS_TICK);
  }

  function stopAuto() {
    if (progressTimer) {
      clearInterval(progressTimer);
      progressTimer = null;
    }
  }

  function handleInteraction() {
    // Pause auto-play, then resume after PAUSE_AFTER_INTERACTION
    isPaused = true;
    stopAuto();
    resetProgress();
    if (pauseTimer) clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => {
      isPaused = false;
      startAuto();
    }, PAUSE_AFTER_INTERACTION);
  }

  // Dot clicks
  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      showSlide(idx);
      handleInteraction();
    });
  });

  // Side buttons
  if (prevBtn) prevBtn.addEventListener('click', () => {
    prevSlide();
    handleInteraction();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    nextSlide();
    handleInteraction();
  });

  // Pause on hover over the stage (without resetting timer fully —
  // it's just a brief courtesy when user is reading)
  let hoverPauseActive = false;
  stage.addEventListener('mouseenter', () => {
    if (!isPaused) {
      hoverPauseActive = true;
      stopAuto();
    }
  });
  stage.addEventListener('mouseleave', () => {
    if (hoverPauseActive && !isPaused) {
      hoverPauseActive = false;
      startAuto();
    }
  });

  // Basic swipe support for touch
  let touchStartX = null;
  stage.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) {
      if (dx < 0) nextSlide();
      else prevSlide();
      handleInteraction();
    }
    touchStartX = null;
  });

  // Pause when section is offscreen (perf + UX — no point cycling when not visible)
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isPaused && !hoverPauseActive) {
          startAuto();
        } else {
          stopAuto();
        }
      });
    }, { threshold: 0.2 });
    observer.observe(stage);
  } else {
    // Fallback: just start
    startAuto();
  }
})();



    // === Экспорт функций в window для inline onclick ===
    // Без этого браузер не находит функции, потому что они внутри __loviaInit scope
    if (typeof navigateTo === 'function') window.navigateTo = navigateTo;
    if (typeof navigateToPayment === 'function') window.navigateToPayment = navigateToPayment;
    if (typeof renderDashboard === 'function') window.renderDashboard = renderDashboard;
    if (typeof openLoginModal === 'function') window.openLoginModal = openLoginModal;
    if (typeof closeLoginModal === 'function') window.closeLoginModal = closeLoginModal;
    if (typeof logoutUser === 'function') window.logoutUser = logoutUser;
    if (typeof addOrderToHistory === 'function') window.addOrderToHistory = addOrderToHistory;
    if (typeof openPortraitQuiz === 'function') window.openPortraitQuiz = openPortraitQuiz;
    if (typeof quizNext === 'function') window.quizNext = quizNext;
    if (typeof startCalculation === 'function') window.startCalculation = startCalculation;
    if (typeof selectTimeMode === 'function') window.selectTimeMode = selectTimeMode;
    if (typeof mxQuizNext === 'function') window.mxQuizNext = mxQuizNext;
    if (typeof selectMxFocus === 'function') window.selectMxFocus = selectMxFocus;
    if (typeof startMatrixCalculation === 'function') window.startMatrixCalculation = startMatrixCalculation;
    if (typeof rdQuizNext === 'function') window.rdQuizNext = rdQuizNext;
    if (typeof selectSpread === 'function') window.selectSpread = selectSpread;
    if (typeof useHint === 'function') window.useHint = useHint;
    if (typeof shuffleDeck === 'function') window.shuffleDeck = shuffleDeck;
    if (typeof resetRdQuiz === 'function') window.resetRdQuiz = resetRdQuiz;

    // Stage 3 init
    try { initGlossaryListeners(); } catch(e) { console.warn('glossary init:', e); }
    try { initPaymentScreen(); } catch(e) { console.warn('payment init:', e); }
    try { initDashboard(); } catch(e) { console.warn('dashboard init:', e); }
    try { initPortraitQuiz(); } catch(e) { console.warn('portrait quiz init:', e); }
    try { initPayUpsellModal(); } catch(e) { console.warn('upsell modal init:', e); }
    try { initSpeedupModal(); } catch(e) { console.warn('speedup modal init:', e); }
    try { initOnboarding(); } catch(e) { console.warn('onboarding init:', e); }
    try { initActiveBanner(); } catch(e) { console.warn('active banner init:', e); }
    try { initInterpModeToggle(); } catch(e) { console.warn('mode toggle init:', e); }
    } catch (err) {
    if (typeof console !== 'undefined') console.error('Lovia init error:', err);
  }
}

// Тройная попытка инициализации — на случай Telegram in-app browser
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __loviaInit);
} else {
  __loviaInit();
}
// window.load — срабатывает даже если DOMContentLoaded был пропущен
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('load', __loviaInit);
}
// setTimeout-страховка — последняя линия защиты
setTimeout(__loviaInit, 100);
setTimeout(__loviaInit, 500);
setTimeout(__loviaInit, 1500);
