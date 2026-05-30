import { loadPosts, loadPostBySlug } from './loadPosts';

export { getCategories, getCategoryLabel } from './getCategories';
export { filterPosts, collectTags } from './filterPosts';
export { extractExcerpt } from './excerpt';
export { getRelatedPosts, scoreRelatedPost } from './getRelatedPosts';
export { groupPostsByYear } from './groupPostsByYear';
export { getAdjacentPosts } from './getAdjacentPosts';
export { getFeaturedPosts } from './getFeaturedPosts';
export { loadPosts, loadPostBySlug } from './loadPosts';
export { resolveBlogAsset, estimateReadTime } from './utils';

export function getAllPosts() {
    return loadPosts();
}

export { loadPostBySlug as getPostBySlug }; // 兼容旧名

export function getPostsByCategory(categoryId) {
    return loadPosts().filter((post) => post.categories.includes(categoryId));
}

export function getPostsByTag(tag) {
    return loadPosts().filter((post) => post.tags.includes(tag));
}
