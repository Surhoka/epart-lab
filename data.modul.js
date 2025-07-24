document.addEventListener('DOMContentLoaded', function() {
  // Fungsi utilitas untuk menambahkan kelas CSS dengan aman
  function safeAddClass(element, ...classNames) {
      if (element && element.classList) {
          element.classList.add(...classNames);
      }
  }

  // Elemen toast kustom
  const customToast = document.getElementById('customToast');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimeout; // Variabel untuk menyimpan ID timeout

  // Fungsi untuk menampilkan toast kustom
  function showMessageBox(message) {
      if (customToast && toastMessage) {
          // Hapus timeout yang ada untuk mencegah tumpang tindih toast
          clearTimeout(toastTimeout);
          
          toastMessage.textContent = message;
          customToast.style.display = 'block'; // Jadikan terlihat
          customToast.classList.add('show'); // Tambahkan kelas 'show' untuk transisi

          // Sembunyikan toast secara otomatis setelah 3 detik
          toastTimeout = setTimeout(() => {
              customToast.classList.remove('show'); // Hapus kelas 'show' untuk transisi keluar
              // Setelah transisi, atur display ke none untuk menghapusnya dari layout
              setTimeout(() => {
                  customToast.style.display = 'none';
              }, 400); // Sesuaikan dengan durasi transisi CSS
          }, 3000); // 3 detik
      }
  }

  /**
   * Secara rekursif membuat struktur menu bersarang dari daftar tautan datar.
   * Tautan yang dimulai dengan garis bawah diperlakukan sebagai sub-item.
   * Contoh: "Parent", "_Child1", "__Grandchild", "_Child2"
   * @param {Array<Object>} items - Array objek tautan {name: string, target: string}
   * @param {number} startIndex - Indeks untuk mulai memproses dalam array item.
   * @param {number} currentLevel - Tingkat bersarang saat ini (0 untuk tingkat atas, 1 untuk sub-menu, dll.)
   * @returns {{ul: HTMLElement, nextIndex: number}} Elemen UL yang dibangun dan indeks berikutnya untuk diproses.
   */
  function createNestedMenu(items, startIndex, currentLevel) {
      const currentLevelUl = document.createElement('ul');
      let i = startIndex;

      while (i < items.length) {
          const item = items[i];
          const itemName = item.name.trim(); // Hapus spasi di sini
          const leadingUnderscores = (itemName.match(/^_+/) || [''])[0].length;
          const cleanName = itemName.replace(/^_+/, '');

          console.log(`📌 [createMenu] Level: ${currentLevel}, Item: "${cleanName}", Underscores: ${leadingUnderscores}`); // Log detail item

          if (leadingUnderscores === currentLevel) {
              const li = document.createElement('li');
              const isTopLevel = currentLevel === 0;

              safeAddClass(
                  li,
                  'relative',
                  `depth-${currentLevel}`,
                  'group',
                  ...(isTopLevel ? ['w-full', 'md:w-auto'] : ['w-full'])
              );

              const anchor = document.createElement('a');
              anchor.href = item.target;
              anchor.textContent = cleanName;
              safeAddClass(anchor, 'main-menu-item');

              // Periksa apakah ada anak setelah item ini
              const nextItem = items[i + 1];
              const nextLevel =
                  nextItem && (nextItem.name.trim().match(/^_+/) || [''])[0].length;

              if (nextLevel > currentLevel) {
                  safeAddClass(anchor, 'flex', 'items-center', 'justify-between', 'dropdown-toggle');

                  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                  arrow.setAttribute('class', 'w-4 h-4 ml-1 transform transition-transform duration-200 dropdown-arrow');
                  arrow.setAttribute('fill', 'none');
                  arrow.setAttribute('stroke', 'currentColor');
                  arrow.setAttribute('viewBox', '0 0 24 24');
                  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                  path.setAttribute('stroke-linecap', 'round');
                  path.setAttribute('stroke-linejoin', 'round');
                  path.setAttribute('stroke-width', '2');
                  path.setAttribute('d', 'M19 9l-7 7-7-7');
                  arrow.appendChild(path);
                  anchor.appendChild(arrow);

                  li.appendChild(anchor); // Tambahkan anchor ke li

                  const nested = createNestedMenu(items, i + 1, currentLevel + 1);
                  const subUl = nested.ul;

                  safeAddClass(subUl, `depth-${currentLevel + 1}`, 'py-2', 'w-full');
                  safeAddClass(subUl, currentLevel === 0 ? 'dropdown-menu' : 'dropdown-submenu');
                  li.appendChild(subUl);

                  // Tambahkan event listener klik untuk desktop dan mobile
                  anchor.addEventListener('click', (e) => {
                      e.preventDefault(); // Selalu cegah navigasi default untuk toggle dropdown
                      li.classList.toggle('show-dropdown');
                  });

                  i = nested.nextIndex - 1; // -1 karena akan di++ di akhir
              } else {
                  li.appendChild(anchor); // Tambahkan anchor ke li
              }

              currentLevelUl.appendChild(li);
              i++;
          } else if (leadingUnderscores < currentLevel) {
              console.log(`↩ [createMenu] Kembali dari level ${currentLevel} ke ${leadingUnderscores}.`); // Log saat kembali
              break; // Kembali ke induk sebelumnya
          } else {
              console.warn(`✳ Menu "${itemName}" melewati satu level. Melewati.`);
              i++;
          }
      }

      return { ul: currentLevelUl, nextIndex: i };
  }

  const buildTree = (links) => {
    const tree = [];
    const parents = []; // Menyimpan referensi ke node induk di setiap kedalaman

    links.forEach(raw => {
        // Hitung kedalaman berdasarkan jumlah garis bawah
        const depth = (raw.name.trim().match(/^_+/) || [''])[0].length; // Hapus spasi di sini juga
        const name = raw.name.replace(/^_*/, ''); // Hapus garis bawah dari nama

        const node = {
            name: name,
            href: raw.target,
            children: []
        };

        if (depth === 0) {
            // Ini adalah item menu tingkat atas
            tree.push(node);
            parents[0] = node; // Atur sebagai induk untuk kedalaman 0
        } else {
            // Ini adalah sub-item
            const parent = parents[depth - 1]; // Dapatkan induk dari kedalaman sebelumnya
            if (parent) {
                parent.children.push(node);
                parents[depth] = node; // Atur sebagai induk untuk kedalaman saat ini
            } else {
                console.warn(`⚠️ Item "${name}" (kedalaman ${depth}) tidak memiliki induk yang sesuai.`);
            }
        }
    });
    return tree;
  };

  // Mengubah mobileMenuButton menjadi mobileMenuButtonInNav karena ID-nya berubah
  const mobileMenuButtonInNav = document.getElementById('mobile-menu-button-in-nav');
  const mainMenuNav = document.getElementById('main-menu-nav');

  // Dapatkan tautan awal langsung dari elemen UL #main-menu-nav
  // Pastikan data-original-name diambil dengan benar
  const initialLinks = Array.from(mainMenuNav.children).map(li => {
      const anchor = li.querySelector('a');
      return {
          name: anchor ? anchor.getAttribute('data-original-name') || anchor.textContent.trim() : '',
          target: anchor ? anchor.href : '#',
          element: li // Simpan referensi ke li asli
      };
  }).filter(link => link.name); // Saring tautan yang berpotensi kosong

  console.log('Tautan Awal dari b:loop (main-menu-nav):', initialLinks);

  // Hapus item menu yang ada dari mainMenuNav sebelum membangun kembali
  // Ini penting karena Blogger sudah merender item datar di sini.
  while (mainMenuNav.firstChild) {
      mainMenuNav.removeChild(mainMenuNav.firstChild);
  }
  
  if (initialLinks.length) {
    // Tidak perlu memanggil buildTree secara eksplisit di sini jika createNestedMenu sudah menanganinya
    // const tree = buildTree(initialLinks); // Ini hanya untuk visualisasi struktur, tidak digunakan untuk rendering

    // Render menu utama (desktop dan mobile)
    const finalMenuUlContent = createNestedMenu(initialLinks, 0, 0).ul;
    while (finalMenuUlContent.firstChild) {
        mainMenuNav.appendChild(finalMenuUlContent.firstChild);
    }
    console.log('Menu utama dirender (struktur desktop dan mobile).');
  } else {
    console.log('Tidak ada tautan awal yang ditemukan untuk merender menu. Harap periksa pengaturan widget LinkList Blogger Anda.');
  }

  // Fungsionalitas tombol menu mobile (hamburger)
  if (mobileMenuButtonInNav && mainMenuNav) {
      mobileMenuButtonInNav.addEventListener('click', function() {
          mainMenuNav.classList.toggle('show'); // Toggle kelas 'show' pada mainMenuNav
      });
  }

  // Tutup dropdown jika diklik di luar
  document.addEventListener('click', function(e) {
      // Tutup menu utama mobile jika terbuka
      if (mainMenuNav && mainMenuNav.classList.contains('show') && !mainMenuNav.contains(e.target) && e.target !== mobileMenuButtonInNav) {
          mainMenuNav.classList.remove('show');
      }

      // Tutup dropdown/submenu bersarang jika diklik di luar li induk
      document.querySelectorAll('.group.show-dropdown').forEach(liWithDropdown => { // Target li dengan 'show-dropdown'
          const dropdownMenu = liWithDropdown.querySelector('.dropdown-menu, .dropdown-submenu');
          
          if (dropdownMenu && !liWithDropdown.contains(e.target)) { // Periksa apakah klik di luar li
              liWithDropdown.classList.remove('show-dropdown');
          }
      });
  });

  // --- Fungsi untuk dropdown "Pilih Kategori Kendaraan" ---
  const vehicleCategorySelect = document.getElementById('vehicleCategorySelect');
  // Dapatkan referensi ke UL di dalam LinkList2 untuk mendapatkan data
  const linkList2Data = document.querySelector('#LinkList2 .widget-content ul');

  function populateVehicleCategoryDropdown() {
      if (linkList2Data && vehicleCategorySelect) {
          vehicleCategorySelect.innerHTML = '<option value="">Pilih Model Kendaraan</option>';
          const categoryLinks = Array.from(linkList2Data.querySelectorAll('li a'));

          categoryLinks.forEach(link => {
              const categoryName = link.textContent.trim();
              const categoryUrl = link.href;
              if (categoryName) {
                  const option = document.createElement('option');
                  option.value = categoryUrl; // Gunakan URL sebagai nilai
                  option.textContent = categoryName;
                  vehicleCategorySelect.appendChild(option);
              }
          });
      } else {
          console.warn('PERINGATAN: Elemen data LinkList2 atau dropdown vehicleCategorySelect tidak ditemukan untuk mengisi kategori kendaraan.');
      }
  }

  // Event listener untuk menavigasi ke URL saat opsi dipilih
  if (vehicleCategorySelect) {
      vehicleCategorySelect.addEventListener('change', function() {
          const selectedUrl = this.value;
          if (selectedUrl) {
              // Gunakan navigasi SPA untuk pemilihan kategori
              loadPageContent(selectedUrl);
          }
      });
  }

  // Panggil fungsi untuk mengisi dropdown saat DOM dimuat
  populateVehicleCategoryDropdown();

  // --- Fungsionalitas Modal Estimasi dengan LocalStorage ---
  const openEstimasiModalBtn = document.getElementById('openEstimasiModal');
  
  // Lanjutkan inisialisasi modal hanya jika tombol ada di halaman
  if (openEstimasiModalBtn) {
      const estimasiModal = document.getElementById('estimasiModal');
      const closeEstimasiModalBtn = document.getElementById('closeEstimasiModal');
      const estimasiTableBody = document.getElementById('estimasiTableBody');
      const estimasiModalContent = document.getElementById('estimasiModalContent'); // Elemen konten modal
      const headerTableWrapper = document.querySelector('.header-table-wrapper'); // Baru: Wrapper tabel header
      const bodyTableWrapper = document.querySelector('.body-table-wrapper'); // Baru: Wrapper tabel body
      const downloadPdfBtn = document.getElementById('downloadPdfBtn'); // Baru: Tombol Download PDF

      // Elemen baris input part baru (sekarang global dalam cakupan ini)
      let newPartKodePartInput;
      let newPartDeskripsiInput;
      let newPartQtyInput;
      let newPartHargaInput;
      let addPartBtn;

      // Elemen modal bersarang
      const openKirimEstimasiModalBtn = document.getElementById('openKirimEstimasiModalBtn');
      const kirimEstimasiModal = document.getElementById('kirimEstimasiModal');
      const closeKirimEstimasiModalBtn = document.getElementById('closeKirimEstimasiModal');
      const estimasiForm = document.getElementById('estimasiForm'); // Form sekarang ada di dalam modal bersarang

      // Data estimasi akan disimpan di sini
      let estimasiItems = [];

      // Fungsi untuk memuat data dari localStorage
      function loadEstimasiFromLocalStorage() {
          const storedData = localStorage.getItem('estimasiData');
          if (storedData) {
              try {
                  estimasiItems = JSON.parse(storedData);
              }
              catch (e) {
                  console.error("Kesalahan saat mengurai data estimasi dari localStorage:", e);
                  estimasiItems = []; // Reset jika ada kesalahan penguraian
              }
          } else {
              // Jika tidak ada data di localStorage, inisialisasi sebagai array kosong.
              // Data dummy telah dihapus sesuai permintaan pengguna.
          }
      }

      // Fungsi untuk menyimpan data ke localStorage
      function saveEstimasiToLocalStorage() {
          localStorage.setItem('estimasiData', JSON.stringify(estimasiItems));
      }

      /**
       * Menambahkan item baru ke daftar estimasi atau memperbarui kuantitas item yang sudah ada.
       * @param {Object} newItem - Item yang akan ditambahkan atau diperbarui.
       * @param {boolean} [isIncrement=true] - Jika true, menambah kuantitas. Jika false, mengurangi.
       */
      function addEstimasiItem(newItem, isIncrement = true) {
          if (!newItem || !newItem.kodePart || !newItem.deskripsi || !newItem.qty || !newItem.harga) {
              console.warn("Data item tidak lengkap:", newItem);
              return;
          }

          const kodeBaru = newItem.kodePart.trim().toUpperCase();
          const deskripsiBaru = newItem.deskripsi.trim();
          const qtyBaru = newItem.qty;
          const hargaBaru = newItem.harga;

          // Disesuaikan untuk juga memeriksa deskripsi untuk item yang sudah ada
          const existingIndex = estimasiItems.findIndex(item =>
              item.kodePart.trim().toUpperCase() === kodeBaru &&
              item.deskripsi.trim() === deskripsiBaru
          );

          if (existingIndex !== -1) {
              if (isIncrement) {
                  estimasiItems[existingIndex].qty += qtyBaru;
                  // Tampilkan umpan balik toast
                  showMessageBox(`Qty untuk part '${deskripsiBaru}' ditambahkan jadi ${estimasiItems[existingIndex].qty}x`);
              } else {
                  estimasiItems[existingIndex].qty -= qtyBaru;
                  if (estimasiItems[existingIndex].qty <= 0) {
                      const removedItem = estimasiItems.splice(existingIndex, 1);
                      showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) dihapus dari keranjang.`);
                  } else {
                      showMessageBox(`Qty untuk part '${deskripsiBaru}' dikurangi jadi ${estimasiItems[existingIndex].qty}x`);
                  }
              }
          } else if (isIncrement) { // Hanya tambahkan item baru jika itu adalah operasi penambahan
              estimasiItems.push({
                  kodePart: kodeBaru,
                  deskripsi: deskripsiBaru,
                  qty: qtyBaru,
                  harga: hargaBaru
              });
              // Tampilkan umpan balik toast
              showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) ditambahkan ke keranjang dengan ${qtyBaru}x`);
          } else {
              // Jika mencoba mengurangi item yang tidak ada, jangan lakukan apa-apa atau tampilkan pesan
              showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) tidak ditemukan di keranjang.`);
          }

          saveEstimasiToLocalStorage();
          renderEstimasiTable();
      }

      // Fungsi untuk merender ulang tabel dan memperbarui badge
      function renderEstimasiTable() {
        const estimasiTableBody = document.getElementById('estimasiTableBody');
        if (!estimasiTableBody) return;

        estimasiTableBody.innerHTML = '';
        let totalBelanja = 0;
        let totalQuantity = 0; // Inisialisasi total kuantitas

        // Render item yang ada
        estimasiItems.forEach((item, index) => {
            const jumlah = item.qty * item.harga;
            totalBelanja += jumlah;
            totalQuantity += item.qty; // Akumulasi total kuantitas

            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-2 px-4 text-center">${index + 1}</td>
                <td class="py-2 px-4 text-center">${item.kodePart}</td>
                <td class="py-2 px-4 deskripsi-cell" title="${item.deskripsi}">${item.deskripsi}</td>
                <td class="py-2 px-4 text-center">
                    <div class="inline-flex items-center justify-center relative">
                        <input type="number" class="qty-input-table w-16 text-center" value="${item.qty}" min="1" data-index="${index}" />
                        <div class="absolute right-0 flex flex-col">
                            <button class="qty-btn-up text-blue-600 hover:text-blue-800 text-xs p-0" data-index="${index}">+</button>
                            <button class="qty-btn-down text-blue-600 hover:text-blue-800 text-xs p-0" data-index="${index}">-</button>
                        </div>
                    </div>
                </td>
                <td class="py-2 px-4 text-right">
                    <input type="text" class="price-input-table" value="Rp ${item.harga.toLocaleString('id-ID')}" data-index="${index}" />
                </td>
                <td class="py-2 px-4 text-right">Rp ${jumlah.toLocaleString('id-ID')}</td>
                <td class="py-2 px-4 text-center">
                    <button class="delete-item-btn text-gray-500 hover:text-red-600 transition duration-200" title="Hapus" data-index="${index}">
                        <i class="fas fa-trash-alt text-lg"></i>
                    </button>
                </td>
            `;
            estimasiTableBody.appendChild(row);
        });

        // Tambahkan baris input part baru
        const newPartRow = document.createElement('tr');
        newPartRow.classList.add('estimasi-input-row'); // Tambahkan kelas untuk styling
        newPartRow.innerHTML = `
            <td class="text-center text-gray-400">#</td>
            <td><input type="text" id="newPartKodePart" placeholder="Kode Part" /></td>
            <td><input type="text" id="newPartDeskripsi" placeholder="Deskripsi" readonly /></td> <!-- Ditambahkan readonly di sini -->
            <td><input type="number" id="newPartQty" placeholder="Qty" value="1" min="1" /></td>
            <td><input type="text" id="newPartHarga" placeholder="Harga" /></td>
            <td class="text-center text-gray-400">Auto</td>
            <td class="text-center">
                <button id="addPartBtn" class="bg-blue-500 hover:bg-blue-600 text-white">
                    <i class="fas fa-plus"></i>
                </button>
            </td>
        `;
        estimasiTableBody.appendChild(newPartRow);

        // Tetapkan kembali referensi global ke elemen input baru setelah dirender
        newPartKodePartInput = document.getElementById('newPartKodePart');
        newPartDeskripsiInput = document.getElementById('newPartDeskripsi');
        newPartQtyInput = document.getElementById('newPartQty');
        newPartHargaInput = document.getElementById('newPartHarga');
        addPartBtn = document.getElementById('addPartBtn');

        // Lampirkan kembali event listener untuk baris input part baru
        if (addPartBtn) {
            addPartBtn.onclick = function() { // Gunakan onclick untuk penugasan ulang yang mudah
                const kodePart = newPartKodePartInput.value.trim();
                const deskripsi = newPartDeskripsiInput.value.trim();
                const qty = parseInt(newPartQtyInput.value, 10);
                const hargaStr = newPartHargaInput.value.replace(/[^0-9]/g, ''); // Hapus non-numerik
                const harga = parseInt(hargaStr, 10);

                if (kodePart && deskripsi && !isNaN(qty) && qty > 0 && !isNaN(harga) && harga >= 0) {
                    const newItem = {
                        kodePart: kodePart,
                        deskripsi: deskripsi,
                        qty: qty,
                        harga: harga
                    };
                    addEstimasiItem(newItem, true); // Tambahkan sebagai item baru
                    // Bersihkan kolom input setelah menambahkan
                    newPartKodePartInput.value = '';
                    newPartDeskripsiInput.value = '';
                    newPartQtyInput.value = '1';
                    newPartHargaInput.value = '';
                } else {
                    showMessageBox('Mohon lengkapi semua kolom input part baru dengan benar (Kode Part, Deskripsi, Qty > 0, Harga >= 0).');
                }
            };
        }

        // Tambahkan event listener untuk newPartKodePartInput untuk mengambil data
        if (newPartKodePartInput) {
            newPartKodePartInput.addEventListener('change', async function() {
                const kodePart = this.value.trim().toUpperCase();
                if (kodePart) {
                    const sheetURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"; 
                    try {
                        const res = await fetch(sheetURL);
                        if (!res.ok) {
                            throw new Error(`Gagal mengambil sheet: ${res.status}`);
                        }
                        const data = await res.json();
                        const foundPart = data.find(row => row.kodepart?.toUpperCase() === kodePart);

                        if (foundPart) {
                            newPartDeskripsiInput.value = foundPart.deskripsi || '';
                            newPartHargaInput.value = `Rp ${parseInt(foundPart.harga || 0, 10).toLocaleString('id-ID')}`;
                            showMessageBox(`Part '${foundPart.deskripsi}' ditemukan.`);
                        } else {
                            newPartDeskripsiInput.value = '';
                            newPartHargaInput.value = '';
                            showMessageBox(`Kode Part '${kodePart}' tidak ditemukan.`);
                        }
                    } catch (error) {
                        console.error("Kesalahan saat mengambil data part:", error);
                        showMessageBox(`Gagal mencari kode part: ${error.message}`);
                    }
                } else {
                    newPartDeskripsiInput.value = '';
                    newPartHargaInput.value = '';
                }
            });
        }


        if (newPartHargaInput) {
            newPartHargaInput.onblur = function() {
                const value = this.value.replace(/[^0-9]/g, '');
                if (value) {
                    this.value = `Rp ${parseInt(value, 10).toLocaleString('id-ID')}`;
                }
            };
            newPartHargaInput.onfocus = function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            };
        }
        // Akhir dari event listener baris input part baru

        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="5" class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Total:</td>
            <td class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Rp ${totalBelanja.toLocaleString('id-ID')}</td>
            <td class="py-2 px-4 border-t border-gray-200 text-sm"></td>
        `;
        estimasiTableBody.appendChild(totalRow);

        // Listener untuk input qty (item yang ada)
        document.querySelectorAll('.qty-input-table').forEach(input => {
            input.addEventListener('change', e => {
                const newQty = parseInt(e.target.value, 10);
                const idx = parseInt(e.target.dataset.index);

                if (!isNaN(newQty) && newQty > 0 && idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty = newQty;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable(); // Render ulang untuk memperbarui total dan baris lainnya
                    showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi ${newQty}x`);
                } else {
                    // Jika newQty 0 atau kurang, perlakukan sebagai penghapusan
                    if (newQty <= 0 && idx >= 0 && idx < estimasiItems.length) {
                        const namaItem = estimasiItems[idx].deskripsi;
                        estimasiItems.splice(idx, 1);
                        showMessageBox(`Part '${namaItem}' telah dihapus dari estimasi.`);
                    } else {
                        showMessageBox(`Qty tidak valid. Masukkan angka lebih dari 0.`);
                        // Kembalikan nilai input ke kuantitas valid sebelumnya
                        e.target.value = estimasiItems[idx].qty;
                    }
                }
            });
        });

        // Listener untuk input harga (item yang ada)
        document.querySelectorAll('.price-input-table').forEach(input => {
            input.addEventListener('change', e => {
                const newPriceString = e.target.value.replace(/[^0-9]/g, ''); // Hapus karakter non-numerik
                const newPrice = parseInt(newPriceString, 10);
                const idx = parseInt(e.target.dataset.index);

                if (!isNaN(newPrice) && newPrice >= 0 && idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].harga = newPrice;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable(); // Render ulang untuk memperbarui total dan baris lainnya
                    showMessageBox(`Harga untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi Rp ${newPrice.toLocaleString('id-ID')}`);
                } else {
                    showMessageBox(`Harga tidak valid. Masukkan angka yang benar.`);
                    // Kembalikan nilai input ke harga valid sebelumnya
                    e.target.value = `Rp ${estimasiItems[idx].harga.toLocaleString('id-ID')}`;
                }
            });
        });

        // Listener untuk tombol hapus (item yang ada)
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                let idx = parseInt(e.target.dataset.index);
                if (isNaN(idx)) { // Jika klik pada ikon, dapatkan dataset tombol induk
                    const parentButton = e.target.closest('button');
                    if (parentButton) {
                        idx = parseInt(parentButton.dataset.index); // Gunakan parentButton.dataset.index
                    }
                }

                if (idx >= 0 && idx < estimasiItems.length) {
                    const namaItem = estimasiItems[idx].deskripsi;
                    estimasiItems.splice(idx, 1);
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    showMessageBox(`Item '${namaItem}' telah dihapus dari estimasi.`);
                }
            });
        });

        // Listener untuk tombol plus (sekarang qty-btn-up) (item yang ada)
        document.querySelectorAll('.qty-btn-up').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index); // Tangani klik pada ikon atau tombol itu sendiri
                if (idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty++;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' ditambahkan jadi ${estimasiItems[idx].qty}x`);
                }
            });
        });

        // Listener untuk tombol minus (sekarang qty-btn-down) (item yang ada)
        document.querySelectorAll('.qty-btn-down').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index); // Tangani klik pada ikon atau tombol itu sendiri
                if (idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty--;
                    if (estimasiItems[idx].qty <= 0) {
                        const namaItem = estimasiItems[idx].deskripsi;
                        estimasiItems.splice(idx, 1);
                        showMessageBox(`Item '${namaItem}' telah dihapus dari estimasi.`);
                    } else {
                        showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' dikurangi jadi ${estimasiItems[idx].qty}x`);
                    }
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                }
            });
        });

        // Perbarui badge kuantitas
        const estimasiQtyBadge = document.getElementById('estimasiQtyBadge');
        if (estimasiQtyBadge) {
            estimasiQtyBadge.textContent = totalQuantity.toString();
            if (totalQuantity > 0) {
                estimasiQtyBadge.classList.add('show-badge');
            } else {
                estimasiQtyBadge.classList.remove('show-badge');
            }
        }

        // Perbarui badge harga
        const estimasiPriceBadge = document.getElementById('estimasiPriceBadge');
        if (estimasiPriceBadge) {
            estimasiPriceBadge.textContent = `Rp ${totalBelanja.toLocaleString('id-ID')}`;
            if (totalBelanja > 0) {
                estimasiPriceBadge.classList.add('show-badge');
            } else {
                estimasiPriceBadge.classList.remove('show-badge');
            }
        }
      }

      // Fungsi untuk menghapus item dari estimasi (disimpan untuk konsistensi, meskipun sekarang ditangani oleh event listener tombol hapus di renderEstimasiTable)
      function deleteEstimasiItem(index) {
          if (index > -1 && index < estimasiItems.length) {
              const deletedItem = estimasiItems.splice(index, 1); // Hapus item dari array
              showMessageBox(`Part '${deletedItem[0].deskripsi}' dihapus dari keranjang.`);
              saveEstimasiToLocalStorage(); // Simpan perubahan ke localStorage
              renderEstimasiTable(); // Render ulang tabel
          }
      }

      // Fungsi untuk membuat PDF
      function generatePdf() {
          // Buat instance jsPDF baru
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();

          // Definisikan kolom untuk tabel PDF
          const columns = [
              { header: 'No', dataKey: 'no' },
              { header: 'Kode Part', dataKey: 'kodePart' },
              { header: 'Deskripsi', dataKey: 'deskripsi' },
              { header: 'Qty', dataKey: 'qty' },
              { header: 'Harga (Rp)', dataKey: 'harga' },
              { header: 'Jumlah (Rp)', dataKey: 'jumlah' }
          ];

          // Siapkan data untuk tabel PDF
          const data = estimasiItems.map((item, index) => {
              const jumlah = item.qty * item.harga;
              return {
                  no: index + 1,
                  kodePart: item.kodePart,
                  deskripsi: item.deskripsi,
                  qty: item.qty,
                  harga: item.harga.toLocaleString('id-ID'),
                  jumlah: jumlah.toLocaleString('id-ID')
              };
          });

          // Hitung total
          let totalBelanja = 0;
          estimasiItems.forEach(item => {
              totalBelanja += item.qty * item.harga;
          });

          // Tambahkan judul ke PDF
          doc.setFontSize(18);
          doc.text("Daftar Estimasi Sparepart", 105, 20, null, null, "center"); // Mengubah judul di sini

          // Tambahkan tabel ke PDF
          doc.autoTable({
              startY: 30, // Mulai tabel di bawah judul
              head: [columns.map(col => col.header)],
              body: data.map(row => columns.map(col => row[col.dataKey])),
              theme: 'striped',
              styles: {
                  fontSize: 8,
                  cellPadding: 2,
                  valign: 'middle',
                  halign: 'left'
              },
              headStyles: {
                  fillColor: [0, 51, 102], // #003366
                  textColor: [255, 255, 255],
                  fontStyle: 'bold',
                  halign: 'center'
              },
              columnStyles: {
                  0: { halign: 'center', cellWidth: 10 }, // No
                  1: { halign: 'center', cellWidth: 25 }, // Kode Part
                  2: { halign: 'left', cellWidth: 60 },  // Deskripsi
                  3: { halign: 'center', cellWidth: 15 }, // Qty (Disesuaikan dari kanan ke tengah)
                  4: { halign: 'right', cellWidth: 25 }, // Harga (Ditingkatkan dari 25 menjadi 30)
                  5: { halign: 'right', cellWidth: 30 }  // Jumlah
              },
              didDrawPage: function(data) {
                  // Footer
                  let str = "Halaman " + doc.internal.getNumberOfPages();
                  doc.setFontSize(10);
                  doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
              }
          });

          // Tambahkan baris total di bawah tabel
          const finalY = doc.autoTable.previous.finalY;
          doc.setFontSize(10);
          doc.text(`Total Belanja: Rp ${totalBelanja.toLocaleString('id-ID')}`, doc.internal.pageSize.width - doc.internal.pageSize.width / 4, finalY + 10, null, null, "right");


          // Simpan PDF
          doc.save('estimasi_belanja.pdf');
          showMessageBox('Daftar estimasi Anda telah diunduh sebagai PDF!');
      }

      // Pastikan semua elemen modal ditemukan sebelum melampirkan event listener
      if (estimasiModal && closeEstimasiModalBtn && estimasiTableBody && estimasiModalContent && headerTableWrapper && bodyTableWrapper && downloadPdfBtn && openKirimEstimasiModalBtn && kirimEstimasiModal && closeKirimEstimasiModalBtn && estimasiForm) {
          console.log('Elemen modal ditemukan. Melampirkan event listener.');
          
          // Muat data saat halaman pertama kali dimuat
          loadEstimasiFromLocalStorage();
          renderEstimasiTable(); // Panggil ini untuk mengisi badge juga pada awalnya

          // Event listener untuk membuka modal estimasi utama saat tombol "Estimasi" diklik
          openEstimasiModalBtn.addEventListener('click', async function() {
              console.log('Tombol buka diklik. classList Modal SEBELUM:', estimasiModal.classList.value);
              estimasiModal.classList.remove('hidden'); // Hapus kelas 'hidden' untuk menampilkan modal
              // Tambahkan kelas ke body untuk mencegah pengguliran latar belakang
              document.body.classList.add('modal-open');
              console.log('classList Modal SETELAH hapus hidden:', estimasiModal.classList.value);

              // Hitung tinggi yang tersedia untuk body tabel yang dapat digulir
              // Ini harus dipanggil setelah modal ditampilkan
              const modalContentHeight = estimasiModalContent.offsetHeight;
              const modalTitleHeight = estimasiModalContent.querySelector('h3').offsetHeight;
              const buttonContainerHeight = estimasiModalContent.querySelector('.mt-4.flex.justify-end.gap-2').offsetHeight; // Selektor yang disesuaikan untuk container tombol unduh
              const gap = 15; // Jarak antar elemen di estimasiModalContent

              // Hitung ulang headerTableHeight setelah modal terlihat dan dirender
              // Ini penting untuk perhitungan tinggi yang akurat
              const headerTableHeight = headerTableWrapper.offsetHeight;
              // newPartInputRowHeight tidak lagi terpisah, itu adalah bagian dari body yang dapat digulir

              // Hitung total ruang yang diambil oleh elemen yang tidak dapat digulir
              const spaceTaken = modalTitleHeight + headerTableHeight + (3 * gap); // 3 jarak: judul-tabel, body-tabel, body-tabel-container-tombol

              // Hitung tinggi yang tersedia untuk bodyTableWrapper
              const availableHeightForBodyTable = modalContentHeight - spaceTaken;
              bodyTableWrapper.style.maxHeight = `${availableHeightForBodyTable}px`;
              bodyTableWrapper.style.height = 'auto'; // Pastikan tinggi fleksibel jika konten lebih kecil

              // --- MULAI: Sinkronisasi lebar kolom dinamis ---
              // Ini perlu dipanggil SETELAH modal terlihat dan dirender
              // untuk mendapatkan gaya komputasi yang akurat.
              const headerCols = headerTableWrapper.querySelectorAll('col');
              const bodyCols = bodyTableWrapper.querySelectorAll('col');

              // Kemudian, sinkronkan lebar
              headerCols.forEach((col, i) => {
                  const width = window.getComputedStyle(col).width;
                  if (bodyCols[i]) {
                      bodyCols[i].style.width = width;
                      bodyCols[i].style.minWidth = width; // Tambahkan minWidth
                      bodyCols[i].style.maxWidth = width; // Tambahkan maxWidth
                  }
              });
              // --- AKHIR: Sinkronisasi lebar kolom dinamis ---

              // Panggil fungsi untuk mengambil data estimasi dari Blogger
              try {
                  const fetchedEstimasi = await ambilSemuaEstimasi();
                  if (fetchedEstimasi.length > 0) {
                      const combinedEstimasi = [...estimasiItems];
                      fetchedEstimasi.forEach(fetchedItem => {
                          const existingIndex = combinedEstimasi.findIndex(item => item.kodePart === fetchedItem.kodePart);
                          if (existingIndex > -1) {
                              combinedEstimasi[existingIndex] = { ...combinedEstimasi[existingIndex], ...fetchedItem };
                          } else {
                              combinedEstimasi.push(fetchedItem);
                          }
                      });
                      estimasiItems = combinedEstimasi;
                      saveEstimasiToLocalStorage();
                      renderEstimasiTable();
                      console.log('Data estimasi berhasil digabungkan dan dirender ulang dari Blogger.');
                  } else {
                      console.log('Tidak ada data estimasi baru dari Blogger. Menggunakan data lokal yang ada.');
                      renderEstimasiTable();
                  }
              } catch (error) {
                  console.error("Gagal mengambil data estimasi dari Blogger:", error);
                  renderEstimasiTable();
              }
          });

          // Event listener untuk menutup modal estimasi utama saat tombol tutup (X) diklik
          closeEstimasiModalBtn.addEventListener('click', function() {
              console.log('Tombol tutup modal utama diklik. classList Modal SEBELUM:', estimasiModal.classList.value);
              estimasiModal.classList.add('hidden');
              document.body.classList.remove('modal-open');
              console.log('classList Modal SETELAH tambah hidden:', estimasiModal.classList.value);
          });

          // Event listener untuk menutup modal estimasi utama jika diklik di luar konten modal (pada overlay)
          estimasiModal.addEventListener('click', function(e) {
              if (e.target === estimasiModal) {
                  console.log('Overlay diklik. classList Modal SEBELUM:', estimasiModal.classList.value);
                  estimasiModal.classList.add('hidden');
                  document.body.classList.remove('modal-open');
                  console.log('classList Modal SETELAH tambah hidden:', estimasiModal.classList.value);
              }
          });

          // Event listener untuk tombol Download PDF yang baru
          downloadPdfBtn.addEventListener('click', generatePdf);

          // Event listener untuk membuka modal bersarang saat tombol "Kirim Estimasi" diklik
          openKirimEstimasiModalBtn.addEventListener('click', function() {
              if (estimasiItems.length === 0) {
                  showMessageBox('Tidak ada item dalam estimasi untuk dikirim.');
                  return;
              }
              kirimEstimasiModal.classList.remove('hidden');
          });

          // Event listener untuk menutup modal bersarang saat tombol tutup (X) diklik
          closeKirimEstimasiModalBtn.addEventListener('click', function() {
              kirimEstimasiModal.classList.add('hidden');
          });

          // Event listener untuk menutup modal bersarang jika diklik di luar konten modal (pada overlay)
          kirimEstimasiModal.addEventListener('click', function(e) {
              if (e.target === kirimEstimasiModal) {
                  kirimEstimasiModal.classList.add('hidden');
              }
          });

          // Event listener untuk pengiriman formulir di dalam modal bersarang
          estimasiForm.addEventListener('submit', function(e) {
              e.preventDefault(); // Mencegah pengiriman formulir default
              const nama = document.getElementById('namaPengirim').value;
              const noHandphone = document.getElementById('noHandphone').value; // Dapatkan nomor telepon
              const email = document.getElementById('emailPengirim').value;
              
              showMessageBox(`Estimasi berhasil dikirim oleh ${nama} (${email}, ${noHandphone})!`);
              console.log('Estimasi dikirim:', { items: estimasiItems, nama: nama, noHandphone: noHandphone, email: email });

              // Secara opsional bersihkan formulir dan item estimasi setelah pengiriman
              // estimasiItems = [];
              // saveEstimasiToLocalStorage();
              // renderEstimasiTable();
              // document.getElementById('namaPengirim').value = '';
              // document.getElementById('noHandphone').value = ''; // Bersihkan nomor telepon
              // document.getElementById('emailPengirim').value = '';

              kirimEstimasiModal.classList.add('hidden'); // Tutup modal bersarang setelah pengiriman
              estimasiModal.classList.add('hidden'); // Tutup modal utama setelah pengiriman
              document.body.classList.remove('modal-open'); // Aktifkan kembali pengguliran
          });
      } else {
          // Blok else ini sekarang hanya akan terpukul jika openEstimasiModalBtn ada, tetapi elemen modal lainnya tidak.
          // Yang sangat tidak mungkin jika struktur HTML benar.
          console.warn('PERINGATAN: Beberapa elemen modal hilang meskipun tombol buka ada. Periksa ID dan struktur HTML.');
      }
  } else {
      console.log('INFO: Tombol modal estimasi tidak ditemukan. Fungsionalitas modal tidak akan diinisialisasi di halaman ini.');
  }

  /**
   * Mengambil semua data estimasi dari postingan Blogger.
   * Setiap postingan diharapkan memiliki elemen <script class="data-estimasi" type="application/json">
   * yang berisi array JSON item estimasi.
   * @returns {Promise<Array<Object>>} Array gabungan dari semua item estimasi.
   */
  async function ambilSemuaEstimasi() {
      console.log("Memulai pengambilan data estimasi dari Blogger...");
      const url = "/feeds/posts/default/-/estimasi?alt=json&max-results=50";
      let estimasiGabungan = [];

      try {
          const res = await fetch(url);
          if (!res.ok) {
              throw new Error(`Kesalahan HTTP! status: ${res.status}`);
          }
          const json = await res.json();
          const entries = json.feed.entry || [];

          const parser = new DOMParser();

          for (const entry of entries) {
              const htmlContent = entry.content?.$t;
              if (htmlContent) {
                  // Mengurai konten HTML dari entri ke dokumen DOM baru
                  const docFromHtml = parser.parseFromString(htmlContent, 'text/html');
                  // Kueri node skrip dari dokumen yang baru diurai
                  const scriptNode = docFromHtml.querySelector("script.data-estimasi[type='application/json']");
                  if (scriptNode && scriptNode.textContent) {
                      try {
                          const data = JSON.parse(scriptNode.textContent);
                          if (Array.isArray(data)) {
                              estimasiGabungan.push(...data);
                              console.log(`Berhasil mengurai data dari postingan: ${entry.title?.$t}`);
                          } else {
                              console.warn(`Data estimasi di postingan "${entry.title?.$t}" bukan array. Melewati.`);
                          }
                      } catch (e) {
                          console.warn(`Gagal mengurai JSON di postingan "${entry.title?.$t}":`, e);
                      }
                  } else {
                      console.log(`Tidak ada script.data-estimasi ditemukan di postingan: ${entry.title?.$t}`);
                  }
              } else {
                  console.log(`Konten HTML kosong untuk postingan: ${entry.title?.$t}`);
              }
          }
          console.log(`Pengambilan data estimasi selesai. Total item: ${estimasiGabungan.length}`);
      }
      catch (error) {
          console.error("Kesalahan saat mengambil data estimasi dari Blogger:", error);
      }
      return estimasiGabungan;
  }

  // Jadikan fungsi yang relevan dapat diakses secara global
  window.updateEstimasiBadges = renderEstimasiTable;
  // addEstimasiItem yang dimodifikasi untuk menerima parameter isIncrement
  window.addEstimasiItem = function(item) {
      addEstimasiItem(item, true); // Default ke penambahan
  };
  // Menghapus window.decrementEstimasiItem karena fungsionalitasnya sekarang ditangani oleh input qty dan tombol hapus
  window.getEstimasiItems = function() {
      return [...estimasiItems];
  };
  window.clearEstimasi = function() {
      estimasiItems = [];
      saveEstimasiToLocalStorage();
      renderEstimasiTable();
  };

  // 1️⃣ Bagian pertama — Membuat mapping semua judul postingan
  // Inisialisasi window.postMap secara global
  window.postMap = {}; 
  
  // ✅ Muat mapping postMap dari localStorage jika tersedia
  try {
      const cached = localStorage.getItem('cachedPostMap');
      if (cached) {
          window.postMap = JSON.parse(cached);
          console.log("✅ postMap dimuat dari localStorage:", window.postMap);
      }
  } catch (e) {
      console.error("❌ Kesalahan saat memuat postMap dari localStorage:", e);
      window.postMap = {};
  }

  // Fungsi untuk mengisi postMap
  function populatePostMap() {
      return new Promise(resolve => { // Kembalikan Promise
          const postMappingContainer = document.getElementById('postMappingHidden'); 
          console.log("Memulai fungsi populatePostMap...");
          if (postMappingContainer) {
              // Log innerHTML untuk melihat apakah Blogger merender tautan
              console.log("Konten #postMappingHidden:", postMappingContainer.innerHTML);

              const links = postMappingContainer.querySelectorAll('a');
              console.log(`Ditemukan ${links.length} tag <a> di #postMappingHidden.`);

              links.forEach(link => {
                  const title = link?.textContent?.trim();
                  const url = link?.href;
                  if (title && url) {
                      // Bersihkan judul untuk membuat kunci: huruf kecil, trim, hapus semua spasi
                      const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, ''); 
                      window.postMap[sanitizedTitle] = url; // Gunakan window.postMap
                      // DEBUGGING BARU: Log setiap item yang ditambahkan ke postMap
                      console.log(`✅ Postingan yang Dipetakan: Judul Asli dari Blogger: "${title}" -> Kunci yang Dibersihkan: "${sanitizedTitle}" -> URL: "${url}"`);
                  } else {
                      console.warn(`⚠️ Melewati tautan karena judul atau URL hilang: TextContent="${link?.textContent}", Href="${link?.href}"`);
                  }
              });
              console.log("Konten window.postMap akhir setelah mengisi dari Blogger:");
              console.table(window.postMap); // Log seluruh peta sebagai tabel
              localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap)); // Simpan ke localStorage
              console.log("✅ postMap disimpan ke localStorage.");
              resolve(); // Selesaikan promise setelah diisi
          } else {
              console.warn("❌ Kontainer #postMappingHidden tidak ditemukan. Widget ini harus ada di halaman indeks.");
              // Fallback: Jika tidak di halaman indeks atau widget PostMappingHidden tidak ada,
              // coba dapatkan URL postingan dari artikel .post yang saat ini dirender
              const posts = document.querySelectorAll('.post');
              console.log(`Ditemukan ${posts.length} artikel .post (fallback).`);
              posts.forEach(post => {
                  const titleElement = post.querySelector('h1 a'); 
                  const title = titleElement?.textContent?.trim();
                  const url = titleElement?.href;
                  if (title && url) {
                      // Bersihkan judul untuk membuat kunci: huruf kecil, trim, hapus semua spasi
                      const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, ''); 
                      window.postMap[sanitizedTitle] = url; // Gunakan window.postMap
                      // DEBUGGING BARU: Log setiap item yang ditambahkan ke postMap
                      console.log(`✅ Postingan yang Dipetakan (Fallback): Judul Asli dari Blogger: "${title}" -> Kunci yang Dibersihkan: "${sanitizedTitle}" -> URL: "${url}"`);
                  } else {
                      console.warn(`⚠️ Melewati postingan fallback karena judul atau URL hilang: TitleElementText="${titleElement?.textContent}", Href="${titleElement?.href}"`);
                  }
              });
              console.log("Konten window.postMap akhir setelah mengisi dari elemen .post yang terlihat (fallback):");
              console.table(window.postMap); // Log seluruh peta sebagai tabel
              localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap)); // Simpan ke localStorage
              console.log("✅ postMap (fallback) disimpan ke localStorage.");
              resolve(); // Selesaikan promise setelah diisi
          }
      });
  }

  // Panggil populatePostMap saat DOM siap, lalu lanjutkan dengan inisialisasi lainnya
  populatePostMap().then(() => {
      // 🧩 Fungsi resolusi otomatis URL postingan fig
      function resolveFigLink(item) {
        // Mengubah slug agar menghilangkan semua spasi, bukan menggantinya dengan tanda hubung
        const slug = item.judul_artikel?.toLowerCase().trim().replace(/\s+/g, '');
        if (window.postMap?.[slug]) return window.postMap[slug];
        
        // Fallback default struktur: menghilangkan '/p/' dan menggunakan slug tanpa spasi/tanda hubung
        const currentYear = new Date().getFullYear();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0'); // Dapatkan bulan saat ini (01-12)
        return `/${currentYear}/${currentMonth}/${slug}.html`; 
      }

      // Fungsi untuk mengubah teks menjadi Title Case
      function titleCase(text) {
          if (!text) return '';
          return text.toLowerCase().split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
      }

      // 🎨 Render hasil pencarian fig
      function renderFigResult(item) {
        const link = resolveFigLink(item);
        const deskripsi = titleCase(item.deskripsi?.trim() || ''); // Terapkan titleCase di sini
        let html = `
          <div class="border border-gray-200 rounded-lg p-3 bg-white shadow-sm text-sm space-y-1">
            <h3 class="font-semibold text-blue-700">
              <a href="${link}" class="hover:underline spa-link"> <!-- Tambahkan kelas spa-link -->
                ${item.judul_artikel || 'Judul tidak tersedia'}
              </a>
            </h3>
            <p><strong>Kode Part:</strong><span class="bg-gray-100 px-2 py-0.5 rounded font-mono">${item.kodepart || 'N/A'}</span></p>`;
        
        // Tambahkan deskripsi hanya jika tidak kosong
        if (deskripsi) {
            html += `<p><strong>Deskripsi:</strong> ${deskripsi}</p>`;
        }

        html += `</div>`;
        return html;
      }

      // 🔍 Fungsi utama pencarian fig dari sidebar (Dinamai ulang)
      window.jalankanPencarianFigSidebar = function (query) {
        const hasilContainer = document.getElementById("searchOnlyContent");
        if (!hasilContainer) {
          console.warn("❌ Kontainer #searchOnlyContent tidak ditemukan.");
          return;
        }

        hasilContainer.classList.remove("hidden");

        if (!query) {
          hasilContainer.innerHTML = `<p class="text-gray-600 text-center">Masukkan kata kunci pada kolom pencarian untuk mencari kode part.</p>`;
          return;
        }

        hasilContainer.innerHTML = `
          <div class="text-sm text-gray-600 text-center mb-3">⏳ Mencari <strong>${query}</strong>...</div>`;

        // ✅ ID Spreadsheet
        const sheetURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"; 

        fetch(sheetURL)
          .then(res => {
            if (!res.ok) {
              if (res.status === 400) {
                throw new Error(`Gagal ambil Sheet: ${res.status}. Pastikan Google Sheet Anda diatur untuk "Anyone with the link can view" dan ID Spreadsheet serta nama Sheet sudah benar.`);
              } else {
                throw new Error(`Gagal ambil Sheet: ${res.status}`);
              }
            }
            return res.json();
          })
          .then(data => {
            const hasil = data.filter(row => {
              const q = query.toUpperCase();
              const kp = row.kodepart?.toUpperCase() || "";
              const ja = row.judul_artikel?.toUpperCase() || "";
              const ds = row.deskripsi?.toUpperCase() || "";
              return kp.includes(q) || ja.includes(q) || ds.includes(q);
            });

            if (hasil.length === 0) {
              hasilContainer.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded p-3 text-red-600 text-sm">
                  ❌ Tidak ditemukan hasil untuk <strong>${query}</strong>
                </div>`;
            } else {
              hasilContainer.innerHTML = `<div class="space-y-4">
                ${hasil.map(renderFigResult).join('')}
              </div>`;
            }
            // Lampirkan kembali listener SPA setelah konten baru dirender
            attachSpaLinkListeners();
          })
          .catch(err => {
            console.error("⚠️ Pengambilan gagal:", err);
            hasilContainer.innerHTML = `
              <div class="bg-red-100 border border-400 text-red-700 px-3 py-2 rounded">
                ⚠️ Gagal memuat data Sheet. (${err.message})
              </div>`;
          });
      };

      // 🧾 Pasang listener form pencarian di sidebar (Disesuaikan)
      const sidebarForm = document.getElementById('sidebarSearchForm');
      const sidebarInput = document.getElementById('sidebarSearchInput');
      sidebarForm?.addEventListener('submit', function (e) {
        e.preventDefault();
        const query = sidebarInput?.value?.trim()?.toUpperCase();
        if (query) window.jalankanPencarianFigSidebar(query);
      });

      // --- Fungsionalitas SPA ---
      const mainContentSection = document.getElementById('main-content-section');
      const spaLoadingIndicator = document.getElementById('spa-loading-indicator');
      const homepageGreeting = document.getElementById('homepage-greeting');
      const promoGallerySection = document.getElementById('PromoGallery'); // Dapatkan referensi ke section promo gallery

      /**
       * Menampilkan indikator loading.
       */
      function showLoading() {
          if (spaLoadingIndicator) {
              spaLoadingIndicator.classList.add('show');
              spaLoadingIndicator.classList.remove('complete');
          }
      }

      /**
       * Menyembunyikan indikator loading.
       */
      function hideLoading() {
          if (spaLoadingIndicator) {
              spaLoadingIndicator.classList.add('complete');
              setTimeout(() => {
                  spaLoadingIndicator.classList.remove('show', 'complete');
              }, 200); // Sesuaikan dengan transisi CSS
          }
      }

      /**
       * Memuat konten halaman melalui AJAX untuk navigasi SPA.
       * @param {string} url - URL yang akan dimuat.
       * @param {boolean} pushState - Apakah akan mendorong status ke riwayat browser.
       */
      async function loadPageContent(url, pushState = true) {
          if (!mainContentSection) {
              console.error('Bagian konten utama tidak ditemukan untuk SPA.');
              return;
          }

          showLoading();

          try {
              const response = await fetch(url);
              if (!response.ok) {
                  throw new Error(`Kesalahan HTTP! status: ${response.status}`);
              }
              const html = await response.text();

              // Mengurai HTML yang diambil
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');

              // Ekstrak konten utama baru
              const newMainContent = doc.getElementById('main-content-section');
              if (newMainContent) {
                  // Ganti konten utama saat ini
                  mainContentSection.innerHTML = newMainContent.innerHTML;

                  // Perbarui judul halaman
                  const newTitle = doc.querySelector('title')?.textContent || document.title;
                  document.title = newTitle;

                  // Perbarui URL di riwayat browser
                  if (pushState) {
                      history.pushState({ path: url }, newTitle, url);
                  }

                  // Gulir ke atas
                  window.scrollTo(0, 0);

                  // --- MULAI: Logika untuk mengelola tampilan elemen berdasarkan jenis halaman ---
                  // Deteksi apakah URL adalah halaman indeks. Sesuaikan dengan URL beranda Anda.
                  const isIndexPage = url === window.location.origin + '/' || url === window.location.origin + '/index.html'; 

                  if (homepageGreeting) {
                      if (isIndexPage) {
                          homepageGreeting.style.display = 'block'; // Atau 'flex' jika itu adalah flex container
                      } else {
                          homepageGreeting.style.display = 'none';
                      }
                  }

                  if (promoGallerySection) {
                      if (isIndexPage) {
                          promoGallerySection.style.display = 'grid'; // Atau 'block'/'flex' sesuai layout Anda
                      } else {
                          promoGallerySection.style.display = 'none';
                      }
                  }
                  // --- AKHIR: Logika untuk mengelola tampilan elemen berdasarkan jenis halaman ---

                  // Lampirkan kembali event listener untuk konten yang baru dimuat
                  attachSpaLinkListeners(); // Lampirkan kembali untuk tautan baru
                  populateVehicleCategoryDropdown(); // Inisialisasi ulang dropdown kategori kendaraan karena kontennya mungkin berubah
                  populatePostMap(); // Jalankan ulang populasi peta postingan awal jika postingan baru dimuat

                  console.log(`SPA: Konten dimuat untuk ${url}`);
              } else {
                  console.error(`SPA: Tidak dapat menemukan #main-content-section di konten yang diambil dari ${url}`);
              }
          } catch (error) {
              console.error('SPA: Gagal memuat konten halaman:', error);
              showMessageBox(`Gagal memuat halaman: ${error.message}.`);
              // Secara opsional kembalikan URL atau tampilkan halaman kesalahan
          } finally {
              hideLoading();
          }
      }

      /**
       * Melampirkan listener klik ke semua tautan internal untuk navigasi SPA.
       * Fungsi ini harus dipanggil pada awalnya dan setelah konten baru dimuat.
       */
      function attachSpaLinkListeners() {
          document.querySelectorAll('a').forEach(link => {
              // Hapus listener yang ada untuk mencegah duplikat
              link.removeEventListener('click', handleSpaLinkClick);
              
              // Hanya lampirkan listener jika itu adalah tautan internal dan bukan tautan khusus
              const href = link.getAttribute('href');
              if (href && 
                  !href.startsWith('#') && // Tautan jangkar
                  !href.startsWith('mailto:') && // Tautan email
                  !href.startsWith('tel:') && // Tautan telepon
                  !link.target && // Tidak membuka di tab baru
                  !link.classList.contains('no-spa') && // Secara eksplisit memilih keluar
                  link.hostname === window.location.hostname // Domain yang sama
              ) {
                  link.addEventListener('click', handleSpaLinkClick);
              }
          });
      }

      /**
       * Penanganan event untuk klik tautan SPA.
       * @param {Event} e - Event klik.
       */
      function handleSpaLinkClick(e) {
          const link = e.currentTarget;
          const href = link.getAttribute('href');

          // Mencegah navigasi default
          e.preventDefault();

          // Muat konten menggunakan logika SPA
          loadPageContent(href);
      }

      // Lampiran awal listener tautan SPA
      attachSpaLinkListeners();

      // Tangani tombol kembali/maju browser
      window.addEventListener('popstate', (e) => {
          // Muat konten untuk status yang baru saja muncul
          // URL sudah diperbarui oleh browser untuk popstate
          loadPageContent(window.location.href, false); // Jangan dorong status lagi
      });

  }); // Akhir dari populatePostMap().then()
});
