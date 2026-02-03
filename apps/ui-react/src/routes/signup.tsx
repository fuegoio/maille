import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";
import z from "zod";

import { authClient } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Logo } from "@/components/logo";

const searchParamsSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/signup")({
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
  firstName: z
    .string("First name is required.")
    .min(1, "First name is required."),
  lastName: z.string("Last name is required.").min(1, "Last name is required."),
  email: z.string("Email is required.").min(1, "Email is required."),
  password: z.string("Password is required.").min(1, "Password is required."),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions.",
  }),
});

function RouteComponent() {
  const { redirect } = Route.useSearch();
  const [needsVerify, setNeedsVerify] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      terms: false,
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async ({
    email,
    password,
    firstName,
    lastName,
  }: z.infer<typeof formSchema>) => {
    setLoading(true);
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: `${firstName} ${lastName}`,
      callbackURL: redirect || "/",
    });

    if (error) {
      form.setError("password", {
        message: error.message,
      });
    } else {
      setNeedsVerify(true);
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
    <div className="h-full w-full flex items-center justify-center flex-col gap-4 bg-muted">
      <Logo className="text-muted size-12" />
      <div className="p-6 flex flex-col justify-center gap-6 max-w-sm w-full bg-card rounded-xl border">
        <div className="text-center">
          <h1 className="text-xl font-medium text-foreground">
            Create an account
          </h1>
          <div className="text-sm text-muted-foreground mt-2">
            Welcome! Create an account to get started.
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!needsVerify && (
            <motion.div
              key="signup-form"
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              <FieldGroup>
                <Controller
                  name="firstName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="firstName">First name</FieldLabel>
                      <Input
                        {...field}
                        id="firstName"
                        aria-invalid={fieldState.invalid}
                        className="h-9"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="lastName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="lastName">Last name</FieldLabel>
                      <Input
                        {...field}
                        id="lastName"
                        aria-invalid={fieldState.invalid}
                        className="h-9"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

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
                        autoComplete="new-password"
                        className="h-9"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="terms"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="terms"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-invalid={fieldState.invalid}
                        />
                        <Label htmlFor="terms" className="text-sm">
                          I agree to the Terms and Conditions
                        </Label>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
                size="lg"
                onClick={form.handleSubmit(onSubmit)}
              >
                {loading ? (
                  <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  "Create account"
                )}
              </Button>

              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
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
                Sign up with Google
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Already have an account?
                <Link
                  to="/login"
                  className="underline underline-offset-4 ml-1"
                  search={{ redirect }}
                >
                  Login
                </Link>
              </div>
            </motion.div>
          )}

          {needsVerify && (
            <motion.div
              key="verify-email"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="text-foreground text-sm text-center">
                We sent you an email with a link to verify your email address.
                Please check your inbox and click the link to verify your email.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
