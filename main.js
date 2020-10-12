window.addEventListener('load', main);

// private constants
const STATE_HIDDEN = "hidden";
const STATE_SHOWN = "shown";
const STATE_MARKED = "marked";

// returns random integer in range [min, max]
function rndInt(min, max) {
    [min,max] = [Math.ceil(min), Math.floor(max)]
    return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * creates enough cards for largest board (9x9)
 * registers callbacks for cards
 * 
 * @param {state} s 
 */
function prepare_dom(s) {
  const grid = document.querySelector(".grid");
  const nCards = 20 * 20 ; // max grid size
  for( let i = 0 ; i < nCards ; i ++) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-cardInd", i);
    card.innerHTML = "";
    card.addEventListener("click", () => {
      card_click_cb( s, card, i);
    });
    card.addEventListener('contextmenu', function(ev) {
        mark(s, i);
        render(s);
        ev.preventDefault();
        return false;
    }, false);
    grid.appendChild(card);
  }
}

/**
 * updates DOM to reflect current state
 * - hides unnecessary cards by setting their display: none
 * - adds "flipped" class to cards that were flipped
 * 
 * @param {object} s 
 */
function render(s) {
  const grid = document.querySelector(".grid");
  grid.style.gridTemplateColumns = `repeat(${s.ncols}, 1fr)`;
  for( let i = 0 ; i < grid.children.length ; i ++) {
    const card = grid.children[i];
    const ind = Number(card.getAttribute("data-cardInd"));
    if( ind >= s.nrows * s.ncols) {
      card.style.display = "none";
    }
    else {
      card.style.display = "block";
      const col = ind % s.ncols;
      const row = Math.floor(ind / s.ncols);
      if(s.arr[row][col].state == STATE_SHOWN){
        card.classList.add("flipped");
        let text = s.arr[row][col].mine ? "M" : s.arr[row][col].count == 0 ? " " : s.arr[row][col].count;
        card.innerHTML = "<div class='celltext'>"+text+"</div>";
      }
      else{
        card.classList.remove("flipped");
      }
      if(s.arr[row][col].state == STATE_MARKED){
        card.classList.add("marked");
      }
      else{
        card.classList.remove("marked");
      }
    }
  }
  document.querySelectorAll(".minesCount").forEach(
    (e)=> {
      e.textContent = String(s.nmines - s.nmarked);
  });
}

/**
 * callback for clicking a card
 * - toggle surrounding elements
 * - check for winning condition
 * @param {state} s 
 * @param {HTMLElement} card_div 
 * @param {number} ind 
 */
function card_click_cb(s, card_div, ind) {
  const col = ind % s.ncols;
  const row = Math.floor(ind / s.ncols);
  card_div.classList.add("flipped");
  uncover(s, row, col);
  render(s);
  // check if we won and activate overlay if we did
  if(s.nuncovered == (s.ncols*s.nrows-s.nmines)) {
    document.querySelector("#overlaywin").classList.toggle("active");
  }
  if(s.exploded) {
    document.querySelector("#overlayloss").classList.toggle("active");
  }
}

/**
 * callback for the top button
 * - set the state to the requested size
 * - generate a solvable state
 * - render the state
 * 
 * @param {state} s 
 * @param {number} cols 
 * @param {number} rows 
 */
function button_cb(s, cols, rows) {
  initBoard(s, cols, rows, Math.floor(Math.round(rows-10)/8*30+10));
  clearCards(s);
  render(s);
}
function clearCards(s) {
    const grid = document.querySelector(".grid");
    grid.style.gridTemplateColumns = `repeat(${s.ncols}, 1fr)`;
    for( let i = 0 ; i < grid.children.length ; i ++) {
      const card = grid.children[i];
      card.classList.remove("flipped");
      card.innerHTML = "";
    }
}
function array2d( nrows, ncols, val) {
    const res = [];
    for( let row = 0 ; row < nrows ; row ++) {
      res[row] = [];
      for( let col = 0 ; col < ncols ; col ++)
        res[row][col] = val(row,col);
    }
    return res;
}

function validCoord(s, row, col) {
    return row >= 0 && row < s.nrows && col >= 0 && col < s.ncols;
}

function count(s, row, col) {
    const c = (s, r,c) =>
          (validCoord(s,r,c) && s.arr[r][c].mine ? 1 : 0);
    let res = 0;
    for( let dr = -1 ; dr <= 1 ; dr ++ )
      for( let dc = -1 ; dc <= 1 ; dc ++ )
        res += c(s,row+dr,col+dc);
    return res;
}

function sprinkleMines(s, row, col) {
    // prepare a list of allowed coordinates for mine placement
  let allowed = [];
  for(let r = 0 ; r < s.nrows ; r ++ ) {
    for( let c = 0 ; c < s.ncols ; c ++ ) {
      if(Math.abs(row-r) > 2 || Math.abs(col-c) > 2)
        allowed.push([r,c]);
    }
  }
  
  s.nmines = Math.min(s.nmines, allowed.length);
  for( let i = 0 ; i < s.nmines ; i ++ ) {
    let j = rndInt(i, allowed.length-1);
    [allowed[i], allowed[j]] = [allowed[j], allowed[i]];
    let [r,c] = allowed[i];
    s.arr[r][c].mine = true;
  }

  // erase any marks (in case user placed them) and update counts
  for(let r = 0 ; r < s.nrows ; r ++ ) {
    for( let c = 0 ; c < s.ncols ; c ++ ) {
      if(s.arr[r][c].state == STATE_MARKED)
        s.arr[r][c].state = STATE_HIDDEN;
      s.arr[r][c].count = count(s,r,c);
    }
  }
  let mines = []; let counts = [];
  for(let row = 0 ; row < s.nrows ; row ++ ) {
    let str = "";
    for( let col = 0 ; col < s.ncols ; col ++ ) {
      str += s.arr[row][col].mine ? "B" : ".";
    }
    str += "  |  ";
    for( let col = 0 ; col < s.ncols ; col ++ ) {
      str += s.arr[row][col].count.toString();
    }
    mines[row] = str;
  }
  console.log("Mines and counts after sprinkling:");
  console.log(mines);
}

