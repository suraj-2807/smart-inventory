// Helper to get the current storeId from localStorage
export function getStoreId() {
  const keys = ["adminAuth", "staffAuth", "deliveryAuth"];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.storeId) return data.storeId;
      } catch { continue; }
    }
  }
  return null;
}

// Helper to get store name
export function getStoreName() {
  const keys = ["adminAuth", "staffAuth", "deliveryAuth"];
  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        if (data.storeName) return data.storeName;
      } catch { continue; }
    }
  }
  return "My Store";
}
