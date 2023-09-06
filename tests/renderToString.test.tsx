import { describe, it, expect } from "bun:test"
import { renderToString } from "../packages/bunrise"

describe('renderToString', () => {
  it('should render a simple JSX element', () => {
    const element = <div>Hello World</div>
    const result = renderToString(element)
    const expected = '<div>Hello World</div>'
    expect(result).toEqual(expected)
  })

  it('should render a complex JSX element', () => {
    const Component = ({ name, title }) => (
      <div title={title}>
        <h1>Hello {name}</h1>
        <p>This is a paragraph</p>
      </div>
    )
    const element = <Component name="World" title="Test" />
    const result = renderToString(element)
    const expected = '<div title="Test"><h1>Hello World</h1><p>This is a paragraph</p></div>'
    expect(result).toEqual(expected)
  })
})
