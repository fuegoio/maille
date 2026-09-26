import type { APIRoute } from "astro";
import { source, getStructuredData } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";

export const prerender = true;

const api = createFromSource(source, {
  buildIndex: (page) => ({
    id: page.url,
    title: page.data.title,
    description: page.data.description,
    url: page.url,
    structuredData: getStructuredData(page.data._raw),
  }),
});

export const GET: APIRoute = async () => api.staticGET();
