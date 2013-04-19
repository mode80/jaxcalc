/* TODO
  - fix renderData back to separate passes for ellipses
  - make the subtract animation  (drag offscreen while top pieces fall into the 'hole' of the bottom)
  - numbers don't fit in horizontal orientation 
  - handle decimals
  - need method to enter digit zero
  - deal with yuckiness of "offscreen" lines not combining in the right place 
  - make the subtract gesture be drag offscreen
  - make multiply gesture (?)
  - make multiply animation
  - divide
*/

/// <reference path="d3.d.ts" />
/// <reference path="sugar.d.ts" />
/// <reference path="custom.d.ts" />

module calcsand {  // expression related vars
  var term1 = "", term2 = ""
  var operator = ""
  var answer = ""
  var separator = "" 
  var equals = "" 

  // rendering related vars
  var line_data:Object[] = []
  var ellipse_data:Object[] = []

  // valid input "enum"
  var INPUT = {
    0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5',
    6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    DECIMAL: '.', ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/',
    EQUALS: '=', CLEAR: 'c', SEPARATE: '|', BACKSPACE: 'b',
  }

  // some module vars
  var long_side = 1024, short_side = 768 
  var multitap_ms = 500 // milliseconds before consecutive taps are not considered a multitap gesture 
  var multitap_count = 0 // recorded number of taps in latest mutiltap gesture 
  var multitap_timer_id = 0 // the currently active multitap detection timer
  var last_touchend_time = 0 // time of last touchend event
  var win = <any>window // loosely typed window object for access to newish safari goodies
  var body = document.getElementsByTagName('body')[0]
  var start_touches = []

  // dimension vars
  var digit_w, digit_h 
  var digit_x_margin , digit_y_margin 
  var svg_half_w , svg_half_h 
  var digit_half_w , digit_half_h 
  var digit_full_w , digit_full_h 
  var digit_half_full_w , digit_half_full_h 
  var svg_w = short_side, svg_h = long_side 
  var display_x, display_y

  // d3 element selection vars
  var svg = d3.select('svg')
  var txt = svg.append('text')
  var debug = svg.append('text')


  main() // lets do this

  function main() {
    
    // extend default objects with sugar
      Object.extend()

    // setup drawing space
      onOrientationChange()

    // attach events
      win.onorientationchange = onOrientationChange
      win.onkeypress = onKeyPress
      win.ontouchstart = onTouchStart
      win.ontouchmove = onTouchMove
      win.ontouchend = onTouchEnd

  }

  function onOrientationChange() {
    var degrees_turned = win.orientation || 0

    if (degrees_turned == 0 || degrees_turned == 180) {
      svg_w = short_side; svg_h = long_side
    } else {
      svg_w = long_side; svg_h = short_side
    }

    //svg.attr('viewBox', '0 0 ' + svg_w + ' ' + svg_h)
    //svg.attr('preserveAspectRatio', 'none')
    svg.attr({ width: svg_w, height: svg_h })
 
    // reposition elements
    resizeDigits()
    recenterDisplayXYs()
    debug.attr({ x: svg_w / 2, y: svg_h * 0.955 })
    txt.attr({ x: svg_w / 2, y: svg_h * 0.055 })
    window.scrollTo(0, 1);
    renderData()
    remakeBorder()
  }

  function onKeyPress(e) {
    // translate keystrokes into generic input
    var char_code = e.which 
    var char = String.fromCharCode(char_code)
    var input = ""
    if (isDigit(char)) input = char
    if (isOperator(char)) input = char
    if (char_code == 13 || char == '=') input = INPUT.EQUALS
    if (char == 'b') input = INPUT.BACKSPACE
    if (char == 'c') input = INPUT.CLEAR
    if (char == '|') input = INPUT.SEPARATE
    processInput(input)
  }

