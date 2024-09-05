async function init11() {
  console.log(new Date(), '[script.defer11] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer11] called end init');
}
