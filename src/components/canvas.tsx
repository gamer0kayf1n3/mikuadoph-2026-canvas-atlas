import { useEffect, useRef } from "react";

const COLORS = [
    '#6B0119', '#BD0037', '#FF4500', '#FEA800', '#FFD435', '#FEF8B9', '#01A267', '#09CC76',
    '#7EEC57', '#02756D', '#009DAA', '#00CCBE', '#277FA4', '#3790EA', '#52E8F3', '#4839BF',
    '#695BFF', '#94B3FF', '#801D9F', '#B449BF', '#E4ABFD', '#DD117E', '#FE3781', '#FE99A9',
    '#6D462F', '#9B6926', '#FEB470', '#000000', '#525252', '#888D90', '#D5D6D8', '#FFFFFF',
];

const MIN_SCALE = 3;
const MAX_SCALE = 100;
const SMOOTH = 0.12; // 0 = instant, 1 = never arrives. ~0.1 feels snappy, ~0.05 feels floaty

function Canvas({ onOutofFocus, onPixelClick, currentE }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // All state lives in refs so we can drive it from a requestAnimationFrame loop
    // without React re-rendering every frame
    const target = useRef({ x: 0, y: 0, scale: 4 });
    const current = useRef({ x: 0, y: 0, scale: 4 });
    const drag = useRef({ active: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
    const pinch = useRef<{ dist: number } | null>(null);
    const rafId = useRef<number>(0);

    // Apply the current interpolated transform to the canvas DOM node directly —
    // no React state, no re-renders, just direct style writes at 60fps
    function applyTransform() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.style.transform =
            `translate(${current.current.x}px, ${current.current.y}px) scale(${current.current.scale})`;
    }

    function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t;
    }

    // The animation loop: every frame, nudge current toward target, apply transform
    function tick() {
        const c = current.current;
        const t = target.current;

        c.x = lerp(c.x, t.x, SMOOTH);
        c.y = lerp(c.y, t.y, SMOOTH);
        c.scale = lerp(c.scale, t.scale, SMOOTH);

        applyTransform();
        rafId.current = requestAnimationFrame(tick);
    }

    useEffect(() => {
        fetch('./canvas.json')
            .then(res => res.json())
            .then((grid: number[][]) => {
                const canvas = canvasRef.current;
                const container = containerRef.current;
                if (!canvas || !container) return;

                const height = grid.length;
                const width = grid[0].length;
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const imageData = ctx.createImageData(width, height);
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const hex = COLORS[grid[y][x]] ?? '#000000';
                        const idx = (y * width + x) * 4;
                        imageData.data[idx] = parseInt(hex.slice(1, 3), 16);
                        imageData.data[idx + 1] = parseInt(hex.slice(3, 5), 16);
                        imageData.data[idx + 2] = parseInt(hex.slice(5, 7), 16);
                        imageData.data[idx + 3] = 255;
                    }
                }
                ctx.putImageData(imageData, 0, 0);

                // Center on load
                const initX = (container.offsetWidth - width * target.current.scale) / 2;
                const initY = (container.offsetHeight - height * target.current.scale) / 2;
                target.current.x = initX;
                target.current.y = initY;
                current.current.x = initX;
                current.current.y = initY;
                applyTransform();
            })
            .catch(err => console.error('Fetch error:', err));

        rafId.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId.current);
    }, []);

    // Zoom toward a point (cursorX, cursorY) in container-space.
    // The trick: keep the point under the cursor fixed while scaling.
    //   offset_new = cursor - (cursor - offset_old) * (newScale / oldScale)
    function zoomToward(cursorX: number, cursorY: number, newScale: number) {
        const t = target.current;
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        const ratio = clamped / t.scale;
        t.x = cursorX - (cursorX - t.x) * ratio;
        t.y = cursorY - (cursorY - t.y) * ratio;
        t.scale = clamped;
    }

    // --- Mouse ---

    function onMouseDown(e: React.MouseEvent) {
        drag.current = {
            active: true,
            startX: e.clientX,
            startY: e.clientY,
            startOffsetX: target.current.x,
            startOffsetY: target.current.y,
        };
    }

    function onMouseMove(e: React.MouseEvent) {
        if (!drag.current.active) return;
        target.current.x = drag.current.startOffsetX + (e.clientX - drag.current.startX);
        target.current.y = drag.current.startOffsetY + (e.clientY - drag.current.startY);
        onOutofFocus();
    }

    function onMouseUp() {
        drag.current.active = false;
        //onOutofFocus();

    }

    function onWheel(e: React.WheelEvent) {
        e.preventDefault();
        const container = containerRef.current!;
        const rect = container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;
        const factor = e.deltaY < 0 ? 1.1 : 0.9;
        zoomToward(cursorX, cursorY, target.current.scale * factor);
        onOutofFocus();
    }

    // --- Touch ---

    function getDistance(touches: React.TouchList) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e: React.TouchEvent) {
        if (e.touches.length === 1) {
            pinch.current = null;
            drag.current = {
                active: true,
                startX: e.touches[0].clientX,
                startY: e.touches[0].clientY,
                startOffsetX: target.current.x,
                startOffsetY: target.current.y,
            };
        } else if (e.touches.length === 2) {
            drag.current.active = false;
            pinch.current = { dist: getDistance(e.touches) };
        }
    }

    function onTouchMove(e: React.TouchEvent) {
        e.preventDefault();
        if (e.touches.length === 1 && drag.current.active) {
            target.current.x = drag.current.startOffsetX + (e.touches[0].clientX - drag.current.startX);
            target.current.y = drag.current.startOffsetY + (e.touches[0].clientY - drag.current.startY);
        } else if (e.touches.length === 2 && pinch.current) {
            const newDist = getDistance(e.touches);
            const factor = newDist / pinch.current.dist;
            // Zoom toward midpoint of the two fingers
            const container = containerRef.current!;
            const rect = container.getBoundingClientRect();
            const midX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
            const midY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
            zoomToward(midX, midY, target.current.scale * factor);
            pinch.current.dist = newDist;
        }
        onOutofFocus();
    }

    function onTouchEnd() {
        drag.current.active = false;
        pinch.current = null;
        onOutofFocus();
    }

    function onClick(e: React.MouseEvent) {
        const container = containerRef.current!;
        const rect = container.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        const canvasX = (clickX - current.current.x) / current.current.scale;
        const canvasY = (clickY - current.current.y) / current.current.scale;
        onPixelClick?.(Math.floor(canvasX), Math.floor(canvasY));
        currentE?.(current.current.x, current.current.y, current.current.scale);
    }

    function onTap(e: React.TouchEvent) {
        if (e.touches.length > 1) return;
        const container = containerRef.current!;
        const rect = container.getBoundingClientRect();
        const tapX = e.touches[0].clientX - rect.left;
        const tapY = e.touches[0].clientY - rect.top;
        const canvasX = (tapX - current.current.x) / current.current.scale;
        const canvasY = (tapY - current.current.y) / current.current.scale;
        onPixelClick?.(Math.floor(canvasX), Math.floor(canvasY));
        currentE?.(current.current.x, current.current.y, current.current.scale);
    }

    return (
        <div
            ref={containerRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={onClick}
            onTap={onTap}
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                cursor: drag.current.active ? 'grabbing' : 'grab',
                background: '#111',
            }}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    transformOrigin: '0 0',
                    imageRendering: 'pixelated',
                }}
            />
        </div>
    );
}

export default Canvas;