/* ============================================================
   📋 سجل الفواتير + سجل السندات
   ============================================================ */

let salesLog = [];
let receiptsLog = [];
let currentSaleDetails = null;
let currentReceiptDetails = null;

/* ============ تحميل الواجهات ============ */
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectUI, 1500);
  setTimeout(patchSaveReceipt, 2000);
});

function injectUI() {
  // زر سجل الفواتير
  const salesSection = document.getElementById('sales');
  if (salesSection && !document.getElementById('btnSalesLog')) {
    const titleBar = salesSection.querySelector('.page-title');
    if (titleBar) {
      const btn = document.createElement('button');
      btn.id = 'btnSalesLog';
      btn.className = 'btn';
      btn.style.cssText = 'background:#7c3aed;color:#fff';
      btn.innerHTML = '📋 سجل الفواتير';
      btn.onclick = openSalesLog;
      titleBar.appendChild(btn);
    }
  }
  
  // زر سجل السندات
  const receiptsSection = document.getElementById('receipts');
  if (receiptsSection && !document.getElementById('btnReceiptsLog')) {
    const titleBar = receiptsSection.querySelector('.page-title');
    if (titleBar) {
      const btn = document.createElement('button');
      btn.id = 'btnReceiptsLog';
      btn.className = 'btn';
      btn.style.cssText = 'background:#0891b2;color:#fff';
      btn.innerHTML = '📋 سجل السندات';
      btn.onclick = openReceiptsLog;
      titleBar.appendChild(btn);
    }
  }

  // نافذة سجل الفواتير
  if (!document.getElementById('salesLogModal')) {
    const m = document.createElement('div');
    m.id = 'salesLogModal';
    m.className = 'modal';
    m.innerHTML = `
      <div class="modalbox" style="width:min(900px,100%)">
        <h3 style="margin-top:0">📋 سجل الفواتير</h3>
        <div class="toolbar" style="margin-bottom:12px">
          <input id="salesLogSearch" class="search" placeholder="بحث باسم العميل..." oninput="renderSalesLog()" style="flex:1">
          <select id="salesLogFilter" onchange="renderSalesLog()" style="max-width:150px">
            <option value="all">الكل</option>
            <option value="cash">نقدي</option>
            <option value="credit">آجل</option>
            <option value="partial">جزئي</option>
          </select>
          <button class="btn small" onclick="loadSalesLog()">🔄</button>
        </div>
        <div class="tablewrap" style="max-height:500px">
          <table>
            <thead><tr>
              <th>التاريخ</th><th>العميل</th><th>الإجمالي</th><th>المدفوع</th><th>المتبقي</th><th>النوع</th><th>إجراءات</th>
            </tr></thead>
            <tbody id="salesLogBody"><tr><td colspan="7" class="muted">جارٍ التحميل...</td></tr></tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button class="btn gray" onclick="closeModal('salesLogModal')">إغلاق</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
  }

  // نافذة تفاصيل الفاتورة
  if (!document.getElementById('saleDetailsModal')) {
    const m = document.createElement('div');
    m.id = 'saleDetailsModal';
    m.className = 'modal';
    m.innerHTML = `
      <div class="modalbox" style="width:min(700px,100%)">
        <h3 style="margin-top:0">🧾 تفاصيل الفاتورة</h3>
        <div id="saleDetailsSummary" class="muted"></div>
        <div class="tablewrap" style="margin-top:12px">
          <table>
            <thead><tr><th>الصنف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
            <tbody id="saleDetailsBody"></tbody>
          </table>
        </div>
        <div style="margin-top:12px;background:#fef3c7;padding:10px;border-radius:10px;border:1px solid #f59e0b">
          <label style="color:#92400e">💰 تعديل المبلغ المدفوع</label>
          <div style="display:flex;gap:6px;margin-top:4px">
            <input id="saleEditPaid" type="number" min="0" step="0.01" style="background:#fff">
            <button class="btn green" onclick="saveEditedPaid()">💾 حفظ</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn wa" id="saleDetailsWA">💬 واتساب</button>
          <button class="btn red" id="saleDetailsDelete">🗑️ حذف</button>
          <button class="btn gray" onclick="closeModal('saleDetailsModal')">إغلاق</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
  }

  // نافذة سجل السندات
  if (!document.getElementById('receiptsLogModal')) {
    const m = document.createElement('div');
    m.id = 'receiptsLogModal';
    m.className = 'modal';
    m.innerHTML = `
      <div class="modalbox" style="width:min(900px,100%)">
        <h3 style="margin-top:0">📋 سجل السندات</h3>
        <div class="toolbar" style="margin-bottom:12px">
          <input id="receiptsLogSearch" class="search" placeholder="بحث..." oninput="renderReceiptsLog()" style="flex:1">
          <select id="receiptsLogFilter" onchange="renderReceiptsLog()" style="max-width:150px">
            <option value="all">الكل</option>
            <option value="receive">قبض</option>
            <option value="pay">دفع</option>
          </select>
          <button class="btn small" onclick="loadReceiptsLog()">🔄</button>
        </div>
        <div class="tablewrap" style="max-height:500px">
          <table>
            <thead><tr>
              <th>التاريخ</th><th>النوع</th><th>الطرف</th><th>المبلغ</th><th>البيان</th><th>إجراءات</th>
            </tr></thead>
            <tbody id="receiptsLogBody"><tr><td colspan="6" class="muted">جارٍ التحميل...</td></tr></tbody>
          </table>
        </div>
        <div class="modal-actions">
          <button class="btn gray" onclick="closeModal('receiptsLogModal')">إغلاق</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
  }

  // نافذة تفاصيل السند
  if (!document.getElementById('receiptDetailsModal')) {
    const m = document.createElement('div');
    m.id = 'receiptDetailsModal';
    m.className = 'modal';
    m.innerHTML = `
      <div class="modalbox" style="width:min(600px,100%)">
        <h3 style="margin-top:0">🧾 تفاصيل السند</h3>
        <div id="receiptDetailsSummary" class="muted"></div>
        <div style="margin-top:12px;background:#fef3c7;padding:10px;border-radius:10px;border:1px solid #f59e0b">
          <label style="color:#92400e">💰 تعديل المبلغ</label>
          <div style="display:flex;gap:6px;margin-top:4px">
            <input id="receiptEditAmount" type="number" min="0" step="0.01" style="background:#fff">
            <button class="btn green" onclick="saveEditedReceipt()">💾 حفظ</button>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn wa" id="receiptDetailsWA">💬 واتساب</button>
          <button class="btn red" id="receiptDetailsDelete">🗑️ حذف</button>
          <button class="btn gray" onclick="closeModal('receiptDetailsModal')">إغلاق</button>
        </div>
      </div>`;
    document.body.appendChild(m);
    m.addEventListener('click', e => { if (e.target === m) m.classList.remove('show'); });
  }
}

/* ============================================================
   سجل الفواتير
   ============================================================ */

async function openSalesLog() {
  openModal('salesLogModal');
  await loadSalesLog();
}

async function loadSalesLog() {
  try {
    const { data, error } = await client
      .from('sales')
      .select('*, customers(name)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    salesLog = data || [];
    renderSalesLog();
  } catch (e) {
    console.error('sales log:', e);
    document.getElementById('salesLogBody').innerHTML =
      '<tr><td colspan="7" class="muted" style="text-align:center;padding:20px">لا توجد فواتير</td></tr>';
  }
}

function renderSalesLog() {
  const el = document.getElementById('salesLogBody');
  if (!el) return;
  const q = (document.getElementById('salesLogSearch')?.value || '').trim().toLowerCase();
  const filter = document.getElementById('salesLogFilter')?.value || 'all';
  const list = salesLog.filter(s => {
    if (filter !== 'all' && s.payment_type !== filter) return false;
    if (q && !(s.customers?.name || '').toLowerCase().includes(q)) return false;
    return true;
  });
  if (!list.length) {
    el.innerHTML = '<tr><td colspan="7" class="muted" style="text-align:center;padding:20px">لا توجد فواتير</td></tr>';
    return;
  }
  const typeLabels = { cash: '💵 نقدي', credit: '📝 آجل', partial: '📊 جزئي' };
  el.innerHTML = list.map(s => {
    const total = Number(s.total || 0);
    const paid = Number(s.paid || 0);
    const rem = Math.max(total - paid, 0);
    return `<tr>
      <td>${new Date(s.created_at).toLocaleDateString('ar-YE')}</td>
      <td><b>${esc(s.customers?.name || 'نقدي')}</b></td>
      <td style="font-weight:700">${money(total)}</td>
      <td style="color:#16a34a">${money(paid)}</td>
      <td style="color:${rem > 0 ? '#dc2626' : '#16a34a'};font-weight:700">${money(rem)}</td>
      <td><span class="badge">${typeLabels[s.payment_type] || s.payment_type || '—'}</span></td>
      <td>
        <button class="btn small" onclick="viewSaleDetails('${s.id}')">👁️</button>
        <button class="btn small red" onclick="deleteSale('${s.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

async function viewSaleDetails(saleId) {
  try {
    const sale = salesLog.find(s => s.id === saleId);
    if (!sale) return;
    currentSaleDetails = sale;
    const total = Number(sale.total || 0);
    const paid = Number(sale.paid || 0);
    const rem = total - paid;
    document.getElementById('saleDetailsSummary').innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
        <span>👤 <b>${esc(sale.customers?.name || 'نقدي')}</b></span>
        <span>📅 ${new Date(sale.created_at).toLocaleDateString('ar-YE')}</span>
        <span>💰 الإجمالي: <b>${money(total)}</b></span>
        <span>✅ المدفوع: <b style="color:#16a34a">${money(paid)}</b></span>
        <span>📌 المتبقي: <b style="color:#dc2626">${money(rem)}</b></span>
      </div>`;
    document.getElementById('saleEditPaid').value = paid;
    const { data: items } = await client.from('sale_items').select('*').eq('sale_id', saleId);
    document.getElementById('saleDetailsBody').innerHTML = (items || []).map(it => `
      <tr>
        <td><b>${esc(it.product_name || '—')}</b></td>
        <td>${money(it.quantity || it.base_quantity)}</td>
        <td>${money(it.unit_price)}</td>
        <td style="font-weight:700">${money(it.total)}</td>
      </tr>`).join('') || '<tr><td colspan="4" class="muted">لا توجد أصناف</td></tr>';
    document.getElementById('saleDetailsDelete').onclick = () => deleteSale(saleId);
    document.getElementById('saleDetailsWA').onclick = () => resendSaleWhatsApp(saleId);
    openModal('saleDetailsModal');
  } catch (e) { err(e); }
}

async function saveEditedPaid() {
  try {
    const sale = currentSaleDetails;
    if (!sale) return;
    const newPaid = Number(document.getElementById('saleEditPaid').value) || 0;
    const total = Number(sale.total || 0);
    if (newPaid < 0) return toast('المبلغ لا يمكن أن يكون سالباً');
    if (newPaid > total) return toast('المبلغ المدفوع أكبر من الإجمالي');
    const oldPaid = Number(sale.paid || 0);
    const diff = newPaid - oldPaid;
    if (diff === 0) return toast('لم يتغير شيء');
    const { error: e1 } = await client.from('sales').update({ paid: newPaid }).eq('id', sale.id);
    if (e1) throw e1;
    if (sale.customer_id) {
      const c = customers.find(x => x.id === sale.customer_id);
      if (c) {
        const newBalance = Number(c.balance || 0) - diff;
        await client.from('customers').update({ balance: newBalance }).eq('id', sale.customer_id);
      }
    }
    toast('✅ تم تعديل المبلغ');
    closeModal('saleDetailsModal');
    await loadSalesLog();
    if (typeof loadCustomers === 'function') await loadCustomers();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) { err(e); }
}

async function deleteSale(saleId) {
  if (!confirm('⚠️ حذف الفاتورة نهائياً؟\n\nسيتم إرجاع الأصناف للمخزون وخصم المديونية. لا يمكن التراجع!')) return;
  try {
    const sale = salesLog.find(s => s.id === saleId);
    if (!sale) return;
    const { data: items } = await client.from('sale_items').select('*').eq('sale_id', saleId);
    for (const it of (items || [])) {
      if (it.product_id) {
        const { data: p } = await client.from('products').select('quantity').eq('id', it.product_id).single();
        if (p) await client.from('products').update({ quantity: Number(p.quantity || 0) + Number(it.base_quantity || 0) }).eq('id', it.product_id);
      }
    }
    if (sale.customer_id && sale.payment_type !== 'cash') {
      const rem = Number(sale.total || 0) - Number(sale.paid || 0);
      if (rem > 0) {
        const { data: c } = await client.from('customers').select('balance').eq('id', sale.customer_id).single();
        if (c) await client.from('customers').update({ balance: Number(c.balance || 0) - rem }).eq('id', sale.customer_id);
      }
    }
    await client.from('sale_items').delete().eq('sale_id', saleId);
    const { error } = await client.from('sales').delete().eq('id', saleId);
    if (error) throw error;
    toast('✅ تم حذف الفاتورة');
    closeModal('saleDetailsModal');
    await loadSalesLog();
    if (typeof loadProducts === 'function') await loadProducts();
    if (typeof loadCustomers === 'function') await loadCustomers();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) { err(e); }
}

async function resendSaleWhatsApp(saleId) {
  try {
    const sale = salesLog.find(s => s.id === saleId);
    if (!sale) return;
    const c = customers.find(x => x.id === sale.customer_id);
    if (!c || !c.phone) return toast('لا يوجد رقم هاتف');
    const { data: items } = await client.from('sale_items').select('*').eq('sale_id', saleId);
    const total = Number(sale.total || 0);
    const paid = Number(sale.paid || 0);
    const rem = total - paid;
    const lines = (items || []).map((it, i) =>
      `  ${i+1}) ${it.product_name} — ${it.quantity || it.base_quantity} × ${money(it.unit_price)} = ${money(it.total)}`
    ).join('\n');
    const bal = Number(c.balance || 0);
    const prev = bal - rem;
    const msg = `🧾 *فاتورة مبيعات — ${SHOP_SETTINGS.shop_name}*\n━━━━━━━━━━━━━━━\n👤 ${c.name}\n📅 ${new Date(sale.created_at).toLocaleDateString('ar-YE')}\n━━━━━━━━━━━━━━━\n📦 الأصناف:\n${lines}\n━━━━━━━━━━━━━━━\n💰 الإجمالي: ${money(total)} ${CUR()}\n✅ المدفوع: ${money(paid)} ${CUR()}\n📌 المتبقي: ${money(rem)} ${CUR()}${prev > 0 ? `\n━━━━━━━━━━━━━━━\n💼 رصيدك السابق: ${money(prev)} ${CUR()}\n📌 *إجمالي مديونيتك: ${money(bal)} ${CUR()}*` : ''}\n━━━━━━━━━━━━━━━\n${SHOP_SETTINGS.shop_name}`;
    previewWhatsApp(c.phone, msg, { customer_id: sale.customer_id, ref_type: 'sale', ref_id: saleId });
  } catch (e) { err(e); }
}

/* ============================================================
   سجل السندات
   ============================================================ */

async function openReceiptsLog() {
  openModal('receiptsLogModal');
  await loadReceiptsLog();
}

async function loadReceiptsLog() {
  try {
    const { data, error } = await client
      .from('receipts')
      .select('*, customers(name), suppliers(name)')
      .eq('store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    receiptsLog = data || [];
    renderReceiptsLog();
  } catch (e) {
    console.error('receipts log:', e);
    document.getElementById('receiptsLogBody').innerHTML =
      '<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">لا توجد سندات</td></tr>';
  }
}

function renderReceiptsLog() {
  const el = document.getElementById('receiptsLogBody');
  if (!el) return;
  const q = (document.getElementById('receiptsLogSearch')?.value || '').trim().toLowerCase();
  const filter = document.getElementById('receiptsLogFilter')?.value || 'all';
  const list = receiptsLog.filter(r => {
    if (filter !== 'all' && r.type !== filter) return false;
    if (q) {
      const name = (r.customers?.name || r.suppliers?.name || '').toLowerCase();
      if (!name.includes(q)) return false;
    }
    return true;
  });
  if (!list.length) {
    el.innerHTML = '<tr><td colspan="6" class="muted" style="text-align:center;padding:20px">لا توجد سندات</td></tr>';
    return;
  }
  el.innerHTML = list.map(r => {
    const party = r.type === 'receive' ? (r.customers?.name || '—') : (r.suppliers?.name || '—');
    const typeLabel = r.type === 'receive' ? '📥 قبض' : '📤 دفع';
    const typeColor = r.type === 'receive' ? '#16a34a' : '#dc2626';
    return `<tr>
      <td>${new Date(r.created_at).toLocaleDateString('ar-YE')}</td>
      <td><span class="badge" style="background:${typeColor}15;color:${typeColor}">${typeLabel}</span></td>
      <td><b>${esc(party)}</b></td>
      <td style="font-weight:700;color:${typeColor}">${money(r.amount)}</td>
      <td>${esc(r.note || '—')}</td>
      <td>
        <button class="btn small" onclick="viewReceiptDetails('${r.id}')">👁️</button>
        <button class="btn small red" onclick="deleteReceipt('${r.id}')">🗑️</button>
      </td>
    </tr>`;
  }).join('');
}

async function viewReceiptDetails(receiptId) {
  try {
    const r = receiptsLog.find(x => x.id === receiptId);
    if (!r) return;
    currentReceiptDetails = r;
    const party = r.type === 'receive' ? (r.customers?.name || '—') : (r.suppliers?.name || '—');
    const typeLabel = r.type === 'receive' ? '📥 قبض من عميل' : '📤 دفع لمورد';
    document.getElementById('receiptDetailsSummary').innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
        <span>${typeLabel}</span>
        <span>👤 <b>${esc(party)}</b></span>
        <span>📅 ${new Date(r.created_at).toLocaleDateString('ar-YE')}</span>
        <span>💰 المبلغ: <b>${money(r.amount)}</b></span>
        ${r.note ? `<span>📝 ${esc(r.note)}</span>` : ''}
      </div>`;
    document.getElementById('receiptEditAmount').value = Number(r.amount || 0);
    document.getElementById('receiptDetailsDelete').onclick = () => deleteReceipt(receiptId);
    document.getElementById('receiptDetailsWA').onclick = () => resendReceiptWhatsApp(receiptId);
    openModal('receiptDetailsModal');
  } catch (e) { err(e); }
}

async function saveEditedReceipt() {
  try {
    const r = currentReceiptDetails;
    if (!r) return;
    const newAmount = Number(document.getElementById('receiptEditAmount').value) || 0;
    if (newAmount <= 0) return toast('أدخل مبلغاً صحيحاً');
    const oldAmount = Number(r.amount || 0);
    const diff = newAmount - oldAmount;
    if (diff === 0) return toast('لم يتغير شيء');
    
    await client.from('receipts').update({ amount: newAmount }).eq('id', r.id);
    
    if (r.type === 'receive' && r.customer_id) {
      const { data: c } = await client.from('customers').select('balance').eq('id', r.customer_id).single();
      if (c) {
        // سند قبض: زيادة المبلغ = خصم أكبر من الرصيد
        const newBalance = Number(c.balance || 0) - diff;
        await client.from('customers').update({ balance: newBalance }).eq('id', r.customer_id);
      }
    } else if (r.type === 'pay' && r.supplier_id) {
      const { data: s } = await client.from('suppliers').select('balance').eq('id', r.supplier_id).single();
      if (s) {
        // سند دفع: زيادة المبلغ = خصم أكبر من رصيد المورد
        const newBalance = Number(s.balance || 0) - diff;
        await client.from('suppliers').update({ balance: newBalance }).eq('id', r.supplier_id);
      }
    }
    
    toast('✅ تم تعديل المبلغ');
    closeModal('receiptDetailsModal');
    await loadReceiptsLog();
    if (typeof loadCustomers === 'function') await loadCustomers();
    if (typeof loadSuppliers === 'function') await loadSuppliers();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) { err(e); }
}

async function deleteReceipt(receiptId) {
  if (!confirm('⚠️ حذف السند نهائياً؟\n\nسيتم إرجاع المبلغ لحساب الطرف. لا يمكن التراجع!')) return;
  try {
    const r = receiptsLog.find(x => x.id === receiptId);
    if (!r) return;
    const amount = Number(r.amount || 0);
    
    // عكس التأثير على الرصيد
    if (r.type === 'receive' && r.customer_id) {
      const { data: c } = await client.from('customers').select('balance').eq('id', r.customer_id).single();
      if (c) {
        // سند قبض كان يخصم من رصيد العميل → الحذف يرجعه
        await client.from('customers').update({ balance: Number(c.balance || 0) + amount }).eq('id', r.customer_id);
      }
    } else if (r.type === 'pay' && r.supplier_id) {
      const { data: s } = await client.from('suppliers').select('balance').eq('id', r.supplier_id).single();
      if (s) {
        // سند دفع كان يخصم من رصيد المورد → الحذف يرجعه
        await client.from('suppliers').update({ balance: Number(s.balance || 0) + amount }).eq('id', r.supplier_id);
      }
    }
    
    const { error } = await client.from('receipts').delete().eq('id', receiptId);
    if (error) throw error;
    
    toast('✅ تم حذف السند');
    closeModal('receiptDetailsModal');
    await loadReceiptsLog();
    if (typeof loadCustomers === 'function') await loadCustomers();
    if (typeof loadSuppliers === 'function') await loadSuppliers();
    if (typeof updateDashboard === 'function') await updateDashboard();
  } catch (e) { err(e); }
}

async function resendReceiptWhatsApp(receiptId) {
  try {
    const r = receiptsLog.find(x => x.id === receiptId);
    if (!r) return;
    if (r.type === 'receive') {
      const c = customers.find(x => x.id === r.customer_id);
      if (!c || !c.phone) return toast('لا يوجد رقم هاتف');
      const msg = `💵 *سند قبض — ${SHOP_SETTINGS.shop_name}*\n━━━━━━━━━━━━━━━\n👤 ${c.name}\n📅 ${new Date(r.created_at).toLocaleDateString('ar-YE')}\n💸 المستلم: *${money(r.amount)} ${CUR()}*\n${r.note ? '📝 ' + r.note + '\n' : ''}━━━━━━━━━━━━━━━\n📌 المتبقي: *${money(c.balance)} ${CUR()}*\n━━━━━━━━━━━━━━━\n${SHOP_SETTINGS.shop_name}`;
      previewWhatsApp(c.phone, msg, { customer_id: r.customer_id, ref_type: 'receipt', ref_id: r.id });
    } else {
      toast('إشعار الدفع للموردين غير مدعوم');
    }
  } catch (e) { err(e); }
}

/* ============================================================
   تعديل saveReceipt لتحفظ في جدول receipts
   ============================================================ */
function patchSaveReceipt() {
  if (typeof window.saveReceipt !== 'function') {
    console.warn('⚠️ saveReceipt غير موجود');
    return;
  }
  
  window.saveReceipt = async function() {
    try {
      const type = $('receiptType').value;
      const id = $('receiptTarget').value;
      const amount = Number($('receiptAmount').value) || 0;
      const note = $('receiptNote').value.trim();
      if (!id || amount <= 0) return toast('أكمل البيانات');
      const notify = $('receiptNotify').value === 'yes';
      
      // حفظ في جدول receipts
      const receiptPayload = {
        store_id: store.id,
        type: type,
        amount: amount,
        note: note || null,
        operation_date: new Date().toISOString().slice(0, 10)
      };
      
      if (type === 'receive') {
        const c = customers.find(x => x.id === id);
        receiptPayload.customer_id = id;
        receiptPayload.phone = c?.phone || null;
        
        const newBal = Number(c.balance || 0) - amount;
        await client.from('customers').update({ balance: newBal }).eq('id', id);
        const { data: tr } = await client.from('customer_transactions').insert({
          customer_id: id,
          details: 'سند قبض ' + note,
          amount: -amount,
          type: 'receipt',
          operation_date: new Date().toISOString().slice(0, 10)
        }).select().single();
        
        if (notify && c.phone) {
          const msg = tplReceipt({ customer_name: c.name, amount, new_balance: newBal, note, date: nowAr() });
          previewWhatsApp(c.phone, msg, { customer_id: id, ref_type: 'receipt', ref_id: tr?.id });
        }
      } else {
        const s = suppliers.find(x => x.id === id);
        receiptPayload.supplier_id = id;
        await client.from('suppliers').update({ balance: Number(s.balance || 0) - amount }).eq('id', id);
      }
      
      const { error: eR } = await client.from('receipts').insert(receiptPayload);
      if (eR) console.warn('receipts insert:', eR);
      
      $('receiptAmount').value = '';
      $('receiptNote').value = '';
      await loadAll();
      toast('✅ تم حفظ السند');
    } catch (e) { err(e); }
  };
  
  console.log('✅ تم تفعيل سجل السندات');
}

console.log('📋 sales-log.js محمّل بنجاح');