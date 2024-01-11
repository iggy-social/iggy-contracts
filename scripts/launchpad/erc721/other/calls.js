// npx hardhat run scripts/launchpad/erc721/other/calls.js --network zkfair

const contractName = "IggyLaunchpad721Bonding";

const apAddress = "0x50045895e1983F39FDC149C9a5AC29C39BEA18fe";

async function main() {
  const [caller] = await ethers.getSigners();

  console.log("Calling functions with the account:", caller.address);
  console.log("Account balance:", (await caller.getBalance()).toString());

  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.attach(apAddress);

  // check statsAddress
  const statsAddress = await instance.statsAddress();
  console.log("Stats address:", statsAddress);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });