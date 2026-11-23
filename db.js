// FILE 3: db.js
// All reading and writing of Firestore data lives here.
// Collections: users, donors, requests, donations

const ELIGIBLE_AFTER_DAYS = 90;   // a donor can donate again after 90 days
const POINTS_PER_DONATION = 10;   // loyalty points for each verified donation

// ---------- DONORS ----------
async function getDonor(uid) {
  const doc = await db.collection("donors").doc(uid).get();
  return doc.exists ? doc.data() : null;
}

function updateDonor(uid, data) {
  return db.collection("donors").doc(uid).update(data);
}

async function getAllDonors() {
  const snap = await db.collection("donors").get();
  return snap.docs.map(d => d.data());
}

// ---------- DONATIONS ----------
function addDonation(donation) {
  return db.collection("donations").add(donation);
}

async function getDonationsOfDonor(uid) {
  const snap = await db.collection("donations").where("donorId", "==", uid).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                  .sort((a, b) => b.date.localeCompare(a.date));
}

async function getAllDonations() {
  const snap = await db.collection("donations").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Admin verifies a donation: mark it verified, add points, save the last donation date.
async function verifyDonation(donation) {
  const batch = db.batch();   // a batch = do both changes together, or none
  batch.update(db.collection("donations").doc(donation.id), { verified: true });
  batch.update(db.collection("donors").doc(donation.donorId), {
    points: firebase.firestore.FieldValue.increment(POINTS_PER_DONATION),
    lastDonationDate: donation.date
  });
  await batch.commit();
}

// ---------- REQUESTS ----------
function addRequest(request) {
  return db.collection("requests").add(request);
}

async function getRequestsOfUser(uid) {
  const snap = await db.collection("requests").where("requesterId", "==", uid).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function getAllRequests() {
  const snap = await db.collection("requests").get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
                  .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function setRequestStatus(requestId, status) {
  return db.collection("requests").doc(requestId).update({ status: status });
}

// ---------- USERS (admin) ----------
async function getAllUsers() {
  const snap = await db.collection("users").get();
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
}

async function deleteUserRecords(uid) {
  await db.collection("donors").doc(uid).delete();
  await db.collection("users").doc(uid).delete();
}

// ---------- ELIGIBILITY ----------
// Returns { eligible: true/false, daysLeft: number }
function checkEligibility(lastDonationDate) {
  if (!lastDonationDate) return { eligible: true, daysLeft: 0 };
  const last = new Date(lastDonationDate);
  const daysPassed = Math.floor((Date.now() - last.getTime()) / 86400000);
  const daysLeft = ELIGIBLE_AFTER_DAYS - daysPassed;
  return { eligible: daysLeft <= 0, daysLeft: Math.max(daysLeft, 0) };
}
