/* ============================================================
   🛒 تحسينات الشراء والبيع — رصيد المورد + بحث الأصناف
   ============================================================ */

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(init, 3000);
});

function init() {
  addSupplierBalanceInfo();
  addCustomerBalanceInfo();
  watchSupplierSelection();
  watchCustomerSelection();
  watchRows();
  convertExistingRows();
  console.log('🛒 تحسينات الشراء والبيع جاهزة');
}

/* ═══════════════════════════════════════════
   💰 رصيد المورد في فاتورة المشتريات
   ═══════════════════════════════════════════ */
function addSupplierBalanceInfo() {
  const purchaseSection = document.getElementById('purchases');
  if (!purchaseSection) return;
  if (document.getElementById('supplierBalanceInfo')) return;
  
  const supplierSelect = purchaseSection.querySelector('#purchaseSupplier');
  if (!supplierSelect) return;
  
  const infoDiv = document.createElement('div');
  infoDiv.id = 'supplierBalanceInfo';
  infoDiv.style.cssText = 'display:none;margin-top:8px;padding:10px;border-radius:10px;background:#fef3c7;border:1px solid #f59e0b;font-family:Cairo,sans-serif';
  supplierSelect.parentNode.appendChild(infoDiv);
}

function watchSupplierSelection() {
  const sel = document.getElementById('purchaseSupplier');
  if (!sel) return;
  sel.addEventListener('change', updateSupplierBalance);
  updateSupplierBalance();
}

function updateSupplierBalance() {
  const sel = document.getElementById('purchaseSupplier');
  const info = document.getElementById('supplierBalanceInfo');
  if (!sel || !info) return;
  
  const id = sel.value;
  if (!id) {
    info.style.display = 'none';
    return;
  }
  
  const s = suppliers.find(x => x.id === id);
  if (!s) {
    info.style.display = 'none';
    return;
  }
  
  const balance = Number(s.balance || 0);
  info.style.display = 'block';
  
  if (balance > 0) {
    info.innerHTML = `
      <div style="font-weight:800;color:#92400e;font-size:13px">
        💰 رصيدك عند هذا المورد: <span style="color:#dc2626">${money(balance)} ${CUR()}</span>
      </div>
      <div style="font-size:11px;color:#92400e;margin-top:3px">⚠️ أنت مدين لهذا المبلغ</div>
    `;
  } else if (balance < 0) {
    info.innerHTML = `
      <div style="font-weight:800;color:#92400e;font-size:13px">
        💰 رصيدك عند هذا المورد: <span style="color:#16a34a">${money(Math.abs(balance))} ${CUR()}</span>
      </div>
      <div style="font-size:11px;color:#92400e;margin-top:3px">✅ له عندك (دفعت زيادة)</div>
    `;
  } else {
    info.innerHTML = `<div style="font-weight:800;color:#16a34a;font-size:13px">✅ لا توجد ديون متبادلة</div>`;
  }
}

/* ═══════════════════════════════════════════
   👤 رصيد العميل في فاتورة المبيعات
   ═══════════════════════════════════════════ */
function addCustomerBalanceInfo() {
  const salesSection = document.getElementById('sales');
  if (!salesSection) return;
  if (document.getElementById('customerBalanceInfo')) return;
  
  const customerSelect = salesSection.querySelector('#saleCustomer');
  if (!customerSelect) return;
  
  const infoDiv = document.createElement('div');
  infoDiv.id = 'customerBalanceInfo';
  infoDiv.style.cssText = 'display:none;margin-top:8px;padding:10px;border-radius:10px;background:#fef3c7;border:1px solid #f59e0b;font-family:Cairo,sans-serif';
  customerSelect.parentNode.appendChild(infoDiv);
}

function watchCustomerSelection() {
  const sel = document.getElementById('saleCustomer');
  if (!sel) return;
  sel.addEventListener('change', updateCustomerBalance);
  updateCustomerBalance();
}

