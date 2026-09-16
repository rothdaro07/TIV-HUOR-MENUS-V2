import React, { useState } from 'react';
import { Download, Upload, Database, RotateCcw, CheckCircle2, AlertTriangle, FileText, Layers, Tag, Package, Building2, Sparkles } from 'lucide-react';
import { Product, Category, CompanyProfile, SystemBackupData } from '../types';
import { DEFAULT_ADMIN_EMAIL } from '../lib/firebase';

interface AdminBackupManagerProps {
  products: Product[];
  categories: Category[];
  companyProfile: CompanyProfile;
  onRestoreBackup: (backupData: SystemBackupData) => Promise<void> | void;
  onResetFactory: () => Promise<void> | void;
  isFirebaseSynced: boolean;
}

export const AdminBackupManager: React.FC<AdminBackupManagerProps> = ({
  products,
  categories,
  companyProfile,
  onRestoreBackup,
  onResetFactory,
  isFirebaseSynced,
}) => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<SystemBackupData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Generate & Download Backup JSON file
  const handleDownloadBackup = () => {
    try {
      const backupData: SystemBackupData = {
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        companyProfile,
        categories,
        products,
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const dateStr = new Date().toISOString().slice(0, 10);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = url;
      downloadAnchor.download = `TivHai_Database_Backup_${dateStr}.json`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      URL.revokeObjectURL(url);

      setSuccessMessage(`បានទាញយកឯកសារ Backup ដោយជោគជ័យ (សរុប ${products.length} មុខទំនិញ, ${categories.length} ប្រភេទ)`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage('មានបញ្ហាក្នុងការទាញយកឯកសារ');
    }
  };

  // Handle Upload & Validate JSON file
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        let normalizedBackup: SystemBackupData;
        if (Array.isArray(parsed)) {
          // Legacy product-only array
          normalizedBackup = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            categories,
            products: parsed,
          };
        } else if (parsed.products && Array.isArray(parsed.products)) {
          normalizedBackup = {
            version: parsed.version || '1.2',
            exportedAt: parsed.exportedAt || new Date().toISOString(),
            companyProfile: parsed.companyProfile || companyProfile,
            categories: Array.isArray(parsed.categories) ? parsed.categories : categories,
            products: parsed.products,
          };
        } else {
          throw new Error('Invalid backup schema');
        }

        setPendingBackup(normalizedBackup);
        setShowConfirmModal(true);
      } catch (err) {
        setErrorMessage('ឯកសារ JSON មិនត្រឹមត្រូវ ឬខូចទម្រង់។ សូមពិនិត្យឯកសារម្តងទៀត។');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleConfirmRestore = async () => {
    if (!pendingBackup) return;
    setIsLoading(true);
    try {
      await onRestoreBackup(pendingBackup);
      setShowConfirmModal(false);
      setPendingBackup(null);
      setSuccessMessage(`បាននាំចូល និងស្ដារទិន្នន័យ ${pendingBackup.products.length} មុខទំនិញ និង ${pendingBackup.categories.length} ប្រភេទ ដោយជោគជ័យ!`);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err) {
      setErrorMessage('មានបញ្ហាក្នុងការស្ដារទិន្នន័យ');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFactoryResetConfirm = async () => {
    if (!window.confirm('⚠️ ការព្រមាន៖ ទិន្នន័យមុខជី និងប្រភេទដែលបានកែប្រែទាំងអស់នឹងត្រូវបានកំណត់ទៅជាទិន្នន័យដើមរបស់រោងចក្រវិញ។ តើអ្នកពិតជាចង់បន្តមែនទេ?')) {
      return;
    }
    setIsLoading(true);
    try {
      await onResetFactory();
      setSuccessMessage('បានកំណត់ទិន្នន័យទាំងអស់ត្រឡប់ទៅជា Default រួចរាល់!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setErrorMessage('មានបញ្ហាក្នុងការកំណត់ឡើងវិញ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-['Battambang']">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ទាញយក & បម្រុងទុកទិន្នន័យ (Download / Backup & Restore)
            </h3>
            <p className="text-xs text-slate-500 font-['Kantumruy_Pro'] mt-1">
              រក្សាទុកច្បាប់ចម្លងនៃទិន្នន័យមុខជី ប្រភេទ និងព័ត៌មានក្រុមហ៊ុន ដើម្បីការពារការបាត់បង់ទិន្នន័យ
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-bold px-3 py-1 rounded-full border font-['Kantumruy_Pro'] ${
            isFirebaseSynced
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {isFirebaseSynced ? '● Firestore Cloud Sync Active' : '● Local Offline Storage'}
        </span>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 font-['Kantumruy_Pro']">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-bold flex items-center gap-2 font-['Kantumruy_Pro']">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-['Kantumruy_Pro']">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">មុខទំនិញជីសរុប</div>
            <div className="text-xl font-bold font-mono text-slate-800">{products.length} មុខ</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">ប្រភេទមុខជី</div>
            <div className="text-xl font-bold font-mono text-slate-800">{categories.length} ប្រភេទ</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-500 font-medium truncate">កម្រងព័ត៌មានក្រុមហ៊ុន</div>
            <div className="text-sm font-bold text-slate-800 truncate font-['Battambang']">
              {companyProfile.nameKh || companyProfile.brandName}
            </div>
          </div>
        </div>
      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Download Backup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Download className="w-4 h-4 text-[#1E5FA8]" />
            <span>ទាញយកឯកសារ Backup (Download JSON)</span>
          </div>

          <p className="text-xs text-slate-600 font-['Kantumruy_Pro'] leading-relaxed">
            ទាញយកទិន្នន័យទាំងស្រុងនៃកាតាឡុកជី (មុខទំនិញ, តម្លៃ, រូបមន្ត NPK, រូបភាព, ប្រភេទ និងព័ត៌មានក្រុមហ៊ុន) ជាឯកសារស្តង់ដារ JSON។
          </p>

          <div className="pt-2">
            <button
              onClick={handleDownloadBackup}
              className="w-full py-3 bg-[#1E5FA8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs font-['Kantumruy_Pro']"
            >
              <Download className="w-4 h-4" />
              <span>ទាញយកទិន្នន័យឥឡូវនេះ (Export Backup .JSON)</span>
            </button>
          </div>
        </div>

        {/* Restore / Import Backup Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>ស្ដារទិន្នន័យឡើងវិញ (Restore / Import JSON)</span>
          </div>

          <p className="text-xs text-slate-600 font-['Kantumruy_Pro'] leading-relaxed">
            ផ្ទុកឯកសារ Backup JSON ដែលបានទាញយកពីមុនមក ដើម្បីស្ដារទិន្នន័យមុខជី និងប្រភេទឡើងវិញដោយស្វ័យប្រវត្តិ។
          </p>

          <div className="pt-2">
            <label className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer font-['Kantumruy_Pro']">
              <Upload className="w-4 h-4" />
              <span>ជ្រើសរើសឯកសារ Backup ដើម្បី Restore</span>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Reset Factory Danger Box */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 font-['Kantumruy_Pro']">
        <div className="space-y-1">
          <div className="font-bold text-xs text-amber-950 font-['Battambang'] flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <span>កំណត់ទិន្នន័យឡើងវិញទៅជាទិន្នន័យដើម (Reset to Factory Defaults)</span>
          </div>
          <p className="text-[11px] text-amber-800">
            កំណត់បញ្ជីមុខជី និងប្រភេទទាំងអស់ត្រឡប់ទៅជាទិន្នន័យស្តង់ដារដើមរបស់ក្រុមហ៊ុន ទីវ ហៃ វិញ។
          </p>
        </div>

        <button
          onClick={handleFactoryResetConfirm}
          disabled={isLoading}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Factory</span>
        </button>
      </div>

      {/* Confirmation Modal Before Restore */}
      {showConfirmModal && pendingBackup && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 font-['Kantumruy_Pro'] animate-scale-in">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900 font-['Battambang']">
                បញ្ជាក់ការស្ដារទិន្នន័យ (Restore Backup)
              </h4>
              <p className="text-xs text-slate-500">
                ឯកសារត្រូវបានពិនិត្យ និងត្រៀមស្ដារចូលប្រព័ន្ធ
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">មុខទំនិញ:</span>
                <span className="font-bold text-slate-900">{pendingBackup.products?.length || 0} មុខ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ប្រភេទ:</span>
                <span className="font-bold text-slate-900">{pendingBackup.categories?.length || 0} ប្រភេទ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">កាលបរិច្ឆេទ Backup:</span>
                <span className="font-bold text-slate-900">
                  {new Date(pendingBackup.exportedAt).toLocaleString('km-KH')}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              ⚠️ ចំណាំ៖ ការស្ដារនេះនឹងជំនួសទិន្នន័យមុខជី និងប្រភេទបច្ចុប្បន្នដោយស្វ័យប្រវត្តិ។
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingBackup(null);
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                បោះបង់
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                {isLoading ? 'កំពុងស្ដារ...' : 'យល់ព្រមស្ដារទិន្នន័យ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
