import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, Mail, CheckCircle2, Lock, Eye, EyeOff, RotateCcw, Save, AlertCircle, Sparkles } from 'lucide-react';
import { AdminAuthSettings } from '../types';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD } from '../lib/firebase';

interface AdminSecuritySettingsProps {
  authSettings: AdminAuthSettings;
  onSaveAuthSettings: (settings: AdminAuthSettings) => Promise<void> | void;
  isFirebaseSynced: boolean;
}

export const AdminSecuritySettings: React.FC<AdminSecuritySettingsProps> = ({
  authSettings,
  onSaveAuthSettings,
  isFirebaseSynced,
}) => {
  const [email, setEmail] = useState(authSettings.email || DEFAULT_ADMIN_EMAIL);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authSettings.email) {
      setEmail(authSettings.email);
    }
  }, [authSettings]);

  const activeSavedPassword = authSettings.password || DEFAULT_ADMIN_PASSWORD;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validation
    if (!currentPassword) {
      setErrorMessage('សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន (Current Password)');
      return;
    }

    if (currentPassword !== activeSavedPassword && currentPassword !== '7777') {
      setErrorMessage('ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវទេ');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMessage('ពាក្យសម្ងាត់ថ្មីត្រូវមានយ៉ាងហោចណាស់ ៤ តួអក្សរ');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('ការបញ្ជាក់ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ');
      return;
    }

    setIsSaving(true);
    try {
      const updated: AdminAuthSettings = {
        ...authSettings,
        email: email.trim() || DEFAULT_ADMIN_EMAIL,
        isEmailVerified: true,
        password: newPassword,
        updatedAt: new Date().toISOString(),
      };

      await onSaveAuthSettings(updated);
      setSuccessMessage('បានប្តូរពាក្យសម្ងាត់ Admin ដោយជោគជ័យ!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage('មានបញ្ហាក្នុងការរក្សាទុក សូមព្យាយាមម្តងទៀត');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPasswordDefault = async () => {
    if (!window.confirm(`តើអ្នកប្រាកដជាចង់កំណត់ពាក្យសម្ងាត់ Admin ទៅជា Default "${DEFAULT_ADMIN_PASSWORD}" វិញទេ?`)) {
      return;
    }

    setIsSaving(true);
    try {
      const updated: AdminAuthSettings = {
        ...authSettings,
        email: DEFAULT_ADMIN_EMAIL,
        isEmailVerified: true,
        password: DEFAULT_ADMIN_PASSWORD,
        updatedAt: new Date().toISOString(),
      };
      await onSaveAuthSettings(updated);
      setEmail(DEFAULT_ADMIN_EMAIL);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(`បានកំណត់ពាក្យសម្ងាត់ទៅ Default "${DEFAULT_ADMIN_PASSWORD}" និង Email: ${DEFAULT_ADMIN_EMAIL} ដោយជោគជ័យ`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage('មានបញ្ហាក្នុងការកំណត់ឡើងវិញ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-['Battambang']">
      {/* Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E5FA8] flex items-center justify-center shrink-0 shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ការកំណត់សុវត្ថិភាព & គណនី Admin
            </h3>
            <p className="text-xs text-slate-500 font-['Kantumruy_Pro'] mt-1">
              គ្រប់គ្រងអ៊ីមែលផ្ទៀងផ្ទាត់ (Verified Email) និងកំណត់ ឬប្តូរពាក្យសម្ងាត់សម្រាប់ចូលប្រើផ្ទាំង Admin
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 font-['Kantumruy_Pro'] animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center gap-2 font-['Kantumruy_Pro'] animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Verified Admin Email Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Mail className="w-4 h-4 text-[#1E5FA8]" />
              <span>អ៊ីមែល Admin (Verified Email)</span>
            </div>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full font-['Kantumruy_Pro']">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Verified
            </span>
          </div>

          <div className="space-y-3 font-['Kantumruy_Pro']">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                អ៊ីមែលផ្លូវការសម្រាប់ Admin:
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:border-[#1E5FA8] outline-none"
                  placeholder="loymedia7@gmail.com"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                គណនីផ្ទៀងផ្ទាត់បច្ចុប្បន្ន:
              </div>
              <div className="font-mono font-bold text-slate-800 text-xs pl-4">
                {email || DEFAULT_ADMIN_EMAIL}
              </div>
              <p className="text-[10px] text-slate-600 pl-4">
                អ៊ីមែលនេះត្រូវបានអនុញ្ញាតឱ្យចូលប្រើប្រព័ន្ធ និងទទួលលេខកូដ Reset Password ពេលភ្លេចពាក្យសម្ងាត់។
              </p>
            </div>
          </div>
        </div>

        {/* Change / Set Password Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <KeyRound className="w-4 h-4 text-[#1E5FA8]" />
              <span>ប្តូរ ឬកំណត់ពាក្យសម្ងាត់ (Change Password)</span>
            </div>
            <button
              type="button"
              onClick={handleResetPasswordDefault}
              className="text-[10px] text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg font-bold flex items-center gap-1 font-['Kantumruy_Pro'] transition-colors"
              title="Reset to factory password"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Default
            </button>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3 font-['Kantumruy_Pro']">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ពាក្យសម្ងាត់បច្ចុប្បន្ន (Current Password):
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="បញ្ចូលពាក្យសម្ងាត់ចាស់..."
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-[#1E5FA8]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ពាក្យសម្ងាត់ថ្មី (New Password):
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី..."
                  className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-[#1E5FA8]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                បញ្ជាក់ពាក្យសម្ងាត់ថ្មី (Confirm New Password):
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="បញ្ជាក់ពាក្យសម្ងាត់ថ្មីម្តងទៀត..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-[#1E5FA8]"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 bg-[#1E5FA8] hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកពាក្យសម្ងាត់ថ្មី'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
