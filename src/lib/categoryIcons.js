import {
  Cpu,
  Palette,
  Briefcase,
  Megaphone,
  Landmark,
  Scale,
  GraduationCap,
  Heart,
  Music,
  Camera,
  Mic2,
  PenTool,
  Globe,
  Users,
  Sparkles,
  Zap,
} from "lucide-react"

export const CATEGORY_ICONS = {
  cpu: Cpu,
  palette: Palette,
  briefcase: Briefcase,
  megaphone: Megaphone,
  landmark: Landmark,
  scale: Scale,
  graduation: GraduationCap,
  heart: Heart,
  music: Music,
  camera: Camera,
  mic: Mic2,
  pen: PenTool,
  globe: Globe,
  users: Users,
  sparkles: Sparkles,
  zap: Zap,
}

export function getCategoryIcon(key) {
  return CATEGORY_ICONS[key] || Sparkles
}
