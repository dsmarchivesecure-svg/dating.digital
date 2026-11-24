"use client";

import { useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle", message: "" };

/**
 * Formulaire de connexion : l'utilisateur saisit son email et reçoit un lien magique.
 * @returns Le formulaire, ou un message de confirmation une fois le lien envoyé.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initialState);

  if (state.status === "sent") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-muted p-6 text-center">
        <MailCheck className="size-8 text-primary" />
        <p className="font-medium">{state.message}</p>
        <p className="text-sm text-muted-foreground">
          Open the email on this phone and tap the link to sign in.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium">
        Email address
      </label>
      <Input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        disabled={pending}
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
        {pending ? "Sending…" : "Send me a login link"}
      </Button>
    </form>
  );
}
