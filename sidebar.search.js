// Ini adalah konten untuk file sidebar.search.js Anda yang dihosting secara eksternal.
// TIDAK ADA tag <script> atau CDATA di dalam file ini.

document.addEventListener('DOMContentLoaded', function() {
  // Utility function to safely add CSS classes
  function safeAddClass(element, ...classNames) {
      if (element && element.classList) {
          element.classList.add(...classNames);
      }
  }

  // Custom toast elements
  const customToast = document.getElementById('customToast');
  const toastMessage = document.getElementById('toastMessage');
  let toastTimeout; // Variable to hold the timeout ID

  // Function to show custom toast
  function showMessageBox(message) {
      if (customToast && toastMessage) {
          // Clear any existing timeout to prevent multiple toasts overlapping
          clearTimeout(toastTimeout);
          
          toastMessage.textContent = message;
          customToast.style.display = 'block'; // Make it visible
          customToast.classList.add('show'); // Add 'show' class for transition

          // Hide the toast automatically after 3 seconds
          toastTimeout = setTimeout(() => {
              customToast.classList.remove('show'); // Remove 'show' class for transition out
              // After transition, set display to none to remove it from layout
              setTimeout(() => {
                  customToast.style.display = 'none';
              }, 400); // Match this with the CSS transition duration
          }, 3000); // 3 seconds
      }
  }

  /**
   * Recursively creates a nested menu structure from a flat list of links.
   * Links starting with underscores are treated as sub-items.
   * Example: "Parent", "_Child1", "__Grandchild", "_Child2"
   * @param {Array<Object>} items - Array of link objects {name: string, target: string}
   * @param {number} startIndex - Index to start processing in the items array.
   * @param {number} currentLevel - Current nesting level (0 for top-level, 1 for sub-menu, etc.)
   * @returns {{ul: HTMLElement, nextIndex: number}} The constructed UL element and the next index to process.
   */
  function createNestedMenu(items, startIndex, currentLevel) {
      const currentLevelUl = document.createElement('ul');
      let i = startIndex;

      while (i < items.length) {
          const item = items[i];
          const itemName = item.name.trim(); // Trim whitespace here
          const leadingUnderscores = (itemName.match(/^_+/) || [''])[0].length;
          const cleanName = itemName.replace(/^_+/, '');

          console.log(`📌 [createMenu] Level: ${currentLevel}, Item: "${cleanName}", Underscores: ${leadingUnderscores}`); // Log item details

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

              const anchor = document.createElement('a'); // Changed 'a' to 'anchor' for consistency
              anchor.href = item.target;
              anchor.textContent = cleanName;
              safeAddClass(anchor, 'main-menu-item');

              // Check if there are children after this item
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

                  li.appendChild(anchor); // Append anchor to li

                  const nested = createNestedMenu(items, i + 1, currentLevel + 1);
                  const subUl = nested.ul;

                  safeAddClass(subUl, `depth-${currentLevel + 1}`, 'py-2', 'w-full');
                  safeAddClass(subUl, currentLevel === 0 ? 'dropdown-menu' : 'dropdown-submenu');
                  li.appendChild(subUl);

                  // Add click event listener for both desktop and mobile
                  anchor.addEventListener('click', (e) => {
                      e.preventDefault(); // Always prevent default navigation for dropdown toggles
                      li.classList.toggle('show-dropdown');
                      // Removed: arrow.classList.toggle('rotated'); // This line is no longer needed
                  });

                  i = nested.nextIndex - 1; // -1 because it will be ++ at the end
              } else {
                  li.appendChild(anchor); // Append anchor to li
              }

              currentLevelUl.appendChild(li);
              i++;
          } else if (leadingUnderscores < currentLevel) {
              console.log(`↩ [createMenu] Returning from level ${currentLevel} to ${leadingUnderscores}.`); // Log when returning
              break; // Go back to the previous parent
          } else {
              console.warn(`✳ Menu "${itemName}" skips a level. Skipping.`);
              i++;
          }
      }

      return { ul: currentLevelUl, nextIndex: i };
  }

  const buildTree = (links) => {
    const tree = [];
    const parents = []; // Stores references to parent nodes at each depth

    links.forEach(raw => {
        // Calculate depth based on the number of underscores
        const depth = (raw.name.trim().match(/^_+/) || [''])[0].length; // Trim here too
        const name = raw.name.replace(/^_*/, ''); // Remove underscores from the name

        const node = {
            name: name,
            href: raw.target,
            children: []
        };

        if (depth === 0) {
            // This is a top-level menu item
            tree.push(node);
            parents[0] = node; // Set as parent for depth 0
        } else {
            // This is a sub-item
            const parent = parents[depth - 1]; // Get parent from the previous depth
            if (parent) {
                parent.children.push(node);
                parents[depth] = node; // Set as parent for the current depth
            } else {
                console.warn(`⚠️ Item "${name}" (depth ${depth}) has no corresponding parent.`);
            }
        }
    });
    return tree;
  };

  // Changed mobileMenuButton to mobileMenuButtonInNav because its ID changed
  const mobileMenuButtonInNav = document.getElementById('mobile-menu-button-in-nav');
  const mainMenuNav = document.getElementById('main-menu-nav');

  // Get initial links directly from the UL element #main-menu-nav
  // Ensure data-original-name is correctly retrieved
  const initialLinks = Array.from(mainMenuNav.children).map(li => {
      const anchor = li.querySelector('a');
      return {
          name: anchor ? anchor.getAttribute('data-original-name') || anchor.textContent.trim() : '',
          target: anchor ? anchor.href : '#',
          element: li // Store reference to the original li
      };
  }).filter(link => link.name); // Filter out potentially empty links

  console.log('Initial Links from b:loop (main-menu-nav):', initialLinks);

  // Remove existing menu items from mainMenuNav before rebuilding
  // This is important because Blogger already renders flat items here.
  while (mainMenuNav.firstChild) {
      mainMenuNav.removeChild(mainMenuNav.firstChild);
  }
  
  if (initialLinks.length) {
    // No need to explicitly call buildTree here if createNestedMenu already handles it
    // const tree = buildTree(initialLinks); // This is only for structure visualization, not used for rendering

    // Render the main menu (desktop and mobile)
    const finalMenuUlContent = createNestedMenu(initialLinks, 0, 0).ul;
    while (finalMenuUlContent.firstChild) {
        mainMenuNav.appendChild(finalMenuUlContent.firstChild);
    }
    console.log('Main menu rendered (desktop and mobile structure).');
  } else {
    console.log('No initial links found to render menus. Please check your Blogger LinkList widget settings.');
  }

  // Mobile menu (hamburger) button functionality
  if (mobileMenuButtonInNav && mainMenuNav) {
      mobileMenuButtonInNav.addEventListener('click', function() {
          mainMenuNav.classList.toggle('show'); // Toggle 'show' class on mainMenuNav
      });
  }

  // Close dropdown if clicked outside
  document.addEventListener('click', function(e) {
      // Close mobile main menu if clicked outside (if open)
      if (mainMenuNav && mainMenuNav.classList.contains('show') && !mainMenuNav.contains(e.target) && e.target !== mobileMenuButtonInNav) {
          mainMenuNav.classList.remove('show');
      }

      // Close nested dropdowns/submenus if clicked outside the parent li
      document.querySelectorAll('.group.show-dropdown').forEach(liWithDropdown => { // Target li with 'show-dropdown'
          const dropdownMenu = liWithDropdown.querySelector('.dropdown-menu, .dropdown-submenu');
          const dropdownToggle = liWithDropdown.querySelector('.dropdown-toggle');
          
          if (dropdownMenu && !liWithDropdown.contains(e.target)) { // Check if click is outside the li
              liWithDropdown.classList.remove('show-dropdown');
              if (dropdownToggle) {
                  // Removed: dropdownToggle.querySelector('.dropdown-arrow')?.classList.remove('rotated');
              }
          }
      });
  });

  // --- Function for "Select Vehicle Category" dropdown ---
  const vehicleCategorySelect = document.getElementById('vehicleCategorySelect');
  // Get reference to the UL inside LinkList2 to get data
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
                  option.value = categoryUrl; // Use URL as value
                  option.textContent = categoryName;
                  vehicleCategorySelect.appendChild(option);
              }
          });
      } else {
          console.warn('WARNING: LinkList2 data element or vehicleCategorySelect dropdown not found to populate vehicle categories.');
      }
  }

  // Event listener to navigate to URL when an option is selected
  if (vehicleCategorySelect) {
      vehicleCategorySelect.addEventListener('change', function() {
          const selectedUrl = this.value;
          if (selectedUrl) {
              // Use SPA navigation for category selection
              loadPageContent(selectedUrl);
          }
      });
  }

  // Call function to populate dropdown when DOM is loaded
  populateVehicleCategoryDropdown();

  // --- Estimation Modal Functionality with LocalStorage ---
  const openEstimasiModalBtn = document.getElementById('openEstimasiModal');
  
  // Only proceed with modal initialization if the button exists on the page
  if (openEstimasiModalBtn) { // PERBAIKAN: Tambahkan pengecekan di sini
      const estimasiModal = document.getElementById('estimasiModal');
      const closeEstimasiModalBtn = document.getElementById('closeEstimasiModal');
      const estimasiTableBody = document.getElementById('estimasiTableBody');
      const estimasiModalContent = document.getElementById('estimasiModalContent'); // Modal content element
      const headerTableWrapper = document.querySelector('.header-table-wrapper'); // New: Header table wrapper
      const bodyTableWrapper = document.querySelector('.body-table-wrapper'); // New: Body table wrapper
      const downloadPdfBtn = document.getElementById('downloadPdfBtn'); // New: Download PDF button

      // New part input row elements (now global within this scope)
      let newPartKodePartInput;
      let newPartDeskripsiInput;
      let newPartQtyInput;
      let newPartHargaInput;
      let addPartBtn;

      // Nested modal elements
      const openKirimEstimasiModalBtn = document.getElementById('openKirimEstimasiModalBtn');
      const kirimEstimasiModal = document.getElementById('kirimEstimasiModal');
      const closeKirimEstimasiModalBtn = document.getElementById('closeKirimEstimasiModal');
      const estimasiForm = document.getElementById('estimasiForm'); // The form is now inside the nested modal

      // Estimation data will be stored here
      let estimasiItems = [];

      // Function to load data from localStorage
      function loadEstimasiFromLocalStorage() {
          const storedData = localStorage.getItem('estimasiData');
          if (storedData) {
              try {
                  estimasiItems = JSON.parse(storedData);
              }
              catch (e) {
                  console.error("Error parsing estimasi data from localStorage:", e);
                  estimasiItems = []; // Reset if there's a parsing error
              }
          } else {
              // If no data in localStorage, initialize as an empty array.
              // Dummy data has been removed as per user request.
              // estimasiItems = []; // This line is not needed if we always initialize as empty or load from storage
          }
      }

      // Function to save data to localStorage
      function saveEstimasiToLocalStorage() {
          localStorage.setItem('estimasiData', JSON.stringify(estimasiItems));
      }

      /**
       * Adds a new item to the estimation list or updates the quantity of an existing item.
       * @param {Object} newItem - The item to add or update.
       * @param {boolean} [isIncrement=true] - If true, increments quantity. If false, decrements.
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

          // Adjusted to also check description for existing items
          const existingIndex = estimasiItems.findIndex(item =>
              item.kodePart.trim().toUpperCase() === kodeBaru &&
              item.deskripsi.trim() === deskripsiBaru
          );

          if (existingIndex !== -1) {
              if (isIncrement) {
                  estimasiItems[existingIndex].qty += qtyBaru;
                  // Show toast feedback
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
          } else if (isIncrement) { // Only add new item if it's an increment operation
              estimasiItems.push({
                  kodePart: kodeBaru,
                  deskripsi: deskripsiBaru,
                  qty: qtyBaru,
                  harga: hargaBaru
              });
              // Show toast feedback
              showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) ditambahkan ke keranjang dengan ${qtyBaru}x`);
          } else {
              // If trying to decrement a non-existent item, do nothing or show a message
              showMessageBox(`Part '${deskripsiBaru}' (${kodeBaru}) tidak ditemukan di keranjang.`);
          }

          saveEstimasiToLocalStorage();
          renderEstimasiTable();
      }

      // Function to re-render the table and update badges
      function renderEstimasiTable() {
        const estimasiTableBody = document.getElementById('estimasiTableBody');
        if (!estimasiTableBody) return;

        estimasiTableBody.innerHTML = '';
        let totalBelanja = 0;
        let totalQuantity = 0; // Initialize total quantity

        // Render existing items
        estimasiItems.forEach((item, index) => {
            const jumlah = item.qty * item.harga;
            totalBelanja += jumlah;
            totalQuantity += item.qty; // Accumulate total quantity

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

        // Add the new part input row
        const newPartRow = document.createElement('tr');
        newPartRow.classList.add('estimasi-input-row'); // Add class for styling
        newPartRow.innerHTML = `
            <td class="text-center text-gray-400">#</td>
            <td><input type="text" id="newPartKodePart" placeholder="Kode Part" /></td>
            <td><input type="text" id="newPartDeskripsi" placeholder="Deskripsi" readonly /></td> <!-- Added readonly here -->
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

        // Re-assign global references to new input elements after they are rendered
        newPartKodePartInput = document.getElementById('newPartKodePart');
        newPartDeskripsiInput = document.getElementById('newPartDeskripsi');
        newPartQtyInput = document.getElementById('newPartQty');
        newPartHargaInput = document.getElementById('newPartHarga');
        addPartBtn = document.getElementById('addPartBtn');

        // Re-attach event listeners for the new part input row
        if (addPartBtn) {
            addPartBtn.onclick = function() { // Use onclick to easily re-assign
                const kodePart = newPartKodePartInput.value.trim();
                const deskripsi = newPartDeskripsiInput.value.trim();
                const qty = parseInt(newPartQtyInput.value, 10);
                const hargaStr = newPartHargaInput.value.replace(/[^0-9]/g, ''); // Remove non-numeric
                const harga = parseInt(hargaStr, 10);

                if (kodePart && deskripsi && !isNaN(qty) && qty > 0 && !isNaN(harga) && harga >= 0) {
                    const newItem = {
                        kodePart: kodePart,
                        deskripsi: deskripsi,
                        qty: qty,
                        harga: harga
                    };
                    addEstimasiItem(newItem, true); // Add as new item
                    // Clear input fields after adding
                    newPartKodePartInput.value = '';
                    newPartDeskripsiInput.value = '';
                    newPartQtyInput.value = '1';
                    newPartHargaInput.value = '';
                } else {
                    showMessageBox('Mohon lengkapi semua kolom input part baru dengan benar (Kode Part, Deskripsi, Qty > 0, Harga >= 0).');
                }
            };
        }

        // Add event listener for newPartKodePartInput to fetch data
        if (newPartKodePartInput) {
            newPartKodePartInput.addEventListener('change', async function() {
                const kodePart = this.value.trim().toUpperCase();
                if (kodePart) {
                    const sheetURL = "https://opensheet.elk.sh/1AlEA83WkT1UyXnnbPBxbXgPhdNUiCP_yarCIk_RhN5o/PartMaster"; 
                    try {
                        const res = await fetch(sheetURL);
                        if (!res.ok) {
                            throw new Error(`Failed to fetch sheet: ${res.status}`);
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
                        console.error("Error fetching part data:", error);
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
        // End of new part input row event listeners

        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="5" class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Total:</td>
            <td class="py-2 px-4 border-t border-gray-200 text-right font-semibold">Rp ${totalBelanja.toLocaleString('id-ID')}</td>
            <td class="py-2 px-4 border-t border-gray-200 text-sm"></td>
        `;
        estimasiTableBody.appendChild(totalRow);

        // Listener untuk qty input (existing items)
        document.querySelectorAll('.qty-input-table').forEach(input => {
            input.addEventListener('change', e => {
                const newQty = parseInt(e.target.value, 10);
                const idx = parseInt(e.target.dataset.index);

                if (!isNaN(newQty) && newQty > 0 && idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty = newQty;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable(); // Re-render to update totals and other rows
                    showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi ${newQty}x`);
                } else {
                    // If newQty is 0 or less, treat it as a delete
                    if (newQty <= 0 && idx >= 0 && idx < estimasiItems.length) {
                        const namaItem = estimasiItems[idx].deskripsi;
                        estimasiItems.splice(idx, 1);
                        showMessageBox(`Part '${namaItem}' telah dihapus dari estimasi.`);
                    } else {
                        showMessageBox(`Qty tidak valid. Masukkan angka lebih dari 0.`);
                        // Revert input value to previous valid quantity
                        e.target.value = estimasiItems[idx].qty;
                    }
                }
            });
        });

        // Listener for price input (existing items)
        document.querySelectorAll('.price-input-table').forEach(input => {
            input.addEventListener('change', e => {
                const newPriceString = e.target.value.replace(/[^0-9]/g, ''); // Remove non-numeric characters
                const newPrice = parseInt(newPriceString, 10);
                const idx = parseInt(e.target.dataset.index);

                if (!isNaN(newPrice) && newPrice >= 0 && idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].harga = newPrice;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable(); // Re-render to update totals and other rows
                    showMessageBox(`Harga untuk '${estimasiItems[idx].deskripsi}' diperbarui jadi Rp ${newPrice.toLocaleString('id-ID')}`);
                } else {
                    showMessageBox(`Harga tidak valid. Masukkan angka yang benar.`);
                    // Revert input value to previous valid price
                    e.target.value = `Rp ${estimasiItems[idx].harga.toLocaleString('id-ID')}`;
                }
            });
        });

        // Listener untuk tombol hapus (existing items)
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                let idx = parseInt(e.target.dataset.index); // Changed from const to let
                if (isNaN(idx)) { // If click was on the icon, get parent button's dataset
                    const parentButton = e.target.closest('button');
                    if (parentButton) {
                        idx = parseInt(parentButton.dataset.index); // Use parentButton.dataset.index
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

        // Listener for plus button (now qty-btn-up) (existing items)
        document.querySelectorAll('.qty-btn-up').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index); // Handle click on icon or button itself
                if (idx >= 0 && idx < estimasiItems.length) {
                    estimasiItems[idx].qty++;
                    saveEstimasiToLocalStorage();
                    renderEstimasiTable();
                    showMessageBox(`Qty untuk '${estimasiItems[idx].deskripsi}' ditambahkan jadi ${estimasiItems[idx].qty}x`);
                }
            });
        });

        // Listener for minus button (now qty-btn-down) (existing items)
        document.querySelectorAll('.qty-btn-down').forEach(btn => {
            btn.addEventListener('click', e => {
                const idx = parseInt(e.target.dataset.index || e.target.closest('button').dataset.index); // Handle click on icon or button itself
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

        // Update the quantity badge
        const estimasiQtyBadge = document.getElementById('estimasiQtyBadge');
        if (estimasiQtyBadge) {
            estimasiQtyBadge.textContent = totalQuantity.toString();
            if (totalQuantity > 0) {
                estimasiQtyBadge.classList.add('show-badge');
            } else {
                estimasiQtyBadge.classList.remove('show-badge');
            }
        }

        // Update the price badge
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

      // Function to delete an item from estimation (kept for consistency, though now handled by renderEstimasiTable's event listener for delete buttons)
      function deleteEstimasiItem(index) {
          if (index > -1 && index < estimasiItems.length) {
              const deletedItem = estimasiItems.splice(index, 1); // Remove item from array
              showMessageBox(`Part '${deletedItem[0].deskripsi}' dihapus dari keranjang.`);
              saveEstimasiToLocalStorage(); // Save changes to localStorage
              renderEstimasiTable(); // Re-render table
          }
      }

      // Function to generate PDF
      function generatePdf() {
          // Create a new jsPDF instance
          const { jsPDF } = window.jspdf;
          const doc = new jsPDF();

          // Define columns for the PDF table
          const columns = [
              { header: 'No', dataKey: 'no' },
              { header: 'Kode Part', dataKey: 'kodePart' },
              { header: 'Deskripsi', dataKey: 'deskripsi' },
              { header: 'Qty', dataKey: 'qty' },
              { header: 'Harga (Rp)', dataKey: 'harga' },
              { header: 'Jumlah (Rp)', dataKey: 'jumlah' }
          ];

          // Prepare data for the PDF table
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

          // Calculate total
          let totalBelanja = 0;
          estimasiItems.forEach(item => {
              totalBelanja += item.qty * item.harga;
          });

          // Add title to the PDF
          doc.setFontSize(18);
          doc.text("Daftar Estimasi Sparepart", 105, 20, null, null, "center"); // Changed title here

          // Add table to the PDF
          doc.autoTable({
              startY: 30, // Start table below the title
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
                  3: { halign: 'center', cellWidth: 15 }, // Qty (Adjusted from right to center)
                  4: { halign: 'right', cellWidth: 25 }, // Harga (Increased from 25 to 30)
                  5: { halign: 'right', cellWidth: 30 }  // Jumlah
              },
              didDrawPage: function(data) {
                  // Footer
                  let str = "Halaman " + doc.internal.getNumberOfPages();
                  doc.setFontSize(10);
                  doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
              }
          });

          // Add total row below the table
          const finalY = doc.autoTable.previous.finalY;
          doc.setFontSize(10);
          doc.text(`Total Belanja: Rp ${totalBelanja.toLocaleString('id-ID')}`, doc.internal.pageSize.width - doc.internal.pageSize.width / 4, finalY + 10, null, null, "right");


          // Save the PDF
          doc.save('estimasi_belanja.pdf');
          showMessageBox('Daftar estimasi Anda telah diunduh sebagai PDF!');
      }

      // Ensure all modal elements are found before attaching event listeners
      // PERBAIKAN: Hapus pengecekan openEstimasiModalBtn dari sini, karena sudah dilakukan di atas.
      if (estimasiModal && closeEstimasiModalBtn && estimasiTableBody && estimasiModalContent && headerTableWrapper && bodyTableWrapper && downloadPdfBtn && openKirimEstimasiModalBtn && kirimEstimasiModal && closeKirimEstimasiModalBtn && estimasiForm) {
          console.log('Modal elements found. Attaching event listeners.');
          
          // Load data when the page is first loaded
          loadEstimasiFromLocalStorage();
          renderEstimasiTable(); // Call this to populate badges initially as well

          // Event listener to open main estimasi modal when "Estimasi" button is clicked
          openEstimasiModalBtn.addEventListener('click', async function() {
              console.log('Open button clicked. Modal classList BEFORE:', estimasiModal.classList.value);
              estimasiModal.classList.remove('hidden'); // Remove 'hidden' class to display modal
              // Add class to body to prevent background scrolling
              document.body.classList.add('modal-open');
              console.log('Modal classList AFTER remove hidden:', estimasiModal.classList.value);

              // Calculate available height for the scrollable table body
              // This must be called after the modal is displayed
              const modalContentHeight = estimasiModalContent.offsetHeight;
              const modalTitleHeight = estimasiModalContent.querySelector('h3').offsetHeight;
              const buttonContainerHeight = estimasiModalContent.querySelector('.mt-4.flex.justify-end.gap-2').offsetHeight; // Adjusted selector for the download button container
              const gap = 15; // Gap between elements in estimasiModalContent

              // Recalculate headerTableHeight after modal is visible and rendered
              // This is crucial for accurate height calculation
              const headerTableHeight = headerTableWrapper.offsetHeight;
              // newPartInputRowHeight is no longer separate, it's part of the scrollable body

              // Calculate total space taken by non-scrollable elements
              const spaceTaken = modalTitleHeight + headerTableHeight + (3 * gap); // 3 gaps: title-table, table-body, body-table-button-container

              // Calculate available height for the bodyTableWrapper
              const availableHeightForBodyTable = modalContentHeight - spaceTaken;
              bodyTableWrapper.style.maxHeight = `${availableHeightForBodyTable}px`;
              bodyTableWrapper.style.height = 'auto'; // Ensure height is flexible if content is smaller

              // --- START: Dynamic column width synchronization ---
              // This needs to be called AFTER the modal is visible and rendered
              // to get accurate computed styles.
              const headerCols = headerTableWrapper.querySelectorAll('col');
              const bodyCols = bodyTableWrapper.querySelectorAll('col');

              // Then, synchronize widths
              headerCols.forEach((col, i) => {
                  const width = window.getComputedStyle(col).width;
                  if (bodyCols[i]) {
                      bodyCols[i].style.width = width;
                      bodyCols[i].style.minWidth = width; // Add minWidth
                      bodyCols[i].style.maxWidth = width; // Add maxWidth
                  }
              });
              // --- END: Dynamic column width synchronization ---

              // Call function to fetch estimation data from Blogger
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
                      console.log('Estimation data successfully merged and re-rendered from Blogger.');
                  } else {
                      console.log('No new estimation data from Blogger. Using existing local data.');
                      renderEstimasiTable();
                  }
              } catch (error) {
                  console.error("Failed to fetch estimation data from Blogger:", error);
                  renderEstimasiTable();
              }
          });

          // Event listener to close main estimasi modal when close (X) button is clicked
          closeEstimasiModalBtn.addEventListener('click', function() {
              console.log('Close main modal clicked. Modal classList BEFORE:', estimasiModal.classList.value);
              estimasiModal.classList.add('hidden');
              document.body.classList.remove('modal-open');
              console.log('Modal classList AFTER add hidden:', estimasiModal.classList.value);
          });

          // Event listener to close main estimasi modal if clicked outside modal content (on overlay)
          estimasiModal.addEventListener('click', function(e) {
              if (e.target === estimasiModal) {
                  console.log('Overlay clicked. Modal classList BEFORE:', estimasiModal.classList.value);
                  estimasiModal.classList.add('hidden');
                  document.body.classList.remove('modal-open');
                  console.log('Modal classList AFTER add hidden:', estimasiModal.classList.value);
              }
          });

          // Event listener for the new Download PDF button
          downloadPdfBtn.addEventListener('click', generatePdf);

          // Event listener to open nested modal when "Kirim Estimasi" button is clicked
          openKirimEstimasiModalBtn.addEventListener('click', function() {
              if (estimasiItems.length === 0) {
                  showMessageBox('Tidak ada item dalam estimasi untuk dikirim.');
                  return;
              }
              kirimEstimasiModal.classList.remove('hidden');
          });

          // Event listener to close nested modal when close (X) button is clicked
          closeKirimEstimasiModalBtn.addEventListener('click', function() {
              kirimEstimasiModal.classList.add('hidden');
          });

          // Event listener to close nested modal if clicked outside modal content (on overlay)
          kirimEstimasiModal.addEventListener('click', function(e) {
              if (e.target === kirimEstimasiModal) {
                  kirimEstimasiModal.classList.add('hidden');
              }
          });

          // Event listener for the form submission inside the nested modal
          estimasiForm.addEventListener('submit', function(e) {
              e.preventDefault(); // Prevent default form submission
              const nama = document.getElementById('namaPengirim').value;
              const noHandphone = document.getElementById('noHandphone').value; // Get phone number
              const email = document.getElementById('emailPengirim').value;
              
              showMessageBox(`Estimasi berhasil dikirim oleh ${nama} (${email}, ${noHandphone})!`);
              console.log('Estimasi dikirim:', { items: estimasiItems, nama: nama, noHandphone: noHandphone, email: email });

              // Optionally clear the form and estimation items after submission
              // estimasiItems = [];
              // saveEstimasiToLocalStorage();
              // renderEstimasiTable();
              // document.getElementById('namaPengirim').value = '';
              // document.getElementById('noHandphone').value = ''; // Clear phone number
              // document.getElementById('emailPengirim').value = '';

              kirimEstimasiModal.classList.add('hidden'); // Close the nested modal after submission
              estimasiModal.classList.add('hidden'); // Close the main modal after submission
              document.body.classList.remove('modal-open'); // Re-enable scrolling
          });
      } else {
          // This else block will now only be hit if openEstimasiModalBtn exists, but other modal elements don't.
          // Which is highly unlikely if the HTML structure is correct.
          console.warn('WARNING: Some modal elements are missing even though the open button exists. Check IDs and HTML structure.');
      }
  } else {
      console.log('INFO: Estimasi modal button not found. Modal functionality will not be initialized on this page.');
  }

  /**
   * Fetches all estimation data from Blogger posts.
   * Each post is expected to have a <script class="data-estimasi" type="application/json"> element
   * containing a JSON array of estimation items.
   * @returns {Promise<Array<Object>>} Combined array of all estimation items.
   */
  async function ambilSemuaEstimasi() {
      console.log("Starting estimation data fetch from Blogger...");
      const url = "/feeds/posts/default/-/estimasi?alt=json&max-results=50";
      let estimasiGabungan = [];

      try {
          const res = await fetch(url);
          if (!res.ok) {
              throw new Error(`HTTP error! status: ${res.status}`);
          }
          const json = await res.json();
          const entries = json.feed.entry || [];

          const parser = new DOMParser();

          for (const entry of entries) {
              const htmlContent = entry.content?.$t;
              if (htmlContent) {
                  // Parse the HTML content of the entry into a new DOM document
                  const docFromHtml = parser.parseFromString(htmlContent, 'text/html');
                  // Query the script node from the newly parsed document
                  const scriptNode = docFromHtml.querySelector("script.data-estimasi[type='application/json']");
                  if (scriptNode && scriptNode.textContent) {
                      try {
                          const data = JSON.parse(scriptNode.textContent);
                          if (Array.isArray(data)) {
                              estimasiGabungan.push(...data);
                              console.log(`Successfully parsed data from post: ${entry.title?.$t}`);
                          } else {
                              console.warn(`Estimation data in post "${entry.title?.$t}" is not an array. Skipping.`);
                          }
                      } catch (e) {
                          console.warn(`Failed to parse JSON in post "${entry.title?.$t}":`, e);
                      }
                  } else {
                      console.log(`No script.data-estimasi found in post: ${entry.title?.$t}`);
                  }
              } else {
                  console.log(`Empty HTML content for post: ${entry.title?.$t}`);
              }
          }
          console.log(`Estimation data fetch complete. Total items: ${estimasiGabungan.length}`);
      }
      catch (error) {
          console.error("Error fetching estimation data from Blogger:", error);
      }
      return estimasiGabungan;
  }

  // Make relevant functions globally accessible
  window.updateEstimasiBadges = renderEstimasiTable;
  // Modified addEstimasiItem to accept isIncrement parameter
  window.addEstimasiItem = function(item) {
      addEstimasiItem(item, true); // Default to increment
  };
  // Removed window.decrementEstimasiItem as its functionality is now handled by qty input and delete button
  window.getEstimasiItems = function() {
      return [...estimasiItems];
  };
  window.clearEstimasi = function() {
      estimasiItems = [];
      saveEstimasiToLocalStorage();
      renderEstimasiTable();
  };

  // 1️⃣ Bagian pertama — Membuat mapping semua judul postingan
  // Initialize window.postMap globally
  window.postMap = {}; 
  
  // ✅ Load mapping postMap dari localStorage jika tersedia
  try {
      const cached = localStorage.getItem('cachedPostMap');
      if (cached) {
          window.postMap = JSON.parse(cached);
          console.log("✅ Loaded postMap from localStorage:", window.postMap);
      }
  } catch (e) {
      console.error("❌ Error loading postMap from localStorage:", e);
      window.postMap = {};
  }

  // Function to populate postMap
  function populatePostMap() {
      return new Promise(resolve => { // Return a Promise
          const postMappingContainer = document.getElementById('postMappingHidden'); 
          console.log("Starting populatePostMap function...");
          if (postMappingContainer) {
              // Log the innerHTML to see if Blogger rendered the links
              console.log("Content of #postMappingHidden:", postMappingContainer.innerHTML);

              const links = postMappingContainer.querySelectorAll('a');
              console.log(`Found ${links.length} <a> tags in #postMappingHidden.`);

              links.forEach(link => {
                  const title = link?.textContent?.trim();
                  const url = link?.href;
                  if (title && url) {
                      // Sanitize the title to create the key: lowercase, trim, remove all spaces
                      const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, ''); 
                      window.postMap[sanitizedTitle] = url; // Use window.postMap
                      // NEW DEBUGGING: Log each item added to postMap
                      console.log(`✅ Mapped Post: Original Title from Blogger: "${title}" -> Sanitized Key: "${sanitizedTitle}" -> URL: "${url}"`);
                  } else {
                      console.warn(`⚠️ Skipping link due to missing title or URL: TextContent="${link?.textContent}", Href="${link?.href}"`);
                  }
              });
              console.log("Final window.postMap content after populating from Blogger:");
              console.table(window.postMap); // Log the entire map as a table
              localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap)); // Save to localStorage
              console.log("✅ Saved postMap to localStorage.");
              resolve(); // Resolve the promise once populated
          } else {
              console.warn("❌ #postMappingHidden container not found. This widget should be present on the index page.");
              // Fallback: If not on index page or PostMappingHidden widget not present,
              // try to get post URLs from currently rendered .post articles
              const posts = document.querySelectorAll('.post');
              console.log(`Found ${posts.length} .post articles (fallback).`);
              posts.forEach(post => {
                  const titleElement = post.querySelector('h1 a'); 
                  const title = titleElement?.textContent?.trim();
                  const url = titleElement?.href;
                  if (title && url) {
                      // Sanitize the title to create the key: lowercase, trim, remove all spaces
                      const sanitizedTitle = title.toLowerCase().trim().replace(/\s+/g, ''); 
                      window.postMap[sanitizedTitle] = url; // Use window.postMap
                      // NEW DEBUGGING: Log each item added to postMap
                      console.log(`✅ Mapped Post (Fallback): Original Title from Blogger: "${title}" -> Sanitized Key: "${sanitizedTitle}" -> URL: "${url}"`);
                  } else {
                      console.warn(`⚠️ Skipping fallback post due to missing title or URL: TitleElementText="${titleElement?.textContent}", Href="${titleElement?.href}"`);
                  }
              });
              console.log("Final window.postMap content after populating from visible .post elements (fallback):");
              console.table(window.postMap); // Log the entire map as a table
              localStorage.setItem('cachedPostMap', JSON.stringify(window.postMap)); // Save to localStorage
              console.log("✅ Saved postMap (fallback) to localStorage.");
              resolve(); // Resolve the promise once populated
          }
      });
  }

  // Call populatePostMap when the DOM is ready, and then proceed with other initializations
  populatePostMap().then(() => {
      // 🧩 Fungsi resolusi otomatis URL postingan fig
      function resolveFigLink(item) {
        // Mengubah slug agar menghilangkan semua spasi, bukan menggantinya dengan tanda hubung
        const slug = item.judul_artikel?.toLowerCase().trim().replace(/\s+/g, '');
        if (window.postMap?.[slug]) return window.postMap[slug];
        
        // Fallback default struktur: menghilangkan '/p/' dan menggunakan slug tanpa spasi/tanda hubung
        const currentYear = new Date().getFullYear();
        const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0'); // Get current month (01-12)
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
        const deskripsi = titleCase(item.deskripsi?.trim() || ''); // Apply titleCase here
        let html = `
          <div class="border border-gray-200 rounded-lg p-3 bg-white shadow-sm text-sm space-y-1">
            <h3 class="font-semibold text-blue-700">
              <a href="${link}" class="hover:underline spa-link"> <!-- Added spa-link class -->
                ${item.judul_artikel || 'Judul tidak tersedia'}
              </a>
            </h3>
            <p><strong>Kode Part:</strong><span class="bg-gray-100 px-2 py-0.5 rounded font-mono">${item.kodepart || 'N/A'}</span></p>`;
        
        // Add description only if it's not empty
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
            // Re-attach SPA listeners after new content is rendered
            attachSpaLinkListeners();
          })
          .catch(err => {
            console.error("⚠️ Fetch gagal:", err);
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

      // --- SPA Functionality ---
      const mainContentSection = document.getElementById('main-content-section');
      const spaLoadingIndicator = document.getElementById('spa-loading-indicator');

      /**
       * Shows the loading indicator.
       */
      function showLoading() {
          if (spaLoadingIndicator) {
              spaLoadingIndicator.classList.add('show');
              spaLoadingIndicator.classList.remove('complete');
          }
      }

      /**
       * Hides the loading indicator.
       */
      function hideLoading() {
          if (spaLoadingIndicator) {
              spaLoadingIndicator.classList.add('complete');
              setTimeout(() => {
                  spaLoadingIndicator.classList.remove('show', 'complete');
              }, 200); // Match with CSS transition
          }
      }

      /**
       * Loads page content via AJAX for SPA navigation.
       * @param {string} url - The URL to load.
       * @param {boolean} pushState - Whether to push the state to browser history.
       */
      async function loadPageContent(url, pushState = true) {
          if (!mainContentSection) {
              console.error('Main content section not found for SPA.');
              return;
          }

          showLoading();

          try {
              const response = await fetch(url);
              if (!response.ok) {
                  throw new Error(`HTTP error! status: ${response.status}`);
              }
              const html = await response.text();

              // Parse the fetched HTML
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');

              // Extract the new main content
              const newMainContent = doc.getElementById('main-content-section');
              if (newMainContent) {
                  // Replace the current main content
                  mainContentSection.innerHTML = newMainContent.innerHTML;

                  // Update page title
                  const newTitle = doc.querySelector('title')?.textContent || document.title;
                  document.title = newTitle;

                  // Update URL in browser history
                  if (pushState) {
                      history.pushState({ path: url }, newTitle, url);
                  }

                  // Scroll to top
                  window.scrollTo(0, 0);

                  // Re-attach event listeners for newly loaded content
                  // This is crucial for interactive elements within the main content area
                  attachSpaLinkListeners(); // Re-attach for new links
                  // Re-initialize any specific scripts for the main content if needed
                  // For example, if there were specific scripts for Blog1 widget content,
                  // you'd need a way to re-run them here. For now, assume main scripts are global.

                  // Re-initialize the vehicle category dropdown as its content might change
                  populateVehicleCategoryDropdown();

                  // Re-run the initial post map population in case new posts are loaded
                  // This is important for search functionality to correctly resolve links
                  populatePostMap();

                  console.log(`SPA: Loaded content for ${url}`);
              } else {
                  console.error(`SPA: Could not find #main-content-section in fetched content from ${url}`);
              }
          } catch (error) {
              console.error('SPA: Failed to load page content:', error);
              showMessageBox(`Gagal memuat halaman: ${error.message}.`);
              // Optionally revert URL or show error page
          } finally {
              hideLoading();
          }
      }

      /**
       * Attaches click listeners to all internal links for SPA navigation.
       * This function should be called initially and after any new content is loaded.
       */
      function attachSpaLinkListeners() {
          document.querySelectorAll('a').forEach(link => {
              // Remove existing listener to prevent duplicates
              link.removeEventListener('click', handleSpaLinkClick);
              
              // Only attach listener if it's an internal link and not a special link
              const href = link.getAttribute('href');
              if (href && 
                  !href.startsWith('#') && // Anchor links
                  !href.startsWith('mailto:') && // Email links
                  !href.startsWith('tel:') && // Telephone links
                  !link.target && // Not opening in a new tab
                  !link.classList.contains('no-spa') && // Explicitly opt-out
                  link.hostname === window.location.hostname // Same domain
              ) {
                  link.addEventListener('click', handleSpaLinkClick);
              }
          });
      }

      /**
       * Event handler for SPA link clicks.
       * @param {Event} e - The click event.
       */
      function handleSpaLinkClick(e) {
          const link = e.currentTarget;
          const href = link.getAttribute('href');

          // Prevent default navigation
          e.preventDefault();

          // Load content using SPA logic
          loadPageContent(href);
      }

      // Initial attachment of SPA link listeners
      attachSpaLinkListeners();

      // Handle browser back/forward buttons
      window.addEventListener('popstate', (e) => {
          // Load content for the state that was just popped
          // The URL is already updated by the browser for popstate
          loadPageContent(window.location.href, false); // Don't push state again
      });

  }); // End of populatePostMap().then()
});
