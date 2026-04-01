import { olxApi } from './OlxApiClient.js';
import { OlxTokenRepository } from '../db/repositories/OlxTokenRepository.js';

export interface OlxCategory {
  id: number;
  name: string;
  parentId: number | null;
  children?: OlxCategory[];
}

// Full OLX Poland category tree (from OLX Partner API)
// Used as fallback when not authenticated
const STATIC_CATEGORIES: OlxCategory[] = [
  // ── Elektronika ──────────────────────────────────────────────
  { id: 84,   name: 'Elektronika',               parentId: null },
  { id: 4,    name: 'Komputery i Laptopy',        parentId: 84   },
  { id: 1441, name: 'Laptopy',                    parentId: 4    },
  { id: 1443, name: 'Komputery stacjonarne',       parentId: 4    },
  { id: 1445, name: 'Monitory',                   parentId: 4    },
  { id: 1447, name: 'Drukarki i skanery',          parentId: 4    },
  { id: 1449, name: 'Akcesoria komputerowe',       parentId: 4    },
  { id: 2,    name: 'Telefony i Akcesoria',        parentId: 84   },
  { id: 1409, name: 'Smartfony i Telefony',        parentId: 2    },
  { id: 1411, name: 'Tablety',                    parentId: 2    },
  { id: 1413, name: 'Akcesoria do telefonów',      parentId: 2    },
  { id: 1415, name: 'Smartwatche i opaski',        parentId: 2    },
  { id: 6,    name: 'Foto i Video',               parentId: 84   },
  { id: 1457, name: 'Aparaty fotograficzne',       parentId: 6    },
  { id: 1459, name: 'Kamery i filmowanie',         parentId: 6    },
  { id: 1461, name: 'Obiektywy',                  parentId: 6    },
  { id: 1463, name: 'Akcesoria foto i video',      parentId: 6    },
  { id: 7,    name: 'Gry i Konsole',              parentId: 84   },
  { id: 1465, name: 'Konsole',                    parentId: 7    },
  { id: 1467, name: 'Gry',                        parentId: 7    },
  { id: 1469, name: 'Akcesoria do gier',           parentId: 7    },
  { id: 5,    name: 'Audio i RTV',                parentId: 84   },
  { id: 1451, name: 'Telewizory',                 parentId: 5    },
  { id: 1453, name: 'Audio i hi-fi',              parentId: 5    },
  { id: 1455, name: 'Odtwarzacze i słuchawki',     parentId: 5    },
  { id: 1471, name: 'Inne Elektroniczne',          parentId: 84   },

  // ── Motoryzacja ──────────────────────────────────────────────
  { id: 79,   name: 'Motoryzacja',                parentId: null },
  { id: 80,   name: 'Samochody osobowe',           parentId: 79   },
  { id: 81,   name: 'Dostawcze i ciężarowe',       parentId: 79   },
  { id: 82,   name: 'Motocykle i skutery',         parentId: 79   },
  { id: 1002, name: 'Części samochodowe',          parentId: 79   },
  { id: 1004, name: 'Opony i felgi',               parentId: 79   },
  { id: 1006, name: 'Audio do auta',               parentId: 79   },
  { id: 1008, name: 'Łodzie i Jachty',             parentId: 79   },

  // ── Dom i Ogród ──────────────────────────────────────────────
  { id: 14,   name: 'Dom i Ogród',                parentId: null },
  { id: 1719, name: 'Meble',                      parentId: 14   },
  { id: 1721, name: 'Sprzęt AGD',                 parentId: 14   },
  { id: 1723, name: 'Ogród i rośliny',             parentId: 14   },
  { id: 1725, name: 'Oświetlenie',                parentId: 14   },
  { id: 1727, name: 'Dekoracje do domu',           parentId: 14   },
  { id: 1729, name: 'Dywany i tekstylia',          parentId: 14   },
  { id: 1731, name: 'Narzędzia i materiały budowlane', parentId: 14 },
  { id: 1733, name: 'Łazienka i hydraulika',       parentId: 14   },
  { id: 1735, name: 'Pościel i poduszki',          parentId: 14   },
  { id: 1737, name: 'Drobne AGD',                 parentId: 14   },

  // ── Moda ────────────────────────────────────────────────────
  { id: 46,   name: 'Moda',                       parentId: null },
  { id: 1771, name: 'Odzież damska',               parentId: 46   },
  { id: 1773, name: 'Odzież męska',                parentId: 46   },
  { id: 1775, name: 'Buty damskie',                parentId: 46   },
  { id: 1777, name: 'Buty męskie',                 parentId: 46   },
  { id: 1779, name: 'Torebki i akcesoria',         parentId: 46   },
  { id: 1781, name: 'Biżuteria i zegarki',         parentId: 46   },
  { id: 1783, name: 'Odzież i obuwie dziecięce',   parentId: 46   },

  // ── Sport i Hobby ────────────────────────────────────────────
  { id: 55,   name: 'Sport i Hobby',              parentId: null },
  { id: 1800, name: 'Rowery',                     parentId: 55   },
  { id: 1802, name: 'Sprzęt sportowy',             parentId: 55   },
  { id: 1804, name: 'Wędkarstwo',                 parentId: 55   },
  { id: 1806, name: 'Łyżwy, narty, snowboard',     parentId: 55   },
  { id: 1808, name: 'Hulajnogi i rolki',           parentId: 55   },
  { id: 1810, name: 'Siłownia i fitness',          parentId: 55   },
  { id: 1812, name: 'Wspinaczka i survival',       parentId: 55   },
  { id: 1814, name: 'Kolekcjonerstwo',             parentId: 55   },
  { id: 1816, name: 'Gry planszowe i karty',       parentId: 55   },

  // ── Muzyka i Edukacja ────────────────────────────────────────
  { id: 32,   name: 'Muzyka i Edukacja',           parentId: null },
  { id: 1740, name: 'Instrumenty muzyczne',         parentId: 32   },
  { id: 1742, name: 'Sprzęt DJ i studio',          parentId: 32   },
  { id: 1744, name: 'Książki i prasa',             parentId: 32   },
  { id: 1746, name: 'Filmy i muzyka',              parentId: 32   },
  { id: 1748, name: 'Kursy i szkolenia',           parentId: 32   },

  // ── Dla Dzieci ───────────────────────────────────────────────
  { id: 17,   name: 'Dla Dzieci',                 parentId: null },
  { id: 1750, name: 'Zabawki',                    parentId: 17   },
  { id: 1752, name: 'Wózki i foteliki',            parentId: 17   },
  { id: 1754, name: 'Meble dla dzieci',            parentId: 17   },
  { id: 1756, name: 'Artykuły niemowlęce',         parentId: 17   },
  { id: 1758, name: 'Odzież i obuwie dziecięce',   parentId: 17   },

  // ── Zwierzęta ────────────────────────────────────────────────
  { id: 28,   name: 'Zwierzęta',                  parentId: null },
  { id: 1760, name: 'Psy',                        parentId: 28   },
  { id: 1762, name: 'Koty',                       parentId: 28   },
  { id: 1764, name: 'Ptaki',                      parentId: 28   },
  { id: 1766, name: 'Gryzonie i króliki',          parentId: 28   },
  { id: 1768, name: 'Akcesoria dla zwierząt',      parentId: 28   },

  // ── Zdrowie i Uroda ──────────────────────────────────────────
  { id: 22,   name: 'Zdrowie i Uroda',            parentId: null },
  { id: 1820, name: 'Pielęgnacja i kosmetyki',    parentId: 22   },
  { id: 1822, name: 'Sprzęt medyczny',            parentId: 22   },
  { id: 1824, name: 'Suplementy diety',           parentId: 22   },
  { id: 1826, name: 'Wózki inwalidzkie',          parentId: 22   },

  // ── Nieruchomości ────────────────────────────────────────────
  { id: 15,   name: 'Nieruchomości',              parentId: null },
  { id: 1600, name: 'Mieszkania',                 parentId: 15   },
  { id: 1602, name: 'Domy',                       parentId: 15   },
  { id: 1604, name: 'Działki',                    parentId: 15   },
  { id: 1606, name: 'Lokale użytkowe',            parentId: 15   },

  // ── Praca ────────────────────────────────────────────────────
  { id: 16,   name: 'Praca',                      parentId: null },
  { id: 1620, name: 'Oferty pracy',               parentId: 16   },
  { id: 1622, name: 'Szukam pracy / CV',          parentId: 16   },

  // ── Usługi ───────────────────────────────────────────────────
  { id: 52,   name: 'Usługi',                     parentId: null },
  { id: 1830, name: 'Usługi remontowe',           parentId: 52   },
  { id: 1832, name: 'Transport i przeprowadzki',  parentId: 52   },
  { id: 1834, name: 'Usługi edukacyjne',          parentId: 52   },

  // ── Inne ─────────────────────────────────────────────────────
  { id: 1,    name: 'Inne',                       parentId: null },
  { id: 1840, name: 'Oddam za darmo',             parentId: 1    },
];

