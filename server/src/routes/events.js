const express = require("express");

const {
    FieldValue,
    eventsCollection,
    db
} = require("../services/firestore");

const {
    updateEvent,
    deleteEvent,
    incrementRsvp,
    getExpiredEvents
} = require("../services/eventStore");

const {
    calculateQualityAndTrust
} = require("../services/qualityTrust.js");

const authenticateOrganizer =
    require("../middleware/authenticateOrganizer");

const router = express.Router();


/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const VALID_CATEGORIES = [
    "Sports",
    "Music",
    "Food",
    "Yard Sale",
    "Technology",
    "Other"
];


/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function text(value) {
    return String(value ?? "").trim();
}


function parseDate(value) {

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}


function serializeEvent(doc) {

    const data = doc.data();

    let dateTime = data.dateTime;

    if (
        data.dateTime &&
        typeof data.dateTime.toDate === "function"
    ) {
        dateTime =
            data.dateTime.toDate().toISOString();
    }


    let createdAt = data.createdAt;

    if (
        data.createdAt &&
        typeof data.createdAt.toDate === "function"
    ) {
        createdAt =
            data.createdAt.toDate().toISOString();
    }


    let updatedAt = data.updatedAt;

    if (
        data.updatedAt &&
        typeof data.updatedAt.toDate === "function"
    ) {
        updatedAt =
            data.updatedAt.toDate().toISOString();
    }


    let aiProcessedAt =
        data.aiProcessedAt;

    if (
        data.aiProcessedAt &&
        typeof data.aiProcessedAt.toDate === "function"
    ) {
        aiProcessedAt =
            data.aiProcessedAt.toDate().toISOString();
    }


    /*
    |--------------------------------------------------------------------------
    | EDIT RULE
    |--------------------------------------------------------------------------
    */

    let editAllowed = false;

    if (
        data.status === "ACTIVE" &&
        dateTime
    ) {

        const eventStart =
            new Date(dateTime);

        const remainingMs =
            eventStart.getTime() -
            Date.now();

        editAllowed =
            remainingMs >
            60 * 60 * 1000;
    }


    return {

        id: doc.id,

        ...data,

        dateTime,

        createdAt,

        updatedAt,

        aiProcessedAt,

        editAllowed,

        editLocked:
            !editAllowed,

        editLockReason:
            editAllowed
                ? null
                : "Editing is disabled during the final hour before the event starts."

    };
}


/*
|--------------------------------------------------------------------------
| GET ALL EVENTS
|--------------------------------------------------------------------------
| Public route - authentication NOT required
|--------------------------------------------------------------------------
*/

router.get("/", async (req, res) => {

    console.log(
        "=========================================="
    );

    console.log(
        "GET /api/events HIT"
    );

    try {

        const snapshot =
            await eventsCollection.get();

        console.log(
            "Firestore documents:",
            snapshot.size
        );


        let events =
            snapshot.docs.map(
                serializeEvent
            );


        console.log(
            "Serialized events:",
            events.length
        );


        const now =
            Date.now();


        events =
            events.filter(
                (event) => {

                    if (!event) {
                        return false;
                    }

                    if (
                        event.status !==
                        "ACTIVE"
                    ) {
                        return false;
                    }

                    const eventDate =
                        parseDate(
                            event.dateTime
                        );

                    if (!eventDate) {

                        console.warn(
                            "Invalid event date:",
                            event.id
                        );

                        return false;
                    }

                    return (
                        eventDate.getTime() >
                        now
                    );
                }
            );


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        const search =
            text(
                req.query.search
            ).toLowerCase();


        if (search) {

            events =
                events.filter(
                    (event) => {

                        const title =
                            text(
                                event.title
                            ).toLowerCase();

                        const description =
                            text(
                                event.description
                            ).toLowerCase();

                        const location =
                            text(
                                event.location
                            ).toLowerCase();

                        const city =
                            text(
                                event.city
                            ).toLowerCase();

                        const organizer =
                            text(
                                event.organizerName
                            ).toLowerCase();

                        return (
                            title.includes(search) ||
                            description.includes(search) ||
                            location.includes(search) ||
                            city.includes(search) ||
                            organizer.includes(search)
                        );
                    }
                );
        }


        /*
        |--------------------------------------------------------------------------
        | CATEGORY FILTER
        |--------------------------------------------------------------------------
        */

        const category =
            text(
                req.query.category || "All"
            );


        if (category !== "All") {

            events =
                events.filter(
                    (event) =>
                        event.category ===
                        category
                );
        }


        /*
        |--------------------------------------------------------------------------
        | SORT
        |--------------------------------------------------------------------------
        */

        events.sort(
            (a, b) => {

                const aTime =
                    new Date(
                        a.dateTime
                    ).getTime();

                const bTime =
                    new Date(
                        b.dateTime
                    ).getTime();

                return (
                    aTime -
                    bTime
                );
            }
        );


        return res.status(200).json({

            success: true,

            count:
                events.length,

            events

        });


    } catch (error) {

        console.error(
            "GET /api/events FAILED",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                error?.message ||
                "Failed to fetch events."

        });
    }
});


/*
|--------------------------------------------------------------------------
| GET EXPIRED EVENTS
|--------------------------------------------------------------------------
| Public route
|--------------------------------------------------------------------------
*/

router.get(
    "/expired",
    async (req, res) => {

        try {

            const events =
                await getExpiredEvents();

            return res.status(200).json({

                success: true,

                count:
                    events.length,

                events

            });

        } catch (error) {

            console.error(
                "GET /api/events/expired error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Failed to fetch expired events."

            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| GET ONE EVENT
|--------------------------------------------------------------------------
| Public route
|--------------------------------------------------------------------------
*/

router.get(
    "/:id",
    async (req, res) => {

        try {

            const eventId =
                text(
                    req.params.id
                );


            if (!eventId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Event ID is required."

                });
            }


            const doc =
                await eventsCollection
                    .doc(eventId)
                    .get();


            if (!doc.exists) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Event not found."

                });
            }


            const event =
                serializeEvent(doc);


            if (
                event.status !==
                "ACTIVE"
            ) {

                return res.status(410).json({

                    success: false,

                    message:
                        "This event is no longer active."

                });
            }


            const eventDate =
                parseDate(
                    event.dateTime
                );


            if (!eventDate) {

                return res.status(500).json({

                    success: false,

                    message:
                        "Event has an invalid date/time."

                });
            }


            if (
                eventDate.getTime() <=
                Date.now()
            ) {

                return res.status(410).json({

                    success: false,

                    message:
                        "This event has expired."

                });
            }


            return res.status(200).json({

                success: true,

                event

            });


        } catch (error) {

            console.error(
                "GET /api/events/:id FAILED",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error?.message ||
                    "Failed to fetch event."

            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| AI METADATA
|--------------------------------------------------------------------------
*/

function normalizeAiMetadata(
    aiMetadata
) {

    const metadata =
        aiMetadata &&
            typeof aiMetadata === "object"
            ? aiMetadata
            : {};


    const aiProcessed =
        metadata.aiProcessed === true;


    const aiModel =
        aiProcessed
            ? (
                text(
                    metadata.aiModel
                ) ||
                "gemini-2.5-flash"
            )
            : null;


    const aiSource =
        aiProcessed &&
            (
                metadata.aiSource === "FLYER" ||
                metadata.aiSource === "TEXT"
            )
            ? metadata.aiSource
            : "MANUAL";


    const validStatuses = [
        "COMPLETE",
        "PARTIAL",
        "INSUFFICIENT"
    ];


    const aiExtractionStatus =
        aiProcessed
            ? (
                validStatuses.includes(
                    metadata.aiExtractionStatus
                )
                    ? metadata.aiExtractionStatus
                    : "PARTIAL"
            )
            : "NOT_PROCESSED";


    const aiMissingFields =
        aiProcessed &&
            Array.isArray(
                metadata.aiMissingFields
            )
            ? metadata.aiMissingFields
                .map(
                    (field) =>
                        text(field)
                )
                .filter(Boolean)
            : [];


    return {

        aiProcessed,

        aiModel,

        aiSource,

        aiExtractionStatus,

        aiMissingFields

    };
}


/*
|--------------------------------------------------------------------------
| CREATE EVENT
|--------------------------------------------------------------------------
| PROTECTED
|--------------------------------------------------------------------------
*/

router.post(
    "/",

    authenticateOrganizer,

    async (req, res) => {

        try {

            const body =
                req.body || {};


            const requiredFields = [
                "title",
                "description",
                "dateTime",
                "location",
                "city",
                "category",
                "organizerName"
            ];


            for (
                const field
                of requiredFields
            ) {

                if (
                    !text(
                        body[field]
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            `${field} is required.`

                    });
                }
            }


            /*
            |--------------------------------------------------------------------------
            | CATEGORY VALIDATION
            |--------------------------------------------------------------------------
            */

            if (
                !VALID_CATEGORIES.includes(
                    body.category
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid event category."

                });
            }


            /*
            |--------------------------------------------------------------------------
            | DATE VALIDATION
            |--------------------------------------------------------------------------
            */

            const eventDate =
                parseDate(
                    body.dateTime
                );


            if (!eventDate) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid date/time."

                });
            }


            if (
                eventDate.getTime() <=
                Date.now()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Event date/time must be in the future."

                });
            }


            /*
            |--------------------------------------------------------------------------
            | DESCRIPTION VALIDATION
            |--------------------------------------------------------------------------
            */

            if (
                text(
                    body.description
                ).length < 10
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Description must contain at least 10 characters."

                });
            }


            /*
            |--------------------------------------------------------------------------
            | EVENT LINK
            |--------------------------------------------------------------------------
            */

            let eventLink =
                text(
                    body.eventLink
                );


            if (eventLink) {

                try {

                    const parsedUrl =
                        new URL(
                            eventLink
                        );


                    if (
                        ![
                            "http:",
                            "https:"
                        ].includes(
                            parsedUrl.protocol
                        )
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Event link must use http or https."

                        });
                    }

                } catch {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Event link must be a valid URL."

                    });
                }
            }


            /*
            |--------------------------------------------------------------------------
            | AI METADATA
            |--------------------------------------------------------------------------
            */

            const incomingAI =
                body.aiMetadata || {};


            const aiProcessed =
                incomingAI.aiProcessed === true;


            const allowedStatuses = [
                "COMPLETE",
                "PARTIAL",
                "INSUFFICIENT"
            ];


            const aiExtractionStatus =
                aiProcessed
                    ? (
                        allowedStatuses.includes(
                            incomingAI.aiExtractionStatus
                        )
                            ? incomingAI.aiExtractionStatus
                            : "PARTIAL"
                    )
                    : "NOT_PROCESSED";


            const aiMissingFields =
                aiProcessed &&
                    Array.isArray(
                        incomingAI.aiMissingFields
                    )
                    ? incomingAI.aiMissingFields
                        .map(
                            (field) =>
                                String(field).trim()
                        )
                        .filter(Boolean)
                    : [];


            const aiModel =
                aiProcessed
                    ? text(
                        incomingAI.aiModel
                    ) || null
                    : null;


            const aiSource =
                aiProcessed
                    ? (
                        ["TEXT", "FLYER"].includes(
                            incomingAI.aiSource
                        )
                            ? incomingAI.aiSource
                            : "TEXT"
                    )
                    : "MANUAL";


            const aiMetadata = {

                aiProcessed,

                aiModel,

                aiSource,

                aiExtractionStatus,

                aiMissingFields

            };


            /*
            |--------------------------------------------------------------------------
            | QUALITY + TRUST
            |--------------------------------------------------------------------------
            */

            const qualityTrust =
                calculateQualityAndTrust({

                    title:
                        text(body.title),

                    description:
                        text(body.description),

                    dateTime:
                        eventDate,

                    location:
                        text(body.location),

                    city:
                        text(body.city),

                    category:
                        body.category,

                    organizerName:
                        text(body.organizerName),

                    eventLink:
                        text(body.eventLink),

                    aiProcessed:
                        aiMetadata.aiProcessed,

                    aiExtractionStatus:
                        aiMetadata.aiExtractionStatus

                });


            /*
            |--------------------------------------------------------------------------
            | CREATE FIRESTORE DOCUMENT
            |--------------------------------------------------------------------------
            */

            const docRef =
                eventsCollection.doc();


            await docRef.set({

                title:
                    text(body.title),

                description:
                    text(body.description),

                dateTime:
                    eventDate,

                location:
                    text(body.location),

                city:
                    text(body.city),

                category:
                    body.category,

                organizerName:
                    text(body.organizerName),


                /*
                |--------------------------------------------------------------------------
                | FIREBASE AUTH OWNERSHIP
                |--------------------------------------------------------------------------
                */

                organizerUid:
                    req.user.uid,

                organizerEmail:
                    req.user.email || null,


                /*
                |--------------------------------------------------------------------------
                | EVENT LINK
                |--------------------------------------------------------------------------
                */

                eventLink:
                    eventLink,


                /*
                |--------------------------------------------------------------------------
                | EVENT STATE
                |--------------------------------------------------------------------------
                */

                status:
                    "ACTIVE",


                /*
                |--------------------------------------------------------------------------
                | RSVP
                |--------------------------------------------------------------------------
                */

                rsvpCount:
                    0,


                /*
                |--------------------------------------------------------------------------
                | QUALITY
                |--------------------------------------------------------------------------
                */

                qualityScore:
                    qualityTrust.qualityScore,

                qualityLabel:
                    qualityTrust.qualityLabel,

                qualityBreakdown:
                    qualityTrust.qualityBreakdown,


                /*
                |--------------------------------------------------------------------------
                | TRUST
                |--------------------------------------------------------------------------
                */

                trustScore:
                    qualityTrust.trustScore,

                trustLabel:
                    qualityTrust.trustLabel,

                trustBreakdown:
                    qualityTrust.trustBreakdown,

                scoreVersion:
                    qualityTrust.scoreVersion,

                scoreUpdatedAt:
                    FieldValue.serverTimestamp(),


                /*
                |--------------------------------------------------------------------------
                | DEDUPLICATION
                |--------------------------------------------------------------------------
                */

                duplicateScore:
                    null,

                duplicateStatus:
                    "NOT_CHECKED",


                /*
                |--------------------------------------------------------------------------
                | AI METADATA
                |--------------------------------------------------------------------------
                */

                aiProcessed:
                    aiMetadata.aiProcessed,

                aiModel:
                    aiMetadata.aiModel,

                aiSource:
                    aiMetadata.aiSource,

                aiExtractionStatus:
                    aiMetadata.aiExtractionStatus,

                aiMissingFields:
                    aiMetadata.aiMissingFields,

                aiProcessedAt:
                    aiMetadata.aiProcessed
                        ? FieldValue.serverTimestamp()
                        : null,

                aiConfidence:
                    null,


                /*
                |--------------------------------------------------------------------------
                | CHANGE TRACKING
                |--------------------------------------------------------------------------
                */

                lastChange:
                    null,

                changeHistory:
                    [],


                /*
                |--------------------------------------------------------------------------
                | TIMESTAMPS
                |--------------------------------------------------------------------------
                */

                createdAt:
                    FieldValue.serverTimestamp(),

                updatedAt:
                    FieldValue.serverTimestamp()

            });


            const createdDoc =
                await docRef.get();


            return res.status(201).json({

                success: true,

                message:
                    "Event created successfully.",

                event:
                    serializeEvent(
                        createdDoc
                    )

            });


        } catch (error) {

            console.error(
                "POST /api/events FAILED:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error?.message ||
                    "Failed to create event."

            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| UPDATE EVENT
|--------------------------------------------------------------------------
| PROTECTED
| Only the user who created the event can update it.
|--------------------------------------------------------------------------
*/

router.put(
    "/:id",

    authenticateOrganizer,

    async (req, res) => {

        try {

            const eventId =
                text(
                    req.params.id
                );


            /*
            |--------------------------------------------------------------------------
            | FIND EXISTING EVENT
            |--------------------------------------------------------------------------
            */

            const existingDoc =
                await eventsCollection
                    .doc(eventId)
                    .get();


            if (!existingDoc.exists) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Event not found."

                });
            }


            const existingEvent =
                existingDoc.data();


            /*
            |--------------------------------------------------------------------------
            | OWNERSHIP CHECK
            |--------------------------------------------------------------------------
            */

            if (!existingEvent.organizerUid) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Forbidden: Event ownership is not available for this event."

                });
            }


            if (
                existingEvent.organizerUid !==
                req.user.uid
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Forbidden: You can only edit your own events."

                });
            }


            /*
            |--------------------------------------------------------------------------
            | BUILD UPDATE
            |--------------------------------------------------------------------------
            */

            const updates = {};


            if (
                req.body.title !==
                undefined
            ) {

                updates.title =
                    text(
                        req.body.title
                    );
            }


            if (
                req.body.description !==
                undefined
            ) {

                updates.description =
                    text(
                        req.body.description
                    );
            }


            if (
                req.body.location !==
                undefined
            ) {

                updates.location =
                    text(
                        req.body.location
                    );
            }


            if (
                req.body.city !==
                undefined
            ) {

                updates.city =
                    text(
                        req.body.city
                    );
            }


            if (
                req.body.organizerName !==
                undefined
            ) {

                updates.organizerName =
                    text(
                        req.body.organizerName
                    );
            }


            /*
            |--------------------------------------------------------------------------
            | CATEGORY
            |--------------------------------------------------------------------------
            */

            if (
                req.body.category !==
                undefined
            ) {

                if (
                    !VALID_CATEGORIES.includes(
                        req.body.category
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid event category."

                    });
                }


                updates.category =
                    req.body.category;
            }


            /*
            |--------------------------------------------------------------------------
            | DATE
            |--------------------------------------------------------------------------
            */

            if (
                req.body.dateTime !==
                undefined
            ) {

                const updatedDate =
                    parseDate(
                        req.body.dateTime
                    );


                if (!updatedDate) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid date/time."

                    });
                }


                if (
                    updatedDate.getTime() <=
                    Date.now()
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Updated event date/time must be in the future."

                    });
                }


                updates.dateTime =
                    updatedDate;
            }


            /*
            |--------------------------------------------------------------------------
            | EVENT LINK UPDATE
            |--------------------------------------------------------------------------
            */

            if (
                req.body.eventLink !==
                undefined
            ) {

                const newEventLink =
                    text(
                        req.body.eventLink
                    );


                if (newEventLink) {

                    try {

                        const parsedUrl =
                            new URL(
                                newEventLink
                            );


                        if (
                            ![
                                "http:",
                                "https:"
                            ].includes(
                                parsedUrl.protocol
                            )
                        ) {

                            return res.status(400).json({

                                success: false,

                                message:
                                    "Event link must use http or https."

                            });
                        }

                    } catch {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Event link must be a valid URL."

                        });
                    }
                }


                updates.eventLink =
                    newEventLink;
            }


            /*
            |--------------------------------------------------------------------------
            | NOTHING TO UPDATE
            |--------------------------------------------------------------------------
            */

            if (
                Object.keys(
                    updates
                ).length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "No fields provided for update."

                });
            }


            /*
            |--------------------------------------------------------------------------
            | EXISTING EVENT STORE UPDATE
            |--------------------------------------------------------------------------
            |
            | eventStore keeps:
            | - one-hour edit rule
            | - change history
            | - quality/trust recalculation
            |
            |--------------------------------------------------------------------------
            */

            const updatedEvent =
                await updateEvent(
                    eventId,
                    updates
                );


            return res.status(200).json({

                success: true,

                message:
                    "Event updated successfully.",

                event:
                    updatedEvent

            });


        } catch (error) {

            console.error(
                "PUT /api/events/:id FAILED:",
                error
            );


            return res.status(
                error?.statusCode || 500
            ).json({

                success: false,

                message:
                    error?.message ||
                    "Failed to update event."

            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| DELETE EVENT
|--------------------------------------------------------------------------
| PROTECTED
| Only the user who created the event can delete it.
|--------------------------------------------------------------------------
*/

router.delete(
    "/:id",

    authenticateOrganizer,

    async (req, res) => {

        try {

            const eventId =
                text(
                    req.params.id
                );


            /*
            |--------------------------------------------------------------------------
            | FIND EVENT
            |--------------------------------------------------------------------------
            */

            const existingDoc =
                await eventsCollection
                    .doc(eventId)
                    .get();


            if (!existingDoc.exists) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Event not found."

                });
            }


            const existingEvent =
                existingDoc.data();


            /*
            |--------------------------------------------------------------------------
            | OWNERSHIP CHECK
            |--------------------------------------------------------------------------
            */

            if (!existingEvent.organizerUid) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Forbidden: Event ownership is not available for this event."

                });
            }


            if (
                existingEvent.organizerUid !==
                req.user.uid
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Forbidden: You can only delete your own events."

                });
            }


            /*
            |--------------------------------------------------------------------------
            | DELETE
            |--------------------------------------------------------------------------
            */

            const event =
                await deleteEvent(
                    eventId
                );


            if (!event) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Event not found."

                });
            }


            return res.status(200).json({

                success: true,

                message:
                    "Event deleted successfully.",

                event

            });


        } catch (error) {

            console.error(
                "DELETE /api/events/:id FAILED:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    error?.message ||
                    "Failed to delete event."

            });
        }
    }
);


/*
|--------------------------------------------------------------------------
| RSVP
|--------------------------------------------------------------------------
| Public route
|--------------------------------------------------------------------------
*/

router.post(
    "/:id/rsvp",

    async (req, res) => {

        try {

            const eventId =
                String(
                    req.params.id || ""
                ).trim();


            const visitorId =
                String(
                    req.body?.visitorId || ""
                ).trim();


            if (!visitorId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "visitorId is required."

                });
            }


            const result =
                await incrementRsvp(
                    eventId,
                    visitorId
                );


            if (
                result.alreadyRegistered
            ) {

                return res.status(409).json({

                    success: false,

                    alreadyRegistered:
                        true,

                    message:
                        "You have already RSVP'd to this event.",

                    event:
                        result.event

                });
            }


            return res.status(200).json({

                success: true,

                alreadyRegistered:
                    false,

                message:
                    "RSVP registered successfully.",

                event:
                    result.event

            });


        } catch (error) {

            console.error(
                "RSVP FAILED:",
                error
            );


            return res.status(
                error?.statusCode || 500
            ).json({

                success: false,

                message:
                    error?.message ||
                    "Failed to register RSVP."

            });
        }
    }
);


module.exports = router;