let activeCellTitle;
let activeCellDesc;
let saveBtn;
let newBtn;
let clearBtn;
let deleteBtn;
let pixelGrid;

let activeCell = {};  // keep track of the cell's data that's currently being shown
let hive;  // updated to getCells() results

let mouseDown = false;
let drawMode = 'draw';

let previousNumColumns;  // keeps track of number of hexColumns rendered


// Show an element
function show(elem) {
  elem.style.display = 'inline';
};

// Hide an element
function hide(elem) {
  elem.style.display = 'none';
};


function getCells() {
  return fetch('/api/cells', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(res => res.json())
  .then(data => {
    hive = data;
    return data;
  });
}

function saveCell(cellData) {
  const dataJSON = JSON.stringify(cellData);

  return fetch('/api/cells', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: dataJSON
  });
  
}

function deleteCell(cellID) {
  return fetch(`/api/cells/${cellID}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function renderActiveCell() {
  hide(saveBtn);
  
  // if note exists
  if (activeCell.id) {
    activeCellTitle.setAttribute('readonly', true);
    activeCellDesc.setAttribute('readonly', true);
    pixelGrid.classList.add('readonly');
    activeCellTitle.value = activeCell.title;
    activeCellDesc.value = activeCell.text;
    show(deleteBtn);
    hide(clearBtn);
    renderPixelGrid(activeCell.mask);
  }
  
  // if new note
  else {
    activeCellTitle.removeAttribute('readonly');
    activeCellDesc.removeAttribute('readonly');
    pixelGrid.classList.remove('readonly');
    activeCellTitle.value = '';
    activeCellDesc.value = '';
    show(clearBtn);
    hide(deleteBtn);
    renderPixelGrid();
  }
};

// save the active cell to db
function handleCellSave() {
  const newCell = {
    title: activeCellTitle.value,
    text: activeCellDesc.value,
    mask: pixelGridToMask()
  };

  saveCell(newCell)
  .then(() => {
    getAndRenderHive(false);
    renderActiveCell();
  });
};

// Delete the active cell from db
function handleCellDelete() {
  const cellID = activeCell.id
  activeCell = {};

  deleteCell(cellID)
  .then(() => {
    getAndRenderHive(false);
    renderActiveCell();
  });
};

// Sets the activeCell and displays it
function handleCellView(e) {
  e.preventDefault();

  const cell = e.currentTarget;
  activeCell = JSON.parse(cell.getAttribute('data-cell'));
  renderActiveCell();
};

// Sets the activeCell to and empty object and allows the user to enter a new cell
function handleNewCellView() {
  activeCell = {};
  renderActiveCell();
};

function handleRenderSaveBtn() {
  if (!activeCellTitle.value.trim() || !activeCellDesc.value.trim() || activeCellTitle.getAttribute('readonly') || activeCellDesc.getAttribute('readonly') || (document.querySelector('.pixel.on') === null)) {
    hide(saveBtn);
  } else {
    show(saveBtn);
  }
};

// convert base-10 mask to binary grid
function maskToGrid(mask) {
  const columns = mask.split(',');
  const grid = columns.map(num => {
    let bit = Number(num).toString(2);  // decimal -> bit
    bit = bit.padStart(8, '0');  // ensure there are 8 bits in each column
    return bit;
  });
  return grid;
}

// render pixel grid, blank or with a given mask
function renderPixelGrid(mask) {
  pixelGrid.textContent = '';  // clear pixel grid
  
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

function clearPixelGrid() {
  renderPixelGrid('0,0,0,0,0,0,0,0'); 
}


// handles drawing on the pixel grid
function handlePixelGridDraw(event) {
  event.stopPropagation();

  if (pixelGrid.matches('.readonly')) return;

  handleRenderSaveBtn();

  const notClickOrDrag = (!mouseDown && event.type !== 'click');
  if (!event.target.matches('.pixel') || notClickOrDrag) return;

  const pixel = event.target;
  if (drawMode === 'draw') pixel.classList.add('on');
  else pixel.classList.remove('on');
}

// returns the bit mask of the pixel grid
function pixelGridToMask() {
  let mask = [];
  var pixelColumns = document.querySelectorAll('.pixel-col');

  [...pixelColumns].forEach(pixelCol => {
    let colBits = "";

    [...pixelCol.children].forEach(pixel => {
      const bit = pixel.classList.contains('on') ? "1" : "0";
      colBits += bit;
    });

    colBits = parseInt(colBits, 2);  // bit -> decimal
    mask.push(colBits);
  });

  return mask.join(',');
}

function getRandomMask() {
  const mask = [];
  for (let i = 0; i < 8; i++) {
    mask.push(Math.floor(Math.random() * 255));
  }
  return mask.join(",");
}

function generateHive(columns, rows, cellsArray=[], fillRandom=false) {
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

  const emptyOrRandomMask = (random=true) => 
    random ? getRandomMask() : "0,0,0,0,0,0,0,0";

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
      hex.setAttribute('data-cell', JSON.stringify(cellsArray[i]));
      hex.setAttribute('data-title', cellsArray[i].title);
      mask = cellsArray[i].mask ?? emptyOrRandomMask(fillRandom);
      hex.addEventListener('click', handleCellView);
    }

    else {
      mask = emptyOrRandomMask(fillRandom);
      hex.setAttribute('data-title', "New Cell");
      hex.addEventListener('click', handleNewCellView)
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

// Gets cells from the db and renders them to the sidebar
function getAndRenderHive(checkColumns=true) {
  getCells()
  .then((cells) => 
    handleHiveResize('.hex-container', cells, checkColumns));
};

function drawOrErase(e) {
  mouseDown = true;

  if (!e.target.matches('.pixel')) return

  if (e.target.classList.contains('on')) drawMode = 'erase';
  else drawMode = 'draw';
}

function handleHiveResize(containerSelector, data, checkColumns=true) {
  const hexContainer = document.querySelector(containerSelector);
  const containerWidth = hexContainer.getBoundingClientRect().width;  // width of hex grid container
  const hexColWidth = 120;
  const numColumns = Math.max(1, Math.floor(containerWidth / hexColWidth));
  const rows = Math.max(Math.ceil((data.length + 1) / numColumns), 8);

  if (checkColumns && numColumns === previousNumColumns) return;

  previousNumColumns = numColumns;
  generateHive(numColumns, rows, data);
}

function handleHiveBgResize(containerSelector, data) {
  const hexContainer = document.querySelector(containerSelector);
  const containerWidth = hexContainer.getBoundingClientRect().width;  // width of hex grid container
  const containerHeight = hexContainer.getBoundingClientRect().height;  // height of hex grid container
  const hexColWidth = 120;
  const numColumns = Math.ceil(containerWidth / hexColWidth) + 2;
  const rows = Math.ceil(containerHeight / hexColWidth) + 2;

  if (numColumns <= previousNumColumns) return;

  previousNumColumns = numColumns;
  generateHive(numColumns, rows, data);
}

function init(pathname) {
  const navbar = document.querySelector('.navbar-brand');
  const logo = document.querySelector('.navbar img');

  // animate logo when user hovers over it
  navbar.addEventListener('mouseenter', () => {
    logo.setAttribute('src', './assets/images/pixelbee-logo-anim.gif');
  });

  navbar.addEventListener('mouseleave', () => {
    logo.setAttribute('src', './assets/images/pixelbee-logo.png');
  });

  if (pathname === '/cells') {
    // select popular elements
    activeCellTitle = document.querySelector('.note-title');
    activeCellDesc = document.querySelector('.note-textarea');
    saveBtn = document.querySelector('.save-note');
    newBtn = document.querySelector('.new-note');
    pixelGrid = document.querySelector('.pixel-grid');
    clearBtn = document.querySelector('.clear-btn');
    deleteBtn = document.querySelector('.delete-btn');

    // add all event listeners
    saveBtn.addEventListener('click', handleCellSave);
    newBtn.addEventListener('click', handleNewCellView);
    activeCellTitle.addEventListener('keyup', handleRenderSaveBtn);
    activeCellDesc.addEventListener('keyup', handleRenderSaveBtn);
    window.addEventListener('mousedown', drawOrErase);
    window.addEventListener('mouseup', () => {mouseDown = false});
    pixelGrid.addEventListener('mousemove', handlePixelGridDraw);
    pixelGrid.addEventListener('click', handlePixelGridDraw);
    clearBtn.addEventListener('click', clearPixelGrid);
    deleteBtn.addEventListener('click', handleCellDelete);
    window.addEventListener('resize', () => handleHiveResize('.hex-container', hive));

    getAndRenderHive();
    renderPixelGrid();
  }

  else {    
    let randMasks = [];
    
    getCells().
    then((cells) => {
      randMasks = Array(112 - cells.length).fill(0).map(() => {
        let obj = new Object();
        obj.mask = getRandomMask();
        return obj;
      });
      handleHiveBgResize('body', cells.concat(randMasks));
    });

    window.addEventListener('resize', () => handleHiveBgResize('body', hive.concat(randMasks)));
  }
}

init(window.location.pathname);