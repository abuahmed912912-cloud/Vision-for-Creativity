/* ============================================================
   💰 debt-fix v3 — إعادة حساب الرصيد من الصفر
   ============================================================ */
(function() {
  
  // دالة إعادة حساب رصيد أي عميل من جدول customer_transactions
  async function recalcCustomerBalance(customerId) {
    try {
      const {data: txs, error} = await client
        .from('customer_transactions')
        .select('amount')
        .eq('customer_id', customerId);
      
      if (error) throw error;
      
      const total = (txs || []).reduce((s, t) => s + Number(t.amount || 0), 0);
      
      const {error: e2} = await client
        .from('customers')
        .update({balance: total})
        .eq('id', customerId);
      
      if (e2) throw e2;
      
      console.log('✅ رصيد جديد:', total);
      return total;
    } catch (e) {
      console.error('recalc error:', e);
      return null;
    }
  }
  
  // تصدير الدالة للاستخدام العام
  window.recalcCustomerBalance = recalcCustomerBalance;
  
  // إصلاح الزر في قائمة العملاء
  setTimeout(() => {
    const panel = document.querySelector('#customers .panel');
    if (!panel || document.getElementById('btnRecalcAll')) return;
    const btn = document.createElement('button');
    btn.id = 'btnRecalcAll';
    btn.className = 'btn small';
    btn.style.cssText = 'background:#0891b2;color:#fff;margin-top:8px';
    btn.innerHTML = '🔄 إصلاح جميع أرصدة العملاء';
    btn.onclick = async () => {
      if (!confirm('سيتم إعادة حساب رصيد كل عميل من كشف حساباته. متابعة؟')) return;
      toast('⏳ جاري الإصلاح...');
      let count = 0;
      for (const c of customers) {
        await recalcCustomerBalance(c.id);
        count++;
      }
      await loadCustomers();
      toast(`✅ تم إصلاح ${count} عميل`);
    };
    panel.appendChild(btn);
  }, 3000);
  
  // دالة بناء رسالة المبيعات
  function buildSaleMessage(opts) {
    const {customer_name, items, total, paid, remaining, date, prev_balance, new_balance} = opts;
    
    const lines = items.map((it, i) =>
      `  ${i+1}) ${it.name} — ${it.qty} ${it.unit||''} × ${money(it.price)} = ${money(it.total)} ${CUR()}`
    ).join('\n');
    
    const prev = Number(prev_balance || 0);
    const newBal = Number(new_balance || 0);
    
    let debtLine = '';
    if (prev > 0 && remaining > 0) {
      debtLine = `\n━━━━━━━━━━━━━━━\n` +
        `💼 *رصيدك السابق:* ${money(prev)} ${CUR()}\n` +
        `🆕 *هذه الفاتورة:* ${money(remaining)} ${CUR()}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📌 *إجمالي مديونيتك: ${money(newBal)} ${CUR()}*`;
    } else if (remaining > 0) {
      debtLine = `\n━━━━━━━━━━━━━━━\n` +
        `📌 *إجمالي مديونيتك: ${money(newBal || remaining)} ${CUR()}*`;
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
      debtLine + `\n` +
      `━━━━━━━━━━━━━━━\n` +
      `${SHOP_SETTINGS.shop_name}`;
  }
  
  window.tplSale = function(data) {
    return buildSaleMessage({
      customer_name: data.customer_name,
      items: data.items,
      total: data.total, paid: data.paid, remaining: data.remaining,
      date: data.date,
      prev_balance: data.prev_balance || 0,
      new_balance: data.new_balance
    });
  };
  
  window.saveSale = async function() {
    try {
      const customer_id = $('saleCustomer').value || null;
      const type = $('saleType').value;
      if (type !== 'cash' && !customer_id) return toast('اختر عميلاً للآجل');
      
      // 1. اقرأ الرصيد الحالي من DB
      let prev_balance = 0;
      if (customer_id) {
        const {data: c1} = await client.from('customers').select('balance').eq('id', customer_id).single();
        if (c1) prev_balance = Number(c1.balance || 0);
      }
      
      // 2. جهّز الأصناف
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
      
      // 3. استدعِ RPC
      const {data: sid, error} = await client.rpc('create_sale_transaction', {
        p_customer_id: customer_id,
        p_payment_type: type,
        p_paid: paid,
        p_items: rows,
        p_source: 'manual'
      });
      if (error) throw error;
      
      // 4. ⭐ أعد حساب الرصيد من الصفر
      let new_balance = prev_balance + remaining;
      if (customer_id) {
        const recalculated = await recalcCustomerBalance(customer_id);
        if (recalculated !== null) {
          new_balance = recalculated;
        }
      }
      
      // 5. واتساب
      if (notify && customer_id) {
        const c = customers.find(x => x.id === customer_id);
        if (c && c.phone) {
          const items = rows.map(r => {
            const p = products.find(x => x.id === r.product_id);
            return {name: p?.name || '', qty: r.quantity, unit: p?.base_unit || '', price: r.unit_price, total: r.total};
          });
          const msg = buildSaleMessage({
            customer_name: c.name,
            items, total, paid, remaining,
            date: nowAr(),
            prev_balance: prev_balance,
            new_balance: new_balance
          });
          previewWhatsApp(c.phone, msg, {customer_id, ref_type: 'sale', ref_id: sid});
        }
      }
      
      $('saleRows').innerHTML = '';
      $('saleTotal').textContent = '0';
      await loadAll();
      toast('✅ تم الحفظ');
    } catch (e) { err(e); }
  };
  
  console.log('💰 debt-fix.js v3 محمّل');
})();