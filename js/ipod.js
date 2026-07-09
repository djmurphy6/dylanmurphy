/**
 * Unified click wheel + compass button controller.
 *
 * The wheel/buttons are part of the persistent shell (index.html), so this
 * module is loaded once. Each time the router swaps in a new screen, it calls
 * window.Ipod.init(screenRoot, screenData) to rebind behavior (menu items,
 * scroll target, or static handlers) for the new screen.
 */
(function () {
    const clickWheel = document.getElementById('click-wheel');
    const centerButton = document.getElementById('center-button');
    const btnMenu = document.getElementById('btn-menu');
    const btnPrev = document.getElementById('btn-prev');
    const btnNext = document.getElementById('btn-next');
    const btnPlay = document.getElementById('btn-play');

    const SENSITIVITY = 1.5;
    const ROTATION_THRESHOLD_MOUSE = 30;
    const ROTATION_THRESHOLD_TOUCH = 25;
    const SCROLL_SENSITIVITY = 4;

    let mode = 'menu';
    let menuItems = [];
    let currentSelection = 0;
    let scrollTarget = null;

    let onSelect = null;
    let onPrev = null;
    let onNext = null;

    let isDragging = false;
    let lastAngle = 0;
    let totalRotation = 0;
    let visualRotation = 0;

    function getAngle(event, element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = event.clientX - centerX;
        const y = event.clientY - centerY;
        return Math.atan2(y, x) * (180 / Math.PI);
    }

    function normalizeDelta(delta) {
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return delta;
    }

    function handleRotation(deltaAngle, isTouch) {
        if (mode === 'menu') {
            totalRotation += deltaAngle * SENSITIVITY;
            const threshold = isTouch ? ROTATION_THRESHOLD_TOUCH : ROTATION_THRESHOLD_MOUSE;
            if (Math.abs(totalRotation) >= threshold) {
                if (totalRotation > 0) navigateDown();
                else navigateUp();
                totalRotation = 0;
            }
        } else if (mode === 'scroll' && scrollTarget) {
            visualRotation += deltaAngle;
            const scrollAmount = deltaAngle * SCROLL_SENSITIVITY * 10;
            scrollTarget.scrollTop += scrollAmount;
            clickWheel.style.transform = `rotate(${visualRotation}deg)`;
        }
    }

    clickWheel.addEventListener('mousedown', function (e) {
        if (e.target === centerButton) return;
        isDragging = true;
        lastAngle = getAngle(e, clickWheel);
        e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        const currentAngle = getAngle(e, clickWheel);
        const deltaAngle = normalizeDelta(currentAngle - lastAngle);
        handleRotation(deltaAngle, false);
        lastAngle = currentAngle;
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
        totalRotation = 0;
    });

    clickWheel.addEventListener('touchstart', function (e) {
        if (e.target === centerButton) return;
        isDragging = true;
        lastAngle = getAngle(e.touches[0], clickWheel);
        e.preventDefault();
    });

    document.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        const currentAngle = getAngle(e.touches[0], clickWheel);
        const deltaAngle = normalizeDelta(currentAngle - lastAngle);
        handleRotation(deltaAngle, true);
        lastAngle = currentAngle;
        e.preventDefault();
    });

    document.addEventListener('touchend', function () {
        isDragging = false;
        totalRotation = 0;
    });

    centerButton.addEventListener('click', function (e) {
        e.stopPropagation();
        if (onSelect) onSelect();
    });

    btnMenu.addEventListener('click', function (e) {
        e.stopPropagation();
        window.history.back();
    });

    btnPrev.addEventListener('click', function (e) {
        e.stopPropagation();
        if (onPrev) onPrev();
    });

    btnNext.addEventListener('click', function (e) {
        e.stopPropagation();
        if (onNext) onNext();
    });

    btnPlay.addEventListener('click', function (e) {
        e.stopPropagation();
        if (onSelect) onSelect();
    });

    document.addEventListener('keydown', function (e) {
        switch (e.key) {
            case 'ArrowUp':
                e.preventDefault();
                if (onPrev) onPrev();
                break;
            case 'ArrowDown':
                e.preventDefault();
                if (onNext) onNext();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (onSelect) onSelect();
                break;
        }
    });

    function navigateUp() {
        if (menuItems.length === 0 || currentSelection === 0) return;
        menuItems[currentSelection].classList.remove('selected');
        currentSelection -= 1;
        menuItems[currentSelection].classList.add('selected');
    }

    function navigateDown() {
        if (menuItems.length === 0 || currentSelection === menuItems.length - 1) return;
        menuItems[currentSelection].classList.remove('selected');
        currentSelection += 1;
        menuItems[currentSelection].classList.add('selected');
    }

    function activateMenuItem(item) {
        if (!item) return;
        const link = item.querySelector('a');
        if (link) {
            if (link.target === '_blank') {
                window.open(link.href, '_blank');
            } else {
                window.Router.navigate(link.getAttribute('href'));
            }
        } else if (item.dataset.action === 'alert') {
            alert(item.dataset.alertText || '');
        }
    }

    function selectCurrentMenuItem() {
        if (menuItems.length === 0) return;
        activateMenuItem(menuItems[currentSelection]);
    }

    function initMenuMode(root) {
        menuItems = Array.from(root.querySelectorAll('.menu li'));
        currentSelection = 0;
        menuItems.forEach((el) => el.classList.remove('selected'));
        if (menuItems.length) menuItems[0].classList.add('selected');

        // Clicking a menu item directly (mouse/touch) should also select it.
        // preventDefault stops the native <a> navigation so the router can
        // handle internal links without a full page reload.
        menuItems.forEach((item, index) => {
            item.addEventListener('click', function (e) {
                if (item.querySelector('a')) e.preventDefault();
                menuItems[currentSelection].classList.remove('selected');
                currentSelection = index;
                menuItems[currentSelection].classList.add('selected');
                activateMenuItem(item);
            });
        });

        onSelect = selectCurrentMenuItem;
        onPrev = navigateUp;
        onNext = navigateDown;
    }

    function initScrollMode(root, parentPath) {
        scrollTarget = root.querySelector('.preview-content, .now-playing-content');
        visualRotation = 0;
        clickWheel.style.transform = 'rotate(0deg)';
        onSelect = function () {
            if (parentPath) window.Router.navigate(parentPath);
        };
        onPrev = function () {
            if (scrollTarget) scrollTarget.scrollBy({ top: -60, behavior: 'smooth' });
        };
        onNext = function () {
            if (scrollTarget) scrollTarget.scrollBy({ top: 60, behavior: 'smooth' });
        };
    }

    function initStaticMode(root, parentPath) {
        menuItems = [];
        onSelect = function () {
            if (parentPath) window.Router.navigate(parentPath);
        };
        onPrev = function () {};
        onNext = function () {};
    }

    function reset() {
        menuItems = [];
        currentSelection = 0;
        scrollTarget = null;
        visualRotation = 0;
        totalRotation = 0;
        clickWheel.style.transform = '';
        onSelect = null;
        onPrev = null;
        onNext = null;
    }

    window.Ipod = {
        init(screenRoot, screenData) {
            reset();
            mode = screenData.mode;
            if (mode === 'menu') {
                initMenuMode(screenRoot);
            } else if (mode === 'scroll') {
                initScrollMode(screenRoot, screenData.parent);
            } else {
                initStaticMode(screenRoot, screenData.parent);
            }
        }
    };
})();
