import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private claude: Anthropic;

  constructor(private config: ConfigService) {
    this.claude = new Anthropic({ apiKey: this.config.get('ANTHROPIC_API_KEY') });
  }

  async search(q: string, type: string = 'text') {
    // Step 1: organic search for technical data
    const organic = await this.serperSearch(q, type, 'search');

    if (!organic.length) {
      return { query: q, type, encontrado: false, mensagem: 'Nenhuma fonte encontrada para este código.' };
    }

    // Step 2: Claude identifies the part from organic results
    const techData = await this.extractWithClaude(q, type, organic);

    if (type === 'partnumber') {
      if (!techData.encontrado) {
        return { query: q, type: 'partnumber', encontrado: false, mensagem: techData.mensagem || 'Não encontrado.' };
      }

      // Step 3: search shopping with accurate query, then filter strictly
      const shoppingQuery = `${techData.fabricante || ''} ${techData.descricao || q} ${q}`.trim();
      const shopping = await this.serperShopping(shoppingQuery, q, techData.fabricante || '', techData.descricao || '');

      // Step 4: image — prefer shopping image of a confirmed match, skip organic images
      const photo = this.extractPhoto(shopping, q);

      const prices = this.extractPrices(shopping);

      return {
        query: q,
        type: 'partnumber',
        encontrado: true,
        part: { ...techData, precos: prices, foto: photo },
        mensagem: null,
      };
    }

    return {
      query: q,
      type: 'text',
      total: techData.totalEncontrado || techData.resultados?.length || 0,
      results: (techData.resultados || []),
      sugestoes: techData.sugestoes || [],
    };
  }

  private async serperShopping(
    shoppingQuery: string,
    partNumber: string,
    fabricante: string,
    descricao: string,
  ): Promise<any[]> {
    const apiKey = this.config.get('SERPER_API_KEY');
    try {
      const res = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: shoppingQuery, gl: 'br', hl: 'pt', num: 10 }),
      });
      const data: any = await res.json();
      const results = data.shopping || [];

      const pn = partNumber.toLowerCase().trim();
      const fab = fabricante.toLowerCase().trim();

      // Key words from description (4+ chars, ignore common words)
      const stopWords = new Set(['para', 'peça', 'auto', 'carro', 'veículo', 'original', 'novo']);
      const descWords = descricao
        .toLowerCase()
        .split(/[\s,\-\/]+/)
        .filter((w) => w.length >= 4 && !stopWords.has(w));

      return results.filter((r: any) => {
        const title = (r.title || '').toLowerCase();
        const price = parseFloat((r.price || '0').replace(/[^0-9,]/g, '').replace(',', '.')) || 0;

        // Minimum price sanity check
        if (price < 10) return false;

        // Priority 1: title explicitly mentions the part number
        if (pn.length >= 4 && title.includes(pn)) return true;

        // Priority 2: title mentions the manufacturer AND at least 2 desc keywords
        const mentionsFab = fab.length >= 3 && title.includes(fab);
        const descMatchCount = descWords.filter((w) => title.includes(w)).length;
        if (mentionsFab && descMatchCount >= 2) return true;

        // Priority 3: title matches at least 3 distinct description keywords (no fab required)
        if (descMatchCount >= 3) return true;

        return false;
      });
    } catch {
      return [];
    }
  }

  private async serperSearch(q: string, type: string, endpoint: string): Promise<any[]> {
    const apiKey = this.config.get('SERPER_API_KEY');
    const query =
      type === 'partnumber'
        ? `${q} part number peça automotiva especificações técnicas`
        : `${q} peça automotiva`;

    try {
      const res = await fetch(`https://google.serper.dev/${endpoint}`, {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, gl: 'br', hl: 'pt', num: 8 }),
      });
      const data: any = await res.json();
      return data.organic || data.shopping || data.images || [];
    } catch (err) {
      this.logger.warn(`Serper ${endpoint} failed for: ${q}`);
      return [];
    }
  }

  private async extractWithClaude(q: string, type: string, organic: any[]): Promise<any> {
    if (!organic.length) return { encontrado: false };

    const context = organic
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet || ''}\nURL: ${r.link}`)
      .join('\n\n');

    const prompt =
      type === 'partnumber'
        ? `Analise os resultados de busca sobre o código "${q}" e extraia dados técnicos SOMENTE se as fontes confirmam explicitamente que "${q}" é uma peça automotiva.

