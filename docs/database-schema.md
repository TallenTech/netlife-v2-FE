# NetLife Database Schema Reference

**WARNING: This schema is for context only and is not meant to be run.**
Table order and constraints may not be valid for execution.

## Core Tables

### services
```sql
CREATE TABLE public.services (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    slug text UNIQUE NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT services_pkey PRIMARY KEY (id)
);
```

### service_questions
```sql
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
```

### question_options
```sql
CREATE TABLE public.question_options (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    question_id uuid,
    option_text text NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT question_options_pkey PRIMARY KEY (id),
    CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.service_questions(id)
);
```

### user_screening_answers
```sql
CREATE TABLE public.user_screening_answers (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    service_id uuid,
    question_id uuid,
    selected_option_id uuid,
    answer_text text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_screening_answers_pkey PRIMARY KEY (id),
    CONSTRAINT user_screening_answers_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.question_options(id),
    CONSTRAINT user_screening_answers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
    CONSTRAINT user_screening_answers_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id),
    CONSTRAINT user_screening_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.service_questions(id)
);
```

### service_requests
```sql
CREATE TABLE public.service_requests (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    service_id uuid,
    status text DEFAULT 'pending'::text,
    request_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT service_requests_pkey PRIMARY KEY (id),
    CONSTRAINT service_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
    CONSTRAINT service_requests_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id)
);
```

## User Management Tables

### profiles
```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL CHECK (char_length(full_name) >= 2),
    whatsapp_number text NOT NULL UNIQUE CHECK (whatsapp_number ~ '^\+[1-9]\d{1,14}$'::text),
    username text NOT NULL UNIQUE CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    date_of_birth date NOT NULL,
    gender USER-DEFINED NOT NULL,
    district text NOT NULL,
    sub_county text,
    profile_picture text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
```

### login_codes
```sql
CREATE TABLE public.login_codes (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    phone character varying NOT NULL,
    code character varying NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT login_codes_pkey PRIMARY KEY (id)
);
```

## Location Tables

### districts
```sql
CREATE TABLE public.districts (
    id integer NOT NULL DEFAULT nextval('districts_id_seq'::regclass),
    name character varying NOT NULL UNIQUE,
    region character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT districts_pkey PRIMARY KEY (id)
);
```

### sub_counties
```sql
CREATE TABLE public.sub_counties (
    id integer NOT NULL DEFAULT nextval('sub_counties_id_seq'::regclass),
    name character varying NOT NULL,
    district_id integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT sub_counties_pkey PRIMARY KEY (id),
    CONSTRAINT sub_counties_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id)
);
```

## Content Tables

### videos
```sql
CREATE TABLE public.videos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    video_url text NOT NULL,
    source text DEFAULT 'netlife'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT videos_pkey PRIMARY KEY (id)
);
```

### user_videos
```sql
CREATE TABLE public.user_videos (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    video_id uuid,
    recommended_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_videos_pkey PRIMARY KEY (id),
    CONSTRAINT user_videos_video_id_fkey FOREIGN KEY (video_id) REFERENCES public.videos(id),
    CONSTRAINT user_videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

### notifications
```sql
CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid,
    title text,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
```

## Key Relationships

- `services` → `service_questions` (one-to-many)
- `service_questions` → `question_options` (one-to-many)
- `service_questions` → `user_screening_answers` (one-to-many)
- `services` → `service_requests` (one-to-many)
- `profiles` → `service_requests` (one-to-many)
- `profiles` → `user_screening_answers` (one-to-many)
- `districts` → `sub_counties` (one-to-many)
- `videos` → `user_videos` (one-to-many)
- `profiles` → `notifications` (one-to-many)