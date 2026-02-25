import { zodResolver } from "@hookform/resolvers/zod";
import type { Account } from "@maille/core/accounts";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { useAuth } from "@/stores/auth";
import { useContacts } from "@/stores/contacts";
import { useSync } from "@/stores/sync";

import { Badge } from "../ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import { Separator } from "../ui/separator";
import { UserAvatar } from "../users/user-avatar";
import { UserSelect } from "../users/user-select";

const shareAccountSchema = z.object({
  contactId: z.string().min(1, "Contact is required"),
});

type ShareAccountFormValues = z.infer<typeof shareAccountSchema>;

export function ShareAccountDialog({
  account,
  children,
}: {
  account: Account;
  children?: React.ReactNode;
}) {
  const mutate = useSync((state) => state.mutate);
  const contacts = useContacts((state) => state.contacts);
  const user = useAuth((state) => state.user!);
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
          id: account.id,
          userId: data.contactId,
        },
        rollbackData: {
          accountId: account.id,
          contactId: data.contactId,
        },
        events: [
          {
            type: "updateAccount",
            payload: {
              id: account.id,
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

  const getUser = (userId: string) => {
    if (userId === user.id) return user;
    return contacts.find((u) => u.contact.id === userId)?.contact;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Share account</DialogTitle>
          <DialogDescription>
            Sharing an account makes you able to share movements and
            transactions.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex items-end gap-2"
        >
          <Field>
            <FieldLabel htmlFor="contactId">Share</FieldLabel>
            <FieldContent>
              <Controller
                name="contactId"
                control={control}
                render={({ field }) => (
                  <UserSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select a user..."
                  />
                )}
              />
              <FieldError errors={[errors.contactId]} />
            </FieldContent>
          </Field>
          <Button
            type="submit"
            disabled={isSubmitting || contacts.length === 0}
          >
            {isSubmitting ? "Sharing..." : "Share"}
          </Button>
        </form>

        <Separator />

        <div>
          {account.sharing.map((sharing) => {
            const sharingUser = getUser(sharing.sharedWith);
            if (!sharingUser) return null;
            return (
              <Item className="px-0 py-1" key={sharing.sharedWith}>
                <ItemMedia>
                  <UserAvatar user={sharingUser} />
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle>{sharingUser.name}</ItemTitle>
                  <ItemDescription>{sharingUser.email}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  {sharingUser.id === user.id && <Badge>You</Badge>}
                </ItemActions>
              </Item>
            );
          })}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
