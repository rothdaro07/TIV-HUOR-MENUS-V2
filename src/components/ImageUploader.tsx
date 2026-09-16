import React, { useState } from 'react';
import { Loader2, Cloud, AlertCircle, Trash2 } from 'lucide-react';
import { uploadToCloudinary } from '../lib/cloudinary';

interface ImageUploaderProps {
  currentImageUrl: string;
  onImageSelected: (url: string) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  currentImageUrl,
  onImageSelected,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleProcessFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      // Upload directly to Cloudinary (signed with user's credentials)
      const cloudinaryUrl = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(percent);
      });

      onImageSelected(cloudinaryUrl);
      setPreviewError(false);
    } catch (err: any) {
      console.warn('Cloudinary upload error, falling back to base64 preview:', err);
      setUploadError(err?.message || 'មិនអាច Upload ទៅកាន់ Cloudinary បានទេ កំពុងប្រើរូបភាពមូលដ្ឋាន');
      
      // Fallback to base64 so user doesn't lose image
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onImageSelected(base64);
        setPreviewError(false);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Box with Cloudinary direct upload */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          dragActive
            ? 'border-blue-500 bg-blue-50/50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          id="file-upload"
          disabled={isUploading}
          onChange={handleFileUpload}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
            {isUploading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : (
              <Cloud className="w-6 h-6 text-[#1E5FA8]" />
            )}
          </div>

          <div>
            <label
              htmlFor="file-upload"
              className={`text-sm font-bold text-blue-600 hover:text-blue-700 cursor-pointer underline mr-1 ${
                isUploading ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              {isUploading ? 'កំពុង Upload ទៅ Cloudinary...' : 'ចុចជ្រើសរើសរូបភាព Upload ទៅ Cloudinary'}
            </label>
            <span className="text-xs text-slate-500">ឬ អូសទម្លាក់រូបភាពទីនេះ (Drag & Drop)</span>
          </div>

          {/* Upload progress bar */}
          {isUploading && (
            <div className="w-full max-w-xs mt-2">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#1E5FA8] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-500 mt-1 block">
                {uploadProgress}% បានផ្ទុកឡើងទៅ folder TIVHUOR
              </span>
            </div>
          )}

          <p className="text-[11px] text-slate-400">
            ផ្ទុកឡើងដោយផ្ទាល់ទៅ Cloudinary (Cloud: <span className="font-mono font-bold text-slate-600">dismpss5e</span>, Folder: <span className="font-mono font-bold text-slate-600">TIVHUOR</span>)
          </p>

          {uploadError && (
            <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Preview */}
      {currentImageUrl && (
        <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
              {currentImageUrl.startsWith('http') || currentImageUrl.startsWith('data:') ? (
                !previewError ? (
                  <img
                    src={currentImageUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain"
                    onError={() => setPreviewError(true)}
                  />
                ) : (
                  <span className="text-[9px] text-red-500">ខូចរូបភាព</span>
                )
              ) : (
                <span className="text-[10px] font-bold text-blue-700 text-center px-1">
                  រូបភាពបាវជី
                </span>
              )}
            </div>
            <div className="text-xs min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800">រូបភាពដែលបានជ្រើសរើស</span>
                {currentImageUrl.includes('cloudinary') && (
                  <span className="px-1.5 py-0.2 bg-blue-100 text-[#1E5FA8] rounded text-[9px] font-bold">
                    Cloudinary CDN
                  </span>
                )}
              </div>
              <p className="text-slate-500 truncate font-mono text-[10px] mt-0.5 max-w-xs">
                {currentImageUrl}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onImageSelected('')}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer shrink-0"
            title="លុបរូបភាពចេញ (Remove Image)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
