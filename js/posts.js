// Posts List JavaScript
window.initPostsPage = function() {
    console.log('Posts page initialized');
};

window.postsPage = function() {
    return {
        // Data
        posts: [],
        loading: false,
        deleting: false,
        
        // Filters
        filters: {
            status: '',
            search: '',
            author: ''
        },
        
        // Pagination
        currentPage: 1,
        totalPages: 0,
        totalPosts: 0,
        
        // Modal
        showDeleteModal: false,
        postToDelete: null,

        async init() {
            await this.loadPosts();
        },

        async loadPosts() {
            this.loading = true;
            
            try {
                const requestData = {
                    page: this.currentPage,
                    limit: 10,
                    ...this.filters
                };

                // Remove empty filters
                Object.keys(requestData).forEach(key => {
                    if (requestData[key] === '' || requestData[key] === null || requestData[key] === undefined) {
                        delete requestData[key];
                    }
                });

                await new Promise((resolve, reject) => {
                    window.sendDataToGoogle(
                        'getPosts',
                        requestData,
                        (response) => {
                            if (response.status === 'success') {
                                this.posts = response.data.posts || [];
                                this.totalPosts = response.data.total || 0;
                                this.totalPages = response.data.totalPages || 0;
                                this.currentPage = response.data.page || 1;
                                resolve(response);
                            } else {
                                reject(new Error(response.message || 'Failed to load posts'));
                            }
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                });

            } catch (error) {
                console.error('Load posts error:', error);
                window.showToast('Failed to load posts: ' + error.message, 'error');
                this.posts = [];
                this.totalPosts = 0;
                this.totalPages = 0;
            } finally {
                this.loading = false;
            }
        },

        changePage(page) {
            if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
                this.currentPage = page;
                this.loadPosts();
            }
        },

        get visiblePages() {
            const pages = [];
            const start = Math.max(1, this.currentPage - 2);
            const end = Math.min(this.totalPages, this.currentPage + 2);
            
            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
            
            return pages;
        },

        editPost(postId) {
            // Navigate to edit post page
            window.navigate('post-edit', { id: postId });
        },

        viewPost(slug) {
            // Open post in new tab/window
            const blogUrl = window.location.origin; // Adjust this to your blog URL
            window.open(`${blogUrl}/${slug}`, '_blank');
        },

        confirmDelete(post) {
            this.postToDelete = post;
            this.showDeleteModal = true;
        },

        async deletePost() {
            if (!this.postToDelete || this.deleting) return;
            
            this.deleting = true;
            
            try {
                await new Promise((resolve, reject) => {
                    window.sendDataToGoogle(
                        'deletePost',
                        { id: this.postToDelete.id },
                        (response) => {
                            if (response.status === 'success') {
                                window.showToast('Post deleted successfully', 'success');
                                resolve(response);
                            } else {
                                reject(new Error(response.message || 'Failed to delete post'));
                            }
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                });

                // Remove from local list
                this.posts = this.posts.filter(post => post.id !== this.postToDelete.id);
                this.totalPosts--;
                
                // Close modal
                this.showDeleteModal = false;
                this.postToDelete = null;
                
                // Reload if current page is empty
                if (this.posts.length === 0 && this.currentPage > 1) {
                    this.currentPage--;
                    await this.loadPosts();
                }

            } catch (error) {
                console.error('Delete post error:', error);
                window.showToast('Failed to delete post: ' + error.message, 'error');
            } finally {
                this.deleting = false;
            }
        },

        formatDate(dateString) {
            if (!dateString) return '';
            
            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } catch (error) {
                return dateString;
            }
        },

        // Quick actions
        async togglePostStatus(post) {
            const newStatus = post.status === 'published' ? 'draft' : 'published';
            
            try {
                await new Promise((resolve, reject) => {
                    window.sendDataToGoogle(
                        'savePost',
                        {
                            id: post.id,
                            title: post.title,
                            content: post.content,
                            status: newStatus,
                            action: 'updateStatus'
                        },
                        (response) => {
                            if (response.status === 'success') {
                                post.status = newStatus;
                                window.showToast(`Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`, 'success');
                                resolve(response);
                            } else {
                                reject(new Error(response.message || 'Failed to update post status'));
                            }
                        },
                        (error) => {
                            reject(error);
                        }
                    );
                });

            } catch (error) {
                console.error('Toggle status error:', error);
                window.showToast('Failed to update post status: ' + error.message, 'error');
            }
        },

        // Bulk actions
        selectedPosts: [],
        
        toggleSelectAll() {
            if (this.selectedPosts.length === this.posts.length) {
                this.selectedPosts = [];
            } else {
                this.selectedPosts = [...this.posts.map(post => post.id)];
            }
        },

        toggleSelectPost(postId) {
            const index = this.selectedPosts.indexOf(postId);
            if (index > -1) {
                this.selectedPosts.splice(index, 1);
            } else {
                this.selectedPosts.push(postId);
            }
        },

        async bulkDelete() {
            if (this.selectedPosts.length === 0) return;
            
            if (!confirm(`Are you sure you want to delete ${this.selectedPosts.length} posts?`)) {
                return;
            }
            
            this.loading = true;
            
            try {
                for (const postId of this.selectedPosts) {
                    await new Promise((resolve, reject) => {
                        window.sendDataToGoogle(
                            'deletePost',
                            { id: postId },
                            (response) => {
                                if (response.status === 'success') {
                                    resolve(response);
                                } else {
                                    reject(new Error(response.message || 'Failed to delete post'));
                                }
                            },
                            (error) => {
                                reject(error);
                            }
                        );
                    });
                }
                
                window.showToast(`${this.selectedPosts.length} posts deleted successfully`, 'success');
                this.selectedPosts = [];
                await this.loadPosts();

            } catch (error) {
                console.error('Bulk delete error:', error);
                window.showToast('Failed to delete some posts: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        },

        async bulkPublish() {
            if (this.selectedPosts.length === 0) return;
            
            this.loading = true;
            
            try {
                for (const postId of this.selectedPosts) {
                    const post = this.posts.find(p => p.id === postId);
                    if (post && post.status !== 'published') {
                        await new Promise((resolve, reject) => {
                            window.sendDataToGoogle(
                                'savePost',
                                {
                                    id: post.id,
                                    title: post.title,
                                    content: post.content,
                                    status: 'published',
                                    action: 'updateStatus'
                                },
                                (response) => {
                                    if (response.status === 'success') {
                                        post.status = 'published';
                                        resolve(response);
                                    } else {
                                        reject(new Error(response.message || 'Failed to publish post'));
                                    }
                                },
                                (error) => {
                                    reject(error);
                                }
                            );
                        });
                    }
                }
                
                window.showToast(`${this.selectedPosts.length} posts published successfully`, 'success');
                this.selectedPosts = [];

            } catch (error) {
                console.error('Bulk publish error:', error);
                window.showToast('Failed to publish some posts: ' + error.message, 'error');
            } finally {
                this.loading = false;
            }
        }
    };
};