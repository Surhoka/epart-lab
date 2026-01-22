/*======== AI Assistant JS =========*/

window.initFaqAiPage = function () {
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
    // Find "Rule Baru" button by text content since it has no ID in the provided HTML
    const buttons = Array.from(document.querySelectorAll('button'));
    const addRuleBtn = buttons.find(b => b.textContent.trim().includes('Rule Baru'));

    // Inject Modal if not exists
    injectRuleModal();

    // Load Rules
    loadRules(tableBody);

    // Add Rule Handler
    if (addRuleBtn) {
        addRuleBtn.addEventListener('click', () => {
            openRuleModal(); // Open in Create mode
        });
    }
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
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                    ${rule.response ? rule.response.substring(0, 50) + '...' : '-'}
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
function injectRuleModal() {
    if (document.getElementById('aiRuleModal')) return;

    const modalHtml = `
    <div id="aiRuleModal" class="fixed inset-0 z-[99999] p-4 md:p-5 overflow-hidden modal flex justify-center items-center hidden">
        <div class="modal-close-btn fixed inset-0 h-full w-full bg-gray-900/40 backdrop-blur-xl transition-opacity duration-300"></div>
        <div class="modal-dialog relative flex w-full max-w-[640px] flex-col max-h-[90vh] rounded-[32px] bg-white dark:bg-gray-800 p-8 shadow-2xl transition-all duration-300 lg:p-12 border border-gray-200 dark:border-gray-700">
            <!-- close btn -->
            <button class="modal-close-btn absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-all hover:scale-110">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>

            <div class="flex flex-col modal-content custom-scrollbar overflow-y-auto pr-2 min-h-0">
                <div class="modal-header border-b border-gray-200 dark:border-gray-700 pb-6 mb-8">
                    <h5 class="font-bold text-gray-900 dark:text-white text-2xl lg:text-3xl" id="aiRuleModalTitle">
                        Rule Baru
                    </h5>
                    <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Atur bagaimana AI merespon pertanyaan spesifik.
                    </p>
                </div>
                <div class="mt-8 modal-body">
                    <input type="hidden" id="rule-id">
                    <div>
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Prompt / Trigger</label>
                        <input type="text" id="rule-prompt" placeholder="Contoh: tanya harga, jam operasional" class="dark:bg-gray-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-blue-500 focus:outline-hidden focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-blue-800">
                    </div>
                    <div class="mt-6">
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Respon AI / Instruksi</label>
                        <textarea id="rule-response" rows="4" placeholder="Instruksi bagaimana AI harus menjawab..." class="dark:bg-gray-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-blue-500 focus:outline-hidden focus:ring-3 focus:ring-blue-500/10 dark:border-gray-700 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-blue-800"></textarea>
                    </div>
                    <div class="mt-6">
                        <div class="flex items-center">
                            <input id="rule-active" type="checkbox" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600">
                            <label for="rule-active" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">Aktifkan Rule ini</label>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col-reverse sm:flex-row items-center gap-3 mt-10 modal-footer border-t border-gray-200 dark:border-gray-700 pt-8">
                    <button type="button" id="close-rule-modal-btn" class="modal-close-btn w-full sm:w-auto flex justify-center items-center rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700">
                        Batal
                    </button>
                    <button type="button" id="save-rule-btn" class="w-full sm:w-auto flex justify-center items-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-700 hover:scale-105 ml-auto">
                        Simpan
                    </button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Bind Modal Events
    const modal = document.getElementById('aiRuleModal');

    // Close on click outside or close button (delegation)
    modal.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-close-btn') || e.target.closest('.modal-close-btn') || e.target === modal) {
            closeRuleModal();
        }
    });

    document.getElementById('save-rule-btn').addEventListener('click', saveRule);
}

function openRuleModal(rule = null) {
    const modal = document.getElementById('aiRuleModal');
    const title = document.getElementById('aiRuleModalTitle');
    const idInput = document.getElementById('rule-id');
    const promptInput = document.getElementById('rule-prompt');
    const responseInput = document.getElementById('rule-response');
    const activeInput = document.getElementById('rule-active');

    if (rule) {
        title.textContent = 'Edit Rule';
        idInput.value = rule.id;
        promptInput.value = rule.prompt;
        responseInput.value = rule.response;
        activeInput.checked = rule.active;
    } else {
        title.textContent = 'Rule Baru';
        idInput.value = '';
        promptInput.value = '';
        responseInput.value = '';
        activeInput.checked = true;
    }

    modal.classList.remove('hidden');
    modal.classList.add('show');
}

function closeRuleModal() {
    const modal = document.getElementById('aiRuleModal');
    modal.classList.remove('show');
    modal.classList.add('hidden');
}

function saveRule() {
    const id = document.getElementById('rule-id').value;
    const prompt = document.getElementById('rule-prompt').value;
    const response = document.getElementById('rule-response').value;
    const active = document.getElementById('rule-active').checked;
    const btn = document.getElementById('save-rule-btn');

    if (!prompt || !response) {
        alert('Prompt dan Respon wajib diisi');
        return;
    }

    window.setButtonLoading(btn, true);

    const action = id ? 'updateAiRule' : 'createAiRule';
    const payload = { id, prompt, response, active };

    window.sendDataToGoogle(action, payload, (res) => {
        window.setButtonLoading(btn, false);
        if (res.status === 'success') {
            closeRuleModal();
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
    if (rule) openRuleModal(rule);
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
