
(function($){

  $.fn.timeunit = function(options){

    //if(typeof options === 'string')

    options = $.extend({}, $.fn.timeunit.defaults, options);

    if(!$.fn.timeunit.time.initialized){

      $.fn.timeunit.time._create(options);
      $.fn.timeunit.time.initialized = true;
    }

    this.each(function() {
      $.fn.timeunit.time.attach(this, options);
    });

    return this;
  }

  $.fn.timeunit.time = new Timeunit();

  $.fn.timeunit.defaults = {
    max: {
      day: 30,
      hour: 23,
      minute: 59
    },
    min: {
      day: 0,
      hour: 0,
      minute: 0
    },
    controls: ['day', 'hour', 'minute']
  }

  function Timeunit(){

    this.showing = false;
    this.uuid = new Date().getTime();
    this.initialized = false;

  }

  //generate widget html
  Timeunit.prototype._generateHTML = function(options){

    var sliders = ['day', 'hour', 'minute'];

    var controls = '<div class="timeunit-widget ui-widget ui-widget-content ui-menu ui-corner-all">' +
                   '    <div class="ui-widget-header ui-helper-clearfix ui-corner-all">' +
                   '        <div class="ui-timeunit-title">Choose Duration</div>' +
                   '    </div>' +
                   '    <div class="timeunit-content">' +
                   '        <p class="value-text"></p> ';

    sliders.forEach(function(c){
        controls += '        <div>' +
                    '            <label>'+c+':</label>' +
                    '            <div class="slider" data-type="'+c+'"></div>' +
                    '        </div>'
    });

    controls +=  '    </div>' +
                 '    </div>' +
                 '</div>';

   return  controls;
  }

  //Create timepicker widget
  Timeunit.prototype._create =function(options){
    var self = this;
    var $div = this.$div = $(self._generateHTML(options)).appendTo('body').hide();

    $('.slider', $div).slider();
    $(document).on('mousedown.timeunit', $.proxy(this._checkExternalClick, this));

  }

  Timeunit.prototype._getInst = function(target){
    return $(target).data('timeunit');
  }

  Timeunit.prototype._selectTime = function(instance, type, val){

  }

  Timeunit.prototype._show = function(input){
    input = input.target || input;

    if (this._lastInput === input) {
      return;
    }

    var $input = $(input),
    inst = this._getInst(input),
    isFixed = false,
    pos;

    this._inst = inst;

    if (this._inst && this._inst !== inst) {
      this._inst.div.stop(true, true);
    }

    this._lastInput = input;
    this._setTimeFromField(inst);
    this._update(inst);

    $input.parents().each(function() {
      isFixed = $(this).css('position') === 'fixed';
      return !isFixed;
    });
    pos = $input.offset();
    pos.top += input.offsetHeight;
    pos.left -= isFixed ? $(document).scrollLeft() : 0;
    pos.top -= isFixed ? $(document).scrollTop() : 0;
    inst.div.css({
      position: (isFixed ? 'fixed' : 'absolute'),
      display: 'none',
      top: pos.top,
      left: pos.left,
      zIndex: this._zIndex(input) + 1
    });

    //hide a slider
    $('.slider', inst.div).each(function(idx, slider){
      var type = $(slider).data('type');
      var $elem = $(slider).parent();
      if(inst.options.controls.indexOf(type) == -1)
        $elem.hide();
      else
        $elem.show();
    });

    inst.div.fadeIn('fast');
    this.showing = true;
    inst.active = true;
  }

  Timeunit.prototype._hide = function(){
   var inst = this._inst;

   if (!inst || !this.showing) {
    return;
  }

  inst.div.fadeOut('fast');
  this._lastInput = null;
  this.showing = false;
  inst.active = false;

  }

  Timeunit.prototype._setTimeFromField = function(inst){
    var sliders = inst.sliders;
    var valObj = this.toValObj(inst.input.val());
    for(var key in sliders){
      $(sliders[key]).slider('value', valObj[key]);
    }
    inst.value = valObj;
    inst.$text.text(this.toString(inst));
  }

  Timeunit.prototype._setTime = function(inst){
    inst.input.val(this._format(inst.value));
  }

  Timeunit.prototype._update = function(){
    //set input value
  }

  Timeunit.prototype._format = function(value){
    var val = 0;

    if(value.day)
      val += value.day * 24 * 60 * 60
    if(value.hour)
      val += value.hour * 60 * 60
    if(value.minute)
      val += value.minute * 60

    return val;
  }

  Timeunit.prototype.toString = function(inst){
    var value = inst.value;
    var str = '';
    inst.options.controls.forEach(function(i){
      str += (value[i] + i + ' ');
    });
    return str;
    return value.day + 'Days ' + value.hour + 'Hours ' + value.minute + 'Minutes';
  }

  Timeunit.prototype.toValObj = function(sec){
    var delta = parseInt(sec, 10);
    // calculate (and subtract) whole days
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    // calculate (and subtract) whole hours
    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    // calculate (and subtract) whole minutes
    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    return {
      day: days,
      hour: hours,
      minute: minutes
    }
  }

  Timeunit.prototype._zIndex = function(elem){
    elem = $(elem);

    var position, value;

    while (elem.length && elem[ 0 ] !== document) {
      position = elem.css('position');
      if (position === 'absolute' || position === 'relative' || position === 'fixed') {
        value = parseInt(elem.css('zIndex'), 10);
        if (!isNaN(value) && value !== 0) {
          return value;
        }
      }
      elem = elem.parent();
    }

    return 0;
  }

  Timeunit.prototype._checkExternalClick =  function(event) {

    if (!this._inst) {
      return;
    }

    var $target = $(event.target),
    inst = this._getInst($target[0]);

    if ((!inst && !$target.closest('.timeunit-widget').length && this.showing) || (inst && this._inst !== inst)) {
      this._hide();
    }
  }

  Timeunit.prototype._handleSlide = function(e, ui, inst){

    if(!inst.active)
      return;

    var type = $(ui.handle).parent().data('type');
    inst.value[type] = ui.value;
    inst.$text.text(this.toString(inst));
    this._setTime(inst);
  }

  Timeunit.prototype.attach = function(target, options){
    var inst;
    var self = this;
    if (this._getInst(target)) {
      return;
    }

    if (!target.id) {
      this.uuid += 1;
      target.id = 'timeunit-input-' + this.uuid;
    }

    inst = {
      id: target.id,
      input: $(target),
      div: this.$div,
      $text: $('.value-text', this.$div),
      options: $.extend({}, options),
      value: {},
      sliders: {}
    };

    this._setTimeFromField(inst);
    this._setTime(inst);

    inst.input.data('timeunit', inst)
    .attr('autocomplete', 'off')
    .on('focus.timeunit', $.proxy(this._show, this))
    .on('blur.timeunit', $.proxy(this._stop, this))
    .on('keyup.timeunit', $.proxy(this._setTimeFromField, this, inst));

    $('.slider', this.$div).on('slide', function(e, ui){
      self._handleSlide(e, ui, inst);
    }).each(function(i, s){
      var type = $(s).data('type');
      inst.sliders[type] = s;
      $(s).slider('option', 'max', options.max[type]);
      $(s).slider('option', 'min', options.min[type]);
    })
  }

}(jQuery));