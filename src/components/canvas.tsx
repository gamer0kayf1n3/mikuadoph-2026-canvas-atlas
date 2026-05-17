import { useEffect, useRef } from "react";

const COLORS = [
    '#6B0119', '#BD0037', '#FF4500', '#FEA800', '#FFD435', '#FEF8B9', '#01A267', '#09CC76',
    '#7EEC57', '#02756D', '#009DAA', '#00CCBE', '#277FA4', '#3790EA', '#52E8F3', '#4839BF',
    '#695BFF', '#94B3FF', '#801D9F', '#B449BF', '#E4ABFD', '#DD117E', '#FE3781', '#FE99A9',
    '#6D462F', '#9B6926', '#FEB470', '#000000', '#525252', '#888D90', '#D5D6D8', '#FFFFFF',
];

const MIN_SCALE = 3;
const MAX_SCALE = 100;
const SMOOTH = 0.12;
const DRAG_THRESHOLD = 4;


function Canvas({ onOutofFocus, onPixelClick, onTransformChange }) {

    const gridRef = useRef<number[][] | null>(null);

    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const highlightPixel = useRef<{ x: number; y: number } | null>(null);

    const target = useRef({ x: 0, y: 0, scale: 4 });
    const current = useRef({ x: 0, y: 0, scale: 4 });
    const drag = useRef({ active: false, didDrag: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
    const pinch = useRef<{ dist: number } | null>(null);
    const rafId = useRef<number>(0);

    function applyTransform() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.style.transform =
            `translate(${current.current.x}px, ${current.current.y}px) scale(${current.current.scale})`;
    }

    function positionHighlight() {
        const el = highlightRef.current;
        const p = highlightPixel.current;
        if (!el || !p) return;
        const c = current.current;
        el.style.display = 'block';
        el.style.left = `${p.x * c.scale + c.x}px`;
        el.style.top = `${p.y * c.scale + c.y}px`;
        el.style.width = `${c.scale}px`;
        el.style.height = `${c.scale}px`;
    }

    function showHighlight(pixelX: number, pixelY: number) {
        highlightPixel.current = { x: pixelX, y: pixelY };
        positionHighlight();
    }

    function clearHighlight() {
        highlightPixel.current = null;
        const el = highlightRef.current;
        if (el) el.style.display = 'none';
    }

    function lerp(a: number, b: number, t: number) {
        return a + (b - a) * t;
    }

    function tick() {
        const c = current.current;
        const t = target.current;
        c.x = lerp(c.x, t.x, SMOOTH);
        c.y = lerp(c.y, t.y, SMOOTH);
        c.scale = lerp(c.scale, t.scale, SMOOTH);
        applyTransform();
        positionHighlight();
        rafId.current = requestAnimationFrame(tick);
    }

    useEffect(() => {
        fetch('./canvas.json')
            .then(res => res.json())
            .then((grid: number[][]) => {
                gridRef.current = grid;
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

    function zoomToward(cursorX: number, cursorY: number, newScale: number) {
        const t = target.current;
        const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, newScale));
        const ratio = clamped / t.scale;
        t.x = cursorX - (cursorX - t.x) * ratio;
        t.y = cursorY - (cursorY - t.y) * ratio;
        t.scale = clamped;
    }

    function hitTestPixel(clientX: number, clientY: number) {
        const container = containerRef.current!;
        const grid = gridRef.current;
        if (!grid) return;
        const rect = container.getBoundingClientRect();
        const canvasX = Math.floor((clientX - rect.left - current.current.x) / current.current.scale);
        const canvasY = Math.floor((clientY - rect.top - current.current.y) / current.current.scale);
        showHighlight(canvasX, canvasY);
        onPixelClick?.(canvasX, canvasY, COLORS[grid[canvasY][canvasX]] ?? '#000000');
        onTransformChange?.(current.current.x, current.current.y, current.current.scale);
    }
    // --- Mouse ---

    function onMouseDown(e: React.MouseEvent) {
        drag.current = {
            active: true,
            didDrag: false,
            startX: e.clientX,
            startY: e.clientY,
            startOffsetX: target.current.x,
            startOffsetY: target.current.y,
        };
    }

    function onMouseMove(e: React.MouseEvent) {
        if (!drag.current.active) return;
        const dx = e.clientX - drag.current.startX;
        const dy = e.clientY - drag.current.startY;
        if (!drag.current.didDrag && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
        drag.current.didDrag = true;
        target.current.x = drag.current.startOffsetX + dx;
        target.current.y = drag.current.startOffsetY + dy;
        onOutofFocus();
        clearHighlight();
    }
    function onMouseUp(e: React.MouseEvent) {
        const wasClick = drag.current.active && !drag.current.didDrag;
        drag.current.active = false;
        drag.current.didDrag = false;
        if (wasClick) {
            hitTestPixel(e.clientX, e.clientY);
        }
    }

    function onMouseLeave() {
        drag.current.active = false;
        drag.current.didDrag = false;
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
                didDrag: false,
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
            const dx = e.touches[0].clientX - drag.current.startX;
            const dy = e.touches[0].clientY - drag.current.startY;
            if (!drag.current.didDrag && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
            drag.current.didDrag = true;
            target.current.x = drag.current.startOffsetX + dx;
            target.current.y = drag.current.startOffsetY + dy;
        } else if (e.touches.length === 2 && pinch.current) {
            const newDist = getDistance(e.touches);
            const factor = newDist / pinch.current.dist;
            const container = containerRef.current!;
            const rect = container.getBoundingClientRect();
            const midX = ((e.touches[0].clientX + e.touches[1].clientX) / 2) - rect.left;
            const midY = ((e.touches[0].clientY + e.touches[1].clientY) / 2) - rect.top;
            zoomToward(midX, midY, target.current.scale * factor);
            pinch.current.dist = newDist;
        }
        onOutofFocus();
        clearHighlight();
    }

    function onTouchEnd(e: React.TouchEvent) {
        if (drag.current.active && !drag.current.didDrag && e.changedTouches.length === 1) {
            hitTestPixel(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
        drag.current.active = false;
        drag.current.didDrag = false;
        pinch.current = null;
    }

    return (
        <div
            ref={containerRef}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
                width: '100vw',
                height: '100vh',
                overflow: 'hidden',
                position: 'relative',
                cursor: 'grab',
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
            {/* Swap this div's contents for a map pin or any component later */}
            <div
                ref={highlightRef}
                style={{
                    display: 'none',
                    position: 'absolute',
                    boxSizing: 'border-box',
                    border: '2px solid white',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}
            />
        </div>
    );
}

export default Canvas;