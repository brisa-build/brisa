import { render } from 'brisa/test';
import { describe, expect, it } from 'bun:test';
import Home from '.';

describe('Index', () => {
  it('should render Brisa Framework', async () => {
    const { container } = await render(<Home />);

    expect(container).toContainTextContent('Brisa Framework');
  });
});
