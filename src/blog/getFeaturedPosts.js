/**
 * @param {import('./parsePost').ReturnType<import('./parsePost').parsePost>[]} posts
 */
export function getFeaturedPosts(posts) {
    return posts.filter((post) => post.featured);
}
