import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Link as LinkIcon, Loader2, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CornerFlourish from "@/components/corner-flourish";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toISO } from "@/lib/date-utils";
import { uploadCosplayPhoto, validatePhotoFile } from "@/lib/photo-storage";
import type { CosplayRecord, CosplayRecordInput } from "@/lib/record-types";
import ChineseDatePicker from "./chinese-date-picker";

function emptyInput(defaultType: string): CosplayRecordInput {
  return {
    date: toISO(new Date()),
    character: "",
    series: "",
    event: "",
    photographer: "",
    type: defaultType,
    note: "",
    photo: "",
    tags: [],
  };
}

export default function RecordForm({
  open,
  editing,
  onClose,
  onSubmit,
  userId,
  shootTypes,
  onAddShootType,
  typeColorMap,
}: {
  open: boolean;
  editing: CosplayRecord | null;
  onClose: () => void;
  onSubmit: (input: CosplayRecordInput) => Promise<void>;
  userId: string;
  shootTypes: string[];
  onAddShootType: (type: string) => void;
  typeColorMap: Record<string, string>;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CosplayRecordInput>(() => emptyInput(shootTypes[0] ?? "外拍"));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customType, setCustomType] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [urlOpen, setUrlOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      const { id: _id, ...rest } = editing;
      setForm({ ...rest });
    } else {
      setForm(emptyInput(shootTypes[0] ?? "外拍"));
    }

    setCustomOpen(false);
    setCustomType("");
    setTagInput("");
    setUrlOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const set = <K extends keyof CosplayRecordInput>(key: K, value: CosplayRecordInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  async function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const errorKey = validatePhotoFile(file);
    if (errorKey) {
      toast.error(t(errorKey));
      return;
    }

    try {
      setUploading(true);
      const url = await uploadCosplayPhoto(file, userId);
      set("photo", url);
    } catch {
      toast.error(t("form.error.photoRead"));
    } finally {
      setUploading(false);
    }
  }

  function confirmCustomType() {
    const value = customType.trim();
    if (!value) return;

    onAddShootType(value);
    set("type", value);
    setCustomOpen(false);
    setCustomType("");
  }

  function addTag() {
    const value = tagInput.trim().replace(/^#/, "");
    if (!value) return;

    setForm((current) =>
      current.tags.includes(value) ? current : { ...current, tags: [...current.tags, value] },
    );
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
  }

  async function submit() {
    if (!form.photo.trim()) {
      toast.error(t("form.error.photo"));
      return;
    }
    if (!form.character.trim()) {
      toast.error(t("form.error.character"));
      return;
    }
    if (!form.date) {
      toast.error(t("form.error.date"));
      return;
    }

    const payload: CosplayRecordInput = {
      ...form,
      character: form.character.trim(),
      series: form.series.trim(),
      event: form.event.trim(),
      photographer: form.photographer.trim(),
      note: form.note.trim(),
      tags: [...form.tags],
    };

    // 輸入框裡還沒按 Enter 的標籤也一併帶上
    const pending = tagInput.trim().replace(/^#/, "");
    if (pending && !payload.tags.includes(pending)) {
      payload.tags = [...payload.tags, pending];
    }

    try {
      setSaving(true);
      await onSubmit(payload);
      toast.success(t(editing ? "form.toast.updated" : "form.toast.added"));
      onClose();
    } catch (error) {
      console.error("儲存紀錄失敗：", error);
      toast.error(t("form.error.save"));
    } finally {
      setSaving(false);
    }
  }

  const fieldStyle = {
    background: "var(--surface)",
    borderColor: "var(--surface-border)",
    color: "var(--text)",
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto border-0"
        style={{ background: "var(--surface-solid)", border: "1px solid var(--surface-border)", color: "var(--text)" }}
      >
        <CornerFlourish position="tl" size={48} />
        <CornerFlourish position="br" size={48} />

        <DialogHeader>
          <DialogTitle className="font-serif-tc text-xl" style={{ color: "var(--accent)" }}>
            {t(editing ? "form.titleEdit" : "form.titleAdd")}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* 照片 */}
          <div>
            <Label className="mb-1.5 block text-sm">{t("form.photo")}</Label>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickFile} />

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full overflow-hidden rounded-xl transition-colors"
              style={{ border: "1px dashed var(--surface-border)" }}
            >
              {form.photo ? (
                <div className="relative aspect-[4/3]">
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${form.photo})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <span
                    className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full px-2 py-1 text-xs"
                    style={{ background: "var(--accent)", color: "var(--on-accent)" }}
                  >
                    <ImagePlus size={12} /> {t("form.photoReplace")}
                  </span>
                </div>
              ) : (
                <div className="text-muted-foreground flex aspect-[4/3] flex-col items-center justify-center gap-2">
                  {uploading ? (
                    <Loader2 size={28} className="animate-spin" style={{ color: "var(--accent)" }} />
                  ) : (
                    <ImagePlus size={28} style={{ color: "var(--accent)" }} />
                  )}
                  <span className="text-sm">{uploading ? t("common.loading") : t("form.photoUpload")}</span>
                </div>
              )}
            </button>

            {urlOpen ? (
              <Input
                value={form.photo}
                onChange={(event) => set("photo", event.target.value)}
                placeholder={t("form.photoUrlPlaceholder")}
                className="mt-2"
                style={fieldStyle}
              />
            ) : (
              <button
                type="button"
                onClick={() => setUrlOpen(true)}
                className="text-muted-foreground mt-2 flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
              >
                <LinkIcon size={12} /> {t("form.photoUrlPlaceholder")}
              </button>
            )}
          </div>

          {/* 日期 */}
          <div>
            <Label className="mb-1.5 block text-sm">{t("form.date")}</Label>
            <div className="rounded-xl" style={{ border: "1px solid var(--surface-border)" }}>
              <ChineseDatePicker value={form.date} onChange={(iso) => set("date", iso)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-sm">{t("form.character")}</Label>
              <Input
                value={form.character}
                onChange={(event) => set("character", event.target.value)}
                placeholder={t("form.characterPlaceholder")}
                style={fieldStyle}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">{t("form.photographer")}</Label>
              <Input
                value={form.photographer}
                onChange={(event) => set("photographer", event.target.value)}
                placeholder={t("form.photographerPlaceholder")}
                style={fieldStyle}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-sm">{t("form.series")}</Label>
              <Input
                value={form.series}
                onChange={(event) => set("series", event.target.value)}
                placeholder={t("form.seriesPlaceholder")}
                style={fieldStyle}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">{t("form.event")}</Label>
              <Input
                value={form.event}
                onChange={(event) => set("event", event.target.value)}
                placeholder={t("form.eventPlaceholder")}
                style={fieldStyle}
              />
            </div>
          </div>

          {/* 拍攝類型 */}
          <div>
            <Label className="mb-1.5 block text-sm">{t("form.type")}</Label>
            <div className="flex flex-wrap gap-2">
              {shootTypes.map((type) => {
                const active = form.type === type;
                const color = typeColorMap[type] || "var(--accent)";
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => set("type", type)}
                    className="rounded-full px-3 py-1 text-sm transition-colors"
                    style={
                      active
                        ? { background: color, color: "#fff", border: `1px solid ${color}` }
                        : { background: "transparent", color, border: `1px solid ${color}` }
                    }
                  >
                    {type}
                  </button>
                );
              })}

              {customOpen ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={customType}
                    onChange={(event) => setCustomType(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        confirmCustomType();
                      }
                    }}
                    placeholder={t("form.typeNew")}
                    className="h-8 w-24 rounded-full"
                    style={fieldStyle}
                  />
                  <button
                    type="button"
                    onClick={confirmCustomType}
                    aria-label={t("form.typeCustom")}
                    className="rounded-full p-1.5"
                    style={{ background: "var(--accent)", color: "var(--on-accent)" }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setCustomOpen(true)}
                  className="btn-ghost flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                >
                  <Plus size={13} /> {t("form.typeCustom")}
                </button>
              )}
            </div>
          </div>

          {/* 標籤 */}
          <div>
            <Label className="mb-1.5 block text-sm">{t("form.tags")}</Label>

            {form.tags.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {form.tags.map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full py-1 pl-3 pr-1.5 text-xs"
                    style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid var(--accent)" }}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full p-0.5 hover:bg-[var(--accent-2-soft)]"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addTag();
                  }
                }}
                placeholder={t("form.tagsPlaceholder")}
                className="rounded-full"
                style={fieldStyle}
              />
              <button
                type="button"
                onClick={addTag}
                className="btn-ghost flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm"
              >
                <Plus size={14} /> {t("form.tagsAdd")}
              </button>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-sm">{t("form.note")}</Label>
            <Textarea
              value={form.note}
              onChange={(event) => set("note", event.target.value)}
              rows={3}
              placeholder={t("form.notePlaceholder")}
              style={fieldStyle}
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost font-serif-tc flex-1 rounded-full px-4 py-2.5 text-sm"
            >
              {t("common.close")}
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving || uploading}
              className="btn-primary font-serif-tc flex-1 rounded-full px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {t(editing ? "form.saveEdit" : "form.saveAdd")}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
