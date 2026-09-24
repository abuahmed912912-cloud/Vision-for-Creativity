/* ============================================================
   🔧 التعديلات المتقدمة
   سجل المشتريات + تعديل الأرصدة السابقة
   ============================================================ */

/* ═══════════════════════════════════════════════════════════
   💰 تعديل رصيد العميل السابق
   ═══════════════════════════════════════════════════════════ */
function addCustomerBalanceEditBtn() {
  const info = document.getElementById('customerBalanceInfo');
  if (!info || document.getElementById('editCustomerBalBtn')) return;
  if (info.style.display === 'none') return;
  
  const btn = document.createElement('button');
  btn.id = 'editCustomerBalBtn';
  btn.className = 'btn small';
  btn.style.cssText = 'margin-top:6px;background:#0284c7;color:#fff;font-size:11px';
  btn.innerHTML = '✏️ تعديل الرصيد السابق';
  btn.onclick = window.openEditCustomerBalance;
  info.appendChild(btn);
}

window.openEditCustomerBalance = function() {
  const sel = document.getElementById('saleCustomer');
  if (!sel || !sel.value) return toast('اختر عميلاً');
  const c = customers.find(x => x.id === sel.value);
  if (!c) return;
  
  const newBal = prompt(
    `💰 تعديل الرصيد السابق للعميل: ${c.name}\n\n` +
    `الرصيد الحالي: ${money(c.balance)} ${CUR()}\n\n` +
    `أدخل الرصيد الجديد (0 إذا لا يوجد دين):`,
    Number(c.balance || 0)
  );
  
  if (newBal === null) return;
  const nb = Number(newBal);
  if (isNaN(nb) || nb < 0) return toast('أدخل رقماً صحيحاً');
  
  window.saveEditedCustomerBalance(c.id, nb);
};

window.saveEditedCustomerBalance = async function(customerId, newBalance) {
  try {
    const c = customers.find(x => x.id === customerId);
    if (!c) return;
    const oldBalance = Number(c.balance || 0);
    const diff = newBalance - oldBalance;
    
    if (diff === 0) return toast('لم يتغير شيء');
    
    // تحديث الرصيد
    await client.from('customers').update({ balance: newBalance }).eq('id', customerId);
    
    // تسجيل الحركة
    if (diff !== 0) {
      await client.from('customer_transactions').insert({
        customer_id: customerId,
        details: 'تعديل الرصيد السابق',
        amount: diff,
        type: 'adjustment',
        operation_date: new Date().toISOString().slice(0, 10)
      });
    }
    
    toast('✅ تم تحديث الرصيد');
    
    // تحديث محلياً
    c.balance = newBalance;
    if (typeof renderCustomers === 'function') renderCustomers();
    if (typeof updateCustomerBalance === 'function') updateCustomerBalance();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) {
    console.error(e);
    toast('تعذر التعديل');
  }
};

/* ═══════════════════════════════════════════════════════════
   💰 تعديل رصيد المورد السابق
   ═══════════════════════════════════════════════════════════ */
function addSupplierBalanceEditBtn() {
  const info = document.getElementById('supplierBalanceInfo');
  if (!info || document.getElementById('editSupplierBalBtn')) return;
  if (info.style.display === 'none') return;
  
  const btn = document.createElement('button');
  btn.id = 'editSupplierBalBtn';
  btn.className = 'btn small';
  btn.style.cssText = 'margin-top:6px;background:#0284c7;color:#fff;font-size:11px';
  btn.innerHTML = '✏️ تعديل الرصيد السابق';
  btn.onclick = window.openEditSupplierBalance;
  info.appendChild(btn);
}

