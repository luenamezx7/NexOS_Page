begin;

-- Restrictive policies are ANDed with existing ownership policies.
-- Direct Data API calls must not bypass the application's MFA requirement.
create policy orders_require_mfa
  on public.orders as restrictive
  for select to authenticated
  using (
    (select auth.jwt() ->> 'aal') = 'aal2'
    and coalesce((select auth.jwt() ->> 'is_anonymous'), 'false') = 'false'
  );

commit;
