import { describe, it, expect } from "bun:test"
import { renderToString } from "../packages/bunrise"

describe('renderToString', () => {
  it('should render a simple JSX element', async () => {
    const element = <div>Hello World</div>
    const result = await renderToString(element)
    const expected = '<div>Hello World</div>'
    expect(result).toEqual(expected)
  })

  it('should render a complex JSX element', async () => {
    const Component = ({ name, title }: { name: string, title: string }) => (
      <div title={title}>
        <h1>Hello {name}</h1>
        <p>This is a paragraph</p>
      </div>
    )
    const element = <Component name="World" title="Test" />
    const result = await renderToString(element)
    const expected = '<div title="Test"><h1>Hello World</h1><p>This is a paragraph</p></div>'
    expect(result).toEqual(expected)
  })

  it('should work with async components', async () => {
    const AsyncComponent = async ({ title }: { title: string }) => (
      <div title={title}>
        <h1>Hello {await Promise.resolve('test')}</h1>
        <p>This is a paragraph</p>
      </div>
    )
    const element = <AsyncComponent title="Test" />
    const result = await renderToString(element)
    const expected = '<div title="Test"><h1>Hello test</h1><p>This is a paragraph</p></div>'
    expect(result).toEqual(expected)
  })
})
