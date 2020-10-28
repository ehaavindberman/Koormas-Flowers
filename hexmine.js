// Hexagonal Minesweeper JS

// TODO: add a good lose condition
// TODO: add good win condition
// TODO: button to add a layer of hexagons
// TODO: rework number of mines left to be found thing


// // model values:
// trueBoard:
// null - not board space
// -1 - unflagged mine
// 0-6 - number of adjacent mines
// 7 - flagged mine
// 8 - flagged not mine
//
// userBoard:
// null - not baord
// -1 - shown mine
// 0-6 - shown space with nunber of adjacent mines
// 7 - flagged space
// 9 - unshown space on board

class model {

  newGame(layers) {
    this.lost = false;
    this.trueBoard = this.init(layers, 1);
    this.userBoard = this.init(layers, 9);
  }

  init(layers, boardVal) {
    // sort hexagons according to this: http://ferkeltongs.livejournal.com/31455.html
    // i.e. if we have 2 layers: [[null,2,2][2,1,2][2,2,null]]
    // where numbers are layer nums
    // (I have it going in the opposite direction as the link for the diagonals)

    // first make square null matrix of size 2*layers-2
    let board = this.init2dArray(2*layers-1, 2*layers-1, null);


    for (let i=0; i<layers; i++) {
      for (let j=0; j<layers; j++) {

        // bottom left part
        if (board[board.length-1-i][j] === null) {
          board[board.length-1-i][j] = boardVal;
        }

        // top right part
        if (board[i][board.length-1-j] === null) {
          board[i][board.length-1-j] = boardVal;
        }

        // diagonals
        if (i+j > layers-2) {
          board[i][j] = boardVal;
          board[board.length-1-i][board.length-1-j] = boardVal;
        }
      }
    }

    return board;
  }

  setMines(i,j,n) {
    // TODO: update the values here in the trueboard rather than 0s and 1s

    // don't allow mines next to or on the initial click
    this.trueBoard[i][j] = 0;
    let noMines = this.getNeighbors(i,j)
    for (let k=0; k<noMines.length; k++) {
      this.trueBoard[noMines[k][0]][noMines[k][1]] = 0;
    }

    // get a list of all possible mine spots
    let potentialMines = [];
    for (let x=0; x<this.trueBoard.length; x++) {
      for (let y=0; y<this.trueBoard[x].length; y++) {
        if (this.trueBoard[x][y] == 1) {
          potentialMines.push([x,y]);
        }
      }
    }

    // set n mines
    for (let k=0; k<n; k++) {
      // get a random index in the potentialMines list
      let idx = Math.floor(Math.random() * (potentialMines.length));

      // set that index to be a mine
      this.trueBoard[potentialMines[idx][0]][potentialMines[idx][1]] = -1;

      // pop that index out of the potentialMines so it is not chosen again
      potentialMines.splice(idx,1);
    }
  }

  setCounts() {
    for (let x=0; x<this.trueBoard.length; x++) {
      for (let y=0; y<this.trueBoard[x].length; y++) {

        // skip mines or off board areas
        if (this.trueBoard[x][y] == null || this.trueBoard[x][y] == -1) {
          continue
        }

        this.trueBoard[x][y] = this.getNumAdjMines(x,y);

      }
    }
  }

  // do something based on what the user clicked on
  userClick(i,j) {
    // if flagged spot, do nothing
    if (this.userBoard[i][j] == 7) {
      return
    }

    // check for mine
    if (this.trueBoard[i][j] == -1) {
      this.userBoard[i][j] = this.trueBoard[i][j];
      // lose condition
      this.lose();
      return
    }

    // check for seen by user
    if (this.userBoard[i][j] == 9) {  // unseen
      // show user
      this.userBoard[i][j] = this.trueBoard[i][j];

      // and if adjacent mines = 0, open the adjacents if the flag count = adj mines count
      if (this.trueBoard[i][j] == 0) {
        this.floodFill(i,j);
      }
    }
    else {  // seen and has a count
      this.showFromClickedCount(i,j);
    }
  }

