"use client";

import { useState, useCallback } from "react";
import { quizService } from "../services/quiz.service";
import type { QuizForPlay, QuizResult, QuizAnswers } from "@/types";

export function useQuiz(id?: string) {
  const [quiz, setQuiz] = useState<QuizForPlay | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = id
        ? await quizService.getForPlay(id)
        : await quizService.getActive();
      setQuiz(response.data);
      setCurrentQuestion(0);
      setAnswers({});
      setResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch quiz");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const answerQuestion = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const nextQuestion = useCallback(() => {
    if (quiz && currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  }, [quiz, currentQuestion]);

  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  }, [currentQuestion]);

  const submitQuiz = useCallback(async () => {
    if (!quiz) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await quizService.submit(quiz._id, answers);
      setResult(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, answers]);

  const resetQuiz = useCallback(() => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
  }, []);

  const isComplete = quiz ? Object.keys(answers).length === quiz.questions.length : false;

  return {
    quiz,
    result,
    currentQuestion,
    answers,
    isLoading,
    isSubmitting,
    error,
    isComplete,
    fetchQuiz,
    answerQuestion,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    resetQuiz,
  };
}
