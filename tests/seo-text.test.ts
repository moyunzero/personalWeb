import { describe, expect, it } from 'vitest';
import {
    DESCRIPTION_MIN_CHARS,
    TITLE_MIN_CHARS,
    TITLE_MAX_CHARS,
    charLength,
    descriptionIssue,
    effectiveDescription,
    effectiveTitle,
    excerptForDescription,
    isPlaceholderDescription,
    needsDescriptionFallback,
    normalizeMetaText,
    titleIssue,
    withSiteName,
} from '../src/blog/seo-text.js';

const LONG_BODY =
    '浏览器在解析 HTML 时，会先把 HTML 转成 DOM 树，再计算每个节点的样式与几何位置。回流与重绘的代价不同，' +
    '理解这一点，才能判断什么改动值得上 transform，什么改动只能老老实实减少布局范围。本文用一个真实列表页做对照实验。';

describe('seo-text / 基础工具', () => {
    it('charLength 按码点计数（中文 1 个字符算 1）', () => {
        expect(charLength('小王子')).toBe(3);
        expect(charLength('《小王子》读书笔记')).toBe(9);
        expect(charLength('')).toBe(0);
        expect(charLength(undefined)).toBe(0);
    });

    it('normalizeMetaText 压缩空白并去掉开头孤立标点', () => {
        expect(normalizeMetaText('  ，事件循环是 JavaScript 管理任务的方式  ')).toBe(
            '事件循环是 JavaScript 管理任务的方式'
        );
        expect(normalizeMetaText('a\n\nb')).toBe('a b');
        expect(normalizeMetaText(null)).toBe('');
    });
});

describe('seo-text / 占位描述', () => {
    it('识别 Notion 项目代号占位', () => {
        expect(isPlaceholderDescription('workBuddy-3')).toBe(true);
        expect(isPlaceholderDescription('AgentGuide-12')).toBe(true);
        expect(isPlaceholderDescription('Personal GPT Phase 1')).toBe(true);
        expect(isPlaceholderDescription('')).toBe(true);
    });

    it('不误判正常描述', () => {
        expect(isPlaceholderDescription('React Hooks 彻底改变了函数组件里管理状态与副作用的方式。')).toBe(
            false
        );
        expect(isPlaceholderDescription('JavaScript')).toBe(false);
        expect(isPlaceholderDescription('MDN Web Docs')).toBe(false);
        expect(isPlaceholderDescription('React Hooks change how state is managed.')).toBe(false);
    });

    it('needsDescriptionFallback 覆盖空、占位与过短三种情况', () => {
        expect(needsDescriptionFallback('')).toBe(true);
        expect(needsDescriptionFallback('AgentGuide-3')).toBe(true);
        expect(needsDescriptionFallback('设计模式是可重复使用的解决方案。')).toBe(true);
        expect(needsDescriptionFallback('长'.repeat(DESCRIPTION_MIN_CHARS))).toBe(false);
    });
});

describe('seo-text / effectiveDescription', () => {
    it('占位描述用正文摘要替换', () => {
        const description = effectiveDescription({
            description: 'workBuddy-1',
            body: `${LONG_BODY}\n\n## 小节\n\n更多内容。`,
        });
        expect(description.startsWith('浏览器在解析 HTML')).toBe(true);
        expect(charLength(description)).toBeGreaterThanOrEqual(DESCRIPTION_MIN_CHARS);
        expect(description).not.toContain('workBuddy');
    });

    it('正常描述原样保留', () => {
        const good =
            '一段足够长的正常描述：讲清浏览器渲染流程里回流与重绘的差别，以及为什么优先改 transform，' +
            '再给出判断清单与实测数据，说明什么改动值得上合成层、什么改动只能减少布局范围，最后附上排查步骤与线上回归方式。';
        expect(charLength(good)).toBeGreaterThanOrEqual(DESCRIPTION_MIN_CHARS);
        expect(effectiveDescription({ description: good, body: LONG_BODY })).toBe(good);
    });

    it('正文也过短时保留原描述，不生成空描述', () => {
        expect(effectiveDescription({ description: '短描述', body: '' })).toBe('短描述');
    });

    it('描述上限 200 字符', () => {
        const tooLong = '长'.repeat(400);
        expect(charLength(effectiveDescription({ description: tooLong }))).toBe(200);
    });
});

