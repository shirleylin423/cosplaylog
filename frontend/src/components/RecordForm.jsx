import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import ChineseDatePicker from './ChineseDatePicker';
import CornerFlourish from './CornerFlourish';
import { ImagePlus, Plus, Check, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

const EMPTY = { photo: '', date: '2026-06-05', character: '', photographer: '', type: '外拍', note: '', tags: [] };

// 將圖片縮小為 dataURL（最大邊 1000px）以節省本機儲存
function fileToResizedDataUrl(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > max || height > max) {
          const s = max / Math.max(width, height);
          width = Math.round(width * s); height = Math.round(height * s);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RecordForm({ open, onClose, editing }) {
  const { addRecord, updateRecord, shootTypes, addShootType, typeColorMap } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [customOpen, setCustomOpen] = useState(false);
  const [customType, setCustomType] = useState('');
  const [tagInput, setTagInput] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(editing ? { tags: [], ...editing } : EMPTY);
      setCustomOpen(false); setCustomType(''); setTagInput('');
    }
  }, [open, editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToResizedDataUrl(file);
      set('photo', url);
    } catch {
      toast.error('照片讀取失敗，請再試一次。');
    }
  };

  const confirmCustom = () => {
    const v = customType.trim();
    if (!v) return;
    addShootType(v);
    set('type', v);
    setCustomOpen(false); setCustomType('');
  };

  const addTag = () => {
    const v = tagInput.trim().replace(/^#/, '');
    if (!v) return;
    setForm((f) => (f.tags.includes(v) ? f : { ...f, tags: [...f.tags, v] }));
    setTagInput('');
  };
  const removeTag = (t) => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }));

  const submit = async () => {
  if (!form.photo) {
    return toast.error('請先上傳一張照片。');
  }

  if (!form.character.trim()) {
    return toast.error('請填寫角色名稱。');
  }

  if (!form.date) {
    return toast.error('請選擇日期。');
  }

  const payload = {
    ...form,
    character: form.character.trim(),
    photographer: form.photographer.trim(),
    note: form.note.trim(),
    tags: [...(form.tags || [])],
  };

  // 若輸入框還有未確認的標籤，一併加入
  const pending =
    tagInput.trim().replace(/^#/, '');

  if (
    pending &&
    !payload.tags.includes(pending)
  ) {
    payload.tags = [
      ...payload.tags,
      pending,
    ];
  }

  try {
    if (editing) {
      await updateRecord(
        editing.id,
        payload
      );

      toast.success(
        '已更新紀錄。'
      );
    } else {
      await addRecord(payload);

      toast.success(
        '已新增紀錄。'
      );
    }

    onClose();

  } catch (error) {
    console.error(
      'Save record failed:',
      error
    );

    toast.error(
      error?.message ||
      '儲存失敗，請稍後再試。'
    );
  }
};


  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg border-0 max-h-[90vh] overflow-y-auto"
        style={{ background: 'var(--surface-solid)', border: '1px solid var(--surface-border)', color: 'var(--text)' }}
      >
        <CornerFlourish position="tl" size={48} />
        <CornerFlourish position="br" size={48} />
        <DialogHeader>
          <DialogTitle className="font-serif-tc text-xl" style={{ color: 'var(--accent)' }}>
            {editing ? '編輯紀錄' : '新增紀錄'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* 照片 */}
          <div>
            <Label className="text-sm mb-1.5 block">照片</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl overflow-hidden transition-colors"
              style={{ border: '1px dashed var(--surface-border)' }}>
              {form.photo ? (
                <div className="relative aspect-[4/3]">
                  <div className="absolute inset-0" style={{ backgroundImage: `url(${form.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <span className="absolute bottom-2 right-2 text-xs rounded-full px-2 py-1 flex items-center gap-1"
                    style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}><ImagePlus size={12} /> 更換</span>
                </div>
              ) : (
                <div className="aspect-[4/3] flex flex-col items-center justify-center gap-2 text-muted">
                  <ImagePlus size={28} style={{ color: 'var(--accent)' }} />
                  <span className="text-sm">點擊上傳一張照片</span>
                </div>
              )}
            </button>
          </div>

          {/* 日期 */}
          <div>
            <Label className="text-sm mb-1.5 block">日期</Label>
            <div className="rounded-xl" style={{ border: '1px solid var(--surface-border)' }}>
              <ChineseDatePicker value={form.date} onChange={(iso) => set('date', iso)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm mb-1.5 block">角色</Label>
              <Input value={form.character} onChange={(e) => set('character', e.target.value)} placeholder="例：星穹卑女"
                style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)', color: 'var(--text)' }} />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">攝影師</Label>
              <Input value={form.photographer} onChange={(e) => set('photographer', e.target.value)} placeholder="例：雨野"
                style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)', color: 'var(--text)' }} />
            </div>
          </div>

          {/* 拍攝類型 */}
          <div>
            <Label className="text-sm mb-1.5 block">拍攝類型</Label>
            <div className="flex flex-wrap gap-2">
              {shootTypes.map((t) => {
                const active = form.type === t;
                const color = typeColorMap[t] || 'var(--accent)';
                return (
                  <button key={t} type="button" onClick={() => set('type', t)}
                    className="text-sm rounded-full px-3 py-1 transition-colors"
                    style={active
                      ? { background: color, color: '#fff', border: `1px solid ${color}` }
                      : { background: 'transparent', color, border: `1px solid ${color}` }}>
                    {t}
                  </button>
                );
              })}
              {!customOpen ? (
                <button type="button" onClick={() => setCustomOpen(true)}
                  className="text-sm rounded-full px-3 py-1 flex items-center gap-1 btn-ghost">
                  <Plus size={13} /> 自訂
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <Input autoFocus value={customType} onChange={(e) => setCustomType(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), confirmCustom())}
                    placeholder="新類型" className="h-8 w-24 rounded-full"
                    style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)', color: 'var(--text)' }} />
                  <button type="button" onClick={confirmCustom} className="p-1.5 rounded-full" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                    <Check size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 標籤 */}
          <div>
            <Label className="text-sm mb-1.5 block">標籤</Label>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.tags.map((t) => (
                  <span key={t} className="text-xs rounded-full pl-3 pr-1.5 py-1 flex items-center gap-1"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                    #{t}
                    <button type="button" onClick={() => removeTag(t)} className="rounded-full p-0.5 hover:bg-[var(--accent-2-soft)]">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addTag())}
                placeholder="輸入標籤後按 Enter（例：夏季、黑長直）"
                className="rounded-full"
                style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)', color: 'var(--text)' }} />
              <button type="button" onClick={addTag} className="btn-ghost rounded-full px-3 py-2 text-sm flex items-center gap-1 whitespace-nowrap">
                <Plus size={14} /> 加入
              </button>
            </div>
          </div>

          <div>
            <Label className="text-sm mb-1.5 block">備註</Label>
            <Textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={3} placeholder="寫下這次拍攝的回憶…"
              style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)', color: 'var(--text)' }} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost rounded-full px-4 py-2.5 text-sm flex-1">取消</button>
            <button type="button" onClick={submit} className="btn-primary rounded-full px-4 py-2.5 text-sm font-medium flex-1">
              {editing ? '儲存變更' : '儲存紀錄'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
