const Static = require('./static')
const CellPathData = require('./CellPath')
const CellPathCandidate = require('./CellPathCandidate')

export class PathFinder {
  constructor() {
    this.mapPoints = {}
    this.grid = []
    this.useOldMovementSystem = false
    this.firstCellZone
    this.OCCUPIED_CELL_WEIGHT = 10
    this.ELEVATION_TOLERANCE = 11.825
    this.WIDTH  = 33 + 2
    this.HEIGHT = 34 + 2
    this.CELL_NUMBER = 560

    this._generateMapPoints()
    this._generateGrid()
  }

  _generateMapPoints() {
    this.mapPoints = {}
    for (let cellId = 0; cellId < this.CELL_NUMBER; cellId++) {
      const { x, y } = Static.getMapPoint(cellId)
      this.mapPoints[x + '_' + y] = cellId
    }
  }

  _generateGrid() {
    this.grid = []
    for (let i = 0; i < this.WIDTH; i += 1) {
      const row = []
      for (let j = 0; j < this.HEIGHT; j += 1) {
        row[j] = new CellPathData(i, j)
      }
      this.grid[i] = row
    }
  }

  getCellId(x, y) {
    return this.mapPoints[x + '_' + y]
  }

  getAccessibleCells(i, j) {
    i += 1
    j += 1
    const c = this.grid[i][j]

    // Adjacent cells
    const c01 = this.grid[i - 1][j]
    const c10 = this.grid[i][j - 1]
    const c12 = this.grid[i][j + 1]
    const c21 = this.grid[i + 1][j]

    const accessibleCells = []
    if (Static.areCommunicating(c, c01, this.useOldMovementSystem)) accessibleCells.push({ i: c01.i - 1, j: c01.j - 1 })
    if (Static.areCommunicating(c, c21, this.useOldMovementSystem)) accessibleCells.push({ i: c21.i - 1, j: c21.j - 1 })
    if (Static.areCommunicating(c, c10, this.useOldMovementSystem)) accessibleCells.push({ i: c10.i - 1, j: c10.j - 1 })
    if (Static.areCommunicating(c, c12, this.useOldMovementSystem)) accessibleCells.push({ i: c12.i - 1, j: c12.j - 1 })

    return accessibleCells
  }

  getMapPointFromCellId(e) {
    var t = e % 14 - ~~(e/28),i = t + 19, n = t + ~~(e/14);
    return {x:i,y:n}
  }

  updateCellPath(cell, cellPath) {
    if ((cell !== undefined) && (cell.l & 1)) {
      cellPath.floor = cell.f || 0;
      cellPath.zone  = cell.z || 0;
      cellPath.speed = 1 + (cell.s || 0) / 10;
  
      if (cellPath.zone !== this.firstCellZone) {
        this.useOldMovementSystem = false;
      }
    } else {
      cellPath.floor = -1;
      cellPath.zone  = -1;
    }
  }

  fillPathGrid(map) {
    this.firstCellZone = map.cells[0].z || 0
    this.useOldMovementSystem = true

    for (let i = 0; i < this.WIDTH; i += 1) {
      const row = this.grid[i]
      for (let j = 0; j < this.HEIGHT; j += 1) {
        const cellId = this.getCellId(i - 1, j - 1)
        const cellPath = row[j]
        const cell = map.cells[cellId]
        this.updateCellPath(cell, cellPath)
      }
    }
  }

  addCandidate(c, w, di, dj, candidates, path) {
    var i = c.i;
    var j = c.j;
  
    // The total weight of the candidate is the weight of previous path
    // plus its weight (calculated based on occupancy and speed factor)
    var distanceToDestination = Math.sqrt((di - i) * (di - i) + (dj - j) * (dj - j));
    w = w / c.speed + c.weight;
  
    if (c.candidateRef === null) {
      var candidateRef = new CellPathCandidate(i, j, path.w + w, distanceToDestination, path);
      candidates.push(candidateRef);
      c.candidateRef = candidateRef;
    } else {
      var currentWeight = c.candidateRef.w;
      var newWeight = path.w + w;
      if (newWeight < currentWeight) {
        c.candidateRef.w = newWeight;
        c.candidateRef.path = path;
      }
    }
  }
  
