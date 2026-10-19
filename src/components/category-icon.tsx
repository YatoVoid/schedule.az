import { createElement } from "react";
import {
  CalendarDaysIcon,
  DropletsIcon,
  FlowerIcon,
  ScissorsIcon,
  SparklesIcon,
  type LucideIcon,
} from "lucide-react";

// Store.category is free text typed by owners, so match on keywords rather
// than an enum. Anything unrecognised gets a plain calendar.
const RULES: [RegExp, LucideIcon][] = [
  [/barber|hair|bərbər|sac|saç/i, ScissorsIcon],
  [/nail|manik|dırnaq/i, SparklesIcon],
  [/spa|hammam|hamam|massage|masaj/i, DropletsIcon],
  [/beauty|salon|gözəllik|brow|lash|makeup/i, FlowerIcon],
];

export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const icon = RULES.find(([re]) => re.test(category))?.[1] ?? CalendarDaysIcon;
  return createElement(icon, { className, "aria-hidden": true });
}
