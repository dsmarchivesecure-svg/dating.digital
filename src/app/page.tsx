import Link from "next/link";
import { ClipboardPaste, MessageCircleHeart, Send, Sparkles, Wand2 } from "lucide-react";

import { CheckoutBanner } from "@/components/checkout-banner";
import { PricingCards } from "@/components/pricing-cards";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/viewer";

// Page liée à l'utilisateur connecté (en-tête, boutons) : générée à chaque visite
export const instant = false;

/** Exemple réel de résultat (profil fictif), affiché pour montrer le produit. */
const EXAMPLE = {
  profile:
    "Emma, 29. Architect in Lyon. Weekend hiker, terrible at karaoke but I still sing Abba. Looking for someone who can recommend a good book and doesn't mind my cat judging them.",
  openers: [
    {
      tone: "😄 Funny",
      message:
        "Terrible at karaoke but committed to Abba is exactly the confidence I respect. Does your cat judge the singing too, or only the guests who can't recommend a good book?",
    },
    {
      tone: "💬 Sincere",
      message:
        "Hi Emma, a weekend hiker who designs buildings during the week sounds like a great balance. What's your favorite trail around Lyon?",
    },
  ],
};

const STEPS = [
  { icon: ClipboardPaste, title: "Paste", text: "Copy their profile — or your own bio — from any dating app." },
  { icon: Wand2, title: "Generate", text: "Our AI reads the details and writes in seconds." },
  { icon: Send, title: "Send", text: "Pick your favourite, tweak it if you like, and copy it into the app." },
];

const FAQ = [
  {
    q: "Which dating apps does it work with?",
    a: "All of them — Tinder, Bumble, Hinge and others. You simply paste text, so it works with any app.",
  },
  {
    q: "Is it really free to try?",
    a: "Yes. Every account gets one free opener generation and one free profile analysis. No credit card needed.",
  },
  {
    q: "Does the AI talk to my matches for me?",
    a: "No. It suggests messages and improvements; you stay in control of what you send.",
  },
  {
    q: "Which languages are supported?",
    a: "The AI answers in the language of the profile you paste — English, French, Spanish and more.",
  },
];

/**
 * Page d'accueil publique (landing page).
 * @param searchParams - Paramètres d'URL (?checkout=… après un paiement).
 * @returns La landing page.
 */
export default async function Home({ searchParams }: PageProps<"/">) {
  const { checkout, reason } = await searchParams;
  const { user, premium } = await getViewer();
  const signedIn = Boolean(user);

  return (
    <>
      <SiteHeader signedIn={signedIn} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-24 px-5 pb-20 pt-8">
        <CheckoutBanner status={checkout} reason={reason} />

        {/* Accroche */}
        <section className="flex flex-col items-center gap-6 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <Sparkles className="size-3.5" /> AI dating assistant
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Never send a boring <span className="text-primary">first message</span> again.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            Paste a dating profile and get 3 personalised openers in seconds. Paste your own bio and get an honest
            score — plus a better version.
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg">
              <Link href="/app">{signedIn ? "Open the app" : "Try it free"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">2 free generations · No credit card · Works with any app</p>
        </section>

        {/* Exemple */}
        <section className="grid gap-4 rounded-3xl bg-muted p-5 sm:p-8 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Example · their profile</p>
            <p className="rounded-2xl bg-background p-5 text-sm leading-relaxed">{EXAMPLE.profile}</p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Your openers</p>
            {EXAMPLE.openers.map((o) => (
              <div key={o.tone} className="rounded-2xl bg-background p-5">
                <p className="mb-1.5 text-sm font-semibold text-primary">{o.tone}</p>
                <p className="text-sm leading-relaxed">{o.message}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Les deux outils */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-3 rounded-2xl border border-border p-6">
            <MessageCircleHeart className="size-7 text-primary" />
            <h2 className="text-xl font-semibold">Opener generator</h2>
            <p className="text-muted-foreground">
              Three first messages in three tones — funny, sincere and original — each built on real details from
              their profile, and each ending with an easy way to reply.
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border p-6">
            <Sparkles className="size-7 text-primary" />
            <h2 className="text-xl font-semibold">Profile analyzer</h2>
            <p className="text-muted-foreground">
              A score out of 100, five concrete tips ranked by impact, and a rewritten bio that keeps your voice and
              your real story.
            </p>
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="flex flex-col gap-8">
          <h2 className="text-center text-3xl font-bold tracking-tight">How it works</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-2 rounded-2xl bg-muted p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-background text-primary">
                  <step.icon className="size-5" />
                </span>
                <p className="font-semibold">
                  {i + 1}. {step.title}
                </p>
                <p className="text-sm text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Prix */}
        <section className="flex flex-col items-center gap-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Simple pricing</h2>
            <p className="mt-2 text-muted-foreground">Start free. Pay only if it helps.</p>
          </div>
          <PricingCards signedIn={signedIn} premium={premium} />
        </section>

        {/* Questions fréquentes */}
        <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <h2 className="text-center text-3xl font-bold tracking-tight">Questions</h2>
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border">
            {FAQ.map((item) => (
              <details key={item.q} className="group p-5">
                <summary className="cursor-pointer list-none font-medium">
                  <span className="flex items-center justify-between gap-4">
                    {item.q}
                    <span className="text-primary transition group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Appel final */}
        <section className="flex flex-col items-center gap-5 rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold tracking-tight">Your next match deserves a better “hey”.</h2>
          <Button asChild size="lg" variant="secondary">
            <Link href="/app">{signedIn ? "Open the app" : "Try it free"}</Link>
          </Button>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
