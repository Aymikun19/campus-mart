import { BedDouble, BookOpen, Laptop, Package, Shirt, Utensils, Wrench, type LucideIcon } from "lucide-react";

export const CATEGORY_ICON: Record<string, LucideIcon> = {
  books: BookOpen,
  electronics: Laptop,
  fashion: Shirt,
  hostel: BedDouble,
  food: Utensils,
  services: Wrench,
  other: Package,
};

export function CategoryIcon({ category, size = 16, className }: { category: string; size?: number; className?: string }) {
  const Icon = CATEGORY_ICON[category] ?? Package;
  return <Icon size={size} className={className} aria-hidden />;
}
