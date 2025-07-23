// Utility function to safely add CSS classes
function safeAddClass(element, ...classNames) {
    if (element && element.classList) {
        element.classList.add(...classNames);
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

            const anchor = document.createElement('a');
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

                li.appendChild(anchor);

                const nested = createNestedMenu(items, i + 1, currentLevel + 1);
                const subUl = nested.ul;

                safeAddClass(subUl, `depth-${currentLevel + 1}`, 'py-2', 'w-full');
                safeAddClass(subUl, currentLevel === 0 ? 'dropdown-menu' : 'dropdown-submenu');
                li.appendChild(subUl);

                // Add mobile toggle
                anchor.addEventListener('click', (e) => {
                    if (window.innerWidth < 768) {
                        e.preventDefault();
                        li.classList.toggle('show-dropdown');
                    }
                });

                i = nested.nextIndex - 1; // -1 because it will be ++ at the end
            } else {
                li.appendChild(anchor);
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

/**
 * Fungsi untuk mengisi dropdown "Pilih Kategori Kendaraan".
 */
function populateVehicleCategoryDropdown() {
    const vehicleCategorySelect = document.getElementById('vehicleCategorySelect');
    const linkList2Data = document.querySelector('#LinkList2 .widget-content ul');

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
        console.warn('PERINGATAN: Elemen data LinkList2 atau dropdown vehicleCategorySelect tidak ditemukan untuk mengisi kategori kendaraan.');
    }
}

/**
 * Fungsi inisialisasi untuk modul navigasi.
 */
window.initNav = function() {
    const mobileMenuButtonInNav = document.getElementById('mobile-menu-button-in-nav');
    const mainMenuNav = document.getElementById('main-menu-nav');

    // Get initial links directly from the UL element #main-menu-nav
    // Ensure data-original-name is correctly retrieved
    const initialLinks = Array.from(mainMenuNav.children).map(li => {
        const anchor = li.querySelector('a');
        return {
            name: anchor ? anchor.getAttribute('data-original-name') || anchor.textContent.trim() : '',
            target: anchor ? anchor.href : '#',
            element: li
        };
    }).filter(link => link.name); // Filter out potentially empty links

    console.log('Tautan Awal dari b:loop (main-menu-nav):', initialLinks);

    // Remove existing menu items from mainMenuNav before rebuilding
    // This is important because Blogger already renders flat items here.
    while (mainMenuNav.firstChild) {
        mainMenuNav.removeChild(mainMenuNav.firstChild);
    }

    if (initialLinks.length) {
        const finalMenuUlContent = createNestedMenu(initialLinks, 0, 0).ul;
        while (finalMenuUlContent.firstChild) {
            mainMenuNav.appendChild(finalMenuUlContent.firstChild);
        }
        console.log('Menu utama dirender (struktur desktop dan mobile).');
    } else {
        console.log('Tidak ada tautan awal yang ditemukan untuk merender menu. Harap periksa pengaturan widget LinkList Blogger Anda.');
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
        document.querySelectorAll('.group.show-dropdown').forEach(liWithDropdown => {
            const dropdownMenu = liWithDropdown.querySelector('.dropdown-menu, .dropdown-submenu');
            const dropdownToggle = liWithDropdown.querySelector('.dropdown-toggle');

            if (dropdownMenu && !liWithDropdown.contains(e.target)) {
                liWithDropdown.classList.remove('show-dropdown');
                if (dropdownToggle) {
                    dropdownToggle.querySelector('.dropdown-arrow')?.classList.remove('rotated');
                }
            }
        });
    });

    // Event listener to navigate to URL when an option is selected
    const vehicleCategorySelect = document.getElementById('vehicleCategorySelect');
    if (vehicleCategorySelect) {
        vehicleCategorySelect.addEventListener('change', function() {
            const selectedUrl = this.value;
            if (selectedUrl) {
                window.location.href = selectedUrl;
            }
        });
    }

    // Call function to populate dropdown
    populateVehicleCategoryDropdown();
};
