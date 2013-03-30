/// <reference path="d3.d.ts" />

module calcsand {  // expression related vars
  var term1 = "", term2 = ""
  var operator = ""
  var answer = ""
  var after_separate = false

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
  var svg_w = 768, svg_h = 1024
  var display_x, display_y

  // d3 selection vars
  var body = d3.select('body') 
  var svg = body.select('svg').attr({
    viewBox: "0 0 " + svg_w + " " + svg_h,
    preserveAspectRatio: 'none'
  }) 
  var txt = svg.append('text').attr({ x: svg_w/2, y: svg_h * 0.1})
  var debug = svg.append('text').attr({ x: svg_w/2, y: svg_h * 0.9})
  var touch_lines : D3.UpdateSelection

  // other module level vars
  var lastTouchEndTime = 0 
  

  main() // lets do this

  function main() {
    
    // setup drawing space
      resizeDigits() 
      makeBorder()

    // attach events
      body.on('keypress', onKeyPress) 
      body.on('touchstart', onTouchStart) 
         .on('touchmove', onTouchMove)   
         .on('touchend', onTouchEnd) 
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

  function makeBorder() {
    var border_size = svg_h*0.02
    svg.append('rect').attr({ 'class': 'border', x: 0, y: 0, width: svg_w, height: border_size })
    svg.append('rect').attr({ 'class': 'border', x: 0, y: svg_h-border_size, width: svg_w, height: border_size})
    svg.append('rect').attr({ 'class': 'border', x: 0, y: 0, width: border_size, height: svg_h })
    svg.append('rect').attr({ 'class': 'border', x: svg_w - border_size, y: 0, width: border_size, height: svg_h })
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

  function onTouchStart() {

    touch_lines = selectionForTouches()

    touch_lines.enter()
        .append("line")
        .attr("class", "touch")
        .attr("x1", function (d) { return d[0] })
        .attr("y1", function (d) { return d[1] })
        .attr("x2", function (d) { return d[0] })
        .attr("y2", function (d) { return d[1] })
        .style("fill", "none")
        .transition().ease('elastic')
          .attr("stroke-width", Math.max(svg_h,svg_w)/10)
          .attr("opacity", 0.2)
          .attr("x1", function (d) { return d[0] })
          .attr("y1", function (d) { return d[1]/*-digit_half_w*/ })
          .attr("x2", function (d) { return d[0] })
          .attr("y2", function (d) { return d[1]/*+digit_half_w*/ })
  }

  function onTouchMove() {

    touch_lines = selectionForTouches()
    
    touch_lines
        .attr("x1", function (d) { return d[0] })
        .attr("y1", function (d) { return d[1]/*-digit_half_w*/ })
        .attr("x2", function (d) { return d[0] })
        .attr("y2", function (d) { return d[1]/*+digit_half_w*/ })

  }

  function onTouchEnd() {
    touch_lines = selectionForTouches()
   
    var still_touching_count = d3.touches( svg.node() ).length
    var exit_lines = touch_lines.exit() // the lines no longer being touched 

    if (still_touching_count == 0) { // all have been released
      var released_count = exit_lines[0].length
      exit_lines.classed('touch', null)
      if (released_count == 10) { // 10 fingers are special
        processInput('1'); processInput('0')
      } else { // use the released finger count as digit input
        processInput(released_count + '')
      }
    }
 
    lastTouchEndTime = Date.now()
  }
   
  function selectionForTouches():D3.UpdateSelection {
    ; d3.event.preventDefault()
    var touch_array = d3.touches( svg.node() )
    debug.text(touch_array)
    return svg.selectAll("line.touch").data(touch_array)
  }

  export function processInput(input: string /** INPUT enum **/) {
    // an expression is complete upon a term1, separator, term2 and operator -- in that order

    if (input == INPUT.CLEAR ||
      (isDigit(input) && answer.length)) { // autoclear on first digit after former answer
      resetToStart()
      showStart()
    }
    if (isDigit(input)) { // normal additional digit
      if (answer.length) resetToStart()
      if (after_separate) {term2 += input} else { term1 += input }
      showTerms()
    }
    if (input == INPUT.SEPARATE) {
      term2 = "0"
    }
    if (isOperator(input)) {
      findAnswer()
      showAnswer()
    }

return
    if (isOperator(input)) {
      if (answer) { // there exists a previous answer we're operating on
        var prev_answer = answer
        resetToStart()
        term1 = prev_answer
        showTerms()
        operator = input
        after_separate = true
      }
      else if (after_separate && term2.length) { // they have everything to hit equals but hit operator instead
        findAnswer()
        showAnswer()
        term1 = answer
        term2 = "" 
        answer = ""
        operator = input
        after_separate = true
        showTerms()
      } else {
        operator = input
        after_separate = true
      }
     showOperator(input)
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
    operator = ""; after_separate = false
    line_data = []; ellipse_data = []
    answer = "";
    txt.text("")
  }

  function showStart() {
    svg.selectAll('line').remove()
    svg.selectAll('ellipse').remove()
    txt.text("")
  }


  function showTerms() {

    // reset digit sizing 
      resizeDigits()
    // regenerate line data for term array 
      makeRenderingData(term1, term2)
    // rerender new data
      renderData()
    // update text display
      txt.text(term1 + "" + operator + "" + term2)
  }

  function showOperator(input: string) {
  }

  function showAnswer() {
    resizeDigits()
    makeRenderingData(answer) 
    renderData(1000)
    txt.text(answer)
  }

  function renderData(duration=500) {
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
