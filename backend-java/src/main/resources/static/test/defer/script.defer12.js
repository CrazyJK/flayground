async function init12() {
  console.log(new Date(), '[script.defer12] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer12] called end init');
}
