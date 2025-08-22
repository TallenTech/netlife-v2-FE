import { supabase } from "@/lib/supabase";
import JSZip from "jszip";
import { formatReportAsText } from "@/lib/exportUtils";

async function downloadAllData(userId, onProgress) {
  try {
    const zip = new JSZip();
    const totalSteps = 6; // We've added a step for user files

    const updateProgress = (stepNumber, message) => {
      const percent = (stepNumber / totalSteps) * 100;
      onProgress({ stage: message, percent });
    };

    // STEP 1: GET PROFILES
    updateProgress(1, "Gathering profile data...");
    const { data: mainProfile, error: mainProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (mainProfileError) throw new Error("Could not find main profile.");

    const { data: managedProfiles, error: managedProfilesError } =
      await supabase
        .from("managed_profiles")
        .select("*")
        .eq("manager_id", userId);
    if (managedProfilesError) throw managedProfilesError;

    const allProfiles = [mainProfile, ...managedProfiles];
    const allProfileIds = allProfiles.map((p) => p.id);
    const mainFirstName = mainProfile.username.split(" ")[0] || "user";
    const rootFolder = zip.folder(`NetLife_Data_Export_${mainFirstName}`);

    // STEP 2: DOWNLOAD PROFILE PICTURES
    updateProgress(2, "Downloading profile pictures...");
    const profilePicturesFolder = rootFolder.folder("Profile_Pictures");
    for (const profile of allProfiles) {
      if (
        profile.profile_picture &&
        profile.profile_picture.startsWith("http")
      ) {
        try {
          const response = await fetch(profile.profile_picture);
          if (response.ok) {
            const blob = await response.blob();
            const profileFirstName = profile.username.split(" ")[0];
            const fileExtension =
              profile.profile_picture.split(".").pop().split("?")[0] || "jpg";
            profilePicturesFolder.file(
              `${profileFirstName}_profile_picture.${fileExtension}`,
              blob
            );
          }
        } catch (e) {
          console.warn(
            `Could not download profile picture for ${profile.username}`,
            e
          );
        }
      }
    }

    // STEP 3: GATHER & FORMAT ELIGIBILITY REPORTS
    updateProgress(3, "Processing eligibility reports...");
    const eligibilityReportsFolder = rootFolder.folder("Eligibility_Reports");
    const { data: screeningResults } = await supabase
      .from("screening_results")
      .select("*, services(name)")
      .in("user_id", allProfileIds);

    if (screeningResults) {
      for (const result of screeningResults) {
        const profile = allProfiles.find((p) => p.id === result.user_id);
        const reportText = formatReportAsText(result, profile);
        const profileFirstName = profile
          ? profile.username.split(" ")[0]
          : "unknown";
        const serviceName =
          result.services?.name.replace(/\s+/g, "_") || "Unknown";
        const date = new Date(result.completed_at).toISOString().split("T")[0];
        eligibilityReportsFolder.file(
          `${profileFirstName}_${serviceName}_Report_${date}.txt`,
          reportText
        );
      }
    }

    // STEP 4: GATHER YOUR UPLOADED FILES (This is the added part)
    updateProgress(4, "Downloading your uploaded files...");
    const userFilesFolder = rootFolder.folder("My_Uploaded_Files");
    const { data: userAttachments } = await supabase
      .from("user_attachments")
      .select("*")
      .in("user_id", allProfileIds);

    if (userAttachments) {
      for (const attachment of userAttachments) {
        const { data: fileData, error } = await supabase.storage
          .from("service-attachments")
          .download(attachment.file_path);
        if (!error) {
          userFilesFolder.file(attachment.original_name, fileData);
        }
      }
    }

    // STEP 5: GATHER SERVICE REQUEST PDFS
    updateProgress(5, "Downloading service request reports...");
    const servicePdfsFolder = rootFolder.folder("Service_Request_Reports");
    const { data: serviceRequests } = await supabase
      .from("service_requests")
      .select("id")
      .in("user_id", allProfileIds);

    if (serviceRequests && serviceRequests.length > 0) {
      const requestIds = serviceRequests.map((r) => r.id);
      const { data: generatedPdfs } = await supabase
        .from("generated_pdfs")
        .select("*")
        .in("service_request_id", requestIds);

      if (generatedPdfs) {
        for (const pdf of generatedPdfs) {
          const { data: fileData, error } = await supabase.storage
            .from("generated-service-pdfs")
            .download(pdf.file_path);
          if (!error) {
            servicePdfsFolder.file(pdf.file_name, fileData);
          }
        }
      }
    }

    // STEP 6: COMPRESSING FILES
    updateProgress(6, "Compressing your data...");
    const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
      const compressionProgress = 83 + (metadata.percent / 100) * 17; // Scale 0-100% to fit the 83-100% range
      onProgress({
        stage: "Compressing your data...",
        percent: compressionProgress,
      });
    });

    onProgress({ stage: "Download starting...", percent: 100 });
    const link = document.createElement("a");
    const url = URL.createObjectURL(zipBlob);
    link.href = url;
    link.download = `NetLife_Data_Backup_${mainFirstName}_${
      new Date().toISOString().split("T")[0]
    }.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error("Error creating data download package:", error);
    throw error;
  }
}

// Your other service functions remain here
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
      await this.deleteUserStorageFiles(userId);
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
        "service-attachments",
      ];
      for (const bucketName of storageBuckets) {
        try {
          let userFolder = "";
          if (bucketName === "profile-photos") {
            userFolder = userId;
          } else if (bucketName === "userfiles") {
            userFolder = `user_${userId}`;
          } else if (bucketName === "service-attachments") {
            userFolder = userId;
          }
          if (userFolder) {
            const { data: files, error: listError } = await supabase.storage
              .from(bucketName)
              .list(userFolder);
            if (listError) {
              console.warn(
                `Failed to list files in ${bucketName}/${userFolder}:`,
                listError
              );
              continue;
            }
            if (files && files.length > 0) {
              const filePaths = files.map(
                (file) => `${userFolder}/${file.name}`
              );
              const { error: deleteError } = await supabase.storage
                .from(bucketName)
                .remove(filePaths);
              if (deleteError) {
                console.warn(
                  `Failed to delete files from ${bucketName}/${userFolder}:`,
                  deleteError
                );
              } else {
                console.log(
                  `Deleted ${files.length} files from ${bucketName}/${userFolder}`
                );
              }
            }
          }
          if (bucketName === "profile-photos") {
            const { data: managedProfiles } = await supabase
              .from("managed_profiles")
              .select("id")
              .eq("user_id", userId);
            if (managedProfiles && managedProfiles.length > 0) {
              for (const profile of managedProfiles) {
                const managedFolder = `managed-profiles/${profile.id}`;
                const { data: managedFiles, error: managedListError } =
                  await supabase.storage.from(bucketName).list(managedFolder);
                if (
                  !managedListError &&
                  managedFiles &&
                  managedFiles.length > 0
                ) {
                  const managedFilePaths = managedFiles.map(
                    (file) => `${managedFolder}/${file.name}`
                  );
                  const { error: managedDeleteError } = await supabase.storage
                    .from(bucketName)
                    .remove(managedFilePaths);
                  if (managedDeleteError) {
                    console.warn(
                      `Failed to delete managed profile files from ${bucketName}/${managedFolder}:`,
                      managedDeleteError
                    );
                  } else {
                    console.log(
                      `Deleted ${managedFiles.length} managed profile files from ${bucketName}/${managedFolder}`
                    );
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
    }
  },
  downloadAllData,
};
