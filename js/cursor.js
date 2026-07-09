/**
 * Sitewide custom cursor: hides the system pointer on fine-pointer devices
 * and follows the mouse with a gentle, organic light-green orb.
 *
 * Position eases toward the pointer (soft trailing). Movement rotates the
 * orb to face its direction of travel and, while dragging, tapers its
 * trailing edge and bulges its leading edge slightly — a single shared
 * deformation (not independent per-corner noise), so it always reads as
 * one cohesive orb rather than a jittery, lumpy blob. A gentle synced
 * wobble keeps it breathing at rest too. A soft specular highlight is
 * counter-rotated against the body's turn (plus its own faint drift), so
 * it stays roughly fixed in screen space — the cue that sells it as a lit,
 * three-dimensional sphere rather than a flat rotating shape. Opacity/blur/
 * scale pulse lives in CSS (.cursor-blob-core).
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

    const highlight = document.createElement('div');
    highlight.className = 'cursor-blob-highlight';
    core.appendChild(highlight);

    document.body.appendChild(blob);

    const FOLLOW = 0.22;        // lerp factor — higher = less lag
    const DRIFT_RADIUS = 1.6;   // px of idle wander
    const STRETCH_GAIN = 0.028; // how strongly speed pulls the orb apart
    const STRETCH_MAX = 0.38;   // cap on the wrapper's elongation
    const STRETCH_EASE = 0.16;  // how quickly the stretch relaxes back
    const PRESS_SCALE = 0.85;

    let targetX = -100;
    let targetY = -100;
    let x = targetX;
    let y = targetY;
    let stretch = 0;
    let angle = 0;
    let pressed = false;
    let visible = false;
    let raf = 0;

    function clamp(v, min, max) {
        return v < min ? min : v > max ? max : v;
    }

    function loop(now) {
        const prevX = x;
        const prevY = y;
        x += (targetX - x) * FOLLOW;
        y += (targetY - y) * FOLLOW;

        const dx = x - prevX;
        const dy = y - prevY;
        const speed = Math.hypot(dx, dy);
        const targetStretch = Math.min(speed * STRETCH_GAIN, STRETCH_MAX);
        stretch += (targetStretch - stretch) * STRETCH_EASE;
        if (speed > 0.3) {
            angle = Math.atan2(dy, dx);
        }

        const press = pressed ? PRESS_SCALE : 1;
        const sx = (1 + stretch) * press;
        const sy = (1 / (1 + stretch)) * press; // preserve area so it smears, not grows

        // Faint slow wander (two offset sine waves so it never repeats cleanly)
        const t = now / 1000;
        const driftX = Math.sin(t * 0.7) * DRIFT_RADIUS + Math.sin(t * 0.23) * DRIFT_RADIUS * 0.5;
        const driftY = Math.cos(t * 0.55) * DRIFT_RADIUS + Math.cos(t * 0.31) * DRIFT_RADIUS * 0.5;

        blob.style.transform =
            'translate3d(' + (x + driftX) + 'px, ' + (y + driftY) + 'px, 0)' +
            ' rotate(' + angle + 'rad)' +
            ' scale(' + sx + ', ' + sy + ')';

        // Organic silhouette: rotate() above aligns the shape's local +x axis
        // with the direction of travel, so "front" = right side (TR/BR),
        // "trailing" = left side (TL/BL). A single shared idle wobble moves
        // all corners together (the orb breathes/wobbles as one piece);
        // dragging then tapers the trailing edge and bulges the front by
        // the same shared amount on both axes, so it stretches like one
        // cohesive droplet of light rather than warping unevenly per-corner.
        const pull = clamp(stretch * 40, 0, 24);
        const idle = Math.sin(t * 0.5) * 4 + Math.sin(t * 0.19 + 2.1) * 2;
        const front = clamp(50 + idle + pull * 0.5, 34, 66);
        const back = clamp(50 + idle - pull, 24, 66);

        core.style.borderRadius =
            back + '% ' + front + '% ' + front + '% ' + back + '% / ' +
            back + '% ' + front + '% ' + front + '% ' + back + '%';

        // Counter-rotate the highlight so it stays roughly put on screen
        // while the body turns underneath it, plus a faint independent
        // drift so the glint itself feels alive rather than pinned.
        const hlDriftX = Math.sin(t * 0.9 + 0.6) * 1.4;
        const hlDriftY = Math.cos(t * 0.77 + 1.9) * 1.4;
        highlight.style.transform =
            'rotate(' + (-angle) + 'rad) translate(' + hlDriftX + 'px, ' + hlDriftY + 'px)';

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
        pressed = false;
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
        pressed = true;
        blob.classList.add('is-pressed');
        show();
    });

    document.addEventListener('pointerup', function (e) {
        if (e.pointerType !== 'mouse') return;
        pressed = false;
        blob.classList.remove('is-pressed');
    });

    document.documentElement.addEventListener('mouseleave', hide);
    window.addEventListener('blur', hide);
})();
