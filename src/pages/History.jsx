import React, { useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import MobileConfirmDialog from "@/components/ui/MobileConfirmDialog";
import {
  Download,
  Share2,
  FileText,
  HeartPulse,
  FilePlus,
  ChevronRight,
  Trash2,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import jsPDF from "jspdf";
import { useNavigate } from "react-router-dom";
import { formatSmartTime } from "@/utils/timeUtils";
import {
  useUserServiceRequests,
  useUserScreeningResults,
  useDeleteServiceRequest,
  useDeleteScreeningResult,
} from "@/hooks/useServiceQueries";
import { downloadGeneratedPdf } from "@/utils/pdfUtils";

const tabs = ["Services", "Screening", "Records"];

const History = () => {
  const [activeTab, setActiveTab] = useState("Services");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const { activeProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const {
    data: serviceRequests,
    isLoading: isLoadingServices,
    isFetching: isFetchingServices,
    error: servicesError,
    refetch: refetchServices,
  } = useUserServiceRequests(activeProfile?.id);

  const {
    data: screeningResults,
    isLoading: isLoadingScreening,
    isFetching: isFetchingScreening,
    error: screeningError,
    refetch: refetchScreening,
  } = useUserScreeningResults(activeProfile?.id);

  const { mutate: deleteServiceRequest, isLoading: isDeletingService } =
    useDeleteServiceRequest();
  const { mutate: deleteScreeningResult, isLoading: isDeletingScreening } =
    useDeleteScreeningResult();

  const isLoading = isLoadingServices || isLoadingScreening;
  const isRefreshing = isFetchingServices || isFetchingScreening;
  const isDeleting = isDeletingService || isDeletingScreening;
  const hasError = servicesError || screeningError;

  const historyItems = useMemo(() => {
    const formattedServices = (serviceRequests || []).map((req) => ({
      id: req.id,
      title: req.services?.name || "Service Request",
      date: formatSmartTime(req.created_at),
      status: req.isOffline
        ? "Pending Sync"
        : req.status
        ? req.status.charAt(0).toUpperCase() + req.status.slice(1)
        : "Submitted",
      isOffline: !!req.isOffline,
      icon: req.isOffline ? Clock : HeartPulse,
      data: req,
      type: "service_request",
    }));

    const formattedScreening = (screeningResults || []).map((res) => ({
      id: res.id,
      title: `${res.services?.name || "Screening"} - Result`,
      date: formatSmartTime(res.completed_at),
      status: "Complete",
      result: `${res.score}% Eligibility Score`,
      icon: FileText,
      data: res,
      type: "screening_result",
    }));

    const allRecords = [...formattedServices, ...formattedScreening].sort(
      (a, b) =>
        new Date(b.data.created_at || b.data.completed_at) -
        new Date(a.data.created_at || a.data.completed_at)
    );

    return {
      Services: formattedServices,
      Screening: formattedScreening,
      Records: allRecords,
    };
  }, [serviceRequests, screeningResults]);

  const handleRefresh = () => {
    toast({ title: "Refreshing history..." });
    refetchServices();
    refetchScreening();
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    const onSuccess = () => {
      toast({
        title: "Record Deleted",
        description: `"${itemToDelete.title}" has been removed.`,
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    };

    const onError = (error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    };

    if (itemToDelete.type === "service_request") {
      deleteServiceRequest(itemToDelete.id, { onSuccess, onError });
    } else if (itemToDelete.type === "screening_result") {
      deleteScreeningResult(itemToDelete.id, { onSuccess, onError });
    }
  };

  const handleDeleteClick = (item, event) => {
    event.stopPropagation();
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleShare = async (item) => {
    const shareUrl = `${window.location.origin}/records/${item.id}`;
    const shareData = {
      title: `My NetLife Record: ${item.title}`,
      text: `View my health record from NetLife, shared securely.`,
      url: shareUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error("Web Share API not supported");
      }
    } catch (error) {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied!",
        description:
          "A shareable link to your record has been copied to your clipboard.",
      });
    }
  };

  const handleDownload = async (item) => {
    if (item.type !== "service_request") {
      toast({
        title: "No PDF Available",
        description: "PDF summaries are only generated for service requests.",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Preparing Download..." });
    const result = await downloadGeneratedPdf(item.data);

    if (result.success) {
      toast({
        title: "Download Started",
        description: "Your record has been downloaded.",
      });
    } else {
      toast({
        title: "Download Failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };
  const handleItemClick = (item) => {
    if (item.isOffline) {
      toast({
        title: "Request is Pending Sync",
        description:
          "Full details will be available after the request is synced with our servers.",
      });
      return;
    }
    if (item.id && !String(item.id).startsWith("optimistic-")) {
      navigate(`/records/db_service_request_${item.id}`);
    } else {
      toast({
        title: "Processing Request",
        description:
          "Please wait a moment while the request is being processed.",
      });
    }
  };

  const firstName = activeProfile?.username?.split(" ")[0] || "";
  const usernameElement = (
    <span className="username-gradient">{firstName}</span>
  );

  const HistoryItemSkeleton = () => (
    <div className="bg-white border p-4 rounded-2xl shadow-sm animate-pulse">
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4 flex-1">
          <div className="bg-gray-200 p-3 rounded-full w-11 h-11"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="h-6 bg-gray-200 rounded-full w-16"></div>
          <div className="h-5 w-5 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="border-t my-3"></div>
      <div className="h-3 bg-gray-200 rounded w-48 mb-3"></div>
      <div className="border-t my-3"></div>
      <div className="flex items-center justify-end gap-2">
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-8 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  );

  const renderEmptyState = (tab) => {
    const messages = {
      Services: {
        title: "No Service History",
        message:
          "You haven't requested any services yet. Explore our services to get started.",
        cta: "Go to Services",
        action: () => navigate("/services"),
        icon: HeartPulse,
      },
      Screening: {
        title: "No Screening History",
        message:
          "You haven't completed any health screenings. Take a survey to assess your health.",
        cta: "Take a Survey",
        action: () => navigate(`/survey/${activeProfile.id}`),
        icon: FileText,
      },
      Records: {
        title: "No Health Records",
        message: "Your submitted forms and results will appear here.",
        cta: "Go to Dashboard",
        action: () => navigate("/dashboard"),
        icon: FilePlus,
      },
    };
    const { title, message, cta, action, icon: Icon } = messages[tab];
    return (
      <div className="text-center py-16 px-6 bg-gray-50 rounded-2xl">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full mx-auto flex items-center justify-center mb-4">
          <Icon size={32} />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 mt-2 mb-6">{message}</p>
        <Button onClick={action}>{cta}</Button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Health History - NetLife</title>
      </Helmet>
      <div className="py-4 md:py-6 bg-white min-h-screen">
        <header className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 truncate">
              Health History
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 hover:bg-gray-50"
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin" : ""}
              />
              <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
            </Button>
          </div>
          <p className="text-gray-500 text-sm sm:text-base">
            Hi {usernameElement}, here's a summary of your activities.
          </p>
        </header>

        <div className="bg-gray-100 p-1 rounded-full flex justify-around items-center mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full py-2.5 text-sm font-semibold rounded-full transition-all duration-300 ${
                activeTab === tab
                  ? "bg-white text-primary shadow-md"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <HistoryItemSkeleton key={index} />
            ))
          ) : hasError ? (
            <div className="text-center py-16 px-6 bg-red-50 text-red-700 rounded-2xl">
              <h3 className="text-xl font-bold">Failed to Load History</h3>
              <p className="mt-2 mb-6">
                There was a problem fetching your data. Please check your
                connection and try again.
              </p>
              <Button onClick={handleRefresh}>Try Again</Button>
            </div>
          ) : historyItems[activeTab].length > 0 ? (
            historyItems[activeTab].map((item) => (
              <div
                key={item.id}
                className="bg-white border p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  onClick={() => handleItemClick(item)}
                  className="flex justify-between items-start cursor-pointer"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      <item.icon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.data?.attachments && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        <FileText size={12} />
                        <span>Attachment</span>
                      </div>
                    )}
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        item.isOffline
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {item.status}
                    </span>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {item.result && (
                  <>
                    <div className="border-t my-3"></div>
                    <p className="text-sm text-gray-600">
                      Result:{" "}
                      <span className="font-semibold text-gray-800">
                        {item.result}
                      </span>
                    </p>
                  </>
                )}
                <div className="border-t my-3"></div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleDeleteClick(item, e)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={14} className="mr-2" /> Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(item)}
                    disabled={item.isOffline}
                  >
                    <Share2 size={14} className="mr-2" /> Share
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(item)}
                    disabled={item.isOffline}
                  >
                    <Download size={14} className="mr-2" /> Download
                  </Button>
                </div>
              </div>
            ))
          ) : (
            renderEmptyState(activeTab)
          )}
        </div>
      </div>

      <MobileConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Record?"
        description={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={isDeleting}
      />
    </>
  );
};

export default History;
