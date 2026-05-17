function Sidebar({ selectedPixel, currentUser }: {
    selectedPixel: { x: number; y: number; color?: string } | null,
    currentUser: {
        error?: number, 
        user_id: number, 
        data: { 
            username: string, 
            lastPlacedDate: number, 
            lastBitCount: number, 
            maxBits: number, 
            extraTime: number, 
            group: string, 
            placeCount: number, 
            replaced: number, 
            placedBreak: number, 
            bonus: string[], 
            lastUpdated: string, 
            place: number, 
            bonusSet: object 
        }
    } | null
    }) {
    return (
        <div class="sidebarParent">
            <div id="pixelData">
                {selectedPixel && (
                    <>
                        <h3>Pixel Data</h3>
                        <p>Position: ({selectedPixel.x}, {selectedPixel.y})</p>
                        <p>Color: {selectedPixel.color}</p>
                    </>
                )}
            </div>
            <div id="userData">
                {currentUser && (
                    <>
                        <h3>User Data</h3>
                        {currentUser.error == 1 ? (
                            <p>Error: {currentUser.error}</p>
                        ) : (
                            <>
                                <p>Username: {currentUser.data.username}</p>
                                <p>Last Placed Date: {new Date(currentUser.data.lastPlacedDate * 1000).toLocaleString()}</p>
                                <p>Last Bit Count: {currentUser.data.lastBitCount}</p>
                                <p>Max Bits: {currentUser.data.maxBits}</p>
                                <p>Extra Time: {currentUser.data.extraTime}</p>
                                <p>Group: {currentUser.data.group}</p>
                                <p>Place Count: {currentUser.data.placeCount}</p>
                                <p>Replaced: {currentUser.data.replaced}</p>
                                <p>Placed Break: {currentUser.data.placedBreak}</p>
                                <p>Bonus: {currentUser.data.bonus.join(', ')}</p>
                                <p>Last Updated: {new Date(currentUser.data.lastUpdated).toLocaleString()}</p>
                                <p>Place: {currentUser.data.place}</p>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default Sidebar