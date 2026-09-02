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

/**
 * Plain text from a Notion table cell (array of rich_text).
 * @param {Array<{ plain_text?: string }> | undefined} cell
 * @returns {string}
 */
export function cellText(cell) {
    if (!Array.isArray(cell)) return '';
    return cell.map((t) => t.plain_text || '').join('').trim();
}

/**
 * Map Chinese/English header labels to vocab field indices (D-04).
 * @param {Array<Array<{ plain_text?: string }>>} headerCells
 * @returns {{ word: number, phonetic: number, meaning: number, example: number, practice: number }}
 */
export function mapHeaderIndex(headerCells) {
    const labels = (headerCells || []).map(cellText);
    const find = (...needles) =>
        labels.findIndex((h) => needles.some((n) => h.toLowerCase().includes(n)));
    return {
        word: find('单词', '短语', 'word'),
        phonetic: find('音标', '发音'),
        meaning: find('中文', '意思', '释义'),
        example: find('例句'),
        practice: find('练习'),
    };
}

/**
 * Whether page blocks have a 词汇 heading followed by a table (D-04 gate).
 * @param {object[]} pageBlocks
 * @returns {boolean}
 */
function hasVocabTable(pageBlocks) {
    let afterVocab = false;
    for (const block of pageBlocks) {
        const heading = headingPlain(block);
        if (heading.includes('词汇')) {
            afterVocab = true;
            continue;
        }
        if (!afterVocab) continue;
        if (block?.type === 'table') return true;
        if (heading) return false;
    }
    return false;
}

/**
 * Extract vocab rows from already-fetched table_row blocks (D-04).
 * Sync owns the second children.list; this stays pure.
 *
 * @param {object[]} pageBlocks
 * @param {object[]} tableRowBlocks
 * @returns {Array<{ word: string, phonetic: string, meaning: string, example: string, practice: string }>}
 */
export function extractVocab(pageBlocks, tableRowBlocks) {
    const pages = Array.isArray(pageBlocks) ? pageBlocks : [];
    const rows = Array.isArray(tableRowBlocks) ? tableRowBlocks : [];
    if (!hasVocabTable(pages) || rows.length === 0) return [];

    const tableRows = rows.filter((b) => b?.type === 'table_row');
    if (tableRows.length < 2) return [];

    const headerCells = tableRows[0].table_row?.cells || [];
    const idx = mapHeaderIndex(headerCells);
    if (idx.word < 0) return [];

    const vocab = [];
    for (const row of tableRows.slice(1)) {
        const cells = row.table_row?.cells || [];
        const at = (i) => (i >= 0 ? cellText(cells[i]) : '');
        const word = at(idx.word);
        if (!word) continue;
        vocab.push({
            word,
            phonetic: at(idx.phonetic),
            meaning: at(idx.meaning),
            example: at(idx.example),
            practice: at(idx.practice),
        });
    }
    return vocab;
}

/**
 * Concatenate plain text under a heading containing 「收获」 until next heading (D-05).
 * @param {object[]} blocks
 * @returns {string}
 */
export function extractTakeaways(blocks) {
    const list = Array.isArray(blocks) ? blocks : [];
    const parts = [];
    let inSection = false;

    for (const block of list) {
        const heading = headingPlain(block);
        if (heading.includes('收获')) {
            inSection = true;
            continue;
        }
        if (!inSection) continue;
        if (heading) break;

        const para = paragraphPlain(block);
        if (para) {
            parts.push(para);
            continue;
        }

        // Bulleted / numbered lists — collect plain_text if present
        const type = block?.type;
        if (type === 'bulleted_list_item' || type === 'numbered_list_item') {
            const text = richTextPlain(block[type]?.rich_text);
            if (text) parts.push(text);
        }
    }

    return parts.join('\n').trim();
}
