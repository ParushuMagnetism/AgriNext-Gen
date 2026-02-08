# AgriNext Gen DB ERD-Style Map (Human-Readable)

This map groups tables by domain and shows key relationships in plain language.

Legend:
- `1 -> N`: one-to-many
- `1 -> 1`: one-to-one
- `(FK)`: foreign key relation

## 1. Identity and Access

### Tables
- `profiles`: user profile and location data
- `user_roles`: app role per user
- `admin_users`: admin profile records
- `admin_scopes`: scoped visibility/permissions for admins

### Relationships
- `profiles.id` <-> auth user id (logical link)
- `profiles.id` `1 -> 1` `user_roles.user_id`
- `admin_users.user_id` -> auth user id
- `admin_users.id` `1 -> N` `admin_scopes.admin_user_id`

## 2. Farmer and Farm Domain

### Tables
- `farmlands`
- `crops`
- `crop_media`
- `crop_activity_logs`
- `soil_test_reports`
- `agent_data`

### Relationships
- `farmlands.farmer_id` -> `profiles.id` (logical)
- `crops.farmer_id` -> `profiles.id` (logical)
- `crops.land_id` (FK) -> `farmlands.id`
- `crop_media.crop_id` (FK) -> `crops.id`
- `crop_activity_logs.crop_id` (FK) -> `crops.id`
- `crop_activity_logs.media_id` (FK) -> `crop_media.id`
- `soil_test_reports.farmland_id` (FK) -> `farmlands.id`
- `agent_data.farmer_id` -> `profiles.id` (logical)

### Helpful View
- `farmland_soil_latest`: latest soil values per farmland

## 3. Agent Operations

### Tables
- `agent_farmer_assignments`
- `agent_tasks`
- `agent_visits`
- `agent_activity_logs`
- `agent_voice_notes`
- `ai_agent_logs`

### Relationships
- `agent_farmer_assignments.agent_id` -> `profiles.id` (logical)
- `agent_farmer_assignments.farmer_id` -> `profiles.id` (logical)
- `agent_tasks.agent_id` -> `profiles.id` (logical)
- `agent_tasks.farmer_id` -> `profiles.id` (logical)
- `agent_tasks.crop_id` (FK) -> `crops.id`
- `agent_visits.task_id` (FK) -> `agent_tasks.id`
- `agent_visits.agent_id` -> `profiles.id` (logical)
- `agent_visits.farmer_id` -> `profiles.id` (logical)
- `agent_voice_notes.agent_id` -> `profiles.id` (logical)

## 4. Marketplace and Buyer Domain

### Tables
- `buyers`
- `listings`
- `favorites`
- `market_orders`
- `listing_events`
- `listing_trace` and `trace_attachments` (traceability support)

### Relationships
- `buyers.user_id` -> auth user id
- `listings.farmer_id` -> `profiles.id` (logical)
- `listings.crop_id` (FK) -> `crops.id`
- `favorites.user_id` -> auth user id
- `favorites.listing_id` (FK) -> `listings.id`
- `market_orders.buyer_id` (FK) -> `buyers.id`
- `market_orders.crop_id` (FK) -> `crops.id`
- `market_orders.farmer_id` -> `profiles.id` (logical)

## 5. Logistics and Transport Domain

### Tables
- `transporters`
- `vehicles`
- `transport_requests`
- `trips`
- `transport_status_events`
- `transport_issues`
- `farm_pickups`
- `logistics_routes`

### Relationships
- `transporters.user_id` -> auth user id
- `vehicles.transporter_id` (FK) -> `transporters.id`
- `transport_requests.farmer_id` -> `profiles.id` (logical)
- `transport_requests.crop_id` (FK) -> `crops.id`
- `transport_requests.vehicle_id` (FK) -> `vehicles.id`
- `transport_requests.assigned_trip_id` (FK) -> `trips.id`
- `trips.transport_request_id` (FK, unique) -> `transport_requests.id` (`1 -> 1`)
- `transport_status_events.transport_request_id` (FK) -> `transport_requests.id`
- `transport_status_events.trip_id` (FK) -> `trips.id`
- `transport_issues.transport_request_id` (FK) -> `transport_requests.id`
- `transport_issues.trip_id` (FK) -> `trips.id`
- `farm_pickups.listing_id` (FK) -> `listings.id`
- `farm_pickups.route_id` (FK) -> `logistics_routes.id`

## 6. Pricing, Market Intelligence, and Advisory Domain

### Tables
- `market_prices`
- `market_prices_raw`
- `market_prices_agg`
- `price_forecasts`
- `district_neighbors`
- `farmer_segments`
- `trusted_sources`
- `web_documents`
- `agri_advisories`
- `schemes_catalog`

### Relationships
- `web_documents.source_id` (FK) -> `trusted_sources.id`
- `web_fetch_logs.source_id` (FK) -> `trusted_sources.id`
- `farmer_segments` keyed by district + crop segments
- `market_prices_agg` built from `market_prices`/`market_prices_raw`
- `price_forecasts` built from historical prices

## 7. AI, Voice, and Telemetry Domain

### Tables
- `ai_farmer_logs`
- `ai_agent_logs`
- `ai_transport_logs`
- `ai_market_logs`
- `ai_admin_logs`
- `ai_audio_cache`
- `voice_ops_logs`
- `voice_media`
- `web_cache`
- `weather_cache`
- `web_fetch_logs`

### Relationships
- `ai_admin_logs.admin_id` (FK) -> `admin_users.id`
- `ai_market_logs.buyer_id` (FK) -> `buyers.id`
- `ai_transport_logs.transporter_id` (FK) -> `transporters.id`
- `voice_media` files referenced by voice-note and TTS flows

## 8. Notification and Workflow Support

### Tables
- `notifications`
- `escalations`
- `pending_updates`
- `audit/ops-like logs` (via `*_logs` tables)

### Relationships
- `notifications.user_id` -> auth/profiles user id
- Operational logs connect logically to actor ids and module tables

## 9. Enum Model (Important State Machines)
- `app_role`: `farmer | buyer | agent | logistics | admin`
- `transport_status`: `requested | assigned | en_route | picked_up | delivered | cancelled`
- `agent_task_status`: `pending | in_progress | completed | approved | rejected`
- `crop_status`: `growing | one_week | ready | harvested`
- `price_trend`: `up | down | flat`

## 10. Practical ERD Reading Paths

### Farmer Journey
`profiles` -> `farmlands` -> `crops` -> `crop_media`/`crop_activity_logs` -> `listings` -> `market_orders` -> `transport_requests` -> `trips` -> `transport_status_events`

### Agent Journey
`profiles (agent)` -> `agent_farmer_assignments` -> `agent_tasks` -> `agent_visits` + `agent_voice_notes`

### Buyer Journey
`buyers` -> `favorites` + browse `listings` -> `market_orders`

### Data Intelligence Journey
`trusted_sources` -> `web_documents`/`market_prices_raw` -> `market_prices` -> `market_prices_agg` -> `price_forecasts`
