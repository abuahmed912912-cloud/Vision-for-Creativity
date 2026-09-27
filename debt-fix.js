/* ============================================================
   💰 debt-fix v2 — قراءة الرصيد من قاعدة البيانات مباشرة
   ============================================================ */
(function() {
  
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
      total: data.total,
      paid: data.paid,
      remaining: data.remaining,
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
      
      // ⭐ 1. اقرأ الرصيد الحقيقي من قاعدة البيانات مباشرة
      let prev_balance = 0;
      if (customer_id) {
        const {data: freshC, error: eC} = await client
          .from('customers')
          .select('balance')
          .eq('id', customer_id)
          .single();
        if (!eC && freshC) {
          prev_balance = Number(freshC.balance || 0);
        }
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
      
      // ⭐ 3. استدعِ RPC لحفظ الفاتورة
      const {data: sid, error} = await client.rpc('create_sale_transaction', {
        p_customer_id: customer_id,
        p_payment_type: type,
        p_paid: paid,
        p_items: rows,
        p_source: 'manual'
      });
      if (error) throw error;
      
      // ⭐ 4. اقرأ الرصيد الجديد من قاعدة البيانات
      let new_balance = prev_balance + remaining;
      if (customer_id) {
        const {data: afterC, error: eA} = await client
          .from('customers')
          .select('balance')
          .eq('id', customer_id)
          .single();
        
        if (!eA && afterC) {
          const afterBal = Number(afterC.balance || 0);
          
          // ⭐ إذا لم يتغير الرصيد → حدّثه يدوياً
          if (afterBal === prev_balance && remaining > 0) {
            new_balance = prev_balance + remaining;
            await client.from('customers')
              .update({balance: new_balance})
              .eq('id', customer_id);
            console.log('✅ تم تحديث الرصيد يدوياً:', new_balance);
          } else {
            new_balance = afterBal;
          }
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
  
  console.log('💰 debt-fix.js v2 محمّل');
})();