const express = require("express");
const authenticateOrganizer =
    require("../middleware/authenticateOrganizer");
const {
    structureEvent
} = require("../services/ai/vertexAI.js");


const router = express.Router();


/*
|--------------------------------------------------------------------------
| AI ROUTER HEALTH CHECK
|--------------------------------------------------------------------------
|
| GET /api/ai/test
|
| This does NOT call Vertex AI.
| It only verifies that the router is mounted correctly.
|--------------------------------------------------------------------------
*/

router.get(
    "/test",
    (req, res) => {

        return res.status(200).json({

            success: true,

            message:
                "AI router is mounted correctly."

        });

    }
);


/*
|--------------------------------------------------------------------------
| STRUCTURE EVENT
|--------------------------------------------------------------------------
|
| POST /api/ai/structure-event
|
| Request body:
|
| {
|     "rawText": "Community cricket tournament..."
| }
|
|--------------------------------------------------------------------------
*/

router.post(
    "/structure-event",
    authenticateOrganizer,
    async (req, res) => {

        console.log(
            "[AI] POST /api/ai/structure-event"
        );


        try {

            /*
            --------------------------------------------------------------
            Read input
            --------------------------------------------------------------
            */

            const rawText =
                req.body?.rawText;


            /*
            --------------------------------------------------------------
            Validate input
            --------------------------------------------------------------
            */

            if (
                typeof rawText !== "string"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "rawText is required."

                });

            }


            const cleanedText =
                rawText.trim();


            if (
                cleanedText.length < 10
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "rawText must contain at least 10 characters."

                });

            }


            /*
            --------------------------------------------------------------
            Call Vertex AI service
            --------------------------------------------------------------
            */

            const result =
                await structureEvent(
                    cleanedText
                );


            /*
            --------------------------------------------------------------
            Success response
            --------------------------------------------------------------
            */

            return res.status(200).json({

                success: true,

                model:
                    result.model,

                location:
                    result.location,

                structuredEvent:
                    result.structuredEvent

            });

        } catch (error) {

            console.error(
                "=============================================="
            );

            console.error(
                "[AI] structure-event FAILED"
            );

            console.error(
                "Message:",
                error?.message
            );

            console.error(
                "Code:",
                error?.code
            );

            console.error(
                "Status:",
                error?.statusCode
            );

            console.error(
                "Stack:",
                error?.stack
            );

            console.error(
                "=============================================="
            );


            return res.status(
                error?.statusCode || 500
            ).json({

                success: false,

                message:
                    error?.message ||
                    "Failed to structure event."

            });

        }
    }
);


module.exports = router;