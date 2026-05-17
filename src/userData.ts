function UserData() {
    return fetch(`/user_grid.json`).then(res => res.json());
}

function userFunctionNum(data: number[][], pixel: { x: number; y: number }): number {
    return data[pixel.x][pixel.y];
}
function userFunction(userNum: number): Promise<object> {
    return fetch(`/users/${userNum}.json`)
        .then(res => res.json())
        .then(data => ({ ...data, error: 0 }))
        .catch(() => ({ error: 1 }));
}
export { UserData, userFunction, userFunctionNum }
