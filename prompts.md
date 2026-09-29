# PROMPTS.md - [HydroCrop Monitor]
**Student:** [ZHIKUN ZHU] · **Course:** MGMT 6110 · **Problem Set 1-4**

**User sentence:** A [vertical farm operations technician] opens this screen during shift handover to [monitor real-time pH and nutrient (EC) levels across 12 automated hydro bays, inspect and flag abnormal bays with technician notes, and complete the shift handover], and knows it worked when [the flagged bay status updates seamlessly and an automated handover summary report is generated for the incoming team].

**Live link:** <https://mgmt6110week02aaisbuildwithaistudio.vercel.app>

---

## Target User & Business Function Declaration
**User Type Selected**: Option B (Internal User)
**Target User Role**: Vertical Farm Operations Technician
**Business Function Augmented**: Shift Handover & Daily Facility Monitoring

---

## Prompt 1 - the master prompt
```
ROLE: You are a senior front-end developer building a React web application using clean component architecture.

GOAL: Build the front-end dashboard for "HydroCrop Monitor", a web tool for an internal vertical farm operations technician (Option B: Internal User) in the "Shift Handover & Daily Facility Monitoring" business function. 

USER SENTENCE:
A vertical farm operations technician opens this screen during shift handover to check pH and nutrient (EC) levels across 12 automated hydro bays and flag abnormal ones, and knows it worked when the flagged bay list updates and automated alerts are set for the incoming shift.

SCREENS & ARCHITECTURE:
Build the application with 3 clear, navigable screens/tabs without reloading the page:
1. Screen 1: "Shift Handover Overview" (Dashboard Screen)
   - Displays real-time status across 12 automated hydroponic bays.
   - Highlights key metrics per bay: Bay ID, Crop Type, pH Level, EC (Nutrient) Level, Temperature, and Health Status (Normal / Warning / Critical).
   - Includes quick filters (e.g., "All Bays", "Action Needed / Out of Range") and summary KPI cards at the top.

2. Screen 2: "Bay Inspection & Action Form" (Detail & Flagging Screen)
   - Allows technicians to select a specific bay to inspect detailed trend logs.
   - Features a functional "Flag for Inspection" form where technicians can select issue categories (e.g., pH Spike, Pump Failure, Nutrient Depletion), add technician notes, and set priority tags.
   - Clicking "Submit Flag" updates the bay status to "Flagged" across the entire application.

3. Screen 3: "Handover Summary & Logs" (Shift Completion Screen)
   - Generates an automated shift handover report summarizing all flagged bays, unresolved alerts, and technician logs created during the shift.
   - Features a "Confirm Shift Handover" button that locks the current shift log and creates an automated alert notification for the incoming shift team.

OUTPUT:
- A fully functional, responsive React app.
- IMPORTANT (One Data File Rule): Keep ALL mock data in ONE dedicated, separate data file (e.g., mockData.js) with at least 12 rows of detailed bay data, completely separated from the UI components.
- Mobile-first layout: Ensure every screen is clearly readable and touch-friendly on a smartphone screen at arm's length.
- When complete, list all created files and briefly explain what each file holds.

GUARDRAILS:
- Front-end UI and mock data ONLY.
- DO NOT call the Gemini API, Google Search API, or any LLM backend.
- DO NOT call outside services, fetch external URLs, or use real databases, authentication, or analytics.
- No real company names, logos, or trademarks. Use invented, generic names only.

CONTEXT:
Individual Problem Set 1 for MGMT 6110 Human-AI Collaboration at SMU. Built in Google AI Studio, deployed to Vercel, and tested on mobile screens during Week 3. I am not a programmer—if you make design or architectural choices I did not specify, list them concisely in one line rather than burying them in code.
```
**What came back:** A running app, 7 types of files, preview loaded. It also added three new sections including "Loading States & Empty States" , "Color-coded Status Badges" and "Search & Quick Filters" that I never asked for.

**What I changed next and why:** Added "optimize the color combination of the main interface" for the UI because the color combination is not appealing, and it didn't change anything else.

---

## Prompt 2 - optimize the layout of the main interface's buttons
```
When modify the layout of the UI, Google AIstudio directly adjusted my interface according to the standards of Shift Banner Action Cluster, Segmented Filter Control Bar and Bay Card Action Buttons.
Change nothing else.
```
**What came back:** Successfully executed. The buttons on screen 1 have been optimized, giving an overall harmonious appearance. One file touched.

**What I changed next and why:** Nothing. Completed the overall optimization.

---

## Prompt 3 - optimize the buttons on screen 3
```
Optimize the positions of the three buttons on screen 3: "Pending Handover Confirmation", "Print/Save PDF", and "Confirm Shift Handover". 
Change nothing else.
```
**What came back:** An internal error occurred., no file touched.

**What I changed next and why:** I once again asked Aistudio to only update the button arrangement in the "Handover Summary & Logs" section of the screen (placing "Pending Handover Confirmation", "Print/Save PDF", and "Confirm Shift Handover" in the same row and change nothing else.). Completed the overall optimization.

---

# Problem Set 2 — Put a Real Back End Behind It

## Step 1 — Identify unsupported claims

Before adding a back end, I reviewed the claims made by my Problem Set 1 product.

### Claim 1 — Live hydro-bay telemetry
The application presents pH, EC, water temperature, reservoir level and flow readings across 12 hydroponic bays as if they are live telemetry.

Current reality:
These values come from the existing mock dataset rather than a real farm IoT sensor system.

Decision:
Do not connect an unrelated public API and pretend it represents the hydro bays. Reframe these readings as prototype/simulated facility sensor data.

### Claim 2 — External operating environment
The current product does not provide any real external environmental context for the facility.

Decision:
Add real Singapore outdoor temperature and relative humidity data from data.gov.sg / NEA through my own back-end endpoint.

### Claim 3 — Automated handover broadcast
The interface states that alerts are broadcast or dispatched to the incoming team.

Current reality:
This is simulated in the front end and does not send a real external notification.

Decision:
Reframe this wording unless a real notification service is implemented later.

---
## Step 2 — Manual API verification before prompting

Before asking the AI agent to write any back-end code, I called the proposed public API manually in Bruno and inspected the real response structure.

### Test 1 — Air temperature

GET:
https://api-open.data.gov.sg/v2/real-time/api/air-temperature

Result:
Successful response.

Relevant structure:
- data.stations
- data.readings[0].timestamp
- data.readings[0].data
- readingUnit

Example verified station:
- Station ID: S111
- Station: Scotts Road
- Temperature: 31.2 °C
- Observed at: 2026-09-13T16:48:00+08:00

### Test 2 — Relative humidity

GET:
https://api-open.data.gov.sg/v2/real-time/api/relative-humidity

Result:
Successful response.

Example verified station:
- Station ID: S111
- Station: Scotts Road
- Relative humidity: 64.3%
- Observed at: 2026-09-13T16:53:00+08:00

### Decision
Both endpoints use the same station ID, so the back end can combine temperature and humidity from S111.

I will label these values as external Singapore environmental conditions rather than hydro-bay conditions.

