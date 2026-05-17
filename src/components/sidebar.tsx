import type { UserResult } from '../userData.ts';

function Sidebar({ selectedPixel, currentUser }: {
    selectedPixel: { x: number; y: number; color: string } | null;
    currentUser: UserResult | null;
}) {
    return (
        <div className="sidebarParent">
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
                        {currentUser.error === 1 ? (
                            <p>No user data: {currentUser.reason}</p>
                        ) : (
                            <>
                                <p>Position: ({currentUser.x}, {currentUser.y})</p>
                                <p>Username: {currentUser.user_id}</p>
                                <p>Username: {currentUser.data.username}</p>
                                <p>Last Placed: {new Date(currentUser.data.lastPlacedDate * 1000).toLocaleString()}</p>
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
    );
}

export default Sidebar;