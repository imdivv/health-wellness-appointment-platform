import { BlobServiceClient, generateBlobSASQueryParameters, BlobSASPermissions } from '@azure/storage-blob';
import { env } from '../config/env.js';

let blobServiceClient;
let containerClient;
let isMock = false;

const connStr = env.azure.storageConnectionString;

// Resilient initialization: Fall back to local mock storage simulation if credentials are missing
if (!connStr || connStr.includes('your_') || connStr === 'UseDevelopmentStorage=true') {
  console.warn('⚠️ Warning: Azure Storage connection string is missing or set to placeholder. Using mock simulation.');
  isMock = true;
} else {
  try {
    blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
    containerClient = blobServiceClient.getContainerClient(env.azure.storageContainerName);
  } catch (error) {
    console.error('❌ Failed to initialize Azure Blob Storage Client:', error.message);
    isMock = true;
  }
}

class BlobService {
  /**
   * Streams a file buffer directly to Azure Blob container.
   * @param {Buffer} fileBuffer - Raw file binary
   * @param {string} originalName - User's original file name
   * @param {string} mimeType - File contentType
   * @returns {Promise<Object>} URL and unique file identifier
   */
  async upload(fileBuffer, originalName, mimeType) {
    const uniqueName = `${Date.now()}-${originalName.replace(/\s+/g, '_')}`;

    if (isMock) {
      console.log(`[MOCK STORAGE] Uploaded ${uniqueName} (${fileBuffer.length} bytes)`);
      return {
        blobUrl: `https://mockstorage.blob.core.windows.net/${env.azure.storageContainerName}/${uniqueName}`,
        blobName: uniqueName
      };
    }

    try {
      // Ensure the container exists on Azure
      await containerClient.createIfNotExists({ access: 'blob' });

      const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);
      await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
        blobHTTPHeaders: { blobContentType: mimeType }
      });

      return {
        blobUrl: blockBlobClient.url,
        blobName: uniqueName
      };
    } catch (error) {
      console.error('❌ Azure Blob Storage upload failure:', error.message);
      throw error;
    }
  }

  /**
   * Generates a temporary, 15-minute secure SAS link for downloading files.
   * @param {string} blobName - The unique blob name in storage
   * @returns {Promise<string>} Secure URL
   */
  async generateSasUrl(blobName) {
    if (isMock) {
      return `https://mockstorage.blob.core.windows.net/${env.azure.storageContainerName}/${blobName}?mock-sas-token-expires-in-15m`;
    }

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const permissions = new BlobSASPermissions();
      permissions.read = true; // Read-only access

      const expiryTime = new Date();
      expiryTime.setMinutes(expiryTime.getMinutes() + 15); // Link expires in 15 mins

      const sasToken = generateBlobSASQueryParameters({
        containerName: env.azure.storageContainerName,
        blobName,
        permissions,
        expiresOn: expiryTime
      }, blobServiceClient.credential).toString();

      return `${blockBlobClient.url}?${sasToken}`;
    } catch (error) {
      console.warn('⚠️ Failed to sign SAS token (likely due to connection string permissions). Returning direct URL:', error.message);
      if (containerClient) {
        return containerClient.getBlockBlobClient(blobName).url;
      }
      return `https://storage.blob.core.windows.net/${env.azure.storageContainerName}/${blobName}`;
    }
  }

  /**
   * Removes a file from Azure Blob storage.
   * @param {string} blobName - Blob identifier
   * @returns {Promise<void>}
   */
  async delete(blobName) {
    if (isMock) {
      console.log(`[MOCK STORAGE] Deleted ${blobName}`);
      return;
    }

    try {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.deleteIfExists();
    } catch (error) {
      console.error('❌ Azure Blob Storage delete failure:', error.message);
      throw error;
    }
  }
}

export default new BlobService();
