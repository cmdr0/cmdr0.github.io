const Card = ({src, initialTranslation}) => {
  const [handleMouseDown, translation, isDragging] = useDrag({
    initialTranslation: initialTranslation
  })
  const [isTapped, toggleTap] = React.useState(false)

  const handleDoubleClick = () => toggleTap(!isTapped)

  let transform = ''
  if (isDragging) transform += ' scale(1.1)'
  if (isTapped) transform += ' rotate(15deg)'

  const style = {
    width: '200px',
    height: '280px',
    transform: transform,
    transition: 'transform 200ms ease-out',
    zIndex: isDragging ? 99999 : translation[0],
    position: 'fixed',
    left: `${translation[0]}px`,
    top: `${translation[1]}px`
  }

  return (
    <img
      src = {src}
      style = {style}
      onMouseDown = {handleMouseDown}
      onDoubleClick = {handleDoubleClick}
      className = 'card'
    ></img>
  )
}