import { Users } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/stores/auth";
import { useWorkspaces } from "@/stores/workspaces";

import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DropdownMenuItem } from "../ui/dropdown-menu";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "../ui/item";
import { Separator } from "../ui/separator";

import { UserAvatar } from "./user-avatar";

export function WorkspaceUsers() {
  const user = useAuth((state) => state.user);
  if (!user) throw new Error("no main user");

  const workspace = useWorkspaces((state) => state.currentWorkspace);
  if (!workspace) throw new Error("no workspace");

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
          <DialogTitle>Workspace users</DialogTitle>
        </DialogHeader>
        <div>
          <Item>
            <ItemMedia>
              <UserAvatar userId={user.id} />
            </ItemMedia>
            <ItemContent className="gap-0">
              <ItemTitle>{user.name}</ItemTitle>
              <ItemDescription>{user.email}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <Badge>You</Badge>
            </ItemActions>
          </Item>
          <Separator />
          {workspace.users
            ?.filter((u) => u.id !== user.id)
            .map((user) => (
              <Item>
                <ItemMedia>
                  <UserAvatar userId={user.id} />
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle>{user.name}</ItemTitle>
                  <ItemDescription>{user.email}</ItemDescription>
                </ItemContent>
              </Item>
            ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
