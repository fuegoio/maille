import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

// Only reachable when the fund disappears while its page is open (deleted
// from the settings dialog). Missing funds on direct URLs are handled by the
// loader's notFound.
export function FundDeletedRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    void navigate({ to: "/funds" });
  }, [navigate]);
  return null;
}
