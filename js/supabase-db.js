/* ============================================================
   Shyraq — Supabase дерекқор қабаты (төлемдер, чектер, параметрлер)
   supabase-auth.js-тен КЕЙІН жүктеледі (ортақ клиентті қолданады).
   Барлық функция Supabase бапталмаса/кесте болмаса — қауіпсіз null/false
   қайтарады (сайт localStorage-пен жұмысын жалғастырады).
   ============================================================ */
(function () {
  function sb() {
    try { return (window.ShyraqAuth && window.ShyraqAuth._client) ? window.ShyraqAuth._client() : null; }
    catch (e) { return null; }
  }

  async function getSettings(key) {
    const c = sb(); if (!c) return null;
    try {
      const { data, error } = await c.from('settings').select('value').eq('key', key).maybeSingle();
      if (error) return null;
      return data ? data.value : null;
    } catch (e) { return null; }
  }

  async function saveSettings(key, value) {
    const c = sb(); if (!c) return false;
    try {
      const { error } = await c.from('settings').upsert({ key: key, value: value, updated_at: new Date().toISOString() });
      return !error;
    } catch (e) { return false; }
  }

  async function uploadReceipt(file) {
    const c = sb(); if (!c || !file) return '';
    try {
      const safe = (file.name || 'receipt').replace(/[^\w.\-]/g, '_');
      const path = 'r/' + Date.now() + '_' + safe;
      const up = await c.storage.from('receipts').upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (up.error) return '';
      const { data } = c.storage.from('receipts').getPublicUrl(path);
      return (data && data.publicUrl) || '';
    } catch (e) { return ''; }
  }

  async function createPayment(p) {
    const c = sb(); if (!c) return null;
    try {
      const { data, error } = await c.from('payments').insert(p).select().maybeSingle();
      if (error) return null;
      return data;
    } catch (e) { return null; }
  }

  async function listPayments() {
    const c = sb(); if (!c) return null;
    try {
      const { data, error } = await c.from('payments').select('*').order('created_at', { ascending: false }).limit(500);
      if (error) return null;
      return data || [];
    } catch (e) { return null; }
  }

  async function updatePayment(id, patch) {
    const c = sb(); if (!c) return false;
    try { const { error } = await c.from('payments').update(patch).eq('id', id); return !error; }
    catch (e) { return false; }
  }

  async function getAccess(email) {
    const c = sb(); if (!c || !email) return null;
    try {
      const { data, error } = await c.from('access').select('*').eq('email', email.toLowerCase()).maybeSingle();
      if (error) return null;
      return data || null;
    } catch (e) { return null; }
  }
  async function setAccess(email, patch) {
    const c = sb(); if (!c || !email) return false;
    try {
      const row = Object.assign({ email: email.toLowerCase(), updated_at: new Date().toISOString() }, patch);
      let { error } = await c.from('access').upsert(row);
      // 'energy_total' бағаны әлі қосылмаған болса (миграция орындалмаған) —
      // энергия жоғалмас үшін онсыз қайта жазамыз.
      if (error && 'energy_total' in row) {
        delete row.energy_total;
        ({ error } = await c.from('access').upsert(row));
      }
      return !error;
    } catch (e) { return false; }
  }
  async function listAccess() {
    const c = sb(); if (!c) return null;
    try { const { data, error } = await c.from('access').select('*'); if (error) return null; return data || []; }
    catch (e) { return null; }
  }
  async function listProfiles() {
    const c = sb(); if (!c) return null;
    try { const { data, error } = await c.from('profiles').select('*').limit(1000); if (error) return null; return data || []; }
    catch (e) { return null; }
  }

  async function deletePayment(id) {
    const c = sb(); if (!c) return false;
    try { const { error } = await c.from('payments').delete().eq('id', id); return !error; }
    catch (e) { return false; }
  }

  window.ShyraqDB = { getSettings, saveSettings, uploadReceipt, createPayment, listPayments, updatePayment, deletePayment, getAccess, setAccess, listAccess, listProfiles, ready: () => !!sb() };
})();
