/* ============================================================
   📋 سجل السندات — ملف مستقل
   لا يعتمد على أي ملف آخر
   ============================================================ */

let receiptsLogData = [];
let currentReceipt = null;

// نحاول إضافة الزر كل 500ms حتى ينجح
let attempts = 0;
const maxAttempts = 30; // 15 ثانية

function tryInject() {
  attempts++;
  
  // نبحث عن قسم السندات
  const receiptsSection = document.getElementById('receipts');
  if (!receiptsSection) {
    if (attempts < maxAttempts) setTimeout(tryInject, 500);
    return;
  }
  
  // نضيف الزر إذا لم يكن موجوداً
  if (!document.getElementById('btnReceiptsLogFinal')) {
    const titleBar = receiptsSection.querySelector('.page-title');
    if (titleBar) {
      const btn = document.createElement('button');
      btn.id = 'btnReceiptsLogFinal';
      btn.className = 'btn';
      btn.style.cssText = 'background:#0891b2;color:#fff;font-weight:800';
      btn.innerHTML = '📋 سجل السندات';
      btn.onclick = openReceiptsLogFinal;
      titleBar.appendChild(btn);
      console.log('✅ تم إضافة زر سجل السندات');
    } else if (attempts < maxAttempts) {
      setTimeout(tryInject, 500);
      return;
    }
  }
  
  // نضيف النوافذ
  createReceiptsModal();
  createReceiptDetailsModal();
}

// نبدأ المحاولات
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', tryInject);
} else {
  tryInject();
}

