import { describe, expect, it } from 'vitest';
import { assertDistinctListeningDatabaseId } from '../scripts/lib/listening-env-guard.mjs';

describe('listening-env-guard assertDistinctListeningDatabaseId', () => {
    it('does not throw when listening and blog ids differ', () => {
        expect(() =>
            assertDistinctListeningDatabaseId('db-a', 'db-b')
        ).not.toThrow();
    });

    it('throws when trimmed non-empty ids are equal (SYNC-03)', () => {
        expect(() =>
            assertDistinctListeningDatabaseId('same', 'same')
        ).toThrow(/listening|blog|听力|博客/i);
    });

    it('throws when equal after trim', () => {
        expect(() =>
            assertDistinctListeningDatabaseId('  same-id  ', 'same-id')
        ).toThrow();
    });

    it('throws on empty listening id (misconfig)', () => {
        expect(() => assertDistinctListeningDatabaseId('', 'blog-db')).toThrow(
            /listening|听力|空|缺失|misconfig/i
        );
    });

    it('throws on empty blog id (misconfig)', () => {
        expect(() =>
            assertDistinctListeningDatabaseId('listening-db', '  ')
        ).toThrow(/blog|博客|空|缺失|misconfig/i);
    });
});
