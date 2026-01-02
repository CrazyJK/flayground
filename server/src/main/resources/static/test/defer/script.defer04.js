async function init04() {
  console.log(new Date(), '[script.defer04] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer04] called end init');
}
