const modal = document.getElementById('modal');
const modalText = document.getElementById('modal-text');
const confirmBtn = document.getElementById('confirm-btn');
const cancelBtn = document.getElementById('cancel-btn');

let state = {
  common: JSON.parse(localStorage.getItem('commonState')) || [],
  bathroom: JSON.parse(localStorage.getItem('bathroomState')) || []
};

function saveState() {
  localStorage.setItem('commonState', JSON.stringify(state.common));
  localStorage.setItem('bathroomState', JSON.stringify(state.bathroom));
}

function render() {
  renderList('common');
  renderList('bathroom');
}

function renderList(type) {
  const listEl = document.getElementById(`${type}-list`);
  listEl.innerHTML = '';

  state[type].forEach((person, index) => {
    const li = document.createElement('li');

    const nameSpan = document.createElement('span');
    nameSpan.textContent = person.name;

    if (person.toggled && person.doneDate) {
      const dateStr = new Date(person.doneDate).toLocaleDateString();
      nameSpan.textContent += ` — ✅ Done on ${dateStr}`;
    }

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = person.toggled ? '✅ Done' : 'Mark Done';
    toggleBtn.className = person.toggled ? 'toggled' : 'not-toggled';

    toggleBtn.addEventListener('click', () => {
      if (!person.toggled) {
        showConfirmation(`Confirm that ${person.name} cleaned the ${type === 'common' ? 'common area' : 'bathroom'}?`, () => {
          state[type][index].toggled = true;
          state[type][index].doneDate = new Date().toISOString();
          checkForReset(type);
          saveState();
          render();
        });
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove';
    removeBtn.addEventListener('click', () => {
      state[type].splice(index, 1);
      saveState();
      render();
    });

    li.appendChild(nameSpan);
    li.appendChild(toggleBtn);
    li.appendChild(removeBtn);
    listEl.appendChild(li);
  });
}

function addPerson(type) {
  const input = document.getElementById(`${type}-input`);
  const name = input.value.trim();
  if (!name) return;

  state[type].push({ name, toggled: false, doneDate: null });
  input.value = '';
  saveState();
  render();
}

function checkForReset(type) {
  const allDone = state[type].length > 0 && state[type].every(p => p.toggled);
  if (allDone) {
    alert(`✅ All done! ${type === 'common' ? 'Common area' : 'Bathroom'} cleaning resets.`);
    state[type] = state[type].map(p => ({
      ...p,
      toggled: false,
      doneDate: null
    }));
  }
}

function showConfirmation(message, onConfirm) {
  modalText.textContent = message;
  modal.classList.remove('hidden');

  const handleConfirm = () => {
    modal.classList.add('hidden');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    onConfirm();
  };

  const handleCancel = () => {
    modal.classList.add('hidden');
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
  };

  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
}

render();
