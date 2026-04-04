const BRANDFETCH_API_KEY = process.env.NEXT_PUBLIC_BRANDFETCH_API_KEY ?? ""

interface BrandfetchLogoFormat {
  src: string
  format: string
  width: number | null
  height: number | null
}

interface BrandfetchLogo {
  type: "icon" | "logo" | "symbol" | "other"
  theme: "dark" | "light" | null
  formats: BrandfetchLogoFormat[]
}

interface BrandfetchBrand {
  name: string
  domain: string
  logos: BrandfetchLogo[]
}

const cache = new Map<string, BrandfetchBrand>()

/**
 * Fetch full brand data from Brandfetch Brand API.
 */
async function fetchBrand(domain: string): Promise<BrandfetchBrand | null> {
  if (cache.has(domain)) {
    return cache.get(domain)!
  }

  try {
    const res = await fetch(
      `https://api.brandfetch.io/v2/brands/${encodeURIComponent(domain)}`,
      { headers: { Authorization: `Bearer ${BRANDFETCH_API_KEY}` } }
    )

    if (!res.ok) return null

    const data: BrandfetchBrand = await res.json()
    cache.set(domain, data)
    return data
  } catch {
    return null
  }
}

/** Pick best format: prefer SVG (vector, crisp at any size), then largest PNG/WebP. */
function pickBestFormat(formats: BrandfetchLogoFormat[]): string | null {
  const svg = formats.find((f) => f.format === "svg")
  if (svg) return svg.src

  // For raster, pick the largest available
  const raster = formats
    .filter((f) => f.format === "png" || f.format === "webp")
    .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))
  if (raster.length > 0) return raster[0].src

  return formats[0]?.src ?? null
}

/**
 * Get a specific logo from a brand.
 *
 * @param domain - Brand domain (e.g. "google.com", "figma.com")
 * @param type - Logo type: "icon", "logo", "symbol", or "other"
 * @param index - For "other" type, which sub-product logo (0-based index)
 * @param theme - Preferred theme
 */
export async function getBrandLogo(
  domain: string,
  type: "icon" | "logo" | "symbol" | "other" = "icon",
  index = 0,
  theme: "dark" | "light" = "dark"
): Promise<string | null> {
  const brand = await fetchBrand(domain)
  if (!brand) return null

  const matching = brand.logos.filter(
    (l) => l.type === type && (!l.theme || l.theme === theme)
  )

  const logo = matching[index]
  if (!logo) return null

  return pickBestFormat(logo.formats)
}

/**
 * Shortcut: get the primary icon for a brand.
 */
export async function getBrandIcon(domain: string): Promise<string | null> {
  return getBrandLogo(domain, "icon", 0, "dark")
}

/**
 * Shortcut: get a sub-product logo by index from a brand's "other" logos.
 * For Google: index 3 = Sheets, index 4 = Calendar, etc.
 */
export async function getBrandProductLogo(
  domain: string,
  productIndex: number
): Promise<string | null> {
  return getBrandLogo(domain, "other", productIndex, "dark")
}
