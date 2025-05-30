import * as jose from "jose";
import type { Plugin } from "graphql-yoga";
import { db } from "@/database";
import { users } from "@/tables";
import { eq } from "drizzle-orm";
import { logger } from "@/logger";

const alg = "HS256";
const secret = new TextEncoder().encode(
  "cc7e0d44fd473002f1c42167459001140ec6389b7353f8088f4d9a95f2f596f2",
);

export const createJwt = async (user: string, clientId: string) => {
  return await new jose.SignJWT({ user, clientId })
    .setProtectedHeader({ alg })
    .setIssuedAt()
    .setIssuer("@maille/api")
    .setAudience("@maille/api")
    .setExpirationTime("1y")
    .sign(secret);
};

export const verifyJwt = async (jwt: string) => {
  return await jose.jwtVerify(jwt, secret, {
    issuer: "@maille/api",
    audience: "@maille/api",
  });
};

export function useAuth(): Plugin<{
  user: string;
  clientId: string;
}> {
  const authByRequest = new WeakMap<
    Request,
    {
      user: string;
      clientId: string;
    }
  >();

  return {
    async onRequest({ request, fetchAPI, endResponse }) {
      const authorizationHeader = request.headers.get("authorization");
      if (!authorizationHeader) {
        return endResponse(
          new fetchAPI.Response(null, {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      }

      const bearerToken = authorizationHeader.replace("Bearer ", "");
      try {
        const { payload } = await verifyJwt(bearerToken);
        authByRequest.set(request, {
          user: payload.user as string,
          clientId: payload.clientId as string,
        });
      } catch (e) {
        return endResponse(
          new fetchAPI.Response(null, {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          }),
        );
      }
    },
    onContextBuilding({ context, extendContext }) {
      const result = authByRequest.get(context.request);
      if (result) {
        extendContext({
          user: result.user,
          clientId: result.clientId,
        });
      }
    },
  };
}

export const login = async (
  email: string,
  password: string,
  clientId: string,
) => {
  const user = await db.select().from(users).where(eq(users.email, email));
  const passwordHashed = await Bun.password.hash(password);
  const passwordValid = await Bun.password.verify(password, passwordHashed);
  if (passwordValid) {
    return {
      jwt: await createJwt(user[0].id, clientId),
      user: {
        id: user[0].id,
        email: user[0].email,
        firstName: user[0].firstName,
        lastName: user[0].lastName,
      },
    };
  }

  throw Error("Invalid credentials");
};

export const createUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string,
) => {
  const user = (
    await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email,
        password: await Bun.password.hash(password),
        firstName,
        lastName,
      })
      .returning()
  )[0];

  logger.info(
    {
      id: user.id,
      email,
      firstName,
      lastName,
    },
    `User created successfully`,
  );

  return user;
};
