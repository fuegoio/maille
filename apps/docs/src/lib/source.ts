import type { StaticSource } from "fumadocs-core/source";
import { loader } from "fumadocs-core/source";
import { type CollectionEntry, getCollection } from "astro:content";
import { structure, type StructuredData } from "fumadocs-core/mdx-plugins";

export const source = loader({
  source: await createSource(),
  baseUrl: "/docs",
});

export function getStructuredData(entry: CollectionEntry<"docs">): StructuredData {
  return structure(entry.body ?? "");
}

async function createSource() {
  const out: StaticSource<{
    metaData: CollectionEntry<"meta">["data"];
    pageData: CollectionEntry<"docs">["data"] & {
      _raw: CollectionEntry<"docs">;
    };
  }> = {
    files: [],
  };

  for (const page of await getCollection("docs")) {
    const virtualPath = page.id;

    out.files.push({
      type: "page",
      path: virtualPath,
      data: {
        ...page.data,
        _raw: page,
      },
    });
  }

  for (const meta of await getCollection("meta")) {
    const virtualPath = meta.id;

    out.files.push({
      type: "meta",
      path: virtualPath,
      data: meta.data,
    });
  }

  return out;
}