/* ═══ نافذة سجل السندات ═══ */
function createReceiptsModal() {
  if (document.getElementById('receiptsLogModalFinal')) return;
  
  const m = document.createElement('div');
  m.id = 'receiptsLogModalFinal';
  m.className = 'modal';
  m.style.cssText = 'position:fixed;inset:0;background:#0f172a99;display:none;align-items:center;justify-content:center;padding:15px;z-index:100';
  m.innerHTML = `
    <div class="modalbox" style="background:#fff;width:min(900px,100%);max-height:92vh;overflow:auto;border-radius:20px;padding:20px">
      <h3 style="margin-top:0">📋 سجل السندات</h3>
      <div class="toolbar" style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap">
        <input id="rcptSearchFinal" placeholder="🔍 بحث بالاسم..." oninput="window.renderReceiptsLogFinal()" 
          style="flex:1;min-width:150px;padding:10px;border:1px solid #d7dee8;border-radius:10px">
        <select id="rcptFilterFinal" onchange="window.renderReceiptsLogFinal()" 
          style="max-width:150px;padding:10px;border:1px solid #d7dee8;border-radius:10px">
          <option value="all">الكل</option>
          <option value="receive">📥 قبض</option>
          <option value="pay">📤 دفع</option>
        </select>
        <button class="btn small" onclick="window.loadReceiptsLogFinal()">🔄</button>
      </div>
      <div style="overflow:auto;border:1px solid #e5eaf0;border-radius:12px;max-height:500px">
        <table style="width:100%;border-collapse:collapse;min-width:700px">
          <thead>
            <tr style="background:#f8fafc">
              <th style="padding:11px;text-align:right;font-size:13px">التاريخ</th>
              <th style="padding:11px;text-align:right;font-size:13px">النوع</th>
              <th style="padding:11px;text-align:right;font-size:13px">الطرف</th>
              <th style="padding:11px;text-align:right;font-size:13px">المبلغ</th>
              <th style="padding:11px;text-align:right;font-size:13px">البيان</th>
              <th style="padding:11px;text-align:right;font-size:13px">إجراءات</th>
            </tr>
          </thead>
          <tbody id="rcptBodyFinal">
            <tr><td colspan="6" style="text-align:center;padding:20px;color:#718096">جارٍ التحميل...</td></tr>
          </tbody>
        </table>
      </div>
      <div style="display:flex;gap:8px;margin-top:15px;flex-wrap:wrap">
        <button class="btn gray" onclick="window.closeReceiptsLogFinal()">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  
  m.addEventListener('click', e => {
    if (e.target === m) window.closeReceiptsLogFinal();
  });
}

/* ═══ نافذة تفاصيل السند ═══ */
function createReceiptDetailsModal() {
  if (document.getElementById('receiptDetailsModalFinal')) return;
  
  const m = document.createElement('div');
  m.id = 'receiptDetailsModalFinal';
  m.className = 'modal';
  m.style.cssText = 'position:fixed;inset:0;background:#0f172a99;display:none;align-items:center;justify-content:center;padding:15px;z-index:110';
  m.innerHTML = `
    <div class="modalbox" style="background:#fff;width:min(600px,100%);max-height:92vh;overflow:auto;border-radius:20px;padding:20px">
      <h3 style="margin-top:0">🧾 تفاصيل السند</h3>
      <div id="rcptDetailsSummaryFinal" style="color:#718096"></div>
      <div style="margin-top:12px;background:#fef3c7;padding:10px;border-radius:10px;border:1px solid #f59e0b">
        <label style="color:#92400e;font-weight:700">💰 تعديل المبلغ</label>
        <div style="display:flex;gap:6px;margin-top:4px">
          <input id="rcptEditAmountFinal" type="number" min="0" step="0.01" 
            style="flex:1;background:#fff;padding:10px;border:1px solid #f59e0b;border-radius:10px">
          <button class="btn green" onclick="window.saveEditedReceiptFinal()">💾 حفظ</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:15px;flex-wrap:wrap">
        <button class="btn wa" id="rcptWAbtnFinal">💬 واتساب</button>
        <button class="btn red" id="rcptDeleteBtnFinal">🗑️ حذف</button>
        <button class="btn gray" onclick="window.closeReceiptDetailsFinal()">إغلاق</button>
      </div>
    </div>
  `;
  document.body.appendChild(m);
  
  m.addEventListener('click', e => {
    if (e.target === m) window.closeReceiptDetailsFinal();
  });
}

/* ═══ فتح السجل ═══ */
window.openReceiptsLogFinal = function() {
  const m = document.getElementById('receiptsLogModalFinal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('show');
  }
  window.loadReceiptsLogFinal();
};

window.closeReceiptsLogFinal = function() {
  const m = document.getElementById('receiptsLogModalFinal');
  if (m) {
    m.style.display = 'none';
    m.classList.remove('show');
  }
};

/* ═══ تحميل السندات ═══ */
window.loadReceiptsLogFinal = async function() {
  const body = document.getElementById('rcptBodyFinal');
  if (!body) return;
  
  try {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#718096">جارٍ التحميل...</td></tr>';
    
    const { data, error } = await client
      .from('receipts')
      .select('*, customers(name), suppliers(name)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (error) throw error;
    receiptsLogData = data || [];
    window.renderReceiptsLogFinal();
  } catch (e) {
    console.error('receipts load:', e);
    body.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:#dc2626">
      خطأ في التحميل: ${e.message || 'غير معروف'}
    </td></tr>`;
  }
};

