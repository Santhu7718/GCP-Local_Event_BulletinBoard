import {
    hasRsvpd
} from "../services/api";


/*
|--------------------------------------------------------------------------
| Date formatting
|--------------------------------------------------------------------------
*/

function formatDate(
    dateTime
) {

    const date =
        new Date(
            dateTime
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/*
|--------------------------------------------------------------------------
| Time formatting
|--------------------------------------------------------------------------
*/

function formatTime(
    dateTime
) {

    const date =
        new Date(
            dateTime
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Time unavailable";

    }


    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/*
|--------------------------------------------------------------------------
| Category class
|--------------------------------------------------------------------------
*/

function getCategoryClass(
    category
) {

    return String(
        category || ""
    )
        .toLowerCase()
        .replace(
            /\s+/g,
            "-"
        );

}


/*
|--------------------------------------------------------------------------
| Event Card
|--------------------------------------------------------------------------
*/

export default function EventCard({

    event,

    currentUser,

    onDetails,

    onRSVP,

    onShare,

    onEdit,

    expired = false

}) {

    /*
    |--------------------------------------------------------------------------
    | Browser-level RSVP state
    |--------------------------------------------------------------------------
    */

    const alreadyRsvpd =
        hasRsvpd(
            event.id
        );


    /*
    |--------------------------------------------------------------------------
    | Determine whether this card represents an expired event
    |--------------------------------------------------------------------------
    |
    | The parent can explicitly pass expired=true.
    |
    | We also check the event status as a safety fallback.
    |
    |--------------------------------------------------------------------------
    */

    const isExpired =
        expired ||
        event.status === "EXPIRED";


    /*
    |--------------------------------------------------------------------------
    | Ownership check
    |--------------------------------------------------------------------------
    |
    | Only the user who created the event can see and use the Edit button.
    | This is enforced on the server too (PUT /:id checks organizerUid).
    |--------------------------------------------------------------------------
    */

    const isOwner =
        !!currentUser &&
        !!event.organizerUid &&
        currentUser.uid === event.organizerUid;


    /*
    |--------------------------------------------------------------------------
    | Edit availability
    |--------------------------------------------------------------------------
    |
    | Expired events can never be edited.
    | Non-owners never see the Edit button.
    |--------------------------------------------------------------------------
    */

    const canEdit =
        isOwner &&
        !isExpired &&
        event.editAllowed === true;


    /*
    |--------------------------------------------------------------------------
    | RSVP availability
    |--------------------------------------------------------------------------
    */

    const canRSVP =
        !isExpired &&
        !alreadyRsvpd;


    /*
    |--------------------------------------------------------------------------
    | Location text
    |--------------------------------------------------------------------------
    */

    const locationText =
        [
            event.location,
            event.city
        ]
            .filter(
                Boolean
            )
            .join(
                ", "
            );


    /*
    |--------------------------------------------------------------------------
    | Status text
    |--------------------------------------------------------------------------
    */

    const statusText =
        isExpired
            ? "Expired"
            : "Upcoming";


    return (

        <article
            className={
                isExpired
                    ? "event-card expired"
                    : "event-card"
            }
        >

            {/* =========================================================
                HEADER
            ========================================================= */}

            <div className="event-card-header">

                <span
                    className={`category-badge ${getCategoryClass(
                        event.category
                    )}`}
                >
                    {event.category}
                </span>


                <div className="event-card-header-actions">

                    <span
                        className={
                            isExpired
                                ? "event-status expired"
                                : "event-status"
                        }
                    >
                        {statusText}
                    </span>


                    {/* =================================================
                        EDIT — only visible to the event owner
                    ================================================= */}

                    {isOwner && (

                        <button
                            type="button"
                            className="edit-event-button"
                            disabled={
                                !canEdit
                            }
                            title={
                                isExpired
                                    ? "Expired events cannot be edited."
                                    : event.editAllowed === true
                                        ? "Edit event"
                                        : (
                                            event.editLockReason ||
                                            "Editing is disabled during the final hour before the event starts."
                                        )
                            }
                            onClick={() => {

                                if (
                                    canEdit &&
                                    typeof onEdit ===
                                    "function"
                                ) {

                                    onEdit(
                                        event
                                    );

                                }

                            }}
                        >
                            ✎ Edit
                        </button>

                    )}

                </div>

            </div>


            {/* =========================================================
                BODY
            ========================================================= */}

            <div className="event-card-body">

                <h3>
                    {event.title}
                </h3>


                {/* =====================================================
                    EVENT INFO
                ===================================================== */}

                <div className="event-info">

                    {/* DATE */}

                    <div className="event-info-row">

                        <span className="info-icon">
                            ◷
                        </span>

                        <span>

                            {formatDate(
                                event.dateTime
                            )}

                            <br />

                            <small>

                                {formatTime(
                                    event.dateTime
                                )}

                            </small>

                        </span>

                    </div>


                    {/* LOCATION */}

                    {locationText && (

                        <div className="event-info-row">

                            <span className="info-icon">
                                ◉
                            </span>

                            <span>
                                {locationText}
                            </span>

                        </div>

                    )}


                    {/* ORGANIZER */}

                    {event.organizerName && (

                        <div className="event-info-row">

                            <span className="info-icon">
                                ◎
                            </span>

                            <span>

                                Organized by{" "}

                                <strong>
                                    {event.organizerName}
                                </strong>

                            </span>

                        </div>

                    )}

                </div>


                {/* =====================================================
                    DESCRIPTION
                ===================================================== */}

                {event.description && (

                    <p className="event-description">
                        {event.description}
                    </p>

                )}


                {/* =====================================================
                    OFFICIAL EVENT LINK
                ===================================================== */}

                {event.eventLink && (

                    <a
                        href={
                            event.eventLink
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ghost-button event-link-button"
                    >
                        Event Link ↗
                    </a>

                )}

                {(
                    event.qualityScore !== null ||
                    event.trustScore !== null
                ) && (

                        <div className="event-score-summary">

                            {event.qualityScore !== null && (

                                <div className="score-chip quality-score">

                                    <span>
                                        Quality
                                    </span>

                                    <strong>
                                        {event.qualityScore}
                                    </strong>

                                </div>

                            )}


                            {event.trustScore !== null && (

                                <div className="score-chip trust-score">

                                    <span>
                                        Trust
                                    </span>

                                    <strong>
                                        {event.trustScore}
                                    </strong>

                                </div>

                            )}

                        </div>

                    )}


                {/* =====================================================
                    CHANGE MESSAGE
                ===================================================== */}

                {event.lastChange && (

                    <div
                        className="event-change-notice"
                    >

                        <div className="change-icon">
                            ↻
                        </div>


                        <div>

                            <strong>
                                Recently updated
                            </strong>


                            <p>
                                {
                                    event.lastChange.summary
                                }
                            </p>

                        </div>

                    </div>

                )}

            </div>


            {/* =========================================================
                FOOTER
            ========================================================= */}

            <div className="event-card-footer">

                {/* =====================================================
                    RSVP SUMMARY
                ===================================================== */}

                <div className="rsvp-summary">

                    <span className="people-icon">
                        ♡
                    </span>


                    <strong>
                        {event.rsvpCount || 0}
                    </strong>


                    <span>
                        going
                    </span>

                </div>


                {/* =====================================================
                    ACTIONS
                ===================================================== */}

                <div className="event-actions">

                    {/* DETAILS */}

                    <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {

                            if (
                                typeof onDetails ===
                                "function"
                            ) {

                                onDetails(
                                    event
                                );

                            }

                        }}
                    >
                        Details
                    </button>


                    {/* SHARE */}

                    <button
                        type="button"
                        className="ghost-button"
                        onClick={() => {

                            if (
                                typeof onShare ===
                                "function"
                            ) {

                                onShare(
                                    event
                                );

                            }

                        }}
                    >
                        Share
                    </button>


                    {/* RSVP */}

                    <button
                        type="button"
                        className="rsvp-button"
                        disabled={
                            !canRSVP
                        }
                        onClick={() => {

                            if (
                                !canRSVP
                            ) {

                                return;

                            }


                            if (
                                typeof onRSVP ===
                                "function"
                            ) {

                                onRSVP(
                                    event
                                );

                            }

                        }}
                    >

                        {isExpired

                            ? "Event Expired"

                            : alreadyRsvpd

                                ? "Already Going"

                                : "I'm Going"

                        }

                    </button>

                </div>

            </div>

        </article>

    );

}