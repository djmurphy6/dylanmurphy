/**
 * Background gravity grid: a full-viewport grid behind the iPod that treats
 * the cursor as a weight resting on a stretched sheet. Grid vertices near
 * the pointer sink away from the viewer (gain z-depth) and are perspective-
 * projected toward the cursor, so lines converge into a funnel-shaped
 * depression. A soft radial shadow inside the well and a slightly
 * underdamped spring on the well's depth (it settles with a tiny bounce,
 * and deepens while the mouse button is held) sell the sense of mass.
 *
 * The pointer position itself is lerped so the well trails the cursor a
 * touch — heavy things don't move instantly. On touch devices or with
 * prefers-reduced-motion the grid renders flat and static.
 */
(function () {
    const canvas = document.createElement('canvas');
    canvas.className = 'bg-grid';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');

    const CELL = 44;          // grid spacing (px)
    const SIGMA = 120;        // radius of the well's influence
    const DEPTH = 460;        // max z-depth at full weight (px into the screen)
    const FOCAL = 620;        // perspective focal length — lower = more warp
    const FOLLOW = 0.16;      // pointer lerp — lower = heavier trailing
    const STIFF = 0.045;      // spring stiffness for the well depth
    const DAMP = 0.86;        // spring damping (<1 underdamped = tiny settle bounce)
    const PRESS_BOOST = 1.45; // holding the mouse down presses harder
    const LINE = 'rgba(51, 51, 51, 0.10)';

    const interactive =
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let targetX = -9999;
    let targetY = -9999;
    let px = targetX;
    let py = targetY;
    let weight = 0;        // current well strength, 0..~1.45
    let weightV = 0;       // spring velocity
    let targetWeight = 0;
    let pressed = false;
    let raf = 0;

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        if (!raf) drawFlat();
    }

    function drawFlat() {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = 0.5; x <= width; x += CELL) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = 0.5; y <= height; y += CELL) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }

    // Depth of the sheet at (x, y): a gaussian well centered on the pointer.
    // Returns z in px "into" the screen.
    function depthAt(x, y, amp, twoSigma2) {
        const dx = x - px;
        const dy = y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 > twoSigma2 * 4.5) return 0; // beyond ~3σ the well is flat
        return amp * Math.exp(-d2 / twoSigma2);
    }

    // Project a sheet point through the well: points with depth are pulled
    // toward the pointer by simple perspective (deeper = pulled more), which
    // makes the grid visibly converge into the depression.
    function project(x, y, amp, twoSigma2, out) {
        const z = depthAt(x, y, amp, twoSigma2);
        if (z === 0) {
            out.x = x;
            out.y = y;
            return;
        }
        const s = FOCAL / (FOCAL + z);
        out.x = px + (x - px) * s;
        out.y = py + (y - py) * s;
    }

    const pt = { x: 0, y: 0 };

    function draw() {
        const amp = DEPTH * weight;
        const twoSigma2 = 2 * SIGMA * SIGMA;

        ctx.clearRect(0, 0, width, height);

        // Shadow first, under the lines: darkest at the bottom of the well,
        // fading to nothing at its rim — the depth cue that reads instantly.
        if (amp > 1) {
            const shade = Math.min(weight, 1.2);
            const r = SIGMA * 2.4;
            const g = ctx.createRadialGradient(px, py, 0, px, py, r);
            g.addColorStop(0, 'rgba(40, 45, 42, ' + 0.13 * shade + ')');
            g.addColorStop(0.55, 'rgba(40, 45, 42, ' + 0.05 * shade + ')');
            g.addColorStop(1, 'rgba(40, 45, 42, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(px - r, py - r, r * 2, r * 2);
        }

        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Subdivide segments only near the well so curves stay smooth there
        // without paying for dense sampling across the whole viewport.
        const influence = SIGMA * 3.2;

        for (let x = 0.5; x <= width; x += CELL) {
            const near = amp > 1 && Math.abs(x - px) < influence;
            const step = near ? 8 : height;
            ctx.moveTo(x, 0);
            for (let y = step; y <= height + step; y += step) {
                const yy = Math.min(y, height);
                project(x, yy, amp, twoSigma2, pt);
                ctx.lineTo(pt.x, pt.y);
                if (yy === height) break;
            }
        }

        for (let y = 0.5; y <= height; y += CELL) {
            const near = amp > 1 && Math.abs(y - py) < influence;
            const step = near ? 8 : width;
            ctx.moveTo(0, y);
            for (let x = step; x <= width + step; x += step) {
                const xx = Math.min(x, width);
                project(xx, y, amp, twoSigma2, pt);
                ctx.lineTo(pt.x, pt.y);
                if (xx === width) break;
            }
        }

        ctx.stroke();
    }

    function loop() {
        px += (targetX - px) * FOLLOW;
        py += (targetY - py) * FOLLOW;

        weightV += (targetWeight - weight) * STIFF;
        weightV *= DAMP;
        weight += weightV;

        draw();

        // Fully settled and flat: render one clean flat frame and idle.
        if (
            targetWeight === 0 &&
            Math.abs(weight) < 0.002 &&
            Math.abs(weightV) < 0.002
        ) {
            weight = 0;
            weightV = 0;
            drawFlat();
            raf = 0;
            return;
        }
        raf = requestAnimationFrame(loop);
    }

    function wake() {
        if (!raf) raf = requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);

    if (!interactive) return;

    document.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        if (targetWeight === 0 && weight < 0.002) {
            // First appearance: land the well at the pointer, don't glide in
            px = e.clientX;
            py = e.clientY;
        }
        targetX = e.clientX;
        targetY = e.clientY;
        targetWeight = pressed ? PRESS_BOOST : 1;
        wake();
    });

    document.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        pressed = true;
        targetX = e.clientX;
        targetY = e.clientY;
        targetWeight = PRESS_BOOST;
        wake();
    });

    document.addEventListener('pointerup', function (e) {
        if (e.pointerType !== 'mouse') return;
        pressed = false;
        if (targetWeight > 0) targetWeight = 1;
    });

    function lift() {
        pressed = false;
        targetWeight = 0;
        wake();
    }

    document.documentElement.addEventListener('mouseleave', lift);
    window.addEventListener('blur', lift);
})();
