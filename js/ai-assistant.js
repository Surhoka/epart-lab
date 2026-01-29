const registerAiAssistantPage = () => {
    if (window.Alpine && !window.Alpine.data('aiAssistantPage')) {
        window.Alpine.data('aiAssistantPage', () => ({
            // --- STATE ---
            activeTab: 'chat',
            isRuleModalOpen: false,
            modalMode: 'add',

            // Chat State
            chatQuery: '',
            chatResponse: '',
            isChatLoading: false,

            // Config State
            aiConfig: {
                model: 'gemini-flash-latest',
                apiKey: '',
                hasKey: false
            },

            // Rules State
            rules: [],
            editingRule: {
                id: null,
                prompt: '',
                active: true
            },

            // --- LIFECYCLE & ACTIONS ---
            async init() {
                console.log("AI Assistant Page Initialized with Alpine Component.");
                await this.loadAiConfig();
                await this.fetchRules();
            },

            // --- CHAT LOGIC ---
            async askAi() {
                if (!this.chatQuery.trim()) return;
                this.isChatLoading = true;
                this.chatResponse = '';

                window.sendDataToGoogle('askAi', { question: this.chatQuery.trim() }, (res) => {
                    if (res.status === 'success') {
                        this.typeEffect(res.answer);
                    } else {
                        this.chatResponse = `<div class="text-red-500 p-2 text-sm">Error: ${res.message || 'Gagal mendapatkan respon.'}</div>`;
                        this.isChatLoading = false;
                    }
                }, (err) => {
                    this.chatResponse = `<div class="text-red-500 p-2 text-sm">Koneksi gagal. Silakan coba lagi.</div>`;
                    this.isChatLoading = false;
                });
            },

            typeEffect(text, speed = 10) {
                if (!text) {
                    this.isChatLoading = false;
                    return;
                }
                this.chatResponse = "";
                const formattedText = text
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`([^`]+)`/g, '<code class="bg-gray-100 dark:bg-gray-700 px-1 rounded font-mono text-sm text-red-500">$1</code>');

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = formattedText;
                const nodes = Array.from(tempDiv.childNodes);
                let nodeIndex = 0;
                let charIndex = 0;

                const type = () => {
                    if (nodeIndex >= nodes.length) {
                        this.isChatLoading = false;
                        return;
                    }
                    const node = nodes[nodeIndex];
                    if (node.nodeType === Node.TEXT_NODE) {
                        const chars = node.textContent;
                        if (charIndex < chars.length) {
                            this.chatResponse += chars.charAt(charIndex);
                            charIndex++;
                            setTimeout(type, speed);
                        } else {
                            nodeIndex++;
                            charIndex = 0;
                            setTimeout(type, speed);
                        }
                    } else {
                        this.chatResponse += node.outerHTML;
                        nodeIndex++;
                        setTimeout(type, speed);
                    }
                };
                type();
            },

            closeAiResult() {
                this.chatResponse = '';
                this.isChatLoading = false;
            },

            // --- CONFIG LOGIC ---
            async loadAiConfig() {
                window.sendDataToGoogle('getAiConfig', {}, (res) => {
                    if (res.status === 'success' && res.data) {
                        this.aiConfig.model = res.data.model || 'gemini-flash-latest';
                        this.aiConfig.hasKey = res.data.hasKey || false;
                    }
                });
            },

            async saveAiConfig(button) {
                window.setButtonLoading(button, true);
                const payload = {
                    model: this.aiConfig.model,
                    apiKey: this.aiConfig.apiKey // Send only the new key
                };
                window.sendDataToGoogle('saveAiConfig', payload, (res) => {
                    window.setButtonLoading(button, false);
                    if (res.status === 'success') {
                        window.showToast('Konfigurasi AI berhasil disimpan', 'success');
                        if (this.aiConfig.apiKey) {
                            this.aiConfig.apiKey = ''; // Clear the input
                            this.aiConfig.hasKey = true; // Update placeholder state
                        }
                    } else {
                        window.showToast('Gagal menyimpan: ' + res.message, 'error');
                    }
                });
            },

            // --- RULES LOGIC ---
            async fetchRules() {
                this.rules = [];
                window.sendDataToGoogle('getAiRules', {}, (res) => {
                    if (res.status === 'success' && Array.isArray(res.data)) {
                        this.rules = res.data;
                    }
                });
            },

            openAddRuleModal() {
                this.modalMode = 'add';
                this.editingRule = { id: null, prompt: '', active: true };
                this.isRuleModalOpen = true;
            },

            openEditRuleModal(rule) {
                this.modalMode = 'edit';
                this.editingRule = JSON.parse(JSON.stringify(rule)); // Deep copy
                this.isRuleModalOpen = true;
            },

            closeRuleModal() {
                this.isRuleModalOpen = false;
            },

            async saveRule(button) {
                if (!this.editingRule.prompt.trim()) {
                    window.showToast('Prompt is required.', 'warning');
                    return;
                }
                window.setButtonLoading(button, true);
                const action = this.editingRule.id ? 'updateAiRule' : 'createAiRule';
                window.sendDataToGoogle(action, this.editingRule, (res) => {
                    window.setButtonLoading(button, false);
                    if (res.status === 'success') {
                        window.showToast('Rule saved successfully!', 'success');
                        this.fetchRules();
                        this.closeRuleModal();
                    } else {
                        window.showToast(`Error: ${res.message}`, 'error');
                    }
                });
            },

            async deleteRule(ruleId) {
                if (!confirm('Are you sure you want to delete this rule?')) return;
                window.sendDataToGoogle('deleteAiRule', { id: ruleId }, (res) => {
                    if (res.status === 'success') {
                        window.showToast('Rule deleted.', 'success');
                        this.fetchRules();
                    } else {
                        window.showToast(`Error: ${res.message}`, 'error');
                    }
                });
            }
        }));
    }
};

// Registration
if (window.Alpine) {
    registerAiAssistantPage();
} else {
    document.addEventListener('alpine:init', registerAiAssistantPage);
}