I also noticed that the two readings can have different timestamps, so the product should not imply that both values were observed at exactly the same moment.

---

## Prompt 4 — First Problem Set 2 backend integration attempt
```
[ROLE:
You are a senior full-stack engineer extending my EXISTING React application,
"HydroCrop Monitor". This is an existing working product from Problem Set 1.
Do not rebuild it or replace its current architecture.

GOAL:
Add one real back-end data integration to the existing product.

The application currently contains prototype/mock hydro-bay sensor data for
12 hydroponic bays. Do NOT replace those pH, EC, water-temperature, reservoir,
flow, flagging, technician-note, or handover functions with public data.

Instead, add a clearly separate "Live External Conditions" section to Screen 1
using real Singapore environmental data from data.gov.sg / NEA.

The external conditions must never be described as hydro-bay sensor readings
or indoor farm conditions.

--------------------------------------------------
REAL DATA SOURCE — VERIFIED MANUALLY BEFORE THIS PROMPT
--------------------------------------------------

I manually tested both endpoints in Bruno and confirmed that they return
successful JSON responses without an API key.

Air temperature:
GET https://api-open.data.gov.sg/v2/real-time/api/air-temperature

Relative humidity:
GET https://api-open.data.gov.sg/v2/real-time/api/relative-humidity

Use station:
S111 — Scotts Road

Verified real response examples:

AIR TEMPERATURE:
{
  "code": 0,
  "data": {
    "readings": [
      {
        "timestamp": "2026-09-13T16:48:00+08:00",
        "data": [
          {
            "stationId": "S111",
            "value": 31.2
          }
        ]
      }
    ],
    "readingUnit": "deg C"
  },
  "errorMsg": ""
}

RELATIVE HUMIDITY:
{
  "code": 0,
  "data": {
    "readings": [
      {
        "timestamp": "2026-09-13T16:53:00+08:00",
        "data": [
          {
            "stationId": "S111",
            "value": 64.3
          }
        ]
      }
    ],
    "readingUnit": "percentage"
  },
  "errorMsg": ""
}

Important:
The timestamps from the two endpoints may differ.
Do not pretend that temperature and humidity were measured at exactly
the same time.

--------------------------------------------------
BACK-END REQUIREMENTS
--------------------------------------------------

Create:

1. /api/environment

This server-side endpoint must fetch BOTH data.gov.sg endpoints.

Find stationId "S111" in each response.

Return only the fields the front end needs, in clean JSON similar to:

{
  "stationId": "S111",
  "station": "Scotts Road",
  "temperature": 31.2,
  "temperatureUnit": "deg C",
  "temperatureObservedAt": "...",
  "humidity": 64.3,
  "humidityUnit": "percentage",
  "humidityObservedAt": "...",
  "source": "NEA / data.gov.sg"
}

Do not hard-code the temperature or humidity values.
They must come from the live upstream responses.

Check response.ok before attempting to parse/use the response.

If either upstream service returns a non-2xx response, return a useful
JSON error response rather than crashing.

If station S111 is absent from a successful response, treat that as an
empty-data state rather than inventing a value.

Use sensible Cache-Control headers because these readings do not need
to be fetched again on every browser request.

2. /api/health

Create a health endpoint that checks whether the environmental upstream
services are reachable.

This API does NOT require an API key.

Do not invent a credential or environment variable.

The health response should clearly report:
- service status
- credentialRequired: false
- temperature upstream status
- humidity upstream status
- checkedAt

It must return something useful when an upstream service is unavailable.

--------------------------------------------------
FRONT-END REQUIREMENTS
--------------------------------------------------

On Screen 1 only, add a compact section titled:

"Live External Conditions"

Display:
- Outdoor Temperature
- Relative Humidity
- Station: Scotts Road
- Last observation time(s)
- Source: NEA / data.gov.sg

The source attribution should be visible.

Clearly label these values as EXTERNAL Singapore environmental
conditions.

Do NOT describe them as:
- hydro-bay temperature
- farm sensor data
- indoor conditions
- telemetry from the 12 bays

The existing hydro-bay values remain prototype/mock facility data.

Use these four distinct user-facing states:

LOADING:
"Loading latest Singapore external conditions…"

EMPTY DATA:
"No recent external readings are available from this station."

UPSTREAM ERROR:
"External conditions are temporarily unavailable from data.gov.sg."

UNREACHABLE:
"The environmental data service cannot be reached right now. Facility
sensor monitoring is unaffected."

Do not replace these four states with one generic spinner or one generic
error message.

--------------------------------------------------
FILE / DEPLOYMENT REQUIREMENTS
--------------------------------------------------

The API functions must be placed in:

api/

at the PROJECT ROOT, as siblings of package.json.

Do NOT put the API functions inside src/.

Make sure the project remains compatible with Vercel deployment.

If package.json needs "type": "module" for the server functions, add it
only if appropriate for the existing project and explain the change.

Do not add unnecessary npm packages.

--------------------------------------------------
GUARDRAILS
--------------------------------------------------

Change nothing unrelated to this integration.

DO NOT:
- redesign the existing application
- change the overall colour palette
- fix mobile responsiveness yet
- change the Screen 3 button layout yet
- remove the existing 12 hydro bays
- change the existing flagging workflow
- change technician notes
- change the handover workflow
- add authentication
- add a database
- add a notification service
- call an LLM API
- invent an API key
- expose or create credentials
- rewrite working screens

This is one controlled back-end integration only.

--------------------------------------------------
BEFORE YOU FINISH
--------------------------------------------------

Check that:

1. /api/environment exists at the project root.
2. /api/health exists at the project root.
3. The front end calls my own /api/environment endpoint, NOT data.gov.sg
   directly from browser code.
4. Temperature and humidity are not hard-coded.
5. Station S111 is selected from the real response.
6. The four different UI states exist.
7. Existing hydro-bay interactions still work.
8. No unrelated UI changes were made.

When complete, tell me:

A. Exactly which files you created.
B. Exactly which existing files you modified.
C. What each change does.
D. Whether you encountered any assumption or limitation.
E. What I should test manually before deploying.

Do not make any additional changes after giving me that report.]
```
**What came back:**

Google AI Studio created:

- `api/environment.ts`
- `api/health.ts`
- `src/components/LiveExternalConditions.tsx`

It also modified:

- `vite.config.ts`
- `src/components/ShiftHandoverOverview.tsx`

The implementation connected the existing HydroCrop Monitor to the two verified
data.gov.sg / NEA endpoints for air temperature and relative humidity, selected
station S111 (Scotts Road), added `/api/environment` and `/api/health`, and added
a Live External Conditions section to Screen 1.

It also created local Vite middleware so the API routes could be exercised during
AI Studio/local preview.

**What I changed next and why:**

I did not proceed directly to deployment.

Although the architecture broadly matched the intended back-end design, I noticed
that Google AI Studio created TypeScript serverless files
`api/environment.ts` and `api/health.ts`.

The assignment's provided master-prompt structure specifically used
`api/[NAME].js` and `api/health.js`. I therefore decided to issue a more constrained
follow-up prompt rather than accepting the first implementation unchanged.

