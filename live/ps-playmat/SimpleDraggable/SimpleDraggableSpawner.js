const SimpleDraggableSpawner = ({src, dimensions}) => {
  const [simpleDraggables, setSimpleDraggables] = React.useState([])

  const handleMouseDown = e => {
    e.preventDefault()
    setSimpleDraggables([
      ...simpleDraggables,
      (
        <SimpleDraggable
          src = {src}
          dimensions = {dimensions}
          isAlreadyDragging = {true}
          mouseOrigin = {[e.clientX, e.clientY]}
        />
      )
    ])
  }

  return (
    <div style = {{zIndex: -99999}}>
      <img 
        src={src} 
        onMouseDown={handleMouseDown}
        style = {{
          width: dimensions[0],
          height: dimensions[1]
        }}
      ></img>
      {simpleDraggables}
    </div>
  )
}