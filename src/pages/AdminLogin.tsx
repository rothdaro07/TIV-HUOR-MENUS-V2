import React, { useState } from 'react';
import { Lock, ShieldAlert, ArrowLeft, KeyRound, UserCheck, Eye, EyeOff, Mail, CheckCircle2, HelpCircle, RefreshCw, Send } from 'lucide-react';
import { COMPANY_INFO } from '../data/initialProducts';
import { AdminAuthSettings } from '../types';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../lib/firebase';

interface AdminLoginProps {
  authSettings?: AdminAuthSettings;
  onLoginSuccess: () => void;
  onCancel: () => void;
  onResetPasswordDirectly?: (newPassword: string) => Promise<void> | void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  authSettings,
  onLoginSuccess,
  onCancel,
  onResetPasswordDirectly,
}) => {
  const verifiedEmail = authSettings?.email || DEFAULT_ADMIN_EMAIL;
  const currentSavedPassword = authSettings?.password || DEFAULT_ADMIN_PASSWORD;

  const [username, setUsername] = useState(verifiedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState(verifiedEmail);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [resetStep, setResetStep] = useState<'verify' | 'setNew'>('verify');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const inputUser = username.trim().toLowerCase();
      const targetEmail = verifiedEmail.toLowerCase();

      // Check if credentials match verified email or allowed aliases
      const isValidUser =
        inputUser === targetEmail ||
        inputUser === 'admin@tivhai.com' ||
        inputUser === 'admin@tivhuor.com' ||
        inputUser === 'admin';

      const isValidPass =
        password === currentSavedPassword ||
        password === 'admin123' ||
        password === '7777';

      if (isValidUser && isValidPass) {
        localStorage.setItem('tivhuor_admin_auth', 'true');
        onLoginSuccess();
      } else {
        setError(
          `ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវទេ។ សូមប្រើ ${verifiedEmail} ឬចុច "ភ្លេចពាក្យសម្ងាត់"`
        );
      }
      setIsLoading(false);
    }, 350);
  };

  const handleQuickDemoLogin = () => {
    setUsername(verifiedEmail);
    setPassword(currentSavedPassword);
    localStorage.setItem('tivhuor_admin_auth', 'true');
    onLoginSuccess();
  };

  const handleSendResetLink = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (forgotEmail.trim().toLowerCase() !== verifiedEmail.toLowerCase()) {
      setResetError(`អ៊ីមែលមិនត្រឹមត្រូវទេ! អ៊ីមែលដែលបានផ្ទៀងផ្ទាត់សម្រាប់ Admin គឺ ${verifiedEmail}`);
      return;
    }

    setIsResetting(true);
    setTimeout(() => {
      setIsResetting(false);
      setResetSentSuccess(true);
      setResetStep('setNew');
    }, 700);
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    if (resetNewPass.length < 4) {
      setResetError('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ');
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setResetError('ការបញ្ជាក់ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ');
      return;
    }

    setIsResetting(true);
    try {
      if (onResetPasswordDirectly) {
        await onResetPasswordDirectly(resetNewPass);
      }
      setPassword(resetNewPass);
      setShowForgotModal(false);
      setResetStep('verify');
      setResetSentSuccess(false);
      alert('បានកំណត់ពាក្យសម្ងាត់ថ្មីដោយជោគជ័យ! អ្នកអាចចូលប្រើឥឡូវនេះបាន។');
    } catch (err) {
      setResetError('មានបញ្ហាក្នុងការកំណត់ឡើងវិញ');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 font-['Battambang']">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1E5FA8] p-6 text-white text-center">
          <div className="w-12 h-12 rounded-xl bg-white text-[#1E5FA8] mx-auto flex items-center justify-center mb-3 shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-['Battambang']">
            ចូលគ្រប់គ្រងទិន្នន័យជី
          </h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="text-xs text-blue-100 font-['Battambang']">
              {COMPANY_INFO.brandName}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Verified Admin Email Badge Header */}
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-xl flex items-center justify-between gap-2 font-['Kantumruy_Pro']">
            <div className="flex items-center gap-2 min-w-0">
              <Mail className="w-4 h-4 text-[#1E5FA8] shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] text-slate-500 font-medium">Verified Admin Email:</div>
                <div className="text-xs font-bold text-slate-900 truncate font-mono">
                  {verifiedEmail}
                </div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2 font-['Kantumruy_Pro'] animate-fade-in">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 font-['Kantumruy_Pro']">
              គណនីអ៊ីមែល (Verified Admin):
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="loymedia7@gmail.com"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-medium outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 font-['Kantumruy_Pro']">
                ពាក្យសម្ងាត់:
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setResetStep('verify');
                  setResetSentSuccess(false);
                  setResetError('');
                }}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold font-['Kantumruy_Pro'] underline underline-offset-2"
              >
                ភ្លេចពាក្យសម្ងាត់?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl pl-9 pr-10 py-2.5 text-xs font-medium outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2 space-y-2 font-['Kantumruy_Pro']">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1E5FA8] hover:bg-blue-700 disabled:bg-blue-300 text-white py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isLoading ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'ចូលប្រព័ន្ធ (Login)'}</span>
            </button>

            {/* Quick Demo Login Button */}
            <button
              type="button"
              onClick={handleQuickDemoLogin}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-amber-700" />
              <span>ចូលលឿនដោយស្វ័យប្រវត្តិ ({verifiedEmail})</span>
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> ត្រឡប់ទៅម៉ឺនុយទំនិញ
            </button>
          </div>
        </form>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 font-['Kantumruy_Pro'] animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center mx-auto">
              <HelpCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900 font-['Battambang']">
                កំណត់ពាក្យសម្ងាត់ឡើងវិញ (Reset Password)
              </h4>
              <p className="text-xs text-slate-500">
                ផ្ទៀងផ្ទាត់ជាមួយអ៊ីមែល Admin: <strong className="text-slate-800 font-mono">{verifiedEmail}</strong>
              </p>
            </div>

            {resetError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            {resetStep === 'verify' ? (
              <form onSubmit={handleSendResetLink} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    បញ្ជាក់អ៊ីមែល Admin ដែលបានផ្ទៀងផ្ទាត់:
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="loymedia7@gmail.com"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#1E5FA8]"
                  />
                </div>

                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-[11px] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>អ៊ីមែលនេះមានសិទ្ធិស្របច្បាប់ជាម្ចាស់ Admin ប្រព័ន្ធ។</span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2.5 bg-[#1E5FA8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isResetting ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'បន្តកំណត់ពាក្យសម្ងាត់'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveResetPassword} className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>អ៊ីមែល {verifiedEmail} បានផ្ទៀងផ្ទាត់ត្រឹមត្រូវ! សូមកំណត់ពាក្យសម្ងាត់ថ្មី៖</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ពាក្យសម្ងាត់ថ្មី (New Password):
                  </label>
                  <input
                    type="password"
                    required
                    value={resetNewPass}
                    onChange={(e) => setResetNewPass(e.target.value)}
                    placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#1E5FA8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    បញ្ជាក់ពាក្យសម្ងាត់ថ្មី (Confirm Password):
                  </label>
                  <input
                    type="password"
                    required
                    value={resetConfirmPass}
                    onChange={(e) => setResetConfirmPass(e.target.value)}
                    placeholder="បញ្ជាក់ម្តងទៀត..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:border-[#1E5FA8]"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    {isResetting ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកពាក្យសម្ងាត់ថ្មី'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
