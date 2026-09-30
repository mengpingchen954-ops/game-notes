const DB_NAME = 'game-notes.attachments';
const DB_VERSION = 1;
const STORE_NAME = 'files';

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('附件存储失败'));
  });
}

function openDb() {
  if (!globalThis.indexedDB) throw new Error('当前浏览器不支持附件存储');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, {keyPath: 'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('附件存储失败'));
  });
}

async function withStore(mode, action) {
  const db = await openDb();
  try {
    const transaction = db.transaction(STORE_NAME, mode);
    const complete = new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error || new Error('附件存储失败'));
      transaction.onabort = () => reject(transaction.error || new Error('附件存储失败'));
    });
    const result = await action(transaction.objectStore(STORE_NAME));
    await complete;
    return result;
  } finally {
    db.close();
  }
}

export async function putAttachment(id, blob) {
  return withStore('readwrite', store => requestResult(store.put({id, blob})));
}

export async function getAttachment(id) {
  const result = await withStore('readonly', store => requestResult(store.get(id)));
  return result?.blob || null;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('附件读取失败'));
    reader.readAsDataURL(blob);
  });
}

export async function storeRecordAttachments(records) {
  for (const record of records) {
    for (const file of record.attachments || []) {
      if (typeof file.data === 'string' && file.data.startsWith('data:')) await putAttachment(file.id, await (await fetch(file.data)).blob());
    }
  }
}

export function withoutAttachmentData(records) {
  return records.map(record => ({
    ...record,
    attachments: (record.attachments || []).map(({data, ...file}) => file),
  }));
}

export async function hydrateAttachments(records) {
  const hydrated = [];
  for (const record of records) {
    const attachments = [];
    for (const file of record.attachments || []) {
      if (typeof file.data === 'string' && file.data.startsWith('data:')) {
        await putAttachment(file.id, await (await fetch(file.data)).blob());
        attachments.push(file);
        continue;
      }
      const blob = await getAttachment(file.id);
      attachments.push(blob ? {...file, data: await blobToDataUrl(blob)} : file);
    }
    hydrated.push({...record, attachments});
  }
  return hydrated;
}

export async function removeUnreferencedAttachments(records) {
  const referenced = new Set(records.flatMap(record => (record.attachments || []).map(file => file.id)));
  await withStore('readwrite', async store => {
    const keys = await requestResult(store.getAllKeys());
    await Promise.all(keys.filter(key => !referenced.has(key)).map(key => requestResult(store.delete(key))));
  });
}
