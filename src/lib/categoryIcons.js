import {
  Music,
  Shirt,
  Smartphone,
  Trophy,
  PartyPopper,
  Drum,
  Clapperboard,
  Mic2,
  Laugh,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react"

export const CATEGORY_ICONS = {
  music: Music,
  shirt: Shirt,
  smartphone: Smartphone,
  trophy: Trophy,
  party: PartyPopper,
  drum: Drum,
  clapperboard: Clapperboard,
  mic: Mic2,
  laugh: Laugh,
  sparkles: Sparkles,
  utensils: UtensilsCrossed,
}

export function getCategoryIcon(key) {
  return CATEGORY_ICONS[key] || Sparkles
}