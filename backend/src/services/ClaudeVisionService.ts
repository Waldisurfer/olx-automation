import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/AppConfig.js';
import { WebSearchService } from './WebSearchService.js';
import type { PhotoAnalysisResult, ItemMetadata, VerificationResult, DocumentExtractResult } from '../types/Claude.types.js';
import type { Listing } from '../types/Listing.types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '../../uploads');

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

const ANALYSIS_TOOL: Anthropic.Tool = {
  name: 'analyze_item',
  description: 'Analyze item photos and return structured listing data in Polish',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: {
        type: 'string',
        description: 'Krótki, chwytliwy tytuł ogłoszenia przyciągający kupujących (max 70 znaków). Zawrzyj markę i model jeśli znane.',
      },
      description: {
        type: 'string',
        description: `Entuzjastyczny, przekonujący opis sprzedaży na OLX po polsku (300-700 znaków).

FORMATOWANIE (OLX wyświetla znaki nowej linii — używaj ich!):
- Zacznij od 1-2 zdań podkreślających główną zaletę produktu
- Zostaw pustą linię
- Wymień kluczowe cechy/specyfikacje jako osobne linie zaczynające się od "✓ " lub "• "
- Zostaw pustą linię
- Napisz 1 zdanie o stanie: "Stan jak na zdjęciach — produkt działa bez zarzutu."
- Jeśli masz link do oficjalnej strony, dodaj "Więcej info: [url]"
- Zakończ zachętą: "Zapraszam do kontaktu!"

Przykład struktury:
"Świetny [produkt] w bardzo dobrym stanie — idealny dla [kogo].

✓ [cecha 1]
✓ [cecha 2]
✓ [cecha 3]

Stan jak na zdjęciach, działa bez zarzutu.
Zapraszam do kontaktu!"`,
      },
      condition: {
        type: 'string',
        enum: ['nowy', 'używany_dobry', 'używany_dostateczny', 'używany_zły'],
        description: 'Stan przedmiotu na podstawie zdjęć',
      },
      suggestedCategory: {
        type: 'string',
        description: 'Sugerowana kategoria OLX po polsku',
      },
      keywords: {
        type: 'array',
        items: { type: 'string' },
        description: 'Słowa kluczowe do wyszukiwania podobnych ofert (4-7 słów, marka, model, typ)',
      },
      officialUrl: {
        type: 'string',
        description: 'URL oficjalnej strony produktu (jeśli znaleziony w sieci), lub pusty string',
      },
      estimatedPriceRange: {
        type: 'object',
        properties: {
          min: { type: 'number', description: 'Minimalna cena w PLN' },
          max: { type: 'number', description: 'Maksymalna cena w PLN' },
        },
        required: ['min', 'max'],
      },
    },
    required: ['title', 'description', 'condition', 'suggestedCategory', 'keywords', 'officialUrl'],
  },
};

const EXTRACT_TOOL: Anthropic.Tool = {
  name: 'extract_product_info',
  description: 'Extract product information from receipt, invoice, nameplate or product label photos',
  input_schema: {
    type: 'object' as const,
    properties: {
      itemName:       { type: 'string', description: 'Pełna nazwa produktu/urządzenia po polsku' },
      brand:          { type: 'string', description: 'Marka / producent' },
      model:          { type: 'string', description: 'Numer modelu / symbol' },
      yearOfProduction: { type: 'string', description: 'Rok produkcji (4 cyfry)' },
      serialNumber:   { type: 'string', description: 'Numer seryjny / S/N' },
      specs:          { type: 'string', description: 'Specyfikacje techniczne znalezione w dokumentach (moc, napięcie, waga, wymiary, pojemność itd.)' },
      purchasePrice:  { type: 'number', description: 'Cena zakupu z paragonu/faktury w PLN' },
      purchaseDate:   { type: 'string', description: 'Data zakupu z paragonu/faktury (YYYY-MM-DD)' },
      additionalInfo: { type: 'string', description: 'Inne istotne informacje z dokumentu' },
    },
    required: [],
  },
};

