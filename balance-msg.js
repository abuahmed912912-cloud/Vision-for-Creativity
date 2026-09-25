/* ============================================================
   💰 إصلاح: رسالة واتساب تشمل الرصيد السابق + الجديد
   ============================================================ */
(function() {
  if (typeof window.tplSale !== 'function') {
    console.warn('⚠️ tplSale غير موجود');
    return;
  }
  
  // استبدال قالب رسالة البيع
  window.tplSale = function({customer_name, items, total, paid, remaining, date, prev_balance}) {
    const lines = items.map((it, i) =>
      `  ${i+1}) ${it.name} — ${it.qty} ${it.unit||''} × ${money(it.price)} = ${money(it.total)} ${CUR()}`
    ).join('\n');
    
    const prevBal = Number(prev_balance || 0);
    const newTotal = prevBal + Number(remaining || 0);
    
    let extra = '';
    if (prevBal > 0 && remaining > 0) {
      extra = `\n━━━━━━━━━━━━━━━\n💼 رصيدك السابق: ${money(prevBal)} ${CUR()}\n🆕 هذه الفاتورة: ${money(remaining)} ${CUR()}\n📌 *إجمالي مديونيتك: ${money(newTotal)} ${CUR()}*`;
    }
    
    return `🧾 *فاتورة مبيعات — ${SHOP_SETTINGS.shop_name}*\n` +
      `━━━━━━━━━━━━━━━\n` +
      `👤 العميل: ${customer_name}\n` +
      `📅 ${date}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `📦 الأصناف:\n${lines}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `💰 الإجمالي: ${money(total)} ${CUR()}\n` +
      `✅ المدفوع: ${money(paid)} ${CUR()}\n` +
      `📌 المتبقي: ${money(remaining)} ${CUR()}` +
      extra + `\n` +
      `${remaining > 0 ? '\n⚠️ يُرجى السداد قريباً\n' : '\n✅ شكراً لتعاملكم\n'}` +
      `━━━━━━━━━━━━━━━\n` +
      `${SHOP_SETTINGS.shop_name}`;
  };
  
  // استبدال saveSale للتمرير الرصيد السابق
  window.saveSale = async function() {
    try {
      const customer_id = $('saleCustomer').value || null;
      const type = $('saleType').value;
      if (type !== 'cash' && !customer_id) return toast('اختر عميلاً للآجل');
      
      const cBefore = customer_id ? customers.find(x => x.id === customer_id) : null;
      const prev_balance = cBefore ? Number(cBefore.balance || 0) : 0;
      
      const rows = [...document.querySelectorAll('#saleRows .formgrid')].map(r => {
        const pid = r.querySelector('.row-prod').value;
        const p = products.find(x => x.id === pid);
        if (!p) return null;
        const u = r.querySelector('.row-unit').value;
        const q = Number(r.querySelector('.row-qty').value) || 0;
        const pr = Number(r.querySelector('.row-price').value) || 0;
        let f = 1;
        if (u === 'carton') f = (p.carton_factor || 1) * (p.package_factor || 1);
        else if (u === 'pack') f = (p.package_factor || 1);
        return {product_id: pid, quantity: q, unit_price: pr, base_quantity: q * f, total: q * pr};
      }).filter(Boolean);
      
      if (!rows.length) return toast('أضف صنفاً');
      const total = rows.reduce((s, x) => s + x.total, 0);
      const paid = type === 'cash' ? total : (type === 'partial' ? Number($('salePaid').value) || 0 : 0);
      const remaining = total - paid;
      const notify = $('saleNotify').value === 'yes';
      
      const {data: sid, error} = await client.rpc('create_sale_transaction', {
        p_customer_id: customer_id,
        p_payment_type: type,
        p_paid: paid,
        p_items: rows,
        p_source: 'manual'
      });
      if (error) throw error;
      
      if (notify && customer_id) {
        const c = customers.find(x => x.id === customer_id);
        if (c && c.phone) {
          const items = rows.map(r => {
            const p = products.find(x => x.id === r.product_id);
            return {name: p?.name || '', qty: r.quantity, unit: p?.base_unit || '', price: r.unit_price, total: r.total};
          });
          const msg = window.tplSale({
            customer_name: c.name,
            items, total, paid, remaining,
            date: nowAr(),
            prev_balance: prev_balance
          });
          previewWhatsApp(c.phone, msg, {customer_id, ref_type: 'sale', ref_id: sid});
        }
      }
      
      $('saleRows').innerHTML = '';
      $('saleTotal').textContent = '0';
      await loadAll();
      toast('تم الحفظ');
    } catch (e) { err(e); }
  };
  
  console.log('💰 balance-msg.js محمّل');
})();