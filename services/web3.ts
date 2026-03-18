
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BrowserProvider, parseEther, parseUnits, Contract } from 'ethers';

// Base Mainnet Params
const BASE_CHAIN_ID = '0x2105'; // 8453 in hex
const BASE_RPC_URL = 'https://mainnet.base.org';

// Token Addresses on Base
export const TOKENS = {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2' 
};

// Mock Exchange Rates 
const LKR_TO_USD_RATE = 0.0033; 

// Smart Contract ABI (V3 Compatible)
const PAYMENT_CONTRACT_ABI = [
    "function payETH(string calldata orderId, string calldata details) external payable",
    "function payToken(address token, uint256 amount, string calldata orderId, string calldata details) external"
];

// ERC20 ABI
const ERC20_ABI = [
    "function transfer(address to, uint amount) returns (bool)",
    "function approve(address spender, uint amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

const POLICY_TEXT = "Payment to Arobazzar.lk";

// Check what wallets are available
export const getAvailableWallets = () => {
    const eth = window.ethereum;
    return {
        hasMetaMask: !!eth?.isMetaMask,
        hasCoinbase: !!eth?.isCoinbaseWallet,
        hasInjected: !!eth
    };
};

export const connectWallet = async (type: 'METAMASK' | 'COINBASE' | 'INJECTED' = 'INJECTED'): Promise<string | null> => {
    let providerToUse = window.ethereum;

    if (!providerToUse) {
        alert("No crypto wallet found. Please install MetaMask, Coinbase Wallet, or use a dApp browser.");
        return null;
    }

    // Handle multiple injected providers (EIP-6963 style manual check)
    if (providerToUse && (providerToUse as any).providers) {
        if (type === 'METAMASK') {
            providerToUse = (providerToUse as any).providers.find((p: any) => p.isMetaMask) || providerToUse;
        } else if (type === 'COINBASE') {
            providerToUse = (providerToUse as any).providers.find((p: any) => p.isCoinbaseWallet) || providerToUse;
        }
    }

    try {
        const provider = new BrowserProvider(providerToUse as any);
        const accounts = await provider.send("eth_requestAccounts", []);
        
        // Switch to Base Chain
        try {
            await provider.send('wallet_switchEthereumChain', [{ chainId: BASE_CHAIN_ID }]);
        } catch (switchError) {
            // Chain not added error
            if ((switchError as { code: number }).code === 4902) {
                await provider.send('wallet_addEthereumChain', [{
                    chainId: BASE_CHAIN_ID,
                    chainName: 'Base Mainnet',
                    nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                    rpcUrls: [BASE_RPC_URL],
                    blockExplorerUrls: ['https://basescan.org/']
                }]);
            }
        }

        return accounts[0];
    } catch (error) {
        console.error("Connection Error:", error);
        return null;
    }
};

export const getConversionRate = async (type: 'ETH' | 'USD'): Promise<number> => {
    try {
        if (type === 'ETH') {
            const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
            if (!res.ok) throw new Error("Coingecko blocked");
            const data = await res.json();
            const ethPriceUsd = data.ethereum.usd; 
            return (LKR_TO_USD_RATE / ethPriceUsd);
        }
        return LKR_TO_USD_RATE;
    } catch (e) {
        console.warn("Using fallback rates due to API error:", e);
        return type === 'ETH' ? 0.000001 : 0.0033;
    }
};

export const sendNativePayment = async (contractAddress: string, amountLKR: number, orderId: string): Promise<string> => {
    if (!window.ethereum) throw new Error("No Wallet");
    const provider = new BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();

    const rate = await getConversionRate('ETH');
    const ethAmount = amountLKR * rate;
    const amountWei = parseEther(ethAmount.toFixed(18));

    // Check if address is a contract
    const code = await provider.getCode(contractAddress);
    const isContract = code && code !== '0x';

    if (isContract) {
        const contract = new Contract(contractAddress, PAYMENT_CONTRACT_ABI, signer);
        console.log(`Paying ETH to contract ${contractAddress} for order ${orderId}`);
        try {
            // Explicitly do not set gasLimit to let wallet estimate it accurately
            const tx = await contract.payETH(orderId, POLICY_TEXT, { value: amountWei });
            await tx.wait();
            return tx.hash;
        } catch (err) {
             console.warn("Smart contract call failed", err);
             throw err;
        }
    } else {
        // Direct Transfer (EOA - Personal Wallet)
        // This avoids "Risky" warnings by not sending data to EOAs
        console.log(`Direct Transfer to Wallet ${contractAddress}`);
        const tx = await signer.sendTransaction({
            to: contractAddress,
            value: amountWei
        });
        await tx.wait();
        return tx.hash;
    }
};

export const sendTokenPayment = async (tokenAddress: string, contractAddress: string, amountLKR: number, orderId: string): Promise<string> => {
    if (!window.ethereum) throw new Error("No Wallet");
    const provider = new BrowserProvider(window.ethereum as any);
    const signer = await provider.getSigner();
    const userAddress = await signer.getAddress();
    
    const rate = await getConversionRate('USD');
    const usdAmount = amountLKR * rate;
    
    const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
    const decimals = await tokenContract.decimals();
    
    const amountUnits = parseUnits(usdAmount.toFixed(decimals > 6 ? 2 : 6), decimals);
    
    // Check if recipient is a contract
    const code = await provider.getCode(contractAddress);
    const isContract = code && code !== '0x';

    if (isContract) {
        console.log("Approving tokens for Contract...");
        const currentAllowance = await tokenContract.allowance(userAddress, contractAddress);
        
        if (currentAllowance < amountUnits) {
            const approveTx = await tokenContract.approve(contractAddress, amountUnits);
            await approveTx.wait();
        }

        const paymentContract = new Contract(contractAddress, PAYMENT_CONTRACT_ABI, signer);
        console.log("Executing contract payment...");
        const tx = await paymentContract.payToken(tokenAddress, amountUnits, orderId, POLICY_TEXT);
        await tx.wait();
        return tx.hash;
    } else {
        // Direct Transfer to EOA (Personal Wallet)
        console.log("Executing direct token transfer...");
        const tx = await tokenContract.transfer(contractAddress, amountUnits);
        await tx.wait();
        return tx.hash;
    }
};
