/**
 * whatsapp.js — Sironosim Gardens Hotel
 * Formats the cart into a clean WhatsApp message and opens the API URL.
 * Depends on: Cart (from script.js)
 */

'use strict';

const WA_NUMBER = '254717944229'; // international format, no +

/**
 * Build a human-readable order summary and open WhatsApp.
 */
function checkoutViaWhatsApp() {
  if (!Cart || Cart.list.length === 0) {
    showToast('Your cart is empty!');
    return;
  }

  const lines = [];

  lines.push('🏡 *Sironosim Gardens Hotel — New Enquiry*');
  lines.push('─────────────────────────');

  // Group items by note/category if present
  Cart.list.forEach((item, i) => {
    const itemLine = `${i + 1}. *${item.name}* × ${item.qty}  →  KES ${(item.price * item.qty).toLocaleString()}`;
    lines.push(itemLine);
    if (item.note) lines.push(`   _${item.note}_`);
  });

  lines.push('─────────────────────────');
  lines.push(`💰 *Total: KES ${Cart.total.toLocaleString()}*`);
  lines.push('');
  lines.push('Please confirm availability and share payment details. Thank you! 🙏');

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);
  const url     = `https://wa.me/${WA_NUMBER}?text=${encoded}`;

  // Open WhatsApp in a new tab
  window.open(url, '_blank', 'noopener,noreferrer');

  // Optionally close the cart modal after checkout
  if (typeof closeCart === 'function') closeCart();
}

/**
 * Quick single-item WhatsApp enquiry (bypasses cart).
 * Used on "Book Now" buttons for individual rooms.
 */
function quickEnquiryWhatsApp({ name, price, note = '' }) {
  const lines = [
    '🏡 *Sironosim Gardens Hotel — Room Enquiry*',
    '─────────────────────────',
    `I would like to enquire about: *${name}*`,
    `Rate: KES ${Number(price).toLocaleString()} per night`,
  ];
  if (note) lines.push(`Details: _${note}_`);
  lines.push('');
  lines.push('Please confirm availability and next steps. Thank you!');

  const encoded = encodeURIComponent(lines.join('\n'));
  window.open(`https://wa.me/${WA_NUMBER}?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

/* Attach quick-enquiry handler to "Book Now" buttons */
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-action="book-now"]');
    if (!btn) return;
    const card = btn.closest('[data-item]');
    if (!card) return;
    quickEnquiryWhatsApp({
      name:  card.dataset.itemName  || 'Room',
      price: card.dataset.itemPrice || 0,
      note:  card.dataset.itemNote  || '',
    });
  });

  // "Chat with Us" general button
  document.addEventListener('click', e => {
    if (e.target.closest('[data-action="chat-with-us"]')) {
      const greeting = encodeURIComponent('Hello! I found you on your website and would like to enquire about your rooms and services. 😊');
      window.open(`https://wa.me/${WA_NUMBER}?text=${greeting}`, '_blank', 'noopener,noreferrer');
    }
  });
});
