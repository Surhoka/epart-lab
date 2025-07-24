// main-navigation.js

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

                // Add click event listener for both desktop and mobile
                anchor.addEventListener('click', (e) => {
                    e.preventDefault(); // Always prevent default navigation for dropdown toggles
                    li.classList.toggle('show-dropdown');
                });

                i = nested.nextIndex - 1; // -1 because it will be ++ at the end
            } else {
                li.appendChild(anchor);
            }

            currentLevelUl.appendChild(li);
            i++;
        } else if (leadingUnderscores < currentLevel) {
            console.log(`↩ [createMenu] Returning from level ${currentLevel} to ${leadingUnderscores}.`);
            break; // Go back to the previous parent
        } else {
            console.warn(`✳ Menu "${itemName}" skips a level. Skipping.`);
            i++;
        }
    }

    return { ul: currentLevelUl, nextIndex: i };
}

// Function to build a tree structure (currently not directly used for rendering, but kept for logical clarity)
const buildTree = (links) => {
    const tree = [];
    const parents = []; // Stores references to parent nodes at each depth

    links.forEach(raw => {
        const depth = (raw.name.trim().match(/^_+/) || [''])[0].length;
        const name = raw.name.replace(/^_*/, '');

        const node = {
            name: name,
            href: raw.target,
            children: []
        };

        if (depth === 0) {
            tree.push(node);
            parents[0] = node;
        } else {
            const parent = parents[depth - 1];
            if (parent) {
                parent.children.push(node);
                parents[depth] = node;
            } else {
                console.warn(`⚠️ Item "${name}" (depth ${depth}) has no corresponding parent.`);
            }
        }
    });
    return tree;
};

// DOMContentLoaded ensures elements are available
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuButtonInNav = document.getElementById('mobile-menu-button-in-nav');
    const mainMenuNav = document.getElementById('main-menu-nav');

    // Get initial links directly from the UL element #main-menu-nav
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
    while (mainMenuNav.firstChild) {
        mainMenuNav.removeChild(mainMenuNav.firstChild);
    }
    
    if (initialLinks.length) {
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
        document.querySelectorAll('.group.show-dropdown').forEach(liWithDropdown => {
            const dropdownMenu = liWithDropdown.querySelector('.dropdown-menu, .dropdown-submenu');
            
            if (dropdownMenu && !liWithDropdown.contains(e.target)) {
                liWithDropdown.classList.remove('show-dropdown');
            }
        });
    });
});
