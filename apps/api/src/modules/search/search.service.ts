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
    const systemPrompt = `Você é um especialista em peças automotivas com amplo conhecimento de catálogos técnicos mundiais e brasileiros.
Quando perguntado sobre uma peça, forneça informações técnicas precisas baseadas no seu conhecimento.
Responda SEMPRE com JSON válido, sem markdown, sem texto adicional fora do JSON.`;

    const userPrompt = type === 'partnumber'
      ? this.buildPartNumberPrompt(q)
      : this.buildTextPrompt(q);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const text = completion.choices[0].message.content || '{}';
      this.logger.debug(`OpenAI response: ${text.substring(0, 200)}`);

      return this.parseResponse(text, q, type);
    } catch (err: any) {
      this.logger.error('OpenAI search failed', err?.message);
      throw new Error('Falha ao consultar IA: ' + err?.message);
    }
  }

  private buildPartNumberPrompt(q: string): string {
    return `Busque informações técnicas sobre a peça automotiva com código: "${q}"

Retorne um JSON com esta estrutura:
{
  "encontrado": true,
  "partNumber": "${q}",
  "codigoOEM": "código OEM se houver",
  "codigosAlternativos": ["outros códigos conhecidos"],
  "fabricante": "nome do fabricante",
  "descricao": "descrição completa da peça",
  "categoria": "categoria (ex: Motor, Freios, Suspensão, Elétrica)",
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
    { "fabricante": "nome", "codigo": "código equivalente" }
  ],
  "observacoes": "informações adicionais relevantes para mecânicos",
  "fontes": ["bases de dados ou catálogos de referência"]
}

Se não reconhecer o código, retorne: { "encontrado": false, "mensagem": "Código não encontrado nas bases conhecidas" }`;
  }

  private buildTextPrompt(q: string): string {
    return `Liste peças automotivas relacionadas à busca: "${q}"

Retorne um JSON com esta estrutura:
{
  "resultados": [
    {
      "partNumber": "código da peça",
      "fabricante": "nome do fabricante",
      "descricao": "descrição completa",
      "categoria": "categoria",
      "veiculosCompativeis": ["VW Golf 1.4 TSI 2015-2020", "..."],
      "relevancia": "por que essa peça atende à busca"
    }
  ],
  "totalEncontrado": 3,
  "sugestoes": ["termos relacionados para refinar a busca"]
}

Retorne até 5 peças mais relevantes.`;
  }

  private parseResponse(text: string, query: string, type: string) {
    try {
      const data = JSON.parse(text);

      if (type === 'partnumber') {
        return {
          query,
          type: 'partnumber',
          encontrado: data.encontrado ?? false,
          part: data.encontrado ? data : null,
          mensagem: data.encontrado ? null : (data.mensagem || 'Peça não encontrada.'),
        };
      }

      return {
        query,
        type: 'text',
        total: data.totalEncontrado || data.resultados?.length || 0,
        results: data.resultados || [],
        sugestoes: data.sugestoes || [],
      };
    } catch (err) {
      this.logger.error('Failed to parse OpenAI response', text);
      return {
        query,
        type: 'raw',
        encontrado: false,
        rawResponse: text,
        mensagem: 'Erro ao processar resposta da IA.',
      };
    }
  }
}