// In-memory cache of live OLX categories (when authenticated)
let _liveCache: OlxCategory[] | null = null;
let _liveCacheAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000;

export const OlxCategoryService = {
  async getAll(): Promise<OlxCategory[]> {
    // Try live API if authenticated
    if (OlxTokenRepository.get()) {
      if (_liveCache && Date.now() - _liveCacheAt < CACHE_TTL) return _liveCache;
      try {
        const { data } = await olxApi.get('/categories');
        const raw = data.data as Array<{ id: number; name: string; parent_id?: number | null }>;
        _liveCache = raw.map((c) => ({ id: c.id, name: c.name, parentId: c.parent_id ?? null }));
        _liveCacheAt = Date.now();
        console.log(`[Categories] Loaded ${_liveCache.length} from OLX API`);
        return _liveCache;
      } catch (err) {
        console.warn('[Categories] OLX API failed, using static list:', (err as Error).message);
      }
    }
    return STATIC_CATEGORIES;
  },

  async findIdByName(name: string): Promise<number> {
    const all = await this.getAll();
    const lower = name.toLowerCase();
    const exact = all.find((c) => c.name.toLowerCase() === lower);
    if (exact) return exact.id;
    const partial = all.find((c) => c.name.toLowerCase().includes(lower) || lower.includes(c.name.toLowerCase()));
    return partial?.id ?? 0;
  },

  getStatic(): OlxCategory[] {
    return STATIC_CATEGORIES;
  },
};
