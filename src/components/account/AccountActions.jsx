import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import MobileConfirmDialog from "@/components/ui/MobileConfirmDialog";
import { Download, Trash2, Settings } from "lucide-react";
import { useDeleteAccount } from "@/hooks/useSettingsQueries";
import { settingsService } from "@/services/settingsService";
import { DownloadProgressModal } from "./DownloadProgressModal";

export const AccountActions = ({ activeProfileId, logout }) => {
  const { toast } = useToast();
  const [showPurgeDialog, setShowPurgeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState("");

  const { mutate: deleteAccount, isLoading: isDeletingAccount } =
    useDeleteAccount();

  const handleDataDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus("Initializing export...");

    try {
      const onProgress = ({ stage, percent }) => {
        setDownloadStatus(stage);
        if (percent) {
          setDownloadProgress(percent);
        }
      };

      const result = await settingsService.downloadAllData(
        activeProfileId,
        onProgress
      );

      if (result.success) {
        setTimeout(() => {
          setIsDownloading(false);
        }, 2000);
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description:
          "Could not prepare your data for download. Please try again.",
        variant: "destructive",
      });
      setIsDownloading(false);
    }
  };

  const handleDataPurge = () => {
    const result = settingsService.purgeLocalData();
    if (result.success) {
      toast({
        title: "All Data Purged",
        description:
          "Your local data has been cleared. You will be logged out.",
        variant: "destructive",
      });
      setShowPurgeDialog(false);
      setTimeout(logout, 2000);
    } else {
      toast({
        title: "Purge Failed",
        description: "Could not purge data.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = () => {
    deleteAccount(activeProfileId, {
      onSuccess: () => {
        toast({
          title: "Account Deleted",
          description:
            "Your account and all associated data have been permanently deleted.",
          variant: "destructive",
        });
        setShowDeleteDialog(false);
        setTimeout(() => {
          window.location.href = "/welcome";
        }, 2000);
      },
      onError: (error) => {
        toast({
          title: "Delete Failed",
          description:
            error.message || "Could not delete your account. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <>
      <DownloadProgressModal
        isOpen={isDownloading}
        progress={downloadProgress}
        statusMessage={downloadStatus}
      />

      <div className="bg-white p-4 md:p-6 rounded-2xl border">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-primary" />
          Account Actions
        </h3>
        <div className="space-y-3">
          <Button
            onClick={handleDataDownload}
            variant="outline"
            className="w-full justify-start space-x-2"
          >
            <Download size={16} />
            <span>Download All Data</span>
          </Button>
          <Button
            onClick={() => setShowPurgeDialog(true)}
            variant="outline"
            className="w-full justify-start space-x-2"
          >
            <Trash2 size={16} />
            <span>Purge Local Data</span>
          </Button>
          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            className="w-full justify-start space-x-2"
          >
            <Trash2 size={16} />
            <span>Delete Account</span>
          </Button>
        </div>
      </div>

      <MobileConfirmDialog
        isOpen={showPurgeDialog}
        onClose={() => setShowPurgeDialog(false)}
        onConfirm={handleDataPurge}
        title="Purge Local Data?"
        description="This will permanently delete all data on this device. Your server account will not be affected."
        confirmText="Yes, purge data"
      />
      <MobileConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account?"
        description="This action is permanent and cannot be undone. This will delete your account, all your data, files, and profile pictures from our servers."
        confirmText="Yes, delete my account"
        isLoading={isDeletingAccount}
      />
    </>
  );
};
