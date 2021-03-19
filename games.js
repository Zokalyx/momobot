class C4 {
    constructor(w, h) {
        this.x = w;
        this.y = h;
        this.array = [];
        this.turn = 1;
        this.ended = false;
        this.winner = 0;
        this.a = "";
        this.b = "";
        for (var i = 0; i < this.x; i++) {
            this.array.push([]);
            for (var j = 0; j < this.y; j++) {
              this.array[i].push(0);
            }
        }
    }

    checkHorizontals() {
        var maxCounter = 0;
        for (var j = 0; j < this.y; j++) {
        var counter = 0;
        for (var i = 0; i < this.x; i++) {
          if (this.array[i][j] == 0 || 0 > this.array[i][j]*counter) {counter = 0;}
          counter += this.array[i][j]
          if (Math.abs(counter) == 4) {
            break;
          }
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkVerticals() {
        var maxCounter = 0;
        for (var i = 0; i < this.x; i++) {
        var counter = 0;
        for (var j = 0; j < this.x; j++) {
          if (this.array[i][j] == 0 || 0 > this.array[i][j]*counter) {counter = 0;}
          counter += this.array[i][j]
          if (Math.abs(counter) == 4) {
            break;
          }
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkDiagonal1a() {
        var maxCounter = 0;
        for (var i = 0; i < this.x - 3; i++) {
        var counter = 0;
        var aux = 0;
        while (true) {
          if (aux + i == this.x || aux == this.y) {
            break;
          }
          if (this.array[i + aux][aux] == 0 || 0 > this.array[i + aux][aux]*counter) {counter = 0;}
          counter += this.array[i + aux][aux];
          if (Math.abs(counter) == 4) {
            break;
          }
          aux++;
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkDiagonal1b() {
        var maxCounter = 0;
        for (var j = 1; j < this.y - 3; j++) {
        var counter = 0;
        var aux = 0;
        while (true) {
          if (aux == this.x || aux + j == this.y) {
            break;
          }
          if (this.array[aux][j + aux] == 0 || 0 > this.array[aux][j + aux]*counter) {counter = 0;}
          counter += this.array[aux][j + aux];
          if (Math.abs(counter) == 4) {
            break;
          }
          aux++;
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkDiagonal2a() {
        var maxCounter = 0;
        for (var i = this.x - 1; i > 2; i--) {
        var counter = 0;
        var aux = 0;
        while (true) {
          if (i - aux == -1 || aux == this.y) {
            break;
          }
          if (this.array[i - aux][aux] == 0 || 0 > this.array[i - aux][aux]*counter) {counter = 0;}
          counter += this.array[i - aux][aux];
          if (Math.abs(counter) == 4) {
            break;
          }
          aux++;
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    checkDiagonal2b() {
        var maxCounter = 0;
        for (var j = 1; j < this.y; j++) {
        var counter = 0;
        var aux = 0;
        while (true) {
          if (this.x - 1 - aux == -1 || j + aux == this.y) {
            break;
          }
          if (this.array[this.x - 1 - aux][j + aux] == 0 || 0 > this.array[this.x - 1 - aux][j + aux]*counter) {counter = 0;}
          counter += this.array[this.x - 1 - aux][j + aux];
          if (Math.abs(counter) == 4) {
            break;
          }
          aux++;
        }
        if (Math.abs(counter) > Math.abs(maxCounter)) {
          maxCounter = counter;
        }
        if (Math.abs(maxCounter) == 4) {
          break;
        }
        }
        return maxCounter;
    }

    check() {
        if (this.checkHorizontals() == 4 || this.checkVerticals() == 4 || this.checkDiagonal1a() == 4 || this.checkDiagonal1b() == 4 || this.checkDiagonal2a() == 4 || this.checkDiagonal2b() == 4) {
        return 1;
        } else if (this.checkHorizontals() == -4 || this.checkVerticals() == -4 || this.checkDiagonal1a() == -4 || this.checkDiagonal1b() == -4 || this.checkDiagonal2a() == -4 || this.checkDiagonal2b() == -4) {
        return -1;
        } else {
        return 0;
        }
    }

    checkDraw() {
        var ans = true;
        for (var i = 0; i < this.x ; i++) {
            for (var j = 0; j < this.y ; j++) {
                if (this.array[i][j] == 0) {
                    ans = false;
                    break;
                }
            }
            if (!ans) {
                break;
            }
        }
        return ans;
    }

    renderBoard() {
        var ans = "";
        for (var j = this.y - 1; j >= 0; j--) {
            for (var i = 0; i < this.x; i++) {
                if (this.array[i][j] == 0) {
                    ans += ":black_circle:";
                } else if (this.array[i][j] == 1) {
                    ans += ":blue_square:";
                } else {
                    ans += ":red_square:";
                }
                if (i !== this.x - 1) {
                    ans += "    "
                }
            }
            ans += "\n\n"
        }
        return ans;
    }

    reactBoard(brd, regionalIndicators) {
        for (var i = 0; i < this.x; i++) {
            brd.react(regionalIndicators[i]);
        }
    }

    lowestBlank(col) {
      var row = -1;
      for (var j = 0; j < this.y; j++) {
        if (this.array[col][j] === 0) {
          row = j;
          break;
        }
      }
      return row;
    }

    act(col) {
        if (this.lowestBlank(col) >= 0) {
            this.array[col][this.lowestBlank(col)] = this.turn;
            this.turn *= -1;
        }
        if (this.check() !== 0) {
            this.ended = true;
            if (this.check() == 1) {
                this.winner = 1;
            } else {
                this.winner = -1;
            }
        }
        if (this.checkDraw()) {
            this.ended = true;
        }
    }

    renderTitle() {
        var ans = "4 en línea";
        ans += "  -  :blue_circle: ";
        ans += this.a;
        ans += " vs "
        ans += this.b;
        ans += " :red_circle:"
        if (this.ended) {
            ans += "  -  ";
            if (this.winner == 1) {
                ans += ":blue_circle:" + this.a + " ganó!"
            } else if (this.winner == -1) {
                ans += ":red_circle:" + this.b + " ganó!"
            } else {
                ans += "Empate"
            }
        } else {
            if (this.turn == 1) {
                if (this.a !== "") {
                    ans += "  -  Turno de " + this.a + " :blue_circle:";
                }
            } else {
                if (this.b !== "") {
                    ans += "  -  Turno de " + this.b + " :red_circle:";
                }
            }
        }
        return ans;
    }
}

let Games = {
  C4,
}

module.exports = Games;