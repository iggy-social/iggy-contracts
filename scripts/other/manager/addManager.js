// npx hardhat run scripts/other/manager/addManager.js --network sepolia

const managerAddress = "0x5FfD23B1B0350debB17A2cB668929aC5f76d0E18";

const contractAddresses = [
  "0x0BF6333Fc85159663A30Ac89FD02c5031B97c5ee", // Post NFT
  "0xce314209aB485bE222CE85F653Ac918f54532503", // Post metadata
  "0xc486B08Ed47fFe5c1b4b1A2ff5c671EA0083D9bA", // Post minter
  "0x3Fa0EaC3058828Cc4BA97F51A33597C695bF6F9e", // Post stats

  "0x50045895e1983F39FDC149C9a5AC29C39BEA18fe", // Launchpad Factory
  "0xBdaba8106cdC29420c9A7Bb31066ED79c9b6Be74", // Launchpad Directory

  "0x99Dbf11aCd46baFBCE82506FaeB4F13E6Ea1726A", // stats middleware
  "0x2D4144B4E00cf1dC1c4DeDa37cb1CaCEda030998", // stats

  "0x0c6A6030121FB3071cB2347DEAC127037785436C", // Keys

  "0xC3623737209Cc141592B20bcEBCA6052AFCcD183", // Activity points
];

async function main() {
  const [ owner ] = await ethers.getSigners();

  console.log("Running script with the account:", owner.address);
  console.log("Account balance:", (await owner.getBalance()).toString());

  const intrfc = new ethers.utils.Interface([
    "function addManager(address manager_) external"
  ]);

  for (let i = 0; i < contractAddresses.length; i++) {
    const contractAddress = contractAddresses[i];
    console.log(`Adding manager address ${managerAddress} to ${contractAddress}`);

    try {
      const contract = new ethers.Contract(contractAddress, intrfc, owner);
      const tx = await contract.addManager(managerAddress);
      await tx.wait();
    } catch (error) {
      console.log(error.code);
      continue;
    }

    console.log(`Manager added to ${contractAddress}`);
  }

  console.log("Done");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });