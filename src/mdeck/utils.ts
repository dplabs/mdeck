export function addClass(element: Element, className: string): void {
  element.className = getClasses(element).concat([className]).join(' ');
}

export function removeClass(element: Element, className: string): void {
  element.className = getClasses(element).filter((k) => k !== className).join(' ');
}

export function toggleClass(element: Element, className: string): void {
  const classes = getClasses(element);
  const index = classes.indexOf(className);
  if (index !== -1) classes.splice(index, 1);
  else classes.push(className);
  element.className = classes.join(' ');
}

export function getClasses(element: Element): string[] {
  return element.className.split(' ').filter((s) => s !== '');
}

export function hasClass(element: Element, className: string): boolean {
  return getClasses(element).includes(className);
}

export function getPrefixedProperty<T>(element: Record<string, T>, propertyName: string): T | undefined {
  const cap = propertyName[0].toUpperCase() + propertyName.slice(1);
  return element[propertyName] || (element as Record<string, T>)['moz' + cap] || (element as Record<string, T>)['webkit' + cap];
}
