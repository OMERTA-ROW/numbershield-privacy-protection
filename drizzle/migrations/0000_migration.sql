
create type public.app_role as enum ('admin','support','user');
create type public.org_role as enum ('owner','admin','member');
create type public.verification_status as enum ('pending_setup','pending','verified','rejected');
create type public.request_status as enum ('pending','confirmed','rejected','unsupported','mock','withdrawn');
create type public.coverage_status as enum ('supported','partial','unsupported','planned');
create type public.integration_mode as enum ('demo','manual','api');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role=_role)
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id=_user_id and role in ('admin','support'))
$$;

create policy "own roles readable" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_by uuid not null,
  created_at timestamptz not null default now()
);
create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null,
  role public.org_role not null default 'member',
  created_at timestamptz not null default now(),
  unique(org_id, user_id)
);
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.org_role not null default 'member',
  token uuid not null default gen_random_uuid() unique,
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  invited_by uuid not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organizations, public.memberships, public.invitations to authenticated;
grant all on public.organizations, public.memberships, public.invitations to service_role;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.invitations enable row level security;

create or replace function public.org_role_of(_org uuid, _user uuid)
returns public.org_role language sql stable security definer set search_path = public as $$
  select role from public.memberships where org_id=_org and user_id=_user
$$;
create or replace function public.is_org_admin(_org uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.org_role_of(_org,_user) in ('owner','admin'), false)
$$;

create policy "members read org" on public.organizations for select to authenticated
  using (public.org_role_of(id, auth.uid()) is not null or public.is_staff(auth.uid()));
create policy "create org" on public.organizations for insert to authenticated with check (created_by = auth.uid());
create policy "admins update org" on public.organizations for update to authenticated using (public.is_org_admin(id, auth.uid()));
create policy "owner delete org" on public.organizations for delete to authenticated using (public.org_role_of(id, auth.uid())='owner');

create policy "members read memberships" on public.memberships for select to authenticated
  using (public.org_role_of(org_id, auth.uid()) is not null or public.is_staff(auth.uid()));
create policy "admins manage memberships" on public.memberships for update to authenticated
  using (public.is_org_admin(org_id, auth.uid()) and role <> 'owner') with check (public.is_org_admin(org_id, auth.uid()) and role <> 'owner');
create policy "admins remove or self leave" on public.memberships for delete to authenticated
  using ((public.is_org_admin(org_id, auth.uid()) and role <> 'owner') or (user_id = auth.uid() and role <> 'owner'));

create policy "admins read invites" on public.invitations for select to authenticated
  using (public.is_org_admin(org_id, auth.uid()) or lower(email) = lower(auth.jwt()->>'email'));
create policy "admins create invites" on public.invitations for insert to authenticated
  with check (public.is_org_admin(org_id, auth.uid()) and invited_by = auth.uid() and role <> 'owner');
create policy "admins revoke invites" on public.invitations for update to authenticated
  using (public.is_org_admin(org_id, auth.uid()));

create table public.phone_numbers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  org_id uuid references public.organizations(id) on delete set null,
  e164 text not null check (e164 ~ '^\+[1-9][0-9]{7,14}$'),
  label text,
  verification_status public.verification_status not null default 'pending_setup',
  verified_method text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, e164)
);
grant select, insert, update, delete on public.phone_numbers to authenticated;
grant all on public.phone_numbers to service_role;
alter table public.phone_numbers enable row level security;
create policy "own numbers read" on public.phone_numbers for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own numbers insert" on public.phone_numbers for insert to authenticated
  with check (user_id = auth.uid() and verification_status = 'pending_setup' and verified_at is null
    and (org_id is null or public.org_role_of(org_id, auth.uid()) is not null));
create policy "own numbers delete" on public.phone_numbers for delete to authenticated using (user_id = auth.uid());
create policy "own numbers label" on public.phone_numbers for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.guard_phone_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.verification_status is distinct from old.verification_status
      or new.verified_at is distinct from old.verified_at
      or new.verified_method is distinct from old.verified_method
      or new.e164 is distinct from old.e164
      or new.user_id is distinct from old.user_id)
     and not public.has_role(auth.uid(),'admin')
     and coalesce(current_setting('app.trusted', true),'') <> 'on' then
    raise exception 'Verification fields can only be changed by the verification service or an admin';
  end if;
  return new;
