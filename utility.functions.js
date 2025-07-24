// utility.functions.js

// 🔧 Normalisasi slug agar konsisten saat mapping
function normalizeSlug(text) {
  return text?.toLowerCase().trim().replace(/[^a-z0-9]/g, '') || '';
}

// 🔧 Namespace umum untuk utilitas inject SPA
window.epartUtil = {
  /**
   * 🔄 Populate postMap berdasarkan elemen tersembunyi postMappingHidden
   * Mengisi window.postMap dengan key: slug → value: URL Blogger
   */
  async populatePostMap() {
    console.log("📦 Memulai populatePostMap...");
    const postMapContainer = document.getElementById('postMappingHidden');
    if (!postMapContainer) {
      console.warn("❌ Elemen #postMappingHidden tidak ditemukan.");
      return;
    }

    const links = postMapContainer.querySelectorAll('a');
    if (!links.length) {
      console.warn("⚠️ Tidak ada link di #postMappingHidden.");
      return;
    }

    window.postMap = {};
    links.forEach(link => {
      const title = link?.textContent?.trim() || '';
      const url = link?.href || '';
      const slug = normalizeSlug(title);
      window.postMap[slug] = url;
    });

    console.log(`✅ postMap selesai: ${Object.keys(window.postMap).length} entry ditemukan.`);
  },

  /**
   * 🧩 Populate dropdown kategori kendaraan dari widget LinkList2
   */
  populateVehicleCategoryDropdown() {
    console.log("🚗 Memulai populateVehicleCategoryDropdown...");
    const selectElement = document.getElementById('vehicleCategorySelect');
    const linkListWidget = document.querySelector('#LinkList2 .widget-content ul');

    if (!selectElement) {
      console.warn("❌ Elemen #vehicleCategorySelect tidak ditemukan.");
      return;
    }
    if (!linkListWidget) {
      console.warn("⚠️ Widget LinkList2 tidak tersedia atau kosong.");
      return;
    }

    selectElement.innerHTML = '<option value="">Pilih Model Kendaraan</option>';

    Array.from(linkListWidget.children).forEach(li => {
      const anchor = li.querySelector('a');
      if (anchor) {
        const option = document.createElement('option');
        option.value = anchor.href;
        option.textContent = anchor.textContent.trim();
        selectElement.appendChild(option);
      }
    });

    console.log("✅ Dropdown kendaraan berhasil diisi.");
  }
};

// 🚀 Panggil saat DOM siap
document.addEventListener('DOMContentLoaded', async () => {
  await window.epartUtil.populatePostMap();
  window.epartUtil.populateVehicleCategoryDropdown();
});
