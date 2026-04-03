"use client";

import { memo, useState, useCallback } from "react";
import { useDbStore } from "@/store";
import { CellRenderer } from "@/components/table/cell-renderer";
import { TextEditor } from "./text-editor";
import { NumberEditor } from "./number-editor";
import { SelectEditor } from "./select-editor";
import { MultiSelectEditor } from "./multi-select-editor";
import { DateEditor } from "./date-editor";
import { ContactEditor } from "./contact-editor";
import { ColorEditor } from "./color-editor";
import { JsonEditor } from "./json-editor";
import { LocationEditor } from "./location-editor";
import { CheckboxEditor } from "./checkbox-editor";
import { RefEditor } from "./ref-editor";
import { RefsEditor } from "./refs-editor";
import type { CellValue, FieldDef } from "@/store/types";

interface EditableCellProps {
  rowId: string;
  fieldDef: FieldDef;
  value: CellValue;
}

const POPOVER_TYPES = new Set([
  "rich_text",
  "select",
  "status",
  "multi_select",
  "tags",
  "date",
  "datetime",
  "color",
  "json",
  "ref",
  "refs",
]);

export const EditableCell = memo(function EditableCell({ rowId, fieldDef, value }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);

  const onSave = useCallback(
    (newValue: CellValue) => {
      useDbStore.getState().updateCell(rowId, fieldDef.name, newValue);
      setIsEditing(false);
    },
    [rowId, fieldDef.name]
  );

  const onCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  if (fieldDef.type === "checkbox") {
    return <CheckboxEditor value={value} onSave={onSave} />;
  }

  if (isEditing) {
    const editor = renderEditor(fieldDef, value, onSave, onCancel);
    if (editor) return editor;
  }

  const isPopoverType = POPOVER_TYPES.has(fieldDef.type);

  return (
    <div
      className="min-h-[24px] w-full cursor-pointer"
      onClick={() => setIsEditing(true)}
      role={isPopoverType ? "button" : undefined}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsEditing(true);
        }
      }}
    >
      <CellRenderer value={value} fieldDef={fieldDef} />
    </div>
  );
});

function renderEditor(
  fieldDef: FieldDef,
  value: CellValue,
  onSave: (v: CellValue) => void,
  onCancel: () => void
) {
  switch (fieldDef.type) {
    case "text":
      return <TextEditor value={value} onSave={onSave} onCancel={onCancel} />;
    case "rich_text":
      return (
        <TextEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          multiline
        />
      );
    case "number":
      return (
        <NumberEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          variant="number"
        />
      );
    case "currency":
      return (
        <NumberEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          variant="currency"
          currencyCode={fieldDef.currencyCode}
        />
      );
    case "percent":
      return (
        <NumberEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          variant="percent"
        />
      );
    case "select":
    case "status":
      return (
        <SelectEditor
          value={value}
          options={fieldDef.options}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case "multi_select":
    case "tags":
      return (
        <MultiSelectEditor
          value={value}
          options={fieldDef.options}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case "date":
      return (
        <DateEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          includeTime={false}
        />
      );
    case "datetime":
      return (
        <DateEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          includeTime
        />
      );
    case "email":
      return (
        <ContactEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          variant="email"
        />
      );
    case "phone":
      return (
        <ContactEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          variant="phone"
        />
      );
    case "url":
      return (
        <ContactEditor
          value={value}
          onSave={onSave}
          onCancel={onCancel}
          variant="url"
        />
      );
    case "color":
      return (
        <ColorEditor value={value} onSave={onSave} onCancel={onCancel} />
      );
    case "json":
      return (
        <JsonEditor value={value} onSave={onSave} onCancel={onCancel} />
      );
    case "location":
      return (
        <LocationEditor value={value} onSave={onSave} onCancel={onCancel} />
      );
    case "ref":
      return (
        <RefEditor
          value={value}
          refTable={fieldDef.refTable}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    case "refs":
      return (
        <RefsEditor
          value={value}
          refTable={fieldDef.refTable}
          onSave={onSave}
          onCancel={onCancel}
        />
      );
    default:
      return null;
  }
}
