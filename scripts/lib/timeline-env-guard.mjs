/**
 * Fail-fast when timeline DB id equals blog (or listening) DB id.
 * Pure helper — caller passes getEnv results; does not read process.env.
 *
 * @param {string} timelineId
 * @param {string} blogId
 * @param {string} [listeningId]
 */
export function assertDistinctTimelineDatabaseId(timelineId, blogId, listeningId = '') {
    const timeline = String(timelineId ?? '').trim();
    const blog = String(blogId ?? '').trim();
    const listening = String(listeningId ?? '').trim();

    if (!timeline) {
        throw new Error(
            '时间轴数据库 ID 为空或缺失（misconfig）：请配置 NOTION_TIMELINE_DATABASE_ID'
        );
    }
    if (!blog) {
        throw new Error(
            '博客数据库 ID 为空或缺失（misconfig）：请配置 NOTION_DATABASE_ID'
        );
    }
    if (timeline === blog) {
        throw new Error(
            '时间轴数据库 ID 不能与博客数据库 ID 相同：请使用独立的 NOTION_TIMELINE_DATABASE_ID'
        );
    }
    if (listening && timeline === listening) {
        throw new Error(
            '时间轴数据库 ID 不能与听力数据库 ID 相同：请使用独立的 NOTION_TIMELINE_DATABASE_ID'
        );
    }
}
