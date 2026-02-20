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
import { useWorkspaces } from "@/stores/workspaces";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import { Field, FieldError } from "../ui/field";
import { Input } from "../ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import { Separator } from "../ui/separator";
import { Spinner } from "../ui/spinner";

import { UserAvatar } from "./user-avatar";

const formSchema = z.object({
  email: z.email("Email is required.").min(1, "Email is required."),
});

const inviteUserMutation = graphql(/* GraphQL */ `
  mutation InviteUser(
    $id: String!
    $user: String!
  ) {
    inviteUser(
      id: $id
      user: $user
    ) {
      id
      users {
        id
        email
        name
        image
      }
    }
  }
`);

export function WorkspaceUsers() {
  const currentUser = useAuth((state) => state.user);
  if (!currentUser) throw new Error("no main user");

  const workspace = useWorkspaces((state) => state.currentWorkspace);
  if (!workspace) throw new Error("no workspace");

  const setCurrentWorkspace = useWorkspaces(
    (state) => state.setCurrentWorkspace,
  );

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
      const response = await graphqlClient.request(inviteUserMutation, {
        id: workspace.id,
        user: email,
      });
      setCurrentWorkspace({ ...workspace, users: response.inviteUser.users });
    } catch (_error) {
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
          Users
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workspace members</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="px-1 font-medium">Invite member</div>
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
          <div className="px-1 font-medium">
            Workspace members ({workspace.users?.length})
          </div>
          <div>
            {workspace.users?.map((user) => (
              <Item className="px-0" key={user.id}>
                <ItemMedia>
                  <UserAvatar userId={user.id} />
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle>{user.name}</ItemTitle>
                  <ItemDescription>{user.email}</ItemDescription>
                </ItemContent>
                {user.id === currentUser.id && (
                  <ItemActions>
                    <Badge>You</Badge>
                  </ItemActions>
                )}
              </Item>
            ))}
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
