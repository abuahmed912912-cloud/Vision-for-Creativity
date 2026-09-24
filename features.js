/* ============================================================
   🚀 الميزات المتقدمة: بحث + إشعارات + تحويل العملات
   كل ميزة مستقلة — إذا فشلت واحدة، لا تؤثر على الأخرى
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   💱 الميزة 1: أسعار الصرف + التحويل
   ═══════════════════════════════════════════════════════════ */
(function initCurrencyRates() {
  // أسعار الصرف (قابلة للتحديث من الإعدادات)
  const DEFAULT_RATES = {
    YER: 1,        // الأساس
    SAR: 133,      // 1 سعودي = 133 يمني
    USD: 530       // 1 دولار = 530 يمني
  };
  
  window.EXCHANGE_RATES = { ...DEFAULT_RATES };
  
  // تحميل من localStorage
  try {
    const saved = JSON.parse(localStorage.getItem('exchange_rates') || '{}');
    Object.assign(window.EXCHANGE_RATES, saved);
  } catch(e) {}
  
  // دالة التحويل
  window.convertToYER = function(amount, currency) {
    const rate = window.EXCHANGE_RATES[currency] || 1;
    return Number(amount) * rate;
  };
  
  // حفظ الأسعار
  window.saveExchangeRates = function() {
    localStorage.setItem('exchange_rates', JSON.stringify(window.EXCHANGE_RATES));
  };
  
  console.log('💱 أسعار الصرف:', window.EXCHANGE_RATES);
})();

/* ═══════════════════════════════════════════════════════════
   🔍 الميزة 2: بحث في الأصناف (المبيعات + الصوتي)
   ═══════════════════════════════════════════════════════════ */
(function initProductSearch() {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(addProductSearch, 2500);
  });
  
  function addProductSearch() {
    // نضيف حقل بحث في المبيعات
    const salesRows = document.getElementById('saleRows');
    if (salesRows && !document.getElementById('saleProductSearch')) {
      const searchBox = document.createElement('div');
      searchBox.id = 'saleProductSearch';
      searchBox.style.cssText = 'margin-bottom:10px;background:#e0f2fe;padding:10px;border-radius:10px;border:1px solid #0284c7';
      searchBox.innerHTML = `
        <label style="color:#075985;font-weight:700">🔍 بحث سريع في الأصناف</label>
        <div style="display:flex;gap:6px">
          <input id="saleSearchInput" type="text" placeholder="اكتب اسم الصنف..." 
            style="flex:1;background:#fff" 
            oninput="window.filterSaleProducts(this.value)">
          <button class="btn small gray" onclick="document.getElementById('saleSearchInput').value='';window.filterSaleProducts('')">✖</button>
        </div>
        <div id="saleSearchResults" style="margin-top:6px;font-size:12px;color:#075985"></div>
      `;
      salesRows.parentNode.insertBefore(searchBox, salesRows);
    }
    
    // نضيف حقل بحث في الصوتي
    const voiceItems = document.querySelector('#voice .panel[style*="f8fafc"]');
    if (voiceItems && !document.getElementById('voiceProductSearch')) {
      const searchBox = document.createElement('div');
      searchBox.id = 'voiceProductSearch';
      searchBox.style.cssText = 'margin-bottom:10px;background:#e0f2fe;padding:10px;border-radius:10px;border:1px solid #0284c7';
      searchBox.innerHTML = `
        <label style="color:#075985;font-weight:700">🔍 بحث في الأصناف (للإضافة اليدوية)</label>
        <input id="voiceSearchInput" type="text" placeholder="اكتب اسم الصنف..." 
          style="background:#fff" 
          oninput="window.filterVoiceProducts(this.value)">
        <div id="voiceSearchResults" style="margin-top:6px;font-size:12px;color:#075985"></div>
      `;
      voiceItems.parentNode.insertBefore(searchBox, voiceItems);
    }
  }
  
  // فلترة أصناف المبيعات
  window.filterSaleProducts = function(query) {
    const q = (query || '').trim().toLowerCase();
    const results = document.getElementById('saleSearchResults');
    if (!results) return;
    if (!q) {
      results.innerHTML = '';
      return;
    }
    const matched = products.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 5);
    if (!matched.length) {
      results.innerHTML = '<span style="color:#dc2626">لا توجد نتائج</span>';
      return;
    }
    results.innerHTML = '🔎 نتائج: ' + matched.map(p => `
      <button class="btn small" style="margin:2px" onclick="window.addProductToSale('${p.id}')">
        ${p.name} ${p.sell_price ? `(${money(p.sell_price)})` : ''}
      </button>
    `).join('');
  };
  
  // إضافة صنف لفاتورة المبيعات
  window.addProductToSale = function(productId) {
    addInvoiceRow('sale');
    // آخر صف أضيف
    const rows = document.querySelectorAll('#saleRows .formgrid');
    if (!rows.length) return;
    const lastRow = rows[rows.length - 1];
    const select = lastRow.querySelector('.row-prod');
    if (select) {
      select.value = productId;
      setRowProduct(select, 'sale');
    }
    // ننظف البحث
    document.getElementById('saleSearchInput').value = '';
    document.getElementById('saleSearchResults').innerHTML = '';
  };
  
  // فلترة أصناف الصوتي
  window.filterVoiceProducts = function(query) {
    const q = (query || '').trim().toLowerCase();
    const results = document.getElementById('voiceSearchResults');
    if (!results) return;
    if (!q) {
      results.innerHTML = '';
      return;
    }
    const matched = products.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 5);
    if (!matched.length) {
      results.innerHTML = '<span style="color:#dc2626">لا توجد نتائج</span>';
      return;
    }
    results.innerHTML = '🔎 اضغط لإضافة الصنف للنص: ' + matched.map(p => `
      <button class="btn small" style="margin:2px" onclick="window.addProductToVoice('${p.id}')">
        ${p.name}
      </button>
    `).join('');
  };
  
  // إضافة صنف لنص الديون الصوتي
  window.addProductToVoice = function(productId) {
    const p = products.find(x => x.id === productId);
    if (!p) return;
    const textarea = document.getElementById('voiceText');
    if (!textarea) return;
    const currentText = textarea.value.trim();
    const newText = currentText ? currentText + '، ' + p.name + ' ' : p.name + ' ';
    textarea.value = newText;
    document.getElementById('voiceSearchInput').value = '';
    document.getElementById('voiceSearchResults').innerHTML = '';
    toast('✅ تم إضافة ' + p.name);
  };
  
  console.log('🔍 بحث الأصناف مفعّل');
})();

/* ═══════════════════════════════════════════════════════════
   🔔 الميزة 3: إشعارات محسّنة (Toast + تفاصيل)
   ═══════════════════════════════════════════════════════════ */
(function initEnhancedNotifications() {
  // دالة إشعار محسّنة
  window.notify = function(title, details = '', type = 'success', duration = 4000) {
    const colors = {
      success: { bg: '#16a34a', icon: '✅' },
      error:   { bg: '#dc2626', icon: '❌' },
      warning: { bg: '#f59e0b', icon: '⚠️' },
      info:    { bg: '#0f4c81', icon: 'ℹ️' }
    };
    const c = colors[type] || colors.info;
    
    // إزالة الإشعارات القديمة
    document.querySelectorAll('.notify-box').forEach(el => {
      if (el.dataset.old === '1') el.remove();
    });
    
    const box = document.createElement('div');
    box.className = 'notify-box';
    box.dataset.old = '1';
    box.style.cssText = `
      position: fixed;
      bottom: 22px;
      left: 22px;
      right: 22px;
      max-width: 420px;
      background: ${c.bg};
      color: #fff;
      padding: 14px 18px;
      border-radius: 14px;
      z-index: 9999;
      font-family: Cairo, sans-serif;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      animation: notifySlide 0.3s ease;
      direction: rtl;
    `;
    box.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="font-size:24px;flex-shrink:0">${c.icon}</div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:14px">${title}</div>
          ${details ? `<div style="font-size:12px;opacity:.9;margin-top:4px;line-height:1.5">${details}</div>` : ''}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
          style="background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer;padding:0 4px">✕</button>
      </div>
    `;
    
    document.body.appendChild(box);
    setTimeout(() => {
      if (box.parentNode) box.remove();
    }, duration);
  };
  
  // إضافة CSS للحركة
  if (!document.getElementById('notifyStyles')) {
    const style = document.createElement('style');
    style.id = 'notifyStyles';
    style.textContent = `
      @keyframes notifySlide {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  // تعديل دالة toast الحالية
  setTimeout(() => {
    if (typeof window.toast === 'function') {
      window.originalToast = window.toast;
      window.toast = function(msg) {
        // إذا كان فيه رموز ✅ أو ❌ → نستخدم الإشعار الجديد
        if (msg.startsWith('✅') || msg.startsWith('❌') || msg.startsWith('⚠️')) {
          const type = msg.startsWith('✅') ? 'success' : msg.startsWith('❌') ? 'error' : 'warning';
          window.notify(msg.replace(/^[✅❌⚠️]\s*/, ''), '', type);
        } else {
          window.originalToast(msg);
        }
      };
    }
  }, 1000);
  
  console.log('🔔 الإشعارات المحسّنة مفعّلة');
})();

/* ═══════════════════════════════════════════════════════════
   💱 الميزة 4: تحويل العملات في الحفظ
   ═══════════════════════════════════════════════════════════ */
(function initCurrencyIntegration() {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(patchCurrencyDisplay, 3000);
  });
  
  function patchCurrencyDisplay() {
    // نعدّل دالة money لعرض العملة الصحيحة
    if (typeof window.money === 'function') {
      const originalMoney = window.money;
      window.moneyWithCurrency = function(amount, currency = 'YER') {
        const symbol = window.getCurrencySymbol(currency);
        return originalMoney(amount) + ' ' + symbol;
      };
    }
  }
  
  console.log('💱 دمج العملات مفعّل');
})();

