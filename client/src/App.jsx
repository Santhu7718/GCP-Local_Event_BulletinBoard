import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";


import EventCard
  from "./components/EventCard";


import EventForm
  from "./components/EventForm";


import SearchBar
  from "./components/SearchBar";


import CategoryFilter
  from "./components/CategoryFilter";


import {
  onAuthStateChanged,
  signOut
} from "firebase/auth";


import {
  auth
} from "./firebase";


import AuthModal
  from "./components/AuthModal";


import {
  createEvent,
  getEventById,
  getEvents,
  getExpiredEvents,
  rsvpToEvent,
  updateEvent
} from "./services/api";


import EventEditForm
  from "./components/EventEditForm";


/*
|--------------------------------------------------------------------------
| Visitor ID
|--------------------------------------------------------------------------
|
| For Phase 1 we use a browser-generated ID.
| Later Firestore will use this for RSVP records.
|
|--------------------------------------------------------------------------
*/

function getVisitorId() {

  const storageKey =
    "local-event-board-visitor-id";


  let visitorId =
    localStorage.getItem(
      storageKey
    );


  if (!visitorId) {

    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
      "function"
    ) {

      visitorId =
        window.crypto.randomUUID();

    } else {

      visitorId =
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

    }


    localStorage.setItem(
      storageKey,
      visitorId
    );

  }


  return visitorId;

}


/*
|--------------------------------------------------------------------------
| Shared event ID from URL
|--------------------------------------------------------------------------
*/

function getEventIdFromUrl() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  return params.get(
    "event"
  );

}


/*
|--------------------------------------------------------------------------
| Format event date for details modal
|--------------------------------------------------------------------------
*/

function formatDetailDate(
  value
) {

  return new Date(
    value
  ).toLocaleString(
    "en-IN",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );

}


/*
|--------------------------------------------------------------------------
| Application
|--------------------------------------------------------------------------
*/

