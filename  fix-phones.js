/* ============================================================
   📞 تصحيح أرقام الهاتف — إضافة رمز الدولة
   ============================================================ */

// نستبدل الدالة القديمة بنسخة محسّنة
window.normalizePhone = function(raw) {
  if (!raw) return null;
  let p = String(raw).replace(/\D/g, ''); // احذف كل شيء غير رقمي
  
  if (!p) return null;
  
  // احذف 00 من البداية
  if (p.startsWith('00')) p = p.slice(2);
  
  // احذف + إذا كانت موجودة (لأن \D حذفها أصلاً، لكن للاحتياط)
  p = p.replace(/^\+/, '');
  
  // إذا كان الرقم 9 أرقام يمني (يبدأ بـ 7)
  if (p.length === 9 && p.startsWith('7')) {
    p = '967' + p;
  }
  // إذا كان 10 أرقام ويبدأ بـ 0
  else if (p.length === 10 && p.startsWith('0')) {
    p = '967' + p.slice(1);
  }
  // إذا كان 12 وبدأ بـ 967 — صحيح
  else if (p.length === 12 && p.startsWith('967')) {
    // صحيح
  }
  // إذا لم يبدأ بـ 967 → أضفه
  else if (!p.startsWith('967')) {
    p = '967' + p;
  }
  
  return p;
};

// نتحقق في التطبيق
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    console.log('📞 normalizePhone محدّثة');
    console.log('اختبار:');
    console.log('  777443615 →', normalizePhone('777443615'));
    console.log('  0777443615 →', normalizePhone('0777443615'));
    console.log('  +967777443615 →', normalizePhone('+967777443615'));
  }, 3000);
});

/* ═══════════════════════════════════════════════════════════
   🔧 زر "تصحيح الأرقام تلقائياً"
   ═══════════════════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const customersPanel = document.querySelector('#customers .panel');
    if (!customersPanel) return;
    if (document.getElementById('btnFixPhones')) return;
    
    const btn = document.createElement('button');
    btn.id = 'btnFixPhones';
    btn.className = 'btn small';
    btn.style.cssText = 'background:#dc2626;color:#fff;margin-top:10px';
    btn.innerHTML = '📞 تصحيح جميع الأرقام';
    btn.onclick = fixAllPhones;
    customersPanel.appendChild(btn);
  }, 2500);
});

async function fixAllPhones() {
  if (!confirm('📞 سيتم تصحيح أرقام جميع العملاء (إضافة 967 إن نقصت).\n\nهل أنت متأكد؟')) return;
  
  try {
    let count = 0;
    let errors = 0;
    
    for (const c of customers) {
      if (!c.phone) continue;
      
      const oldPhone = c.phone;
      const newPhone = normalizePhone(oldPhone);
      
      if (newPhone && newPhone !== oldPhone) {
        const { error } = await client
          .from('customers')
          .update({ phone: newPhone })
          .eq('id', c.id);
        
        if (error) {
          errors++;
          console.warn('فشل تعديل:', c.name, error);
        } else {
          count++;
          c.phone = newPhone;
        }
      }
    }
    
    if (typeof renderCustomers === 'function') renderCustomers();
    
    toast(`✅ تم تصحيح ${count} رقم${errors ? ` (${errors} فشل)` : ''}`);
  } catch (e) {
    console.error(e);
    toast('❌ تعذر التصحيح');
  }
}

console.log('📞 fix-phones.js محمّل');