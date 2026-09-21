const {
    eventsCollection,
    FieldValue
} = require(
    "./services/firestore.js"
);


const {
    calculateQualityAndTrust
} = require(
    "./services/qualityTrust.js"
);


async function main() {

    console.log(
        "Starting Quality/Trust backfill..."
    );


    const snapshot =
        await eventsCollection.get();


    console.log(
        `Found ${snapshot.size} events.`
    );


    for (
        const document
        of snapshot.docs
    ) {

        const event =
            document.data();


        const scores =
            calculateQualityAndTrust(
                event
            );


        await document.ref.update({

            qualityScore:
                scores.qualityScore,

            qualityLabel:
                scores.qualityLabel,

            qualityBreakdown:
                scores.qualityBreakdown,

            trustScore:
                scores.trustScore,

            trustLabel:
                scores.trustLabel,

            trustBreakdown:
                scores.trustBreakdown,

            scoreVersion:
                scores.scoreVersion,

            scoreUpdatedAt:
                FieldValue.serverTimestamp()

        });


        console.log(
            `${document.id}: Quality ${scores.qualityScore}, Trust ${scores.trustScore}`
        );

    }


    console.log(
        "Quality/Trust backfill completed."
    );

}


main()
    .catch(
        (error) => {

            console.error(
                "Quality/Trust backfill failed:",
                error
            );

            process.exit(1);

        }
    );