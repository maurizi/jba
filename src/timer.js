/**
 * @constructor
 * @implements {Serializable}
 */
JBA.Timer = function() {
  this.reset();
};

JBA.Timer.prototype = {
  /** @type {JBA.Memory} */
  memory: null,

  /* Internal clock of this timer */
  _clock: {
    tima: 0,
    div:  0
  },

  // See http://nocash.emubase.de/pandocs.htm#timeranddividerregisters
  div: 0,
  tima: 0,
  tma: 0,
  tac: 0,

  // TIMA cycle count
  _tima_speed: 256,

  reset: function() {
    this.div  = 0;
    this.tima = 0;
    this.tma  = 0;
    this.tac  = 0;
    this._clock.tima = 0;
    this._clock.div  = 0;
  },

  serialize: function(io) {
    io.wb(this.div);
    io.wb(this.tima);
    io.wb(this.tma);
    io.wb(this.tac);
    io.wb(this._clock.tima);
    io.wb(this._clock.div);
  },

  deserialize: function(io) {
    this.div  = io.rb();
    this.tima = io.rb();
    this.tma  = io.rb();
    this.tac  = io.rb();
    this._clock.tima = io.rb();
    this._clock.div  = io.rb();
  },

  /**
   * Called whenever the TAC register changes
   */
  update: function() {
    /* See step() function for timings */
    switch (this.tac & 0x3) {
      case 0x0: this._tima_speed = 256; break;
      case 0x1: this._tima_speed = 4;   break;
      case 0x2: this._tima_speed = 16;  break;
      case 0x3: this._tima_speed = 64;  break;
    }
  },

  // Details: http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-Timers
  step: function(ticks) {
    var clock = this._clock;
    clock.div += ticks;

    /* CPU runs on a 4,194,304 Hz clock, although the argument to this
       function runs at 1/4 that rate, so 1,048,576 Hz. The div register is a
       clock that runs at 16384 Hz, which is 1/64 the 1 MHz clock.

       The TAC register then controls the timer rate of the TIMA register. The
       value is controlled by 3 bits in TAC:

            Bit 2    - Timer Stop  (0=Stop, 1=Start)
            Bits 1-0 - Input Clock Select
                       00:   4096 Hz = 1/256 of 1 MHz
                       01: 262144 Hz = 1/4   of 1 MHz
                       10:  65536 Hz = 1/16  of 1 MHz
                       11:  16384 Hz = 1/64  of 1 MHz
       */

    /* Increment the DIV timer as necessary (1/64th the speed) */
    while (clock.div >= 64) {
      this.div = (this.div + 1) & 0xff;
      clock.div -= 64;
    }

    /* Increment the TIMA timer as necessary (variable speed) */
    var enabled = this.tac & 0x4;
    if (enabled) {
      clock.tima += ticks;
      while (clock.tima >= this._tima_speed) {
        this.tima++;
        if (this.tima >= 0xff) {
          this.tima = this.tma;
          this.memory._if |= JBA.INT.TIMER; /* Request a timer interrupt */
        }
        clock.tima -= this._tima_speed;
      }
    }
  }
};