I also made the no-credential case explicit. The selected data.gov.sg / NEA
endpoints require no API key, so I did not want the generic credential instructions
in the assignment template to lead to an invented environment variable or a fake
`keyConfigured` value.

Action: issued a revised master prompt requiring `.js` serverless functions,
explicit no-credential handling, and no unrelated changes.

---

## Prompt 5 — Revised backend master prompt
```
ROLE: You are a senior full-stack developer working in my existing project. Do not
rewrite what is already there; add to it.

GOAL: My existing HydroCrop Monitor screen currently presents hydro-bay pH, EC,
water temperature, reservoir, flow and telemetry values using prototype/mock data.
Those values cannot truthfully be replaced by an unrelated public API, so leave
those existing hydro-bay values and workflows unchanged.

Instead, add one new, clearly separated claim to Screen 1: live external Singapore
environmental conditions. Use real outdoor air temperature and relative humidity
from data.gov.sg / NEA, fetched through serverless functions of my own.

The new data must always be labelled as EXTERNAL Singapore environmental conditions.
Never describe it as indoor farm conditions, hydro-bay sensor data, or telemetry
from the 12 hydroponic bays.

1) api/environment.js — calls BOTH of these real endpoints:

   https://api-open.data.gov.sg/v2/real-time/api/air-temperature

   https://api-open.data.gov.sg/v2/real-time/api/relative-humidity

   Use station ID S111, Scotts Road.

   Return only the fields my screen needs, and nothing else:
   - stationId
   - station name
   - temperature
   - temperature unit
   - temperature observation timestamp
   - relative humidity
   - humidity unit
   - humidity observation timestamp
   - source

   Do not hard-code the temperature or humidity values.
   The two observation timestamps may differ, so preserve them separately.

2) api/health.js — reports whether both upstream data.gov.sg endpoints answered,
including the HTTP status returned by each upstream.

   IMPORTANT CREDENTIAL ADAPTATION:
   This specific provider does NOT require an API key or credential.
   Therefore do not invent a credential, do not create a fake environment variable,
   and do not create a fake keyConfigured:true value.

   Instead, report:
   - credentialRequired: false
   - whether the air-temperature upstream answered
   - the HTTP status returned by the air-temperature upstream
   - whether the relative-humidity upstream answered
   - the HTTP status returned by the relative-humidity upstream
   - checkedAt

3) On Screen 1, add a compact section titled:

   "Live External Conditions"

   Display:
   - Outdoor Temperature
   - Relative Humidity
   - Station: Scotts Road (S111)
   - the observation time for temperature
   - the observation time for humidity
   - Source: NEA / data.gov.sg

   Decide what the user sees in each of these four cases. I want four different
   sentences, not one spinner:

   LOADING:
   "Loading latest Singapore external conditions…"

   EMPTY:
   "No recent external readings are available from this station."

   UPSTREAM REFUSED / NON-2XX:
   "External conditions are temporarily unavailable from data.gov.sg."

   UPSTREAM UNREACHABLE / NETWORK FAILURE:
   "The environmental data service cannot be reached right now. Facility sensor
   monitoring is unaffected."


OUTPUT: Both functions must be at api/ in the PROJECT ROOT, siblings of package.json,
never inside src/.

Create exactly:
- api/environment.js
- api/health.js

If an earlier version of this project contains api/environment.ts or api/health.ts
from a previous attempt, replace those with the required .js versions rather than
keeping duplicate implementations.

If this project has a server entry file, register the same two routes there too,
because that is the shape the preview can answer. If it has no server file, skip
that and tell me so rather than inventing one.

Make sure package.json contains:

"type": "module"

If it already contains this, leave it unchanged.

CREDENTIAL NOTE:
The provider selected for this project, data.gov.sg / NEA, requires no API key.
Therefore the template requirement to return 503 before fetch when a credential
is missing is NOT APPLICABLE to this integration. Do not invent a credential or
environment variable merely to satisfy that generic requirement.

AFTER each fetch, check response.ok before reading the body.

A refusal may have an empty or non-JSON body, so do not call .json() before checking
response.ok. On a non-2xx reply, return the upstream HTTP status and a one-line reason
in your own JSON rather than crashing with a generic 500.

If station S111 is absent from an otherwise successful response, return an explicit
empty-data result. Never invent a reading.

Cache the successful environmental response for 60 seconds with:

Cache-Control: public, s-maxage=60, stale-while-revalidate=120

The source changes frequently, so this short cache should preserve freshness while
avoiding unnecessary repeated upstream requests.

In the Live External Conditions section, visibly credit the source as:

"Source: NEA / data.gov.sg"


GUARDRAILS: Never write a credential into any file, comment or README. This provider
does not require one, so do not create one.

Never create a variable whose name starts with VITE_.

Never call data.gov.sg directly from browser code; every upstream call must happen
inside api/.

The browser may call only my own /api/environment endpoint.

Never print credentials or any part of credentials in a response or log.

No new npm packages.
No database.
No login.
No notification service.
No LLM API.

Leave every screen I already have working exactly as it is.

Do not:
- redesign the existing application
- change the overall colour palette
- fix mobile responsiveness in this prompt
- change the Screen 3 button layout in this prompt
- remove the existing 12 hydro bays
- replace the existing mock hydro-bay data with public weather data
- change bay inspection or flagging
- change technician notes
- change the handover workflow

This prompt is for ONE controlled real-back-end integration only.


CONTEXT: Deployed on Vercel from GitHub.

This selected provider requires NO credential and therefore there is no Vercel
environment variable for this API integration.

I manually called the real endpoints in Bruno immediately before this prompt.

A real response from the air-temperature endpoint included:

{
  "code": 0,
  "data": {
    "readings": [
      {
        "timestamp": "2026-09-13T16:48:00+08:00",
        "data": [
          {
            "stationId": "S109",
            "value": 32.2
          },
          {
            "stationId": "S111",
            "value": 31.2
          }
        ]
      }
    ],
    "readingType": "DBT 1M F",
    "readingUnit": "deg C"
  },
  "errorMsg": ""
}

A real response from the relative-humidity endpoint included:

{
  "code": 0,
  "data": {
    "readings": [
      {
        "timestamp": "2026-09-13T16:53:00+08:00",
        "data": [
          {
            "stationId": "S109",
            "value": 62.5
          },
          {
            "stationId": "S111",
            "value": 64.3
          }
        ]
      }
    ],
    "readingType": "RH 1M F",
    "readingUnit": "percentage"
  },
  "errorMsg": ""
}

The real responses also contain a stations array confirming:

{
  "id": "S111",
  "deviceId": "S111",
  "name": "Scotts Road",
  "location": {
    "latitude": 1.3106,
    "longitude": 103.8365
  }
}

Do not assume any response field that is not demonstrated above.

When finished, tell me:
1. Exactly which files you created.
2. Exactly which existing files you modified.
3. Whether a server entry file existed and, if so, what you changed there.
4. Whether package.json already contained "type": "module".
5. How /api/environment handles success, empty data, non-2xx upstream responses,
   and unreachable upstream services.
6. How /api/health reports both upstream HTTP statuses.
7. What I should manually verify before I deploy to Vercel.

Do not make any unrelated changes.]
```

