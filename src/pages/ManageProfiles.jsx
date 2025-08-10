import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Edit,
  CheckCircle,
  Repeat,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Helmet } from "react-helmet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { getAvatarEmoji } from "@/lib/utils";

const ManageProfiles = () => {
  const {
    profile,
    managedProfiles,
    activeProfile,
    switchActiveProfile,
    fetchManagedProfiles,
  } = useAuth();

  const { toast } = useToast();
  const navigate = useNavigate();

  const allProfiles = useMemo(() => {
    if (!profile) return [];
    return [
      { ...profile, isMain: true },
      ...managedProfiles.map((p) => ({ ...p, isMain: false })),
    ];
  }, [profile, managedProfiles]);

  const handleSwitchProfile = (profileId) => {
    const profileName = allProfiles.find((p) => p.id === profileId)?.username;
    switchActiveProfile(profileId);
    toast({
      title: "Profile Switched",
      description: `You are now browsing as ${profileName}.`,
    });
    navigate("/dashboard");
  };

  // Delete a managed profile from the database.
  const handleDeleteProfile = async (profileToDelete) => {
    if (profileToDelete.isMain) return;

    const { error } = await supabase
      .from("managed_profiles")
      .delete()
      .eq("id", profileToDelete.id);

    if (error) {
      toast({
        title: "Error",
        description: "Could not delete profile. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile Deleted",
        description: `${profileToDelete.username}'s profile has been removed.`,
      });

      if (activeProfile?.id === profileToDelete.id) {
        switchActiveProfile(profile.id);
      }

      await fetchManagedProfiles();
    }
  };

  const renderAvatar = (p) => {
    if (p?.profile_picture?.startsWith("http")) {
      return <AvatarImage src={p.profile_picture} alt={p.username} />;
    }
    if (p?.profile_picture) {
      return (
        <AvatarFallback className="text-xl bg-transparent">
          {getAvatarEmoji(p.profile_picture)}
        </AvatarFallback>
      );
    }
    return (
      <AvatarFallback>{p?.username?.charAt(0).toUpperCase()}</AvatarFallback>
    );
  };

  return (
    <>
      <Helmet>
        <title>Manage Profiles - NetLife</title>
      </Helmet>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <header className="flex items-center space-x-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/account")}
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Manage Profiles</h1>
            <p className="text-sm text-gray-500">
              Switch, add, or edit profiles for your family.
            </p>
          </div>
        </header>

        <div className="bg-white p-4 md:p-6 rounded-2xl border space-y-4">
          {allProfiles.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between p-3 rounded-lg ${
                activeProfile?.id === p.id
                  ? "bg-primary/10 border border-primary"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">{renderAvatar(p)}</Avatar>
                <span className="font-semibold">
                  {p.username} {p.isMain && "(You)"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {activeProfile?.id === p.id ? (
                  <span className="flex items-center text-sm text-green-600 font-semibold px-2">
                    <CheckCircle size={16} className="mr-1.5" /> Active
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSwitchProfile(p.id)}
                  >
                    <Repeat size={14} className="mr-1" /> Switch
                  </Button>
                )}
                {!p.isMain && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        navigate(`/add-profile?edit=${p.id}`, {
                          state: { profileData: p },
                        })
                      }
                    >
                      <Edit size={16} />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the profile for{" "}
                            {p.username}. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProfile(p)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
          ))}
          {allProfiles.length <= 1 && (
            <p className="text-center text-gray-500 py-8">
              You haven't added any other profiles yet.
            </p>
          )}
        </div>

        <Button
          className="w-full mt-6"
          onClick={() => navigate("/add-profile")}
        >
          <UserPlus className="mr-2 h-4 w-4" /> Add New Profile
        </Button>
      </div>
    </>
  );
};

export default ManageProfiles;
