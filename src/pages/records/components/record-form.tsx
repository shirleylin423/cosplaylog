import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Hash, ImagePlus, Link as LinkIcon, Loader2, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CornerFlourish from "@/components/corner-flourish";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toISO } from "@/lib/date-utils";
import { counterpartLabelKey, counterpartPlaceholderKey, type UserRole } from "@/lib/roles";
import { uploadCosplayPhoto, validatePhotoFile } from "@/lib/photo-storage";
import type { CosplayRecord, CosplayRecordInput } from "@/lib/record-types";
import ChineseDatePicker from "./chinese-date-picker";

function emptyInput(defaultType: string, role: UserRole): CosplayRecordInput {
  return {
    role,
    date: toISO(new Date()),
    character: "",
    characterVersion: "",
    series: "",
    event: "",
    venue: "",
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
  tagOptions,
  recentTags,
  role,
}: {
  open: boolean;
  editing: CosplayRecord | null;
  onClose: () => void;
  onSubmit: (input: CosplayRecordInput) => Promise<void>;
  userId: string;
  shootTypes: string[];
  onAddShootType: (type: string) => void;
  typeColorMap: Record<string, string>;
  /** 所有用過的標籤（輸入時用來比對） */
  tagOptions: string[];
  /** 最近用過的標籤（表單上直接顯示，方便快速選） */
  recentTags: string[];
  /** 目前身分：決定「對方」欄位要填攝影師還是 coser */
  role: UserRole;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CosplayRecordInput>(() => emptyInput(shootTypes[0] ?? "外拍", role));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customType, setCustomType] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagInputFocused, setTagInputFocused] = useState(false);
  const [urlOpen, setUrlOpen] = useState(false);

  /** 輸入標籤時，比對用過的標籤（例如打「委」就跳出「委託」） */
  const tagSuggestions = useMemo(() => {
    const query = tagInput.trim().replace(/^#/, "").toLowerCase();

    if (!query) return [];

    const available = tagOptions.filter((tag) => !form.tags.includes(tag));
    // 開頭符合的排前面，再排「包含」的
    const startsWith = available.filter((tag) => tag.toLowerCase().startsWith(query));
    const contains = available.filter(
      (tag) => !tag.toLowerCase().startsWith(query) && tag.toLowerCase().includes(query),
    );

    return [...startsWith, ...contains].slice(0, 6);
  }, [tagInput, tagOptions, form.tags]);

  useEffect(() => {
    if (!open) return;

    if (editing) {
      const { id: _id, ...rest } = editing;
      setForm({ ...rest });
    } else {
      setForm(emptyInput(shootTypes[0] ?? "外拍", role));
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

      const result = await uploadCosplayPhoto(file, userId);
      set("photo", result.url);

      if (result.usedFallback) {
        toast.warning(t("form.warn.photoFallback", { reason: result.reason ?? "" }));
      }
    } catch (error) {
      console.error("照片上傳失敗：", error);

      const reason = error instanceof Error ? error.message : "";
      toast.error(reason ? t("form.error.photoUpload", { reason }) : t("form.error.photoRead"));
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

  function addTagValue(value: string) {
    const tag = value.trim().replace(/^#/, "");
    if (!tag) return;

    setForm((current) =>
      current.tags.includes(tag) ? current : { ...current, tags: [...current.tags, tag] },
    );
  }

  function addTag() {
    addTagValue(tagInput);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setForm((current) => ({ ...current, tags: current.tags.filter((item) => item !== tag) }));
  }

  async function submit() {
    // 除了日期（用來放進月曆，會自動帶入今天）以外，其他欄位都可以留空
    if (!form.date) {
      toast.error(t("form.error.date"));
      return;
    }

    const payload: CosplayRecordInput = {
      ...form,
      character: form.character.trim(),
      characterVersion: form.characterVersion.trim(),
      series: form.series.trim(),
      event: form.event.trim(),
      venue: form.venue.trim(),
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
              <Label className="mb-1.5 block text-sm">{t("form.characterVersion")}</Label>
              <Input
                value={form.characterVersion}
                onChange={(event) => set("characterVersion", event.target.value)}
                placeholder={t("form.characterVersionPlaceholder")}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 block text-sm">{t(counterpartLabelKey(role))}</Label>
              <Input
                value={form.photographer}
                onChange={(event) => set("photographer", event.target.value)}
                placeholder={t(counterpartPlaceholderKey(role))}
                style={fieldStyle}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">{t("form.venue")}</Label>
              <Input
                value={form.venue}
                onChange={(event) => set("venue", event.target.value)}
                placeholder={t("form.venuePlaceholder")}
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
              <div className="relative flex-1">
                <Input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onFocus={() => setTagInputFocused(true)}
                  onBlur={() => setTagInputFocused(false)}
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

                {/* 輸入時自動比對用過的標籤（例如打「委」就跳出「委託」） */}
                {tagInputFocused && tagSuggestions.length > 0 && (
                  <div
                    className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-xl"
                    style={{ background: "var(--surface-solid)", border: "1px solid var(--surface-border)" }}
                  >
                    {tagSuggestions.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          addTagValue(tag);
                          setTagInput("");
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--accent-soft)]"
                        style={{ color: "var(--text)" }}
                      >
                        <Hash size={13} style={{ color: "var(--accent)" }} />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={addTag}
                className="btn-ghost flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-sm"
              >
                <Plus size={14} /> {t("form.tagsAdd")}
              </button>
            </div>

            {/* 最近用過的標籤：點一下就能加入 */}
            {recentTags.length > 0 && (
              <div className="mt-3">
                <div className="text-muted-foreground mb-1.5 text-xs">{t("form.tagsUsed")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {recentTags.map((tag) => {
                    const active = form.tags.includes(tag);

                    return (
                      <button
                        key={tag}
                        type="button"
                        disabled={active}
                        onClick={() => addTagValue(tag)}
                        className="rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-40"
                        style={
                          active
                            ? {
                                background: "var(--accent-soft)",
                                color: "var(--accent)",
                                borderColor: "var(--accent)",
                              }
                            : {
                                color: "var(--text-muted)",
                                borderColor: "var(--surface-border)",
                              }
                        }
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
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
