import path from 'node:path';

/**
 * Plan filesystem paths to delete for local listening ids absent from the
 * remote 「完成」 set (D-13). Pure — does not unlink.
 *
 * Sync applies deletions in 02-03. Vitest fixtures MUST stay under
 * `tests/fixtures/listening/` so `--all` cannot wipe them (they are never
 * under `content/listening/`).
 *
 * @param {string[]} localIds - ids present locally (from content/listening/*.json)
 * @param {string[]} remoteDoneIds - Notion page ids still in remote done set
 * @param {{ jsonDir: string, audioDir: string }} dirs
 * @returns {string[]} candidate paths (`{id}.json` under jsonDir, `{id}.mp3` under audioDir)
 */
export function planStaleListeningDeletes(localIds, remoteDoneIds, dirs) {
    const locals = Array.isArray(localIds) ? localIds : [];
    const remote = new Set(Array.isArray(remoteDoneIds) ? remoteDoneIds : []);
    const jsonDir = dirs?.jsonDir ?? 'content/listening';
    const audioDir = dirs?.audioDir ?? 'public/audio/listening';

    /** @type {string[]} */
    const paths = [];
    for (const id of locals) {
        if (!id || remote.has(id)) continue;
        paths.push(path.join(jsonDir, `${id}.json`));
        paths.push(path.join(audioDir, `${id}.mp3`));
    }
    return paths;
}
