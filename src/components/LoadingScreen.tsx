import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Sprout } from 'lucide-react';
import { CompanyProfile } from '../types';

interface LoadingScreenProps {
  isLoading: boolean;
  companyProfile: CompanyProfile;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading, companyProfile }) => {
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isLoading) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const jump = Math.floor(Math.random() * 15) + 8;
        return Math.min(prev + jump, 90);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.45, ease: 'easeInOut' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-[#0B2545] to-slate-950 text-white select-none px-6 font-['Battambang'] overflow-hidden"
        >
          {/* Subtle Ambient Light Glows */}
          <div className="absolute w-72 h-72 rounded-full bg-blue-500/15 blur-3xl -top-10 -left-10 pointer-events-none" />
          <div className="absolute w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl -bottom-10 -right-10 pointer-events-none" />
          <div className="absolute w-96 h-96 rounded-full bg-[#1E5FA8]/20 blur-3xl top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

          {/* Center Card Content */}
          <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
            {/* Logo Badge Container with Pulsing Ring */}
            <div className="relative mb-6">
              {/* Outer pulsing ring */}
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -inset-2.5 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 opacity-40 blur-sm"
              />

              {/* Logo Frame */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white p-1.5 shadow-2xl ring-4 ring-white/20 overflow-hidden flex items-center justify-center"
              >
                {companyProfile.logoUrl ? (
                  <img
                    src={companyProfile.logoUrl}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#1E5FA8] to-[#124278] text-white flex flex-col items-center justify-center shadow-inner">
                    <span className="font-extrabold text-2xl tracking-tighter">
                      {companyProfile.logoText || 'TH'}
                    </span>
                    <span className="text-[9px] tracking-widest uppercase font-semibold text-blue-200 mt-0.5">
                      FERTILIZER
                    </span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Company / Brand Name */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="space-y-1.5 mb-6"
            >
              <h1 className="text-xl sm:text-2xl font-black tracking-wide text-white drop-shadow-md">
                {companyProfile.nameKh || companyProfile.brandName || 'ក្រុមហ៊ុន ទីវ ហៃ'}
              </h1>
              {companyProfile.nameEn && (
                <p className="text-xs sm:text-sm font-semibold tracking-wider text-blue-300/90 uppercase font-sans">
                  {companyProfile.nameEn}
                </p>
              )}
              {companyProfile.brandSlogan && (
                <div className="pt-1 flex items-center justify-center gap-1.5 text-xs text-emerald-300/90 font-['Kantumruy_Pro']">
                  <Sprout className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{companyProfile.brandSlogan}</span>
                </div>
              )}
            </motion.div>

            {/* Loading Progress Bar & Khmer Loading Indicator */}
            <div className="w-full max-w-xs space-y-3 font-['Kantumruy_Pro']">
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-white/10 p-[1px] shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-400 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.2 }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium">
                <span className="flex items-center gap-1.5">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    className="inline-block"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  </motion.span>
                  កំពុងផ្ទុកកាតាឡុកទំនិញ...
                </span>
                <span className="font-mono text-slate-400">{progress}%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
