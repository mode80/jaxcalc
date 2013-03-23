/// <reference path="d3.d.ts" />

module calcsand {

  // expression related vars
  var eval_me = ""
  var data = []
  var term = [,"",""] 
  var operator = ""
  var answer = ""
  var after_operator = false

  // valid input 'enum'
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
  var svg_w = 768 , svg_h = 1024 
  var digit_x_margin = 0, digit_y_margin = svg_h * 0.05 
  var digit_w = Math.min(svg_w, svg_h) / 2 - Math.max(digit_x_margin,digit_y_margin)
  var digit_h = digit_w
  var svg_half_w = svg_w / 2
  var svg_half_h = svg_h / 2
  var digit_half_w = digit_w / 2
  var digit_half_h = digit_h / 2
  var digit_full_w = digit_w + (2 * digit_x_margin)      
  var digit_full_h = digit_h + (2 * digit_y_margin)     

  // d3 selection and dimension vars
  var body = d3.select('body')
  var svg = body.append('svg').attr({ width: svg_w, height: svg_h })
  var display = svg.append('g').attr({ height: 1, width: 1 })

  main()

  function main() {
    
    // set up the drawing area
    recenterDisplay()

    // attach events
    body.on('keypress', onKeyPress)

  }

  function isDigit(char: string): bool { return ("1234567890".indexOf(char) >= 0) }
  function isOperator(char: string): bool { return ("*-+/".indexOf(char) >= 0) }

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
    data = makeRenderingData(["",answer,""]) //TODO fix this ugly cludge
    recenterDisplay(1000)
    renderData(data,1000)
  }

  function recenterDisplay(duration:number=250) {
    var digits_wide = Math.max(term[1].length, term[2].length)
    var digits_high = term[2] ? 2 : 1
    if (answer) { digits_wide = answer.length; digits_high = 1 }
    var x_offset = ( svg_half_w - ( digits_wide * digit_half_w ) )
    var y_offset =(svg_half_h - (digit_half_h*digits_high)) 
    display
      .transition()
      .duration(duration)
      .attr('transform', 'translate(' + x_offset + ',' + y_offset + ')')
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
      .attr('opacity', 0.4)
    lines
      .exit()
      .remove()
  }

  function makeRenderingData(term:string[], operator?:string) {
      
    var data = []
    var max_digit_n = Math.max(term[1].length,term[2].length)

    var digit_i = max_digit_n
    while (digit_i--) { // loop through each digit, starting with least significant 
      var term_n = 0
      while (term_n++ < 2) { // loop through terms
        var term_i = term_n-1 // term_i is a 0-based index whereas term_n is the 1-based ordinal
        var digit = term[term_n].charAt(digit_i)
        var x_offset=(digit_full_w * digit_i)
        var y_offset= (digit_full_h * term_i) 
        switch (digit) {
          case "":
            break
          case "0":
            data.push({ x1: x(50), y1: y(50), x2: x(50), y2: y(50), xoff: x_offset, yoff: y_offset })
            break
          case "1":
            data.push({ x1: x(50), y1: y(00), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
          case "2":
            data.push({ x1: x(80), y1: y(00), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(99), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
          case "3":
            data.push({ x1: x(20), y1: y(00), x2: x(80), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(50), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(50), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
          case "4":
            data.push({ x1: x(20), y1: y(00), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(50), x2: x(80), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(50), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(70), y1: y(00), x2: x(70), y2: y(50), xoff: x_offset, yoff: y_offset })
            break
          case "5":
            data.push({ x1: x(80), y1: y(00), x2: x(20), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(00), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(50), x2: x(80), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(50), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(99), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
          case "6":
            data.push({ x1: x(80), y1: y(00), x2: x(20), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(00), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(50), x2: x(80), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(50), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(99), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(99), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset })
            break
          case "7":
            data.push({ x1: x(20), y1: y(25), x2: x(20), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(00), x2: x(80), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(00), x2: x(35), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(50), x2: x(80), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(50), x2: x(80), y2: y(75), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(75), x2: x(20), y2: y(75), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(75), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset })
            break
          case "8":
            data.push({ x1: x(50), y1: y(00), x2: x(80), y2: y(30), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(30), x2: x(50), y2: y(60), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(50), y1: y(60), x2: x(20), y2: y(30), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(30), x2: x(50), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(60), x2: x(80), y2: y(60), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(60), x2: x(80), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(99), x2: x(20), y2: y(99), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(99), x2: x(20), y2: y(60), xoff: x_offset, yoff: y_offset })
            break
          case "9":
            data.push({ x1: x(80), y1: y(00), x2: x(20), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(00), x2: x(20), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(50), x2: x(80), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(50), x2: x(80), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(50), y1: y(00), x2: x(80), y2: y(25), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(25), x2: x(50), y2: y(50), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(50), y1: y(50), x2: x(20), y2: y(25), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(20), y1: y(25), x2: x(50), y2: y(00), xoff: x_offset, yoff: y_offset })
            data.push({ x1: x(80), y1: y(50), x2: x(50), y2: y(99), xoff: x_offset, yoff: y_offset })
            break
        } // end switch

      } // end digit_i loop
    } // end term_n loop 

    return data

  } // end function 

  function x(d) { return d * digit_w/100 }
  function y(d) { return d * digit_h/100 }

} // end module