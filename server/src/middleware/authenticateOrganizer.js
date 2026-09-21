const {
    initializeApp,
    getApps,
    getApp
} = require("firebase-admin/app");

const {
    getAuth
} = require("firebase-admin/auth");


/*
|--------------------------------------------------------------------------
| Initialize Firebase Admin SDK
|--------------------------------------------------------------------------
|
| firebase-admin v14+ uses named exports from sub-packages.
| Use getApps() (a function) instead of the old admin.apps property.
|
|--------------------------------------------------------------------------
*/

if (!getApps().length) {

    initializeApp({

        projectId:
            process.env.FIREBASE_PROJECT_ID ||
            process.env.GOOGLE_CLOUD_PROJECT ||
            "gcp-506517"

    });

}


/*
|--------------------------------------------------------------------------
| Authenticate organizer
|--------------------------------------------------------------------------
*/

const authenticateOrganizer =
    async (req, res, next) => {

        const authHeader =
            req.headers.authorization;


        /*
        --------------------------------------------------------------
        Authorization header required
        --------------------------------------------------------------
        */

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized: Sign-in required."

            });

        }


        const idToken =
            authHeader.substring(
                "Bearer ".length
            ).trim();


        if (!idToken) {

            return res.status(401).json({

                success: false,

                message:
                    "Unauthorized: Authentication token is missing."

            });

        }


        try {

            const decodedToken =
                await getAuth()
                    .verifyIdToken(
                        idToken
                    );


            /*
            ----------------------------------------------------------
            Store authenticated Firebase user
            ----------------------------------------------------------
            */

            req.user =
                decodedToken;


            console.log(
                "[AUTH] Organizer authenticated:",
                decodedToken.uid,
                decodedToken.email || "no-email"
            );


            next();

        } catch (error) {

            console.error(
                "[AUTH] Firebase token verification failed:"
            );

            console.error(
                error
            );


            return res.status(403).json({

                success: false,

                message:
                    "Forbidden: Invalid or expired authentication token."

            });

        }

    };


module.exports =
    authenticateOrganizer;