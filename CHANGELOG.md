# Changelog

### 2024-07-23

**Improvements:**

- Pilot level distribution chart added

### 2024-03-30

**Improvements:**

- Nation & gender statistics added
- CIVL ID lookup improved (50% faster)

### 2024-02-16

**Improvements:**

- History page with statistics added
- PWCs should work again
- Days till comp start added to table

### 2023-12-02

**Improvements:**

- Recent queries now lists comps with no confirmed pilots.

### 2023-11-30

**Improvements (under the hood):**

- New method of finding the CIVL ID by name. It is no longer depending on the CIVL website and more reliable using a narrow down approach with the local db, fuzzysearch and algolia (as a last resort)
- PWC comps are working again
- Better tests

### 2023-11-19

**Improvements:**

- UI facelift
- New recent queries overview
- Directly link to a comp forecast like this: `https://wprs-forecast.org?comp=COMP_URL`

**Bugfixes**

- Teampilots are now recognized as "confirmed" on airtribune.
- Wrong WPRS calculation for the imaginary top 1xx confirmed pilots fixed.

### 2023-09-19

**Improvements:**

- Show an error when a user enters a comp in the past.

### 2023-06-28

**Improvements:**

- Recent queries select element added
- Link to comp added in forecast view

### 2023-06-04

**Improvements:**

- Added the actual number of max allowed pilots in a comp to the forecast details.

### 2023-06-01

**Improvements:**

- Added points for two or one valid task only to the points list.

### 2023-05-08

**Improvements:**

- Potential WPRS hard-caped to 150 pilots

### 2023-05-06

**Improvements:**

- Stats added
- UI changes (no input field in results view, ...)
- switched to tRPC
- Note added

### 2023-05-01

**Improvements:**

- WPRS list for each rank added

### 2023-04-24

**Improvements:**

- Potential WPRS for all registered pilots added
- Calculation time reduced by adding redis as cache layer

### 2023-04-23

**Bugfix:**

- Respect pilots with status "Free Entry" in swissleague comps

### 2023-04-22

**Improvements:**

- Clear button added for input field
- Link a comp via url like `https://wprs-forecast.stephanschoepe.de?comp=COMP_URL`

### 2023-03-22

**Improvements:**

- Automatic world ranking updating added

### 2023-03-22

**Improvements:**

- swissleague.ch added
- CIVL lookup refined

### 2023-03-21

**Fixed bugs:**

- WPRS calculation fixed

### 2023-03-20

**Improvements:**

- PWC added
