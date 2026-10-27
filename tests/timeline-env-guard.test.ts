import { describe, expect, it } from 'vitest';
import { assertDistinctTimelineDatabaseId } from '../scripts/lib/timeline-env-guard.mjs';

describe('assertDistinctTimelineDatabaseId', () => {
    it('does not throw when ids differ', () => {
        expect(() =>
            assertDistinctTimelineDatabaseId('timeline', 'blog', 'listening')
        ).not.toThrow();
    });

    it('throws when timeline equals blog', () => {
        expect(() => assertDistinctTimelineDatabaseId('same', 'same')).toThrow(
            /时间轴|博客/
        );
    });

    it('throws when timeline equals listening', () => {
        expect(() =>
            assertDistinctTimelineDatabaseId('dup', 'blog', 'dup')
        ).toThrow(/听力/);
    });

    it('throws on empty timeline id', () => {
        expect(() => assertDistinctTimelineDatabaseId('', 'blog')).toThrow(
            /空|缺失|misconfig/
        );
    });
});
