import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { 
  Upload, 
  FileText, 
  Image, 
  Download, 
  Share2, 
  Trash2, 
  Plus,
  Filter,
  Search,
  MoreVertical,
  Eye,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

const fileTypes = ['All', 'Images', 'PDFs', 'Documents'];

const MyFiles = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  
  const { activeProfile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (activeProfile) {
      loadUserFiles();
    }
  }, [activeProfile]);

  const loadUserFiles = async () => {
    try {
      setLoading(true);
      
      // List files from the userfiles bucket for the current user
      const { data: fileList, error } = await supabase.storage
        .from('userfiles')
        .list(`user_${activeProfile.id}`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      // Get signed URLs and file metadata (valid for 1 hour)
      const filesWithUrls = await Promise.all(
        fileList.map(async (file) => {
          const { data: signedUrlData, error: urlError } = await supabase.storage
            .from('userfiles')
            .createSignedUrl(`user_${activeProfile.id}/${file.name}`, 3600); // 1 hour expiry

          if (urlError) {
            console.error('Error creating signed URL:', urlError);
            return null;
          }

          return {
            id: file.id,
            name: file.name,
            size: file.metadata?.size || 0,
            type: getFileType(file.name),
            url: signedUrlData.signedUrl,
            uploadedAt: file.created_at,
            originalName: extractOriginalName(file.name)
          };
        })
      );

      // Filter out any null entries (failed URL generation)
      setFiles(filesWithUrls.filter(file => file !== null));

      setFiles(filesWithUrls);
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileType = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    } else {
      return 'document';
    }
  };

  const extractOriginalName = (fileName) => {
    // Remove timestamp prefix if present (format: timestamp_randomstring_originalname.ext)
    const parts = fileName.split('_');
    if (parts.length > 2) {
      return parts.slice(2).join('_');
    }
    return fileName;
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        // Validate file
        if (file.size > 10 * 1024 * 1024) { // 10MB limit
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }

        // Create unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop();
        const uniqueFileName = `${timestamp}_${randomString}_${file.name}`;
        const filePath = `user_${activeProfile.id}/${uniqueFileName}`;

        // Upload file
        const { error } = await supabase.storage
          .from('userfiles')
          .upload(filePath, file);

        if (error) {
          throw error;
        }

        return uniqueFileName;
      });

      await Promise.all(uploadPromises);
      
      toast({
        title: 'Success',
        description: `${selectedFiles.length} file(s) uploaded successfully.`,
      });

      // Reload files
      await loadUserFiles();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload files. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      const { error } = await supabase.storage
        .from('userfiles')
        .remove([`user_${activeProfile.id}/${fileToDelete.name}`]);

      if (error) {
        throw error;
      }

      toast({
        title: 'File Deleted',
        description: `${fileToDelete.originalName} has been deleted.`,
      });

      // Remove from local state
      setFiles(files.filter(f => f.id !== fileToDelete.id));
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDownload = async (file) => {
    try {
      const { data, error } = await supabase.storage
        .from('userfiles')
        .download(`user_${activeProfile.id}/${file.name}`);

      if (error) {
        throw error;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Download Started',
        description: `Downloading ${file.originalName}...`,
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleShare = async (file) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: file.originalName,
          text: `Check out this file: ${file.originalName}`,
          url: file.url,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(file.url);
        toast({
          title: 'Link Copied',
          description: 'File link has been copied to clipboard.',
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      toast({
        title: 'Share Failed',
        description: 'Failed to share file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image size={20} className="text-blue-600" />;
      case 'pdf':
        return <FileText size={20} className="text-red-600" />;
      default:
        return <FileText size={20} className="text-gray-600" />;
    }
  };

  const filteredFiles = files.filter(file => {
    const matchesFilter = activeFilter === 'All' || 
      (activeFilter === 'Images' && file.type === 'image') ||
      (activeFilter === 'PDFs' && file.type === 'pdf') ||
      (activeFilter === 'Documents' && file.type === 'document');
    
    const matchesSearch = file.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <>
      <Helmet>
        <title>My Files - NetLife</title>
      </Helmet>
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Files</h1>
              <p className="text-gray-600">Store and manage your documents</p>
            </div>
            
            {/* Upload Button */}
            <div className="relative">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <Button 
                disabled={uploading}
                className="bg-primary hover:bg-primary/90"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus size={16} className="mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex space-x-2 overflow-x-auto no-scrollbar">
              {fileTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                    activeFilter === type
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Files Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
                <div className="w-full h-32 bg-gray-200 rounded mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
              <Upload size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {files.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {files.length === 0 
                ? 'Upload your first file to get started. You can store images, PDFs, and documents.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {files.length === 0 && (
              <div className="relative inline-block">
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploading}
                />
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus size={16} className="mr-2" />
                  Upload Your First File
                </Button>
              </div>
            )}
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredFiles.map((file, index) => (
              <motion.div
                key={file.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white p-4 rounded-lg border hover:shadow-md transition-shadow"
              >
                {/* File Preview */}
                <div className="w-full h-32 bg-gray-50 rounded mb-3 flex items-center justify-center overflow-hidden">
                  {file.type === 'image' ? (
                    <img 
                      src={file.url} 
                      alt={file.originalName}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-center">
                      {getFileIcon(file.type)}
                      <p className="text-xs text-gray-500 mt-2">
                        {file.type.toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 truncate" title={file.originalName}>
                    {file.originalName}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                    className="text-primary hover:text-primary/80"
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(file)}>
                        <Download size={14} className="mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(file)}>
                        <Share2 size={14} className="mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setFileToDelete(file);
                          setDeleteDialogOpen(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete File</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{fileToDelete?.originalName}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteFile}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default MyFiles;