describe('seo-text / effectiveTitle 与站点后缀', () => {
    it('seoTitle 优先于 frontmatter title', () => {
        expect(effectiveTitle({ title: '小王子', seoTitle: '《小王子》读书笔记：本质的东西，眼睛看不见' })).toBe(
            '《小王子》读书笔记：本质的东西，眼睛看不见'
        );
        expect(effectiveTitle({ title: '小王子' })).toBe('小王子');
        expect(effectiveTitle({ title: '小王子', seoTitle: '   ' })).toBe('小王子');
    });

    it('withSiteName 追加站点名，且不重复追加', () => {
        expect(withSiteName('《小王子》读书笔记：本质的东西，眼睛看不见', '墨韵')).toBe(
            '《小王子》读书笔记：本质的东西，眼睛看不见 · 墨韵'
        );
        const once = withSiteName('博客', '墨韵');
        expect(withSiteName(once, '墨韵')).toBe(once);
    });

    it('标题会超过 65 字符时不再追加站点名', () => {
        const longTitle = '长'.repeat(TITLE_MAX_CHARS - 2);
        const composed = withSiteName(longTitle, '墨韵');
        expect(charLength(composed)).toBeLessThanOrEqual(TITLE_MAX_CHARS);
        expect(composed.endsWith('· 墨韵')).toBe(false);
    });
});

describe('seo-text / 门禁判定', () => {
    it('标题少于 15 字符判为过短', () => {
        expect(titleIssue('Node · 墨韵')).toBe('title-too-short');
        expect(titleIssue('《小王子》读书笔记：本质的东西，眼睛看不见')).toBe(null);
        expect(titleIssue('长'.repeat(TITLE_MAX_CHARS + 1))).toBe('title-too-long');
        expect(charLength('《小王子》读书笔记：本质的东西，眼睛看不见')).toBeGreaterThanOrEqual(
            TITLE_MIN_CHARS
        );
    });

    it('描述少于 70 字符判为过短', () => {
        expect(descriptionIssue('workBuddy-3')).toBe('desc-too-short');
        expect(descriptionIssue('长'.repeat(DESCRIPTION_MIN_CHARS))).toBe(null);
        expect(descriptionIssue('长'.repeat(201))).toBe('desc-too-long');
    });
});

describe('seo-text / description 专用摘要', () => {
    it('保留行内代码里的标识符，不把 input_schema 洗成 inputschema', () => {
        const md = '每轮把全部完整 `input_schema` 塞进 `tools=`，上下文会被说明书挤爆。';
        const excerpt = excerptForDescription(md, 160);
        expect(excerpt).toContain('input_schema');
        expect(excerpt).toContain('tools=');
    });

    it('粗体标记不留下「层 ：」这类多余空格', () => {
        const excerpt = excerptForDescription('**Harness 层**：控制每轮暴露哪些工具契约。', 160);
        expect(excerpt).toBe('Harness 层：控制每轮暴露哪些工具契约。');
    });

    it('丢弃代码块，只保留正文', () => {
        const md = '先说结论：\n\n```js\nconst a = 1;\n```\n\n事件循环负责调度任务。';
        const excerpt = excerptForDescription(md, 160);
        expect(excerpt).not.toContain('const a = 1');
        expect(excerpt).toContain('事件循环负责调度任务');
    });

    it('超长时在句末截断，不留半句', () => {
        const sentence = '这是一句用于测试截断的中文。';
        const excerpt = excerptForDescription(sentence.repeat(20), 40);
        expect(excerpt.endsWith('。')).toBe(true);
        expect(charLength(excerpt)).toBeLessThanOrEqual(40);
    });

    it('没有句读的长文本按上限硬截并加省略号', () => {
        const excerpt = excerptForDescription('长'.repeat(300), 40);
        expect(charLength(excerpt)).toBe(40);
        expect(excerpt.endsWith('…')).toBe(true);
    });
});