  function onTouchStart(e) {

    e.preventDefault() 

    var len = e.changedTouches.length
    while (len--) {
      var id = e.changedTouches[len].identifier
      start_touches[id] = e.changedTouches[len].clone()
      start_touches[id].timestamp = Date.now()
    }

    touchLines(e.touches).enter()
      .append("line")
      .attr("class", "touch")
      .attr("x1", function (d) { return d.clientX })
      .attr("y1", function (d) { return d.clientY })
      .attr("x2", function (d) { return d.clientX })
      .attr("y2", function (d) { return d.clientY })
      .style("fill", "none")
      .transition().ease("elastic")
        .attr("stroke-width", Math.max(svg_h,svg_w)/10)
        .attr("opacity", 0.2)
  }

  function onTouchMove(e) {

    e.preventDefault()

    touchLines(e.touches)
      .attr("x1", function (d) { return d.clientX })
      .attr("y1", function (d) { return d.clientY })
      .attr("x2", function (d) { return d.clientX })
      .attr("y2", function (d) { return d.clientY })

  }

  function onTouchEnd(e) {

    e.preventDefault()

    var scale_min = 0.05
    var swipe_min = long_side * scale_min 
    var still_touching_count = e.touches.length
    var exit_lines = touchLines(e.touches).exit() // the lines no longer being touched 
    var released_count = exit_lines[0].length
    var this_touch:Touch = e.changedTouches[0]

    if (still_touching_count > 0) return // do nothing until all fingers are released 

    exit_lines.classed('touch', null) // undesignate touch lines so they can be used for digit rendering

    if (released_count == 0 ) return // why's this here ? can't remember

    if (released_count == 2) { // two fingers.. possibly a pinchy gesture

      var first = 0, second = 1
      var point1_id = exit_lines.data()[first]['identifier']
      var point2_id = exit_lines.data()[second]['identifier']

      var hypotenuse1 = hypotenuse( 
        start_touches[point1_id].clientX, start_touches[point1_id].clientY,
        start_touches[point2_id].clientX, start_touches[point2_id].clientY ) 
      var hypotenuse2 = hypotenuse(
        exit_lines.data()[first]['clientX'], exit_lines.data()[first]['clientY'],
        exit_lines.data()[second]['clientX'], exit_lines.data()[second]['clientY'] )
      
      // PINCH to add 
      if (hypotenuse1-hypotenuse2 > swipe_min ) { processOut(INPUT.ADD); return }

      // UNPINCH to subtract
      if (hypotenuse2-hypotenuse1 > swipe_min ) { processOut(INPUT.SUBTRACT); return }
    }

    else if (released_count == 1) { // was just one finger 

      var verti_travel = this_touch.clientY - start_touches[this_touch.identifier].clientY
      var hori_travel = this_touch.clientX - start_touches[this_touch.identifier].clientX

      if (Math.abs(verti_travel) >= Math.abs(hori_travel)) {

      // SWIPE UP to separate 
        if (verti_travel < -swipe_min) { processOut(INPUT.SEPARATE); return }

      // SWIPE DOWN for clear
        if (verti_travel > swipe_min) { processOut(INPUT.CLEAR); return }

      } else {

      // SWIPE RIGHT for equals
        if (hori_travel > swipe_min) { processOut(INPUT.EQUALS); return }

      // SWIPE LEFT for backspace 
        if (hori_travel < -swipe_min) { processOut(INPUT.BACKSPACE); return }
      }

    // MULTITAP for digit input 
      /* 
      var elapsed_ms = Date.now() - last_touchend_time
      last_touchend_time = Date.now()
      clearTimeout(multitap_timer_id) // clear any in progress 
      multitap_timer_id = setTimeout( afterDelay, multitap_ms )
      if (elapsed_ms < multitap_ms && elapsed_ms > 0) { multitap_count++; return }
      multitap_count = 1
      function afterDelay() { processOut(multitap_count + '') } 
      */

    } // end if just one finger

    // PURE RELEASE for digit input
    for (var i = 0; i < (released_count + '').length; i++)
      processOut((released_count + '').substr(i, 1))

    function processOut(input: string) {
      exit_lines.classed('touch', null) // undesignate touch lines so they can be used for digit rendering
      processInput(input)
    }
      
  } // end onTouchEnd

  function touchLines(touch_list) {
    return svg.selectAll("line.touch")
      .data(touch_list, (d, i) => { return d.identifier })
  }

