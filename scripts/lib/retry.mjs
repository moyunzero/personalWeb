export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ retries?: number, delayMs?: number, label?: string }} opts
 * @returns {Promise<T>}
 */
export async function withRetry(fn, { retries = 3, delayMs = 2000, label = '请求' } = {}) {
    let lastError;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            if (attempt >= retries) break;
            const wait = delayMs * attempt;
            console.warn(
                `  ⚠ ${label}失败，${wait / 1000}s 后重试 (${attempt}/${retries - 1}): ${err.message}`
            );
            await sleep(wait);
        }
    }

    throw lastError;
}
