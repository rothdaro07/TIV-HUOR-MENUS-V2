/**
 * Bakong KHQR Payload Generator & Utility Functions
 * Follows the National Bank of Cambodia (NBC) KHQR EMVCo format.
 */

// Helper to format EMVCo TLV (Tag-Length-Value)
function formatTlv(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${tag}${len}${value}`;
}

// Compute CRC16 (CCITT-FALSE) checksum for EMVCo QR code
function calculateCrc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface KhqrPayloadOptions {
  bakongAccountId?: string; // e.g., 'tivhai_fertilizer@aclb' or '012999888@abaa'
  merchantName?: string;
  merchantCity?: string;
  amount: number;
  currency: 'USD' | 'KHR';
  billNumber?: string;
  terminalId?: string;
}

/**
 * Generates an authentic EMVCo standard string for Bakong KHQR
 */
export function generateKhqrString(options: KhqrPayloadOptions): string {
  const {
    bakongAccountId = 'tivhai@ftb',
    merchantName = 'TIV HAI FERTILIZER CO., LTD',
    merchantCity = 'PHNOM PENH',
    amount,
    currency,
    billNumber = `TH-${Date.now().toString().slice(-6)}`,
  } = options;

  const formattedAmount =
    currency === 'USD' ? amount.toFixed(2) : Math.round(amount).toString();
  const currencyCode = currency === 'USD' ? '840' : '116';

  // Tag 29: Merchant Account Information (Bakong)
  const tag29_00 = formatTlv('00', 'bakong@nbc');
  const tag29_01 = formatTlv('01', bakongAccountId);
  const tag29Value = `${tag29_00}${tag29_01}`;
  const tag29 = formatTlv('29', tag29Value);

  // Tag 62: Additional Data Field (Bill Number, Store Label, etc.)
  const tag62_01 = formatTlv('01', billNumber);
  const tag62_07 = formatTlv('07', 'TIVHAI-POS');
  const tag62Value = `${tag62_01}${tag62_07}`;
  const tag62 = formatTlv('62', tag62Value);

  // Core payload components
  let payload = '';
  payload += formatTlv('00', '01'); // Payload Format Indicator
  payload += formatTlv('01', '12'); // Point of Initiation: 12 (Dynamic QR with amount)
  payload += tag29;                 // Merchant Account Information
  payload += formatTlv('52', '5999'); // Merchant Category Code (General Retail / Agriculture)
  payload += formatTlv('53', currencyCode); // Transaction Currency (840 = USD, 116 = KHR)
  payload += formatTlv('54', formattedAmount); // Transaction Amount
  payload += formatTlv('58', 'KH'); // Country Code
  payload += formatTlv('59', merchantName.slice(0, 25)); // Merchant Name
  payload += formatTlv('60', merchantCity.slice(0, 15)); // Merchant City
  payload += tag62;                 // Additional Data Field Template

  // Tag 63: CRC16 Checksum
  payload += '6304';
  const checksum = calculateCrc16(payload);
  return `${payload}${checksum}`;
}
