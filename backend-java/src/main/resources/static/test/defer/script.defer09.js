async function init09() {
  console.log(new Date(), '[script.defer09] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer09] called end init');
}
