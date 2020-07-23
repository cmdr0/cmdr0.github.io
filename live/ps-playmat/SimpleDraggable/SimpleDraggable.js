const SimpleDraggable = ({src, dimensions, isAlreadyDragging, mouseOrigin}) => {
  const [handleMouseDown, translation, isDragging] = useDrag({
    isAlreadyDragging: isAlreadyDragging,
    initialTranslation: isAlreadyDragging ?
      [mouseOrigin[0] - dimensions[0]/2, mouseOrigin[1] - dimensions[1]/2] :
      [0,0],
    origin: mouseOrigin ? mouseOrigin : [0,0]
  })
  let transform = ''
  if (isDragging) transform += ' scale(1.1)'

  if (!isDragging && translation[0] < 0) return ''
  return (
    <img 
      src = {src}
      style = {{
        transform: transform,
        zIndex: 1500 + translation[0],
        width: dimensions[0],
        height: dimensions[1],
        position: 'fixed',
        top: `${translation[1]}px`,
        left: `${translation[0]}px`
      }}
      onMouseDown = {handleMouseDown}
    ></img>
  )
}