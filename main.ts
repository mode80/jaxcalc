/// <reference path="d3.d.ts" />

module calcsand {

  var INPUT = {
    0: '0', 1: '1', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    ADD: '+',
    SUBTRACT: '-',
    MULTIPLY: '*',
    DIVIDE: '/',
    CLEAR: 'c',
  }
  var term1 = "", operator = "", term2 = ""
  var eval_me = ""
  var after_operator = false
  var data = []

  var svg = d3.select('svg')
  var svg_w = parseFloat(svg.attr('width'))
  var svg_h = parseFloat(svg.attr('height'))
  var display = svg.append('g')
  var body = d3.select('body')
  var txt = svg.append('text')


  function main() {

    // set up the drawing area
    txt.attr({ x: '50%', y: '20%' })
    display.attr({ height: 1, width: 1, transform: 'translate(450,450)' }) // used for centering

    // attach events
    body.on('keypress', onKeypress)
  }
  main()

  function isDigit(char: string): bool { return ("1234567890".indexOf(char) >= 0) }
  function isOperator(char: string): bool { return ("*-+/".indexOf(char) >= 0) }

  function onKeypress() {
    var char_code = (<any>d3.event).which
    var char = String.fromCharCode(char_code)
    var input = ""
    if (isDigit(char) || isOperator(char)) input = char
    if (char_code == 13 || char == 'c') input = INPUT.CLEAR
    processInput(input)
  }

  function processInput(input: string) {
    if (isDigit(input)) {
      if (!after_operator) { processFirst(input) } else { processLast(input) }
      showEvalMe(eval_me += input)
    }
    else if (isOperator(input)) {
      processOperator(input)
      after_operator = true
    }
    else if (input == INPUT.CLEAR) {
      term1 = ""; term2 = ""; eval_me = "";
      showStart()
    }
  }

  function showEvalMe(eval_me: string) {
    txt.text(eval_me)
  }

  function showStart() {
    svg.selectAll('line').remove()
    txt.text("")
  }

  function processFirst(input: string) {
    // regenerate line data for new input
      term1 += input
      data = numberToData(term1)
    // rerender new data
      var lines = display.selectAll('line').data(data)
      lines
        .transition()
        .attr('x1', (d) => { return d.x1 })
        .attr('x2', (d) => { return d.x2 })
        .attr('y1', (d) => { return d.y1 })
        .attr('y2', (d) => { return d.y2 })
        .attr('transform', (d) => { return d.transform })
      lines
        .enter()
        .append('line')
        .attr('x1', (d) => { return d.x1 })
        .attr('x2', (d) => { return d.x2 })
        .attr('y1', (d) => { return d.y1 })
        .attr('y2', (d) => { return d.y2 })
        .attr('transform', (d) => { return d.transform })
      lines
        .exit()
        .remove()
    // recenter display
      display.attr('transform', 'translate(' + (500 - (term1.length * 50)) + ',450)')
  }

  function processOperator(input: string) {
    // arrange first number in prep for operator on last 
  }

  function processLast(input: string) {
    // show answer(?)
  }

  function numberToData(num: string) {

    var data = []
    var i = -1, len = num.length
    while (i++ < len) {
      var digit = num.charAt(i)
      switch (digit) {
        case "1":
          data.push({ x1: 50, y1: 0, x2: 50, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          break
        case "2":
          data.push({ x1: 80, y1: 0, x2: 20, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 100, x2: 80, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          break
        case "3":
          data.push({ x1: 20, y1: 0, x2: 80, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 50, x2: 20, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 50, x2: 20, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          break
        case "4":
          data.push({ x1: 20, y1: 0, x2: 20, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 50, x2: 80, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 50, x2: 80, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 70, y1: 0, x2: 70, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          break
        case "5":
          data.push({ x1: 80, y1: 0, x2: 20, y2: 0, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 0, x2: 20, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 50, x2: 80, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 50, x2: 80, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 100, x2: 20, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          break
        case "6":
          data.push({ x1: 80, y1: 0, x2: 20, y2: 0, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 0, x2: 20, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 50, x2: 80, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 50, x2: 80, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 100, x2: 20, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 100, x2: 20, y2: 55, transform: 'translate(' + (100 * i) + ',0)' })
          break
        case "7":
          data.push({ x1: 20, y1: 25, x2: 20, y2: 0, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 0, x2: 80, y2: 0, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 0, x2: 35, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 50, x2: 80, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 50, x2: 80, y2: 75, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 75, x2: 20, y2: 75, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 75, x2: 20, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          break
        case "8":
          data.push({ x1: 50, y1: 0, x2: 80, y2: 30, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 30, x2: 50, y2: 60, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 50, y1: 60, x2: 20, y2: 30, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 30, x2: 50, y2: 0, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 60, x2: 80, y2: 60, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 60, x2: 80, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 100, x2: 20, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 100, x2: 20, y2: 60, transform: 'translate(' + (100 * i) + ',0)' })
          break
        case "9":
          data.push({ x1: 80, y1: 0, x2: 20, y2: 0, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 0, x2: 20, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 50, x2: 80, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 50, x2: 80, y2: 0, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 50, y1: 0, x2: 80, y2: 25, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 25, x2: 50, y2: 50, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 50, y1: 50, x2: 20, y2: 25, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 20, y1: 25, x2: 50, y2: 0, transform: 'translate(' + (100 * i) + ',0)' })
          data.push({ x1: 80, y1: 50, x2: 50, y2: 100, transform: 'translate(' + (100 * i) + ',0)' })
          break
      }

    }
    return data

  }
}