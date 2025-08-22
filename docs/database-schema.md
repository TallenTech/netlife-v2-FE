-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.districts (
  id integer NOT NULL DEFAULT nextval('districts_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  region character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT districts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.generated_pdfs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  service_request_id uuid NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  CONSTRAINT generated_pdfs_pkey PRIMARY KEY (id),
  CONSTRAINT generated_pdfs_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id)
);
CREATE TABLE public.health_interests_categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT '#6366f1'::text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT health_interests_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.managed_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  manager_id uuid NOT NULL,
  username text NOT NULL,
  date_of_birth date,
  gender text,
  profile_picture text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT managed_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT managed_profiles_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notification_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payload jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT notification_jobs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  whatsapp_number text NOT NULL UNIQUE,
  username text NOT NULL UNIQUE CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  date_of_birth date NOT NULL,
  district text NOT NULL,
  sub_county text,
  profile_picture text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  gender USER-DEFINED,
  health_interests ARRAY DEFAULT '{}'::text[],
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.question_options (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  question_id uuid,
  option_text text NOT NULL,
  value text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT question_options_pkey PRIMARY KEY (id),
  CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.service_questions(id)
);
CREATE TABLE public.screening_results (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  service_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  eligible boolean NOT NULL,
  completed_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  answers_summary jsonb,
  CONSTRAINT screening_results_pkey PRIMARY KEY (id),
  CONSTRAINT screening_results_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT screening_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.service_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  rating text NOT NULL CHECK (rating = ANY (ARRAY['Excellent'::text, 'Good'::text, 'Poor'::text])),
  comments text,
  CONSTRAINT service_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT service_feedback_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id),
  CONSTRAINT service_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.service_questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  service_id uuid,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'yes_no'::text,
  required boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT service_questions_pkey PRIMARY KEY (id),
  CONSTRAINT service_questions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
CREATE TABLE public.service_requests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  service_id uuid,
  status text DEFAULT 'pending'::text,
  request_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  delivery_method text,
  delivery_location jsonb,
  preferred_date timestamp with time zone,
  quantity integer,
  counselling_required boolean,
  counselling_channel text,
  attachments ARRAY,
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  CONSTRAINT service_requests_pkey PRIMARY KEY (id),
  CONSTRAINT service_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT service_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.services (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  slug text UNIQUE,
  service_number integer UNIQUE,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sub_counties (
  id integer NOT NULL DEFAULT nextval('sub_counties_id_seq'::regclass),
  name character varying NOT NULL,
  district_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sub_counties_pkey PRIMARY KEY (id),
  CONSTRAINT sub_counties_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id)
);
CREATE TABLE public.user_attachments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  service_request_id uuid NOT NULL,
  file_path text NOT NULL,
  original_name text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  metadata jsonb,
  CONSTRAINT user_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT user_attachments_service_request_id_fkey FOREIGN KEY (service_request_id) REFERENCES public.service_requests(id),
  CONSTRAINT user_attachments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_health_interests (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  category_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_health_interests_pkey PRIMARY KEY (id),
  CONSTRAINT user_health_interests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.health_interests_categories(id),
  CONSTRAINT user_health_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_screening_answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  service_id uuid,
  question_id uuid,
  selected_option_id uuid,
  answer_text text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_screening_answers_pkey PRIMARY KEY (id),
  CONSTRAINT user_screening_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.service_questions(id),
  CONSTRAINT user_screening_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_screening_answers_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
  CONSTRAINT user_screening_answers_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.question_options(id)
);
CREATE TABLE public.user_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_survey_completions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  status text DEFAULT 'started'::text CHECK (status = ANY (ARRAY['started'::text, 'completed'::text, 'abandoned'::text])),
  survey_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_survey_completions_pkey PRIMARY KEY (id),
  CONSTRAINT user_survey_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_videos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  video_id uuid,
  recommended_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_videos_pkey PRIMARY KEY (id),
  CONSTRAINT user_videos_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id),
  CONSTRAINT user_videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.video_likes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  video_id uuid NOT NULL,
  user_id uuid NOT NULL,
  liked_at timestamp with time zone DEFAULT now(),
  CONSTRAINT video_likes_pkey PRIMARY KEY (id),
  CONSTRAINT video_likes_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id),
  CONSTRAINT video_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.video_shares (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  video_id uuid NOT NULL,
  user_id uuid,
  share_platform text NOT NULL,
  shared_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text,
  CONSTRAINT video_shares_pkey PRIMARY KEY (id),
  CONSTRAINT video_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT video_shares_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id)
);
CREATE TABLE public.video_views (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  video_id uuid NOT NULL,
  user_id uuid,
  ip_address inet,
  user_agent text,
  viewed_at timestamp with time zone DEFAULT now(),
  view_duration_seconds integer DEFAULT 0,
  is_complete boolean DEFAULT false,
  CONSTRAINT video_views_pkey PRIMARY KEY (id),
  CONSTRAINT video_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT video_views_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id)
);
CREATE TABLE public.videos (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  video_url text NOT NULL,
  source text DEFAULT 'netlife'::text,
  created_at timestamp with time zone DEFAULT now(),
  view_count integer DEFAULT 0,
  like_count integer DEFAULT 0,
  share_count integer DEFAULT 0,
  duration_seconds integer DEFAULT 0,
  tags ARRAY DEFAULT '{}'::text[],
  CONSTRAINT videos_pkey PRIMARY KEY (id)
);