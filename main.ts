/// <reference path="d3.d.ts" />

  var eval_me = "" 
  var VALID = "1234567890%*()-+/"

  var svg = d3.select('svg')
  var body = d3.select('body')
  var txt = svg.append('text')
    .attr({
      x: '50%',
      y: '50%' /**/})  

  body.on('keypress',(d,i)=>{
    var char_code = (<any>d3.event).which
    var char = String.fromCharCode(char_code)
    if (char === 'c') // clear it
      txt.text(eval_me = "")
    else if (char === '=' || char_code === 13) { // give answer
      txt.text(eval(eval_me))
      eval_me = "" /**/}
    else if (VALID.indexOf(char) >= 0) // append to input
      txt.text(eval_me += char) /**/})
