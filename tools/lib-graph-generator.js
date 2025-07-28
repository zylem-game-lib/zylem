import madge from 'madge';

madge('dist/main.js').then((res) => {
  console.log(res.obj());
});
