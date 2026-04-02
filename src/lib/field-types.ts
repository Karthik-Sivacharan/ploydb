import {
  Type,
  Hash,
  DollarSign,
  Percent,
  List,
  ListChecks,
  CircleDot,
  Tags,
  Calendar,
  CalendarClock,
  Mail,
  Phone,
  Link,
  Palette,
  Braces,
  MapPin,
  CheckSquare,
  ExternalLink,
  Network,
  FileText,
  type LucideIcon,
} from "lucide-react";
import type { FieldType } from "@/store/types";

export interface FieldTypeConfig {
  icon: LucideIcon;
  label: string;
  defaultValue: unknown;
}

export const FIELD_TYPE_CONFIG: Record<FieldType, FieldTypeConfig> = {
  text: { icon: Type, label: "Text", defaultValue: "" },
  rich_text: { icon: FileText, label: "Rich Text", defaultValue: "" },
  number: { icon: Hash, label: "Number", defaultValue: null },
  currency: { icon: DollarSign, label: "Currency", defaultValue: null },
  percent: { icon: Percent, label: "Percent", defaultValue: null },
  select: { icon: List, label: "Select", defaultValue: null },
  multi_select: { icon: ListChecks, label: "Multi Select", defaultValue: [] },
  status: { icon: CircleDot, label: "Status", defaultValue: null },
  tags: { icon: Tags, label: "Tags", defaultValue: [] },
  date: { icon: Calendar, label: "Date", defaultValue: null },
  datetime: { icon: CalendarClock, label: "Date & Time", defaultValue: null },
  email: { icon: Mail, label: "Email", defaultValue: "" },
  phone: { icon: Phone, label: "Phone", defaultValue: "" },
  url: { icon: Link, label: "URL", defaultValue: "" },
  color: { icon: Palette, label: "Color", defaultValue: null },
  json: { icon: Braces, label: "JSON", defaultValue: null },
  location: { icon: MapPin, label: "Location", defaultValue: "" },
  checkbox: { icon: CheckSquare, label: "Checkbox", defaultValue: false },
  ref: { icon: ExternalLink, label: "Reference", defaultValue: null },
  refs: { icon: Network, label: "References", defaultValue: [] },
};