  // fill any areas where we have 0 mines around a space and do it until
  // we run out of things to show the user
  floodFill(i,j) {
    let showUserList = this.getNeighbors(i,j)

    // take out any already shown
    for (let k=showUserList.length-1; k>=0; k--) {
      let x = showUserList[k][0];
      let y = showUserList[k][1];
      if (this.userBoard[x][y] != 9) {
        showUserList.splice(k,1);
      }
    }

    // show user adjacents, if they are 0s, flood fill again
    for (let k=0; k<showUserList.length; k++) {
      let x = showUserList[k][0];
      let y = showUserList[k][1];
      this.userBoard[x][y] = this.trueBoard[x][y];
      if (this.userBoard[x][y] == 0) {
        this.floodFill(x,y);
      }
    }
  }

  // show the other adjacents if the count is the same as the flag count
  // also makes user lose if they uncover a mine
  showFromClickedCount(i,j) {
    // don't bother if the count is different
    if (this.getAdjShownFlagsAndMines(i,j) != this.trueBoard[i][j]) {
      return
    }

    let nbrs = this.getNeighbors(i,j)

    for (let k=0; k<nbrs.length; k++) {
      let x = nbrs[k][0];
      let y = nbrs[k][1];
      if (this.userBoard[x][y] == 9) {

        // check if the user loses
        if (this.trueBoard[x][y] == -1) {
          this.userBoard[x][y] = this.trueBoard[x][y];
          this.lose();
        }

        // show user
        this.userBoard[x][y] = this.trueBoard[x][y];

        // flood fill if the count is 0
        if (this.trueBoard[x][y] == 0) {
          this.floodFill(x,y);
        }
      }
    }
  }

  // puts a flag down where the user says to put a flag down
  userPlacedFlag(i,j) {
    let flag;
    let appropriateClick = false;

    // make sure to only add flags to unknown spaces or flags, and to switch between
    if (this.userBoard[i][j] == 9) {
      this.userBoard[i][j] = 7;
      flag = true;
      appropriateClick = true;

      // tell the trueBoard if it's right or not
      if (this.trueBoard[i][j] == -1) {
        this.trueBoard[i][j] = 7;
      } else {
        this.trueBoard[i][j] = 8;
      }
    }
    if (!appropriateClick & this.userBoard[i][j] == 7) {
      this.userBoard[i][j] = 9;
      flag = false;

      // tell the trueBoard if it's right or not
      if (this.trueBoard[i][j] == 7) {
        this.trueBoard[i][j] = -1;
      } else {
        this.trueBoard[i][j] = this.getNumAdjMines(i,j);
      }
    }
    return flag;

  }

  // tells the user they lost
  lose() {
    this.lost = true;
    console.log('lose');
  }

  // checks if the user has won, true if won, false if not won
  checkWin() {
    for (let x=0; x<this.trueBoard.length; x++) {
      for (let y=0; y<this.trueBoard[x].length; y++) {
        // skip nulls
        if (this.trueBoard[x][y] == null) {
          continue
        }
        // checking that flagged or unknowns are mines
        if (this.userBoard[x][y] > 6) {
          if (this.trueBoard[x][y] != -1 & this.trueBoard[x][y] != 7) {
            return false;
          }
        }
      }
    }
    // if we get all the way through, we have won
    return true
  }

  // get the number of flagged spaces by user
  getNumFlags() {
    let flags = 0
    for (let x=0; x<this.userBoard.length; x++) {
      for (let y=0; y<this.userBoard[x].length; y++) {
        if (this.userBoard == 7) {
          flags++;
        }
      }
    }
    return flags;
  }

