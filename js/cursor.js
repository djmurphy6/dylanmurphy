/**
 * Sitewide custom cursor: hides the system pointer on fine-pointer devices
 * and follows the mouse with a gentle, organic light-green orb.
 *
 * Position eases toward the pointer (soft trailing) and the orb stretches
 * along its direction of travel, so movement drags the shape. A faint idle
 * drift keeps the light alive when the mouse is still. Breathing and shape
 * morphing are handled in CSS (style.css: .cursor-blob-core).
 */
(function () {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!finePointer.matches) return;

    const blob = document.createElement('div');
    blob.className = 'cursor-blob';
    blob.setAttribute('aria-hidden', 'true');

    const core = document.createElement('div');
    core.className = 'cursor-blob-core';
    blob.appendChild(core);
    document.body.appendChild(blob);

    const FOLLOW = 0.12;        // lerp factor — lower = dreamier trailing
    const DRIFT_RADIUS = 1.6;   // px of idle wander
    const STRETCH_GAIN = 0.045; // how strongly speed pulls the orb apart
    const STRETCH_MAX = 0.65;   // cap: 1.65x long, proportionally squashed
    const STRETCH_EASE = 0.15;  // how quickly the stretch relaxes back
    let targetX = -100;
    let targetY = -100;
    let x = targetX;
    let y = targetY;
    let stretch = 0;
    let angle = 0;
    let visible = false;
    let raf = 0;

    function loop(now) {
        const prevX = x;
        const prevY = y;
        x += (targetX - x) * FOLLOW;
        y += (targetY - y) * FOLLOW;

        // Movement this frame drives the drag: the orb elongates along its
        // direction of travel and squashes across it, relaxing when it slows.
        const dx = x - prevX;
        const dy = y - prevY;
        const speed = Math.hypot(dx, dy);
        const targetStretch = Math.min(speed * STRETCH_GAIN, STRETCH_MAX);
        stretch += (targetStretch - stretch) * STRETCH_EASE;
        if (speed > 0.3) {
            angle = Math.atan2(dy, dx);
        }
        const sx = 1 + stretch;
        const sy = 1 / sx; // preserve area so the light smears, not grows

        // Faint slow wander (two offset sine waves so it never repeats cleanly)
        const t = now / 1000;
        const driftX = Math.sin(t * 0.7) * DRIFT_RADIUS + Math.sin(t * 0.23) * DRIFT_RADIUS * 0.5;
        const driftY = Math.cos(t * 0.55) * DRIFT_RADIUS + Math.cos(t * 0.31) * DRIFT_RADIUS * 0.5;

        blob.style.transform =
            'translate3d(' + (x + driftX) + 'px, ' + (y + driftY) + 'px, 0)' +
            ' rotate(' + angle + 'rad)' +
            ' scale(' + sx + ', ' + sy + ')';

        raf = requestAnimationFrame(loop);
    }

    function startLoop() {
        if (!raf) raf = requestAnimationFrame(loop);
    }

    function stopLoop() {
        if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
        }
    }

    function show() {
        if (visible) return;
        visible = true;
        blob.classList.add('is-visible');
        startLoop();
    }

    function hide() {
        if (!visible) return;
        visible = false;
        blob.classList.remove('is-visible', 'is-pressed');
        stopLoop();
    }

    document.addEventListener('pointermove', function (e) {
        if (e.pointerType !== 'mouse') return;
        targetX = e.clientX;
        targetY = e.clientY;
        if (!visible) {
            // First appearance: start at the pointer instead of gliding in
            x = targetX;
            y = targetY;
        }
        show();
    });

    document.addEventListener('pointerdown', function (e) {
        if (e.pointerType !== 'mouse') return;
        targetX = e.clientX;
        targetY = e.clientY;
        blob.classList.add('is-pressed');
        show();
    });

    document.addEventListener('pointerup', function (e) {
        if (e.pointerType !== 'mouse') return;
        blob.classList.remove('is-pressed');
    });

    document.documentElement.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);
})();
