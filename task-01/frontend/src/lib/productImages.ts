import arabicaEspresso from "../assets/products/arabica-espresso.webp"
import blueberryMuffin from "../assets/products/blueberry-muffin.webp"
import cappuccino from "../assets/products/cappuccino.webp"
import chocolateCroissant from "../assets/products/chocolate-croissant.webp"
import coldBrewBottle from "../assets/products/cold-brew-bottle.webp"
import icedLatte from "../assets/products/iced-latte.webp"
import matchaLatte from "../assets/products/matcha-latte.webp"
import premiumCoffeeBeans from "../assets/products/premium-coffee-beans.webp"

/**
 * Numeric-ID fallback map (seed database default IDs).
 * Kept for backwards compatibility with existing orders.
 */
export const productImages: Record<number, string> = {
    96: premiumCoffeeBeans,
    97: arabicaEspresso,
    98: coldBrewBottle,
    99: matchaLatte,
    100: chocolateCroissant,
    101: blueberryMuffin,
    102: cappuccino,
    103: icedLatte,
}

/**
 * Keyword → image mapping. Each key is a lowercase substring that,
 * if found anywhere in the product name, maps to the given image.
 * More-specific keywords should come first in the list so the most
 * relevant match wins.
 */
const keywordImages: Array<[string, string]> = [
    ["cold brew", coldBrewBottle],
    ["matcha", matchaLatte],
    ["cappuccino", cappuccino],
    ["iced latte", icedLatte],
    ["latte", icedLatte],
    ["espresso", arabicaEspresso],
    ["arabica", arabicaEspresso],
    ["croissant", chocolateCroissant],
    ["chocolate", chocolateCroissant],
    ["muffin", blueberryMuffin],
    ["blueberry", blueberryMuffin],
    ["coffee beans", premiumCoffeeBeans],
    ["coffee", premiumCoffeeBeans],
    ["beans", premiumCoffeeBeans],
]

/**
 * Resolve a product image by name (keyword match) with numeric-ID fallback.
 * Returns undefined if no match is found, allowing callers to render
 * a placeholder instead.
 */
export function resolveProductImage(
    id: number,
    name: string,
): string | undefined {
    // 1. Try keyword match on name (case-insensitive).
    const normalizedName = name.toLowerCase()
    for (const [keyword, image] of keywordImages) {
        if (normalizedName.includes(keyword)) {
            return image
        }
    }

    // 2. Fall back to numeric-ID map.
    return productImages[id]
}