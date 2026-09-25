/* ============================================================
   🔢 تفقيط — تحويل الأرقام إلى كلمات عربية
   يعمل في كل التطبيق (مبيعات، مشتريات، سندات، إلخ)
   ============================================================ */

(function() {
  
  /* ═══ الأرقام بالعربية ═══ */
  const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة',
                'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر',
                'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUNDREDS = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة',
                    'ثمانمائة', 'تسعمائة'];
  
  /* ═══ تحويل رقم إلى كلمات (الجزء العربي) ═══ */
  function numberToWordsAr(num) {
    num = Math.floor(Math.abs(Number(num) || 0));
    if (num === 0) return 'صفر';
    if (num > 999999999999) return 'رقم كبير جداً';
    
    let words = [];
    
    // المليارات
    if (num >= 1000000000) {
      const b = Math.floor(num / 1000000000);
      num %= 1000000000;
      if (b === 1) words.push('مليار');
      else if (b === 2) words.push('ملياران');
      else if (b >= 3 && b <= 10) words.push(numberToWordsAr(b) + ' مليارات');
      else words.push(numberToWordsAr(b) + ' مليار');
    }
    
    // الملايين
    if (num >= 1000000) {
      const m = Math.floor(num / 1000000);
      num %= 1000000;
      if (m === 1) words.push('مليون');
      else if (m === 2) words.push('مليونان');
      else if (m >= 3 && m <= 10) words.push(numberToWordsAr(m) + ' ملايين');
      else words.push(numberToWordsAr(m) + ' مليون');
    }
    
    // الآلاف
    if (num >= 1000) {
      const t = Math.floor(num / 1000);
      num %= 1000;
      if (t === 1) words.push('ألف');
      else if (t === 2) words.push('ألفان');
      else if (t >= 3 && t <= 10) words.push(numberToWordsAr(t) + ' آلاف');
      else words.push(numberToWordsAr(t) + ' ألف');
    }
    
    // المئات
    if (num >= 100) {
      const h = Math.floor(num / 100);
      num %= 100;
      words.push(HUNDREDS[h]);
    }
    
    // العشرات والآحاد
    if (num > 0) {
      if (num < 20) {
        words.push(ONES[num]);
      } else {
        const t = Math.floor(num / 10);
        const o = num % 10;
        if (o > 0) words.push(ONES[o] + ' و' + TENS[t]);
        else words.push(TENS[t]);
      }
    }
    
    return words.filter(Boolean).join(' و');
  }
  
  /* ═══ تحويل المبلغ مع الكسور ═══ */
  function numberToWordsFull(amount, currency = 'YER') {
    amount = Number(amount || 0);
    if (isNaN(amount) || amount === 0) return 'صفر';
    
    const isNegative = amount < 0;
    amount = Math.abs(amount);
    
    const whole = Math.floor(amount);
    const fraction = Math.round((amount - whole) * 100);
    
    const currencyNames = {
      'YER': {name: 'ريال يمني', sub: 'فلس', plural: 'ريالات يمنية'},
      'SAR': {name: 'ريال سعودي', sub: 'هللة', plural: 'ريالات سعودية'},
      'USD': {name: 'دولار أمريكي', sub: 'سنت', plural: 'دولارات أمريكية'}
    };
    
    const c = currencyNames[currency] || currencyNames['YER'];
    
    let result = '';
    
    // الجزء الصحيح
    if (whole === 0) {
      result = '';
    } else if (whole === 1) {
      result = c.name + ' واحد';
    } else if (whole === 2) {
      result = c.name + 'ان';
    } else if (whole >= 3 && whole <= 10) {
      result = numberToWordsAr(whole) + ' ' + c.plural;
    } else {
      result = numberToWordsAr(whole) + ' ' + c.name;
    }
    
    // الكسور
    if (fraction > 0) {
      if (result) result += ' و';
      result += numberToWordsAr(fraction) + ' ' + c.sub;
    }
    
    if (isNegative) result = 'سالب ' + result;
    
    return result || 'صفر';
  }
  
  // تصدير الدوال
  window.numberToWordsAr = numberToWordsAr;
  window.numberToWordsFull = numberToWordsFull;
  window.tafqeet = numberToWordsFull;
  
  /* ═══ إضافة التفقيط تلقائياً بجانب كل الأرقام ═══ */
  function addTafqeetToAll() {
    // البحث عن جميع العناصر التي فيها money() ونضيف التفقيط
    // نضيف فقط مرة واحدة
    
    // 1. إجمالي المبيعات
    const saleTotal = document.getElementById('saleTotal');
    if (saleTotal && !saleTotal.dataset.tafqeet) {
      const wrapper = document.createElement('div');
      wrapper.id = 'saleTotalWords';
      wrapper.style.cssText = 'color:#0f4c81;font-weight:700;font-size:13px;margin-top:6px;background:#eaf3fb;padding:8px;border-radius:8px';
      wrapper.textContent = '📝 ' + numberToWordsFull(0);
      saleTotal.parentNode.appendChild(wrapper);
      saleTotal.dataset.tafqeet = '1';
    }
    
    // 2. إجمالي المشتريات
    const purchaseTotal = document.getElementById('purchaseTotal');
    if (purchaseTotal && !purchaseTotal.dataset.tafqeet) {
      const wrapper = document.createElement('div');
      wrapper.id = 'purchaseTotalWords';
      wrapper.style.cssText = 'color:#0f4c81;font-weight:700;font-size:13px;margin-top:6px;background:#eaf3fb;padding:8px;border-radius:8px';
      wrapper.textContent = '📝 ' + numberToWordsFull(0);
      purchaseTotal.parentNode.appendChild(wrapper);
      purchaseTotal.dataset.tafqeet = '1';
    }
    
    // 3. رصيد العميل في المبيعات
    const customerBalance = document.getElementById('customerBalanceInfo');
    if (customerBalance && !customerBalance.dataset.tafqeet) {
      customerBalance.dataset.tafqeet = '1';
      const observer = new MutationObserver(() => {
        const balanceText = customerBalance.textContent.match(/([\d,\.]+)/);
        if (balanceText) {
          const num = parseFloat(balanceText[1].replace(/,/g, ''));
          if (!isNaN(num) && !customerBalance.querySelector('.tafqeet-line')) {
            const line = document.createElement('div');
            line.className = 'tafqeet-line';
            line.style.cssText = 'font-size:11px;color:#92400e;margin-top:4px;font-weight:600';
            line.textContent = '📝 ' + numberToWordsFull(num);
            customerBalance.appendChild(line);
          }
        }
      });
      observer.observe(customerBalance, {childList: true, subtree: true});
    }
    
    // 4. رصيد المورد في المشتريات
    const supplierBalance = document.getElementById('supplierBalanceInfo');
    if (supplierBalance && !supplierBalance.dataset.tafqeet) {
      supplierBalance.dataset.tafqeet = '1';
      const observer = new MutationObserver(() => {
        const balanceText = supplierBalance.textContent.match(/([\d,\.]+)/);
        if (balanceText) {
          const num = parseFloat(balanceText[1].replace(/,/g, ''));
          if (!isNaN(num) && !supplierBalance.querySelector('.tafqeet-line')) {
            const line = document.createElement('div');
            line.className = 'tafqeet-line';
            line.style.cssText = 'font-size:11px;color:#92400e;margin-top:4px;font-weight:600';
            line.textContent = '📝 ' + numberToWordsFull(num);
            supplierBalance.appendChild(line);
          }
        }
      });
      observer.observe(supplierBalance, {childList: true, subtree: true});
    }
  }
  
  /* ═══ تعديل recalc لإضافة التفقيط ═══ */
  if (typeof window.recalc === 'function') {
    const originalRecalc = window.recalc;
    window.recalc = function(kind) {
      originalRecalc.call(this, kind);
      setTimeout(() => {
        const totalId = kind === 'sale' ? 'saleTotal' : 'purchaseTotal';
        const wordsId = kind === 'sale' ? 'saleTotalWords' : 'purchaseTotalWords';
        const totalEl = document.getElementById(totalId);
        const wordsEl = document.getElementById(wordsId);
        if (totalEl && wordsEl) {
          const num = parseFloat(totalEl.textContent.replace(/,/g, '')) || 0;
          wordsEl.textContent = '📝 ' + numberToWordsFull(num);
        }
      }, 100);
    };
  }
  
  /* ═══ تشغيل أولي ═══ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(addTafqeetToAll, 3500));
  } else {
    setTimeout(addTafqeetToAll, 3500);
  }
  
  console.log('🔢 numbers-to-words.js محمّل — التفقيط جاهز');
  console.log('اختبار: 1234.50 →', numberToWordsFull(1234.50));
  console.log('اختبار: 18000 →', numberToWordsFull(18000));
})();