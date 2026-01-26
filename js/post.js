/**
 * Post Editor Page Logic
 * Handles simple classic text editing interactions.
 */

window.initPostEditorPage = function () {
    console.log("Post Editor Page Initialized");
    registerPostEditor();
};

const registerPostEditor = () => {
    if (window.Alpine && !window.Alpine.data('postEditor')) {
        window.Alpine.data('postEditor', () => ({
            post: {
                title: '',
                slug: '',
                status: 'Draft'
            },
            categories: ['Automotive', 'Technology', 'News', 'Tutorials', 'Marketplace'],
            formattingTools: [
                { icon: 'bold', cmd: 'bold', label: 'Bold' },
                { icon: 'italic', cmd: 'italic', label: 'Italic' },
                { icon: 'underline', cmd: 'underline', label: 'Underline' },
                { icon: 'list-bullet', cmd: 'insertUnorderedList', label: 'Bullet List' },
                { icon: 'list-number', cmd: 'insertOrderedList', label: 'Numbered List' },
                { icon: 'quote', cmd: 'formatBlock:blockquote', label: 'Quote' },
                { icon: 'code', cmd: 'formatBlock:pre', label: 'Code Block' }
            ],

            init() {
                this.$watch('post.title', value => {
                    this.post.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                });
            },

            execCommand(command) {
                if (command.startsWith('formatBlock:')) {
                    const tag = command.split(':')[1];
                    document.execCommand('formatBlock', false, tag);
                } else {
                    document.execCommand(command, false, null);
                }
                // Maintain focus on editor
                document.getElementById('classic-editor-body').focus();
            },

            saveDraft() {
                window.showToast("Draft saved successfully", "info");
            },

            publishPost() {
                if (!this.post.title) {
                    window.showToast("Please enter a title before publishing", "warning");
                    return;
                }
                window.showToast("Post published successfully!", "success");
            }
        }));
    }
};

// Immediate registration or wait for Alpine
if (window.Alpine) {
    registerPostEditor();
} else {
    document.addEventListener('alpine:init', registerPostEditor);
}
