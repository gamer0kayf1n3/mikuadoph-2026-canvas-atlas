import './App.css'
import { useState } from 'react'
import Canvas from './components/canvas.tsx'
import Coords from './components/coords.tsx'
function App() {
  const [selectedPixel, setSelectedPixel] = useState(null);
  const [current, setCurrent] = useState(null);

  return <>
    <Canvas onOutofFocus={() => setSelectedPixel(null)} onPixelClick={(x, y) => setSelectedPixel({ x, y })} />
    {selectedPixel && <div className='coordsParent'><Coords x={selectedPixel.x} y={selectedPixel.y} /></div>}
  </>
}

export default App