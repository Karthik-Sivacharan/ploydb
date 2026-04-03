"use client";

import { useRef, useState, useEffect } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { CellValue, FieldDef, SelectOption } from "@/store/types";

interface CellRendererProps {
  value: CellValue;
  fieldDef: FieldDef;
}

export function CellRenderer({ value, fieldDef }: CellRendererProps) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground/50 select-none">&mdash;</span>;
  }

  switch (fieldDef.type) {
    case "text":
      return <TextCell value={String(value)} />;
    case "rich_text":
      return <TextCell value={String(value)} />;
    case "number":
      return <NumberCell value={Number(value)} />;
    case "currency":
      return <CurrencyCell value={Number(value)} code={fieldDef.currencyCode} />;
    case "percent":
      return <PercentCell value={Number(value)} />;
    case "select":
    case "status":
      return <SelectCell value={String(value)} options={fieldDef.options} />;
    case "multi_select":
    case "tags":
      return <MultiSelectCell values={value as string[]} options={fieldDef.options} />;
    case "date":
      return <DateCell value={String(value)} />;
    case "datetime":
      return <DateTimeCell value={String(value)} />;
    case "email":
      return <EmailCell value={String(value)} />;
    case "phone":
      return <PhoneCell value={String(value)} />;
    case "url":
      return <UrlCell value={String(value)} />;
    case "checkbox":
      return <CheckboxCell value={Boolean(value)} />;
    case "color":
      return <ColorCell value={String(value)} />;
    case "json":
      return <JsonCell />;
    case "location":
      return <LocationCell value={String(value)} />;
    case "ref":
      return <RefCell value={String(value)} />;
    case "refs":
      return <RefsCell values={value as string[]} />;
    default:
      return <span className="text-muted-foreground">{String(value)}</span>;
  }
}

function TextCell({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el) {
      setIsTruncated(el.scrollWidth > el.clientWidth);
    }
  }, [value]);

  const content = (
    <span ref={ref} className="block max-w-[200px] truncate">
      {value}
    </span>
  );

  if (!isTruncated) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild><span className="block max-w-[200px] truncate">{value}</span></TooltipTrigger>
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
  );
}

function NumberCell({ value }: { value: number }) {
  return (
    <span className="tabular-nums text-right block">
      {new Intl.NumberFormat("en-US").format(value)}
    </span>
  );
}

function CurrencyCell({ value, code }: { value: number; code?: string }) {
  return (
    <span className="tabular-nums text-right block">
      {new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code ?? "USD",
      }).format(value)}
    </span>
  );
}

function PercentCell({ value }: { value: number }) {
  return (
    <span className="tabular-nums text-right block">
      {new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(value / 100)}
    </span>
  );
}

function findOption(value: string, options?: SelectOption[]) {
  return options?.find((o) => o.value === value);
}

function SelectCell({
  value,
  options,
}: {
  value: string;
  options?: SelectOption[];
}) {
  const option = findOption(value, options);
  if (!option) {
    return <Badge variant="secondary">{value}</Badge>;
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: option.color + "20",
        color: option.color,
      }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: option.color }}
      />
      {option.label}
    </span>
  );
}

function MultiSelectCell({
  values,
  options,
}: {
  values: string[];
  options?: SelectOption[];
}) {
  if (!values.length) {
    return <span className="text-muted-foreground/50 select-none">&mdash;</span>;
  }

  const maxVisible = 2;
  const visible = values.slice(0, maxVisible);
  const remaining = values.length - maxVisible;

  return (
    <span className="flex items-center gap-1 overflow-hidden">
      {visible.map((v) => {
        const option = findOption(v, options);
        return (
          <span
            key={v}
            className="inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-xs font-medium"
            style={
              option
                ? { backgroundColor: option.color + "20", color: option.color }
                : undefined
            }
          >
            {option?.label ?? v}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="shrink-0 text-xs text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </span>
  );
}

function DateCell({ value }: { value: string }) {
  const formatted = formatDate(value);
  return <span className="whitespace-nowrap">{formatted}</span>;
}

function DateTimeCell({ value }: { value: string }) {
  const formatted = formatDateTime(value);
  return <span className="whitespace-nowrap">{formatted}</span>;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function EmailCell({ value }: { value: string }) {
  return (
    <a
      href={`mailto:${value}`}
      className="text-foreground hover:text-primary transition-colors"
    >
      {value}
    </a>
  );
}

function PhoneCell({ value }: { value: string }) {
  return (
    <a
      href={`tel:${value}`}
      className="text-foreground hover:text-primary transition-colors tabular-nums"
    >
      {value}
    </a>
  );
}

function UrlCell({ value }: { value: string }) {
  let domain = value;
  try {
    domain = new URL(value.startsWith("http") ? value : `https://${value}`).hostname;
  } catch {
    /* keep raw */
  }

  return (
    <a
      href={value.startsWith("http") ? value : `https://${value}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground hover:text-primary transition-colors"
    >
      {domain}
    </a>
  );
}

function CheckboxCell({ value }: { value: boolean }) {
  return <Checkbox checked={value} disabled className="pointer-events-none" />;
}

function ColorCell({ value }: { value: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className="size-4 rounded-full border border-border shrink-0"
        style={{ backgroundColor: value }}
      />
      <span className="text-xs text-muted-foreground">{value}</span>
    </span>
  );
}

function JsonCell() {
  return (
    <span className={cn("font-mono text-xs text-muted-foreground")}>
      {"{ ... }"}
    </span>
  );
}

function LocationCell({ value }: { value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate max-w-[180px]">{value}</span>
    </span>
  );
}

function RefCell({ value }: { value: string }) {
  return <Badge variant="secondary">{value}</Badge>;
}

function RefsCell({ values }: { values: string[] }) {
  if (!values.length) {
    return <span className="text-muted-foreground/50 select-none">&mdash;</span>;
  }
  const maxVisible = 2;
  const visible = values.slice(0, maxVisible);
  const remaining = values.length - maxVisible;

  return (
    <span className="flex items-center gap-1 overflow-hidden">
      {visible.map((v) => (
        <Badge key={v} variant="secondary" className="shrink-0">
          {v}
        </Badge>
      ))}
      {remaining > 0 && (
        <span className="shrink-0 text-xs text-muted-foreground">
          +{remaining} more
        </span>
      )}
    </span>
  );
}
