// npx hardhat run scripts/distributor/distributor.deploy.js --network bsc

const contractName = "RevenueDistributor";

const recipients = [];
const managers = [];

/*
// recipients receive a percentage of the revenue that comes to the contract
const recipients = [
  { address: "0xCA9749778327CD67700d3a777731a712330beB9A", label: "Staking contract", percentage: ethers.utils.parseEther("0.9") },
  { address: "0x17a2063e1f5C6034F4c94cfb0F4970483647a2E5", label: "Digital McDuck", percentage: ethers.utils.parseEther("0.05") },
  { address: "0x772bA1Faf2a2b49B452A5b287B2165cba89EfAE2", label: "MyCryptoPlayground", percentage: ethers.utils.parseEther("0.05") }
];

// managers are allowed to add/remove recipients
const managers = ["0xb29050965a5ac70ab487aa47546cdcbc97dae45d", "0x5ffd23b1b0350debb17a2cb668929ac5f76d0e18"];
*/

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // deploy contract
  const contract = await ethers.getContractFactory(contractName);
  const instance = await contract.deploy();
  await instance.deployed();
  
  console.log(contractName + " contract address:", instance.address);

  // add recipients
  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    console.log("Adding recipient:", recipient.address, "-", recipient.label);
    let tx1 = await instance.addRecipient(recipient.address, recipient.label, recipient.percentage);
    await tx1.wait();
  }

  // add managers
  for (let i = 0; i < managers.length; i++) {
    const manager = managers[i];
    console.log("Adding manager:", manager);
    let tx2 = await instance.addManager(manager);
    await tx2.wait();
  }

  console.log("Wait a minute and then run this command to verify contracts on block explorer:");
  console.log("npx hardhat verify --network " + network.name + " " + instance.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });