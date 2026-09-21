import {
    auth
} from "../firebase";

/*
|--------------------------------------------------------------------------
| API base URL
|--------------------------------------------------------------------------
|
| Locally: Vite proxy forwards /api → http://localhost:8080 (see vite.config.js)
| Production (Netlify/Vercel): set VITE_API_URL to your deployed backend URL
|   e.g. VITE_API_URL=https://your-backend.railway.app
|
|--------------------------------------------------------------------------
*/

const API_BASE =
    (import.meta.env.VITE_API_URL || "") + "/api";


/*
|--------------------------------------------------------------------------
| Browser identity
|--------------------------------------------------------------------------
|
| One anonymous ID per browser profile.
| This is NOT a physical-device fingerprint.
|--------------------------------------------------------------------------
*/

const VISITOR_ID_KEY =
    "signal_visitor_id";


export function getVisitorId() {

    let visitorId =
        localStorage.getItem(
            VISITOR_ID_KEY
        );


    /*
    ------------------------------------------------------------
    Existing browser ID
    ------------------------------------------------------------
    */

    if (
        visitorId &&
        visitorId.trim()
    ) {

        return visitorId;

    }


    /*
    ------------------------------------------------------------
    Generate a new browser ID
    ------------------------------------------------------------
    */

    visitorId =
        crypto.randomUUID();


    localStorage.setItem(
        VISITOR_ID_KEY,
        visitorId
    );


    return visitorId;
}


/*
|--------------------------------------------------------------------------
| Per-event RSVP state
|--------------------------------------------------------------------------
*/

const RSVP_PREFIX =
    "signal_rsvp_";


export function hasRsvpd(
    eventId
) {

    return (
        localStorage.getItem(
            `${RSVP_PREFIX}${eventId}`
        ) === "true"
    );

}


export function markRsvpd(
    eventId
) {

    localStorage.setItem(
        `${RSVP_PREFIX}${eventId}`,
        "true"
    );

}


/*
|--------------------------------------------------------------------------
| Generic API request
|--------------------------------------------------------------------------
*/

async function request(
    endpoint,
    options = {}
) {

    /*
    |--------------------------------------------------------------------------
    | Get currently signed-in Firebase user
    |--------------------------------------------------------------------------
    */

    const user =
        auth.currentUser;


    /*
    |--------------------------------------------------------------------------
    | Get Firebase ID token
    |--------------------------------------------------------------------------
    */

    let idToken =
        null;


    if (user) {

        idToken =
            await user.getIdToken();

    }


    /*
    |--------------------------------------------------------------------------
    | Separate headers from other request options
    |--------------------------------------------------------------------------
    */

    const {
        headers:
            optionHeaders = {},
        ...requestOptions
    } =
        options;


    /*
    |--------------------------------------------------------------------------
    | Build request headers
    |--------------------------------------------------------------------------
    */

    const headers = {

        "Content-Type":
            "application/json",

        ...optionHeaders

    };


    /*
    |--------------------------------------------------------------------------
    | Attach Firebase authentication token
    |--------------------------------------------------------------------------
    */

    if (idToken) {

        headers.Authorization =
            `Bearer ${idToken}`;

    }


    /*
    |--------------------------------------------------------------------------
    | Send request
    |--------------------------------------------------------------------------
    */

    const response =
        await fetch(
            `${API_BASE}${endpoint}`,
            {

                ...requestOptions,

                headers

            }
        );


    /*
    |--------------------------------------------------------------------------
    | Read response
    |--------------------------------------------------------------------------
    */

    let data =
        null;


    try {

        data =
            await response.json();

    } catch {

        data =
            null;

    }


    /*
    |--------------------------------------------------------------------------
    | Handle HTTP errors
    |--------------------------------------------------------------------------
    */

    if (!response.ok) {

        throw new Error(

            data?.message ||

            `Request failed with status ${response.status}`

        );

    }


    return data;

}


/*
|--------------------------------------------------------------------------
| Get events
|--------------------------------------------------------------------------
*/

export async function getEvents({
    search = "",
    category = "All"
} = {}) {

    const params =
        new URLSearchParams();


    if (
        search.trim()
    ) {

        params.set(
            "search",
            search.trim()
        );

    }


    if (
        category !== "All"
    ) {

        params.set(
            "category",
            category
        );

    }


    const query =
        params.toString();


    return request(
        `/events${query
            ? `?${query}`
            : ""
        }`
    );

}


/*
|--------------------------------------------------------------------------
| Get single event
|--------------------------------------------------------------------------
*/

export async function getEventById(
    eventId
) {

    return request(
        `/events/${eventId}`
    );

}


/*
|--------------------------------------------------------------------------
| Create event
|--------------------------------------------------------------------------
*/

export async function createEvent(
    event
) {

    return request(
        "/events",
        {

            method:
                "POST",

            body:
                JSON.stringify(
                    event
                )

        }
    );

}


/*
|--------------------------------------------------------------------------
| RSVP
|--------------------------------------------------------------------------
|
| One RSVP per browser-context per event.
|
|--------------------------------------------------------------------------
*/

export async function rsvpToEvent(
    eventId
) {

    const visitorId =
        getVisitorId();


    const result =
        await request(
            `/events/${eventId}/rsvp`,
            {

                method:
                    "POST",

                body:
                    JSON.stringify({

                        visitorId

                    })

            }
        );


    /*
    ------------------------------------------------------------
    Mark browser as RSVP'd only after SUCCESS
    ------------------------------------------------------------
    */

    if (
        result.success &&
        result.alreadyRegistered !== true
    ) {

        markRsvpd(
            eventId
        );

    }


    return result;

}


/*
|--------------------------------------------------------------------------
| Update event
|--------------------------------------------------------------------------
*/

export async function updateEvent(
    eventId,
    eventData
) {

    return request(
        `/events/${eventId}`,
        {

            method:
                "PUT",

            body:
                JSON.stringify(
                    eventData
                )

        }
    );

}


/*
|--------------------------------------------------------------------------
| Vertex AI — structure raw event text
|--------------------------------------------------------------------------
|
| POST /api/ai/structure-event
|
|--------------------------------------------------------------------------
*/

export async function structureEventWithAI(
    rawText
) {

    return request(
        "/ai/structure-event",
        {
            method: "POST",
            body: JSON.stringify({
                rawText
            })
        }
    );

}


/*
|--------------------------------------------------------------------------
| Export request if needed elsewhere
|--------------------------------------------------------------------------
*/

export {
    request
};

/*
|--------------------------------------------------------------------------
| Get expired events
|--------------------------------------------------------------------------
*/

export async function getExpiredEvents() {

    return request(
        "/events/expired"
    );

}