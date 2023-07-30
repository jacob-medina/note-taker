let noteTitle;
let noteText;
let saveNoteBtn;
let newNoteBtn;
let noteList;
let pixelGrid;
let clearBtn;
let deleteBtn;
let navbar = document.querySelector('.navbar-brand');

let mouseDown = false;
let drawMode = 'draw';


if (window.location.pathname === '/cells') {
  noteTitle = document.querySelector('.note-title');
  noteText = document.querySelector('.note-textarea');
  saveNoteBtn = document.querySelector('.save-note');
  newNoteBtn = document.querySelector('.new-note');
  noteList = document.querySelectorAll('.list-container .list-group');
  pixelGrid = document.querySelector('.pixel-grid');
  clearBtn = document.querySelector('.clear-btn');
  deleteBtn = document.querySelector('.delete-btn');
}

// Show an element
const show = (elem) => {
  elem.style.display = 'inline';
};

// Hide an element
const hide = (elem) => {
  elem.style.display = 'none';
};

// activeNote is used to keep track of the note in the textarea
let activeNote = {};

const getNotes = () =>
  fetch('/api/cells', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(data => data.json());

const saveNote = (note) =>
  fetch('/api/cells', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(note),
  });

const deleteNote = (id) =>
  fetch(`/api/cells/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

const deleteActiveNote = () => deleteNote(activeNote.id);
const clearPixelGrid = () => renderPixelGrid('0,0,0,0,0,0,0,0');

const renderActiveNote = () => {
  hide(saveNoteBtn);
  
  // if note exists
  if (activeNote.id) {
    noteTitle.setAttribute('readonly', true);
    noteText.setAttribute('readonly', true);
    pixelGrid.classList.add('readonly');
    noteTitle.value = activeNote.title;
    noteText.value = activeNote.text;
    show(deleteBtn);
    hide(clearBtn);
    renderPixelGrid(activeNote.mask);

  }
  
  // if new note
  else {
    noteTitle.removeAttribute('readonly');
    noteText.removeAttribute('readonly');
    pixelGrid.classList.remove('readonly');
    noteTitle.value = '';
    noteText.value = '';
    show(clearBtn);
    hide(deleteBtn);
    renderPixelGrid();

  }
};

const handleNoteSave = () => {
  const newNote = {
    title: noteTitle.value,
    text: noteText.value,
    mask: getPixelMask()
  };
  saveNote(newNote).then(() => {
    getAndRenderHive();
    //getAndRenderNotes();
    renderActiveNote();
  });
};

// Delete the clicked note
const handleNoteDelete = () => {
  const noteId = activeNote.id
  activeNote = {};

  deleteNote(noteId).then(() => {
    getAndRenderHive();
    //getAndRenderNotes();
    renderActiveNote();
  });
};

// Sets the activeNote and displays it
const handleNoteView = (e) => {
  e.preventDefault();
  // e.stopPropagation();
  // const li = (e.target.matches('.list-group-item')) ? e.target : e.target.parentElement;
  const cell = e.currentTarget;
  activeNote = JSON.parse(cell.getAttribute('data-note'));
  renderActiveNote();
};

// Sets the activeNote to and empty object and allows the user to enter a new note
const handleNewNoteView = (e) => {
  activeNote = {};
  renderActiveNote();
};

const handleRenderSaveBtn = () => {
  if (!noteTitle.value.trim() || !noteText.value.trim() || noteTitle.getAttribute('readonly') || noteText.getAttribute('readonly') || (document.querySelector('.pixel.on') === null)) {
    hide(saveNoteBtn);
  } else {
    show(saveNoteBtn);
  }
};

// Render the list of note titles
const renderNoteList = async (notes) => {
  let jsonNotes = notes; //await notes.json();
  if (window.location.pathname === '/cells') {
    noteList.forEach((el) => (el.innerHTML = ''));
  }

  let noteListItems = [];

  // Returns HTML element with or without a delete button
  const createLi = (text, delBtn = true) => {
    const liEl = document.createElement('li');
    liEl.classList.add('list-group-item');

    const spanEl = document.createElement('span');
    spanEl.classList.add('list-item-title');
    spanEl.innerText = text;
    liEl.addEventListener('click', handleNoteView);

    liEl.append(spanEl);

    if (delBtn) {
      const delBtnEl = document.createElement('i');
      delBtnEl.classList.add(
        'fas',
        'fa-trash-alt',
        'float-right',
        'text-danger',
        'delete-note'
      );
      delBtnEl.addEventListener('click', handleNoteDelete);

      liEl.append(delBtnEl);
    }

    return liEl;
  };

  if (jsonNotes.length === 0) {
    noteListItems.push(createLi('No saved Notes', false));
  }

  jsonNotes.forEach((note) => {
    const li = createLi(note.title);
    li.dataset.note = JSON.stringify(note);

    noteListItems.push(li);
  });

  if (window.location.pathname === '/cells') {
    noteListItems.forEach((note) => noteList[0].append(note));
  }
};

function renderPixelGrid(mask) {
  pixelGrid.textContent = '';
  let grid;
  if (mask) grid = maskToGrid(mask);

  for (let col = 0; col < 8; col++) {
    const pixelCol = document.createElement('div');
    pixelCol.classList.add('pixel-col');
    for (let row = 0; row < 8; row++) {
      const pixel = document.createElement('div');
      pixel.classList.add('pixel');
      if (mask) {
        if (grid[col].charAt(row) == 1) pixel.classList.add('on');
      }
      pixelCol.appendChild(pixel);
    }
    pixelGrid.appendChild(pixelCol);
  }
}

function maskToGrid(mask) {
  return mask.split(',').map(num => Number(num).toString(2).padStart(8, '0'));
}

function handlePixelGrid(event) {
  event.stopPropagation();

  if (pixelGrid.matches('.readonly')) return;
  handleRenderSaveBtn();
  if (!event.target.matches('.pixel') || (!mouseDown && event.type !== 'click')) return;
  const pixel = event.target;
  if (drawMode === 'draw') pixel.classList.add('on');
  else pixel.classList.remove('on');
}

function getPixelMask() {
  let mask = "";
  var pixelCol = document.querySelectorAll('.pixel-col');

  [...pixelCol].forEach(pc => {
    let col = "";
    [...pc.children].forEach(pixel => {
      col += pixel.classList.contains('on') ? "1" : "0";
    });
    col = parseInt(col, 2);  // convert to decimal
    mask += col + ',';
  });

  mask = mask.slice(0, -1);  // remove last comma

  return mask;
}

function getRandomMask() {
  const mask = [];
  for (let i = 0; i < 8; i++) {
    mask.push(Math.floor(Math.random() * 255));
  }
  return mask.join(",");
}

function generateHexGrid(columns, rows, cellsArray=[], fillRandom=false) {
  const drawFromMask = (mask) => {
    const step = 60 / 8;
    const grid = maskToGrid(mask);
    let svg = '';

    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 8; row++) {
        if (grid[col].charAt(row) == 1) {
          svg += `<rect class="svg-pixel" x="${col*step}" y="${row*step}" width="${step}" height="${step}" clip-path="url(#clip-hex)" />\n`;
        }
      }
    }

    return svg;
  }

  const emptyOrRandomMask = (random=true) => random ? getRandomMask() : "0,0,0,0,0,0,0,0";

  let cellsArrayIndex = 0;

  const hexGrid = document.querySelector('.hex-grid');
  hexGrid.textContent = '';  // clear the pervious grid
  const hexColumns = [];

  // create an array of hex columns
  for (let col = 0; col < columns; col++) {
    const hexCol = document.createElement('div');
    hexCol.classList.add('hex-col');
    hexColumns.push(hexCol);
  }
  
  // create each hex, filling cells left-to-right, top-to-bottom
  for (let i = 0; i < rows * columns; i++) {
    const hex = document.createElement('div');
    hex.classList.add('hex');
    
    let mask;
    if (cellsArray[i]) {
      hex.setAttribute('data-note', JSON.stringify(cellsArray[i]));
      hex.setAttribute('data-title', cellsArray[i].title);
      mask = cellsArray[i].mask ?? emptyOrRandomMask(fillRandom);
      hex.addEventListener('click', handleNoteView);
    }

    else {
      mask = emptyOrRandomMask(fillRandom);
      hex.setAttribute('data-title', "New Cell");
      hex.addEventListener('click', handleNewNoteView)
    }

    hex.innerHTML =
`<svg width="60" height="60">
  <defs>
    <clipPath id="clip-hex">
      <polygon points="60,30 45,56 15,56 0,30 15,4 45,4"></polygon>
    </clipPath>
  </defs>

  <polygon class="svg-hex" points="60,30 45,56 15,56 0,30 15,4 45,4"></polygon>

  ${drawFromMask(mask)}
</svg>`;

    hexColumns[i % columns].appendChild(hex);
  }

  hexColumns.forEach(hc => hexGrid.appendChild(hc));
}

// const getAndRenderNotes = () => getNotes().then(renderNoteList);

// Gets cells from the db and renders them to the sidebar
const getAndRenderHive = () => getNotes().then((notes) => generateHexGrid(5, Math.max(Math.ceil((notes.length + 1) / 5), 8), notes));

const drawOrErase = (e) => {
  mouseDown = true;
  if (e.target.matches('.pixel')) {
    if (e.target.classList.contains('on')) drawMode = 'erase';
    else drawMode = 'draw';
  }
}

if (window.location.pathname === '/cells') {
  saveNoteBtn.addEventListener('click', handleNoteSave);
  newNoteBtn.addEventListener('click', handleNewNoteView);
  noteTitle.addEventListener('keyup', handleRenderSaveBtn);
  noteText.addEventListener('keyup', handleRenderSaveBtn);
  window.addEventListener('mousedown', drawOrErase);
  window.addEventListener('mouseup', () => {mouseDown = false});
  pixelGrid.addEventListener('mousemove', handlePixelGrid);
  pixelGrid.addEventListener('click', handlePixelGrid);
  clearBtn.addEventListener('click', clearPixelGrid);
  deleteBtn.addEventListener('click', handleNoteDelete);

  renderPixelGrid();
  getAndRenderHive();
  //getAndRenderNotes();
}

else {
  getNotes().then((notes) => generateHexGrid(14,6, notes, true));
}

// animate logo when user hovers over it
navbar.addEventListener('mouseenter', () => {
  document.querySelector('.navbar img').setAttribute('src', './assets/images/pixelbee-logo-anim.gif');
});

navbar.addEventListener('mouseleave', () => {
  document.querySelector('.navbar img').setAttribute('src', './assets/images/pixelbee-logo.png');
});