**What came back:**
```
Google AI Studio revised the implementation to match the more constrained
master-prompt structure.

### Files created

- `api/environment.js`
- `api/health.js`
- `src/components/LiveExternalConditions.tsx`

The previous `api/environment.ts` and `api/health.ts` files from Prompt 4 were
removed rather than retained as duplicate implementations.

### Existing files modified

- `vite.config.ts`
- `src/components/ShiftHandoverOverview.tsx`

`package.json` was not modified because it already contained:

`"type": "module"`

No custom server entry file such as `server.js` or `server.ts` existed, so Google
AI Studio did not invent one.

### Backend behavior

`api/environment.js` calls both verified data.gov.sg / NEA endpoints:

- Air temperature
- Relative humidity

It selects station S111 (Scotts Road), keeps the temperature and humidity
observation timestamps separate, and returns only the fields required by the
front end.

It handles four relevant conditions:

1. Successful live data
2. Station S111 missing from an otherwise successful response
3. A non-2xx response from the upstream service
4. An unreachable upstream service

Successful environmental responses are cached using:

`Cache-Control: public, s-maxage=60, stale-while-revalidate=120`

`api/health.js` checks both upstream services independently and reports their HTTP
statuses. Because these providers require no credential, it returns:

`credentialRequired: false`

rather than inventing an API key or environment variable.

### Front-end behavior

Google AI Studio added a `Live External Conditions` card only to Screen 1.

It is explicitly labelled as external Singapore environmental data rather than
hydro-bay telemetry.

It displays:

- Outdoor Temperature
- Relative Humidity
- Scotts Road (S111)
- Separate observation timestamps
- Source: NEA / data.gov.sg

It also implements four different user-facing states for loading, empty data,
upstream refusal and upstream unreachability.

The existing 12 hydroponic bays, mock pH/EC telemetry, filters, inspection workflow,
technician notes and handover workflow were left unchanged.
```

**What I accepted / rejected / changed and why:**
```
I accepted this revised architecture provisionally.

I accepted:

- the `.js` serverless functions at the project-root `api/` folder;
- the use of my own `/api/environment` endpoint between the browser and data.gov.sg;
- the separate `/api/health` diagnostic endpoint;
- the explicit `credentialRequired: false` treatment;
- station S111 (Scotts Road), because I had already verified that station manually
  in both real API responses using Bruno;
- separate timestamps for temperature and humidity;
- the four distinct failure/loading states;
- the decision to keep the existing hydro-bay readings as prototype/mock facility
  data rather than pretending that public weather data represented indoor sensors.

I also accepted the existing local Vite middleware provisionally because it allows
the routes to be exercised during preview without inventing a separate server file.

However, I have NOT yet accepted the back end as proven to work in production.

Google AI Studio reporting that the code is complete, or the local preview working,
is not sufficient evidence that Vercel will execute the serverless functions
correctly.

My next verification step is therefore to push the revised code to GitHub and test
the deployed Vercel endpoints in this order:

1. `/api/health`
2. `/api/environment`
3. Screen 1 of the live product

I intentionally did not fix mobile responsiveness or the Screen 3 action-button
layout in this prompt. Those are separate front-end issues and will be addressed
only after the back end has been independently verified.
```

### Deployment verification

After pushing the revised implementation to GitHub and deploying through Vercel,
I tested the production health endpoint before opening the main application.

GET:
https://mgmt6110week02aaisbuildwithaistudio.vercel.app/api/health

Result:
HTTP 200

Returned:
- credentialRequired: false
- airTemperatureUpstreamAnswered: true
- airTemperatureUpstreamStatus: 200
- relativeHumidityUpstreamAnswered: true
- relativeHumidityUpstreamStatus: 200

This confirmed that both external data.gov.sg upstream services were reachable
from the deployed Vercel back end.


### Production environment endpoint verification

After confirming `/api/health`, I tested the deployed environmental endpoint:

GET:
https://mgmt6110week02aaisbuildwithaistudio.vercel.app/api/environment

Result:
HTTP 200

Returned live data:

- Station ID: S111
- Station: Scotts Road
- Temperature: 29.6 °C
- Relative humidity: 75.7%
- Temperature observation time: 2026-09-13T18:48:00+08:00
- Humidity observation time: 2026-09-13T18:48:00+08:00
- Source: NEA / data.gov.sg

This confirmed that the deployed Vercel serverless function was not returning
hard-coded values and was successfully retrieving live external environmental
data from the real upstream provider.

---

## Prompt 6 — Mobile responsiveness correction
```
ROLE:
You are a senior front-end developer working in my existing HydroCrop Monitor
project. Do not redesign or rebuild the application.

GOAL:
Fix ONLY the responsive/mobile layout of the existing application.

The desktop version is currently working and visually acceptable. Preserve its
current desktop appearance, information hierarchy, colors, components, data,
backend integration, and interactions.

The current problem is that the application was originally requested to be
mobile-first, but real small-screen inspection showed that the layout becomes
crowded, compressed and difficult to use.

Make all three existing screens properly usable on narrow mobile screens.

OUTPUT:
Update only the existing front-end layout/styling files required for responsive
behavior.

At mobile widths:

1. Prevent unintended horizontal page overflow.
2. Prevent text, badges, buttons and cards from overlapping.
3. Allow navigation and action groups to wrap or stack where necessary.
4. Stack multi-column KPI/card layouts into readable mobile layouts.
5. Keep buttons touch-friendly.
6. Keep forms usable without horizontal scrolling.
7. Allow long labels to wrap instead of being clipped.

For Screen 1:
- Preserve the existing Live External Conditions component.
- Temperature and Relative Humidity cards may stack vertically.
- Bay cards must remain readable.
- Filters and search controls may wrap or stack.

For Screen 2:
- Keep the existing inspection workflow unchanged.
- Make forms, selectors, logs and action areas fit mobile widths.

For Screen 3:
- Make the existing content responsive.
- Do NOT change the relative placement of Print / Save PDF and
  Confirm Shift Handover yet. That is a separate issue for a later prompt.

Verify the layout at approximately:
- 375px width
- 430px width
- desktop width

When finished, report:
1. Exactly which files you modified.
2. What responsive behavior you added.
3. What specifically changes at 375px and 430px.
4. Whether desktop behavior changed.
5. Anything you could not verify.

GUARDRAILS:
Do not:
- redesign the desktop application;
- change the color palette;
- change wording;
- change business logic;
- change mock hydro-bay data;
- change API code;
- change /api/environment;
- change /api/health;
- change Live External Conditions data logic;
- add or remove product features;
- change flagging behavior;
- change technician notes;
- change handover behavior;
- add packages;
- add a database;
- add authentication.

Do not use fixed desktop widths that cause horizontal overflow on phones.

Use the existing styling system and existing project dependencies.

CONTEXT:
This is my existing HydroCrop Monitor project from MGMT 6110 Problem Set 1,
now being extended for Problem Set 2.

The back-end integration has already been completed and independently verified
on the deployed Vercel application.

Both production endpoints are working:
- /api/health
- /api/environment

The Live External Conditions section on Screen 1 is already working and must
remain unchanged in functionality.

Real-device review showed that the current desktop interface does not adapt well
to smartphone-sized screens, despite the original Problem Set 1 prompt asking
for a mobile-first interface.

This prompt addresses ONLY that unresolved responsive-layout issue.
```

