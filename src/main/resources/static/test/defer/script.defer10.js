async function init10() {
  console.log(new Date(), '[script.defer10] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer10] called end init');
}
