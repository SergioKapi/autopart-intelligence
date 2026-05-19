# AutoPart Intelligence — System Architecture

**Version:** 1.0.0  
**Date:** 2026-05-18  
**Stack:** Next.js · NestJS · PostgreSQL 16 · Elasticsearch 8 · Redis 7 · AWS S3

---

## Table of Contents

1. [Database Schema (PostgreSQL DDL)](#1-database-schema-postgresql)
2. [System Architecture](#2-system-architecture)
3. [Elasticsearch Schema](#3-elasticsearch-schema)
4. [Key Decisions Log](#4-key-decisions-log)

---

## 1. DATABASE SCHEMA (PostgreSQL)

### 1.1 Extensions & Shared Types

```sql
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- fuzzy / trigram text search
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- GIN on scalar columns
CREATE EXTENSION IF NOT EXISTS "unaccent";       -- accent-insensitive search

-- Shared enums
CREATE TYPE part_status       AS ENUM ('active', 'discontinued', 'draft', 'archived');
CREATE TYPE media_type        AS ENUM ('image', 'pdf', 'video', 'manual', 'certificate');
CREATE TYPE position_label    AS ENUM ('front', 'rear', 'left', 'right', 'center', 'upper', 'lower', 'all');
CREATE TYPE equiv_type        AS ENUM ('oem', 'aftermarket', 'remanufactured', 'private_label');
CREATE TYPE substitute_type   AS ENUM ('replaces', 'replaced_by', 'superseded_by', 'alternative');
CREATE TYPE user_role         AS ENUM ('admin', 'technician', 'workshop', 'distributor', 'consumer', 'support');
CREATE TYPE plan_tier         AS ENUM ('free', 'starter', 'professional', 'enterprise');
CREATE TYPE sub_status        AS ENUM ('active', 'trial', 'past_due', 'canceled', 'paused');
CREATE TYPE audit_action      AS ENUM ('insert', 'update', 'delete', 'login', 'export', 'search');
```

---

### 1.2 Manufacturers

```sql
CREATE TABLE manufacturers (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            TEXT            NOT NULL UNIQUE,          -- 'bosch', 'ngk', 'delphi'
    name            TEXT            NOT NULL,
    trade_name      TEXT,                                     -- marketing/brand name if different
    country_code    CHAR(2),                                  -- ISO 3166-1 alpha-2
    logo_url        TEXT,
    website         TEXT,
    is_oem          BOOLEAN         NOT NULL DEFAULT FALSE,   -- true = original equipment manufacturer
    metadata        JSONB           NOT NULL DEFAULT '{}',    -- extra attributes without schema lock-in
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_manufacturers_slug  ON manufacturers USING btree (slug);
CREATE INDEX idx_manufacturers_name  ON manufacturers USING gin  (name gin_trgm_ops);
```

---

### 1.3 Vehicle Hierarchy

```sql
-- Brands (VW, Ford, GM, Fiat, ...)
CREATE TABLE vehicle_brands (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            TEXT        NOT NULL UNIQUE,
    name            TEXT        NOT NULL,
    country_code    CHAR(2),
    logo_url        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vbrand_name ON vehicle_brands USING gin (name gin_trgm_ops);


-- Models per brand (Golf, Gol, Fiesta, ...)
CREATE TABLE vehicle_models (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id        UUID        NOT NULL REFERENCES vehicle_brands (id) ON DELETE RESTRICT,
    slug            TEXT        NOT NULL,
    name            TEXT        NOT NULL,
    body_type       TEXT,                       -- 'sedan', 'hatchback', 'suv', 'pickup', 'van'
    segment         TEXT,                       -- 'compact', 'midsize', 'heavy-duty'
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (brand_id, slug)
);

CREATE INDEX idx_vmodel_brand  ON vehicle_models (brand_id);
CREATE INDEX idx_vmodel_name   ON vehicle_models USING gin (name gin_trgm_ops);


-- Versions: the leaf node of vehicle hierarchy
-- Each row = one specific powertrain/trim combination with a year range
--
-- Year-range design decision:
--   Use integer year_from / year_to columns (NOT a daterange) because:
--   1. Queries are always "year BETWEEN year_from AND year_to" — simple and index-friendly
--   2. Manufacturing year != calendar year for many markets (model year overlap)
--   3. int4range would require GiST index and adds complexity with no benefit for annual granularity
--   A GIN index on an int4range is an option for overlap queries but B-tree on two ints
--   outperforms it for the dominant "find versions for year X" query pattern.
CREATE TABLE vehicle_versions (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_id            UUID        NOT NULL REFERENCES vehicle_models  (id) ON DELETE RESTRICT,
    name                TEXT        NOT NULL,                           -- 'Golf 1.4 TSI Comfortline'
    engine_code         TEXT,                                           -- 'CAXA', 'EA888'
    engine_displacement INTEGER,                                        -- cc, e.g. 1400
    engine_cylinders    SMALLINT,
    engine_fuel         TEXT,                                           -- 'gasoline', 'diesel', 'flex', 'hybrid', 'electric'
    transmission        TEXT,                                           -- 'manual-5', 'auto-6', 'dct-7'
    drive_type          TEXT,                                           -- 'fwd', 'rwd', 'awd', '4wd'
    year_from           SMALLINT    NOT NULL,
    year_to             SMALLINT,                                       -- NULL = current production
    doors               SMALLINT,
    horse_power         SMALLINT,
    torque_nm           SMALLINT,
    kba_number          TEXT,                                           -- German type-approval code (useful for EU parts lookup)
    metadata            JSONB       NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_year_range CHECK (year_to IS NULL OR year_to >= year_from)
);

CREATE INDEX idx_vver_model          ON vehicle_versions (model_id);
CREATE INDEX idx_vver_year_from      ON vehicle_versions (year_from);
CREATE INDEX idx_vver_year_to        ON vehicle_versions (year_to);
-- Composite: primary compatibility lookup pattern
CREATE INDEX idx_vver_model_years    ON vehicle_versions (model_id, year_from, year_to);
CREATE INDEX idx_vver_engine_code    ON vehicle_versions (engine_code) WHERE engine_code IS NOT NULL;
```

---

### 1.4 Category Hierarchy

```sql
CREATE TABLE categories (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug            TEXT        NOT NULL UNIQUE,
    name            TEXT        NOT NULL,
    description     TEXT,
    icon_url        TEXT,
    sort_order      SMALLINT    NOT NULL DEFAULT 0,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subcategories (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id     UUID        NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    slug            TEXT        NOT NULL UNIQUE,
    name            TEXT        NOT NULL,
    description     TEXT,
    sort_order      SMALLINT    NOT NULL DEFAULT 0,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subcat_category ON subcategories (category_id);
```

---

### 1.5 Parts (Core Table)

```sql
-- Technical specs design:
--   Use JSONB (specs column) instead of EAV or fixed columns because:
--   1. Part specifications vary radically by category (brake pad friction coefficient
--      vs spark plug heat range vs oil filter bypass pressure — no common schema)
--   2. JSONB with GIN index allows key/value filter queries efficiently
--   3. Avoids ALTER TABLE for every new spec attribute, enabling zero-downtime spec additions
--   4. Structured spec templates can be enforced at application layer (JSON Schema validation)
--      without PostgreSQL CHECK constraints, keeping migrations lightweight

CREATE TABLE parts (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturer_id     UUID            NOT NULL REFERENCES manufacturers   (id) ON DELETE RESTRICT,
    subcategory_id      UUID            NOT NULL REFERENCES subcategories   (id) ON DELETE RESTRICT,

    -- Primary identifiers
    part_number         TEXT            NOT NULL,                   -- manufacturer part number
    oem_code            TEXT,                                       -- OEM reference (if aftermarket part)
    alt_codes           TEXT[]          NOT NULL DEFAULT '{}',      -- alternative part numbers (old codes, aliases)
    ean_code            TEXT,                                       -- EAN-13 barcode

    -- Content
    name                TEXT            NOT NULL,
    description         TEXT,
    short_description   TEXT,                                       -- max 255 chars for listing cards

    -- Technical specifications (category-specific)
    specs               JSONB           NOT NULL DEFAULT '{}',

    -- Physical attributes
    weight_grams        INTEGER,
    length_mm           NUMERIC(10,2),
    width_mm            NUMERIC(10,2),
    height_mm           NUMERIC(10,2),
    volume_cm3          NUMERIC(10,2),

    -- Lifecycle
    status              part_status     NOT NULL DEFAULT 'draft',
    introduced_at       DATE,
    discontinued_at     DATE,

    -- Search optimization: pre-built tsvector column updated by trigger
    -- Includes: part_number (weight A), name (weight B), description (weight C), alt_codes
    search_vector       TSVECTOR,

    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_part_manufacturer_number UNIQUE (manufacturer_id, part_number)
);

-- B-tree: exact lookups by part number (most common query)
CREATE INDEX idx_parts_part_number      ON parts USING btree (part_number);
-- Trigram: fuzzy / partial part number search ("WS14" matches "WS14-18")
CREATE INDEX idx_parts_pn_trgm          ON parts USING gin  (part_number gin_trgm_ops);
-- OEM code exact + trigram
CREATE INDEX idx_parts_oem_code         ON parts USING btree (oem_code) WHERE oem_code IS NOT NULL;
CREATE INDEX idx_parts_oem_trgm         ON parts USING gin  (oem_code gin_trgm_ops) WHERE oem_code IS NOT NULL;
-- Alt codes array: GIN for @> (contains) operator
CREATE INDEX idx_parts_alt_codes        ON parts USING gin  (alt_codes);
-- Full-text search (PostgreSQL FTS — covers offline/fallback when ES is unavailable)
CREATE INDEX idx_parts_search_vector    ON parts USING gin  (search_vector);
-- JSONB specs: GIN for key/value filtering (e.g. specs @> '{"heat_range": 7}')
CREATE INDEX idx_parts_specs            ON parts USING gin  (specs);
-- Status filter (most queries filter on active)
CREATE INDEX idx_parts_status           ON parts (status);
-- Manufacturer filter
CREATE INDEX idx_parts_manufacturer     ON parts (manufacturer_id);
-- Subcategory filter
CREATE INDEX idx_parts_subcategory      ON parts (subcategory_id);

-- Trigger: keep search_vector in sync
CREATE OR REPLACE FUNCTION parts_search_vector_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('portuguese', coalesce(NEW.part_number, '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.oem_code,     '')), 'A') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.name,         '')), 'B') ||
        setweight(to_tsvector('portuguese', coalesce(NEW.description,  '')), 'C') ||
        setweight(to_tsvector('portuguese', array_to_string(NEW.alt_codes, ' ')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_parts_search_vector
    BEFORE INSERT OR UPDATE ON parts
    FOR EACH ROW EXECUTE FUNCTION parts_search_vector_update();
```

---

### 1.6 Part Media

```sql
CREATE TABLE part_media (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id         UUID            NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
    media_type      media_type      NOT NULL,
    s3_key          TEXT            NOT NULL,               -- S3 object key (NOT full URL — computed at runtime)
    cdn_url         TEXT,                                   -- CloudFront URL cached after first access
    filename        TEXT            NOT NULL,
    mime_type       TEXT            NOT NULL,
    file_size_bytes BIGINT,
    width_px        INTEGER,                                -- images only
    height_px       INTEGER,                                -- images only
    duration_secs   INTEGER,                                -- videos only
    alt_text        TEXT,
    is_primary      BOOLEAN         NOT NULL DEFAULT FALSE, -- primary product image
    sort_order      SMALLINT        NOT NULL DEFAULT 0,
    metadata        JSONB           NOT NULL DEFAULT '{}',
    uploaded_by     UUID,                                   -- user_id (nullable: can be system import)
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_part         ON part_media (part_id);
CREATE INDEX idx_media_part_primary ON part_media (part_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_media_type         ON part_media (media_type);

-- Enforce at most one primary image per part
CREATE UNIQUE INDEX uq_media_primary_per_part
    ON part_media (part_id)
    WHERE is_primary = TRUE AND media_type = 'image';
```

---

### 1.7 Vehicle Compatibility

```sql
-- This table is the core value proposition: which parts fit which vehicles.
-- Positions allow a single part to appear multiple times for the same version
-- (e.g. brake pad: front-left, front-right as separate fitment notes).
-- Additional fitment notes are stored in notes (installation hints, tool requirements, etc.)

CREATE TABLE vehicle_compatibility (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id         UUID            NOT NULL REFERENCES parts            (id) ON DELETE CASCADE,
    version_id      UUID            NOT NULL REFERENCES vehicle_versions (id) ON DELETE CASCADE,
    position        position_label  NOT NULL DEFAULT 'all',
    quantity        SMALLINT        NOT NULL DEFAULT 1,     -- units required per fitment (e.g. 4 lug nuts)
    notes           TEXT,                                   -- installation notes, special requirements
    source          TEXT,                                   -- 'manual', 'tecdoc', 'oemdata', 'user_verified'
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (part_id, version_id, position)
);

CREATE INDEX idx_compat_part       ON vehicle_compatibility (part_id);
CREATE INDEX idx_compat_version    ON vehicle_compatibility (version_id);
-- Dominant query pattern: "all parts that fit version X"
CREATE INDEX idx_compat_version_part ON vehicle_compatibility (version_id, part_id);
```

---

### 1.8 Part Equivalences (Cross-Reference)

```sql
-- Models "same physical part, different manufacturer codes"
-- e.g. Bosch F5DPOR == NGK SILZKFR5D11 == Champion 9005
--
-- Design: directed edge (part_id → equivalent_part_id) + equiv_type.
-- Application layer always writes both directions (A→B and B→A) for
-- symmetrical equivalences, maintaining bidirectional traversal without
-- a recursive CTE. For large equivalence groups, a group_id column
-- (added in migration) can cluster all members of the same "part family".

CREATE TABLE part_equivalences (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id             UUID            NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
    equivalent_part_id  UUID            NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
    equiv_type          equiv_type      NOT NULL DEFAULT 'aftermarket',
    confidence          NUMERIC(3,2)    NOT NULL DEFAULT 1.00  -- 0.00–1.00, for ML-generated equivalences
        CHECK (confidence BETWEEN 0 AND 1),
    source              TEXT,           -- 'manual', 'tecdoc', 'ml_model', 'manufacturer_catalog'
    verified_by         UUID,           -- user_id who confirmed this equivalence
    verified_at         TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_equivalence UNIQUE (part_id, equivalent_part_id),
    CONSTRAINT chk_no_self_equivalence CHECK (part_id <> equivalent_part_id)
);

CREATE INDEX idx_equiv_part       ON part_equivalences (part_id);
CREATE INDEX idx_equiv_equivalent ON part_equivalences (equivalent_part_id);
CREATE INDEX idx_equiv_type       ON part_equivalences (equiv_type);
```

---

### 1.9 Part Substitutes

```sql
-- Captures replacement/supersession relationships.
-- "Part A replaces Part B" = A is the current part, B is the old/discontinued part.
-- Rationale: kept separate from equivalences because substitution implies
-- temporal ordering and lifecycle events, whereas equivalences are timeless.

CREATE TABLE part_substitutes (
    id                  UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id             UUID                NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
    substitute_part_id  UUID                NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
    sub_type            substitute_type     NOT NULL,
    effective_date      DATE,               -- when the substitution became effective
    notes               TEXT,
    source              TEXT,
    created_at          TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_substitute UNIQUE (part_id, substitute_part_id, sub_type),
    CONSTRAINT chk_no_self_sub CHECK (part_id <> substitute_part_id)
);

CREATE INDEX idx_sub_part       ON part_substitutes (part_id);
CREATE INDEX idx_sub_substitute ON part_substitutes (substitute_part_id);
```

---

### 1.10 Part Complements

```sql
-- Parts that are recommended to be replaced together.
-- e.g. Timing belt kit: belt + tensioner + water pump
-- Symmetric relationship — application layer writes both directions.

CREATE TABLE part_complements (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    part_id             UUID        NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
    complement_part_id  UUID        NOT NULL REFERENCES parts (id) ON DELETE CASCADE,
    reason              TEXT,       -- 'kit', 'wear_pair', 'service_interval', 'safety'
    priority            SMALLINT    NOT NULL DEFAULT 1,  -- 1=must, 2=recommended, 3=optional
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_complement UNIQUE (part_id, complement_part_id),
    CONSTRAINT chk_no_self_comp CHECK (part_id <> complement_part_id)
);

CREATE INDEX idx_comp_part        ON part_complements (part_id);
CREATE INDEX idx_comp_complement  ON part_complements (complement_part_id);
```

---

### 1.11 Users

```sql
CREATE TABLE users (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               TEXT        NOT NULL UNIQUE,
    email_verified_at   TIMESTAMPTZ,
    phone               TEXT,
    phone_verified_at   TIMESTAMPTZ,
    full_name           TEXT        NOT NULL,
    avatar_url          TEXT,
    role                user_role   NOT NULL DEFAULT 'consumer',
    -- Company context (for workshop / distributor)
    company_name        TEXT,
    tax_id              TEXT,                               -- CNPJ or CPF
    -- Security
    password_hash       TEXT,                               -- bcrypt; NULL if OAuth-only account
    totp_secret         TEXT,                               -- 2FA TOTP secret (encrypted at rest)
    totp_enabled        BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Session management
    last_login_at       TIMESTAMPTZ,
    failed_login_count  SMALLINT    NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    -- OAuth
    google_id           TEXT        UNIQUE,
    -- Preferences
    locale              CHAR(5)     NOT NULL DEFAULT 'pt-BR',
    timezone            TEXT        NOT NULL DEFAULT 'America/Sao_Paulo',
    preferences         JSONB       NOT NULL DEFAULT '{}',
    metadata            JSONB       NOT NULL DEFAULT '{}',
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email      ON users (email);
CREATE INDEX idx_users_role       ON users (role);
CREATE INDEX idx_users_tax_id     ON users (tax_id) WHERE tax_id IS NOT NULL;
CREATE INDEX idx_users_google_id  ON users (google_id) WHERE google_id IS NOT NULL;
```

---

### 1.12 Plans & Subscriptions

```sql
CREATE TABLE plans (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug                TEXT        NOT NULL UNIQUE,
    name                TEXT        NOT NULL,
    tier                plan_tier   NOT NULL,
    -- Limits
    monthly_searches    INTEGER,    -- NULL = unlimited
    api_calls_per_day   INTEGER,
    max_vehicles_saved  INTEGER,
    max_team_members    INTEGER,
    -- Pricing
    price_monthly_brl   NUMERIC(10,2),
    price_yearly_brl    NUMERIC(10,2),
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly  TEXT,
    -- Features (feature flags)
    features            JSONB       NOT NULL DEFAULT '{}',  -- {"bulk_export": true, "api_access": false}
    is_active           BOOLEAN     NOT NULL DEFAULT TRUE,
    sort_order          SMALLINT    NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    plan_id             UUID        NOT NULL REFERENCES plans (id) ON DELETE RESTRICT,
    status              sub_status  NOT NULL DEFAULT 'trial',
    -- Billing cycle
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end   TIMESTAMPTZ NOT NULL,
    trial_ends_at        TIMESTAMPTZ,
    canceled_at          TIMESTAMPTZ,
    -- Payment provider
    stripe_subscription_id  TEXT    UNIQUE,
    stripe_customer_id      TEXT,
    -- Usage counters (reset each billing period)
    searches_used       INTEGER     NOT NULL DEFAULT 0,
    api_calls_today     INTEGER     NOT NULL DEFAULT 0,
    api_calls_reset_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sub_user         ON subscriptions (user_id);
CREATE INDEX idx_sub_plan         ON subscriptions (plan_id);
CREATE INDEX idx_sub_status       ON subscriptions (status);
CREATE INDEX idx_sub_stripe       ON subscriptions (stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
-- Active subscription lookup (most common query)
CREATE INDEX idx_sub_user_active  ON subscriptions (user_id, status) WHERE status = 'active';
```

---

### 1.13 Audit Log

```sql
-- Append-only audit trail. No updates, no deletes from application.
-- Partitioned by month for performance (see note below).
--
-- Partitioning design:
--   RANGE partitioning on occurred_at by month.
--   At 1M events/day * 365 days = 365M rows/year, a single table with a BRIN index
--   would suffice, but partitioning enables fast DROP of old partitions for retention
--   policies without VACUUM overhead.

CREATE TABLE audit_log (
    id              BIGSERIAL,
    occurred_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    user_id         UUID,                                   -- NULL for system/anonymous events
    action          audit_action    NOT NULL,
    entity_type     TEXT            NOT NULL,               -- 'part', 'user', 'subscription', ...
    entity_id       UUID,
    ip_address      INET,
    user_agent      TEXT,
    before_state    JSONB,                                  -- NULL for INSERT / non-data actions
    after_state     JSONB,                                  -- NULL for DELETE
    metadata        JSONB           NOT NULL DEFAULT '{}',
    PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

-- Create initial partitions (script should generate these programmatically)
CREATE TABLE audit_log_2026_01 PARTITION OF audit_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_log_2026_02 PARTITION OF audit_log
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
-- (Continue monthly; automate partition creation via pg_cron or application scheduler)

CREATE INDEX idx_audit_user     ON audit_log (user_id)      WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_entity   ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_action   ON audit_log (action);
-- BRIN index: very efficient for time-series append-only data
CREATE INDEX idx_audit_time_brin ON audit_log USING BRIN (occurred_at);
```

---

### 1.14 Refresh Tokens (Auth)

```sql
CREATE TABLE refresh_tokens (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash      TEXT        NOT NULL UNIQUE,    -- SHA-256 of the actual token
    device_name     TEXT,                           -- 'Chrome on macOS', 'Android App'
    ip_address      INET,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rt_user     ON refresh_tokens (user_id);
CREATE INDEX idx_rt_hash     ON refresh_tokens (token_hash);
CREATE INDEX idx_rt_expires  ON refresh_tokens (expires_at) WHERE revoked_at IS NULL;
```

---

## 2. SYSTEM ARCHITECTURE

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           AUTOPART INTELLIGENCE                             │
└─────────────────────────────────────────────────────────────────────────────┘

  Browser / Mobile
  ┌──────────────┐    HTTPS     ┌─────────────────────────────────────────┐
  │  Next.js 14  │ ──────────▶ │           AWS CloudFront CDN            │
  │  (App Router)│             │   (static assets + API edge caching)    │
  └──────────────┘             └────────────────┬────────────────────────┘
                                                │
                                ┌───────────────▼─────────────────────────┐
                                │         AWS ALB / API Gateway           │
                                └───────────────┬─────────────────────────┘
                                                │
                         ┌──────────────────────▼──────────────────────┐
                         │              NestJS API (ECS Fargate)        │
                         │                                              │
                         │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
                         │  │  Auth    │  │  Parts   │  │  Search  │  │
                         │  │ Module   │  │  Module  │  │  Module  │  │
                         │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
                         │       │              │              │        │
                         │  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐  │
                         │  │Vehicles  │  │Compat.   │  │ Media    │  │
                         │  │ Module   │  │ Module   │  │ Module   │  │
                         │  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
                         └───────┼──────────────┼──────────────┼────────┘
                                 │              │              │
              ┌──────────────────┼──────────────┼──────────────┼──────────┐
              │                  │              │              │          │
   ┌──────────▼──┐   ┌───────────▼──┐  ┌───────▼───────┐  ┌───▼──────┐  │
   │ PostgreSQL  │   │Elasticsearch │  │    Redis      │  │ AWS S3   │  │
   │   (RDS)     │   │  (OpenSearch)│  │  (ElastiCache)│  │ (Media)  │  │
   │             │   │              │  │               │  │          │  │
   │  Primary    │   │  parts index │  │ • Query cache │  │ images/  │  │
   │  Replica    │   │  suggest idx │  │ • Session     │  │ pdfs/    │  │
   │             │   │              │  │ • Rate limit  │  │ manuals/ │  │
   └─────────────┘   └──────────────┘  └───────────────┘  └──────────┘  │
              │                                                           │
              └───────────────────────────────────────────────────────────┘
                                       │
                         ┌─────────────▼──────────────┐
                         │   Background Workers (SQS)  │
                         │  • ES sync after part save  │
                         │  • Thumbnail generation     │
                         │  • Audit log ingestion      │
                         │  • Email/notification send  │
                         └────────────────────────────┘
```

---

### 2.2 NestJS Module Design

```
src/
├── app.module.ts
├── modules/
│   ├── auth/               # JWT issuing, refresh, OAuth, 2FA
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/     # Passport: jwt.strategy, google.strategy
│   │   └── guards/         # JwtAuthGuard, RolesGuard, ThrottleGuard
│   │
│   ├── users/              # User CRUD, profile, preferences
│   │
│   ├── parts/              # Core parts CRUD + media upload
│   │   ├── parts.module.ts
│   │   ├── parts.controller.ts
│   │   ├── parts.service.ts
│   │   ├── media/
│   │   └── dto/            # CreatePartDto, UpdatePartDto, PartResponseDto
│   │
│   ├── vehicles/           # Brands / models / versions management
│   │
│   ├── compatibility/      # Part ↔ vehicle mapping operations
│   │   ├── compatibility.service.ts    # find_parts_for_vehicle(), find_vehicles_for_part()
│   │   └── compatibility.controller.ts
│   │
│   ├── equivalences/       # Cross-reference: equivalences + substitutes + complements
│   │
│   ├── search/             # Unified search gateway
│   │   ├── search.service.ts      # orchestrates ES + PG fallback
│   │   ├── suggest.service.ts     # autocomplete
│   │   └── facets.service.ts      # aggregation/faceted filters
│   │
│   ├── subscriptions/      # Plans, Stripe webhooks, usage metering
│   │
│   └── admin/              # Bulk import, catalog management, audit viewer
│
├── shared/
│   ├── database/           # TypeORM / Drizzle config, migrations
│   ├── elasticsearch/      # ES client, index management, sync service
│   ├── redis/              # Redis client, cache decorators
│   ├── storage/            # S3 client, presigned URL generation
│   ├── queue/              # SQS producer/consumer setup
│   └── interceptors/       # Logging, transform, audit interceptors
```

---

### 2.3 Search Architecture

#### Query Routing Decision Tree

```
Incoming search query
        │
        ▼
   Is Elasticsearch available?
   ├── NO  →  PostgreSQL FTS fallback (search_vector @@ tsquery)
   └── YES
        │
        ▼
   Query type?
   ├── Exact part number / OEM code
   │     → PostgreSQL B-tree (fastest, no ES needed)
   │       SELECT * FROM parts WHERE part_number = $1
   │         OR oem_code = $1
   │         OR $1 = ANY(alt_codes)
   │
   ├── Vehicle-based search (brand + model + year)
   │     → PostgreSQL JOIN query
   │       parts → vehicle_compatibility → vehicle_versions
   │       (filtered by year BETWEEN year_from AND year_to)
   │
   ├── Fuzzy / partial part number
   │     → PostgreSQL pg_trgm (sub-50ms for < 10M rows)
   │       SELECT * FROM parts WHERE part_number % $1 ORDER BY similarity(part_number, $1) DESC
   │
   └── Semantic / text search with facets
           → Elasticsearch
             (full-text + aggregations for faceted UI)
```

#### Why Two Systems?

| Capability | PostgreSQL | Elasticsearch |
|---|---|---|
| Exact part number lookup | Excellent (B-tree) | Overkill |
| Fuzzy part number (pg_trgm) | Good (< 10M rows) | Better at scale |
| Vehicle compatibility JOIN | Excellent | Not applicable |
| Full-text + facets + ranking | Adequate | Superior |
| Autocomplete / suggest | Poor | Excellent (edge_ngram) |
| Aggregations (count by brand) | Slow (seq scan) | Fast (doc_values) |
| Offline / no infra dependency | Always available | External dependency |

**Rule:** PostgreSQL handles all relational queries. Elasticsearch handles text search UX (suggest, facets, ranked results). Every ES query has a PostgreSQL fallback.

---

### 2.4 Caching Strategy (Redis)

| Cache Key Pattern | Content | TTL | Invalidation Trigger |
|---|---|---|---|
| `part:{id}` | Full part DTO (with media URLs) | 30 min | Part UPDATE |
| `compat:part:{id}` | List of compatible vehicle versions | 1 hour | Compatibility INSERT/DELETE |
| `compat:vehicle:{version_id}` | List of parts for a vehicle version | 1 hour | Compatibility INSERT/DELETE |
| `search:v:{hash}` | Vehicle-based search result set (IDs only) | 15 min | Compatibility changes |
| `suggest:{prefix}` | Autocomplete suggestions for prefix | 10 min | ES re-index |
| `equiv:{id}` | Equivalence group for a part | 1 hour | Equivalence INSERT/DELETE |
| `plan:limits:{user_id}` | User's current plan limits | 5 min | Subscription UPDATE |
| `rate:{user_id}:{endpoint}` | Request count for rate limiting | 1 min | TTL expiry (sliding window) |

**Session storage:** Redis sorted set with token hash as member, score = expiry timestamp.  
**Rate limiting:** Redis fixed window counter per user + endpoint. Upgrade path: sliding log with ZRANGEBYSCORE.

---

### 2.5 S3 Bucket Structure

```
autopart-intelligence-media/          ← private bucket, served via CloudFront with signed URLs
├── parts/
│   └── {part_id}/
│       ├── images/
│       │   ├── original/             ← original upload (max 20MB)
│       │   │   └── {uuid}.{ext}
│       │   ├── 800x600/              ← product card thumbnail (generated by worker)
│       │   └── 200x200/              ← list thumbnail
│       ├── pdfs/
│       │   └── {uuid}.pdf            ← technical data sheets
│       ├── manuals/
│       │   └── {uuid}.pdf
│       └── videos/
│           └── {uuid}.mp4
├── manufacturers/
│   └── {manufacturer_id}/
│       └── logos/
└── categories/
    └── {category_id}/
        └── icons/

autopart-intelligence-exports/        ← private, 7-day lifecycle policy
└── {user_id}/
    └── {export_job_id}.xlsx

autopart-intelligence-imports/        ← private, 1-day lifecycle policy (raw uploads)
└── {user_id}/
    └── {timestamp}-{filename}
```

**Presigned URL strategy:** Media URLs are NOT stored with the full S3 URL. The `s3_key` column stores only the object key. The API generates presigned CloudFront URLs at request time (cached in Redis for 25 minutes against a 30-minute CloudFront signature TTL).

---

### 2.6 Authentication: JWT + Refresh Token Strategy

```
POST /auth/login
  → Validate credentials
  → Issue:
      access_token  (JWT, RS256, 15 min TTL)     — stored in memory (JS variable)
      refresh_token (opaque 256-bit random hex)   — stored in HttpOnly Secure SameSite=Strict cookie

POST /auth/refresh  (called by Next.js middleware on 401)
  → Read refresh token from cookie
  → Lookup token_hash = SHA256(token) in refresh_tokens table
  → Validate: not revoked, not expired
  → Issue new access_token + rotate refresh_token (old revoked, new written)
  → Return new access_token in response body

POST /auth/logout
  → Revoke refresh token (set revoked_at = NOW())

JWT payload:
{
  "sub":   "user-uuid",
  "role":  "workshop",
  "plan":  "professional",
  "iat":   1716000000,
  "exp":   1716000900    // +15 min
}

RS256 key rotation: private key in AWS Secrets Manager, rotated every 90 days.
Public key exposed at /.well-known/jwks.json for external integrations.

2FA TOTP flow:
  1. Login with email/password → if totp_enabled=true → return 202 + temp_token (3 min TTL)
  2. POST /auth/totp/verify { code, temp_token }
  3. On success → issue access_token + refresh_token as above
```

---

## 3. ELASTICSEARCH SCHEMA

### 3.1 Parts Index Mapping

```json
PUT /autopart-parts
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "part_number_analyzer": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": ["lowercase", "trim"]
        },
        "part_number_ngram": {
          "type": "custom",
          "tokenizer": "keyword",
          "filter": ["lowercase", "trim", "edge_ngram_filter"]
        },
        "portuguese_text": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "portuguese_stop", "portuguese_stemmer", "asciifolding"]
        }
      },
      "filter": {
        "edge_ngram_filter": {
          "type": "edge_ngram",
          "min_gram": 2,
          "max_gram": 20
        },
        "portuguese_stop": {
          "type": "stop",
          "stopwords": "_portuguese_"
        },
        "portuguese_stemmer": {
          "type": "stemmer",
          "language": "portuguese"
        }
      }
    }
  },
  "mappings": {
    "properties": {

      "id": { "type": "keyword" },

      "part_number": {
        "type": "text",
        "analyzer": "part_number_analyzer",
        "fields": {
          "suggest": {
            "type": "text",
            "analyzer": "part_number_ngram"
          },
          "raw": { "type": "keyword" }
        }
      },

      "oem_code": {
        "type": "keyword",
        "fields": {
          "suggest": { "type": "text", "analyzer": "part_number_ngram" }
        }
      },

      "alt_codes": { "type": "keyword" },

      "name": {
        "type": "text",
        "analyzer": "portuguese_text",
        "fields": {
          "raw":     { "type": "keyword" },
          "suggest": { "type": "text", "analyzer": "part_number_ngram" }
        }
      },

      "description": {
        "type": "text",
        "analyzer": "portuguese_text"
      },

      "status": { "type": "keyword" },

      "manufacturer": {
        "type": "object",
        "properties": {
          "id":   { "type": "keyword" },
          "slug": { "type": "keyword" },
          "name": { "type": "keyword" }
        }
      },

      "category": {
        "type": "object",
        "properties": {
          "id":   { "type": "keyword" },
          "slug": { "type": "keyword" },
          "name": { "type": "keyword" }
        }
      },

      "subcategory": {
        "type": "object",
        "properties": {
          "id":   { "type": "keyword" },
          "slug": { "type": "keyword" },
          "name": { "type": "keyword" }
        }
      },

      "specs": {
        "type": "flattened"
      },

      "compatible_vehicle_ids": {
        "type": "keyword"
      },

      "primary_image_url": { "type": "keyword", "index": false },

      "updated_at": { "type": "date" }
    }
  }
}
```

### 3.2 Autocomplete / Suggest Index

```json
PUT /autopart-suggest
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "input":        { "type": "completion" },
      "type":         { "type": "keyword" },
      "payload_id":   { "type": "keyword" },
      "payload_text": { "type": "keyword", "index": false },
      "weight":       { "type": "integer" }
    }
  }
}
```

Populate with: part numbers, OEM codes, alt codes, part names, vehicle model names. Weight by popularity (search frequency from analytics).

---

### 3.3 Aggregation Design (Faceted Search)

```json
// Search with facets — example query
POST /autopart-parts/_search
{
  "query": {
    "bool": {
      "must": [
        { "multi_match": {
            "query": "filtro oleo",
            "fields": ["name^3", "description", "part_number^5"]
          }
        }
      ],
      "filter": [
        { "term":  { "status": "active" } },
        { "terms": { "manufacturer.slug": ["bosch", "mann"] } },
        { "terms": { "compatible_vehicle_ids": ["version-uuid-1"] } }
      ]
    }
  },
  "aggs": {
    "by_manufacturer": {
      "terms": { "field": "manufacturer.slug", "size": 20 }
    },
    "by_category": {
      "terms": { "field": "category.slug", "size": 20 }
    },
    "by_subcategory": {
      "terms": { "field": "subcategory.slug", "size": 30 }
    }
  },
  "size": 24,
  "from": 0,
  "_source": ["id", "part_number", "name", "manufacturer", "primary_image_url", "status"]
}
```

**compatible_vehicle_ids** field: denormalized array of all compatible `vehicle_version` IDs. Populated by the sync worker whenever `vehicle_compatibility` rows are inserted/deleted. This allows a single ES `terms` filter to apply vehicle compatibility without a JOIN, keeping search latency under 20ms.

---

## 4. KEY DECISIONS LOG

| # | Decision | Rationale | Trade-offs | Alternatives Rejected |
|---|---|---|---|---|
| 1 | **year_from / year_to as SMALLINT** on `vehicle_versions` | Annual granularity matches industry standard; B-tree range queries are faster than GiST on int4range for the dominant pattern `year BETWEEN year_from AND year_to` | Cannot model partial-year production runs | `daterange` (overkill, GiST required), single `year[]` array (no range semantics) |
| 2 | **JSONB for `parts.specs`** | Technical specs are radically category-specific (600+ spec types across categories); JSONB + GIN avoids EAV anti-pattern and schema lock-in | Cannot enforce spec schema at DB level; query syntax is less ergonomic | EAV table (poor performance, complex queries), fixed columns (requires migration per new spec attribute) |
| 3 | **Dual search: PostgreSQL + Elasticsearch** | PG handles relational queries (vehicle compat, exact code lookup) with zero added infrastructure; ES handles text search UX; PG is the fallback if ES is unavailable | Dual-write complexity; eventual consistency window of ~1 sec | ES-only (loses SQL JOIN power), PG-only (inadequate facets and relevance scoring at scale) |
| 4 | **Bidirectional writes for equivalences** | `(part_id, equivalent_part_id)` edges written in both directions by the application layer avoids recursive CTEs in read queries; read path is a simple `WHERE part_id = $1` | Double storage (2 rows per pair); application must enforce symmetry | Undirected graph table with canonical ordering (complex upsert logic), recursive CTE on directed graph (slower at depth > 1) |
| 5 | **Refresh token in HttpOnly cookie** | Prevents XSS token theft; SameSite=Strict prevents CSRF; opaque token + DB lookup enables instant revocation | Requires CORS configuration for cross-origin; cannot use in native apps (use secure storage instead) | localStorage (XSS-vulnerable), sessionStorage (lost on tab close), DB-free JWT refresh (no revocation) |
| 6 | **S3 key stored, not full URL** | CloudFront signed URL TTL and CDN distribution can change without a data migration; URL is a runtime concern, not a storage concern | Requires presigned URL generation on every API response (mitigated by Redis cache) | Store full URL (breaks on CDN migration, bucket rename, or signed URL policy changes) |
| 7 | **audit_log RANGE partitioned by month** | Append-only table grows unbounded; monthly partitions enable instant DROP for retention policies without VACUUM; BRIN index on time column is O(1) | Partition management overhead; queries crossing partition boundaries need pruning hints | Single unpartitioned table (VACUUM bottleneck at scale), TimescaleDB (external dependency) |
| 8 | **compatible_vehicle_ids denormalized in ES** | Eliminates the need for a JOIN in search; a `terms` filter on a `keyword` array is the most performant ES pattern for N:N filtering | Must be kept in sync via async worker (eventual consistency); increased index size | Nested objects in ES (slower nested queries), application-side filtering (requires fetching all results) |
| 9 | **RS256 JWT (asymmetric)** | Public key can be exposed at JWKS endpoint enabling third-party verification without sharing secrets; supports future federation | Key management complexity vs HS256 | HS256 (symmetric, cannot share public key), opaque JWT replacement (requires DB lookup on every request) |
| 10 | **`part_substitutes` separate from `part_equivalences`** | Substitution implies lifecycle ordering and effective dates; equivalence is timeless and symmetric. Different semantics should not be mixed in one table even if the data structure looks similar | Two tables to maintain instead of one | Single `part_relations` table with `relation_type` column (conflates semantics, complicates integrity constraints) |

---

*End of ARCHITECTURE.md — AutoPart Intelligence v1.0.0*