window.openEditSupplierBalance = function() {
  const sel = document.getElementById('purchaseSupplier');
  if (!sel || !sel.value) return toast('اختر مورداً');
  const s = suppliers.find(x => x.id === sel.value);
  if (!s) return;
  
  const newBal = prompt(
    `💰 تعديل الرصيد السابق للمورد: ${s.name}\n\n` +
    `الرصيد الحالي: ${money(s.balance)} ${CUR()}\n\n` +
    `أدخل الرصيد الجديد (0 إذا لا يوجد دين):`,
    Number(s.balance || 0)
  );
  
  if (newBal === null) return;
  const nb = Number(newBal);
  if (isNaN(nb) || nb < 0) return toast('أدخل رقماً صحيحاً');
  
  window.saveEditedSupplierBalance(s.id, nb);
};

window.saveEditedSupplierBalance = async function(supplierId, newBalance) {
  try {
    const s = suppliers.find(x => x.id === supplierId);
    if (!s) return;
    const oldBalance = Number(s.balance || 0);
    const diff = newBalance - oldBalance;
    
    if (diff === 0) return toast('لم يتغير شيء');
    
    await client.from('suppliers').update({ balance: newBalance }).eq('id', supplierId);
    
    toast('✅ تم تحديث رصيد المورد');
    
    s.balance = newBalance;
    if (typeof renderSuppliers === 'function') renderSuppliers();
    if (typeof updateSupplierBalance === 'function') updateSupplierBalance();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) {
    console.error(e);
    toast('تعذر التعديل');
  }
};

/* ═══════════════════════════════════════════════════════════
   📋 سجل المشتريات (تعديل/حذف)
   ═══════════════════════════════════════════════════════════ */
let purchasesLogData = [];
let currentPurchase = null;

function addPurchasesLogButton() {
  const purchasesSection = document.getElementById('purchases');
  if (!purchasesSection || document.getElementById('btnPurchasesLog')) return;
  
  const titleBar = purchasesSection.querySelector('.page-title');
  if (!titleBar) return;
  
  const btn = document.createElement('button');
  btn.id = 'btnPurchasesLog';
  btn.className = 'btn';
  btn.style.cssText = 'background:#7c3aed;color:#fff';
  btn.innerHTML = '📋 سجل المشتريات';
  btn.onclick = window.openPurchasesLog;
  titleBar.appendChild(btn);
}

window.openPurchasesLog = function() {
  const m = document.getElementById('purchasesLogModal');
  if (m) {
    m.style.display = 'flex';
    m.classList.add('show');
  }
  window.loadPurchasesLog();
};

