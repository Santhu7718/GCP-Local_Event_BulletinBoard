/*
|--------------------------------------------------------------------------
| QUALITY + TRUST ENGINE
|--------------------------------------------------------------------------
|
| Deterministic event scoring.
|
| IMPORTANT:
| This does NOT claim that an organizer is personally trustworthy.
| It evaluates the quality and reliability of the event information
| available to our platform.
|
|--------------------------------------------------------------------------
*/


const CORE_FIELDS = [
    "title",
    "description",
    "dateTime",
    "location",
    "city",
    "organizerName",
    "category"
];


/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function hasText(
    value
) {

    return (
        typeof value === "string" &&
        value.trim().length > 0
    );

}


function isValidDate(
    value
) {

    if (
        !value
    ) {

        return false;

    }


    const date =
        value instanceof Date
            ? value
            : new Date(value);


    return (
        !Number.isNaN(
            date.getTime()
        )
    );

}


function isFutureDate(
    value
) {

    if (
        !isValidDate(value)
    ) {

        return false;

    }


    return (
        new Date(value).getTime() >
        Date.now()
    );

}


function normalizeStatus(
    value
) {

    const validStatuses = [

        "COMPLETE",

        "PARTIAL",

        "INSUFFICIENT",

        "NOT_PROCESSED"

    ];


    return validStatuses.includes(
        value
    )
        ? value
        : "NOT_PROCESSED";

}


/*
|--------------------------------------------------------------------------
| Quality score
|--------------------------------------------------------------------------
*/

