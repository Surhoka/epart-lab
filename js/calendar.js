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
      danger: "danger",
      success: "success",
      primary: "primary",
      warning: "warning",
    };

    /*=====================*/
    // Draggable Events
    /*=====================*/
    const externalEventsContainer = document.getElementById("external-events");
    if (externalEventsContainer) {
      new FullCalendar.Draggable(externalEventsContainer, {
        itemSelector: ".external-event",
        eventData: function (eventEl) {
          return {
            title: eventEl.dataset.title,
            extendedProps: {
              calendar: eventEl.dataset.class,
            },
          };
        },
      });
    }

    /*=====================*/
    // Calendar Elements and options
    /*=====================*/
    const calendarEl = document.querySelector("#calendar");

    const calendarHeaderToolbar = {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay",
    };

    const calendarEventsList = [
      {
        id: 1,
        title: "Event Conf.",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-01`,
        extendedProps: { calendar: "danger" },
      },
      {
        id: 2,
        title: "Seminar #4",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-07`,
        end: `${newDate.getFullYear()}-${getDynamicMonth()}-10`,
        extendedProps: { calendar: "success" },
      },
      {
        groupId: "999",
        id: 3,
        title: "Meeting #5",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-09T16:00:00`,
        extendedProps: { calendar: "primary" },
      },
      {
        groupId: "999",
        id: 4,
        title: "Submission #1",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-16T16:00:00`,
        extendedProps: { calendar: "warning" },
      },
      {
        id: 5,
        title: "Seminar #6",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-11`,
        end: `${newDate.getFullYear()}-${getDynamicMonth()}-13`,
        extendedProps: { calendar: "danger" },
      },
      {
        id: 6,
        title: "Meeting 3",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T10:30:00`,
        end: `${newDate.getFullYear()}-${getDynamicMonth()}-12T12:30:00`,
        extendedProps: { calendar: "success" },
      },
      {
        id: 7,
        title: "Meetup #",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T12:00:00`,
        extendedProps: { calendar: "primary" },
      },
      {
        id: 8,
        title: "Submission",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-12T14:30:00`,
        extendedProps: { calendar: "warning" },
      },
      {
        id: 9,
        title: "Attend event",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-13T07:00:00`,
        extendedProps: { calendar: "success" },
      },
      {
        id: 10,
        title: "Project submission #2",
        start: `${newDate.getFullYear()}-${getDynamicMonth()}-28`,
        extendedProps: { calendar: "primary" },
      },
    ];

    /*=====================*/
    // Modal Functions
    /*=====================*/
    const openModal = () => {
      const eventModal = document.getElementById("eventModal");
      if (eventModal) {
        eventModal.style.display = "flex";
        eventModal.classList.remove("hidden");
      }
    };

    const closeModal = () => {
      const eventModal = document.getElementById("eventModal");
      if (eventModal) {
        eventModal.style.display = "none";
        eventModal.classList.add("hidden");
        resetModalFields();
      }
    };

    /*=====================*/
    // Calendar Select fn.
    /*=====================*/
    const calendarSelect = (info) => {
      resetModalFields();
      getModalAddBtnEl.style.display = "flex";
      getModalUpdateBtnEl.style.display = "none";
      openModal();
      getModalStartDateEl.value = info.startStr;
      getModalEndDateEl.value = info.endStr || info.startStr;
      getModalTitleEl.value = "";
    };

    /*=====================*/
    // Calendar AddEvent fn (for button)
    /*=====================*/
    const calendarAddEvent = () => {
      resetModalFields();
      const currentDate = new Date();
      const dd = String(currentDate.getDate()).padStart(2, "0");
      const mm = String(currentDate.getMonth() + 1).padStart(2, "0");
      const yyyy = currentDate.getFullYear();
      const combineDate = `${yyyy}-${mm}-${dd}`;

      getModalAddBtnEl.style.display = "flex";
      getModalUpdateBtnEl.style.display = "none";
      openModal();
      getModalStartDateEl.value = combineDate;
      getModalEndDateEl.value = combineDate;
    };

    /*=====================*/
    // Calender Event Function
    /*=====================*/
    const calendarEventClick = (info) => {
      const eventObj = info.event;

      if (eventObj.url) {
        window.open(eventObj.url);
        info.jsEvent.preventDefault();
      } else {
        const getModalEventId = eventObj._def.publicId;
        const getModalEventLevel = eventObj._def.extendedProps.calendar;

        // Find the correct radio button to check
        const getModalCheckedRadioBtnEl = document.querySelector(
          `input[value="${getModalEventLevel}"]`
        );

        getModalTitleEl.value = eventObj.title;

        // Format dates correctly
        getModalStartDateEl.value = eventObj.start
          ? eventObj.start.toISOString().slice(0, 10)
          : "";
        getModalEndDateEl.value = eventObj.end
          ? eventObj.end.toISOString().slice(0, 10)
          : getModalStartDateEl.value;

        if (getModalCheckedRadioBtnEl) {
          getModalCheckedRadioBtnEl.checked = true;
        } else {
          // If no matching radio, uncheck all
          const checkedRadio = document.querySelector('input[name="event-level"]:checked');
          if (checkedRadio) {
            checkedRadio.checked = false;
          }
        }

        getModalUpdateBtnEl.dataset.fcEventPublicId = getModalEventId;
        getModalAddBtnEl.style.display = "none";
        getModalUpdateBtnEl.style.display = "flex";
        openModal();
      }
    };

    /*=====================*/
    // Active Calender
    /*=====================*/
    const calendar = new FullCalendar.Calendar(calendarEl, {
      selectable: true,
      initialView: "dayGridMonth",
      initialDate: `${newDate.getFullYear()}-${getDynamicMonth()}-07`,
      headerToolbar: calendarHeaderToolbar,
      events: calendarEventsList,
      select: calendarSelect,
      eventClick: calendarEventClick,
      dateClick: calendarSelect, // Use select for date clicks for consistency
      droppable: true,
      drop: function (info) {
        // The default behavior is to render the event, which is what we want for a demo.
        // In a real app, you might want to save it via AJAX.
        // The `eventReceive` callback can also be used.
      },
      eventClassNames({ event: calendarEvent }) {
        const calendarName = calendarEvent._def.extendedProps.calendar;
        const colorName = calendarsEvents[calendarName];
        if (colorName) {
          return [`event-fc-color`, `fc-bg-${colorName}`];
        }
        return ["event-fc-color"]; // Default class
      },
    });

    /*=====================*/
    // Update Calender Event
    /*=====================*/
    getModalUpdateBtnEl.addEventListener("click", () => {
      const getPublicID = getModalUpdateBtnEl.dataset.fcEventPublicId;
      const getTitleUpdatedValue = getModalTitleEl.value;
      const setModalStartDateValue = getModalStartDateEl.value;
      const setModalEndDateValue = getModalEndDateEl.value;
      const getEvent = calendar.getEventById(getPublicID);
      const getModalUpdatedCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked'
      );

      const getModalUpdatedCheckedRadioBtnValue =
        getModalUpdatedCheckedRadioBtnEl
          ? getModalUpdatedCheckedRadioBtnEl.value.toLowerCase()
          : "";

      getEvent.setProp("title", getTitleUpdatedValue);
      getEvent.setDates(setModalStartDateValue, setModalEndDateValue);
      getEvent.setExtendedProp("calendar", getModalUpdatedCheckedRadioBtnValue);
      closeModal();
    });

    /*=====================*/
    // Add Calender Event
    /*=====================*/
    getModalAddBtnEl.addEventListener("click", () => {
      const getModalCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked'
      );

      const getTitleValue = getModalTitleEl.value;
      const setModalStartDateValue = getModalStartDateEl.value;
      const setModalEndDateValue = getModalEndDateEl.value;
      const getModalCheckedRadioBtnValue = getModalCheckedRadioBtnEl
        ? getModalCheckedRadioBtnEl.value.toLowerCase()
        : "primary"; // Default value

      calendar.addEvent({
        id: Date.now(),
        title: getTitleValue,
        start: setModalStartDateValue,
        end: setModalEndDateValue,
        allDay: true,
        extendedProps: { calendar: getModalCheckedRadioBtnValue },
      });
      closeModal();
    });

    /*=====================*/
    // Sidebar "Add Event" Button
    /*=====================*/
    const addEventButton = document.getElementById("add-event");
    if (addEventButton) {
      addEventButton.addEventListener("click", calendarAddEvent);
    }

    /*=====================*/
    // Calendar Init
    /*=====================*/
    calendar.render();

    function resetModalFields() {
      getModalTitleEl.value = "";
      getModalStartDateEl.value = "";
      getModalEndDateEl.value = "";
      const getModalIfCheckedRadioBtnEl = document.querySelector(
        'input[name="event-level"]:checked'
      );
      if (getModalIfCheckedRadioBtnEl) {
        getModalIfCheckedRadioBtnEl.checked = false;
      }
    }

    // Close modal event listeners
    document.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", closeModal);
    });

    window.addEventListener("click", (event) => {
      const modal = document.getElementById("eventModal");
      if (modal && event.target === modal) {
        closeModal();
      }
    });
  }
};