window.loadPurchasesLog = async function() {
  const body = document.getElementById('purchasesLogBody');
  if (!body) return;
  
  body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#718096">جارٍ التحميل...</td></tr>';
  
  try {
    const { data, error } = await client
      .from('purchases')
      .select('*, suppliers(name)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(200);
    
    if (error) throw error;
    purchasesLogData = data || [];
    window.renderPurchasesLog();
  } catch (e) {
    console.error('purchases load:', e);
    body.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:20px;color:#dc2626">
      خطأ: ${e.message || 'غير معروف'}
    </td></tr>`;
  }
};

window.renderPurchasesLog = function() {
  const body = document.getElementById('purchasesLogBody');
  if (!body) return;
  
  const q = (document.getElementById('purchasesLogSearch')?.value || '').trim().toLowerCase();
  const filter = document.getElementById('purchasesLogFilter')?.value || 'all';
  
  const list = purchasesLogData.filter(p => {
    if (filter !== 'all' && p.payment_type !== filter) return false;
    if (q && !(p.suppliers?.name || '').toLowerCase().includes(q)) return false;
    return true;
  });
  
  if (!list.length) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#718096">لا توجد فواتير</td></tr>';
    return;
  }
  
  const typeLabels = { cash: '💵 نقدي', credit: '📝 آجل', partial: '📊 جزئي' };
  
  body.innerHTML = list.map(p => {
    const total = Number(p.total || 0);
    const paid = Number(p.paid || 0);
    const rem = Math.max(total - paid, 0);
    const date = p.operation_date || (p.created_at ? p.created_at.slice(0, 10) : '—');
    
    return `<tr>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0;font-size:13px">${date}</td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0"><b>${esc(p.suppliers?.name || '—')}</b></td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0;font-weight:700">${money(total)}</td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0;color:#16a34a">${money(paid)}</td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0;color:${rem > 0 ? '#dc2626' : '#16a34a'};font-weight:700">${money(rem)}</td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0">
        <span style="background:#eaf3fb;color:#0f4c81;padding:3px 8px;border-radius:20px;font-size:11px;font-weight:800">${typeLabels[p.payment_type] || p.payment_type || '—'}</span>
      </td>
      <td style="padding:11px;border-bottom:1px solid #e5eaf0">
        <button class="btn small" onclick="window.viewPurchaseDetails('${p.id}')">👁️</button>
        <button class="btn small red" onclick="window.deletePurchase('${p.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
};

window.viewPurchaseDetails = async function(purchaseId) {
  try {
    const p = purchasesLogData.find(x => x.id === purchaseId);
    if (!p) return;
    currentPurchase = p;
    
    const total = Number(p.total || 0);
    const paid = Number(p.paid || 0);
    const rem = total - paid;
    const date = p.operation_date || (p.created_at ? p.created_at.slice(0, 10) : '—');
    
    document.getElementById('purchaseDetailsSummary').innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
        <span>🏢 <b>${esc(p.suppliers?.name || '—')}</b></span>
        <span>📅 ${date}</span>
        <span>💰 الإجمالي: <b>${money(total)}</b></span>
        <span>✅ المدفوع: <b style="color:#16a34a">${money(paid)}</b></span>
        <span>📌 المتبقي: <b style="color:#dc2626">${money(rem)}</b></span>
      </div>`;
    
    document.getElementById('purchaseEditPaid').value = paid;
    
    const { data: items } = await client
      .from('purchase_items')
      .select('*')
      .eq('purchase_id', purchaseId);
    
    document.getElementById('purchaseDetailsBody').innerHTML = (items || []).map(it => `
      <tr>
        <td style="padding:11px;border-bottom:1px solid #e5eaf0;font-size:13px"><b>${esc(it.product_name || '—')}</b></td>
        <td style="padding:11px;border-bottom:1px solid #e5eaf0">${money(it.quantity || it.base_quantity)}</td>
        <td style="padding:11px;border-bottom:1px solid #e5eaf0">${money(it.unit_price)}</td>
        <td style="padding:11px;border-bottom:1px solid #e5eaf0;font-weight:700">${money(it.total)}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#718096">لا توجد أصناف</td></tr>';
    
    document.getElementById('purchaseDetailsDelete').onclick = () => window.deletePurchase(purchaseId);
    
    const m = document.getElementById('purchaseDetailsModal');
    if (m) {
      m.style.display = 'flex';
      m.classList.add('show');
    }
  } catch (e) {
    console.error(e);
    toast('خطأ في العرض');
  }
};

window.savePurchaseEditedPaid = async function() {
  try {
    const p = currentPurchase;
    if (!p) return;
    
    const newPaid = Number(document.getElementById('purchaseEditPaid').value) || 0;
    const total = Number(p.total || 0);
    if (newPaid < 0) return toast('المبلغ لا يمكن أن يكون سالباً');
    if (newPaid > total) return toast('المدفوع أكبر من الإجمالي');
    
    const oldPaid = Number(p.paid || 0);
    const diff = newPaid - oldPaid;
    if (diff === 0) return toast('لم يتغير شيء');
    
    await client.from('purchases').update({ paid: newPaid }).eq('id', p.id);
    
    // إذا كان المورد، نخصم الفرق من رصيده
    if (p.supplier_id) {
      const s = suppliers.find(x => x.id === p.supplier_id);
      if (s) {
        const newBalance = Number(s.balance || 0) - diff;
        await client.from('suppliers').update({ balance: newBalance }).eq('id', p.supplier_id);
      }
    }
    
    toast('✅ تم تعديل المبلغ');
    window.closePurchaseDetails();
    await window.loadPurchasesLog();
    
    if (typeof loadSuppliers === 'function') await loadSuppliers();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) {
    console.error(e);
    toast('تعذر التعديل');
  }
};

window.deletePurchase = async function(purchaseId) {
  if (!confirm('⚠️ حذف فاتورة المشتريات نهائياً؟\n\nسيتم خصم الأصناف من المخزون وإرجاع المديونية. لا يمكن التراجع!')) return;
  
  try {
    const p = purchasesLogData.find(x => x.id === purchaseId);
    if (!p) return;
    
    const { data: items } = await client.from('purchase_items').select('*').eq('purchase_id', purchaseId);
    
    // خصم الأصناف من المخزون
    for (const it of (items || [])) {
      if (it.product_id) {
        const { data: prod } = await client.from('products').select('quantity').eq('id', it.product_id).single();
        if (prod) {
          const newQty = Number(prod.quantity || 0) - Number(it.base_quantity || 0);
          await client.from('products').update({ quantity: Math.max(newQty, 0) }).eq('id', it.product_id);
        }
      }
    }
    
    // إرجاع المديونية
    if (p.supplier_id && p.payment_type !== 'cash') {
      const rem = Number(p.total || 0) - Number(p.paid || 0);
      if (rem > 0) {
        const { data: s } = await client.from('suppliers').select('balance').eq('id', p.supplier_id).single();
        if (s) {
          await client.from('suppliers').update({ balance: Number(s.balance || 0) - rem }).eq('id', p.supplier_id);
        }
      }
    }
    
    await client.from('purchase_items').delete().eq('purchase_id', purchaseId);
    const { error } = await client.from('purchases').delete().eq('id', purchaseId);
    if (error) throw error;
    
    toast('✅ تم حذف الفاتورة');
    window.closePurchaseDetails();
    await window.loadPurchasesLog();
    
    if (typeof loadProducts === 'function') await loadProducts();
    if (typeof loadSuppliers === 'function') await loadSuppliers();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) {
    console.error(e);
    toast('تعذر الحذف');
  }
};

window.closePurchaseDetails = function() {
  const m = document.getElementById('purchaseDetailsModal');
  if (m) {
    m.style.display = 'none';
    m.classList.remove('show');
  }
};

/* ═══════════════════════════════════════════════════════════
   إنشاء النوافذ
   ═══════════════════════════════════════════════════════════ */
function createPurchasesModals() {
  // سجل المشتريات
  if (!document.getElementById('purchasesLogModal')) {
    const m = document.createElement('div');
    m.id = 'purchasesLogModal';
    m.className = 'modal';
    m.style.cssText = 'position:fixed;inset:0;background:#0f172a99;display:none;align-items:center;justify-content:center;padding:15px;z-index:100';
    m.innerHTML = `
      <div style="background:#fff;width:min(900px,100%);max-height:92vh;overflow:auto;border-radius:20px;padding:20px">
        <h3 style="margin-top:0">📋 سجل المشتريات</h3>
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <input id="purchasesLogSearch" placeholder="🔍 بحث بالمورد..." oninput="window.renderPurchasesLog()" 
            style="flex:1;min-width:150px;padding:10px;border:1px solid #d7dee8;border-radius:10px">
          <select id="purchasesLogFilter" onchange="window.renderPurchasesLog()" 
            style="max-width:150px;padding:10px;border:1px solid #d7dee8;border-radius:10px">
            <option value="all">الكل</option>
            <option value="cash">نقدي</option>
            <option value="credit">آجل</option>
            <option value="partial">جزئي</option>
          </select>
          <button class="btn small" onclick="window.loadPurchasesLog()">🔄</button>
        </div>
        <div style="overflow:auto;border:1px solid #e5eaf0;border-radius:12px;max-height:500px">
          <table style="width:100%;border-collapse:collapse;min-width:700px">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:11px;text-align:right;font-size:13px">التاريخ</th>
                <th style="padding:11px;text-align:right;font-size:13px">المورد</th>
                <th style="padding:11px;text-align:right;font-size:13px">الإجمالي</th>
                <th style="padding:11px;text-align:right;font-size:13px">المدفوع</th>
                <th style="padding:11px;text-align:right;font-size:13px">المتبقي</th>
                <th style="padding:11px;text-align:right;font-size:13px">النوع</th>
                <th style="padding:11px;text-align:right;font-size:13px">إجراءات</th>
              </tr>
            </thead>
            <tbody id="purchasesLogBody">
              <tr><td colspan="7" style="text-align:center;padding:20px;color:#718096">جارٍ التحميل...</td></tr>
            </tbody>
          </table>
        </div>
        <div style="display:flex;gap:8px;margin-top:15px;flex-wrap:wrap">
          <button class="btn gray" onclick="document.getElementById('purchasesLogModal').style.display='none'">إغلاق</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      if (e.target === m) m.style.display = 'none';
    });
  }
  
  // تفاصيل فاتورة مشتريات
  if (!document.getElementById('purchaseDetailsModal')) {
    const m = document.createElement('div');
    m.id = 'purchaseDetailsModal';
    m.className = 'modal';
    m.style.cssText = 'position:fixed;inset:0;background:#0f172a99;display:none;align-items:center;justify-content:center;padding:15px;z-index:110';
    m.innerHTML = `
      <div style="background:#fff;width:min(700px,100%);max-height:92vh;overflow:auto;border-radius:20px;padding:20px">
        <h3 style="margin-top:0">🧾 تفاصيل فاتورة المشتريات</h3>
        <div id="purchaseDetailsSummary" style="color:#718096"></div>
        <div style="overflow:auto;border:1px solid #e5eaf0;border-radius:12px;margin-top:12px">
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f8fafc">
                <th style="padding:11px;text-align:right;font-size:13px">الصنف</th>
                <th style="padding:11px;text-align:right;font-size:13px">الكمية</th>
                <th style="padding:11px;text-align:right;font-size:13px">السعر</th>
                <th style="padding:11px;text-align:right;font-size:13px">الإجمالي</th>
              </tr>
            </thead>
            <tbody id="purchaseDetailsBody"></tbody>
          </table>
        </div>
        <div style="margin-top:12px;background:#fef3c7;padding:10px;border-radius:10px;border:1px solid #f59e0b">
          <label style="color:#92400e;font-weight:700">💰 تعديل المبلغ المدفوع</label>
          <div style="display:flex;gap:6px;margin-top:4px">
            <input id="purchaseEditPaid" type="number" min="0" step="0.01" 
              style="flex:1;background:#fff;padding:10px;border:1px solid #f59e0b;border-radius:10px">
            <button class="btn green" onclick="window.savePurchaseEditedPaid()">💾 حفظ</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:15px;flex-wrap:wrap">
          <button class="btn red" id="purchaseDetailsDelete">🗑️ حذف</button>
          <button class="btn gray" onclick="window.closePurchaseDetails()">إغلاق</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);
    m.addEventListener('click', e => {
      if (e.target === m) window.closePurchaseDetails();
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   تهيئة أولية
   ═══════════════════════════════════════════════════════════ */
let initCount = 0;
function initAdvanced() {
  initCount++;
  if (initCount > 30) return;
  
  addPurchasesLogButton();
  addCustomerBalanceEditBtn();
  addSupplierBalanceEditBtn();
  createPurchasesModals();
  
  setTimeout(initAdvanced, 500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdvanced);
} else {
  initAdvanced();
}

console.log('🔧 advanced-edit.js محمّل');