/* ═══ عرض السندات ═══ */
window.renderReceiptsLogFinal = function() {
  const body = document.getElementById('rcptBodyFinal');
  if (!body) return;
  
  const q = (document.getElementById('rcptSearchFinal')?.value || '').trim().toLowerCase();
  const filter = document.getElementById('rcptFilterFinal')?.value || 'all';
  
  const list = receiptsLogData.filter(r => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (q) {
      const name = (r.customers?.name || r.suppliers?.name || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });
  
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:#718096">لا توجد سندات</td></tr>';
    return;
  }
  
  body.innerHTML = list.map(r => {
    const party = r.type === 'receive' 
      ? (r.customers?.name || '—') 
      : (r.suppliers?.name || '—');
    const isReceive = r.type === 'receive';
    const typeLabel = isReceive ? '📥 قبض' : '📤 دفع';
    const typeColor = isReceive ? '#16a34a' : '#dc2626';
    const date = r.operation_date || (r.created_at ? r.created_at.slice(0, 10) : '—');
    const currency = window.getCurrencySymbol ? window.getCurrencySymbol(r.currency || 'YER') : 'ر.ي';
    
    return `<tr>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0;font-size:13px">${date}</td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0">
        <span style="background:${typeColor}15;color:${typeColor};padding:3px 8px;border-radius:20px;font-size:11px;font-weight:800">${typeLabel}</span>
      </td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0;font-size:13px"><b>${esc(party)}</b></td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0;font-weight:700;color:${typeColor}">${money(r.amount)} ${currency}</td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0;font-size:12px">${esc(r.note || '—')}</td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0">
        <button class="btn small" onclick="window.viewReceiptFinal('${r.id}')">👁️</button>
        <button class="btn small red" onclick="window.deleteReceiptFinal('${r.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
};

/* ═══ عرض تفاصيل السند ═══ */
window.viewReceiptFinal = function(receiptId) {
  const r = receiptsLogData.find(x => x.id === receiptId);
  if (!r) return;
  currentReceipt = r;
  
  const party = r.type === 'receive' 
    ? (r.customers?.name || '—') 
    : (r.suppliers?.name || '—');
  const typeLabel = r.type === 'receive' ? '📥 قبض من عميل' : '📤 دفع لمورد';
  const date = r.operation_date || (r.created_at ? r.created_at.slice(0, 10) : '—');
  const currency = window.getCurrencySymbol ? window.getCurrencySymbol(r.currency || 'YER') : 'ر.ي';
  
  document.getElementById('rcptDetailsSummaryFinal').innerHTML = `
    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
      <span>${typeLabel}</span>
      <span>👤 <b>${esc(party)}</b></span>
      <span>📅 ${date}</span>
      <span>💰 المبلغ: <b>${money(r.amount)} ${currency}</b></span>
      ${r.note ? `<span>📝 ${esc(r.note)}</span>` : ''}
    </div>
  `;
  
  document.getElementById('rcptEditAmountFinal').value = Number(r.amount || 0);
  document.getElementById('rcptDeleteBtnFinal').onclick = () => window.deleteReceiptFinal(receiptId);
  document.getElementById('rcptWAbtnFinal').onclick = () => window.resendReceiptWAFinal(receiptId);
  
  const m = document.getElementById('receiptDetailsModalFinal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('show');
  }
};

window.closeReceiptDetailsFinal = function() {
  const m = document.getElementById('receiptDetailsModalFinal');
  if (m) {
    m.style.display = 'none';
    m.classList.remove('show');
  }
};

/* ═══ حفظ التعديل ═══ */
window.saveEditedReceiptFinal = async function() {
  try {
    const r = currentReceipt;
    if (!r) return toast('السند غير موجود');
    
    const newAmount = Number(document.getElementById('rcptEditAmountFinal').value) || 0;
    if (newAmount <= 0) return toast('أدخل مبلغاً صحيحاً');
    
    const oldAmount = Number(r.amount || 0);
    const diff = newAmount - oldAmount;
    if (diff === 0) return toast('لم يتغير شيء');
    
    // تحديث جدول receipts
    const { error: e1 } = await client.from('receipts').update({ amount: newAmount }).eq('id', r.id);
    if (e1) throw e1;
    
    // تعديل رصيد الطرف
    if (r.type === 'receive' && r.customer_id) {
      const { data: c } = await client.from('customers').select('balance').eq('id', r.customer_id).single();
      if (c) {
        const newBalance = Number(c.balance || 0) - diff;
        await client.from('customers').update({ balance: newBalance }).eq('id', r.customer_id);
      }
    } else if (r.type === 'pay' && r.supplier_id) {
      const { data: s } = await client.from('suppliers').select('balance').eq('id', r.supplier_id).single();
      if (s) {
        const newBalance = Number(s.balance || 0) - diff;
        await client.from('suppliers').update({ balance: newBalance }).eq('id', r.supplier_id);
      }
    }
    
    toast('✅ تم تعديل المبلغ');
    window.closeReceiptDetailsFinal();
    await window.loadReceiptsLogFinal();
    
    if (typeof loadCustomers === 'function') await loadCustomers();
    if (typeof loadSuppliers === 'function') await loadSuppliers();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) {
    console.error(e);
    toast('تعذر التعديل: ' + (e.message || ''));
  }
};

/* ═══ حذف السند ═══ */
window.deleteReceiptFinal = async function(receiptId) {
  if (!confirm('⚠️ حذف السند نهائياً؟\n\nسيتم إرجاع المبلغ للطرف. لا يمكن التراجع!')) return;
  
  try {
    const r = receiptsLogData.find(x => x.id === receiptId);
    if (!r) return;
    
    const amount = Number(r.amount || 0);
    
    // عكس التأثير على الرصيد
    if (r.type === 'receive' && r.customer_id) {
      const { data: c } = await client.from('customers').select('balance').eq('id', r.customer_id).single();
      if (c) {
        await client.from('customers').update({ balance: Number(c.balance || 0) + amount }).eq('id', r.customer_id);
      }
    } else if (r.type === 'pay' && r.supplier_id) {
      const { data: s } = await client.from('suppliers').select('balance').eq('id', r.supplier_id).single();
      if (s) {
        await client.from('suppliers').update({ balance: Number(s.balance || 0) + amount }).eq('id', r.supplier_id);
      }
    }
    
    // حذف من customer_transactions (إن وُجد)
    if (r.type === 'receive' && r.customer_id && r.note) {
      try {
        await client.from('customer_transactions')
          .delete()
          .eq('customer_id', r.customer_id)
          .eq('type', 'receipt')
          .eq('amount', -amount)
          .eq('details', 'سند قبض ' + r.note);
      } catch(e) { console.warn('tx delete:', e); }
    }
    
    const { error } = await client.from('receipts').delete().eq('id', receiptId);
    if (error) throw error;
    
    toast('✅ تم حذف السند');
    window.closeReceiptDetailsFinal();
    await window.loadReceiptsLogFinal();
    
    if (typeof loadCustomers === 'function') await loadCustomers();
    if (typeof loadSuppliers === 'function') await loadSuppliers();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) {
    console.error(e);
    toast('تعذر الحذف: ' + (e.message || ''));
  }
};

/* ═══ إعادة إرسال واتساب ═══ */
window.resendReceiptWAFinal = function(receiptId) {
  const r = receiptsLogData.find(x => x.id === receiptId);
  if (!r) return;
  
  if (r.type !== 'receive') return toast('إشعار الموردين غير مدعوم');
  
  const c = customers.find(x => x.id === r.customer_id);
  if (!c || !c.phone) return toast('لا يوجد رقم هاتف للعميل');
  
  const date = r.operation_date || (r.created_at ? r.created_at.slice(0, 10) : '');
  const msg = `💵 *سند قبض — ${SHOP_SETTINGS.shop_name}*\n━━━━━━━━━━━━━━━\n👤 ${c.name}\n📅 ${date}\n💸 المستلم: *${money(r.amount)} ${CUR()}*\n${r.note ? '📝 ' + r.note + '\n' : ''}━━━━━━━━━━━━━━━\n📌 المتبقي: *${money(c.balance)} ${CUR()}*\n━━━━━━━━━━━━━━━\n${SHOP_SETTINGS.shop_name}`;
  
  previewWhatsApp(c.phone, msg, { customer_id: r.customer_id, ref_type: 'receipt', ref_id: r.id });
};

console.log('📋 receipts-log.js (المستقل) محمّل');