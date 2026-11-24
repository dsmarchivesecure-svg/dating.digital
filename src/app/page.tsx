import { MessageCircleHeart, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Page temporaire de l'Étape 1 : sert uniquement à vérifier que
 * Tailwind, la palette, la police Inter, shadcn/ui et les icônes fonctionnent.
 * Elle sera remplacée par la vraie landing page à l'Étape 6.
 */
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          <Sparkles className="size-3.5" /> Setup check — Step 1
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Dating<span className="text-primary">.digital</span>
        </h1>
        <p className="mt-3 text-muted-foreground">Better openers. Better profile. More matches.</p>
      </div>

      <div className="grid w-full gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <MessageCircleHeart className="size-6 text-primary" />
            <CardTitle>Opener generator</CardTitle>
            <CardDescription>3 personalised first messages from any profile.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Sparkles className="size-6 text-primary" />
            <CardTitle>Profile analyzer</CardTitle>
            <CardDescription>A score out of 100, 5 tips and a rewritten bio.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button size="lg">Primary button</Button>
        <Button size="lg" variant="outline">Outline button</Button>
      </div>
    </main>
  );
}
