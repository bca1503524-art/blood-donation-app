// FILE 4: app.js
// The screen logic: which page to show, what happens on each button click.
// It uses auth.js (login) and db.js (database), so this file has no Firebase details.

let currentUser = null;      // { uid, name, email, role } of the logged-in person
let isRegistering = false;   // true while a new account is being created

// ---------- SMALL HELPERS ----------

// Stops users from typing HTML/script into forms (security: prevents XSS).
function esc(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function $(id) { return document.getElementById(id); }

function showMessage(text, type) {
  const box = $("message");
  box.textContent = text;
  box.className = "message " + type;
  setTimeout(() => box.classList.add("hidden"), 5000);
}

// Turns Firebase error codes into simple sentences.
function friendlyError(err) {
  const map = {
    "auth/email-already-in-use": "This email is already registered.",
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong email or password.",
    "auth/user-not-found": "No account found with this email.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "permission-denied": "You are not allowed to do this."
  };
  return map[err.code] || err.message;
}

function table(headers, rows) {
  if (rows.length === 0) return '<p class="empty">Nothing here yet.</p>';
  return '<div class="table-wrap"><table><tr>' +
    headers.map(h => "<th>" + h + "</th>").join("") + "</tr>" +
    rows.map(r => "<tr>" + r.map(c => "<td>" + c + "</td>").join("") + "</tr>").join("") +
    "</table></div>";
}

function card(number, label) {
  return '<div class="card"><div class="num">' + esc(number) + '</div><div class="label">' + label + "</div></div>";
}

// ---------- SHOWING PAGES (Single Page App) ----------
// Every "page" is a <section class="view">. We hide all, then show one.

function showView(id) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  $(id).classList.remove("hidden");
  renderNav();
  window.scrollTo(0, 0);

  if (id === "view-donor") renderDonor();
  if (id === "view-recipient") renderRecipient();
  if (id === "view-search") runSearch();
  if (id === "view-admin") renderAdmin();
}

function renderNav() {
  let links = "";
  if (!currentUser) {
    links = '<a href="#" data-go="view-home">Home</a><a href="#" data-go="view-login">Log in</a><a href="#" data-go="view-register">Register</a>';
  } else if (currentUser.role === "donor") {
    links = '<a href="#" data-go="view-donor">My dashboard</a><a href="#" data-go="view-search">Search donors</a>';
  } else if (currentUser.role === "recipient") {
    links = '<a href="#" data-go="view-recipient">My dashboard</a><a href="#" data-go="view-search">Search donors</a>';
  } else if (currentUser.role === "admin") {
    links = '<a href="#" data-go="view-admin">Admin dashboard</a><a href="#" data-go="view-search">Search donors</a>';
  }
  if (currentUser) {
    links += '<a href="#" id="logout-link">Log out (' + esc(currentUser.name) + ")</a>";
  }
  $("nav-links").innerHTML = links;
}

// One click handler for all navbar links.
$("nav-links").addEventListener("click", function (e) {
  const link = e.target.closest("a");
  if (!link) return;
  e.preventDefault();
  if (link.id === "logout-link") { logoutUser(); return; }
  showView(link.dataset.go);
});

function goToDashboard() {
  if (currentUser.role === "donor") showView("view-donor");
  else if (currentUser.role === "recipient") showView("view-recipient");
  else showView("view-admin");
}

// ---------- LOGIN STATE ----------
// Firebase calls this function automatically whenever someone logs in or out.

auth.onAuthStateChanged(async function (user) {
  if (isRegistering) return;               // registration code will handle it
  if (!user) {
    currentUser = null;
    showView("view-home");
    return;
  }
  const profile = await getProfile(user.uid);
  if (!profile) {
    showMessage("Your profile was removed by the admin.", "error");
    logoutUser();
    return;
  }
  currentUser = profile;
  goToDashboard();
});

// ---------- FORMS: LOGIN, REGISTER, RESET ----------

$("login-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  try {
    await loginUser($("login-email").value.trim(), $("login-password").value);
    this.reset();
  } catch (err) { showMessage(friendlyError(err), "error"); }
});

$("forgot-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  try {
    await resetPassword($("forgot-email").value.trim());
    showMessage("Reset link sent. Check your email (also the spam folder).", "success");
    this.reset();
  } catch (err) { showMessage(friendlyError(err), "error"); }
});

