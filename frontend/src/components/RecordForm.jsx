import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import ChineseDatePicker from './ChineseDatePicker';
import CornerFlourish from './CornerFlourish';
import { ImagePlus, Plus, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

const EMPTY = { photo: '', date: '2026-06-05', character: '', photographer: '', type: '外拍', note: '' };

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
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm(editing ? { ...editing } : EMPTY);
      setCustomOpen(false); setCustomType('');
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

  const submit = () => {
    if (!form.photo) return toast.error('請先上傳一張照片。');
    if (!form.character.trim()) return toast.error('請填寫角色名稱。');
    if (!form.date) return toast.error('請選擇日期。');
    if (editing) {
      updateRecord(editing.id, form);
      toast.success('已更新紀錄。');
    } else {
      addRecord(form);
      toast.success('已新增紀錄。');
    }
    onClose();
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
              className="w-full rounded-lg overflow-hidden transition-colors"
              style={{ border: '1px dashed var(--surface-border)' }}>
              {form.photo ? (
                <div className="relative aspect-[4/3]">
                  <div className="absolute inset-0" style={{ backgroundImage: `url(${form.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <span className="absolute bottom-2 right-2 text-xs rounded-md px-2 py-1 flex items-center gap-1"
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
            <div className="rounded-lg" style={{ border: '1px solid var(--surface-border)' }}>
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
                    placeholder="新類型" className="h-8 w-24"
                    style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)', color: 'var(--text)' }} />
                  <button type="button" onClick={confirmCustom} className="p-1.5 rounded-md" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
                    <Check size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm mb-1.5 block">備註</Label>
            <Textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={3} placeholder="寫下這次拍攝的回憶…"
              style={{ background: 'var(--surface)', borderColor: 'var(--surface-border)', color: 'var(--text)' }} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost rounded-lg px-4 py-2.5 text-sm flex-1">取消</button>
            <button type="button" onClick={submit} className="btn-primary rounded-lg px-4 py-2.5 text-sm font-medium flex-1">
              {editing ? '儲存變更' : '儲存紀錄'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