  function resizeDigits(digits_high=0,digits_wide=0) {
    digits_wide = digits_wide || (answer.length? 1 : term2.length ? 2 : 1) 
    digits_high = digits_high || ((answer.length || Math.max(term1.length, term2.length)) +1)
    digit_w = svg_w / digits_high 
    digit_h = svg_h / digits_wide
    digit_x_margin = 0 
    digit_y_margin = digit_h * 0.05 
    digit_w -= digit_x_margin * 2 
    digit_h -= digit_y_margin * 2 
    digit_w = Math.min(digit_w, digit_h) 
    digit_h = Math.min(digit_w, digit_h) 
    svg_half_w = svg_w / 2 
    svg_half_h = svg_h / 2 
    digit_half_w = digit_w / 2 
    digit_half_h = digit_h / 2 
    digit_full_w = digit_w + (digit_x_margin*2) 
    digit_full_h = digit_h + (digit_y_margin*2)
    digit_half_full_w = digit_full_w / 2
    digit_half_full_h = digit_full_h / 2 
  }
  
  function recenterDisplayXYs() {
    var digits_wide = Math.max(term1.length, term2.length) ;
    var digits_high = 1
    if (term2.length) digits_high = 2
    if (term1.length && operator.length) digits_high = 2
    if (term1.length && separator.length) digits_high = 2
    if (answer.length) { digits_wide = answer.length; digits_high = 1 } 
    display_x = Math.round(svg_half_w - (digits_wide * digit_half_w) )
    display_y = Math.round(svg_half_h - (digits_high * digit_half_h) )
  }

  function remakeBorder() {
    d3.selectAll('rect').remove()
    var border_size = svg_h*0.02
    svg.append('rect').attr({ 'class': 'border', x: 0, y: 0, width: svg_w, height: border_size })
    svg.append('rect').attr({ 'class': 'border', x: 0, y: svg_h-border_size, width: svg_w, height: border_size})
    svg.append('rect').attr({ 'class': 'border', x: 0, y: 0, width: border_size, height: svg_h })
    svg.append('rect').attr({ 'class': 'border', x: svg_w - border_size, y: 0, width: border_size, height: svg_h })
  }

  export function processInput(input: string /** INPUT enum **/) {
    // an expression is complete upon a term1, separator, term2 and operator 

    // CLEAR
    if (input == INPUT.CLEAR ) { 
      resetToStart()
    }
    // BACKSPACE
    if (input == INPUT.BACKSPACE  ) {
      if (answer.length) { processInput(INPUT.CLEAR); return} // for an answer, treat backspace like clear
      if (term2.length) term2 = term2.slice(0, -1)
      else if (term1.length) term1 = term1.slice(0,-1)
      else if (operator.length) operator = "" 
      else if (separator.length) separator= "" 
    }
    // DIGIT
    if (isDigit(input)) { 
      if (answer.length) resetToStart() // autoclear on first digit after former answer
      if (separator.length) { term2 += input } else { term1 += input }
    }
    // SEPARATOR
    if (input == INPUT.SEPARATE) {
      if (answer.length) answerToTerm1() 
      separator = INPUT.SEPARATE
    }
    // OPERATOR 
    if (isOperator(input)) {
      operator = input
      if (answer.length) answerToTerm1() 
      if (term1.length && term2.length && operator.length && answer.length == 0) { 
        // in the case where all is collected but no answer, imply equals 
        equals = INPUT.EQUALS
      }
      else if (term1.length) { 
        // if we had just a term1, and now an operator, supply all the rest and wait for term2
        separator = INPUT.SEPARATE
        if (term2.length) equals = INPUT.EQUALS
      }
    }
    // EQUALS
    if (input == INPUT.EQUALS) {
      equals = INPUT.EQUALS
    }
    // ANSWER (is ready to be found)
    if (term1.length && operator.length && term2.length && equals.length) {
      findAnswer()
    }

    showExpression()

    function answerToTerm1() { // in the case where previous answer is in play, use that as term1 of a fresh expression
        var temp = answer
        resetToStart()
        operator = input
        term1 = temp 
    }

  }

