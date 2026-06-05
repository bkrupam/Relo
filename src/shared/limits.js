/** Hard cap in the textarea (inclusive). Parse is blocked at this length. */
export const MAX_COMPOSER_CHARS = 500

/** Last index allowed for parse API calls (one below hard cap). */
export const MAX_PARSE_CHARS = MAX_COMPOSER_CHARS - 1

/** Max reminders returned from a single parse. */
export const MAX_PARSED_ITEMS = 10

/** Min token length for inline highlight regex (avoids 600+ chip splits). */
export const MIN_HIGHLIGHT_CHARS = 3

/** Skip regex highlighting above this length — render plain text. */
export const MAX_HIGHLIGHT_INPUT_CHARS = 320
