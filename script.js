/**
 * script.js — Sironosim Gardens Hotel
 * Global cart state manager (vanilla JS, no dependencies)
 */

'use strict';

/* ── State ────────────────────────────────────────────────── */
const Cart = {
  items: {},      // { itemId: { id, name, price, qty, img, note } }
  isOpen: false,

  /** Add or increment an item */
  add(item) {
    if (this.items[item.id]) {
      this.items[item.id].qty += 1;
    } else {
      this.items[item.id] = { ...item, qty: 1 };
    }
    this._sync();
    showToast(`"${item.name}" added to cart ✓`);
  },

  /** Set quantity directly (0 = remove) */
  setQty(id, qty) {
    if (!this.items[id]) return;
    if (qty <= 0) {
      delete this.items[id];
    } else {
      this.items[id].qty = qty;
    }
    this._sync();
  },

  /** Remove one item entirely */
  remove(id) {
    delete this.items[id];
    this._sync();
  },

  /** Empty the whole cart */
  clear() {
    this.items = {};
    this._sync();
  },

  /** Total item count */
  get count() {
    return Object.values(this.items).reduce((s, i) => s + i.qty, 0);
  },

  /** Total price (KES) */
  get total() {
    return Object.values(this.items).reduce((s, i) => s + i.price * i.qty, 0);
  },

  /** Returns items as an array */
  get list() {
    return Object.values(this.items);
  },

  /** Persist to sessionStorage and refresh UI */
  _sync() {
    try {
      sessionStorage.setItem('sg_cart', JSON.stringify(this.items));
    } catch (_) { /* storage not available */ }
    renderCart();
    updateBadge();
  },

  /** Rehydrate from sessionStorage on page load */
  load() {
    try {
      const raw = sessionStorage.getItem('sg_cart');
      if (raw) this.items = JSON.parse(raw);
    } catch (_) { this.items = {}; }
  },
};

/* ── DOM helpers ──────────────────────────────────────────── */
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

/* ── Badge update ─────────────────────────────────────────── */
function updateBadge() {
  const badges = $$('.cart-badge');
  const count  = Cart.count;
  badges.forEach(b => {
    b.textContent = count;
    b.classList.toggle('show', count > 0);
  });
}

/* ── Cart render ──────────────────────────────────────────── */
function renderCart() {
  const list = $('.cart-items-list');
  const totalEl = $('.cart-total-amount');
  if (!list) return;

  list.innerHTML = '';

  if (Cart.list.length === 0) {
    list.innerHTML = `
      <div class="cart-empty">
        <span>🛒</span>
        <p>Your cart is empty.<br>Add rooms or meals to get started.</p>
      </div>`;
  } else {
    Cart.list.forEach(item => {
      const li = document.createElement('div');
      li.className = 'cart-item';
      li.dataset.id = item.id;
      li.innerHTML = `
        <img class="cart-item-img" src="${item.img || 'https://placehold.co/52x52/E8D9C0/5C3D1E?text=+'}" alt="${item.name}">
        <div class="cart-item-info">
          <div class="name">${item.name}</div>
          <div class="price">KES ${(item.price * item.qty).toLocaleString()}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-id="${item.id}" aria-label="Decrease">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}" aria-label="Increase">+</button>
        </div>`;
      list.appendChild(li);
    });
  }

  if (totalEl) totalEl.textContent = `KES ${Cart.total.toLocaleString()}`;

  // Show/hide checkout button
  const checkoutBtn = $('.btn-checkout');
  if (checkoutBtn) checkoutBtn.disabled = Cart.list.length === 0;
}

/* ── Open / Close modal ───────────────────────────────────── */
function openCart() {
  const modal   = $('.cart-modal');
  const overlay = $('.cart-overlay');
  if (!modal) return;
  modal.classList.add('open');
  overlay?.classList.add('open');
  Cart.isOpen = true;
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  const modal   = $('.cart-modal');
  const overlay = $('.cart-overlay');
  if (!modal) return;
  modal.classList.remove('open');
  overlay?.classList.remove('open');
  Cart.isOpen = false;
  document.body.style.overflow = '';
}

/* ── Toast ────────────────────────────────────────────────── */
let _toastTimer;
function showToast(msg) {
  let toast = $('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ── Global event delegation ──────────────────────────────── */
document.addEventListener('click', e => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;
  const id     = target.dataset.id;

  switch (action) {
    case 'open-cart':  openCart();  break;
    case 'close-cart': closeCart(); break;
    case 'add-to-cart': {
      const card = target.closest('[data-item]');
      if (!card) return;
      Cart.add({
        id:    card.dataset.itemId,
        name:  card.dataset.itemName,
        price: Number(card.dataset.itemPrice),
        img:   card.dataset.itemImg  || '',
        note:  card.dataset.itemNote || '',
      });
      break;
    }
    case 'inc': Cart.setQty(id, (Cart.items[id]?.qty || 0) + 1); break;
    case 'dec': Cart.setQty(id, (Cart.items[id]?.qty || 0) - 1); break;
    case 'clear-cart': Cart.clear(); break;
    case 'checkout':
      // delegate to whatsapp.js
      if (typeof checkoutViaWhatsApp === 'function') checkoutViaWhatsApp();
      break;
  }
});

// Close on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('cart-overlay')) closeCart();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && Cart.isOpen) closeCart();
});

// Highlight active nav link
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  $$('.site-nav a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === page || (page === '' && href === 'index.html'));
  });
}

// Mobile hamburger toggle
function initHamburger() {
  const toggle = $('.nav-toggle');
  const nav    = $('.site-nav');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
}

/* ── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Cart.load();
  renderCart();
  updateBadge();
  setActiveNav();
  initHamburger();
});
