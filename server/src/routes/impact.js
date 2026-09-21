const express = require("express");

const router =
    express.Router();


/*
|--------------------------------------------------------------------------
| EVENTARC IMPACT ENGINE
|--------------------------------------------------------------------------
|
| This endpoint receives CloudEvents from Eventarc.
|
|--------------------------------------------------------------------------
*/

router.post(
    "/event",
    async (req, res) => {

        try {

            console.log(
                "=============================================="
            );

            console.log(
                "EVENTARC EVENT RECEIVED"
            );

            console.log(
                "Headers:",
                req.headers
            );

            console.log(
                "Body:",
                JSON.stringify(
                    req.body,
                    null,
                    2
                )
            );

            console.log(
                "=============================================="
            );


            /*
            --------------------------------------------------------------
            | CloudEvent metadata
            --------------------------------------------------------------
            */

            const eventType =
                req.headers[
                "ce-type"
                ] ||
                "unknown";


            const eventId =
                req.headers[
                "ce-id"
                ] ||
                "unknown";


            const subject =
                req.headers[
                "ce-subject"
                ] ||
                "unknown";


            console.log(
                "Event type:",
                eventType
            );

            console.log(
                "Event ID:",
                eventId
            );

            console.log(
                "Subject:",
                subject
            );


            /*
            --------------------------------------------------------------
            | Acknowledge event
            --------------------------------------------------------------
            */

            return res.status(
                200
            ).json({

                success: true,

                message:
                    "Event received successfully.",

                eventType,

                eventId,

                subject

            });

        } catch (error) {

            console.error(
                "EVENTARC IMPACT ENGINE FAILED:",
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    error.message ||
                    "Failed to process Eventarc event."

            });

        }

    }
);


module.exports =
    router;