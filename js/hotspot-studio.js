const registerHotspotStudio = () => {
    if (window.Alpine && !window.Alpine.data('hotspotStudio')) {
        window.Alpine.data('hotspotStudio', () => ({
            activeTab: 'list',
            projects: [],
            project: { id: null, title: '', lastModified: Date.now() },
            hotspots: [],
            imageUrl: null,
            selectedId: null,
            tool: 'select', // 'select', 'point'
            scale: 1,
            pan: { x: 0, y: 0 },
            isPanning: false,
            lastMouse: { x: 0, y: 0 },
            isDraggingHotspot: false,
            draggedHotspotId: null,
            draggedPolygonPointIndex: null,
            isDrawing: false,
            history: [],
            historyIndex: -1,

            init() {
                console.log("Hotspot Studio Initialized");
                // Mock data for projects
                this.projects = [
                    {
                        id: 1,
                        title: 'Living Room Setup',
                        imageUrl: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/product-01.jpg',
                        lastModified: Date.now(),
                        hotspots: [
                            { id: 101, x: 35, y: 45, title: 'Smart Lamp', description: 'Adjustable brightness', url: '#' },
                            { id: 102, x: 65, y: 60, title: 'Sofa', description: 'Leather sofa', url: '#' }
                        ]
                    },
                    {
                        id: 2,
                        title: 'Kitchen Layout',
                        imageUrl: 'https://cdn.jsdelivr.net/gh/Surhoka/epart-lab@main/images/product-02.jpg',
                        lastModified: Date.now() - 86400000,
                        hotspots: [
                            { id: 201, x: 50, y: 50, title: 'Refrigerator', description: 'Double door fridge', url: '#' }
                        ]
                    }
                ];
            },

            addToHistory() {
                const state = JSON.stringify({
                    hotspots: this.hotspots,
                    selectedId: this.selectedId,
                    isDrawing: this.isDrawing
                });
                if (this.historyIndex >= 0 && this.history[this.historyIndex] === state) return;
                if (this.historyIndex < this.history.length - 1) {
                    this.history = this.history.slice(0, this.historyIndex + 1);
                }
                this.history.push(state);
                this.historyIndex++;
            },

            undo() {
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    const state = JSON.parse(this.history[this.historyIndex]);
                    this.hotspots = state.hotspots;
                    this.selectedId = state.selectedId;
                    this.isDrawing = state.isDrawing;
                }
            },

            redo() {
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    const state = JSON.parse(this.history[this.historyIndex]);
                    this.hotspots = state.hotspots;
                    this.selectedId = state.selectedId;
                    this.isDrawing = state.isDrawing;
                }
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
                    this.history = [];
                    this.historyIndex = -1;
                    this.addToHistory();
                };
                reader.readAsDataURL(file);
            },

            newProject() {
                this.project = { id: null, title: '', lastModified: Date.now() };
                this.hotspots = [];
                this.imageUrl = null;
                this.resetView();
                this.activeTab = 'studio';
                this.history = [];
                this.historyIndex = -1;
                this.addToHistory();
            },

            editProject(p) {
                // Clone to avoid direct mutation of list item until saved
                this.project = JSON.parse(JSON.stringify(p));
                this.hotspots = p.hotspots || [];
                this.imageUrl = p.imageUrl || null;
                this.resetView();
                this.activeTab = 'studio';
                this.history = [];
                this.historyIndex = -1;
                this.addToHistory();
            },

            deleteProject(id) {
                if (confirm('Delete this project?')) {
                    this.projects = this.projects.filter(p => p.id !== id);
                }
            },

            setTool(t) {
                this.tool = t;
                if (t === 'select') {
                    this.isDrawing = false;
                }
            },

            handleCanvasClick(event) {
                if (!this.imageUrl) return;

                const rect = event.target.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;

                if (this.tool === 'polygon' || (this.isDrawing && this.selectedId)) {
                    this.addPolygonPoint(x, y);
                } else if (this.tool === 'point') {
                    this.addHotspot(x, y);
                } else {
                    this.selectedId = null;
                    this.isDrawing = false;
                }
            },

            addHotspot(x, y) {
                const id = Date.now();
                this.hotspots.push({
                    id,
                    x,
                    y,
                    type: 'point',
                    title: '',
                    description: '',
                    url: ''
                });
                this.selectedId = id;
                this.tool = 'select'; // Switch back to select after adding
                this.addToHistory();
            },

            convertToPolygon() {
                const spot = this.getSelectedHotspot();
                if (spot) {
                    spot.type = 'polygon';
                    spot.points = [];
                    if (spot.x !== undefined && spot.y !== undefined) {
                        spot.points.push({ x: spot.x, y: spot.y });
                    }
                    this.isDrawing = true;
                    this.addToHistory();
                }
            },

            toggleDrawing() {
                this.isDrawing = !this.isDrawing;
            },

            addPolygonPoint(x, y) {
                let spot;
                if (this.selectedId) {
                    spot = this.hotspots.find(h => h.id === this.selectedId);
                }

                if (this.tool === 'polygon' && (!spot || spot.type !== 'polygon')) {
                    const id = Date.now();
                    spot = { id, x, y, title: 'New Area', type: 'polygon', points: [], description: '', url: '' };
                    this.hotspots.push(spot);
                    this.selectedId = id;
                    this.isDrawing = true;
                }

                if (spot && spot.type === 'polygon') {
                    if (!spot.points) spot.points = [];
                    spot.points.push({ x, y });
                }
                this.addToHistory();
            },

            removePolygonPoint(index) {
                const spot = this.getSelectedHotspot();
                if (spot && spot.type === 'polygon' && spot.points) {
                    spot.points.splice(index, 1);
                    this.addToHistory();
                }
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
                this.addToHistory();
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

            startDragHotspot(e, id, pointIndex = null) {
                if (this.tool !== 'select') return;
                this.isDraggingHotspot = true;
                this.draggedHotspotId = id;
                this.draggedPolygonPointIndex = pointIndex;
                this.selectHotspot(id);
            },

            handleMouseMove(e) {
                if (this.isDraggingHotspot && this.draggedHotspotId && this.imageUrl) {
                    const img = this.$refs.img;
                    if (!img) return;

                    const rect = img.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;

                    // Clamp values between 0 and 100
                    const clampedX = Math.max(0, Math.min(100, x));
                    const clampedY = Math.max(0, Math.min(100, y));

                    const hotspot = this.hotspots.find(h => h.id === this.draggedHotspotId);
                    if (hotspot) {
                        if (this.draggedPolygonPointIndex !== null && hotspot.type === 'polygon') {
                            if (hotspot.points && hotspot.points[this.draggedPolygonPointIndex]) {
                                hotspot.points[this.draggedPolygonPointIndex].x = clampedX;
                                hotspot.points[this.draggedPolygonPointIndex].y = clampedY;
                            }
                        } else {
                            hotspot.x = clampedX;
                            hotspot.y = clampedY;
                        }
                    }
                } else if (this.isPanning) {
                    const dx = e.clientX - this.lastMouse.x;
                    const dy = e.clientY - this.lastMouse.y;
                    this.pan.x += dx;
                    this.pan.y += dy;
                    this.lastMouse = { x: e.clientX, y: e.clientY };
                }
            },

            endPan() {
                if (this.isDraggingHotspot) {
                    this.addToHistory();
                }
                this.isPanning = false;
                this.isDraggingHotspot = false;
                this.draggedHotspotId = null;
                this.draggedPolygonPointIndex = null;
            },

            saveProject() {
                // Logic to save to backend
                console.log('Saving project:', this.project, this.hotspots);

                if (!this.project.id) {
                    this.project.id = Date.now();
                    this.project.hotspots = this.hotspots;
                    this.project.imageUrl = this.imageUrl;
                    this.project.lastModified = Date.now();
                    this.projects.push(this.project);
                } else {
                    const idx = this.projects.findIndex(p => p.id === this.project.id);
                    if (idx !== -1) {
                        this.projects[idx] = { ...this.project, hotspots: this.hotspots, imageUrl: this.imageUrl, lastModified: Date.now() };
                    }
                }

                window.showToast('Project saved (Mock)', 'success');
                this.activeTab = 'list';
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
