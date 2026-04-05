async function init08() {
  console.log(new Date(), '[script.defer08] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer08] called end init');
}
