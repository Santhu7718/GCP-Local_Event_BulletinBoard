import {
    useEffect,
    useState
} from "react";


import {
    structureEventWithAI
} from "../services/api";


const EMPTY_FORM = {
    title: "",
    dateTime: "",
    location: "",
    city: "",
    category: "Sports",
    description: "",
    organizerName: "",
    eventLink: ""
};


const categories = [
    "Sports",
    "Music",
    "Food",
    "Yard Sale",
    "Technology",
    "Other"
];


/*
|--------------------------------------------------------------------------
| Get minimum datetime for datetime-local input
|--------------------------------------------------------------------------
*/

function getMinimumDateTime() {

    const now =
        new Date();


    const offset =
        now.getTimezoneOffset();


    const localNow =
        new Date(
            now.getTime() -
            offset * 60 * 1000
        );


    return localNow
        .toISOString()
        .slice(0, 16);
}


function buildLocalDateTime(
    eventDate,
    time
) {

    if (
        !eventDate ||
        !time
    ) {

        return "";

    }


    const dateParts =
        eventDate.split("-");


    const timeParts =
        time.split(":");


    if (
        dateParts.length !== 3 ||
        timeParts.length < 2
    ) {

        return "";

    }


    const year =
        Number(dateParts[0]);

    const month =
        Number(dateParts[1]) - 1;

    const day =
        Number(dateParts[2]);

    const hour =
        Number(timeParts[0]);

    const minute =
        Number(timeParts[1]);


    const result =
        new Date(
            year,
            month,
            day,
            hour,
            minute
        );


    if (
        Number.isNaN(
            result.getTime()
        )
    ) {

        return "";

    }


    const offset =
        result.getTimezoneOffset();


    const local =
        new Date(
            result.getTime() -
            offset * 60 * 1000
        );


    return local
        .toISOString()
        .slice(
            0,
            16
        );
}

/*
|--------------------------------------------------------------------------
| Normalize AI date/time into datetime-local format
|--------------------------------------------------------------------------
|
| datetime-local expects:
|
| YYYY-MM-DDTHH:mm
|
|--------------------------------------------------------------------------
*/

function normalizeForDateTimeInput(
    value
) {

    if (
        !value ||
        typeof value !== "string"
    ) {

        return "";

    }


    const trimmed =
        value.trim();


    if (!trimmed) {

        return "";

    }


    const parsedDate =
        new Date(
            trimmed
        );


    /*
    ----------------------------------------------------------------------
    If JavaScript cannot parse the AI date, do not put invalid data
    into the datetime-local input.
    ----------------------------------------------------------------------
    */

    if (
        Number.isNaN(
            parsedDate.getTime()
        )
    ) {

        return "";

    }


    /*
    ----------------------------------------------------------------------
    Convert to local browser time
    ----------------------------------------------------------------------
    */

    const offset =
        parsedDate.getTimezoneOffset();


    const localDate =
        new Date(
            parsedDate.getTime() -
            offset * 60 * 1000
        );


    return localDate
        .toISOString()
        .slice(0, 16);
}


/*
|--------------------------------------------------------------------------
| Event Form
|--------------------------------------------------------------------------
*/

