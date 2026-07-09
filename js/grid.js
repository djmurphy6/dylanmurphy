/**
 * Background gravity grid: a full-viewport grid behind the iPod that treats
 * the cursor as a weight resting on a stretched sheet. Grid vertices right
 * under the pointer sink away from the viewer (gain z-depth) and are
 * perspective-projected toward the cursor, so lines converge into a
 * funnel-shaped depression exactly at the pointer position (no lag). A soft
 * radial shadow inside the well and a slightly underdamped spring on the
 * well's depth (it settles with a tiny bounce, and deepens while the mouse
 * button is held) sell the sense of mass.
 *
 * The sheet is pinned to the iPod: depth fades to zero approaching the
 * device's rounded-rect silhouette (signed-distance falloff), so lines at
 * the iPod's edge never move — the sheet behaves as if it were nailed down
 * around the device. The grid is also drawn with an overscan margin past
 * every viewport edge, so the warp never exposes a blank border. On touch
 * devices or with prefers-reduced-motion the grid renders flat and static.
 */
(function () {
    const canvas = document.createElement('canvas');
    canvas.className = 'bg-grid';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.prepend(canvas);

    const ctx = canvas.getContext('2d');

    const CELL = 36;          // grid spacing (px)
    const SIGMA = 85;         // radius of the well's influence
    const DEPTH = 460;        // max z-depth at full weight (px into the screen)
    const FOCAL = 620;        // perspective focal length — lower = more warp
    const STIFF = 0.045;      // spring stiffness for the well depth
    const DAMP = 0.86;        // spring damping (<1 underdamped = tiny settle bounce)
    const PRESS_BOOST = 1.45; // holding the mouse down presses harder
    const STEP = 6;           // sampling step (px) for line segments inside the well
    const PIN = 90;           // distance from the iPod edge over which the sheet
                              // regains full flexibility (0 at the edge itself)
    const IPOD_RADIUS = 32;   // corner radius of the iPod silhouette
    const LINE = 'rgba(51, 51, 51, 0.09)';

    // Anything farther than 3σ from the pointer is flat (matches the cutoff
    // in depthAt), so lines only need dense sampling inside this band.
    const INFLUENCE = SIGMA * 3;
    // Overscan: draw whole cells past each edge so warped lines never expose
    // a blank border. Must cover the well's reach.
    const MARGIN = Math.ceil(INFLUENCE / CELL) * CELL;

    const interactive =
        window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let px = -9999;        // well center — exactly the pointer position
    let py = -9999;
    let weight = 0;        // current well strength, 0..~1.45
    let weightV = 0;       // spring velocity
    let targetWeight = 0;
    let pressed = false;
    let raf = 0;

    // iPod silhouette (rounded rect) — measured each warped frame so the
    // pin stays correct across resizes and scrolling.
    let ipodEl = null;
    let hasIpod = false;
    let icx = 0;
    let icy = 0;
    let ihw = 0;
    let ihh = 0;

    function measureIpod() {
        if (!ipodEl) ipodEl = document.querySelector('.ipod-body');
        hasIpod = !!ipodEl;
        if (!hasIpod) return;
        const r = ipodEl.getBoundingClientRect();
        icx = r.left + r.width / 2;
        icy = r.top + r.height / 2;
        ihw = r.width / 2;
        ihh = r.height / 2;
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        // Bitmap is dpr-scaled for sharpness, but the *display* size must stay
        // in CSS pixels. Without this, the canvas defaults to its attribute
        // size (width*dpr CSS px), so clientX/Y only line up at the origin
        // and the well drifts farther from the cursor toward the far edges.
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
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

    // How free the sheet is to move at (x, y): 0 at (and inside) the iPod's
    // edge, easing up to 1 at PIN px away — the sheet is pinned to the
    // device's silhouette. Uses the signed distance to a rounded rectangle.
    function edgePin(x, y) {
        if (!hasIpod) return 1;
        const qx = Math.abs(x - icx) - (ihw - IPOD_RADIUS);
        const qy = Math.abs(y - icy) - (ihh - IPOD_RADIUS);
        const ax = qx > 0 ? qx : 0;
        const ay = qy > 0 ? qy : 0;
        const inside = Math.min(Math.max(qx, qy), 0);
        const d = Math.sqrt(ax * ax + ay * ay) + inside - IPOD_RADIUS;
        if (d <= 0) return 0;
        if (d >= PIN) return 1;
        const t = d / PIN;
        return t * t * (3 - 2 * t); // smoothstep
    }

    // Depth of the sheet at (x, y): a gaussian well centered on the pointer,
    // attenuated to zero at the iPod's edge. Returns z in px "into" the
    // screen. Flat beyond 3σ.
    function depthAt(x, y, amp, twoSigma2) {
        const dx = x - px;
        const dy = y - py;
        const d2 = dx * dx + dy * dy;
        if (d2 > twoSigma2 * 4.5) return 0;
        return amp * Math.exp(-d2 / twoSigma2) * edgePin(x, y);
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
        const warped = amp > 1;

        ctx.clearRect(0, 0, width, height);

        // Shadow first, under the lines: darkest at the bottom of the well,
        // fading to nothing at its rim — the depth cue that reads instantly.
        // Scaled by the pin so it dies out at the iPod edge like the warp.
        if (warped) {
            const shade = Math.min(weight, 1.2) * edgePin(px, py);
            if (shade > 0.01) {
                const r = SIGMA * 2.4;
                const g = ctx.createRadialGradient(px, py, 0, px, py, r);
                g.addColorStop(0, 'rgba(40, 45, 42, ' + 0.14 * shade + ')');
                g.addColorStop(0.55, 'rgba(40, 45, 42, ' + 0.05 * shade + ')');
                g.addColorStop(1, 'rgba(40, 45, 42, 0)');
                ctx.fillStyle = g;
                ctx.fillRect(px - r, py - r, r * 2, r * 2);
            }
        }

        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Vertical lines. Each line runs from -MARGIN to height + MARGIN;
        // only the stretch inside the well's influence band is subdivided,
        // the rest is drawn as straight spans (depth there is exactly 0).
        for (let x = 0.5 - MARGIN; x <= width + MARGIN; x += CELL) {
            const y0 = -MARGIN;
            const y1 = height + MARGIN;
            ctx.moveTo(x, y0);
            if (warped && Math.abs(x - px) < INFLUENCE) {
                const bandTop = Math.max(y0, py - INFLUENCE);
                const bandBot = Math.min(y1, py + INFLUENCE);
                if (bandTop > y0) ctx.lineTo(x, bandTop);
                for (let y = bandTop; y < bandBot; y += STEP) {
                    project(x, y, amp, twoSigma2, pt);
                    ctx.lineTo(pt.x, pt.y);
                }
                project(x, bandBot, amp, twoSigma2, pt);
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.lineTo(x, y1);
        }

        // Horizontal lines, same scheme.
        for (let y = 0.5 - MARGIN; y <= height + MARGIN; y += CELL) {
            const x0 = -MARGIN;
            const x1 = width + MARGIN;
            ctx.moveTo(x0, y);
            if (warped && Math.abs(y - py) < INFLUENCE) {
                const bandLeft = Math.max(x0, px - INFLUENCE);
                const bandRight = Math.min(x1, px + INFLUENCE);
                if (bandLeft > x0) ctx.lineTo(bandLeft, y);
                for (let x = bandLeft; x < bandRight; x += STEP) {
                    project(x, y, amp, twoSigma2, pt);
                    ctx.lineTo(pt.x, pt.y);
                }
                project(bandRight, y, amp, twoSigma2, pt);
                ctx.lineTo(pt.x, pt.y);
            }
            ctx.lineTo(x1, y);
        }

        ctx.stroke();
    }

    function loop() {
        weightV += (targetWeight - weight) * STIFF;
        weightV *= DAMP;
        weight += weightV;

        measureIpod();
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
        px = e.clientX;
        py = e.clientY;
        targetWeight = pressed ? PRESS_BOOST : 1;
        wake();
    });

    document.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        pressed = true;
        px = e.clientX;
        py = e.clientY;
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