/* ═══════════════════════════════════════════════════════════
   💱 الميزة 5: واجهة تعديل أسعار الصرف
   ═══════════════════════════════════════════════════════════ */
(function initRatesUI() {
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(addRatesButton, 3500);
  });
  
  function addRatesButton() {
    const settingsPanel = document.getElementById('settings');
    if (!settingsPanel) return;
    if (document.getElementById('ratesBtn')) return;
    
    // نضيف قسم في الإعدادات
    const panels = settingsPanel.querySelectorAll('.panel');
    if (!panels.length) return;
    
    const ratesPanel = document.createElement('div');
    ratesPanel.className = 'panel';
    ratesPanel.innerHTML = `
      <h3 style="margin-top:0">💱 أسعار الصرف</h3>
      <p class="muted" style="font-size:12px">تُستخدم لتحويل العملات عند حساب الإجماليات</p>
      <div class="formgrid">
        <div>
          <label>🇸🇦 1 ريال سعودي =</label>
          <input id="rateSAR" type="number" step="0.01" dir="ltr" style="background:#fff">
        </div>
        <div>
          <label>🇺🇸 1 دولار أمريكي =</label>
          <input id="rateUSD" type="number" step="0.01" dir="ltr" style="background:#fff">
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn green" onclick="window.saveRatesFromUI()">💾 حفظ الأسعار</button>
      </div>
      <div style="margin-top:8px;background:#f0f9ff;padding:10px;border-radius:8px;font-size:12px;color:#075985">
        💡 هذه الأسعار تُستخدم للتحويل التلقائي في التقارير.
      </div>
    `;
    // نضعه بعد أول panel (الملف الشخصي)
    panels[0].parentNode.insertBefore(ratesPanel, panels[1]);
    
    // نملأ الحقول
    document.getElementById('rateSAR').value = window.EXCHANGE_RATES.SAR || 133;
    document.getElementById('rateUSD').value = window.EXCHANGE_RATES.USD || 530;
  }
  
  window.saveRatesFromUI = function() {
    const sar = Number(document.getElementById('rateSAR').value) || 133;
    const usd = Number(document.getElementById('rateUSD').value) || 530;
    window.EXCHANGE_RATES.SAR = sar;
    window.EXCHANGE_RATES.USD = usd;
    window.saveExchangeRates();
    toast('✅ تم حفظ أسعار الصرف');
  };
  
  console.log('💱 واجهة أسعار الصرف جاهزة');
})();
/* ═══════════════════════════════════════════════════════════
   🌐 مؤشر حالة الاتصال
   ═══════════════════════════════════════════════════════════ */
(function initConnectionIndicator() {
  function updateStatus() {
    const online = navigator.onLine;
    let badge = document.getElementById('connectionBadge');
    
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'connectionBadge';
      badge.style.cssText = `
        position: fixed;
        top: 70px;
        left: 16px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 800;
        font-family: Cairo, sans-serif;
        z-index: 99;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s;
        display: none;
      `;
      document.body.appendChild(badge);
    }
    
    if (!online) {
      badge.style.display = 'block';
      badge.style.background = '#dc2626';
      badge.style.color = '#fff';
      badge.innerHTML = '🔴 غير متصل — البيانات المحلية فقط';
    } else {
      // إخفاء بعد 3 ثوان من عودة الاتصال
      badge.style.background = '#16a34a';
      badge.style.color = '#fff';
      badge.innerHTML = '🟢 متصل';
      badge.style.display = 'block';
      setTimeout(() => { badge.style.display = 'none'; }, 3000);
    }
  }
  
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  
  // فحص أولي
  setTimeout(updateStatus, 2000);
  
  console.log('🌐 مؤشر الاتصال مفعّل');
})();
console.log('🚀 features.js محمّل بنجاح — كل الميزات مفعّلة');