end $$;
create trigger trg_guard_phone before update on public.phone_numbers for each row execute function public.guard_phone_update();

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  phone_number_id uuid references public.phone_numbers(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms','privacy','number_ownership','removal_authorization','provider_contact','notifications')),
  version text not null default 'beta-2026-10',
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
grant select, insert, update on public.consents to authenticated;
grant all on public.consents to service_role;
alter table public.consents enable row level security;
create policy "own consents read" on public.consents for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own consents insert" on public.consents for insert to authenticated with check (user_id = auth.uid() and revoked_at is null);
create policy "own consents revoke" on public.consents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  coverage public.coverage_status not null default 'planned',
  integration_mode public.integration_mode not null default 'demo',
  removal_scope text not null default 'Full public phone listing (where lawful and provider-supported)',
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.providers to anon, authenticated;
grant insert, update, delete on public.providers to authenticated;
grant all on public.providers to service_role;
alter table public.providers enable row level security;
create policy "public read providers" on public.providers for select to anon, authenticated using (true);
create policy "admin write providers" on public.providers for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.delisting_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  phone_number_id uuid not null references public.phone_numbers(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  status public.request_status not null default 'mock',
  is_demo boolean not null default true,
  status_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(phone_number_id, provider_id)
);
grant select, update on public.delisting_requests to authenticated;
grant all on public.delisting_requests to service_role;
alter table public.delisting_requests enable row level security;
create policy "own requests read" on public.delisting_requests for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff update requests" on public.delisting_requests for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.delisting_requests(id) on delete cascade,
  user_id uuid not null,
  summary text not null,
  is_demo boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.receipts to authenticated;
grant all on public.receipts to service_role;
alter table public.receipts enable row level security;
create policy "own receipts" on public.receipts for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.alerts to authenticated;
grant all on public.alerts to service_role;
alter table public.alerts enable row level security;
create policy "own alerts read" on public.alerts for select to authenticated using (user_id = auth.uid());
create policy "own alerts update" on public.alerts for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own alerts delete" on public.alerts for delete to authenticated using (user_id = auth.uid());

create table public.legal_cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null check (char_length(title) between 3 and 200),
  description text not null check (char_length(description) <= 5000),
  evidence_links text check (char_length(evidence_links) <= 3000),
  referral_consent boolean not null default false,
  status text not null default 'received' check (status in ('received','under_review','referral_ready','closed')),
  created_at timestamptz not null default now()
);
grant select, insert, update on public.legal_cases to authenticated;
grant all on public.legal_cases to service_role;
alter table public.legal_cases enable row level security;
create policy "own cases read" on public.legal_cases for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "own cases insert" on public.legal_cases for insert to authenticated with check (user_id = auth.uid() and status='received');
create policy "staff cases update" on public.legal_cases for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null check (char_length(email) <= 255),
  subject text not null check (char_length(subject) between 3 and 200),
  body text not null check (char_length(body) between 5 and 5000),
  status text not null default 'open' check (status in ('open','in_progress','resolved')),
  created_at timestamptz not null default now()
);
grant insert on public.support_tickets to anon;
grant select, insert, update on public.support_tickets to authenticated;
grant all on public.support_tickets to service_role;
alter table public.support_tickets enable row level security;
create policy "anyone submit ticket" on public.support_tickets for insert to anon, authenticated
  with check ((user_id is null or user_id = auth.uid()) and status='open');
create policy "own tickets read" on public.support_tickets for select to authenticated using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "staff tickets update" on public.support_tickets for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.audit_events to authenticated;
grant all on public.audit_events to service_role;
alter table public.audit_events enable row level security;
create policy "own or admin audit read" on public.audit_events for select to authenticated
  using (actor_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.log_audit(_action text, _type text, _id uuid, _meta jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_events(actor_id, action, target_type, target_id, metadata) values (auth.uid(), _action, _type, _id, coalesce(_meta,'{}'::jsonb));
$$;
revoke execute on function public.log_audit(text,text,uuid,jsonb) from public, anon, authenticated;

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare j_old jsonb; j_new jsonb; meta jsonb := '{}'::jsonb;
begin
  if tg_op <> 'INSERT' then j_old := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then j_new := to_jsonb(new); end if;
  if tg_op = 'UPDATE' and (j_old ? 'status') then
    meta := jsonb_build_object('from', j_old->>'status', 'to', j_new->>'status');
  end if;
  insert into public.audit_events(actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), lower(tg_op), tg_table_name, (coalesce(j_new, j_old)->>'id')::uuid, meta);
  return null;
end $$;
create trigger audit_phone after insert or update or delete on public.phone_numbers for each row execute function public.audit_row();
create trigger audit_consents after insert or update on public.consents for each row execute function public.audit_row();
create trigger audit_requests after update on public.delisting_requests for each row execute function public.audit_row();
create trigger audit_memberships after insert or update or delete on public.memberships for each row execute function public.audit_row();
create trigger audit_invites after insert or update on public.invitations for each row execute function public.audit_row();
create trigger audit_providers after insert or update or delete on public.providers for each row execute function public.audit_row();
create trigger audit_cases after insert or update on public.legal_cases for each row execute function public.audit_row();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)));
  insert into public.user_roles(user_id, role) values (new.id, 'user');
  insert into public.organizations(name, created_by) values ('Personal', new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.org_owner_on_create()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.memberships(org_id, user_id, role) values (new.id, new.created_by, 'owner') on conflict do nothing;
  return new;
end $$;
create trigger trg_org_owner after insert on public.organizations for each row execute function public.org_owner_on_create();

create or replace function public.accept_invitation(_token uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare inv public.invitations;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into inv from public.invitations where token=_token and status='pending';
  if inv.id is null then raise exception 'Invitation not found or no longer valid'; end if;
  if lower(inv.email) <> lower(auth.jwt()->>'email') then raise exception 'This invitation was sent to a different email address'; end if;
  insert into public.memberships(org_id, user_id, role) values (inv.org_id, auth.uid(), inv.role) on conflict (org_id,user_id) do nothing;
  update public.invitations set status='accepted' where id=inv.id;
  return inv.org_id;
end $$;
revoke execute on function public.accept_invitation(uuid) from public, anon;
grant execute on function public.accept_invitation(uuid) to authenticated;

create or replace function public.activate_numbershield(_phone_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare ph public.phone_numbers; n integer := 0; p record; missing text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into ph from public.phone_numbers where id=_phone_id;
  if ph.id is null or ph.user_id <> auth.uid() then raise exception 'Number not found'; end if;
  if ph.verification_status <> 'verified' then raise exception 'This number is not verified yet. Activation requires genuine ownership verification.'; end if;
  select string_agg(t, ', ') into missing from unnest(array['number_ownership','removal_authorization','provider_contact']) t
    where not exists (select 1 from public.consents c where c.user_id=auth.uid() and c.phone_number_id=_phone_id and c.consent_type=t and c.revoked_at is null);
  if missing is not null then raise exception 'Missing consent: %', missing; end if;
  for p in select * from public.providers where active loop
    insert into public.delisting_requests(user_id, phone_number_id, provider_id, status, is_demo, status_note)
    values (auth.uid(), _phone_id, p.id,
      case when p.coverage in ('unsupported','planned') then 'unsupported'::public.request_status else 'mock'::public.request_status end,
      true,
      case when p.coverage in ('unsupported','planned') then 'Provider not covered yet. No request sent.'
           else 'DEMO: no request was sent. Provider contract / authorized API not configured.' end)
    on conflict (phone_number_id, provider_id) do update set
      status = excluded.status, status_note = excluded.status_note, updated_at = now()
      where public.delisting_requests.status = 'withdrawn';
    n := n + 1;
  end loop;
  insert into public.alerts(user_id, title, body) values (auth.uid(), 'NumberShield activated (demo mode)',
    'Demo removal requests were queued for number ending '|| right(ph.e164,4) ||'. No real provider was contacted.');
  perform public.log_audit('activate', 'phone_numbers', _phone_id, jsonb_build_object('providers', n, 'demo', true));
  return n;
end $$;
revoke execute on function public.activate_numbershield(uuid) from public, anon;
grant execute on function public.activate_numbershield(uuid) to authenticated;

create or replace function public.revoke_protection(_phone_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if not exists (select 1 from public.phone_numbers where id=_phone_id and user_id=auth.uid()) then raise exception 'Number not found'; end if;
  update public.consents set revoked_at=now() where phone_number_id=_phone_id and user_id=auth.uid() and revoked_at is null
    and consent_type in ('removal_authorization','provider_contact');
  update public.delisting_requests set status='withdrawn', status_note='Withdrawn by owner', updated_at=now()
    where phone_number_id=_phone_id and user_id=auth.uid() and status in ('pending','mock');
  get diagnostics n = row_count;
  insert into public.alerts(user_id, title, body) values (auth.uid(), 'Protection revoked', n || ' open request(s) withdrawn.');
  perform public.log_audit('revoke', 'phone_numbers', _phone_id, jsonb_build_object('withdrawn', n));
  return n;
end $$;
revoke execute on function public.revoke_protection(uuid) from public, anon;
grant execute on function public.revoke_protection(uuid) to authenticated;

create or replace function public.admin_set_verification(_phone_id uuid, _status public.verification_status, _note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  update public.phone_numbers set verification_status=_status,
    verified_method = case when _status='verified' then 'manual_admin_review' else null end,
    verified_at = case when _status='verified' then now() else null end
  where id=_phone_id;
  perform public.log_audit('admin_set_verification','phone_numbers',_phone_id, jsonb_build_object('status',_status,'note',_note));
end $$;
revoke execute on function public.admin_set_verification(uuid, public.verification_status, text) from public, anon;
grant execute on function public.admin_set_verification(uuid, public.verification_status, text) to authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_touch_req before update on public.delisting_requests for each row execute function public.touch_updated_at();

insert into public.providers(name, category, coverage, integration_mode, notes) values
 ('People-search directory A (example)','People search','supported','demo','Demo adapter. No contract yet.'),
 ('People-search directory B (example)','People search','partial','demo','Demo adapter. Opt-out form exists; automation not authorized.'),
 ('Reverse phone lookup C (example)','Reverse lookup','supported','demo','Demo adapter.'),
 ('Business listing D (example)','Business directory','partial','demo','Demo adapter. Full listing removal depends on provider policy.'),
 ('Data broker E (example)','Data broker','planned','demo','Planned. Not covered.'),
 ('Caller ID app F (example)','Caller ID','unsupported','manual','Not supported. Spam/safety reports from other users are preserved.');
