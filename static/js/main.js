// main.js — students will add JavaScript here as features are built

(function () {
    const modalOverlay = document.getElementById('modalOverlay');
    if (!modalOverlay) return; // Only enable on the landing page that has the modal markup

    const modalClose = document.getElementById('modalClose');
    const modalDescription = document.getElementById('modalDescription');
    const youtubeContainer = document.getElementById('youtubeVideo');

    // Hero CTA link in landing page
    const modalTrigger = document.querySelector('.hero-actions a.hero-btn--secondary');

    if (!modalClose || !youtubeContainer || !modalTrigger) return;

    const closeButtonIsDefault = modalClose.getAttribute('data-default') === 'true';
    void closeButtonIsDefault; // keeps eslint/linters quiet if enabled later

    let youtubePlayer = null;
    let isModalOpen = false;

    // Promise so we can call playVideo() even if the user clicks quickly.
    let resolvePlayerReady;
    const playerReady = new Promise((resolve) => {
        resolvePlayerReady = resolve;
    });

    function setDescriptionVisible(isVisible) {
        if (!modalDescription) return;
        modalDescription.style.display = isVisible ? '' : 'none';
    }

    function setBodyScrollLocked(locked) {
        document.body.style.overflow = locked ? 'hidden' : '';
    }

    function openModal(event) {
        event.preventDefault();
        isModalOpen = true;

        setDescriptionVisible(true);
        setBodyScrollLocked(true);

        modalOverlay.classList.add('active');
        modalOverlay.setAttribute('aria-hidden', 'false');

        // Only start playback after the player is ready.
        playerReady
            .then(() => {
                if (!isModalOpen) return;
                if (youtubePlayer && typeof youtubePlayer.playVideo === 'function') {
                    youtubePlayer.playVideo();
                }
            })
            .catch(() => {
                // No-op: modal still opens even if YouTube fails to initialize.
            });

        // Move focus for accessibility
        modalClose.focus();
    }

    function closeModal() {
        isModalOpen = false;

        modalOverlay.classList.remove('active');
        modalOverlay.setAttribute('aria-hidden', 'true');

        setDescriptionVisible(true);
        setBodyScrollLocked(false);

        try {
            if (youtubePlayer) {
                youtubePlayer.stopVideo(); // must stop playback (no background audio)
                youtubePlayer.pauseVideo();
                youtubePlayer.seekTo(0, true);
            }
        } catch (error) {
            // If the player isn't fully ready or YouTube errors, ignore and keep UX stable.
            console.error('Failed to stop YouTube video:', error);
        }
    }

    // ---- YouTube IFrame API wiring ----
    function ensureYouTubeApiLoaded() {
        if (window.YT && typeof window.YT.Player === 'function') {
            // API already loaded earlier (e.g., hot reload); still ensure a player exists.
            if (!youtubePlayer) window.onYouTubeIframeAPIReady();
            return;
        }

        const existingScript = document.getElementById('youtube-iframe-api');
        if (existingScript) return; // script is already loading/loaded

        const script = document.createElement('script');
        script.id = 'youtube-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(script);
    }

    // YouTube will call this global when the API is ready.
    window.onYouTubeIframeAPIReady = function () {
        try {
            const videoId = youtubeContainer.getAttribute('data-youtube-id') || 'dQw4w9WgXcQ';

            youtubePlayer = new window.YT.Player('youtubeVideo', {
                videoId,
                playerVars: {
                    autoplay: 0,
                    playsinline: 1,
                    enablejsapi: 1,
                    rel: 0,
                    modestbranding: 1
                },
                events: {
                    onStateChange: function (event) {
                        try {
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                // Let the first frame render before hiding description.
                                setTimeout(function () {
                                    if (!isModalOpen) return;
                                    setDescriptionVisible(false);
                                }, 350);
                            }
                        } catch {
                            // ignore state changes
                        }
                    }
                }
            });

            resolvePlayerReady();
        } catch (error) {
            console.error('Failed to initialize YouTube player:', error);
            resolvePlayerReady();
        }
    };

    ensureYouTubeApiLoaded();

    // ---- Modal interactions ----
    modalTrigger.addEventListener('click', openModal);
    modalClose.addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', function (event) {
        // Close only when clicking the overlay, not the modal itself.
        if (event.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
})();
