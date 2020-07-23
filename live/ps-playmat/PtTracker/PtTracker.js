const PtTracker = ({onDragEnd, isAlreadyDragging, mouseOrigin}) => {
  const [power, setPower] = React.useState(0)
  const [toughness, setToughness] = React.useState(0)

  const [handleMouseDown, translation, isDragging] = useDrag({
    isAlreadyDragging: isAlreadyDragging,
    initialTranslation: isAlreadyDragging ?
      [mouseOrigin[0] - 40, mouseOrigin[1] - 16] :
      [0,0],
    origin: mouseOrigin ? mouseOrigin : [0,0]
  })

  let transform = ''
  if (isDragging) transform += 'scale(1.1)'

  if (!isDragging && translation[0] < 0) return ''
  return (
    <div 
      className = 'pt-tracker-container'
      style = {{
        transform: transform,
        zIndex: 1500 + translation[0],
        left: `${translation[0]}px`,
        top: `${translation[1]}px`
      }}
    >
      <div 
        className = 'pt-display'
        onMouseDown = {handleMouseDown}
      >{power}/{toughness}</div>
      <div 
        className = 'pt-tl pt-button'
        onClick = {() => setPower(power + 1)}
      >+</div>
      <div 
        className = 'pt-tr pt-button'
        onClick = {() => setToughness(toughness + 1)}
      >+</div>
      <div 
        className = 'pt-bl pt-button'
        onClick = {() => setPower(power - 1)}
      >-</div>
      <div 
        className = 'pt-br pt-button'
        onClick = {() => setToughness(toughness - 1)}
      >-</div>
    </div>
  )
}