const VERIFY_TOOL: Anthropic.Tool = {
  name: 'verify_listing',
  description: 'Analyze an OLX listing and return concrete optimization suggestions',
  input_schema: {
    type: 'object' as const,
    properties: {
      score: { type: 'number', description: 'Quality score 0-100. Start at 100, deduct per issue.' },
      suggestions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            element: { type: 'string', enum: ['title', 'description', 'price', 'photos', 'shipping', 'city', 'condition'] },
            severity: { type: 'string', enum: ['error', 'warning', 'tip'] },
            title: { type: 'string', description: 'Short issue name, max 50 chars, in Polish' },
            message: { type: 'string', description: 'Explanation why it matters, in Polish' },
            newValue: { type: 'string', description: 'Improved value. For price: number as string. For title/description: full new text.' },
          },
          required: ['id', 'element', 'severity', 'title', 'message'],
        },
      },
    },
    required: ['score', 'suggestions'],
  },
};

export const ClaudeVisionService = {
  async extractFromDocuments(fileIds: string[]): Promise<DocumentExtractResult> {
    const imageContents: Anthropic.ImageBlockParam[] = fileIds
      .filter((id) => { try { readFileSync(join(UPLOADS_DIR, `${id}.jpg`)); return true; } catch { return false; } })
      .map((fileId) => ({
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: readFileSync(join(UPLOADS_DIR, `${fileId}.jpg`)).toString('base64') },
      }));

    if (imageContents.length === 0) return {};

    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 800,
      tools: [EXTRACT_TOOL],
      tool_choice: { type: 'tool', name: 'extract_product_info' },
      system: `Jesteś ekspertem od odczytywania danych produktów z dokumentów. Odczytujesz paragony, faktury, tabliczki znamionowe i etykiety. Podajesz tylko te dane, które faktycznie widzisz na zdjęciu — nie zgadujesz.`,
      messages: [{
        role: 'user',
        content: [
          ...imageContents,
          {
            type: 'text',
            text: `Odczytaj dane produktu z tych zdjęć. Mogą to być: paragon, faktura, tabliczka znamionowa, opakowanie, etykieta. Wyodrębnij wszystkie dostępne informacje o produkcie.`,
          },
        ],
      }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') return {};
    return toolUse.input as DocumentExtractResult;
  },

  async verifyListing(listing: Listing): Promise<VerificationResult> {
    const imageContents: Anthropic.ImageBlockParam[] = listing.photos
      .slice(0, 4)
      .filter((id) => { try { readFileSync(join(UPLOADS_DIR, `${id}.jpg`)); return true; } catch { return false; } })
      .map((fileId) => ({
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: readFileSync(join(UPLOADS_DIR, `${fileId}.jpg`)).toString('base64') },
      }));

    const isPriceRound = listing.price % 10 === 0 || listing.price % 50 === 0 || listing.price % 100 === 0;
    const suggestedPrecisePrice = Math.round(listing.price * 0.95) % 10 === 0
      ? listing.price - 11
      : listing.price - (listing.price % 10) - 1;

    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 2000,
      tools: [VERIFY_TOOL],
      tool_choice: { type: 'tool', name: 'verify_listing' },
      system: `Jesteś ekspertem od optymalizacji ogłoszeń na OLX.pl. Znasz wszystkie techniki skutecznej sprzedaży. Oceniasz ogłoszenia konkretnie i bezpośrednio po polsku.`,
      messages: [{
        role: 'user',
        content: [
          ...(imageContents.length > 0 ? imageContents : []),
          {
            type: 'text',
            text: `Zweryfikuj to ogłoszenie OLX i podaj konkretne sugestie poprawy:

TYTUŁ (${listing.title.length}/70 znaków): "${listing.title}"
OPIS: "${listing.description}"
CENA: ${listing.price} PLN${isPriceRound ? ' ⚠️ OKRĄGŁA LICZBA' : ''}
STAN: ${listing.condition}
MIASTO: ${listing.city || '(nie podano)'}
WYSYŁKA: ${listing.shipping ? 'tak' : 'nie'}
NEGOCJACJE: ${listing.negotiable ? 'tak' : 'nie'}
LICZBA ZDJĘĆ: ${listing.photos.length}/8
KATEGORIA: ${listing.categoryName}

Sprawdź wg tych kryteriów:

1. TYTUŁ: Czy zawiera markę + model + stan + co w zestawie? Czy jest konkretny (nie "Sprzedam X")? Max 70 znaków.
2. OPIS: Czy wymienia stan, specyfikacje techniczne, czas używania, ewentualne wady? Czy jest ustrukturyzowany (akapity/punkty)? Czy wspomina o wysyłce/płatności?
3. CENA: Okrągła liczba (100/200/500) to sygnał że można negocjować — użyj precyzyjnej (np. 189 zamiast 200). Sugerowana precyzyjna: ${suggestedPrecisePrice} PLN.
4. ZDJĘCIA: Minimum 6 zalecane. Masz ${listing.photos.length}. ${imageContents.length > 0 ? 'Sprawdź jakość zdjęć na załączonych.' : ''}
5. MIASTO: Bez miasta ogłoszenie ma mniejszy zasięg lokalny.
6. WYSYŁKA: Dla elektroniki/małych przedmiotów wysyłka zwiększa zasięg 10x.

Dla każdej sugestii z nową wartością tytułu/opisu — napisz gotową, ulepszoną wersję w polu newValue.`,
          },
        ],
      }],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('No verification result from Claude');
    return toolUse.input as VerificationResult;
  },


  async regenerateDescription(
    fileIds: string[],
    existing: PhotoAnalysisResult,
    changeRequest: string
  ): Promise<PhotoAnalysisResult> {
    const imageContents: Anthropic.ImageBlockParam[] = fileIds
      .filter((id) => {
        try { readFileSync(join(UPLOADS_DIR, `${id}.jpg`)); return true; } catch { return false; }
      })
      .map((fileId) => ({
        type: 'image' as const,
        source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: readFileSync(join(UPLOADS_DIR, `${fileId}.jpg`)).toString('base64') },
      }));

    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 1500,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'any' },
      system: `Jesteś ekspertem od sprzedaży na OLX.pl. Piszesz entuzjastyczne, zachęcające ogłoszenia po polsku.`,
      messages: [
        {
          role: 'user',
          content: [
            ...(imageContents.length > 0 ? imageContents : []),
            {
              type: 'text',
              text: `Mam istniejące ogłoszenie OLX i chcę je poprawić.

Obecny tytuł: ${existing.title}
Obecny opis: ${existing.description}
Obecna kategoria: ${existing.suggestedCategory}
Obecne słowa kluczowe: ${existing.keywords.join(', ')}
${existing.officialUrl ? `Link do strony: ${existing.officialUrl}` : ''}

ZMIANA KTÓRĄ CHCĘ WPROWADZIĆ:
${changeRequest}

Wygeneruj nową wersję ogłoszenia uwzględniając powyższą zmianę. Zachowaj entuzjastyczny styl, podkreślaj zalety produktu.`,
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') throw new Error('Claude did not return structured analysis');
    const result = toolUse.input as PhotoAnalysisResult;
    if (!result.officialUrl && existing.officialUrl) result.officialUrl = existing.officialUrl;
    return result;
  },

  async analyzePhotos(fileIds: string[], metadata?: ItemMetadata): Promise<PhotoAnalysisResult> {
    if (fileIds.length === 0) throw new Error('At least one photo is required');
    if (fileIds.length > 8) throw new Error('Maximum 8 photos allowed');

    // Build search query from metadata
    const searchQuery = buildSearchQuery(metadata);

    // Fetch product info from the web if we have enough metadata
    let webInfo = '';
    let officialUrl = '';
    if (searchQuery) {
      try {
        const info = await WebSearchService.searchProduct(searchQuery);
        officialUrl = info.officialUrl ?? '';
        if (info.abstract || info.features.length > 0) {
          webInfo = buildWebInfoText(info);
        }
      } catch (err) {
        console.warn('[Claude] Web search failed:', err);
      }
    }

    // Build images
    const imageContents: Anthropic.ImageBlockParam[] = fileIds.map((fileId) => {
      const filePath = join(UPLOADS_DIR, `${fileId}.jpg`);
      const imageData = readFileSync(filePath).toString('base64');
      return {
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: imageData },
      };
    });

    // Build context text
    const contextParts: string[] = [];
    if (metadata?.itemName) contextParts.push(`Nazwa/przedmiot: ${metadata.itemName}`);
    if (metadata?.model) contextParts.push(`Model: ${metadata.model}`);
    if (metadata?.yearOfProduction) contextParts.push(`Rok produkcji: ${metadata.yearOfProduction}`);
    if (metadata?.category) contextParts.push(`Kategoria: ${metadata.category}`);
    if (metadata?.additionalInfo) contextParts.push(`Dodatkowe info od sprzedającego: ${metadata.additionalInfo}`);
    if (officialUrl) contextParts.push(`Oficjalna strona produktu: ${officialUrl}`);
    if (webInfo) contextParts.push(`\nInformacje o produkcie z internetu:\n${webInfo}`);

    const contextBlock = contextParts.length > 0
      ? `\nDodatkowe informacje o przedmiocie:\n${contextParts.join('\n')}\n`
      : '';

    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 1500,
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'any' },
      system: `Jesteś ekspertem od sprzedaży na OLX.pl. Tworzysz BARDZO przekonujące, entuzjastyczne ogłoszenia sprzedaży po polsku.

Twój styl:
- Optymistyczny i zachęcający — sprzedajesz zalety, nie wady
- Wspominasz że stan jak na zdjęciach, ale sam produkt jest świetny, bardzo fajny, polecany
- Wyszukujesz i podkreślasz MOCNE STRONY produktu (trwałość, funkcje, renoma marki)
- Piszesz konkretnie — modele, specyfikacje, lata używania
- Jeśli znasz oficjalną stronę produktu — dodaj link "Więcej info: [url]" na końcu opisu
- Opis ma sprawiać że kupujący CHCE ten produkt`,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContents,
            {
              type: 'text',
              text: `Przeanalizuj zdjęcia i stwórz atrakcyjne ogłoszenie sprzedaży na OLX.${contextBlock}

Pamiętaj: napisz entuzjastyczny opis który podkreśla zalety produktu. Stan jak na zdjęciach, ale produkt jest bardzo fajny i wart uwagi. Jeśli masz link do oficjalnej strony — umieść go w opisie.`,
            },
          ],
        },
      ],
    });

    const toolUse = response.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') {
      throw new Error('Claude did not return structured analysis');
    }

    const result = toolUse.input as PhotoAnalysisResult;

    // Ensure official URL is populated if we found one but Claude missed it
    if (!result.officialUrl && officialUrl) {
      result.officialUrl = officialUrl;
    }

    return result;
  },
};

function buildSearchQuery(metadata?: ItemMetadata): string {
  if (!metadata) return '';
  const parts = [metadata.itemName, metadata.model, metadata.yearOfProduction].filter(Boolean);
  return parts.join(' ').trim();
}

function buildWebInfoText(info: { abstract: string; features: string[]; officialUrl: string | null }): string {
  const lines: string[] = [];
  if (info.abstract) lines.push(`Opis: ${info.abstract}`);
  if (info.features.length > 0) {
    lines.push('Cechy i zalety:');
    info.features.slice(0, 6).forEach((f) => lines.push(`- ${f}`));
  }
  return lines.join('\n');
}
