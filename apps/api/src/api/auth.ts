import type { Plugin } from "graphql-yoga";
import { auth } from "@/auth";
import type { Session, User } from "better-auth";

export type SessionData = {
  session: Session;
  user: User;
};

export function useAuth(): Plugin<SessionData> {
  const authByRequest = new WeakMap<Request, SessionData>();

  return {
    async onRequest({ request, fetchAPI, endResponse }) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return endResponse(
          new fetchAPI.Response(null, {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      }

      authByRequest.set(request, session);
    },
    onContextBuilding({ context, extendContext }) {
      const result = authByRequest.get(context.request);
      if (result) {
        extendContext(result);
      }
    },
  };
}
