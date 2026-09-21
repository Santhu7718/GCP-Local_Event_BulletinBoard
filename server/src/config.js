require("dotenv").config();


const config = {

    port:
        Number(
            process.env.PORT ||
            8080
        ),

    projectId:
        process.env.GOOGLE_CLOUD_PROJECT,

    location:
        process.env.GOOGLE_CLOUD_LOCATION ||
        "asia-south1",

    vertexAiLocation:
        process.env.VERTEX_AI_LOCATION ||
        "global",

    vertexAiModel:
        process.env.VERTEX_AI_MODEL ||
        "gemini-2.5-flash",

    nodeEnv:
        process.env.NODE_ENV ||
        "development"

};


if (!config.projectId) {

    console.warn(
        "GOOGLE_CLOUD_PROJECT is not set."
    );

}


module.exports =
    config;