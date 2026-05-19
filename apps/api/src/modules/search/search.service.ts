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
    const webResults = await this.searchWeb(q, type);

    if (!webResults.length) {
      return {
        query: q,
        type,
        encontrado: false,
        mensagem: 'Nenhuma fonte encontrada para este código. Verifique se o part number está correto.',
      };
    }

    const context = this.formatWebResults(webResults);
    const prompt = type === 'partnumber'
      ? this.buildPartNumberPrompt(q, context)
      : this.buildTextPrompt(q, context);

    const message = await this.claude.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (message.content[0] as any).text || '{}';
    this.logger.debug(`Claude response: ${text.substring(0, 300)}`);

    return this.parseResponse(text, q, type);
  }

  private async searchWeb(q: string, type: string): Promise<any[]> {
    const apiKey = this.config.get('SERPER_API_KEY');
    const queries = type === 'partnumber'
      ? [
          `${q} peça automotiva part number`,
          `${q} automotive part OEM`,
          `${q} spare part compatible vehicles`,
        ]
      : [`${q} peça automotiva`];

    const allResults: any[] = [];

    for (const query of queries) {
      try {
        const res = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ q: query, gl: 'br', hl: 'pt', num: 5 }),
        });
        const data: any = await res.json();
        if (data.organic) allResults.push(...data.organic);
      } catch (err) {
        this.logger.warn(`Serper query failed for: ${query}`);
      }
    }

    return allResults.slice(0, 10);
  }

  private formatWebResults(results: any[]): string {
    return results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet || ''}\nURL: ${r.link}`)
      .join('\n\n');
  }

  private buildPartNumberPrompt(q: string, context: string): string {
    return `Você é um especialista em peças automotivas. Analise os resultados de busca abaixo sobre o código "${q}" e extraia informações técnicas SOMENTE com base no que está descrito nas fontes.

NÃO invente informações. Se algo não estiver nas fontes, omita o campo ou deixe null.

RESULTADOS DA BUSCA:
${context}

Com base EXCLUSIVAMENTE nas fontes acima, retorne um JSON:
{
  "encontrado": true ou false,
  "partNumber": "${q}",
  "codigoOEM": null,
  "codigosAlternativos": [],
  "fabricante": "fabricante conforme fontes",
  "descricao": "descrição conforme fontes",
  "categoria": "categoria da peça",
  "especificacoesTecnicas": {},
  "veiculosCompativeis": [
    { "marca": "", "modelo": "", "anoInicio": null, "anoFim": null, "motor": "" }
  ],
  "equivalentes": [
    { "fabricante": "", "codigo": "" }
  ],
  "observacoes": "observações relevantes das fontes",
  "fontes": ["urls das fontes usadas"]
}

Se as fontes não contiverem informação suficiente para confirmar que este é um part number automotivo válido, retorne: {"encontrado": false, "mensagem": "Part number não identificado nas fontes consultadas"}

Responda APENAS com o JSON, sem texto adicional.`;
  }

  private buildTextPrompt(q: string, context: string): string {
    return `Você é um especialista em peças automotivas. Com base nos resultados de busca abaixo sobre "${q}", liste as peças encontradas.

RESULTADOS DA BUSCA:
${context}

Retorne SOMENTE o que estiver nas fontes, sem inventar. JSON:
{
  "resultados": [
    {
      "partNumber": "código se disponível",
      "fabricante": "fabricante",
      "descricao": "descrição",
      "categoria": "categoria",
      "veiculosCompativeis": ["lista resumida"],
      "relevancia": "por que é relevante"
    }
  ],
  "totalEncontrado": número,
  "sugestoes": ["termos para refinar a busca"]
}

Responda APENAS com o JSON.`;
  }

  private parseResponse(text: string, query: string, type: string) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const data = JSON.parse(jsonMatch[0]);

      if (type === 'partnumber') {
        return {
          query,
          type: 'partnumber',
          encontrado: data.encontrado ?? false,
          part: data.encontrado ? data : null,
          mensagem: data.encontrado ? null : (data.mensagem || 'Part number não encontrado nas fontes.'),
        };
      }

      return {
        query,
        type: 'text',
        total: data.totalEncontrado || data.resultados?.length || 0,
        results: data.resultados || [],
        sugestoes: data.sugestoes || [],
      };
    } catch {
      return {
        query,
        type: 'raw',
        encontrado: false,
        rawResponse: text,
        mensagem: 'Erro ao processar resposta.',
      };
    }
  }
}