// puts a flag on a cell
// this is the 'right-click' or 'long-tap' functionality
function uncover(s, row, col) {
    console.log("uncover", row, col);
    // if coordinates invalid, refuse this request
    if( !validCoord(s,row,col)) return false;
    // if this is the very first move, populate the mines, but make
    // sure the current cell does not get a mine
    if( s.nuncovered === 0)
        sprinkleMines(s, row, col);
    // if cell is not hidden, ignore this move
    if( s.arr[row][col].state !== STATE_HIDDEN) return false;
    // floodfill all 0-count cells
    const ff = (r,c) => {
        if( ! validCoord(s,r,c)) return;
        if( s.arr[r][c].state !== STATE_HIDDEN) return;
        s.arr[r][c].state = STATE_SHOWN;
        s.nuncovered ++;
        if( s.arr[r][c].count !== 0) return;
        ff(r-1,c-1);ff(r-1,c);ff(r-1,c+1);
        ff(r  ,c-1);         ;ff(r  ,c+1);
        ff(r+1,c-1);ff(r+1,c);ff(r+1,c+1);
    };
    ff(row,col);
    // have we hit a mine?
    if( s.arr[row][col].mine) {
      s.exploded = true;
    }
    console.log(getRendering(s));
    return true;
}

// uncovers a cell at a given coordinate
// this is the 'left-click' functionality
function mark(s, ind) {
    const col = ind % s.ncols;
    const row = Math.floor(ind / s.ncols);
    console.log("mark", row, col);
    // if coordinates invalid, refuse this request
    if( ! validCoord(s, row,col)) return false;
    // if cell already uncovered, refuse this
    console.log("marking previous state=", s.arr[row][col].state);
    if( s.arr[row][col].state === STATE_SHOWN) return false;
    // accept the move and flip the marked status
    s.nmarked += s.arr[row][col].state == STATE_MARKED ? -1 : 1;
    s.arr[row][col].state = s.arr[row][col].state == STATE_MARKED ?
        STATE_HIDDEN : STATE_MARKED;
    
    if (s.arr[row][col].state == STATE_MARKED){
        if (s.arr[row][col].mine)
            s.nminesflagged += 1;
    }
    else{
        if (s.arr[row][col].mine)
            s.nminesflagged -= 1;
    }
    return true;
}
function getRendering(s) {
    const res = [];
    for( let row = 0 ; row < s.nrows ; row ++) {
      let str = "";
      for( let col = 0 ; col < s.ncols ; col ++ ) {
        let a = s.arr[row][col];
        if( s.exploded && a.mine) str += "M";
        else if( a.state === STATE_HIDDEN) str += "H";
        else if( a.state === STATE_MARKED) str += "F";
        else if( a.mine) str += "M";
        else str += a.count.toString();
      }
      res[row] = str;
    }
    return res;
}

function initBoard(s, rows, cols, minescount) {
    s.nrows = rows;
    s.ncols = cols;
    s.nmines = minescount;
    s.nminesflagged = 0;
    s.startTime = new Date();
    s.nmarked = 0;
    s.nuncovered = 0;
    s.exploded = false;
    s.arr = array2d(rows, cols, () =>({mine: false, state: STATE_HIDDEN, count: 0}));
}

function main() {

  // create state object
  let state = {
    ncols: null,
    nrows: null,
    nmines: null,
    nminesflagged: null,
    startTime: null,
    nmarked: 0,
    nuncovered: 0,
    exploded: false,
    arr: null
  }

  initBoard(state, 5, 5, 4);
  
  // get browser dimensions - not used in thise code
  let html = document.querySelector("html");
  console.log("Your render area:", html.clientWidth, "x", html.clientHeight)
  
  // register callbacks for buttons
  document.querySelectorAll(".menuButton").forEach((button) =>{
    [rows,cols] = button.getAttribute("data-size").split("x").map(s=>Number(s));
    button.innerHTML = cols < 9 ? "Easy":"Hard";
    button.addEventListener("click", button_cb.bind(null, state, cols, rows));
  });

  // callback for overlay click - hide overlay and regenerate game
  document.querySelector("#overlaywin").addEventListener("click", () => {
    document.querySelector("#overlaywin").classList.remove("active");
    button_cb(state, state.rows, state.cols);
    render(state); 
  });

  // callback for overlay click - hide overlay and regenerate game
  document.querySelector("#overlayloss").addEventListener("click", () => {
    document.querySelector("#overlayloss").classList.remove("active");
    button_cb(state, state.rows, state.cols);
    render(state); 
  });

  // create enough cards for largest game and register click callbacks
  prepare_dom( state);

  // simulate pressing easy button to start new game
  button_cb(state, 8, 10);

  // constantly update timer
  setInterval(() => {
    document.querySelectorAll(".elapsedTime").forEach(
        (e)=> {
          let endTime = new Date();
          e.textContent = String(Math.floor((endTime-state.startTime)/1000))+"s";
      });
  }, 500);
}