// Donor-only fields are hidden when "Recipient" is chosen.
function toggleDonorFields() {
  $("donor-fields").classList.toggle("hidden", $("reg-role").value !== "donor");
}
$("reg-role").addEventListener("change", toggleDonorFields);
toggleDonorFields();

$("register-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  const role = $("reg-role").value;
  const donorInfo = {
    bloodGroup: $("reg-blood").value,
    city: $("reg-city").value.trim(),
    phone: $("reg-phone").value.trim()
  };
  if (role === "donor" && (!donorInfo.bloodGroup || !donorInfo.city || !donorInfo.phone)) {
    showMessage("Donors must fill blood group, city and phone.", "error");
    return;
  }
  isRegistering = true;
  try {
    await registerUser($("reg-name").value.trim(), $("reg-email").value.trim(),
                       $("reg-password").value, role, donorInfo);
    this.reset();
    toggleDonorFields();
    isRegistering = false;
    currentUser = await getProfile(auth.currentUser.uid);
    showMessage("Account created. Welcome!", "success");
    goToDashboard();
  } catch (err) {
    isRegistering = false;
    showMessage(friendlyError(err), "error");
  }
});

// ---------- DONOR DASHBOARD ----------

async function renderDonor() {
  const donor = await getDonor(currentUser.uid);
  if (!donor) return;
  const elig = checkEligibility(donor.lastDonationDate);

  $("donor-summary").innerHTML =
    card(donor.bloodGroup, "Blood group") +
    card(donor.points, "Loyalty points") +
    card(elig.eligible ? "Eligible" : elig.daysLeft + " days", elig.eligible ? "You can donate now" : "Until you can donate again") +
    card(donor.lastDonationDate || "Never", "Last donation");

  $("d-blood").value = donor.bloodGroup;
  $("d-city").value = donor.city;
  $("d-phone").value = donor.phone;
  $("d-available").checked = donor.available;

  // Donation form is shown only if the donor is eligible.
  $("donation-box").innerHTML = elig.eligible
    ? '<form id="donation-form">' +
      '<label>Date of donation <input type="date" id="don-date" required></label>' +
      '<label>Units <input type="number" id="don-units" min="1" max="3" value="1" required></label>' +
      '<label>Hospital / camp <input type="text" id="don-place" required></label>' +
      '<button type="submit">Submit for verification</button></form>'
    : '<p class="empty">You can donate again after ' + elig.daysLeft + " days.</p>";

  const donations = await getDonationsOfDonor(currentUser.uid);
  $("donation-history").innerHTML = table(["Date", "Units", "Place", "Status"],
    donations.map(d => [esc(d.date), esc(d.units), esc(d.place),
      d.verified ? '<span class="status-fulfilled">Verified</span>' : '<span class="status-pending">Waiting for admin</span>']));
}

$("donor-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  try {
    await updateDonor(currentUser.uid, {
      bloodGroup: $("d-blood").value,
      city: $("d-city").value.trim(),
      phone: $("d-phone").value.trim(),
      available: $("d-available").checked
    });
    showMessage("Details saved.", "success");
    renderDonor();
  } catch (err) { showMessage(friendlyError(err), "error"); }
});

// The donation form is created dynamically, so we listen on its parent box.
$("donation-box").addEventListener("submit", async function (e) {
  e.preventDefault();
  try {
    await addDonation({
      donorId: currentUser.uid,
      donorName: currentUser.name,
      date: $("don-date").value,
      units: Number($("don-units").value),
      place: $("don-place").value.trim(),
      verified: false
    });
    showMessage("Donation sent to the admin for verification.", "success");
    renderDonor();
  } catch (err) { showMessage(friendlyError(err), "error"); }
});

// ---------- RECIPIENT DASHBOARD ----------

async function renderRecipient() {
  const requests = await getRequestsOfUser(currentUser.uid);
  $("my-requests").innerHTML = table(["Date", "Blood", "Units", "City", "Hospital", "Status"],
    requests.map(r => [esc(r.createdAt.slice(0, 10)), esc(r.bloodGroup), esc(r.units),
      esc(r.city), esc(r.hospital), '<span class="status-' + r.status + '">' + esc(r.status) + "</span>"]));
}

