const {
    structureEvent
} = require(
    "./services/ai/vertexAI.js"
);


/*
|--------------------------------------------------------------------------
| Test Vertex AI directly
|--------------------------------------------------------------------------
|
| This test does NOT use Express.
|
| Flow:
|
| testVertexAI.js
|      ↓
| vertexAI.js
|      ↓
| Vertex AI
|
|--------------------------------------------------------------------------
*/

async function main() {

    console.log(
        "=============================================="
    );

    console.log(
        "VERTEX AI DIRECT TEST"
    );

    console.log(
        "=============================================="
    );


    /*
    ----------------------------------------------------------------------
    Sample input
    ----------------------------------------------------------------------
    */

    const rawText = `
College Cricket Tournament.

A cricket tournament for college students
will be held this Sunday at Gandhipuram Sports
Ground, Coimbatore.

The event starts at 6 PM.

Organized by KCS Sports Club.

Students from nearby colleges can participate.
`;


    console.log(
        "\nInput:"
    );

    console.log(
        rawText
    );


    try {

        /*
        ------------------------------------------------------------------
        Call Vertex AI
        ------------------------------------------------------------------
        */

        const result =
            await structureEvent(
                rawText
            );


        console.log(
            "\nVertex AI result:"
        );


        console.dir(
            result,
            {
                depth: 20
            }
        );


        console.log(
            "\nVertex AI direct test completed successfully."
        );


    } catch (error) {

        console.error(
            "\n=============================================="
        );

        console.error(
            "VERTEX AI DIRECT TEST FAILED"
        );

        console.error(
            "=============================================="
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


        process.exit(1);
    }

}


main();