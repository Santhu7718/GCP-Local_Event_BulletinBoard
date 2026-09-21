const {
    getAllEvents,
    expireOldEvents
} = require("./services/eventStore");


async function test() {

    try {

        console.log("");
        console.log("==============================");
        console.log("TEST 1: getAllEvents()");
        console.log("==============================");


        const events =
            await getAllEvents();


        console.log(
            "SUCCESS"
        );

        console.log(
            "COUNT:",
            events.length
        );


        console.dir(
            events,
            {
                depth: 10
            }
        );


        console.log("");
        console.log("==============================");
        console.log("TEST 2: expireOldEvents()");
        console.log("==============================");


        const expired =
            await expireOldEvents();


        console.log(
            "SUCCESS"
        );

        console.log(
            "EXPIRED:",
            expired
        );


        console.log("");
        console.log("==============================");

    } catch (error) {

        console.log("");
        console.log("==============================");
        console.log("FAILED");
        console.log("==============================");


        console.log(
            "MESSAGE:",
            error.message
        );


        console.log(
            "CODE:",
            error.code
        );


        console.log(
            "DETAILS:",
            error.details
        );


        console.dir(
            error,
            {
                depth: 10
            }
        );


        console.log("==============================");

    }

}


test();