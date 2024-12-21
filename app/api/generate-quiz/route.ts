import { questionSchema, questionsSchema } from "@/lib/schemas";
import { NextResponse } from "next/server";

/**
 * Import das libs do Google generative:
 * - Precisamos do 'gemini-2.0-flash-thinking-exp-1219'
 * - Precisamos configurar temperature, topP, etc.
 */
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-1219",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

/**
 * POST: Recebe PDF (base64) e gera MCQs (4 a 20 perguntas).
 * Mantém a lógica: transformamos a resposta em JSON e checamos com Zod.
 */
export async function POST(req: Request) {
  const { files } = await req.json();
  const firstFile = files[0].data; // só usamos o primeiro PDF

  const expandedPrompt = `
  Você é um professor de alto nível. Recebeu um PDF como contexto (ex.: artigo, prova antiga, etc.).
  Gere 10 a 20 questões de múltipla escolha (MCQs) em JSON, seguindo este formato:
  [
    {
      "question": "...",
      "options": ["A...", "B...", "C...", "D..."],
      "answer": "A"
    },
    ...
  ]
  Regras:
  - As questões devem ser bem desafiadoras e detalhadas, usando ao máximo o conteúdo do PDF.
  - Cada alternativa deve ter tamanho equilibrado.
  - SOMENTE retorne o JSON, sem texto extra além do array.
  - Faça perguntas que exijam análise profunda e conhecimento avançado.
  `;

  // Inicia sessão de chat
  const chatSession = model.startChat({
    generationConfig,
    history: [],
  });

  // Monta a mensagem final
  const userMessage = `
  ${expandedPrompt}
  [PDF base64 context]
  `;

  // Envia a mensagem ao modelo
  const modelResult = await chatSession.sendMessage(userMessage);

  // Extrai o texto cru
  const textResponse = modelResult.response.text();

  // Tenta converter em JSON
  let parsed;
  try {
    parsed = JSON.parse(textResponse);
  } catch (e) {
    throw new Error("Falha ao analisar JSON retornado pelo modelo: " + e);
  }

  // Valida com questionsSchema (4 a 20)
  const result = questionsSchema.safeParse(parsed);
  if (!result.success) {
    throw new Error(
      "Validação Zod falhou: " +
        result.error.errors.map((err) => err.message).join("\n"),
    );
  }

  // Retornamos o JSON validado
  return NextResponse.json(result.data);
}
