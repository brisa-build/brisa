import type { WebContext } from 'brisa';
import { compileWC } from 'brisa/compiler';

export default async function PlayGround({}, { state }: WebContext) {
  const code = state<string>('');

  async function onInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    try {
      const text = target.value;
      console.log({ text });
      const brisaTranspiled = compileWC(text);
      console.log({ brisaTranspiled });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <textarea onInput={onInput}></textarea>
    </div>
  );
}