  // UTILITIES
  // takes index as input and returns number of mines and
  // flags shown to user adjacent to a space
  getAdjShownFlagsAndMines(i,j) {
    let potentials = this.getNeighbors(i,j);

    let numAdjMinesAndFlags = 0;
    for (let k=0; k<potentials.length; k++) {
      let x = potentials[k][0]
      let y = potentials[k][1]
      // if we find a mine or a flag add to the total
      if (this.userBoard[x][y] == -1 || this.userBoard[x][y] == 7) {
        numAdjMinesAndFlags++;
      }
    }

    return numAdjMinesAndFlags;
  }

  // takes index as input and returns number of mines adjacent to a space
  getNumAdjMines(i,j) {
    let potentials = this.getNeighbors(i,j);

    let numAdjMines = 0;
    for (let k=0; k<potentials.length; k++) {
      let x = potentials[k][0]
      let y = potentials[k][1]
      // if we find a mine flagged or otherwise add it to the number of adjacent mines
      if (this.trueBoard[x][y] == -1 || this.trueBoard[x][y] == 7) {
        numAdjMines++;
      }
    }

    return numAdjMines;
  }

  // takes index as input and returns the number of adjacent mines + the
  // number of adjacent flags to the index
  getNumAdjMinesAndFlags(i,j) {
    let potentials = this.getNeighbors(i,j);

    let numAdjMinesAndFlags = 0;
    for (let k=0; k<potentials.length; k++) {
      let x = potentials[k][0]
      let y = potentials[k][1]
      // if we find a mine or a flag add to the total
      if (this.trueBoard[x][y] == -1 || this.userBoard[x][y] == 7) {
        numAdjMinesAndFlags++;
      }
    }

    return numAdjMinesAndFlags;
  }

  // takes index, returns adjacent flags to index
  getNumAdjFlags(i,j) {
    let potentials = this.getNeighbors(i,j);

    let numAdjFlags = 0;
    for (let k=0; k<potentials.length; k++) {
      let x = potentials[k][0]
      let y = potentials[k][1]
      // if we find a mine or a flag add to the total
      if (this.userBoard[x][y] == 7) {
        numAdjFlags++;
      }
    }

    return numAdjFlags;
  }

  // takes an index and returns an array of indices
  getNeighbors(i,j) {

    // check if it's on the edge

    let potentials = [
      [i-1,j],
      [i-1,j+1],
      [i,j+1],
      [i+1,j],
      [i+1,j-1],
      [i,j-1]
    ];

    if (i == 0) {
      potentials[0] = [];
      potentials[1] = [];
    }

    if (i == this.trueBoard.length-1) {
      potentials[3] = [];
      potentials[4] = [];
    }

    if (j == 0) {
      potentials[4] = [];
      potentials[5] = [];
    }

    if (j == this.trueBoard[i].length-1) {
      potentials[1] = [];
      potentials[2] = []
    }

    // now check if we're out of the true board area
    for (let k=0; k<potentials.length; k++) {
      if (potentials[k].length == 0) {
        continue
      }
      // when we update the trueboard values
      if (this.trueBoard[potentials[k][0]][potentials[k][1]] == null) {
        potentials[k] = [];
      }
    }

    let actuals = [];
    for (let k=0; k<potentials.length; k++) {
      if (potentials[k].length == 0) {
        continue
      }
      actuals.push(potentials[k]);
    }

    return actuals;

  }

  // counts number of unfound mines in the map and returns that number
  countUnfoundMines() {
    let unfound = 0;
    for (let x=0; x<this.userBoard.length; x++) {
      for (let y=0; y<this.userBoard[x].length; y++) {
        // mine space
        if (this.trueBoard[x][y] == -1 || this.trueBoard[x][y] == 7) {
          unfound++;
        }
        // found mine space or flagged space
        if (this.userBoard[x][y] == -1 || this.userBoard[x][y] == 7) {
          unfound--;
        }
      }
    }
    return unfound;
  }

  // counts the number of correctly flagged or unknown flags when the user wins
  countCollected() {
    let collected = 0;
    for (let x=0; x<this.userBoard.length; x++) {
      for (let y=0; y<this.userBoard[x].length; y++) {
        // flagged
        if (this.userBoard[x][y] == 7 & this.trueBoard[x][y] == 7) {
          collected++;
        }
        // unflagged
        if (this.userBoard[x][y] == 9 & this.trueBoard[x][y] == -1) {
          collected++;
        }
      }
    }
    return collected;
  }

