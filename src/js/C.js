/*
 * Sets a React component's displayName equal to it's name.
 */

export default function (Klass) {
  if (!Klass || !Klass.name) {
    return Klass
  }

  Object.defineProperty(
    Klass,
    'className',
    { value: Klass.name }
  )

  return Klass
}