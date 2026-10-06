import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';

// 固定於畫面後方的魔幻桃紙，捲動不跟隨移動；上方疊一層同調半透明遮罩。
export default function ThemeBackground() {
  const { themeKey } = useApp();

  // 隨機星光與光點（穩定於 mount）
  const stars = useMemo(
    () => Array.from({ length: 70 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.2 + 0.8,
      delay: Math.random() * 3,
      dur: Math.random() * 2.5 + 2,
    })),
    []
  );
  const motes = useMemo(
    () => Array.from({ length: 22 }, () => ({
      left: Math.random() * 100,
      size: Math.random() * 5 + 2,
      delay: Math.random() * 12,
      dur: Math.random() * 10 + 12,
      bottom: Math.random() * 60,
    })),
    []
  );

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      {/* 底色漸層 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 800px at 20% 10%, var(--bg-b), transparent 60%),' +
            'radial-gradient(1000px 700px at 85% 90%, var(--bg-c), transparent 60%),' +
            'linear-gradient(160deg, var(--bg-a), var(--bg-b))',
        }}
      />

      {/* 每款主題專屬紋樣 */}
      {themeKey === 'tarot' && <TarotArt />}
      {themeKey === 'mucha' && <MuchaArt />}
      {themeKey === 'magic' && <MagicArt />}

      {/* 星光閃爍（暗色主題較明顯） */}
      {themeKey !== 'mucha' &&
        stars.map((s, i) => (
          <span
            key={i}
            className="star absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              background: 'var(--particle)',
              boxShadow: '0 0 6px var(--particle)',
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.dur}s`,
            }}
          />
        ))}

      {/* 光點緩緩漂浮 */}
      {motes.map((m, i) => (
        <span
          key={`m${i}`}
          className="mote absolute rounded-full"
          style={{
            left: `${m.left}%`,
            bottom: `${m.bottom}%`,
            width: m.size,
            height: m.size,
            background: 'var(--particle)',
            filter: 'blur(1px)',
            boxShadow: '0 0 10px var(--particle)',
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.dur}s`,
          }}
        />
      ))}

      {/* 同調半透明遮罩 */}
      <div className="absolute inset-0" style={{ background: 'var(--overlay)' }} />
    </div>
  );
}

function TarotArt() {
  const c = 'var(--gold)';
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
      {/* 星座線條 */}
      <g stroke={c} strokeWidth="0.7" opacity="0.4" fill={c}>
        <polyline points="120,180 210,120 300,200 380,150 470,230" fill="none" />
        <polyline points="700,760 790,700 860,780 930,720" fill="none" />
        {[['120','180'],['210','120'],['300','200'],['380','150'],['470','230'],['700','760'],['790','700'],['860','780'],['930','720']].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r="2.5" />
        ))}
      </g>
      {/* 太陽光芒 */}
      <g className="spin-slow" style={{ transformOrigin: '160px 820px' }} opacity="0.5">
        <circle cx="160" cy="820" r="46" fill="none" stroke={c} strokeWidth="1.5" />
        {Array.from({ length: 16 }).map((_, i) => {
          const a = (i / 16) * Math.PI * 2;
          return (
            <line key={i} x1={160 + Math.cos(a) * 52} y1={820 + Math.sin(a) * 52}
              x2={160 + Math.cos(a) * 70} y2={820 + Math.sin(a) * 70} stroke={c} strokeWidth="1.5" />
          );
        })}
      </g>
      {/* 月中 */}
      <g opacity="0.5" className="pulse-glow">
        <path d="M 860 150 a 42 42 0 1 0 2 0 a 32 32 0 1 1 -2 0 Z" fill={c} />
      </g>
      {/* 塔羅牌框 */}
      <g stroke={c} strokeWidth="1.5" fill="none" opacity="0.25">
        <rect x="420" y="400" width="160" height="230" rx="10" />
        <rect x="432" y="412" width="136" height="206" rx="6" />
        <circle cx="500" cy="515" r="40" />
      </g>
    </svg>
  );
}

