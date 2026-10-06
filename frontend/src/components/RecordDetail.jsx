import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import CornerFlourish from './CornerFlourish';
import { Pencil, Trash2, Aperture, User, Tag, CalendarDays } from 'lucide-react';
import { formatFull } from '../utils/dateUtils';
import { useApp } from '../context/AppContext';
import { toast } from 'sonner';

export default function RecordDetail({ record, onClose, onEdit }) {
  const { deleteRecord, typeColorMap } = useApp();
  const [confirm, setConfirm] = useState(false);
  if (!record) return null;
  const color = typeColorMap[record.type] || 'var(--accent)';

  const doDelete = () => {
    deleteRecord(record.id);
    setConfirm(false);
    onClose();
    toast.success('已刪除紀錄。');
  };

  const Row = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-2 text-sm">
      <Icon size={15} style={{ color }} />
      <span className="text-muted w-16">{label}</span>
      <span style={{ color: 'var(--text)' }}>{value || '—'}</span>
    </div>
  );

  return (
    <>
      <Dialog open={!!record} onOpenChange={(o) => !o && onClose()}>
        <DialogContent
          className="max-w-lg border-0 p-0 overflow-hidden max-h-[90vh] overflow-y-auto"
          style={{ background: 'var(--surface-solid)', border: '1px solid var(--surface-border)', color: 'var(--text)' }}
        >
          <div className="relative">
            <div className="aspect-[4/3] w-full" style={{ backgroundImage: `url(${record.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <span className="absolute top-3 left-3 text-xs rounded-full px-3 py-1 font-medium"
              style={{ background: color, color: '#fff' }}>{record.type}</span>
          </div>
          <div className="relative p-5">
            <CornerFlourish position="bl" size={46} />
            <CornerFlourish position="br" size={46} />
            <h3 className="font-serif-tc text-2xl font-bold mb-3" style={{ color: 'var(--accent)' }}>{record.character}</h3>
            <div className="space-y-2 mb-4">
              <Row icon={CalendarDays} label="日期" value={formatFull(record.date)} />
              <Row icon={Aperture} label="攝影師" value={record.photographer} />
              <Row icon={Tag} label="類型" value={record.type} />
            </div>
            {record.note && (
              <div className="rounded-lg p-3 text-sm leading-relaxed" style={{ background: 'var(--accent-soft)', color: 'var(--text)' }}>
                {record.note}
              </div>
            )}
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={() => onEdit(record)} className="btn-ghost rounded-lg px-4 py-2.5 text-sm flex-1 flex items-center justify-center gap-1.5">
                <Pencil size={15} /> 編輯
              </button>
              <button type="button" onClick={() => setConfirm(true)}
                className="rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-1.5 transition-colors"
                style={{ background: 'var(--accent-2-soft)', color: 'var(--accent-2)', border: '1px solid var(--accent-2)' }}>
                <Trash2 size={15} /> 刪除
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent style={{ background: 'var(--surface-solid)', border: '1px solid var(--surface-border)', color: 'var(--text)' }}>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif-tc" style={{ color: 'var(--text)' }}>確定要刪除這筆紀錄？</AlertDialogTitle>
            <AlertDialogDescription className="text-muted">
              刪除後無法復原。「{record.character}」（{formatFull(record.date)}）將永久移除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="btn-ghost border-0">取消</AlertDialogCancel>
            <AlertDialogAction onClick={doDelete} style={{ background: 'var(--accent-2)', color: '#fff' }}>確定刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
