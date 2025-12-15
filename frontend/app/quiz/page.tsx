"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check, RotateCcw, HelpCircle } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Container } from "@/components/layout/Container";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useQuiz } from "@/modules/quiz";

export default function QuizPage() {
  const {
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
  } = useQuiz();

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Skeleton className="w-full h-[60vh]" />
        </div>
        <Container className="py-16">
          <Skeleton className="h-64 max-w-2xl mx-auto" />
        </Container>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper>
        <HeroBanner
          title="Hero Quiz"
          subtitle="Which Hero Are You?"
          description="Find out which MCU hero matches your personality"
          theme={{ colorPrimary: "#2ecc71" }}
        />
        <Container className="py-16">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Quiz Unavailable</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => fetchQuiz()}>Try Again</Button>
          </Card>
        </Container>
      </PageWrapper>
    );
  }

  if (!quiz) {
    return (
      <PageWrapper>
        <HeroBanner
          title="Hero Quiz"
          subtitle="Which Hero Are You?"
          description="Find out which MCU hero matches your personality"
          theme={{ colorPrimary: "#2ecc71" }}
        />
        <Container className="py-16">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <HelpCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Quiz Available</h2>
            <p className="text-muted-foreground">Check back later for a new quiz!</p>
          </Card>
        </Container>
      </PageWrapper>
    );
  }

  // Show result
  if (result) {
    return (
      <PageWrapper>
        <HeroBanner
          title="Your Result"
          subtitle="Quiz Complete!"
          theme={{ colorPrimary: "#2ecc71" }}
        />
        <Container className="py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto"
          >
            <Card className="p-8 text-center">
              {result.hero ? (
                <>
                  <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-green-500">
                    {result.hero.image ? (
                      <Image
                        src={result.hero.image}
                        alt={result.hero.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-4xl font-bold text-muted-foreground">
                          {result.hero.name[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold mb-2">
                    You are {result.hero.alias || result.hero.name}!
                  </h2>
                  {result.description && (
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      {result.description}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href={`/characters/${result.hero._id}`}>
                      <Button>View Character Profile</Button>
                    </Link>
                    <Button variant="outline" onClick={resetQuiz}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Take Quiz Again
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4">Quiz Complete!</h2>
                  <p className="text-muted-foreground mb-6">
                    Thanks for taking the quiz!
                  </p>
                  <Button variant="outline" onClick={resetQuiz}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Take Quiz Again
                  </Button>
                </>
              )}
            </Card>
          </motion.div>
        </Container>
      </PageWrapper>
    );
  }

  const currentQ = quiz.questions[currentQuestion];
  const currentAnswer = answers[currentQ.id];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <PageWrapper>
      <HeroBanner
        title={quiz.title}
        subtitle="Hero Quiz"
        description={quiz.description}
        theme={{ colorPrimary: "#2ecc71" }}
      />

      <Container className="py-16">
        <div className="max-w-2xl mx-auto">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question Card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8">
                {currentQ.image && (
                  <div className="relative aspect-video mb-6 rounded-lg overflow-hidden">
                    <Image
                      src={currentQ.image}
                      alt="Question image"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <h2 className="text-xl font-semibold mb-6">{currentQ.prompt}</h2>

                <div className="space-y-3">
                  {currentQ.options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => answerQuestion(currentQ.id, option.value)}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        currentAnswer === option.value
                          ? "border-green-500 bg-green-500/10"
                          : "border-border hover:border-green-500/50 hover:bg-accent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            currentAnswer === option.value
                              ? "border-green-500 bg-green-500"
                              : "border-muted-foreground"
                          }`}
                        >
                          {currentAnswer === option.value && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span>{option.text}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentQuestion === quiz.questions.length - 1 ? (
              <Button
                onClick={submitQuiz}
                disabled={!isComplete || isSubmitting}
                isLoading={isSubmitting}
              >
                Submit Quiz
              </Button>
            ) : (
              <Button
                onClick={nextQuestion}
                disabled={!currentAnswer}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}