function MuchaArt() {
  const c = 'var(--gold)';
  const rose = 'var(--accent-2)';
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
      {/* 弧形光環 */}
      <g fill="none" opacity="0.5">
        <circle cx="500" cy="120" r="180" stroke={c} strokeWidth="2" />
        <circle cx="500" cy="120" r="150" stroke={rose} strokeWidth="1" strokeDasharray="4 6" />
      </g>
      {/* 藤蔓曲線·左 */}
      <g fill="none" stroke={c} strokeWidth="2" opacity="0.45">
        <path d="M 60 1000 C 120 820, 20 700, 140 560 C 220 460, 120 360, 190 240" />
        <path d="M 140 560 q 60 -20 70 -70" />
        <path d="M 190 240 q -50 -10 -60 -60" />
      </g>
      {/* 藤蔓曲線·右 */}
      <g fill="none" stroke={c} strokeWidth="2" opacity="0.45">
        <path d="M 940 1000 C 880 820, 980 700, 860 560 C 780 460, 880 360, 810 240" />
        <path d="M 860 560 q -60 -20 -70 -70" />
      </g>
      {/* 花卉 */}
      {[[200,720],[800,720],[500,860]].map(([cx,cy],i)=>(
        <g key={i} opacity="0.4" style={{ transformOrigin: `${cx}px ${cy}px` }} className={i%2?'spin-slow':'spin-rev'}>
          {Array.from({ length: 8 }).map((_, k) => {
            const a = (k/8)*Math.PI*2;
            return <ellipse key={k} cx={cx+Math.cos(a)*18} cy={cy+Math.sin(a)*18} rx="10" ry="22"
              fill={k%2?rose:'none'} stroke={c} strokeWidth="1.2"
              transform={`rotate(${(a*180/Math.PI)} ${cx+Math.cos(a)*18} ${cy+Math.sin(a)*18})`} />;
          })}
          <circle cx={cx} cy={cy} r="8" fill={c} />
        </g>
      ))}
    </svg>
  );
}

function MagicArt() {
  const c = 'var(--accent)';
  const am = 'var(--accent-2)';
  const cx = 500, cy = 500;
  const runes = ['M-6,-6 L6,6 M6,-6 L-6,6','M0,-7 L0,7 M-5,0 L5,0','M-6,-5 L6,-5 L0,6 Z','M-6,0 A6,6 0 1,0 6,0','M-6,-6 L6,-6 L6,6 L-6,6 Z'];
  return (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 1000">
      <g className="pulse-glow">
        <g className="spin-slow" style={{ transformOrigin: '500px 500px' }} fill="none" stroke={c} strokeWidth="1.5" opacity="0.55">
          <circle cx={cx} cy={cy} r="320" />
          <circle cx={cx} cy={cy} r="250" />
          {/* 外圈符文 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i/12)*Math.PI*2;
            const x = cx + Math.cos(a)*285, y = cy + Math.sin(a)*285;
            return <path key={i} d={runes[i%runes.length]} stroke={c} strokeWidth="1.5"
              transform={`translate(${x} ${y}) rotate(${a*180/Math.PI+90})`} />;
          })}
        </g>
        <g className="spin-rev" style={{ transformOrigin: '500px 500px' }} fill="none" stroke={am} strokeWidth="1.2" opacity="0.5">
          <circle cx={cx} cy={cy} r="180" />
          {/* 內部六芒星結構 */}
          {Array.from({ length: 6 }).map((_, i) => {
            const a1 = (i/6)*Math.PI*2, a2 = ((i+2)/6)*Math.PI*2;
            return <line key={i} x1={cx+Math.cos(a1)*180} y1={cy+Math.sin(a1)*180}
              x2={cx+Math.cos(a2)*180} y2={cy+Math.sin(a2)*180} />;
          })}
          <circle cx={cx} cy={cy} r="90" />
        </g>
      </g>
    </svg>
  );
}
