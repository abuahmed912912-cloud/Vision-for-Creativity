/* ============================================================
   📅 تعديل التاريخ + 💱 العملات المتعددة
   ============================================================ */

const CURRENCIES = [
  { code: 'YER', label: '🇾🇪 ريال يمني', symbol: 'ر.ي' },
  { code: 'SAR', label: '🇸🇦 ريال سعودي', symbol: 'ر.س' },
  { code: 'USD', label: '🇺🇸 دولار أمريكي', symbol: '$' }
];

window.getCurrencySymbol = function(code) {
  const c = CURRENCIES.find(x => x.code === code);
  return c ? c.symbol : 'ر.ي';
};

// الحقول: [القسم, id التاريخ, id العملة, إذا كان داخل نافذة]
const FORMS = [
  { section: 'sales',     dateId: 'saleDate',     currId: 'saleCurrency' },
  { section: 'purchases', dateId: 'purchaseDate', currId: 'purchaseCurrency' },
  { section: 'receipts',  dateId: 'receiptDate',  currId: 'receiptCurrency' },
  { section: 'expenses',  dateId: 'expenseDate',  currId: 'expenseCurrency' },
  { section: 'telecom',   dateId: 'telecomDate',  currId: 'telecomCurrency' },
  { section: 'voice',     dateId: 'voiceDate',    currId: 'voiceCurrency' }
];

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectDateCurrency, 1800);
  setTimeout(patchSaves, 2500);
});

function injectDateCurrency() {
  FORMS.forEach(cfg => {
    const section = document.getElementById(cfg.section);
    if (!section) return;
    const fg = section.querySelector('.formgrid');
    if (!fg) return;
    if (!document.getElementById(cfg.dateId)) {
      const d = document.createElement('div');
      d.innerHTML = `<label>📅 التاريخ</label><input id="${cfg.dateId}" type="date" value="${new Date().toISOString().slice(0,10)}">`;
      fg.appendChild(d);
    }
    if (!document.getElementById(cfg.currId)) {
      const c = document.createElement('div');
      c.innerHTML = `<label>💱 العملة</label><select id="${cfg.currId}">${CURRENCIES.map(x => `<option value="${x.code}">${x.label}</option>`).join('')}</select>`;
      fg.appendChild(c);
    }
  });
  
  // العملة للحركة البنكية
  const bt = document.getElementById('bankTransModal');
  if (bt && !document.getElementById('btCurrency')) {
    const fg = bt.querySelector('.formgrid');
    if (fg) {
      const c = document.createElement('div');
      c.innerHTML = `<label>💱 العملة</label><select id="btCurrency">${CURRENCIES.map(x => `<option value="${x.code}">${x.label}</option>`).join('')}</select>`;
      fg.appendChild(c);
    }
  }
}

function getFormDate(id) {
  const el = document.getElementById(id);
  return el?.value || new Date().toISOString().slice(0,10);
}

function getFormCurrency(id) {
  const el = document.getElementById(id);
  return el?.value || 'YER';
}

