import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, FolderPlus, Check, X, Tag, Package, AlertCircle, Layers } from 'lucide-react';
import { Category, Product, ProductGroupId } from '../types';
import { PRODUCT_GROUPS } from '../data/initialProducts';

interface AdminCategoryManagerProps {
  categories: Category[];
  products: Product[];
  onAddCategory: (category: Category) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onReorderCategories: (categories: Category[]) => void;
}

export const AdminCategoryManager: React.FC<AdminCategoryManagerProps> = ({
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onReorderCategories,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [nameKh, setNameKh] = useState('');
  const [name, setName] = useState('');
  const [groupId, setGroupId] = useState<ProductGroupId>('chemical_fertilizer');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setNameKh('');
    setName('');
    setGroupId('chemical_fertilizer');
    setDescription('');
    setIsAdding(true);
    setEditingCategory(null);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setNameKh(cat.nameKh);
    setName(cat.name);
    setGroupId((cat.groupId as any) || 'chemical_fertilizer');
    setDescription(cat.description || '');
    setIsAdding(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameKh.trim()) {
      alert('សូមបញ្ចូលឈ្មោះប្រភេទជាភាសាខ្មែរ');
      return;
    }

    const groupObj = PRODUCT_GROUPS.find((g) => g.id === groupId);

    if (editingCategory) {
      // Edit
      onUpdateCategory({
        ...editingCategory,
        nameKh: nameKh.trim(),
        name: name.trim() || editingCategory.name,
        groupId,
        groupKh: groupObj?.nameKh || 'ជីគីមី',
        description: description.trim(),
      });
      setEditingCategory(null);
    } else {
      // Add
      const id = name.trim().replace(/\s+/g, '_') || `cat_${Date.now()}`;
      onAddCategory({
        id,
        name: name.trim() || nameKh.trim(),
        nameKh: nameKh.trim(),
        groupId,
        groupKh: groupObj?.nameKh || 'ជីគីមី',
        description: description.trim(),
        order: categories.length + 1,
      });
      setIsAdding(false);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newCats.length) {
      const temp = newCats[index];
      newCats[index] = newCats[targetIndex];
      newCats[targetIndex] = temp;
      newCats.forEach((c, i) => {
        c.order = i + 1;
      });
      onReorderCategories(newCats);
    }
  };

  const getProductCount = (cat: Category) => {
    return products.filter((p) => p.category === cat.id || p.categoryKh === cat.nameKh).length;
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base sm:text-lg font-bold font-['Battambang'] text-slate-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#1E5FA8]" />
            បញ្ជីប្រភេទ និងមុខទំនិញ ({categories.length})
          </h3>
          <p className="text-xs text-slate-500 font-['Kantumruy_Pro'] mt-0.5">
            បន្ថែម កែប្រែ ឬលុបប្រភេទមុខទំនិញ និងចាត់ចូលក្នុងក្រុម (គ្រឿងចក្រកសិកម្ម, ជីគីមី, ជីសរីរាង្គ, វត្ថុធាតុដើម)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 bg-[#1E5FA8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors font-['Kantumruy_Pro']"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមប្រភេទថ្មី</span>
        </button>
      </div>

      {/* Modal / Inline Drawer for Add / Edit */}
      {(isAdding || editingCategory) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h4 className="text-base font-bold font-['Battambang'] text-slate-900 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#1E5FA8]" />
                {editingCategory ? 'កែប្រែប្រភេទ' : 'បន្ថែមប្រភេទថ្មី'}
              </h4>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingCategory(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 font-['Kantumruy_Pro']">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ស្ថិតក្នុងមុខទំនិញ (Main Product Group) *
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-bold outline-none cursor-pointer"
                >
                  {PRODUCT_GROUPS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nameKh} ({g.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះប្រភេទជាភាសាខ្មែរ *
                </label>
                <input
                  type="text"
                  required
                  value={nameKh}
                  onChange={(e) => setNameKh(e.target.value)}
                  placeholder="ឧ. ត្រាក់ទ័រ & គោយន្ត, ជីគីមី NPK, ជីបំប៉នស្លឹក..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-bold outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ឈ្មោះកូដ / English Slug
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ឧ. tractor, NPK, Foliar, BioOrganic..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ការពិពណ៌នាខ្លីៗ
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="ព័ត៌មានបន្ថែមពីប្រភេទនេះ..."
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCategory ? 'រក្សាទុកការកែប្រែ' : 'បង្កើតប្រភេទថ្មី'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category List Cards / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3.5 text-center w-14">លំដាប់</th>
                <th className="p-3.5">ឈ្មោះប្រភេទ (ខ្មែរ)</th>
                <th className="p-3.5">មុខទំនិញចម្បង</th>
                <th className="p-3.5">កូដ / English</th>
                <th className="p-3.5">ការពិពណ៌នា</th>
                <th className="p-3.5 text-center w-28">ចំនួនទំនិញ</th>
                <th className="p-3.5 text-center w-24">តម្រៀប</th>
                <th className="p-3.5 text-center w-28">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-['Kantumruy_Pro']">
              {categories.map((cat, index) => {
                const count = getProductCount(cat);
                const isDeleting = deleteConfirmId === cat.id;

                return (
                  <tr key={cat.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Index */}
                    <td className="p-3.5 text-center font-mono font-bold text-slate-400">
                      {index + 1}
                    </td>

                    {/* Khmer Name */}
                    <td className="p-3.5 font-bold text-slate-900 text-sm font-['Battambang']">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#1E5FA8]" />
                        <span>{cat.nameKh}</span>
                      </div>
                    </td>

                    {/* Parent Group */}
                    <td className="p-3.5">
                      <span className="inline-block bg-blue-50 text-[#1E5FA8] px-2.5 py-1 rounded-full text-xs font-bold border border-blue-200 font-['Battambang']">
                        {cat.groupKh || 'ជីគីមី'}
                      </span>
                    </td>

                    {/* English code */}
                    <td className="p-3.5 font-mono font-bold text-blue-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                        {cat.name || cat.id}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="p-3.5 text-slate-500 text-xs max-w-xs truncate">
                      {cat.description || '-'}
                    </td>

                    {/* Count */}
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-full text-xs font-mono">
                        <Package className="w-3 h-3 text-slate-400" />
                        {count} មុខ
                      </span>
                    </td>

                    {/* Reorder Buttons */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600 transition-colors"
                          title="រំកិលឡើងលើ"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === categories.length - 1}
                          className="p-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-600 transition-colors"
                          title="រំកិលចុះក្រោម"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      {isDeleting ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              onDeleteCategory(cat.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 bg-red-600 text-white rounded text-[10px] font-bold shadow-xs"
                          >
                            លុប
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px]"
                          >
                            ទេ
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => openEditModal(cat)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition-colors cursor-pointer"
                            title="កែប្រែប្រភេទនេះ"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (count > 0) {
                                if (
                                  window.confirm(
                                    `ប្រភេទ «${cat.nameKh}» មានទំនិញចំនួន ${count} មុខ។ តើអ្នកពិតជាចង់លុបប្រភេទនេះមែនទេ?`
                                  )
                                ) {
                                  onDeleteCategory(cat.id);
                                }
                              } else {
                                setDeleteConfirmId(cat.id);
                              }
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="លុបប្រភេទនេះ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
