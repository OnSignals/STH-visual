import { resolveRedirectedUrl } from './utils/videos';

class VideoElement {
    constructor(url, videoAttributes = {}) {
        console.log('new VideoElement()', url);
        if (!url) return;

        this.url = url;
        this.videoAttributes = videoAttributes;

        this.videoElement = null;
    }

    async build() {
        this.url = await resolveRedirectedUrl(this.url);

        this.videoElement = Object.assign(document.createElement('video'), {
            crossOrigin: 'anonymous',
            loop: true,
            muted: true,
            playsInline: true,
            ...this.videoAttributes,
        });

        this.videoElement.addEventListener('canplay', () => {
            this.videoElement
                .play()
                .then(() => {})
                .catch((error) => {
                    console.error(error);
                });
        });

        this.videoElement.src = this.url;
    }

    unbuild() {
        this.videoElement.remove();
        this.videoElement = null;
    }

    getVideoElement() {
        return this?.videoElement;
    }

    destroy() {
        this.unbuild();
    }
}

export { VideoElement };