  // takes two lengths and a value and returns a 2d array with those lengths and values
  init2dArray(xlength, ylength, value) {
    // null 2d array of correct length
    let arr = new Array(ylength).fill(null).map(()=>new Array(xlength).fill(null));

    for (let x=0;x<xlength;x++) {
      for (let y=0;y<ylength;y++) {
        arr[y][x] = value;
      }
    }
    return arr;
  }
}

class view {

  // takes game board and shows on canvas
  showGameBoard(canvas, ctx) {

    ctx.save();

    // set background
    ctx.clearRect(0,0, canvas.width,canvas.height);
    ctx.fillStyle = '#348eaf'; // sienna  2d7c99
    ctx.fillRect(0,0, canvas.width,canvas.height);

    ctx.restore();
  }

  // draw an individual mine at x and y with size mineSize
  drawMine(ctx, type, x, y, mineSize) {
    ctx.save();

    switch (type) {
      case -1: // mine
        ctx.fillStyle = 'purple';
        this.drawNgon(ctx,6,mineSize,x,y);
        break;

      case 0: // number
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:

        ctx.fillStyle = '#559977'; //lightgreen
        this.drawNgon(ctx,6,mineSize,x,y);
        ctx.font = mineSize+'px Verdana';
        ctx.fillStyle = '#ea9f59'; // text fill
        if (type > 0) {
          // draw the text in the middle of the hexagon
          ctx.fillText(type,x-mineSize/4,y+mineSize/4);
        }

        break;

      case 7: // flag
        ctx.fillStyle = '#d84e7c'; //#af6b0c
        this.drawNgon(ctx,6,mineSize,x,y);
        break;

      case 9: // unknown
        ctx.fillStyle = '#116644'; // green
        this.drawNgon(ctx,6,mineSize,x,y)
        break;

    }
    ctx.restore();
  }

  // show the user the number of unflagged mines
  displayMineCount(num) {
    document.getElementById('mineCount').innerHTML = 'Flowers Left: '+num;
  }

  // show the user how many flowers they have collected
  displayCollectedCount(num) {
    document.getElementById('collected').innerHTML = 'Flowers Collected: '+num;
  }

  // show the zoom in and out button on the canvas
  showZoom(canvas, ctx) {

    ctx.save();
    ctx.globalAlpha=0.8;

    // background
    ctx.fillStyle = 'lightgrey';
    ctx.fillRect(canvas.width*(1-.0618-.02)
      ,canvas.height*(1-.1-.02)
      ,canvas.width*.0618
      ,canvas.height*.1
    );

    ctx.fillStyle = 'black';

    // plus
    ctx.fillRect(canvas.width*(1-.0618*3/4-.02)
      ,canvas.height*(1-.1*3/4-.02)
      ,canvas.width*.0618/2
      ,canvas.height*.007
    );

    ctx.fillRect(canvas.width*(1-.0618/2-.007/2-.02)
      ,canvas.height*(1-.1*7/8-.02)
      ,canvas.width*.007
      ,canvas.height*.0618/2
    );

    // minus
    ctx.fillRect(canvas.width*(1-.0618*3/4-.02)
      ,canvas.height*(1-.1/4-.02)
      ,canvas.width*.0618/2
      ,canvas.height*.007
    );

    ctx.restore();
  }

  displayWin(type) {
    switch(type) {
      case 'win':
        document.getElementById('winAlert').innerHTML = 'Collected All!';
        break;
      case 'reset':
        document.getElementById('winAlert').innerHTML = ' ';
        break;
    }

  }

