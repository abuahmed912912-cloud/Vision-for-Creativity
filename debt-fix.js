/* ============================================================
   💰 debt-fix v5 — حساب الرصيد السابق من الحركات
   ============================================================ */
(function() {

  // ⭐ دالة قراءة الرصيد — إذا كان balance=0 نعيد حسابه من الحركات
  async function getCustomerBalance(customerId) {
    if (!customerId) return 0;
    try {
      const {data, error} = await client
        .from('customers')
        .select('balance')
        .eq('id', customerId)
        .single();
      if (error) throw error;
      
      let bal = Number(data?.balance || 0);
      
      // ⭐ إذا كان الرصيد 0، احسبه من الحركات
      if (bal === 0) {
        const {data: txs} = await client
          .from('customer_transactions')
          .select('amount')
          .eq('customer_id', customerId);
        
        if (txs && txs.length > 0) {
          bal = txs.reduce((s, t) => s + Number(t.amount || 0), 0);
          console.log('📊 حسبت الرصيد من الحركات:', bal);
        }
      }
      
      return bal;
    } catch (e) {
      console.warn('getBalance error:', e);
      return 0;
    }
  }

  function buildSaleMessage(opts) {
    const {customer_name, items, total, paid, remaining, date, prev_balance, new_balance} = opts;

    const lines = items.map((it, i) =>
      `  ${i+1}) ${it.name} — ${it.qty} ${it.unit||''} × ${money(it.price)} = ${money(it.total)} ${CUR()}`
    ).join('\n');

    const prev = Number(prev_balance || 0);
    const newBal = Number(new_balance || 0);

    let debtBlock = '';
    if (prev > 0 && remaining > 0) {
      debtBlock = `\n━━━━━━━━━━━━━━━\n` +
        `💼 *رصيدك السابق:* ${money(prev)} ${CUR()}\n` +
        `🆕 *هذه الفاتورة:* ${money(remaining)} ${CUR()}\n` +
        `━━━━━━━━━━━━━━━\n` +
        `📌 *إجمالي مديونيتك: ${money(newBal)} ${CUR()}*`;
    } else if (remaining > 0) {
      debtBlock = `\n━━━━━━━━━━━━━━━\n` +
        `📌 *إجمالي مديونيتك: ${money(newBal || remaining)} ${CUR()}*`;
    } else if (prev > 0) {
      debtBlock = `\n━━━━━━━━━━━━━━━\n` +
        `📌 *رصيدك الحالي: ${money(prev)} ${CUR()}*`;
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
      debtBlock + `\n` +
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

      // 1. اقرأ الرصيد (مع حساب بديل إذا كان 0)
      const prev_balance = await getCustomerBalance(customer_id);
      console.log('💰 prev_balance:', prev_balance);

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

      // 4. الرصيد الجديد = السابق + المتبقي
      const new_balance = prev_balance + remaining;
      console.log('💰 new_balance:', new_balance);

      // 5. حدّث الرصيد في DB لضمان التزامن
      if (customer_id && remaining > 0) {
        await client.from('customers').update({balance: new_balance}).eq('id', customer_id);
      }

      // 6. واتساب
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

  // زر إصلاح الأرصدة
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
      let n = 0;
      for (const c of customers) {
        try {
          const {data: txs} = await client.from('customer_transactions').select('amount').eq('customer_id', c.id);
          const total = (txs || []).reduce((s, t) => s + Number(t.amount || 0), 0);
          await client.from('customers').update({balance: total}).eq('id', c.id);
          n++;
        } catch (e) {}
      }
      await loadCustomers();
      toast(`✅ تم إصلاح ${n} عميل`);
    };
    panel.appendChild(btn);
  }, 3000);

  console.log('💰 debt-fix.js v5 محمّل');
})();