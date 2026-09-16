import React, { useState, useMemo } from 'react';
import { Filter, LayoutGrid, List, ArrowRight, Eye, Plus, ShoppingBag, X, ChevronDown } from 'lucide-react';
import { Product, Currency, ViewMode, Category, ProductGroupId, PriceMode } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductBagIllustration } from '../components/ProductBagIllustration';
import { INITIAL_CATEGORIES, PRODUCT_GROUPS } from '../data/initialProducts';
import { getProductDisplayPrice } from '../utils/pricing';

interface HomeProps {
  products: Product[];
  categories?: Category[];
  currency: Currency;
  priceMode?: PriceMode;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedGroup?: ProductGroupId;
  onSelectGroup?: (group: ProductGroupId) => void;
  selectedCategory?: string;
  onSelectCategory?: (catId: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  products,
  categories = INITIAL_CATEGORIES,
  currency,
  priceMode = 'retail',
  onSelectProduct,
  onAddToCart,
  searchQuery,
  setSearchQuery,
  selectedGroup = 'all',
  onSelectGroup,
  selectedCategory: controlledCategory,
  onSelectCategory,
}) => {
  const [internalCategory, setInternalCategory] = useState<string>('all');
  const selectedCategory = controlledCategory !== undefined ? controlledCategory : internalCategory;
  const setSelectedCategory = onSelectCategory || setInternalCategory;
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Reset category selection when switching product group
  React.useEffect(() => {
    setSelectedCategory('all');
  }, [selectedGroup]);

  // Categories list filtered by active group if chosen
  const categoryList = useMemo(() => {
    // Merge categories with INITIAL_CATEGORIES to ensure all subcategories are present
    const categoryMap = new Map<string, Category>();
    INITIAL_CATEGORIES.forEach((c) => categoryMap.set(c.id, c));
    categories.forEach((c) => {
      const existing = categoryMap.get(c.id);
      categoryMap.set(c.id, {
        ...existing,
        ...c,
        groupId: c.groupId || existing?.groupId || 'chemical_fertilizer',
        groupKh: c.groupKh || existing?.groupKh || 'ជីគីមី',
      });
    });

    const allMergedCategories = Array.from(categoryMap.values());

    let filteredCategories = allMergedCategories;
    if (selectedGroup !== 'all') {
      filteredCategories = allMergedCategories.filter((c) => c.groupId === selectedGroup);
    }
    const groupProducts = selectedGroup === 'all' 
      ? products 
      : products.filter((p) => (p.groupId || 'chemical_fertilizer') === selectedGroup);

    const list = [
      { id: 'all', label: 'ទាំងអស់', count: groupProducts.length },
    ];
    filteredCategories.forEach((cat) => {
      const count = groupProducts.filter(
        (p) => p.category === cat.id || p.categoryKh === cat.nameKh
      ).length;
      list.push({
        id: cat.id,
        label: cat.nameKh,
        count,
      });
    });
    return list;
  }, [categories, products, selectedGroup]);

  // Filtered products based on group, category and search query
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Group match
        const matchesGroup =
          selectedGroup === 'all' || (product.groupId || 'chemical_fertilizer') === selectedGroup;

        // Subcategory match
        const matchesCategory =
          selectedCategory === 'all' ||
          product.category === selectedCategory ||
          categories.find((c) => c.id === selectedCategory)?.nameKh === product.categoryKh;

        // Search match
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          product.name.toLowerCase().includes(q) ||
          product.nameKh.toLowerCase().includes(q) ||
          product.npk.toLowerCase().includes(q) ||
          product.usage.toLowerCase().includes(q) ||
          (product.groupKh && product.groupKh.toLowerCase().includes(q)) ||
          (product.nicknameKh && product.nicknameKh.toLowerCase().includes(q));

        return matchesGroup && matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.nameKh.localeCompare(b.nameKh);
        return a.order - b.order;
      });
  }, [products, selectedGroup, selectedCategory, searchQuery, sortBy, categories]);

  const activeGroupName = PRODUCT_GROUPS.find((g) => g.id === selectedGroup)?.nameKh;

  return (
    <div className="space-y-6 pb-12">
      {/* Category Bar & Controls */}
      <section className="space-y-3 sm:space-y-4">
        {/* Category Bar with scroll */}
        <div className="bg-white border border-slate-200 rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 flex gap-2 sm:gap-3 shrink-0 items-center overflow-x-auto no-scrollbar shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1 font-['Battambang'] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            ប្រភេទ:
          </span>
          {categoryList.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`shrink-0 px-3 sm:px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 border ${
                  isActive
                    ? 'bg-[#1E5FA8] text-white border-[#1E5FA8] shadow-xs'
                    : 'bg-slate-100/90 hover:bg-blue-50/80 text-slate-700 border-slate-200/70 hover:border-blue-200 shadow-2xs'
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-blue-900/60 text-blue-100' : 'bg-white/80 text-slate-600 shadow-2xs'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Second Row: Status, Sort, and View Mode Toggle (Responsive Single Line) */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 bg-white px-3.5 sm:px-5 py-3 rounded-2xl border border-slate-200/90 shadow-xs font-['Battambang']">
          {/* Product Count Display */}
          <div className="text-xs sm:text-sm font-bold text-slate-800 shrink-0 whitespace-nowrap flex items-center gap-1">
            <span>បង្ហាញទំនិញសរុប:</span>
            <span className="font-bold text-[#1E5FA8] px-0.5">{filteredProducts.length}</span>
            <span>មុខ</span>
            {searchQuery && (
              <span className="text-slate-400 text-xs hidden md:inline ml-1">
                (ស្វែងរក: "{searchQuery}")
              </span>
            )}
          </div>

          {/* Right Controls: Sort Dropdown & View Mode Switcher */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sort Select Styled to match the screenshot pill */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="appearance-none bg-white border border-[#23588f] text-slate-800 hover:border-[#1E5FA8] rounded-xl pl-3 sm:pl-4 pr-7 sm:pr-8 py-1.5 text-xs sm:text-sm font-bold font-['Battambang'] cursor-pointer outline-none shadow-2xs transition-all"
              >
                <option value="default">លំដាប់លំនាំដើម</option>
                <option value="price-asc">តម្លៃ: ទាប ទៅ ខ្ពស់</option>
                <option value="price-desc">តម្លៃ: ខ្ពស់ ទៅ ទាប</option>
                <option value="name">តាមឈ្មោះទំនិញ</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-600 absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2]" />
            </div>

            {/* View Mode Switcher Container */}
            <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-[#1E5FA8] shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="បង្ហាញជាក្រឡា (Grid View)"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white text-[#1E5FA8] shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                title="បង្ហាញជាតារាង (List View)"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Display Section */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Filter className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-800 font-['Battambang']">
            រកមិនឃើញមុខទំនិញដែលត្រូវគ្នានឹងការស្វែងរកទេ
          </h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-['Battambang']">
            សូមសាកល្បងផ្លាស់ប្តូរពាក្យស្វែងរក ឬជ្រើសរើសប្រភេទ "ទាំងអស់" ឡើងវិញ
          </p>
          <button
            onClick={() => {
              if (onSelectGroup) onSelectGroup('all');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors font-['Battambang'] cursor-pointer"
          >
            សម្អាតការស្វែងរក
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout: 2 items per row on mobile (grid-cols-2) */
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              currency={currency}
              priceMode={priceMode}
              onSelect={onSelectProduct}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        /* List Layout: Responsive & compact on mobile screens without horizontal scroll */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          {/* Mobile Compact List (visible below sm) */}
          <div className="block sm:hidden divide-y divide-slate-100">
            {filteredProducts.map((product) => {
              const { priceUSD, priceKHR } = getProductDisplayPrice(product, priceMode, currency);

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="p-3 flex items-center gap-3 hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <div className="w-14 h-16 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden shadow-2xs relative">
                    <ProductBagIllustration product={product} size="sm" showGranulesBadge={false} className="w-full h-full" />
                    {priceMode === 'wholesale' && (
                      <span className="absolute bottom-0.5 right-0.5 bg-amber-400 text-[8px] font-black text-slate-900 px-1 py-0.2 rounded font-['Battambang']">
                        បោះដុំ
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-['Battambang']">
                        {product.groupKh || 'ទំនិញ'}
                      </span>
                    </div>
                    <h4 className="font-bold text-[#1E5FA8] font-['Battambang'] text-xs truncate mt-0.5">
                      {product.nameKh}
                    </h4>
                    <p className="font-mono text-[10px] text-slate-500 font-semibold truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 font-['Battambang'] font-bold">
                        ទម្ងន់: {product.weight}
                      </span>
                      <span className={`text-[11px] font-bold font-mono ${priceMode === 'wholesale' ? 'text-amber-600' : 'text-[#1E5FA8]'}`}>
                        {currency === 'KHR'
                          ? `${priceKHR.toLocaleString()} ៛`
                          : `$${priceUSD.toFixed(2)}`}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onAddToCart?.(product)}
                      className="inline-flex items-center justify-center p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-colors font-['Battambang'] shadow-2xs cursor-pointer"
                      title="ដាក់ក្នុងកន្ត្រក"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectProduct(product)}
                      className="inline-flex items-center justify-center p-2 bg-[#1E5FA8] hover:bg-blue-800 text-white rounded-lg text-[10px] font-bold transition-colors font-['Battambang'] shadow-2xs cursor-pointer"
                      title="មើលព័ត៌មានលម្អិត"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop & Tablet Table (visible on sm and above) */}
          <div className="hidden sm:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1E5FA8] text-white font-bold uppercase text-[10px] font-['Battambang']">
                <tr>
                  <th className="p-3 text-center w-16">រូបភាព</th>
                  <th className="p-3">ឈ្មោះទំនិញ</th>
                  <th className="p-3">មុខទំនិញ & ប្រភេទ</th>
                  <th className="p-3 text-center">ទម្ងន់</th>
                  <th className="p-3 text-right">
                    {priceMode === 'wholesale' ? 'តម្លៃបោះដុំ' : 'តម្លៃលក់រាយ'}
                  </th>
                  <th className="p-3 text-center">បញ្ជាទិញ & លម្អិត</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredProducts.map((product) => {
                  const { priceUSD, priceKHR } = getProductDisplayPrice(product, priceMode, currency);

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer"
                      onClick={() => onSelectProduct(product)}
                    >
                      <td className="p-2 text-center">
                        <div className="w-12 h-14 mx-auto flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shadow-2xs relative">
                          <ProductBagIllustration product={product} size="sm" showGranulesBadge={false} className="w-full h-full" />
                          {priceMode === 'wholesale' && (
                            <span className="absolute bottom-0.5 right-0.5 bg-amber-400 text-[8px] font-black text-slate-900 px-1 py-0.2 rounded font-['Battambang']">
                              បោះដុំ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#1E5FA8] font-['Battambang'] text-sm hover:underline">
                          {product.nameKh}
                        </div>
                        <div className="font-mono text-xs text-slate-500 font-semibold mt-0.5">
                          {product.name}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-block bg-blue-50 text-[#1E5FA8] px-2 py-0.5 rounded text-[11px] font-bold border border-blue-100 mb-0.5">
                          {product.groupKh || 'ទំនិញ'}
                        </span>
                        <div className="text-[11px] text-slate-500 font-['Battambang']">
                          {product.categoryKh}
                        </div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {product.weight}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {currency === 'USD' ? (
                          <>
                            <div className={`font-bold text-sm ${priceMode === 'wholesale' ? 'text-amber-600' : 'text-slate-800'}`}>
                              ${priceUSD.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-['Battambang']">
                              ~{priceKHR.toLocaleString()} ៛
                            </div>
                          </>
                        ) : (
                          <>
                            <div className={`font-bold text-sm ${priceMode === 'wholesale' ? 'text-amber-600' : 'text-emerald-800'}`}>
                              {priceKHR.toLocaleString()} ៛
                            </div>
                            <div className="text-[10px] text-slate-400">
                              ${priceUSD.toFixed(2)}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onAddToCart?.(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors font-['Battambang'] cursor-pointer shadow-2xs"
                            title="ដាក់ក្នុងកន្ត្រក"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>កុម្ម៉ង់</span>
                          </button>
                          <button
                            onClick={() => onSelectProduct(product)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#1E5FA8] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition-colors font-['Battambang'] cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>លម្អិត</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

