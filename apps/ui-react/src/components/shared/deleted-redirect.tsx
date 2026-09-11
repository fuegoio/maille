import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

interface DeletedRedirectTarget {
  to: string;
  params?: Record<string, string | undefined>;
}

/**
 * Rendered instead of a page when the viewed resource disappears from the
 * store while its page is open (deleted from a settings dialog, the
 * selection bar, or a synced event from another client): navigates back to
 * the parent list.
 *
 * Direct URLs to a missing resource still render the 404 page — loaders
 * throw notFound before this component is ever mounted.
 */
export function DeletedRedirect({ target }: { target: DeletedRedirectTarget }) {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({
      to: target.to as never,
      params: target.params as never,
    });
  }, [navigate, target]);

  return null;
}
