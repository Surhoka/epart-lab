/*======== AI Assistant JS =========*/

window.initAiAssistantPage = function () {
    console.log('Initializing AI Assistant Page...');

    if (typeof window.renderBreadcrumb === 'function') {
        window.renderBreadcrumb('AI Assistant');
    }

    // Initialize Components
    setupAiChat();
    setupAiConfig();
    setupRulesManager();
};

/* -------------------------------------------------------------------------- */
/*                               AI CHAT LOGIC                                */
/* -------------------------------------------------------------------------- */
function setupAiChat() {
    const searchInput = document.querySelector('#faq-search');
    const searchBtn = document.querySelector('#search-ask-ai');
    const aiResultContainer = document.querySelector('#ai-search-result');
    const aiResultContent = document.querySelector('#ai-result-content');
    const closeAiResult = document.querySelector('#close-ai-result');

    if (!searchInput || !searchBtn) return;

    const performSearch = () => {
        const query = searchInput.value.trim();
        if (!query) return;

        // Show Container & Loading State
        if (aiResultContainer) aiResultContainer.classList.remove('hidden');
        if (aiResultContent) {
            aiResultContent.innerHTML = `
                <div class="flex items-center gap-2 py-2">
                    <span class="h-2 w-2 animate-bounce rounded-full bg-blue-500"></span>
                    <span class="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0.2s]"></span>
                    <span class="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:0.4s]"></span>
                    <span class="text-xs text-gray-500 ml-2">AI sedang berpikir...</span>
                </div>`;
        }

        // Call Backend
        if (typeof window.sendDataToGoogle === 'function') {
            window.sendDataToGoogle('askAi', { question: query }, (response) => {
                if (response.status === 'success') {
                    typeEffect(aiResultContent, response.answer);
                } else {
                    aiResultContent.innerHTML = `<div class="text-red-500 p-2 text-sm">Error: ${response.message || 'Gagal mendapatkan respon.'}</div>`;
                }
            }, (error) => {
                aiResultContent.innerHTML = `<div class="text-red-500 p-2 text-sm">Koneksi gagal. Silakan coba lagi.</div>`;
            });
        }
    };

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    if (closeAiResult) {
        closeAiResult.addEventListener('click', () => {
            aiResultContainer.classList.add('hidden');
        });
    }
}

/* -------------------------------------------------------------------------- */
/*                             CONFIGURATION LOGIC                            */
/* -------------------------------------------------------------------------- */
function setupAiConfig() {
    const saveConfigBtn = document.querySelector('#save-ai-config-btn');
    const modelSelect = document.querySelector('#ai-model-select');
    const apiKeyInput = document.querySelector('#ai-api-key');

    // Load existing config
    if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('getAiConfig', {}, (res) => {
            if (res.status === 'success' && res.data) {
                if (modelSelect) modelSelect.value = res.data.model || 'gemini-1.5-flash';
                // Don't show the actual key, just placeholder if it exists
                if (apiKeyInput && res.data.hasKey) {
                    apiKeyInput.placeholder = "•••••••••••••••• (Terpasang)";
                }
            }
        });
    }

    // Save config
    if (saveConfigBtn) {
        saveConfigBtn.addEventListener('click', () => {
            const model = modelSelect ? modelSelect.value : '';
            const apiKey = apiKeyInput ? apiKeyInput.value : '';

            window.setButtonLoading(saveConfigBtn, true);

            window.sendDataToGoogle('saveAiConfig', { model, apiKey }, (res) => {
                window.setButtonLoading(saveConfigBtn, false);
                if (res.status === 'success') {
                    if (window.showToast) window.showToast('Konfigurasi AI berhasil disimpan', 'success');
                    if (apiKeyInput && apiKey) {
                        apiKeyInput.value = '';
                        apiKeyInput.placeholder = "•••••••••••••••• (Terpasang)";
                    }
                } else {
                    if (window.showToast) window.showToast('Gagal menyimpan: ' + res.message, 'error');
                }
            });
        });
    }
}

/* -------------------------------------------------------------------------- */
/*                            RULES MANAGEMENT LOGIC                          */
/* -------------------------------------------------------------------------- */
function setupRulesManager() {
    const tableBody = document.querySelector('table tbody');

    // Load Rules
    loadRules(tableBody);
}

function loadRules(tableBody) {
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500"><div class="flex justify-center"><span class="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></span></div></td></tr>`;

    if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('getAiRules', {}, (res) => {
            if (res.status === 'success' && Array.isArray(res.data)) {
                renderRulesTable(tableBody, res.data);
            } else {
                tableBody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">Belum ada rules yang ditambahkan.</td></tr>`;
            }
        });
    }
}

