import { logger } from "@/logger";
import { yoga } from "@/api";
import { auth } from "@/auth";

export const startServer = () => {
  logger.info("Starting GraphQL server...");

  const server = Bun.serve({
    idleTimeout: 0,
    fetch: async (request, server) => {
      logger.debug({ url: request.url }, "New request incoming");

      let path = new URL(request.url).pathname;

      // Strip /api
      path = path.replace(/^\/api/, "");

      let res: Response;

      if (request.method === "OPTIONS") {
        // Handle CORS preflight requests
        res = new Response("Departed");
      } else if (path.startsWith("/auth")) {
        // Handle better-auth endpoints
        res = await auth.handler(request);
      } else if (path.startsWith("/graphql")) {
        // Handle GraphQL requests
        res = await yoga.fetch(request, server);
      } else {
        res = new Response("Not found", { status: 404 });
      }

      // Apply CORS headers to the response
      res.headers.set("Access-Control-Allow-Origin", "http://localhost:5173");
      res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, x-graphql-event-stream-token",
      );
      res.headers.set("Access-Control-Allow-Credentials", "true");

      res.headers.set("X-Accel-Buffering", "no");

      // Return the response
      return res;
    },
  });

  logger.info(`Server is running on ${`http://${server.hostname}:${server.port}`}/api`);
};
