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
            activeTab: 'list', // 'list' or 'editor'
            post: {
                title: '',
                slug: '',
                status: 'Draft'
            },
            posts: [],
            isLoading: false,
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

            async init() {
                this.$watch('post.title', value => {
                    this.post.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                });
                await this.fetchPosts();
            },

            async fetchPosts() {
                this.isLoading = true;
                window.sendDataToGoogle('get_posts', {}, (res) => {
                    this.isLoading = false;
                    if (res.status === 'success') {
                        this.posts = res.data || [];
                    } else {
                        console.error("Fetch posts failed:", res.message);
                    }
                }, (err) => {
                    this.isLoading = false;
                    console.error("API Error fetching posts:", err);
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

            async saveDraft() {
                this.post.status = 'Draft';
                await this.savePost();
            },

            async publishPost() {
                if (!this.post.title) {
                    window.showToast("Please enter a title before publishing", "warning");
                    return;
                }
                this.post.status = 'Published';
                await this.savePost();
            },

            async savePost() {
                const editorBody = document.getElementById('classic-editor-body');
                if (editorBody) this.post.content = editorBody.innerHTML;

                if (!this.post.date) this.post.date = new Date().toLocaleDateString();

                window.showToast("Saving post...", "info");
                window.sendDataToGoogle('save_post', { post: this.post }, (res) => {
                    if (res.status === 'success') {
                        window.showToast("Post saved successfully!", "success");
                        this.fetchPosts();
                        this.activeTab = 'list';
                    } else {
                        window.showToast("Error saving: " + res.message, "error");
                    }
                });
            },

            async deletePost(id) {
                if (!confirm("Are you sure you want to delete this post?")) return;

                window.showToast("Deleting...", "info");
                window.sendDataToGoogle('delete_post', { id: id }, (res) => {
                    if (res.status === 'success') {
                        window.showToast("Post removed", "success");
                        this.fetchPosts();
                    } else {
                        window.showToast("Delete failed", "error");
                    }
                });
            },

            editPost(item) {
                this.post = { ...item };
                this.activeTab = 'editor';
                // Small delay to ensure editor DOM is ready if needed
                setTimeout(() => {
                    const editorBody = document.getElementById('classic-editor-body');
                    if (editorBody) editorBody.innerHTML = item.content || '';
                }, 50);
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
