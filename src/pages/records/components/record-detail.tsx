import { useState } from "react";
import { Aperture, CalendarDays, Pencil, Tag, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CornerFlourish from "@/components/corner-flourish";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatFull } from "@/lib/date-utils";
import type { CosplayRecord } from "@/lib/record-types";

export default function RecordDetail({
  record,
  onClose,
  onEdit,
  onTagClick,
  onDelete,
  typeColorMap,
}: {
  record: CosplayRecord | null;
  onClose: () => void;
  onEdit: (record: CosplayRecord) => void;
  onTagClick: (tag: string) => void;
  onDelete: (id: string) => Promise<void>;
  typeColorMap: Record<string, string>;
}) {
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!record) return null;

  const color = typeColorMap[record.type] || "var(--accent)";

  async function handleDelete() {
    if (!record) return;

    try {
      setDeleting(true);
      await onDelete(record.id);
      toast.success(t("detail.toastDeleted"));
      setConfirmOpen(false);
      onClose();
    } catch (error) {
      console.error("刪除紀錄失敗：", error);
      toast.error(t("detail.errorDelete"));
    } finally {
      setDeleting(false);
    }
  }

  function Row({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Icon size={15} style={{ color }} />
        <span className="text-muted-foreground w-16">{label}</span>
        <span style={{ color: "var(--text)" }}>{value || "—"}</span>
      </div>
    );
  }

  return (
    <>
      <Dialog open={Boolean(record)} onOpenChange={(open) => !open && onClose()}>
        <DialogContent
          className="max-h-[90vh] max-w-lg overflow-y-auto border-0 p-0"
          style={{ background: "var(--surface-solid)", border: "1px solid var(--surface-border)", color: "var(--text)" }}
        >
          <div className="relative">
            {record.photo ? (
              <div
                className="aspect-[4/3] w-full"
                style={{
                  backgroundImage: `url(${record.photo})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />
            ) : (
              <div
                className="flex aspect-[4/3] w-full items-center justify-center"
                style={{ background: "var(--accent-soft)" }}
              >
                <Aperture size={36} style={{ color }} />
              </div>
            )}

            <span
              className="absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium"
              style={{ background: color, color: "#fff" }}
            >
              {record.type}
            </span>
          </div>

          <div className="relative p-5">
            <CornerFlourish position="bl" size={46} />
            <CornerFlourish position="br" size={46} />

            <h3 className="font-serif-tc mb-3 text-2xl font-bold" style={{ color: "var(--accent)" }}>
              {record.character}
            </h3>

            <div className="mb-4 space-y-2">
              <Row icon={CalendarDays} label={t("detail.date")} value={formatFull(record.date)} />
              <Row icon={Tag} label={t("detail.characterVersion")} value={record.characterVersion} />
              <Row icon={Tag} label={t("detail.series")} value={record.series} />
              <Row icon={Tag} label={t("detail.event")} value={record.event} />
              <Row icon={Tag} label={t("detail.venue")} value={record.venue} />
              <Row icon={Aperture} label={t("detail.photographer")} value={record.photographer} />
              <Row icon={Users} label={t("detail.type")} value={record.type} />
            </div>

            {record.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {record.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onTagClick(tag)}
                    className="rounded-full px-3 py-1 text-xs transition-transform hover:-translate-y-0.5"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}

            {record.note && (
              <div
                className="rounded-xl p-3 text-sm leading-relaxed"
                style={{ background: "var(--accent-soft)", color: "var(--text)" }}
              >
                {record.note}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => onEdit(record)}
                className="btn-ghost font-serif-tc flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm"
              >
                <Pencil size={15} /> {t("common.edit")}
              </button>

              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="font-serif-tc flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm transition-colors"
                style={{ background: "var(--accent-2-soft)", color: "var(--accent-2)", border: "1px solid var(--accent-2)" }}
              >
                <Trash2 size={15} /> {t("common.delete")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent
          style={{ background: "var(--surface-solid)", border: "1px solid var(--surface-border)", color: "var(--text)" }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif-tc" style={{ color: "var(--text)" }}>
              {t("detail.deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              {t("detail.deleteDesc", { character: record.character, date: formatFull(record.date) })}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="btn-ghost font-serif-tc rounded-full border-0">
              {t("common.close")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="font-serif-tc rounded-full"
              style={{ background: "var(--accent-2)", color: "#fff" }}
            >
              {t("detail.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
