import { Order, CompanyProfile, TelegramBotConfig } from '../types';
import { CAMBODIA_PROVINCES } from '../data/cambodiaProvinces';

/**
 * Safely escape text for Telegram HTML parse mode (convert &, <, >)
 */
export function escapeHtml(str: string | number | undefined | null): string {
  if (str === undefined || str === null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Strip all HTML tags to produce clean plain text for fallback dispatches
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Convert base64 data URL to Blob for multipart upload to Telegram Bot API
 */
function dataURItoBlob(dataURI: string): Blob {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
}

/**
 * Format order details into rich, fully-escaped Telegram HTML message for text dispatch
 */
export function formatOrderTelegramMessage(
  order: Order,
  companyProfile?: CompanyProfile
): string {
  const province = CAMBODIA_PROVINCES.find((p) => p.id === order.customer.provinceId);
  const provinceName = province ? province.nameKh : order.customer.provinceId;

  const itemsText = order.items
    .map((item, idx) => {
      const p = item.product;
      const subtotal = (p.price * item.quantity).toFixed(2);
      const name = escapeHtml(p.nameKh || p.name);
      const size = escapeHtml(p.packagingSize || '50kg');
      return `  <b>${idx + 1}. ${name}</b>\n     ▫️ ចំនួន: <b>${item.quantity} បាវ</b> (${size})\n     ▫️ តម្លៃ: $${p.price.toFixed(2)} × ${item.quantity} = <b>$${subtotal}</b>`;
    })
    .join('\n');

  const deliveryMethodText =
    order.purchaseChannel === 'direct'
      ? '🏪 <b>ទិញផ្ទាល់ (In-Person / Direct Store)</b>'
      : order.customer.deliveryMethod === 'door'
      ? '🚚 <b>ទិញ Online - ដឹកជញ្ជូនដល់ផ្ទះ (Door Delivery)</b>'
      : order.customer.deliveryMethod === 'branch'
      ? '🏢 <b>ទិញ Online - ទទួលនៅសាខា VET (Branch)</b>'
      : '🌐 <b>ទិញតាមរយះ Online</b>';

  const paymentTypeText =
    order.paymentType === 'cash'
      ? '💵 <b>ទូទាត់លុយសុទ្ធ (Cash)</b>'
      : order.paymentType === 'scan_qr'
      ? '📱 <b>Scan QR (Bank QR / KHQR)</b>'
      : order.paymentType === 'credit_unpaid'
      ? '📝 <b>ជំពាក់ មិនទាន់ទូទាត់ (Credit / Unpaid)</b>'
      : order.paymentMethod === 'cash'
      ? '💵 ទូទាត់លុយសុទ្ធ'
      : '📱 Scan QR / KHQR';

  const statusEmoji =
    order.paymentType === 'credit_unpaid'
      ? '📝 ជំពាក់ មិនទាន់ទូទាត់ (Credit/Unpaid)'
      : order.status === 'confirmed'
      ? '✅ បានបញ្ជាក់ (Confirmed)'
      : order.status === 'shipped'
      ? '🚚 កំពុងដឹកជញ្ជូន (Shipped)'
      : order.status === 'paid'
      ? '💳 បានបង់ប្រាក់រួច (Paid)'
      : '🕒 រង់ចាំការត្រួតពិនិត្យ (Pending Review)';

  const proofText = order.paymentProofUrl
    ? '✅ <b>បានភ្ជាប់រូបបង្កាន់ដៃបង់ប្រាក់ / វិក្កយបត្រ (Invoice Attached)</b>'
    : order.paymentType === 'cash'
    ? '💵 <i>ទូទាត់ជាសាច់ប្រាក់សុទ្ធ</i>'
    : order.paymentType === 'credit_unpaid'
    ? '📝 <i>ជំពាក់ មិនទាន់ទូទាត់</i>'
    : '⚠️ <i>មិនទាន់ភ្ជាប់រូបបង្កាន់ដៃ</i>';

  const bankText = order.paymentType === 'scan_qr'
    ? (order.selectedBankName
      ? `<b>${escapeHtml(order.selectedBankName)}</b> ${order.bankAccountNumber ? `(${escapeHtml(order.bankAccountNumber)})` : ''}`
      : 'Bank QR / KHQR Transfer')
    : paymentTypeText;

  const customerName = escapeHtml(order.customer.fullName);
  const customerPhone = escapeHtml(order.customer.phone);
  const branchName = order.customer.selectedBranch ? `• សាខា VET: <i>${escapeHtml(order.customer.selectedBranch)}</i>\n` : '';
  const addressText = order.customer.districtVillage ? `• អាសយដ្ឋាន/ភូមិ-ឃុំ: <i>${escapeHtml(order.customer.districtVillage)}</i>\n` : '';
  const notesText = order.customer.notes ? `• ចំណាំរបស់ភ្ញៀវ: <i>${escapeHtml(order.customer.notes)}</i>\n` : '';
  const compName = escapeHtml(companyProfile?.nameKh || 'ក្រុមហ៊ុន ទីវ ហៃ (ខេមបូឌា)');

  return `
🌾 <b>ការកុម្ម៉ង់ជីកសិកម្មថ្មី (NEW ORDER)</b>
━━━━━━━━━━━━━━━━━━━━━━━━
🆔 <b>លេខកូដវិក្កយបត្រ:</b> <code>#${escapeHtml(order.id)}</code>
📅 <b>កាលបរិច្ឆេទ:</b> ${escapeHtml(new Date(order.createdAt).toLocaleString('km-KH', { hour12: true }))}
📊 <b>ស្ថានភាព:</b> ${statusEmoji}

👤 <b>ព័ត៌មានអតិថិជន (Customer):</b>
• ឈ្មោះ: <b>${customerName}</b>
• ទូរស័ព្ទ: <code>${customerPhone}</code>
• ខេត្ត/ក្រុង: <b>${escapeHtml(provinceName)}</b>
• វិធីដឹក: ${deliveryMethodText}
${branchName}${addressText}${notesText}
━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>មុខទំនិញបញ្ជាទិញ (Order Items):</b>
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━━━
💵 <b>សរុបការទូទាត់ (Payment Breakdown):</b>
• តម្លៃទំនិញ (Subtotal): <b>$${order.subtotalUSD.toFixed(2)}</b> (~${order.subtotalKHR.toLocaleString()} ៛)
• សេវាដឹក VET (${order.deliveryFee.totalActualWeightKg}kg): <b>$${order.deliveryFee.totalFeeUSD.toFixed(2)}</b> (~${order.deliveryFee.totalFeeKHR.toLocaleString()} ៛)
• <b>ទឹកប្រាក់សរុប (GRAND TOTAL):</b> <b>$${order.totalUSD.toFixed(2)} USD</b> (~${order.totalKHR.toLocaleString()} ៛)
• ធនាគារទូទាត់: ${bankText}
• បង្កាន់ដៃ: ${proofText}
━━━━━━━━━━━━━━━━━━━━━━━━
🏢 <i>${compName}</i>
🔔 <i>សូម Manager ពិនិត្យរូបភាពវិក្កយបត្រ និងចុចប៊ូតុងខាងក្រោមដើម្បីបញ្ជាក់ការកុម្ម៉ង់!</i>
`.trim();
}

/**
 * Format concise caption for Telegram photo uploads (guaranteed to be under 1000 characters to prevent API errors)
 */
export function formatOrderTelegramPhotoCaption(
  order: Order,
  companyProfile?: CompanyProfile
): string {
  const province = CAMBODIA_PROVINCES.find((p) => p.id === order.customer.provinceId);
  const provinceName = province ? province.nameKh : order.customer.provinceId;

  const itemsSummary = order.items
    .slice(0, 4)
    .map(
      (item, idx) =>
        `  ${idx + 1}. ${escapeHtml(item.product.nameKh || item.product.name)} (x<b>${item.quantity}</b>)`
    )
    .join('\n');
  const moreText = order.items.length > 4 ? `\n  ...និង ${order.items.length - 4} មុខទៀត` : '';

  const branchOrAddress = order.customer.selectedBranch
    ? `🏢 សាខា: <i>${escapeHtml(order.customer.selectedBranch)}</i>\n`
    : order.customer.districtVillage
    ? `📍 ទីតាំង: <i>${escapeHtml(order.customer.districtVillage)}</i>\n`
    : '';

  const compName = escapeHtml(companyProfile?.nameKh || 'ក្រុមហ៊ុន ទីវ ហៃ (ខេមបូឌា)');

  return `
🌾 <b>វិក្កយបត្រ & បង្កាន់ដៃកុម្ម៉ង់ជី (#${escapeHtml(order.id)})</b>
━━━━━━━━━━━━━━━━━━━━━━━━
👤 <b>អតិថិជន:</b> <b>${escapeHtml(order.customer.fullName)}</b>
📞 <b>ទូរស័ព្ទ:</b> <code>${escapeHtml(order.customer.phone)}</code>
📍 <b>ខេត្ត/ក្រុង:</b> ${escapeHtml(provinceName)}
${branchOrAddress}
📦 <b>ទំនិញ (${order.items.reduce((s, i) => s + i.quantity, 0)} បាវ):</b>
${itemsSummary}${moreText}

💵 <b>ទឹកប្រាក់សរុប:</b> <b>$${order.totalUSD.toFixed(2)} USD</b> (~${order.totalKHR.toLocaleString()} ៛)
💳 <b>ធនាគារ:</b> ${escapeHtml(order.selectedBankName || 'KHQR Transfer')}
━━━━━━━━━━━━━━━━━━━━━━━━
🏢 <i>${compName}</i>
`.trim();
}

/**
 * Send order notification & invoice slip to Telegram Bot with guaranteed resilient fallbacks
 */
export async function sendOrderToTelegram(
  order: Order,
  companyProfile?: CompanyProfile,
  customConfig?: TelegramBotConfig
): Promise<{ success: boolean; message?: string; messageId?: number }> {
  const config = customConfig || companyProfile?.telegramConfig;

  if (!config || config.isEnabled === false) {
    return { success: false, message: 'Telegram Bot Notification is disabled in settings.' };
  }

  const botToken = config.botToken?.trim();
  const chatId = config.chatId?.trim();

  if (!botToken || !chatId) {
    return { success: false, message: 'Telegram Bot Token or Chat ID is not configured.' };
  }

  const fullMessageHtml = formatOrderTelegramMessage(order, companyProfile);
  const photoCaptionHtml = formatOrderTelegramPhotoCaption(order, companyProfile);

  // Manager action inline keyboard
  const rawPhone = (order.customer.phone || '').replace(/[^0-9+]/g, '');
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: `📞 ខលទៅអតិថិជន (${order.customer.phone})`,
          url: `tel:${rawPhone}`,
        },
      ],
    ],
  };

  try {
    // 1. If customer uploaded payment proof / invoice image
    if (order.paymentProofUrl) {
      const proofUrl = order.paymentProofUrl;

      // Case A: Base64 Data URL
      if (proofUrl.startsWith('data:image/')) {
        try {
          const formData = new FormData();
          const blob = dataURItoBlob(proofUrl);
          formData.append('chat_id', chatId);
          if (config.topicId) {
            formData.append('message_thread_id', config.topicId);
          }
          formData.append('photo', blob, `invoice_${order.id}.jpg`);
          formData.append('caption', photoCaptionHtml);
          formData.append('parse_mode', 'HTML');
          formData.append('reply_markup', JSON.stringify(replyMarkup));

          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (data.ok) {
            return { success: true, messageId: data.result.message_id };
          } else {
            console.warn('Telegram sendPhoto HTML failed with base64, trying plain text caption:', data.description);

            // Retry photo with plain text caption (no parse_mode)
            const retryFormData = new FormData();
            retryFormData.append('chat_id', chatId);
            if (config.topicId) retryFormData.append('message_thread_id', config.topicId);
            retryFormData.append('photo', blob, `invoice_${order.id}.jpg`);
            retryFormData.append('caption', stripHtml(photoCaptionHtml));
            retryFormData.append('reply_markup', JSON.stringify(replyMarkup));

            const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
              method: 'POST',
              body: retryFormData,
            });
            const retryData = await retryRes.json();
            if (retryData.ok) {
              return { success: true, messageId: retryData.result.message_id };
            }
          }
        } catch (photoErr) {
          console.warn('sendPhoto multipart error, will fallback to text message:', photoErr);
        }
      } else if (proofUrl.startsWith('http')) {
        // Case B: Direct image URL (e.g. Cloudinary)
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              message_thread_id: config.topicId ? Number(config.topicId) : undefined,
              photo: proofUrl,
              caption: photoCaptionHtml,
              parse_mode: 'HTML',
              reply_markup: replyMarkup,
            }),
          });

          const data = await res.json();
          if (data.ok) {
            return { success: true, messageId: data.result.message_id };
          } else {
            console.warn('Telegram sendPhoto URL failed, trying plain text caption:', data.description);

            // Retry with plain text caption
            const retryRes = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: chatId,
                message_thread_id: config.topicId ? Number(config.topicId) : undefined,
                photo: proofUrl,
                caption: stripHtml(photoCaptionHtml),
                reply_markup: replyMarkup,
              }),
            });
            const retryData = await retryRes.json();
            if (retryData.ok) {
              return { success: true, messageId: retryData.result.message_id };
            }
          }
        } catch (photoUrlErr) {
          console.warn('sendPhoto URL fetch error, falling back to sendMessage:', photoUrlErr);
        }
      }
    }

    // 2. Standard or Fallback Text Message (HTML Mode)
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: config.topicId ? Number(config.topicId) : undefined,
        text: fullMessageHtml,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, messageId: data.result.message_id };
    }

    // 3. Resilient Safety Net: If Telegram fails to parse entities, retry with Plain Text!
    console.warn('sendMessage HTML parse failed, retrying with Plain Text:', data.description);
    const plainRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_thread_id: config.topicId ? Number(config.topicId) : undefined,
        text: stripHtml(fullMessageHtml),
        reply_markup: replyMarkup,
      }),
    });

    const plainData = await plainRes.json();
    if (plainData.ok) {
      return { success: true, messageId: plainData.result.message_id };
    } else {
      return { success: false, message: plainData.description || 'Telegram API Error' };
    }
  } catch (error: any) {
    console.error('Failed to send Telegram notification:', error);
    return { success: false, message: error.message || 'Network error sending to Telegram' };
  }
}

