import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { validateListeningData } from '../../scripts/lib/listening-schema.mjs';

const DEFAULT_DIR = './content/listening';

export type ListeningEntry = {
    id: string;
    date: string;
    title: string;
    sentence: string;
    vocab: Array<{
        word: string;
        phonetic: string;
        meaning: string;
        example: string;
        practice: string;
    }>;
    takeaways: string;
    youtubeUrl?: string;
    audioSrc?: string;
    notionSyncedAt: string;
};

/**
 * Build-time load of listening JSON (D-01/D-03).
 * Invalid or corrupt files are skipped (T-03-01); missing dir → [].
 */
export async function getListeningEntries(
    dir: string = DEFAULT_DIR,
): Promise<ListeningEntry[]> {
    const resolved = path.resolve(dir);
    let names: string[];
    try {
        names = await readdir(resolved);
    } catch {
        return [];
    }

    const entries: ListeningEntry[] = [];
    for (const name of names) {
        if (!name.endsWith('.json')) continue;
        try {
            const raw = await readFile(path.join(resolved, name), 'utf8');
            const parsed = JSON.parse(raw);
            const result = validateListeningData(parsed);
            if (result.success) {
                entries.push(result.data as ListeningEntry);
            }
        } catch {
            // skip corrupt / unreadable file
        }
    }

    return entries.sort((a, b) => {
        if (a.date === b.date) return 0;
        return a.date < b.date ? 1 : -1;
    });
}
