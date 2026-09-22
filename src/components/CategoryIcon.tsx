import { CalendarDays, Home, Sparkles, Tag } from "lucide-react";

export function CategoryIcon({ name, size = 17 }: { name: string; size?: number }) {
  const props = { size, strokeWidth: 1.8 };
  if (name === "Home") return <Home {...props} />;
  if (name === "CalendarDays") return <CalendarDays {...props} />;
  if (name === "Utensils") return <span style={{ fontSize: size - 1 }}>K</span>;
  if (name === "Leaf") return <Sparkles {...props} />;
  return <Tag {...props} />;
}
