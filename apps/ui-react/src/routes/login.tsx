import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
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
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: searchParamsSchema,
  loader: async () => {
    const res = await authClient.getSession();
    if (res.data) {
      throw redirect({
        to: "/",
      });
    }
    return null;
  },
});

const formSchema = z.object({
  email: z.string("Email is required.").min(1, "Email is required."),
  password: z.string("Password is required.").min(1, "Password is required."),
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { redirect } = Route.useSearch();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async ({ email, password }: z.infer<typeof formSchema>) => {
    setLoading(true);
    const { error } = await authClient.signIn.email({
      email,
      password,
      callbackURL: redirect || "/",
    });

    if (error) {
      form.setError("password", {
        message: error.message,
      });
    } else {
      navigate({ to: redirect || "/" });
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL: redirect || "/",
    });
    setLoading(false);
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-sidebar">
      <Logo className="size-12 text-muted" />
      <div className="flex w-full max-w-sm flex-col justify-center gap-6 rounded-xl border bg-card p-6">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground">Welcome back</h1>
          <div className="mt-2 text-sm text-muted-foreground">
            Please enter your details to sign in.
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FieldGroup>
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    {...field}
                    id="email"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
                    className="h-9"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    {...field}
                    id="password"
                    type="password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="current-password"
                    className="h-9"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={loading} size="lg">
            {loading ? (
              <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              "Login"
            )}
          </Button>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
            <span className="relative z-10 bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>

          <Button
            variant="outline"
            type="button"
            className="w-full"
            disabled={loading}
            onClick={handleGoogleLogin}
            size="lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            Login with Google
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="underline underline-offset-4"
              search={{ redirect }}
            >
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