**What came back:**

Google AI Studio reported responsive-layout changes across all three existing
screens without changing the back-end integration or core workflows.

The main changes included:

- responsive root spacing and horizontal-overflow control;
- a mobile-adaptive header and wrapping navigation;
- 2-column KPI layouts on mobile;
- responsive Live External Conditions cards;
- more flexible hydro-bay cards;
- a 2-column telemetry layout on Screen 2;
- a horizontally scrollable 7-hour trend table;
- touch-friendly form controls and priority selectors;
- responsive Screen 3 logs and flagged-bay items;
- mobile stacking of the Screen 3 action group and confirmation modal.

Google AI Studio stated that desktop styling and workflows were preserved.


**What I accepted / rejected / changed and why:**

I manually inspected all three screens using Google AI Studio's Mobile preview
after Prompt 6.

Screen 1 passed the initial mobile visual check. Its main content stacked
appropriately and the primary actions remained usable.

Screen 3 also passed the initial mobile check. Its action buttons stacked
vertically, which I accepted as appropriate behavior for a narrow viewport.

Screen 2 only partly passed.

I found that the "Select Bay to Inspect (12 Bays Automated)" selector did not
provide access to all 12 bay buttons. At mobile width, BAY-04 was already clipped
and later bays could not be reached. I also observed this problem on desktop.

This showed that the AI Studio report that mobile responsiveness had been
completed was not sufficient evidence by itself.

I therefore rejected this part of the implementation and issued a narrow
follow-up correction rather than asking the agent to redesign the screen.

---

## Prompt 6A — Bay selector accessibility correction
```
Human verification of Prompt 6 found one remaining responsive/accessibility issue.

On Screen 2, the "Select Bay to Inspect (12 Bays Automated)" selector does not
allow the user to access all 12 bay buttons.

At approximately 375px mobile width, BAY-04 is already clipped and BAY-05 through
BAY-12 cannot be reached. I also observed the same accessibility problem on the
desktop version.

Fix ONLY this bay-selector component.

REQUIREMENTS:

1. Keep all 12 bay buttons in one horizontal selector row.

2. Make ONLY the bay-selector row horizontally scrollable so the user can reach
   BAY-01 through BAY-12 on both desktop and mobile.

3. The overall page must NOT gain horizontal scrolling.

4. On mobile, support normal touch/swipe horizontal scrolling.

5. On desktop, support normal mouse/trackpad horizontal scrolling.

6. Add a subtle visual cue such as:
   "Swipe / scroll to view all 12 bays"
   so users understand that more bays are available horizontally.

7. Keep the currently selected bay visually identifiable.

8. Do not shrink the bay buttons so much that their labels become difficult to read.

9. Verify that BAY-01 and BAY-12 can both be reached and selected.

GUARDRAILS:

Change ONLY the Screen 2 bay selector and any styling directly required for it.

Do NOT change:
- Screen 1
- Screen 3
- bottom navigation
- header
- API code
- Live External Conditions
- hydro-bay data
- inspection workflow
- flagging behavior
- desktop visual design outside this selector
- any other responsive behavior created in Prompt 6

Do not add packages.

When finished, tell me:
1. Which file(s) you changed.
2. How horizontal scrolling is implemented.
3. How mobile and desktop users discover that the selector is scrollable.
4. Whether you verified that BAY-12 can be reached and selected.
 ```
  
**What came back:**

Google AI Studio modified:

- `/src/components/BayInspectionActionForm.tsx`
- `/src/index.css`

The 12-bay selector was changed into a single horizontally scrollable row with
fixed-size bay buttons.

The selector now supports:
- touch/swipe scrolling on mobile;
- trackpad and mouse-wheel scrolling on desktop;
- dedicated left/right scroll buttons;
- a visible horizontal scrollbar;
- an explicit "Swipe / scroll to view all 12 bays" cue;
- automatic scrolling to keep the active bay visible.

The scrolling is isolated to the selector itself rather than the full page.

**What I accepted / rejected / changed and why:**

I manually inspected the revised selector in both Google AI Studio's mobile
preview and desktop preview.

I accepted the correction.

On mobile, the selector now clearly communicates that more bays are available,
and the horizontal scrollbar and navigation controls allow later bays to be
reached without creating page-level horizontal scrolling.

On desktop, the same selector provides access through to BAY-12 while preserving
the existing Screen 2 layout.

This resolved the accessibility issue discovered during human verification of
Prompt 6.

**Final verification:**

I manually scrolled to BAY-12 in the mobile selector, selected it successfully,
and confirmed that the inspection content updated to Bay 12. I therefore accepted
the correction as complete.

---

## Prompt 6B — Header text accessibility correction
 ```
Human verification at 375px and 430px found two remaining responsive text-accessibility issues.

1. In the top operational ticker, the text:
   "Zone 4 Automated Tier Arrays"
   is truncated with an ellipsis.

2. In the main product header, the subtitle:
   "Shift Handover & Facility Diagnostics • Devon Vance (Sr. Operations Tech)"
   is also truncated and cannot be fully read on narrow screens.

Fix ONLY these two text-accessibility issues.

REQUIREMENTS:

1. Do not use truncation or ellipsis for these two important labels on mobile.

2. At narrow widths:
   - allow "Zone 4 Automated Tier Arrays" to wrap naturally if needed;
   - allow the full product subtitle to wrap onto an additional line if needed.

3. Keep the header compact and readable.
   Do not create horizontal page scrolling.

4. Preserve the existing desktop layout and styling.

5. Do not change:
   - navigation
   - buttons
   - colors
   - logo
   - API code
   - Screen 1 content
   - Screen 2 selector
   - Screen 3
   - business logic
   - any wording

6. Verify at:
   - 375px
   - 430px
   - desktop width

The full text must remain readable at 375px and 430px.

When finished, tell me:
1. Which file(s) you changed.
2. Which responsive classes/styles were changed.
3. How the two labels behave at 375px and 430px.
4. Whether desktop layout changed.
 ```  

**What came back:**

Google AI Studio modified only:

- `/src/components/Header.tsx`

It removed truncation from two mobile header labels:

1. `Zone 4 Automated Tier Arrays`
2. `Shift Handover & Facility Diagnostics • Devon Vance (Sr. Operations Tech)`

The mobile-specific `truncate` / width clamp behavior was removed so both labels
can wrap naturally on narrow screens while desktop behavior remains unchanged.

**What I accepted / rejected / changed and why:**

Human verification at 375px and 430px showed that two important header labels
were still being truncated with ellipses. I therefore did not accept the mobile
responsive work as fully complete and issued a narrow correction focused only on
text accessibility.

I accepted this correction after independent verification on the deployed Vercel
application.

At both 375px and 430px:
- `Zone 4 Automated Tier Arrays` is fully readable;
- the complete product subtitle is visible without ellipsis;
- neither change creates page-level horizontal scrolling.

