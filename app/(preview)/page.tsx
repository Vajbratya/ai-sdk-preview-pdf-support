Please implement [task]. If you change a file, write out the file in full so I can paste it into prod. Do not remove existing logic or comments — eles estão lá para nossa equipe.

================================================================================
/app/(preview)/page.tsx
================================================================================

"use client";

import { useState } from "react";
import { experimental_useObject } from "ai/react";
import { questionsSchema } from "@/lib/schemas";
import { z } from "zod";
import { toast } from "sonner";
import { FileUp, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Quiz from "@/components/quiz";
import { Link } from "@/components/ui/link";
import NextLink from "next/link";
import { generateQuizTitle } from "./actions";
import { AnimatePresence, motion } from "framer-motion";
import { GitIcon } from "@/components/icons";

export default function ChatWithFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<z.infer<typeof questionsSchema>>(
    [],
  );
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState<string>();

  const {
    submit,
    object: partialQuestions,
    isLoading,
  } = experimental_useObject({
    api: "/api/generate-quiz",
    schema: questionsSchema,
    initialValue: undefined,
    onError: (error) => {
      toast.error("Falha ao gerar quiz. Por favor, tente novamente.");
      setFiles([]);
    },
    onFinish: ({ object }) => {
      setQuestions(object ?? []);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari && isDragging) {
      toast.error(
        "O Safari não suporta arrastar & soltar. Use o seletor de arquivo, por favor.",
      );
      return;
    }

    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(
      (file) => file.type === "application/pdf" && file.size <= 5 * 1024 * 1024,
    );
    console.log(validFiles);

    if (validFiles.length !== selectedFiles.length) {
      toast.error("Somente PDFs com até 5MB são permitidos.");
    }

    setFiles(validFiles);
  };

  const encodeFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleSubmitWithFiles = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await encodeFileAsBase64(file),
      })),
    );
    submit({ files: encodedFiles });
    const generatedTitle = await generateQuizTitle(encodedFiles[0].name);
    setTitle(generatedTitle);
  };

  const clearPDF = () => {
    setFiles([]);
    setQuestions([]);
  };

  const progress = partialQuestions ? (partialQuestions.length / 4) * 100 : 0;

  if (questions.length === 4) {
    return (
      <Quiz title={title ?? "Quiz"} questions={questions} clearPDF={clearPDF} />
    );
  }

  return (
    <div
      className="min-h-screen w-full flex justify-center bg-gradient-to-b from-zinc-100 to-white dark:from-zinc-900 dark:to-zinc-800"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragExit={() => setIsDragging(false)}
      onDragEnd={() => setIsDragging(false)}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        console.log(e.dataTransfer.files);
        handleFileChange({
          target: { files: e.dataTransfer.files },
        } as React.ChangeEvent<HTMLInputElement>);
      }}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            className="fixed pointer-events-none dark:bg-zinc-900/60 bg-zinc-200/60 h-screen w-screen z-10 flex flex-col items-center justify-center gap-2 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-lg font-semibold text-foreground dark:text-zinc-100">
              Arraste e solte os arquivos aqui
            </div>
            <div className="text-sm dark:text-zinc-300 text-zinc-600">
              {"(Apenas PDFs)"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Card className="w-full max-w-md sm:border dark:border-zinc-800 rounded-lg shadow-2xl mt-12 mb-12">
        <CardHeader className="text-center space-y-6 p-6">
          <div className="mx-auto flex items-center justify-center space-x-2 text-muted-foreground">
            <div className="rounded-full bg-primary/10 p-2">
              <FileUp className="h-6 w-6" />
            </div>
            <Plus className="h-4 w-4" />
            <div className="rounded-full bg-primary/10 p-2">
              <Loader2 className="h-6 w-6" />
            </div>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold">Gerador de Quiz em PDF</CardTitle>
            <CardDescription className="text-base">
              Envie um PDF para gerar um quiz interativo usando lógica Gemini 1.5 Pro.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmitWithFiles} className="space-y-4">
            <div
              className="relative flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 
              rounded-lg p-6 transition-colors hover:border-muted-foreground/50"
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <FileUp className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                {files.length > 0 ? (
                  <span className="font-medium text-foreground">
                    {files[0].name}
                  </span>
                ) : (
                  <span>Solte seu PDF aqui ou clique para selecionar.</span>
                )}
              </p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={files.length === 0}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Gerando Quiz...</span>
                </span>
              ) : (
                "Gerar Quiz"
              )}
            </Button>
          </form>
        </CardContent>
        {isLoading && (
          <CardFooter className="flex flex-col space-y-4 p-6 pt-0">
            <div className="w-full space-y-1">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            <div className="w-full space-y-2">
              <div className="grid grid-cols-6 sm:grid-cols-4 items-center space-x-2 text-sm">
                <div
                  className={`h-2 w-2 rounded-full ${
                    isLoading ? "bg-yellow-500/50 animate-pulse" : "bg-muted"
                  }`}
                />
                <span className="text-muted-foreground text-center col-span-4 sm:col-span-2">
                  {partialQuestions
                    ? `Gerando pergunta nº ${partialQuestions.length + 1} de 4`
                    : "Analisando conteúdo do PDF"}
                </span>
              </div>
            </div>
          </CardFooter>
        )}
      </Card>
      <motion.div
        className="flex flex-col gap-3 items-center justify-between fixed bottom-6 text-xs 
        px-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <NextLink
          target="_blank"
          href="https://github.com/vercel-labs/ai-sdk-preview-pdf-support"
          className="flex flex-row gap-2 items-center border px-2 py-1.5 rounded-md 
          hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800 transition-colors"
        >
          <GitIcon />
          Ver Código Fonte
        </NextLink>

        <a
          href="https://laudos.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-row gap-2 items-center bg-zinc-900 px-2 py-1.5 
          rounded-md text-zinc-50 hover:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 
          dark:hover:bg-zinc-50 transition-colors"
        >
          Oferecido por Laudos.AI
        </a>
      </motion.div>
    </div>
  );
}
