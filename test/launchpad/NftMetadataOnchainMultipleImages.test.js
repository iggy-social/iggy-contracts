// npx hardhat test test/launchpad/NftMetadataOnchainMultipleImages.test.js

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

describe("NftMetadataOnchainMultipleImages", function () {
  let metadataContract;

  // NFT contract data
  const nftDescription = "Iggy NFT is a new unique NFT project";
  const nftImage = "https://bafkreihn7v7ugcu4yjnapsha3tij4cq7qatj2wjofpvxlkp6s4sl5nujn4.ipfs.w3s.link/";
  const nftMetadataName = "Iggy";
  const externalUrl = "https://iggy.social";

  const images = [
    "https://bafybeidim3mkbj4obd3cbf7fcrolioo2zpeha3xbzg2jvuajrtmvjk5lnq.ipfs.w3s.link/et_puisBK_2.jpg",
    "https://bafybeicbrgmgugbmk7g2nofbndysbq4pwezm65t6yjlyo7j32q3hgsxtxm.ipfs.w3s.link/et_puisBK_3.jpg",
    "https://bafybeif2gszl6ts4hmjdpdribflwakqtx5mljdfpqmobizrgjbumaksdwy.ipfs.w3s.link/et_puisBK_4.jpg",
    "https://bafybeigahpskfomwq3kfbklcdtatz3g5pun5rwatjje3i2rwye6ktanszq.ipfs.w3s.link/et_puisBK_5.jpg",
    "https://bafybeihgmzfxbtigxzzcvmfpr6atmkgvr54muzxq3ew3minfx6ofugwvhi.ipfs.w3s.link/et_puisBK_6.jpg",
    "https://bafybeif4rte6ltbcc3gfwvneqwwrxvoif26zjmcuhoyksxdcnpjjjpbsxm.ipfs.w3s.link/et_puisBK_7.jpg",
    "https://bafybeid5sn5wfmijo4ixlcvzqnnmpjqucqi7pf6mnr5upf7tg3zsiarzhy.ipfs.w3s.link/et_puisBK_8.jpg",
    "https://bafybeibpgwuchjkm42hwpbrujeglpp77diw4o6f27kjpihbrhfrndxfvzu.ipfs.w3s.link/et_puisBK_9.jpg",
    "https://bafybeigw6zhwvnmiy6t6dxhtjvfnmy2uv5iib7g465ii2pp7otjmbitmsq.ipfs.w3s.link/et_puisBK_10.jpg",
    "https://bafybeibjtypyvp5gjvldbbo7z4jnq52qw6if6cqgwwn32r526dygzdoyf4.ipfs.w3s.link/et_puisBK_11.jpg",
    "https://bafybeicamgpbio5fghlau4t6cajxemttsjmf3mcsueoen2ehybgdemm7jm.ipfs.w3s.link/et_puisBK_12.jpg",
    "https://bafybeigcgk54wvsrcqwk6rzwqxfri27u4th3rukcuhfhztp2dfncgtexiy.ipfs.w3s.link/et_puisBK_13.jpg",
    "https://bafybeiewptq3ylx32gckjxaxpg4gioro5hz2r74a6ut54wwkqzeas4dwxa.ipfs.w3s.link/et_puisBK_14.jpg",
    "https://bafybeibxscafzx2zizv3fcbewk7g4scvbfwd7pwyay2fpcw76ixov2dquy.ipfs.w3s.link/et_puisBK_15.jpg",
    "https://bafybeiahyzchhowf3chkbs26y3u743kz7eh4idogpbmad66lk7iulsondi.ipfs.w3s.link/et_puisBK_16.jpg",
    "https://bafybeic5wboyolq736quq4i3dm2qg7rei35ujst6nywwgrlxawrllz3sie.ipfs.dweb.link/et_puisBK_17.jpg",
    "https://bafybeiawebroia6j7qglx4dhlsev4slqtgu2mqjnepdi6ka6jtjmj762qy.ipfs.w3s.link/et_puisBK_18.jpg",
    "https://bafybeibscztchiurjtq2tzrjh5jtzpkoygmqsrmrqdat34o3amxsfkkzm4.ipfs.w3s.link/et_puisBK_19.jpg",
    "https://bafybeicneamma5bz2byzynk5re3rwklgglcmlk2xbqp3xcda3nd4sypmu4.ipfs.w3s.link/et_puisBK_20.jpg",
    "https://bafybeidznwxrql55ig4rumlv2tovfzcu2iaja66vy6lscfufeyxrbmgax4.ipfs.w3s.link/et_puisBK_21.jpg",
    "https://bafybeicom6nyaarxnxqk5kz66uxidhd2accwzi6oyxzgfzyrcvnfmrn7lq.ipfs.w3s.link/et_puisBK_22.jpg",
    "https://bafybeid2yip54zx4opmv2hzing6qxalzsugj5jhxjndktvwzpiaxnywemi.ipfs.w3s.link/et_puisBK_23.jpg",
    "https://bafybeihrxuqdzcdmxwkeggzm62rbjezgmeyyiya5xorwjmktrxyshw3neq.ipfs.w3s.link/et_puisBK_24.jpg",
    "https://bafybeifnw66wjbngkbybcqc4bes2f7pujt3r7qe6koqml3cyuo2xaiztoq.ipfs.w3s.link/et_puisBK_25.jpg",
    "https://bafybeihnlgdwhzityuro4jbcljd2eubqtpqc3o4qkbbolypp2wjhveqc3y.ipfs.w3s.link/et_puisBK_26.jpg"
  ];  

  beforeEach(async function () {
    const NftMetadata = await ethers.getContractFactory("NftMetadataOnchainMultipleImages");

    metadataContract = await NftMetadata.deploy(
      nftImage, // collectionPreviewImage
      nftDescription, // description
      externalUrl, // externalUrl
      nftImage, // image
      nftMetadataName // name
    );

    await metadataContract.deployed();

    // add images to contract via addImageToCollection() function
    for (let i = 0; i < images.length; i++) {
      const tx = await metadataContract.addImageToCollection(images[i]);
      await tx.wait();
    }
  });

  it("get metadata", async function () {

    const firstImage = await metadataContract.images(metadataContract.address);
    console.log("firstImage: " + firstImage);

    //const imagesArray = await metadataContract.getImages();
    //console.log("images: " + imagesArray);

  });

});