async function init03() {
  console.log(new Date(), '[script.defer03] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer03] called end init');
}
