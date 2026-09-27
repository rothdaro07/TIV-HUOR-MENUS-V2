import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Monitor,
  X,
  Share2,
  PlusSquare,
  MoreVertical,
  ExternalLink,
  CheckCircle2,
  WifiOff,
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface InstallPwaPromptProps {
  companyProfile: CompanyProfile;
}

export const OPEN_PWA_GUIDE_EVENT = 'tivhai:open-pwa-guide';

export function triggerInstallGuideModal() {
  window.dispatchEvent(new CustomEvent(OPEN_PWA_GUIDE_EVENT));
}

export const InstallPwaPrompt: React.FC<InstallPwaPromptProps> = ({ companyProfile }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();

  const [showFloatingBanner, setShowFloatingBanner] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState<'android' | 'ios' | 'desktop'>('android');
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    if (isIOS) {
      setGuideTab('ios');
    } else if (/android/i.test(window.navigator.userAgent)) {
      setGuideTab('android');
    } else {
      setGuideTab('desktop');
    }
  }, [isIOS]);

  useEffect(() => {
    const handleOpenGuide = () => {
      setShowGuideModal(true);
    };
    window.addEventListener(OPEN_PWA_GUIDE_EVENT, handleOpenGuide);
    return () => window.removeEventListener(OPEN_PWA_GUIDE_EVENT, handleOpenGuide);
  }, []);

  useEffect(() => {
    if (isInstalled) {
      setShowFloatingBanner(false);
      return;
    }

    const dismissed = localStorage.getItem('tivhuor_pwa_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 1000 * 60 * 60 * 24 * 3) {
      return;
    }

    if (isInstallable) {
      setShowFloatingBanner(true);
      return;
    }

    const timer = setTimeout(() => {
      setShowFloatingBanner(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, [isInstalled, isInstallable]);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (accepted) {
        setShowFloatingBanner(false);
        setShowGuideModal(false);
      }
      return;
    }
    setShowGuideModal(true);
  };

  const handleDismiss = () => {
    setShowFloatingBanner(false);
    localStorage.setItem('tivhuor_pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Offline Connectivity Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xl border border-amber-400/40 font-['Kantumruy_Pro']">
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>កំពុងប្រើប្រាស់ដោយគ្មានអ៊ីនធឺណិត (Offline Mode — ទិន្នន័យរក្សាទុកក្នុងឧបករណ៍)</span>
        </div>
      )}

      {/* Floating Bottom Install Prompt Banner */}
      {!isInstalled && showFloatingBanner && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3.5 shadow-2xl border border-white/20 flex items-center gap-3">
            {/* App Icon */}
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
                ដំឡើង Shortcut ជាកម្មវិធី App ពេញអេក្រង់
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white rounded-xl text-xs font-bold font-['Kantumruy_Pro'] flex items-center gap-1 shadow-md transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ដំឡើង App</span>
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="បិទ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Install Shortcut / App Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 font-['Kantumruy_Pro'] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center border-2 border-blue-100 shadow-sm overflow-hidden shrink-0">
                  {companyProfile.logoUrl ? (
                    <img
                      src={companyProfile.logoUrl}
                      alt={companyProfile.brandName}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#1E5FA8] text-white flex items-center justify-center font-black text-base">
                      {companyProfile.logoText || 'TH'}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-['Battambang']">
                    ដំឡើងកម្មវិធី {companyProfile.brandName || 'ទីវ ហៃ'}
                  </h4>
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>បើកពេញអេក្រង់ដូច App ពិតប្រាកដ (Standalone App)</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Install Button if native prompt is ready */}
            {isInstallable && (
              <div className="mb-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between gap-3">
                <div className="text-xs text-blue-900">
                  <p className="font-bold">ឧបករណ៍របស់អ្នកគាំទ្រការដំឡើងភ្លាមៗ!</p>
                  <p className="text-[11px] text-blue-700 mt-0.5">ចុចប៊ូតុងខាងស្តាំដើម្បីដំឡើងចូលអេក្រង់ដើម</p>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 bg-[#1E5FA8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>ដំឡើងឥឡូវនេះ</span>
                </button>
              </div>
            )}

            {/* Notice if inside preview iframe */}
            {isInIframe && !isInstallable && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold">បើកគេហទំព័រក្នុងផ្ទាំងពេញ (Full Tab) ជាមុនសិន</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    ដើម្បីដំឡើងជា App ចូលទូរសព្ទ ឬកុំព្យូទ័រ សូមបើកគេហទំព័រក្នុង Browser ផ្ទាល់។
                  </p>
                </div>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>បើកផ្ទាំងថ្មី</span>
                </a>
              </div>
            )}

            {/* Platform Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 text-xs font-bold">
              <button
                onClick={() => setGuideTab('android')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  guideTab === 'android'
                    ? 'bg-white text-[#1E5FA8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>
              <button
                onClick={() => setGuideTab('ios')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  guideTab === 'ios'
                    ? 'bg-white text-[#1E5FA8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>
              <button
                onClick={() => setGuideTab('desktop')}
                className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  guideTab === 'desktop'
                    ? 'bg-white text-[#1E5FA8] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>កុំព្យូទ័រ</span>
              </button>
            </div>

            {/* Guide Steps by Platform */}
            {guideTab === 'android' && (
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      ចុចប៊ូតុងម៉ឺនុយ <MoreVertical className="w-3.5 h-3.5 text-blue-600 inline" /> (ចំណុច ៣)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      នៅជ្រុងខាងលើស្តាំនៃកម្មវិធី Google Chrome
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      ជ្រើសរើស <Download className="w-3.5 h-3.5 text-blue-600 inline" /> "Install app" ឬ "Add to Home screen"
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ចុចលើពាក្យ <strong>Install app (ដំឡើងកម្មវិធី)</strong> ដើម្បីដំឡើងជា App ពេញលេញ
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">ចុចពាក្យ "Install" (ដំឡើង)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      កម្មវិធី <strong>ទីវ ហៃ</strong> នឹងបង្ហាញលើអេក្រង់ទូរសព្ទ ហើយបើកពេញអេក្រង់ដូច App ពិតៗ!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {guideTab === 'ios' && (
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      ចុចប៊ូតុង Share <Share2 className="w-3.5 h-3.5 text-blue-600 inline" /> ក្នុង Safari
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      នៅរបារខាងក្រោម (iPhone) ឬខាងលើ (iPad) នៃ Safari Browser
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      ជ្រើសរើស <PlusSquare className="w-3.5 h-3.5 text-blue-600 inline" /> Add to Home Screen
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      រំកិលចុះក្រោម រួចចុច <strong>"Add to Home Screen"</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">ចុចពាក្យ "Add" (បន្ថែម)</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      រូប Logo ក្រុមហ៊ុននឹងបង្ហាញលើអេក្រង់ដើម ហើយបើកជា App ពេញអេក្រង់ដោយគ្មានរបារ Browser!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {guideTab === 'desktop' && (
              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 flex items-center gap-1">
                      ចុចរូបតំណាង <Download className="w-3.5 h-3.5 text-blue-600 inline" /> លើរបារអាសយដ្ឋាន (URL Bar)
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ឬចុចប៊ូតុងម៉ឺនុយ <strong>(⋮)</strong> នៅជ្រុងខាងលើស្តាំនៃ Chrome / Edge
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      ជ្រើសរើស "Install ទីវ ហៃ" ឬ "Create shortcut..."
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      ក្នុងម៉ឺនុយ <strong>Cast, save, and share</strong> → ចុច <strong>Install page as app...</strong> (ឬប្រសិនបើជ្រើស Create shortcut សូមធីក <strong>☑ Open as window</strong>)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">ចុចប៊ូតុង "Install" ឬ "Create"</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      កម្មវិធីនឹងបង្កើត Shortcut លើ Desktop ហើយបើកជាផ្ទាំងកម្មវិធីដាច់ដោយឡែកដូច App ពិតប្រាកដ!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-4 w-full py-2.5 bg-[#1E5FA8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold font-['Kantumruy_Pro'] transition-colors cursor-pointer"
            >
              យល់ព្រម
            </button>
          </div>
        </div>
      )}
    </>
  );
};
