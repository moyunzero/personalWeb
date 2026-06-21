import { defineCollection } from 'astro:content';
import { postsLoader } from './loaders/posts-loader';

const posts = defineCollection({
    loader: postsLoader(),
});

export const collections = { posts };
