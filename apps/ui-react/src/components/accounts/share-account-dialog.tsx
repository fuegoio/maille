import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { shareAccountMutation } from "@/mutations/accounts";
import { useContacts } from "@/stores/contacts";
import { useSync } from "@/stores/sync";

import { UserSelect } from "../users/user-select";

const shareAccountSchema = z.object({
  contactId: z.string().min(1, "Contact is required"),
});

type ShareAccountFormValues = z.infer<typeof shareAccountSchema>;

export function ShareAccountDialog({
  accountId,
  children,
}: {
  accountId: string;
  children?: React.ReactNode;
}) {
  const mutate = useSync((state) => state.mutate);
  const contacts = useContacts((state) => state.contacts);
  const [open, setOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShareAccountFormValues>({
    resolver: zodResolver(shareAccountSchema),
    defaultValues: {
      contactId: "",
    },
  });

  const onSubmit = async (data: ShareAccountFormValues) => {
    try {
      mutate({
        name: "shareAccount",
        mutation: shareAccountMutation,
        variables: {
          id: accountId,
          userId: data.contactId,
        },
        rollbackData: {
          accountId: accountId,
          contactId: data.contactId,
        },
        events: [
          {
            type: "updateAccount",
            payload: {
              id: accountId,
              sharing: [
                {
                  id: crypto.randomUUID(),
                  role: "primary",
                  sharedWith: data.contactId,
                },
              ],
            },
          },
        ],
      });

      // Reset form and close dialog on success
      reset();
      setOpen(false);
    } catch (error) {
      console.error("Failed to share account:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Share Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>Contact</FieldLabel>
            <FieldContent>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <UserSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select a user to share this account with"
                  />
                )}
              />
              <FieldError errors={[errors.contactId]} />
            </FieldContent>
          </Field>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={isSubmitting || contacts.length === 0}
            >
              {isSubmitting ? "Sharing..." : "Share account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
