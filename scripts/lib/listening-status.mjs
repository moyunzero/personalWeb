/**
 * Strip leading emoji / punctuation before comparing listening status labels (D-02).
 * @param {string | null | undefined} name
 * @returns {string}
 */
export function stripLeadingStatusDecorators(name) {
    return String(name || '')
        .replace(/^[^\p{L}\p{N}]+/u, '')
        .trim();
}

/**
 * Read Notion status or select property name (D-15).
 * @param {{ type?: string, status?: { name?: string }, select?: { name?: string } } | null | undefined} prop
 * @returns {string | null}
 */
export function getStatusOrSelectName(prop) {
    if (!prop) return null;
    if (prop.type === 'status') return prop.status?.name ?? null;
    if (prop.type === 'select') return prop.select?.name ?? null;
    return null;
}

/**
 * Parse done-status labels from env CSV or default 「完成」 (D-02).
 * @param {string | undefined} [raw]
 * @returns {string[]}
 */
export function parseListeningDoneStatuses(raw = process.env.NOTION_LISTENING_STATUS_DONE) {
    const value = String(raw ?? '').trim() || '完成';
    return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

/**
 * Whether a status label matches the done list after decorator strip (D-02).
 * @param {string | null | undefined} statusName
 * @param {string[]} doneList
 * @returns {boolean}
 */
export function isListeningDone(statusName, doneList) {
    const normalized = stripLeadingStatusDecorators(statusName);
    if (!normalized) return false;
    return doneList.some((d) => stripLeadingStatusDecorators(d) === normalized);
}
