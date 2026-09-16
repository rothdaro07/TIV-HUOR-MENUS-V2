import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';
import { CompanyProfile } from '../types';

interface InstallPwaPromptProps {
  companyProfile: CompanyProfile;
}

export const InstallPwaPrompt: React.FC<InstallPwaPromptProps> = ({ companyProfile }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already running as standalone PWA
    const isAppStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isAppStandalone);
    if (isAppStandalone) return;

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if dismissed before
    const dismissed = localStorage.getItem('tivhuor_pwa_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 1000 * 60 * 60 * 24 * 7) {
      // Dismissed within last 7 days
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show after 3 seconds if not standalone
    if (isIosDevice && !isAppStandalone) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      setShowIOSModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('tivhuor_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <>
      {/* Floating Install Bar at bottom */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-white/20 flex items-center gap-3">
          {/* Company App Icon (Live company logo or monogram) */}
          <div className="w-12 h-12 rounded-xl bg-white shrink-0 flex items-center justify-center overflow-hidden shadow-md border border-white/30">
            {companyProfile.logoUrl ? (
              <img
                src={companyProfile.logoUrl}
                alt={companyProfile.brandName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#1E5FA8] text-white rounded-lg flex items-center justify-center font-black text-sm">
                {companyProfile.logoText || 'TH'}
              </div>
            )}
          </div>

          {/* App Info */}
          <div className="flex-1 min-w-0 font-['Battambang']">
            <h4 className="text-xs font-bold text-white leading-tight truncate">
              {companyProfile.brandName || 'ទីវ ហៃ TIV HAI'}
            </h4>
            <p className="text-[10px] text-slate-300 font-['Kantumruy_Pro'] leading-tight mt-0.5">
              ដំឡើងកម្មវិធីលើទូរសព្ទ (Add to Home Screen)
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-xl text-xs font-bold font-['Kantumruy_Pro'] flex items-center gap-1 shadow-md transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ដំឡើង</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="បិទ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200 font-['Kantumruy_Pro']">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200 shadow-2xs overflow-hidden shrink-0">
                  {companyProfile.logoUrl ? (
                    <img
                      src={companyProfile.logoUrl}
                      alt={companyProfile.brandName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1E5FA8] text-white rounded-lg flex items-center justify-center font-bold text-xs">
                      {companyProfile.logoText || 'TH'}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 font-['Battambang']">
                    ដំឡើងកម្មវិធី {companyProfile.brandName}
                  </h4>
                  <p className="text-[10px] text-slate-500">បន្ថែមលើអេក្រង់ដើម (Add to Home Screen)</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    ចុចប៊ូតុង Share <Share2 className="w-3.5 h-3.5 text-blue-600 inline" />
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    នៅផ្នែកខាងក្រោម ឬខាងលើនៃ Safari Browser
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div>
                  <p className="font-bold text-slate-900 flex items-center gap-1">
                    ជ្រើសរើស <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" /> Add to Home Screen
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    រំកិលចុះក្រោម រួចចុច "Add to Home Screen" ឬ "បន្ថែមលើអេក្រង់ដើម"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    ចុចពាក្យ "Add" (បន្ថែម)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    រូប Logo ក្រុមហ៊ុន នឹងបង្ហាញលើអេក្រង់ទូរសព្ទរបស់អ្នកជា App ពេញលេញ!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2.5 bg-[#1E5FA8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-['Kantumruy_Pro'] transition-colors"
            >
              យល់ព្រម
            </button>
          </div>
        </div>
      )}
    </>
  );
};
