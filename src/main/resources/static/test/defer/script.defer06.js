async function init06() {
  console.log(new Date(), '[script.defer06] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer06] called end init');
}
