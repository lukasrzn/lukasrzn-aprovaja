import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Send, Plus, Trash2, Sparkles, User, ChevronDown,
  BookOpen, FlaskConical, FileText, Layers, BarChart3, Lightbulb,
  Zap, MessageSquare, Clock, CheckCircle2, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useListOpenaiConversations,
  useCreateOpenaiConversation,
  useGetOpenaiConversation,
  useDeleteOpenaiConversation,
} from "@workspace/api-client-react";
import type { OpenaiConversation, OpenaiMessage } from "@workspace/api-client-react";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const QUICK_PROMPTS = [
  { icon: <BookOpen className="w-3.5 h-3.5" />, label: "Explique um conceito", prompt: "Explique o conceito de função do 2º grau com exemplos práticos do cotidiano." },
  { icon: <FileText className="w-3.5 h-3.5" />, label: "Criar questão ENEM", prompt: "Crie uma questão no estilo ENEM sobre Revolução Industrial com 5 alternativas e gabarito comentado." },
  { icon: <Layers className="w-3.5 h-3.5" />, label: "Gerar flashcards", prompt: "Crie 5 flashcards de memorização sobre as Leis de Mendel (pergunta e resposta)." },
  { icon: <FlaskConical className="w-3.5 h-3.5" />, label: "Resumo rápido", prompt: "Faça um resumo didático e completo sobre Ligações Químicas para o ENEM 2026." },
  { icon: <BarChart3 className="w-3.5 h-3.5" />, label: "Plano de estudos", prompt: "Monte um plano de estudos de 30 dias para o ENEM 2026 focado em Ciências da Natureza e Matemática." },
  { icon: <Lightbulb className="w-3.5 h-3.5" />, label: "Dica motivacional", prompt: "Me dê uma dica poderosa para manter o foco e a consistência nos estudos até o ENEM." },
];

const WELCOME_MSG = `Olá! Sou o **Professor IA** da AprovaJá — seu mentor pessoal para o ENEM 2026. 🎯

Estou aqui para te ajudar com:
- 📚 **Explicações** de qualquer matéria
- ❓ **Questões** no estilo ENEM para praticar
- 🗂️ **Flashcards** de memorização
- 📋 **Resumos** didáticos e completos
- 📅 **Planos de estudo** personalizados
- ✍️ **Correção** de redações

Use os atalhos abaixo ou me faça qualquer pergunta. Vamos começar!`;

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (idx: number) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${idx}`} className="list-none space-y-1 my-2">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-1 shrink-0">•</span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, i) => {
    if (line.startsWith("- ") || line.startsWith("* ")) {
      listItems.push(line.slice(2));
    } else {
      flushList(i);
      if (line.startsWith("## ")) {
        elements.push(<h2 key={i} className="text-base font-bold text-white mt-3 mb-1">{line.slice(3)}</h2>);
      } else if (line.startsWith("# ")) {
        elements.push(<h1 key={i} className="text-lg font-bold text-white mt-3 mb-1">{line.slice(2)}</h1>);
      } else if (line.startsWith("**") && line.endsWith("**") && line.length > 4) {
        elements.push(<p key={i} className="font-bold text-white text-sm">{line.slice(2, -2)}</p>);
      } else if (line === "") {
        elements.push(<div key={i} className="h-2" />);
      } else {
        elements.push(
          <p key={i} className="text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />
        );
      }
    }
  });
  flushList(lines.length);
  return <>{elements}</>;
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1 rounded text-xs font-mono text-cyan-300">$1</code>');
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}

function MessageBubble({ msg, isStreaming }: { msg: OpenaiMessage | { role: string; content: string; id: number; conversationId: number; createdAt: string }; isStreaming?: boolean }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} group`}
    >
      <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${isUser ? "bg-primary/20 border border-primary/30" : "bg-gradient-to-br from-violet-600 to-cyan-600"}`}>
        {isUser ? <User className="w-4 h-4 text-primary" /> : <Brain className="w-4 h-4 text-white" />}
      </div>

      <div className={`max-w-[80%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary/15 border border-primary/25 text-white rounded-tr-sm"
            : "bg-white/[0.04] border border-white/[0.08] text-muted-foreground rounded-tl-sm"
        }`}>
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
          ) : isStreaming && !msg.content ? (
            <TypingDots />
          ) : (
            <div className="prose-sm">{renderMarkdown(msg.content)}</div>
          )}
        </div>
        <div className={`flex items-center gap-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-[10px] text-muted-foreground/50">
            {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && <CopyButton text={msg.content} />}
        </div>
      </div>
    </motion.div>
  );
}

