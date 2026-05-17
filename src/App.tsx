import './App.css'
import { useEffect, useState } from 'react'
import Canvas from './components/canvas.tsx'
import Coords from './components/coords.tsx'
import Sidebar from './components/sidebar.tsx'
import { UserData, userFunction, userFunctionNum } from "./userData.ts"

function App() {
  type PixelCoords = { x: number; y: number }

  const [selectedPixel, setSelectedPixel] = useState<PixelCoords | null>(null)
  const [canvasTransform, setCanvasTransform] = useState<{ x: number; y: number; scale: number } | null>(null)
  const [currentUser, setCurrentUser] = useState<number | null>(null)
  const [userGrid, setUserGrid] = useState<number[][] | null>(null)

  useEffect(() => {
    let mounted = true

    UserData()
      .then((grid) => {
        if (mounted) setUserGrid(grid)
      })
      .catch((error) => {
        console.error('Failed to load user grid', error)
      })

    return () => {
      mounted = false
    }
  }, [])

  const handlePixelClick = (x: number, y: number) => {
    const coords = { x, y }
    setSelectedPixel(coords)

    if (userGrid) {
      const userNum = userFunctionNum(userGrid, coords)
      const userDataPromise = userFunction(userNum)

      userDataPromise.then((userData) => {

        setCurrentUser(userData);
      }).catch((error) => {
        console.error('Failed to load user data', error)
      })
    }
  }

  return (
    <>
      <Canvas
        onOutofFocus={() => setSelectedPixel(null)}
        onPixelClick={handlePixelClick}
        onTransformChange={(x: number, y: number, scale: number) => setCanvasTransform({ x, y, scale })}
      />
      {selectedPixel && (
        <div className='coordsParent'>
          <Coords x={selectedPixel.x} y={selectedPixel.y} />
        </div>
      )}
      {selectedPixel && <Sidebar selectedPixel={selectedPixel} currentUser={currentUser} />}
    </>
  )
}

export default App