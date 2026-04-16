export function getPrefixedProperty<T>(element: Record<string, T>, propertyName: string): T | undefined {
  const cap = propertyName[0].toUpperCase() + propertyName.slice(1);
  return element[propertyName] || (element as Record<string, T>)['moz' + cap] || (element as Record<string, T>)['webkit' + cap];
}
