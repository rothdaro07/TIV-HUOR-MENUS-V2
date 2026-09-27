import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { Image as ImageIcon, ImageOff } from 'lucide-react';

interface ProductBagIllustrationProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showGranulesBadge?: boolean;
  className?: string;
}

export function isValidProductImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith('bag_')) return false;
  return (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:image') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/')
  );
}

export const ProductBagIllustration: React.FC<ProductBagIllustrationProps> = ({
  product,
  size = 'md',
  className = '',
}) => {
  const imageUrl = product?.imageUrl ? product.imageUrl.trim() : '';
  const hasValidImageUrl = isValidProductImageUrl(imageUrl);

  const [isImgLoading, setIsImgLoading] = useState<boolean>(hasValidImageUrl);
  const [hasImgError, setHasImgError] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const loadStartRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const valid = isValidProductImageUrl(imageUrl);
    if (!valid) {
      setIsImgLoading(false);
      setHasImgError(false);
      return;
    }

    loadStartRef.current = Date.now();
    setIsImgLoading(true);
    setHasImgError(false);

    // If image is already cached/complete in the browser, show brief skeleton then reveal image
    let cachedTimer: ReturnType<typeof setTimeout> | undefined;
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      cachedTimer = setTimeout(() => {
        setIsImgLoading(false);
      }, 280);
    }

    // Safety fallback so an uploaded image never stays hidden behind the skeleton
    const safetyTimer = setTimeout(() => {
      setIsImgLoading(false);
    }, 1000);

    return () => {
      if (cachedTimer) clearTimeout(cachedTimer);
      clearTimeout(safetyTimer);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [imageUrl]);

  const handleImageLoad = () => {
    const elapsed = Date.now() - loadStartRef.current;
    const remaining = Math.max(0, 260 - elapsed);
    if (remaining > 0) {
      timerRef.current = setTimeout(() => {
        setIsImgLoading(false);
      }, remaining);
    } else {
      setIsImgLoading(false);
    }
  };

  // 1. If product has a valid uploaded image URL -> Show Loading Skeleton then reveal the Product Image
  if (hasValidImageUrl && !hasImgError) {
    return (
      <div
        className={`relative flex items-center justify-center overflow-hidden w-full h-full bg-slate-50 ${className}`}
      >
        {/* Loading Skeleton while image is downloading */}
        {isImgLoading && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center z-10">
            <ImageIcon
              className={
                size === 'sm'
                  ? 'w-5 h-5 text-slate-300 stroke-[1.75]'
                  : size === 'lg' || size === 'hero'
                  ? 'w-12 h-12 text-slate-300 stroke-[1.5]'
                  : 'w-10 h-10 text-slate-300 stroke-[1.5]'
              }
            />
          </div>
        )}
        <img
          ref={imgRef}
          src={imageUrl}
          alt={product.nameKh || product.name || 'Product'}
          onLoad={handleImageLoad}
          onError={() => {
            setIsImgLoading(false);
            setHasImgError(true);
          }}
          className={`w-full h-full object-contain p-2 transition-all duration-300 group-hover:scale-105 ${
            isImgLoading ? 'opacity-0' : 'opacity-100'
          }`}
        />
      </div>
    );
  }

  // Clean "No Image" Icon Fallback (replaces all synthetic bag/machinery illustrations)
  if (size === 'sm') {
    return (
      <div
        className={`relative flex items-center justify-center w-full h-full bg-slate-100/80 text-slate-400 select-none ${className}`}
        title="គ្មានរូបភាព (No Image)"
      >
        <ImageOff className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 stroke-[1.75]" />
      </div>
    );
  }

  if (size === 'lg' || size === 'hero') {
    return (
      <div
        className={`relative flex flex-col items-center justify-center w-full h-full bg-slate-50 text-slate-400 select-none p-6 ${className}`}
      >
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-2xs">
          <ImageOff className="w-8 h-8 sm:w-10 sm:h-10 stroke-[1.5]" />
        </div>
        <span className="mt-2.5 text-xs sm:text-sm font-semibold text-slate-400 font-['Kantumruy_Pro']">
          គ្មានរូបភាព (No Image)
        </span>
      </div>
    );
  }

  // Default 'md' size (Product cards, Admin form preview)
  return (
    <div
      className={`relative flex flex-col items-center justify-center w-full h-full bg-slate-50 text-slate-400 select-none p-4 ${className}`}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-400 shadow-2xs">
        <ImageOff className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.5]" />
      </div>
      <span className="mt-2 text-[10px] sm:text-xs font-medium text-slate-400 font-['Kantumruy_Pro']">
        គ្មានរូបភាព
      </span>
    </div>
  );
};
