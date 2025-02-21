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
        return new Promise(async (resolve) => {
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
                    .then(() => {
                        resolve();
                    })
                    .catch((error) => {
                        console.error(error);

                        resolve();
                    });
            });

            this.videoElement.src = this.url;
        });
    }

    unbuild() {
        if (!this.videoElement) return;

        this.videoElement.src = null;
        this.videoElement.load();

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
