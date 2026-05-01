/**
 * Calendar Logic - Wrapped in IIFE to prevent Identifier Re-declaration Errors
 */
(function () {
  if (window.calendarScriptLoaded) return;

  const registerCalendar = () => {
    if (window.Alpine && !window.Alpine.data('calendar')) {
      window.Alpine.data('calendar', () => ({
        calendar: null,
        isLoading: false,
        initialLoadDone: false, // Flag untuk mengontrol pemuatan cache
        isModalOpen: false,
        modalMode: 'add', // 'add' or 'edit'
        editingEvent: {
          id: null,
          title: '',
          start: '',
          end: '',
          allDay: false,
          description: '',
          className: 'Primary' // Default color
        },

        async init() {
          console.log("Calendar Initialized");

          // [PENTING] Tunggu sampai API Discovery selesai sebelum memuat data
          if (!window.EzyApi || !window.EzyApi.isReady) {
            await new Promise(resolve => {
              window.addEventListener('ezy-api-ready', resolve, { once: true });
            });
          }

          if (typeof FullCalendar === 'undefined') {
            try {
              await window.app.loadScript('https://cdn.jsdelivr.net/npm/fullcalendar@6.1.15/index.global.min.js');
            } catch (e) {
              console.error("Gagal memuat FullCalendar", e);
              window.showToast?.("Gagal memuat Kalender", "error");
              return;
            }
          }

          // Tunggu DOM benar-benar stabil sesuai permintaan user
          this.$nextTick(async () => {
            const calendarEl = this.$refs.calendar;
            if (!calendarEl) return;

            // Pastikan FullCalendar terisi ulang (Clean up instance lama)
            if (this.calendar) {
              this.calendar.destroy(); // Bersihkan instance lama jika ada
            }

            // Inisialisasi ulang melalui helper method
            this.renderCalendar(calendarEl);
          });
        },

        renderCalendar(calendarEl) {
          this.calendar = new FullCalendar.Calendar(calendarEl, {
            selectable: true,
            initialView: 'dayGridMonth',
            headerToolbar: {
              left: 'prev,next today addEventButton',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            events: this.fetchEvents.bind(this),
            select: this.handleDateSelect.bind(this),
            eventClick: this.handleEventClick.bind(this),
            customButtons: {
              addEventButton: {
                text: 'Add Event',
                click: () => this.openModalForNew()
              }
            },
            eventClassNames: ({ event }) => {
              const colorMap = { 'Primary': 'primary', 'Success': 'success', 'Warning': 'warning', 'Danger': 'danger' };
              const color = colorMap[event.extendedProps.calendar] || 'primary';
              return [`event-fc-color`, `fc-bg-${color}`];
            },
            eventDidMount: (info) => {
              info.el.removeAttribute('title');
              info.el.classList.add('group', 'relative', 'overflow-visible', 'cursor-pointer');
              const tooltip = document.createElement('div');
              tooltip.className = 'tooltip z-50 w-max max-w-[200px] whitespace-normal text-left';
              let content = `<div class="font-semibold">${info.event.title}</div>`;
              if (info.event.extendedProps.description) {
                content += `<div class="mt-1 pt-1 border-t border-white/20 text-xs font-normal opacity-90">${info.event.extendedProps.description}</div>`;
              }
              tooltip.innerHTML = content;
              info.el.appendChild(tooltip);
            }
          });

          this.calendar.render();

          // Mengatasi tampilan berantakan saat perpindahan halaman
          setTimeout(() => {
            if (this.calendar) this.calendar.updateSize();
          }, 350);
        },

        fetchEvents(fetchInfo, successCallback, failureCallback) {
          this.isLoading = true;

          // --- LOAD DARI CACHE LOKAL (Agar instan dan tidak berkedip) ---
          const cacheKey = 'calendar_events_cache';
          const cached = localStorage.getItem(cacheKey);
          if (cached && !this.initialLoadDone) {
            successCallback(JSON.parse(cached));
          }

          // [OPTIMASI] Kirim rentang tanggal agar Backend bisa memfilter (Hemat Bandwidth)
          const params = {
            pluginId: 'plug_calendar_v1',
            start: fetchInfo.startStr,
            end: fetchInfo.endStr
          };

          window.sendDataToGoogle('getEvents', params, (response) => {
            this.isLoading = false;
            if (response.status === 'success') {
              // --- SIMPAN KE CACHE UNTUK PENGGUNAAN BERIKUTNYA ---
              localStorage.setItem(cacheKey, JSON.stringify(response.data));
              this.initialLoadDone = true;
              successCallback(response.data);
            } else {
              failureCallback(new Error(response.message));
              window.showToast('Failed to load events', 'error');
            }
          }, (error) => {
            this.isLoading = false;
            failureCallback(error);
            window.showToast('API error loading events', 'error');
          });
        },

        handleDateSelect(info) {
          this.modalMode = 'add';
          this.editingEvent = {
            id: null,
            title: '',
            start: info.allDay ? info.startStr : info.startStr.slice(0, 16),
            end: info.allDay ? info.endStr : info.endStr.slice(0, 16),
            allDay: info.allDay,
            description: '',
            className: 'Primary'
          };
          this.isModalOpen = true;
        },

        handleEventClick(info) {
          this.modalMode = 'edit';
          const event = info.event;

          // Helper: Konversi Date object ke string ISO lokal (agar jam tidak bergeser ke UTC)
          const toLocalISO = (date) => {
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offset).toISOString().slice(0, 16);
          };

          this.editingEvent = {
            id: event.id,
            title: event.title,
            start: event.allDay ? event.startStr : (event.start ? toLocalISO(event.start) : ''),
            end: event.allDay ? (event.end ? new Date(event.end.valueOf() - 86400000).toISOString().slice(0, 10) : event.startStr) : (event.end ? toLocalISO(event.end) : ''),
            allDay: event.allDay,
            description: event.extendedProps.description || '',
            className: event.extendedProps.calendar || 'Primary'
          };
          this.isModalOpen = true;
        },

        openModalForNew() {
          this.modalMode = 'add';
          const today = new Date().toISOString().slice(0, 10);
          this.editingEvent = {
            id: null, title: '', start: today, end: today,
            allDay: true, description: '', className: 'Primary'
          };
          this.isModalOpen = true;
        },

        closeModal() {
          this.isModalOpen = false;
        },

        async saveEvent(button) {
          if (!this.editingEvent.title) {
            window.showToast('Event title is required.', 'warning');
            return;
          }

          const payload = {
            id: this.editingEvent.id,
            title: this.editingEvent.title,
            start: this.editingEvent.start,
            end: this.editingEvent.end,
            allDay: this.editingEvent.allDay,
            extendedProps: {
              calendar: this.editingEvent.className,
              description: this.editingEvent.description
            },
            description: this.editingEvent.description
          };

          // --- OPTIMISTIC UI: UPDATE LOKAL DULU ---
          let optimisticEvent = null;
          let originalData = null;

          if (this.modalMode === 'add') {
            // Tambah ke kalender dengan ID sementara
            optimisticEvent = this.calendar.addEvent({
              ...payload,
              id: 'temp-' + Date.now()
            });
          } else {
            // Edit event yang ada
            optimisticEvent = this.calendar.getEventById(this.editingEvent.id);
            if (optimisticEvent) {
              originalData = optimisticEvent.toPlainObject();
              optimisticEvent.setProp('title', payload.title);
              optimisticEvent.setDates(payload.start, payload.end, { allDay: payload.allDay });
              optimisticEvent.setExtendedProp('calendar', payload.extendedProps.calendar);
              optimisticEvent.setExtendedProp('description', payload.description);
            }
          }

          this.closeModal();
          window.setButtonLoading(button, true);

          const action = this.modalMode === 'add' ? 'createEvent' : 'updateEvent';

          window.sendDataToGoogle(action, { ...payload, pluginId: 'plug_calendar_v1' }, (res) => {
            window.setButtonLoading(button, false);
            if (res.status === 'success') {
              window.showToast(`Event ${this.modalMode === 'add' ? 'Created' : 'Updated'}!`, 'success');

              // [FIX] Update Local Cache segera agar refetchEvents punya data terbaru
              const cacheKey = 'calendar_events_cache';
              let currentCache = JSON.parse(localStorage.getItem(cacheKey) || '[]');
              const newEvent = { ...payload, id: res.id || payload.id };

              if (this.modalMode === 'add') {
                currentCache.push(newEvent);
              } else {
                currentCache = currentCache.map(e => (e.id == payload.id || e.id == res.id) ? newEvent : e);
              }
              localStorage.setItem(cacheKey, JSON.stringify(currentCache));

              // [PENTING] Hapus event statis Optimistik agar digantikan oleh data dari Server/Cache
              if (optimisticEvent) {
                optimisticEvent.remove();
              }

              this.initialLoadDone = false; // Reset flag agar fetchEvents mau baca dari cache yang baru kita update
              this.calendar.refetchEvents();
            } else {
              window.showToast(`Error: ${res.message}`, 'error');
              // --- ROLLBACK JIKA GAGAL ---
              if (this.modalMode === 'add' && optimisticEvent) {
                optimisticEvent.remove();
              } else if (originalData) {
                this.calendar.addEvent(originalData); // Kembalikan data lama
                if (optimisticEvent) optimisticEvent.remove();
              }
            }
          }, (err) => {
            window.setButtonLoading(button, false);
            window.showToast('API Error while saving event.', 'error');
            // Rollback sederhana
            if (this.modalMode === 'add' && optimisticEvent) optimisticEvent.remove();
            this.calendar.refetchEvents();
          });
        },

        async deleteEvent(button) {
          if (!confirm('Are you sure you want to delete this event?')) return;

          // --- OPTIMISTIC UI: HAPUS LOKAL DULU ---
          const eventObj = this.calendar.getEventById(this.editingEvent.id);
          const backupData = eventObj ? eventObj.toPlainObject() : null;

          if (eventObj) eventObj.remove();
          this.closeModal();

          window.setButtonLoading(button, true);

          window.sendDataToGoogle('deleteEvent', { id: this.editingEvent.id, pluginId: 'plug_calendar_v1' }, (res) => {
            window.setButtonLoading(button, false);
            if (res.status === 'success') {
              window.showToast('Event deleted!', 'success');
            } else {
              window.showToast(`Error: ${res.message}`, 'error');
              // --- ROLLBACK JIKA GAGAL ---
              if (backupData) this.calendar.addEvent(backupData);
            }
          }, (err) => {
            window.setButtonLoading(button, false);
            window.showToast('API Error while deleting event.', 'error');
            if (backupData) this.calendar.addEvent(backupData);
          });
        },

        toggleAllDay() {
          if (this.editingEvent.allDay) {
            // If switching to all-day, keep only the date part
            if (this.editingEvent.start) this.editingEvent.start = this.editingEvent.start.slice(0, 10);
            if (this.editingEvent.end) this.editingEvent.end = this.editingEvent.end.slice(0, 10);
          } else {
            // Jika beralih ke mode Waktu (Timed), tambahkan jam default jika belum ada
            if (this.editingEvent.start && this.editingEvent.start.length === 10) {
              this.editingEvent.start += 'T09:00';
            }
            if (this.editingEvent.end && this.editingEvent.end.length === 10) {
              this.editingEvent.end += 'T10:00';
            }
          }
        }
      }));
    }
  };

  // Immediate registration or wait for Alpine
  if (window.Alpine) {
    registerCalendar();
  } else {
    document.addEventListener('alpine:init', registerCalendar);
  }

  window.calendarScriptLoaded = true;
})();