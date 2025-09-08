// File: src/api.js
// Deskripsi: Modul API untuk Blogger dan Spreadsheet (opensheet.elk.sh)

import { BLOG_URL, POSTS_PER_PAGE } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main//config.js';

const API_BASE = `${BLOG_URL}/feeds`;
const DEBUG = true; // Aktifkan log saat development

// =======================
// 🔹 BLOGGER API SECTION
// =======================

export async function fetchPosts(page = 1) {
  const startIndex = (page - 1) * POSTS_PER_PAGE + 1;
  const url = `${API_BASE}/posts/default?alt=json&start-index=${startIndex}&max-results=${POSTS_PER_PAGE}`;
  return await fetchJson(url, `fetchPosts page ${page}`);
}

export async function fetchPostByPath(path) {
  const url = `${BLOG_URL}/feeds/posts/default?alt=json&path=${encodeURIComponent(path)}`;
  return await fetchJson(url, `fetchPostByPath ${path}`);
}

export async function fetchPostsByLabel(label, page = 1) {
  const startIndex = (page - 1) * POSTS_PER_PAGE + 1;
  const url = `${API_BASE}/posts/default/-/${encodeURIComponent(label)}?alt=json&start-index=${startIndex}&max-results=${POSTS_PER_PAGE}`;
  return await fetchJson(url, `fetchPostsByLabel ${label}`);
}

export async function fetchLabels() {
  const url = `${API_BASE}/categories/default?alt=json`;
  const data = await fetchJson(url, 'fetchLabels');
  return data?.feed?.category || [];
}

// =======================
// 🔹 SPREADSHEET API SECTION
// =======================

const sheetSources = {
  ModelKendaraan: 'https://opensheet.elk.sh/1viIkJBqKFFR-Ps5et71cORxxAuVfVTWEYk6Uh1ZHOHQ/ModelKendaraan',
  HotspotData: 'https://opensheet.elk.sh/16YZHIc1dd0QU1bhW4Bb9-jq6LPOEGM8MbTcbo4UDLCc/HotspotData',
  KatalogData: 'https://opensheet.elk.sh/1AgPWod4lDMq6I5CET74gv2oOE4sakwFRLvX7GCxFROM/KatalogData',
  PartMaster: 'https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster'
};

export async function fetchSheetData(sheetName) {
  const url = sheetSources[sheetName];
  if (!url) {
    console.warn(`❌ Sheet "${sheetName}" tidak ditemukan di sheetSources`);
    return [];
  }
  const data = await fetchJson(url, `fetchSheetData ${sheetName}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchAllData() {
  const keys = Object.keys(sheetSources);
  const results = await Promise.all(
    keys.map(async (key) => {
      const data = await fetchSheetData(key);
      if (DEBUG) console.log(`✅ ${key} loaded (${data.length} rows)`);
      return data;
    })
  );

  const [modelKendaraanList, hotspotDataList, katalogDataList, partMasterList] = results;
  return { modelKendaraanList, hotspotDataList, katalogDataList, partMasterList };
}

// =======================
// 🔹 HELPER FUNCTION
// =======================

async function fetchJson(url, context = '') {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (DEBUG) console.log(`📡 ${context} success`, json);
    return json;
  } catch (err) {
    console.error(`⚠️ ${context} failed`, err);
    return null;
  }
}
