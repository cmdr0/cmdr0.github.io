const useDrag = ({onDragEnd, isAlreadyDragging, initialTranslation, origin}) => {
  const [translation, setTranslation] = React.useState(initialTranslation ? initialTranslation : [0,0])
  const [mouseOrigin, setOrigin] = React.useState(isAlreadyDragging ? origin : [0,0])
  const [isDragging, toggleDragging] = React.useState(isAlreadyDragging ? true : false)

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleMouseDown = e => {
    e.preventDefault()
    setOrigin([e.clientX, e.clientY])
    toggleDragging(true)
  }

  const handleMouseMove = e => {
    e.preventDefault()
    setTranslation([
      translation[0] + e.clientX - mouseOrigin[0],
      translation[1] + e.clientY - mouseOrigin[1]
    ])
    setOrigin([e.clientX, e.clientY])
  }

  const handleMouseUp = e => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', handleMouseUp)
    toggleDragging(false)
    if (onDragEnd) onDragEnd()
  }

  return [handleMouseDown, translation, isDragging]
}