import React, { useState } from 'react';
import {
  User,
  Search,
  ShoppingBag,
  Check,
} from 'lucide-react';
import { Currency, CompanyProfile, ProductGroupId, PriceMode, Category } from '../types';
import { COMPANY_INFO, PRODUCT_GROUPS, INITIAL_CATEGORIES } from '../data/initialProducts';

interface HeaderProps {
  activeTab: 'catalog' | 'detail' | 'calculator' | 'admin' | 'contact';
  setActiveTab: (tab: 'catalog' | 'detail' | 'calculator' | 'admin' | 'contact') => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  priceMode?: PriceMode;
  setPriceMode?: (mode: PriceMode) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isAdminLoggedIn: boolean;
  companyProfile?: CompanyProfile;
  cartItemCount?: number;
  onOpenCart?: () => void;
  selectedGroup?: ProductGroupId;
  onSelectGroup?: (groupId: ProductGroupId) => void;
  categories?: Category[];
  selectedCategory?: string;
  onSelectCategory?: (categoryId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  priceMode = 'retail',
  setPriceMode,
  searchQuery,
  setSearchQuery,
  isAdminLoggedIn,
  companyProfile = COMPANY_INFO,
  cartItemCount = 0,
  onOpenCart,
  selectedGroup = 'all',
  onSelectGroup,
  categories = INITIAL_CATEGORIES,
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const handleGroupClick = (groupId: ProductGroupId) => {
    if (onSelectGroup) {
      onSelectGroup(groupId);
    }
    if (onSelectCategory) {
      onSelectCategory('all');
    }
    if (activeTab !== 'catalog') {
      setActiveTab('catalog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = (groupId: ProductGroupId, categoryId: string) => {
    if (onSelectGroup) {
      onSelectGroup(groupId);
    }
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
    if (activeTab !== 'catalog') {
      setActiveTab('catalog');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#1E5FA8] text-white shadow-md shrink-0">
      {/* 1. Main Brand & Search Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-4">
        {/* Company Logo & Brand Name */}
        <button
          onClick={() => {
            setActiveTab('catalog');
            if (onSelectGroup) onSelectGroup('all');
            if (onSelectCategory) onSelectCategory('all');
          }}
          className="flex items-center gap-2.5 sm:gap-3 text-left group focus:outline-none cursor-pointer"
        >
          {/* Logo Badge */}
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full flex items-center justify-center text-[#1E5FA8] font-black text-base sm:text-lg border-2 border-white shadow-xs shrink-0 transition-transform group-hover:scale-105 overflow-hidden">
            {companyProfile?.logoUrl ? (
              <img
                src={companyProfile.logoUrl}
                alt={companyProfile.brandName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{companyProfile?.logoText || 'TH'}</span>
            )}
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-['Battambang'] leading-none">
              {companyProfile?.brandName || 'ទីវ ហៃ TIV HAI'}
            </h1>
            {companyProfile?.brandSlogan && (
              <p className="text-[10px] sm:text-[11px] text-blue-100 font-['Battambang'] mt-0.5 hidden md:block opacity-90 truncate max-w-xs">
                {companyProfile.brandSlogan}
              </p>
            )}
          </div>
        </button>

        {/* Global Search Bar (Desktop) */}
        <div className="hidden lg:flex items-center flex-1 max-w-xs mx-4 relative">
          <Search className="w-4 h-4 text-blue-200 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកគ្រឿងចក្រ, ជីគីមី, ជីកំប៉ុស, អាហារផ្សិត..."
            className="w-full pl-9 pr-7 py-1.5 bg-blue-700/60 focus:bg-white text-white focus:text-slate-900 placeholder:text-blue-200 text-xs rounded-full border border-white/20 focus:border-white outline-none transition-all font-['Kantumruy_Pro']"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Actions & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cart Button with Count Badge */}
          {onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-[#1E5FA8] hover:bg-blue-50 transition-all shadow-xs border border-white/40 cursor-pointer"
              title="បើកកន្ត្រកទំនិញ (Shopping Cart)"
            >
              <ShoppingBag className="w-4 h-4 text-[#1E5FA8]" />
              <span className="hidden sm:inline font-['Battambang']">កន្ត្រក</span>
              {cartItemCount > 0 && (
                <span className="bg-[#E1251B] text-white text-[10px] font-mono font-black px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          {/* Currency Switcher */}
          <div className="flex items-center bg-blue-900/50 p-0.5 rounded-lg border border-white/20 text-xs font-mono shadow-2xs">
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md transition-all font-bold flex items-center gap-1 cursor-pointer ${
                currency === 'USD'
                  ? 'bg-white text-[#1E5FA8] shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
              title="បង្ហាញតម្លៃជាដុល្លារ ($)"
            >
              <span className="font-bold text-xs">$</span>
              <span className="hidden sm:inline text-[11px]">USD</span>
            </button>
            <button
              onClick={() => setCurrency('KHR')}
              className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-md transition-all font-bold flex items-center gap-1 cursor-pointer ${
                currency === 'KHR'
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'text-blue-100 hover:text-white'
              }`}
              title="បង្ហាញតម្លៃជារៀល (៛)"
            >
              <span className="font-bold text-xs">៛</span>
              <span className="hidden sm:inline text-[11px]">KHR</span>
            </button>
          </div>

          {/* Price Mode Selector (រាយ vs ដុំ) */}
          {setPriceMode && (
            <div className="flex items-center bg-blue-900/50 p-0.5 rounded-lg border border-white/20 text-xs font-['Battambang'] shadow-2xs">
              <button
                onClick={() => setPriceMode('retail')}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-all font-bold text-xs flex items-center gap-1 cursor-pointer ${
                  priceMode === 'retail'
                    ? 'bg-white text-[#1E5FA8] shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
                title="តម្លៃលក់រាយធម្មតា (Retail Price)"
              >
                <span>រាយ</span>
              </button>
              <button
                onClick={() => setPriceMode('wholesale')}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-all font-bold text-xs flex items-center gap-1 cursor-pointer ${
                  priceMode === 'wholesale'
                    ? 'bg-amber-400 text-slate-900 shadow-xs'
                    : 'text-blue-100 hover:text-white'
                }`}
                title="តម្លៃបោះដុំពិសេស (Wholesale Bulk Price)"
              >
                <span>ដុំ</span>
              </button>
            </div>
          )}

          {/* Admin Dashboard / Login Button */}
          <button
            onClick={() => setActiveTab('admin')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-[#1E5FA8] border-white'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
            title="ផ្ទាំងគ្រប់គ្រង (Admin Dashboard)"
          >
            <User className="w-3.5 h-3.5" />
            <span className="inline font-['Battambang']">
              {isAdminLoggedIn ? 'ផ្ទាំងគ្រប់គ្រង' : 'គ្រប់គ្រង'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-blue-200 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកគ្រឿងចក្រ, ជី NPK, ជីកំប៉ុស..."
            className="w-full pl-9 pr-8 py-1.5 bg-blue-700/60 text-white placeholder:text-blue-200 text-xs rounded-full border border-white/20 focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400 outline-none font-['Kantumruy_Pro']"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-200 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 🌟 2. NAVBAR UNDER HEADER (រចនាសម្ព័ន្ធមុខទំនិញ ៧ ក្រុម & ប្រភេទ) */}
      <div className="bg-[#143d6e] border-t border-white/15 px-3 sm:px-6 py-2 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Main 7 Groups Horizontal Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5 flex-1">
            {/* Central Root Button: "ទាំងអស់" */}
            <button
              onClick={() => handleGroupClick('all')}
              className={`shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                selectedGroup === 'all' && activeTab === 'catalog'
                  ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-200'
                  : 'bg-[#689F38] text-white hover:bg-[#558B2F] border border-white/20'
              }`}
            >
              <span className="font-['Battambang'] text-xs">ទាំងអស់</span>
            </button>

            {/* The 7 Core Product Groups */}
            {PRODUCT_GROUPS.map((group) => {
              const isSelected = selectedGroup === group.id && activeTab === 'catalog';
              const groupCats = categories.filter((c) => c.groupId === group.id);

              return (
                <div
                  key={group.id}
                  className="relative shrink-0"
                  onMouseEnter={() => setHoveredGroup(group.id)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  <button
                    onClick={() => handleGroupClick(group.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                      isSelected
                        ? 'bg-white text-[#1E5FA8] font-black ring-2 ring-blue-300 shadow-md'
                        : 'bg-[#689F38] hover:bg-[#558B2F] text-white border border-white/20'
                    }`}
                  >
                    <span className="font-['Battambang'] whitespace-nowrap">{group.nameKh}</span>
                    {groupCats.length > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                          isSelected ? 'bg-blue-100 text-blue-700' : 'bg-black/25 text-white'
                        }`}
                      >
                        {groupCats.length}
                      </span>
                    )}
                  </button>

                  {/* Desktop Hover Quick Menu for "ប្រភេទ" */}
                  {hoveredGroup === group.id && groupCats.length > 0 && (
                    <div className="hidden lg:block absolute left-0 top-full mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                      <div className="px-3 py-1 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 font-['Battambang']">
                          ប្រភេទក្នុងក្រុម {group.nameKh}
                        </span>
                      </div>
                      <div className="py-1 max-h-56 overflow-y-auto">
                        <button
                          onClick={() => handleCategoryClick(group.id, 'all')}
                          className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-['Kantumruy_Pro'] flex items-center justify-between"
                        >
                          <span>បង្ហាញទាំងអស់</span>
                          {selectedCategory === 'all' && selectedGroup === group.id && (
                            <Check className="w-3.5 h-3.5 text-blue-600" />
                          )}
                        </button>
                        {groupCats.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => handleCategoryClick(group.id, cat.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-['Kantumruy_Pro'] flex items-center justify-between"
                          >
                            <span className="truncate">{cat.nameKh}</span>
                            {selectedCategory === cat.id && (
                              <Check className="w-3.5 h-3.5 text-blue-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

