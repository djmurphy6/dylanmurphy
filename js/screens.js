/**
 * Screen registry for the SPA router.
 *
 * mode:
 *   'menu'   -> click wheel navigates a `.menu li` list (up/down/select)
 *   'scroll' -> click wheel scrolls `.preview-content` / `.now-playing-content`
 *   'static' -> no menu, no scroll; center/play button returns to `parent`
 *
 * parent: path used by the MENU button fallback isn't needed (MENU always
 * uses browser history.back()), but is used by scroll/static screens so the
 * center/play button has a predictable destination.
 */
window.ScreensData = {
    '/': {
        fragment: 'screens/home.html',
        mode: 'menu',
        title: 'iDylan Murphy',
        parent: null
    },
    '/skills': {
        fragment: 'screens/skills.html',
        mode: 'menu',
        title: 'iDylan Murphy',
        parent: '/'
    },
    '/lang': {
        fragment: 'screens/lang.html',
        mode: 'menu',
        title: 'iDylan Murphy',
        parent: '/'
    },
    '/linkedin': {
        fragment: 'screens/linkedin.html',
        mode: 'menu',
        title: 'iDylan Murphy - LinkedIn',
        parent: '/'
    },
    '/github': {
        fragment: 'screens/github.html',
        mode: 'menu',
        title: 'iDylan Murphy - GitHub',
        parent: '/'
    },
    '/nowplaying': {
        fragment: 'screens/nowplaying.html',
        mode: 'static',
        title: 'iDylan Murphy - Now Playing',
        parent: '/'
    },
    '/fastlearner': {
        fragment: 'screens/fastlearner.html',
        mode: 'scroll',
        title: 'iDylan Murphy',
        parent: '/skills'
    },
    '/teamwork': {
        fragment: 'screens/teamwork.html',
        mode: 'scroll',
        title: 'Teamwork - Dylan Murphy',
        parent: '/skills'
    },
    '/leadership': {
        fragment: 'screens/leadership.html',
        mode: 'scroll',
        title: 'iDylan Murphy - Leadership',
        parent: '/skills'
    },
    '/coaching': {
        fragment: 'screens/coaching.html',
        mode: 'scroll',
        title: 'Coaching - Dylan Murphy',
        parent: '/skills'
    }
};
