// FILE 2: auth.js
// Everything about login, signup, logout and password reset.
// Firebase Authentication stores the email + password safely (passwords are hashed by Google).

// Create a new account, then save the user's details in Firestore.
async function registerUser(name, email, password, role, donorInfo) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  const uid = cred.user.uid;

  // "users" collection: one document per person, stores their role.
  await db.collection("users").doc(uid).set({
    name: name,
    email: email,
    role: role,                       // "donor" or "recipient" (admin is set manually)
    createdAt: new Date().toISOString()
  });

  // Donors also get a document in the "donors" collection.
  if (role === "donor") {
    await db.collection("donors").doc(uid).set({
      uid: uid,
      name: name,
      bloodGroup: donorInfo.bloodGroup,
      city: donorInfo.city,
      phone: donorInfo.phone,
      lastDonationDate: "",
      available: true,
      points: 0
    });
  }
}

function loginUser(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function logoutUser() {
  return auth.signOut();
}

// Firebase sends the reset link to the user's email.
function resetPassword(email) {
  return auth.sendPasswordResetEmail(email);
}

// Reads the logged-in person's profile (name, role) from the "users" collection.
async function getProfile(uid) {
  const doc = await db.collection("users").doc(uid).get();
  return doc.exists ? { uid: uid, ...doc.data() } : null;
}
