import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth";

const searchParamsSchema = z.object({
  user_code: z.string().optional(),
});

export const Route = createFileRoute("/device")({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  loader: async ({ location }) => {
    const search = location.search as { user_code?: string };
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/login",
        search: {
          redirect: search.user_code
            ? `/device?user_code=${encodeURIComponent(search.user_code)}`
            : "/device",
        },
      });
    }
    return null;
  },
});

const formSchema = z.object({
  user_code: z
    .string()
    .min(1, "Code is required")
    .transform((v) => v.trim().replace(/-/g, "").toUpperCase()),
});

type Step = "enter-code" | "approve";

function RouteComponent() {
  const { user_code: initialCode } = Route.useSearch();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>(
    initialCode ? "approve" : "enter-code",
  );
  const [userCode, setUserCode] = useState(initialCode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { user_code: initialCode ?? "" },
  });

  const handleVerifyCode = async ({
    user_code,
  }: z.infer<typeof formSchema>) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await authClient.device({
        query: { user_code },
      });
      if (error || !data) {
        setError("Invalid or expired code. Please try again.");
      } else {
        setUserCode(user_code);
        setStep("approve");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await authClient.device.approve({ userCode });
      if (error) {
        setError(error.error_description);
      } else {
        setDone(true);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  const handleDeny = async () => {
    setLoading(true);
    setError(null);
    await authClient.device.deny({ userCode });
    navigate({ to: "/" });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-sidebar">
      <Logo className="size-12 text-muted" />
      <div className="flex w-full max-w-sm flex-col justify-center gap-6 rounded-xl border bg-card p-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground">Authorize CLI</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "enter-code"
              ? "Enter the code displayed in your terminal."
              : "A device is requesting access to your account."}
          </p>
        </div>

        {done ? (
          <div className="text-center text-sm text-muted-foreground">
            Authorization successful. You can close this tab and return to your
            terminal.
          </div>
        ) : step === "enter-code" ? (
          <form
            onSubmit={form.handleSubmit(handleVerifyCode)}
            className="space-y-5"
          >
            <FieldGroup>
              <Controller
                name="user_code"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="user_code">Device code</FieldLabel>
                    <Input
                      {...field}
                      id="user_code"
                      placeholder="ABCD1234"
                      autoComplete="off"
                      autoFocus
                      className="h-9 font-mono tracking-widest"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              size="lg"
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-center font-mono text-lg font-semibold tracking-widest text-foreground">
              {userCode.length === 8
                ? `${userCode.slice(0, 4)}-${userCode.slice(4)}`
                : userCode}
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              className="w-full"
              disabled={loading}
              size="lg"
              onClick={handleApprove}
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                "Approve"
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={loading}
              size="lg"
              onClick={handleDeny}
            >
              Deny
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