export default function App() {


  const [events, setEvents] =
    useState([]);


  const [search, setSearch] =
    useState("");


  const [category, setCategory] =
    useState("All");


  const [loading, setLoading] =
    useState(true);


  const [error, setError] =
    useState("");


  const [showCreateForm, setShowCreateForm] =
    useState(false);


  const [selectedEvent, setSelectedEvent] =
    useState(null);


  const [editingEvent, setEditingEvent] =
    useState(null);


  const [editSaving, setEditSaving] =
    useState(false);


  const [formSubmitting, setFormSubmitting] =
    useState(false);


  const [toast, setToast] =
    useState("");


  const [loadingSharedEvent, setLoadingSharedEvent] =
    useState(false);


  const [
    activeTab,
    setActiveTab
  ] = useState("upcoming");


  const [
    expiredEvents,
    setExpiredEvents
  ] = useState([]);


  const [
    expiredLoading,
    setExpiredLoading
  ] = useState(false);


  const [
    expiredError,
    setExpiredError
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | Firebase authentication state
  |--------------------------------------------------------------------------
  */

  const [user, setUser] =
    useState(null);


  const [authLoading, setAuthLoading] =
    useState(true);


  const [showAuthModal, setShowAuthModal] =
    useState(false);


  /*
  |--------------------------------------------------------------------------
  | Keep React synchronized with Firebase Auth
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        (currentUser) => {

          setUser(
            currentUser
          );


          setAuthLoading(
            false
          );

        }
      );


    return unsubscribe;

  }, []);



  /*
  Browser identity used for RSVP
  */

  const visitorId =
    useMemo(
      () => getVisitorId(),
      []
    );


  /*
  |--------------------------------------------------------------------------
  | Toast
  |--------------------------------------------------------------------------
  */

  const showToast =
    useCallback(
      (message) => {

        setToast(
          message
        );


        window.setTimeout(
          () => {

            setToast("");

          },
          3000
        );

      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | Load events
  |--------------------------------------------------------------------------
  */

  const loadEvents =
    useCallback(
      async () => {

        try {

          setLoading(
            true
          );


          setError("");


          const data =
            await getEvents({
              search,
              category
            });


          setEvents(
            data.events || []
          );


        } catch (error) {

          console.error(
            "Failed to load events:",
            error
          );


          setError(
            error?.message ||
            "Unable to load events."
          );


        } finally {

          setLoading(
            false
          );

        }

      },
      [
        search,
        category
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | Load events when search/category changes
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      const timer =
        window.setTimeout(
          () => {

            loadEvents();

          },
          250
        );


      return () => {

        window.clearTimeout(
          timer
        );

      };

    },
    [
      loadEvents
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | Open shared event
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {

      const eventId =
        getEventIdFromUrl();


      if (!eventId) {

        return;

      }


      async function loadSharedEvent() {

        try {

          setLoadingSharedEvent(
            true
          );


          const data =
            await getEventById(
              eventId
            );


          setSelectedEvent(
            data.event
          );


        } catch (error) {

          console.error(
            "Failed to load shared event:",
            error
          );


          showToast(
            error?.message ||
            "Unable to open shared event."
          );


        } finally {

          setLoadingSharedEvent(
            false
          );

        }

      }


      loadSharedEvent();

    },
    [
      showToast
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | Load expired events when tab is opened
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      activeTab === "expired"
    ) {

      loadExpiredEvents();

    }

  }, [activeTab]);


  /*
  |--------------------------------------------------------------------------
  | CREATE EVENT
  |--------------------------------------------------------------------------
  |
  | This is the function EventForm receives.
  |
  | EventForm
  |     ↓
  | onCreate(eventData)
  |     ↓
  | handleCreateEvent()
  |     ↓
  | createEvent()
  |     ↓
  | POST /api/events
  |
  |--------------------------------------------------------------------------
  */

  async function handleCreateEvent(
    eventData
  ) {

    try {

      setFormSubmitting(
        true
      );


      console.log(
        "Creating event:",
        eventData
      );


      const result =
        await createEvent(
          eventData
        );


      console.log(
        "Create event response:",
        result
      );


      /*
      Close modal
      */

      setShowCreateForm(
        false
      );


      /*
      Reload event list
      */

      await loadEvents();


      /*
      Notify user
      */

      showToast(
        "Event published successfully."
      );


    } catch (error) {

      console.error(
        "Create event failed:",
        error
      );


      /*
      Very important:
      throw error back to EventForm.

      EventForm will display
      the backend error.
      */

      throw error;


    } finally {

      setFormSubmitting(
        false
      );

    }

  }


  /*
  |--------------------------------------------------------------------------
  | RSVP
  |--------------------------------------------------------------------------
  */

  async function handleRSVP(
    event
  ) {

    try {

      const result =
        await rsvpToEvent(
          event.id
        );


      const updatedEvent =
        result.event;


      setEvents(
        (currentEvents) =>
          currentEvents.map(
            (currentEvent) =>
              currentEvent.id ===
                updatedEvent.id
                ? updatedEvent
                : currentEvent
          )
      );


      setSelectedEvent(
        (currentEvent) => {

          if (
            currentEvent &&
            currentEvent.id ===
            updatedEvent.id
          ) {

            return updatedEvent;

          }


          return currentEvent;

        }
      );


      showToast(
        result.message ||
        "RSVP registered."
      );


    } catch (error) {

      console.error(
        "RSVP failed:",
        error
      );


      showToast(
        error?.message ||
        "Unable to RSVP."
      );

    }

  }


  /*
  |--------------------------------------------------------------------------
  | SHARE EVENT
  |--------------------------------------------------------------------------
  */

  async function handleShare(
    event
  ) {

    const url =
      `${window.location.origin}/?event=${event.id}`;


    try {

      await navigator.clipboard.writeText(
        url
      );


      showToast(
        "Event link copied to clipboard."
      );


    } catch (error) {

      console.error(
        "Clipboard failed:",
        error
      );


      window.prompt(
        "Copy this event link:",
        url
      );

    }

  }


  /*
  |--------------------------------------------------------------------------
  | Load expired events
  |--------------------------------------------------------------------------
  */

  async function loadExpiredEvents() {

    try {

      setExpiredLoading(
        true
      );


      setExpiredError("");


      const result =
        await getExpiredEvents();


      setExpiredEvents(
        result.events || []
      );


    } catch (error) {

      console.error(
        "Failed to load expired events:",
        error
      );


      setExpiredError(
        error.message ||
        "Failed to load expired events."
      );


    } finally {

      setExpiredLoading(
        false
      );

    }

  }


  /*
  |--------------------------------------------------------------------------
  | Open details
  |--------------------------------------------------------------------------
  */

  function handleDetails(
    event
  ) {

    setSelectedEvent(
      event
    );


    const url =
      new URL(
        window.location.href
      );


    url.searchParams.set(
      "event",
      event.id
    );


    window.history.pushState(
      {},
      "",
      url
    );

  }


  /*
  |--------------------------------------------------------------------------
  | EDIT EVENT
  |--------------------------------------------------------------------------
  */

  function handleEdit(
    event
  ) {

    /*
    --------------------------------------------------------------
    Organizer must be signed in
    --------------------------------------------------------------
    */

    if (!user) {

      setShowAuthModal(
        true
      );


      showToast(
        "Please sign in to edit an event."
      );


      return;

    }


    /*
    --------------------------------------------------------------
    Existing one-hour edit lock
    --------------------------------------------------------------
    */

    if (!event.editAllowed) {

      showToast(
        event.editLockReason ||
        "This event can no longer be edited."
      );


      return;

    }


    setEditingEvent(
      event
    );

  }


  /*
  |--------------------------------------------------------------------------
  | SAVE EVENT EDIT
  |--------------------------------------------------------------------------
  */

  async function handleSaveEdit(
    updates
  ) {

    if (!editingEvent) {

      return;

    }


    try {

      setEditSaving(
        true
      );


      const result =
        await updateEvent(
          editingEvent.id,
          updates
        );


      const updatedEvent =
        result.event;


      /*
      Update the card immediately
      */

      setEvents(
        (currentEvents) =>
          currentEvents.map(
            (event) =>
              event.id ===
                updatedEvent.id
                ? updatedEvent
                : event
          )
      );


      /*
      Update details modal if it
      happens to be open
      */

      setSelectedEvent(
        (currentEvent) => {

          if (
            currentEvent &&
            currentEvent.id ===
            updatedEvent.id
          ) {

            return updatedEvent;

          }


          return currentEvent;

        }
      );


      setEditingEvent(
        null
      );


      showToast(
        "Event updated successfully."
      );


    } catch (error) {

      console.error(
        "Event update failed:",
        error
      );


      throw error;


    } finally {

      setEditSaving(
        false
      );

    }

  }


  /*
  |--------------------------------------------------------------------------
  | Close details
  |--------------------------------------------------------------------------
  */

  function closeEventDetails() {

    setSelectedEvent(
      null
    );


    const url =
      new URL(
        window.location.href
      );


    url.searchParams.delete(
      "event"
    );


    window.history.pushState(
      {},
      "",
      url
    );

  }


  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (

    <div className="app-shell">


      {/* HEADER */}

      <header className="site-header">

        <div className="container header-inner">

          <a
            href="/"
            className="brand"
          >

            <span className="brand-mark">
              LE
            </span>


            <span className="brand-copy">

              <strong>
                Local Event Board
              </strong>

              <small>
                Your neighborhood,
                connected.
              </small>

            </span>

          </a>


          {/* ============================================================
              AUTHENTICATION + POST EVENT
              ============================================================ */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >

            {!authLoading && user && (

              <>

                <span
                  style={{
                    fontSize: "13px",
                    opacity: 0.75
                  }}
                >
                  {user.email}
                </span>


                <button
                  type="button"
                  className="secondary-button"
                  onClick={async () => {

                    try {

                      await signOut(
                        auth
                      );


                      showToast(
                        "Signed out successfully."
                      );


                    } catch (error) {

                      console.error(
                        "Sign out failed:",
                        error
                      );


                      showToast(
                        "Unable to sign out."
                      );

                    }

                  }}
                >
                  Sign out
                </button>

              </>

            )}


            {!authLoading && !user && (

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setShowAuthModal(
                    true
                  )
                }
              >
                Sign in
              </button>

            )}


            <button
              type="button"
              className="primary-button"
              onClick={() => {

                /*
                ----------------------------------------------------------
                User must sign in before posting
                ----------------------------------------------------------
                */

                if (!user) {

                  setShowAuthModal(
                    true
                  );


                  return;

                }


                setShowCreateForm(
                  true
                );

              }}
            >

              <span className="button-plus">
                +
              </span>

              Post an Event

            </button>

          </div>

        </div>

      </header>


      {/* HERO */}

      <main>

        <section className="hero-section">

          <div className="container">


            <div className="hero-grid">

              <div className="hero-content">

                <p className="eyebrow">
                  LOCAL COMMUNITY
                </p>


                <h1>

                  Find something

                  <br />

                  <span>
                    happening nearby.
                  </span>

                </h1>


                <p className="hero-description">

                  Discover local events,
                  meetups, food festivals,
                  sports and neighborhood
                  activities all in one place.

                </p>

              </div>


              <div className="hero-stat-card">

                <span className="stat-icon">
                  ◌
                </span>


                <strong>
                  {events.length}
                </strong>


                <span>
                  upcoming events
                </span>

              </div>

            </div>


            {/* SEARCH + CATEGORY */}

            <div className="discovery-panel">

              <SearchBar
                value={search}
                onChange={setSearch}
              />


              <CategoryFilter
                selected={category}
                onChange={setCategory}
              />

            </div>

          </div>

        </section>


        {/* ================================================================
            EVENT TABS + EVENT LISTS
            ================================================================ */}

        <section className="events-section">

          <div className="container">

            <div
              className="event-tabs"
              role="tablist"
              aria-label="Event views"
            >

              <button
                type="button"
                role="tab"
                aria-selected={
                  activeTab === "upcoming"
                }
                className={
                  activeTab === "upcoming"
                    ? "event-tab active"
                    : "event-tab"
                }
                onClick={() =>
                  setActiveTab(
                    "upcoming"
                  )
                }
              >

                Upcoming Events

                <span className="event-tab-count">
                  {events.length}
                </span>

              </button>


              <button
                type="button"
                role="tab"
                aria-selected={
                  activeTab === "expired"
                }
                className={
                  activeTab === "expired"
                    ? "event-tab active"
                    : "event-tab"
                }
                onClick={() =>
                  setActiveTab(
                    "expired"
                  )
                }
              >

                Expired Events

                <span className="event-tab-count">
                  {expiredEvents.length}
                </span>

              </button>

            </div>


            <div className="section-header">

              <div>

                <p className="eyebrow">

                  {activeTab === "upcoming"
                    ? "DISCOVER"
                    : "EVENT HISTORY"}

                </p>


                <h2>

                  {activeTab === "upcoming"
                    ? "Upcoming Events"
                    : "Expired Events"}

                </h2>

              </div>


              <span className="results-count">

                {activeTab === "upcoming"
                  ? events.length
                  : expiredEvents.length}

                {" "}

                {(activeTab === "upcoming"
                  ? events.length
                  : expiredEvents.length) === 1
                  ? "event"
                  : "events"}

              </span>

            </div>


            {/* ============================================================
                UPCOMING EVENTS TAB
                ============================================================ */}

            {activeTab === "upcoming" && (

              <>

                {loading && (

                  <div className="state-panel">

                    <div className="loader" />

                    <p>
                      Loading events...
                    </p>

                  </div>

                )}


                {!loading && error && (

                  <div className="state-panel error-panel">

                    <div className="state-symbol">
                      !
                    </div>


                    <h3>
                      Couldn't load events
                    </h3>


                    <p>
                      {error}
                    </p>


                    <button
                      type="button"
                      className="secondary-button"
                      onClick={
                        loadEvents
                      }
                    >
                      Try Again
                    </button>

                  </div>

                )}


                {!loading &&
                  !error &&
                  events.length === 0 && (

                    <div className="state-panel">

                      <div className="state-symbol">
                        ◫
                      </div>


                      <h3>
                        No matching events
                      </h3>


                      <p>
                        Try another search
                        or category, or post
                        the first event.
                      </p>


                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => {

                          if (!user) {

                            setShowAuthModal(
                              true
                            );


                            return;

                          }


                          setShowCreateForm(
                            true
                          );

                        }}
                      >
                        + Post an Event
                      </button>

                    </div>

                  )}


                {!loading &&
                  !error &&
                  events.length > 0 && (

                    <div className="event-grid">

                      {events.map(
                        (event) => (

                          <EventCard
                            key={event.id}
                            event={event}
                            currentUser={user}
                            onDetails={
                              handleDetails
                            }
                            onRSVP={
                              handleRSVP
                            }
                            onShare={
                              handleShare
                            }
                            onEdit={
                              handleEdit
                            }
                            expired={
                              false
                            }
                          />

                        )
                      )}

                    </div>

                  )}

              </>

            )}


            {/* ============================================================
                EXPIRED EVENTS TAB
                ============================================================ */}

            {activeTab === "expired" && (

              <>

                {expiredLoading && (

                  <div className="state-panel">

                    <div className="loader" />

                    <p>
                      Loading expired events...
                    </p>

                  </div>

                )}


                {!expiredLoading &&
                  expiredError && (

                    <div className="state-panel error-panel">

                      <div className="state-symbol">
                        !
                      </div>


                      <h3>
                        Couldn't load expired events
                      </h3>


                      <p>
                        {expiredError}
                      </p>


                      <button
                        type="button"
                        className="secondary-button"
                        onClick={
                          loadExpiredEvents
                        }
                      >
                        Try Again
                      </button>

                    </div>

                  )}


                {!expiredLoading &&
                  !expiredError &&
                  expiredEvents.length === 0 && (

                    <div className="state-panel">

                      <div className="state-symbol">
                        ✓
                      </div>


                      <h3>
                        No expired events
                      </h3>


                      <p>
                        Events will appear here after
                        their scheduled start time has passed.
                      </p>

                    </div>

                  )}


                {!expiredLoading &&
                  !expiredError &&
                  expiredEvents.length > 0 && (

                    <div className="event-grid">

                      {expiredEvents.map(
                        (event) => (

                          <EventCard
                            key={event.id}
                            event={event}
                            currentUser={user}
                            onDetails={
                              handleDetails
                            }
                            onRSVP={
                              handleRSVP
                            }
                            onShare={
                              handleShare
                            }
                            onEdit={
                              handleEdit
                            }
                            expired={
                              true
                            }
                          />

                        )
                      )}

                    </div>

                  )}

              </>

            )}

          </div>

        </section>

      </main>


      {/* FOOTER */}

      <footer className="site-footer">

        <div className="container footer-inner">

          <span>
            Local Event Board
          </span>


          <span>
            Community powered
          </span>

        </div>

      </footer>


      {/* ================================================================
          AUTHENTICATION MODAL
          ================================================================ */}

      {showAuthModal && (

        <AuthModal
          onClose={() =>
            setShowAuthModal(
              false
            )
          }
        />

      )}


      {/* ================================================================
          CREATE EVENT MODAL
          ================================================================ */}

      {showCreateForm && (

        <EventForm

          onClose={() =>
            setShowCreateForm(
              false
            )
          }


          /*
          IMPORTANT:
          The prop name MUST be onCreate.
          */

          onCreate={
            handleCreateEvent
          }


          submitting={
            formSubmitting
          }

        />

      )}


      {/* ================================================================
          EDIT EVENT MODAL
          ================================================================ */}

      {editingEvent && (

        <EventEditForm

          event={
            editingEvent
          }


          onClose={() =>
            setEditingEvent(
              null
            )
          }


          onSave={
            handleSaveEdit
          }


          saving={
            editSaving
          }

        />

      )}


      {/* ================================================================
          SHARED EVENT LOADING
          ================================================================ */}

      {loadingSharedEvent && (

        <div className="modal-backdrop">

          <div className="shared-event-loading">

            <div className="loader" />

            <p>
              Opening event...
            </p>

          </div>

        </div>

      )}


      {/* ================================================================
          EVENT DETAILS
          ================================================================ */}

      {selectedEvent && (

        <div
          className="modal-backdrop"
          onMouseDown={(event) => {

            if (
              event.target ===
              event.currentTarget
            ) {

              closeEventDetails();

            }

          }}
        >

          <div
            className="modal details-modal"
            role="dialog"
            aria-modal="true"
          >


            {/* =========================================================
                MODAL HEADER
                ========================================================= */}

            <div className="modal-top">

              <div>

                <span
                  className={`category-badge ${String(
                    selectedEvent.category ||
                    ""
                  )
                    .toLowerCase()
                    .replace(
                      /\s+/g,
                      "-"
                    )}`}
                >

                  {
                    selectedEvent.category
                  }

                </span>


                <h2>

                  {
                    selectedEvent.title
                  }

                </h2>

              </div>


              <button
                type="button"
                className="close-button"
                onClick={
                  closeEventDetails
                }
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* =========================================================
                DATE / LOCATION
                ========================================================= */}

            <div className="detail-hero">

              <div className="detail-date">

                <span>

                  {new Date(
                    selectedEvent.dateTime
                  ).getDate()}

                </span>


                <small>

                  {new Date(
                    selectedEvent.dateTime
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      month: "short"
                    }
                  )}

                </small>

              </div>


              <div>

                <strong>

                  {formatDetailDate(
                    selectedEvent.dateTime
                  )}

                </strong>


                <p>

                  {[
                    selectedEvent.location,
                    selectedEvent.city
                  ]
                    .filter(Boolean)
                    .join(", ")}

                </p>

              </div>

            </div>


            {/* =========================================================
                DESCRIPTION
                ========================================================= */}

            <div className="detail-body">

              <h4>
                About this event
              </h4>


              <p>
                {
                  selectedEvent.description
                }
              </p>


              {/* OFFICIAL EVENT LINK */}

              {selectedEvent.eventLink && (

                <a
                  href={
                    selectedEvent.eventLink
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="event-link-button"
                >
                  Event Link ↗
                </a>

              )}

            </div>


            {/* =========================================================
                QUALITY + TRUST
                ========================================================= */}

            {(
              selectedEvent.qualityScore !==
              null &&
              selectedEvent.qualityScore !==
              undefined
            ) ||
              (
                selectedEvent.trustScore !==
                null &&
                selectedEvent.trustScore !==
                undefined
              ) ? (

              <div className="detail-score-panel">

                <h4>
                  Event Quality & Trust
                </h4>


                <div className="detail-score-grid">


                  {/* QUALITY */}

                  {selectedEvent.qualityScore !==
                    null &&
                    selectedEvent.qualityScore !==
                    undefined && (

                      <div>

                        <span>
                          Quality
                        </span>


                        <strong>

                          {
                            selectedEvent.qualityScore
                          }

                          /100

                        </strong>


                        <small>

                          {
                            selectedEvent.qualityLabel ||
                            "Calculated"
                          }

                        </small>

                      </div>

                    )}


                  {/* TRUST */}

                  {selectedEvent.trustScore !==
                    null &&
                    selectedEvent.trustScore !==
                    undefined && (

                      <div>

                        <span>
                          Trust
                        </span>


                        <strong>

                          {
                            selectedEvent.trustScore
                          }

                          /100

                        </strong>


                        <small>

                          {
                            selectedEvent.trustLabel ||
                            "Calculated"
                          }

                        </small>

                      </div>

                    )}

                </div>

              </div>

            ) : null}


            {/* =========================================================
                META INFORMATION
                ========================================================= */}

            <div className="detail-meta-grid">


              {/* ORGANIZER */}

              <div>

                <span>
                  Organizer
                </span>


                <strong>

                  {
                    selectedEvent.organizerName
                  }

                </strong>

              </div>


              {/* RSVP COUNT */}

              <div>

                <span>
                  Going
                </span>


                <strong>

                  {
                    selectedEvent.rsvpCount ||
                    0
                  }

                </strong>

              </div>


              {/* STATUS */}

              <div>

                <span>
                  Status
                </span>


                <strong
                  className={
                    selectedEvent.status ===
                      "EXPIRED"
                      ? "status-expired"
                      : "status-positive"
                  }
                >

                  {
                    selectedEvent.status ===
                      "EXPIRED"
                      ? "Expired"
                      : "Upcoming"
                  }

                </strong>

              </div>

            </div>


            {/* =========================================================
                MODAL ACTIONS
                ========================================================= */}

            <div className="modal-actions">

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  handleShare(
                    selectedEvent
                  )
                }
              >
                Share Event
              </button>


              <button
                type="button"
                className="primary-button"
                disabled={
                  selectedEvent.status ===
                  "EXPIRED"
                }
                onClick={() => {

                  if (
                    selectedEvent.status ===
                    "EXPIRED"
                  ) {

                    return;

                  }


                  handleRSVP(
                    selectedEvent
                  );

                }}
              >

                {
                  selectedEvent.status ===
                    "EXPIRED"
                    ? "Event Expired"
                    : "I'm Going"
                }

              </button>

            </div>

          </div>

        </div>

      )}


      {/* ================================================================
          TOAST
          ================================================================ */}

      {toast && (

        <div
          className="toast"
          role="status"
        >

          <span>
            ✓
          </span>

          {toast}

        </div>

      )}

    </div>

  );

}