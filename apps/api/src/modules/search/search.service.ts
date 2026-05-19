import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    this.openai = new OpenAI({ apiKey: this.config.get('OPENAI_API_KEY') });
  }

  async search(q: string, type: string = 'text') {
    const prompt = this.buildPrompt(q, type);

    try {
      const response = await this.openai.responses.create({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search_preview' }],
        input: prompt,
      });

      const text = response.output_text;
      return this.parseResponse(text, q);
    } catch (err) {
      this.logger.error('OpenAI search failed', err);
      throw err;
    }
  }

  private buildPrompt(q: string, type: string): string {
    if (type === 'partnumber') {
      return `Pesquise informações técnicas completas sobre a peça automotiva com part number ou código: "${q}".

Busque em sites especializados como fabricantes (Bosch, Delphi, NGK, Mahle, etc.), distribuidores e catálogos automotivos.

Retorne um JSON com esta estrutura exata:
{
  "encontrado": true ou false,
  "partNumber": "código da peça",
  "codigoOEM": "código OEM se houver",
  "codigosAlternativos": ["outros códigos"],
  "fabricante": "nome do fabricante",
  "descricao": "descrição completa da peça",
  "categoria": "categoria (ex: Motor, Freios, Suspensão)",
  "especificacoesTecnicas": {
    "chave": "valor"
  },
  "veiculosCompativeis": [
    {
      "marca": "ex: Volkswagen",
      "modelo": "ex: Golf",
      "anoInicio": 2015,
      "anoFim": 2020,
      "motor": "ex: 1.4 TSI"
    }
  ],
  "equivalentes": [
    { "fabricante": "nome", "codigo": "código" }
  ],
  "observacoes": "informações adicionais relevantes",
  "fontes": ["urls consultadas"]
}

Responda APENAS com o JSON, sem texto adicional.`;
    }

    return `Pesquise peças automotivas relacionadas a: "${q}".

Busque em catálogos, fabricantes e distribuidores automotivos brasileiros e internacionais.

Retorne um JSON com esta estrutura:
{
  "resultados": [
    {
      "partNumber": "código",
      "fabricante": "nome",
      "descricao": "descrição",
      "categoria": "categoria",
      "veiculosCompativeis": ["lista resumida de veículos"],
      "relevancia": "por que essa peça é relevante para a busca"
    }
  ],
  "totalEncontrado": número,
  "sugestoes": ["termos relacionados para refinar a busca"]
}

Responda APENAS com o JSON, sem texto adicional.`;
  }

  private parseResponse(text: string, query: string) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');

      const data = JSON.parse(jsonMatch[0]);

      if (data.resultados) {
        return {
          query,
          type: 'text',
          total: data.totalEncontrado || data.resultados.length,
          results: data.resultados,
          sugestoes: data.sugestoes || [],
        };
      }

      return {
        query,
        type: 'partnumber',
        encontrado: data.encontrado,
        part: data.encontrado ? data : null,
        mensagem: data.encontrado ? null : 'Peça não encontrada nas fontes consultadas.',
      };
    } catch {
      return {
        query,
        type: 'raw',
        encontrado: false,
        rawResponse: text,
        mensagem: 'Não foi possível estruturar a resposta.',
      };
    }
  }
}
