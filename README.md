# STHVisual

https://github.com/user-attachments/assets/cd836599-e829-41ad-971b-313ed0b5eea5

## Demo

https://sth-visual.ff0000.dev

## Installation

Just include the script and base CSS found in the `dist` folder before the closing `</body>` of your page.

```html
<script src="dist/sth-visual.legacy.min.js"></script>
<link href="dist/sth-visual.css" rel="stylesheet" />
```

## How it works

The script searches for elements with a `data-STHVisual-role="instance"` attribute and appends a `<canvas />` element to it which to draw the visual on. This `<canvas />` is automatically resized to fit the wrapper element and is positioned absolutely with a low z-index. This enables you to render DOM content on top if it.

The instance and item data is read from the wrapper element's `data-STHVisual-data` attribute:

```html
<article data-STHVisual-role="instance" data-STHVisual-data="{...data...}">...DOM content...</article>
```

Data must be provided via an escaped JSON-encoded object of the following format:

```js
{
  title:"Optional title of the instance",
  items: [
    {
      "id":"item-1",
      "video": {
        "combined": "https://example.com/..../video_01.mp3",
        "width": 1280,
        "height": 720,
        "thumbnail": "https://example.com/..../video_thumbnail_01.jpg"
      }
    },
    {
      "id":"item-2",
      "video": {
        "combined": "https://example.com/..../video_02.mp3",
        "width": 720,
        "height": 1280,
        "thumbnail": "https://example.com/..../video_thumbnail_02.jpg"
      }
    }
  ]
}
```

## Instance data

-   `title`: `{string}` Optional title. For internal use only.
-   `items`: `{array}` Array of items. Each instance can render one or multiple items.
    -   `id`: `{string}` Unique id. Can be auto-generated.
    -   `video`: `{object}` video data
        -   `combined`: `{string}` URL of the video (combining color and depth map)
        -   `width`: `{number}` Video width.
        -   `height`: `{number}` Video height.
        -   `thumbnail`: `{string}` URL of a thumbnail image.

## API

To interact with the instances each instance provides an event-based API.

### Interact with the instance

To instruct an instance to render one of the provided items, dispatch a custom event named `STHVisual/api` on the instance's wrapper element. The event's data object must contain the action and an optional item index.

#### Show next item

```js
const customEvent = new CustomEvent(`STHVisual/api`, {
    detail: {
        action: 'next',
    },
});
instanceElement.dispatchEvent(customEvent);
```

#### Show previous item

```js
const customEvent = new CustomEvent(`STHVisual/api`, {
    detail: {
        action: 'prev',
    },
});
instanceElement.dispatchEvent(customEvent);
```

#### Show specific item by index

```js
const customEvent = new CustomEvent(`STHVisual/api`, {
    detail: {
        action: 'go',
        index: 2,
    },
});
instanceElement.dispatchEvent(customEvent);
```

### Emitted events

Each instance emits custom events be consumed by third-party scripts:

-   `STHVisual/initiated`
-   `STHVisual/loaded`

Subscribe to these events like:

```js
instanceElement.addEventListener('STHVisual/loaded', () => {
    console.log('this instance has loaded the first item...');
});
```

## Data attributes

The script also populates each instance's wrapper element with the following data attrubutes:

-   `data-STHVisual-isInitiated` : `{boolean}`
-   `data-STHVisual-isLoaded` : `{boolean}`

This helps with conditional styling e.g.:

```css
.wrapper[data-STHVisual-isLoaded='true'] {
    /** some styling... */
}
```

## Misc

### Performance

Each instance observes its wrapper element's size and visibility. Instances that are currently not in view are not rendered for performance reasons.

### Accessibility

The script automatically detects user preferences for reduced motion based on the [`@media (prefers-reduced-motion)`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) media query. If this flag is detected, the script disables itself.

Always provide meaningful fallback content for this case.
