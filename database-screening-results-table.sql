-- ============================================================================
-- SCREENING_RESULTS TABLE
-- ============================================================================
-- This table stores the calculated results of user screenings
-- It complements user_screening_answers by storing the computed outcomes

CREATE TABLE public.screening_results (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    service_id uuid NOT NULL,
    
    -- Screening outcome data
    score integer NOT NULL, -- Eligibility score (0-100)
    eligible boolean NOT NULL, -- Whether user is eligible for the service
    
    -- Metadata
    completed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Optional: Store summary of answers for quick reference
    answers_summary jsonb, -- Could store the key answers or full answer set
    
    -- Constraints
    CONSTRAINT screening_results_pkey PRIMARY KEY (id),
    CONSTRAINT screening_results_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT screening_results_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE,
    CONSTRAINT screening_results_score_check CHECK (score >= 0 AND score <= 100)
);

-- Indexes for performance
CREATE INDEX idx_screening_results_user_id ON public.screening_results(user_id);
CREATE INDEX idx_screening_results_service_id ON public.screening_results(service_id);
CREATE INDEX idx_screening_results_completed_at ON public.screening_results(completed_at DESC);

-- Unique constraint to prevent duplicate screenings (optional - you might want to allow re-screening)
-- CREATE UNIQUE INDEX idx_screening_results_unique_user_service ON public.screening_results(user_id, service_id);

-- Row Level Security
ALTER TABLE public.screening_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: user_id references auth.users(id) directly, same as user_screening_answers

CREATE POLICY "Users can view own screening results" ON public.screening_results
    FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own screening results" ON public.screening_results
    FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own screening results" ON public.screening_results
    FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to delete their own screening results
CREATE POLICY "Users can delete own screening results" ON public.screening_results
    FOR DELETE 
    USING (auth.uid() = user_id);