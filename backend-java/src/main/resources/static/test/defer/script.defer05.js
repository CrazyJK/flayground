async function init05() {
  console.log(new Date(), '[script.defer05] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer05] called end init');
}
