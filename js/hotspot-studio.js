const registerHotspotStudio = () => {
    if (window.Alpine && !window.Alpine.data('hotspotStudio')) {
        window.Alpine.data('hotspotStudio', () => ({
            project: { title: '' },
            hotspots: [],
            imageUrl: null,
            selectedId: null,
            tool: 'select', // 'select', 'point'
            scale: 1,
            pan: { x: 0, y: 0 },
            isPanning: false,
            lastMouse: { x: 0, y: 0 },

            init() {
                console.log("Hotspot Studio Initialized");
            },

            handleImageUpload(event) {
                const file = event.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.imageUrl = e.target.result;
                    this.hotspots = [];
                    this.selectedId = null;
                    this.resetView();
                };
                reader.readAsDataURL(file);
            },

            setTool(t) {
                this.tool = t;
                if (t === 'select') {
                    // Maybe change cursor
                }
            },

            handleCanvasClick(event) {
                if (this.tool === 'point' && this.imageUrl) {
                    const rect = event.target.getBoundingClientRect();
                    const x = ((event.clientX - rect.left) / rect.width) * 100;
                    const y = ((event.clientY - rect.top) / rect.height) * 100;
                    
                    this.addHotspot(x, y);
                } else {
                    this.selectedId = null;
                }
            },

            addHotspot(x, y) {
                const id = Date.now();
                this.hotspots.push({
                    id,
                    x,
                    y,
                    title: '',
                    description: '',
                    url: ''
                });
                this.selectedId = id;
                this.tool = 'select'; // Switch back to select after adding
            },

            selectHotspot(id) {
                this.selectedId = id;
            },

            getSelectedHotspot() {
                return this.hotspots.find(h => h.id === this.selectedId);
            },

            deleteHotspot(id) {
                this.hotspots = this.hotspots.filter(h => h.id !== id);
                if (this.selectedId === id) this.selectedId = null;
            },

            // Zoom & Pan Logic
            zoomIn() {
                this.scale = Math.min(this.scale * 1.2, 5);
            },

            zoomOut() {
                this.scale = Math.max(this.scale / 1.2, 0.5);
            },

            resetView() {
                this.scale = 1;
                this.pan = { x: 0, y: 0 };
            },

            handleWheel(e) {
                if (e.ctrlKey) {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? 0.9 : 1.1;
                    this.scale = Math.min(Math.max(this.scale * delta, 0.5), 5);
                } else {
                    // Optional: Pan on scroll
                }
            },

            startPan(e) {
                if (this.tool === 'select' && e.button === 0) { // Left click pan if in select mode and not clicking hotspot
                    this.isPanning = true;
                    this.lastMouse = { x: e.clientX, y: e.clientY };
                }
            },

            handleMouseMove(e) {
                if (this.isPanning) {
                    const dx = e.clientX - this.lastMouse.x;
                    const dy = e.clientY - this.lastMouse.y;
                    this.pan.x += dx;
                    this.pan.y += dy;
                    this.lastMouse = { x: e.clientX, y: e.clientY };
                }
            },

            endPan() {
                this.isPanning = false;
            },

            saveProject() {
                // Logic to save to backend
                console.log('Saving project:', this.project, this.hotspots);
                window.showToast('Project saved (Mock)', 'success');
            },

            exportCode() {
                const data = JSON.stringify({
                    image: this.imageUrl ? 'image_url_here' : null,
                    hotspots: this.hotspots
                }, null, 2);
                console.log(data);
                alert('Check console for JSON output');
            }
        }));
    }
};

if (window.Alpine) {
    registerHotspotStudio();
} else {
    document.addEventListener('alpine:init', registerHotspotStudio);
}
