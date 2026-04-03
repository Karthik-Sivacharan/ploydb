"use client";

import { useState } from "react";
import type { Column } from "@tanstack/react-table";
import {
  ArrowUp,
  ArrowDown,
  EyeOff,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDbStore } from "@/store";
import { FIELD_TYPE_CONFIG } from "@/lib/field-types";
import type { FieldDef, FieldType, Row } from "@/store/types";

interface ColumnHeaderMenuProps {
  column: Column<Row, unknown>;
  fieldName: string;
  fieldType: FieldType;
  fieldDef: FieldDef;
  children: React.ReactNode;
}

export function ColumnHeaderMenu({
  column,
  fieldName,
  fieldType,
  fieldDef,
  children,
}: ColumnHeaderMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(fieldDef.label);

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger render={<div className="w-full" />}>
          {children}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4} className="w-48">
          <SortItems column={column} onClose={() => setMenuOpen(false)} />
          <DropdownMenuSeparator />
          <HideItem column={column} onClose={() => setMenuOpen(false)} />
          <DropdownMenuSeparator />
          <RenameItem
            onSelect={() => {
              setMenuOpen(false);
              setRenameValue(fieldDef.label);
              setRenameOpen(true);
            }}
          />
          <DuplicateItem
            fieldDef={fieldDef}
            onClose={() => setMenuOpen(false)}
          />
          <DeleteItem
            onSelect={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        value={renameValue}
        onChange={setRenameValue}
        fieldName={fieldName}
        fieldType={fieldType}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        fieldName={fieldName}
        label={fieldDef.label}
      />
    </>
  );
}

/* ── Sort items ── */

function SortItems({
  column,
  onClose,
}: {
  column: Column<Row, unknown>;
  onClose: () => void;
}) {
  return (
    <>
      <DropdownMenuItem
        onSelect={() => {
          column.toggleSorting(false);
          onClose();
        }}
      >
        <ArrowUp className="size-4" />
        Sort ascending
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          column.toggleSorting(true);
          onClose();
        }}
      >
        <ArrowDown className="size-4" />
        Sort descending
      </DropdownMenuItem>
    </>
  );
}

/* ── Hide item ── */

function HideItem({
  column,
  onClose,
}: {
  column: Column<Row, unknown>;
  onClose: () => void;
}) {
  return (
    <DropdownMenuItem
      onSelect={() => {
        column.toggleVisibility(false);
        onClose();
      }}
    >
      <EyeOff className="size-4" />
      Hide column
    </DropdownMenuItem>
  );
}

/* ── Rename item ── */

function RenameItem({ onSelect }: { onSelect: () => void }) {
  return (
    <DropdownMenuItem onSelect={onSelect}>
      <Pencil className="size-4" />
      Rename column
    </DropdownMenuItem>
  );
}

/* ── Duplicate item ── */

function DuplicateItem({
  fieldDef,
  onClose,
}: {
  fieldDef: FieldDef;
  onClose: () => void;
}) {
  function handleDuplicate() {
    const store = useDbStore.getState();
    const newName = `${fieldDef.name}_copy`;
    const newFieldDef: FieldDef = {
      ...fieldDef,
      name: newName,
      label: `${fieldDef.label} (copy)`,
    };
    store.addColumn(newFieldDef);

    // Copy data from original column to new column
    const db = store.databases.find((d) => d.id === store.activeDbId);
    if (db) {
      for (const row of db.rows) {
        const val = row.data[fieldDef.name];
        if (val !== null && val !== undefined) {
          store.updateCell(row.id, newName, val);
        }
      }
    }
    onClose();
  }

  return (
    <DropdownMenuItem onSelect={handleDuplicate}>
      <Copy className="size-4" />
      Duplicate column
    </DropdownMenuItem>
  );
}

/* ── Delete item ── */

function DeleteItem({ onSelect }: { onSelect: () => void }) {
  return (
    <DropdownMenuItem variant="destructive" onSelect={onSelect}>
      <Trash2 className="size-4" />
      Delete column
    </DropdownMenuItem>
  );
}

/* ── Rename dialog ── */

function RenameDialog({
  open,
  onOpenChange,
  value,
  onChange,
  fieldName,
  fieldType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (v: string) => void;
  fieldName: string;
  fieldType: FieldType;
}) {
  const config = FIELD_TYPE_CONFIG[fieldType];
  const Icon = config.icon;

  function handleRename() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== fieldName) {
      useDbStore.getState().renameColumn(fieldName, trimmed);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="size-4" />
            Rename column
          </DialogTitle>
          <DialogDescription>
            Enter a new name for this column.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRename();
          }}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRename}>Rename</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Delete dialog ── */

function DeleteDialog({
  open,
  onOpenChange,
  fieldName,
  label,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fieldName: string;
  label: string;
}) {
  function handleDelete() {
    useDbStore.getState().removeColumn(fieldName);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete column</DialogTitle>
          <DialogDescription>
            Delete &ldquo;{label}&rdquo;? This will remove all data in this
            column. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
