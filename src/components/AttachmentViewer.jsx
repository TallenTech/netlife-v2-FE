import React, { useState } from 'react';
import { FileText, Download, Eye, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AttachmentViewer = ({ attachmentUrl, fileName = 'Attachment' }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!attachmentUrl) {
    return null;
  }

  // Determine file type from URL or filename
  const getFileType = (url, name) => {
    const urlLower = url.toLowerCase();
    const nameLower = name.toLowerCase();
    
    if (urlLower.includes('.pdf') || nameLower.includes('.pdf')) {
      return 'pdf';
    }
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp)/) || nameLower.match(/\.(jpg|jpeg|png|gif|webp)/)) {
      return 'image';
    }
    return 'unknown';
  };

  const fileType = getFileType(attachmentUrl, fileName);

  const handleDownload = async () => {
    try {
      // Try to fetch and download the file
      const response = await fetch(attachmentUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'attachment';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab for user to save manually
      window.open(attachmentUrl, '_blank');
    }
  };

  const handleViewExternal = () => {
    window.open(attachmentUrl, '_blank');
  };

  const renderPreview = () => {
    if (fileType === 'image') {
      return (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          {imageError ? (
            <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Unable to load image</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleViewExternal}
                  className="mt-2"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Original
                </Button>
              </div>
            </div>
          ) : (
            <img
              src={attachmentUrl}
              alt={fileName}
              className="max-w-full h-auto rounded-lg shadow-sm"
              onLoad={() => setLoading(false)}
              onError={() => {
                setImageError(true);
                setLoading(false);
              }}
              style={{ display: loading ? 'none' : 'block' }}
            />
          )}
        </div>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">PDF Document</h3>
          <p className="text-sm text-gray-500 mb-4">{fileName}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleViewExternal} variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View PDF
            </Button>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Attachment</h3>
        <p className="text-sm text-gray-500 mb-4">{fileName}</p>
        <div className="flex gap-2 justify-center">
          <Button onClick={handleViewExternal} variant="outline">
            <ExternalLink className="h-4 w-4 mr-2" />
            Open
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-900">Attachment</span>
        </div>
        <div className="flex gap-2">
          {fileType === 'image' && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>{fileName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4">
                  {renderPreview()}
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
      
      <div className="mb-3">
        {renderPreview()}
      </div>
      
      <div className="text-xs text-gray-500">
        <p>File: {fileName}</p>
        <p>Type: {fileType.toUpperCase()}</p>
      </div>
    </div>
  );
};

export default AttachmentViewer;