  function findAnswer() {
    try {
      answer = eval(term1 + operator + term2) + ""
    } catch (e) {
      answer = "" 
    }
  }
  
  function resetToStart() {
    term1 = ""; term2 = ""
    operator = ""; separator = "" 
    equals = "";  answer = "";
    line_data = []; ellipse_data = []
  }

  function showExpression() {
    updateText() 
    if (operator == '-' && answer.length) {//animate subtraction answer a bit differtly than others
      //resizeDigits(2)
      makeRenderingData(answer, term2)
      renderData(1000, 0)
      resizeDigits()
      recenterDisplayXYs()
      makeRenderingData(answer)
      renderData(1000, 1000)
    } else {
      resizeDigits()
      recenterDisplayXYs()
      makeRenderingData(term1, term2, answer)
      renderData(1000, 0)
    }
  }

  function updateText() {
    var exp = ''
    exp += term1 + '' 
    exp += (operator + term2 + '' ? operator || '_' : separator + term2 + '' ? INPUT.SEPARATE : '') 
    exp += (operator + term2 + '' ? term2 || '_' : '')
    exp += equals + ''
    exp += (equals? answer + '' || '_' : '')
    txt.text(exp)
  }

  function renderData(duration=250, after_delay=0) {

    var lines = svg.selectAll('line').data(line_data)
    var ellipses = svg.selectAll('ellipse').data(ellipse_data)
    var i = 2

    while (i--) { // for each shape type

      var shapes = [lines, ellipses][i]

      shapes
        .transition().duration(duration).delay(after_delay)
        .attr('x1', (d) => { return d.x1 })
        .attr('x2', (d) => { return d.x2 })
        .attr('y1', (d) => { return d.y1 })
        .attr('y2', (d) => { return d.y2 })
        .attr('opacity', (d) => { return d.o })
        .attr('stroke-width', (d) => { return d.w })
        .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ') scale(' + d.s + ')' })

