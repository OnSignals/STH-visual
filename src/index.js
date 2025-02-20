const { aaa } = require('./import');

console.log('index.js');

const a = {
    a: 0,
    b: 1,
};

const b = () => {
    console.log('b()');
};

console.log(a?.b);

b();
aaa();
