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
    const [organic, shopping, images] = await Promise.all([
      this.serperSearch(q, type, 'search'),
      this.serperSearch(q, type, 'shopping'),
      this.serperSearch(q, type, 'images'),
    ]);

    if (!organic.length && !shopping.length) {
      return { query: q, type, encontrado: false, mensagem: 'Part number não encontrado em nenhuma fonte.' };
    }

    const techData = await this.extractWithClaude(q, type, organic);

    if (type === 'partnumber') {
      const prices = this.extractPrices(shopping);
      const photo = this.extractPhoto(images, shopping);
      return {
        query: q,
        type: 'partnumber',
        encontrado: techData.encontrado ?? false,
        part: techData.encontrado ? { ...techData, precos: prices, foto: photo } : null,
        mensagem: techData.encontrado ? null : (techData.mensagem || 'Não encontrado.'),
      };
    }

    return {
      query: q,
      type: 'text',
      total: techData.totalEncontrado || techData.resultados?.length || 0,
      results: (techData.resultados || []).map((r: any, i: number) => ({
        ...r,
        foto: images[i]?.imageUrl || images[i]?.thumbnailUrl || null,
      })),
      sugestoes: techData.sugestoes || [],
    };
  }

  private async serperSearch(q: string, type: string, endpoint: string): Promise<any[]> {
    const apiKey = this.config.get('SERPER_API_KEY');
    const query = type === 'partnumber'
      ? endpoint === 'shopping'
        ? `${q} peça automotiva comprar`
        : endpoint === 'images'
        ? `${q} peça automotiva`
        : `${q} part number peça automotiva especificações`
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

    const prompt = type === 'partnumber'
      ? `Analise os resultados de busca sobre o código "${q}" e extraia dados técnicos SOMENTE das fontes abaixo. NÃO invente nada.

FONTES:
${context}

Retorne JSON:
{
  "encontrado": true/false,
  "partNumber": "${q}",
  "codigoOEM": "se nas fontes",
  "codigosAlternativos": [],
  "fabricante": "fabricante",
  "descricao": "descrição completa",
  "categoria": "categoria",
  "especificacoesTecnicas": { "chave": "valor" },
  "veiculosCompativeis": [{ "marca": "", "modelo": "", "anoInicio": null, "anoFim": null, "motor": "" }],
  "equivalentes": [{ "fabricante": "", "codigo": "" }],
  "observacoes": "observações técnicas",
  "fontes": ["urls"]
}

Se não confirmar que é peça automotiva: {"encontrado": false, "mensagem": "Não identificado como peça automotiva"}
Responda APENAS com JSON.`
      : `Com base nas fontes abaixo sobre "${q}", liste peças encontradas. NÃO invente.

FONTES:
${context}

JSON:
{
  "resultados": [{ "partNumber": "", "fabricante": "", "descricao": "", "categoria": "", "veiculosCompativeis": [], "relevancia": "" }],
  "totalEncontrado": 0,
  "sugestoes": []
}
Responda APENAS com JSON.`;

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
        imagem: s.imageUrl || s.thumbnailUrl || null,
        avaliacao: s.rating || null,
        avaliacoes: s.ratingCount || null,
      }))
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

  private extractPhoto(images: any[], shopping: any[]): string | null {
    const shopPhoto = shopping.find((s) => s.imageUrl)?.imageUrl;
    const photo = shopPhoto || images[0]?.imageUrl || images[0]?.thumbnailUrl || null;
    return this.cleanImageUrl(photo);
  }

  private cleanImageUrl(url: string | null): string | null {
    if (!url) return null;
    // Serper returns Google redirect URLs — extract the actual image URL
    try {
      if (url.includes('encrypted-tbn') || url.includes('gstatic.com')) return url;
      const match = url.match(/imgurl=([^&]+)/);
      if (match) return decodeURIComponent(match[1]);
      // If URL is too long (Google redirect), skip it
      if (url.length > 300) return null;
      return url;
    } catch {
      return null;
    }
  }
}
