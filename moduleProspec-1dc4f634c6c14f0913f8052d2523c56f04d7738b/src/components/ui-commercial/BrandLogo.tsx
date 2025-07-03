// src/components/ui-commercial/BrandLogo.tsx
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  imageSize?: number;
  variant?: 'full' | 'initials';
}

export const BrandLogo = ({
  className,
  showText = true,
  imageSize = 32,

}: BrandLogoProps) => {
  
  
  const mainFontSize = imageSize;
  const subFontSize = imageSize * 0.3;
  const arcWidth = mainFontSize * 0.67;
  const arcHeight = mainFontSize * 0.27;

  return (
    <div className={cn("flex flex-col items-center justify-center pt-[6px]", className)}>
      <div className="relative flex items-center justify-center leading-none">
        <h1 className="font-extrabold text-black" style={{ fontSize: mainFontSize, fontFamily: "Montserrat, sans-serif" }}>
          Groupe
        </h1>
        <svg className="absolute" width={arcWidth} height={arcHeight} viewBox="0 0 100 50" preserveAspectRatio="none" style={{ top: -arcHeight * -0.3, left: -arcWidth * -0.16 }}>
          <path d="M0,50 C30,0 70,0 100,50 L100,50 L0,50 Z" fill="hsl(var(--winvest-blue-moyen))" />
        </svg>
      </div>
      {showText && (
        <div className="flex items-center w-full mt-[4px]">
          <span className="flex-grow h-px bg-black/70" />
          <span className="mx-2 font-semibold text-black tracking-[0.25em]" style={{ fontSize: subFontSize, fontFamily: "Montserrat, sans-serif" }}>
            FINANSSOR
          </span>
          <span className="flex-grow h-px bg-black/70" />
        </div>
      )}
    </div>
  );
};