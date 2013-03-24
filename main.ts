﻿/// <reference path="d3.d.ts" />

module calcsand {

  // expression related vars
  var eval_me = ""
  var data = []
  var term = []; term[1] = "", term[2] = ""
  var operator = ""
  var answer = ""
  var after_operator = false

  // valid input "enum"
  var INPUT = {
    0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
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
  var display = svg.append('g').attr({ height: 1, width: 1 })
  var sheet:any = document.styleSheets[0]

  main()

  function main() {
    
    // set up the drawing area
      recenterDisplay()
      resizeDigits()

    // attach events
      body.on('keypress', onKeyPress)

  }

  function recenterDisplay(duration=250) {
    var digits_wide = Math.max(term[1].length, term[2].length)
    var digits_high = term[2].length ? 2 : 1
    if (answer.length) { digits_wide = answer.length; digits_high = 1 }
    var x_offset = svg_half_w - ( digits_wide * digit_half_w ) 
    var y_offset = svg_half_h - (digits_high * digit_half_h) - (digits_high - 1) * digit_y_margin 
    display
      .transition()
      .duration(duration)
      .attr('transform', 'translate(' + x_offset + ',' + y_offset + ')')
  }

  function resizeDigits() {
    digit_w = svg_w / Math.max(term[1].length+1, term[2].length+1, answer.length+1)  
    digit_h = svg_h / (answer.length? 1 : term[2].length ? 2 : 1) 
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
    resizeStroke(digit_w * 0.05)
  }

  function resizeStroke(width: number) { 
    if (typeof stroke_rule === "undefined") {
      var rule_num = sheet.insertRule('svg line {}', sheet.rules.length) 
      stroke_rule = sheet.rules[rule_num]
    }
    stroke_rule.cssText = 'svg line { stroke-width : ' + Math.floor(width) + '}'
    stroke_rule.style.strokeWidth = Math.max(1,Math.floor(width)) + "px"
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
      if (after_operator) {term[2] += input} else { term[1] += input }
      showTerms()
    }
    else if (isOperator(input)) {
      if (answer) {
        var prev_answer = answer
        resetToStart()
        term[1] = prev_answer
        showTerms()
      }
      operator = input
      after_operator = true
      showOperator(input)
    }
    else if (input == INPUT.EQUALS) {
      answer = eval(term[1]+operator+term[2]) + ""
      showAnswer()
    }
  }

  function resetToStart() {
    term[1] = ""; term[2] = ""
    operator = ""; after_operator = false
    eval_me = ""; data = []
    answer = ""; 
  }

  function showStart() {
    svg.selectAll('line').remove()
  }

  function showTerms() {

    // reset digit sizing 
      resizeDigits()
    // regenerate line data for term array 
      data = makeRenderingData(term)
    // rerender new data
      renderData(data)
      recenterDisplay()
  }

  function showOperator(input: string) {
    recenterDisplay()
  }

  function showAnswer() {
    resizeDigits()
    data = makeRenderingData(["",answer,""]) // TODO fix this ugly cludge
    recenterDisplay(1000)
    renderData(data,1000)
  }

  function renderData(data:{}[], duration:number=250) {
    var lines = display.selectAll('line').data(data)
    lines
      .transition()
      .duration(duration)
      .attr('x1', (d) => { return d.x1 })
      .attr('x2', (d) => { return d.x2 })
      .attr('y1', (d) => { return d.y1 })
      .attr('y2', (d) => { return d.y2 })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
    lines
      .enter()
      .append('line')
      .attr('x1', (d) => { return d.x1 })
      .attr('x2', (d) => { return d.x2 })
      .attr('y1', (d) => { return d.y1 })
      .attr('y2', (d) => { return d.y2 })
      .attr('transform', (d) => { return 'translate(' + d.xoff + ',' + d.yoff + ')' })
      //.attr('opacity', 0)
      //.transition()
      .attr('opacity', 1)
    lines
      .exit()
      .remove()
  }

