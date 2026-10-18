const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting LexChain EvidenceRegistry deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const EvidenceRegistry =
    await hre.ethers.getContractFactory("EvidenceRegistry");
  const registry = await EvidenceRegistry.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log("EvidenceRegistry successfully deployed to:", contractAddress);

  const deploymentInfo = {
    contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const deploymentPath = path.join(outputDir, "localhost.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment metadata written to:", deploymentPath);

  const frontendAbiDir = path.join(__dirname, "..", "..", "src", "blockchain");
  if (!fs.existsSync(frontendAbiDir)) {
    fs.mkdirSync(frontendAbiDir, { recursive: true });
  }

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "EvidenceRegistry.sol",
    "EvidenceRegistry.json",
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const contractData = {
      address: contractAddress,
      abi: artifact.abi,
    };
    fs.writeFileSync(
      path.join(frontendAbiDir, "EvidenceRegistry.json"),
      JSON.stringify(contractData, null, 2),
    );
    console.log(
      "ABI and address synced to frontend:",
      path.join(frontendAbiDir, "EvidenceRegistry.json"),
    );
  }
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
