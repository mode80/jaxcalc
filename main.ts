﻿/// <reference path="d3.d.ts" />

module calcsand {

  // expression related vars
  var eval_me = ""
  var term1 = "", term2 = ""
  var operator = ""
  var answer = ""
  var after_operator = false

  // rendering related vars
  var lines:Object[] = []
  var ellipses:Object[] = []

  // valid input "enum"
  var INPUT = {
    0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    DECIMAL: '.',
    ADD: '+',
    SUBTRACT: '-',
    MULTIPLY: '*',
    DIVIDE: '/',
    EQUALS: '=',
    CLEAR: 'c',
  }

  // dimension vars
  var svg_w = 1000 , svg_h = 750 
  var digit_w, digit_h 
  var digit_x_margin , digit_y_margin 
  var svg_half_w , svg_half_h 
  var digit_half_w , digit_half_h 
  var digit_full_w , digit_full_h 
  var stroke_rule
    
  // d3 selection vars
  var body = d3.select('body')
  var svg = body.append('svg').attr({ width: svg_w, height: svg_h })
  var display = svg.append('g').attr({ 'class': 'display', height: 1, width: 1 })
  var sheet:any = document.styleSheets[0]

  main()

  function main() {
    
    // set up the drawing area
      recenterDisplay()
      resizeDigits()

    // attach events
      body.on('keypress', onKeyPress)

  }

  function recenterDisplay(duration=0) {
    var digits_wide = Math.max(term1.length, term2.length)
    var digits_high = term2.length ? 2 : 1
    if (answer.length) { digits_wide = answer.length; digits_high = 1 }
    var x_offset = Math.round( svg_half_w - ( digits_wide * digit_half_w ) )
    var y_offset = Math.round( svg_half_h - (digits_high * digit_half_h) - (digits_high - 1) * digit_y_margin )
    display
      .transition()
      .duration(duration)
      .attr('transform', 'translate(' + x_offset + ',' + y_offset + ')')
  }

  function resizeDigits() {
    digit_w = svg_w / Math.max(term1.length+1, term2.length+1, answer.length+1)  
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
    processInput(input)
  }