  addCandidates(path, di, dj, candidates, allowDiagonals) {
    var i = path.i;
    var j = path.j;
    var c = this.grid[i][j];
  
  
    // Searching whether adjacent cells can be candidates to lengthen the path
  
    // Adjacent cells
    var c01 = this.grid[i - 1][j];
    var c10 = this.grid[i][j - 1];
    var c12 = this.grid[i][j + 1];
    var c21 = this.grid[i + 1][j];
  
    // weight of path in straight line = 1
    var weightStraight = 1;
  
    if (Static.areCommunicating(c, c01)) { this.addCandidate(c01, weightStraight, di, dj, candidates, path); }
    if (Static.areCommunicating(c, c21)) { this.addCandidate(c21, weightStraight, di, dj, candidates, path); }
    if (Static.areCommunicating(c, c10)) { this.addCandidate(c10, weightStraight, di, dj, candidates, path); }
    if (Static.areCommunicating(c, c12)) { this.addCandidate(c12, weightStraight, di, dj, candidates, path); }
  
  
    // Searching whether diagonally adjacent cells can be candidates to lengthen the path
  
    // Diagonally adjacent cells
    var c00 = this.grid[i - 1][j - 1];
    var c02 = this.grid[i - 1][j + 1];
    var c20 = this.grid[i + 1][j - 1];
    var c22 = this.grid[i + 1][j + 1];
  
    // weight of path in diagonal = Math.sqrt(2)
    var weightDiagonal = Math.sqrt(2);
  
    if (allowDiagonals) {
      if (Static.canMoveDiagonallyTo(c, c00, c01, c10)) { this.addCandidate(c00, weightDiagonal, di, dj, candidates, path); }
      if (Static.canMoveDiagonallyTo(c, c20, c21, c10)) { this.addCandidate(c20, weightDiagonal, di, dj, candidates, path); }
      if (Static.canMoveDiagonallyTo(c, c02, c01, c12)) { this.addCandidate(c02, weightDiagonal, di, dj, candidates, path); }
      if (Static.canMoveDiagonallyTo(c, c22, c21, c12)) { this.addCandidate(c22, weightDiagonal, di, dj, candidates, path); }
    }
  }

  resetPath(){
    this.mapPoints = {}
    this.grid = []
    this.useOldMovementSystem = false

    this._generateMapPoints()
    this._generateGrid()
  }
  
