async function main() {
  const CouponNFT = await ethers.getContractFactory("CouponNFT");
  const contract = await CouponNFT.deploy();
  await contract.waitForDeployment();
  console.log("CouponNFT deployed to:", contract.target);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
