const {
    Firestore,
    FieldValue
} = require("@google-cloud/firestore");


const db =
    new Firestore();


const eventsCollection =
    db.collection("events");


module.exports = {
    db,
    eventsCollection,
    FieldValue
};