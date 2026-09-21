const path =
    require("path");


const express =
    require("express");


const cors =
    require("cors");


const helmet =
    require("helmet");


const {
    port
} =
    require("./config.js");


const healthRouter =
    require("./routes/health.js");


const eventsRouter =
    require("./routes/events.js");


const aiRouter =
    require("./routes/ai.js");

const impactRouter =
    require("./routes/impact.js");

const authenticateOrganizer =
    require("./middleware/authenticateOrganizer");


/*
|--------------------------------------------------------------------------
| Express application
|--------------------------------------------------------------------------
*/

const app =
    express();


/*
|--------------------------------------------------------------------------
| Startup diagnostic
|--------------------------------------------------------------------------
*/

console.log(
    "=============================================="
);

console.log(
    "STARTING LOCAL EVENT BOARD SERVER"
);

console.log(
    "AI ROUTER LOADED:"
);

console.log(
    typeof aiRouter
);

console.log(
    "=============================================="
);


/*
|--------------------------------------------------------------------------
| Security
|--------------------------------------------------------------------------
*/

app.disable(
    "x-powered-by"
);


app.disable(
    "etag"
);


/*
|--------------------------------------------------------------------------
| Helmet
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Helmet
|--------------------------------------------------------------------------
*/

app.use(
    helmet({
        crossOriginOpenerPolicy: {
            policy: "same-origin-allow-popups"
        },

        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],

                scriptSrc: [
                    "'self'",
                    "https://apis.google.com"
                ],

                styleSrc: [
                    "'self'",
                    "'unsafe-inline'"
                ],

                imgSrc: [
                    "'self'",
                    "data:",
                    "https:"
                ],

                connectSrc: [
                    "'self'",
                    "https://identitytoolkit.googleapis.com",
                    "https://securetoken.googleapis.com",
                    "https://www.googleapis.com"
                ],

                frameSrc: [
                    "'self'",
                    "https://accounts.google.com",
                    "https://*.firebaseapp.com",
                    "https://*.firebase.google.com"
                ],

                fontSrc: [
                    "'self'",
                    "https:",
                    "data:"
                ],

                objectSrc: [
                    "'none'"
                ],

                baseUri: [
                    "'self'"
                ],

                formAction: [
                    "'self'",
                    "https://accounts.google.com"
                ],

                frameAncestors: [
                    "'self'"
                ]
            }
        }
    })
);


/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
    cors()
);


/*
|--------------------------------------------------------------------------
| JSON request body
|--------------------------------------------------------------------------
*/

app.use(
    express.json({
        limit: "1mb"
    })
);


/*
|--------------------------------------------------------------------------
| API cache control
|--------------------------------------------------------------------------
*/

app.use(
    "/api",
    (req, res, next) => {

        res.setHeader(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, proxy-revalidate"
        );

        res.setHeader(
            "Pragma",
            "no-cache"
        );

        res.setHeader(
            "Expires",
            "0"
        );

        next();

    }
);


/*
|--------------------------------------------------------------------------
| API ROUTES
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Health
|--------------------------------------------------------------------------
*/

app.use(
    "/api/health",
    healthRouter
);


/*
|--------------------------------------------------------------------------
| Events
|--------------------------------------------------------------------------
*/

app.use(
    "/api/events",
    eventsRouter
);


/*
|--------------------------------------------------------------------------
| Vertex AI
|--------------------------------------------------------------------------
*/

app.use(
    "/api/ai",
    aiRouter
);

app.use(
    "/api/impact",
    impactRouter
);


/*
|--------------------------------------------------------------------------
| Temporary debug route
|--------------------------------------------------------------------------
|
| This can remain during development.
|
|--------------------------------------------------------------------------
*/

app.get(
    "/api/debug-events",
    async (req, res) => {

        try {

            const {
                eventsCollection
            } =
                require(
                    "./services/firestore.js"
                );


            const snapshot =
                await eventsCollection.get();


            const events =
                snapshot.docs.map(
                    (doc) => {

                        const data =
                            doc.data();


                        return {

                            id:
                                doc.id,

                            title:
                                data.title,

                            status:
                                data.status,

                            dateTime:
                                data.dateTime?.toDate
                                    ? data.dateTime
                                        .toDate()
                                        .toISOString()
                                    : data.dateTime

                        };

                    }
                );


            return res.status(
                200
            ).json({

                success: true,

                count:
                    events.length,

                events

            });


        } catch (error) {

            console.error(
                "DEBUG EVENTS FAILED:",
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    error?.message ||
                    "Debug event request failed.",

                code:
                    error?.code

            });

        }

    }
);


/*
|--------------------------------------------------------------------------
| React production build
|--------------------------------------------------------------------------
*/

const clientDist =
    path.join(
        __dirname,
        "../../client/dist"
    );


app.use(
    express.static(
        clientDist
    )
);


/*
|--------------------------------------------------------------------------
| React SPA fallback
|--------------------------------------------------------------------------
*/

app.use(
    (req, res, next) => {

        /*
        --------------------------------------------------------------
        Never return React for API requests
        --------------------------------------------------------------
        */

        if (
            req.path.startsWith(
                "/api"
            )
        ) {

            return next();

        }


        /*
        --------------------------------------------------------------
        React index
        --------------------------------------------------------------
        */

        return res.sendFile(
            path.join(
                clientDist,
                "index.html"
            )
        );

    }
);


/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
    (req, res) => {

        return res.status(
            404
        ).json({

            success: false,

            message:
                "Route not found."

        });

    }
);


/*
|--------------------------------------------------------------------------
| Global error handler
|--------------------------------------------------------------------------
*/

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "GLOBAL SERVER ERROR:"
        );

        console.error(
            error
        );


        return res.status(
            error?.statusCode || 500
        ).json({

            success: false,

            message:
                error?.message ||
                "Internal server error."

        });

    }
);


/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const server = app.listen(
    port,
    "0.0.0.0",
    () => {

        console.log(
            "=============================================="
        );

        console.log(
            `Local Event Board API running on port ${port}`
        );

        console.log(
            `AI endpoint available at: http://localhost:${port}/api/ai/structure-event`
        );

        console.log(
            "=============================================="
        );

    }
);



/*
|--------------------------------------------------------------------------
| Server error handling
|--------------------------------------------------------------------------
*/

server.on(
    "error",
    (error) => {

        console.error(
            "SERVER FAILED TO START:"
        );

        console.error(
            error
        );

    }
);

console.log(
    "Node process is alive:",
    process.pid
);
