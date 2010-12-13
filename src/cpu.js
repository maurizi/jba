JBA.CPU = function() {
  this.registers = new Z80.Registers();

  this.reset();
};

JBA.CPU.prototype = {
  reset: function() {},

  exec: function() {
    var fun = Z80.map[this.memory.rb(this.registers.pc++)];
    this.registers.pc &= 0xffff;
    fun(this.memory, this.registers);
  }
};
