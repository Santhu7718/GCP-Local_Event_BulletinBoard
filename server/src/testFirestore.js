const {
    db
} = require("./services/firestore");


async function testFirestore() {

    try {

        console.log(
            "Testing Firestore..."
        );


        const snapshot =
            await db
                .collection("events")
                .limit(5)
                .get();


        console.log(
            "Firestore connection successful."
        );


        console.log(
            "Documents found:",
            snapshot.size
        );


        snapshot.forEach(
            (document) => {

                console.log(
                    document.id,
                    document.data()
                );

            }
        );


    } catch (error) {

        console.error(
            "Firestore test FAILED"
        );

        console.error(
            "Message:",
            error.message
        );

        console.error(
            "Code:",
            error.code
        );

        console.error(
            error
        );

    }

}


testFirestore();