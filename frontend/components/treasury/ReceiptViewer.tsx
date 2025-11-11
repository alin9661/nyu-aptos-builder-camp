'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Download, FileText, Image as ImageIcon, File, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/toast';

interface ReceiptViewerProps {
  ipfsHash?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  showMetadata?: boolean;
}

export function ReceiptViewer({
  ipfsHash,
  fileName,
  fileSize,
  mimeType,
  showMetadata = true,
}: ReceiptViewerProps) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Determine file type
  const isImage = mimeType?.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';

  useEffect(() => {
    if (ipfsHash) {
      loadPreview();
    }
  }, [ipfsHash]);

  const loadPreview = async () => {
    if (!ipfsHash) return;

    try {
      setLoading(true);
      // In a real implementation, fetch from IPFS gateway
      // For now, we'll simulate with a placeholder
      const ipfsGateway = `https://ipfs.io/ipfs/${ipfsHash}`;
      setPreviewUrl(ipfsGateway);
    } catch (error) {
      console.error('Failed to load preview:', error);
      toast.error('Failed to load receipt preview');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!ipfsHash) return;

    try {
      setDownloading(true);
      setDownloadProgress(0);

      // Simulate download progress
      const progressInterval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // In a real implementation, fetch from IPFS and trigger download
      const ipfsGateway = `https://ipfs.io/ipfs/${ipfsHash}`;
      const response = await fetch(ipfsGateway);
      const blob = await response.blob();

      clearInterval(progressInterval);
      setDownloadProgress(100);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || `receipt-${ipfsHash.slice(0, 8)}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download receipt');
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleOpenInNewTab = () => {
    if (ipfsHash) {
      window.open(`https://ipfs.io/ipfs/${ipfsHash}`, '_blank');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="h-5 w-5" />;
    if (isPdf) return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  if (!ipfsHash) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Receipt
          </CardTitle>
          <CardDescription>No receipt available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No receipt has been uploaded for this request</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getFileIcon()}
              Receipt
            </CardTitle>
            <CardDescription>
              {fileName || 'Uploaded receipt document'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              disabled={loading}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={downloading || loading}
            >
              <Download className="h-4 w-4 mr-2" />
              {downloading ? 'Downloading...' : 'Download'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Download Progress */}
        {downloading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Downloading...</span>
              <span className="font-medium">{downloadProgress}%</span>
            </div>
            <Progress value={downloadProgress} />
          </div>
        )}

        {/* Preview Area */}
        <div className="rounded-lg border overflow-hidden bg-muted/50">
          {loading ? (
            <div className="aspect-video flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : isImage && previewUrl ? (
            <img
              src={previewUrl}
              alt="Receipt preview"
              className="w-full h-auto max-h-[500px] object-contain"
            />
          ) : isPdf && previewUrl ? (
            <div className="aspect-video">
              <iframe
                src={previewUrl}
                className="w-full h-full"
                title="PDF preview"
              />
            </div>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center p-8">
              {getFileIcon()}
              <p className="text-sm text-muted-foreground mt-2">
                Preview not available
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={handleOpenInNewTab}
                className="mt-2"
              >
                Open in new tab
              </Button>
            </div>
          )}
        </div>

        {/* Metadata */}
        {showMetadata && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">File Information</h4>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">File Name</span>
                <span className="font-medium">{fileName || 'Unknown'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">File Size</span>
                <span className="font-medium">{formatFileSize(fileSize)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge variant="outline">{mimeType || 'Unknown'}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">IPFS Hash</span>
                <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                  {ipfsHash.slice(0, 12)}...
                </code>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ReceiptViewerSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Receipt
        </CardTitle>
        <CardDescription>Loading receipt...</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  );
}
