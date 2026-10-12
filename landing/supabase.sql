-- =====================================================================
-- Tabla única de inscritos a la beta (FN0: sin normalizar a propósito)
-- Ejecutar en Supabase > SQL Editor
-- =====================================================================

create table if not exists public.beta_signups (
  id                 bigint generated always as identity primary key,
  nombre             text        not null check (char_length(nombre) between 2 and 80),
  correo             text        not null check (
                                   char_length(correo) <= 120
                                   and correo ~* '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'
                                 ),
  perfil             text        not null check (perfil in ('universitario','posgrado','docente','otro')),
  institucion        text        check (institucion is null or char_length(institucion) <= 100),
  necesidad          text        not null check (char_length(necesidad) between 10 and 500),
  interes            text        not null check (interes in ('alto','medio','bajo')),
  acepta_privacidad  boolean     not null check (acepta_privacidad = true),
  fecha_inscripcion  timestamptz not null default now()
);

-- Evita inscripciones duplicadas del mismo correo (ignora mayúsculas)
create unique index if not exists beta_signups_correo_unico
  on public.beta_signups (lower(correo));

-- ---------------------------------------------------------------------
-- Seguridad: RLS activado + solo INSERT para el público
-- ---------------------------------------------------------------------
alter table public.beta_signups enable row level security;

-- Quitar cualquier permiso por defecto a los roles públicos
revoke all on public.beta_signups from anon, authenticated;

-- Permitir únicamente insertar
grant insert on public.beta_signups to anon;

-- (el id se genera solo; anon necesita permiso sobre la secuencia implícita de identity: no hace falta)

drop policy if exists "anon puede inscribirse" on public.beta_signups;
create policy "anon puede inscribirse"
  on public.beta_signups
  for insert
  to anon
  with check (true);

-- No se crea ninguna política SELECT/UPDATE/DELETE:
-- nadie desde el navegador puede leer, modificar ni borrar inscritos.
-- Tú los ves en Supabase > Table Editor (con tu sesión de administrador).

-- ---------------------------------------------------------------------
-- Datos de prueba (opcional; bórralos antes de la beta real)
-- ---------------------------------------------------------------------
-- insert into public.beta_signups (nombre, correo, perfil, institucion, necesidad, interes, acepta_privacidad)
-- values ('Prueba Uno', 'prueba1@example.com', 'universitario', 'Universidad X',
--         'Me cuesta empezar mi tesis y la dejo para último momento.', 'alto', true);