function updateCustomerBalance() {
  const sel = document.getElementById('saleCustomer');
  const info = document.getElementById('customerBalanceInfo');
  if (!sel || !info) return;
  
  const id = sel.value;
  if (!id) {
    info.style.display = 'none';
    return;
  }
  
  const c = customers.find(x => x.id === id);
  if (!c) {
    info.style.display = 'none';
    return;
  }
  
  const balance = Number(c.balance || 0);
  const limit = Number(c.credit_limit || 0);
  info.style.display = 'block';
  
  if (balance > 0) {
    let color = '#dc2626';
    let warning = '';
    if (limit > 0 && balance >= limit * 0.8) {
      color = '#b91c1c';
      warning = '<div style="font-size:11px;color:#991b1b;margin-top:3px">⚠️ اقترب من سقف الدين!</div>';
    }
    info.innerHTML = `
      <div style="font-weight:800;color:#92400e;font-size:13px">
        💰 رصيدك السابق: <span style="color:${color}">${money(balance)} ${CUR()}</span>
        ${limit > 0 ? ` / سقف: ${money(limit)}` : ''}
      </div>
      ${warning}
    `;
  } else {
    info.innerHTML = `<div style="font-weight:800;color:#16a34a;font-size:13px">✅ لا توجد ديون سابقة</div>`;
  }
}

/* ═══════════════════════════════════════════
   🔍 بحث في الأصناف داخل صفوف الفاتورة
   ═══════════════════════════════════════════ */
function watchRows() {
  ['sale', 'purchase'].forEach(kind => {
    const box = document.getElementById(kind === 'sale' ? 'saleRows' : 'purchaseRows');
    if (!box) return;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        m.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('formgrid')) {
            enhanceRow(node, kind);
          }
        });
      });
    });
    observer.observe(box, { childList: true });
  });
}

function convertExistingRows() {
  document.querySelectorAll('#saleRows .formgrid').forEach(r => enhanceRow(r, 'sale'));
  document.querySelectorAll('#purchaseRows .formgrid').forEach(r => enhanceRow(r, 'purchase'));
}

