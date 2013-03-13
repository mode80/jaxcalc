﻿/// <reference path="d3.d.ts" />

var INPUT = {
  0:'0', 1:'1',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',
  ADD: '+',
  SUBTRACT: '-',
  MULTIPLY: '*',
  DIVIDE: '/',
  CLEAR: 'c',
}
var first = "", operator = "", last = ""
var first_digits:Digit[] = []
var last_digits:Digit[] = []
var eval_me = ""
var after_operator = false

var svg = d3.select('svg')
var svg_w = parseFloat(svg.attr('width'))
var svg_h = parseFloat(svg.attr('height'))
var digit_display = svg.append('g')
var body = d3.select('body')
var txt = svg.append('text')


function main() {

  // set up the drawing area
    txt.attr({ x: '50%', y: '20%' })
    digit_display.attr({
      transform:'translate(0,300)',
      height: 100, width: 600
    })

  // attach events
    body.on('keypress', onKeypress)
}
main()

function isDigit(char:string):bool { return ("1234567890".indexOf(char)>=0) }
function isOperator(char:string):bool { return ("*-+/".indexOf(char)>=0) }

function onKeypress() {
  var char_code = (<any>d3.event).which
  var char = String.fromCharCode(char_code)
  var input = ""
  if (isDigit(char) || isOperator(char)) input = char
  if (char_code == 13 || char == 'c') input = INPUT.CLEAR
  processInput(input)
}
 
function processInput(input:string) {
  if (isOperator(input)) {
    processOperator(input)
    after_operator = true
  }
  if (isDigit(input)) {
    if (!after_operator)
      { processFirst(input); first += input }
    else
      { processLast(input); last += input }
    showEvalMe(eval_me += input)
  }
  if (input == INPUT.CLEAR) {
    first = ""; last = ""; eval_me = "";
    showStart() 
  }
}

function showEvalMe(eval_me: string) {
  txt.text(eval_me)
}

function showStart() {
  svg.selectAll('*').remove()  
}

function processFirst(input:string) {
  // move existing piece(s) over
    var i = first_digits.length
    while (i--) {
      var it = first_digits[i]
      it.tran_x -= 100
    }
  // draw new digit
    var new_digit = new Digit(input,digit_display)
    new_digit.render()
    first_digits.push(new_digit)
}

function processOperator(input:string) {
  // arrange first number in prep for operator on last 
}

function processLast(input:string) {
  // show answer(?)
}

class Digit {
  public g: D3.Selection;
  constructor(public digit: string, public container) {
    this.g = container.append('g')
    this.tran_x = parseFloat(container.attr('width')) / 2  
 }
  private _tran_x=0;
  private _tran_y=0;
  get tran_x() { return this._tran_x }
  set tran_x(x:any) {
    this._tran_x = x
    this.g.attr('transform','translate(' + this._tran_x + ',' + this._tran_y + ')')
  }
  get tran_y() { return this._tran_y }
  set tran_y(y:any) {
    this._tran_y = y
    this.g.attr('transform','translate(' + this._tran_x + ',' + this._tran_y + ')')
  }
  render() {
    switch (this.digit) {
      case "1":
       this.g.append('line').attr({
          x1: 50, y1: 0,
          x2: 50, y2: 100,
        })
        break
      case "2":
        break
      case "3":
        break
      case "4":
        break
      case "5":
        break
      case "6":
        break
      case "7":
        break
      case "8":
        break
      case "9":
        break
      case "0":
        break
    }  
  }
}
