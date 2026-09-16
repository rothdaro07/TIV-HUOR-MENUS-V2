export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  uploadPreset?: string;
}

export const DEFAULT_CLOUDINARY_CONFIG: CloudinaryConfig = {
  cloudName: 'dismpss5e',
  apiKey: '754832176547499',
  apiSecret: '2OhZZbs4pECbdGJRxYuAlHOSsQM',
  folder: 'TIVHUOR',
  uploadPreset: 'TIVHUOR',
};

const STORAGE_KEY_CLOUDINARY = 'tivhuor_cloudinary_config_v1';

export function getCloudinaryConfig(): CloudinaryConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CLOUDINARY);
    if (saved) {
      return { ...DEFAULT_CLOUDINARY_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading cloudinary config from localStorage', e);
  }
  return DEFAULT_CLOUDINARY_CONFIG;
}

export function saveCloudinaryConfig(config: CloudinaryConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CLOUDINARY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving cloudinary config', e);
  }
}

/**
 * Generate SHA-1 hex string for Cloudinary signed upload
 */
async function generateSha1(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload an image file or base64 data to Cloudinary
 * Automatically tries Signed upload with API Key & Secret,
 * and falls back to unsigned preset upload if needed.
 */
export async function uploadToCloudinary(
  fileOrBase64: File | string,
  onProgress?: (percent: number) => void
): Promise<string> {
  const config = getCloudinaryConfig();
  const timestamp = Math.round(new Date().getTime() / 1000).toString();

  const formData = new FormData();
  formData.append('file', fileOrBase64);

  // If we have API Secret & API Key, perform Signed Upload (most reliable)
  if (config.apiKey && config.apiSecret) {
    // Parameters to sign in alphabetical order
    // folder=TIVHUOR&timestamp=1234567890<API_SECRET>
    const paramsToSign = `folder=${config.folder}&timestamp=${timestamp}${config.apiSecret}`;
    const signature = await generateSha1(paramsToSign);

    formData.append('api_key', config.apiKey);
    formData.append('timestamp', timestamp);
    formData.append('folder', config.folder);
    formData.append('signature', signature);
  } else if (config.uploadPreset) {
    formData.append('upload_preset', config.uploadPreset);
    formData.append('folder', config.folder);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl, true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (err) {
          reject(new Error('Invalid JSON response from Cloudinary'));
        }
      } else {
        try {
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error?.message || `Cloudinary upload failed (${xhr.status})`));
        } catch {
          reject(new Error(`Cloudinary upload failed with HTTP status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error while uploading to Cloudinary'));
    };

    xhr.send(formData);
  });
}
