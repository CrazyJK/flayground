async function init13() {
  console.log(new Date(), '[script.defer13] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer13] called end init');
}