export default function EventForm({
    onClose,
    onCreate,
    submitting = false
}) {

    const [form, setForm] =
        useState(
            EMPTY_FORM
        );


    const [
        minimumDateTime,
        setMinimumDateTime
    ] =
        useState("");


    /*
    ----------------------------------------------------------------------
    General form error
    ----------------------------------------------------------------------
    */

    const [
        error,
        setError
    ] =
        useState("");


    /*
    ----------------------------------------------------------------------
    AI input
    ----------------------------------------------------------------------
    */

    const [
        aiText,
        setAiText
    ] =
        useState("");


    const [
        aiLoading,
        setAiLoading
    ] =
        useState(false);


    const [
        aiError,
        setAiError
    ] =
        useState("");


    const [
        aiSuccess,
        setAiSuccess
    ] =
        useState("");


    /*
    ----------------------------------------------------------------------
    AI provenance metadata
    ----------------------------------------------------------------------
    */

    const [
        aiMetadata,
        setAiMetadata
    ] =
        useState({

            aiProcessed:
                false,

            aiModel:
                null,

            aiSource:
                "MANUAL",

            aiExtractionStatus:
                "NOT_PROCESSED",

            aiMissingFields:
                []

        });




    /*
    ----------------------------------------------------------------------
    Initialize minimum datetime
    ----------------------------------------------------------------------
    */

    useEffect(() => {

        setMinimumDateTime(
            getMinimumDateTime()
        );

    }, []);


    /*
    ----------------------------------------------------------------------
    Update form field
    ----------------------------------------------------------------------
    */

    function updateField(
        event
    ) {

        const {
            name,
            value
        } =
            event.target;


        setForm(
            (current) => ({

                ...current,

                [name]:
                    value

            })
        );


        /*
        ------------------------------------------------------------------
        If user manually edits a field, remove stale AI messages.
        ------------------------------------------------------------------
        */

        if (
            aiError
        ) {

            setAiError(
                ""
            );

        }

    }


    /*
    ----------------------------------------------------------------------
    Vertex AI structuring
    ----------------------------------------------------------------------
    */

    async function handleAIStructure() {

        setAiError("");

        setAiSuccess("");


        const rawText =
            aiText.trim();


        /*
        ------------------------------------------------------------------
        Validate AI input
        ------------------------------------------------------------------
        */

        if (
            rawText.length < 10
        ) {

            setAiError(
                "Paste at least 10 characters of event or flyer text."
            );

            return;

        }


        try {

            setAiLoading(
                true
            );


            console.log(
                "[AI] Structuring event..."
            );


            const result =
                await structureEventWithAI(
                    rawText
                );


            const structured =
                result?.structuredEvent;

            setAiMetadata({

                aiProcessed: true,

                aiModel:
                    result?.model ||
                    "gemini-2.5-flash",

                aiSource:
                    "TEXT",

                aiExtractionStatus:
                    structured?.extractionStatus ||
                    "PARTIAL",

                aiMissingFields:
                    Array.isArray(
                        structured?.missingFields
                    )
                        ? structured.missingFields
                        : []

            });


            /*
            ----------------------------------------------------------------
            Record AI provenance
            ----------------------------------------------------------------
            */

            setAiMetadata({

                aiProcessed:
                    true,

                aiModel:
                    result?.model ||
                    "gemini-2.5-flash",

                aiSource:
                    "TEXT",

                aiExtractionStatus:
                    structured?.extractionStatus ||
                    "PARTIAL",

                aiMissingFields:
                    Array.isArray(
                        structured?.missingFields
                    )
                        ? structured.missingFields
                        : []

            });


            /*
            ----------------------------------------------------------------
            Safety check
            ----------------------------------------------------------------
            */

            if (
                !structured
            ) {

                throw new Error(
                    "Vertex AI did not return structured event data."
                );

            }


            /*
            ----------------------------------------------------------------
            Convert AI date + time into datetime-local format
            AI now returns eventDate (YYYY-MM-DD) and startTime (HH:mm)
            separately. buildLocalDateTime combines them.
            ----------------------------------------------------------------
            */

            const normalizedStart =
                buildLocalDateTime(
                    structured.eventDate,
                    structured.startTime
                );


            /*
            ----------------------------------------------------------------
            Only replace fields when AI actually returned a value.
            This prevents missing AI fields from erasing user input.
            ----------------------------------------------------------------
            */

            setForm(
                (current) => ({

                    ...current,

                    title:
                        structured.title?.trim()
                            ? structured.title.trim()
                            : current.title,

                    description:
                        structured.description?.trim()
                            ? structured.description.trim()
                            : current.description,

                    dateTime:
                        normalizedStart ||
                        current.dateTime,

                    location:
                        structured.location?.trim()
                            ? structured.location.trim()
                            : current.location,

                    city:
                        structured.city?.trim()
                            ? structured.city.trim()
                            : current.city,

                    category:
                        categories.includes(
                            structured.category
                        )
                            ? structured.category
                            : current.category,

                    organizerName:
                        structured.organizerName?.trim()
                            ? structured.organizerName.trim()
                            : current.organizerName,

                    eventLink:
                        structured.eventLink?.trim()
                            ? structured.eventLink.trim()
                            : current.eventLink

                })
            );


            /*
            ----------------------------------------------------------------
            Tell user what AI did
            ----------------------------------------------------------------
            */

            if (
                structured.extractionStatus ===
                "COMPLETE"
            ) {

                setAiSuccess(
                    "AI successfully structured the event. Please review the fields before publishing."
                );

            } else if (
                structured.extractionStatus ===
                "PARTIAL"
            ) {

                const missingFields =
                    Array.isArray(
                        structured.missingFields
                    )
                        ? structured.missingFields
                        : [];


                if (
                    missingFields.length > 0
                ) {

                    setAiError(
                        `AI structured the event, but these fields need your review: ${missingFields.join(", ")}`
                    );

                } else {

                    setAiError(
                        "AI structured the event, but some information needs your review."
                    );

                }

            } else {

                setAiError(
                    "AI could not extract enough information. Please complete the form manually."
                );

            }


        } catch (error) {

            console.error(
                "[AI] Event structuring failed:",
                error
            );


            setAiError(
                error?.message ||
                "Unable to structure event with AI."
            );


        } finally {

            setAiLoading(
                false
            );

        }

    }


    /*
    ----------------------------------------------------------------------
    Submit event
    ----------------------------------------------------------------------
    */

    async function handleFormSubmit(
        event
    ) {

        event.preventDefault();


        setError("");


        /*
        ------------------------------------------------------------------
        Verify parent callback
        ------------------------------------------------------------------
        */

        if (
            typeof onCreate !==
            "function"
        ) {

            console.error(
                "EventForm: onCreate is not a function.",
                onCreate
            );


            setError(
                "Unable to submit event. Form connection is incorrect."
            );


            return;

        }


        /*
        ------------------------------------------------------------------
        Validate title
        ------------------------------------------------------------------
        */

        if (
            !form.title.trim()
        ) {

            setError(
                "Please enter an event name."
            );

            return;

        }


        /*
        ------------------------------------------------------------------
        Validate date
        ------------------------------------------------------------------
        */

        if (
            !form.dateTime
        ) {

            setError(
                "Please select a date and time."
            );

            return;

        }


        const selectedDate =
            new Date(
                form.dateTime
            );


        if (
            Number.isNaN(
                selectedDate.getTime()
            )
        ) {

            setError(
                "Please select a valid date and time."
            );

            return;

        }


        if (
            selectedDate <=
            new Date()
        ) {

            setError(
                "Please choose a future date and time."
            );

            return;

        }


        /*
        ------------------------------------------------------------------
        Validate location
        ------------------------------------------------------------------
        */

        if (
            !form.location.trim()
        ) {

            setError(
                "Please enter the location."
            );

            return;

        }


        /*
        ------------------------------------------------------------------
        Validate city
        ------------------------------------------------------------------
        */

        if (
            !form.city.trim()
        ) {

            setError(
                "Please enter the city."
            );

            return;

        }


        /*
        ------------------------------------------------------------------
        Validate organizer
        ------------------------------------------------------------------
        */

        if (
            !form.organizerName.trim()
        ) {

            setError(
                "Please enter the organizer name."
            );

            return;

        }


        /*
        ------------------------------------------------------------------
        Validate description
        ------------------------------------------------------------------
        */

        if (
            form.description.trim().length <
            10
        ) {

            setError(
                "Description must contain at least 10 characters."
            );

            return;

        }


        /*
        ------------------------------------------------------------------
        Prepare API data
        ------------------------------------------------------------------
        */

        const eventData = {

            title:
                form.title.trim(),

            dateTime:
                selectedDate.toISOString(),

            location:
                form.location.trim(),

            city:
                form.city.trim(),

            category:
                form.category,

            description:
                form.description.trim(),

            organizerName:
                form.organizerName.trim(),

            eventLink:
                form.eventLink.trim(),

            aiMetadata

        };

        try {

            console.log(
                "Submitting event:",
                eventData
            );


            await onCreate(
                eventData
            );


            /*
            ----------------------------------------------------------------
            Reset after successful creation
            ----------------------------------------------------------------
            */

            setForm(
                EMPTY_FORM
            );


            setAiText(
                ""
            );


            setError(
                ""
            );


            setAiError(
                ""
            );


            setAiSuccess(
                ""
            );


            setAiMetadata({

                aiProcessed:
                    false,

                aiModel:
                    null,

                aiSource:
                    "MANUAL",

                aiExtractionStatus:
                    "NOT_PROCESSED",

                aiMissingFields:
                    []

            });


        } catch (error) {

            console.error(
                "Event creation failed:",
                error
            );


            setError(
                error?.message ||
                "Unable to create the event."
            );

        }

    }


    return (

        <div
            className="modal-backdrop"
            onMouseDown={(event) => {

                if (
                    event.target ===
                    event.currentTarget
                ) {

                    if (
                        !submitting &&
                        !aiLoading
                    ) {

                        onClose();

                    }

                }

            }}
        >

            <div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-event-title"
            >

                {/* ======================================================
                    HEADER
                ======================================================= */}

                <div className="modal-top">

                    <div>

                        <p className="eyebrow">
                            CREATE
                        </p>


                        <h2 id="create-event-title">
                            Post an Event
                        </h2>


                        <p className="modal-subtitle">
                            Share something happening
                            in your local community.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="close-button"
                        onClick={
                            onClose
                        }
                        disabled={
                            submitting ||
                            aiLoading
                        }
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>


                {/* ======================================================
                    GENERAL ERROR
                ======================================================= */}

                {error && (

                    <div className="form-error">
                        {error}
                    </div>

                )}


                {/* ======================================================
                    AI ASSIST PANEL
                ======================================================= */}

                <div
                    className="ai-structuring-panel"
                >

                    <div>

                        <p className="eyebrow">
                            AI ASSIST
                        </p>


                        <h3>
                            Structure event with Vertex AI
                        </h3>


                        <p className="modal-subtitle">
                            Paste flyer text or an
                            unstructured event description.
                            Gemini will extract the event
                            details for you.
                        </p>

                    </div>


                    <textarea
                        className="ai-event-textarea"
                        value={aiText}
                        onChange={(event) =>
                            setAiText(event.target.value)
                        }
                        placeholder="Paste flyer text or an unstructured event description..."
                        maxLength={5000}
                        rows={6}
                        disabled={submitting || aiLoading}
                    />

                    <div
                        className="ai-assist-actions"
                    >

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={
                                handleAIStructure
                            }
                            disabled={
                                submitting ||
                                aiLoading ||
                                aiText.trim().length < 10
                            }
                        >
                            {aiLoading
                                ? "Structuring..."
                                : "✨ Structure with AI"}
                        </button>

                    </div>


                    {aiSuccess && (

                        <div className="ai-success-message">

                            {aiSuccess}

                        </div>

                    )}


                    {aiError && (

                        <div className="form-error">

                            {aiError}

                        </div>

                    )}

                </div>


                {/* ======================================================
                    EVENT FORM
                ======================================================= */}

                <form
                    className="event-form"
                    onSubmit={
                        handleFormSubmit
                    }
                >

                    {/* EVENT NAME */}

                    <label>

                        Event name


                        <input
                            type="text"
                            name="title"
                            value={
                                form.title
                            }
                            onChange={
                                updateField
                            }
                            placeholder="e.g. Community Cricket Tournament"
                            maxLength={120}
                            disabled={
                                submitting ||
                                aiLoading
                            }
                            required
                        />

                    </label>


                    {/* DATE + CATEGORY */}

                    <div
                        className="form-two-column"
                    >

                        <label>

                            Date & time


                            <input
                                type="datetime-local"
                                name="dateTime"
                                value={
                                    form.dateTime
                                }
                                onChange={
                                    updateField
                                }
                                min={
                                    minimumDateTime
                                }
                                disabled={
                                    submitting ||
                                    aiLoading
                                }
                                required
                            />

                        </label>


                        <label>

                            Category


                            <select
                                name="category"
                                value={
                                    form.category
                                }
                                onChange={
                                    updateField
                                }
                                disabled={
                                    submitting ||
                                    aiLoading
                                }
                            >

                                {categories.map(
                                    (category) => (

                                        <option
                                            key={
                                                category
                                            }
                                            value={
                                                category
                                            }
                                        >
                                            {
                                                category
                                            }
                                        </option>

                                    )
                                )}

                            </select>

                        </label>

                    </div>


                    {/* LOCATION + CITY */}

                    <div
                        className="form-two-column"
                    >

                        <label>

                            Neighborhood / location


                            <input
                                type="text"
                                name="location"
                                value={
                                    form.location
                                }
                                onChange={
                                    updateField
                                }
                                placeholder="e.g. Kukatpally"
                                maxLength={160}
                                disabled={
                                    submitting ||
                                    aiLoading
                                }
                                required
                            />

                        </label>


                        <label>

                            City


                            <input
                                type="text"
                                name="city"
                                value={
                                    form.city
                                }
                                onChange={
                                    updateField
                                }
                                placeholder="e.g. Hyderabad"
                                maxLength={100}
                                disabled={
                                    submitting ||
                                    aiLoading
                                }
                                required
                            />

                        </label>

                    </div>


                    {/* ORGANIZER */}

                    <label>

                        Organizer


                        <input
                            type="text"
                            name="organizerName"
                            value={
                                form.organizerName
                            }
                            onChange={
                                updateField
                            }
                            placeholder="e.g. Hyderabad Sports Club"
                            maxLength={120}
                            disabled={
                                submitting ||
                                aiLoading
                            }
                            required
                        />

                    </label>

                    {/* EVENT LINK  */}

                    <label>

                        Event Link
                        <span className="field-hint">
                            Optional official event page
                        </span>

                        <input
                            type="url"
                            name="eventLink"
                            value={
                                form.eventLink
                            }
                            onChange={
                                updateField
                            }
                            placeholder="https://example.com/event"
                            maxLength={1000}
                            disabled={
                                submitting ||
                                aiLoading
                            }
                        />

                    </label>


                    {/* DESCRIPTION */}

                    <label>

                        Description


                        <textarea
                            name="description"
                            value={
                                form.description
                            }
                            onChange={
                                updateField
                            }
                            placeholder="Tell the community what this event is about..."
                            maxLength={1200}
                            rows={5}
                            disabled={
                                submitting ||
                                aiLoading
                            }
                            required
                        />


                        <span className="field-hint">

                            {
                                form.description.length
                            }
                            /1200 characters

                        </span>

                    </label>


                    {/* ACTIONS */}

                    <div
                        className="form-actions"
                    >

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={
                                onClose
                            }
                            disabled={
                                submitting ||
                                aiLoading
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="primary-button"
                            disabled={
                                submitting ||
                                aiLoading
                            }
                        >

                            {submitting
                                ? "Publishing..."
                                : "Publish Event"}

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}