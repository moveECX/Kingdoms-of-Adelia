--
-- PostgreSQL database dump
--

\restrict W8r90kS6qCLPAEs4QfXngZr86sHRK6i8TVvX8bD2bDHNFU7FWauEA3YbMNzdkGv

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id bigint NOT NULL,
    username character varying(24) NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    title text DEFAULT 'sir'::text NOT NULL,
    gold bigint DEFAULT 0 NOT NULL,
    mana integer DEFAULT 0 NOT NULL,
    rank_points integer DEFAULT 0 NOT NULL,
    alliance_id bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp with time zone
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.accounts ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: build_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.build_queue (
    id bigint NOT NULL,
    city_id bigint NOT NULL,
    slot_x smallint NOT NULL,
    slot_y smallint NOT NULL,
    building_key text NOT NULL,
    to_level smallint NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    resolve_at timestamp with time zone NOT NULL,
    ordinal smallint NOT NULL
);


--
-- Name: build_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.build_queue ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.build_queue_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id bigint NOT NULL,
    account_id bigint NOT NULL,
    name character varying(24) DEFAULT 'New City'::character varying NOT NULL,
    x integer NOT NULL,
    y integer NOT NULL,
    timber bigint DEFAULT 0 NOT NULL,
    timber_rate_h integer DEFAULT 0 NOT NULL,
    stone bigint DEFAULT 0 NOT NULL,
    stone_rate_h integer DEFAULT 0 NOT NULL,
    iron bigint DEFAULT 0 NOT NULL,
    iron_rate_h integer DEFAULT 0 NOT NULL,
    grain bigint DEFAULT 0 NOT NULL,
    grain_rate_h integer DEFAULT 0 NOT NULL,
    cap_timber bigint DEFAULT 5000 NOT NULL,
    cap_stone bigint DEFAULT 5000 NOT NULL,
    cap_iron bigint DEFAULT 5000 NOT NULL,
    cap_grain bigint DEFAULT 5000 NOT NULL,
    resources_as_of timestamp with time zone DEFAULT now() NOT NULL,
    construction_pct integer DEFAULT 100 NOT NULL,
    layout_dirty boolean DEFAULT true NOT NULL,
    protected_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.cities ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.cities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: city_buildings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_buildings (
    id bigint NOT NULL,
    city_id bigint NOT NULL,
    slot_x smallint NOT NULL,
    slot_y smallint NOT NULL,
    building_key text NOT NULL,
    level smallint DEFAULT 1 NOT NULL,
    adjacency_pct integer DEFAULT 0 NOT NULL,
    production_h integer DEFAULT 0 NOT NULL
);


--
-- Name: city_buildings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.city_buildings ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.city_buildings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: city_tiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_tiles (
    city_id bigint NOT NULL,
    slot_x smallint NOT NULL,
    slot_y smallint NOT NULL,
    node_type text NOT NULL
);


--
-- Name: kysely_migration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kysely_migration (
    name character varying(255) NOT NULL,
    "timestamp" character varying(255) NOT NULL
);


--
-- Name: kysely_migration_lock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kysely_migration_lock (
    id character varying(255) NOT NULL,
    is_locked integer DEFAULT 0 NOT NULL
);


--
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_username_key UNIQUE (username);


--
-- Name: build_queue build_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_queue
    ADD CONSTRAINT build_queue_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: cities cities_xy_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_xy_uniq UNIQUE (x, y);


--
-- Name: city_buildings city_buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_buildings
    ADD CONSTRAINT city_buildings_pkey PRIMARY KEY (id);


--
-- Name: city_buildings city_buildings_slot_uniq; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_buildings
    ADD CONSTRAINT city_buildings_slot_uniq UNIQUE (city_id, slot_x, slot_y);


--
-- Name: city_tiles city_tiles_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_tiles
    ADD CONSTRAINT city_tiles_pk PRIMARY KEY (city_id, slot_x, slot_y);


--
-- Name: kysely_migration_lock kysely_migration_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kysely_migration_lock
    ADD CONSTRAINT kysely_migration_lock_pkey PRIMARY KEY (id);


--
-- Name: kysely_migration kysely_migration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kysely_migration
    ADD CONSTRAINT kysely_migration_pkey PRIMARY KEY (name);


--
-- Name: build_queue_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX build_queue_due_idx ON public.build_queue USING btree (resolve_at);


--
-- Name: cities_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cities_account_idx ON public.cities USING btree (account_id);


--
-- Name: city_buildings_city_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX city_buildings_city_idx ON public.city_buildings USING btree (city_id);


--
-- Name: build_queue build_queue_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.build_queue
    ADD CONSTRAINT build_queue_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: cities cities_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- Name: city_buildings city_buildings_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_buildings
    ADD CONSTRAINT city_buildings_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: city_tiles city_tiles_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_tiles
    ADD CONSTRAINT city_tiles_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict W8r90kS6qCLPAEs4QfXngZr86sHRK6i8TVvX8bD2bDHNFU7FWauEA3YbMNzdkGv