  function makeRenderingData(term:string[]) {
      
    var data:any = []
 
    // make it easy to interchange push and unshift 
    data.grow = Array.prototype.unshift 

    // pad shortest term with spaces to keep same-significant digits in sync
    term[1] = Array(Math.max(term[2].length-term[1].length+1,0)).join(" ") + term[1]
    term[2] = Array(Math.max(term[1].length-term[2].length+1)).join(" ") + term[2]

    // take each digit from each term in turn
    var digit_inc = 0  // this will count up
    var digit_i = Math.max(term[1].length,term[2].length) // this will count down
    while (digit_i--) { // loop through each digit, starting with least significant 
      digit_inc++
      var term_i = term.length - 1 
      while (term_i--) { // loop (backwards) through each term
        var term_n = term_i+1 // term_i is a 0-based index whereas term_n is the 1-based ordinal
        var digit = term[term_n].substr(digit_i,1)
        var x_offset = (digit_full_w * (digit_i) )
        var y_offset = (digit_full_h * term_i) 
        switch (digit) {
          case "", " ":
            break
          case ".":
            data.grow({ x1: x(50), y1: y(100), x2: x(50), y2: y(100), xoff: x_offset, yoff: y_offset })
            break
          case "0":
            data.grow({ x1: x(50), y1: y(50), x2: x(50), y2: y(50), xoff: x_offset, yoff: y_offset })
            break
          case "1":
            data.grow({ x1: x(50), y1: y(00), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
          case "2":
            data.grow({ x1: x(80), y1: y(00), x2: x(20), y2: y(93), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(23), y1: y(99), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
          case "3":
            data.grow({ x1: x(20), y1: y(00), x2: x(75), y2: y(44), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(73), y1: y(50), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(75), y1: y(56), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
          case "4":
            data.grow({ x1: x(20), y1: y(00), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(55), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(00), x2: x(80), y2: y(45), xoff: x_offset, yoff: y_offset })
            break
          case "5":
            data.grow({ x1: x(80), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(55), x2: x(80), y2: y(95), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(75), y1: y(99), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
          case "6":
            data.grow({ x1: x(80), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(55), x2: x(80), y2: y(94), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(75), y1: y(99), x2: x(25), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(20), y1: y(94), x2: x(20), y2: y(55), xoff: x_offset, yoff: y_offset })
            break
          case "7":
            data.grow({ x1: x(20), y1: y(25), x2: x(20), y2: y(05), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(25), y1: y(00), x2: x(76), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(06), x2: x(35), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(55), x2: x(80), y2: y(70), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(75), y1: y(75), x2: x(25), y2: y(75), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(20), y1: y(70), x2: x(20), y2: y(55), xoff: x_offset, yoff: y_offset })
            break
          case "8":
            data.grow({ x1: x(55), y1: y(00), x2: x(75), y2: y(20), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(75), y1: y(30), x2: x(55), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(45), y1: y(50), x2: x(25), y2: y(30), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(25), y1: y(20), x2: x(45), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(25), y1: y(61), x2: x(75), y2: y(61), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(66), x2: x(80), y2: y(94), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(75), y1: y(99), x2: x(25), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(20), y1: y(94), x2: x(20), y2: y(66), xoff: x_offset, yoff: y_offset })
            break
          case "9":
            data.grow({ x1: x(75), y1: y(00), x2: x(25), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(20), y1: y(05), x2: x(20), y2: y(45), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(25), y1: y(50), x2: x(75), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(45), x2: x(80), y2: y(05), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(54), y1: y(05), x2: x(70), y2: y(22), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(70), y1: y(28), x2: x(54), y2: y(45), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(48), y1: y(45), x2: x(31), y2: y(28), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(31), y1: y(22), x2: x(48), y2: y(05), xoff: x_offset, yoff: y_offset })
            data.grow({ x1: x(80), y1: y(55), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
        } // end switch

      } // end digit_i loop
    } // end term_n loop 

    term[1] = term[1].trim()
    term[2] = term[2].trim()
    
    return data

  } // end function 

  function x(d) { return d * digit_w/100 }
  function y(d) { return d * digit_h/100 }

  function isDigit(char: string): bool { return ("1234567890".indexOf(char) >= 0) }
  function isOperator(char: string): bool { return ("*-+/".indexOf(char) >= 0) }


} // end module