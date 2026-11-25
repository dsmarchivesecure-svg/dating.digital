"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, MessageCircleHeart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Kind = "opener" | "analysis";
type OpenerResult = { openers: { tone: string; message: string }[] };
type AnalysisResult = { score: number; tips: string[]; improved_bio: string };

const TOOLS: Record<Kind, { label: string; icon: typeof Sparkles; placeholder: string; button: string }> = {
  opener: {
    label: "Opener generator",
    icon: MessageCircleHeart,
    placeholder: "Paste their profile here: bio, prompts, interests, job…",
    button: "Write 3 openers",
  },
  analysis: {
    label: "Profile analyzer",
    icon: Sparkles,
    placeholder: "Paste your own bio here…",
    button: "Analyze my bio",
  },
};

const TONE_LABELS: Record<string, string> = { funny: "😄 Funny", sincere: "💬 Sincere", original: "✨ Original" };

/**
 * Bouton qui copie un texte dans le presse-papiers et confirme brièvement.
 * @param text - Le texte à copier.
 * @returns Le bouton "Copy".
 */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Presse-papiers indisponible : l'utilisateur peut sélectionner le texte à la main
        }
      }}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

/**
 * Interface des deux outils : choix de l'outil, texte à coller, envoi à /api/generate, affichage du résultat.
 * @param initialCredits - Texte résumant les crédits restants au chargement de la page.
 * @returns L'interface interactive.
 */
export function Generator({ initialCredits }: { initialCredits: string }) {
  const [kind, setKind] = useState<Kind>("opener");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string; detail?: string } | null>(null);
  const [result, setResult] = useState<OpenerResult | AnalysisResult | null>(null);
  const [resultKind, setResultKind] = useState<Kind | null>(null);

  /**
   * Envoie le texte au serveur et affiche le résultat ou l'erreur.
   * @param event - L'envoi du formulaire.
   */
  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, input }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error ?? { code: "server", message: "Something went wrong. Please try again." });
      } else {
        setResult(data.result);
        setResultKind(kind);
      }
    } catch {
      setError({ code: "network", message: "Network error. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  const tool = TOOLS[kind];

  return (
    <div className="flex flex-col gap-6">
      {/* Choix de l'outil */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
        {(Object.keys(TOOLS) as Kind[]).map((k) => {
          const Icon = TOOLS[k].icon;
          return (
            <button
              key={k}
              type="button"
              onClick={() => {
                setKind(k);
                setError(null);
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                kind === k ? "bg-background text-primary shadow-sm" : "text-muted-foreground",
              )}
            >
              <Icon className="size-4" /> {TOOLS[k].label}
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={tool.placeholder}
          maxLength={3000}
          disabled={loading}
          required
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{initialCredits}</span>
          <span>{input.length}/3000</span>
        </div>
        <Button type="submit" size="lg" disabled={loading || input.trim().length < 20}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {loading ? "Thinking…" : tool.button}
        </Button>
      </form>

      {error && (
        <div role="alert" className="flex flex-col gap-2 rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">
          <p>{error.message}</p>
          {error.detail && <p className="font-mono text-xs opacity-70">Code: {error.detail}</p>}
          {error.code === "no_credits" && (
            <Button asChild size="sm" className="self-start">
              <Link href="/">See plans</Link>
            </Button>
          )}
        </div>
      )}

      {/* Résultat : 3 messages */}
      {result && resultKind === "opener" && "openers" in result && (
        <div className="flex flex-col gap-3">
          {result.openers.map((o) => (
            <Card key={o.tone}>
              <CardHeader>
                <CardTitle className="text-sm text-primary">{TONE_LABELS[o.tone] ?? o.tone}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="whitespace-pre-wrap">{o.message}</p>
                <CopyButton text={o.message} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Résultat : analyse */}
      {result && resultKind === "analysis" && "score" in result && (
        <div className="flex flex-col gap-3">
          <Card>
            <CardHeader>
              <CardTitle>
                Score: <span className="text-primary">{result.score}</span>/100
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${result.score}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">5 ways to improve</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5">
                {result.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your improved bio</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="whitespace-pre-wrap">{result.improved_bio}</p>
              <CopyButton text={result.improved_bio} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
