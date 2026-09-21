const {
    calculateQualityAndTrust
} = require(
    "./qualityTrust.js"
);

const {
    db,
    eventsCollection,
    FieldValue
} = require("./firestore");


/*
|--------------------------------------------------------------------------
| Serialize Firestore document
|--------------------------------------------------------------------------
*/

function serializeEvent(document) {

    const data = document.data();


    let dateTime = null;

    if (data.dateTime) {

        if (
            typeof data.dateTime.toDate ===
            "function"
        ) {
            dateTime =
                data.dateTime
                    .toDate()
                    .toISOString();

        } else {

            dateTime =
                new Date(
                    data.dateTime
                ).toISOString();

        }

    }


    let createdAt = null;

    if (data.createdAt) {

        if (
            typeof data.createdAt.toDate ===
            "function"
        ) {
            createdAt =
                data.createdAt
                    .toDate()
                    .toISOString();

        } else {

            createdAt =
                new Date(
                    data.createdAt
                ).toISOString();

        }

    }


    let updatedAt = null;

    if (data.updatedAt) {

        if (
            typeof data.updatedAt.toDate ===
            "function"
        ) {
            updatedAt =
                data.updatedAt
                    .toDate()
                    .toISOString();

        } else {

            updatedAt =
                new Date(
                    data.updatedAt
                ).toISOString();

        }

    }


    let aiProcessedAt = null;

    if (data.aiProcessedAt) {

        if (
            typeof data.aiProcessedAt.toDate ===
            "function"
        ) {
            aiProcessedAt =
                data.aiProcessedAt
                    .toDate()
                    .toISOString();

        } else {

            aiProcessedAt =
                new Date(
                    data.aiProcessedAt
                ).toISOString();

        }

    }


    /*
    |--------------------------------------------------------------------------
    | Calculate whether editing is allowed
    |--------------------------------------------------------------------------
    |
    | Editing is allowed only when:
    |
    | event is ACTIVE
    | AND
    | event starts more than 1 hour from now
    |
    |--------------------------------------------------------------------------
    */

    let editAllowed = false;

    if (
        dateTime &&
        data.status === "ACTIVE"
    ) {

        const eventStart =
            new Date(dateTime);

        const now =
            new Date();

        const oneHour =
            60 * 60 * 1000;

        editAllowed =
            eventStart.getTime() -
            now.getTime() >
            oneHour;
    }


    return {

        id: document.id,

        ...data,

        dateTime,

        createdAt,

        updatedAt,

        aiProcessedAt,

        editAllowed,

        editLocked:
            !editAllowed,

        editLockReason:
            !editAllowed
                ? "Editing is disabled during the final hour before the event starts."
                : null

    };

}


/*
|--------------------------------------------------------------------------
| GET ALL EVENTS
|--------------------------------------------------------------------------
*/

async function getAllEvents() {

    const snapshot =
        await eventsCollection.get();


    return snapshot.docs.map(
        (document) =>
            serializeEvent(
                document
            )
    );

}

/*
|--------------------------------------------------------------------------
| GET EXPIRED EVENTS
|--------------------------------------------------------------------------
*/

async function getExpiredEvents() {

    /*
    ----------------------------------------------------------------------
    First mark events whose start time has passed as EXPIRED.
    ----------------------------------------------------------------------
    */

    await expireOldEvents();


    /*
    ----------------------------------------------------------------------
    Read expired events
    ----------------------------------------------------------------------
    */

    const snapshot =
        await eventsCollection
            .where(
                "status",
                "==",
                "EXPIRED"
            )
            .get();


    const events =
        snapshot.docs.map(
            (document) =>
                serializeEvent(
                    document
                )
        );


    /*
    ----------------------------------------------------------------------
    Most recently expired first
    ----------------------------------------------------------------------
    */

    events.sort(
        (a, b) => {

            return (
                new Date(
                    b.dateTime
                ) -

                new Date(
                    a.dateTime
                )
            );

        }
    );


    return events;
}


/*
|--------------------------------------------------------------------------
| GET EVENT BY ID
|--------------------------------------------------------------------------
*/

async function getEventById(
    id
) {

    const document =
        await eventsCollection
            .doc(id)
            .get();


    if (!document.exists) {
        return null;
    }


    return serializeEvent(
        document
    );

}


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
            ? String(
                metadata.aiModel || ""
            ).trim() ||
            "gemini-2.5-flash"
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
                        String(
                            field || ""
                        ).trim()
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
*/

async function createEvent(
    eventData
) {

    const documentReference =
        eventsCollection.doc();


    const now =
        FieldValue.serverTimestamp();


    const aiMetadata =
        normalizeAiMetadata(
            eventData.aiMetadata
        );


    const event = {

        title:
            eventData.title,

        description:
            eventData.description,

        dateTime:
            eventData.dateTime,

        location:
            eventData.location,

        city:
            eventData.city,

        category:
            eventData.category,

        organizerName:
            eventData.organizerName,

        eventLink:
            eventData.eventLink || null,


        /*
        |--------------------------------------------------------------------------
        | Event state
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
        | Future intelligence fields
        |--------------------------------------------------------------------------
        */

        qualityScore:
            null,

        trustScore:
            null,

        duplicateScore:
            null,

        duplicateStatus:
            "NOT_CHECKED",

        aiProcessed:
            eventData.aiProcessed === true,

        aiModel:
            eventData.aiModel || null,

        aiSource:
            eventData.aiSource || "MANUAL",

        aiExtractionStatus:
            eventData.aiExtractionStatus ||
            "NOT_PROCESSED",

        aiMissingFields:
            Array.isArray(
                eventData.aiMissingFields
            )
                ? eventData.aiMissingFields
                : [],

        aiProcessedAt:
            eventData.aiProcessedAt || null,

        aiConfidence:
            null,




        /*
        |--------------------------------------------------------------------------
        | Change tracking
        |--------------------------------------------------------------------------
        */

        lastChange:
            null,

        changeHistory:
            [],


        /*
        |--------------------------------------------------------------------------
        | Timestamps
        |--------------------------------------------------------------------------
        */

        createdAt:
            now,

        updatedAt:
            now

    };


    await documentReference.set(
        event
    );


    const createdDocument =
        await documentReference.get();


    return serializeEvent(
        createdDocument
    );

}


/*
|--------------------------------------------------------------------------
| Build human-readable change information
|--------------------------------------------------------------------------
*/

function buildChangeSummary(
    oldEvent,
    updates
) {

    const changes = [];


    /*
    TITLE
    */

    if (
        updates.title !== undefined &&
        updates.title !== oldEvent.title
    ) {

        changes.push({

            field: "title",

            message:
                `Title changed: ${oldEvent.title} → ${updates.title}`

        });

    }


    /*
    DATE / TIME
    */

    if (
        updates.dateTime !== undefined
    ) {

        const oldDate =
            new Date(
                oldEvent.dateTime
            );

        const newDate =
            new Date(
                updates.dateTime
            );


        if (
            oldDate.getTime() !==
            newDate.getTime()
        ) {

            changes.push({

                field:
                    "dateTime",

                message:
                    `Date/time changed: ${oldDate.toLocaleString(
                        "en-IN"
                    )} → ${newDate.toLocaleString(
                        "en-IN"
                    )}`

            });

        }

    }


    /*
    LOCATION
    */

    if (
        updates.location !== undefined &&
        updates.location !==
        oldEvent.location
    ) {

        changes.push({

            field:
                "location",

            message:
                `Location changed: ${oldEvent.location} → ${updates.location}`

        });

    }


    /*
    CITY
    */

    if (
        updates.city !== undefined &&
        updates.city !==
        oldEvent.city
    ) {

        changes.push({

            field:
                "city",

            message:
                `City changed: ${oldEvent.city} → ${updates.city}`

        });

    }


    /*
    CATEGORY
    */

    if (
        updates.category !== undefined &&
        updates.category !==
        oldEvent.category
    ) {

        changes.push({

            field:
                "category",

            message:
                `Category changed: ${oldEvent.category} → ${updates.category}`

        });

    }


    /*
    ORGANIZER
    */

    if (
        updates.organizerName !== undefined &&
        updates.organizerName !==
        oldEvent.organizerName
    ) {

        changes.push({

            field:
                "organizerName",

            message:
                `Organizer changed: ${oldEvent.organizerName} → ${updates.organizerName}`

        });

    }


    /*
    DESCRIPTION
    */

    if (
        updates.description !== undefined &&
        updates.description !==
        oldEvent.description
    ) {

        changes.push({

            field:
                "description",

            message:
                "Event description was updated."

        });

    }


    return changes;
}


/*
|--------------------------------------------------------------------------
| UPDATE EVENT
|--------------------------------------------------------------------------
|
| IMPORTANT BUSINESS RULE:
|
| Editing is blocked when the event starts
| in 1 hour or less.
|
|--------------------------------------------------------------------------
*/

async function updateEvent(
    id,
    updates
) {

    const documentReference =
        eventsCollection.doc(id);


    /*
    |--------------------------------------------------------------------------
    | Read current event
    |--------------------------------------------------------------------------
    */

    const document =
        await documentReference.get();


    if (!document.exists) {

        const error =
            new Error(
                "Event not found."
            );

        error.statusCode = 404;

        throw error;
    }


    const oldEvent =
        serializeEvent(
            document
        );


    /*
    |--------------------------------------------------------------------------
    | Event must still be active
    |--------------------------------------------------------------------------
    */

    if (
        oldEvent.status !==
        "ACTIVE"
    ) {

        const error =
            new Error(
                "This event is no longer active and cannot be edited."
            );

        error.statusCode = 403;

        throw error;
    }


    /*
    |--------------------------------------------------------------------------
    | ONE-HOUR EDIT RESTRICTION
    |--------------------------------------------------------------------------
    */

    const eventStart =
        new Date(
            oldEvent.dateTime
        );

    const remainingMs =
        eventStart.getTime() -
        Date.now();


    if (
        remainingMs <=
        60 * 60 * 1000
    ) {

        const error =
            new Error(
                "This event can no longer be edited. Editing is disabled during the final hour before the event starts."
            );

        error.statusCode = 403;

        throw error;
    }


    /*
    |--------------------------------------------------------------------------
    | Build change information
    |--------------------------------------------------------------------------
    */

    const changes =
        buildChangeSummary(
            oldEvent,
            updates
        );


    /*
    |--------------------------------------------------------------------------
    | Nothing actually changed
    |--------------------------------------------------------------------------
    */

    if (
        changes.length === 0
    ) {

        return oldEvent;
    }


    /*
    |--------------------------------------------------------------------------
    | Convert changes to a plain Firestore-safe object
    |--------------------------------------------------------------------------
    */

    const changeRecord = {

        summary:
            changes
                .map(
                    (change) =>
                        change.message
                )
                .join(" • "),

        fields:
            changes.map(
                (change) =>
                    change.field
            ),

        changedAt:
            new Date().toISOString()

    };


    /*
    |--------------------------------------------------------------------------
    | Prepare update
    |--------------------------------------------------------------------------
    */

    const updatedEventForScoring = {

        ...oldEvent,

        ...updates

    };

    const qualityTrust =
        calculateQualityAndTrust(
            updatedEventForScoring
        );

    const firestoreUpdates = {

        ...updates,

        qualityScore:
            qualityTrust.qualityScore,

        qualityLabel:
            qualityTrust.qualityLabel,

        qualityBreakdown:
            qualityTrust.qualityBreakdown,

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

        lastChange:
            changeRecord,

        changeHistory:
            FieldValue.arrayUnion(
                changeRecord
            ),

        updatedAt:
            FieldValue.serverTimestamp()

    };


    /*
    |--------------------------------------------------------------------------
    | Firestore update
    |--------------------------------------------------------------------------
    */

    try {

        await documentReference.update(
            firestoreUpdates
        );

    } catch (error) {

        console.error(
            "Firestore update failed:"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        throw error;
    }


    /*
    |--------------------------------------------------------------------------
    | Read updated event
    |--------------------------------------------------------------------------
    */

    const updatedDocument =
        await documentReference.get();


    return serializeEvent(
        updatedDocument
    );
}

/*
|--------------------------------------------------------------------------
| DELETE EVENT
|--------------------------------------------------------------------------
*/

async function deleteEvent(
    id
) {

    const documentReference =
        eventsCollection.doc(id);


    const document =
        await documentReference.get();


    if (!document.exists) {
        return null;
    }


    const deletedEvent =
        serializeEvent(
            document
        );


    await documentReference.delete();


    return deletedEvent;

}


/*
|--------------------------------------------------------------------------
| RSVP
|--------------------------------------------------------------------------
|
| Uses a Firestore transaction so the count
| cannot suffer from simple concurrent-update
| overwrites.
|
|--------------------------------------------------------------------------
*/

async function incrementRsvp(
    id,
    visitorId
) {

    if (
        !visitorId ||
        typeof visitorId !== "string"
    ) {

        const error =
            new Error(
                "visitorId is required."
            );

        error.statusCode =
            400;

        throw error;
    }


    const cleanVisitorId =
        visitorId.trim();


    const eventReference =
        eventsCollection.doc(id);


    const rsvpReference =
        eventReference
            .collection("rsvps")
            .doc(cleanVisitorId);


    let alreadyRegistered =
        false;


    await db.runTransaction(
        async (transaction) => {

            /*
            --------------------------------------------------------
            READS
            --------------------------------------------------------
            */

            const eventDocument =
                await transaction.get(
                    eventReference
                );


            const rsvpDocument =
                await transaction.get(
                    rsvpReference
                );


            /*
            --------------------------------------------------------
            EVENT EXISTS?
            --------------------------------------------------------
            */

            if (
                !eventDocument.exists
            ) {

                const error =
                    new Error(
                        "Event not found."
                    );

                error.statusCode =
                    404;

                throw error;
            }


            const event =
                eventDocument.data();


            /*
            --------------------------------------------------------
            EVENT ACTIVE?
            --------------------------------------------------------
            */

            if (
                event.status !==
                "ACTIVE"
            ) {

                const error =
                    new Error(
                        "This event is no longer active."
                    );

                error.statusCode =
                    410;

                throw error;
            }


            /*
            --------------------------------------------------------
            EVENT DATE
            --------------------------------------------------------
            */

            let eventDate;


            if (
                event.dateTime &&
                typeof event.dateTime.toDate ===
                "function"
            ) {

                eventDate =
                    event.dateTime.toDate();

            } else {

                eventDate =
                    new Date(
                        event.dateTime
                    );

            }


            if (
                !eventDate ||
                Number.isNaN(
                    eventDate.getTime()
                )
            ) {

                const error =
                    new Error(
                        "Event has an invalid date/time."
                    );

                error.statusCode =
                    500;

                throw error;
            }


            if (
                eventDate.getTime() <=
                Date.now()
            ) {

                const error =
                    new Error(
                        "This event has expired."
                    );

                error.statusCode =
                    410;

                throw error;
            }


            /*
            --------------------------------------------------------
            DUPLICATE CHECK
            --------------------------------------------------------
            */

            if (
                rsvpDocument.exists
            ) {

                alreadyRegistered =
                    true;

                return;
            }


            /*
            --------------------------------------------------------
            CREATE UNIQUE RSVP
            --------------------------------------------------------
            */

            transaction.create(
                rsvpReference,
                {

                    visitorId:
                        cleanVisitorId,

                    createdAt:
                        FieldValue.serverTimestamp()

                }
            );


            /*
            --------------------------------------------------------
            INCREMENT COUNT
            --------------------------------------------------------
            */

            transaction.update(
                eventReference,
                {

                    rsvpCount:
                        FieldValue.increment(
                            1
                        ),

                    updatedAt:
                        FieldValue.serverTimestamp()

                }
            );

        }
    );


    /*
    ------------------------------------------------------------
    DUPLICATE
    ------------------------------------------------------------
    */

    if (
        alreadyRegistered
    ) {

        const currentDocument =
            await eventReference.get();


        return {

            event:
                serializeEvent(
                    currentDocument
                ),

            alreadyRegistered:
                true

        };

    }


    /*
    ------------------------------------------------------------
    SUCCESS
    ------------------------------------------------------------
    */

    const updatedDocument =
        await eventReference.get();


    return {

        event:
            serializeEvent(
                updatedDocument
            ),

        alreadyRegistered:
            false

    };
}


/*
|--------------------------------------------------------------------------
| EXPIRE OLD EVENTS
|--------------------------------------------------------------------------
|
| Marks ACTIVE events whose start time has passed as EXPIRED.
|
| This is intentionally NOT called on every GET request.
| Later, Cloud Scheduler / Cloud Run will invoke this function.
|
|--------------------------------------------------------------------------
*/

async function expireOldEvents() {

    const snapshot =
        await eventsCollection
            .where(
                "status",
                "==",
                "ACTIVE"
            )
            .get();


    const now =
        Date.now();


    const expiredEvents = [];


    for (
        const document
        of snapshot.docs
    ) {

        const data =
            document.data();


        /*
        --------------------------------------------------------------
        Convert Firestore Timestamp → Date
        --------------------------------------------------------------
        */

        let eventDate;


        if (
            data.dateTime &&
            typeof data.dateTime.toDate ===
            "function"
        ) {

            eventDate =
                data.dateTime.toDate();

        } else if (
            data.dateTime
        ) {

            eventDate =
                new Date(
                    data.dateTime
                );

        } else {

            continue;
        }


        /*
        --------------------------------------------------------------
        Ignore invalid dates
        --------------------------------------------------------------
        */

        if (
            Number.isNaN(
                eventDate.getTime()
            )
        ) {

            console.warn(
                "Invalid event date while expiring:",
                document.id
            );

            continue;
        }


        /*
        --------------------------------------------------------------
        Mark expired
        --------------------------------------------------------------
        */

        if (
            eventDate.getTime() <=
            now
        ) {

            await document.ref.update({

                status:
                    "EXPIRED",

                updatedAt:
                    FieldValue.serverTimestamp()

            });


            expiredEvents.push(
                document.id
            );
        }
    }


    return expiredEvents;
}

module.exports = {

    getAllEvents,

    getExpiredEvents,

    getEventById,

    createEvent,

    updateEvent,

    deleteEvent,

    incrementRsvp,

    expireOldEvents

};