  function processInput(input: string /** INPUT enum **/) {
    if (input == INPUT.CLEAR || (isDigit(input) && answer.length) ) {
      resetToStart()
      showStart()
    }
    if (isDigit(input)) {
      if (answer.length) resetToStart()
      if (after_operator) {term2 += input} else { term1 += input }
      showTerms()
    }
    else if (isOperator(input)) {
      if (answer) { // there exists a previous answer we're operating on
        var prev_answer = answer
        resetToStart()
        term1 = prev_answer
        showTerms()
        operator = input
        after_operator = true
      }
      else if (after_operator && term2.length) { // they have everything to hit equals but hit operator instead
        findAnswer()
        showAnswer()
        term1 = answer
        term2 = "" 
        answer = ""
        operator = input
        after_operator = true
        showTerms()
      } else {
        operator = input
        after_operator = true
      }
     showOperator(input)
    }
    else if (input == INPUT.EQUALS) {
      findAnswer()
      showAnswer()
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
    operator = ""; after_operator = false
    eval_me = "";
    lines = []; ellipses = []
    answer = ""; 
  }

  function showStart() {
    svg.selectAll('line').remove()
    svg.selectAll('ellipse').remove()
  }

  function showTerms() {

    // reset digit sizing 
      resizeDigits()
    // regenerate line data for term array 
      makeRenderingData(term1, term2)
    // rerender new data
      renderData()
      recenterDisplay()
  }

  function showOperator(input: string) {
    recenterDisplay()
  }

  function showAnswer() {
    resizeDigits()
    makeRenderingData(answer) 
    recenterDisplay(1000)
    renderData(1000)
  }

  function renderData(duration=0) {
    var svg_lines = display.selectAll('line').data(lines)
    svg_lines 
      .transition()
      .duration(duration)
      .attr('x1', (d) => { return d.x1 })
      .attr('x2', (d) => { return d.x2 })
      .attr('y1', (d) => { return d.y1 })
      .attr('y2', (d) => { return d.y2 })
      .attr('opacity', (d) => { return d.o })
      .attr('stroke-width', (d) => { return d.w })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    svg_lines 
      .enter()
      .append('line')
      .attr('x1', (d) => { return d.x1 })
      .attr('x2', (d) => { return d.x2 })
      .attr('y1', (d) => { return d.y1 })
      .attr('y2', (d) => { return d.y2 })
      .attr('opacity', (d) => { return d.o })
      .attr('stroke-width', (d) => { return d.w })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    svg_lines 
      .exit()
      .remove()
    var svg_ellipses = display.selectAll('ellipse').data(ellipses)
    svg_ellipses 
      .transition()
      .duration(duration)
      .attr('cx', (d) => { return d.cx })
      .attr('cy', (d) => { return d.cy })
      .attr('rx', (d) => { return d.rx })
      .attr('ry', (d) => { return d.ry })
      .attr('opacity', (d) => { return d.o })
      .attr('stroke-width', (d) => { return d.w })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    svg_ellipses 
      .enter()
      .append('ellipse')
      .attr('cx', (d) => { return d.cx })
      .attr('cy', (d) => { return d.cy })
      .attr('rx', (d) => { return d.rx })
      .attr('ry', (d) => { return d.ry })
      .attr('opacity', (d) => { return d.o })
      .attr('stroke-width', (d) => { return d.w })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    svg_ellipses 
      .exit()
      .remove()
   }

  function makeRenderingData(part1="", part2="") {
    // takes expression parts (e.g. term1, term2, answer) and builds arrays of svg data for later rendering 

    // reset globals 
    lines = []
    ellipses = []
    
    // pad shortest term with spaces to keep same-significant digits in sync
    part1 = Array(Math.max(part2.length - part1.length + 1, 0)).join(" ") + (part1 + "")
    part2 = Array(Math.max(part1.length - part2.length + 1, 0)).join(" ") + (part2 + "")

    // package parts for rendering into an array that we can iterate over
    var parts = [part1,part2]

    // prep some other vars
    var digit_inc = 0  // this will count up
    var max_digits = Math.max(part1.length,part2.length)
    var digit_i = max_digits // this will count down
    var multiplier = 1 // this goes up to 10 after 1st digit
    var width = Math.round(digit_w * 0.05) 
    
    // take each digit from each part in turn
    while (digit_i--) { // loop through each digit, starting with least significant 
      digit_inc++
      var part_i = parts.length 
      var opacity = 1 //Math.max(digit_inc / max_digits , 0.1)
      while (part_i--) { // loop (backwards) through each term
        var digit = parts[part_i].substr(digit_i,1)
        var x_offset = Math.round( (digit_full_w * digit_i ) )
        var y_offset = Math.round( (digit_full_h * part_i  ) )
        var mult_i = multiplier
        while (mult_i--) {
          switch (digit) {
            case "", " ":
              break
            case ".":
              ellipses.unshift({ cx: x(50), cy: y(99), rx: x(1), ry: y(1), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "0":
              ellipses.unshift({ cx: x(50), cy: y(50), rx: x(40), ry: y(40), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "1":
              lines.unshift({ x1: x(50), y1: y(00), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "2":
              lines.unshift({ x1: x(80), y1: y(00), x2: x(20), y2: y(93), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(23), y1: y(99), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "3":
              lines.unshift({ x1: x(20), y1: y(00), x2: x(75), y2: y(44), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(73), y1: y(50), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(75), y1: y(56), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "4":
              lines.unshift({ x1: x(20), y1: y(00), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(00), x2: x(80), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "5":
              lines.unshift({ x1: x(80), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(95), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(75), y1: y(99), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "6":
              lines.unshift({ x1: x(80), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(94), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(75), y1: y(99), x2: x(25), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(20), y1: y(94), x2: x(20), y2: y(55), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "7":
              lines.unshift({ x1: x(20), y1: y(25), x2: x(20), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(25), y1: y(00), x2: x(76), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(06), x2: x(35), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(55), x2: x(80), y2: y(70), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(75), y1: y(75), x2: x(25), y2: y(75), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(20), y1: y(70), x2: x(20), y2: y(55), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "8":
              lines.unshift({ x1: x(75), y1: y(30), x2: x(55), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(55), y1: y(00), x2: x(75), y2: y(20), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(45), y1: y(50), x2: x(25), y2: y(30), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(25), y1: y(20), x2: x(45), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(25), y1: y(61), x2: x(75), y2: y(61), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(66), x2: x(80), y2: y(94), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(75), y1: y(99), x2: x(25), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(20), y1: y(94), x2: x(20), y2: y(66), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
            case "9":
              lines.unshift({ x1: x(75), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(45), x2: x(80), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(54), y1: y(05), x2: x(70), y2: y(22), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(70), y1: y(28), x2: x(54), y2: y(45), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(48), y1: y(45), x2: x(31), y2: y(28), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(31), y1: y(22), x2: x(48), y2: y(05), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              lines.unshift({ x1: x(80), y1: y(55), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset, o: opacity, w: width })
              break
          } // end switch

        } // end mult_i loop

      } // end part_i loop

      multiplier = 10

    } // end digit_i loop 

    part1 = part1.trim()
    part2 = part2.trim()

  } // end function 

  function x(d) { return Math.round(d * digit_w/100) }
  function y(d) { return Math.round(d * digit_h/100) }

  function isDigit(char: string): bool { return ("1234567890.".indexOf(char) >= 0) }
  function isOperator(char: string): bool { return ("*-+/".indexOf(char) >= 0) }


} // end module