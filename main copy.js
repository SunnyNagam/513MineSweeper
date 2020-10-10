window.addEventListener('load', main);

/**
 * flips a single card (if coordinates valid)
 * 
 * @param {state} s 
 * @param {number} col 
 * @param {number} row 
 */
function flip1( s, col, row) {
  if( col >= 0 && col < s.cols && row >= 0 && row < s.rows)
    s.onoff[row * s.rows + col] = ! s.onoff[row * s.rows + col];
}

/**
 * flip a card with given coordinate and its neigbors
 * 
 * @param {state} s 
 * @param {number} col 
 * @param {number} row 
 */
function flip( s, col, row) {
  flip1( s, col, row);
  flip1( s, col+1, row);
  flip1( s, col-1, row);
  flip1( s, col, row+1);
  flip1( s, col, row-1);
}

/**
 * makes a solvable state by simulating random flips
 * @param {state} s 
 * @param {number} ncols 
 * @param {number} nrows 
 */
function make_solvable(s, ncols, nrows) {
  s.moves = 0;
  s.onoff = []; 
  for( let i = 0 ; i < s.rows * s.cols ; i ++)
    s.onoff[i] = false;
  for( let row = 0 ; row < s.rows ; row ++)
    for( let col = 0 ; col < s.cols ; col ++)
      if( Math.random() < 0.5)
        flip(s, col, row);
}

/**
 * creates enough cards for largest board (9x9)
 * registers callbacks for cards
 * 
 * @param {state} s 
 */
function prepare_dom(s) {
  const grid = document.querySelector(".grid");
  const nCards = 9 * 9 ; // max grid size
  for( let i = 0 ; i < nCards ; i ++) {
    const card = document.createElement("div");
    card.className = "card";
    card.setAttribute("data-cardInd", i);
    card.addEventListener("click", () => {
      card_click_cb( s, card, i);
    });
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
  grid.style.gridTemplateColumns = `repeat(${s.cols}, 1fr)`;
  for( let i = 0 ; i < grid.children.length ; i ++) {
    const card = grid.children[i];
    const ind = Number(card.getAttribute("data-cardInd"));
    if( ind >= s.rows * s.cols) {
      card.style.display = "none";
    }
    else {
      card.style.display = "block";
      if(s.onoff[ind])
        card.classList.add("flipped");
      else
        card.classList.remove("flipped");
    }
  }
  document.querySelectorAll(".moveCount").forEach(
    (e)=> {
      e.textContent = String(s.moves);
    });
}
let clickSound = new Audio("clunk.mp3");

/**
 * callback for clicking a card
 * - toggle surrounding elements
 * - check for winning condition
 * @param {state} s 
 * @param {HTMLElement} card_div 
 * @param {number} ind 
 */
function card_click_cb(s, card_div, ind) {
  const col = ind % s.cols;
  const row = Math.floor(ind / s.cols);
  card_div.classList.toggle("flipped");
  flip(s, col, row);
  s.moves ++;
  render(s);
  // check if we won and activate overlay if we did
  if( s.onoff.reduce((res,l)=>res && !l, true)) {
    document.querySelector("#overlay").classList.toggle("active");
  }
  clickSound.play();
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
  s.cols = cols;
  s.rows = rows;
  make_solvable(s);
  render(s);
}

function main() {

  // create state object
  let state = {
    cols: null,
    rows: null,
    moves: 0,
    onoff: []
  }
  
  // get browser dimensions - not used in thise code
  let html = document.querySelector("html");
  console.log("Your render area:", html.clientWidth, "x", html.clientHeight)
  
  // register callbacks for buttons
  document.querySelectorAll(".menuButton").forEach((button) =>{
    [rows,cols] = button.getAttribute("data-size").split("x").map(s=>Number(s));
    button.innerHTML = `${cols} &#x2715; ${rows}`
    button.addEventListener("click", button_cb.bind(null, state, cols, rows));
  });

  // callback for overlay click - hide overlay and regenerate game
  document.querySelector("#overlay").addEventListener("click", () => {
    document.querySelector("#overlay").classList.remove("active");
    make_solvable(state);
    render(state); 
  });

  // sound callback
  let soundButton = document.querySelector("#sound");
  soundButton.addEventListener("change", () => {
    clickSound.volume = soundButton.checked ? 0 : 1;
  });


  // create enough cards for largest game and register click callbacks
  prepare_dom( state);

  // simulate pressing 4x4 button to start new game
  button_cb(state, 4, 4);
}