import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { httpsCallable } from "@/lib/callable";
import { functions } from "@/components/client";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const GREETING: ChatMessage = {
  role: "assistant",
  content: "Hi! I'm the Endorse assistant. Ask me anything about signing documents, sending for signature, pricing or our file tools.",
};

const SUGGESTIONS = ["How do I send a document for signature?", "What does Pro include?", "Can people sign on WhatsApp?"];

/** Keeps only the turns the server needs: the greeting is local, and the history is capped. */
const historyForServer = (messages: ChatMessage[]) => messages.filter((m) => m !== GREETING).slice(-20);

export const ChatWidget = ({ raised = false }: { raised?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = async (text: string) => {
    const content = text.trim().slice(0, 2000);
    if (!content || sending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const chat = httpsCallable<{ messages: ChatMessage[] }, { reply: string }>(functions, "chatAssistant");
      const { data } = await chat({ messages: historyForServer(next) });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            code === "functions/resource-exhausted"
              ? "You've reached today's chat limit. Email support@e-ndorse.online and a person will help."
              : "Sorry, I couldn't answer just now. Please try again, or email support@e-ndorse.online.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`fixed right-4 md:right-6 z-50 flex flex-col items-end gap-3 transition-[bottom] duration-300 ${raised ? "bottom-[84px] md:bottom-[88px]" : "bottom-4 md:bottom-6"}`}>
      {open && (
        <div
          id="chat-panel"
          role="dialog"
          aria-label="Endorse assistant"
          className="flex h-[min(560px,calc(100vh-8rem))] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl sm:w-96"
        >
          <div className="flex items-center justify-between bg-[#0A66C2] px-4 py-3 text-white">
            <div>
              <p className="font-bold">Endorse assistant</p>
              <p className="text-xs text-white/80">Usually answers in a few seconds</p>
            </div>
            <button onClick={() => setOpen(false)} className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15" aria-label="Close chat">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user" ? "rounded-br-sm bg-[#0A66C2] text-white" : "rounded-bl-sm bg-secondary text-foreground"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Typing…
                </div>
              </div>
            )}
            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-2 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-3 py-1.5 text-left text-xs font-medium text-foreground hover:border-[#0A66C2] hover:text-[#0A66C2]">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-border p-3"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                rows={1}
                maxLength={2000}
                placeholder="Type your question…"
                aria-label="Message"
                className="max-h-28 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-[#0A66C2]"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0A66C2] text-white hover:bg-[#08519c] disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              AI answers can be wrong. Need a person?{" "}
              <a href="mailto:support@e-ndorse.online" className="underline">Email us</a> or see the{" "}
              <Link to="/help-center" className="underline">Help Center</Link>.
            </p>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Close chat" : "Chat with us"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#08519c]"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};