  /**
   * 
   * @param {*} source userCellId
   * @param {*} target targetCellId
   * @param {*} occupiedCells occupiedCells
   * @param {*} allowDiagonals canMoveDiagonally
   * @param {*} stopNextToTarget bool mis a false
   * 
   */
  getPath (source, target, occupiedCells, allowDiagonals, stopNextToTarget) {
    var c, candidate;
  
    allowDiagonals = allowDiagonals === undefined ? true : !!allowDiagonals;
  
    var srcPos = Static.getMapPoint(source); // source index
    var dstPos = Static.getMapPoint(target); // destination index
  
    var si = srcPos.x + 1; // source i
    var sj = srcPos.y + 1; // source j
  
    var srcCell = this.grid[si][sj];
    if (srcCell.zone === -1) {
      // Searching for accessible cell around source
      var bestFit       = null;
      var bestDist      = Infinity;
      var bestFloorDiff = Infinity;
      for (var i = -1; i <= 1; i += 1) {
        for (var j = -1; j <= 1; j += 1) {
          if (i === 0 && j === 0) {
            continue;
          }
  
          var cell = this.grid[si + i][sj + j];
          if (cell.zone === -1) {
            continue;
          }
  
          var floorDiff = Math.abs(cell.f - srcCell.f);
          var dist      = Math.abs(i) + Math.abs(j);
          if (bestFit === null || floorDiff < bestFloorDiff || (floorDiff <= bestFloorDiff && dist < bestDist)) {
            bestFit       = cell;
            bestDist      = dist;
            bestFloorDiff = floorDiff;
          }
        }
      }
  
      if (bestFit !== null) {
        return [source, this.getCellId(bestFit.i - 1, bestFit.j - 1)];
      }
  
      console.error(new Error('[pathFinder.getPath] Player is stuck in ' + si + '/' + sj));
      return [source];
    }
  
    var di = dstPos.x + 1; // destination i
    var dj = dstPos.y + 1; // destination j
  
    // marking cells as occupied
    var cellPos, cellId;
    for (cellId in occupiedCells) {
      cellPos = Static.getMapPoint(cellId);
      this.grid[cellPos.x + 1][cellPos.y + 1].weight += this.OCCUPIED_CELL_WEIGHT;
    }
  
    var candidates = [];
    var selections = [];
  
    // First cell in the path
    var distSrcDst = Math.sqrt((si - di) * (si - di) + (sj - dj) * (sj - dj));
    var selection = new CellPathCandidate(si, sj, 0, distSrcDst, null);
  
    // Adding cells to path until destination has been reached
    var reachingPath = null;
    var closestPath = selection;
    while (selection.i !== di || selection.j !== dj) {
      this.addCandidates(selection, di, dj, candidates, allowDiagonals);
  
      // Looking for candidate with the smallest additional length to path
      // in O(number of candidates)
      var n = candidates.length;
      if (n === 0) {
        // No possible path
        // returning the closest path to destination
        selection = closestPath;
        break;
      }
  
      var minPotentialWeight = Infinity;
      var selectionIndex = 0;
      for (c = 0; c < n; c += 1) {
        candidate = candidates[c];
        if (candidate.w + candidate.d < minPotentialWeight) {
          selection = candidate;
          minPotentialWeight = candidate.w + candidate.d;
          selectionIndex = c;
        }
      }
  
      selections.push(selection);
      candidates.splice(selectionIndex, 1);
  
      // If stopNextToTarget
      // then when reaching a distance of less than Math.sqrt(2) the destination is considered as reached
      // (the threshold has to be bigger than sqrt(2) but smaller than 2, to be safe we use the value 1.5)
      if (selection.d === 0 || (stopNextToTarget && selection.d < 1.5)) {
        // Selected path reached destination
        if (reachingPath === null || selection.w < reachingPath.w) {
          reachingPath = selection;
          closestPath  = selection;
  
          // Clearing candidates dominated by current solution to speed up the algorithm
          var trimmedCandidates = [];
          for (c = 0; c < candidates.length; c += 1) {
            candidate = candidates[c];
            if (candidate.w + candidate.d < reachingPath.w) {
              trimmedCandidates.push(candidate);
            } else {
              this.grid[candidate.i][candidate.j].candidateRef = null;
            }
          }
          candidates = trimmedCandidates;
        }
      } else {
        if (selection.d < closestPath.d) {
          // 'selection' is the new closest path to destination
          closestPath = selection;
        }
      }
    }
  
    // Removing candidate reference in each cell in selections and active candidates
    for (c = 0; c < candidates.length; c += 1) {
      candidate = candidates[c];
      this.grid[candidate.i][candidate.j].candidateRef = null;
    }
  
    for (var s = 0; s < selections.length; s += 1) {
      selection = selections[s];
      this.grid[selection.i][selection.j].candidateRef = null;
    }
  
    // Marking cells as unoccupied
    for (cellId in occupiedCells) {
      cellPos = Static.getMapPoint(cellId);
      this.grid[cellPos.x + 1][cellPos.y + 1].weight -= this.OCCUPIED_CELL_WEIGHT;
    }
  
    var shortestPath = [];
    while (closestPath !== null) {
      shortestPath.unshift(this.getCellId(closestPath.i - 1, closestPath.j - 1));
      closestPath = closestPath.path;
    }
  
    return shortestPath;
  };

  getMovementDuration() {
    //10 case = 2,1 sec +/-100ms
  }

  compressPath(path) {
    var compressedPath = [];
    var prevCellId     = path[0];
    var prevDirection  = -1;
  
    var prevX;
    var prevY;
  
    for (var i = 0; i < path.length; i++) {
      var cellId = path[i];
  
      var direction;
      var coord = Static.getMapPoint(cellId);
  
      // get direction
      if (i === 0) {
        direction = -1;
      } else {
        if (coord.y === prevY) {
          // move horizontaly
          direction = coord.x > prevX ? 7 : 3;
        } else if (coord.x === prevX) {
          // move verticaly
          direction = coord.y > prevY ? 1 : 5;
        } else {
          // move in diagonal
          if (coord.x > prevX) {
            direction = coord.y > prevY ? 0 : 6;
          } else {
            direction = coord.y > prevY ? 2 : 4;
          }
        }
      }
  
      if (direction !== prevDirection) {
        compressedPath.push(prevCellId + (direction << 12));
        prevDirection = direction;
      }
  
      prevCellId = cellId;
      prevX = coord.x;
      prevY = coord.y;
    }
  
    compressedPath.push(prevCellId + (prevDirection << 12));
  
    return compressedPath;
  }
}