function patchSaves() {
  // ════ حفظ فاتورة مبيعات ════
  if (typeof window.saveSale === 'function') {
    const orig = window.saveSale;
    window.saveSale = async function() {
      const date = getFormDate('saleDate');
      const curr = getFormCurrency('saleCurrency');
      try {
        // تنفيذ الحفظ الأساسي
        const customer_id = $('saleCustomer').value || null, type = $('saleType').value;
        if (type !== 'cash' && !customer_id) return toast('اختر عميلاً للآجل');
        const rows = [...document.querySelectorAll('#saleRows .formgrid')].map(r => {
          const pid = r.querySelector('.row-prod').value, p = products.find(x => x.id === pid);
          if (!p) return null;
          const u = r.querySelector('.row-unit').value, q = Number(r.querySelector('.row-qty').value) || 0, pr = Number(r.querySelector('.row-price').value) || 0;
          let f = 1; if (u === 'carton') f = (p.carton_factor || 1) * (p.package_factor || 1); else if (u === 'pack') f = (p.package_factor || 1);
          return { product_id: pid, quantity: q, unit_price: pr, base_quantity: q * f, total: q * pr };
        }).filter(Boolean);
        if (!rows.length) return toast('أضف صنفاً');
        const total = rows.reduce((s, x) => s + x.total, 0);
        const paid = type === 'cash' ? total : (type === 'partial' ? Number($('salePaid').value) || 0 : 0);
        const remaining = total - paid;
        const notify = $('saleNotify').value === 'yes';
        const { data: sid, error } = await client.rpc('create_sale_transaction', { p_customer_id: customer_id, p_payment_type: type, p_paid: paid, p_items: rows, p_source: 'manual' });
        if (error) throw error;
        // تحديث التاريخ والعملة
        if (sid) await client.from('sales').update({ operation_date: date, currency: curr }).eq('id', sid);
        if (notify && customer_id) {
          const c = customers.find(x => x.id === customer_id);
          if (c && c.phone) {
            const items = rows.map(r => { const p = products.find(x => x.id === r.product_id); return { name: p?.name || '', qty: r.quantity, unit: p?.base_unit || '', price: r.unit_price, total: r.total }; });
            const msg = tplSale({ customer_name: c.name, items, total, paid, remaining, date: nowAr() });
            previewWhatsApp(c.phone, msg, { customer_id, ref_type: 'sale', ref_id: sid });
          }
        }
        $('saleRows').innerHTML = ''; $('saleTotal').textContent = '0';
        await loadAll(); toast('✅ تم الحفظ');
      } catch (e) { err(e); }
    };
  }
  
  // ════ حفظ فاتورة مشتريات ════
  if (typeof window.savePurchase === 'function') {
    window.savePurchase = async function() {
      const date = getFormDate('purchaseDate');
      const curr = getFormCurrency('purchaseCurrency');
      try {
        const supplier_id = $('purchaseSupplier').value, type = $('purchaseType').value;
        if (!supplier_id) return toast('اختر المورد');
        const rows = [...document.querySelectorAll('#purchaseRows .formgrid')].map(r => {
          const pid = r.querySelector('.row-prod').value, p = products.find(x => x.id === pid);
          if (!p) return null;
          const u = r.querySelector('.row-unit').value, q = Number(r.querySelector('.row-qty').value) || 0, pr = Number(r.querySelector('.row-price').value) || 0;
          let f = 1; if (u === 'carton') f = (p.carton_factor || 1) * (p.package_factor || 1); else if (u === 'pack') f = (p.package_factor || 1);
          return { product_id: pid, quantity: q, unit_price: pr, base_quantity: q * f, total: q * pr };
        }).filter(Boolean);
        if (!rows.length) return toast('أضف صنفاً');
        const total = rows.reduce((s, x) => s + x.total, 0);
        const paid = type === 'cash' ? total : (type === 'partial' ? Number($('purchasePaid').value) || 0 : 0);
        const { data: pid, error } = await client.rpc('create_purchase_transaction', { p_supplier_id: supplier_id, p_payment_type: type, p_paid: paid, p_items: rows });
        if (error) throw error;
        if (pid) await client.from('purchases').update({ operation_date: date, currency: curr }).eq('id', pid);
        $('purchaseRows').innerHTML = ''; $('purchaseTotal').textContent = '0';
        await loadAll(); toast('✅ تم الحفظ');
      } catch (e) { err(e); }
    };
  }
  
  // ════ حفظ مصروف ════
  if (typeof window.saveExpense === 'function') {
    window.saveExpense = async function() {
      const date = getFormDate('expenseDate');
      const curr = getFormCurrency('expenseCurrency');
      try {
        const title = $('expenseTitle').value.trim(), amount = Number($('expenseAmount').value) || 0;
        if (!title || amount <= 0) return toast('أدخل البيانات');
        const { error } = await client.from('expenses').insert({ title, amount, store_id: store.id, operation_date: date, currency: curr });
        if (error) throw error;
        $('expenseTitle').value = ''; $('expenseAmount').value = '';
        await updateDashboard(); toast('✅ تم التسجيل');
      } catch (e) { err(e); }
    };
  }
  
  // ════ حفظ سند ════
  if (typeof window.saveReceipt === 'function') {
    window.saveReceipt = async function() {
      const date = getFormDate('receiptDate');
      const curr = getFormCurrency('receiptCurrency');
      try {
        const type = $('receiptType').value, id = $('receiptTarget').value, amount = Number($('receiptAmount').value) || 0, note = $('receiptNote').value.trim();
        if (!id || amount <= 0) return toast('أكمل البيانات');
        const notify = $('receiptNotify').value === 'yes';
        const payload = { store_id: store.id, type, amount, note: note || null, operation_date: date, currency: curr };
        if (type === 'receive') {
          const c = customers.find(x => x.id === id);
          payload.customer_id = id; payload.phone = c?.phone || null;
          const newBal = Number(c.balance || 0) - amount;
          await client.from('customers').update({ balance: newBal }).eq('id', id);
          const { data: tr } = await client.from('customer_transactions').insert({ customer_id: id, details: 'سند قبض ' + note, amount: -amount, type: 'receipt', operation_date: date, currency: curr }).select().single();
          if (notify && c.phone) { const msg = tplReceipt({ customer_name: c.name, amount, new_balance: newBal, note, date: nowAr() }); previewWhatsApp(c.phone, msg, { customer_id: id, ref_type: 'receipt', ref_id: tr?.id }); }
        } else {
          const s = suppliers.find(x => x.id === id);
          payload.supplier_id = id;
          await client.from('suppliers').update({ balance: Number(s.balance || 0) - amount }).eq('id', id);
        }
        await client.from('receipts').insert(payload);
        $('receiptAmount').value = ''; $('receiptNote').value = '';
        await loadAll(); toast('✅ تم الحفظ');
      } catch (e) { err(e); }
    };
  }
  
  // ════ حفظ اتصالات ════
  if (typeof window.saveTelecom !== 'function') return;
  
  // ════ حفظ الديون الصوتي ════
  if (typeof window.saveVoice === 'function') {
    window.saveVoice = async function() {
      const date = getFormDate('voiceDate');
      const curr = getFormCurrency('voiceCurrency');
      try {
        const id = $('voiceCustomer').value; if (!id) return toast('اختر العميل');
        const c = customers.find(x => x.id === id);
        const items = Array.isArray(window.voiceParsedItems) ? window.voiceParsedItems : [];
        const total = Number($('voiceTotal').value) || 0, paid = Number($('voicePaid').value) || 0, debt = Number($('voiceDebt').value) || 0;
        const notify = $('voiceNotify').value === 'yes';
        if (total <= 0 && debt <= 0) return toast('حدد الأصناف أو المبلغ');
        const details = $('voiceText').value.trim();
        let refId = null;
        if (items.length) {
          const payload = items.map(it => ({ product_id: it.product_id, quantity: it.quantity, unit_price: it.unit_price, base_quantity: it.quantity, total: it.total }));
          const type = paid <= 0 ? 'credit' : (paid >= total ? 'cash' : 'partial');
          const { data: sid, error } = await client.rpc('create_sale_transaction', { p_customer_id: id, p_payment_type: type, p_paid: paid, p_items: payload, p_source: 'voice' });
          if (error) throw error;
          refId = sid;
          if (sid) await client.from('sales').update({ operation_date: date, currency: curr }).eq('id', sid);
        } else {
          const { data: tr, error: e1 } = await client.from('customer_transactions').insert({ customer_id: id, details: 'دين صوتي: ' + details, amount: debt, type: 'voice', operation_date: date, currency: curr }).select().single();
          if (e1) throw e1;
          refId = tr?.id;
          await client.from('customers').update({ balance: Number(c.balance || 0) + debt }).eq('id', id);
        }
        if (notify && c && c.phone) { const msg = tplVoice({ customer_name: c.name, items, total, paid, remaining: debt, details, date: nowAr() }); previewWhatsApp(c.phone, msg, { customer_id: id, ref_type: 'voice', ref_id: refId }); }
        $('voiceText').value = ''; $('voiceTotal').value = '0'; $('voicePaid').value = '0'; $('voiceDebt').value = '0';
        window.voiceParsedItems = [];
        $('voiceItemsBody').innerHTML = '<tr><td colspan="5">تم الحفظ</td></tr>';
        await loadAll(); toast('✅ تم تقييد الدين');
      } catch (e) { err(e); }
    };
  }
  
  // ════ حفظ حركة بنكية ════
  if (typeof window.saveBankTrans === 'function') {
    window.saveBankTrans = async function() {
      try {
        const bankId = $('btBankId').value, type = $('btType').value, amount = Number($('btAmount').value) || 0;
        const desc = $('btDesc').value.trim(), date = $('btDate').value || new Date().toISOString().slice(0,10);
        const curr = getFormCurrency('btCurrency');
        if (!bankId) return toast('البنك غير محدد');
        if (amount <= 0) return toast('أدخل مبلغاً صحيحاً');
        const b = banks.find(x => x.id === bankId);
        if (!b) return toast('البنك غير موجود');
        await client.from('bank_transactions').insert({ bank_id: bankId, type, amount, description: desc || (type === 'deposit' ? 'إيداع' : 'سحب'), operation_date: date, currency: curr });
        const newBalance = type === 'deposit' ? Number(b.current_balance || 0) + amount : Number(b.current_balance || 0) - amount;
        await client.from('bank_accounts').update({ current_balance: newBalance }).eq('id', bankId);
        closeModal('bankTransModal');
        await loadBanks(); await updateDashboard();
        toast(type === 'deposit' ? '✅ تم الإيداع' : '✅ تم السحب');
      } catch (e) { err(e); }
    };
  }
  
  console.log('✅ تم تفعيل التاريخ والعملات');
}

console.log('📅💱 date-currency.js محمّل');