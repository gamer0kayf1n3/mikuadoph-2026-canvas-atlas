type UserNum = { error: number; data: number; x: number; y: number };
type UserResult = { error: 0; x: number; y: number; data: { username: string; lastPlacedDate: number; lastBitCount: number; maxBits: number; extraTime: number; group: string; placeCount: number; replaced: number; placedBreak: number; bonus: string[]; lastUpdated: string; place: number; bonusSet: object } }
               | { error: 1; x: number; y: number; reason: string };

async function UserData(): Promise<number[][] | null> {
    try {
        const res = await fetch(`/user_grid.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    } catch (err) {
        console.error('UserData error:', err);
        return null;
    }
}

function userFunctionNum(data: number[][], pixel: { x: number; y: number }): UserNum {
    const val = data[pixel.y]?.[pixel.x]; // y = row, x = col
    if (val == null) return { error: 1, data: -1, x: pixel.x, y: pixel.y };
    return { error: 0, data: val, x: pixel.x, y: pixel.y };
}

async function userFunction(userNum: UserNum): Promise<UserResult> {
    if (userNum.error) return { error: 1, x: userNum.x, y: userNum.y, reason: 'No user at this pixel' };
    try {
        const res = await fetch(`/users/${userNum.data}.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return { error: 0, ...data, x: userNum.x, y: userNum.y };
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('userFunction error:', message);
        return { error: 1, x: userNum.x, y: userNum.y, reason: message };
    }
}

export type { UserResult };
export { UserData, userFunction, userFunctionNum };