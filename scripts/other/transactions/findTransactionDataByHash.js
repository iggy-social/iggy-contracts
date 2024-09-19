// npx hardhat run scripts/other/transactions/findTransactionDataByHash.js --network degen

const txHash = "0xc0891351587e5532c768d248a9da9e2b2fff53bf0e1e9b2be8a02f1b957974c3";

async function main() {

  const tx = await ethers.provider.getTransaction(txHash);
  console.log("tx:", tx);
  console.log("tx value:", ethers.utils.formatEther(tx.value), " DEGEN");

  console.log("Done");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });