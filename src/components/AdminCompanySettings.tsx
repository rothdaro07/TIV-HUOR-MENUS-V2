import React, { useState, useEffect } from 'react';
import {
  Building2,
  Upload,
  Link,
  Check,
  RefreshCw,
  AlertCircle,
  Send,
  Bot,
  CheckCircle2,
  Key,
  Users,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { CompanyProfile } from '../types';
import { uploadToCloudinary } from '../lib/cloudinary';
import { COMPANY_INFO } from '../data/initialProducts';
import {
  testTelegramBotConnection,
  getTelegramBotInfo,
  getTelegramRecentUpdates,
  sendTestSampleOrderToTelegram,
  TelegramBotInfo,
  TelegramDetectedChat,
} from '../lib/telegram';

interface AdminCompanySettingsProps {
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  isFirebaseSynced?: boolean;
}

export const AdminCompanySettings: React.FC<AdminCompanySettingsProps> = ({
  companyProfile,
  onSaveCompanyProfile,
  isFirebaseSynced = false,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>({
    ...COMPANY_INFO,
    ...companyProfile,
    telegramConfig: {
      botToken: '',
      chatId: '',
      topicId: '',
      isEnabled: true,
      managerName: 'Manager ទីវ ហៃ',
      managerPhone: '096 522 9 777',
      managerTelegram: '@tivhai_fertilizer',
      notifyOnNewOrder: true,
      ...(companyProfile?.telegramConfig || COMPANY_INFO.telegramConfig),
    },
  });

  // Keep form data in sync if company profile updates from Firestore
  useEffect(() => {
    if (companyProfile) {
      setFormData((prev) => ({
        ...COMPANY_INFO,
        ...companyProfile,
        telegramConfig: {
          botToken: '',
          chatId: '',
          topicId: '',
          isEnabled: true,
          managerName: 'Manager ទីវ ហៃ',
          managerPhone: '096 522 9 777',
          managerTelegram: '@tivhai_fertilizer',
          notifyOnNewOrder: true,
          ...(companyProfile?.telegramConfig || prev.telegramConfig),
        },
      }));
    }
  }, [companyProfile]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Telegram test state
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSendingSampleOrder, setIsSendingSampleOrder] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [botInfoError, setBotInfoError] = useState<string | null>(null);
  const [isDetectingChats, setIsDetectingChats] = useState(false);
  const [detectedChats, setDetectedChats] = useState<TelegramDetectedChat[]>([]);
  const [detectedChatsError, setDetectedChatsError] = useState<string | null>(null);

  const handleVerifyBotToken = async () => {
    const token = (formData.telegramConfig?.botToken || '').trim();
    if (!token) {
      setBotInfoError('សូមបញ្ចូល Telegram Bot API Token ជាមុនសិន!');
      return;
    }

    setIsVerifyingToken(true);
    setBotInfoError(null);
    try {
      const result = await getTelegramBotInfo(token);
      if (result.success && result.botInfo) {
        setBotInfo(result.botInfo);
        setBotInfoError(null);
      } else {
        setBotInfo(null);
        setBotInfoError(result.error || 'Token មិនត្រឹមត្រូវ!');
      }
    } catch (err: any) {
      setBotInfoError(err.message || 'មិនអាចតភ្ជាប់ទៅកាន់ Telegram');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleDetectChats = async () => {
    const token = (formData.telegramConfig?.botToken || '').trim();
    if (!token) {
      setDetectedChatsError('សូមបញ្ចូល និងផ្ទៀងផ្ទាត់ Bot Token ជាមុនសិន!');
      return;
    }

    setIsDetectingChats(true);
    setDetectedChatsError(null);
    try {
      const result = await getTelegramRecentUpdates(token);
      if (result.success) {
        setDetectedChats(result.chats);
        if (result.chats.length === 0) {
          setDetectedChatsError(
            'រកមិនឃើញសារថ្មីៗទេ។ សូមប្រាកដថាអ្នកបានបន្ថែម Bot ទៅក្នុង Group និងបានផ្ញើសារ "/start" រួចហើយ!'
          );
        }
      } else {
        setDetectedChatsError(result.error || 'មិនអាចទាញយក Updates បានទេ');
      }
    } catch (err: any) {
      setDetectedChatsError(err.message || 'Error detecting chats');
    } finally {
      setIsDetectingChats(false);
    }
  };

  const handleSendSampleOrder = async () => {
    const tg = formData.telegramConfig;
    if (!tg?.botToken || !tg?.chatId) {
      setTelegramTestResult({
        success: false,
        message: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID ជាមុនសិន!',
      });
      return;
    }

    setIsSendingSampleOrder(true);
    setTelegramTestResult(null);
    try {
      const result = await sendTestSampleOrderToTelegram(
        tg.botToken,
        tg.chatId,
        tg.topicId,
        formData
      );
      setTelegramTestResult(result);
    } catch (e: any) {
      setTelegramTestResult({
        success: false,
        message: e?.message || 'Error sending sample order',
      });
    } finally {
      setIsSendingSampleOrder(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTelegramConfigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      telegramConfig: {
        ...(prev.telegramConfig || {
          botToken: '',
          chatId: '',
          isEnabled: true,
          notifyOnNewOrder: true,
        }),
        [name]: type === 'checkbox' ? checked : value,
      },
    }));
  };

  const handleTestTelegramBot = async () => {
    const tg = formData.telegramConfig;
    if (!tg?.botToken || !tg?.chatId) {
      setTelegramTestResult({
        success: false,
        message: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID ជាមុនសិន!',
      });
      return;
    }

    setIsTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const result = await testTelegramBotConnection(tg.botToken, tg.chatId, tg.topicId);
      setTelegramTestResult(result);
    } catch (e: any) {
      setTelegramTestResult({
        success: false,
        message: e?.message || 'ការតភ្ជាប់មានបញ្ហា',
      });
    } finally {
      setIsTestingTelegram(false);
    }
  };

  // Upload logo directly to Cloudinary or base64
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('សូមជ្រើសរើសឯកសាររូបភាព (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('ទំហំរូបភាពត្រូវតែតូចជាង 5MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      // Upload via Cloudinary
      const uploadedUrl = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(percent);
      });

      setFormData((prev) => ({
        ...prev,
        logoUrl: uploadedUrl,
      }));
      setUploadProgress(100);
    } catch (err: any) {
      console.warn('Cloudinary upload fallback to FileReader Base64:', err);
      // Fallback to FileReader dataURL
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Url = event.target?.result as string;
        setFormData((prev) => ({
          ...prev,
          logoUrl: base64Url,
        }));
        setIsUploading(false);
      };
      reader.onerror = () => {
        setUploadError('មិនអាចផ្ទុករូបភាពបានទេ។ សូមសាកល្បងម្ដងទៀត');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName.trim()) {
      alert('សូមបញ្ចូលឈ្មោះយីហោ/ក្រុមហ៊ុន (Brand Name)');
      return;
    }
    onSaveCompanyProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleResetDefaults = () => {
    if (confirm('តើអ្នកពិតជាចង់កំណត់ព័ត៌មានក្រុមហ៊ុន និងឡូហ្គោទៅលំនាំដើមវិញមែនទេ?')) {
      setFormData(COMPANY_INFO);
      onSaveCompanyProfile(COMPANY_INFO);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const tgConfig = formData.telegramConfig || {
    botToken: '',
    chatId: '',
    topicId: '',
    isEnabled: true,
    managerName: '',
    managerPhone: '',
    managerTelegram: '',
    notifyOnNewOrder: true,
  };

  return (
    <div className="space-y-6 font-['Battambang']">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                ព័ត៌មានក្រុមហ៊ុន ឡូហ្គោ & Telegram Bot
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                គ្រប់គ្រងព័ត៌មានយីហោ ស្លាកសញ្ញា (Logo) និងកំណត់ Telegram Bot សម្រាប់ទទួលវិក្កយបត្រ & បញ្ជាក់ការកុម្ម៉ង់
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                isFirebaseSynced
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isFirebaseSynced ? '✓ ធ្វើសមកាលកម្មលើ Cloud' : '● រក្សាទុកក្នុង Browser'}
            </span>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* ========================================================================= */}
          {/* TELEGRAM BOT NOTIFICATIONS & INVOICE RECEIPT DISPATCHER                 */}
          {/* ========================================================================= */}
          <div className="p-5 bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-slate-50 rounded-2xl border border-blue-200 shadow-2xs space-y-4 font-['Kantumruy_Pro']">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0088cc] text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-['Battambang'] flex items-center gap-2">
                    <span>Telegram Bot ផ្ញើការកុម្ម៉ង់ & វិក្កយបត្រ (Order Bot API)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-[#0088cc] rounded-full border border-blue-200">
                      Real-Time Dispatch
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600 font-['Battambang']">
                    រាល់ពេលអតិថិជនកុម្ម៉ង់ និងភ្ជាប់រូបភាពបង្កាន់ដៃបង់ប្រាក់ ទិន្នន័យ & រូបភាពនឹងត្រូវផ្ញើទៅ Telegram ភ្លាមៗដើម្បីឱ្យ Manager បញ្ជាក់!
                  </p>
                </div>
              </div>

              {/* Bot Enabled Switch */}
              <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-blue-200 shadow-2xs">
                <input
                  type="checkbox"
                  name="isEnabled"
                  checked={tgConfig.isEnabled}
                  onChange={handleTelegramConfigChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800 font-['Battambang']">
                  {tgConfig.isEnabled ? 'បើកដំណើរការ Bot' : 'បិទ Bot'}
                </span>
              </label>
            </div>

            {/* Token Section */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 font-['Battambang']">
                Telegram Bot API Token (ពី @BotFather) *
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  name="botToken"
                  value={tgConfig.botToken}
                  onChange={handleTelegramConfigChange}
                  placeholder="ឧ. 1234567890:AAFxxxxxxxxx"
                  className="flex-1 px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-2xs"
                />
                <button
                  type="button"
                  disabled={isVerifyingToken || !tgConfig.botToken.trim()}
                  onClick={handleVerifyBotToken}
                  className="px-3.5 py-2 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 font-['Battambang']"
                >
                  {isVerifyingToken ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>កំពុង Verify...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify Token</span>
                    </>
                  )}
                </button>
              </div>

              {botInfoError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{botInfoError}</span>
                </div>
              )}

              {botInfo && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Bot ត្រឹមត្រូវ: <b>{botInfo.first_name}</b> (@{botInfo.username})</span>
                  </div>
                  <a
                    href={`https://t.me/${botInfo.username}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 underline font-bold flex items-center gap-1"
                  >
                    <span>បើក Telegram</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Chat ID & Detection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 font-['Battambang']">
                  Telegram Chat ID / Group ID / Channel *
                </label>
                <button
                  type="button"
                  disabled={isDetectingChats || !tgConfig.botToken.trim()}
                  onClick={handleDetectChats}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer font-['Battambang']"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isDetectingChats ? 'កំពុងស្វែងរក...' : 'ស្វែងរក Chat ID ស្វ័យប្រវត្តិ'}</span>
                </button>
              </div>

              <input
                type="text"
                name="chatId"
                value={tgConfig.chatId}
                onChange={handleTelegramConfigChange}
                placeholder="ឧ. -1001234567890 ឬ 582910482"
                className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-2xs"
              />

              {detectedChatsError && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>{detectedChatsError}</span>
                </div>
              )}

              {detectedChats.length > 0 && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-indigo-900 font-['Battambang'] block">
                    រកឃើញគ្រុប ({detectedChats.length})៖
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {detectedChats.map((c) => (
                      <div
                        key={c.chatId}
                        className="p-2 bg-white rounded-lg border border-indigo-100 flex items-center justify-between gap-2"
                      >
                        <div className="text-xs font-mono">
                          <span className="font-bold text-slate-800 font-['Battambang']">{c.title}</span> ({c.type}) • ID: {c.chatId}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              telegramConfig: {
                                ...(prev.telegramConfig || tgConfig),
                                chatId: c.chatId,
                              },
                            }));
                          }}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold cursor-pointer font-['Battambang']"
                        >
                          ជ្រើសរើស ID នេះ
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 font-['Battambang'] mb-1">
                  ឈ្មោះអ្នកគ្រប់គ្រង (Manager Name)
                </label>
                <input
                  type="text"
                  name="managerName"
                  value={tgConfig.managerName || ''}
                  onChange={handleTelegramConfigChange}
                  placeholder="ឧ. Manager ទីវ ហៃ"
                  className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-medium text-slate-800 focus:border-blue-500 outline-none font-['Battambang']"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-['Battambang'] mb-1">
                  គណនី Telegram / លេខទូរស័ព្ទ Manager
                </label>
                <input
                  type="text"
                  name="managerTelegram"
                  value={tgConfig.managerTelegram || ''}
                  onChange={handleTelegramConfigChange}
                  placeholder="ឧ. @tivhai_fertilizer ឬ 096 522 9 777"
                  className="w-full px-3.5 py-2 bg-white border border-blue-200 rounded-xl text-xs font-medium text-slate-800 focus:border-blue-500 outline-none font-['Battambang']"
                />
              </div>
            </div>

            {/* Test Bot Connection Button & Status */}
            <div className="space-y-2 pt-2 border-t border-blue-200/80">
              {telegramTestResult && (
                <div
                  className={`text-xs font-bold p-2.5 rounded-xl border flex items-center gap-2 font-['Battambang'] ${
                    telegramTestResult.success
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-red-50 text-red-700 border-red-300'
                  }`}
                >
                  {telegramTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{telegramTestResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isTestingTelegram || !tgConfig.botToken || !tgConfig.chatId}
                  onClick={handleTestTelegramBot}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer font-['Battambang'] border border-slate-200"
                >
                  {isTestingTelegram ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>កំពុងតេស្ត Ping...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-blue-600" />
                      <span>តេស្ត Ping Telegram</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSendingSampleOrder || !tgConfig.botToken || !tgConfig.chatId}
                  onClick={handleSendSampleOrder}
                  className="px-3.5 py-2 bg-[#0088cc] hover:bg-[#0077b5] active:bg-[#006699] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer font-['Battambang']"
                >
                  {isSendingSampleOrder ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>កំពុងផ្ញើវិក្កយបត្រគំរូ...</span>
                    </>
                  ) : (
                    <>
                      <Bot className="w-3.5 h-3.5" />
                      <span>ផ្ញើវិក្កយបត្រកុម្ម៉ង់ជីគំរូ (Sample Order)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#1E5FA8]" />
                  <span>រូបសញ្ញា / ឡូហ្គោក្រុមហ៊ុន (Company Logo)</span>
                </label>
                <p className="text-xs text-slate-500 mt-0.5">
                  អ្នកអាចផ្ទុកឡើងជារូបភាពផ្ទាល់ខ្លួន (PNG, JPG, SVG, WebP) ឬដាក់តំណភ្ជាប់ URL រូបភាព
                </p>
              </div>

              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                >
                  លុបរូបឡូហ្គោចេញ
                </button>
              )}
            </div>

            {/* Logo Preview & Upload Box */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* Preview Box */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-2xs text-center">
                <span className="text-[11px] font-bold text-slate-400 mb-2">
                  ទិដ្ឋភាពបង្ហាញជាក់ស្តែង (Preview)
                </span>

                <div className="flex items-center gap-3">
                  {/* Circular badge preview (matches Header) */}
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-xs relative">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt={formData.brandName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1E5FA8] flex items-center justify-center text-white font-black text-xl">
                        {formData.logoText || 'TH'}
                      </div>
                    )}
                  </div>

                  {/* App Icon preview (matches Home Screen / PWA) */}
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-xs relative">
                    {formData.logoUrl ? (
                      <img
                        src={formData.logoUrl}
                        alt={formData.brandName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#1E5FA8] flex items-center justify-center text-white font-black text-xl">
                        {formData.logoText || 'TH'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2 text-center">
                  <span className="text-xs font-bold text-slate-800 block">
                    {formData.brandName || 'ទីវ ហៃ TIV HAI'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formData.brandSlogan || 'ជីមានគុណភាព កើនទិន្នផល'}
                  </span>
                </div>
              </div>

              {/* Upload Controls */}
              <div className="md:col-span-8 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ផ្ទុកឡើងឯកសាររូបភាពឡូហ្គោពីឧបករណ៍ (Upload from Device)
                  </label>
                  <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-slate-300 hover:border-[#1E5FA8] rounded-xl cursor-pointer transition-colors text-xs font-bold text-slate-600 hover:text-[#1E5FA8]">
                    <Upload className="w-4 h-4" />
                    <span>{isUploading ? `កំពុងផ្ទុកឡើង... (${uploadProgress}%)` : 'ជ្រើសរើសរូបភាពឡូហ្គោ (PNG / JPG / SVG)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                  {uploadError && (
                    <p className="text-xs text-red-500 mt-1">
                      {uploadError}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                    <Link className="w-3 h-3" />
                    <span>ឬដាក់តំណភ្ជាប់ URL រូបភាពផ្ទាល់ (Direct Image URL)</span>
                  </label>
                  <input
                    type="url"
                    name="logoUrl"
                    value={formData.logoUrl || ''}
                    onChange={handleTextChange}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-[#1E5FA8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    អក្សរកាត់ឡូហ្គោ (Monogram/Logo Text - បង្ហាញពេលគ្មានរូប)
                  </label>
                  <input
                    type="text"
                    name="logoText"
                    maxLength={4}
                    value={formData.logoText || 'TH'}
                    onChange={handleTextChange}
                    placeholder="TH"
                    className="w-24 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-center uppercase text-slate-800 outline-none focus:border-[#1E5FA8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Company Text Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ឈ្មោះយីហោចម្បង (Brand Display Name) *
              </label>
              <input
                type="text"
                name="brandName"
                value={formData.brandName}
                onChange={handleTextChange}
                required
                placeholder="ឧ. ទីវ ហៃ TIV HAI"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold outline-none focus:border-[#1E5FA8] focus:ring-1 focus:ring-[#1E5FA8]"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                បង្ហាញនៅលើក្បាលទំព័រ (Header) និងកាតទំនិញ
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ពាក្យស្លោកយីហោ (Brand Slogan)
              </label>
              <input
                type="text"
                name="brandSlogan"
                value={formData.brandSlogan}
                onChange={handleTextChange}
                placeholder="ឧ. ជីមានគុណភាព កើនទិន្នផល កសិកររីករាយ"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:border-[#1E5FA8] focus:ring-1 focus:ring-[#1E5FA8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ឈ្មោះក្រុមហ៊ុនផ្លូវការជាភាសាខ្មែរ (Company Full Name Khmer)
              </label>
              <input
                type="text"
                name="nameKh"
                value={formData.nameKh}
                onChange={handleTextChange}
                placeholder="ឧ. ក្រុមហ៊ុន ទីវ ហៃ (ខេមបូឌា) ឯ.ក"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:border-[#1E5FA8] focus:ring-1 focus:ring-[#1E5FA8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ឈ្មោះក្រុមហ៊ុនជាភាសាអង់គ្លេស (Company Name English)
              </label>
              <input
                type="text"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleTextChange}
                placeholder="ឧ. TIV HAI (CAMBODIA) CO., LTD."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:border-[#1E5FA8] focus:ring-1 focus:ring-[#1E5FA8]"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                តំណភ្ជាប់ Telegram ក្រុមហ៊ុន (Company Telegram Link)
              </label>
              <input
                type="text"
                name="telegram"
                value={formData.telegram || ''}
                onChange={handleTextChange}
                placeholder="https://t.me/tivhai_fertilizer"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:border-[#1E5FA8] focus:ring-1 focus:ring-[#1E5FA8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                ម៉ោងធ្វើការ (Working Hours)
              </label>
              <input
                type="text"
                name="workingHours"
                value={formData.workingHours || ''}
                onChange={handleTextChange}
                placeholder="ច័ន្ទ - អាទិត្យ: 7:00 ព្រឹក - 6:00 ល្ងាច"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:border-[#1E5FA8] focus:ring-1 focus:ring-[#1E5FA8]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                អាសយដ្ឋានក្រុមហ៊ុន / រោងចក្រ (Address)
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleTextChange}
                placeholder="ព្រះរាជាណាចក្រកម្ពុជា - រោងចក្រផលិតជី និងដេប៉ូចែកចាយទូទាំងប្រទេស"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm outline-none focus:border-[#1E5FA8] focus:ring-1 focus:ring-[#1E5FA8]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors"
            >
              កំណត់ទៅលំនាំដើម (Reset Default)
            </button>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  <span>បានរក្សាទុកដោយជោគជ័យ!</span>
                </span>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#1E5FA8] hover:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>រក្សាទុកព័ត៌មាន & Telegram Bot</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
