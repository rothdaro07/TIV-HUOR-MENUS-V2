import React, { useState, useEffect } from 'react';
import {
  Bot,
  Key,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  ExternalLink,
  Users,
  Hash,
  Phone,
  User,
  HelpCircle,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  Sliders,
  BellRing
} from 'lucide-react';
import { CompanyProfile, TelegramBotConfig } from '../types';
import {
  getTelegramBotInfo,
  getTelegramRecentUpdates,
  testTelegramBotConnection,
  sendTestSampleOrderToTelegram,
  TelegramBotInfo,
  TelegramDetectedChat,
} from '../lib/telegram';

interface AdminTelegramBotManagerProps {
  companyProfile: CompanyProfile;
  onSaveCompanyProfile: (profile: CompanyProfile) => void;
  isFirebaseSynced?: boolean;
}

export const AdminTelegramBotManager: React.FC<AdminTelegramBotManagerProps> = ({
  companyProfile,
  onSaveCompanyProfile,
  isFirebaseSynced = false,
}) => {
  const [config, setConfig] = useState<TelegramBotConfig>({
    botToken: '',
    chatId: '',
    topicId: '',
    isEnabled: true,
    managerName: 'Manager ទីវ ហៃ',
    managerPhone: '096 522 9 777',
    managerTelegram: '@tivhai_fertilizer',
    notifyOnNewOrder: true,
    ...(companyProfile?.telegramConfig || {}),
  });

  const [showToken, setShowToken] = useState(false);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [botInfo, setBotInfo] = useState<TelegramBotInfo | null>(null);
  const [botInfoError, setBotInfoError] = useState<string | null>(null);

  const [isDetectingChats, setIsDetectingChats] = useState(false);
  const [detectedChats, setDetectedChats] = useState<TelegramDetectedChat[]>([]);
  const [detectedChatsError, setDetectedChatsError] = useState<string | null>(null);

  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSendingSampleOrder, setIsSendingSampleOrder] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeGuideStep, setActiveGuideStep] = useState<number | null>(null);

  // Sync state if companyProfile updates
  useEffect(() => {
    if (companyProfile?.telegramConfig) {
      setConfig((prev) => ({
        ...prev,
        ...companyProfile.telegramConfig,
      }));
    }
  }, [companyProfile]);

  // Automatically check bot info if token is already provided
  useEffect(() => {
    if (config.botToken && config.botToken.includes(':')) {
      handleVerifyBotToken(config.botToken, true);
    }
  }, []);

  const handleVerifyBotToken = async (tokenToVerify?: string, silent = false) => {
    const token = (tokenToVerify || config.botToken).trim();
    if (!token) {
      if (!silent) setBotInfoError('សូមបញ្ចូល Telegram Bot API Token ជាមុនសិន!');
      return;
    }

    if (!silent) {
      setIsVerifyingToken(true);
      setBotInfoError(null);
    }

    try {
      const result = await getTelegramBotInfo(token);
      if (result.success && result.botInfo) {
        setBotInfo(result.botInfo);
        setBotInfoError(null);
      } else {
        setBotInfo(null);
        if (!silent) {
          setBotInfoError(result.error || 'Token មិនត្រឹមត្រូវ!');
        }
      }
    } catch (err: any) {
      if (!silent) setBotInfoError(err.message || 'មិនអាចតភ្ជាប់ទៅកាន់ Telegram Server');
    } finally {
      if (!silent) setIsVerifyingToken(false);
    }
  };

  const handleDetectChats = async () => {
    const token = config.botToken.trim();
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
            'រកមិនឃើញសារថ្មីៗទេ។ សូមប្រាកដថាអ្នកបានបន្ថែម Bot ទៅក្នុង Group និងបានផ្ញើសារ "/start" ឬសារណាមួយក្នុង Group នោះរួចហើយ!'
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

  const handleSelectChatId = (chatId: string) => {
    setConfig((prev) => ({ ...prev, chatId }));
    setTestResult({
      success: true,
      message: `បានជ្រើសរើស Chat ID: ${chatId} រួចរាល់! សូមចុច "រក្សាទុក" ឬ "តេស្តផ្ញើសារ"។`,
    });
  };

  const handleSendPingTest = async () => {
    if (!config.botToken || !config.chatId) {
      setTestResult({
        success: false,
        message: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID ឱ្យបានពេញលេញ!',
      });
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await testTelegramBotConnection(config.botToken, config.chatId, config.topicId);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error sending test message' });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendSampleOrderTest = async () => {
    if (!config.botToken || !config.chatId) {
      setTestResult({
        success: false,
        message: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID ឱ្យបានពេញលេញ!',
      });
      return;
    }

    setIsSendingSampleOrder(true);
    setTestResult(null);
    try {
      const res = await sendTestSampleOrderToTelegram(
        config.botToken,
        config.chatId,
        config.topicId,
        companyProfile
      );
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error sending sample order' });
    } finally {
      setIsSendingSampleOrder(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: CompanyProfile = {
      ...companyProfile,
      telegramConfig: {
        ...config,
        lastTestedAt: new Date().toISOString(),
      },
    };
    onSaveCompanyProfile(updatedProfile);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const isConnected = !!(botInfo && config.chatId && config.isEnabled);

  return (
    <div className="space-y-6 font-['Battambang']">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0088cc] via-[#0077b5] to-[#1E5FA8] rounded-2xl p-5 sm:p-6 text-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs border border-white/30 flex items-center justify-center shadow-xs shrink-0">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  ការតភ្ជាប់ Telegram Bot API Token
                </h3>
                <span
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-100 border-emerald-300/40'
                      : 'bg-amber-500/20 text-amber-100 border-amber-300/40'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
                  />
                  {isConnected ? 'តភ្ជាប់ជោគជ័យ (Connected)' : 'មិនទាន់តភ្ជាប់ពេញលេញ'}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-1 font-['Kantumruy_Pro']">
                ភ្ជាប់ Telegram Bot របស់អ្នកដើម្បីទទួលដំណឹងការកុម្ម៉ង់ជី និងរូបភាពវិក្កយបត្រភ្លាមៗក្នុង Group Manager!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 font-bold">
              {isFirebaseSynced ? '☁️ Cloud Synced' : '💾 Local Storage'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Step 1: Bot API Token Configuration */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center font-bold">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  ១. កំណត់ Telegram Bot API Token
                </h4>
                <p className="text-xs text-slate-500 font-['Kantumruy_Pro']">
                  Token ទទួលបានពី Telegram @BotFather សម្រាប់បញ្ជូនទិន្នន័យ
                </p>
              </div>
            </div>

            {/* Bot Enabled / Disabled Switch */}
            <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={config.isEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, isEnabled: e.target.checked }))}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="text-xs font-bold text-slate-800">
                {config.isEnabled ? '✓ បើកប្រព័ន្ធ Bot' : '✕ បិទដំណើរការ Bot'}
              </span>
            </label>
          </div>

          {/* Token Input & Verify Button */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Bot API Token (HTTP API Token) *
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.botToken}
                  onChange={(e) => {
                    const val = e.target.value;
                    setConfig((prev) => ({ ...prev, botToken: val }));
                    if (botInfo) setBotInfo(null);
                  }}
                  placeholder="ឧ. 7648392019:AAFx9Kxxxxxxxxx..."
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:bg-white focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] outline-none transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                disabled={isVerifyingToken || !config.botToken.trim()}
                onClick={() => handleVerifyBotToken()}
                className="px-4 py-2.5 bg-[#0088cc] hover:bg-[#0077b5] active:bg-[#006699] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-2xs"
              >
                {isVerifyingToken ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>កំពុងត្រួតពិនិត្យ...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>ត្រួតពិនិត្យ Token (Verify)</span>
                  </>
                )}
              </button>
            </div>

            {/* Error message */}
            {botInfoError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-bold font-['Kantumruy_Pro']">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{botInfoError}</span>
              </div>
            )}

            {/* Verified Bot Info Profile Card */}
            {botInfo && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{botInfo.first_name}</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        @{botInfo.username}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      Bot ID: {botInfo.id} • Group Support: {botInfo.can_join_groups ? '✓ អនុញ្ញាត' : '✕ បិទ'}
                    </p>
                  </div>
                </div>

                <a
                  href={`https://t.me/${botInfo.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <span>បើក Bot ក្នុង Telegram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Chat ID / Manager Group Discovery */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900">
                  ២. កំណត់ Telegram Group ID / Chat ID
                </h4>
                <p className="text-xs text-slate-500 font-['Kantumruy_Pro']">
                  ទីតាំងគ្រុប Telegram ដែល Bot ត្រូវបញ្ជូនវិក្កយបត្រ និងការកុម្ម៉ង់ទៅកាន់
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={isDetectingChats || !config.botToken.trim()}
              onClick={handleDetectChats}
              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs font-['Battambang']"
            >
              {isDetectingChats ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>កំពុងស្វែងរក...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>ស្វែងរក Chat ID ស្វ័យប្រវត្តិ (Auto-Detect)</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Chat ID / Group ID / Channel *
              </label>
              <input
                type="text"
                value={config.chatId}
                onChange={(e) => setConfig((prev) => ({ ...prev, chatId: e.target.value }))}
                placeholder="ឧ. -1001928374652 ឬ 582910482"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-2xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-['Kantumruy_Pro']">
                * ចំណាំ: Group ID ច្រើនតែចាប់ផ្តើមដោយសញ្ញាដក (ឧ. <code>-100...</code>)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Topic ID / Thread ID (សម្រាប់ Supergroup Topics - មិនបង្ខំ)
              </label>
              <input
                type="text"
                value={config.topicId || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, topicId: e.target.value }))}
                placeholder="ឧ. 2 (ទុកទំនេរប្រសិនបើគ្រុបធម្មតា)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:bg-white focus:border-indigo-500 outline-none transition-all shadow-2xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block font-['Kantumruy_Pro']">
                ទុកទំនេរ បើគ្រុបរបស់អ្នកមិនបានបើកមុខងារ Topics
              </span>
            </div>
          </div>

          {/* Error when detecting chats */}
          {detectedChatsError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2 font-['Kantumruy_Pro']">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>{detectedChatsError}</span>
            </div>
          )}

          {/* Detected Chats List */}
          {detectedChats.length > 0 && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-3 font-['Kantumruy_Pro']">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-950 font-['Battambang'] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  <span>រកឃើញគ្រុប/ការសន្ទនា ({detectedChats.length})៖</span>
                </span>
                <span className="text-[11px] text-indigo-600">ចុច "ជ្រើសរើស" ដើម្បីប្រើ Chat ID នោះ</span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detectedChats.map((c) => {
                  const isSelected = config.chatId === c.chatId;
                  return (
                    <div
                      key={c.chatId}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isSelected
                          ? 'bg-white border-indigo-500 shadow-xs'
                          : 'bg-white/80 border-indigo-100 hover:border-indigo-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900 truncate">{c.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {c.type}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-2">
                          <span>ID: {c.chatId}</span>
                          {c.date && <span className="text-slate-400">• {c.date}</span>}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectChatId(c.chatId)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 font-['Battambang'] ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        {isSelected ? '✓ កំពុងជ្រើសរើស' : 'ជ្រើសរើស (Use ID)'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Manager Contact & Notification Rules */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                ៣. ព័ត៌មានអ្នកគ្រប់គ្រង & លក្ខខណ្ឌជូនដំណឹង
              </h4>
              <p className="text-xs text-slate-500 font-['Kantumruy_Pro']">
                ព័ត៌មានទំនាក់ទំនងរបស់ Manager សម្រាប់បង្ហាញនៅខាងក្រោមវិក្កយបត្រ Telegram
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ឈ្មោះអ្នកគ្រប់គ្រង (Manager Name)
              </label>
              <input
                type="text"
                value={config.managerName || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, managerName: e.target.value }))}
                placeholder="ឧ. Manager ទីវ ហៃ"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-purple-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                លេខទូរស័ព្ទ Manager
              </label>
              <input
                type="text"
                value={config.managerPhone || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, managerPhone: e.target.value }))}
                placeholder="ឧ. 096 522 9 777"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                គណនី Telegram Manager
              </label>
              <input
                type="text"
                value={config.managerTelegram || ''}
                onChange={(e) => setConfig((prev) => ({ ...prev, managerTelegram: e.target.value }))}
                placeholder="ឧ. @tivhai_fertilizer"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Testing & Connection Verification */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900">
                ៤. សាកល្បងផ្ញើសារ & បញ្ជាក់ការតភ្ជាប់ (Test Dispatch)
              </h4>
              <p className="text-xs text-slate-500 font-['Kantumruy_Pro']">
                សាកល្បងផ្ញើសារធម្មតា ឬផ្ញើវិក្កយបត្រកុម្ម៉ង់ជីគំរូទៅកាន់ Telegram Group របស់អ្នក
              </p>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-bold flex items-start gap-2.5 font-['Kantumruy_Pro'] animate-in fade-in duration-200 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <span>{testResult.message}</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isSendingTest || !config.botToken.trim() || !config.chatId.trim()}
              onClick={handleSendPingTest}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-slate-200 font-['Battambang']"
            >
              {isSendingTest ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-600" />
                  <span>កំពុងផ្ញើសារតេស្ត...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>ផ្ញើសារតេស្ត Ping (Test Ping)</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSendingSampleOrder || !config.botToken.trim() || !config.chatId.trim()}
              onClick={handleSendSampleOrderTest}
              className="px-4 py-2.5 bg-gradient-to-r from-[#0088cc] to-[#1E5FA8] hover:from-[#0077b5] hover:to-[#15467e] disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs font-['Battambang']"
            >
              {isSendingSampleOrder ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>កំពុងផ្ញើវិក្កយបត្រគំរូ...</span>
                </>
              ) : (
                <>
                  <Bot className="w-4 h-4 text-white" />
                  <span>ផ្ញើវិក្កយបត្រកុម្ម៉ង់ជីគំរូ (Send Sample Order Slip)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-['Kantumruy_Pro']">
            {saveSuccess ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>បានរក្សាទុកការកំណត់ Telegram Bot រួចរាល់!</span>
              </span>
            ) : (
              <span>ចុច "រក្សាទុកការកំណត់" ដើម្បីអនុវត្តការផ្លាស់ប្តូរ</span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer font-['Battambang'] hover:shadow-lg"
          >
            <Check className="w-4 h-4" />
            <span>រក្សាទុកការកំណត់ Telegram Bot</span>
          </button>
        </div>
      </form>

      {/* Step-by-Step Setup Guide (Accordion / Card) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 font-['Kantumruy_Pro']">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-['Battambang']">
              ការណែនាំអំពីរបៀបបង្កើត Telegram Bot & យក API Token (Step-by-Step Guide)
            </h4>
            <p className="text-xs text-slate-500">
              ធ្វើតាមជំហានងាយៗ ៤ ខាងក្រោមនេះ ដើម្បីបង្កើត Bot ផ្ទាល់ខ្លួនរបស់អ្នកក្នុង Telegram
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs">
                1
              </span>
              <h5 className="font-bold text-slate-900 font-['Battambang']">
                បើក Telegram BotFather
              </h5>
            </div>
            <p className="text-slate-600">
              បើកកម្មវិធី Telegram ហើយស្វែងរក <b>@BotFather</b> (គណនីផ្លូវការដែលមានសញ្ញាធិកខៀវ) ឬចុចតំណភ្ជាប់៖
            </p>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#0088cc] font-bold hover:underline"
            >
              <span>https://t.me/BotFather</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs">
                2
              </span>
              <h5 className="font-bold text-slate-900 font-['Battambang']">
                ផ្ញើពាក្យបញ្ជា /newbot
              </h5>
            </div>
            <p className="text-slate-600">
              ផ្ញើសារ <code>/newbot</code> ទៅ BotFather រួចវាយបញ្ចូល <b>ឈ្មោះ Bot</b> និង <b>Username</b> ដែលត្រូវបញ្ចប់ដោយពាក្យ <code>_bot</code> (ឧ. <code>tivhai_order_bot</code>)។
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs">
                3
              </span>
              <h5 className="font-bold text-slate-900 font-['Battambang']">
                ចម្លង API Token មកដាក់ក្នុង App
              </h5>
            </div>
            <p className="text-slate-600">
              BotFather នឹងផ្ញើ HTTP API Token មកអ្នក (ទម្រង់ <code>123456789:ABC...</code>)។ ចម្លង Token នោះមកបិទភ្ជាប់ក្នុងប្រអប់ <b>Bot API Token</b> ខាងលើ ហើយចុច <b>Verify</b>។
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0088cc] text-white flex items-center justify-center font-bold text-xs">
                4
              </span>
              <h5 className="font-bold text-slate-900 font-['Battambang']">
                បន្ថែម Bot ទៅក្នុង Group Manager
              </h5>
            </div>
            <p className="text-slate-600">
              ទាញ Bot ចូលទៅក្នុងគ្រុប Telegram របស់អ្នក រួចផ្ញើសារ <code>/start</code>។ បន្ទាប់មកចុចប៊ូតុង <b>"ស្វែងរក Chat ID ស្វ័យប្រវត្តិ"</b> ខាងលើ រួចចុច <b>"រក្សាទុក"</b> ជាការស្រេច!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
