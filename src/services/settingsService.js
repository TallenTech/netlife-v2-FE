import { supabase } from "@/lib/supabase";
import JSZip from "jszip";
import {
  createEligibilityReportPdf,
  createComprehensiveProfilePdf,
} from "@/lib/exportUtils";

async function downloadAllData(userId, onProgress) {
  try {
    const zip = new JSZip();
    const totalSteps = 4;

    const updateProgress = (stepNumber, message) => {
      const percent = (stepNumber / totalSteps) * 100;
      onProgress({ stage: message, percent });
    };

    updateProgress(1, "Gathering all user profiles...");
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
    const mainFirstName = mainProfile.username.split(" ")[0] || "user";
    const rootZipFolder = zip.folder(`NetLife_Data_Export_${mainFirstName}`);

    const mainProfileFolderName = `Main_Profile_${mainFirstName}`;
    const mainProfileFolder = rootZipFolder.folder(mainProfileFolderName);
    const managedProfilesParentFolder =
      rootZipFolder.folder("Managed_Profiles");

    const processProfileStepSize = 1 / allProfiles.length;

    for (const [index, profile] of allProfiles.entries()) {
      const isMain = !profile.manager_id;
      const profileFirstName = profile.username.split(" ")[0];
      const currentProgressBase =
        ((1 + index * processProfileStepSize) / totalSteps) * 100;
      onProgress({
        stage: `Processing data for ${profileFirstName}...`,
        percent: currentProgressBase,
      });

      const patientFolder = isMain
        ? mainProfileFolder
        : managedProfilesParentFolder.folder(
            profile.username.replace(/\s+/g, "_")
          );

      if (profile.profile_picture) {
        let imageUrl = "";
        let imageType = "png";
        if (profile.profile_picture.startsWith("http")) {
          imageUrl = profile.profile_picture;
          imageType =
            profile.profile_picture.split(".").pop().split("?")[0] || "png";
        } else {
          imageUrl = `${window.location.origin}/avatars/${profile.profile_picture}.png`;
        }
        try {
          const response = await fetch(imageUrl);
          if (response.ok) {
            const imageBytes = await response.arrayBuffer();
            patientFolder.file(`profile_image.${imageType}`, imageBytes);
          }
        } catch (e) {
          console.warn(`Could not fetch image for ${profile.username}`);
        }
      }

      const eligibilityReportsFolder = patientFolder.folder(
        "Eligibility_Reports"
      );
      const { data: screeningResults } = await supabase
        .from("screening_results")
        .select("*, services(name)")
        .eq("user_id", profile.id);
      if (screeningResults) {
        for (const result of screeningResults) {
          const pdfBytes = await createEligibilityReportPdf(result, profile);
          const serviceName =
            result.services?.name.replace(/\s+/g, "_") || "Unknown";
          const date = new Date(result.completed_at)
            .toISOString()
            .split("T")[0];
          eligibilityReportsFolder.file(
            `${serviceName}_Report_${date}.pdf`,
            pdfBytes
          );
        }
      }

      const requestsFolder = patientFolder.folder("Service_Requests");
      const { data: serviceRequests } = await supabase
        .from("service_requests")
        .select("*, services(name)")
        .eq("user_id", profile.id);
      if (serviceRequests) {
        for (const request of serviceRequests) {
          const serviceName =
            request.services?.name.replace(/\s+/g, "_") || "Request";
          const requestIdShort = request.id.slice(0, 8);
          const requestFolder = requestsFolder.folder(
            `${serviceName}_${requestIdShort}`
          );

          const { data: generatedPdfs } = await supabase
            .from("generated_pdfs")
            .select("*")
            .eq("service_request_id", request.id);
          if (generatedPdfs) {
            for (const pdf of generatedPdfs) {
              const { data: fileData, error } = await supabase.storage
                .from("generated-service-pdfs")
                .download(pdf.file_path);
              if (!error) requestFolder.file(pdf.file_name, fileData);
            }
          }

          const { data: userAttachments } = await supabase
            .from("user_attachments")
            .select("*")
            .eq("service_request_id", request.id);
          if (userAttachments) {
            for (const attachment of userAttachments) {
              const { data: fileData, error } = await supabase.storage
                .from("service-attachments")
                .download(attachment.file_path);
              if (!error)
                requestFolder.file(attachment.original_name, fileData);
            }
          }
        }
      }
    }

    updateProgress(3, "Generating final summary...");
    const profilePdfBytes = await createComprehensiveProfilePdf(
      mainProfile,
      managedProfiles
    );
    mainProfileFolder.file("Profile_Summary.pdf", profilePdfBytes);

    updateProgress(4, "Compressing your data...");
    const zipBlob = await zip.generateAsync({ type: "blob" }, (metadata) => {
      const compressionProgress = 75 + (metadata.percent / 100) * 25;
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
