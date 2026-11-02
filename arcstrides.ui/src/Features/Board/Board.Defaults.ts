/**
 * Board.Defaults.ts
 *
 * The board the app opens when nobody has said which.
 *
 * There is no board picker yet, and the API has no way to list boards
 * (docs/api-gaps.md, #4), so one board ID stands in for the choice. It was a
 * string literal in App.tsx; the calendar needs it too — it is where the
 * "Add card" list starts — and two copies of an ID are two IDs.
 */

/** The seeded demo board — see tools/seed-dev-board.mjs. */
export const DEFAULT_BOARD_ID = '1cb0ce6e-6145-4fe7-833a-0b7c0545c449'
