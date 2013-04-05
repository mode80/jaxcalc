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
    0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    DECIMAL: '.', ADD: '+', SUBTRACT: '-', MULTIPLY: '*', DIVIDE: '/', EQUALS: '=', CLEAR: 'c',
    SEPARATE: '|',
  }

  // dimension vars
  var digit_w, digit_h 
  var digit_x_margin , digit_y_margin 
  var svg_half_w , svg_half_h 
  var digit_half_w , digit_half_h 
  var digit_full_w , digit_full_h 
  var stroke_rule  
  var long_side = 1024, short_side = 768 
  var svg_w = short_side, svg_h = long_side 
  var display_x, display_y

  // d3 selection vars
  var body = d3.select('body') 
  var svg = body.select('svg')
  var txt = svg.append('text')
  var debug = svg.append('text')

  // other module level vars
  var lastTouchEndTime = 0 
  

  main() // lets do this

  function main() {
    
    // extend default objects with sugar
      Object.extend()

    // setup drawing space
      onOrientationChange()

    // attach events
      ;(<any>window).onorientationchange =  onOrientationChange
      body.on('keypress', onKeyPress) 
      body.on('touchstart', onTouchStart) 
         .on('touchmove', onTouchMove)   
         .on('touchend', onTouchEnd)

  }

  function onOrientationChange() {
    var degrees_turned = (<any>window).orientation || 0

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
    debug.attr({ x: svg_w / 2, y: svg_h * 0.055 })
    txt.attr({ x: svg_w / 2, y: svg_h * 0.055 })
    window.scrollTo(0, 1);
    renderData()
    remakeBorder()
  }

  function onKeyPress() {
    // translate keystrokes into generic input. gestures etc will come later
    var char_code = (<any>d3.event).which
    var char = String.fromCharCode(char_code)
    var input = ""
    if (isDigit(char)) input = char
    if (isOperator(char)) input = char
    if (char_code == 13 || char == '=') input = INPUT.EQUALS
    if (char == 'c') input = INPUT.CLEAR
    if (char == '|') input = INPUT.SEPARATE
    processInput(input)
  }

  var start_touches = []
  function onTouchStart() {

    d3.event.preventDefault()

    start_touches[d3.event.changedTouches[0].identifier] = d3.event.changedTouches[0].clone()

    touchLines().enter()
      .append("line")
      .attr("class", "touch")
      .attr("x1", function (d) { return d[0]})
      .attr("y1", function (d) { return d[1] })
      .attr("x2", function (d) { return d[0] })
      .attr("y2", function (d) { return d[1] })
      .style("fill", "none")
      .transition().ease('elastic')
        .attr("stroke-width", Math.max(svg_h,svg_w)/10)
        .attr("opacity", 0.2)
        .attr("x1", function (d) { return d[0] })
        .attr("y1", function (d) { return d[1] })
        .attr("x2", function (d) { return d[0] })
        .attr("y2", function (d) { return d[1] })
  }

  function onTouchMove() {

    d3.event.preventDefault()
    
    touchLines()
      .attr("x1", function (d) { return d[0] })
      .attr("y1", function (d) { return d[1] })
      .attr("x2", function (d) { return d[0] })
      .attr("y2", function (d) { return d[1] })

  }

  function onTouchEnd() {

    d3.event.preventDefault()
   
    var swipe_min = long_side * 0.10
    var touches = touchArray()
    var still_touching_count = touches.length
    var exit_lines = touchLines().exit() // the lines no longer being touched 
    lastTouchEndTime = Date.now()

    // PINCH to add
    if (d3.event.scale < 0.5) { processInput(INPUT.ADD); return }

    // UNPINCH to subtract
    if (d3.event.scale > 1.5) { processInput(INPUT.SUBTRACT); return }
 
    if (still_touching_count == 0) { // all have been released
      var released_count = exit_lines[0].length
      var this_touch:Touch = d3.event.changedTouches[0]
      exit_lines.classed('touch', null)

      if (released_count == 0 ) return

      if (released_count == 1) { // just one finger 

        // SWIPE VERTICLE to separate
        var verti_travel = Math.abs(this_touch.clientY - start_touches[this_touch.identifier].clientY)
        if (verti_travel > swipe_min) { processInput(INPUT.SEPARATE); return }

        // SWIPE RIGHT for equals
        var hori_travel = this_touch.clientX - start_touches[this_touch.identifier].clientX
        if (hori_travel > swipe_min) { processInput(INPUT.EQUALS); return }

        // SWIPE LEFT for clear
        if (hori_travel < -swipe_min) { processInput(INPUT.CLEAR); return }
      }

      // NO GESTURE
      if (released_count == 10) { // 10 fingers are special
        processInput('1'); processInput('0')
      } else { // use the released finger count as digit input
        processInput(released_count + '')
      }
    }

  }
   
  function touchArray() {
    return d3.touches(svg.node())
  }
  
  function touchLines() {
    return svg.selectAll("line.touch").data(touchArray(), (d,i) => { return d.identifier })
  }

  function resizeDigits() {
    digit_w = svg_w / ((answer.length || Math.max(term1.length, term2.length))+1) 
    digit_h = svg_h / (answer.length? 1 : term2.length ? 2 : 1) 
    digit_x_margin = 0 
    digit_y_margin = digit_h * 0.15 
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
    recenterDisplay()
  }
  
  function recenterDisplay() {
    var digits_wide = Math.max(term1.length, term2.length) ;
    var digits_high = term2.length ? 2 : 1 ;
    if (answer.length) { digits_wide = answer.length; digits_high = 1 } ;
    display_x = Math.round( svg_half_w - (digits_wide * digit_half_w) ) ;
    display_y = Math.round( svg_half_h - (digits_high * digit_half_h) - (digits_high - 1) * digit_y_margin ) 
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
    // DIGIT
    if (isDigit(input)) { 
      if (answer.length) resetToStart() // autoclear on first digit after former answer
      if (separator.length) { term2 += input } else { term1 += input }
    }
    // SEPARATOR
    if (input == INPUT.SEPARATE) {
      separator = INPUT.SEPARATE
    }
    // OPERATOR 
    if (isOperator(input)) {
      operator = input
      if (answer.length) { 
        // in the case where previous answer is in play, use that as term1 of a fresh expression
        var temp = answer
        resetToStart()
        operator = input
        term1 = temp 
      }
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
    var duration = 0 
    resizeDigits()
    if (answer.length) {
      makeRenderingData(answer)
      duration = 1000
    } else {
      makeRenderingData(term1, term2)
      duration = 0
    }
    renderData(duration)
    updateText() 
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

  function renderData(duration=250) {
    var lines = svg.selectAll('line').data(line_data)
    lines 
      .transition()
      .duration(duration)
      .attr('x1', (d) => { return d.x1 })
      .attr('x2', (d) => { return d.x2 })
      .attr('y1', (d) => { return d.y1 })
      .attr('y2', (d) => { return d.y2 })
      .attr('opacity', (d) => { return d.o })
      .attr('stroke-width', (d) => { return d.w })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    lines 
      .enter()
      .append('line')
      .attr('x1', (d) => { return d.x1 })
      .attr('x2', (d) => { return d.x2 })
      .attr('y1', (d) => { return d.y1 })
      .attr('y2', (d) => { return d.y2 })
      .attr('opacity', (d) => { return d.o })
      .attr('stroke-width', (d) => { return d.w })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    lines 
      .exit()
      .remove()
    var ellipses = svg.selectAll('ellipse').data(ellipse_data)
    ellipses 
      .transition()
      .duration(duration)
      .attr('cx', (d) => { return d.cx })
      .attr('cy', (d) => { return d.cy })
      .attr('rx', (d) => { return d.rx })
      .attr('ry', (d) => { return d.ry })
      .attr('opacity', (d) => { return d.o })
      .attr('stroke-width', (d) => { return d.w })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    ellipses 
      .enter()
      .append('ellipse')
      .attr('cx', (d) => { return d.cx })
      .attr('cy', (d) => { return d.cy })
      .attr('rx', (d) => { return d.rx })
      .attr('ry', (d) => { return d.ry })
      .attr('opacity', (d) => { return d.o })
      .attr('stroke-width', (d) => { return d.w })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    ellipses 
      .exit()
      .remove()
   }

  function makeRenderingData(part1="", part2="") {
    // takes expression parts (e.g. term1, term2, answer) and builds arrays of svg data for later rendering 

    // reset globals 
    line_data = []
    ellipse_data = []
    
    // pad shortest term with spaces to keep same-significant digits in sync
    part1 = Array(Math.max(part2.length - part1.length + 1, 0)).join(" ") + (part1 + "")
    part2 = Array(Math.max(part1.length - part2.length + 1, 0)).join(" ") + (part2 + "")

    // package parts for rendering into an array that we can iterate over
    var parts = [part1,part2]

    // prep some other vars
    var digit_inc = 0  // this will count up
    var max_digits = Math.max(part1.length,part2.length)
    var digit_i = max_digits // this will count down
    var multiplier = 1 // this could go up to 10 after 1st digit for more intuitive line group animation
    var line_w = Math.round(digit_w * 0.05) 
    
    // take each digit from each part in turn
    while (digit_i--) { // loop through each digit, starting with least significant 
      digit_inc++
      var part_i = parts.length 
      var opacity = 1 //digit_inc/max_digits / ((digit_inc>1)?10:1)
      while (part_i--) { // loop (backwards) through each term
        var digit = parts[part_i].substr(digit_i,1)
        var x_offset = display_x + Math.round( (digit_full_w * digit_i ) )
        var y_offset = display_y + Math.round( (digit_full_h * part_i  ) )
        var mult_i = multiplier
        while (mult_i--) {
          switch (digit) {
            case "", " ":
              break
            case ".":
              ellipse_data.unshift({ cx: x(50), cy: y(99), rx: x(1), ry: y(1), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "0":
              ellipse_data.unshift({ cx: x(50), cy: y(50), rx: x(1), ry: y(1), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "1":
              line_data.unshift({ x1: x(50), y1: y(00), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "2":
              line_data.unshift({ x1: x(80), y1: y(00), x2: x(20), y2: y(93), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(23), y1: y(99), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "3":
              line_data.unshift({ x1: x(20), y1: y(00), x2: x(75), y2: y(44), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(73), y1: y(50), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(75), y1: y(56), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "4":
              line_data.unshift({ x1: x(20), y1: y(00), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(00), x2: x(80), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "5":
              line_data.unshift({ x1: x(80), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(95), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(75), y1: y(99), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "6":
              line_data.unshift({ x1: x(80), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(94), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(75), y1: y(99), x2: x(25), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(20), y1: y(94), x2: x(20), y2: y(55), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "7":
              line_data.unshift({ x1: x(20), y1: y(25), x2: x(20), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(25), y1: y(00), x2: x(76), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(06), x2: x(35), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(70), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(75), y1: y(75), x2: x(25), y2: y(75), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(20), y1: y(70), x2: x(20), y2: y(55), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "8":
              line_data.unshift({ x1: x(75), y1: y(30), x2: x(55), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(55), y1: y(00), x2: x(75), y2: y(20), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(45), y1: y(50), x2: x(25), y2: y(30), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(25), y1: y(20), x2: x(45), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(25), y1: y(61), x2: x(75), y2: y(61), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(66), x2: x(80), y2: y(94), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(75), y1: y(99), x2: x(25), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(20), y1: y(94), x2: x(20), y2: y(66), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
            case "9":
              line_data.unshift({ x1: x(75), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(45), x2: x(80), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(54), y1: y(05), x2: x(70), y2: y(22), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(70), y1: y(28), x2: x(54), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(48), y1: y(45), x2: x(31), y2: y(28), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(31), y1: y(22), x2: x(48), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              line_data.unshift({ x1: x(80), y1: y(55), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: line_w })
              break
          } // end switch

        } // end mult_i loop

      } // end part_i loop

      // multiplier = 10

    } // end digit_i loop 

    part1 = part1.trim()
    part2 = part2.trim()

  } // end function 

  function x(d) { return Math.round(d * digit_w/100) }
  function y(d) { return Math.round(d * digit_h/100) }

  function isDigit(char: string): bool { return ("1234567890.".indexOf(char) >= 0) }
  function isOperator(char: string): bool { return ("*-+/".indexOf(char) >= 0) }


} // end module
