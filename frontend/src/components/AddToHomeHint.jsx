import React, { useEffect, useState } from 'react';
import { Share, Plus, X, SquarePlus, MoreVertical, Home } from 'lucide-react';

const LS_KEY = 'stir-diary:a2hs-dismissed';

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function AddToHomeHint() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(LS_KEY)) return;
      if (isStandalone()) return;
      const ua = window.navigator.userAgent || '';
      const isMobile = /iphone|ipad|ipod|android/i.test(ua) || window.innerWidth < 768;
      if (!isMobile) return;
      setIos(/iphone|ipad|ipod/i.test(ua));
      const t = setTimeout(() => setShow(true), 1200);
      return () => clearTimeout(t);
    } catch {}
  }, []);

  const dismiss = () => {
    try { localStorage.setItem(LS_KEY, '1'); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-50 anim-pop" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="surface rounded-2xl p-4 shadow-2xl relative"
        style={{ background: 'var(--surface-solid)', border: '1px solid var(--surface-border)' }}>
        <button type="button" onClick={dismiss} className="absolute top-2.5 right-2.5 rounded-full p-1 hover:bg-[var(--accent-soft)]">
          <X size={16} style={{ color: 'var(--text-muted)' }} />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 rounded-xl p-2" style={{ background: 'var(--accent-soft)' }}>
            <Home size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="pr-5">
            <div className="font-serif-tc font-bold text-sm mb-1" style={{ color: 'var(--accent)' }}>加到手機主畫面</div>
            <p className="text-xs text-muted leading-relaxed">
              把「攪拌紀錄」放到桌面，像小工具一樣全螢幕開啟。
            </p>
            <div className="mt-2 text-xs flex items-center gap-1.5 flex-wrap" style={{ color: 'var(--text)' }}>
              {ios ? (
                <>
                  <span>點底部</span>
                  <Share size={14} style={{ color: 'var(--accent)' }} />
                  <span>分享鈕</span>
                  <span className="text-muted">→</span>
                  <SquarePlus size={14} style={{ color: 'var(--accent)' }} />
                  <span>加入主畫面</span>
                </>
              ) : (
                <>
                  <span>點右上</span>
                  <MoreVertical size={14} style={{ color: 'var(--accent)' }} />
                  <span>選單</span>
                  <span className="text-muted">→</span>
                  <Plus size={14} style={{ color: 'var(--accent)' }} />
                  <span>加到主畫面</span>
                </>
              )}
            </div>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="btn-ghost rounded-full w-full mt-3 py-2 text-xs">我知道了</button>
      </div>
    </div>
  );
}
