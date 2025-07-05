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

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.className = "remove";

    removeBtn.addEventListener("click", async () => {
      state[type].splice(index, 1);
      await saveState();
      renderList(type);
    });

    li.appendChild(nameSpan);
    li.appendChild(toggleBtn);
    li.appendChild(removeBtn);
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
    alert(`✅ All done! ${type === "common" ? "Common area" : "Bathroom"} cleaning resets.`);
    state[type] = state[type].map(p => ({
      ...p,
      toggled: false,
      doneDate: null
    }));
    saveState();
  }
}

function showConfirmation(message, onConfirm) {
  modalText.textContent = message;
  modal.classList.remove("hidden");

  const handleConfirm = () => {
    modal.classList.add("hidden");
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
    onConfirm();
  };

  const handleCancel = () => {
    modal.classList.add("hidden");
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
  };

  confirmBtn.addEventListener("click", handleConfirm);
  cancelBtn.addEventListener("click", handleCancel);
}

// Expose addPerson globally for inline onclick
window.addPerson = addPerson;

// Start listening to Firestore updates on page load
listenToData();
