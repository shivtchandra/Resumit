-- ============================================================
-- Resumit Extension — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- Table: user_resumes
-- Stores extracted text from user-uploaded resumes.
-- Row-Level Security ensures each user can only access their own.

create table if not exists public.user_resumes (
    id           uuid        default gen_random_uuid() primary key,
    user_id      uuid        not null references auth.users (id) on delete cascade,
    filename     text        not null,
    resume_text  text        not null,
    file_url     text,       -- optional: public URL if stored in Supabase Storage
    created_at   timestamptz default now() not null
);

-- Enable Row Level Security
alter table public.user_resumes enable row level security;

-- Policy: users can only see and manage their own resumes
create policy "users_own_resumes_select"
    on public.user_resumes for select
    using (auth.uid() = user_id);

create policy "users_own_resumes_insert"
    on public.user_resumes for insert
    with check (auth.uid() = user_id);

create policy "users_own_resumes_delete"
    on public.user_resumes for delete
    using (auth.uid() = user_id);

-- Index for fast lookups by user
create index if not exists idx_user_resumes_user_id
    on public.user_resumes (user_id, created_at desc);

-- ============================================================
-- IMPORTANT: Enable Email Auth or Google OAuth in:
-- Supabase Dashboard → Authentication → Providers
-- ============================================================
