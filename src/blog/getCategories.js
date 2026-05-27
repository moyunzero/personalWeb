import categoriesData from '../../content/categories.json';

/**
 * @typedef {{ id: string, label: string, order: number }} BlogCategory
 */

/** @type {BlogCategory[]} */
let cached = null;

/**
 * 获取所有博客分类（按 order 排序）
 * @returns {BlogCategory[]}
 */
export function getCategories() {
    if (!cached) {
        cached = [...categoriesData].sort((a, b) => a.order - b.order);
    }
    return cached;
}

/**
 * 根据 id 获取分类展示名
 * @param {string} categoryId
 * @returns {string}
 */
export function getCategoryLabel(categoryId) {
    const found = getCategories().find((c) => c.id === categoryId);
    return found?.label ?? categoryId;
}

/**
 * 校验分类 id 是否已注册
 * @param {string[]} categoryIds
 */
export function validateCategoryIds(categoryIds) {
    const known = new Set(getCategories().map((c) => c.id));
    const unknown = categoryIds.filter((id) => !known.has(id));
    if (unknown.length > 0 && import.meta.env.DEV) {
        console.warn(
            `[blog] 未在 content/categories.json 中注册的分类: ${unknown.join(', ')}`
        );
    }
}
