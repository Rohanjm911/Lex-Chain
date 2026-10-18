import { ethers } from "ethers";
import evidenceRegistryArtifact from "../blockchain/EvidenceRegistry.json";
import { api } from "./api";

export const DEFAULT_HARDHAT_RPC = "http://127.0.0.1:8545";
export const DEFAULT_LOCAL_OPERATOR_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export interface NetworkStatus {
  connected: boolean;
  chainId?: number;
  networkName?: string;
  blockNumber?: number;
  contractAddress?: string;
  error?: string;
}

export interface TxResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

export class BlockchainService {
  private rpcUrl: string = DEFAULT_HARDHAT_RPC;
  private contractAddress: string =
    evidenceRegistryArtifact.address ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  private operatorKey: string = DEFAULT_LOCAL_OPERATOR_KEY;

  constructor() {
    this.loadSettings();
  }

  public async loadSettings() {
    try {
      const settings = await api.getAppSettings();
      if (settings.rpc_url) this.rpcUrl = settings.rpc_url;
      if (settings.contract_address)
        this.contractAddress = settings.contract_address;
    } catch {}
  }

  public getProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(this.rpcUrl);
  }

  public getSigner(): ethers.Wallet {
    const provider = this.getProvider();
    return new ethers.Wallet(this.operatorKey, provider);
  }

  public getContract(
    signerOrProvider?: ethers.Signer | ethers.Provider,
  ): ethers.Contract {
    const runner = signerOrProvider || this.getProvider();
    return new ethers.Contract(
      this.contractAddress,
      evidenceRegistryArtifact.abi,
      runner,
    );
  }

  public async checkConnection(): Promise<NetworkStatus> {
    try {
      const provider = this.getProvider();
      const network = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();

      return {
        connected: true,
        chainId: Number(network.chainId),
        networkName:
          network.name === "unknown" ? "Local Hardhat EVM" : network.name,
        blockNumber,
        contractAddress: this.contractAddress,
      };
    } catch (err: any) {
      return {
        connected: false,
        error:
          err.message ||
          "Failed to reach blockchain RPC node. Operating in Local-First offline mode.",
        contractAddress: this.contractAddress,
      };
    }
  }

  public async registerEvidenceOnChain(
    evidenceId: string,
    commitmentHex: string,
  ): Promise<TxResult> {
    try {
      const signer = this.getSigner();
      const contract = this.getContract(signer);

      let formattedCommitment = commitmentHex;
      if (!formattedCommitment.startsWith("0x")) {
        formattedCommitment = "0x" + formattedCommitment;
      }
      if (formattedCommitment.length !== 66) {
        formattedCommitment = ethers.zeroPadValue(formattedCommitment, 32);
      }

      const existing = await contract.getEvidenceRecord(evidenceId);
      if (existing && existing.isRegistered) {
        return {
          success: true,
          txHash: "ALREADY_REGISTERED_ON_CHAIN",
          blockNumber: Number(existing.blockNumber),
        };
      }

      const tx = await contract.registerEvidence(
        evidenceId,
        formattedCommitment,
      );

      const receipt = await tx.wait(1);

      if (receipt.status === 1) {
        return {
          success: true,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
        };
      } else {
        return {
          success: false,
          error: "Transaction was mined but reverted by EVM (Status 0).",
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error:
          err.reason ||
          err.message ||
          "Failed to submit on-chain evidence registration.",
      };
    }
  }

  public async anchorCustodyEventOnChain(
    evidenceId: string,
    eventType: string,
    custodyCommitmentHex: string,
  ): Promise<TxResult> {
    try {
      const signer = this.getSigner();
      const contract = this.getContract(signer);

      let formattedCommitment = custodyCommitmentHex;
      if (!formattedCommitment.startsWith("0x")) {
        formattedCommitment = "0x" + formattedCommitment;
      }
      if (formattedCommitment.length !== 66) {
        formattedCommitment = ethers.zeroPadValue(formattedCommitment, 32);
      }

      const tx = await contract.anchorCustodyEvent(
        evidenceId,
        eventType,
        formattedCommitment,
      );
      const receipt = await tx.wait(1);

      return {
        success: receipt.status === 1,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (err: any) {
      return {
        success: false,
        error:
          err.reason ||
          err.message ||
          "Failed to anchor custody event on blockchain.",
      };
    }
  }

  public async verifyOnChainCommitment(
    evidenceId: string,
    expectedCommitmentHex: string,
  ): Promise<{
    isRegistered: boolean;
    matches: boolean;
    onChainCommitment?: string;
    blockNumber?: number;
    submitter?: string;
  }> {
    try {
      const contract = this.getContract();
      const record = await contract.getEvidenceRecord(evidenceId);

      if (!record.isRegistered) {
        return { isRegistered: false, matches: false };
      }

      let formattedExpected = expectedCommitmentHex;
      if (!formattedExpected.startsWith("0x")) {
        formattedExpected = "0x" + formattedExpected;
      }

      const matches =
        record.commitment.toLowerCase() === formattedExpected.toLowerCase();

      return {
        isRegistered: true,
        matches,
        onChainCommitment: record.commitment,
        blockNumber: Number(record.blockNumber),
        submitter: record.submitter,
      };
    } catch {
      return { isRegistered: false, matches: false };
    }
  }

  public async processPendingQueue(): Promise<{
    processed: number;
    failed: number;
  }> {
    let processed = 0;
    let failed = 0;

    const net = await this.checkConnection();
    if (!net.connected) {
      return { processed: 0, failed: 0 };
    }

    try {
      const queue = await api.getBlockchainQueue();
      const pendingItems = queue.filter(
        (item) => item.status === "Pending" || item.status === "Failed",
      );

      for (const item of pendingItems) {
        try {
          const payload = JSON.parse(item.payload);
          const result = await this.registerEvidenceOnChain(
            payload.evidence_id,
            payload.commitment,
          );

          if (result.success) {
            await api.updateBlockchainRegistrationResult(
              item.id,
              payload.evidence_id,
              "Confirmed",
              result.txHash,
              result.blockNumber,
              "31337",
              this.contractAddress,
            );
            processed++;
          } else {
            await api.updateBlockchainRegistrationResult(
              item.id,
              payload.evidence_id,
              "Failed",
              undefined,
              undefined,
              undefined,
              undefined,
              result.error,
            );
            failed++;
          }
        } catch (e: any) {
          failed++;
        }
      }
    } catch (e) {
      console.error("Queue processor error:", e);
    }

    return { processed, failed };
  }
}

export const blockchainService = new BlockchainService();
