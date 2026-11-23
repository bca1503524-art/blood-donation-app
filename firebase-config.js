// FILE 1: firebase-config.js
// Connects this website to our Firebase project (the "address" of our backend).
// Firebase is loaded from the CDN <script> tags in index.html, so "firebase" is available here.

const firebaseConfig = {
  apiKey: "AIzaSyBzmTkuBHPxKlYKBqMUh2Zg_ajrh0aefIQ",
  authDomain: "blood-donation-app-b3796.firebaseapp.com",
  projectId: "blood-donation-app-b3796",
  storageBucket: "blood-donation-app-b3796.firebasestorage.app",
  messagingSenderId: "1079804425995",
  appId: "1:1079804425995:web:58149dc5be5a4d7872940e"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();        // handles login / signup
const db = firebase.firestore();     // our cloud database
