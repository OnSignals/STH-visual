# STHVisual

##

## Installation

Just include the script and base CSS in your page. The script then auto-inits itself.

```html
<script src="https://githubraw.com/OnSignals/STH-visual/main/dist/sth-visual.legacy.min.js"></script>
<link href="https://githubraw.com/OnSignals/STH-visual/main/dist/sth-visual.css" rel="stylesheet" />
```

## How it works

The script searches for elements with a `data-STHVisual-role="instance"` attribute and reads the instance data from its `data-STHVisual-data` attribute. This data needs to be an escaped JSON-encoded object of the following format:

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
]}
```

### Data properties

-   `title`: `{string}` Optional title. For internal use only.
-   `items`: `{array}` Array of items. Each instance can render one or multiple items.
    -   `id`: `{string}`Unique id. Can be auto-generated.
    -   `video`: `{object}` video data
        -   `combined`: `{string}` URL of the video (combining color and depth map)
        -   `width`: `{number}` Video width.
        -   `height`: `{number}` Video height.
        -   `thumbnail`: `{string}` URL of a thumbnail image.

Each instance observes its parent element's size and visibility. Instances that are currently not in view are not rendered for performance reasons.

## API

To interact with the instances each instance provides an event-based API.

### Interact with the instance

To instruct an instance to render of the provided items, dispatch a custom event named `STHVisual/api` on the instance's wrapper element. The event's event data must contain the action and optional item index.

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

Each instance emits custom events for the third-party scripts:

-   `STHVisual/initiated`
-   `STHVisual/loaded`

### Data attributes

The script populates each instance's wrapper element with the following data attrubutes:

-   `data-STHVisual-isInitiated` : {boolean}
-   `data-STHVisual-isLoaded` : {boolean}

This helps conditional styling e.g.:

```css
.wrapper[data-STHVisual-isLoaded='true'] {
    ...;
}
```
