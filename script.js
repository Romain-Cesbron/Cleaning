import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Your Firebase config (replace with your own)
const firebaseConfig = {
  apiKey: "AIzaSyAepJAxAzhXAlvOcfl65B49IVoG1gz4sHY",
  authDomain: "cleaning-2.firebaseapp.com",
  projectId: "cleaning-2",
  storageBucket: "cleaning-2.firebasestorage.app",
  messagingSenderId: "797685229820",
  appId: "1:797685229820:web:7617d45bdb84dcde0b8f79",
  measurementId: "G-KD8DP3KLML"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

const modal = document.getElementById('modal');
const modalText = document.getElementById('modal-text');
const confirmBtn = document.getElementById('confirm-btn');
const cancelBtn = document.getElementById('cancel-btn');

let state = {
  common: [],
  bathroom: []
};

const commonRef = doc(db, "cleaning", "commonArea");
const bathroomRef = doc(db, "cleaning", "bathroom");

function listenToData() {
  onSnapshot(commonRef, (docSnap) => {
    if (docSnap.exists()) {
      state.common = docSnap.data().people || [];
      renderList("common");
    } else {
      state.common = [];
      renderList("common");
    }
  });

  onSnapshot(bathroomRef, (docSnap) => {
    if (docSnap.exists()) {
      state.bathroom = docSnap.data().people || [];
      renderList("bathroom");
    } else {
      state.bathroom = [];
      renderList("bathroom");
    }
  });
}

async function saveState() {
  try {
    await setDoc(commonRef, { people: state.common });
    await setDoc(bathroomRef, { people: state.bathroom });
  } catch (e) {
    console.error("Error saving data:", e);
  }
}

function renderList(type) {
  const listEl = document.getElementById(`${type}-list`);
  listEl.innerHTML = "";

  state[type].forEach((person, index) => {
    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = person.name;

    if (person.toggled && person.doneDate) {
      const dateStr = new Date(person.doneDate).toLocaleDateString();
      nameSpan.textContent += ` — ✅ Done on ${dateStr}`;
    }

    const toggleBtn = document.createElement("button");
    toggleBtn.textContent = person.toggled ? "✅ Done" : "Mark Done";
    toggleBtn.className = person.toggled ? "toggled" : "not-toggled";

    toggleBtn.addEventListener("click", () => {
      if (!person.toggled) {
        showConfirmation(`Confirm that ${person.name} cleaned the ${type === "common" ? "common area" : "bathroom"}?`, async () => {
          state[type][index].toggled = true;
          state[type][index].doneDate = new Date().toISOString();
          checkForReset(type);
          await saveState();
          renderList(type);
        });
      }
    });

    li.appendChild(nameSpan);
    li.appendChild(toggleBtn);
    // Removed the individual remove button
    listEl.appendChild(li);
  });
}

async function addPerson(type) {
  const input = document.getElementById(`${type}-input`);
  const name = input.value.trim();
  if (!name) return;

  state[type].push({ name, toggled: false, doneDate: null });
  input.value = "";
  await saveState();
  renderList(type);
}

function checkForReset(type) {
  const allDone = state[type].length > 0 && state[type].every(p => p.toggled);
  if (allDone) {
    // Using the custom modal for the reset alert now
    showConfirmation(`✅ All done! ${type === "common" ? "Common area" : "Bathroom"} cleaning resets.`, async () => {
        state[type] = state[type].map(p => ({
            ...p,
            toggled: false,
            doneDate: null
        }));
        await saveState();
        renderList(type);
    });
  }
}

function showConfirmation(message, onConfirm) {
  modalText.textContent = message;
  modal.classList.remove("hidden");

  // Temporarily store the original confirm/cancel handlers if any, then remove
  // and re-add to prevent multiple event listeners stacking
  const oldConfirmHandler = confirmBtn._currentHandler;
  const oldCancelHandler = cancelBtn._currentHandler;

  if (oldConfirmHandler) confirmBtn.removeEventListener("click", oldConfirmHandler);
  if (oldCancelHandler) cancelBtn.removeEventListener("click", oldCancelHandler);

  const handleConfirm = () => {
    modal.classList.add("hidden");
    onConfirm();
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
    confirmBtn._currentHandler = null;
    cancelBtn._currentHandler = null;
  };

  const handleCancel = () => {
    modal.classList.add("hidden");
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
    confirmBtn._currentHandler = null;
    cancelBtn._currentHandler = null;
  };

  confirmBtn.addEventListener("click", handleConfirm);
  cancelBtn.addEventListener("click", handleCancel);

  // Store current handlers to allow removal next time
  confirmBtn._currentHandler = handleConfirm;
  cancelBtn._currentHandler = handleCancel;
}


// New function to handle "Delete All" confirmation and action
async function deleteAll(type) {
  state[type] = []; // Clear the array for the given type
  await saveState(); // Save the empty state to Firebase
  renderList(type); // Re-render the list (it will now be empty)
}

function confirmDeleteAll(type) {
  const sectionName = type === 'common' ? 'Common Area' : 'Bathroom';
  showConfirmation(`Are you sure you want to delete ALL entries in the ${sectionName} list? This action cannot be undone.`, () => {
    deleteAll(type);
  });
}


// Expose functions globally for inline onclick
window.addPerson = addPerson;
window.confirmDeleteAll = confirmDeleteAll; // Make the new function globally accessible

// Start listening to Firestore updates on page load
listenToData();