import { useEffect, useMemo, useState } from 'react';

const DEFAULT_MESSAGE = {
  id: 0,
  title: 'OpenPet 助手已就绪',
  text: '可通过 window.codexOpenPet.notify({ title, text, status }) 控制桌宠状态。',
  status: 'idle',
  actionUrl: '',
};

const STATUS_META = {
  idle: {
    label: '待命',
    icon: 'pets',
    color: 'rgba(34, 211, 238, 0.95)',
    gradient: 'from-cyan-400/20 to-sky-500/10',
    animation: 'idle',
  },
  working: {
    label: '执行中',
    icon: 'autorenew',
    color: 'rgba(56, 189, 248, 0.95)',
    gradient: 'from-sky-400/25 to-indigo-500/10',
    animation: 'jump',
  },
  review: {
    label: '待确认',
    icon: 'rate_review',
    color: 'rgba(251, 191, 36, 0.95)',
    gradient: 'from-amber-300/25 to-orange-500/10',
    animation: 'attack',
  },
  done: {
    label: '已完成',
    icon: 'check_circle',
    color: 'rgba(74, 222, 128, 0.95)',
    gradient: 'from-emerald-300/25 to-teal-500/10',
    animation: 'celebrate',
  },
  error: {
    label: '异常',
    icon: 'error',
    color: 'rgba(248, 113, 113, 0.95)',
    gradient: 'from-rose-400/25 to-red-500/10',
    animation: 'hurt',
  },
};

const DEMO_ACTIONS = [
  {
    label: '执行',
    status: 'working',
    title: '正在处理任务',
    text: '我会在页面底部陪你盯进度。',
  },
  {
    label: '待审',
    status: 'review',
    title: '需要你确认',
    text: '像 OpenPets 一样，用状态气泡提醒下一步。',
  },
  {
    label: '完成',
    status: 'done',
    title: '任务已完成',
    text: '桌宠会跳跃庆祝并更新状态。',
  },
  {
    label: '异常',
    status: 'error',
    title: '检测到异常',
    text: '可以用失败状态提醒需要介入。',
  },
];

const normalizeStatus = (status) => (
  Object.prototype.hasOwnProperty.call(STATUS_META, status) ? status : 'idle'
);

const dispatchPetAnimation = (animation) => {
  if (!animation || typeof window === 'undefined') return;

  window.dispatchEvent(new CustomEvent('codex-openpet:animate', {
    detail: { animation },
  }));
};

const PetCompanion = () => {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [petRect, setPetRect] = useState(null);

  const meta = useMemo(
    () => STATUS_META[normalizeStatus(message.status)],
    [message.status],
  );

  useEffect(() => {
    const updateRect = () => {
      const rect = window.__shinobiRect;
      if (rect) setPetRect(rect);
    };

    updateRect();
    const intervalId = window.setInterval(updateRect, 250);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const notify = (payload = {}) => {
      const status = normalizeStatus(payload.status || 'idle');
      const nextMessage = {
        id: Date.now(),
        title: payload.title || STATUS_META[status].label,
        text: payload.text || '',
        status,
        actionUrl: payload.actionUrl || '',
      };

      setMessage(nextMessage);
      setVisible(true);
      dispatchPetAnimation(payload.animation || STATUS_META[status].animation);
      return nextMessage;
    };

    const animate = (animation = 'jump') => {
      dispatchPetAnimation(animation);
      return animation;
    };

    const clear = () => {
      setVisible(false);
      setMessage(DEFAULT_MESSAGE);
      dispatchPetAnimation('idle');
    };

    const status = () => ({
      visible,
      expanded,
      message,
    });

    const api = { notify, animate, clear, status };
    window.codexOpenPet = api;
    window.openPet = api;

    const handleNotify = (event) => notify(event.detail);
    const handleClear = () => clear();

    window.addEventListener('codex-openpet:notify', handleNotify);
    window.addEventListener('codex-openpet:clear', handleClear);

    return () => {
      window.removeEventListener('codex-openpet:notify', handleNotify);
      window.removeEventListener('codex-openpet:clear', handleClear);
      if (window.codexOpenPet === api) delete window.codexOpenPet;
      if (window.openPet === api) delete window.openPet;
    };
  }, [expanded, message, visible]);

  const bubbleStyle = petRect
    ? {
        left: Math.min(Math.max(petRect.left + 18, 16), window.innerWidth - 320),
        bottom: Math.max(window.innerHeight - petRect.top + 4, 104),
      }
    : {
        left: 24,
        bottom: 112,
      };

  const handleDemo = (action) => {
    window.codexOpenPet.notify(action);
  };

  const handleActionOpen = () => {
    if (message.actionUrl) {
      window.open(message.actionUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {visible && (
        <aside
          className="fixed z-[180] w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-zinc-950/85 p-4 text-sm shadow-2xl shadow-cyan-950/30 backdrop-blur-xl transition-all duration-300"
          style={bubbleStyle}
          aria-live="polite"
        >
          <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${meta.gradient}`} />
          <div className="flex items-start gap-3">
            <span
              className="material-symbols-rounded mt-0.5 rounded-xl border border-white/10 bg-white/10 p-2 text-[20px]"
              style={{ color: meta.color }}
              aria-hidden="true"
            >
              {meta.icon}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shadow-[0_0_12px_currentColor]"
                  style={{ color: meta.color, backgroundColor: meta.color }}
                />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  Codex OpenPet · {meta.label}
                </span>
              </div>
              <h2 className="truncate text-base font-semibold text-zinc-50">
                {message.title}
              </h2>
              {message.text && (
                <p className="mt-1 leading-5 text-zinc-300">
                  {message.text}
                </p>
              )}
              {message.actionUrl && (
                <button
                  type="button"
                  className="mt-3 rounded-lg bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-cyan-300"
                  onClick={handleActionOpen}
                >
                  打开操作链接
                </button>
              )}
            </div>
            <button
              type="button"
              className="rounded-lg p-1 text-zinc-400 transition hover:bg-white/10 hover:text-zinc-100"
              aria-label="隐藏 OpenPet 消息"
              onClick={() => setVisible(false)}
            >
              <span className="material-symbols-rounded text-[18px]" aria-hidden="true">close</span>
            </button>
          </div>
        </aside>
      )}

      <section className="fixed bottom-5 left-5 z-[170] rounded-2xl border border-white/10 bg-zinc-950/80 p-2 text-zinc-100 shadow-2xl shadow-black/30 backdrop-blur-xl">
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-white/10"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
        >
          <span className="material-symbols-rounded text-cyan-300" aria-hidden="true">pets</span>
          OpenPet
          <span className="material-symbols-rounded text-[16px] text-zinc-500" aria-hidden="true">
            {expanded ? 'expand_more' : 'chevron_right'}
          </span>
        </button>
        {expanded && (
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/10 pt-2">
            {DEMO_ACTIONS.map((action) => (
              <button
                key={action.status}
                type="button"
                className="rounded-xl bg-white/5 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
                onClick={() => handleDemo(action)}
              >
                {action.label}
              </button>
            ))}
            <button
              type="button"
              className="col-span-2 rounded-xl bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-700"
              onClick={() => window.codexOpenPet.clear()}
            >
              清空消息
            </button>
          </div>
        )}
      </section>
    </>
  );
};

export default PetCompanion;