  // draws an n-gon of any radius in the canvas for which the context is provided
  // thanks http://scienceprimer.com/drawing-regular-polygons-javascript-canvas
  drawNgon(ctx,numberOfSides,radius,xCtr,yCtr) {
    // ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo (xCtr +  radius * Math.cos(0), yCtr +  radius *  Math.sin(0));

    for (var i = 1; i <= numberOfSides;i += 1) {
        ctx.lineTo (xCtr + radius * Math.cos(i * 2 * Math.PI / numberOfSides)
        , yCtr + radius * Math.sin(i * 2 * Math.PI / numberOfSides));
    }

    ctx.stroke();
    ctx.fill();
  }

}

class manager {
  constructor() {

    this.zoom = 1.8;
    this.mouseDownFlag = false;
    this.mouseMoveFlag = false;
    this.mouseStartCoords = [0,0];
    this.mouseOrigCoords = [0,0];
    this.naturalMineLength = 10;
    this.firstClick = true;
    this.notWon = true;
    this.flowersCollected = 0;

    // things set by the user
    this.layers = 3;
    this.difficulty = .18;
    this.numMines = this.setNumberOfMines(this.layers,this.difficulty);

    this.canvas = document.getElementById('hexMineBoard');
    this.ctx = this.canvas.getContext('2d');


    this.canvas.addEventListener('mousedown', this, false);
    this.canvas.addEventListener('mousemove', this, false);
    this.canvas.addEventListener('mouseup', this, false);
    this.canvas.addEventListener('contextmenu', this, false);

    // new game button
    // document.getElementById('newGame').onclick = function(){controller.playGame(true, true);};
    document.getElementById('newGame').addEventListener('click', function() {
      controller.playGame(true, true);
    });


    boards = new model(this.layers);

    userView = new view();

    this.playGame(true,true);

  }

  playGame(centerView, reset) {
    if (reset) {
      this.notWon = true;
      this.firstClick = true;
      boards.newGame(this.layers);

      // reset number of mines
      this.numMines = this.setNumberOfMines(this.layers,this.difficulty);
      userView.displayCollectedCount(this.flowersCollected);
      userView.displayWin('reset');
    }

    userView.displayMineCount(boards.countUnfoundMines());

    // check to see if the user won
    if (this.notWon & boards.checkWin()) {
      userView.displayWin('win');
      userView.displayCollectedCount(this.flowersCollected);
      this.flowersCollected += boards.countCollected();
      this.layers++;
      this.notWon = false;
      console.log('win!');
    }

    userView.showGameBoard(this.canvas,this.ctx);

    this.stepThroughBoard('user', centerView);

    userView.showZoom(this.canvas, this.ctx);
  }

  stepThroughBoard(type, centerView) {
    this.ctx.save();

    // this will be the side length (so there will be 6 per hexagon)
    let mineSize = this.naturalMineLength*this.zoom;
    let boardHeight = (2*this.layers-1)*mineSize*Math.sqrt(3);
    let boardWidth = mineSize*(Math.floor(this.layers/2) + Math.ceil(this.layers/2)*2);

    if (centerView===true) {
      this.viewOffset = [this.canvas.width/2 - boardWidth/2
          , 1/2*(this.canvas.height - boardHeight + mineSize*Math.sqrt(3))];
    }

    let x = boardWidth/2;
    let y = 0;

    const maxDist = Math.sqrt(3)/2*mineSize;

    const yChg = mineSize/2*Math.sqrt(3);
    const xChg = 3/2*mineSize;
    for (let i=0; i<boards.userBoard.length; i++) {

      let iters = 0;
      for (let j=boards.userBoard.length-1; j>=0; j--) { // going from right to left

        if (boards.userBoard[i][j] === null) {
          continue
        }

        let drawX = x - xChg*iters + this.viewOffset[0];
        let drawY = y + yChg*iters + this.viewOffset[1];

        let dist = Math.sqrt(Math.pow(this.mouseStartCoords[0]-drawX,2)+Math.pow(this.mouseStartCoords[1]-drawY,2));

        if (dist < maxDist) {
          switch (type) {
            // do something based on where user clicked
            case 'click':
              // let actuals = boards.getNeighbors(i,j);
              if (this.firstClick) {
                boards.setMines(i,j,this.numMines);
                boards.setCounts();
                this.firstClick = false;
              }
              boards.userClick(i,j);
              // if (boards.lost) {
              //   // boards.userBoard = boards.trueBoard;
              // }
              break;
            // add flag
            case 'rightClick':
              let flag = boards.userPlacedFlag(i,j);
              if (flag) {
                this.numMines--;
              } else {
                this.numMines++;
              }
              break;

          }
        }

        userView.drawMine(this.ctx,boards.userBoard[i][j],drawX,drawY,mineSize);

        iters++;
      }

      // increment percentages
      y += yChg;
      if (i<boards.userBoard.length/2 - .5) {
        x += xChg;
      } else {
        y += yChg;
      }
    }

    this.ctx.restore();
  }

