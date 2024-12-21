import { questionSchema, questionsSchema } from "@/lib/schemas";
import { google } from "@ai-sdk/google";
import { streamObject } from "ai";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { files } = await req.json();
  const firstFile = files[0].data;

  const result = streamObject({
    model: google("gemini-2.0-flash-thinking-exp-1219"),
    messages: [
      {
        role: "system",
        content:
          " Você é um professor de alto nível. Recebeu um PDF como contexto (ex.: artigo, prova antiga etc.). 
  Gere uma lista de 10 a 20 questões de múltipla escolha (MCQs) em formato JSON:
  
  - Cada questão deve seguir o formato:
    {
      "question": "...",
      "options": ["opção A...", "opção B...", "opção C...", "opção D..."],
      "answer": "A" // ou "B", "C", "D"
    }

  - As questões devem ser extremamente desafiadoras, exigindo alto nível de conhecimento.
  - Todas as opções devem ter tamanho relativamente similar.
  - Aproveite o tema do PDF o máximo possível, incluindo detalhes avançados.
  - Faça perguntas que exijam análise profunda.  
  - SOMENTE retorne o objeto JSON com as questões no array. 
  - Não inclua texto adicional fora do JSON.

  Segue abaixo o PDF como contexto:",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Create a multiple choice test based on this document.",
          },
          {
            type: "file",
            data: firstFile,
            mimeType: "application/pdf",
          },
        ],
      },
    ],
    schema: questionSchema,
    output: "array",
    onFinish: ({ object }) => {
      const res = questionsSchema.safeParse(object);
      if (res.error) {
        throw new Error(res.error.errors.map((e) => e.message).join("\n"));
      }
    },
  });

  return result.toTextStreamResponse();
}
