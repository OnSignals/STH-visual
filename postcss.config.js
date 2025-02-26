const config = {
    plugins: [
        require('postcss-preset-env')({
            stage: 3,
            features: {
                'media-query-ranges': false,
            },
        }),
    ],
};

module.exports = config;
