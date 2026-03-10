import admin from "firebase-admin";

// Initialize the SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

const uid = "GAQhnVvnSdN9DyfpCARiAPX4PWG2"; // replace with your Firebase Auth UID

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => console.log("Admin claim added!"))
  .catch(err => console.error(err));
