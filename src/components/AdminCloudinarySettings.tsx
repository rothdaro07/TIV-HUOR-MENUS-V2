import React, { useState } from 'react';
import { Cloud, Key, Folder, Check, RefreshCw, Upload, AlertCircle, CheckCircle2, ShieldCheck, Database } from 'lucide-react';
import {
  CloudinaryConfig,
  getCloudinaryConfig,
  saveCloudinaryConfig,
  DEFAULT_CLOUDINARY_CONFIG,
  uploadToCloudinary,
} from '../lib/cloudinary';
import firebaseConfig from '../../firebase-applet-config.json';

interface AdminCloudinarySettingsProps {
  isFirebaseSynced?: boolean;
}

export const AdminCloudinarySettings: React.FC<AdminCloudinarySettingsProps> = ({
  isFirebaseSynced = true,
}) => {
  const [config, setConfig] = useState<CloudinaryConfig>(getCloudinaryConfig);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResultUrl, setTestResultUrl] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveCloudinaryConfig(config);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('តើអ្នកចង់កំណត់ព័ត៌មាន Cloudinary ត្រឡប់ទៅជាទិន្នន័យដើមវិញទេ?')) {
      setConfig(DEFAULT_CLOUDINARY_CONFIG);
      saveCloudinaryConfig(DEFAULT_CLOUDINARY_CONFIG);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handleTestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTestStatus('testing');
    setTestError(null);
    setTestResultUrl(null);

    try {
      const url = await uploadToCloudinary(file);
      setTestResultUrl(url);
      setTestStatus('success');
    } catch (err: any) {
      console.error('Test upload failed', err);
      setTestError(err.message || 'Upload connection failed');
      setTestStatus('error');
    }
  };

  return (
    <div className="space-y-6 font-['Kantumruy_Pro']">
      {/* Overview Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Firebase Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 font-['Battambang'] text-base">
                Firebase Firestore
              </h4>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isFirebaseSynced
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isFirebaseSynced ? '● ដំណើរការល្អ (Connected)' : '● កំពុងតភ្ជាប់'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Project ID: <span className="font-mono font-bold text-slate-700">{firebaseConfig.projectId}</span>
            </p>
            <p className="text-xs text-slate-500">
              Database: <span className="font-mono text-[11px] text-slate-600">{firebaseConfig.firestoreDatabaseId || '(default)'}</span>
            </p>
          </div>
        </div>

        {/* Cloudinary Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1E5FA8] flex items-center justify-center shrink-0">
            <Cloud className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 font-['Battambang'] text-base">
                Cloudinary Media Storage
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1E5FA8]">
                ● សកម្ម (Active)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cloud Name: <span className="font-mono font-bold text-slate-700">{config.cloudName}</span>
            </p>
            <p className="text-xs text-slate-500">
              Target Folder: <span className="font-mono font-bold text-slate-700">{config.folder}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Cloudinary Credentials Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="border-b border-slate-100 pb-4 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold font-['Battambang'] text-slate-900 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#1E5FA8]" />
              កំណត់ការតភ្ជាប់ Cloudinary API
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              ព័ត៌មានគណនី Cloudinary សម្រាប់ផ្ទុករូបភាពបាវជី និងរូបភាពផ្សព្វផ្សាយនានា
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>កំណត់តម្លៃដើម</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-2xl">
          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>បានរក្សាទុកការកំណត់ Cloudinary ដោយជោគជ័យ!</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cloud Name *
              </label>
              <input
                type="text"
                required
                value={config.cloudName}
                onChange={(e) => setConfig({ ...config, cloudName: e.target.value })}
                placeholder="dismpss5e"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Folder ផ្ទុករូបភាព *
              </label>
              <input
                type="text"
                required
                value={config.folder}
                onChange={(e) => setConfig({ ...config, folder: e.target.value })}
                placeholder="TIVHUOR"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Key *
              </label>
              <input
                type="text"
                required
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="754832176547499"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                API Secret *
              </label>
              <input
                type="password"
                required
                value={config.apiSecret}
                onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
                placeholder="••••••••••••••••••••"
                className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#1E5FA8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>រក្សាទុកព័ត៌មាន Cloudinary</span>
            </button>
          </div>
        </form>
      </div>

      {/* Test Cloudinary Upload Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h3 className="text-base font-bold font-['Battambang'] text-slate-900 flex items-center gap-2 mb-2">
          <Upload className="w-5 h-5 text-emerald-600" />
          សាកល្បង Upload រូបភាពទៅកាន់ Cloudinary
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          ជ្រើសរើសរូបភាពណាមួយដើម្បីសាកល្បងការតភ្ជាប់ទៅកាន់ Cloudinary Cloud ({config.cloudName})
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>{testStatus === 'testing' ? 'កំពុង Upload...' : 'ជ្រើសរើសរូបភាពសាកល្បង'}</span>
            <input
              type="file"
              accept="image/*"
              disabled={testStatus === 'testing'}
              onChange={handleTestUpload}
              className="hidden"
            />
          </label>

          {testStatus === 'success' && testResultUrl && (
            <div className="flex items-center gap-3 p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <img
                src={testResultUrl}
                alt="Uploaded test"
                referrerPolicy="no-referrer"
                className="w-10 h-10 object-cover rounded-lg"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-800">Upload ជោគជ័យ!</span>
                <a
                  href={testResultUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[10px] text-blue-600 underline font-mono truncate max-w-xs"
                >
                  {testResultUrl}
                </a>
              </div>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{testError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
