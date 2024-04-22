document.addEventListener("DOMContentLoaded", function() {

    const easeInOutCirc = t => {
        if ((t *= 2) < 1) return -0.5 * (Math.sqrt(1 - t * t) - 1);
        return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    };
    
    const lenis = new Lenis({
        ease: easeInOutCirc,
        multiplier: 2,
        smoothMobile: true,
        smoothElements: '[data-scroll]',
        smoothWheel: true,
        smoothKeys: true,
        smoothScrollbar: true,
        scrollbarContainer: null,
        direction: 'vertical',
        snap: true,
        snapAlignment: 'start',
        snapInterval: '50%',
        snapStrict: true,
        anchors: '[data-anchor]',
        limits: true,
        limitTop: 0,
        limitBottom: 1
    });

    

    lenis.on('scroll', (e) => {
        console.log(e);
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
});
