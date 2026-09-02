export const marketingNavigationLinks = [
  { href: "/", label: "Home" },
  { href: "/brand", label: "Brand" },
] as const;

export function isMarketingNavigationLinkCurrent(
  pathname: string,
  href: (typeof marketingNavigationLinks)[number]["href"]
): boolean {
  return pathname === href;
}
