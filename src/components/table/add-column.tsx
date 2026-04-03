"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FIELD_TYPE_CONFIG } from "@/lib/field-types";
import { FIELD_TYPES, type FieldType } from "@/store/types";
import { useDbStore } from "@/store";

export function AddColumn() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedType, setSelectedType] = useState<FieldType>("text");

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;

    const config = FIELD_TYPE_CONFIG[selectedType];
    const fieldName = trimmed.toLowerCase().replace(/\s+/g, "_");

    useDbStore.getState().addColumn({
      name: fieldName,
      type: selectedType,
      label: trimmed,
      defaultValue: config.defaultValue,
    });

    setName("");
    setSelectedType("text");
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-label="Add column"
          />
        }
      >
        <Plus className="size-4" />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={4} className="w-72">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="col-name">Column name</Label>
            <Input
              id="col-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priority"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label>Field type</Label>
            <FieldTypeGrid
              selected={selectedType}
              onSelect={setSelectedType}
            />
          </div>

          <Button onClick={handleAdd} className="w-full" disabled={!name.trim()}>
            Add column
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FieldTypeGrid({
  selected,
  onSelect,
}: {
  selected: FieldType;
  onSelect: (t: FieldType) => void;
}) {
  return (
    <ScrollArea className="h-48">
      <div className="grid grid-cols-2 gap-1">
        {FIELD_TYPES.map((type) => {
          const config = FIELD_TYPE_CONFIG[type];
          const Icon = config.icon;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                selected === type && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{config.label}</span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