/**
 * Fetch bot details via Telegram Bot getMe API
 */
export interface TelegramBotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
  supports_inline_queries: boolean;
}

export async function getTelegramBotInfo(
  botToken: string
): Promise<{ success: boolean; botInfo?: TelegramBotInfo; error?: string }> {
  const token = botToken.trim();
  if (!token) {
    return { success: false, error: 'សូមបញ្ចូល Telegram Bot API Token!' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();
    if (data.ok && data.result) {
      return { success: true, botInfo: data.result };
    } else {
      return {
        success: false,
        error: data.description || 'Bot API Token មិនត្រឹមត្រូវ ឬត្រូវបានបិទ (Invalid Token)',
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Network Error: ${err?.message || 'មិនអាចតភ្ជាប់ទៅ Telegram API បានទេ'}`,
    };
  }
}

/**
 * Fetch recent updates/messages sent to the bot to detect Group ID / Chat ID automatically
 */
export interface TelegramDetectedChat {
  chatId: string;
  title: string;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  username?: string;
  lastMessageText?: string;
  date?: string;
}

export async function getTelegramRecentUpdates(
  botToken: string
): Promise<{ success: boolean; chats: TelegramDetectedChat[]; error?: string }> {
  const token = botToken.trim();
  if (!token) {
    return { success: false, chats: [], error: 'សូមបញ្ចូល Telegram Bot API Token!' };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=50`);
    const data = await res.json();

    if (!data.ok) {
      return {
        success: false,
        chats: [],
        error: data.description || 'មិនអាចទាញយក Chat Updates បានទេ',
      };
    }

    const updates = data.result || [];
    const chatsMap: { [id: string]: TelegramDetectedChat } = {};

    for (const update of updates) {
      const msg = update.message || update.channel_post || update.my_chat_member?.chat || update.edited_message;
      if (!msg) continue;

      const chat = msg.chat || msg;
      if (!chat || !chat.id) continue;

      const chatIdStr = String(chat.id);
      let title = chat.title || '';
      if (!title) {
        title = [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username || `Chat ${chatIdStr}`;
      }

      chatsMap[chatIdStr] = {
        chatId: chatIdStr,
        title,
        type: chat.type || 'group',
        username: chat.username,
        lastMessageText: msg.text || '(សារមេឌា/Command)',
        date: msg.date ? new Date(msg.date * 1000).toLocaleString('km-KH') : undefined,
      };
    }

    const detectedList = Object.values(chatsMap);
    return { success: true, chats: detectedList };
  } catch (err: any) {
    return {
      success: false,
      chats: [],
      error: `Network Error: ${err?.message || 'មិនអាចទាញយក Updates បានទេ'}`,
    };
  }
}

/**
 * Send a realistic simulated test order to verify bot layout and formatting
 */
export async function sendTestSampleOrderToTelegram(
  botToken: string,
  chatId: string,
  topicId?: string,
  companyProfile?: CompanyProfile
): Promise<{ success: boolean; message: string }> {
  const mockOrder: Order = {
    id: `ORD-TEST-${Math.floor(1000 + Math.random() * 9000)}`,
    items: [
      {
        product: {
          id: 'test-1',
          name: 'NPK 20-20-15+TE',
          nameKh: 'ជីកសិកម្ម សញ្ញាមហាកំពែង NPK 20-20-15+TE (ជំនាញស្រូវ & ដំណាំ)',
          category: 'NPK',
          categoryKh: 'ជីគីមី NPK',
          npk: '20-20-15+TE',
          usage: 'ជំនាញដំណាំស្រូវ ដំណាំឈើហូបផ្លែ និងបន្លែបង្ការ',
          packagingSize: 'បាវ ៥០ គីឡូក្រាម',
          weight: '50kg',
          price: 38.5,
          imageUrl: '',
          order: 1,
          registrationNo: 'R-FR02 1584/0525 TZAT-GDA',
          bagColorTheme: 'rainbow',
          granuleColor: 'pink-white',
          nutrients: { n: '20%', p: '20%', k: '15%', s: '2%' },
          benefits: ['ជួយឱ្យដើមស្រូវថ្លោស', 'បង្កើនទិន្នផលគ្រាប់ពេញ'],
          suitableCrops: ['ស្រូវ', 'ទុរេន', 'ស្វាយ'],
        },
        quantity: 10,
      },
      {
        product: {
          id: 'test-2',
          name: 'Super Humic 99%',
          nameKh: 'ជីសរីរាង្គ Super Humic ដកស្រង់ធម្មជាតិ ៩៩%',
          category: 'SuperHumic',
          categoryKh: 'ជីសរីរាង្គ',
          npk: 'Organic 99%',
          usage: 'បំប៉នដី បណ្តុះឫស និងជួយកាត់បន្ថយជាតិជូរ',
          packagingSize: 'បាវ ២៥ គីឡូក្រាម',
          weight: '25kg',
          price: 24.0,
          imageUrl: '',
          order: 2,
          registrationNo: 'R-ORG 2025/11',
          bagColorTheme: 'green',
          granuleColor: 'black',
          nutrients: { fulvicAcid: '99%' },
          benefits: ['កែប្រែដីខូច', 'ជួយឱ្យឫសដុះច្រើន'],
          suitableCrops: ['គ្រប់ដំណាំ'],
        },
        quantity: 5,
      },
    ],
    customer: {
      fullName: 'លោក សុខ ចិន្តា (កសិករតេស្ត)',
      phone: '096 522 9 777',
      provinceId: 'battambang',
      districtVillage: 'ភូមិវត្តគរ ឃុំវត្តគរ ក្រុងបាត់ដំបង',
      deliveryMethod: 'door',
      selectedBranch: 'សាខាក្រុងបាត់ដំបង (ផ្លូវជាតិលេខ ៥)',
      notes: 'សូមផ្ញើជីដែលទើបផលិតថ្មីៗជូនខ្ញុំ',
    },
    deliveryFee: {
      totalActualWeightKg: 625,
      totalVolumetricWeightKg: 500,
      billableWeightKg: 625,
      weightTier: 'bulk',
      baseRateUSD: 2.0,
      weightFeeUSD: 28.0,
      doorDeliveryFeeUSD: 3.5,
      totalFeeUSD: 33.5,
      totalFeeKHR: 137350,
      ratePerKgUSD: 0.05,
      breakdownKh: 'សេវាដឹកជញ្ជូន VET (ទម្ងន់ 625kg)',
      estimatedDeliveryTime: '24 ទៅ 48 ម៉ោង',
    },
    subtotalUSD: 505.0,
    subtotalKHR: 2070500,
    totalUSD: 538.5,
    totalKHR: 2207850,
    status: 'pending_payment',
    paymentMethod: 'bank_qr',
    selectedBankName: 'ABA Bank KHQR (ទីវ ហៃ កសិកម្ម)',
    bankAccountNumber: '001 234 567 (USD)',
    khqrRef: 'KHQR-SAMPLE-12345',
    createdAt: new Date().toISOString(),
  };

  const messageHtml = `
🧪 <b>[សារសាកល្បង] ការកុម្ម៉ង់ជីកសិកម្មគំរូ (SAMPLE ORDER DISPATCH)</b>
━━━━━━━━━━━━━━━━━━━━━━━━
🆔 <b>លេខកូដវិក្កយបត្រ:</b> <code>#${escapeHtml(mockOrder.id)}</code>
📅 <b>កាលបរិច្ឆេទ:</b> ${escapeHtml(new Date().toLocaleString('km-KH'))}
📊 <b>ស្ថានភាព:</b> 🕒 រង់ចាំការត្រួតពិនិត្យ (Pending Review)

👤 <b>ព័ត៌មានអតិថិជនគំរូ:</b>
• ឈ្មោះ: <b>${escapeHtml(mockOrder.customer.fullName)}</b>
• ទូរស័ព្ទ: <code>${escapeHtml(mockOrder.customer.phone)}</code>
• ខេត្ត/ក្រុង: <b>ខេត្តបាត់ដំបង</b>
• វិធីដឹក: 🚚 <b>ដឹកជញ្ជូនដល់ផ្ទះ (Door Delivery)</b>
• អាសយដ្ឋាន: <i>${escapeHtml(mockOrder.customer.districtVillage)}</i>
• សាខា VET: <i>${escapeHtml(mockOrder.customer.selectedBranch)}</i>

━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>មុខទំនិញបញ្ជាទិញ (Order Items):</b>
  <b>1. ជីកសិកម្ម NPK 20-20-15+TE</b>
     ▫️ ចំនួន: <b>10 បាវ</b> (50kg)
     ▫️ តម្លៃ: $38.50 × 10 = <b>$385.00</b>
  <b>2. ជីសរីរាង្គ Super Humic 99%</b>
     ▫️ ចំនួន: <b>5 បាវ</b> (25kg)
     ▫️ តម្លៃ: $24.00 × 5 = <b>$120.00</b>

━━━━━━━━━━━━━━━━━━━━━━━━
💵 <b>សរុបការទូទាត់ (Payment Breakdown):</b>
• តម្លៃទំនិញ: <b>$505.00</b> (~2,070,500 ៛)
• សេវាដឹក VET (625kg): <b>$33.50</b> (~137,350 ៛)
• <b>ទឹកប្រាក់សរុប (GRAND TOTAL):</b> <b>$538.50 USD</b> (~2,207,850 ៛)
• ធនាគារ: <b>ABA Bank KHQR (ទីវ ហៃ កសិកម្ម)</b>

━━━━━━━━━━━━━━━━━━━━━━━━
🏢 <i>${escapeHtml(companyProfile?.nameKh || 'ក្រុមហ៊ុន ទីវ ហៃ (ខេមបូឌា)')}</i>
✨ <i>ការតភ្ជាប់ Telegram Bot API Token របស់អ្នកដំណើរការបានយ៉ាងល្អឥតខ្ចោះ ១០០%!</i>
`.trim();

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: `📞 ខលទៅអតិថិជន (${mockOrder.customer.phone})`,
          url: `tel:${mockOrder.customer.phone.replace(/[^0-9+]/g, '')}`,
        },
      ],
    ],
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        message_thread_id: topicId?.trim() ? Number(topicId.trim()) : undefined,
        text: messageHtml,
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return {
        success: true,
        message: 'បានផ្ញើវិក្កយបត្រកុម្ម៉ង់ជីគំរូទៅកាន់ Telegram ដោយជោគជ័យ!',
      };
    }

    // Retry with plain text if HTML parsing failed
    const plainRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        message_thread_id: topicId?.trim() ? Number(topicId.trim()) : undefined,
        text: stripHtml(messageHtml),
        reply_markup: replyMarkup,
      }),
    });
    const plainData = await plainRes.json();
    if (plainData.ok) {
      return {
        success: true,
        message: 'បានផ្ញើវិក្កយបត្រកុម្ម៉ង់ជីគំរូទៅកាន់ Telegram ដោយជោគជ័យ!',
      };
    } else {
      return {
        success: false,
        message: `Telegram Error: ${plainData.description || data.description || 'Invalid Bot Token or Chat ID'}`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Network Error: ${err?.message || 'Cannot reach Telegram API'}`,
    };
  }
}

/**
 * Test Telegram Bot connection with a sample message
 */
export async function testTelegramBotConnection(
  botToken: string,
  chatId: string,
  topicId?: string
): Promise<{ success: boolean; message: string }> {
  if (!botToken.trim() || !chatId.trim()) {
    return { success: false, message: 'សូមបញ្ចូល Telegram Bot Token និង Chat ID ឱ្យបានត្រឹមត្រូវ!' };
  }

  const testHtml = `
🤖 <b>ការតភ្ជាប់ Telegram Bot បានជោគជ័យ! (TEST NOTIFICATION)</b>
━━━━━━━━━━━━━━━━━━━━
🏢 <b>ប្រព័ន្ធគ្រប់គ្រងការកុម្ម៉ង់ជីកសិកម្ម ទីវ ហៃ</b>
⏰ <b>ពេលវេលា:</b> ${new Date().toLocaleString('km-KH')}
✅ ប្រព័ន្ធ Bot ដំណើរការធម្មតា។ រាល់ពេលអតិថិជនកុម្ម៉ង់ទំនិញ និងភ្ជាប់រូបភាពវិក្កយបត្រ ព័ត៌មាននឹងត្រូវផ្ញើមកកាន់ទីនេះភ្លាមៗ!
━━━━━━━━━━━━━━━━━━━━
<i>សារតេស្តពីប្រព័ន្ធ Admin Dashboard</i>
`.trim();

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        message_thread_id: topicId?.trim() ? Number(topicId.trim()) : undefined,
        text: testHtml,
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true, message: 'ការតភ្ជាប់ Bot ជោគជ័យ! បានផ្ញើសារសាកល្បងទៅកាន់ Telegram រួចរាល់។' };
    }

    // Plain text retry
    const plainRes = await fetch(`https://api.telegram.org/bot${botToken.trim()}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        message_thread_id: topicId?.trim() ? Number(topicId.trim()) : undefined,
        text: stripHtml(testHtml),
      }),
    });
    const plainData = await plainRes.json();
    if (plainData.ok) {
      return { success: true, message: 'ការតភ្ជាប់ Bot ជោគជ័យ! បានផ្ញើសារសាកល្បងទៅកាន់ Telegram រួចរាល់។' };
    } else {
      return { success: false, message: `Telegram Error: ${plainData.description || data.description || 'Invalid Bot Token or Chat ID'}` };
    }
  } catch (err: any) {
    return { success: false, message: `Network Error: ${err?.message || 'Cannot reach Telegram API'}` };
  }
}
