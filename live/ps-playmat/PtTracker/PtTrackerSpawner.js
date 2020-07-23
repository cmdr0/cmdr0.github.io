const PtTrackerSpawner = () => {
  const [ptTrackers, setPtTrackers] = React.useState([])

  const handleMouseDown = ({clientX, clientY}) => {
    setPtTrackers([
      (
        <PtTracker
          isAlreadyDragging = {true}
          mouseOrigin = {[clientX, clientY]}
        />
      ), ...ptTrackers
    ])
  }

  return (
    <div style={{zIndex: -99999}}>
      <div 
        className = 'pt-tracker-container'
      >
        <div 
          className = 'pt-display'
          onMouseDown = {handleMouseDown}
        >0/0</div>
        <div 
          className = 'pt-tl'
          onClick = {() => setPower(power + 1)}
        >+</div>
        <div 
          className = 'pt-tr'
          onClick = {() => setToughness(toughness + 1)}
        >+</div>
        <div 
          className = 'pt-bl'
          onClick = {() => setPower(power - 1)}
        >-</div>
        <div 
          className = 'pt-br'
          onClick = {() => setToughness(toughness - 1)}
        >-</div>
      </div>
      {ptTrackers}
    </div>
  )
}