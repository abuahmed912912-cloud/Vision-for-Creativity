/* ============================================================
   📱 إدارة المشغلين وخدمات الاتصالات
   ============================================================ */

let providers = [];
let providerTransactions = [];
let editingProviderId = null;
let currentProviderReportData = [];
let currentProviderStatementData = [];

async function loadProviders() {
  try {
    const { data, error } = await client.from('providers').select('*').eq('store_id', store.id).order('name');
    if (error) throw error;
    providers = data || [];
    renderProviders();
    updateTelecomStats();
    populate('telProvider', providers, 'اختر المشغل');
  } catch (e) { console.warn('providers:', e); }
}

async function loadProviderTransactions(limit = 100) {
  try {
    const { data, error } = await client.from('provider_transactions').select('*, providers(name), customers(name)').eq('store_id', store.id).order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    providerTransactions = data || [];
    renderProviderTransactions();
  } catch (e) { console.warn('provider_transactions:', e); }
}

function renderProviders() {
  const el = $('providersList');
  if (!el) return;
  if (!providers.length) {
    el.innerHTML = '<p class="muted" style="text-align:center;padding:20px">لا توجد مشغلين بعد — اضغط "➕ مشغل جديد"</p>';
    return;
  }
  el.innerHTML = providers.map(p => `
    <div style="padding:12px;border:1px solid #e5eaf0;border-radius:12px;margin-bottom:8px;background:#f8fafc">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
        <div style="flex:1;min-width:180px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <b style="font-size:15px">${esc(p.name)}</b>
            <span class="badge">${esc(p.category || 'balance')}</span>
            ${p.is_active === false ? '<span class="badge red">معطل</span>' : '<span class="badge green">نشط</span>'}
          </div>
          ${p.phone ? `<div class="muted" style="font-size:11px;margin-top:3px">📞 ${esc(p.phone)}</div>` : ''}
        </div>
        <div style="display:flex;gap:14px;text-align:center">
          <div>
            <div class="muted" style="font-size:10px">🟦 شمالي</div>
            <b style="color:#0f4c81;font-size:15px">${money(p.balance_north)}</b>
          </div>
          <div>
            <div class="muted" style="font-size:10px">🟩 جنوبي</div>
            <b style="color:#16a34a;font-size:15px">${money(p.balance_south)}</b>
          </div>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">
          <button class="btn small" onclick="providerStatement('${p.id}')">📋</button>
          <button class="btn small" onclick="editProvider('${p.id}')">✏️</button>
          <button class="btn small red" onclick="deleteProvider('${p.id}')">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderProviderTransactions() {
  const el = $('telTxBody');
  if (!el) return;
  const q = ($('telTxSearch')?.value || '').trim().toLowerCase();
  const filter = $('telTxFilter')?.value || 'all';
  
  const list = providerTransactions.filter(t => {
    if (filter !== 'all' && t.type !== filter) return false;
    if (q) {
      const name = (t.providers?.name || '').toLowerCase();
      const cust = (t.customers?.name || '').toLowerCase();
      const phone = (t.phone || '').toLowerCase();
      if (!name.includes(q) && !cust.includes(q) && !phone.includes(q)) return false;
    }
    return true;
  });

  if (!list.length) {
    el.innerHTML = '<tr><td colspan="10" class="muted" style="text-align:center;padding:20px">لا توجد حركات</td></tr>';
    return;
  }

  const typeLabels = { supply: '📥 توريد', consume: '📤 بيع', cancel: '↩️ إلغاء', deduction: '➖ خصم', adjustment: '⚖️ تسوية' };

  el.innerHTML = list.map(t => `
    <tr>
      <td>${new Date(t.created_at).toLocaleDateString('ar-YE')}</td>
      <td><b>${esc(t.providers?.name || '—')}</b></td>
      <td><span class="badge">${typeLabels[t.type] || t.type}</span></td>
      <td>${t.currency === 'north' ? '🟦 شمالي' : '🟩 جنوبي'}</td>
      <td style="font-weight:700">${money(t.amount)}</td>
      <td>${money(t.cost || 0)}</td>
      <td style="color:#16a34a;font-weight:700">${money(t.profit || 0)}</td>
      <td>${esc(t.customers?.name || '—')}</td>
      <td dir="ltr" style="font-family:monospace;font-size:11px">${esc(t.phone || '—')}</td>
      <td><button class="btn small red" onclick="deleteProviderTx('${t.id}')">🗑️</button></td>
    </tr>
  `).join('');
}

function updateTelecomStats() {
  const totalNorth = providers.reduce((s, p) => s + Number(p.balance_north || 0), 0);
  const totalSouth = providers.reduce((s, p) => s + Number(p.balance_south || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const profitToday = providerTransactions.filter(t => t.created_at?.slice(0, 10) === today && t.type === 'consume').reduce((s, t) => s + Number(t.profit || 0), 0);
  if ($('telBalanceNorth')) $('telBalanceNorth').textContent = money(totalNorth);
  if ($('telBalanceSouth')) $('telBalanceSouth').textContent = money(totalSouth);
  if ($('telProfitToday')) $('telProfitToday').textContent = money(profitToday);
  if ($('telProvidersCount')) $('telProvidersCount').textContent = providers.filter(p => p.is_active !== false).length;
}

function toggleTelFields() {
  const type = $('telTxType').value;
  const isConsume = type === 'consume';
  $('telCostWrap').classList.toggle('hidden', !isConsume);
  $('telProfitWrap').classList.toggle('hidden', !isConsume);
  $('telCustomerWrap').classList.toggle('hidden', !isConsume);
  $('telPhoneWrap').classList.toggle('hidden', !isConsume);
}

function calcTelProfit() {
  const amount = Number($('telAmount').value) || 0;
  const cost = Number($('telCost').value) || 0;
  $('telProfit').value = Math.max(amount - cost, 0);
}

function openNewProvider() {
  editingProviderId = null;
  $('providerModalTitle').textContent = '➕ مشغل جديد';
  $('prName').value = ''; $('prPhone').value = ''; $('prNotes').value = '';
  $('prCategory').value = 'balance'; $('prBalanceNorth').value = '0';
  $('prBalanceSouth').value = '0'; $('prActive').value = 'active'; $('prLowAlert').value = '0';
  openModal('providerModal');
}

function editProvider(id) {
  const p = providers.find(x => x.id === id);
  if (!p) return;
  editingProviderId = id;
  $('providerModalTitle').textContent = '✏️ تعديل مشغل';
  $('prName').value = p.name || ''; $('prPhone').value = p.phone || '';
  $('prNotes').value = p.notes || ''; $('prCategory').value = p.category || 'balance';
  $('prBalanceNorth').value = p.balance_north || 0; $('prBalanceSouth').value = p.balance_south || 0;
  $('prActive').value = p.is_active === false ? 'inactive' : 'active';
  $('prLowAlert').value = p.low_balance_alert || 0;
  openModal('providerModal');
}

async function saveProvider() {
  try {
    if (!store?.id) return toast('جلسة غير جاهزة');
    const name = $('prName').value.trim();
    if (!name) return toast('اسم المشغل مطلوب');
    const payload = {
      store_id: store.id, name,
      category: $('prCategory').value,
      phone: $('prPhone').value.trim() || null,
      balance_north: Number($('prBalanceNorth').value) || 0,
      balance_south: Number($('prBalanceSouth').value) || 0,
      is_active: $('prActive').value === 'active',
      notes: $('prNotes').value.trim() || null
    };
    let error;
    if (editingProviderId) ({ error } = await client.from('providers').update(payload).eq('id', editingProviderId));
    else ({ error } = await client.from('providers').insert(payload));
    if (error) throw error;
    closeModal('providerModal');
    await loadProviders();
    toast('✅ تم حفظ المشغل');
  } catch (e) { err(e); }
}

async function deleteProvider(id) {
  if (!confirm('حذف المشغل وجميع حركاته؟')) return;
  try {
    const { error } = await client.from('providers').delete().eq('id', id);
    if (error) throw error;
    await loadProviders(); await loadProviderTransactions(); await updateDashboard();
    toast('تم الحذف');
  } catch (e) { toast('تعذر الحذف'); }
}

async function saveProviderTransaction() {
  try {
    const providerId = $('telProvider').value;
    if (!providerId) return toast('اختر المشغل');
    const type = $('telTxType').value;
    const currency = $('telCurrency').value;
    const amount = Number($('telAmount').value) || 0;
    const cost = Number($('telCost').value) || 0;
    const profit = Math.max(amount - cost, 0);
    const customerId = $('telCustomer').value || null;
    const phone = $('telPhone').value.trim() || null;
    if (amount < 0) return toast('أدخل مبلغاً صحيحاً');
    if (type !== 'adjustment' && amount === 0) return toast('أدخل مبلغاً أكبر من صفر');
    const provider = providers.find(p => p.id === providerId);
    if (!provider) return toast('المشغل غير موجود');
    let oldBalance = currency === 'north' ? Number(provider.balance_north || 0) : Number(provider.balance_south || 0);
    let newBalance;
    if (type === 'supply') newBalance = oldBalance + amount;
    else if (type === 'consume' || type === 'deduction') newBalance = oldBalance - amount;
    else if (type === 'adjustment') newBalance = amount;
    const { error: e1 } = await client.from('provider_transactions').insert({
      store_id: store.id, provider_id: providerId, type, currency, amount,
      cost: type === 'consume' ? cost : 0, profit: type === 'consume' ? profit : 0,
      customer_id: customerId, phone, notes: $('telNotes').value.trim() || null,
      operation_date: new Date().toISOString().slice(0, 10), status: 'completed'
    });
    if (e1) throw e1;
    const balanceField = currency === 'north' ? 'balance_north' : 'balance_south';
    const { error: e2 } = await client.from('providers').update({ [balanceField]: newBalance }).eq('id', providerId);
    if (e2) throw e2;
    let refId = null;
    if (type === 'consume' && customerId) {
      const c = customers.find(x => x.id === customerId);
      if (c) {
        const { error: e3 } = await client.from('customers').update({ balance: Number(c.balance || 0) + amount }).eq('id', customerId);
        if (e3) throw e3;
        const { data: tr } = await client.from('customer_transactions').insert({
          customer_id: customerId,
          details: `خدمة ${provider.name} (${currency === 'north' ? 'شمالي' : 'جنوبي'})${phone ? ' — ' + phone : ''}`,
          amount, type: 'telecom', operation_date: new Date().toISOString().slice(0, 10)
        }).select().single();
        refId = tr?.id;
      }
    }
    if ($('telNotify').value === 'yes' && customerId && type === 'consume') {
      const c = customers.find(x => x.id === customerId);
      if (c?.phone) {
        const msg = `📱 *خدمة اتصالات — ${SHOP_SETTINGS.shop_name}*\n━━━━━━━━━━━━━━━\n👤 ${c.name}\n📅 ${nowAr()}\n📡 ${provider.name} (${currency === 'north' ? 'شمالي' : 'جنوبي'})\n${phone ? '🔢 ' + phone + '\n' : ''}💰 *${money(amount)} ${CUR()}*\n━━━━━━━━━━━━━━━\n${SHOP_SETTINGS.shop_name}`;
        previewWhatsApp(c.phone, msg, { customer_id: customerId, ref_type: 'telecom', ref_id: refId });
      }
    }
    $('telAmount').value = ''; $('telCost').value = '0'; $('telProfit').value = '';
    $('telPhone').value = ''; $('telNotes').value = '';
    await loadProviders(); await loadProviderTransactions(); await loadCustomers(); await updateDashboard();
    toast('✅ تم حفظ العملية');
  } catch (e) { err(e); }
}

async function deleteProviderTx(id) {
  if (!confirm('حذف هذه الحركة؟ سيتم عكس تأثيرها على الرصيد')) return;
  try {
    const tx = providerTransactions.find(t => t.id === id);
    if (!tx) return;
    const provider = providers.find(p => p.id === tx.provider_id);
    if (provider) {
      const field = tx.currency === 'north' ? 'balance_north' : 'balance_south';
      let current = Number(provider[field] || 0);
      if (tx.type === 'supply') current -= Number(tx.amount);
      else if (tx.type === 'consume' || tx.type === 'deduction') current += Number(tx.amount);
      await client.from('providers').update({ [field]: current }).eq('id', provider.id);
    }
    const { error } = await client.from('provider_transactions').delete().eq('id', id);
    if (error) throw error;
    await loadProviders(); await loadProviderTransactions();
    toast('تم الحذف');
  } catch (e) { err(e); }
}

function openProvidersReport() {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  $('prFrom').value = monthAgo; $('prTo').value = today;
  $('prReportBody').innerHTML = '<tr><td colspan="8" class="muted">اضغط "عرض"</td></tr>';
  openModal('providersReportModal');
}

async function loadProvidersReport() {
  try {
    const from = $('prFrom').value || null;
    const to = $('prTo').value || null;
    const { data, error } = await client.rpc('get_providers_profit_report', { p_store_id: store.id, p_date_from: from, p_date_to: to });
    if (error) throw error;
    currentProviderReportData = data || [];
    if (!currentProviderReportData.length) {
      $('prReportBody').innerHTML = '<tr><td colspan="8" class="muted">لا توجد بيانات</td></tr>';
      return;
    }
    $('prReportBody').innerHTML = currentProviderReportData.map(r => `
      <tr>
        <td><b>${esc(r.provider_name)}</b></td>
        <td>${r.supply_count || 0}</td>
        <td>${r.consume_count || 0}</td>
        <td>${money(r.total_supply)}</td>
        <td>${money(r.total_consume)}</td>
        <td>${money(r.total_cost)}</td>
        <td style="color:#16a34a;font-weight:700">${money(r.total_profit)}</td>
        <td>${Number(r.profit_margin || 0).toFixed(2)}%</td>
      </tr>
    `).join('');
  } catch (e) { err(e); }
}

function exportProvidersReportExcel() {
  if (!currentProviderReportData.length) return toast('لا بيانات');
  const rows = [
    ['تقرير أرباح المشغلين — ' + SHOP_SETTINGS.shop_name],
    ['من: ' + ($('prFrom').value || 'البداية') + ' إلى: ' + ($('prTo').value || 'اليوم')],
    [],
    ['المشغل', 'عمليات توريد', 'عمليات بيع', 'إجمالي التوريد', 'إجمالي البيع', 'التكلفة', 'الربح', 'نسبة الربح %']
  ];
  currentProviderReportData.forEach(r => {
    rows.push([r.provider_name, r.supply_count || 0, r.consume_count || 0, Number(r.total_supply || 0), Number(r.total_consume || 0), Number(r.total_cost || 0), Number(r.total_profit || 0), Number(r.profit_margin || 0)]);
  });
  exportToExcel(`أرباح_المشغلين_${new Date().toISOString().slice(0,10)}.xlsx`, [{ name: 'الأرباح', rows }]);
}

function exportProvidersReportPDF() {
  if (!currentProviderReportData.length) return toast('لا بيانات');
  const from = $('prFrom').value || 'البداية';
  const to = $('prTo').value || 'اليوم';
  const totalProfit = currentProviderReportData.reduce((s, r) => s + Number(r.total_profit || 0), 0);
  const html = `
    <div class="summary">
      <span>📅 من: <b>${esc(from)}</b></span>
      <span>📅 إلى: <b>${esc(to)}</b></span>
      <span>💰 إجمالي الأرباح: <b>${money(totalProfit)} ${CUR()}</b></span>
    </div>
    <table>
      <thead><tr>
        <th>المشغل</th><th>عمليات توريد</th><th>عمليات بيع</th>
        <th>إجمالي التوريد</th><th>إجمالي البيع</th><th>التكلفة</th>
        <th>الربح</th><th>نسبة الربح</th>
      </tr></thead>
      <tbody>
        ${currentProviderReportData.map(r => `
          <tr>
            <td><b>${esc(r.provider_name)}</b></td>
            <td>${r.supply_count || 0}</td>
            <td>${r.consume_count || 0}</td>
            <td>${money(r.total_supply)}</td>
            <td>${money(r.total_consume)}</td>
            <td>${money(r.total_cost)}</td>
            <td style="color:#16a34a"><b>${money(r.total_profit)}</b></td>
            <td>${Number(r.profit_margin || 0).toFixed(2)}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  exportToPDF('تقرير أرباح المشغلين', html, `من ${from} إلى ${to}`);
}

async function providerStatement(providerId) {
  try {
    const p = providers.find(x => x.id === providerId);
    if (!p) return;
    $('providerStatementTitle').textContent = '📋 كشف حساب: ' + p.name;
    const { data, error } = await client.from('provider_transactions').select('*, customers(name)').eq('provider_id', providerId).order('created_at', { ascending: false }).limit(100);
    if (error) throw error;
    currentProviderStatementData = (data || []).map(t => ({ ...t, customer_name: t.customers?.name || null }));
    $('providerStatementSummary').innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-top:6px">
        <span>🟦 رصيد شمالي: <b style="color:#0f4c81">${money(p.balance_north)} ${CUR()}</b></span>
        <span>🟩 رصيد جنوبي: <b style="color:#16a34a">${money(p.balance_south)} ${CUR()}</b></span>
        <span>📊 عدد الحركات: <b>${currentProviderStatementData.length}</b></span>
      </div>
    `;
    const typeLabels = { supply: '📥 توريد', consume: '📤 بيع', cancel: '↩️ إلغاء', deduction: '➖ خصم', adjustment: '⚖️ تسوية' };
    $('providerStatementBody').innerHTML = currentProviderStatementData.length
      ? currentProviderStatementData.map(t => `
          <tr>
            <td>${new Date(t.created_at).toLocaleDateString('ar-YE')}</td>
            <td><span class="badge">${typeLabels[t.type] || t.type}</span></td>
            <td>${t.currency === 'north' ? '🟦 شمالي' : '🟩 جنوبي'}</td>
            <td style="font-weight:700">${money(t.amount)}</td>
            <td style="color:#16a34a">${money(t.profit || 0)}</td>
            <td>${esc(t.customer_name || '—')}</td>
            <td>${esc(t.notes || '—')}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="7" class="muted">لا توجد حركات</td></tr>';
    openModal('providerStatementModal');
  } catch (e) { err(e); }
}

function exportProviderStatementExcel() {
  if (!currentProviderStatementData.length) return toast('لا بيانات');
  const rows = [['كشف حساب مشغل — ' + SHOP_SETTINGS.shop_name], [], ['التاريخ', 'النوع', 'الاتجاه', 'المبلغ', 'الربح', 'العميل', 'ملاحظات']];
  const typeLabels = { supply: 'توريد', consume: 'بيع', cancel: 'إلغاء', deduction: 'خصم', adjustment: 'تسوية' };
  currentProviderStatementData.forEach(t => {
    rows.push([new Date(t.created_at).toLocaleString('ar-YE'), typeLabels[t.type] || t.type, t.currency === 'north' ? 'شمالي' : 'جنوبي', Number(t.amount || 0), Number(t.profit || 0), t.customer_name || '', t.notes || '']);
  });
  exportToExcel(`كشف_مشغل_${new Date().toISOString().slice(0,10)}.xlsx`, [{ name: 'كشف', rows }]);
}

async function shareProvidersSummary() {
  if (!providers.length) return toast('لا يوجد مشغلين');
  const totalNorth = providers.reduce((s, p) => s + Number(p.balance_north || 0), 0);
  const totalSouth = providers.reduce((s, p) => s + Number(p.balance_south || 0), 0);
  const list = providers.map((p, i) => `  ${i + 1}) ${p.name}: 🟦 ${money(p.balance_north)} | 🟩 ${money(p.balance_south)}`).join('\n');
  const msg = `📱 *ملخص المشغلين — ${SHOP_SETTINGS.shop_name}*\n━━━━━━━━━━━━━━━\n📅 ${nowAr()}\n━━━━━━━━━━━━━━━\n${list}\n━━━━━━━━━━━━━━━\n🟦 إجمالي شمالي: *${money(totalNorth)} ${CUR()}*\n🟩 إجمالي جنوبي: *${money(totalSouth)} ${CUR()}*\n━━━━━━━━━━━━━━━`;
  const phone = prompt('أدخل رقم الواتساب (أو اتركه فارغاً للنسخ):');
  if (phone && phone.trim()) previewWhatsApp(phone.trim(), msg, { ref_type: 'providers_summary' });
  else await copyToClipboard(msg, 'تم نسخ الملخص');
}

/* ============ ربط showSection ============ */
(function patchShowSection() {
  if (typeof showSection !== 'function') {
    console.warn('⚠️ showSection غير موجودة');
    return;
  }
  const original = window.showSection;
  window.showSection = function (id, btn) {
    original.call(this, id, btn);
    if (id === 'telecom') {
      loadProviders();
      loadProviderTransactions();
      toggleTelFields();
    }
  };
})();

/* ============ تحميل telecom.html تلقائياً ============ */
(async function loadTelecomHTML() {
  try {
    const oldSection = document.querySelector('section#telecom');
    if (oldSection) {
      oldSection.remove();
      console.log('🗑️ تم حذف القسم القديم');
    }
    const response = await fetch('./telecom.html');
    if (!response.ok) throw new Error('لم يتم العثور على telecom.html');
    const html = await response.text();
    const placeholder = document.getElementById('telecom-placeholder');
    if (!placeholder) {
      console.warn('⚠️ لم يتم العثور على telecom-placeholder');
      return;
    }
    placeholder.outerHTML = html;
    console.log('✅ تم تحميل قسم الاتصالات بنجاح');
  } catch (e) {
    console.error('❌ فشل تحميل telecom.html:', e);
  }
})();

console.log('📱 telecom.js محمّل بنجاح');