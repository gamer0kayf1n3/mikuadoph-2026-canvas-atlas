import './App.css'
import { useEffect, useState } from 'react'
import Canvas from './components/canvas.tsx'
import Coords from './components/coords.tsx'
import Sidebar from './components/sidebar.tsx'
import { UserData, userFunction, userFunctionNum } from "./userData.ts"
import type { UserResult } from './userData.ts'

type PixelCoords = { x: number; y: number; color: string }

function App() {
  const [selectedPixel, setSelectedPixel] = useState<PixelCoords | null>(null)
  const [canvasTransform, setCanvasTransform] = useState<{ x: number; y: number; scale: number } | null>(null)
  const [currentUser, setCurrentUser] = useState<UserResult | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const [userGrid, setUserGrid] = useState<number[][] | null>(null)

  useEffect(() => {
    let mounted = true
    UserData()
      .then((grid) => { if (mounted) setUserGrid(grid) })
      .catch((error) => { console.error('Failed to load user grid', error) })
    return () => { mounted = false }
  }, [])

  const handlePixelClick = (x: number, y: number, color: string) => {
    setSelectedPixel({ x, y, color })
    setCurrentUser(null)      // clear stale data immediately
    setUserLoading(true)

    if (!userGrid) {
      setUserLoading(false)
      return
    }

    const userNum = userFunctionNum(userGrid, { x, y })
    userFunction(userNum).then((userData) => {
      // discard if user already clicked a different pixel
      setSelectedPixel(prev => {
        if (prev?.x !== x || prev?.y !== y) return prev
        setCurrentUser(userData)
        setUserLoading(false)
        return prev
      })
    }).catch((error) => {
      console.error('Failed to load user data', error)
      setUserLoading(false)
    })
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
      {selectedPixel && (
        <Sidebar
          selectedPixel={selectedPixel}
          currentUser={currentUser}
          userLoading={userLoading}
        />
      )}
    </>
  )
}

export default App