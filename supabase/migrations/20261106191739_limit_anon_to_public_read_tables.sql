
revoke all privileges on all tables in schema public from anon;

grant select on table
  public.announcements,
  public.app_settings,
  public.categories,
  public.countries,
  public.plans,
  public.portfolio_items,
  public.reviews,
  public.skills,
  public.talent_profile_skills,
  public.talent_profiles
to anon;
