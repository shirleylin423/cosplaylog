// 範例 Cosplay 紀錄與預設設定（純前端，儲存於瀏覽器 localStorage）

export const DEFAULT_SHOOT_TYPES = ['外拍', '棚拍', '活動', '同人場', '自拍'];

const IMG = [
  'https://images.unsplash.com/photo-1655753842861-bc0f280a8f51?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwyfHxjb3NwbGF5JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzkxMjk2Mjc2fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1658435389571-8284df9dd20a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwzfHxjb3NwbGF5JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzkxMjk2Mjc2fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1574955245353-db597db70666?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHw0fHxjb3NwbGF5JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzkxMjk2Mjc2fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1514488034139-5905ab173d22?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxjb3NwbGF5JTIwcG9ydHJhaXR8ZW58MHx8fHwxNzkxMjk2Mjc2fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1783942273058-f987d29037ad?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwxfHxjb3N0dW1lJTIwcGhvdG9ncmFwaHl8ZW58MHx8fHwxNzkxMjk2Mjc2fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1749725583274-a50172d3bdec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxjb3N0dW1lJTIwcGhvdG9ncmFwaHl8ZW58MHx8fHwxNzkxMjk2Mjc2fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1762115194031-b384d5595655?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwyfHxjb3N0dW1lJTIwcGhvdG9ncmFwaHl8ZW58MHx8fHwxNzkxMjk2Mjc2fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1765606290905-b9d377ea4d5e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxmYW50YXN5JTIwY2hhcmFjdGVyfGVufDB8fHx8MTc5MTI5NjI3Nnww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1773432661163-351c473345e5?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwY2hhcmFjdGVyfGVufDB8fHx8MTc5MTI5NjI3Nnww&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1783672087589-82e069ffa28d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwzfHxmYW50YXN5JTIwY2hhcmFjdGVyfGVufDB8fHx8MTc5MTI5NjI3Nnww&ixlib=rb-4.1.0&q=85',
];

export const SAMPLE_RECORDS = [
  { id: 'r1', date: '2026-01-12', character: '星穹卑女', photographer: '雨野', type: '棚拍', note: '冬季棚拍首發，藍紫調燈光。', photo: IMG[0] },
  { id: 'r2', date: '2026-02-20', character: '白夜騎士', photographer: '小熲', type: '外拍', note: '雪景外拍，成品超出預期！', photo: IMG[1] },
  { id: 'r3', date: '2026-02-21', character: '花之神子', photographer: '雨野', type: '外拍', note: '與雨野的第二次合作。', photo: IMG[2] },
  { id: 'r4', date: '2026-03-08', character: '月下巫女', photographer: 'Kai', type: '活動', note: '春季同人場排隊合照。', photo: IMG[3] },
  { id: 'r5', date: '2026-04-15', character: '玄武將軍', photographer: '小熲', type: '棚拍', note: '重裝甲，布景調整花了三小時。', photo: IMG[4] },
  { id: 'r6', date: '2026-05-03', character: '樱之姫', photographer: '雨野', type: '外拍', note: '樱花季外拍，人超多。', photo: IMG[5] },
  { id: 'r7', date: '2026-06-05', character: '深海歌姬', photographer: 'Kai', type: '棚拍', note: '藍調水下感棚拍。', photo: IMG[6] },
  { id: 'r8', date: '2026-06-06', character: '星穹卑女', photographer: '小熲', type: '同人場', note: 'FF 摂影，跳姿大成功。', photo: IMG[7] },
  { id: 'r9', date: '2026-06-20', character: '疾風劇團', photographer: '雨野', type: '活動', note: '與團進行團拍。', photo: IMG[8] },
  { id: 'r10', date: '2026-07-11', character: '花之神子', photographer: 'Kai', type: '外拍', note: '夏日渽林外拍。', photo: IMG[9] },
  { id: 'r11', date: '2026-09-14', character: '月下巫女', photographer: '雨野', type: '自拍', note: '在家試妆自拍記錄。', photo: IMG[0] },
  { id: 'r12', date: '2026-11-22', character: '白夜騎士', photographer: '小熲', type: '棚拍', note: '年度收尾重在。', photo: IMG[1] },
];