      shapes
        .enter()
        .append('line')
        .attr('x1', (d) => { return d.x1 })
        .attr('x2', (d) => { return d.x2 })
        .attr('y1', (d) => { return d.y1 })
        .attr('y2', (d) => { return d.y2 })
        .attr('opacity', (d) => { return d.o })
        .attr('stroke-width', (d) => { return d.w })
        .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ') scale(' + d.s + ')' })

      shapes
        .exit()
        .transition().duration(duration).delay(after_delay)
        .attr('opacity', (d) => { return 0 })
        .attr('stroke-width', (d) => { return 0 })
        .attr('x1', (d) => { return (d.x1+d.x2)/2 })
        .attr('x2', (d) => { return (d.x1+d.x2)/2 })
        .attr('y1', (d) => { return (d.x1+d.x2)/2 })
        .attr('y2', (d) => { return (d.x1+d.x2)/2 })

      setTimeout(() => { shapes.exit().remove() }, after_delay*2)

    } // end shape type loop
  } // end function

  function makeRenderingData(given_top="",given_bottom="",given_middle="") {
    // uses given digit strings to builds arrays of svg attributes for later rendering 
    // pass parameter indicates which stage of a multi-stage animation this data is for, starting at 0

    // reset the data arrays we're (re)building 
    line_data = []
    ellipse_data = []

    // set up local copies and pad shortest term to keep same-significant digits in sync
    var top=given_top, bottom=given_bottom, middle=given_middle, parts=[]
    top = Array(Math.max(bottom.length - top.length + 1, 0)).join(" ") + (top+ "")
    bottom = Array(Math.max(top.length - bottom.length + 1, 0)).join(" ") + (bottom+ "")
    if (middle != "") parts = [middle]; else parts = [top,bottom]

    // prep some other vars
    var max_digits = Math.max(top.length,bottom.length,middle.length) 
    var digit_i = max_digits // this will count down
    var digit_inc = 0  // this will count up
    var multiplier = 1 // this could go up to 10 after 1st digit for more intuitive line group animation
    var line_w = Math.round(digit_w * 0.05) // line width is a percentage of digit width 
    
    // take each digit from each part in turn
    while (digit_i--) { // loop through each digit, starting with least significant 
      digit_inc++
      var part_i = parts.length 
      while (part_i--) { // loop (backwards) through each term
        var digit = parts[part_i].substr(digit_i,1)
        var mult_i = multiplier
        while (mult_i-- > 0) { // loop for 'extra' copies of digits in 10s place 100s place etc.
          var y_extra_offset = line_w *3 
          var y_offset = display_y + Math.round( (digit_full_h * (part_i) ) - (mult_i * y_extra_offset) )
          if (y_offset < -svg_half_h) { // don't bother with lines that'd render off screen
              mult_i = Math.floor((-svg_half_h - display_y -(digit_full_h * part_i) ) / -y_extra_offset) // solve for the mult_i that doesn't render offscreen
              y_offset = display_y + Math.round( (digit_full_h * (part_i) ) - (mult_i * y_extra_offset) )
          }
          var x_offset = display_x + Math.round( (digit_full_w * digit_i) + (digit_full_w/2 * mult_i/multiplier ) )
          var opacity = (mult_i > 0 ) ? 0.1 : 1 
          var scale = (1 - mult_i / multiplier).toFixed(2)
          switch (digit) {
            case "", " ":
              break
            case ".":
              ellipse_data.unshift({ cx: x(50), cy: y(99), rx: x(1), ry: y(1), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "0":
              ellipse_data.unshift({ cx: x(50), cy: y(50), rx: x(1), ry: y(1), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "1":
              line_data.unshift({ x1: x(50), y1: y(00), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "2":
              line_data.unshift({ x1: x(80), y1: y(00), x2: x(20), y2: y(93), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(23), y1: y(99), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "3":
              line_data.unshift({ x1: x(20), y1: y(00), x2: x(75), y2: y(44), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(73), y1: y(50), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(75), y1: y(56), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "4":
              line_data.unshift({ x1: x(20), y1: y(00), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(00), x2: x(80), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "5":
              line_data.unshift({ x1: x(80), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(95), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(75), y1: y(99), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "6":
              line_data.unshift({ x1: x(80), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(94), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(75), y1: y(99), x2: x(25), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(20), y1: y(94), x2: x(20), y2: y(55), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "7":
              line_data.unshift({ x1: x(20), y1: y(25), x2: x(20), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(25), y1: y(00), x2: x(76), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(06), x2: x(35), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(70), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(75), y1: y(75), x2: x(25), y2: y(75), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(20), y1: y(70), x2: x(20), y2: y(55), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "8":
              line_data.unshift({ x1: x(75), y1: y(30), x2: x(55), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(55), y1: y(00), x2: x(75), y2: y(20), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(45), y1: y(50), x2: x(25), y2: y(30), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(25), y1: y(20), x2: x(45), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(25), y1: y(61), x2: x(75), y2: y(61), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(66), x2: x(80), y2: y(94), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(75), y1: y(99), x2: x(25), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(20), y1: y(94), x2: x(20), y2: y(66), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
            case "9":
              line_data.unshift({ x1: x(75), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(45), x2: x(80), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(54), y1: y(05), x2: x(70), y2: y(22), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(70), y1: y(28), x2: x(54), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(48), y1: y(45), x2: x(31), y2: y(28), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(31), y1: y(22), x2: x(48), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w, s: scale })
              break
          } // end switch

        } // end mult_i loop

      } // end part_i loop

      multiplier = Math.pow(10,digit_inc)

    } // end digit_i loop 

  } // end function 

  function x(d) { return Math.round(d * digit_w/100) } // scales widths of 0-100 to pixels
  function y(d) { return Math.round(d * digit_h/100) } // scales heights of 0-100 to pixels

  function isDigit(char: string): bool { return ("1234567890.".indexOf(char) >= 0) }
  function isOperator(char: string): bool { return ("*-+/".indexOf(char) >= 0) }

  function hypotenuse(x1,y1,x2,y2){return Math.sqrt(Math.pow(x2-x1,2)+Math.pow(y2-y1,2))} // diagonal distance between two point cooridnates

} // end module
