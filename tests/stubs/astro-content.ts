/** Vitest stub for Astro virtual module `astro:content`. */
export async function getCollection(): Promise<unknown[]> {
    return [];
}

export type CollectionEntry<T extends string = string> = {
    id: string;
    collection: T;
    data: Record<string, unknown>;
    body: string;
};
