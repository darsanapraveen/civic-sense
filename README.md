# Civic Sense

Civic Sense is a static prototype for a citizen complaint triage app.

## What it does

- Collects complaints from people in a country or city
- Scores each complaint by the number of people affected, the severity of the issue, and the importance of the location
- Sorts the queue so critical issues like hospitals, transport hubs, and schools appear first
- Stores complaints in the browser with localStorage

## How to use

Open `index.html` in a browser.

## Priority logic

The score is based on:

- Number of people affected
- Importance of the place
- Severity of the complaint

Higher scores move issues to the top of the queue.
