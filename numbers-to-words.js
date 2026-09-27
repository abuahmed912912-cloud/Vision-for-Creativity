/* ============================================================
   🔢 تفقيط — تحويل الأرقام إلى كلمات عربية
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
  
  function full(amount) {
    amount = Number(amount || 0);
    if (isNaN(amount) || amount === 0) return 'صفر';
    const neg = amount < 0; amount = Math.abs(amount);
    const whole = Math.floor(amount);
    const frac = Math.round((amount - whole) * 100);
    let r = '';
    if (whole === 1) r = 'ريال يمني واحد';
    else if (whole === 2) r = 'ريالان يمنيان';
    else if (whole >= 3 && whole <= 10) r = ar(whole) + ' ريالات يمنية';
    else if (whole > 10) r = ar(whole) + ' ريال يمني';
    if (frac > 0) { if (r) r += ' و'; r += ar(frac) + ' فلس'; }
    if (neg) r = 'سالب ' + r;
    return r || 'صفر';
  }
  
  window.numberToWordsAr = ar;
  window.numberToWordsFull = full;
  window.tafqeet = full;
  
  // الحصول على الأرقام من عنصر
  function getNum(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  let txt = el.textContent;
  txt = txt.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
  txt = txt.replace(/[^\d\.\-]/g, '');
  const n = parseFloat(txt);
  return isNaN(n) ? 0 : n;
}
  
  // إضافة/تحديث الـ wrapper تحت العنصر
  function updateTafqeet(targetId, wrapId) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    const num = getNum(targetId);
    let wrap = document.getElementById(wrapId);
    
    // إنشاء الـ wrapper إن لم يكن موجوداً
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = wrapId;
      wrap.style.cssText = 'color:#0f4c81;font-weight:700;font-size:13px;margin-top:6px;background:#eaf3fb;padding:8px;border-radius:8px;direction:rtl';
      target.parentNode.insertBefore(wrap, target.nextSibling);
    }
    
    const text = '📝 ' + full(num);
    if (wrap.textContent !== text) {
      wrap.textContent = text;
    }
  }
  
  // حلقة تحديث كل 500ms — تضمن التزامن مع recalc
  function loop() {
    updateTafqeet('saleTotal', 'saleTotalWords');
    updateTafqeet('purchaseTotal', 'purchaseTotalWords');
    updateTafqeet('voiceTotal', 'voiceTotalWords');
  }
  
  // التشغيل
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(loop, 1500);
      setInterval(loop, 500);
    });
  } else {
    setTimeout(loop, 1500);
    setInterval(loop, 500);
  }
  
  console.log('🔢 التفقيط جاهز');
})();