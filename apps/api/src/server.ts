import { logger } from "@/logger";
import { login } from "@/api/auth";
import { yoga } from "@/api";

export const startServer = () => {
  logger.info("Starting GraphQL server...");

  const server = Bun.serve({
    fetch: async (request, server) => {
      const path = new URL(request.url).pathname;

      // Handle GraphQL requests
      if (path.startsWith("/graphql")) {
        return yoga.fetch(request, server);
      }

      let res: Response;

      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        res = new Response("Departed");
      } else {
        if (path.startsWith("/auth/login")) {
          if (request.method !== "POST") {
            res = new Response("Method not allowed", { status: 405 });
          }

          const body = await request.json();
          if (body.email && body.password && body.clientId) {
            try {
              const { jwt, user } = await login(
                body.email,
                body.password,
                body.clientId,
              );
              res = Response.json({ jwt, user });
            } catch {
              res = new Response("Unauthorized", { status: 401 });
            }
          } else {
            res = new Response("Bad request", { status: 400 });
          }
        } else {
          res = new Response("Not found", { status: 404 });
        }
      }

      // Apply CORS headers to the response
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
      );

      // Return the response
      return res;
    },
  });

  logger.info(
    `Server is running on ${new URL(
      yoga.graphqlEndpoint,
      `http://${server.hostname}:${server.port}`,
    )}`,
  );
};
