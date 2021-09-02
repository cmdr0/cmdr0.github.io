const cap = 764
const margin = 10

let gui={}
gui.textArea = (()=>{
  let element=document.getElementById('textArea')

  return {
    get value() {return element.value},
    oninput: function(func) {element.addEventListener("input",func)}
  }
})()

let textRuler = (()=>{
  let canvas = document.createElement('canvas')
  let ctx = canvas.getContext('2d')
  ctx.font="12pt Times New Roman"

  function measure(text) {
    return Math.ceil(ctx.measureText(text).width)
  }

  function countSpaces(text) {
    return text.split(" ").length - 1
  }

  return {
    measure: measure,
    countSpaces: countSpaces
  }
})()

gui.displayArea = (()=>{
  let element = document.getElementById('displayArea')

  return {
    update: text => element.innerText = text
  }
})()

let bulletPress = (string)=>{
  
  let replacements = [
    [/\s*--\s*/gi, '--'],   // 'asdf -- abcd' >>> 'asdf--abcd'
    [/^\s+/gi, '- '],       // ' asdf' >>> '- asdf'
    [/\s+$/gi, ''],         // 'asdf ' >>> 'asdf'
    [/\s*\/\s*/gi, '/'], 
    [/\s*,/gi, ','],
    [/\s+;/gi, ';'],
    [/\s+/gi, ' ']
  ]
  
  let pieces = string.split('\n')
    .map(x=>x.split('|'))

  let bullets = ['']

  pieces.forEach(terms=>{
    let tempBullets = []

    terms.forEach(term=>{
      tempBullets.push(bullets.map(x=>x+' '+term))
    })

    bullets = tempBullets.flat().slice(0)
  })

  // OPTIMIZATION: Store bullets as objects with pixelLength attached
  bullets = bullets.map(x=>{
    replacements.forEach(replacement=>{
      x = x.replace(...replacement)
    })
    return x.trim()
  }).map(x=>{
    while (textRuler.measure(x) > cap && textRuler.countSpaces(x) > 1) {
      x = x.split('').reverse().join('').replace(' ','\u2006').split('').reverse().join('')
    }
    return x
  }).filter(x=>{
    pixelLength = textRuler.measure(x)
    return pixelLength <= cap && pixelLength >= cap-margin
  }).sort((x,y)=>textRuler.measure(y)-textRuler.measure(x))

  return bullets.length ? bullets : ['No bullets of length/all bullets over length']
}

gui.textArea.oninput(()=>
  gui.displayArea.update(
    bulletPress(gui.textArea.value).join('\n')
  )
)

gui.displayArea.update(
  bulletPress(gui.textArea.value).join('\n')
)