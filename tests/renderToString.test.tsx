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
    const AsyncChild = async ({ name }: { name: string }) => (
      <h1>Hello {await Promise.resolve('test')} {name}</h1>
    )
    const AsyncComponent = async ({ title }: { title: string }) => (
      <div title={title}>
        <AsyncChild name="test" />
        <p>This is a paragraph</p>
      </div>
    )

    const result = await renderToString(<AsyncComponent title="Test" />)
    const expected = '<div title="Test"><h1>Hello test test</h1><p>This is a paragraph</p></div>'
    expect(result).toEqual(expected)
  })

  it('should be possible to access to the request object inside components', async () => {
    const Component = ({ name, title }: { name: string, title: string }, { request }: { request: Request }) => (
      <div title={title}>
        <h1>Hello {name}</h1>
        <p>The URL is: {request.url}</p>
      </div>
    )
    const element = <Component name="World" title="Test" />
    const context = { request: new Request('http://test.com/') }
    const result = await renderToString(element, context)
    const expected = '<div title="Test"><h1>Hello World</h1><p>The URL is: http://test.com/</p></div>'
    expect(result).toEqual(expected)
  })
})
