async function init07() {
  console.log(new Date(), '[script.defer07] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer07] called end init');
}
