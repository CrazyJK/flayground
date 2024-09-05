async function init01() {
  console.log(new Date(), '[script.defer01] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer01] called end init');
}
