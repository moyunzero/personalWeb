/**
 * Collect plain_text from a Notion rich_text array.
 * @param {Array<{ plain_text?: string }> | undefined} richText
 * @returns {string}
 */
function richTextPlain(richText) {
    if (!Array.isArray(richText)) return '';
    return richText.map((t) => t.plain_text || '').join('').trim();
}

/**
 * Heading types used for 内容摘要 detection (D-16).
 * @param {object} block
 * @returns {string}
 */
function headingPlain(block) {
    const type = block?.type;
    if (!type || !type.startsWith('heading_')) return '';
    return richTextPlain(block[type]?.rich_text);
}

/**
 * Paragraph plain text from a block.
 * @param {object} block
 * @returns {string}
 */
function paragraphPlain(block) {
    if (block?.type !== 'paragraph') return '';
    return richTextPlain(block.paragraph?.rich_text);
}

/**
 * Heuristic: treat as English if it contains Latin letters (D-16).
 * @param {string} text
 * @returns {boolean}
 */
function looksEnglish(text) {
    return /[A-Za-z]/.test(text);
}

/**
 * Extract listening target sentence from Notion page blocks (D-16, D-06).
 * Prefer first English paragraph after a heading containing 「内容摘要」;
 * else first English paragraph on the page; else { skip: true }.
 *
 * @param {object[]} blocks
 * @returns {{ sentence: string } | { skip: true }}
 */
export function extractSentence(blocks) {
    const list = Array.isArray(blocks) ? blocks : [];

    let afterSummary = false;
    for (const block of list) {
        const heading = headingPlain(block);
        if (heading.includes('内容摘要')) {
            afterSummary = true;
            continue;
        }
        if (!afterSummary) continue;
        const para = paragraphPlain(block);
        if (para && looksEnglish(para)) {
            return { sentence: para };
        }
        // Stop preferring summary section once another heading appears
        if (heading) break;
    }

    for (const block of list) {
        const para = paragraphPlain(block);
        if (para && looksEnglish(para)) {
            return { sentence: para };
        }
    }

    return { skip: true };
}
