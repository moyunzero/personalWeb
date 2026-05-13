/**
 * 聊天 API 客户端
 * --------------------
 * 与 personal-gpt（部署在 Vercel）的 /api/chat 端点对接，
 * 走 Server-Sent Events（SSE）协议解析流式响应。
 *
 * 协议假定（基于 Vercel AI SDK v5+ 的 UI Message Stream 格式）：
 * - 请求：POST application/json，body = { messages: [{ role, content }] }
 * - 响应：text/event-stream，每条事件形如 `data: {...}\n\n`
 *   - { type: "text-delta", delta: "..." }  → 文本增量
 *   - { type: "start" } / { type: "finish" } → 流的起止信号
 *   - 末尾会收到 `data: [DONE]\n\n`
 *
 * 设计要点：
 * 1. 兼容性：除了 v5+ 新协议，也尽量兼容旧的 AI SDK v3 data stream 协议（`0:"..."`）
 * 2. AbortSignal：支持中途取消（用户点"停止生成"）
 * 3. 容错：单条解析失败时不中断整个流，记录后继续
 */

const DEFAULT_API_URL = 'https://personal-emotion-gpt.vercel.app/api/chat';

/**
 * 从环境变量读取 API 地址，未配置时回退到默认值
 */
const getApiUrl = () => {
    return import.meta.env.VITE_CHAT_API_URL || DEFAULT_API_URL;
};

/**
 * 解析单条 SSE 事件的 data 字段，返回文本增量
 * 返回 null 表示这条事件没有可拼接的文本
 */
const parseDataLine = (dataStr) => {
    if (!dataStr || dataStr === '[DONE]') return null;

    try {
        const obj = JSON.parse(dataStr);

        // AI SDK v5+ 新格式
        if (obj.type === 'text-delta' && typeof obj.delta === 'string') {
            return obj.delta;
        }
        // 部分实现可能用 textDelta 字段
        if (obj.type === 'text-delta' && typeof obj.textDelta === 'string') {
            return obj.textDelta;
        }
        // 兜底：如果有 content / text 字段，直接返回
        if (typeof obj.content === 'string') return obj.content;
        if (typeof obj.text === 'string') return obj.text;

        return null;
    } catch {
        // JSON 解析失败，可能是其他协议格式
        return null;
    }
};

/**
 * 兼容旧版 AI SDK v3 的 data stream 行格式：`0:"text"`
 * 行首数字标识类型，0 = 文本增量
 */
const parseLegacyLine = (line) => {
    if (!line) return null;
    const colonIndex = line.indexOf(':');
    if (colonIndex < 1) return null;

    const prefix = line.slice(0, colonIndex);
    const payload = line.slice(colonIndex + 1);

    // type 0 = text delta，payload 是 JSON 字符串
    if (prefix === '0') {
        try {
            return JSON.parse(payload);
        } catch {
            return null;
        }
    }
    return null;
};

/**
 * 发送聊天消息并以异步迭代器形式返回流式文本增量
 *
 * @param {Array<{role: 'user'|'assistant', content: string}>} messages 完整的对话历史
 * @param {Object} [options]
 * @param {AbortSignal} [options.signal] 用于中途取消
 * @returns {AsyncGenerator<string, void, void>} 每次 yield 一个文本片段
 */
export async function* streamChat(messages, { signal } = {}) {
    const apiUrl = getApiUrl();

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
            `聊天服务暂时不可用（${response.status}）${errorText ? ': ' + errorText : ''}`
        );
    }

    if (!response.body) {
        throw new Error('响应没有 body，无法读取流');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE 事件以 \n\n 分隔；旧版 data stream 以 \n 分隔
            // 这里按行处理，两种格式都能覆盖
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // 最后一行可能未完成，留在 buffer

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line) continue;

                // SSE 标准：`data: {...}` 或 `data: [DONE]`
                if (line.startsWith('data:')) {
                    const dataStr = line.slice(5).trim();
                    if (dataStr === '[DONE]') return;

                    const delta = parseDataLine(dataStr);
                    if (delta) yield delta;
                    continue;
                }

                // 兼容旧版 data stream 协议
                const legacyDelta = parseLegacyLine(line);
                if (legacyDelta) yield legacyDelta;
            }
        }

        // 处理 buffer 中可能残留的最后一段
        const trailing = buffer.trim();
        if (trailing && trailing !== 'data: [DONE]') {
            const dataStr = trailing.startsWith('data:')
                ? trailing.slice(5).trim()
                : trailing;
            const delta = parseDataLine(dataStr) || parseLegacyLine(trailing);
            if (delta) yield delta;
        }
    } finally {
        reader.releaseLock();
    }
}
