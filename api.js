// File: src/api.js
// Deskripsi: Mengelola semua interaksi dengan Blogger API.

import { BLOG_URL, POSTS_PER_PAGE } from './config.js';

const API_BASE = `${BLOG_URL}/feeds`;

/**
 * Mengambil daftar postingan dari Blogger API.
 * @param {number} page - Nomor halaman untuk paginasi.
 * @returns {Promise<Object>} Data feed postingan.
 */
export async function fetchPosts(page = 1) {
  const startIndex = (page - 1) * POSTS_PER_PAGE + 1;
  const url = `${API_BASE}/posts/default?alt=json&start-index=${startIndex}&max-results=${POSTS_PER_PAGE}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

/**
 * Mengambil detail satu postingan berdasarkan path.
 * @param {string} path - Path URL dari postingan.
 * @returns {Promise<Object>} Data feed postingan tunggal.
 */
export async function fetchPostByPath(path) {
  const url = `${BLOG_URL}/feeds/posts/default?alt=json&path=${path}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error fetching post by path: ${path}`, error);
    throw error;
  }
}

/**
 * Mengambil daftar postingan berdasarkan label.
 * @param {string} label - Nama label.
 * @param {number} page - Nomor halaman.
 * @returns {Promise<Object>} Data feed postingan.
 */
export async function fetchPostsByLabel(label, page = 1) {
    const startIndex = (page - 1) * POSTS_PER_PAGE + 1;
    const url = `${API_BASE}/posts/default/-/${label}?alt=json&start-index=${startIndex}&max-results=${POSTS_PER_PAGE}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error(`Error fetching posts by label: ${label}`, error);
        throw error;
    }
}

/**
 * Mengambil semua label (kategori) dari blog.
 * @returns {Promise<Array>} Daftar label.
 */
export async function fetchLabels() {
    const url = `${API_BASE}/categories/default?alt=json`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.feed.category || [];
    } catch (error) {
        console.error("Error fetching labels:", error);
        throw error;
    }
}

const dataSources = {
    ModelKendaraan: "https://opensheet.elk.sh/1viIkJBqKFFR-Ps5et71cORxxAuVfVTWEYk6Uh1ZHOHQ/ModelKendaraan",
    HotspotData: "https://opensheet.elk.sh/16YZHIc1dd0QU1bhW4Bb9-jq6LPOEGM8MbTcbo4UDLCc/HotspotData",
    KatalogData: "https://opensheet.elk.sh/1AgPWod4lDMq6I5CET74gv2oOE4sakwFRLvX7GCxFROM/KatalogData",
    PartMaster: "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"
};

async function fetchSheetData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        return []; // Return empty array on error
    }
}

export async function fetchAllData() {
    const [
        modelKendaraanList,
        katalogDataList,
        hotspotDataList,
        partMasterList
    ] = await Promise.all([
        fetchSheetData(dataSources.ModelKendaraan),
        fetchSheetData(dataSources.KatalogData),
        fetchSheetData(dataSources.HotspotData),
        fetchSheetData(dataSources.PartMaster)
    ]);

    return {
        modelKendaraanList,
        katalogDataList,
        hotspotDataList,
        partMasterList
    };
}
