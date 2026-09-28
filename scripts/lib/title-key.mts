// Loose title key shared by the importers and the title linker (scripts/link-titles.mts):
// the same game's title from different stores should give the same key.

/**
 * Loose title key: lower case, no marks or punctuation, and no store decorations: platform
 * names ("Xbox One & Xbox Series X|S", "for Nintendo Switch 2", "(Windows)"), edition names
 * ("Standard / Deluxe / Gold / Complete … Edition"), previews, launchers and "+ DLC" tails.
 */
export const titleKey = (s: string): string => s.toLowerCase()
  .replace(/[™®©]/g, "")
  .replace(/\s*[-–:]?\s*\(?(game preview|early access|launcher)\)?\s*$/g, "")
  .replace(/\s*\+\s*[^+]*\(dlc\)\s*$/g, "")
  .replace(/\bxbox( one)?( ?(&|and|y|\/) ?xbox)? series x ?\| ?s\b|\bxbox series x ?\| ?s\b|\bxbox one\b|\bxbox\b/g, " ")
  .replace(/\((windows|pc)\)|\bfor windows( 10)?\b|\bwindows edition\b/g, " ")
  .replace(/\b(nintendo switch( 2)?|switch( 2)?) edition\b|\b(for )?nintendo switch( 2)?\b/g, " ")
  .replace(/\b(standard|digital|deluxe|digital deluxe|complete|definitive|ultimate|gold|premium|special|collector'?s|launch|cross-gen|vault|anniversary|enhanced|remastered|goty|game of the year|holiday play) edition\b/g, " ")
  .normalize("NFKD").replace(/[̀-ͯ]/g, "")
  .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
