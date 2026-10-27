export const TRACK_TO_NOTION = {
    intl: '国外模型',
    cn: '国内模型',
    fw: '框架/协议',
    term: '术语/范式',
};

export const NOTION_TO_TRACK = {
    国外: 'intl',
    国外模型: 'intl',
    国内: 'cn',
    国内模型: 'cn',
    框架: 'fw',
    '框架/协议': 'fw',
    术语: 'term',
    '术语/范式': 'term',
};

export const TIER_TO_HEAT = {
    0: '谱系',
    2: '高热度',
    3: '范式级',
};

export const HEAT_TO_TIER = {
    谱系: 0,
    高热度: 2,
    范式级: 3,
};

/**
 * @param {string} dateLabel
 * @param {string|number} year
 */
export function timelineSortKey(dateLabel, year) {
    const text = String(dateLabel || '');
    const nums = text.match(/\d+/g)?.map((n) => Number(n)) ?? [];
    const y = Number(year) || nums[0] || 0;
    let m = nums[1] > 0 && nums[1] <= 12 ? nums[1] : 0;
    let d = nums[2] > 0 && nums[2] <= 31 ? nums[2] : 0;
    if (!m && /上半年/.test(text)) m = 1;
    if (!m && /(年中|中后)/.test(text)) m = 6;
    if (!m && /年底/.test(text)) m = 12;
    if (!d && /下旬/.test(text)) d = 20;
    return y * 10000 + m * 100 + d;
}

export function tracksFromNotion(names) {
    const tracks = [];
    for (const name of names || []) {
        const track = NOTION_TO_TRACK[name];
        if (track && !tracks.includes(track)) tracks.push(track);
    }
    return tracks;
}
