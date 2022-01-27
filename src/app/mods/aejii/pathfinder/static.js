module.exports = class StaticPathFinder {
  static getMapPoint(cellId) {
    const row = cellId % 14 - ~~(cellId / 28)
    const x = row + 19
    const y = row + ~~(cellId / 14)
    return { x, y }
  }

  static areCommunicating(c1, c2, oldMovementSystem) {
    const sameFloor = c1.floor === c2.floor
    const sameZone = c1.zone === c2.zone
    let ELEVATION_TOLERANCE = 11.825
    if (sameFloor) return true
    if (!sameZone) return false
    
    return oldMovementSystem || c1.zone !== 0 || (Math.abs(c1.floor - c2.floor) <= ELEVATION_TOLERANCE)
  }

  static canMoveDiagonallyTo(c1, c2, c3, c4) {
    // Can move between c1 and c2 diagonally only if c1 and c2 are compatible and if c1 is compatible either with c3 or c4
    return this.areCommunicating(c1, c2) && (this.areCommunicating(c1, c3) || this.areCommunicating(c1, c4));
  }
}