/**
 * Legal documents as structured blocks rather than a slab of HTML.
 *
 * The source .docx runs headings into body text and hides sub-lists inside
 * single paragraphs as "- a- b- c". Typing the structure means the renderer
 * decides how a nested list looks, once, instead of the markup deciding it
 * differently in twenty places.
 */

export interface ListItem {
  text: string;
  /** Nested dashes that were inlined in the source paragraph. */
  sub?: string[];
}

export type Block =
  /** Opening paragraph, set slightly larger. */
  | { t: 'lead'; text: string }
  /** Set apart — the reader is meant to notice it. */
  | { t: 'note'; text: string }
  | { t: 'h2'; text: string }
  | { t: 'h3'; text: string }
  /** Third level — the run-in headings inside the disclaimer sections. */
  | { t: 'h4'; text: string }
  | { t: 'p'; text: string }
  /** Footnotes and asides, set smaller and dimmer. */
  | { t: 'small'; text: string }
  | { t: 'address'; lines: string[] }
  | { t: 'ol'; items: ListItem[] }
  | { t: 'ul'; items: string[] };

export interface LegalDoc {
  title: string;
  blocks: Block[];
}
