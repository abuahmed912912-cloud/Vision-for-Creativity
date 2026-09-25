/* ============================================================
   🔢 تفقيط — تحويل الأرقام إلى كلمات
   ============================================================ */
(function() {
  const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
                'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر',
                'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة',
                    'ثمانمائة', 'تسعمائة'];
  
  function ar(num) {
    num = Math.floor(Math.abs(Number(num) || 0));
    if (num === 0) return 'صفر';
    if (num > 999999999999) return 'رقم كبير';
    let w = [];
    if (num >= 1000000000) {
      const b = Math.floor(num / 1000000000); num %= 1000000000;
      if (b === 1) w.push('مليار');
      else if (b === 2) w.push('ملياران');
      else if (b <= 10) w.push(ar(b) + ' مليارات');
      else w.push(ar(b) + ' مليار');
    }
    if (num >= 1000000) {
      const m = Math.floor(num / 1000000); num %= 1000000;
      if (m === 1) w.push('مليون');
      else if (m === 2) w.push('مليونان');
      else if (m <= 10) w.push(ar(m) + ' ملايين');
      else w.push(ar(m) + ' مليون');
    }
    if (num >= 1000) {
      const t = Math.floor(num / 1000); num %= 1000;
      if (t === 1) w.push('ألف');
      else if (t === 2) w.push('ألفان');
      else if (t <= 10) w.push(ar(t) + ' آلاف');
      else w.push(ar(t) + ' ألف');
    }
    if (num >= 100) { w.push(HUNDREDS[Math.floor(num / 100)]); num %= 100; }
    if (num > 0) {
      if (num < 20) w.push(ONES[num]);
      else {
        const t = Math.floor(num / 10), o = num % 10;
        if (o > 0) w.push(ONES[o] + ' و' + TENS[t]);
        else w.push(TENS[t]);
      }
    }
    return w.filter(Boolean).join(' و');
  }
  
  function full(amount, currency = 'YER') {
    amount = Number(amount || 0);
    if (isNaN(amount) || amount === 0) return 'صفر';
    const neg = amount < 0; amount = Math.abs(amount);
    const whole = Math.floor(amount);
    const frac = Math.round((amount - whole) * 100);
    const names = {
      'YER': {n: 'ريال يمني', p: 'ريالات يمنية', s: 'فلس'},
      'SAR': {n: 'ريال سعودي', p: 'ريالات سعودية', s: 'هللة'},
      'USD': {n: 'دولار أمريكي', p: 'دولارات أمريكية', s: 'سنت'}
    };
    const c = names[currency] || names['YER'];
    let r = '';
    if (whole === 1) r = c.n + ' واحد';
    else if (whole === 2) r = c.n + 'ان';
    else if (whole >= 3 && whole <= 10) r = ar(whole) + ' ' + c.p;
    else if (whole > 10) r = ar(whole) + ' ' + c.n;
    if (frac > 0) { if (r) r += ' و'; r += ar(frac) + ' ' + c.s; }
    if (neg) r = 'سالب ' + r;
    return r || 'صفر';
  }
  
  window.numberToWordsAr = ar;
  window.numberToWordsFull = full;
  window.tafqeet = full;
  
  function getCurrency() {
    return (window.SHOP_SETTINGS && window.SHOP_SETTINGS.currency_code) || 'YER';
  }
  
  function makeWrapper(id) {
    const el = document.getElementById(id);
    if (!el || el.dataset.tafqeet === '1') return;
    el.dataset.tafqeet = '1';
    const wrap = document.createElement('div');
    wrap.id = id + 'Words';
    wrap.style.cssText = 'color:#0f4c81;font-weight:700;font-size:13px;margin-top:6px;background:#eaf3fb;padding:8px;border-radius:8px';
    wrap.textContent = '📝 ' + full(parseFloat(el.textContent.replace(/,/g, '')) || 0, getCurrency());
    el.parentNode.appendChild(wrap);
  }
  
  function update(id) {
    const el = document.getElementById(id);
    const wrap = document.getElementById(id + 'Words');
    if (!el || !wrap) return;
    const num = parseFloat(el.textContent.replace(/,/g, '')) || 0;
    wrap.textContent = '📝 ' + full(num, getCurrency());
  }
  
  function watchTotal(id) {
    const el = document.getElementById(id);
    if (!el || el.dataset.watchTafqeet === '1') return;
    el.dataset.watchTafqeet = '1';
    makeWrapper(id);
    new MutationObserver(() => update(id)).observe(el, {childList: true, characterData: true, subtree: true});
    // تحديث أولي
    setTimeout(() => update(id), 500);
  }
  
  function init() {
    watchTotal('saleTotal');
    watchTotal('purchaseTotal');
    // للرصيد السابق
    ['customerBalanceInfo', 'supplierBalanceInfo'].forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.dataset.tafqeet === '1') return;
      el.dataset.tafqeet = '1';
      new MutationObserver(() => {
        const m = el.textContent.match(/([\d,\.]+)/);
        if (!m) return;
        const num = parseFloat(m[1].replace(/,/g, ''));
        if (isNaN(num)) return;
        let line = el.querySelector('.tafqeet-line');
        if (!line) {
          line = document.createElement('div');
          line.className = 'tafqeet-line';
          line.style.cssText = 'font-size:11px;color:#92400e;margin-top:4px;font-weight:600';
          el.appendChild(line);
        }
        line.textContent = '📝 ' + full(num, getCurrency());
      }).observe(el, {childList: true, characterData: true, subtree: true});
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 3000));
  } else {
    setTimeout(init, 3000);
  }
  
  console.log('🔢 التفقيط جاهز');
})();