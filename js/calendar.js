/*========Calender Js=========*/
/*==========================*/

window.initCalendarPage = function () {
  const calendarWrapper = document.querySelector("#calendar");

  if (calendarWrapper) {
    /*=================*/
    //  Calender Date variable
    /*=================*/
    const newDate = new Date();
    const getDynamicMonth = () => {
      const month = newDate.getMonth() + 1;
      return month < 10 ? `0${month}` : `${month}`;
    };

    /*=================*/
    // Calender Modal Elements
    /*=================*/
    const getModalTitleEl = document.querySelector("#event-title");
    const getModalStartDateEl = document.querySelector("#event-start-date");
    const getModalEndDateEl = document.querySelector("#event-end-date");
    const getModalAddBtnEl = document.querySelector(".btn-add-event");
    const getModalUpdateBtnEl = document.querySelector(".btn-update-event");
    const calendarsEvents = {
      Danger: "danger",
      Success: "success",
      Primary: "primary",
      Warning: "warning",
    };

    /*=====================*/
    // Calendar Elements and options
    /*=====================*/
    const calendarEl = document.querySelector("#calendar");

    const calendarHeaderToolbar = {
      left: "prev next addEventButton",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    };

    // Initialize Calendar with empty events initially
    const calendar = new FullCalendar.Calendar(calendarEl, {
      selectable: true,
      initialView: "dayGridMonth",
      initialDate: newDate,
      headerToolbar: calendarHeaderToolbar,
      events: [], // Start empty, load via fetch
      select: calendarSelect,
      eventClick: calendarEventClick,
      dateClick: calendarAddEvent,
      customButtons: {
        addEventButton: {
          text: "Add Event +",
          click: calendarAddEvent,
        },
      },
      eventClassNames({ event: calendarEvent }) {
        const getColorValue =
          calendarsEvents[calendarEvent._def.extendedProps.calendar];
        return [`event-fc-color`, `fc-bg-${getColorValue}`];
      },
    });

    /*=====================*/
    // Fetch Events from Backend
    /*=====================*/
    function fetchEvents() {
      if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('read', null, (response) => {
          if (response.status === 'success') {
            calendar.removeAllEvents();
            calendar.addEventSource(response.data);
            console.log('Events loaded:', response.data);
          } else {
            console.error('Failed to load events:', response.message);
            if (window.showToast) window.showToast('Failed to load events', 'error');
          }
        });
      } else {
        console.error('sendDataToGoogle function not found. Make sure apps-script.js is loaded.');
      }
    }

    /*=====================*/
    // Modal Functions
    /*=====================*/
    const openModal = () => {
      document.getElementById("eventModal").style.display = "flex";
      document.getElementById("eventModal").classList.remove("hidden");
    };

    const closeModal = () => {
      document.getElementById("eventModal").style.display = "none";
      document.getElementById("eventModal").classList.add("hidden");
      resetModalFields();
    };

    window.onclick = function (event) {
      const modal = document.getElementById("eventModal");
      if (event.target === modal) {
        closeModal();
      }
    };

    /*=====================*/
    // Calendar Select fn.
    /*=====================*/
    function calendarSelect(info) {
      resetModalFields();
      getModalAddBtnEl.style.display = "flex";
      getModalUpdateBtnEl.style.display = "none";
      openModal();
      getModalStartDateEl.value = info.startStr;
      getModalEndDateEl.value = info.endStr || info.startStr;
      getModalTitleEl.value = "";
    }

    /*=====================*/
    // Calendar AddEvent fn.
    /*=====================*/
    function calendarAddEvent() {
      const currentDate = new Date();
      const dd = String(currentDate.getDate()).padStart(2, "0");
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const yyyy = currentDate.getFullYear();
      const combineDate = `${yyyy}-${mm}-${dd}`; // Simplified date format

      getModalAddBtnEl.style.display = "flex";
      getModalUpdateBtnEl.style.display = "none";
      openModal();
      getModalStartDateEl.value = combineDate;
    }

    /*=====================*/
    // Calender Event Function
    /*=====================*/
    function calendarEventClick(info) {
      const eventObj = info.event;

      if (eventObj.url) {
        window.open(eventObj.url);
        info.jsEvent.preventDefault();
      } else {
        const getModalEventId = eventObj.id; // Use direct ID
        const getModalEventLevel = eventObj.extendedProps.calendar;
        const getModalCheckedRadioBtnEl = document.querySelector(
          `input[value="${getModalEventLevel}"]`,
        );

        getModalTitleEl.value = eventObj.title;
        getModalStartDateEl.value = eventObj.startStr.slice(0, 10);
        getModalEndDateEl.value = eventObj.endStr
          ? eventObj.endStr.slice(0, 10)
          : "";
        if (getModalCheckedRadioBtnEl) {
          getModalCheckedRadioBtnEl.checked = true;
        }
        getModalUpdateBtnEl.dataset.fcEventPublicId = getModalEventId;
        getModalAddBtnEl.style.display = "none";
        getModalUpdateBtnEl.style.display = "block";
        openModal();
      }
    }

    /*=====================*/
    // Update Calender Event
    /*=====================*/
    getModalUpdateBtnEl.addEventListener("click", () => {
      const getPublicID = getModalUpdateBtnEl.dataset.fcEventPublicId;
      const getTitleUpdatedValue = getModalTitleEl.value;
      const setModalStartDateValue = getModalStartDateEl.value;
      const setModalEndDateValue = getModalEndDateEl.value;
      const getModalUpdatedCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );

      const getModalUpdatedCheckedRadioBtnValue =
        getModalUpdatedCheckedRadioBtnEl
          ? getModalUpdatedCheckedRadioBtnEl.value
          : "";

      const eventData = {
        id: getPublicID,
        title: getTitleUpdatedValue,
        start: setModalStartDateValue,
        end: setModalEndDateValue,
        extendedProps: { calendar: getModalUpdatedCheckedRadioBtnValue },
        allDay: true // Default to all day for simplicity
      };

      if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('update', eventData, (response) => {
          if (response.status === 'success') {
            const getEvent = calendar.getEventById(getPublicID);
            if (getEvent) {
              getEvent.setProp("title", getTitleUpdatedValue);
              getEvent.setDates(setModalStartDateValue, setModalEndDateValue);
              getEvent.setExtendedProp("calendar", getModalUpdatedCheckedRadioBtnValue);
            }
            closeModal();
            if (window.showToast) window.showToast('Event updated successfully');
          } else {
            console.error('Failed to update event:', response.message);
            if (window.showToast) window.showToast('Failed to update event', 'error');
          }
        });
      }
    });

    /*=====================*/
    // Add Calender Event
    /*=====================*/
    getModalAddBtnEl.addEventListener("click", () => {
      const getModalCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );

      const getTitleValue = getModalTitleEl.value;
      const setModalStartDateValue = getModalStartDateEl.value;
      const setModalEndDateValue = getModalEndDateEl.value;
      const getModalCheckedRadioBtnValue = getModalCheckedRadioBtnEl
        ? getModalCheckedRadioBtnEl.value
        : "Primary"; // Default to Primary if none selected

      const tempId = Date.now().toString();
      const eventData = {
        id: tempId,
        title: getTitleValue,
        start: setModalStartDateValue,
        end: setModalEndDateValue,
        allDay: true,
        extendedProps: { calendar: getModalCheckedRadioBtnValue },
      };

      if (typeof window.sendDataToGoogle === 'function') {
        window.sendDataToGoogle('create', eventData, (response) => {
          if (response.status === 'success') {
            // Use the ID returned from server if available, otherwise tempId
            const finalId = response.data && response.data.id ? response.data.id : tempId;
            eventData.id = finalId;

            calendar.addEvent(eventData);
            closeModal();
            if (window.showToast) window.showToast('Event created successfully');
          } else {
            console.error('Failed to create event:', response.message);
            if (window.showToast) window.showToast('Failed to create event', 'error');
          }
        });
      }
    });

    /*=====================*/
    // Calendar Init
    /*=====================*/
    calendar.render();
    fetchEvents(); // Load events on init

    // Reset modal fields when hidden
    document.getElementById("eventModal").addEventListener("click", (event) => {
      if (event.target.classList.contains("modal-close-btn")) {
        closeModal();
      }
    });

    function resetModalFields() {
      getModalTitleEl.value = "";
      getModalStartDateEl.value = "";
      getModalEndDateEl.value = "";
      const getModalIfCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked',
      );
      if (getModalIfCheckedRadioBtnEl) {
        getModalIfCheckedRadioBtnEl.checked = false;
      }
    }

    document.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    window.addEventListener("click", (event) => {
      if (event.target === document.getElementById("eventModal")) {
        closeModal();
      }
    });
  }
};
