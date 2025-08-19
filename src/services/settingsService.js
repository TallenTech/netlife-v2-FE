import { supabase } from "@/lib/supabase";

export const settingsService = {
  async saveSettings(userId, settings) {
    try {
      const { error } = await supabase.from("user_settings").upsert({
        user_id: userId,
        settings: settings,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      localStorage.setItem(
        `netlife_settings_${userId}`,
        JSON.stringify(settings)
      );
      return { success: true };
    } catch (error) {
      console.error("Error saving settings:", error);
      localStorage.setItem(
        `netlife_settings_${userId}`,
        JSON.stringify(settings)
      );
      throw new Error("Settings saved locally but failed to sync.");
    }
  },

  async loadSettings(userId) {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("settings")
        .eq("user_id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        // Ignore 'No rows found' error
        throw error;
      }

      if (data?.settings) {
        localStorage.setItem(
          `netlife_settings_${userId}`,
          JSON.stringify(data.settings)
        );
        return data.settings;
      }

      const savedSettings = localStorage.getItem(`netlife_settings_${userId}`);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }

      return {
        autoDelete: "never",
        fakeAccountMode: false,
        silentAlerts: false,
        crisisOverride: true,
      };
    } catch (error) {
      console.error("Error loading settings:", error);
      const savedSettings = localStorage.getItem(`netlife_settings_${userId}`);
      if (savedSettings) return JSON.parse(savedSettings);
      throw new Error("Failed to load settings.");
    }
  },

  purgeLocalData() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("netlife_") || key.startsWith("sb-"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      sessionStorage.clear();
      return { success: true };
    } catch (error) {
      console.error("Error purging local data:", error);
      return { success: false, error: error.message };
    }
  },

  async deleteAccount(userId) {
    try {
      // Step 1: Delete all user files from storage buckets
      await this.deleteUserStorageFiles(userId);

      // Step 2: Delete database records using RPC function
      const { data, error } = await supabase.rpc("delete_user_account", {
        target_user_id: userId,
      });
      if (error) throw error;
      if (data.success) {
        this.purgeLocalData();
        await supabase.auth.signOut();
        return { success: true };
      }
      throw new Error(data.error || "Account deletion failed");
    } catch (error) {
      console.error("Error deleting account:", error);
      throw error;
    }
  },

  async deleteUserStorageFiles(userId) {
    try {
      const storageBuckets = [
        "profile-photos",
        "userfiles",
        "service-attachments"
      ];

      for (const bucketName of storageBuckets) {
        try {
          // List all files in the user's folder for this bucket
          let userFolder = "";

          if (bucketName === "profile-photos") {
            // Profile photos are stored as: userId/filename or managed-profiles/managedProfileId/filename
            userFolder = userId;
          } else if (bucketName === "userfiles") {
            // User files are stored as: user_userId/filename
            userFolder = `user_${userId}`;
          } else if (bucketName === "service-attachments") {
            // Service attachments are stored as: userId/filename
            userFolder = userId;
          }

          if (userFolder) {
            const { data: files, error: listError } = await supabase.storage
              .from(bucketName)
              .list(userFolder);

            if (listError) {
              console.warn(`Failed to list files in ${bucketName}/${userFolder}:`, listError);
              continue;
            }

            if (files && files.length > 0) {
              // Delete all files in the user's folder
              const filePaths = files.map(file => `${userFolder}/${file.name}`);
              const { error: deleteError } = await supabase.storage
                .from(bucketName)
                .remove(filePaths);

              if (deleteError) {
                console.warn(`Failed to delete files from ${bucketName}/${userFolder}:`, deleteError);
              } else {
                console.log(`Deleted ${files.length} files from ${bucketName}/${userFolder}`);
              }
            }
          }

          // For managed profiles, also check and delete their files
          if (bucketName === "profile-photos") {
            const { data: managedProfiles } = await supabase
              .from("managed_profiles")
              .select("id")
              .eq("user_id", userId);

            if (managedProfiles && managedProfiles.length > 0) {
              for (const profile of managedProfiles) {
                const managedFolder = `managed-profiles/${profile.id}`;
                const { data: managedFiles, error: managedListError } = await supabase.storage
                  .from(bucketName)
                  .list(managedFolder);

                if (!managedListError && managedFiles && managedFiles.length > 0) {
                  const managedFilePaths = managedFiles.map(file => `${managedFolder}/${file.name}`);
                  const { error: managedDeleteError } = await supabase.storage
                    .from(bucketName)
                    .remove(managedFilePaths);

                  if (managedDeleteError) {
                    console.warn(`Failed to delete managed profile files from ${bucketName}/${managedFolder}:`, managedDeleteError);
                  } else {
                    console.log(`Deleted ${managedFiles.length} managed profile files from ${bucketName}/${managedFolder}`);
                  }
                }
              }
            }
          }

        } catch (bucketError) {
          console.warn(`Error processing bucket ${bucketName}:`, bucketError);
        }
      }
    } catch (error) {
      console.error("Error deleting user storage files:", error);
      // Don't throw error here - we want to continue with database deletion even if storage cleanup fails
    }
  },

  async downloadAllData(userId) {
    try {
      const dataToDownload = {
        timestamp: new Date().toISOString(),
        userId: userId,
        databaseData: {},
      };
      const { data: requests } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", userId);
      if (requests) dataToDownload.databaseData.serviceRequests = requests;

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(dataToDownload, null, 2));
      const downloadAnchorNode = document.createElement("a");
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute(
        "download",
        `netlife_data_backup_${new Date().toISOString().split("T")[0]}.json`
      );
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      return { success: true };
    } catch (error) {
      console.error("Error downloading data:", error);
      return { success: false, error: error.message };
    }
  },
};