$("request-form").addEventListener("submit", async function (e) {
  e.preventDefault();
  try {
    await addRequest({
      requesterId: currentUser.uid,
      requesterName: currentUser.name,
      bloodGroup: $("r-blood").value,
      units: Number($("r-units").value),
      city: $("r-city").value.trim(),
      hospital: $("r-hospital").value.trim(),
      status: "pending",
      createdAt: new Date().toISOString()
    });
    this.reset();
    showMessage("Request sent. The admin will review it.", "success");
    renderRecipient();
  } catch (err) { showMessage(friendlyError(err), "error"); }
});

// ---------- SEARCH DONORS ----------

async function runSearch() {
  if (!currentUser) return;
  const blood = $("s-blood").value;
  const city = $("s-city").value.trim().toLowerCase();
  const donors = await getAllDonors();
  const found = donors.filter(d => d.available &&
    (!blood || d.bloodGroup === blood) &&
    (!city || d.city.toLowerCase().includes(city)));
  $("search-results").innerHTML = table(["Name", "Blood group", "City", "Phone"],
    found.map(d => [esc(d.name), esc(d.bloodGroup), esc(d.city), esc(d.phone)]));
}

$("search-form").addEventListener("submit", function (e) {
  e.preventDefault();
  runSearch();
});

// ---------- ADMIN DASHBOARD ----------

async function renderAdmin() {
  const [donors, users, donations, requests] =
    await Promise.all([getAllDonors(), getAllUsers(), getAllDonations(), getAllRequests()]);

  const pending = donations.filter(d => !d.verified);
  const recipients = users.filter(u => u.role === "recipient");

  $("admin-stats").innerHTML =
    card(donors.length, "Donors") +
    card(recipients.length, "Recipients") +
    card(donations.filter(d => d.verified).length, "Verified donations") +
    card(requests.filter(r => r.status === "pending").length, "Pending requests");

  $("admin-donations").innerHTML = table(["Donor", "Date", "Units", "Place", "Action"],
    pending.map(d => [esc(d.donorName), esc(d.date), esc(d.units), esc(d.place),
      '<button class="small" data-verify="' + d.id + '">Verify</button>']));

  $("admin-requests").innerHTML = table(["Name", "Blood", "Units", "City", "Hospital", "Status", "Action"],
    requests.map(r => {
      let action = "-";
      if (r.status === "pending") {
        action = '<button class="small" data-status="approved" data-id="' + r.id + '">Approve</button> ' +
                 '<button class="small danger" data-status="rejected" data-id="' + r.id + '">Reject</button>';
      } else if (r.status === "approved") {
        action = '<button class="small" data-status="fulfilled" data-id="' + r.id + '">Mark fulfilled</button>';
      }
      return [esc(r.requesterName), esc(r.bloodGroup), esc(r.units), esc(r.city), esc(r.hospital),
        '<span class="status-' + r.status + '">' + esc(r.status) + "</span>", action];
    }));

  $("admin-donors").innerHTML = table(["Name", "Blood", "City", "Phone", "Points", "Action"],
    donors.map(d => [esc(d.name), esc(d.bloodGroup), esc(d.city), esc(d.phone), esc(d.points),
      '<button class="small danger" data-delete="' + d.uid + '">Delete</button>']));

  $("admin-recipients").innerHTML = table(["Name", "Email", "Action"],
    recipients.map(u => [esc(u.name), esc(u.email),
      '<button class="small danger" data-delete="' + u.uid + '">Delete</button>']));

  window.adminDonations = pending;   // remembered so the Verify button can find the full record
}

// One click handler for every button inside the admin dashboard.
$("view-admin").addEventListener("click", async function (e) {
  const btn = e.target.closest("button");
  if (!btn) return;
  try {
    if (btn.dataset.verify) {
      const donation = window.adminDonations.find(d => d.id === btn.dataset.verify);
      await verifyDonation(donation);
      showMessage("Donation verified. +10 points added.", "success");
    } else if (btn.dataset.status) {
      await setRequestStatus(btn.dataset.id, btn.dataset.status);
      showMessage("Request " + btn.dataset.status + ".", "success");
    } else if (btn.dataset.delete) {
      if (!confirm("Delete this record? This cannot be undone.")) return;
      await deleteUserRecords(btn.dataset.delete);
      showMessage("Record deleted.", "success");
    } else return;
    renderAdmin();
  } catch (err) { showMessage(friendlyError(err), "error"); }
});
