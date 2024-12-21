import { z } from "zod";

/**
 * Mantemos o questionSchema, mas agora max. 20 no questionsSchema
 */
export const questionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .length(4)
    .describe("Quatro respostas possíveis, de tamanho equilibrado."),
  answer: z
    .enum(["A", "B", "C", "D"])
    .describe("Resposta correta (A=1ª opção, B=2ª, etc)."),
});

export type Question = z.infer<typeof questionSchema>;

/**
 * Antes era .length(4). Agora:
 * Permite no mínimo 4 e no máximo 20.
 */
export const questionsSchema = z
  .array(questionSchema)
  .min(4)
  .max(20);