function ConversationItem({ conv, isActive, onSelect, onDelete }: {
  conv: OpenaiConversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
        isActive ? "bg-primary/15 border border-primary/20" : "hover:bg-white/[0.04] border border-transparent"
      }`}
      onClick={onSelect}
      whileHover={{ x: 2 }}
    >
      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
      <span className={`text-sm flex-1 truncate ${isActive ? "text-white font-medium" : "text-muted-foreground"}`}>
        {conv.title}
      </span>
      <button
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-rose-400 transition-all"
        onClick={e => { e.stopPropagation(); onDelete(); }}
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

export default function ProfessorIA() {
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [localMessages, setLocalMessages] = useState<Array<{ role: string; content: string; id: number; conversationId: number; createdAt: string }>>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: conversations, refetch: refetchConvs } = useListOpenaiConversations();
  const { data: activeConv } = useGetOpenaiConversation(
    activeConvId ?? 0,
    { query: { enabled: !!activeConvId, queryKey: ["openai-conv", activeConvId] } }
  );
  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  useEffect(() => {
    if (activeConv?.messages) {
      setLocalMessages(activeConv.messages.map(m => ({
        ...m,
        createdAt: m.createdAt,
      })));
    }
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages, streamingContent]);

  const startNewConversation = useCallback(async (firstMessage?: string) => {
    const title = firstMessage
      ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "")
      : "Nova conversa";
    const conv = await createConv.mutateAsync({ data: { title } });
    setActiveConvId(conv.id);
    setLocalMessages([]);
    await refetchConvs();
    return conv.id;
  }, [createConv, refetchConvs]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    setInputValue("");
    setIsStreaming(true);
    setStreamingContent("");

    let convId = activeConvId;
    if (!convId) {
      convId = await startNewConversation(content);
    }

    const userMsg = {
      id: Date.now(),
      conversationId: convId,
      role: "user",
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, userMsg]);

    const assistantPlaceholder = {
      id: Date.now() + 1,
      conversationId: convId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    setLocalMessages(prev => [...prev, assistantPlaceholder]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch(`${BASE_URL}/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
        signal: abortRef.current.signal,
      });

      if (!response.ok || !response.body) throw new Error("API error");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.done) break;
            if (data.error) { full = data.error; break; }
            if (data.content) {
              full += data.content;
              setStreamingContent(full);
              setLocalMessages(prev => prev.map((m, i) =>
                i === prev.length - 1 ? { ...m, content: full } : m
              ));
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== "AbortError") {
        setLocalMessages(prev => prev.map((m, i) =>
          i === prev.length - 1 ? { ...m, content: "Desculpe, ocorreu um erro. Tente novamente." } : m
        ));
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      refetchConvs();
    }
  }, [activeConvId, isStreaming, startNewConversation, refetchConvs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const handleDelete = async (convId: number) => {
    await deleteConv.mutateAsync({ id: convId });
    if (activeConvId === convId) {
      setActiveConvId(null);
      setLocalMessages([]);
    }
    refetchConvs();
  };

  const displayMessages = localMessages;

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-background">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="shrink-0 border-r border-white/[0.06] bg-black/20 backdrop-blur-xl flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Professor IA</p>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    Online
                  </p>
                </div>
              </div>
              <Button
                className="w-full h-9 rounded-xl bg-primary/15 border border-primary/20 hover:bg-primary/25 text-primary text-sm gap-2"
                variant="outline"
                onClick={() => { setActiveConvId(null); setLocalMessages([]); }}
              >
                <Plus className="w-3.5 h-3.5" />
                Nova conversa
              </Button>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="space-y-1">
                {conversations && conversations.length > 0 ? (
                  [...conversations].reverse().map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conv={conv}
                      isActive={activeConvId === conv.id}
                      onSelect={() => { setActiveConvId(conv.id); setLocalMessages([]); }}
                      onDelete={() => handleDelete(conv.id)}
                    />
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-8 px-2">
                    Nenhuma conversa ainda.<br />Comece fazendo uma pergunta!
                  </p>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                <Zap className="w-3 h-3 text-primary" />
                <span>Powered by GPT-5 Mini</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-white/[0.06] px-4 flex items-center gap-3 shrink-0 bg-black/10 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 rounded-lg hover:bg-white/10"
            onClick={() => setSidebarOpen(s => !s)}
          >
            <MessageSquare className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {activeConvId && conversations?.find(c => c.id === activeConvId)?.title || "Professor IA"}
            </p>
          </div>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
            GPT-5 Mini
          </Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {displayMessages.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Welcome */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-600 to-cyan-600">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div className="max-w-[80%]">
                    <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-white/[0.04] border border-white/[0.08] text-muted-foreground">
                      <div className="prose-sm">{renderMarkdown(WELCOME_MSG)}</div>
                    </div>
                    <span className="text-[10px] text-muted-foreground/50 mt-1 block">
                      {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Quick prompts */}
                <div className="pl-11">
                  <p className="text-xs text-muted-foreground mb-3 font-medium uppercase tracking-wider">Atalhos rápidos</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {QUICK_PROMPTS.map((p, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.07] hover:border-white/15 transition-all text-left group"
                        onClick={() => sendMessage(p.prompt)}
                      >
                        <span className="text-primary group-hover:scale-110 transition-transform">{p.icon}</span>
                        <span className="text-xs text-muted-foreground group-hover:text-white transition-colors">{p.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {displayMessages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isStreaming={isStreaming && i === displayMessages.length - 1 && msg.role === "assistant"}
              />
            ))}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-white/[0.06] p-4 bg-black/10 backdrop-blur-sm shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Faça uma pergunta ao Professor IA... (Enter para enviar)"
                  className="min-h-[52px] max-h-[160px] resize-none bg-white/[0.04] border-white/[0.1] rounded-2xl pr-12 py-3.5 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-0 transition-all"
                  disabled={isStreaming}
                  rows={1}
                />
                <div className="absolute right-3 bottom-3">
                  {isStreaming ? (
                    <motion.div
                      className="flex items-center gap-1"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => sendMessage(inputValue)}
                      disabled={!inputValue.trim()}
                      className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="w-3.5 h-3.5 text-white" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground/40 text-center mt-2">
              Enter para enviar • Shift+Enter para nova linha • As respostas são geradas por IA e podem conter erros
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
