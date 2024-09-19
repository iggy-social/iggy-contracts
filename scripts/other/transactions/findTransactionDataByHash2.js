// npx hardhat run scripts/other/transactions/findTransactionDataByHash2.js --network base

/*
Airstack API query:

query MyQuery {
  TokenTransfers(
    input: {
      blockchain: base, 
      filter: {
        tokenAddress: {_eq: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"}, 
        to: {_eq: "0xb29050965A5AC70ab487aa47546cdCBc97dAE45D"}, 
        from: {_eq: "0x777e05D02Ea7B42F32f103c089C175017082f531"},
        transactionHash: {_eq: "0x7a9820c682e876d6078fd20ec632462305d12bf29e3449eedee360680524bb10"}
      }
    }
  ) {
    TokenTransfer {
      blockTimestamp
      formattedAmount
      to {
        addresses
      }
    }
  }
}
*/

const txHash = "0x7a9820c682e876d6078fd20ec632462305d12bf29e3449eedee360680524bb10";

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