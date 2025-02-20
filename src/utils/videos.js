async function resolveRedirectedUrl(url) {
    if (!url) return null;

    const response = await fetch(url, {
        method: 'HEAD',
    });

    return response.url;
}

export { resolveRedirectedUrl };
