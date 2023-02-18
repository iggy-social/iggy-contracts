// npx hardhat test test/iggyPostNft1155.test.js

const { expect } = require("chai");

function calculateGasCosts(testName, receipt) {
  console.log(testName + " gasUsed: " + receipt.gasUsed);

  // coin prices in USD
  const matic = 1.5;
  const eth = 1500;
  
  const gasCostMatic = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("500", "gwei")) * Number(receipt.gasUsed)), "ether");
  const gasCostEthereum = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("50", "gwei")) * Number(receipt.gasUsed)), "ether");
  const gasCostArbitrum = ethers.utils.formatUnits(String(Number(ethers.utils.parseUnits("1.25", "gwei")) * Number(receipt.gasUsed)), "ether");

  console.log(testName + " gas cost (Ethereum): $" + String(Number(gasCostEthereum)*eth));
  console.log(testName + " gas cost (Arbitrum): $" + String(Number(gasCostArbitrum)*eth));
  console.log(testName + " gas cost (Polygon): $" + String(Number(gasCostMatic)*matic));
}

describe("IggyPostNft1155", function () {
  let iggyPostContract;
  let metadataContract;
  let minterContract;

  let owner;
  let dao;
  let author;
  let user1;
  let user2;
  let dev;

  const daoFee = 2000;
  const devFee = 1000;

  const defaultPrice = ethers.utils.parseEther("1");

  const provider = waffle.provider;

  beforeEach(async function () {
    [owner, dao, author, user1, user2, dev] = await ethers.getSigners();

    const IggyMetadata = await ethers.getContractFactory("IggyPostMetadata");
    metadataContract = await IggyMetadata.deploy();
    await metadataContract.deployed();

    const IggyPost = await ethers.getContractFactory("IggyPostNft1155");
    iggyPostContract = await IggyPost.deploy(defaultPrice, metadataContract.address);
    await iggyPostContract.deployed();

    const IggyMinter = await ethers.getContractFactory("IggyPostMinter");
    minterContract = await IggyMinter.deploy(dao.address, dev.address, iggyPostContract.address, daoFee, devFee);
    await minterContract.deployed();
  });

});