function calculateQuality(
    event
) {

    let score = 0;

    const breakdown = [];

    /*
    ----------------------------------------------------------------------
    Title — 10
    ----------------------------------------------------------------------
    */

    if (
        hasText(event.title)
    ) {

        score += 10;

        breakdown.push({
            field: "title",
            points: 10,
            reason: "Event title is present."
        });

    } else {

        breakdown.push({
            field: "title",
            points: 0,
            reason: "Event title is missing."
        });

    }


    /*
    ----------------------------------------------------------------------
    Description — 15
    ----------------------------------------------------------------------
    */

    const descriptionLength =
        hasText(event.description)
            ? event.description.trim().length
            : 0;


    if (
        descriptionLength >= 100
    ) {

        score += 15;

        breakdown.push({
            field: "description",
            points: 15,
            reason:
                "Detailed event description is available."
        });

    } else if (
        descriptionLength >= 40
    ) {

        score += 10;

        breakdown.push({
            field: "description",
            points: 10,
            reason:
                "Event has a reasonably detailed description."
        });

    } else if (
        descriptionLength >= 10
    ) {

        score += 5;

        breakdown.push({
            field: "description",
            points: 5,
            reason:
                "Description is present but limited."
        });

    } else {

        breakdown.push({
            field: "description",
            points: 0,
            reason:
                "Description is missing or too short."
        });

    }


    /*
    ----------------------------------------------------------------------
    Date/time — 20
    ----------------------------------------------------------------------
    */

    if (
        isFutureDate(
            event.dateTime
        )
    ) {

        score += 20;

        breakdown.push({
            field: "dateTime",
            points: 20,
            reason:
                "Event has a valid future date and time."
        });

    } else {

        breakdown.push({
            field: "dateTime",
            points: 0,
            reason:
                "Event date/time is missing, invalid, or expired."
        });

    }


    /*
    ----------------------------------------------------------------------
    Location — 15
    ----------------------------------------------------------------------
    */

    if (
        hasText(event.location)
    ) {

        score += 15;

        breakdown.push({
            field: "location",
            points: 15,
            reason:
                "Specific event location is available."
        });

    } else {

        breakdown.push({
            field: "location",
            points: 0,
            reason:
                "Event location is missing."
        });

    }


    /*
    ----------------------------------------------------------------------
    City — 10
    ----------------------------------------------------------------------
    */

    if (
        hasText(event.city)
    ) {

        score += 10;

        breakdown.push({
            field: "city",
            points: 10,
            reason:
                "City is explicitly available."
        });

    } else {

        breakdown.push({
            field: "city",
            points: 0,
            reason:
                "City is missing."
        });

    }


    /*
    ----------------------------------------------------------------------
    Organizer — 10
    ----------------------------------------------------------------------
    */

    if (
        hasText(event.organizerName)
    ) {

        score += 10;

        breakdown.push({
            field: "organizerName",
            points: 10,
            reason:
                "Organizer information is available."
        });

    } else {

        breakdown.push({
            field: "organizerName",
            points: 0,
            reason:
                "Organizer information is missing."
        });

    }


    /*
    ----------------------------------------------------------------------
    Official event link — 5
    ----------------------------------------------------------------------
    */

    if (
        hasText(event.eventLink)
    ) {

        score += 5;

        breakdown.push({
            field: "eventLink",
            points: 5,
            reason:
                "Official event link is available."
        });

    } else {

        breakdown.push({
            field: "eventLink",
            points: 0,
            reason:
                "No official event link was provided."
        });

    }


    /*
    ----------------------------------------------------------------------
    Category — 5
    ----------------------------------------------------------------------
    */

    if (
        hasText(event.category)
    ) {

        score += 5;

        breakdown.push({
            field: "category",
            points: 5,
            reason:
                "Event category is assigned."
        });

    } else {

        breakdown.push({
            field: "category",
            points: 0,
            reason:
                "Event category is missing."
        });

    }


    /*
    ----------------------------------------------------------------------
    AI extraction quality — 10
    ----------------------------------------------------------------------
    */

    const extractionStatus =
        normalizeStatus(
            event.aiExtractionStatus
        );


    if (
        event.aiProcessed === true &&
        extractionStatus === "COMPLETE"
    ) {

        score += 10;

        breakdown.push({
            field: "aiExtraction",
            points: 10,
            reason:
                "AI extraction completed all requested fields."
        });

    } else if (
        event.aiProcessed === true &&
        extractionStatus === "PARTIAL"
    ) {

        score += 5;

        breakdown.push({
            field: "aiExtraction",
            points: 5,
            reason:
                "AI extracted the event partially."
        });

    } else if (
        event.aiProcessed === true &&
        extractionStatus === "INSUFFICIENT"
    ) {

        score += 2;

        breakdown.push({
            field: "aiExtraction",
            points: 2,
            reason:
                "AI extraction produced limited information."
        });

    } else {

        /*
        Manual events are not penalized for not using AI.
        */

        score += 10;

        breakdown.push({
            field: "aiExtraction",
            points: 10,
            reason:
                "Manual event entry is complete; AI was not required."
        });

    }


    return {
        score,
        breakdown
    };

}


/*
|--------------------------------------------------------------------------
| Trust score
|--------------------------------------------------------------------------
*/

function calculateTrust(
    event
) {

    let score = 0;

    const breakdown = [];

    /*
    ----------------------------------------------------------------------
    Core information completeness — 25
    ----------------------------------------------------------------------
    */

    const presentFields =
        CORE_FIELDS.filter(
            (field) =>
                hasText(
                    event[field]
                )
        ).length;


    const completenessRatio =
        presentFields /
        CORE_FIELDS.length;


    const completenessPoints =
        Math.round(
            completenessRatio * 25
        );


    score +=
        completenessPoints;


    breakdown.push({

        field:
            "completeness",

        points:
            completenessPoints,

        reason:
            `${presentFields}/${CORE_FIELDS.length} core event fields are present.`

    });


    /*
    ----------------------------------------------------------------------
    Future date/time — 20
    ----------------------------------------------------------------------
    */

    if (
        isFutureDate(
            event.dateTime
        )
    ) {

        score += 20;

        breakdown.push({

            field:
                "dateTime",

            points:
                20,

            reason:
                "Event has a valid future start time."

        });

    } else {

        breakdown.push({

            field:
                "dateTime",

            points:
                0,

            reason:
                "Event time is missing, invalid, or expired."

        });

    }


    /*
    ----------------------------------------------------------------------
    Organizer — 15
    ----------------------------------------------------------------------
    */

    if (
        hasText(
            event.organizerName
        )
    ) {

        score += 15;

        breakdown.push({

            field:
                "organizer",

            points:
                15,

            reason:
                "Organizer is explicitly identified."

        });

    } else {

        breakdown.push({

            field:
                "organizer",

            points:
                0,

            reason:
                "Organizer is not identified."

        });

    }


    /*
    ----------------------------------------------------------------------
    Official link — 15
    ----------------------------------------------------------------------
    */

    if (
        hasText(
            event.eventLink
        )
    ) {

        score += 15;

        breakdown.push({

            field:
                "eventLink",

            points:
                15,

            reason:
                "An official event link is available."

        });

    } else {

        breakdown.push({

            field:
                "eventLink",

            points:
                0,

            reason:
                "No official event link is available."

        });

    }


    /*
    ----------------------------------------------------------------------
    AI extraction quality — 15
    ----------------------------------------------------------------------
    */

    const extractionStatus =
        normalizeStatus(
            event.aiExtractionStatus
        );


    if (
        event.aiProcessed === true &&
        extractionStatus === "COMPLETE"
    ) {

        score += 15;

        breakdown.push({

            field:
                "aiExtraction",

            points:
                15,

            reason:
                "AI extraction completed successfully."

        });

    } else if (
        event.aiProcessed === true &&
        extractionStatus === "PARTIAL"
    ) {

        score += 8;

        breakdown.push({

            field:
                "aiExtraction",

            points:
                8,

            reason:
                "AI extraction completed partially."

        });

    } else if (
        event.aiProcessed === true
    ) {

        score += 3;

        breakdown.push({

            field:
                "aiExtraction",

            points:
                3,

            reason:
                "AI extraction provided limited information."

        });

    } else {

        /*
        Manual events receive neutral/full credit for this
        dimension because absence of AI is not inherently
        untrustworthy.
        */

        score += 15;

        breakdown.push({

            field:
                "aiExtraction",

            points:
                15,

            reason:
                "Manual event information was provided directly."

        });

    }


    /*
    ----------------------------------------------------------------------
    Description quality — 10
    ----------------------------------------------------------------------
    */

    const descriptionLength =
        hasText(
            event.description
        )
            ? event.description.trim().length
            : 0;


    if (
        descriptionLength >= 80
    ) {

        score += 10;

        breakdown.push({

            field:
                "description",

            points:
                10,

            reason:
                "Detailed description supports event reliability."

        });

    } else if (
        descriptionLength >= 30
    ) {

        score += 7;

        breakdown.push({

            field:
                "description",

            points:
                7,

            reason:
                "Description provides useful event context."

        });

    } else if (
        descriptionLength >= 10
    ) {

        score += 4;

        breakdown.push({

            field:
                "description",

            points:
                4,

            reason:
                "Description is short but usable."

        });

    } else {

        breakdown.push({

            field:
                "description",

            points:
                0,

            reason:
                "Description is insufficient."

        });

    }


    return {

        score,

        breakdown

    };

}


/*
|--------------------------------------------------------------------------
| Human-readable labels
|--------------------------------------------------------------------------
*/

function getScoreLabel(
    score
) {

    if (
        score >= 90
    ) {

        return "Excellent";

    }


    if (
        score >= 75
    ) {

        return "Good";

    }


    if (
        score >= 60
    ) {

        return "Fair";

    }


    return "Needs Improvement";

}


/*
|--------------------------------------------------------------------------
| Public API
|--------------------------------------------------------------------------
*/

function calculateQualityAndTrust(
    event
) {

    const quality =
        calculateQuality(
            event
        );


    const trust =
        calculateTrust(
            event
        );


    return {

        qualityScore:
            quality.score,

        qualityLabel:
            getScoreLabel(
                quality.score
            ),

        qualityBreakdown:
            quality.breakdown,

        trustScore:
            trust.score,

        trustLabel:
            getScoreLabel(
                trust.score
            ),

        trustBreakdown:
            trust.breakdown,

        scoreVersion:
            "quality-trust-v1"

    };

}


module.exports = {

    calculateQualityAndTrust,

    calculateQuality,

    calculateTrust

};