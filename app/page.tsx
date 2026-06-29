import { HeroSection } from "@/components/HeroSection";
import { getRestorePriceRub } from "@/lib/config";

export default function HomePage() {
  return <HeroSection priceRub={getRestorePriceRub()} />;
}
