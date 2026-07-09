import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bot, ExternalLink, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getAssistantAnswer, QUICK_QUESTIONS, type AssistantAnswer } from "./assistantAnswer";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
  answer?: AssistantAnswer;
}

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const WELCOME: ChatMessage = {
  id: "assistant-welcome",
  role: "assistant",
  text: "Hi — I’m the built-in AI System Guide. I can explain how to run this prototype, present the architecture, use scenarios, inspect events/logs, and connect the real FastAPI/SSE backend.",
  answer: {
    category: "Guide",
    answer: "I answer from a local sanitized knowledge base for now. Later, this panel can call a backend assistant endpoint and include logs, run history, docs, and other sources as retrieval context.",
    sources: ["src/features/assistant/assistantAnswer.ts", "README.md", "docs/HLD.md"],
    suggestedQuestions: [...QUICK_QUESTIONS.slice(0, 4)],
  },
};

export function AssistantPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [question, setQuestion] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  const lastAssistantSuggestions = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.role === "assistant" && m.answer?.suggestedQuestions.length);
    return last?.answer?.suggestedQuestions ?? [...QUICK_QUESTIONS.slice(0, 4)];
  }, [messages]);

  function ask(rawQuestion: string) {
    const trimmed = rawQuestion.trim();
    if (!trimmed) return;
    const answer = getAssistantAnswer(trimmed);
    setMessages((current) => [
      ...current,
      { id: newId("user"), role: "user", text: trimmed },
      { id: newId("assistant"), role: "assistant", text: answer.answer, answer },
    ]);
    setQuestion("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    ask(question);
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => onOpenChange(true)}
        className={cn(
          "fixed bottom-5 right-5 z-40 h-12 rounded-full border border-primary/30 bg-primary/90 px-4 shadow-[0_0_32px_rgba(59,130,246,0.35)] hover:bg-primary",
          open && "hidden",
        )}
      >
        <Sparkles className="h-4 w-4" />
        AI Guide
      </Button>

      {open && (
        <Card className="fixed bottom-5 right-5 z-50 flex h-[min(680px,calc(100vh-2.5rem))] w-[min(460px,calc(100vw-2.5rem))] flex-col overflow-hidden border-primary/25 bg-card/95 shadow-2xl backdrop-blur">
          <CardHeader className="border-b pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Bot className="h-4 w-4" />
                  </span>
                  AI System Guide
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Local guide now · ready for logs/docs/RAG integration later
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close AI guide">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div key={message.id} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[92%] rounded-lg border px-3 py-2 text-sm",
                      message.role === "user"
                        ? "border-primary/30 bg-primary/15 text-foreground"
                        : "border-border bg-muted/25 text-muted-foreground",
                    )}
                  >
                    {message.answer && (
                      <Badge variant="outline" className="mb-1.5 text-[10px]">
                        {message.answer.category}
                      </Badge>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    {message.answer?.sources.length ? (
                      <div className="mt-2 border-t pt-2">
                        <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">Sources</p>
                        <div className="flex flex-wrap gap-1">
                          {message.answer.sources.map((source) => (
                            <Badge key={source} variant="secondary" className="gap-1 text-[10px]">
                              <ExternalLink className="h-2.5 w-2.5" /> {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="flex flex-wrap gap-1.5">
                {lastAssistantSuggestions.slice(0, 3).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => ask(suggestion)}
                    className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-left text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={onSubmit} className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      ask(question);
                    }
                  }}
                  placeholder="Ask how to run, present, debug, or connect the system…"
                  className="min-h-11 max-h-28 flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/60"
                />
                <Button type="submit" size="icon" disabled={!question.trim()} aria-label="Ask AI guide">
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