REGRAS ESTRITAS:
- NUNCA invente dados. Se um campo não aparece nas fontes, use null ou [].
- O campo "encontrado" só deve ser true se as fontes confirmam inequivocamente que "${q}" é um código de peça automotiva.
- "descricao" deve ser exata — não generalizar (ex: não use "rolamento" se é "rolamento de roda dianteiro direito").
- "veiculosCompativeis" só inclua veículos explicitamente mencionados nas fontes.

FONTES:
${context}

Retorne APENAS este JSON (sem texto extra):
{
  "encontrado": true,
  "partNumber": "${q}",
  "codigoOEM": null,
  "codigosAlternativos": [],
  "fabricante": "nome do fabricante",
  "descricao": "descrição completa e específica da peça",
  "categoria": "categoria da peça",
  "especificacoesTecnicas": {},
  "veiculosCompativeis": [{ "marca": "", "modelo": "", "anoInicio": null, "anoFim": null, "motor": "" }],
  "equivalentes": [{ "fabricante": "", "codigo": "" }],
  "observacoes": null,
  "fontes": []
}

Se NÃO confirmar que "${q}" é peça automotiva: {"encontrado": false, "mensagem": "Código não identificado como peça automotiva"}`
        : `Com base nas fontes abaixo, liste APENAS peças automotivas relacionadas a "${q}". Não invente.

FONTES:
${context}

Retorne APENAS este JSON:
{
  "resultados": [{ "partNumber": "", "fabricante": "", "descricao": "", "categoria": "", "veiculosCompativeis": [], "relevancia": "" }],
  "totalEncontrado": 0,
  "sugestoes": []
}`;

    const message = await this.claude.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as any).text || '{}';
    try {
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : { encontrado: false };
    } catch {
      return { encontrado: false };
    }
  }

  private extractPrices(shopping: any[]): any {
    if (!shopping.length) return null;

    const prices = shopping
      .filter((s) => s.price)
      .map((s) => ({
        titulo: s.title,
        preco: s.price,
        precoNumerico: parseFloat(s.price?.replace(/[^0-9,]/g, '').replace(',', '.')) || 0,
        loja: s.source,
        link: s.link,
        imagem: this.cleanImageUrl(s.imageUrl || s.thumbnailUrl || null),
        avaliacao: s.rating || null,
        avaliacoes: s.ratingCount || null,
      }))
      .filter((s) => s.precoNumerico > 0)
      .sort((a, b) => a.precoNumerico - b.precoNumerico);

    if (!prices.length) return null;

    return {
      maisBarato: prices[0],
      maisCaros: prices.slice(1, 4),
      faixaMinima: prices[0]?.preco,
      faixaMaxima: prices[prices.length - 1]?.preco,
      todos: prices,
    };
  }

  /**
   * Extract photo strictly from shopping results.
   * Prefer items whose title contains the part number.
   * Never use organic image search (too unreliable).
   */
  private extractPhoto(shopping: any[], partNumber: string): string | null {
    const pn = partNumber.toLowerCase();

    // First: shopping item that explicitly names the part number
    const exactMatch = shopping.find(
      (s) => s.imageUrl && (s.title || '').toLowerCase().includes(pn),
    );
    if (exactMatch?.imageUrl) return this.cleanImageUrl(exactMatch.imageUrl);

    // Second: thumbnailUrl from exact match
    const exactThumb = shopping.find(
      (s) => s.thumbnailUrl && (s.title || '').toLowerCase().includes(pn),
    );
    if (exactThumb?.thumbnailUrl) return this.cleanImageUrl(exactThumb.thumbnailUrl);

    // Third: any shopping image (at least it passed the product filter)
    const anyImage = shopping.find((s) => s.imageUrl || s.thumbnailUrl);
    if (anyImage) return this.cleanImageUrl(anyImage.imageUrl || anyImage.thumbnailUrl);

    return null;
  }

  private cleanImageUrl(url: string | null): string | null {
    if (!url) return null;
    try {
      // gstatic / encrypted-tbn are direct CDN URLs — keep them
      if (url.includes('encrypted-tbn') || url.includes('gstatic.com')) return url;
      // Extract actual URL from Google redirect
      const match = url.match(/imgurl=([^&]+)/);
      if (match) return decodeURIComponent(match[1]);
      // Drop overly long redirect URLs
      if (url.length > 300) return null;
      return url;
    } catch {
      return null;
    }
  }
}