I also confirmed that the desktop layout remains unchanged.

This resolved the final text-accessibility issue discovered during responsive QA.

---

## Prompt 7 — Truthfulness wording correction
 ```
ROLE:
You are a senior product and front-end developer working in my existing
HydroCrop Monitor project.

Do not redesign or rebuild the application.

GOAL:
Correct ONLY the product wording that currently makes prototype/mock
hydro-bay data or front-end-only handover actions sound like real live telemetry
or a real external notification/broadcast system.

The application now contains one genuinely live external data integration:
"Live External Conditions" from data.gov.sg / NEA.

That live environmental section is truthful and must remain unchanged.

However, the original Problem Set 1 interface still contains wording that implies
the 12 hydroponic bays are connected to a real farm telemetry system and that
handover alerts are actually broadcast or dispatched to another team.

Those claims are not supported by a real farm IoT system or notification backend.

Change the wording so the interface accurately describes what the product
currently does.

OUTPUT:

Change ONLY user-facing wording required for truthfulness.

Use these replacements or equivalent wording with the same meaning:

1. Top operational status:

CURRENT:
"12 Bays Online & Telemetry Active"

CHANGE TO:
"12 Bays in Prototype Dataset"

2. Screen 1 Monitored Bays status:

CURRENT:
"100% Online"

CHANGE TO:
"12 / 12 Bays Available"

3. Screen 1 handover/alert status:

CURRENT:
"Alerts queue updated live"

CHANGE TO:
"Handover flag list updated in app"

4. Where the application describes pH / EC bay values as real live telemetry,
make it clear that these are prototype facility readings.

Do not add a warning to every bay card.
Use concise wording in an appropriate shared/header/context location rather than
making the interface visually noisy.

5. Screen 3 notification/broadcast wording:

Where the current interface uses wording such as:

"Automated Shift Handover Broadcast"
"Automated Dispatch Ready"
"Dispatched Alert Queue"
"broadcasts the automated alert dispatch"

replace it with truthful in-app handover language such as:

"Shift Handover Summary"
"Handover Summary Ready"
"Handover Action Queue"
"records the handover summary for the incoming shift"

The product may say that a handover has been prepared, recorded, confirmed,
locked, or included in the in-app handover workflow.

It must NOT claim that a real external message, notification, broadcast,
email, or dispatch was sent unless such a service actually exists.

6. Preserve the real-data wording for:

"Live External Conditions"
"External Singapore Environmental Conditions"
"Source: NEA / data.gov.sg"

These are connected to the real production backend and must not be relabelled
as mock data.

7. Do not change technician-entered notes, crop names, bay IDs, pH/EC values,
status calculations, or existing user actions.

GUARDRAILS:

Change wording only.

Do NOT:
- change layout;
- change responsive behavior;
- change colors;
- change components except where text strings must be edited;
- change /api/environment;
- change /api/health;
- change data.gov.sg integration;
- change mockData;
- change bay status logic;
- change filters;
- change inspection behavior;
- change flagging behavior;
- change handover state logic;
- add a notification service;
- add email;
- add a database;
- add authentication;
- add packages.

Do not create new functionality merely to justify the old wording.

If a claim is not supported by the current implementation, change the claim
instead of inventing a feature.

CONTEXT:

This is my existing HydroCrop Monitor project for MGMT 6110 Problem Set 2.

The original Problem Set 1 application used mock data for 12 hydroponic bays.

During Problem Set 2, I manually reviewed the claims made by the interface and
identified that the existing pH, EC, water-temperature, reservoir, flow, and
bay-status data are prototype/mock facility data.

I deliberately chose NOT to connect an unrelated public API and pretend that it
represented real hydroponic sensors.

I separately added and independently verified a real backend integration for
Singapore external temperature and relative humidity using data.gov.sg / NEA.

The production endpoints:

/api/health
/api/environment

have both been successfully verified on Vercel.

Therefore the product now contains two clearly different data categories:

1. Prototype/mock hydro-bay facility data.
2. Genuine live external Singapore environmental data.

The interface must make that distinction truthful and understandable.

The application also has an in-app handover workflow, but it has no external
notification or messaging backend. Therefore wording that says alerts were
"broadcast", "dispatched", or sent to another team must be replaced with
in-app handover language.

When finished, report:

1. Exactly which files you modified.
2. Every user-facing phrase you changed, showing BEFORE → AFTER.
3. Any wording you deliberately left unchanged and why.
4. Confirm that no functionality, API logic, layout, or responsive behavior changed.

Do not make any unrelated changes.
 ```

### What came back

The AI completed the truthfulness wording pass without changing the application’s functionality, API logic, layout, responsive behavior, or mock dataset.

It modified:
- `src/components/Header.tsx`
- `src/components/ShiftHandoverOverview.tsx`
- `src/components/BayInspectionActionForm.tsx`
- `src/components/HandoverSummaryLogs.tsx`
- `src/components/HandoverConfirmModal.tsx`
- `src/App.tsx`

The main changes were:

- “12 Bays Online & Telemetry Active” → “12 Bays in Prototype Dataset”
- “100% Online” → “12 / 12 Bays Available”
- “Alerts queue updated live” → “Handover flag list updated in app”
- Screen 1 now describes the bay values as “prototype facility” readings rather than implying that the pH/EC values are live telemetry.
- “Select Bay to Inspect (12 Bays Automated)” → “Select Bay to Inspect (12 Prototype Bays)”
- “Shift Trend Logs (Past 7 Hours of Dosing Telemetry)” → “Shift Trend Logs (Past 7 Hours of Prototype Dosing Readings)”
- Flagging a bay now says that the bay is added to the incoming shift handover list rather than claiming that an automated external alert was broadcast.
- Screen 3 wording around “broadcast,” “dispatch,” and external notification was changed to “handover summary,” “handover action queue,” and “records the handover summary.”
- The confirmation modal was similarly changed from an “Automated Shift Handover Broadcast” to a “Shift Handover Summary.”
- The genuine Live External Conditions section was deliberately left unchanged because it is backed by the real NEA / data.gov.sg API. It still clearly identifies itself as external Singapore environmental data and states that it is not indoor farm or hydro-bay telemetry.

The AI also reported that the existing mock data, technician notes, bay workflows, external API integration, responsive behavior, and layout were preserved. Compilation and lint checks completed successfully.

### What I accepted / rejected / changed and why

I accepted the wording changes after reviewing the updated interface.

The original prototype used language such as “telemetry active,” “100% online,” “updated live,” “broadcast,” and “dispatch,” even though the hydro-bay readings still came from the prototype dataset and the application had no external notification backend. Those phrases could therefore make claims that the product could not actually support.

I accepted the revised wording because it now distinguishes the prototype hydro-bay readings from the genuinely live external environmental data supplied through the NEA / data.gov.sg backend.

I deliberately did not ask the AI to connect an unrelated public API to the hydro-bay pH/EC readings merely to make them appear real. A public API would not truthfully represent sensor readings from these specific hydroponic bays. Instead, I kept the prototype dataset and changed the user-facing language so that its status is clear.