function enhanceRow(row, kind) {
  const sel = row.querySelector('.row-prod');
  if (!sel || sel.dataset.enhanced === '1') return;
  sel.dataset.enhanced = '1';
  
  // نضيف input بحث فوق الـ select
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <input type="text" class="row-prod-search" placeholder="🔍 اكتب اسم الصنف..." 
      style="margin-bottom:4px;font-size:12px;background:#e0f2fe;border-color:#0284c7">
  `;
  sel.parentNode.insertBefore(wrapper.firstElementChild, sel);
  
  const searchInput = row.querySelector('.row-prod-search');
  searchInput.addEventListener('input', function() {
    filterRowProducts(sel, this.value);
  });
  
  // إذا الشراء → الوحدة الافتراضية كرتون
  if (kind === 'purchase') {
    setTimeout(() => {
      const unitSel = row.querySelector('.row-unit');
      if (unitSel && !unitSel.dataset.touched) {
        // سنغيّرها بعد اختيار الصنف
      }
    }, 100);
  }
}

function filterRowProducts(select, query) {
  const q = (query || '').trim().toLowerCase();
  const originalOptions = [...select.options].filter(o => o.value);
  
  // نعيد ضبط الخيارات
  if (!q) {
    select.style.display = '';
    return;
  }
  
  const matched = originalOptions.filter(o => o.text.toLowerCase().includes(q));
  
  if (matched.length === 1) {
    // اختر تلقائياً إذا كان هناك تطابق واحد فقط
    select.value = matched[0].value;
    const row = select.closest('.formgrid');
    if (row) {
      const kind = row.closest('#saleRows') ? 'sale' : 'purchase';
      setRowProduct(select, kind);
      
      // إذا كان شراء → الوحدة الافتراضية كرتون
      if (kind === 'purchase') {
        setTimeout(() => {
          const unitSel = row.querySelector('.row-unit');
          if (unitSel) {
            const cartonOpt = [...unitSel.options].find(o => o.value === 'carton');
            if (cartonOpt) {
              unitSel.value = 'carton';
              setRowPrice(unitSel, kind);
            }
          }
        }, 50);
      }
    }
  } else if (matched.length > 1 && matched.length <= 10) {
    // نعرض قائمة سريعة
    let quickBox = select.parentNode.querySelector('.quick-products');
    if (!quickBox) {
      quickBox = document.createElement('div');
      quickBox.className = 'quick-products';
      quickBox.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #0284c7;border-radius:8px;max-height:180px;overflow-y:auto;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:none';
      select.parentNode.style.position = 'relative';
      select.parentNode.appendChild(quickBox);
    }
    quickBox.innerHTML = matched.map(o => `
      <div style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;font-size:13px"
        onmouseover="this.style.background='#e0f2fe'" 
        onmouseout="this.style.background='#fff'"
        onclick="window.pickRowProduct('${o.value}', this)">
        ${o.text}
      </div>
    `).join('');
    quickBox.style.display = 'block';
  } else {
    // إذا كان هناك تطابق واحد، اختر تلقائياً
    const quickBox = select.parentNode.querySelector('.quick-products');
    if (quickBox) quickBox.style.display = 'none';
  }
}

window.pickRowProduct = function(productId, el) {
  const select = el.closest('div[style*="position"]').parentNode.querySelector('.row-prod');
  if (!select) return;
  select.value = productId;
  const row = select.closest('.formgrid');
  const kind = row.closest('#saleRows') ? 'sale' : 'purchase';
  setRowProduct(select, kind);
  
  // إذا شراء → كرتون افتراضياً
  if (kind === 'purchase') {
    setTimeout(() => {
      const unitSel = row.querySelector('.row-unit');
      if (unitSel) {
        const cartonOpt = [...unitSel.options].find(o => o.value === 'carton');
        if (cartonOpt) {
          unitSel.value = 'carton';
          setRowPrice(unitSel, kind);
        }
      }
    }, 50);
  }
  
  // إخفاء القائمة
  const box = el.parentNode;
  box.style.display = 'none';
  // تفريغ حقل البحث
  const searchInput = row.querySelector('.row-prod-search');
  if (searchInput) searchInput.value = '';
};

/* ═══════════════════════════════════════════
   📦 تعديل الوحدة الافتراضية للشراء إلى كرتون
   ═══════════════════════════════════════════ */
const originalSetRowProduct = window.setRowProduct;
if (typeof originalSetRowProduct === 'function') {
  window.setRowProduct = function(sel, kind) {
    originalSetRowProduct.call(this, sel, kind);
    
    if (kind === 'purchase') {
      setTimeout(() => {
        const row = sel.closest('.formgrid');
        if (!row) return;
        const unitSel = row.querySelector('.row-unit');
        if (unitSel) {
          const cartonOpt = [...unitSel.options].find(o => o.value === 'carton');
          if (cartonOpt && !unitSel.dataset.userTouched) {
            unitSel.value = 'carton';
            setRowPrice(unitSel, 'purchase');
          }
        }
      }, 50);
    }
  };
}

/* ═══════════════════════════════════════════
   🔍 بحث في الأصناف — الديون الصوتي (تحسين)
   ═══════════════════════════════════════════ */
function improveVoiceSearch() {
  const voiceSection = document.getElementById('voice');
  if (!voiceSection) return;
  if (document.getElementById('voiceQuickProducts')) return;
  
  // نبحث عن الحقل المناسب
  const fullDivs = voiceSection.querySelectorAll('.formgrid .full');
  if (fullDivs.length < 2) return;
  
  // نضيف قائمة بحث سريعة تحت حقل النص
  const quickBox = document.createElement('div');
  quickBox.id = 'voiceQuickProducts';
  quickBox.style.cssText = 'margin-top:10px;background:#e0f2fe;padding:10px;border-radius:10px;border:1px solid #0284c7';
  quickBox.innerHTML = `
    <label style="color:#075985;font-weight:700;font-size:13px">🔍 بحث سريع في الأصناف</label>
    <input id="voiceQuickSearch" type="text" placeholder="اكتب اسم الصنف..." style="background:#fff;margin-top:6px">
    <div id="voiceQuickResults" style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px"></div>
  `;
  
  // نضعه قبل جدول الأصناف المفككة
  const itemsPanel = voiceSection.querySelectorAll('.panel')[1];
  if (itemsPanel) {
    itemsPanel.parentNode.insertBefore(quickBox, itemsPanel);
  } else {
    voiceSection.querySelector('.panel')?.appendChild(quickBox);
  }
  
  const searchInput = document.getElementById('voiceQuickSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const q = this.value.trim().toLowerCase();
      const results = document.getElementById('voiceQuickResults');
      if (!q) { results.innerHTML = ''; return; }
      
      const matched = products.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 8);
      if (!matched.length) {
        results.innerHTML = '<span style="color:#dc2626;font-size:12px">لا توجد نتائج</span>';
        return;
      }
      results.innerHTML = matched.map(p => `
        <button class="btn small" style="font-size:11px" onclick="window.voiceQuickAdd('${p.id}')">${p.name}</button>
      `).join('');
    });
  }
}

window.voiceQuickAdd = function(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const ta = document.getElementById('voiceText');
  if (!ta) return;
  const cur = ta.value.trim();
  ta.value = cur ? cur + '، ' + p.name : p.name;
  document.getElementById('voiceQuickSearch').value = '';
  document.getElementById('voiceQuickResults').innerHTML = '';
  toast('✅ تم إضافة ' + p.name);
};

setTimeout(improveVoiceSearch, 4000);

console.log('✅ purchases-plus.js محمّل');