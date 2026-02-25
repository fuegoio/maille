import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Users } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import z from "zod";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { graphql } from "@/gql";
import { graphqlClient } from "@/gql/client";
import { useAuth } from "@/stores/auth";
import { useContacts } from "@/stores/contacts";

import { Button } from "../ui/button";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Field, FieldError } from "../ui/field";
import { Input } from "../ui/input";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";
import { UserAvatar } from "../users/user-avatar";

const formSchema = z.object({
  email: z.email("Email is required.").min(1, "Email is required."),
});

const createContactMutation = graphql(/* GraphQL */ `
  mutation CreateContact(
    $id: String!
    $contact: String!
  ) {
    createContact(
      id: $id
      contact: $contact
    ) {
      id
      createdAt
      contact {
        id
        email
        name
        image
      }
    }
  }
`);

export function Contacts() {
  const currentUser = useAuth((state) => state.user);
  if (!currentUser) throw new Error("no main user");

  const contacts = useContacts((state) => state.contacts);
  const addContact = useContacts((state) => state.addContact);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const inviteUser = async ({ email }: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      const response = await graphqlClient.request(createContactMutation, {
        id: crypto.randomUUID(),
        contact: email,
      });
      addContact({
        ...response.createContact,
        createdAt: new Date(response.createContact.createdAt),
      });
    } catch {
      // User not found or other error
      form.setError("email", {
        message: "User not found.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem
          className="gap-2 px-3"
          onSelect={(e) => e.preventDefault()}
        >
          <Users />
          Contacts
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contacts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="px-1 font-medium">Invite user</div>
          <div className="px-1 text-muted-foreground">
            Enter the email of the user you want to invite.
          </div>
          <form
            onSubmit={form.handleSubmit(inviteUser)}
            className="mt-4 flex items-start gap-2"
          >
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <Input id="email" placeholder="Email" required {...field} />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading && <Spinner />}
              Invite
              <Send />
            </Button>
          </form>
          <Separator className="my-4" />
          <div className="px-1 font-medium">Contacts ({contacts?.length})</div>
          <div>
            {contacts?.map((contact) => (
              <Item className="px-0" key={contact.id}>
                <ItemMedia>
                  <UserAvatar user={contact.contact} />
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle>{contact.contact.name}</ItemTitle>
                  <ItemDescription>{contact.contact.email}</ItemDescription>
                </ItemContent>
              </Item>
            ))}

            {contacts.length === 0 && (
              <div className="px-1 py-2 text-sm text-muted-foreground">
                No contact yet.
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Done</Button>
            </DialogClose>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
