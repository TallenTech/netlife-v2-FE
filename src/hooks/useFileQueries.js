import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { logError } from "@/utils/errorHandling";

const BUCKET_NAME = "userfiles";

const listUserFiles = async (userId) => {
  if (!userId) return [];

  const { data: fileList, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(`user_${userId}`, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (listError) throw listError;
  if (!fileList) return [];

  const filesWithUrls = await Promise.all(
    fileList.map(async (file) => {
      const { data: signedUrlData } = await supabase.storage
        .from(BUCKET_NAME)
        .createSignedUrl(`user_${userId}/${file.name}`, 3600);

      return {
        id: file.id,
        name: file.name,
        size: file.metadata?.size || 0,
        type: getFileType(file.name),
        url: signedUrlData?.signedUrl || null,
        uploadedAt: file.created_at,
        originalName: extractOriginalName(file.name),
      };
    })
  );
  return filesWithUrls.filter(Boolean);
};

const uploadUserFiles = async ({ userId, files }) => {
  if (!userId || !files?.length) return;

  const uploadPromises = files.map(async (file) => {
    if (file.size > 10 * 1024 * 1024)
      throw new Error(`File ${file.name} is too large (max 10MB).`);

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueFileName = `${timestamp}_${randomString}_${file.name}`;
    const filePath = `user_${userId}/${uniqueFileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);
    if (error) throw error;
    return uniqueFileName;
  });

  return Promise.all(uploadPromises);
};

const deleteUserFile = async ({ userId, fileName }) => {
  if (!userId || !fileName) return;
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([`user_${userId}/${fileName}`]);
  if (error) throw error;
};

const getFileType = (fileName) => {
  const extension = fileName.split(".").pop().toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension)) return "image";
  if (extension === "pdf") return "pdf";
  return "document";
};

const extractOriginalName = (fileName) => {
  const parts = fileName.split("_");
  if (parts.length > 2) return parts.slice(2).join("_");
  return fileName;
};

export const useUserFiles = (userId) => {
  return useQuery({
    queryKey: ["userFiles", userId],
    queryFn: () => listUserFiles(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUploadUserFiles = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadUserFiles,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["userFiles", variables.userId],
      });
    },
    onError: (error) => {
      logError(error, "useUploadUserFiles");
    },
  });
};

export const useDeleteUserFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserFile,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["userFiles", variables.userId],
      });
    },
    onError: (error) => {
      logError(error, "useDeleteUserFile");
    },
  });
};
