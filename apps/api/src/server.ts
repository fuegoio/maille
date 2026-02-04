import { logger } from "@/logger";
import { yoga } from "@/api";
import { auth } from "@/auth";

export const startServer = () => {
  logger.info("Starting GraphQL server...");

  const server = Bun.serve({
    fetch: async (request, server) => {
      logger.debug({ url: request.url }, "New request incoming");

      let path = new URL(request.url).pathname;

      // Strip /api
      path = path.replace(/^\/api/, "");

      // Handle better-auth endpoints
      if (path.startsWith("/auth")) {
        return auth.handler(request);
      }

      // Handle GraphQL requests
      if (path.startsWith("/graphql")) {
        return yoga.fetch(request, server);
      }

      let res: Response;

      // Handle CORS preflight requests
      if (request.method === "OPTIONS") {
        res = new Response("Departed");
      } else {
        res = new Response("Not found", { status: 404 });
      }

      // Apply CORS headers to the response
      res.headers.set("Access-Control-Allow-Origin", "*");
      res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

      // Return the response
      return res;
    },
  });

  logger.info(`Server is running on ${`http://${server.hostname}:${server.port}`}/api`);
};
