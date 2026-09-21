const {
    GoogleGenAI,
    Type
} = require("@google/genai");


const {
    projectId,
    vertexAiLocation,
    vertexAiModel
} = require("../../config.js");


function validateConfiguration() {

    if (!projectId) {

        const error =
            new Error(
                "GOOGLE_CLOUD_PROJECT is not configured."
            );

        error.statusCode = 500;

        throw error;
    }


    if (!vertexAiLocation) {

        const error =
            new Error(
                "VERTEX_AI_LOCATION is not configured."
            );

        error.statusCode = 500;

        throw error;
    }


    if (!vertexAiModel) {

        const error =
            new Error(
                "VERTEX_AI_MODEL is not configured."
            );

        error.statusCode = 500;

        throw error;
    }

}


function createVertexClient() {

    validateConfiguration();


    return new GoogleGenAI({

        vertexai: true,

        project:
            projectId,

        location:
            vertexAiLocation

    });

}


/*
|--------------------------------------------------------------------------
| Vertex AI extraction schema
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| We intentionally do NOT ask Gemini to generate an ISO dateTime.
| Gemini extracts date/time components.
| Our backend performs deterministic normalization.
|
|--------------------------------------------------------------------------
*/

const EVENT_SCHEMA = {

    type:
        Type.OBJECT,

    properties: {

        title: {
            type:
                Type.STRING
        },


        description: {
            type:
                Type.STRING
        },


        eventDate: {
            type:
                Type.STRING
        },


        startTime: {
            type:
                Type.STRING
        },


        endTime: {
            type:
                Type.STRING
        },


        location: {
            type:
                Type.STRING
        },


        city: {
            type:
                Type.STRING
        },


        eventLink: {
            type:
                Type.STRING
        },


        category: {

            type:
                Type.STRING,

            enum: [
                "Sports",
                "Music",
                "Food",
                "Yard Sale",
                "Technology",
                "Other"
            ]

        },


        organizerName: {
            type:
                Type.STRING
        },


        extractionStatus: {

            type:
                Type.STRING,

            enum: [
                "COMPLETE",
                "PARTIAL",
                "INSUFFICIENT"
            ]

        },


        missingFields: {

            type:
                Type.ARRAY,

            items: {
                type:
                    Type.STRING
            }

        }

    },


    required: [

        "title",

        "description",

        "eventDate",

        "startTime",

        "endTime",

        "location",

        "city",

        "eventLink",

        "category",

        "organizerName",

        "extractionStatus",

        "missingFields"

    ]

};


/*
|--------------------------------------------------------------------------
| Structure event
|--------------------------------------------------------------------------
*/

async function structureEvent(
    rawText
) {

    if (
        typeof rawText !==
        "string"
    ) {

        const error =
            new Error(
                "rawText must be a string."
            );

        error.statusCode =
            400;

        throw error;
    }


    const cleanedText =
        rawText.trim();


    if (
        cleanedText.length <
        10
    ) {

        const error =
            new Error(
                "Event text must contain at least 10 characters."
            );

        error.statusCode =
            400;

        throw error;
    }


    const ai =
        createVertexClient();


    const prompt = `
You are the event information extraction engine
for a local community event platform.

Extract event information from the raw text below.

STRICT RULES:

1. Never invent information.
2. Return ONLY JSON matching the schema.
3. Preserve information explicitly present in the source.
4. If a field is not explicitly available, return an empty string.
5. Do not infer a city from a neighborhood, district,
   venue, landmark, or generic word such as "Downtown".
6. city must be the actual city name.
7. location should contain the venue, neighborhood,
   locality, or specific place mentioned in the source.
8. If both venue and neighborhood are present, combine them
   in location using a readable format.
9. eventDate must contain ONLY the calendar date.
10. eventDate must use this format:
    YYYY-MM-DD
11. startTime must contain ONLY the event start time.
12. endTime must contain ONLY the event end time.
13. startTime and endTime must use 24-hour format:
    HH:mm
14. If a time range is present such as:
    "9:30 AM to 6:00 PM"
    then:
    startTime = "09:30"
    endTime = "18:00"
15. If only a start time is provided, endTime must be empty.
16. If the date is written as:
    "14 October 2026"
    then eventDate must be:
    "2026-10-14"
17. eventLink must contain the official event URL
    if one is explicitly present in the text.
18. Never invent or repair a URL.
19. category must be exactly one of:
    Sports, Music, Food, Yard Sale, Technology, Other.
20. extractionStatus must be:
    COMPLETE when essential information is available,
    PARTIAL when some information is missing,
    INSUFFICIENT when there is not enough useful information.
21. missingFields must contain the fields that are missing.
22. Do not treat "Downtown", "Central", "Main Road", etc.
    as a city unless the source explicitly identifies it
    as a city.

RAW EVENT TEXT:

${cleanedText}
`;


    const response =
        await ai.models.generateContent({

            model:
                vertexAiModel,

            contents:
                prompt,

            config: {

                temperature:
                    0,

                responseMimeType:
                    "application/json",

                responseSchema:
                    EVENT_SCHEMA

            }

        });


    const responseText =
        response?.text;


    if (
        !responseText
    ) {

        const error =
            new Error(
                "Vertex AI returned an empty response."
            );

        error.statusCode =
            502;

        throw error;
    }


    let structuredEvent;


    try {

        structuredEvent =
            JSON.parse(
                responseText
            );

    } catch (error) {

        console.error(
            "Vertex AI returned invalid JSON:"
        );

        console.error(
            responseText
        );


        const parseError =
            new Error(
                "Vertex AI returned invalid JSON."
            );

        parseError.statusCode =
            502;

        throw parseError;
    }


    return {

        model:
            vertexAiModel,

        location:
            vertexAiLocation,

        structuredEvent

    };

}


module.exports = {
    structureEvent
};