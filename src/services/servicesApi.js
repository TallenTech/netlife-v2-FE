import { supabase } from "@/lib/supabase";
import {
  handleApiError,
  logError,
  validateRequiredFields,
  retryWithBackoff,
} from "@/utils/errorHandling";
import { processAndUploadAttachment } from "@/utils/attachmentHelpers";
import {
  validateDeliveryPreferences,
  extractCommonFields,
  transformQuestionData,
} from "./servicesApi.utils";

const base64ToFile = (dataUrl, filename, mimeType) => {
  const arr = dataUrl.split(",");
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mimeType });
};

export const servicesApi = {
  async getServices() {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw new Error(`Failed to fetch services: ${error.message}`);
      return data || [];
    } catch (error) {
      logError(error, "servicesApi.getServices");
      throw new Error(handleApiError(error));
    }
  },

  async getServiceQuestions(serviceId) {
    try {
      validateRequiredFields({ serviceId }, ["serviceId"]);
      const { data, error } = await supabase
        .from("service_questions")
        .select("*")
        .eq("service_id", serviceId)
        .order("created_at", { ascending: true });
      if (error)
        throw new Error(`Failed to fetch service questions: ${error.message}`);
      return data || [];
    } catch (error) {
      logError(error, "servicesApi.getServiceQuestions", { serviceId });
      throw new Error(handleApiError(error));
    }
  },

  async getQuestionOptions(questionId) {
    try {
      validateRequiredFields({ questionId }, ["questionId"]);
      const { data, error } = await supabase
        .from("question_options")
        .select("*")
        .eq("question_id", questionId)
        .order("created_at", { ascending: true });
      if (error)
        throw new Error(`Failed to fetch question options: ${error.message}`);
      return data || [];
    } catch (error) {
      logError(error, "servicesApi.getQuestionOptions", { questionId });
      throw new Error(handleApiError(error));
    }
  },

  async saveScreeningAnswers(answers) {
    try {
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        throw new Error("Valid answers array is required");
      }
      for (const answer of answers) {
        validateRequiredFields(answer, [
          "user_id",
          "service_id",
          "question_id",
        ]);
      }
      const { error } = await supabase
        .from("user_screening_answers")
        .insert(answers);
      if (error)
        throw new Error(`Failed to save screening answers: ${error.message}`);
    } catch (error) {
      logError(error, "servicesApi.saveScreeningAnswers", {
        answersCount: answers?.length,
      });
      throw new Error(handleApiError(error));
    }
  },

  async submitServiceRequest(request) {
    try {
      validateRequiredFields(request, [
        "user_id",
        "service_id",
        "request_data",
      ]);

      const extractedFields = extractCommonFields(request.request_data);

      const requestPayload = {
        user_id: request.user_id,
        service_id: request.service_id,
        status: request.status || "pending",
        request_data: request.request_data,
        attachments: [],
        delivery_method: extractedFields.delivery_method,
        delivery_location: extractedFields.delivery_location,
        preferred_date: extractedFields.preferred_date,
        quantity: extractedFields.quantity,
        counselling_required: extractedFields.counselling_required,
        counselling_channel: extractedFields.counselling_channel,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("service_requests")
        .insert([requestPayload])
        .select("id")
        .single();

      if (error) {
        throw new Error(`Failed to submit service request: ${error.message}`);
      }
      return data.id;
    } catch (error) {
      logError(error, "servicesApi.submitServiceRequest", { request });
      throw new Error(handleApiError(error));
    }
  },

  async submitServiceRequestForSync(request) {
    let fileToUpload = request.attachments;
    if (
      fileToUpload &&
      typeof fileToUpload === "object" &&
      fileToUpload.dataUrl
    ) {
      fileToUpload = base64ToFile(
        fileToUpload.dataUrl,
        fileToUpload.name,
        fileToUpload.type
      );
    }
    const requestWithFile = { ...request, attachments: fileToUpload };
    return this.submitServiceRequest(requestWithFile);
  },

  async getUserServiceRequests(userId) {
    try {
      validateRequiredFields({ userId }, ["userId"]);
      const { data, error } = await supabase
        .from("service_requests")
        .select(`*, services (id, name, description, slug)`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error)
        throw new Error(
          `Failed to fetch user service requests: ${error.message}`
        );
      return data || [];
    } catch (error) {
      logError(error, "servicesApi.getUserServiceRequests", { userId });
      throw new Error(handleApiError(error));
    }
  },

  async getCurrentUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error)
        throw new Error(`Failed to get current user: ${error.message}`);
      return user;
    } catch (error) {
      logError(error, "servicesApi.getCurrentUser");
      throw new Error(handleApiError(error));
    }
  },

  async saveScreeningResult(result) {
    try {
      validateRequiredFields(result, [
        "user_id",
        "service_id",
        "score",
        "eligible",
      ]);
      const resultData = {
        user_id: result.user_id,
        service_id: result.service_id,
        score: result.score,
        eligible: result.eligible,
        answers_summary: result.answers || null,
        completed_at: result.completed_at || new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from("screening_results")
        .insert([resultData])
        .select("id")
        .single();
      if (error)
        throw new Error(`Failed to save screening result: ${error.message}`);
      return data.id;
    } catch (error) {
      logError(error, "servicesApi.saveScreeningResult", { result });
      throw new Error(handleApiError(error));
    }
  },

  async getUserScreeningResults(userId) {
    try {
      validateRequiredFields({ userId }, ["userId"]);
      const { data, error } = await supabase
        .from("screening_results")
        .select(`*, services (id, name, description, slug)`)
        .eq("user_id", userId)
        .order("completed_at", { ascending: false });
      if (error)
        throw new Error(
          `Failed to fetch user screening results: ${error.message}`
        );
      return data || [];
    } catch (error) {
      logError(error, "servicesApi.getUserScreeningResults", { userId });
      throw new Error(handleApiError(error));
    }
  },

  async deleteServiceRequest(requestId) {
    try {
      validateRequiredFields({ requestId }, ["requestId"]);
      const { error } = await supabase
        .from("service_requests")
        .delete()
        .eq("id", requestId);
      if (error)
        throw new Error(`Failed to delete service request: ${error.message}`);
      return true;
    } catch (error) {
      logError(error, "servicesApi.deleteServiceRequest", { requestId });
      throw new Error(handleApiError(error));
    }
  },

  async deleteScreeningResult(resultId) {
    try {
      validateRequiredFields({ resultId }, ["resultId"]);
      const { error } = await supabase
        .from("screening_results")
        .delete()
        .eq("id", resultId);
      if (error)
        throw new Error(`Failed to delete screening result: ${error.message}`);
      return true;
    } catch (error) {
      logError(error, "servicesApi.deleteScreeningResult", { resultId });
      throw new Error(handleApiError(error));
    }
  },

  async getServiceBySlug(slug) {
    try {
      validateRequiredFields({ slug }, ["slug"]);
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(`Failed to fetch service by slug: ${error.message}`);
      }
      return data;
    } catch (error) {
      logError(error, "servicesApi.getServiceBySlug", { slug });
      throw new Error(handleApiError(error));
    }
  },

  async getServiceQuestionsWithOptionsOptimized(serviceId) {
    try {
      validateRequiredFields({ serviceId }, ["serviceId"]);
      const { data, error } = await supabase
        .from("service_questions")
        .select(`*, question_options (*)`)
        .eq("service_id", serviceId)
        .order("created_at", { ascending: true });
      if (error)
        throw new Error(
          `Failed to fetch service questions with options: ${error.message}`
        );
      return (data || []).map((question) =>
        transformQuestionData(question, question.question_options || [])
      );
    } catch (error) {
      logError(error, "servicesApi.getServiceQuestionsWithOptionsOptimized", {
        serviceId,
      });
      throw new Error(handleApiError(error));
    }
  },

  async getVideos() {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(`Failed to fetch videos: ${error.message}`);
      return data || [];
    } catch (error) {
      logError(error, "servicesApi.getVideos");
      throw new Error(handleApiError(error));
    }
  },

  async getVideoById(videoId) {
    try {
      validateRequiredFields({ videoId }, ["videoId"]);
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", videoId)
        .single();
      if (error) {
        if (error.code === "PGRST116") return null;
        throw new Error(`Failed to fetch video by ID: ${error.message}`);
      }
      return data;
    } catch (error) {
      logError(error, "servicesApi.getVideoById", { videoId });
      throw new Error(handleApiError(error));
    }
  },
};
