import { css } from '../../styled-system/css';

export const base = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 'fit-content',
  flexDirection: 'column',
});

export const header = css({
  background: 'red.300',
  height: 'fit-content',
  padding: '2',
  width: 'full',
  fontWeight: 'bold',
  fontSize: '4xl',
  alignItems: 'center',
  justifyContent: 'center',
  display: 'flex',
});

export const baseCard = css({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 'fit-content',
  flexDirection: 'column',
  width: { base: '35vw', sm: '50vw' },
  background: 'red.100',
  margin: '10',
});

export const image = css({
  width: '10vw',
  height: '10vw',
  margin: '10',
});

export const content = css({
  width: '100%',
  padding: '5',
});
