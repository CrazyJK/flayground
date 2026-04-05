async function init02() {
  console.log(new Date(), '[script.defer02] called start init');

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(new Date(), '[script.defer02] called end init');
}