  handleEvent(event) {
    // let x = event.pageX - event.offsetX+1;
    // let y = event.pageY - event.offsetY+1;

    let x = event.offsetX+1;
    let y = event.offsetY+1;

    // this is so that only the right click is called on a right click
    if (event.which == 3) {
      if (event.type == 'contextmenu') {
        this.contextmenu(x,y);
      }
    } else {
      this[event.type](x,y);
    }


  }

  mousedown(x,y) {
    this.mouseMoveFlag = false;

    // if the user did not click zoom,
    // take the coordinates, check for a click or drag
    if (this.clickedZoom(x,y)===false) {
      this.mouseDownFlag = true;
      this.mouseStartCoords = [x,y];
      this.mouseOrigCoords = [x,y];
    } else {
      this.playGame(false,false);
    }
  }

  mousemove(x,y) {

    if (this.mouseDownFlag) {
      this.mouseMoveFlag = true;
      let dx = x - this.mouseStartCoords[0];
      let dy = y - this.mouseStartCoords[1];

      // move the view
      this.viewOffset[0] += dx;
      this.viewOffset[1] += dy;

      // update the mouse coordinates
      this.mouseStartCoords = [x,y];

      // show the user
      this.playGame(false, false);
    }
  }

  mouseup(x,y) {
    // check that the move was more than 10px:
    let dist = Math.sqrt(
      Math.pow(this.mouseOrigCoords[0]-this.mouseStartCoords[0],2)
      + Math.pow(this.mouseOrigCoords[1]-this.mouseStartCoords[1],2)
    );
    if (dist < 10) {
      this.mouseMoveFlag = false;
    }

    // if the event was not a drag aka, a click
    if (this.mouseDownFlag & !this.mouseMoveFlag) {
      this.stepThroughBoard('click');

      this.playGame(false,false);
    }
    this.mouseDownFlag = false;
  }

  contextmenu(x,y) {
    this.mouseStartCoords = [x,y];
    this.stepThroughBoard('rightClick');
    this.playGame(false,false);

  }

  // function to check if the user clicked the zoom button
  clickedZoom(x,y) {
    let zoomClicked = false;
    // check if clicked on zoom
    if (x > this.canvas.width*(1-.0618-.02) & x < this.canvas.width*(1-.02)) {
      // check plus
      if (y > this.canvas.height*(1-.1-.02) & y < this.canvas.height*(1-.1/2-.02)) {
        this.zoom += this.zoom*0.1;
        zoomClicked = true;
      }

      // check minus
      if (y > this.canvas.height*(1-.1/2-.02) & y < this.canvas.height*(1-.02)) {
        this.zoom -= this.zoom*0.1;
        zoomClicked = true;
      }

    }
    return zoomClicked;

  }

  // return the natural number of mines (THIS STEP SETS THE NUMBER OF MINES!)
  setNumberOfMines(layers, pct) {
    let sum = 0;
    for (let i=1; i<=layers; i++) {
      sum += i;
    }
    return Math.floor((1 + 6*sum)*pct);
  }
}

// DO STUFF
// # flowers left to be found
// # flowers collected out of total possible
let boards;
let userView;
let controller = new manager;



















//
