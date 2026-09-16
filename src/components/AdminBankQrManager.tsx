import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Check, Upload, Image as ImageIcon, QrCode, ShieldCheck, Eye, RefreshCw, Star, AlertCircle } from 'lucide-react';
import { BankPaymentAccount } from '../types';

interface AdminBankQrManagerProps {
  bankAccounts: BankPaymentAccount[];
  onSaveBankAccounts: (accounts: BankPaymentAccount[]) => void;
  isFirebaseSynced?: boolean;
}

export const AdminBankQrManager: React.FC<AdminBankQrManagerProps> = ({
  bankAccounts,
  onSaveBankAccounts,
  isFirebaseSynced = true,
}) => {
  const [editingAccount, setEditingAccount] = useState<BankPaymentAccount | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [previewQrModal, setPreviewQrModal] = useState<BankPaymentAccount | null>(null);

  // Form State
  const [bankId, setBankId] = useState<BankPaymentAccount['bankId']>('aba');
  const [bankName, setBankName] = useState('');
  const [bankNameKh, setBankNameKh] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'KHR' | 'BOTH'>('BOTH');
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [descriptionKh, setDescriptionKh] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [logoBgColor, setLogoBgColor] = useState('#005F83');
  const [isEnabled, setIsEnabled] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  const startCreate = () => {
    setEditingAccount(null);
    setBankId('aba');
    setBankName('ABA Bank');
    setBankNameKh('ធនាគារ វឌ្ឍនៈអាស៊ីចំកាត់ (ABA Bank)');
    setAccountName('TIV HUOR CO., LTD');
    setAccountNumber('');
    setCurrency('BOTH');
    setQrImageUrl('');
    setDescriptionKh('ស្កេនទូទាត់រហ័សតាម ABA Mobile');
    setBadgeText('ABA');
    setLogoBgColor('#005F83');
    setIsEnabled(true);
    setIsDefault(bankAccounts.length === 0);
    setIsCreating(true);
  };

  const startEdit = (acc: BankPaymentAccount) => {
    setEditingAccount(acc);
    setBankId(acc.bankId);
    setBankName(acc.bankName);
    setBankNameKh(acc.bankNameKh);
    setAccountName(acc.accountName);
    setAccountNumber(acc.accountNumber);
    setCurrency(acc.currency);
    setQrImageUrl(acc.qrImageUrl);
    setDescriptionKh(acc.descriptionKh || '');
    setBadgeText(acc.badgeText || acc.bankName);
    setLogoBgColor(acc.logoBgColor || '#1E5FA8');
    setIsEnabled(acc.isEnabled);
    setIsDefault(acc.isDefault || false);
    setIsCreating(false);
  };

  const handleBankPresetChange = (preset: BankPaymentAccount['bankId']) => {
    setBankId(preset);
    if (preset === 'aba') {
      setBankName('ABA Bank');
      setBankNameKh('ធនាគារ វឌ្ឍនៈអាស៊ីចំកាត់ (ABA Bank)');
      setBadgeText('ABA');
      setLogoBgColor('#005F83');
      setDescriptionKh('ស្កេនទូទាត់រហ័សតាម ABA Mobile');
    } else if (preset === 'acleda') {
      setBankName('ACLEDA Bank');
      setBankNameKh('ធនាគារ អេស៊ីលីដា ភីអិលស៊ី (ACLEDA Mobile)');
      setBadgeText('ACLEDA');
      setLogoBgColor('#0E2856');
      setDescriptionKh('ស្កេនទូទាត់តាម ACLEDA Mobile');
    } else if (preset === 'wing') {
      setBankName('Wing Bank');
      setBankNameKh('ធនាគារ វីង (Wing Bank)');
      setBadgeText('WING');
      setLogoBgColor('#88C057');
      setDescriptionKh('ស្កេនទូទាត់តាម Wing Bank App');
    } else if (preset === 'bakong') {
      setBankName('Bakong KHQR');
      setBankNameKh('បាគង KHQR សកល (Bakong)');
      setBadgeText('KHQR');
      setLogoBgColor('#E1251B');
      setDescriptionKh('គាំទ្រស្កេនទូទាត់គ្រប់ធនាគារទាំងអស់នៅកម្ពុជា');
    } else if (preset === 'canadia') {
      setBankName('Canadia Bank');
      setBankNameKh('ធនាគារ កាណាឌីយ៉ា (Canadia Bank)');
      setBadgeText('CANADIA');
      setLogoBgColor('#C41230');
      setDescriptionKh('ស្កេនទូទាត់តាម Canadia Bank App');
    } else if (preset === 'sathapana') {
      setBankName('Sathapana Bank');
      setBankNameKh('ធនាគារ សហគ្រាសធុនតូច និងមធ្យម (Sathapana)');
      setBadgeText('SATHAPANA');
      setLogoBgColor('#1D4E89');
      setDescriptionKh('ស្កេនទូទាត់តាម Sathapana Mobile');
    } else if (preset === 'vattanac') {
      setBankName('Vattanac Bank');
      setBankNameKh('ធនាគារ វឌ្ឍនៈ (Vattanac Bank)');
      setBadgeText('VATTANAC');
      setLogoBgColor('#9E1B32');
      setDescriptionKh('ស្កេនទូទាត់តាម Vattanac Bank App');
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('ទំហំរូបភាពធំជាង 5MB សូមជ្រើសរើសរូបភាពដែលមានទំហំតូចជាងនេះ');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setQrImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !accountNumber.trim()) {
      alert('សូមបញ្ចូលឈ្មោះម្ចាស់គណនី និងលេខគណនីធនាគារ');
      return;
    }

    let finalQrUrl = qrImageUrl.trim();
    if (!finalQrUrl) {
      // Generate default fallback QR pointing to bank transfer info
      finalQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=Bank:${encodeURIComponent(bankName)}|Acc:${encodeURIComponent(accountNumber)}|Name:${encodeURIComponent(accountName)}`;
    }

    const newAccount: BankPaymentAccount = {
      id: editingAccount ? editingAccount.id : `bank-${Date.now()}`,
      bankId,
      bankName: bankName.trim(),
      bankNameKh: bankNameKh.trim() || bankName.trim(),
      accountName: accountName.trim().toUpperCase(),
      accountNumber: accountNumber.trim(),
      currency,
      qrImageUrl: finalQrUrl,
      descriptionKh: descriptionKh.trim(),
      badgeText: badgeText.trim() || bankName.trim(),
      logoBgColor,
      isEnabled,
      isDefault,
      order: editingAccount ? editingAccount.order : bankAccounts.length + 1,
      updatedAt: new Date().toISOString(),
    };

    let updatedList: BankPaymentAccount[];
    if (editingAccount) {
      updatedList = bankAccounts.map((a) => (a.id === editingAccount.id ? newAccount : a));
    } else {
      updatedList = [...bankAccounts, newAccount];
    }

    // If marked default, remove default from others
    if (isDefault) {
      updatedList = updatedList.map((a) =>
        a.id === newAccount.id ? { ...a, isDefault: true } : { ...a, isDefault: false }
      );
    }

    onSaveBankAccounts(updatedList);
    setEditingAccount(null);
    setIsCreating(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('តើអ្នកពិតជាចង់លុបគណនីធនាគារ QR នេះមែនទេ?')) {
      const updated = bankAccounts.filter((a) => a.id !== id);
      onSaveBankAccounts(updated);
    }
  };

  const handleToggleEnable = (id: string) => {
    const updated = bankAccounts.map((a) => (a.id === id ? { ...a, isEnabled: !a.isEnabled } : a));
    onSaveBankAccounts(updated);
  };

  const handleSetDefault = (id: string) => {
    const updated = bankAccounts.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    onSaveBankAccounts(updated);
  };

  return (
    <div className="space-y-6 font-['Kantumruy_Pro']">
      {/* Header with Title & Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 font-['Battambang'] flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#1E5FA8]" />
            គ្រប់គ្រងរូបភាព QR Code ធនាគារសម្រាប់អតិថិជនទូទាត់
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            អតិថិជនអាចជ្រើសរើសធនាគារដែលខ្លួនចង់ទូទាត់ (ABA, ACLEDA, Wing, Canadia...)។ លោកអ្នកអាច Upload រូបភាព QR ផ្លូវការរបស់ធនាគារនីមួយៗបានដោយសេរី។
          </p>
        </div>

        {!isCreating && !editingAccount && (
          <button
            onClick={startCreate}
            className="px-4 py-2.5 bg-[#1E5FA8] hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមធនាគារ / QR ថ្មី</span>
          </button>
        )}
      </div>

      {/* Form Section (Create / Edit) */}
      {(isCreating || editingAccount) && (
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-blue-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 font-['Battambang'] flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-[#1E5FA8]" />
              {isCreating ? 'បន្ថែមគណនីធនាគារ និង Upload QR ថ្មី' : `កែប្រែ QR ធនាគារ: ${bankName}`}
            </h4>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingAccount(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 px-3 py-1 bg-slate-100 rounded-lg"
            >
              បោះបង់ (Cancel)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Bank Information */}
            <div className="lg:col-span-7 space-y-4">
              {/* Preset Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ជ្រើសរើសប្រភេទធនាគារ (Bank Type)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'aba', label: 'ABA Bank', color: '#005F83' },
                    { id: 'acleda', label: 'ACLEDA', color: '#0E2856' },
                    { id: 'wing', label: 'Wing Bank', color: '#88C057' },
                    { id: 'bakong', label: 'Bakong KHQR', color: '#E1251B' },
                    { id: 'canadia', label: 'Canadia', color: '#C41230' },
                    { id: 'sathapana', label: 'Sathapana', color: '#1D4E89' },
                    { id: 'vattanac', label: 'Vattanac', color: '#9E1B32' },
                    { id: 'custom', label: 'ផ្សេងៗ (Other)', color: '#334155' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleBankPresetChange(preset.id as BankPaymentAccount['bankId'])}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center gap-1 ${
                        bankId === preset.id
                          ? 'border-blue-600 bg-blue-50 text-[#1E5FA8] shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="truncate w-full">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Name (Khmer & English) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះធនាគារ (English / Short) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    placeholder="e.g. ABA Bank"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1E5FA8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះធនាគារជាភាសាខ្មែរ
                  </label>
                  <input
                    type="text"
                    value={bankNameKh}
                    onChange={(e) => setBankNameKh(e.target.value)}
                    placeholder="e.g. ធនាគារ វឌ្ឍនៈអាស៊ីចំកាត់ (ABA)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1E5FA8]"
                  />
                </div>
              </div>

              {/* Account Name & Account Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ឈ្មោះម្ចាស់គណនី (Account Name) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    required
                    placeholder="e.g. TIV HUOR CO., LTD"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-[#1E5FA8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    លេខគណនី (Account Number) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    required
                    placeholder="e.g. 001 588 999"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#1E5FA8]"
                  />
                </div>
              </div>

              {/* Currency & Description */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    រូបិយប័ណ្ណគាំទ្រ (Currency)
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as 'USD' | 'KHR' | 'BOTH')}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-[#1E5FA8]"
                  >
                    <option value="BOTH">ទាំងពីរ (USD & KHR)</option>
                    <option value="USD">តែដុល្លារ ($ USD)</option>
                    <option value="KHR">តែរៀល (៛ KHR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ស្លាកសញ្ញាធនាគារ (Badge Text)
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    placeholder="e.g. ABA / WING"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#1E5FA8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ការណែនាំខ្លីៗសម្រាប់អតិថិជន
                </label>
                <input
                  type="text"
                  value={descriptionKh}
                  onChange={(e) => setDescriptionKh(e.target.value)}
                  placeholder="e.g. ស្កេនទូទាត់រហ័សតាម ABA Mobile (USD & KHR)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#1E5FA8]"
                />
              </div>

              {/* Status checkboxes */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>បើកដំណើរការ (Active for customers)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>ជ្រើសជាធនាគារចម្បង (Default Bank)</span>
                </label>
              </div>
            </div>

            {/* Right: Upload Static Image QR */}
            <div className="lg:col-span-5 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">
                រូបភាព QR Code ធនាគារ (Bank QR Image) <span className="text-red-500">*</span>
              </label>

              {/* QR Image Preview Box */}
              <div className="w-full aspect-square max-w-[260px] mx-auto bg-white rounded-xl border-2 border-dashed border-slate-300 p-2 flex flex-col items-center justify-center relative overflow-hidden shadow-2xs">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="Bank QR Preview"
                    className="w-full h-full object-contain rounded-lg"
                  />
                ) : (
                  <div className="text-center p-4">
                    <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <span className="text-xs text-slate-500 block">មិនទាន់មានរូបភាព QR</span>
                    <span className="text-[10px] text-slate-400">សូម Upload រូបភាព QR ពីកុំព្យូទ័រ/ទូរស័ព្ទ</span>
                  </div>
                )}
              </div>

              {/* Upload Input */}
              <div className="space-y-2">
                <label className="w-full py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-2xs">
                  <Upload className="w-4 h-4 text-[#1E5FA8]" />
                  <span>ជ្រើសរើសរូបភាព QR (Upload Image)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>

                {/* Direct Image URL input */}
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">
                    ឬបញ្ចូលតំណភ្ជាប់រូបភាព QR (Direct Image URL):
                  </span>
                  <input
                    type="url"
                    value={qrImageUrl}
                    onChange={(e) => setQrImageUrl(e.target.value)}
                    placeholder="https://example.com/qr-code.png"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:border-[#1E5FA8]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingAccount(null);
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
            >
              <Check className="w-4 h-4" />
              <span>រក្សាទុកគណនីធនាគារ (Save Bank QR)</span>
            </button>
          </div>
        </form>
      )}

      {/* Bank Accounts Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map((acc) => (
          <div
            key={acc.id}
            className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between gap-3 relative shadow-xs ${
              acc.isEnabled ? 'border-slate-200 hover:border-blue-300' : 'border-slate-200 opacity-60 bg-slate-50/50'
            }`}
          >
            {/* Top Bar with Bank Badge & Default Star */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl text-white font-mono font-bold flex items-center justify-center text-xs shadow-xs shrink-0"
                  style={{ backgroundColor: acc.logoBgColor || '#1E5FA8' }}
                >
                  {acc.badgeText || acc.bankName.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-slate-900 text-sm font-['Battambang']">
                      {acc.bankName}
                    </h4>
                    {acc.isDefault && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate">
                    {acc.bankNameKh}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <button
                type="button"
                onClick={() => handleToggleEnable(acc.id)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  acc.isEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
                title="ចុចដើម្បីបើក/បិទដំណើរការ"
              >
                {acc.isEnabled ? '● Active' : '○ Disabled'}
              </button>
            </div>

            {/* Middle: Account Details & QR Thumbnail */}
            <div className="flex items-center gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
              <div
                onClick={() => setPreviewQrModal(acc)}
                className="w-16 h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center shrink-0 cursor-pointer group relative overflow-hidden"
                title="ចុចដើម្បីមើលរូបភាព QR ពេញទំហំ"
              >
                <img
                  src={acc.qrImageUrl}
                  alt={acc.bankName}
                  className="w-full h-full object-contain rounded"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Account Name:</div>
                <div className="font-mono font-bold text-xs text-slate-800 truncate">
                  {acc.accountName}
                </div>
                <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  Account Number:
                </div>
                <div className="font-mono font-bold text-xs text-[#1E5FA8] truncate">
                  {acc.accountNumber}
                </div>
              </div>
            </div>

            {/* Bottom Actions: Edit, Delete, Default */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => handleSetDefault(acc.id)}
                disabled={acc.isDefault}
                className={`text-[11px] font-bold transition-colors ${
                  acc.isDefault
                    ? 'text-slate-400 cursor-default'
                    : 'text-blue-600 hover:text-blue-800 hover:underline cursor-pointer'
                }`}
              >
                {acc.isDefault ? '✓ ធនាគារចម្បង' : 'កំណត់ជាចម្បង'}
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startEdit(acc)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="កែប្រែ"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(acc.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="លុប"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QR Preview Enlarge Modal */}
      {previewQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 text-center shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-bold text-slate-900 font-['Battambang'] text-sm">
                QR Code: {previewQrModal.bankName}
              </h4>
              <button
                onClick={() => setPreviewQrModal(null)}
                className="text-slate-400 hover:text-slate-700 text-xs p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="w-64 h-64 mx-auto bg-white rounded-xl border border-slate-200 p-2 shadow-inner flex items-center justify-center">
              <img
                src={previewQrModal.qrImageUrl}
                alt={previewQrModal.bankName}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-mono space-y-1">
              <div className="text-slate-500 font-sans">
                {previewQrModal.bankNameKh}
              </div>
              <div className="font-bold text-slate-900">
                {previewQrModal.accountName}
              </div>
              <div className="font-bold text-[#1E5FA8]">
                {previewQrModal.accountNumber}
              </div>
            </div>

            <button
              onClick={() => setPreviewQrModal(null)}
              className="w-full py-2 bg-[#1E5FA8] hover:bg-blue-800 text-white rounded-xl text-xs font-bold font-['Battambang']"
            >
              បិទផ្ទាំង (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