function renderRulesTable(tbody, rules) {
    if (rules.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="px-6 py-4 text-center text-gray-500">Belum ada rules yang ditambahkan.</td></tr>`;
        return;
    }

    tbody.innerHTML = rules.map(rule => `
        <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">
                    ${rule.active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs" title="${rule.prompt}">
                    ${rule.prompt}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button onclick="window.editAiRule('${rule.id}')" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</button>
                <button onclick="window.deleteAiRule('${rule.id}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Hapus</button>
            </td>
        </tr>
    `).join('');

    // Store rules globally for edit access
    window._aiRulesCache = rules;
}

/* -------------------------------------------------------------------------- */
/*                                MODAL LOGIC                                 */
/* -------------------------------------------------------------------------- */
window.openRuleModal = function (rule = null) {
    const title = document.getElementById('aiRuleModalTitle');
    const idInput = document.getElementById('rule-id');
    const promptInput = document.getElementById('rule-prompt');
    const activeInput = document.getElementById('rule-active');

    if (rule) {
        title.textContent = 'Edit Rule';
        idInput.value = rule.id;
        promptInput.value = rule.prompt;
        activeInput.checked = rule.active;
    } else {
        title.textContent = 'Rule Baru';
        idInput.value = '';
        promptInput.value = '';
        activeInput.checked = true;
    }

    const container = document.getElementById('ai-assistant-container');
    if (container && window.Alpine) {
        window.Alpine.$data(container).isRuleModalOpen = true;
    } else {
        const modal = document.getElementById('aiRuleModal');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }
}

window.closeRuleModal = function () {
    const container = document.getElementById('ai-assistant-container');
    if (container && window.Alpine) {
        window.Alpine.$data(container).isRuleModalOpen = false;
    } else {
        const modal = document.getElementById('aiRuleModal');
        modal.classList.remove('show');
        modal.classList.add('hidden');
    }
}

window.saveRule = function () {
    const id = document.getElementById('rule-id').value;
    const prompt = document.getElementById('rule-prompt').value;
    const active = document.getElementById('rule-active').checked;
    const btn = document.getElementById('save-rule-btn');

    if (!prompt) {
        alert('Prompt wajib diisi');
        return;
    }

    window.setButtonLoading(btn, true);

    const action = id ? 'updateAiRule' : 'createAiRule';
    const payload = { id, prompt, active };

    window.sendDataToGoogle(action, payload, (res) => {
        window.setButtonLoading(btn, false);
        if (res.status === 'success') {
            window.closeRuleModal();
            if (window.showToast) window.showToast('Rule berhasil disimpan', 'success');
            loadRules(document.querySelector('table tbody'));
        } else {
            alert('Gagal menyimpan: ' + res.message);
        }
    });
}

// Global handlers for inline onclick events
window.editAiRule = function (id) {
    const rules = window._aiRulesCache || [];
    const rule = rules.find(r => r.id === id);
    if (rule) window.openRuleModal(rule);
};

window.deleteAiRule = function (id) {
    if (!confirm('Apakah Anda yakin ingin menghapus rule ini?')) return;

    window.sendDataToGoogle('deleteAiRule', { id }, (res) => {
        if (res.status === 'success') {
            if (window.showToast) window.showToast('Rule dihapus', 'success');
            loadRules(document.querySelector('table tbody'));
        } else {
            alert('Gagal menghapus: ' + res.message);
        }
    });
};

/* -------------------------------------------------------------------------- */
/*                                  UTILITIES                                 */
/* -------------------------------------------------------------------------- */
function typeEffect(element, text, speed = 10) {
    if (!text) return;
    element.innerHTML = "";

    // Simple Markdown Parsing
    const formattedText = text
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono text-sm text-red-500">$1</code>');

    // Create a temporary container to traverse nodes
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;

    const nodes = Array.from(tempDiv.childNodes);
    let nodeIndex = 0;
    let charIndex = 0;

    function type() {
        if (nodeIndex >= nodes.length) return;

        const node = nodes[nodeIndex];

        if (node.nodeType === Node.TEXT_NODE) {
            const chars = node.textContent;
            if (charIndex < chars.length) {
                element.innerHTML += chars.charAt(charIndex);
                charIndex++;
                setTimeout(type, speed);
            } else {
                nodeIndex++;
                charIndex = 0;
                setTimeout(type, speed);
            }
        } else {
            // For HTML elements (br, strong, etc), append directly
            element.appendChild(node.cloneNode(true));
            nodeIndex++;
            setTimeout(type, speed);
        }
    }

    type();
}
