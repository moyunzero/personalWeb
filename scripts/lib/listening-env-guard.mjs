/**
 * Fail-fast when listening DB id equals blog DB id (SYNC-03).
 * Pure helper — caller passes getEnv results; does not read process.env.
 *
 * Empty/whitespace ids are treated as misconfiguration (must both be set).
 *
 * @param {string} listeningId
 * @param {string} blogId
 */
export function assertDistinctListeningDatabaseId(listeningId, blogId) {
    const listening = String(listeningId ?? '').trim();
    const blog = String(blogId ?? '').trim();

    if (!listening) {
        throw new Error(
            '听力数据库 ID 为空或缺失（misconfig）：请配置 NOTION_LISTENING_DATABASE_ID'
        );
    }
    if (!blog) {
        throw new Error(
            '博客数据库 ID 为空或缺失（misconfig）：请配置 NOTION_DATABASE_ID'
        );
    }
    if (listening === blog) {
        throw new Error(
            '听力数据库 ID 不能与博客数据库 ID 相同（SYNC-03）：请使用独立的 NOTION_LISTENING_DATABASE_ID'
        );
    }
}
