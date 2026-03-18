
// High-performance IPFS gateways for redundancy and speed.
// Pinata is prioritized for files hosted on their platform.
export const IPFS_GATEWAYS = [
    "https://gateway.pinata.cloud/ipfs/",
    "https://cloudflare-ipfs.com/ipfs/",
    "https://ipfs.io/ipfs/",
    "https://dweb.link/ipfs/"
];

const DEFAULT_GATEWAY = IPFS_GATEWAYS[0]; 
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

/**
 * Uploads a file to Pinata IPFS and returns the URL.
 * Prioritizes the Pinata gateway for significantly faster loading.
 */
export const uploadToLocal = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
        const API_URL = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL || '/api';
        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload Failed: ${errorText}`);
        }

        const data = await res.json();
        
        // Return the full URL if it's a relative path and we have a specific API_URL, otherwise just the path
        if (data.url.startsWith('/') && API_URL !== '/api') {
            const baseUrl = API_URL.replace('/api', '');
            return `${baseUrl}${data.url}`;
        }
        return data.url;
    } catch (error) {
        console.error("Local Upload Error:", error);
        throw error;
    }
};

export const uploadToPinata = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const pinataJWT = (import.meta as unknown as { env: Record<string, string> }).env.VITE_PINATA_JWT;
    if (!pinataJWT) {
        throw new Error("VITE_PINATA_JWT is not configured in environment variables.");
    }

    try {
        const res = await fetch(PINATA_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${pinataJWT}`
            },
            body: formData,
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Pinata Upload Failed: ${errorText}`);
        }

        const data = await res.json();
        return `${DEFAULT_GATEWAY}${data.IpfsHash}`;
    } catch (error) {
        console.error("Pinata Upload Error:", error);
        throw error;
    }
};

/**
 * Normalizes an IPFS URL or CID to use the fastest available gateway (Pinata).
 * This ensures that 1MB+ files load in seconds by bypassing slower public gateways.
 */
export const normalizeIpfsUrl = (url: string): string => {
    if (!url) return "";
    
    // Check if it's already an IPFS link but perhaps on a slow gateway
    const ipfsPattern = /\/ipfs\/(Qm[1-9A-HJ-NP-Za-km-z]{44}|ba[A-Za-z2-7]{57})/;
    const match = url.match(ipfsPattern);
    
    if (match) {
        const cid = match[1];
        // Always return the Pinata gateway as primary for speed
        return `${IPFS_GATEWAYS[0]}${cid}`;
    }

    // If it's just a raw CID string
    if (url.startsWith('Qm') && url.length === 46) return `${IPFS_GATEWAYS[0]}${url}`;
    if (url.startsWith('ba') && url.length > 50) return `${IPFS_GATEWAYS[0]}${url}`;

    return url;
};