// File: src/ui.js
// Deskripsi: Fungsi untuk memanipulasi dan merender elemen UI.

import { formatDate, stripHtml } from 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/utils.js';

const mainContent = document.getElementById('main-content');

/**
 * Merender tampilan daftar postingan.
 * @param {Array} posts - Array objek postingan.
 */
export function renderPostList(posts) {
  if (!posts || posts.length === 0) {
    mainContent.innerHTML = '<p>Tidak ada postingan yang ditemukan.</p>';
    return;
  }

  const postElements = posts.map(post => {
    const postUrl = new URL(post.link.find(l => l.rel === 'alternate').href);
    const postPath = postUrl.pathname;
    const summary = stripHtml(post.summary.$t).substring(0, 150) + '...';

    return `
      <article class="blog-post fade-in">
        <h2><a href="#${postPath}">${post.title.$t}</a></h2>
        <div class="post-meta">
          <span>${formatDate(post.published.$t)}</span> | 
          <span>${post.author[0].name.$t}</span>
        </div>
        <div class="post-summary">
          ${summary}
        </div>
        <a href="#${postPath}" class="read-more">Baca Selengkapnya</a>
      </article>
    `;
  }).join('');

  mainContent.innerHTML = `<div class="post-list">${postElements}</div>`;
}

/**
 * Merender tampilan detail postingan.
 * @param {Object} post - Objek postingan tunggal.
 */
export function renderPostDetail(post) {
  mainContent.innerHTML = `
    <article class="blog-post fade-in">
      <h2>${post.title.$t}</h2>
      <div class="post-meta">
        <span>${formatDate(post.published.$t)}</span> | 
        <span>${post.author[0].name.$t}</span>
      </div>
      <div class="post-body">
        ${post.content.$t}
      </div>
    </article>
  `;
}

/**
 * Merender tampilan loading.
 */
export function renderLoading() {
  mainContent.innerHTML = '<p>Memuat...</p>';
}

/**
 * Merender tampilan error.
 */
export function renderError() {
  mainContent.innerHTML = '<p>Gagal memuat konten. Silakan coba lagi nanti.</p>';
}

/**
 * Merender daftar label di sidebar.
 * @param {Array} labels - Array objek label.
 */
export function renderLabels(labels) {
    const sidebarList = document.getElementById('sidebar-figure-list'); // Ganti dengan ID yang sesuai
    if (!sidebarList) return;

    const labelElements = labels.map(label => `
        <li class="figure-item">
            <a href="#/label/${label.term}">
                <strong>${label.term}</strong>
            </a>
        </li>
    `).join('');

    sidebarList.innerHTML = `<ul>${labelElements}</ul>`;
}