I also accepted the revised handover wording because the application can record, confirm, and lock an in-app handover summary, but it cannot truthfully claim that an external alert, notification, or broadcast was sent to the incoming team.

I deliberately kept the “Live External Conditions” wording unchanged because this section is actually supported by the real backend integration with NEA / data.gov.sg and is visibly separated from the prototype indoor bay readings.

I verified the revised wording visually across the application and confirmed that the existing bay workflows, responsive behavior, layout, and live external API integration were preserved.

Overall, I accepted the result because the revision improved the truthfulness of the product without inventing new capabilities or unnecessarily changing working functionality.

---

# Problem Set 4 — Adversarial Collaboration with Heuristic Evaluation

---

## Prompt 8 — Peer-feedback workflow integrity revision

After receiving the heuristic evaluations from my three groupmates, I compared their findings and prioritised the repeated and higher-severity workflow problems before making further changes.

The main issues I chose to address in this revision were:

- the abnormal-bay shortcut prioritised BAY-03 (Warning) instead of the more serious BAY-07 (Critical);
- the handover summary could claim that systems were verified or locked before the actual workflow was complete;
- the shift could be confirmed while checklist items or abnormal bays remained unresolved;
- controls could remain editable even after the handover appeared to be locked;
- resolving a handover flag could incorrectly change the underlying operational severity of a bay.

I deliberately kept this revision focused on workflow integrity rather than asking the AI to redesign the interface.

### Prompt

```text
I have completed a Nielsen heuristic evaluation of this prototype with three independent peer testers. Please make a focused revision based on the confirmed usability problems below.

IMPORTANT:
- Preserve the current visual design, layout, navigation structure, dataset, weather feature, Disqus integration, Microsoft Clarity integration, and privacy notice.
- Do NOT redesign the application.
- Do NOT remove existing working features.
- Make only the workflow and state-management changes described below.
- Keep the prototype stable and buildable.
- After making the changes, run the existing build/type checks and give me a concise summary of exactly what was changed.

1. PRIORITISE CRITICAL BAYS

Peer testers found that BAY-07 is Critical, but the main "Inspect Abnormal" shortcut directs the user to BAY-03, which is only Warning.

Change the abnormal-bay prioritisation logic so unresolved bays are always prioritised:

Critical → Warning → Normal.

If a Critical bay is unresolved, the primary CTA should clearly identify it, for example:

"Inspect Critical (BAY-07)"

The abnormal-bay CTA on the Handover Summary should follow the same rule.

When entering Bay Inspection through the primary abnormal/inspection workflow, prioritise the highest-severity unresolved bay rather than an arbitrary lower-severity bay.

Do not change the underlying sensor readings just to achieve this.

2. MAKE THE HANDOVER SUMMARY TRUTHFUL

Peer testers found that the checklist can show only 3 of 5 verified while the summary preview still says:

"Facility automated systems verified"

They also found that the preview can display:

"LOCKED & CONFIRMED BY OUTGOING TECHNICIAN"

before the user has actually completed the final Confirm & Lock action.

Fix this.

The preview must always reflect the actual application state.

Before final confirmation:
- clearly label the summary as Draft / Pending Confirmation;
- show the real checklist completion, such as "3 of 5 verified";
- never claim that all automated systems are verified unless all required checklist items are actually complete;
- never show LOCKED or CONFIRMED unless the final lock action has successfully occurred.

3. PREVENT ACCIDENTAL INCOMPLETE HANDOVER

The application currently allows a user to confirm a handover even when required checklist items remain incomplete and abnormal bays remain unresolved/unflagged.

Before allowing final confirmation, check:
- incomplete checklist items;
- unresolved/unflagged abnormal bays.

If anything remains outstanding, do NOT silently confirm.

Show a clear confirmation/warning dialog that states exactly what remains unresolved, for example:

"2 checklist items and 3 abnormal bays are still unresolved."

Allow the user to return and complete them.

If the prototype intentionally permits an override, the override must be explicit and require the user to acknowledge the outstanding items before proceeding. Never make incomplete confirmation look accidental.

4. MAKE LOCKING MEAN LOCKED

Once the final "Confirm & Lock Shift Log" action succeeds:
- the handover status must become Locked & Confirmed;
- checklist controls must no longer be editable;
- existing handover flags/actions must not be silently editable;
- activity/log entries associated with the locked handover must not be silently modified;
- controls that would change the locked handover should be disabled or clearly marked unavailable.

Do not leave the application in a state where the badge says "Locked & Confirmed" while the user can continue changing the handover.

If an unlock/reopen workflow already exists, make it explicit. Do not invent a complicated new workflow if one does not exist.

5. KEEP BAY SEVERITY SEPARATE FROM FLAG STATUS

A peer tester found that resolving a flag on BAY-07 changed the bay from Critical to Warning even though its sensor readings had not changed.

Fix this logic.

Bay severity must be determined by the underlying bay readings/conditions, not by whether a handover flag is active, resolved, or removed.

Resolving a flag means the handover action/flag has been addressed. It must NOT automatically reduce the operational severity of the bay unless the underlying sensor condition itself has changed.

6. VALIDATION

After implementing these changes, test at minimum:

A. The main abnormal CTA chooses BAY-07 when BAY-07 is Critical and unresolved.

B. With only 3/5 checklist items complete, the summary does NOT claim all systems are verified.

C. Before final confirmation, the preview does NOT say Locked & Confirmed.

D. Attempting to confirm with incomplete items produces a clear warning.

E. After a successful lock, the handover cannot still be silently edited.

F. Resolving BAY-07's flag does not change Critical to Warning unless its underlying readings change.

Do not change unrelated styling or features.

Finally, report:
1. files/components changed;
2. behaviour changed;
3. validation performed;
4. any limitation that still remains.
```

### What came back

Google AI Studio made a relatively large state-management revision across the existing prototype.

The reported implementation included:

- adding an explicit operational severity model (`Normal`, `Warning`, `Critical`) so bay severity could be separated from handover flag state;
- adding prioritisation logic that ranks unresolved abnormal bays `Critical → Warning → Normal`;
- changing the primary abnormal-bay CTA on the Shift Overview so that BAY-07 is surfaced as `Inspect Critical (BAY-07)`;
- applying the same prioritisation to the Handover Summary;
- defaulting the Bay Inspection workflow to the highest-severity unresolved bay;
- changing the pre-confirmation summary to `Draft / Pending Confirmation` rather than implying that the shift was already locked;
- reporting actual checklist completion rather than claiming that all systems had been verified;
- adding an incomplete-handover warning when checklist items or abnormal bays remain unresolved;
- requiring explicit acknowledgement before an incomplete handover can be overridden;
- disabling checklist changes, log creation, flag editing and flag resolution after the shift has been locked;
- adding an explicit reopen action rather than allowing silent post-lock editing;
- separating operational bay severity from flag status so that resolving a flag does not automatically downgrade a Critical bay.

The AI reported that it validated six specific cases:

1. BAY-07 was selected ahead of BAY-03 because Critical outranks Warning.
2. A partially completed checklist no longer produced a fully verified summary.
3. The pre-confirmation state displayed `Draft / Pending Confirmation` rather than `Locked & Confirmed`.
4. Outstanding checklist items and abnormal bays triggered the warning workflow.
5. Controls became read-only after locking.
6. Resolving BAY-07's flag preserved its Critical operational severity while the underlying readings remained abnormal.

It also reported zero TypeScript errors and a successful production build.

One limitation was explicitly reported: the prototype still did not have a shared remote backend database, so operational state could not be treated as durable cross-device persistence.

### What I accepted / rejected / changed and why

I accepted the main workflow changes, but I did not rely only on the AI's validation report. I manually reviewed the revised screens and tested the most important failure case identified by the peer reviewers.

On the Shift Overview, I confirmed that the primary action had changed to `Inspect Critical (BAY-07)`. Following that action opened BAY-07 on the Bay Inspection screen, where it remained visibly marked as Critical.

I also manually tested the handover workflow with all five verification checklist items incomplete and three abnormal bays still unflagged.

Instead of silently completing the handover, the application displayed an `Incomplete Handover Verification Warning`. The warning explicitly stated that `5 checklist items and 3 abnormal bays are still unresolved` and separately listed:

- BAY-07 — Critical;
- BAY-03 — Warning;
- BAY-10 — Warning.

The final override action was disabled until the user checked an acknowledgement confirming awareness of the unresolved items.

I accepted this implementation because it changed a potentially misleading high-consequence action into an explicit decision. The system no longer presents an incomplete shift handover as if it were fully verified.

I also accepted the separation between operational severity and flag status. A handover flag records an operational follow-up action, while Critical/Warning status represents the underlying condition of the bay. Resolving one should not automatically change the other.

I did not attempt to solve the persistence finding by adding a new backend during this revision. The peer finding was valid, but introducing a shared database would have been a much larger architectural change than the focused heuristic revision. I therefore treated true refresh/cross-device persistence as an acknowledged limitation rather than pretending it had been solved.

---

## Prompt 9 — Protect unsaved technician input and reject whitespace-only fields

After reviewing the first peer-feedback revision, I identified two additional peer findings that could still be addressed without redesigning the application.

One peer found that edited diagnostic notes could be silently lost when switching between bays. Another found that required text fields could be bypassed by entering only spaces.

I therefore made one final narrow revision focused on protecting technician input and improving validation.

### Prompt

```text
Please make one final SMALL and focused usability revision. Do not redesign anything and do not modify unrelated components.

Address only these two remaining peer findings:

1. Unsaved diagnostic notes when switching bays

A peer tester edited the Technician Diagnostic Notes for one bay, switched to another bay before submitting, then returned. The draft was silently lost and replaced by the original text.

Prevent silent data loss.

Preferred solution:
- preserve an unsaved draft separately for each bay during the current session; OR
- if preserving drafts would require a large architectural change, show a clear warning before switching away from a bay with modified unsaved fields.

The user must never lose edited diagnostic notes silently.

2. Required-field whitespace validation

A peer tester entered only spaces into required text fields such as "Assign Action to Incoming Team" and Technician Diagnostic Notes. The form accepted the whitespace.

For all required text inputs in the flag/handover form:
- trim whitespace before validation;
- whitespace-only input must be treated as empty;
- show a clear validation message;
- do not automatically generate diagnostic notes on behalf of the technician when the submitted input contains only whitespace.

IMPORTANT:
Do not change the current visual design.
Do not modify the newly implemented Critical-bay prioritisation, handover confirmation logic, locking behaviour, operational severity logic, weather panel, Disqus, Clarity, or privacy notice.

Run the type/build checks after the change.

Then report only:
1. what changed;
2. validation performed;
3. whether any limitation remains.
```

### What came back

Google AI Studio implemented two focused changes.

For unsaved diagnostic information, it added session-level draft state for individual bays. Edited technician diagnostic notes, the assigned incoming team and action specifications are now preserved when moving between bays or navigating between views during the current session.

The interface also received explicit draft feedback:

- a bay with unsaved modifications receives a draft indicator;
- the active bay can display an `Unsaved Draft` badge;
- the user has an explicit `Discard Draft` action;
- the corresponding draft is cleared after a successful flag submission or resolution.

For required-field validation, the AI added trimmed validation to the required text inputs. Whitespace-only values are now treated as empty rather than valid content.

This applies to fields including:

- `Assign Action to Incoming Team`;
- `Technician Diagnostic Notes & Observations`;
- the handover activity-log input.

The application now blocks whitespace-only submission and displays visible validation feedback. It also no longer generates diagnostic notes on behalf of the technician when the submitted value contains only whitespace.

The AI reported testing bay-switching draft retention by editing one bay, navigating to other bays and returning to the original bay. It reported that the edited draft remained intact.

It also tested spaces-only values in the required fields and reported that the submissions were rejected without inserting auto-generated notes.

The AI again reported zero TypeScript errors and a successful production build.

The remaining limitation reported by the AI was that these drafts are session-scoped. A full hard browser refresh still resets the in-memory draft state.

### What I accepted / rejected / changed and why

I accepted both changes because they directly addressed observed peer behavior without expanding the scope of the product.

The draft-preservation change addresses silent data loss. In this workflow, a technician may need to compare several abnormal bays before completing a handover note. Switching bays should not silently erase unfinished work. Session-level per-bay drafts are therefore a useful improvement even though they are not equivalent to durable backend persistence.

I also accepted the stricter whitespace validation. A required field containing only spaces does not contain meaningful operational information and should not satisfy the same validation rule as an actual technician entry.

I deliberately kept the solution session-scoped. The purpose of this revision was to fix the navigation-related data-loss problem discovered by the peer tester, not to introduce an entirely new storage architecture.

The persistence limitation therefore remains explicit: unsaved drafts can survive navigation between bays and screens during the current session, but a hard browser refresh can still reset them. More broadly, the prototype still does not provide true shared cross-device persistence for a production shift-handover environment.

After these two revision rounds, I stopped asking the AI for additional product changes and performed a final human review.

I confirmed that:

- BAY-07 remains visibly Critical and is prioritised by the main inspection action;
- the critical workflow opens BAY-07 rather than a lower-severity Warning bay;
- the Handover Summary remains pending before final confirmation;
- incomplete verification produces a detailed warning rather than silently locking the handover;
- unresolved checklist items and abnormal bays are clearly distinguished;
- an explicit acknowledgement is required before an incomplete handover can be overridden;
- operational severity remains separate from handover flag status;
- unsaved bay drafts are protected while navigating during the current session;
- whitespace-only required input is rejected.

I did not implement every lower-severity or cosmetic peer suggestion.

In particular, I retained the `Live External Conditions` feature. One peer felt that the weather panel occupied too much visual priority, while another specifically identified its freshness, source attribution, retry behavior and clear distinction from indoor farm telemetry as something that worked well. Because the feedback conflicted, I kept the useful functionality rather than removing it. Reducing its visual prominence remains a possible future refinement.

I also did not claim that the persistence problem was fully solved. The lack of shared persistent storage remains the most important unresolved technical limitation identified through the adversarial evaluation.
